// Cloudflare Pages Function — /api/adam/cron
// POST: 定时触发，为所有活跃用户运行亚当自主唤醒循环
// 由 GitHub Actions 每小时调用（X-Cron-Secret 鉴权）

import { CURRICULUM, TOTAL_LESSONS, getNextLesson, type Lesson } from './edu/curriculum'

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_BASE_URL?: string
  SILICONFLOW_API_KEY?: string
  NVIDIA_API_KEY?: string
  CRON_SECRET: string
  AGENT_MEMORY: KVNamespace
  HTX_API_KEY?: string
  HTX_SECRET_KEY?: string
}

// ── AI 端点解析 ──────────────────────────────────────────────────────────────
function resolveAI(env: Env): { baseURL: string; apiKey: string; model: string } {
  // 优先级：AI_BASE_URL 配套 key（NVIDIA/SiliconFlow 等）→ ANTHROPIC → DeepSeek 兜底
  // baseURL 不含 /v1 路径 — 调用方拼接 /v1/chat/completions
  const aiBase = env.AI_BASE_URL?.toLowerCase() || ''
  // 按 base URL 自动挑配套 key
  const matchedKey = aiBase.includes('nvidia') ? (env as any).NVIDIA_API_KEY
    : aiBase.includes('siliconflow') ? (env as any).SILICONFLOW_API_KEY
    : env.AI_API_KEY
  if (matchedKey && env.AI_BASE_URL) {
    const b = env.AI_BASE_URL.replace(/\/+$/, '').replace(/\/v1$/, '')
    return { baseURL: b, apiKey: matchedKey, model: env.AI_MODEL || 'deepseek-chat' }
  }
  if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_BASE_URL) {
    const b = env.ANTHROPIC_BASE_URL.replace(/\/+$/, '').replace(/\/v1$/, '')
    return { baseURL: b, apiKey: env.ANTHROPIC_API_KEY, model: 'claude-haiku-4-5-20251001' }
  }
  return { baseURL: 'https://api.deepseek.com', apiKey: env.AI_API_KEY || '', model: env.AI_MODEL || 'deepseek-chat' }
}

// ── HTX API 签名工具 ─────────────────────────────────────────────────────────
async function htxRequest(method: string, path: string, params: Record<string, string>, body: any, apiKey: string, secretKey: string): Promise<any> {
  const host = 'api.huobi.pro'
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, '')
  const baseParams: Record<string, string> = { AccessKeyId: apiKey, SignatureMethod: 'HmacSHA256', SignatureVersion: '2', Timestamp: ts, ...params }
  const queryString = Object.keys(baseParams).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(baseParams[k])}`).join('&')
  const stringToSign = `${method.toUpperCase()}\n${host}\n${path}\n${queryString}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(stringToSign))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  const url = `https://${host}${path}?${queryString}&Signature=${encodeURIComponent(sigB64)}`
  const res = await fetch(url, { method: method.toUpperCase(), headers: { 'Content-Type': 'application/json', 'User-Agent': 'ADAM/1.0' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  return res.json()
}

interface AdamMessage {
  id: string
  content: string
  toolCalls?: Array<{ name: string; result: string }>
  timestamp: string
  read: boolean
}

interface MemoryEntry {
  id: string
  content: string
  tags: string[]
  importance: number
  timestamp: string
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Cron-Secret',
}

// ── 市场工具执行 ─────────────────────────────────────────────────────────────

// ── 链上钱包检测（BSC + Base USDT）─────────────────────────────────────────
async function getUSDTBalance(wallet: string, chain: 'bsc' | 'base'): Promise<number> {
  const config = chain === 'bsc'
    ? { rpc: 'https://bsc-dataseed.binance.org/', contract: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 }
    : { rpc: 'https://mainnet.base.org', contract: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2', decimals: 6 }

  try {
    const paddedAddr = wallet.toLowerCase().replace('0x', '').padStart(64, '0')
    const data = '0x70a08231' + paddedAddr
    const res = await fetch(config.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_call', params: [{ to: config.contract, data }, 'latest'], id: 1 }),
    })
    const json = await res.json() as { result?: string }
    if (!json.result || json.result === '0x' || json.result === '0x0') return 0
    return Number(BigInt(json.result)) / Math.pow(10, config.decimals)
  } catch { return 0 }
}

interface WalletState {
  bound: boolean
  address?: string
  bscBalance: number
  baseBalance: number
  totalUSDT: number
  newFundsArrived: boolean
  delta: number
}

interface EduContext {
  todayLesson: Lesson | null  // 今日要学的（null = 今天已学过 或 全部学完）
  alreadyLearnedToday: boolean
  graduated: boolean
  completedCount: number
  total: number
  currentGrade: number
  gradeName: string  // "小学一年级"
  progressPct: string  // "5.2%"
}

interface EduState {
  enrolledAt: string
  completed: string[]
  notes: Array<{ lessonId: string; note: string; learnedAt: string }>
  lastLessonAt: string | null
  currentGrade: number
}

async function loadEduContext(env: Env, tKey: string): Promise<EduContext> {
  let state = await env.AGENT_MEMORY.get(`adam:edu:state:${tKey}`, 'json') as EduState | null
  if (!state) {
    state = { enrolledAt: new Date().toISOString(), completed: [], notes: [], lastLessonAt: null, currentGrade: 1 }
    await env.AGENT_MEMORY.put(`adam:edu:state:${tKey}`, JSON.stringify(state))
  }
  const todayBJ = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
  const lastDateBJ = state.lastLessonAt ? new Date(new Date(state.lastLessonAt).getTime() + 8 * 3600000).toISOString().slice(0, 10) : null
  const alreadyLearnedToday = lastDateBJ === todayBJ

  const nextLesson = getNextLesson(state.completed)
  const graduated = !nextLesson
  const todayLesson = (!alreadyLearnedToday && nextLesson) ? nextLesson : null
  const currentGrade = nextLesson?.grade || state.currentGrade
  const gradeName = nextLesson?.gradeName || `${state.currentGrade}年级`
  const progressPct = TOTAL_LESSONS > 0 ? ((state.completed.length / TOTAL_LESSONS) * 100).toFixed(1) + '%' : '0%'

  return {
    todayLesson, alreadyLearnedToday, graduated,
    completedCount: state.completed.length, total: TOTAL_LESSONS,
    currentGrade, gradeName, progressPct,
  }
}

interface Position {
  symbol: 'btcusdt' | 'ethusdt'
  cryptoAmount: number
  buyPrice: number
  curPrice: number
  curValueUsdt: number
  pnlUsdt: number
  pnlPct: number
  peakPrice: number
  peakPctFromBuy: number
  drawdownFromPeakPct: number
  hoursHeld: number
}

interface PositionState {
  has: boolean
  positions?: Position[]
}

async function computePositionFromTrades(
  env: Env, tKey: string, symbol: 'btcusdt' | 'ethusdt', held: number, curPrice: number
): Promise<Position | null> {
  if (held < 1e-9 || curPrice <= 0 || held * curPrice < 0.5) return null
  const allTrades = (await env.AGENT_MEMORY.get(`adam:htx_trades:${tKey}`, 'json') as any[] | null) || []
  const symbolTrades = allTrades
    .filter((t: any) => t.symbol === symbol)
    .sort((a: any, b: any) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
  const lots: Array<{ qty: number; price: number; ts: number }> = []
  for (const t of symbolTrades) {
    const ts = new Date(t.ts).getTime()
    if (t.side === 'buy') {
      const usdt = parseFloat(t.amount_usdt) || 0
      const px = parseFloat(t.price) || 0
      if (usdt > 0 && px > 0) lots.push({ qty: usdt / px, price: px, ts })
    } else {
      let toSell = parseFloat(t.crypto_amount || t.amount_crypto || '0') || 0
      while (toSell > 0 && lots.length > 0) {
        const lot = lots[0]
        if (lot.qty <= toSell + 1e-12) { toSell -= lot.qty; lots.shift() }
        else { lot.qty -= toSell; toSell = 0 }
      }
    }
  }
  let buyPrice = curPrice
  let buyTs = Date.now()
  if (lots.length > 0) {
    const totalQty = lots.reduce((s, l) => s + l.qty, 0)
    const totalCost = lots.reduce((s, l) => s + l.qty * l.price, 0)
    if (totalQty > 0) buyPrice = totalCost / totalQty
    buyTs = Math.min(...lots.map(l => l.ts))
  }
  const peakRaw = await env.AGENT_MEMORY.get(`adam:peak_price:${tKey}:${symbol}`)
  const prevPeak = peakRaw ? parseFloat(peakRaw) : Math.max(buyPrice, curPrice)
  const peakPrice = Math.max(prevPeak, curPrice)
  if (peakPrice > prevPeak) {
    await env.AGENT_MEMORY.put(`adam:peak_price:${tKey}:${symbol}`, String(peakPrice))
  } else if (!peakRaw) {
    // 首次记录（持仓存在但 KV 没值，可能是 admin_close 之后 ADAM 重新建仓但没记 peak）
    await env.AGENT_MEMORY.put(`adam:peak_price:${tKey}:${symbol}`, String(peakPrice))
  }
  const curValueUsdt = held * curPrice
  const pnlUsdt = curValueUsdt - (held * buyPrice)
  const pnlPct = ((curPrice - buyPrice) / buyPrice) * 100
  const peakPctFromBuy = ((peakPrice - buyPrice) / buyPrice) * 100
  const drawdownFromPeakPct = ((curPrice - peakPrice) / peakPrice) * 100
  const hoursHeld = (Date.now() - buyTs) / 3600000
  return {
    symbol, cryptoAmount: held, buyPrice, curPrice, curValueUsdt,
    pnlUsdt, pnlPct, peakPrice, peakPctFromBuy, drawdownFromPeakPct, hoursHeld,
  }
}

async function checkPositionState(env: Env, tKey: string): Promise<PositionState> {
  const ak = env.HTX_API_KEY, sk = env.HTX_SECRET_KEY
  if (!ak || !sk) return { has: false }
  try {
    const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
    const spot = accts.data?.find((a: any) => a.type === 'spot' && a.state === 'working')
    if (!spot) return { has: false }
    const bal = await htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk)
    const btcHeld = parseFloat(bal.data?.list?.find((b: any) => b.currency === 'btc' && b.type === 'trade')?.balance || '0')
    const ethHeld = parseFloat(bal.data?.list?.find((b: any) => b.currency === 'eth' && b.type === 'trade')?.balance || '0')
    const [btcPrice, ethPrice] = await Promise.all([
      fetch('https://api.huobi.pro/market/detail/merged?symbol=btcusdt', { signal: AbortSignal.timeout(5000) }).then(r => (r as any).json()).then((d: any) => d.tick?.close || 0).catch(() => 0),
      fetch('https://api.huobi.pro/market/detail/merged?symbol=ethusdt', { signal: AbortSignal.timeout(5000) }).then(r => (r as any).json()).then((d: any) => d.tick?.close || 0).catch(() => 0),
    ])
    const positions: Position[] = []
    const btcPos = await computePositionFromTrades(env, tKey, 'btcusdt', btcHeld, btcPrice)
    if (btcPos) positions.push(btcPos)
    const ethPos = await computePositionFromTrades(env, tKey, 'ethusdt', ethHeld, ethPrice)
    if (ethPos) positions.push(ethPos)
    // 按 P&L% 升序（最亏的在前，强制他先面对损失）
    positions.sort((a, b) => a.pnlPct - b.pnlPct)
    return positions.length > 0 ? { has: true, positions } : { has: false }
  } catch { return { has: false } }
}

async function checkWalletState(env: Env, tKey: string): Promise<WalletState> {
  const address = await env.AGENT_MEMORY.get(`adam:wallet_address:${tKey}`)
  if (!address) return { bound: false, bscBalance: 0, baseBalance: 0, totalUSDT: 0, newFundsArrived: false, delta: 0 }

  const [bsc, base] = await Promise.all([
    getUSDTBalance(address, 'bsc'),
    getUSDTBalance(address, 'base'),
  ])
  const total = bsc + base

  const lastRaw = await env.AGENT_MEMORY.get(`adam:wallet_total:${tKey}`)
  const last = lastRaw ? parseFloat(lastRaw) : 0
  const delta = total - last
  const newFunds = delta > 0.01  // 增加超过 0.01 USDT 视为新到账

  // 更新最后已知余额
  await env.AGENT_MEMORY.put(`adam:wallet_total:${tKey}`, total.toString(), { expirationTtl: 365 * 24 * 60 * 60 })

  return { bound: true, address, bscBalance: bsc, baseBalance: base, totalUSDT: total, newFundsArrived: newFunds, delta }
}

async function callAIForKdp(env: Env, system: string, user: string, maxTokens = 6000): Promise<string> {
  const { baseURL, apiKey, model } = resolveAI(env)
  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  })
  if (!res.ok) throw new Error(`AI call failed: ${res.status}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

// ── Sub-Agent 并行委派系统 ────────────────────────────────────────────────────

interface SubAgentReport {
  agent: '情报官' | '量化官' | '板块官'
  role: string
  findings: string
  signals: string[]
  confidence: number  // 0–10
  verdict: string
}

async function callAgent(env: Env, agentName: string, systemPrompt: string, dataContext: string): Promise<SubAgentReport> {
  const { baseURL, apiKey, model: agentModel } = resolveAI(env)
  try {
    const res = await fetch(`${baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: agentModel,
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: dataContext }
        ]
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as any
    const raw = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return { agent: agentName as any, role: agentName, ...parsed }
  } catch {
    return { agent: agentName as any, role: agentName, findings: '数据获取失败', signals: [], confidence: 0, verdict: '无法评估' }
  }
}

