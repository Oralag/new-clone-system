// Cloudflare Pages Function — /api/knowledge
// 共享知识库：Captain 和亚当都能读写
// KV key 格式：kb:entries（全局共享，不按用户隔离）

interface Env {
  AGENT_MEMORY: KVNamespace
}

interface KnowledgeEntry {
  id: string
  title: string
  content: string
  summary: string       // 简短摘要，给 AI 快速判断是否相关
  category: string      // person / strategy / framework / case / other
  tags: string[]
  source: string        // 谁添加的：captain / adam / system
  created_at: string
  updated_at: string
}

const KB_KEY = 'kb:entries'

async function loadEntries(kv: KVNamespace): Promise<KnowledgeEntry[]> {
  try {
    const val = await kv.get(KB_KEY, 'json')
    return (val as KnowledgeEntry[]) || []
  } catch { return [] }
}

async function saveEntries(kv: KVNamespace, entries: KnowledgeEntry[]) {
  await kv.put(KB_KEY, JSON.stringify(entries))
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders })
}

// GET /api/knowledge?q=keyword&category=person
// 返回知识库列表，支持关键词搜索和分类筛选
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.toLowerCase() || ''
  const category = url.searchParams.get('category') || ''
  const id = url.searchParams.get('id') || ''

  const entries = await loadEntries(env.AGENT_MEMORY)

  // 按 ID 精确查询
  if (id) {
    const entry = entries.find(e => e.id === id)
    return new Response(JSON.stringify(entry || null), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // 搜索 + 筛选
  let result = entries
  if (category) result = result.filter(e => e.category === category)
  if (q) {
    result = result.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  return new Response(JSON.stringify({
    total: result.length,
    entries: result.map(e => ({
      id: e.id,
      title: e.title,
      summary: e.summary,
      category: e.category,
      tags: e.tags,
      source: e.source,
      created_at: e.created_at,
    })),
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

// POST /api/knowledge — 新增或更新条目
// body: { title, content, summary, category, tags, source }
// POST /api/knowledge?action=delete&id=xxx — 删除条目
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  const entries = await loadEntries(env.AGENT_MEMORY)

  // 删除
  if (action === 'delete') {
    const { id } = await request.json() as { id: string }
    const filtered = entries.filter(e => e.id !== id)
    await saveEntries(env.AGENT_MEMORY, filtered)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // 新增 / 更新
  const body = await request.json() as Partial<KnowledgeEntry> & { id?: string }

  if (!body.title?.trim() || !body.content?.trim()) {
    return new Response(JSON.stringify({ error: 'title 和 content 必填' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // 如果传了 id 就更新
  if (body.id) {
    const idx = entries.findIndex(e => e.id === body.id)
    if (idx >= 0) {
      entries[idx] = {
        ...entries[idx],
        title: body.title!,
        content: body.content!,
        summary: body.summary || entries[idx].summary,
        category: body.category || entries[idx].category,
        tags: body.tags || entries[idx].tags,
        updated_at: new Date().toISOString(),
      }
      await saveEntries(env.AGENT_MEMORY, entries)
      return new Response(JSON.stringify({ ok: true, id: body.id }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  // 新增
  const newEntry: KnowledgeEntry = {
    id: `kb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: body.title!,
    content: body.content!,
    summary: body.summary || body.content!.slice(0, 100),
    category: body.category || 'other',
    tags: body.tags || [],
    source: body.source || 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  entries.push(newEntry)
  await saveEntries(env.AGENT_MEMORY, entries)

  return new Response(JSON.stringify({ ok: true, id: newEntry.id }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
