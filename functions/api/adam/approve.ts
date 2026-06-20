// Cloudflare Pages Function — /api/adam/approve
// GET:  查看待审批操作
// POST: { decision: 'approve' | 'reject' } 批准或否决

interface Env {
  AGENT_MEMORY: KVNamespace
}

function tKey(token: string): string {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context
  const key = tKey(request.headers.get('x-erp-token') || '')
  const pending = await env.AGENT_MEMORY.get(`adam:pending_action:${key}`, 'json')
  return new Response(JSON.stringify({ pending }), { headers: CORS })
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const key = tKey(request.headers.get('x-erp-token') || '')

  const body = await request.json() as { decision: 'approve' | 'reject' }
  const pending = await env.AGENT_MEMORY.get(`adam:pending_action:${key}`, 'json') as Record<string, any> | null

  if (!pending || pending.status !== 'pending_approval') {
    return new Response(JSON.stringify({ error: '没有待审批的操作' }), { status: 400, headers: CORS })
  }

  const now = new Date().toISOString()
  const inboxKey = `adam:inbox:${key}`
  const inbox = ((await env.AGENT_MEMORY.get(inboxKey, 'json')) as any[] | null) || []

  if (body.decision === 'approve') {
    await env.AGENT_MEMORY.put(`adam:pending_action:${key}`, JSON.stringify({ ...pending, status: 'approved', approvedAt: now }))
    inbox.push({
      id: `approved_${Date.now()}`,
      content: `✅ 规则传递者批准了你的申请（${pending.type}，${pending.amount} ${pending.token || 'USDT'}）。现在可以执行了。`,
      timestamp: now,
      read: false,
      actionId: pending.id,
    })
  } else {
    await env.AGENT_MEMORY.put(`adam:pending_action:${key}`, JSON.stringify({ ...pending, status: 'rejected', rejectedAt: now }))
    inbox.push({
      id: `rejected_${Date.now()}`,
      content: `❌ 规则传递者否决了你的申请（${pending.type}，${pending.amount} ${pending.token || 'USDT'}）。`,
      timestamp: now,
      read: false,
    })
  }

  await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(inbox.slice(-20)), { expirationTtl: 7 * 24 * 3600 })
  return new Response(JSON.stringify({ ok: true, status: body.decision === 'approve' ? 'approved' : 'rejected' }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
