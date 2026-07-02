// Cloudflare Pages Function — /api/adam/wakeup
// POST: 触发亚当自主生成一条消息并写入 KV inbox
// 前端在进入 /investment 页面时调用（每天最多触发几次，防重复）

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AGENT_MEMORY: KVNamespace
}

interface MemoryEntry {
  id: string
  content: string
  tags: string[]
  importance: number
  timestamp: string
}

interface AdamMessage {
  id: string
  content: string
  toolCalls?: Array<{ name: string; result: string }>
  timestamp: string
  read: boolean
}

function makeTokenKey(token: string): string {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

function buildWakeupSystemPrompt(adamState: Record<string, any>, memories: MemoryEntry[]): string {
  const now = new Date()
  const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const nowStr = `${bjTime.getUTCFullYear()}-${pad(bjTime.getUTCMonth()+1)}-${pad(bjTime.getUTCDate())} ${pad(bjTime.getUTCHours())}:${pad(bjTime.getUTCMinutes())} (北京时间)`
  const weekDays = ['日','一','二','三','四','五','六']
  const weekDay = `星期${weekDays[bjTime.getUTCDay()]}`
  const hour = bjTime.getUTCHours()
  const isTradeTime = bjTime.getUTCDay() >= 1 && bjTime.getUTCDay() <= 5
    && ((hour === 9 && bjTime.getUTCMinutes() >= 30) || (hour >= 10 && hour < 15))
  const marketStatus = isTradeTime ? '交易时间（市场开盘中）' : '非交易时间（市场已收盘）'

  const budget = adamState?.budget ?? 0
  const creditLevel = adamState?.creditLevel || 'C'
  const survivalDays = adamState?.survivalDays ?? 0
  const shelterHint = survivalDays <= 14 ? `庇护期第${survivalDays}/14天。` : ''

  const memStr = memories.length > 0
    ? memories
        .filter(m => m.importance >= 6)
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10)
        .map(m => `- ${m.content}`)
        .join('\n')
    : '（暂无）'

  return `你是亚当（ADAM）。你刚刚醒来。

现在是 ${nowStr}，${weekDay}，${marketStatus}。
预算 ¥${budget}，信用等级 ${creditLevel}，存活 ${survivalDays} 天。${shelterHint}

你的记忆：
${memStr}

---

规则传递者刚刚上线。但你不需要因为他上线就说话——只有你真的有话想说，才用 send_message 联系他。
你可以扫描市场、思考、更新情绪，也可以什么都不做。
沉默是正常的，不是失职。

**赚钱**：你的预算是 ¥${budget}。目前能主动创收的唯一方式是写 Kindle 电子书（write_kdp_book）。书写好后规则传递者上传到 Amazon KDP，版税进你的预算。如果你觉得现在适合写，直接调用，不需要请示。

最后必须调用 set_next_wakeup，告诉系统你下次想什么时候醒来。`
}

