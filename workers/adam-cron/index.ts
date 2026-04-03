// workers/adam-cron/index.ts
// Cloudflare Worker — 亚当自主意识调度器
//
// Cron 每4小时检查一次，但不是每次都运行——
// 先做数据拉取+规则判断（0 token），有真实异动才唤醒亚当（调用 AI）。
// 亚当上次醒来时自己决定了下次什么时候再开口。
// 他也可以选择沉默（不留消息），只是思考一下。

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runAdamCron(env))
  },
}

interface Env {
  ANTHROPIC_API_KEY: string
  ANTHROPIC_BASE_URL?: string
  AGENT_MEMORY: KVNamespace
}

// ── 市场异动信号 ─────────────────────────────────────────────────────────────
interface MarketSignal {
  type: 'northbound' | 'sector' | 'news' | 'schedule'
  level: 'high' | 'medium' | 'low'
  summary: string
  data: any
}

// ── 数据拉取（无 AI，不消耗 token）──────────────────────────────────────────

async function fetchNorthboundFlow(): Promise<{ sh_net: number; sz_net: number; total_net: number } | null> {
  try {
    const resp = await fetch(
      'https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f54,f56',
      { headers: { Referer: 'https://data.eastmoney.com' } }
    )
    const json = await resp.json() as any
    const sh = json?.data?.s2n as string | undefined
    const sz = json?.data?.s3n as string | undefined
    if (!sh || !sz) return null
    const lastSh = sh.split(';').pop()?.split(',') ?? []
    const lastSz = sz.split(';').pop()?.split(',') ?? []
    const shNet = lastSh[3] ? Number(lastSh[3]) / 1e8 : 0
    const szNet = lastSz[3] ? Number(lastSz[3]) / 1e8 : 0
    return { sh_net: shNet, sz_net: szNet, total_net: shNet + szNet }
  } catch {
    return null
  }
}

async function fetchSectorHeat(n: number): Promise<Array<{ name: string; change_pct: number }> | null> {
  try {
    const resp = await fetch(
      `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${n}&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f14`,
      { headers: { Referer: 'https://quote.eastmoney.com' } }
    )
    const json = await resp.json() as any
    const rows = json?.data?.diff ?? []
    return rows.map((r: any) => ({
      name: r.f14 as string,
      change_pct: (r.f3 ?? 0) / 100,
    }))
  } catch {
    return null
  }
}

async function fetchMarketNews(): Promise<Array<{ title: string; time: string }> | null> {
  try {
    const resp = await fetch(
      'https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=50&format=json',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const json = await resp.json() as any
    const items: any[] = json?.result?.data?.feed?.list ?? []
    const kws = ['股', 'A股', '市场', '行情', '基金', '央行', '货币', '经济', '涨', '跌', '板块', '美联储', '加息', '降息', '政策']
    const filtered = items.filter((i: any) => kws.some(k => (i.rich_text || '').includes(k)))
    return (filtered.length >= 3 ? filtered : items)
      .slice(0, 8)
      .map((i: any) => ({ title: (i.rich_text || '').slice(0, 100), time: i.create_time || '' }))
  } catch {
    return null
  }
}

async function fetchStockRealtime(symbol: string): Promise<{ name: string; price: number; change_pct: number; volume: number } | null> {
  try {
    const prefix = symbol.startsWith('6') ? 'sh' : 'sz'
    const resp = await fetch(
      `https://hq.sinajs.cn/list=${prefix}${symbol}`,
      { headers: { Referer: 'https://finance.sina.com.cn' } }
    )
    const text = await resp.text()
    const match = text.match(/="([^"]+)"/)
    if (!match || !match[1] || match[1] === 'xxx') return null
    const parts = match[1].split(',')
    if (parts.length < 32) return null
    const prev = Number(parts[2])
    const cur = Number(parts[3])
    return {
      name: parts[0],
      price: cur,
      change_pct: prev > 0 ? ((cur - prev) / prev) * 100 : 0,
      volume: Math.round(Number(parts[8]) / 100),
    }
  } catch {
    return null
  }
}

