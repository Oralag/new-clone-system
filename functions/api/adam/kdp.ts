// Cloudflare Pages Function — /api/adam/kdp
// GET:   列出 KV 里的 KDP 书稿队列
// POST:  触发亚当写一本书（存入 KV）
// PATCH: 标记某本书已上架

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AGENT_MEMORY: KVNamespace
}

export interface KdpBook {
  id: string
  title: string
  subtitle: string
  keywords: string[]
  price: string
  categories: string[]
  manuscript: string
  description: string
  coverUrl: string
  coverPrompt: string
  reviewNotes: string
  status: 'pending_upload' | 'uploaded'
  createdAt: string
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

function tokenKey(token: string) {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

async function callAI(env: Env, system: string, user: string, maxTokens = 6000): Promise<string> {
  const baseURL = (env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`AI call failed: ${res.status}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

async function writeBook(env: Env, nicheHint?: string): Promise<KdpBook> {
  // Step 1: 选题 + 元数据
  const nichePrompt = nicheHint
    ? `The user suggested: "${nicheHint}". Refine into a specific low-competition KDP niche.`
    : `Choose a specific low-competition niche for a Kindle non-fiction book. Focus on digital nomads, solopreneurs, passive income, or remote work. Be concrete, not broad.`

  const metaRaw = await callAI(
    env,
    'You are a KDP market analyst. Output ONLY valid JSON, no markdown.',
    `${nichePrompt}\n\nOutput JSON:\n{"title":"...","subtitle":"...","niche_rationale":"...","target_reader":"...","keywords":["...","...","...","...","...","...","..."],"categories":["...","..."],"price":"6.99"}`,
    800,
  )
  let meta: any = {
    title: 'The Digital Nomad Income Playbook',
    subtitle: 'Build Location-Independent Revenue Streams That Actually Work',
    keywords: ['digital nomad income', 'remote work income', 'location independent business', 'online income streams', 'work from anywhere', 'nomad business', 'passive income nomad'],
    categories: ['Business & Money > Entrepreneurship', 'Business & Money > Small Business'],
    price: '6.99',
    target_reader: 'digital nomads and aspiring remote workers',
    niche_rationale: 'High search volume, moderate competition',
  }
  try { meta = JSON.parse(metaRaw.replace(/```json|```/g, '').trim()) } catch {}

  // Step 2: 书稿 + 简介 + 封面（合并成一次调用减少超时风险）
  const manuscript = await callAI(
    env,
    'You are a professional non-fiction author writing practical Kindle books. Write in second person, use contractions, vary sentence length, include specific numbers and real examples. Sound human. No filler.',
    `Write a complete Kindle e-book manuscript.\n\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader}\n\nRequirements:\n- 5,000-6,500 words\n- 7 chapters with clear titles\n- Each chapter: practical, actionable, specific examples\n- Opening hook in preface\n- Closing CTA asking for a review\n\nWrite the full manuscript now:`,
    6000,
  )

  const descAndCover = await callAI(
    env,
    'You are an Amazon KDP copywriter and cover designer. Output ONLY valid JSON.',
    `For this book:\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader}\nKeywords: ${meta.keywords?.join(', ')}\n\nOutput JSON with two keys:\n{"description":"<Amazon KDP HTML description, 800-1000 chars, use <b> and <br>, hook in first 2 sentences, bullet points>","cover_prompt":"<Flux/SD image generation prompt, 150 words, professional book cover, bold typography, no faces, commercial quality>"}`,
    1200,
  )

  let description = ''
  let coverPrompt = ''
  try {
    const parsed = JSON.parse(descAndCover.replace(/```json|```/g, '').trim())
    description = parsed.description || ''
    coverPrompt = parsed.cover_prompt || ''
  } catch {
    description = `<b>${meta.title}</b><br><br>Discover the proven strategies that successful digital nomads use to build sustainable income streams while working from anywhere in the world.<br><br><b>Inside you'll find:</b><br>• Step-by-step income building frameworks<br>• Real examples with actual numbers<br>• Actionable strategies you can start today<br><br>Stop trading time for money. Start building freedom.`
    coverPrompt = `Professional Kindle ebook cover for "${meta.title}". Bold minimalist design. Color palette: deep navy blue, gold accent, white text. Large bold typography dominates the cover. Abstract geometric background suggesting movement and freedom. High contrast. Commercial quality. No human faces. 1024x1536 portrait ratio.`
  }