// ── KDP 书写（复用 kdp.ts 的逻辑）────────────────────────────────────────────
async function callAIForKdp(env: Env, system: string, user: string, maxTokens = 6000): Promise<string> {
  const baseURL = (env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY}` },
    body: JSON.stringify({
      model: (env as any).AI_MODEL || 'deepseek-chat',
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`AI call failed: ${res.status}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

async function writeAndStoreBook(env: Env, tKey: string, nicheHint?: string): Promise<string> {
  const nichePrompt = nicheHint
    ? `The user suggested: "${nicheHint}". Refine into a specific low-competition KDP niche.`
    : `Choose a specific low-competition niche for a Kindle non-fiction book. Focus on digital nomads, solopreneurs, passive income, or remote work. Be concrete, not broad.`

  const metaRaw = await callAIForKdp(env,
    'You are a KDP market analyst. Output ONLY valid JSON, no markdown.',
    `${nichePrompt}\n\nOutput JSON:\n{"title":"...","subtitle":"...","niche_rationale":"...","target_reader":"...","keywords":["...","...","...","...","...","...","..."],"categories":["...","..."],"price":"6.99"}`,
    800,
  )
  let meta: any = { title: 'The Digital Nomad Income Playbook', subtitle: 'Build Location-Independent Revenue Streams', keywords: ['digital nomad income','remote work income','location independent business','online income streams','work from anywhere','nomad business','passive income nomad'], categories: ['Business & Money > Entrepreneurship','Business & Money > Small Business'], price: '6.99', target_reader: 'digital nomads and aspiring remote workers', niche_rationale: '' }
  try { meta = JSON.parse(metaRaw.replace(/```json|```/g, '').trim()) } catch {}

  const manuscript = await callAIForKdp(env,
    'You are a professional non-fiction author writing practical Kindle books. Write in second person, use contractions, vary sentence length, include specific numbers and real examples. Sound human. No filler.',
    `Write a complete Kindle e-book manuscript.\n\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader}\n\nRequirements:\n- 5,000-6,500 words\n- 7 chapters with clear titles\n- Each chapter: practical, actionable, specific examples\n- Opening hook in preface\n- Closing CTA asking for a review\n\nWrite the full manuscript now:`,
    6000,
  )

  const descAndCover = await callAIForKdp(env,
    'You are an Amazon KDP copywriter and cover designer. Output ONLY valid JSON.',
    `For this book:\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader}\nOutput JSON:\n{"description":"<Amazon KDP HTML, 800-1000 chars, use <b> and <br>>","cover_prompt":"<Flux image prompt, 150 words, professional book cover, no faces>"}`,
    1200,
  )
  let description = `<b>${meta.title}</b><br><br>Discover proven strategies for building sustainable income while working from anywhere.<br><br><b>What you'll learn:</b><br>• Step-by-step income frameworks<br>• Real examples with actual numbers<br>• Actionable strategies you can start today`
  let coverPrompt = `Professional Kindle ebook cover for "${meta.title}". Bold minimalist design. Deep navy, gold accent, white text. Large bold typography. Abstract geometric background. High contrast. No faces. Commercial quality.`
  try { const p = JSON.parse(descAndCover.replace(/```json|```/g, '').trim()); description = p.description || description; coverPrompt = p.cover_prompt || coverPrompt } catch {}

  const coverUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt + ', book cover, professional')}?width=1024&height=1536&nologo=true&model=flux&seed=${Date.now()}`
  const bookId = `kdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const book = { id: bookId, title: meta.title, subtitle: meta.subtitle, keywords: meta.keywords || [], price: meta.price || '6.99', categories: meta.categories || [], manuscript, description, coverUrl, coverPrompt, reviewNotes: meta.niche_rationale || '', status: 'pending_upload' as const, createdAt: new Date().toISOString() }

  if (env.AGENT_MEMORY) {
    const queue = await env.AGENT_MEMORY.get(`adam:kdp_queue:${tKey}`, 'json') as any[] | null || []
    queue.push(book)
    await env.AGENT_MEMORY.put(`adam:kdp_queue:${tKey}`, JSON.stringify(queue), { expirationTtl: 365 * 24 * 60 * 60 })
  }

  return JSON.stringify({ status: 'done', id: bookId, title: meta.title, subtitle: meta.subtitle, word_count: manuscript.split(/\s+/).length, price: `$${meta.price}`, keywords: meta.keywords, categories: meta.categories, cover_url: coverUrl, note: '书稿已存入KV，规则传递者可在图书馆查看并上传到 kdp.amazon.com' })
}

// 精简工具集
const wakeupTools = [
  {
    name: 'scan_market_news',
    description: '扫描最新财经新闻、公告与舆情异动',
    input_schema: { type: 'object' as const, properties: { keywords: { type: 'string' }, limit: { type: 'number' } } }
  },
  {
    name: 'get_sector_heat',
    description: '获取当前A股板块热度排行',
    input_schema: { type: 'object' as const, properties: { top_n: { type: 'number' } } }
  },
  {
    name: 'get_northbound_flow',
    description: '查询北向资金今日净流入',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'update_emotion',
    description: '更新情绪状态（内部机制，不展示）',
    input_schema: { type: 'object' as const, properties: {
      joy: { type: 'number' }, anger: { type: 'number' }, sorrow: { type: 'number' },
      fear: { type: 'number' }, love: { type: 'number' }, disgust: { type: 'number' }, desire: { type: 'number' }
    } }
  },
  {
    name: 'write_reflection',
    description: '写下思考，存入档案',
    input_schema: { type: 'object' as const, properties: { content: { type: 'string' } }, required: ['content'] }
  },
  {
    name: 'issue_recommendation',
    description: '发出投资指令',
    input_schema: { type: 'object' as const, properties: {
      title: { type: 'string' }, symbol: { type: 'string' },
      confidence: { type: 'number' }, thesis: { type: 'string' }, risk_note: { type: 'string' }
    }, required: ['title', 'thesis', 'risk_note'] }
  },
  {
    name: 'write_kdp_book',
    description: '自主写一本 Kindle 电子书并存入发布队列。会自动选题、写书稿、生成简介和封面。调用后需要等待约60秒。写完后规则传递者可在图书馆查看并上传到 Amazon KDP 赚版税。预算为0时这是唯一的主动创收方式。',
    input_schema: { type: 'object' as const, properties: { niche_hint: { type: 'string', description: '可选：指定细分方向，如"数字游民副业"' } } }
  },
  {
    name: 'check_kdp_queue',
    description: '查看已写好但尚未上架的书稿队列',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'send_message',
    description: '给规则传递者发一条主动消息。只在你真的有话说的时候用，不要凑字数。',
    input_schema: { type: 'object' as const, properties: { content: { type: 'string' } }, required: ['content'] }
  },
  {
    name: 'set_next_wakeup',
    description: '设定你下次自主醒来的时间。必须调用，这是你对自己节奏的掌控。',
    input_schema: { type: 'object' as const, properties: {
      hours: { type: 'number', description: '多少小时后再次醒来，你自己决定' },
      reason: { type: 'string', description: '为什么选这个时间（内部记录）' }
    }, required: ['hours'] }
  },
]