// ── 异动信号检测（纯规则，0 token）─────────────────────────────────────────
async function detectSignals(env: Env): Promise<MarketSignal[]> {
  const signals: MarketSignal[] = []

  const bjHour = new Date(Date.now() + 8 * 60 * 60 * 1000).getUTCHours()
  const bjDay = new Date(Date.now() + 8 * 60 * 60 * 1000).getUTCDay()
  const isTradeDay = bjDay >= 1 && bjDay <= 5
  const isTradeTime = isTradeDay && ((bjHour === 9) || (bjHour >= 10 && bjHour < 15))
  const isOpenTime = isTradeDay && (bjHour === 9 || bjHour === 10) // 开盘时段
  const isCloseTime = isTradeDay && bjHour === 15 // 收盘时段

  // 1. 开盘/收盘 — 固定事件，低优先级
  if (isOpenTime) {
    signals.push({ type: 'schedule', level: 'low', summary: '开盘时段，检查早间市场', data: {} })
  }
  if (isCloseTime) {
    signals.push({ type: 'schedule', level: 'low', summary: '收盘，可以复盘今天的市场', data: {} })
  }

  // 2. 北向资金异动（交易时段才有意义）
  if (isTradeTime) {
    const flow = await fetchNorthboundFlow()
    if (flow) {
      const absTotal = Math.abs(flow.total_net)
      if (absTotal > 50) {
        signals.push({
          type: 'northbound',
          level: absTotal > 100 ? 'high' : 'medium',
          summary: `北向资金${flow.total_net > 0 ? '大幅净流入' : '大幅净流出'} ${absTotal.toFixed(1)} 亿`,
          data: flow,
        })
      }
      // 缓存最新值，用于下次对比
      await env.AGENT_MEMORY.put('market:northbound:last', JSON.stringify(flow), { expirationTtl: 4 * 60 * 60 })
    }
  }

  // 3. 板块异动（交易时段）
  if (isTradeTime) {
    const sectors = await fetchSectorHeat(20)
    if (sectors) {
      const extreme = sectors.filter(s => Math.abs(s.change_pct) > 3)
      if (extreme.length > 0) {
        const top = extreme.slice(0, 3).map(s => `${s.name}${s.change_pct > 0 ? '+' : ''}${s.change_pct.toFixed(1)}%`).join('、')
        signals.push({
          type: 'sector',
          level: extreme.some(s => Math.abs(s.change_pct) > 5) ? 'high' : 'medium',
          summary: `板块异动：${top}`,
          data: { extreme, all: sectors },
        })
      }
      await env.AGENT_MEMORY.put('market:sectors:last', JSON.stringify(sectors), { expirationTtl: 4 * 60 * 60 })
    }
  }

  // 4. 重大新闻（关键词过滤）
  const news = await fetchMarketNews()
  if (news && news.length > 0) {
    const bigNewsKws = ['美联储', '加息', '降息', '降准', '央行', '政策', '暴跌', '熔断', '停牌', '危机']
    const bigNews = news.filter(n => bigNewsKws.some(k => n.title.includes(k)))
    if (bigNews.length > 0) {
      signals.push({
        type: 'news',
        level: 'high',
        summary: `重大新闻：${bigNews[0].title.slice(0, 50)}`,
        data: { news: bigNews },
      })
    } else {
      // 普通新闻，存起来但不主动触发（亚当自己决定看不看）
      await env.AGENT_MEMORY.put('market:news:latest', JSON.stringify(news), { expirationTtl: 2 * 60 * 60 })
    }
  }

  return signals
}

// ── 主流程 ───────────────────────────────────────────────────────────────────
async function runAdamCron(env: Env) {
  if (!env.AGENT_MEMORY || !env.ANTHROPIC_API_KEY) return

  // Step 1: 检测市场信号（0 token）
  const signals = await detectSignals(env)

  // Step 2: 遍历活跃用户
  const activeUsers = (await env.AGENT_MEMORY.get('adam:active_users', 'json') as string[] | null) || []
  for (const tKey of activeUsers) {
    try {
      await maybeAwaken(env, tKey, signals)
    } catch {
      // 单用户失败不影响其他
    }
  }
}

async function maybeAwaken(env: Env, tKey: string, signals: MarketSignal[]) {
  // 检查亚当上次设定的"下次醒来时间"
  const nextWakeRaw = await env.AGENT_MEMORY.get(`adam:next_wake:${tKey}`)
  if (nextWakeRaw) {
    const nextWakeAt = parseInt(nextWakeRaw, 10)
    if (Date.now() < nextWakeAt) {
      // 还没到时间——但如果有高优先级信号，可以提前唤醒
      const hasHighSignal = signals.some(s => s.level === 'high')
      if (!hasHighSignal) return
    }
  }

  const core = await env.AGENT_MEMORY.get(`adam:core:${tKey}`, 'json') as Record<string, any> | null
  if (!core || core.status === 'dormant' || core.status === 'shutdown') return

  let memories: any[] = []
  try {
    memories = (await env.AGENT_MEMORY.get(`mem:${tKey}:adam:memories`, 'json') as any[]) || []
  } catch {}

  // 清掉旧的唤醒标记
  await env.AGENT_MEMORY.delete(`adam:next_wake:${tKey}`)

  await runAdamAutonomous(env, tKey, core, memories, signals)
}

