import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from './_lib/kv'

function now() { return new Date().toISOString() }
function nowMs() { return Date.now() }

function uid(req: VercelRequest): number | null {
  const t = (req.headers['x-user-id'] as string) || ''
  if (t) return parseInt(t)
  const tok = ((req.headers['token'] || '') as string)
  if (tok.startsWith('local_')) {
    try { const p = JSON.parse(Buffer.from(tok.slice(6), 'base64').toString()); return p.admin_id || p.id } catch { return null }
  }
  try {
    const parts = tok.split('.')
    if (parts.length === 3) {
      const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const pad = raw + '='.repeat((4 - raw.length % 4) % 4)
      const p = JSON.parse(Buffer.from(pad, 'base64').toString())
      return p.admin_id || p.user_id || p.id || null
    }
  } catch {}
  return null
}

function rjson(res: VercelResponse, data: unknown, code = 1, message = '') { res.json({ code, data, message }) }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,token,Authorization,x-user-id')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }

  const userId = uid(req)
  const path = ((req.query.path as string[]) || []).join('/')
  const q = (k: string) => ((req.query as Record<string, string>)[k])
  const body = req.body || {}

  if (path === 'groups') {
    if (req.method === 'GET') {
      const p = parseInt(q('page') || '1'), lr = parseInt(q('list_rows') || '50')
      const groups: any[] = (await kv.get('chat_groups')) || []
      const members: Record<string, any[]> = (await kv.get('chat_members')) || {}
      const msgs: Record<string, any[]> = (await kv.get('chat_messages')) || {}
      const unreadMap: Record<string, number> = userId ? ((await kv.get(`unread:${userId}`)) || {}) : {}
      const rows = groups.filter(g => (members[g.id] || []).some((m: any) => m.user_id === userId) || g.created_by === userId).slice((p - 1) * lr, p * lr)
        .map(g => { const last = (msgs[g.id] || []).slice(-1)[0] || {}; return { ...g, last_message: last.content || '', last_message_at: last.created_at || g.created_at, unread: unreadMap[g.id] || 0 } })
      rjson(res, { rows, total: rows.length, page: p, list_rows: lr }); return
    }
    if (req.method === 'POST') {
      if (!userId) { rjson(res, null, 0, '请先登录'); return }
      if (!body.name?.trim()) { rjson(res, null, 0, '请输入群名称'); return }
      const groups: any[] = (await kv.get('chat_groups')) || []
      const members: Record<string, any[]> = (await kv.get('chat_members')) || {}
      const newId = nowMs() + Math.floor(Math.random() * 1e4)
      const newGroup = { id: newId, name: body.name.trim(), created_by: userId, created_at: now() }
      groups.push(newGroup); members[newId] = [...new Set([userId, ...(body.member_ids || [])])].map((id: number) => ({ user_id: id }))
      await kv.set('chat_groups', groups); await kv.set('chat_members', members)
      rjson(res, { ...newGroup, unread: 0, last_message: '' }); return
    }
  }

  const idM = path.match(/^groups\/(\d+)$/)
  if (idM) {
    const id = parseInt(idM[1])
    const groups: any[] = (await kv.get('chat_groups')) || []
    const members: Record<string, any[]> = (await kv.get('chat_members')) || {}
    const g = groups.find(x => x.id === id)
    if (!g) { rjson(res, null, 0, '群不存在'); return }
    if (req.method === 'GET') { rjson(res, { ...g, members: (members[id] || []).map((m: any) => ({ user_id: m.user_id, name: m.name || `用户${m.user_id}`, position: m.position || '成员' })) }); return }
    if (req.method === 'PUT') {
      const idx = groups.findIndex(x => x.id === id)
      if (body.name) groups[idx].name = body.name.trim()
      groups[idx].updated_at = now(); await kv.set('chat_groups', groups); rjson(res, groups[idx]); return
    }
  }

  const msgM = path.match(/^groups\/(\d+)\/messages$/)
  if (msgM) {
    const gid = parseInt(msgM[1])
    const msgs: any[] = (await kv.get('chat_messages')) || []
    const groupMsgs = msgs.filter(m => m.group_id === gid)
    const rows = (q('before_id')) ? groupMsgs.filter(m => m.id < parseInt(q('before_id') || '0')).slice(-(parseInt(q('list_rows') || '50'))) : groupMsgs.slice(-(parseInt(q('list_rows') || '50')))
    if (userId) { const um: Record<string, number> = (await kv.get(`unread:${userId}`)) || {}; um[gid] = 0; await kv.set(`unread:${userId}`, um) }
    if (req.method === 'GET') { rjson(res, { rows, total: rows.length }); return }
    if (req.method === 'POST') {
      if (!userId) { rjson(res, null, 0, '请先登录'); return }
      if (!body.content?.trim()) { rjson(res, null, 0, '消息内容不能为空'); return }
      const msg = { id: nowMs() + Math.floor(Math.random() * 1e4), group_id: gid, sender_id: userId, sender_name: `用户${userId}`, content: body.content.trim(), type: body.type || 'text', created_at: now() }
      msgs.push(msg); if (msgs.length > 2000) msgs.splice(0, msgs.length - 2000); await kv.set('chat_messages', msgs)
      rjson(res, msg); return
    }
  }

  const clM = path.match(/^groups\/(\d+)\/cleanup$/)
  if (clM && req.method === 'POST') {
    const gid = parseInt(clM[1])
    const cutoff = nowMs() - parseInt(body.days || '180') * 86400000
    const msgs: any[] = (await kv.get('chat_messages')) || []
    await kv.set('chat_messages', msgs.filter(m => !(m.group_id === gid && new Date(m.created_at).getTime() < cutoff)))
    rjson(res, { success: true }); return
  }

  const memM = path.match(/^groups\/(\d+)\/members$/)
  if (memM) {
    const gid = parseInt(memM[1])
    const members: Record<string, any[]> = (await kv.get('chat_members')) || {}
    if (req.method === 'GET') { rjson(res, { rows: members[gid] || [], total: (members[gid] || []).length }); return }
    if (req.method === 'POST') {
      if (!members[gid]) members[gid] = []
      if (!members[gid].some((m: any) => m.user_id === body.user_id)) members[gid].push({ user_id: body.user_id })
      await kv.set('chat_members', members); rjson(res, { user_id: body.user_id }); return
    }
  }

  const quitM = path.match(/^groups\/(\d+)\/members\/(\d+)$/)
  if (quitM && req.method === 'DELETE') {
    const [gid, tuid] = [parseInt(quitM[1]), parseInt(quitM[2])]
    if (tuid !== userId) { rjson(res, null, 0, '无权操作'); return }
    const members: Record<string, any[]> = (await kv.get('chat_members')) || {}
    if (members[gid]) { members[gid] = members[gid].filter((m: any) => m.user_id !== userId); await kv.set('chat_members', members) }
    rjson(res, { success: true }); return
  }

  rjson(res, null, 0, '接口不存在')
}