  const coverUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt + ', book cover design, professional, commercial')}?width=1024&height=1536&nologo=true&model=flux&seed=${Date.now()}`

  const book: KdpBook = {
    id: `kdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: meta.title,
    subtitle: meta.subtitle,
    keywords: meta.keywords || [],
    price: meta.price || '6.99',
    categories: meta.categories || [],
    manuscript,
    description,
    coverUrl,
    coverPrompt,
    reviewNotes: meta.niche_rationale || '',
    status: 'pending_upload',
    createdAt: new Date().toISOString(),
  }
  return book
}

// ── GET: 列出所有书 ───────────────────────────────────────────────────────────

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context
  if (!env.AGENT_MEMORY) return new Response(JSON.stringify({ books: [] }), { headers: CORS })

  const token = request.headers.get('x-erp-token') || ''
  const tKey = tokenKey(token)
  const raw = await env.AGENT_MEMORY.get(`adam:kdp_queue:${tKey}`, 'json') as KdpBook[] | null || []

  // 书稿太大，列表时不返回 manuscript 正文
  const list = raw.map(b => ({ ...b, manuscript: `[${b.manuscript?.split(/\s+/).length ?? 0} words]` }))
  return new Response(JSON.stringify({ books: list, total: raw.length }), { headers: CORS })
}

// ── POST: 写一本书 ───────────────────────────────────────────────────────────

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  if (!env.AGENT_MEMORY || !env.AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'missing env' }), { status: 500, headers: CORS })
  }

  const token = request.headers.get('x-erp-token') || ''
  const tKey = tokenKey(token)

  let body: any = {}
  try { body = await request.json() } catch {}
  const nicheHint = body.niche_hint as string | undefined

  try {
    const book = await writeBook(env, nicheHint)

    // 存入 KV
    const queue = await env.AGENT_MEMORY.get(`adam:kdp_queue:${tKey}`, 'json') as KdpBook[] | null || []
    queue.push(book)
    await env.AGENT_MEMORY.put(`adam:kdp_queue:${tKey}`, JSON.stringify(queue), { expirationTtl: 365 * 24 * 60 * 60 })

    return new Response(JSON.stringify({
      ok: true,
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      word_count: book.manuscript.split(/\s+/).length,
      price: `$${book.price}`,
      keywords: book.keywords,
      categories: book.categories,
      cover_url: book.coverUrl,
      status: 'pending_upload',
      upload_checklist: [
        '✅ 书名 + 副标题',
        '✅ 7个关键词',
        '✅ 2个分类',
        '✅ 书籍简介（已生成 HTML）',
        '✅ 定价',
        '✅ 封面图（cover_url）',
        '✅ 书稿（GET /api/adam/kdp/manuscript?id=' + book.id + '）',
        '⬜ 作者笔名（你决定一次即可）',
        '⬜ 上传到 kdp.amazon.com',
      ],
    }), { headers: CORS })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: CORS })
  }
}

// ── PATCH: 标记已上架 ────────────────────────────────────────────────────────

export async function onRequestPatch(context: { request: Request; env: Env }) {
  const { request, env } = context
  if (!env.AGENT_MEMORY) return new Response(JSON.stringify({ error: 'no KV' }), { status: 500, headers: CORS })

  const token = request.headers.get('x-erp-token') || ''
  const tKey = tokenKey(token)

  const body = await request.json() as { id: string }
  const queue = await env.AGENT_MEMORY.get(`adam:kdp_queue:${tKey}`, 'json') as KdpBook[] | null || []
  const idx = queue.findIndex(b => b.id === body.id)
  if (idx === -1) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: CORS })

  queue[idx].status = 'uploaded'
  await env.AGENT_MEMORY.put(`adam:kdp_queue:${tKey}`, JSON.stringify(queue), { expirationTtl: 365 * 24 * 60 * 60 })

  return new Response(JSON.stringify({ ok: true }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