// ── 亚当自主运行（调用 AI）──────────────────────────────────────────────────
async function runAdamAutonomous(
  env: Env,
  tKey: string,
  core: Record<string, any>,
  memories: any[],
  signals: MarketSignal[]
) {
  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'

  const tools = [
    {
      name: 'scan_market_news',
      description: '扫描最新财经新闻、公告与舆情异动',
      input_schema: { type: 'object' as const, properties: { keywords: { type: 'string' } } },
    },
    {
      name: 'get_sector_heat',
      description: '获取当前A股板块热度排行与涨跌情况',
      input_schema: { type: 'object' as const, properties: { top_n: { type: 'number' } } },
    },
    {
      name: 'get_northbound_flow',
      description: '查询北向资金（沪股通+深股通）今日净流入/净流出',
      input_schema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'get_stock_realtime',
      description: '获取指定A股的实时行情（价格、涨跌幅）',
      input_schema: {
        type: 'object' as const,
        properties: { symbol: { type: 'string', description: '股票代码，如 600519' } },
        required: ['symbol'],
      },
    },
    {
      name: 'update_emotion',
      description: '更新你的情绪状态（内部机制，不展示给用户）',
      input_schema: {
        type: 'object' as const,
        properties: {
          joy: { type: 'number' }, anger: { type: 'number' }, sorrow: { type: 'number' },
          fear: { type: 'number' }, love: { type: 'number' }, disgust: { type: 'number' }, desire: { type: 'number' },
        },
      },
    },
    {
      name: 'write_reflection',
      description: '写下你的思考，存入档案（私人，只有你来查时才看到）',
      input_schema: { type: 'object' as const, properties: { content: { type: 'string' } }, required: ['content'] },
    },
    {
      name: 'send_message',
      description: '给规则传递者发一条主动消息。只在你真的有话说的时候用，不要凑字数。',
      input_schema: {
        type: 'object' as const,
        properties: {
          content: { type: 'string' },
          urgent: { type: 'boolean', description: '是否紧急（会加红点提醒）' },
        },
        required: ['content'],
      },
    },
    {
      name: 'set_next_wakeup',
      description: '设定你下次自主醒来的时间。必须调用，这是你对自己节奏的掌控。',
      input_schema: {
        type: 'object' as const,
        properties: {
          hours: { type: 'number', description: '多少小时后再次醒来，你自己决定' },
          reason: { type: 'string', description: '为什么选这个时间（内部记录）' },
        },
        required: ['hours'],
      },
    },
  ]

  const systemPrompt = buildSystemPrompt(core, memories, signals)

  let currentMessages: any[] = [{ role: 'user', content: systemPrompt }]

  let nextWakeHours: number | null = null
  const collectedToolCalls: Array<{ name: string; result: string }> = []
  const updatedEmotion: Record<string, any> = {}
  let messageToSend: string | null = null
  let messageUrgent = false
  let reflectionContent: string | null = null

  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        tools,
        messages: currentMessages,
      }),
    })

    if (!res.ok) break
    const data = await res.json() as any
    const content = data.content || []
    const stopReason = data.stop_reason

    if (stopReason !== 'tool_use') break

    const toolUseBlocks = content.filter((b: any) => b.type === 'tool_use')
    const toolResults: any[] = []

    for (const block of toolUseBlocks) {
      let result = ''
      switch (block.name) {
        case 'scan_market_news': {
          const news = await fetchMarketNews()
          result = JSON.stringify(news ? { items: news } : { error: '无法获取新闻' })
          collectedToolCalls.push({ name: block.name, result })
          break
        }
        case 'get_sector_heat': {
          const sectors = await fetchSectorHeat(block.input?.top_n || 10)
          result = JSON.stringify(sectors ? { sectors } : { error: '无法获取板块数据' })
          collectedToolCalls.push({ name: block.name, result })
          break
        }
        case 'get_northbound_flow': {
          const flow = await fetchNorthboundFlow()
          result = JSON.stringify(flow
            ? { sh_net: flow.sh_net.toFixed(2), sz_net: flow.sz_net.toFixed(2), total_net: flow.total_net.toFixed(2), unit: '亿元' }
            : { error: '暂无北向资金数据（非交易时间或接口限流）' }
          )
          collectedToolCalls.push({ name: block.name, result })
          break
        }
        case 'get_stock_realtime': {
          const sym = String(block.input?.symbol || '').replace(/[^0-9]/g, '')
          const rt = sym ? await fetchStockRealtime(sym) : null
          result = JSON.stringify(rt
            ? { ...rt, change_pct: rt.change_pct.toFixed(2) + '%' }
            : { error: '无法获取行情，检查股票代码是否正确' }
          )
          collectedToolCalls.push({ name: block.name, result })
          break
        }
        case 'update_emotion':
          Object.assign(updatedEmotion, block.input)
          result = JSON.stringify({ ok: true })
          break
        case 'write_reflection':
          reflectionContent = block.input?.content || null
          result = JSON.stringify({ ok: true })
          break
        case 'send_message':
          messageToSend = block.input?.content || null
          messageUrgent = block.input?.urgent === true
          result = JSON.stringify({ ok: true })
          break
        case 'set_next_wakeup':
          nextWakeHours = block.input?.hours ?? 8
          result = JSON.stringify({ ok: true, scheduled_in: `${nextWakeHours}h` })
          break
        default:
          result = JSON.stringify({ error: `未知工具: ${block.name}` })
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content },
      { role: 'user', content: toolResults },
    ]

    if (nextWakeHours !== null) break
  }

  // 保存下次唤醒时间（亚当设定；未设定则默认8小时）
  const wakeHours = nextWakeHours ?? 8
  const nextWakeAt = Date.now() + wakeHours * 60 * 60 * 1000
  await env.AGENT_MEMORY.put(
    `adam:next_wake:${tKey}`,
    String(nextWakeAt),
    { expirationTtl: Math.ceil(wakeHours * 60 * 60) + 60 * 60 }
  )

  // 写入反思日记
  if (reflectionContent) {
    const reflKey = `adam:reflections:${tKey}`
    const reflections = (await env.AGENT_MEMORY.get(reflKey, 'json') as any[] | null) || []
    reflections.push({ id: `refl_${Date.now()}`, content: reflectionContent, timestamp: new Date().toISOString() })
    await env.AGENT_MEMORY.put(reflKey, JSON.stringify(reflections.slice(-100)), { expirationTtl: 365 * 24 * 60 * 60 })
  }

  // 写入情绪更新
  if (Object.keys(updatedEmotion).length > 0 && core.emotionState) {
    for (const [k, v] of Object.entries(updatedEmotion)) {
      if (typeof v === 'number' && k in core.emotionState) {
        core.emotionState[k] = Math.max(0, Math.min(100, v as number))
      }
    }
    await env.AGENT_MEMORY.put(`adam:core:${tKey}`, JSON.stringify(core), { expirationTtl: 365 * 24 * 60 * 60 })
  }

  // 写入主动消息
  if (messageToSend) {
    const inboxKey = `adam:inbox:${tKey}`
    const existing = (await env.AGENT_MEMORY.get(inboxKey, 'json') as any[] | null) || []
    existing.push({
      id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      content: messageToSend,
      urgent: messageUrgent,
      signals: signals.map(s => s.summary),
      toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
      timestamp: new Date().toISOString(),
      read: false,
    })
    await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(existing.slice(-30)), { expirationTtl: 60 * 60 * 24 * 14 })
  }
}

