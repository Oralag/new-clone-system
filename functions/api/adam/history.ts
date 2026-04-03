// Cloudflare Pages Function — /api/adam/history
// GET: 拉取对话历史（跨设备同步）
// POST: 保存对话历史

interface Env {
  AGENT_MEMORY: KVNamespace
}

const TTL = 90 * 24 * 60 * 60 // 90天
const MAX_MESSAGES = 100

function tokenKey(token: string): string {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context
  if (!env.AGENT_MEMORY) {
    return new Response(JSON.stringify({ messages: [] }), { headers: CORS })
  }
  const token = request.headers.get('x-erp-token') || ''
  const key = `adam:chat_history:${tokenKey(token)}`
  try {
    const raw = await env.AGENT_MEMORY.get(key, 'json') as any[] | null
    return new Response(JSON.stringify({ messages: raw || [] }), { headers: CORS })
  } catch {
    return new Response(JSON.stringify({ messages: [] }), { headers: CORS })
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  if (!env.AGENT_MEMORY) {
    return new Response(JSON.stringify({ ok: true }), { headers: CORS })
  }
  const token = request.headers.get('x-erp-token') || ''
  const key = `adam:chat_history:${tokenKey(token)}`
  try {
    const body = await request.json() as { messages: any[] }
    const messages = (body.messages || []).slice(-MAX_MESSAGES)
    await env.AGENT_MEMORY.put(key, JSON.stringify(messages), { expirationTtl: TTL })
    return new Response(JSON.stringify({ ok: true }), { headers: CORS })
  } catch {
    return new Response(JSON.stringify({ ok: false }), { headers: CORS })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}
