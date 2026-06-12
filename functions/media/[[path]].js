export async function onRequest({ request, env, params }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } })
  }
  const key = (params.path || []).join('/')
  if (!key) return new Response('Not Found', { status: 404 })

  const responseHeaders = {
    'Cache-Control': 'public, max-age=604800',
    'Access-Control-Allow-Origin': '*',
  }

  const kvResult = await env.AGENT_MEMORY.getWithMetadata(`media_${key}`, 'arrayBuffer')
  if (!kvResult.value) return new Response('Not Found', { status: 404 })

  let contentType = kvResult.metadata?.contentType
  if (!contentType) {
    const ext = key.split('.').pop()?.toLowerCase()
    if (ext === 'mp4' || ext === 'mov') contentType = 'video/mp4'
    else if (ext === 'webm') contentType = 'video/webm'
    else if (ext === 'png') contentType = 'image/png'
    else if (ext === 'gif') contentType = 'image/gif'
    else if (ext === 'webp') contentType = 'image/webp'
    else {
      const bytes = new Uint8Array(kvResult.value)
      if (bytes[0] === 0x89 && bytes[1] === 0x50) contentType = 'image/png'
      else if (bytes[0] === 0x47 && bytes[1] === 0x49) contentType = 'image/gif'
      else if (bytes[0] === 0x52 && bytes[1] === 0x49) contentType = 'image/webp'
      else contentType = 'image/jpeg'
    }
  }
  return new Response(kvResult.value, { headers: { ...responseHeaders, 'Content-Type': contentType } })
}