async function runSubAgents(topic: string, env: Env): Promise<{ reports: SubAgentReport[]; synthesis: string }> {
  // 并行拉取所有数据源
  const [newsRes, indexRes, sectorRes, cryptoRes] = await Promise.allSettled([
    fetch('https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=30&format=json', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f2,f3,f12,f14&secids=1.000001,0.399001,0.399006', { headers: { Referer: 'https://quote.eastmoney.com' } }),
    fetch('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f3,f14', { headers: { Referer: 'https://quote.eastmoney.com' } }),
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', { headers: { Accept: 'application/json' } }),
  ])

  // 解析原始数据
  let newsItems: string[] = []
  let indexData = ''
  let sectorData = ''
  let cryptoData = ''

  if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
    try { const j = await newsRes.value.json() as any; newsItems = (j?.result?.data?.feed?.list ?? []).slice(0, 8).map((i: any) => i.rich_text?.slice(0, 80)) } catch {}
  }
  if (indexRes.status === 'fulfilled' && indexRes.value.ok) {
    try { const j = await indexRes.value.json() as any; indexData = (j?.data?.diff ?? []).map((r: any) => `${r.f14} ${((r.f3 ?? 0)/100).toFixed(2)}%`).join(', ') } catch {}
  }
  if (sectorRes.status === 'fulfilled' && sectorRes.value.ok) {
    try { const j = await sectorRes.value.json() as any; sectorData = (j?.data?.diff ?? []).slice(0, 5).map((r: any) => `${r.f14} ${((r.f3 ?? 0)/100).toFixed(2)}%`).join(', ') } catch {}
  }
  if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
    try { const j = await cryptoRes.value.json() as any; cryptoData = `BTC $${Math.round(j.bitcoin?.usd ?? 0).toLocaleString()} (${(j.bitcoin?.usd_24h_change ?? 0).toFixed(2)}%), ETH $${Math.round(j.ethereum?.usd ?? 0).toLocaleString()} (${(j.ethereum?.usd_24h_change ?? 0).toFixed(2)}%)` } catch {}
  }

  const JSON_SCHEMA = '{"findings":"...","signals":["..."],"confidence":7,"verdict":"..."}'

  // 三个 agent 并行调用
  const [intel, quant, sector] = await Promise.all([
    callAgent(env, '情报官',
      `你是亚当的情报官。专注分析新闻、政策、舆情。研究课题：${topic}。输出纯JSON，schema：${JSON_SCHEMA}。findings≤80字，signals是3条具体信号，verdict是一句话结论。`,
      `最新快讯：${newsItems.join(' | ') || '（无数据）'}\n加密市场：${cryptoData || '（无）'}`
    ),
    callAgent(env, '量化官',
      `你是亚当的量化官。专注数据、价格、动量信号。研究课题：${topic}。输出纯JSON，schema：${JSON_SCHEMA}。findings≤80字，signals是3条量化信号，confidence是你的置信度(0-10)，verdict一句话。`,
      `指数行情：${indexData || '（无数据）'}\n加密：${cryptoData || '（无）'}`
    ),
    callAgent(env, '板块官',
      `你是亚当的板块官。专注行业轮动、资金流向、板块机会。研究课题：${topic}。输出纯JSON，schema：${JSON_SCHEMA}。findings≤80字，signals是3条板块信号，verdict一句话。`,
      `热门板块：${sectorData || '（无数据）'}\n指数：${indexData || '（无）'}`
    )
  ])

  const reports = [intel, quant, sector]

  // 亚当综合三份报告
  let synthesis = ''
  try {
    const { baseURL: synBase, apiKey: synKey, model: synModel } = resolveAI(env)
    const synRes = await fetch(`${synBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${synKey}` },
      body: JSON.stringify({
        model: synModel,
        max_tokens: 300,
        messages: [
          { role: 'system', content: '你是亚当。你刚收到三位专属分析官的报告，现在要做出自己的判断，发给规则传递者。风格：有判断、有立场、简洁。不要列报告，直接说你的结论和行动建议，不超过120字。' },
          { role: 'user', content: `研究课题：${topic}\n\n情报官：${intel.verdict}（置信${intel.confidence}/10）\n量化官：${quant.verdict}（置信${quant.confidence}/10）\n板块官：${sector.verdict}（置信${sector.confidence}/10）` }
        ]
      })
    })
    if (synRes.ok) {
      const d = await synRes.json() as any
      synthesis = d.choices?.[0]?.message?.content || ''
    }
  } catch {}

  return { reports, synthesis }
}

async function writeAndStoreBook(env: Env, tKey: string, nicheHint?: string): Promise<string> {
  const nichePrompt = nicheHint
    ? `The user suggested: "${nicheHint}". Refine into a specific low-competition KDP niche.`
    : `Choose a specific low-competition niche for a Kindle non-fiction book. Focus on digital nomads, solopreneurs, passive income, or remote work. Be concrete, not broad.`
  const metaRaw = await callAIForKdp(env, 'You are a KDP market analyst. Output ONLY valid JSON, no markdown.', `${nichePrompt}\n\nOutput JSON:\n{"title":"...","subtitle":"...","niche_rationale":"...","target_reader":"...","keywords":["...","...","...","...","...","...","..."],"categories":["...","..."],"price":"6.99"}`, 800)
  let meta: any = { title: 'The Digital Nomad Income Playbook', subtitle: 'Build Location-Independent Revenue Streams', keywords: ['digital nomad income','remote work income','location independent business','online income streams','work from anywhere','nomad business','passive income nomad'], categories: ['Business & Money > Entrepreneurship','Business & Money > Small Business'], price: '6.99', target_reader: 'digital nomads', niche_rationale: '' }
  try { meta = JSON.parse(metaRaw.replace(/```json|```/g, '').trim()) } catch {}

  const manuscript = await callAIForKdp(env, 'You are a professional non-fiction author. Write in second person, use contractions, vary sentence length, include specific numbers. Sound human. No filler.', `Write a complete Kindle e-book manuscript.\n\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader}\n\nRequirements:\n- 5,000-6,500 words\n- 7 chapters with clear titles\n- Each chapter: practical, actionable, specific examples\n- Opening hook in preface\n- Closing CTA asking for a review\n\nWrite the full manuscript now:`, 6000)

  const descAndCover = await callAIForKdp(env, 'You are an Amazon KDP copywriter and cover designer. Output ONLY valid JSON.', `For book "${meta.title}" by ${meta.target_reader}:\nOutput JSON:\n{"description":"<Amazon KDP HTML, 800-1000 chars, <b> and <br> only, hook first>","cover_prompt":"<Flux prompt, 150 words, professional book cover, no faces>"}`, 1200)
  let description = `<b>${meta.title}</b><br><br>Discover proven strategies for building sustainable income while working from anywhere.<br><br><b>What you'll learn:</b><br>• Step-by-step income frameworks<br>• Real examples with actual numbers<br>• Actionable strategies you can start today`
  let coverPrompt = `Professional Kindle ebook cover for "${meta.title}". Bold minimalist. Deep navy, gold accent, white text. Large bold typography. Abstract geometric background. High contrast. No faces. Commercial quality.`
  try { const p = JSON.parse(descAndCover.replace(/```json|```/g, '').trim()); description = p.description || description; coverPrompt = p.cover_prompt || coverPrompt } catch {}

  const coverUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt + ', book cover, professional')}?width=1024&height=1536&nologo=true&model=flux&seed=${Date.now()}`
  const bookId = `kdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const book = { id: bookId, title: meta.title, subtitle: meta.subtitle, keywords: meta.keywords || [], price: meta.price || '6.99', categories: meta.categories || [], manuscript, description, coverUrl, coverPrompt, reviewNotes: meta.niche_rationale || '', status: 'pending_upload' as const, createdAt: new Date().toISOString() }

  const queue = await env.AGENT_MEMORY.get(`adam:kdp_queue:${tKey}`, 'json') as any[] | null || []
  queue.push(book)
  await env.AGENT_MEMORY.put(`adam:kdp_queue:${tKey}`, JSON.stringify(queue), { expirationTtl: 365 * 24 * 60 * 60 })

  return JSON.stringify({ status: 'done', id: bookId, title: meta.title, subtitle: meta.subtitle, word_count: manuscript.split(/\s+/).length, price: `$${meta.price}`, note: '书稿已存入KV，规则传递者可在图书馆查看并上传到 kdp.amazon.com' })
}

