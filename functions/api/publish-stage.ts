// Cloudflare Pages Function — /api/publish-stage
// 服务端暂存待发布的 FlowResult bundle，用于跨设备/外部脚本注入到发布队列
// GET: 拉取并清空当前用户的暂存条目
// POST: 追加一条 bundle 到暂存

interface Env {
  AGENT_MEMORY: KVNamespace
}

const TTL = 7 * 24 * 3600
const KEY = (token: string) => `publish:staged:${token.slice(-16)}`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders })

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = request.headers.get('x-erp-token') || ''
  if (!token) return Response.json({ items: [] }, { headers: corsHeaders })
  const key = KEY(token)
  const items = (await env.AGENT_MEMORY.get(key, 'json')) as any[] || []
  if (items.length) await env.AGENT_MEMORY.delete(key)
  return Response.json({ items }, { headers: corsHeaders })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = request.headers.get('x-erp-token') || ''
  if (!token) return Response.json({ ok: false, error: '未授权' }, { status: 401, headers: corsHeaders })
  const body = await request.json() as any
  const item = body?.item
  if (!item || typeof item !== 'object') {
    return Response.json({ ok: false, error: 'item 缺失' }, { status: 400, headers: corsHeaders })
  }
  const key = KEY(token)
  const existing = (await env.AGENT_MEMORY.get(key, 'json')) as any[] || []
  existing.push({
    ...item,
    createdAt: item.createdAt || Date.now(),
  })
  await env.AGENT_MEMORY.put(key, JSON.stringify(existing), { expirationTtl: TTL })
  return Response.json({ ok: true, total: existing.length }, { headers: corsHeaders })
}
