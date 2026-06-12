// /api/brand-goods — 公开商品列表（per-tenant）
// ?shop=mobile → 读取该租户的商品
// 无 shop 参数 → 读取主账号商品（向后兼容）

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'
const DEFAULT_ACCOUNT = '17747344571'
const DEFAULT_PASSWORD = 'Oral6421'

// Per-tenant token cache: { [account]: { token, expiry } }
const tokenCache = {}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60',
  }
}

function emptyResult() {
  return new Response(JSON.stringify({ code: 0, message: 'auth failed', data: { rows: [] } }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

async function getBackendToken(backend, account, password) {
  const cacheKey = `${backend}:${account}`
  const now = Date.now()
  if (tokenCache[cacheKey]?.expiry > now) return tokenCache[cacheKey].token

  try {
    const res = await fetch(`${backend}/adminapi/login/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    })
    const data = await res.json()
    if (data.code === 1 && data.data?.token) {
      // Unwrap erp_ token to get the real backend JWT
      let realToken = data.data.token
      if (realToken.startsWith('erp_')) {
        try {
          const p = JSON.parse(decodeURIComponent(escape(atob(realToken.slice(4)))))
          realToken = p.t
        } catch { /* use as-is */ }
      }
      tokenCache[cacheKey] = { token: realToken, expiry: now + 4 * 24 * 60 * 60 * 1000 }
      return realToken
    }
  } catch { /* fall through */ }
  return null
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const url = new URL(request.url)
  const shopCode = url.searchParams.get('shop')

  let backend = DEFAULT_BACKEND
  let account = DEFAULT_ACCOUNT
  let password = DEFAULT_PASSWORD

  // Look up tenant info from KV if shop code provided
  if (shopCode && env.USERS_KV) {
    const raw = await env.USERS_KV.get(`user:${shopCode}`)
    if (raw) {
      const user = JSON.parse(raw)
      backend = user.backend_url || DEFAULT_BACKEND
      account = shopCode
      password = user.password || ''
    }
  }

  if (!password) return emptyResult()

  const token = await getBackendToken(backend, account, password)
  if (!token) return emptyResult()

  try {
    const res = await fetch(
      `${backend}/adminapi/goods/ShopGoods/index?list_rows=200&can_sale=1&status=1&goods_type=1&page=1`,
      { headers: { token } }
    )
    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch {
    return new Response(JSON.stringify({ code: 0, message: 'fetch failed', data: { rows: [] } }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
