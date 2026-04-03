// /api/brand-config — 品牌页配置云端同步
// GET: 读取配置
// POST: 保存配置（需要 ERP token 验证身份）

const CONFIG_KEY = 'brand_page_config_v1'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

export async function onRequest(context) {
  const { request, env } = context
  const kv = env.USERS_KV

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method === 'GET') {
    const value = await kv.get(CONFIG_KEY)
    return json({ code: 1, data: value ? JSON.parse(value) : null })
  }

  if (request.method === 'POST') {
    // 验证 ERP token（简单验证：有 token header 且不为空）
    const erpToken = request.headers.get('x-erp-token') || ''
    if (!erpToken) {
      return json({ code: 0, message: '未授权' }, 401)
    }

    const body = await request.json()
    await kv.put(CONFIG_KEY, JSON.stringify(body))
    return json({ code: 1, message: 'ok' })
  }

  return json({ code: 0, message: 'method not allowed' }, 405)
}
