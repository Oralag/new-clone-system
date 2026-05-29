// /api/brand-profiles — 品牌档案云端同步（按用户隔离）
// GET: 读取当前用户的品牌档案列表
// POST: 保存品牌档案列表

interface Env {
  USERS_KV: KVNamespace
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const erpToken = request.headers.get('x-erp-token') || ''
  if (!erpToken) return json({ code: 0, message: '未授权' }, 401)

  const tokenKey = erpToken.slice(-16)
  const [profiles, activeId] = await Promise.all([
    env.USERS_KV.get(`brand:${tokenKey}:profiles`, 'json'),
    env.USERS_KV.get(`brand:${tokenKey}:active`),
  ])

  return json({ code: 1, data: { profiles: profiles ?? [], activeId: activeId ?? '' } })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const erpToken = request.headers.get('x-erp-token') || ''
  if (!erpToken) return json({ code: 0, message: '未授权' }, 401)

  const tokenKey = erpToken.slice(-16)
  const body = await request.json() as { profiles?: unknown[]; activeId?: string }

  await Promise.all([
    env.USERS_KV.put(`brand:${tokenKey}:profiles`, JSON.stringify(body.profiles ?? [])),
    env.USERS_KV.put(`brand:${tokenKey}:active`, body.activeId ?? ''),
  ])

  return json({ code: 1, message: 'ok' })
}
