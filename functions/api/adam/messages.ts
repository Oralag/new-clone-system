// Cloudflare Pages Function — /api/adam/messages
// GET: 读取亚当的主动消息（前端每30秒 poll）
// DELETE: 清除已读消息

interface Env {
  AGENT_MEMORY: KVNamespace
}

interface AdamMessage {
  id: string
  content: string
  toolCalls?: Array<{ name: string; result: string }>
  timestamp: string
  read: boolean
}

function tokenKey(token: string): string {
  // 取 token 前16位做 KV namespace key
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context

  if (!env.AGENT_MEMORY) {
    return new Response(JSON.stringify({ messages: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const erpToken = request.headers.get('x-erp-token') || ''
  const key = `adam:inbox:${tokenKey(erpToken)}`

  try {
    const raw = await env.AGENT_MEMORY.get(key, 'json') as AdamMessage[] | null
    const all = raw || []
    const unread = all.filter(m => !m.read)

    // 标记为已读
    if (unread.length > 0) {
      const updated = all.map(m => ({ ...m, read: true }))
      await env.AGENT_MEMORY.put(key, JSON.stringify(updated), { expirationTtl: 60 * 60 * 24 * 7 })
    }

    return new Response(JSON.stringify({ messages: unread }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch {
    return new Response(JSON.stringify({ messages: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}
