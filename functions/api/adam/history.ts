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

function isCleanContent(content: unknown): boolean {
  const c = String(content ?? '').trim()
  return !!c && !/^(\s*undefined\s*)+$/i.test(c) && !/^undefined/i.test(c) && c.toLowerCase() !== 'null'
}

function sanitizeMessages(raw: any[]): any[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && isCleanContent(m.content))
    .map((m: any) => ({
      ...m,
      content: String(m.content),
      toolCalls: Array.isArray(m.toolCalls) ? m.toolCalls : undefined,
    }))
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
    const messages = sanitizeMessages(raw || []).slice(-MAX_MESSAGES)
    if (raw && messages.length !== raw.length) {
      await env.AGENT_MEMORY.put(key, JSON.stringify(messages), { expirationTtl: TTL })
    }
    return new Response(JSON.stringify({ messages }), { headers: CORS })
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
    const messages = sanitizeMessages(body.messages || []).slice(-MAX_MESSAGES)
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
