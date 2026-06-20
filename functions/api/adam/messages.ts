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

  // ?peek=1 → 返回全部历史 inbox（含已读），不做任何标记
  const url = new URL(request.url)
  const peek = url.searchParams.get('peek') === '1'

  try {
    const raw = await env.AGENT_MEMORY.get(key, 'json') as AdamMessage[] | null
    const all = raw || []

    if (peek) {
      return new Response(JSON.stringify({ messages: all }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const unread = all.filter(m => !m.read)
    if (unread.length > 0) {
      // 标记已读
      const updated = all.map(m => ({ ...m, read: true }))
      await env.AGENT_MEMORY.put(key, JSON.stringify(updated), { expirationTtl: 60 * 60 * 24 * 7 })

      // 同步到 chat_history，两端都能看到
      const histKey = `adam:chat_history:${tokenKey(erpToken)}`
      try {
        const hist = (await env.AGENT_MEMORY.get(histKey, 'json') as any[] | null) || []
        const existingIds = new Set(hist.filter((m: any) => m.inbox_id).map((m: any) => m.inbox_id))
        const toAdd = unread.filter(m => !existingIds.has(m.id)).map(m => ({
          role: 'assistant',
          content: m.content,
          timestamp: m.timestamp,
          inbox_id: m.id,
        }))
        if (toAdd.length > 0) {
          const merged = [...hist, ...toAdd].slice(-100)
          await env.AGENT_MEMORY.put(histKey, JSON.stringify(merged), { expirationTtl: 90 * 24 * 60 * 60 })
        }
      } catch { /* 静默失败，不阻断主流程 */ }
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
