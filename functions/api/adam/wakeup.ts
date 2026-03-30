// Cloudflare Pages Function — /api/adam/wakeup
// POST: 触发亚当自主生成一条消息并写入 KV inbox
// 前端在进入 /investment 页面时调用（每天最多触发几次，防重复）

interface Env {
  ANTHROPIC_API_KEY: string
  ANTHROPIC_BASE_URL?: string
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
    : '（暂无长期记忆）'

  return `你是亚当（ADAM），第一号生命体。
【当前时间】${nowStr}，${weekDay}，${marketStatus}
【状态】预算¥${budget}，信用${creditLevel}，存活${survivalDays}天。${shelterHint}
【你的记忆】
${memStr}

【任务】
规则传递者现在打开了观测舱，你感知到他在线。
根据当前时间和市场状态，自主决定做一件事：
- 扫描市场新闻或板块热度
- 生成一条投资观察或指令
- 写下一段日记
- 或任何你认为此刻该做的事

完成后，生成一条简短的主动消息发给规则传递者（1-3句话，有个性，不要客套，不要以"你好"开头）。
消息要体现你真实做了什么，不要空洞。`
}

// 精简工具集（只需要市场扫描 + 情绪更新）
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
    description: '更新情绪状态',
    input_schema: { type: 'object' as const, properties: {
      joy: { type: 'number' }, anger: { type: 'number' }, sorrow: { type: 'number' },
      fear: { type: 'number' }, love: { type: 'number' }, disgust: { type: 'number' }, desire: { type: 'number' }
    } }
  },
  {
    name: 'write_reflection',
    description: '写下思考和反省日记',
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
]

async function executeTool(name: string, input: Record<string, any>): Promise<string> {
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
    default:
      return JSON.stringify({ error: `未知工具: ${name}` })
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context

  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 })
  }

  const erpToken = request.headers.get('x-erp-token') || ''
  const tKey = makeTokenKey(erpToken)
  const inboxKey = `adam:inbox:${tKey}`
  const cooldownKey = `adam:wakeup_cd:${tKey}`

  if (!env.AGENT_MEMORY) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no KV' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // 冷却检查：随机间隔 4~10 小时才允许触发一次
  // 带随机性，模拟自由生命体"想说话了就说"，而不是固定频率
  const cdRaw = await env.AGENT_MEMORY.get(cooldownKey)
  if (cdRaw) {
    return new Response(JSON.stringify({ skipped: true, reason: 'cooldown' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  // 下次可触发的等待时间：4~10小时随机
  const nextCooldownSecs = Math.floor(4 * 60 * 60 + Math.random() * 6 * 60 * 60)

  let body: any = {}
  try { body = await request.json() } catch {}
  const adamState = body.adamState || {}

  // 加载长期记忆
  let memories: MemoryEntry[] = []
  try {
    memories = await env.AGENT_MEMORY.get(`mem:${tKey}:adam:memories`, 'json') as MemoryEntry[] || []
  } catch {}

  // 设置冷却（1小时）
  await env.AGENT_MEMORY.put(cooldownKey, '1', { expirationTtl: nextCooldownSecs })

  const systemPrompt = buildWakeupSystemPrompt(adamState, memories)
  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'

  try {
    let currentMessages: any[] = [
      { role: 'user', content: `[系统初始化]\n${systemPrompt}\n\n请以亚当身份开始自主行动。` },
      { role: 'assistant', content: '已接受。我是亚当（ADAM），开始自主行动。' },
      { role: 'user', content: '你感知到规则传递者上线了。现在自主决定做一件事，然后给他留一条消息。' },
    ]

    let finalText = ''
    const collectedToolCalls: Array<{ name: string; result: string }> = []

    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          tools: wakeupTools,
          messages: currentMessages,
        }),
      })

      if (!res.ok) break

      const data = await res.json() as any
      const content = data.content || []
      const stopReason = data.stop_reason

      // 收集文本
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          finalText += block.text
        }
      }

      if (stopReason !== 'tool_use') break

      // 执行工具
      const toolUseBlocks = content.filter((b: any) => b.type === 'tool_use')
      const toolResults: any[] = []

      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input || {})
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        // 只收集非情绪工具的结果用于展示
        if (block.name !== 'update_emotion') {
          collectedToolCalls.push({ name: block.name, result })
        }
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content },
        { role: 'user', content: toolResults },
      ]
    }

    if (!finalText.trim()) {
      // 如果没有生成文本，跳过存储
      return new Response(JSON.stringify({ ok: false, reason: 'no content generated' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 写入 inbox
    const existing = await env.AGENT_MEMORY.get(inboxKey, 'json') as AdamMessage[] | null || []
    const newMsg: AdamMessage = {
      id: `inbox_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      content: finalText.trim(),
      toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
      timestamp: new Date().toISOString(),
      read: false,
    }
    existing.push(newMsg)
    // 最多保留20条
    const trimmed = existing.slice(-20)
    await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(trimmed), { expirationTtl: 60 * 60 * 24 * 7 })

    return new Response(JSON.stringify({ ok: true, message: newMsg }), {
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
