// GET  /api/adam/kdp/queue        — 列出亚当写的所有书稿
// POST /api/adam/kdp/queue        — 更新书稿状态（mark as uploaded）

interface Env {
  AGENT_MEMORY: KVNamespace
}

interface KdpBook {
  id: string
  title: string
  subtitle?: string
  manuscript: string
  description?: string
  coverUrl?: string
  keywords?: string[]
  categories?: string[]
  price?: string
  status: 'pending_upload' | 'uploaded' | 'live'
  wordCount?: number
  createdAt: string
  uploadedAt?: string
  asin?: string
}

function tKey(token: string) {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context
  const key = tKey(request.headers.get('x-erp-token') || '')
  const queue = ((await env.AGENT_MEMORY.get(`adam:kdp_queue:${key}`, 'json')) as KdpBook[] | null) || []

  // 不返回书稿全文（太大），只返回元数据
  const list = queue.map(b => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    coverUrl: b.coverUrl,
    description: b.description,
    keywords: b.keywords,
    categories: b.categories,
    price: b.price,
    status: b.status,
    wordCount: b.wordCount || b.manuscript?.split(/\s+/).length || 0,
    createdAt: b.createdAt,
    uploadedAt: b.uploadedAt,
    asin: b.asin,
  }))

  return new Response(JSON.stringify({ total: list.length, books: list }), { headers: CORS })
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const key = tKey(request.headers.get('x-erp-token') || '')

  const body = await request.json() as { id: string; status: 'uploaded' | 'live' | 'pending_upload'; asin?: string }
  if (!body.id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400, headers: CORS })

  const queueKey = `adam:kdp_queue:${key}`
  const queue = ((await env.AGENT_MEMORY.get(queueKey, 'json')) as KdpBook[] | null) || []
  const idx = queue.findIndex(b => b.id === body.id)
  if (idx === -1) return new Response(JSON.stringify({ error: 'book not found' }), { status: 404, headers: CORS })

  queue[idx].status = body.status
  if (body.asin) queue[idx].asin = body.asin
  if (body.status === 'uploaded' || body.status === 'live') {
    queue[idx].uploadedAt = new Date().toISOString()
  }
  if (body.status === 'pending_upload') {
    // 撤销自动标记
    delete queue[idx].uploadedAt
  }

  await env.AGENT_MEMORY.put(queueKey, JSON.stringify(queue), { expirationTtl: 365 * 24 * 3600 })
  return new Response(JSON.stringify({ ok: true, book: queue[idx] }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