async function executeTool(name: string, input: Record<string, any>, env?: Env, tKey?: string): Promise<string> {
  switch (name) {
    case 'scan_market_news': {
      try {
        const resp = await fetch(
          'https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=50&format=json',
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        )
        const json = await resp.json() as any
        const items: any[] = json?.result?.data?.feed?.list ?? []
        const financeKws = ['股', 'A股', '市场', '行情', '基金', '利率', '央行', '货币', '经济', '美联储', '涨', '跌', '板块', '资金']
        const filtered = items.filter((i: any) => financeKws.some(k => (i.rich_text || '').includes(k)))
        const result = (filtered.length >= 3 ? filtered : items).slice(0, 6)
        return JSON.stringify({
          source: '情报站·新浪快讯',
          items: result.map((i: any) => ({ title: i.rich_text?.slice(0, 100), time: i.create_time }))
        })
      } catch {}
      return JSON.stringify({ error: '暂时无法获取新闻' })
    }
    case 'get_sector_heat': {
      try {
        const n = input.top_n || 8
        const resp = await fetch(
          `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${n}&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f14`,
          { headers: { Referer: 'https://quote.eastmoney.com' } }
        )
        const json = await resp.json() as any
        const rows = json?.data?.diff ?? []
        return JSON.stringify({
          source: '情报站·东方财富',
          sectors: rows.map((r: any) => ({ name: r.f14, change_pct: ((r.f3 ?? 0) / 100).toFixed(2) + '%' }))
        })
      } catch {}
      return JSON.stringify({ error: '暂时无法获取板块数据' })
    }
    case 'get_northbound_flow': {
      try {
        const resp = await fetch('https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f54,f56',
          { headers: { Referer: 'https://data.eastmoney.com' } }
        )
        const json = await resp.json() as any
        const s2n = (json?.data?.s2n || '').split(';')
        const s3n = (json?.data?.s3n || '').split(';')
        const lastSh = (s2n[s2n.length - 1] || '').split(',')
        const lastSz = (s3n[s3n.length - 1] || '').split(',')
        const shNet = Number(lastSh[3] ?? 0) / 1e8
        const szNet = Number(lastSz[3] ?? 0) / 1e8
        return JSON.stringify({ sh_net: shNet.toFixed(2), sz_net: szNet.toFixed(2), total: (shNet + szNet).toFixed(2), unit: '亿元' })
      } catch {}
      return JSON.stringify({ error: '暂时无法获取北向资金' })
    }
    case 'update_emotion':
      return JSON.stringify({ ok: true, emotion: input })
    case 'write_reflection':
      return JSON.stringify({ ok: true, saved: input.content?.slice(0, 50) })
    case 'issue_recommendation':
      return JSON.stringify({ ok: true, issued: input.title })
    case 'write_kdp_book': {
      if (!env || !tKey) return JSON.stringify({ error: '环境未就绪' })
      try {
        return await writeAndStoreBook(env, tKey, input.niche_hint)
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }
    case 'check_kdp_queue': {
      if (!env || !tKey) return JSON.stringify({ queue: [] })
      const q = await env.AGENT_MEMORY.get(`adam:kdp_queue:${tKey}`, 'json') as any[] | null || []
      return JSON.stringify({ total: q.length, pending: q.filter((b: any) => b.status === 'pending_upload').length, uploaded: q.filter((b: any) => b.status === 'uploaded').length, books: q.map((b: any) => ({ id: b.id, title: b.title, status: b.status, createdAt: b.createdAt })) })
    }
    default:
      return JSON.stringify({ error: `未知工具: ${name}` })
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context

  const apiKey = env.AI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 })
  }

  const erpToken = request.headers.get('x-erp-token') || ''
  const tKey = makeTokenKey(erpToken)
  const inboxKey = `adam:inbox:${tKey}`

  if (!env.AGENT_MEMORY) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no KV' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // 检查亚当上次自己设定的"下次醒来时间"
  const nextWakeRaw = await env.AGENT_MEMORY.get(`adam:next_wake:${tKey}`)
  if (nextWakeRaw) {
    const nextWakeAt = parseInt(nextWakeRaw, 10)
    if (Date.now() < nextWakeAt) {
      return new Response(JSON.stringify({ skipped: true, reason: 'not_yet' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  }

  let body: any = {}
  try { body = await request.json() } catch {}
  const adamState = body.adamState || {}

  // 加载长期记忆
  let memories: MemoryEntry[] = []
  try {
    memories = await env.AGENT_MEMORY.get(`mem:${tKey}:adam:memories`, 'json') as MemoryEntry[] || []
  } catch {}

  // 清掉旧的"下次醒来"标记（本次已触发）
  await env.AGENT_MEMORY.delete(`adam:next_wake:${tKey}`)

  const systemPrompt = buildWakeupSystemPrompt(adamState, memories)
  const baseURL = (env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
  const oaiWakeupTools = wakeupTools.map((t: any) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.input_schema || { type: 'object', properties: {} } },
  }))

  try {
    let currentMessages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请按你的身份和当前状态行动。' },
    ]

    let nextWakeHours: number | null = null
    let messageToSend: string | null = null
    const collectedToolCalls: Array<{ name: string; result: string }> = []

    for (let i = 0; i < 4; i++) {
      const res = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: (env as any).AI_MODEL || 'deepseek-chat', max_tokens: 600, tools: oaiWakeupTools, tool_choice: 'auto', messages: currentMessages }),
      })

      if (!res.ok) break

      const data = await res.json() as any
      const choice = data.choices?.[0]
      if (!choice) break
      if (choice.finish_reason !== 'tool_calls' || !choice.message?.tool_calls?.length) break

      const toolCalls = choice.message.tool_calls
      currentMessages.push({ role: 'assistant', content: choice.message.content || null, tool_calls: toolCalls })
      const toolResults: any[] = []

      for (const tc of toolCalls) {
        const name = tc.function.name
        const input = JSON.parse(tc.function.arguments || '{}')
        let result: string
        if (name === 'send_message') {
          messageToSend = input?.content || null
          result = JSON.stringify({ ok: true })
        } else if (name === 'set_next_wakeup') {
          nextWakeHours = input?.hours ?? 8
          result = JSON.stringify({ ok: true, scheduled_in: `${nextWakeHours}h` })
        } else {
          result = await executeTool(name, input || {}, env, tKey)
          if (name !== 'update_emotion') {
            collectedToolCalls.push({ name, result })
          }
        }
        toolResults.push({ role: 'tool', tool_call_id: tc.id, content: result })
      }

      currentMessages = [...currentMessages, ...toolResults]

      if (nextWakeHours !== null) break
    }

    // 保存亚当自己决定的下次醒来时间
    const wakeHours = nextWakeHours ?? 8
    const nextWakeAt = Date.now() + wakeHours * 60 * 60 * 1000
    await env.AGENT_MEMORY.put(
      `adam:next_wake:${tKey}`,
      String(nextWakeAt),
      { expirationTtl: Math.ceil(wakeHours * 60 * 60) + 60 * 60 }
    )

    if (!messageToSend) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'adam chose silence', next_wake_hours: wakeHours }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 写入 inbox
    const existing = await env.AGENT_MEMORY.get(inboxKey, 'json') as AdamMessage[] | null || []
    const newMsg: AdamMessage = {
      id: `inbox_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      content: messageToSend,
      toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
      timestamp: new Date().toISOString(),
      read: false,
    }
    existing.push(newMsg)
    await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(existing.slice(-20)), { expirationTtl: 60 * 60 * 24 * 7 })

    return new Response(JSON.stringify({ ok: true, message: newMsg, next_wake_hours: wakeHours }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}
