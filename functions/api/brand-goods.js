// /api/brand-goods — 无需登录的公开商品列表接口
// 用固定账号登录 ERP 获取 token，缓存在内存中（Worker 实例存活期间）

const ERP_BACKEND = 'https://erp-server-xsji.onrender.com'
let cachedToken = ''
let tokenExpiry = 0

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60',
  }
}

async function getToken(env) {
  const now = Date.now()
  if (cachedToken && now < tokenExpiry) return cachedToken

  const account = env.ERP_ACCOUNT || '17747344571'
  const password = env.ERP_PASSWORD || 'Oral6421'

  try {
    const res = await fetch(`${ERP_BACKEND}/adminapi/login/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    })
    const json = await res.json()
    if (json.code === 1 && json.data?.token) {
      cachedToken = json.data.token
      tokenExpiry = now + 5 * 24 * 60 * 60 * 1000 // 缓存5天
      return cachedToken
    }
  } catch { /* fall through */ }
  return null
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const token = await getToken(env)
  if (!token) {
    return new Response(JSON.stringify({ code: 0, message: 'auth failed', data: { rows: [] } }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const res = await fetch(
      `${ERP_BACKEND}/adminapi/goods/ShopGoods/index?list_rows=200&can_sale=1&status=1&goods_type=1&page=1`,
      { headers: { token } }
    )
    const json = await res.json()
    return new Response(JSON.stringify(json), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch {
    return new Response(JSON.stringify({ code: 0, message: 'fetch failed', data: { rows: [] } }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
