// Admin upload: video & cover images → Cloudflare KV

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, token',
}

function checkToken(token) {
  return typeof token === 'string' && token.length > 10
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost({ request, env }) {
  const token = request.headers.get('token') || ''
  if (!checkToken(token)) return Response.json({ code: 0, message: '登录已过期' }, { status: 401, headers: CORS })

  let formData
  try { formData = await request.formData() } catch {
    return Response.json({ code: 0, message: '请求格式错误' }, { status: 400, headers: CORS })
  }

  const file = formData.get('file')
  const type = formData.get('type') || 'video' // 'video' or 'cover'
  if (!file) return Response.json({ code: 0, message: '未收到文件' }, { status: 400, headers: CORS })

  const arrayBuffer = await file.arrayBuffer()
  const limitMB = type === 'video' ? 25 : 5
  if (arrayBuffer.byteLength > limitMB * 1024 * 1024) {
    return Response.json({ code: 0, message: `文件不能超过 ${limitMB}MB` }, { status: 400, headers: CORS })
  }

  const ext = (file.name || '').split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg')
  const folder = type === 'video' ? 'videos' : 'covers'
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const kvKey = `media_${folder}/${filename}`
  const contentType = file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg')

  await env.AGENT_MEMORY.put(kvKey, arrayBuffer, {
    metadata: { contentType },
    expirationTtl: 60 * 60 * 24 * 365 * 5,
  })

  const url = `https://nomaderp.pages.dev/media/${folder}/${filename}`
  return Response.json({ code: 1, data: { url } }, { headers: CORS })
}
