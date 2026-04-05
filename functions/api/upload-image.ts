// POST /api/upload-image
// body: { data: "data:image/jpeg;base64,..." }
// 存到 AGENT_MEMORY KV，返回 { url: "/api/image/{key}" }

interface Env {
  AGENT_MEMORY: KVNamespace
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
  }
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: cors() })

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const erpToken = request.headers.get('x-erp-token') || ''
  if (!erpToken) {
    return new Response(JSON.stringify({ code: 0, message: '未授权' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...cors() },
    })
  }

  const { data } = await request.json() as { data: string }
  if (!data?.startsWith('data:image/')) {
    return new Response(JSON.stringify({ code: 0, message: '无效图片' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...cors() },
    })
  }

  // base64 → ArrayBuffer
  const base64 = data.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  // 图片保留 30 天
  await env.AGENT_MEMORY.put(key, bytes.buffer, { expirationTtl: 60 * 60 * 24 * 30 })

  return new Response(JSON.stringify({ code: 1, url: `/api/image/${key}` }), {
    headers: { 'Content-Type': 'application/json', ...cors() },
  })
}
