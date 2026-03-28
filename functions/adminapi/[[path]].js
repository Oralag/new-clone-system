// Cloudflare Pages Function — /adminapi/[[path]]
// Reads backend URL from wrapped token (erp_xxx), routes request to correct backend
// Trial users (no dedicated backend) get sandboxed empty responses

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'

// Paths that trial users MUST be able to call (auth / user info)
const TRIAL_PASSTHROUGH = [
  '/adminapi/login/account',
  '/adminapi/login/register',
  '/adminapi/auth/',
  '/adminapi/login/info',
  '/adminapi/setting/company',
]

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}

function jsonRes(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

// Decode wrapped token → { realToken, backend, account, trial }
function decodeToken(wrapped) {
  try {
    if (!wrapped || !wrapped.startsWith('erp_')) return null
    const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
    const payload = JSON.parse(json)
    return {
      realToken: payload.t || null,
      backend: payload.b || DEFAULT_BACKEND,
      account: payload.a || '',
      trial: !!payload.trial,  // explicit trial flag set during login
    }
  } catch {
    return null
  }
}

function isTrialPassthrough(pathname) {
  return TRIAL_PASSTHROUGH.some(p => pathname.startsWith(p))
}

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const wrappedToken = request.headers.get('token') || ''
  const decoded = decodeToken(wrappedToken)

  if (decoded?.trial && !isTrialPassthrough(url.pathname)) {
    return jsonRes({
      code: 0,
      show: 1,
      message: '体验版暂不支持该功能，请升级正式版后使用',
      data: [],
    })
  }

  const backend = decoded?.backend || DEFAULT_BACKEND
  const realToken = decoded?.realToken || (decoded ? null : wrappedToken)

  const targetUrl = backend + url.pathname + url.search
  const headers = new Headers(request.headers)
  headers.set('host', new URL(backend).host)
  if (realToken) headers.set('token', realToken)
  else headers.delete('token')
  headers.delete('origin')
  headers.delete('referer')
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ipcountry')
  headers.delete('cf-ray')
  headers.delete('cf-visitor')
  headers.delete('x-forwarded-for')
  headers.delete('x-forwarded-proto')

  try {
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    })

    const response = await fetch(proxyRequest)
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    })
  } catch {
    return new Response(JSON.stringify({ code: 0, show: 0, message: 'Proxy error', data: [] }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
