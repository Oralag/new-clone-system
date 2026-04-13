import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from './_lib/kv'

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

  // GET /api/mobile/operation-logs
  if (path === 'operation-logs' && req.method === 'GET') {
    const p = parseInt(q('page') || '1'), lr = parseInt(q('list_rows') || '30')
    const fromDate = q('from_date')
    const userFilter = q('user_id') ? parseInt(q('user_id')) : null
    let logs: any[] = (await kv.get('operation_logs')) || []
    if (userFilter) logs = logs.filter(l => l.user_id === userFilter)
    if (fromDate) logs = logs.filter(l => new Date(l.created_at).getTime() >= new Date(fromDate).getTime())
    logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const rows = logs.slice((p - 1) * lr, p * lr)
    rjson(res, { rows, total: logs.length, page: p, list_rows: lr }); return
  }

  // GET /api/mobile/notifications
  if (path === 'notifications' && req.method === 'GET') {
    const p = parseInt(q('page') || '1'), lr = parseInt(q('list_rows') || '20')
    const logs: any[] = (await kv.get('operation_logs')) || []
    const notifs: any[] = (await kv.get(`notifs:${userId}`)) || []
    const gen: any[] = []
    for (const log of logs.slice(0, 50)) {
      if (log.user_id === userId) continue
      gen.push({ id: log.id, type: 'chat', title: `${log.user_name || `用户${log.user_id}`} 在群里发消息`, text: (log.action_name || '').slice(0, 60), icon: 'chat', iconBg: '#eff6ff', read: false, route: `/mobile/chat/${log.detail?.group_id}`, created_at: log.created_at })
    }
    const rows = [...gen, ...notifs].slice((p - 1) * lr, p * lr)
    rjson(res, { rows, total: rows.length }); return
  }

  // GET /api/mobile/online-status
  if (path === 'online-status' && req.method === 'GET') {
    const logs: any[] = (await kv.get('operation_logs')) || []
    const cutoff = Date.now() - 30 * 60000
    const online = [...new Set(logs.filter(l => new Date(l.created_at).getTime() > cutoff).map(l => l.user_id))]
    rjson(res, online.map(id => ({ user_id: id }))); return
  }

  rjson(res, null, 0, '接口不存在')
}