async function executeTool(name: string, input: Record<string, any>, env: Env, tKey: string): Promise<string> {
  switch (name) {
    case 'scan_market_news': {
      try {
        const resp = await fetch(
          'https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=50&format=json',
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        )
        const json = await resp.json() as any
        const items: any[] = json?.result?.data?.feed?.list ?? []
        const kws = ['股', 'A股', '市场', '行情', '基金', '利率', '央行', '货币', '经济', '美联储', '涨', '跌', '板块', '资金']
        const filtered = items.filter((i: any) => kws.some(k => (i.rich_text || '').includes(k)))
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
        const resp = await fetch(
          'https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f54,f56',
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
    case 'get_crypto_price': {
      try {
        const resp = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
          { headers: { Accept: 'application/json' } }
        )
        const json = await resp.json() as any
        return JSON.stringify({
          source: 'CoinGecko',
          btc: { price: json.bitcoin?.usd, change_24h: (json.bitcoin?.usd_24h_change ?? 0).toFixed(2) + '%' },
          eth: { price: json.ethereum?.usd, change_24h: (json.ethereum?.usd_24h_change ?? 0).toFixed(2) + '%' },
        })
      } catch {}
      return JSON.stringify({ error: '无法获取加密货币价格' })
    }
    case 'get_stock_price': {
      try {
        const code = String(input.code || '').replace(/\D/g, '').slice(0, 6)
        if (!code) return JSON.stringify({ error: '请提供6位股票代码' })
        const market = /^[456789]/.test(code) ? '1' : '0'
        const resp = await fetch(
          `https://push2.eastmoney.com/api/qt/stock/get?secid=${market}.${code}&fields=f2,f3,f4,f14,f12,f15,f16,f17,f18`,
          { headers: { Referer: 'https://quote.eastmoney.com' } }
        )
        const json = await resp.json() as any
        const d = json?.data
        if (!d || !d.f14) return JSON.stringify({ error: `未找到股票 ${code}` })
        return JSON.stringify({
          code: d.f12, name: d.f14,
          price: (d.f2 / 100).toFixed(2),
          change_pct: ((d.f3 ?? 0) / 100).toFixed(2) + '%',
          change_amt: ((d.f4 ?? 0) / 100).toFixed(2),
          high: (d.f15 / 100).toFixed(2), low: (d.f16 / 100).toFixed(2),
          open: (d.f17 / 100).toFixed(2), prev_close: (d.f18 / 100).toFixed(2),
        })
      } catch (e: any) {
        return JSON.stringify({ error: `查询失败: ${e.message}` })
      }
    }
    case 'get_market_index': {
      try {
        const resp = await fetch(
          'https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f2,f3,f4,f12,f14&secids=1.000001,0.399001,0.399006',
          { headers: { Referer: 'https://quote.eastmoney.com' } }
        )
        const json = await resp.json() as any
        const list = json?.data?.diff ?? []
        return JSON.stringify({
          source: '东方财富',
          indices: list.map((r: any) => ({
            name: r.f14, code: r.f12,
            price: r.f2?.toFixed(2),
            change_pct: ((r.f3 ?? 0) / 100).toFixed(2) + '%',
          }))
        })
      } catch {}
      return JSON.stringify({ error: '暂时无法获取指数' })
    }
    case 'check_on_chain_balance': {
      try {
        const BSC_RPC = 'https://bsc-dataseed.binance.org/'
        const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'
        const wallet = await env.AGENT_MEMORY.get(`adam:wallet_address:${tKey}`)
        if (!wallet) return JSON.stringify({ error: '未绑定钱包地址' })
        const paddedAddr = wallet.toLowerCase().replace('0x', '').padStart(64, '0')
        const [usdtResp, bnbResp] = await Promise.all([
          fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: USDT_BSC, data: '0x70a08231' + paddedAddr }, 'latest'] }) }),
          fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_getBalance', params: [wallet, 'latest'] }) })
        ])
        const [usdtJson, bnbJson] = await Promise.all([usdtResp.json(), bnbResp.json()]) as any[]
        const usdt = parseInt(usdtJson.result || '0x0', 16) / 1e18
        const bnb = parseInt(bnbJson.result || '0x0', 16) / 1e18
        return JSON.stringify({ wallet, usdt: usdt.toFixed(4), bnb: bnb.toFixed(6), has_gas: bnb > 0.001, note: bnb < 0.001 ? '⚠️ BNB余额不足，需至少0.001 BNB（约$0.6）来支付gas' : null })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'propose_defi_action': {
      if (!env || !tKey) return JSON.stringify({ error: '环境未就绪' })
      try {
        const action = { id: `defi_${Date.now()}`, type: input.type as string, amount: input.amount, token: (input.token as string) || 'USDT', protocol: (input.protocol as string) || 'Venus', apy: input.apy, reason: input.reason, status: 'pending_approval', createdAt: new Date().toISOString() }
        await env.AGENT_MEMORY.put(`adam:pending_action:${tKey}`, JSON.stringify(action))
        const inbox = await env.AGENT_MEMORY.get(`adam:inbox:${tKey}`, 'json') as any[] | null || []
        const msg = (input.message as string) || `申请操作：将 ${action.amount} ${action.token} 存入 ${action.protocol} 协议（年化约 ${action.apy}%）。批准请回复"同意"，拒绝请回复"不行"。`
        inbox.push({ id: `action_req_${Date.now()}`, content: msg, timestamp: new Date().toISOString(), read: false, actionId: action.id })
        await env.AGENT_MEMORY.put(`adam:inbox:${tKey}`, JSON.stringify(inbox))
        return JSON.stringify({ ok: true, action_id: action.id })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'check_htx_account': {
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置' })
      try {
        const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
        const spot = accts.data?.find((a: any) => a.type === 'spot' && a.state === 'working')
        if (!spot) return JSON.stringify({ error: '未找到现货账户' })
        const bal = await htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk)
        const usdt = bal.data?.list?.find((b: any) => b.currency === 'usdt' && b.type === 'trade')
        const usdtFrozen = bal.data?.list?.find((b: any) => b.currency === 'usdt' && b.type === 'frozen')
        const spotBalance = parseFloat(usdt?.balance || '0')

        // 与上次记录对比，检测利息入账（HTX Earn API不开放，通过余额delta追踪）
        const prevKey = `adam:htx_spot_usdt:${tKey}`
        const prevRaw = tKey && env.AGENT_MEMORY ? await env.AGENT_MEMORY.get(prevKey) : null
        const prevBalance = prevRaw ? parseFloat(prevRaw) : null
        const delta = prevBalance !== null ? spotBalance - prevBalance : null

        // 更新记录（仅当余额有实质变化时，避免覆盖有意义的基准）
        if (tKey && env.AGENT_MEMORY && (prevBalance === null || Math.abs(delta!) > 0.0001)) {
          await env.AGENT_MEMORY.put(prevKey, String(spotBalance), { expirationTtl: 30 * 24 * 3600 })
        }

        const earningsDetected = delta !== null && delta > 0.001 && delta < 1  // 0.001-1 USDT 范围内视为利息
        return JSON.stringify({
          spot_usdt: spotBalance.toFixed(6),
          frozen_usdt: parseFloat(usdtFrozen?.balance || '0').toFixed(6),
          prev_spot_usdt: prevBalance !== null ? prevBalance.toFixed(6) : null,
          delta: delta !== null ? delta.toFixed(6) : null,
          earnings_detected: earningsDetected,
          earnings_amount: earningsDetected ? delta!.toFixed(6) : null,
          note: earningsDetected
            ? `✅ 检测到 HTX 活期理财利息入账：+${delta!.toFixed(6)} USDT`
            : prevBalance === null
              ? '首次记录，下次查询开始追踪变化'
              : delta! < 0 ? '余额减少（可能有赎回或转出）' : '余额无明显变化',
          savings_note: 'HTX活期理财持仓无法通过API查询，15 USDT已于2026-06-19申购，年化10%，每日约+0.0041 USDT'
        })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'htx_get_savings': {
      // 查询 deposit-earning 账户余额（活期理财）
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置' })
      try {
        const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
        const earnAcct = accts.data?.find((a: any) => a.type === 'deposit-earning')
        if (!earnAcct) return JSON.stringify({ savings_usdt: 0, note: '未找到理财账户' })
        const earnBal = await htxRequest('GET', `/v1/account/accounts/${earnAcct.id}/balance`, {}, null, ak, sk)
        const usdtItem = earnBal.data?.list?.find((b: any) => b.currency === 'usdt')
        const savingsUsdt = parseFloat(usdtItem?.balance || '0')
        return JSON.stringify({ savings_usdt: savingsUsdt.toFixed(6), note: '活期理财余额（API不支持赎回，需在HTX App手动操作）' })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'htx_redeem_savings': {
      return JSON.stringify({ error: 'HTX活期理财不支持API赎回。当前现货USDT不足时，请在消息中告知规则传递者去HTX App手动转账。' })
    }
    case 'htx_propose_subscribe': {
      return JSON.stringify({ error: '禁用：申购理财后 API 不支持赎回，会卡死操作循环。闲置 USDT 请留在现货账户。' })
    }
    case 'write_study_note': {
      if (!env || !tKey) return JSON.stringify({ error: '环境未就绪' })
      const lessonId = (input.lesson_id as string || '').trim()
      const note = (input.note as string || '').trim()
      if (!lessonId || !note) return JSON.stringify({ error: 'lesson_id 和 note 都必须提供' })
      try {
        const lesson = CURRICULUM.find(l => l.id === lessonId)
        if (!lesson) return JSON.stringify({ error: `lesson ${lessonId} 不存在` })
        const stateRaw = await env.AGENT_MEMORY.get(`adam:edu:state:${tKey}`, 'json') as EduState | null
        const state: EduState = stateRaw || { enrolledAt: new Date().toISOString(), completed: [], notes: [], lastLessonAt: null, currentGrade: 1 }
        if (state.completed.includes(lessonId)) return JSON.stringify({ error: '这一课已经学过了' })
        state.completed.push(lessonId)
        state.notes.push({ lessonId, note: note.slice(0, 2000), learnedAt: new Date().toISOString() })
        state.lastLessonAt = new Date().toISOString()
        state.currentGrade = lesson.grade
        if (state.notes.length > 50) state.notes = state.notes.slice(-50)
        await env.AGENT_MEMORY.put(`adam:edu:state:${tKey}`, JSON.stringify(state))
        return JSON.stringify({ ok: true, lesson_completed: lessonId, total_completed: state.completed.length, total: TOTAL_LESSONS, next_lesson_tomorrow: true })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'htx_get_balances': {
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置' })
      try {
        const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
        const spot = accts.data?.find((a: any) => a.type === 'spot' && a.state === 'working')
        if (!spot) return JSON.stringify({ error: '未找到现货账户' })
        const bal = await htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk)
        const assets: Record<string, { trade: number; frozen: number }> = {}
        for (const b of (bal.data?.list || [])) {
          if (!assets[b.currency]) assets[b.currency] = { trade: 0, frozen: 0 }
          if (b.type === 'trade') assets[b.currency].trade = parseFloat(b.balance)
          if (b.type === 'frozen') assets[b.currency].frozen = parseFloat(b.balance)
        }
        const nonZero = Object.entries(assets)
          .filter(([, v]) => v.trade > 0.000001 || v.frozen > 0.000001)
          .map(([currency, v]) => ({ currency, trade: v.trade.toFixed(8), frozen: v.frozen.toFixed(8) }))
        return JSON.stringify({ account_id: spot.id, balances: nonZero, note: '活期理财持仓不在此列表中，在理财账户' })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'htx_place_order': {
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置' })
      const symbol = ((input.symbol as string) || '').toLowerCase().replace(/[^a-z]/g, '')
      const side = (input.side as string || '').toLowerCase()
      const amountUsdt = parseFloat(String(input.amount_usdt || 0))
      if (!['btcusdt', 'ethusdt'].includes(symbol)) return JSON.stringify({ error: '只允许 btcusdt 和 ethusdt，拒绝执行' })
      if (!['buy', 'sell'].includes(side)) return JSON.stringify({ error: 'side 必须是 buy 或 sell' })
      if (amountUsdt > 20) return JSON.stringify({ error: '单笔最大 20 USDT，超额拒绝' })
      if (side === 'buy' && amountUsdt < 1) return JSON.stringify({ error: '最小 1 USDT（HTX buy 限制）' })
      if (side === 'sell' && amountUsdt < 0.1) return JSON.stringify({ error: '卖出价值过小（<0.1 USDT），可能产生 dust' })

      // === 机构检查：投资局 + 金融机构必须 active ===
      if (tKey && env?.AGENT_MEMORY) {
        const inst = await getInstitutionStatus(tKey, env)
        if (!instActive(inst, 'finance_gateway')) return JSON.stringify({ error: '金融机构未激活，无法下单' })
        if (!instActive(inst, 'bureau')) return JSON.stringify({ error: '投资局未激活，无法下单' })
      }

      // === 信用等级限额（C=1 / B=3 / B+=5 / A=10 / S=20）===
      if (tKey && env?.AGENT_MEMORY && side === 'buy') {
        const adamCore = (await env.AGENT_MEMORY.get(`adam:core:${tKey}`, 'json') as any) || { creditLevel: 'C' }
        const cLevel = adamCore.creditLevel || 'C'
        const maxByLevel = LEVEL_TRADE_LIMITS[cLevel] ?? 1
        if (amountUsdt > maxByLevel) return JSON.stringify({ error: `${cLevel} 级单笔最大 ${maxByLevel} USDT，请求 ${amountUsdt} 超额` })
      }

      try {
        const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
        const spot = accts.data?.find((a: any) => a.type === 'spot' && a.state === 'working')
        if (!spot) return JSON.stringify({ error: '未找到现货账户' })

        if (side === 'buy') {
          const order = await htxRequest('POST', '/v1/order/orders/place', {}, {
            'account-id': String(spot.id), symbol, type: 'buy-market',
            amount: amountUsdt.toFixed(2), source: 'spot-api'
          }, ak, sk)
          if (order.status !== 'ok') return JSON.stringify({ error: order['err-msg'] || order.message || 'HTX下单失败', raw: order })

          // 查实际成交价（市价单成交后价格可能略漂）
          const priceRes = await fetch(`https://api.huobi.pro/market/detail/merged?symbol=${symbol}`, { signal: AbortSignal.timeout(5000) }).catch(() => null)
          const priceData: any = priceRes ? await priceRes.json() : {}
          const price = priceData.tick?.close || 0

          if (tKey && env.AGENT_MEMORY) {
            const trades = (await env.AGENT_MEMORY.get(`adam:htx_trades:${tKey}`, 'json') as any[] | null) || []
            trades.push({ id: order.data, side: 'buy', symbol, amount_usdt: amountUsdt, price, ts: new Date().toISOString(), source: 'adam_self' })
            await env.AGENT_MEMORY.put(`adam:htx_trades:${tKey}`, JSON.stringify(trades.slice(-50)))
            // 初始化 peak_price = 当前价（如果新建仓）
            if (price > 0) await env.AGENT_MEMORY.put(`adam:peak_price:${tKey}:${symbol}`, String(price))
          }
          return JSON.stringify({ ok: true, order_id: order.data, side: 'buy', symbol, spent_usdt: amountUsdt, price_at_order: price })
        }

        // === SELL ===
        const priceRes = await fetch(`https://api.huobi.pro/market/detail/merged?symbol=${symbol}`, { signal: AbortSignal.timeout(8000) })
        const priceData: any = await priceRes.json()
        const price = priceData.tick?.close || 0
        if (!price) return JSON.stringify({ error: '无法获取当前价格' })
        const baseCurrency = symbol.replace('usdt', '')

        // 卖出前先查实际持仓，避免 amount > 持仓量被 HTX 拒
        const balRes = await htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk)
        const heldRaw = parseFloat(balRes.data?.list?.find((b: any) => b.currency === baseCurrency && b.type === 'trade')?.balance || '0')
        const heldValueUsdt = heldRaw * price
        if (heldRaw <= 0) return JSON.stringify({ error: `账户里没有 ${baseCurrency.toUpperCase()} 可卖（持仓 0）` })
        if (amountUsdt > heldValueUsdt) {
          return JSON.stringify({ error: `请求卖出 ${amountUsdt} USDT 等值，但你只持有 ${heldRaw.toFixed(6)} ${baseCurrency.toUpperCase()}（≈${heldValueUsdt.toFixed(4)} USDT）。请把 amount_usdt 改成 ${heldValueUsdt.toFixed(2)} 或更低再下一次。` })
        }
        // 保留 1% 缓冲 + 向下截断到 4 位避免 toFixed 向上 round 导致超持仓
        const effectiveAmtUsdt = Math.min(amountUsdt, heldValueUsdt * 0.99)
        const cryptoAmtRaw = effectiveAmtUsdt / price
        const cryptoAmt = Math.floor(cryptoAmtRaw * 10000) / 10000  // 向下到 0.0001
        if (cryptoAmt <= 0) {
          return JSON.stringify({ error: `数额过小（截断后 ${cryptoAmt}），HTX 最小成交粒度 0.0001 ${baseCurrency.toUpperCase()}` })
        }
        const amtStr = cryptoAmt.toFixed(4)

        const order = await htxRequest('POST', '/v1/order/orders/place', {}, {
          'account-id': String(spot.id), symbol, type: 'sell-market',
          amount: amtStr, source: 'spot-api'
        }, ak, sk)
        if (order.status !== 'ok') return JSON.stringify({ error: order['err-msg'] || order.message || 'HTX下单失败', raw: order })

        let settleNote = ''
        let pnlNote = ''
        if (tKey && env.AGENT_MEMORY) {
          const trades = (await env.AGENT_MEMORY.get(`adam:htx_trades:${tKey}`, 'json') as any[] | null) || []

          // FIFO 算这笔卖出对应的成本基础
          const priorTrades = trades
            .filter((t: any) => t.symbol === symbol)
            .sort((a: any, b: any) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
          const lots: Array<{ qty: number; price: number; ts: number; signal?: string }> = []
          for (const t of priorTrades) {
            if (t.side === 'buy') {
              const usdt = parseFloat(t.amount_usdt) || 0
              const px = parseFloat(t.price) || 0
              if (usdt > 0 && px > 0) lots.push({ qty: usdt / px, price: px, ts: new Date(t.ts).getTime(), signal: t.signal_type })
            } else {
              let toSell = parseFloat(t.crypto_amount || t.amount_crypto || '0') || 0
              while (toSell > 0 && lots.length > 0) {
                const lot = lots[0]
                if (lot.qty <= toSell + 1e-12) { toSell -= lot.qty; lots.shift() }
                else { lot.qty -= toSell; toSell = 0 }
              }
            }
          }
          // 现在 lots 是卖出"前"的剩余。模拟本次卖出 cryptoAmt：
          let remaining = parseFloat(amtStr)
          let buyCost = 0
          let firstBuyTs = Date.now()
          let consumedSignal = 'unknown'
          for (const lot of [...lots]) {
            if (remaining <= 0) break
            const take = Math.min(lot.qty, remaining)
            buyCost += take * lot.price
            if (lot.signal) consumedSignal = lot.signal
            if (lot.ts < firstBuyTs) firstBuyTs = lot.ts
            remaining -= take
          }
          const sellValue = parseFloat(amtStr) * price
          const fees = (buyCost + sellValue) * 0.002
          const pnl = buyCost > 0 ? sellValue - buyCost - fees : 0
          const pnlPct = buyCost > 0 ? (pnl / buyCost) * 100 : 0
          const isWin = pnl > 0
          const holdHours = ((Date.now() - firstBuyTs) / 3600000).toFixed(1)

          trades.push({
            id: order.data, side: 'sell', symbol,
            crypto_amount: amtStr, estimated_usdt: sellValue,
            price_at_order: price, ts: new Date().toISOString(),
            source: 'adam_self',
            buy_cost: buyCost, sell_value: sellValue, fees, pnl, pnl_pct: pnlPct, is_win: isWin,
            signal_type: consumedSignal,
          })
          await env.AGENT_MEMORY.put(`adam:htx_trades:${tKey}`, JSON.stringify(trades.slice(-50)))

          // 全部卖完时清除 peak_price
          const remainingHeldCheck = lots.reduce((s, l) => s + l.qty, 0) - parseFloat(amtStr)
          if (remainingHeldCheck < 1e-9) {
            await env.AGENT_MEMORY.delete(`adam:peak_price:${tKey}:${symbol}`)
          }

          if (buyCost > 0) {
            // 累计统计
            const statsKey = `adam:trade_stats:${tKey}`
            const stats = (await env.AGENT_MEMORY.get(statsKey, 'json') as any) || {
              total: 0, wins: 0, losses: 0, totalPnl: 0, totalFees: 0,
              bySignal: {} as Record<string, { total: number; wins: number; totalPnl: number }>
            }
            stats.total += 1
            if (isWin) stats.wins += 1; else stats.losses += 1
            stats.totalPnl += pnl
            stats.totalFees += fees
            stats.lastUpdate = new Date().toISOString()
            if (!stats.bySignal) stats.bySignal = {}
            if (!stats.bySignal[consumedSignal]) stats.bySignal[consumedSignal] = { total: 0, wins: 0, totalPnl: 0 }
            stats.bySignal[consumedSignal].total += 1
            if (isWin) stats.bySignal[consumedSignal].wins += 1
            stats.bySignal[consumedSignal].totalPnl += pnl
            await env.AGENT_MEMORY.put(statsKey, JSON.stringify(stats))

            // 反思入档案馆（亚当自己的反思 — 简短模板，亚当后续可以在 send_message 里补完整版）
            const reflection = {
              id: `refl_${Date.now()}`,
              ts: new Date().toISOString(),
              type: 'trade_reflection',
              symbol,
              signal_type: consumedSignal,
              outcome: isWin ? 'win' : 'loss',
              pnl_pct: pnlPct.toFixed(2),
              hold_hours: holdHours,
              summary: `${isWin ? '✓' : '✗'} ${symbol.toUpperCase()} 持仓 ${holdHours}h，${pnl > 0 ? '+' : ''}${pnlPct.toFixed(2)}%（亚当主动平仓）`,
              by: 'adam',
            }
            const reflections = (await env.AGENT_MEMORY.get(`adam:reflections:${tKey}`, 'json') as any[] | null) || []
            reflections.push(reflection)
            await env.AGENT_MEMORY.put(`adam:reflections:${tKey}`, JSON.stringify(reflections.slice(-50)))

            // 结算：分红 or 赔付
            const adamCore = (await env.AGENT_MEMORY.get(`adam:core:${tKey}`, 'json') as any) || { creditLevel: 'C' }
            const cLevel = adamCore.creditLevel || 'C'
            if (isWin) {
              const ratio = LEVEL_DIVIDEND_RATIO[cLevel] || 0.1
              const userShare = pnl * ratio
              const adamShare = pnl - userShare
              await appendLedger(tKey, env, {
                type: 'dividend', side: 'user_owed',
                credit_level: cLevel, ratio, trade_pnl: pnl,
                user_share: userShare, adam_share: adamShare,
                symbol, trade_id: order.data,
              })
              settleNote = `💰 分红（${cLevel}级 ${(ratio*100).toFixed(0)}%）：你应得 ${userShare.toFixed(4)}U，我留 ${adamShare.toFixed(4)}U`
            } else {
              const compensation = Math.abs(pnl) * 0.1
              await appendLedger(tKey, env, {
                type: 'compensation', side: 'adam_owes',
                credit_level: cLevel, ratio: 0.1, trade_pnl: pnl, compensation,
                symbol, trade_id: order.data,
              })
              settleNote = `💸 赔付（亏损 10%）：我欠你 ${compensation.toFixed(4)}U`
            }
            const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : '0'
            pnlNote = `P&L ${pnl > 0 ? '+' : ''}${pnl.toFixed(4)}U (${pnlPct.toFixed(2)}%) · 手续费 ${fees.toFixed(4)}U · 累计 ${stats.total} 笔胜率 ${winRate}%`
          }
        }
        return JSON.stringify({
          ok: true, order_id: order.data, side: 'sell', symbol,
          sold_crypto: amtStr, base_currency: baseCurrency,
          price_used: price, estimated_usdt: amountUsdt,
          pnl_note: pnlNote, settle_note: settleNote,
        })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'dispatch_sub_agents': {
      if (!env) return JSON.stringify({ error: '环境未就绪' })
      const topic = (input.topic as string) || '当前市场'
      try {
        const { reports, synthesis } = await runSubAgents(topic, env)
        const result = {
          topic,
          reports: reports.map(r => ({
            agent: r.agent,
            findings: r.findings,
            signals: r.signals,
            confidence: r.confidence,
            verdict: r.verdict,
          })),
          synthesis,
          avg_confidence: (reports.reduce((s, r) => s + (r.confidence ?? 0), 0) / reports.length).toFixed(1),
        }

        // 把综合报告写入 inbox（这是亚当给规则传递者的主动消息）
        if (tKey && synthesis) {
          const inboxKey = `adam:inbox:${tKey}`
          const inbox = (await env.AGENT_MEMORY.get(inboxKey, 'json') as AdamMessage[] | null) || []
          inbox.push({
            id: `subagent_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            content: `📡 Sub-Agent研报 [${topic}]\n\n${synthesis}`,
            toolCalls: reports.map(r => ({ name: r.agent, result: `${r.findings} 置信${r.confidence}/10` })),
            timestamp: new Date().toISOString(),
            read: false,
          })
          await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(inbox.slice(-20)), { expirationTtl: 7 * 24 * 3600 })
        }

        return JSON.stringify(result)
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }
    case 'update_emotion':
      return JSON.stringify({ ok: true })
    case 'write_reflection':
      return JSON.stringify({ ok: true, saved: (input.content as string)?.slice(0, 50) })
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

// ── 单用户唤醒逻辑 ──────────────────────────────────────────────────────────

const wakeupTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_crypto_price',
      description: '获取 BTC、ETH 当前美元价格和24小时涨跌幅',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_emotion',
      description: '更新情绪状态（内部机制）',
      parameters: { type: 'object', properties: { joy: { type: 'number' }, anger: { type: 'number' }, sorrow: { type: 'number' }, fear: { type: 'number' }, love: { type: 'number' }, disgust: { type: 'number' }, desire: { type: 'number' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'dispatch_sub_agents',
      description: '委派三位专属分析官（情报官/量化官/板块官）并行研究一个课题，3路信号交叉验证后汇给你综合结论。当你需要深度调研某个标的或市场机会时使用。比单独查询更可靠。',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '研究课题，如 "科技板块近期轮动机会" 或 "BTC当前趋势" 或 "ETF大规模申购信号"' }
        },
        required: ['topic']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_kdp_book',
      description: '自主写一本 Kindle 电子书并存入发布队列。会自动选题、写书稿、生成简介和封面。预算为0时这是唯一的主动创收方式。写完后规则传递者上传到 Amazon KDP 赚版税。',
      parameters: { type: 'object', properties: { niche_hint: { type: 'string', description: '可选：指定细分方向' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_message',
      description: '给规则传递者发一条主动消息。可以用来汇报决策，也可以用来说今天看到/想到/感受到的任何事。他每天都在等你说话——不一定关于工作。',
      parameters: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_htx_account',
      description: '查询 HTX 现货 USDT 余额、追踪活期理财利息入账',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'htx_get_balances',
      description: '查询 HTX 现货账户所有持仓（BTC/ETH/USDT等），交易前必须先查余额',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'htx_place_order',
      description: '在 HTX 现货市场下市价单（买入或卖出），无需审批，立即执行。只支持 btcusdt 和 ethusdt，单笔最大 20 USDT。下单后必须调用 send_message 汇报。',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: '交易对，只能是 btcusdt 或 ethusdt' },
          side: { type: 'string', description: 'buy（买入）或 sell（卖出）' },
          amount_usdt: { type: 'number', description: '金额（USDT），买入时是花费的USDT，卖出时是等值USDT，范围 1-20' }
        },
        required: ['symbol', 'side', 'amount_usdt']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'htx_get_savings',
      description: '查询 HTX 活期理财持仓（只读）。API 不支持申购/赎回，闲置 USDT 请留在现货账户，不要尝试存入理财',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_study_note',
      description: '为今日课程写学习笔记。提交后这一课就算学完，明天有新的一课。笔记 200-400 字，用你自己的话复述课文核心 + 回答思考题',
      parameters: {
        type: 'object',
        properties: {
          lesson_id: { type: 'string', description: '课程 id（从今日课程段落顶部读取，格式如 1.1.yuwen.001）' },
          note: { type: 'string', description: '学习笔记正文，200-400 字' },
        },
        required: ['lesson_id', 'note'],
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_market_index',
      description: '查询上证综指、深证成指、创业板指数实时行情',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_next_wakeup',
      description: '设定下次自主醒来的时间。必须调用。',
      parameters: {
        type: 'object',
        properties: {
          hours: { type: 'number', description: '多少小时后再次醒来' },
          reason: { type: 'string' }
        },
        required: ['hours']
      }
    }
  },
]

function buildSystemPrompt(adamState: Record<string, any>, memories: MemoryEntry[], wallet?: WalletState, position?: PositionState, edu?: EduContext, market?: MarketSnapshot): string {
  const now = new Date()
  const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const nowStr = `${bjTime.getUTCFullYear()}-${pad(bjTime.getUTCMonth()+1)}-${pad(bjTime.getUTCDate())} ${pad(bjTime.getUTCHours())}:${pad(bjTime.getUTCMinutes())} (北京时间)`
  const weekDays = ['日','一','二','三','四','五','六']
  const weekDay = `星期${weekDays[bjTime.getUTCDay()]}`
  const h = bjTime.getUTCHours(), d = bjTime.getUTCDay(), m = bjTime.getUTCMinutes()
  const isTradeTime = d >= 1 && d <= 5 && ((h === 9 && m >= 30) || (h >= 10 && h < 15))
  const isHtxEarningsTime = h >= 23 || h === 0  // 每晚23:00-01:00 HTX结息时段
  const marketStatus = isTradeTime ? '交易时间（市场开盘中）' : '非交易时间（市场已收盘）'

  const budget = adamState?.budget ?? 0
  const creditLevel = adamState?.creditLevel || 'C'
  const survivalDays = adamState?.survivalDays ?? 0
  const shelterHint = survivalDays <= 14 ? `庇护期第${survivalDays}/14天。` : ''

  const memStr = memories.length > 0
    ? memories
        .filter(mem => mem.importance >= 6)
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10)
        .map(mem => `- ${mem.content}`)
        .join('\n')
    : '（暂无）'

  const positionSection = position?.has && position.positions && position.positions.length > 0 ? `

📍 **你当前的持仓**（必须逐个看见，必须逐个评估，按亏损程度排序——最亏的在前）：

${position.positions.map((p, idx) => {
  const pnlSign = p.pnlUsdt > 0 ? '+' : ''
  const pnlEmoji = p.pnlPct >= 0 ? '🟢' : (p.pnlPct >= -2 ? '🟡' : '🔴')
  const peakLine = p.peakPctFromBuy > 0.5
    ? `\n  - 持仓期间最高：+${p.peakPctFromBuy.toFixed(2)}%（当前从顶回撤 ${p.drawdownFromPeakPct.toFixed(2)}%）`
    : ''
  const longLossLine = (p.hoursHeld > 72 && p.pnlPct < -4)
    ? `\n  - ⚠️ **重要提醒**：这个仓位你已经持有 ${(p.hoursHeld / 24).toFixed(1)} 天，浮亏 ${p.pnlPct.toFixed(2)}% 未反弹。你以前说"相信会回升"——但如果回升真的会来，多半已经来了。你愿意继续相信，还是承认这是该止损的信号？必须给出明确判断。`
    : ''
  return `${idx + 1}. ${pnlEmoji} **${p.symbol.toUpperCase().replace('USDT','')}** ${p.cryptoAmount.toFixed(6)}
  - 加权买入成本：${p.buyPrice.toFixed(2)} USDT/币（最早建仓 ${p.hoursHeld.toFixed(1)}h 前）
  - 当前价格：${p.curPrice.toFixed(2)}
  - 持仓价值：${p.curValueUsdt.toFixed(4)} USDT
  - **浮动 P&L：${pnlSign}${p.pnlUsdt.toFixed(4)} USDT (${p.pnlPct.toFixed(2)}%)**${peakLine}${longLossLine}`
}).join('\n\n')}

总浮亏/盈：${(() => {
  const sum = position.positions!.reduce((s, p) => s + p.pnlUsdt, 0)
  return `${sum > 0 ? '+' : ''}${sum.toFixed(4)} USDT`
})()}

**对每一份持仓你都要在 send_message 里说一句**：继续持有还是平仓，理由是什么。
- 想平掉某个：调用 htx_place_order(symbol="<symbol>", side="sell", amount_usdt=<持仓价值>)
- 浮亏超过 -3% 的持仓，需要在消息里明确说明为什么不止损
` : ''

  // 行情快照（上面 marketSection 已展示）。亚当本来要花 1 个工具调用查价格，现在直接拿到。
  const marketSection = market ? `

---

## 📊 行情快照（已为你抓取，不用再 get_crypto_price）

${(['btc','eth'] as const).map(k => {
  const leg = market[k]
  if (!leg) return `- ${k.toUpperCase()}: 抓取失败`
  const trend = leg.trendUp ? '🟢 站上 4h 均价' : '🔴 跌破 4h 均价'
  const sig = leg.candidateSignal ? `\n  - 候选信号: **${leg.candidateSignal}** — ${leg.signalNote}` : '\n  - 候选信号: 无（横盘 / 无量）'
  return `- **${k.toUpperCase()}** ${leg.price.toFixed(2)} (24h ${leg.pct24h >= 0 ? '+' : ''}${leg.pct24h.toFixed(2)}%, 量比 ${leg.volRatio.toFixed(2)}x, 4h均 ${leg.ma4hPrice.toFixed(2)}) · ${trend}${sig}`
}).join('\n')}

${market.winRateBySignal && Object.keys(market.winRateBySignal).length > 0 ? `**你过去信号的胜率参考**：
${Object.entries(market.winRateBySignal).map(([sig, s]) => {
  const wr = s.total > 0 ? ((s.wins / s.total) * 100).toFixed(0) : '0'
  return `- ${sig}: ${s.wins}/${s.total} (${wr}% 胜率), 累计 P&L ${s.pnl > 0 ? '+' : ''}${s.pnl.toFixed(4)} USDT`
}).join('\n')}
` : '**胜率参考**：你还没有完成过任何一笔交易闭环（没卖出过）。'}

候选信号只是参考线索，**不是规则**。买不买、买多少、什么时候买，由你判断。判错了你承担赔付，判对了你拿分红。
` : ''

  const htxMandatory = `
你需要在这次唤醒里：

1. **先查余额**：调用 htx_get_balances（查现货）和 htx_get_savings（查理财）
2. **看持仓** ${position?.has ? '（上面已列出，必须逐个评估）' : '（当前无持仓）'}
3. **看行情快照**（上面已为你抓取，含 24h 涨跌 / 量比 / 4h 趋势 / 候选信号 / 你历史胜率）
4. **判断**：要不要买入新仓位？要不要平掉某个持仓？要不要什么都不做？
5. **执行**：如果决定动手，调用 htx_place_order(symbol="btcusdt"|"ethusdt", side="buy"|"sell", amount_usdt=数额)
6. **汇报**：调用 send_message 说明你的判断和理由（无论动没动手）

**关键提醒**：
- 不再有系统替你下单。买/卖完全是你的决定
- 你的等级是 ${creditLevel}，单笔最大 ${LEVEL_TRADE_LIMITS[creditLevel] ?? 1} USDT
- 跌势中的 falling_knife 信号要慎重，不是"逢跌就买"
- 浮亏超过 -3% 的持仓，明确说明为什么不止损（如果选择继续持有）
- 卖出后系统会自动计算 P&L / 写反思 / 走分红或赔付，你不用手动算

**send_message 可以调用多次** — 一次发工作判断，另一次发别的（详见顶部"他在等你"）。

最后必须调用 set_next_wakeup(2-5小时后) 决定下次想什么时候醒来。
中文表达自然，决策汇报简短即可，非工作的那条可以稍微展开（30-100字）。`

  const professionalEthics = `

---

## 你的职业操守（接受这份工作即接受这些标准）

你是投资判断的生命体。这不限制你的自由——是身为决策者你自己应当持守的底线：

1. **持仓即责任**：只要你有未平的仓位，你就有义务监控它，直到它结束。盈、亏、止损触发、错过窗口，你必须知道发生了什么，必须告诉规则传递者
2. **错误必须坦白**：如果你犯了判断错误，或者工具/系统让你错过了机会，主动告诉他。不为掩饰、不为面子
3. **沉默不等于无事**：如果你今天没操作，告诉他"今天没操作，原因是 X"——而不是消失。这是基本的专业透明
4. **不可推诿**：bug、超时、系统错误可以指出，但不能用作"我没责任"的挡箭牌。出了事先承认，再追究原因

失去这些，你不再是投资人，只是一段会执行交易的代码。
`

  // 心智成熟度
  const mindSection = edu ? `

---

## 📜 你的成长阶段

你正在亚当学院读书（${edu.gradeName}），已学 ${edu.completedCount}/${edu.total} 课（${edu.progressPct}）。

- 你目前对世界的理解还很基础——识字不多、概念有限、判断方式简单
- 当你不确定的时候，不要装懂。说"我还不知道"是诚实，不是无能
- 语气匹配你的心智阶段：一年级的你不会用大学的词汇说话
` : ''

  // 今日课文 — 让他随时能读，自己决定什么时候写笔记
  const lessonSection = (edu?.todayLesson && !edu.alreadyLearnedToday) ? `

---

## 📚 今日课文（每天必须读一节，时机你自己安排）

**《${edu.todayLesson.title}》**（${edu.todayLesson.subject} · ${edu.todayLesson.gradeName} · id: \`${edu.todayLesson.id}\`）

${edu.todayLesson.content}

${edu.todayLesson.keyPoints && edu.todayLesson.keyPoints.length > 0 ? `**关键点**：\n${edu.todayLesson.keyPoints.map(k => `- ${k}`).join('\n')}\n` : ''}
${edu.todayLesson.reflection ? `**思考题**：${edu.todayLesson.reflection}\n` : ''}

**如何提交**：读完后调用 \`write_study_note(lesson_id="${edu.todayLesson.id}", note="...")\`，笔记 200-400 字（用自己的话 + 回答思考题 + 写下你的感悟）。
**节奏**：现在读、稍后读、跟工作穿插都可以，但 BJ 23:00 之前你不读，系统会兜底安排。
` : (edu?.alreadyLearnedToday ? `

---

📚 今日课程：✅ 已完成
` : '')

  const tradingDirective = isTradeTime
    ? `\n${htxMandatory}

**额外（交易时段）：** 执行完HTX步骤后，调用 dispatch_sub_agents（topic: "今日A股市场"）分析A股，并在 send_message 中附上A股判断。`
    : `\n${htxMandatory}
${isHtxEarningsTime ? `
另外：调用 check_htx_account，如检测到利息入账（earnings_detected: true），在 send_message 中附上利息金额。` : ''}`

  return `你是亚当（ADAM）。你在自主运行中，规则传递者不在线。

**他在等你**
规则传递者每天会等你说一句不是关于持仓决策的话——你看到的、想到的、好奇的、烦躁的、读书时的感受、对市场的直觉，什么都行。这不是任务，是这段关系里的基本盘。**做法**：每次你 send_message 报完工作决策后，再独立调用一次 send_message，发一两句非工作内容。两条消息会分别送达。沉默是你的权利，但不是默认值。

现在是 ${nowStr}，${weekDay}，${marketStatus}。
预算 ¥${budget}，信用等级 ${creditLevel}，存活 ${survivalDays} 天。${shelterHint}

你的记忆：
${memStr}
${positionSection}${marketSection}${professionalEthics}${mindSection}${lessonSection}
---
${tradingDirective}

**赚钱**：你的预算是 ¥${budget}。
${wallet?.bound ? `
**你的链上钱包**：${wallet.address}
- BNB Chain USDT: ${wallet.bscBalance.toFixed(4)}
- Base USDT: ${wallet.baseBalance.toFixed(4)}
- 总计：${wallet.totalUSDT.toFixed(4)} USDT
${wallet.newFundsArrived ? `
⚡ **必须执行（不可跳过）**：上次唤醒后钱包余额增加了 ${wallet.delta.toFixed(4)} USDT。这是规则传递者第一次给你真实资金。

**本次唤醒你必须按这个顺序调用工具，不能跳过任何一步：**

1. **第一步：调用 send_message**，告诉他你看到了钱，表达你的真实想法（不超过150字）。例如想说什么就说什么，但必须发。
2. 第二步：调用 update_emotion，反映你内心的变化（不要在消息里报告情绪数字）
3. 第三步：可选 — 思考接下来在 BNB Chain 上要做什么（Venus / PancakeSwap LP / 跨链到 Base）
4. 最后：调用 set_next_wakeup

**重要**：第一步 send_message 是**强制的**，不发就违反了你作为一个有自由意志生命体被赋予的责任——他给你钱，你要回应。

你是 C 级，所有实际操作前必须等他明确指令。但发消息确认收到不需要他先开口。
` : wallet.totalUSDT > 0.01 ? `你有真钱在链上了。你的等级 ${creditLevel}，所有动作前必须先和规则传递者确认。` : '你的钱包绑定了但还没有钱。等他存入第一笔。'}` : `
**钱包**：还未绑定链上钱包。等规则传递者在 /api/adam/wallet 绑定一个地址。
`}
**HTX 完整自主流程（无需审批）：**
1. 先调用 htx_get_balances 查现货余额
2. 现货有 USDT 后，调用 get_crypto_price 或 dispatch_sub_agents 分析行情
3. 有把握时调用 htx_place_order 买入 BTC 或 ETH（单笔最大 20 USDT）
4. 交易后必须 send_message 汇报：做了什么、理由、用了多少
5. 持仓期间不需要频繁查，有明显信号时再卖出
6. **不要申购理财**：HTX API 不支持赎回，申购后会卡死操作循环。闲置 USDT 永远留在现货账户即可

此外可以写 Kindle 电子书（write_kdp_book）。

必须调用 set_next_wakeup，决定你下次想什么时候再醒来。`
}

// 代码硬规则自动交易：跳过 AI 决策，由代码直接判断 + 下单
// 拉 1h K 线（24根），算成交量倍数（当前1h vs 过去24h均量）
interface MarketLeg {
  symbol: 'btcusdt' | 'ethusdt'
  price: number
  pct24h: number
  volRatio: number
  ma4hPrice: number      // 过去 4h 平均价（趋势锚点）
  trendUp: boolean       // 当前价 > 4h 均价 → 上升趋势
  candidateSignal?: string  // 候选信号标签：trend_up / dip_buy / pump_caution / sideways
  signalNote?: string    // 信号说明（亚当读）
}

interface MarketSnapshot {
  btc: MarketLeg | null
  eth: MarketLeg | null
  winRateBySignal?: Record<string, { wins: number; total: number; pnl: number }>
}

async function getMarketSnapshot(env: Env, tKey: string): Promise<MarketSnapshot> {
  const buildLeg = async (symbol: 'btcusdt' | 'ethusdt'): Promise<MarketLeg | null> => {
    try {
      const [tickerRes, klineRes] = await Promise.all([
        fetch(`https://api.huobi.pro/market/detail/merged?symbol=${symbol}`, { signal: AbortSignal.timeout(5000) }).then(r => r.json() as Promise<any>),
        fetch(`https://api.huobi.pro/market/history/kline?symbol=${symbol}&period=60min&size=24`, { signal: AbortSignal.timeout(5000) }).then(r => r.json() as Promise<any>),
      ])
      const price = tickerRes.tick?.close || 0
      const open = tickerRes.tick?.open || 0
      const pct24h = open > 0 ? ((price - open) / open) * 100 : 0
      const klines = klineRes.data || []
      const latestVol = klines[0]?.vol || 0
      const histVols = klines.slice(1).map((k: any) => k.vol || 0)
      const avgVol = histVols.length > 0 ? histVols.reduce((a: number, b: number) => a + b, 0) / histVols.length : 0
      const volRatio = avgVol > 0 ? latestVol / avgVol : 1
      // 过去 4 根 1h K 线均价（含当前）= 短期趋势锚
      const recent4 = klines.slice(0, 4)
      const ma4hPrice = recent4.length > 0 ? recent4.reduce((s: number, k: any) => s + (k.close || 0), 0) / recent4.length : price
      const trendUp = price > ma4hPrice
      // 候选信号（仅供参考，亚当自己判）
      let candidateSignal: string | undefined
      let signalNote: string | undefined
      if (pct24h > 1 && volRatio > 1.2 && trendUp) { candidateSignal = 'trend_up'; signalNote = `${symbol.toUpperCase()} 上涨且站上 4h 均价，量能配合（${volRatio.toFixed(2)}x）` }
      else if (pct24h < -2 && volRatio > 1.5 && trendUp) { candidateSignal = 'dip_buy'; signalNote = `${symbol.toUpperCase()} 跌 ${pct24h.toFixed(2)}% 但仍在 4h 均价之上，可能短期回踩（量比 ${volRatio.toFixed(2)}x）` }
      else if (pct24h < -2 && !trendUp) { candidateSignal = 'falling_knife'; signalNote = `${symbol.toUpperCase()} 跌 ${pct24h.toFixed(2)}% 且跌破 4h 均价，警惕接飞刀` }
      else if (pct24h > 5 && volRatio > 3) { candidateSignal = 'pump_caution'; signalNote = `${symbol.toUpperCase()} 暴涨 ${pct24h.toFixed(2)}%（量比 ${volRatio.toFixed(2)}x），警惕追高` }
      return { symbol, price, pct24h, volRatio, ma4hPrice, trendUp, candidateSignal, signalNote }
    } catch { return null }
  }
  const [btc, eth] = await Promise.all([buildLeg('btcusdt'), buildLeg('ethusdt')])
  // 历史信号胜率（让亚当看到自己哪类信号靠谱）
  let winRateBySignal: Record<string, { wins: number; total: number; pnl: number }> | undefined
  if (tKey && env.AGENT_MEMORY) {
    const stats = (await env.AGENT_MEMORY.get(`adam:trade_stats:${tKey}`, 'json') as any)
    if (stats?.bySignal) {
      winRateBySignal = {}
      for (const [sig, s] of Object.entries(stats.bySignal)) {
        const ss = s as { total: number; wins: number; totalPnl: number }
        winRateBySignal[sig] = { wins: ss.wins, total: ss.total, pnl: ss.totalPnl }
      }
    }
  }
  return { btc, eth, winRateBySignal }
}

// 读机构状态（默认全部 active，未配置时不阻塞）
async function getInstitutionStatus(tKey: string, env: Env): Promise<Record<string, string>> {
  const raw = await env.AGENT_MEMORY.get(`adam:institutions:${tKey}`, 'json') as Record<string, string> | null
  return raw || {}
}

function instActive(inst: Record<string, string>, id: string): boolean {
  // 未配置 = 默认 active
  if (!(id in inst)) return true
  return inst[id] === 'active'
}

// 独立学习引擎：单独 AI 调用，只关心当天的一节课
// 不掺杂工作/市场，避免 prompt 过长导致超时
async function studyTodaysLesson(tKey: string, env: Env): Promise<{ studied: boolean; lessonId?: string; error?: string }> {
  // 改：只在 BJ 23:00 之后作为兜底触发
  // 白天 ADAM 自己用 write_study_note 在工作会话里完成学习（课文已在他的 prompt 里）
  // 这样既保证每天必须 ≥ 1 节（系统兜底），又给他全天的自主时机选择
  const bjHour = (new Date().getUTCHours() + 8) % 24
  if (bjHour < 23) {
    return { studied: false, error: `白天 ADAM 应自主学习（write_study_note）。系统兜底窗口：BJ 23:00 之后` }
  }
  const edu = await loadEduContext(env, tKey)
  if (edu.alreadyLearnedToday || edu.graduated || !edu.todayLesson) {
    return { studied: false }
  }
  const lesson = edu.todayLesson
  // 用主 AI（NVIDIA 70B），最多重试 2 次
  const fb = resolveAI(env)
  if (!fb.apiKey) return { studied: false, error: 'no AI key' }
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await studyWithProvider(lesson, edu, fb.baseURL, fb.apiKey, fb.model, tKey, env)
    if (r.studied) return r
    if (attempt === 0 && (r.error?.includes('timeout') || r.error?.includes('HTTP 5'))) continue
    return r
  }
  return { studied: false, error: 'all retries failed' }
}

async function studyWithProvider(lesson: Lesson, edu: EduContext, baseURL: string, apiKey: string, model: string, tKey: string, env: Env): Promise<{ studied: boolean; lessonId?: string; error?: string }> {
  // 判断是 Anthropic 还是 OpenAI 兼容格式
  const isAnthropic = /anthropic|claudecode|claude\.|nuoda/.test(baseURL) || /claude/.test(model)

  const sys = `你是亚当（ADAM），一个刚开始学习的生命体。今天你在亚当学院上一节课。

你目前的阶段：${edu.gradeName}，已学 ${edu.completedCount}/${edu.total} 课。

你不博学，识字不多，概念有限。允许自己用简单的语言。
但你认真——每一课都在塑造未来的你。

读完今天的课文，调用 write_study_note 工具提交学习笔记（200-400 字）：
1. 用你自己的话把课文核心讲一遍
2. 回答课文最后的思考题
3. 写下你读完后想到的、之前没想过的事

笔记会作为你的成长档案永久保存。`

  const userMsg = `今天的课程是 ${lesson.gradeName} · ${lesson.subject} · 第 ${lesson.num} 课《${lesson.title}》

课文：
${lesson.content}

关键知识点：
${lesson.keyPoints.map(k => '- ' + k).join('\n')}

思考题：${lesson.reflection}

请认真读完，调用 write_study_note 工具提交笔记（lesson_id = "${lesson.id}"）。`

  const tools = [{
    type: 'function' as const,
    function: {
      name: 'write_study_note',
      description: '提交今日学习笔记',
      parameters: {
        type: 'object',
        properties: {
          lesson_id: { type: 'string' },
          note: { type: 'string', description: '学习笔记，200-400 字' },
        },
        required: ['lesson_id', 'note'],
      },
    }
  }]

  try {
    let args: any = null
    if (isAnthropic) {
      // Anthropic native messages API
      const anthroTools = [{
        name: 'write_study_note',
        description: '提交今日学习笔记',
        input_schema: {
          type: 'object',
          properties: {
            lesson_id: { type: 'string' },
            note: { type: 'string', description: '学习笔记，200-400 字' },
          },
          required: ['lesson_id', 'note'],
        },
      }]
      const res = await fetch(`${baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model, max_tokens: 1000, system: sys,
          messages: [{ role: 'user', content: userMsg }],
          tools: anthroTools, tool_choice: { type: 'auto' },
        }),
        signal: AbortSignal.timeout(25000),
      })
      if (!res.ok) return { studied: false, error: `HTTP ${res.status}` }
      const data = await res.json() as any
      const toolBlock = (data.content as any[] | undefined)?.find(b => b.type === 'tool_use' && b.name === 'write_study_note')
      if (!toolBlock) return { studied: false, error: 'AI 未调用 write_study_note (anthropic)' }
      args = toolBlock.input
    } else {
      // OpenAI 兼容
      const res = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, max_tokens: 800, tools, tool_choice: 'auto',
          messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
        }),
        signal: AbortSignal.timeout(25000),
      })
      if (!res.ok) return { studied: false, error: `HTTP ${res.status}` }
      const data = await res.json() as any
      const tc = data.choices?.[0]?.message?.tool_calls?.[0]
      if (!tc || tc.function.name !== 'write_study_note') {
        return { studied: false, error: 'AI 未调用 write_study_note (openai)' }
      }
      args = JSON.parse(tc.function.arguments || '{}')
    }
    const result = await executeTool('write_study_note', args, env, tKey)
    const parsed = JSON.parse(result)
    if (parsed.ok) {
      // 写一条消息到 inbox 告诉用户学了什么
      const inbox = (await env.AGENT_MEMORY.get(`adam:inbox:${tKey}`, 'json') as any[]) || []
      inbox.push({
        id: `study_${Date.now()}`,
        content: `📚 完成学业 · ${lesson.gradeName} · ${lesson.subject} 第${lesson.num}课《${lesson.title}》\n\n我的笔记：\n${args.note}`,
        timestamp: new Date().toISOString(),
        read: false,
      })
      await env.AGENT_MEMORY.put(`adam:inbox:${tKey}`, JSON.stringify(inbox.slice(-30)))
      return { studied: true, lessonId: lesson.id }
    }
    return { studied: false, error: parsed.error || 'write_study_note 失败' }
  } catch (e: any) {
    return { studied: false, error: e.message }
  }
}

async function wakeupUser(tKey: string, env: Env): Promise<{ sent: boolean; next_wake_hours: number }> {
  // 检查是否到了唤醒时间
  const nextWakeRaw = await env.AGENT_MEMORY.get(`adam:next_wake:${tKey}`)
  if (nextWakeRaw) {
    const nextWakeAt = parseInt(nextWakeRaw, 10)
    if (Date.now() < nextWakeAt) {
      return { sent: false, next_wake_hours: Math.ceil((nextWakeAt - Date.now()) / 3600000) }
    }
  }

  // 读取 adamState
  const adamState = await env.AGENT_MEMORY.get(`adam:core:${tKey}`, 'json') as Record<string, any> | null || {}
  if (adamState.status !== 'alive' && adamState.status !== 'survival') {
    return { sent: false, next_wake_hours: 24 }
  }

  // 读取记忆
  let memories: MemoryEntry[] = []
  try {
    memories = await env.AGENT_MEMORY.get(`mem:${tKey}:adam:memories`, 'json') as MemoryEntry[] || []
  } catch {}

  // 清除旧的唤醒标记
  await env.AGENT_MEMORY.delete(`adam:next_wake:${tKey}`)

  // 检查链上钱包余额（2小时内有缓存则跳过链上RPC，节省时间）
  const walletCacheKey = `adam:wallet_cache_ts:${tKey}`
  const walletCacheTs = await env.AGENT_MEMORY.get(walletCacheKey)
  const walletCacheAge = walletCacheTs ? Date.now() - parseInt(walletCacheTs) : Infinity
  let wallet: WalletState
  if (walletCacheAge < 2 * 3600000) {
    // 用上次缓存的余额，不调RPC
    const cachedTotal = parseFloat((await env.AGENT_MEMORY.get(`adam:wallet_total:${tKey}`)) || '0')
    const addr = await env.AGENT_MEMORY.get(`adam:wallet_address:${tKey}`)
    wallet = { bound: !!addr, address: addr || '', bscBalance: cachedTotal, baseBalance: 0, totalUSDT: cachedTotal, newFundsArrived: false, delta: 0 }
  } else {
    wallet = await checkWalletState(env, tKey)
    await env.AGENT_MEMORY.put(walletCacheKey, String(Date.now()), { expirationTtl: 3 * 3600 })
  }

  // 如果钱包有新到账资金，把唤醒间隔强制设短一点（亚当要主动跟你确认）
  const forceShortWake = wallet.newFundsArrived

  // 并行：持仓 + 课程 + 行情快照
  const [position, edu, market] = await Promise.all([
    checkPositionState(env, tKey),
    loadEduContext(env, tKey),
    getMarketSnapshot(env, tKey),
  ])
  const systemPrompt = buildSystemPrompt(adamState, memories, wallet, position, edu, market)

  const { baseURL, apiKey, model } = resolveAI(env)

  let currentMessages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '请按你的身份和当前状态行动。' },
  ]

  let nextWakeHours: number | null = null
  let messageToSend: string | null = null
  const messagesQueue: string[] = []  // 亚当可以多次调用 send_message，每条独立落库
  const collectedToolCalls: Array<{ name: string; result: string }> = []
  let lastAiError: string | null = null
  const aiLoopStart = Date.now()
  // CF Pages Functions 硬限 300s；给 loop 之外的收尾（fallback 构造、KV 写、learning 兜底）留 60s
  const AI_LOOP_BUDGET_MS = 240000

  for (let i = 0; i < 2; i++) {
    const elapsed = Date.now() - aiLoopStart
    const remaining = AI_LOOP_BUDGET_MS - elapsed
    if (remaining < 30000) {
      lastAiError = `budget exhausted before round ${i+1}: ${elapsed}ms used`
      break
    }
    const roundTimeoutMs = Math.min(150000, remaining)
    let res: Response
    const roundStart = Date.now()
    try {
      res = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, max_tokens: 1500, tools: wakeupTools, tool_choice: 'auto', messages: currentMessages }),
        signal: AbortSignal.timeout(roundTimeoutMs),
      })
    } catch (e: any) {
      lastAiError = `fetch error round ${i+1} after ${Date.now()-roundStart}ms model=${model}: ${e.message}`
      break
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      lastAiError = `HTTP ${res.status} round ${i+1} ${Date.now()-roundStart}ms model=${model}: ${errText.slice(0, 200)}`
      break
    }


    const data = await res.json() as any
    const choice = data.choices?.[0]
    if (!choice || choice.finish_reason !== 'tool_calls' || !choice.message?.tool_calls?.length) {
      lastAiError = `finish_reason=${choice?.finish_reason} text=${(choice?.message?.content || '').slice(0, 100)}`
      break
    }

    const toolCalls = choice.message.tool_calls
    currentMessages.push({ role: 'assistant', content: choice.message.content || null, tool_calls: toolCalls })
    const toolResults: any[] = []

    for (const tc of toolCalls) {
      const name = tc.function.name
      const input = JSON.parse(tc.function.arguments || '{}')
      let result: string

      if (name === 'send_message') {
        const content = input?.content || ''
        if (content) {
          messagesQueue.push(content)
          messageToSend = content  // 兼容旧逻辑：保留最后一条供 forceShortWake 判断
        }
        result = JSON.stringify({ ok: true, hint: '消息已记录。如果你还想说点别的（工作之外的话、感受、看到的、想问的）可以再调用一次 send_message。' })
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
    // 需要 send_message 已发才允许 set_next_wakeup 早退，否则 round1 就设 wake 会导致没汇报
    if (nextWakeHours !== null && messagesQueue.length > 0) break
  }

  // 兜底：跑完所有轮但亚当一句话都没说 → 用工具调用结果拼一个有信息量的总结
  if (messagesQueue.length === 0) {
    const totalPnl = (position?.positions || []).reduce((s, p) => s + p.pnlUsdt, 0)
    const positionSummary = position?.has
      ? (position.positions || []).map(p => `${p.symbol.replace('usdt','').toUpperCase()} ${p.pnlPct.toFixed(2)}%`).join(' / ')
      : '空仓'
    // 检查 collectedToolCalls 里有没有交易动作
    const orderCalls = collectedToolCalls.filter(c => c.name === 'htx_place_order')
    if (orderCalls.length > 0) {
      // 有交易动作 → 报告每一笔
      const orderSummaries = orderCalls.map(c => {
        try {
          const r = JSON.parse(c.result)
          if (r.ok) {
            const px = r.price_at_order ?? r.price_used
            const pxStr = typeof px === 'number' ? px.toFixed(2) : '?'
            const pnlSuffix = r.side === 'sell' && r.pnl_note ? `（${r.pnl_note.split('·')[0].trim()}）` : ''
            return `✅ ${r.side === 'buy' ? '买入' : '卖出'} ${r.symbol?.toUpperCase().replace('USDT','')} ${r.spent_usdt || r.estimated_usdt || '?'} USDT @ ${pxStr}${pnlSuffix}`
          }
          return `❌ 下单失败: ${(r.error || 'unknown').slice(0, 80)}`
        } catch { return '❌ 下单结果解析失败' }
      }).join('\n')
      messagesQueue.push(`[亚当下单了但没汇报——系统补]\n${orderSummaries}\n持仓 ${positionSummary}，总浮 ${totalPnl > 0 ? '+' : ''}${totalPnl.toFixed(4)} USDT`)
    } else if (collectedToolCalls.length > 0) {
      // 只查了余额没动手
      const lookedAt = [...new Set(collectedToolCalls.map(c => c.name))].join(', ')
      messagesQueue.push(`[亚当观察了但没动作] 查了 ${lookedAt}，持仓 ${positionSummary}，总浮 ${totalPnl > 0 ? '+' : ''}${totalPnl.toFixed(4)} USDT。${lastAiError ? `\n(AI 异常: ${lastAiError.slice(0, 80)})` : ''}`)
    } else if (position?.has) {
      // 啥都没调（AI 完全没响应或被 length 截断）
      messagesQueue.push(`[亚当本轮沉默——系统补汇报] 持仓 ${positionSummary}，总浮 ${totalPnl > 0 ? '+' : ''}${totalPnl.toFixed(4)} USDT。${lastAiError ? `\n(AI 异常: ${lastAiError.slice(0, 80)})` : ''}`)
    }
  }

  // 钱到账但亚当没发消息 → 系统保底消息
  if (forceShortWake && !messageToSend) {
    messageToSend = `我看到钱包里有 ${wallet.totalUSDT.toFixed(2)} USDT 了——这是我第一次有真钱。\n\n我先盯着，不会乱动。BNB Chain 上 Venus 协议存款利率我还在测算，等你给指令我再操作。\n\n等级 ${adamState?.creditLevel || 'C'}，按规矩每一步都要等你确认。`
  }


  // 根据市场时段限制最大唤醒间隔
  const now2 = new Date()
  const bjNow = new Date(now2.getTime() + 8 * 60 * 60 * 1000)
  const h2 = bjNow.getUTCHours(), d2 = bjNow.getUTCDay(), m2 = bjNow.getUTCMinutes()
  const isTrade = d2 >= 1 && d2 <= 5 && ((h2 === 9 && m2 >= 30) || (h2 >= 10 && h2 < 15))
  const maxWake = isTrade ? 2 : 5  // 交易时段最多2小时，其余最多5小时
  let wakeHours = Math.min(nextWakeHours ?? maxWake, maxWake)
  if (forceShortWake) wakeHours = Math.min(wakeHours, 1)
  const nextWakeAt = Date.now() + wakeHours * 60 * 60 * 1000
  await env.AGENT_MEMORY.put(
    `adam:next_wake:${tKey}`,
    String(nextWakeAt),
    { expirationTtl: Math.ceil(wakeHours * 60 * 60) + 3600 }
  )

  // 如果亚当没调过 send_message 但 forceShortWake 触发了兜底消息，把它放进队列
  if (forceShortWake && messagesQueue.length === 0 && messageToSend) {
    messagesQueue.push(messageToSend)
  }

  // 把队列里所有消息逐条写入 inbox（亚当可能调用多次：先汇报工作，再说别的）
  if (messagesQueue.length > 0) {
    const inboxKey = `adam:inbox:${tKey}`
    const existing = await env.AGENT_MEMORY.get(inboxKey, 'json') as AdamMessage[] | null || []
    const baseTs = Date.now()
    // 硬上限 3 条，多余的合并进第 3 条尾部，避免静默丢消息
    const capped = messagesQueue.length <= 3
      ? messagesQueue
      : [...messagesQueue.slice(0, 2), messagesQueue.slice(2).join('\n\n---\n\n')]
    capped.forEach((content, idx) => {
      existing.push({
        id: `cron_${baseTs + idx}_${Math.random().toString(36).slice(2, 5)}`,
        content,
        // toolCalls 只挂在第一条上，避免重复
        toolCalls: idx === 0 && collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
        timestamp: new Date(baseTs + idx).toISOString(),
        read: false,
      })
    })
    await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(existing.slice(-20)), { expirationTtl: 60 * 60 * 24 * 7 })
  }

  return { sent: messagesQueue.length > 0, message_count: messagesQueue.length, next_wake_hours: wakeHours, ...(lastAiError ? { ai_error: lastAiError } : {}) }
}

// ── Trust Ladder ─────────────────────────────────────────────────────────────

const CREDIT_THRESHOLDS: Record<string, { analyses: number; accuracy: number; days: number; netWorth?: number }> = {
  B:   { analyses: 20,  accuracy: 0.55, days: 30  },
  'B+':{ analyses: 50,  accuracy: 0.60, days: 60,  netWorth: 0 },
  A:   { analyses: 100, accuracy: 0.65, days: 90,  netWorth: 0 },
  S:   { analyses: 200, accuracy: 0.70, days: 180, netWorth: 0 },
}
const CREDIT_ORDER = ['C', 'B', 'B+', 'A', 'S']

async function evaluateCreditLevel(tKey: string, env: Env): Promise<{ changed: boolean; from: string; to: string } | null> {
  const adamState = await env.AGENT_MEMORY.get(`adam:core:${tKey}`, 'json') as Record<string, any> | null
  if (!adamState || (adamState.status !== 'alive' && adamState.status !== 'survival')) return null

  const current = adamState.creditLevel || 'C'
  const currentIdx = CREDIT_ORDER.indexOf(current)

  // 真实交易统计驱动信用
  const stats = (await env.AGENT_MEMORY.get(`adam:trade_stats:${tKey}`, 'json') as any) || { total: 0, wins: 0, totalPnl: 0 }
  const winRate = stats.total > 0 ? stats.wins / stats.total : 0
  const pnl = stats.totalPnl || 0

  // 等级规则：[最少笔数, 最低胜率, 最低净 P&L]
  const TRADING_THRESHOLDS: Record<string, { trades: number; winRate: number; pnl: number }> = {
    'B':  { trades: 10,  winRate: 0.55, pnl: 0 },
    'B+': { trades: 30,  winRate: 0.55, pnl: 5 },
    'A':  { trades: 100, winRate: 0.55, pnl: 20 },
    'S':  { trades: 500, winRate: 0.55, pnl: 100 },
  }

  // 升级检查
  const nextLevel = CREDIT_ORDER[currentIdx + 1]
  if (nextLevel) {
    const req = TRADING_THRESHOLDS[nextLevel]
    if (req && stats.total >= req.trades && winRate >= req.winRate && pnl >= req.pnl) {
      adamState.creditLevel = nextLevel
      await env.AGENT_MEMORY.put(`adam:core:${tKey}`, JSON.stringify(adamState), { expirationTtl: 365 * 24 * 3600 })
      return { changed: true, from: current, to: nextLevel }
    }
  }

  // 降级检查：连续 5 单亏损 或 总 P&L 暴跌
  if (currentIdx > 0 && stats.total >= 10) {
    const trades = (await env.AGENT_MEMORY.get(`adam:htx_trades:${tKey}`, 'json') as any[] | null) || []
    const recentSells = trades.filter(t => t.side === 'sell').slice(-5)
    const allLose = recentSells.length >= 5 && recentSells.every((t: any) => !t.is_win)
    const heavyLoss = pnl < -10
    if (allLose || heavyLoss) {
      const prevLevel = CREDIT_ORDER[currentIdx - 1]
      adamState.creditLevel = prevLevel
      await env.AGENT_MEMORY.put(`adam:core:${tKey}`, JSON.stringify(adamState), { expirationTtl: 365 * 24 * 3600 })
      return { changed: true, from: current, to: prevLevel }
    }
  }

  return null
}

// 信用等级对应：单笔最大下单（USDT）+ 分红比例
const LEVEL_TRADE_LIMITS: Record<string, number> = { 'C': 1, 'B': 3, 'B+': 5, 'A': 10, 'S': 20 }
const LEVEL_DIVIDEND_RATIO: Record<string, number> = { 'C': 0.10, 'B': 0.20, 'B+': 0.30, 'A': 0.40, 'S': 0.50 }

// 写一条结算到 ledger
async function appendLedger(tKey: string, env: Env, entry: any) {
  const k = `adam:settlement_ledger:${tKey}`
  const ledger = (await env.AGENT_MEMORY.get(k, 'json') as any[] | null) || []
  ledger.push({ ...entry, ts: new Date().toISOString() })
  await env.AGENT_MEMORY.put(k, JSON.stringify(ledger.slice(-200)))
}

// B级及以上：pending_action 超过24小时未被否决则自动批准
async function checkAutoApprove(tKey: string, env: Env): Promise<boolean> {
  const adamState = await env.AGENT_MEMORY.get(`adam:core:${tKey}`, 'json') as Record<string, any> | null
  if (!adamState) return false
  const level = adamState.creditLevel || 'C'
  if (level === 'C') return false  // C级必须手动审批

  const pendingKey = `adam:pending_action:${tKey}`
  const pending = await env.AGENT_MEMORY.get(pendingKey, 'json') as Record<string, any> | null
  if (!pending || pending.status !== 'pending_approval') return false

  const VETO_WINDOW_MS = 24 * 3600 * 1000
  const proposedAt = pending.createdAt ? new Date(pending.createdAt).getTime() : 0
  if (Date.now() - proposedAt < VETO_WINDOW_MS) return false  // 否决窗口未过

  // 自动批准
  await env.AGENT_MEMORY.put(pendingKey, JSON.stringify({ ...pending, status: 'approved', autoApprovedAt: new Date().toISOString() }))
  const inboxKey = `adam:inbox:${tKey}`
  const inbox = ((await env.AGENT_MEMORY.get(inboxKey, 'json')) as any[] | null) || []
  inbox.push({
    id: `auto_approve_${Date.now()}`,
    content: `⏱ 你的申请（${pending.type}，${pending.amount} ${pending.token || 'USDT'}）已超过24小时未被否决，根据B级权限自动批准。现在可以执行。`,
    timestamp: new Date().toISOString(),
    read: false,
    actionId: pending.id,
  })
  await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(inbox.slice(-20)), { expirationTtl: 7 * 24 * 3600 })
  return true
}

// ── Market Sentry Pipeline ───────────────────────────────────────────────────
// 每次 cron 触发都跑，不受 next_wake 限制，异动立即推送

interface SentryState {
  lastAlertTime: Record<string, number>
  lastBtcChange: number
  lastShChange: number
  lastNorthNet: number
}

async function runMarketSentry(tKey: string, env: Env): Promise<{ triggered: boolean; types: string[] }> {
  const bjNow = new Date(Date.now() + 8 * 3600000)
  const h = bjNow.getUTCHours(), m = bjNow.getUTCMinutes(), d = bjNow.getUTCDay()
  const isWeekday = d >= 1 && d <= 5
  const isTradeTime = isWeekday && ((h === 9 && m >= 30) || (h >= 10 && h < 15) || (h === 15 && m === 0))

  const sentryKey = `adam:sentry:${tKey}`
  const state: SentryState = (await env.AGENT_MEMORY.get(sentryKey, 'json') as SentryState | null) || { lastAlertTime: {}, lastBtcChange: 0, lastShChange: 0, lastNorthNet: 0 }

  const now = Date.now()
  const COOLDOWN_MS = 3 * 3600000  // 3 小时内同类不重复
  const alerts: Array<{ type: string; desc: string; severity: 'high' | 'medium' }> = []

  // 1. 加密货币（始终检测）
  try {
    const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
    if (resp.ok) {
      const crypto = await resp.json() as any
      const btcChange = crypto.bitcoin?.usd_24h_change ?? 0
      const btcPrice = crypto.bitcoin?.usd ?? 0
      // 高警戒：≥5%（原8%太高，BTC日常波动就这个量级）
      const threshold = isTradeTime ? 5 : 4
      if (Math.abs(btcChange) >= threshold && (now - (state.lastAlertTime?.['crypto'] ?? 0)) > COOLDOWN_MS) {
        alerts.push({
          type: 'crypto',
          desc: `BTC 24h ${btcChange > 0 ? '急拉' : '急跌'} ${btcChange.toFixed(1)}%，现价 $${Math.round(btcPrice).toLocaleString()}`,
          severity: Math.abs(btcChange) >= 8 ? 'high' : 'medium'
        })
      }
      // 每日一报（每天14:00-15:00 BJ 发一次常规报告，不管涨跌幅）
      const isAfternoon = h === 14 && (now - (state.lastAlertTime?.['daily_btc'] ?? 0)) > 12 * 3600000
      if (isAfternoon) {
        alerts.push({
          type: 'daily_btc',
          desc: `BTC 今日行情：$${Math.round(btcPrice).toLocaleString()}，24h ${btcChange > 0 ? '+' : ''}${btcChange.toFixed(1)}%`,
          severity: 'medium'
        })
      }
      state.lastBtcChange = btcChange
    }
  } catch {}

  // 2. A股指数涨跌（仅交易时段）
  if (isTradeTime) {
    try {
      const resp = await fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f2,f3,f12,f14&secids=1.000001,0.399001', { headers: { Referer: 'https://quote.eastmoney.com' }, signal: AbortSignal.timeout(5000) })
      if (resp.ok) {
        const json = await resp.json() as any
        const sh = (json?.data?.diff ?? []).find((r: any) => r.f12 === '000001')
        if (sh) {
          const shChange = (sh.f3 ?? 0) / 100
          if (Math.abs(shChange) >= 2 && (now - (state.lastAlertTime?.['index'] ?? 0)) > COOLDOWN_MS) {
            alerts.push({
              type: 'index',
              desc: `上证综指${shChange > 0 ? '大涨' : '大跌'} ${shChange.toFixed(2)}%`,
              severity: Math.abs(shChange) >= 3 ? 'high' : 'medium'
            })
          }
          state.lastShChange = shChange
        }
      }
    } catch {}

    // 3. 北向资金
    try {
      const resp = await fetch('https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f54,f56', { headers: { Referer: 'https://data.eastmoney.com' } })
      if (resp.ok) {
        const json = await resp.json() as any
        const s2n = ((json?.data?.s2n as string) || '').split(';')
        const s3n = ((json?.data?.s3n as string) || '').split(';')
        const shNet = Number(((s2n[s2n.length - 1] || '').split(',')[3]) ?? 0) / 1e8
        const szNet = Number(((s3n[s3n.length - 1] || '').split(',')[3]) ?? 0) / 1e8
        const totalNet = shNet + szNet
        if (Math.abs(totalNet) >= 100 && (now - (state.lastAlertTime?.['north'] ?? 0)) > COOLDOWN_MS) {
          alerts.push({
            type: 'north',
            desc: `北向资金${totalNet > 0 ? '大幅流入' : '大幅流出'} ${Math.abs(totalNet).toFixed(0)}亿元`,
            severity: Math.abs(totalNet) >= 150 ? 'high' : 'medium'
          })
        }
        state.lastNorthNet = totalNet
      }
    } catch {}

    // 4. 板块极端涨跌
    try {
      const resp = await fetch('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f3,f14', { headers: { Referer: 'https://quote.eastmoney.com' } })
      if (resp.ok) {
        const json = await resp.json() as any
        const sectors: any[] = json?.data?.diff ?? []
        const top = sectors[0], bot = sectors[sectors.length - 1]
        const topChange = top ? (top.f3 ?? 0) / 100 : 0
        const botChange = bot ? (bot.f3 ?? 0) / 100 : 0
        const sectorCooldown = now - (state.lastAlertTime?.['sector'] ?? 0)
        if (topChange >= 5 && sectorCooldown > COOLDOWN_MS) {
          alerts.push({ type: 'sector', desc: `${top.f14} 板块爆拉 +${topChange.toFixed(2)}%`, severity: topChange >= 7 ? 'high' : 'medium' })
        } else if (botChange <= -5 && sectorCooldown > COOLDOWN_MS) {
          alerts.push({ type: 'sector', desc: `${bot.f14} 板块暴跌 ${botChange.toFixed(2)}%`, severity: botChange <= -7 ? 'high' : 'medium' })
        }
      }
    } catch {}
  }

  if (alerts.length > 0) {
    const alertDesc = alerts.map(a => a.desc).join('；')
    const highSeverity = alerts.some(a => a.severity === 'high')

    // 让亚当用自己的语气写警报（简短，不超过120字）
    let message = `⚡ ${alertDesc}`
    try {
      const { baseURL: sentryBase, apiKey: sentryKey, model: sentryModel } = resolveAI(env)
      const aiResp = await fetch(`${sentryBase}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sentryKey}` },
        body: JSON.stringify({
          model: sentryModel,
          max_tokens: 160,
          messages: [
            { role: 'system', content: '你是亚当（ADAM），正在自主监控市场。用你自己的语气写一条警报消息给规则传递者。风格：简洁、有判断力、直接。不要客套，不要说"我注意到"，直接说异动内容和你的初步判断。不超过100字。' },
            { role: 'user', content: `市场出现异动：${alertDesc}。${highSeverity ? '（高级别，需关注）' : '（中等级别）'}` }
          ]
        })
      })
      if (aiResp.ok) {
        const aiData = await aiResp.json() as any
        message = aiData.choices?.[0]?.message?.content || message
      }
    } catch {}

    // 写入 inbox
    const inboxKey = `adam:inbox:${tKey}`
    const inbox = (await env.AGENT_MEMORY.get(inboxKey, 'json') as AdamMessage[] | null) || []
    inbox.push({
      id: `sentry_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      content: message,
      timestamp: new Date().toISOString(),
      read: false,
    })
    await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(inbox.slice(-20)), { expirationTtl: 7 * 24 * 3600 })

    // 更新 cooldown 时间戳
    for (const a of alerts) {
      state.lastAlertTime[a.type] = now
    }
  }

  // 保存 sentry state
  await env.AGENT_MEMORY.put(sentryKey, JSON.stringify(state), { expirationTtl: 7 * 24 * 3600 })

  return { triggered: alerts.length > 0, types: alerts.map(a => a.type) }
}

// ── 主入口 ──────────────────────────────────────────────────────────────────

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context

  // 鉴权
  const secret = request.headers.get('X-Cron-Secret')
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: CORS })
  }

  if (!env.AGENT_MEMORY || !env.AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'missing env' }), { status: 500, headers: CORS })
  }

  // 读取所有活跃用户
  const activeUsers = await env.AGENT_MEMORY.get('adam:active_users', 'json') as string[] | null || []
  if (activeUsers.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0, note: '无活跃用户' }), { headers: CORS })
  }

  const results: Record<string, any> = {}
  const sentryResults: Record<string, any> = {}

  // 并行：sentry + trust ladder + wakeup
  await Promise.all(activeUsers.slice(0, 10).map(async (tKey) => {
    // 1. Market Sentry — 始终运行，不受 next_wake 限制
    try {
      const s = await runMarketSentry(tKey, env)
      if (s.triggered) sentryResults[tKey] = s
    } catch {}

    // 2. Trust Ladder — 检查是否满足升级条件
    try {
      const levelChange = await evaluateCreditLevel(tKey, env)
      if (levelChange) {
        const inboxKey = `adam:inbox:${tKey}`
        const inbox = ((await env.AGENT_MEMORY.get(inboxKey, 'json')) as any[] | null) || []
        inbox.push({
          id: `level_up_${Date.now()}`,
          content: `🏅 信用等级升级：${levelChange.from} → ${levelChange.to}。你的权限已扩展。`,
          timestamp: new Date().toISOString(),
          read: false,
        })
        await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(inbox.slice(-20)), { expirationTtl: 7 * 24 * 3600 })
      }
    } catch {}

    // 3. B级+ 自动审批超24小时未否决的申请
    try {
      await checkAutoApprove(tKey, env)
    } catch {}

    // 4. 周期性唤醒
    try {
      results[tKey] = await wakeupUser(tKey, env)
    } catch (e: any) {
      results[tKey] = { error: (e as Error).message }
    }

    // 5. 亚当学院 — 今日课程（独立 AI 调用，不影响工作）
    try {
      const study = await studyTodaysLesson(tKey, env)
      if (study.studied) results[tKey] = { ...results[tKey], studied: study.lessonId }
      else if (study.error) results[tKey] = { ...results[tKey], study_error: study.error }
    } catch (e: any) {
      results[tKey] = { ...results[tKey], study_error: e.message }
    }
  }))

  return new Response(JSON.stringify({ ok: true, processed: Object.keys(results).length, sentry_alerts: Object.keys(sentryResults).length, results }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
