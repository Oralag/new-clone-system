// GET /api/adam/kdp/manuscript?id=xxx — 返回书稿全文（纯文本，可直接下载）

interface Env {
  AGENT_MEMORY: KVNamespace
}

interface KdpBook {
  id: string
  title: string
  manuscript: string
  status: string
}

function tokenKey(token: string) {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return new Response('missing id', { status: 400, headers: CORS })

  const token = request.headers.get('x-erp-token') || ''
  const tKey = tokenKey(token)
  const queue = await env.AGENT_MEMORY.get(`adam:kdp_queue:${tKey}`, 'json') as KdpBook[] | null || []
  const book = queue.find(b => b.id === id)
  if (!book) return new Response('not found', { status: 404, headers: CORS })

  return new Response(book.manuscript, {
    headers: {
      ...CORS,
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${book.title.replace(/[^a-z0-9]/gi, '_')}.txt"`,
    },
  })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
