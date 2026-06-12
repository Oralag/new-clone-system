// Cloudflare Pages Function — /api/image/:key
// 从 KV 取出图片字节并返回

interface Env {
  AGENT_MEMORY: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const key = params.key as string
  if (!key) return new Response('Not found', { status: 404 })

  const data = await env.AGENT_MEMORY.get(key, 'arrayBuffer')
  if (!data) return new Response('Image not found or expired', { status: 404 })

  const bytes = new Uint8Array(data)
  let contentType = 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50) contentType = 'image/png'
  else if (bytes[0] === 0x47 && bytes[1] === 0x49) contentType = 'image/gif'
  else if (bytes[0] === 0x52 && bytes[1] === 0x49) contentType = 'image/webp'

  return new Response(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=2592000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
