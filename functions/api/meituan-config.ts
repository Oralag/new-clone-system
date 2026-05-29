// Cloudflare Pages Function — /api/meituan-config
// 存取美团商家后台 Cookie 配置

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
  'Content-Type': 'application/json',
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { headers: CORS })

// GET /api/meituan-config — 读取当前配置状态
export const onRequestGet: PagesFunction<{ USERS_KV: KVNamespace }> = async ({ env }) => {
  const raw = await env.USERS_KV.get('meituan:config')
  if (!raw) {
    return new Response(JSON.stringify({ configured: false }), { headers: CORS })
  }
  const config = JSON.parse(raw)
  return new Response(JSON.stringify({
    configured: true,
    shopName: config.shopName || '',
    lastSync: config.lastSync || null,
    cookiePreview: config.cookie ? config.cookie.slice(0, 20) + '...' : '',
  }), { headers: CORS })
}

// POST /api/meituan-config — 保存配置
export const onRequestPost: PagesFunction<{ USERS_KV: KVNamespace }> = async ({ request, env }) => {
  const body = await request.json() as { cookie: string; shopName: string }

  if (!body.cookie || body.cookie.trim().length < 10) {
    return new Response(JSON.stringify({ ok: false, message: 'Cookie 不能为空' }), { headers: CORS })
  }

  const existing = await env.USERS_KV.get('meituan:config')
  const prev = existing ? JSON.parse(existing) : {}

  await env.USERS_KV.put('meituan:config', JSON.stringify({
    ...prev,
    cookie: body.cookie.trim(),
    shopName: body.shopName || '美团外卖店铺',
    updatedAt: new Date().toISOString(),
  }))

  return new Response(JSON.stringify({ ok: true, message: '配置已保存' }), { headers: CORS })
}
