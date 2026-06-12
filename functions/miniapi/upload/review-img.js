async function verifyMiniToken(token, secret) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')
  const [headerB64, payloadB64, sigB64] = parts
  const data = `${headerB64}.${payloadB64}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  )
  const padded = sigB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(sigB64.length / 4) * 4, '=')
  const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0))
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
  if (!valid) throw new Error('Token invalid')
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payloadB64.length / 4) * 4, '=')))
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('Token expired')
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, mini-token',
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function onRequestPost({ request, env }) {
  const secret = env.MINI_JWT_SECRET
  if (!secret) return Response.json({ code: 0, message: '服务配置错误' }, { status: 500, headers: CORS_HEADERS })
  const token = request.headers.get('mini-token') || ''
  if (!token) {
    return Response.json({ code: 401, message: '未登录' }, { status: 401, headers: CORS_HEADERS })
  }
  try {
    await verifyMiniToken(token, secret)
  } catch {
    return Response.json({ code: 401, message: '登录已过期' }, { status: 401, headers: CORS_HEADERS })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ code: 0, message: '请求格式错误' }, { status: 400, headers: CORS_HEADERS })
  }

  const file = formData.get('file')
  if (!file) {
    return Response.json({ code: 0, message: '未收到图片' }, { status: 400, headers: CORS_HEADERS })
  }

  const arrayBuffer = await file.arrayBuffer()
  const kvKey = `review_img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  await env.AGENT_MEMORY.put(kvKey, arrayBuffer, { expirationTtl: 60 * 60 * 24 * 365 })

  const url = `https://nomaderp.pages.dev/api/image/${kvKey}`
  return Response.json({ code: 1, data: { url, key: kvKey } }, { headers: CORS_HEADERS })
}
