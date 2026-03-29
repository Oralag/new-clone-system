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

  return new Response(data, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
