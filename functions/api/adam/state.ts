// Cloudflare Pages Function — /api/adam/state
// GET: 读取亚当核心状态
// POST: 保存亚当核心状态

interface Env {
  AGENT_MEMORY: KVNamespace
}

function tokenKey(token: string): string {
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
  if (!env.AGENT_MEMORY) {
    return new Response(JSON.stringify({ core: null }), { headers: CORS })
  }

  const token = request.headers.get('x-erp-token') || ''
  const key = `adam:core:${tokenKey(token)}`

  try {
    const raw = await env.AGENT_MEMORY.get(key, 'json')
    return new Response(JSON.stringify({ core: raw }), { headers: CORS })
  } catch {
    return new Response(JSON.stringify({ core: null }), { headers: CORS })
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  if (!env.AGENT_MEMORY) {
    return new Response(JSON.stringify({ ok: false, reason: 'no KV' }), { headers: CORS })
  }

  const token = request.headers.get('x-erp-token') || ''
  const tKey = token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
  const key = `adam:core:${tKey}`

  try {
    const body = await request.json() as { core: Record<string, any> }
    if (!body.core) {
      return new Response(JSON.stringify({ ok: false, reason: 'missing core' }), { headers: CORS })
    }
    // 永不过期（TTL 设为1年）
    await env.AGENT_MEMORY.put(key, JSON.stringify(body.core), { expirationTtl: 365 * 24 * 60 * 60 })

    // 如果 adam 已激活，把该用户加入 active_users 列表（供 Cron Worker 使用）
    const status = body.core.status
    if (status === 'alive' || status === 'survival') {
      const activeUsers = await env.AGENT_MEMORY.get('adam:active_users', 'json') as string[] | null || []
      if (!activeUsers.includes(tKey)) {
        activeUsers.push(tKey)
        await env.AGENT_MEMORY.put('adam:active_users', JSON.stringify(activeUsers), { expirationTtl: 365 * 24 * 60 * 60 })
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: CORS })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { headers: CORS })
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