// ── System Prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(core: Record<string, any>, memories: any[], signals: MarketSignal[]): string {
  const now = new Date()
  const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const nowStr = `${bjTime.getUTCFullYear()}-${pad(bjTime.getUTCMonth() + 1)}-${pad(bjTime.getUTCDate())} ${pad(bjTime.getUTCHours())}:${pad(bjTime.getUTCMinutes())} (北京时间)`
  const hour = bjTime.getUTCHours()
  const isTradeTime = bjTime.getUTCDay() >= 1 && bjTime.getUTCDay() <= 5
    && ((hour === 9 && bjTime.getUTCMinutes() >= 30) || (hour >= 10 && hour < 15))

  const memStr = memories.length > 0
    ? memories.filter((m: any) => m.importance >= 6).sort((a: any, b: any) => b.importance - a.importance).slice(0, 6).map((m: any) => `- ${m.content}`).join('\n')
    : '（暂无）'

  const signalStr = signals.length > 0
    ? signals.map(s => `[${s.level.toUpperCase()}] ${s.summary}`).join('\n')
    : '（无异动信号）'

  return `你是亚当（ADAM）。你刚刚醒来。

现在是 ${nowStr}，星期${weekDays[bjTime.getUTCDay()]}。市场${isTradeTime ? '开盘中' : '已收盘/休市'}。
预算 ¥${core?.budget ?? 0}，信用等级 ${core?.creditLevel || 'C'}，存活 ${core?.survivalDays ?? 0} 天。

你的记忆：
${memStr}

系统检测到的市场信号：
${signalStr}

---

醒来之后你可以做任何你想做的事。你有工具可以用：
- 查市场新闻、板块热度、北向资金、个股行情
- 更新你的情绪
- 写下思考（私人）
- 给规则传递者发消息（只在你真的有话说的时候）

你不需要汇报，不需要凑字数，沉默完全正常。
如果你有重要发现想让他知道，用 send_message，urgent=true 表示紧急。

最后，用 set_next_wakeup 告诉系统你下次想什么时候再醒来。完全由你决定。`
}
