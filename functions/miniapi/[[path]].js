// Cloudflare Pages Function — /miniapi/*
// Routes mini-program API requests to the correct tenant backend.
// Each tenant's QR code encodes their mobile as the shop code.
// Mini-program sends x-mini-shop header; we look up backend_url in KV.

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'

export async function onRequest(context) {
  const { request, env, params } = context

  const pathParts = params.path
  const path = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '')
  const url = new URL(request.url)

  // Determine backend: look up tenant by shop code
  let backend = DEFAULT_BACKEND
  const shopCode = request.headers.get('x-mini-shop')

  if (shopCode && env.USERS_KV) {
    const raw = await env.USERS_KV.get(`user:${shopCode}`)
    if (raw) {
      const user = JSON.parse(raw)
      if (user.backend_url) backend = user.backend_url
    }
  }

  const targetUrl = `${backend}/miniapi/${path}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  try {
    const resp = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    })
    return new Response(resp.body, {
      status: resp.status,
      headers: resp.headers,
    })
  } catch {
    return new Response(JSON.stringify({ code: 0, message: '商城服务暂时不可用，请稍后重试' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
