// GET  /api/adam/templates          — 列出模板产品队列（元数据）
// GET  /api/adam/templates?id=xxx   — 取单个模板的完整内容（markdown）
// POST /api/adam/templates          — { id, status: 'uploaded', listingUrl? } 标记已上架
//                                   — { action: 'write', niche_hint? } 手动触发亚当写一个

interface Env {
  AGENT_MEMORY: KVNamespace
  AI_API_KEY?: string
  AI_BASE_URL?: string
  AI_MODEL?: string
}

interface TplProduct {
  id: string
  title: string
  tagline?: string
  type: string
  tags?: string[]
  price?: string
  content: string
  description?: string
  coverUrl?: string
  coverPrompt?: string
  reviewNotes?: string
  status: 'pending_upload' | 'uploaded'
  createdAt: string
  uploadedAt?: string
  listingUrl?: string
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
  const queue = ((await env.AGENT_MEMORY.get(`adam:tpl_queue:${key}`, 'json')) as TplProduct[] | null) || []

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (id) {
    const tpl = queue.find(t => t.id === id)
    if (!tpl) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: CORS })
    return new Response(JSON.stringify({ id: tpl.id, title: tpl.title, content: tpl.content }), { headers: CORS })
  }

  // 列表不返回 content 全文
  const list = queue.map(t => ({
    id: t.id, title: t.title, tagline: t.tagline, type: t.type, tags: t.tags,
    price: t.price, description: t.description, coverUrl: t.coverUrl,
    status: t.status, createdAt: t.createdAt, uploadedAt: t.uploadedAt, listingUrl: t.listingUrl,
    wordCount: t.content?.split(/\s+/).length || 0,
  }))
  return new Response(JSON.stringify({ total: list.length, templates: list }), { headers: CORS })
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const key = tKey(request.headers.get('x-erp-token') || '')
  const body = await request.json() as any
  const queueKey = `adam:tpl_queue:${key}`

  // 手动触发生成（复用 cron 里的产线逻辑：这里直接内联一次简化生成，避免跨模块依赖）
  if (body.action === 'write') {
    return new Response(JSON.stringify({
      error: '请在对话里让亚当调用 write_template，或等他下次唤醒自动生产（产线规则已内置）',
    }), { status: 400, headers: CORS })
  }

  if (!body.id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400, headers: CORS })
  const queue = ((await env.AGENT_MEMORY.get(queueKey, 'json')) as TplProduct[] | null) || []
  const idx = queue.findIndex(t => t.id === body.id)
  if (idx === -1) return new Response(JSON.stringify({ error: 'template not found' }), { status: 404, headers: CORS })

  if (body.status === 'uploaded') {
    queue[idx].status = 'uploaded'
    queue[idx].uploadedAt = new Date().toISOString()
  } else if (body.status === 'pending_upload') {
    // 撤销自动标记
    queue[idx].status = 'pending_upload'
    delete queue[idx].uploadedAt
  }
  if (body.listingUrl) queue[idx].listingUrl = body.listingUrl

  await env.AGENT_MEMORY.put(queueKey, JSON.stringify(queue), { expirationTtl: 365 * 24 * 3600 })
  return new Response(JSON.stringify({ ok: true, template: { id: queue[idx].id, status: queue[idx].status } }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
