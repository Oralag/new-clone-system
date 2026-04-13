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

  // GET /api/meeting/recent
  if (path === 'recent' && req.method === 'GET') {
    const meetings: any[] = (await kv.get('meetings')) || []
    const nowMs = Date.now()
    meetings.sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    rjson(res, { rows: meetings.slice(0, 20), total: meetings.length }); return
  }

  // POST /api/meeting/schedule
  if (path === 'schedule' && req.method === 'POST') {
    if (!userId) { rjson(res, null, 0, '请先登录'); return }
    const { title, scheduled_at, duration_minutes = 60, participants = [], agenda } = req.body || {}
    if (!title?.trim()) { rjson(res, null, 0, '请输入会议名称'); return }
    if (!scheduled_at) { rjson(res, null, 0, '请选择开始时间'); return }
    const meetings: any[] = (await kv.get('meetings')) || []
    const newMeeting = { id: Date.now(), title: title.trim(), scheduled_at, duration_minutes, host_id: userId, host_name: `用户${userId}`, participants, agenda: agenda || '', status: 'scheduled', created_at: new Date().toISOString() }
    meetings.push(newMeeting); await kv.set('meetings', meetings)
    rjson(res, newMeeting); return
  }

  // POST /api/meeting/create
  if (path === 'create' && req.method === 'POST') {
    if (!userId) { rjson(res, null, 0, '请先登录'); return }
    const { title = '即时会议', participants = [] } = req.body || {}
    const meetings: any[] = (await kv.get('meetings')) || []
    const newMeeting = { id: Date.now(), title: title.trim(), scheduled_at: new Date().toISOString(), duration_minutes: 60, host_id: userId, host_name: `用户${userId}`, participants, status: 'active', created_at: new Date().toISOString() }
    meetings.push(newMeeting); await kv.set('meetings', meetings)
    rjson(res, newMeeting); return
  }

  rjson(res, null, 0, '接口不存在')
}
