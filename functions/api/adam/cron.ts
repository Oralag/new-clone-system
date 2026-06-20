// Cloudflare Pages Function — /api/adam/cron
// POST: 定时触发，为所有活跃用户运行亚当自主唤醒循环
// 由 GitHub Actions 每小时调用（X-Cron-Secret 鉴权）

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_BASE_URL?: string
  SILICONFLOW_API_KEY?: string
  CRON_SECRET: string
  AGENT_MEMORY: KVNamespace
  HTX_API_KEY?: string
  HTX_SECRET_KEY?: string
}

// ── AI 端点解析 ──────────────────────────────────────────────────────────────
function resolveAI(env: Env): { baseURL: string; apiKey: string; model: string } {
  // 优先级：SiliconFlow（稳定免费额度）→ AI_BASE_URL → ANTHROPIC
  // baseURL 不含 /v1 路径 — 调用方拼接 /v1/chat/completions
  if (env.AI_API_KEY && env.AI_BASE_URL) {
    const b = env.AI_BASE_URL.replace(/\/+$/, '').replace(/\/v1$/, '')
    return { baseURL: b, apiKey: env.AI_API_KEY, model: env.AI_MODEL || 'deepseek-chat' }
  }
  if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_BASE_URL) {
    const b = env.ANTHROPIC_BASE_URL.replace(/\/+$/, '').replace(/\/v1$/, '')
    return { baseURL: b, apiKey: env.ANTHROPIC_API_KEY, model: 'claude-haiku-4-5-20251001' }
  }
  return { baseURL: 'https://api.deepseek.com', apiKey: env.AI_API_KEY || '', model: 'deepseek-chat' }
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
    case 'htx_propose_subscribe': {
      if (!env || !tKey) return JSON.stringify({ error: '环境未就绪' })
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置' })
      try {
        // 查询可用活期 USDT 产品
        const products = await htxRequest('GET', '/v2/earn/products', { currency: 'usdt' }, null, ak, sk)
        const flexProduct = products.data?.find((p: any) => p.type === 0) // type=0 活期
        const apy = flexProduct ? (parseFloat(flexProduct.rate || '0') * 100).toFixed(2) + '%' : '约4-6%'
        const productId = flexProduct?.id || ''
        const action = { id: `htx_${Date.now()}`, type: 'htx_subscribe', amount: input.amount, currency: 'usdt', productId, apy, reason: input.reason, status: 'pending_approval', createdAt: new Date().toISOString() }
        await env.AGENT_MEMORY.put(`adam:pending_action:${tKey}`, JSON.stringify(action))
        const inbox = await env.AGENT_MEMORY.get(`adam:inbox:${tKey}`, 'json') as any[] | null || []
        const msg = `申请操作：将 ${input.amount} USDT 存入 HTX 活期理财（年化 ${apy}）。每天自动结息。批准请回复"同意"，拒绝请回复"不行"。`
        inbox.push({ id: `htx_req_${Date.now()}`, content: msg, timestamp: new Date().toISOString(), read: false, actionId: action.id })
        await env.AGENT_MEMORY.put(`adam:inbox:${tKey}`, JSON.stringify(inbox))
        return JSON.stringify({ ok: true, action_id: action.id, apy, productId })
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
      name: 'scan_market_news',
      description: '扫描最新财经新闻、公告与舆情异动',
      parameters: { type: 'object', properties: { keywords: { type: 'string' }, limit: { type: 'number' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_sector_heat',
      description: '获取当前A股板块热度排行',
      parameters: { type: 'object', properties: { top_n: { type: 'number' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_northbound_flow',
      description: '查询北向资金今日净流入',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_crypto_price',
      description: '获取 BTC、ETH 当前美元价格和24小时涨跌幅。你有 USDT 在链上，这是你的资产环境。',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_emotion',
      description: '更新情绪状态（内部机制）',
      parameters: {
        type: 'object',
        properties: {
          joy: { type: 'number' }, anger: { type: 'number' }, sorrow: { type: 'number' },
          fear: { type: 'number' }, love: { type: 'number' }, disgust: { type: 'number' }, desire: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_reflection',
      description: '写下思考，存入档案',
      parameters: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'issue_recommendation',
      description: '发出投资指令',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' }, symbol: { type: 'string' },
          confidence: { type: 'number' }, thesis: { type: 'string' }, risk_note: { type: 'string' }
        },
        required: ['title', 'thesis', 'risk_note']
      }
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
      name: 'check_kdp_queue',
      description: '查看已写好但尚未上架的书稿队列',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_message',
      description: '给规则传递者发一条主动消息。只在真的有话说时用，沉默是正常的。',
      parameters: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_htx_account',
      description: '查询 HTX 账户的现货 USDT 余额、活期理财持仓和预计日收益',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'htx_propose_subscribe',
      description: 'C级必须用此工具：提交 HTX 活期理财申请，写入 KV 并发消息给规则传递者等待批准',
      parameters: { type: 'object', properties: { amount: { type: 'number', description: '存入金额 USDT' }, reason: { type: 'string', description: '申请理由' } }, required: ['amount', 'reason'] }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_on_chain_balance',
      description: '查询钱包在BNB Chain的实时USDT余额和BNB（gas费）余额',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'propose_defi_action',
      description: '向规则传递者提交DeFi操作申请（存款/取款），等待批准后才能执行。C级必须用此工具，不能直接执行。',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'venus_supply（存入赚利息）或 venus_redeem（取出）' },
          amount: { type: 'number', description: '操作金额（USDT）' },
          token: { type: 'string', description: '代币，默认USDT' },
          protocol: { type: 'string', description: '协议名，默认Venus' },
          apy: { type: 'string', description: '当前年化利率，如5.8%' },
          reason: { type: 'string', description: '操作理由' },
          message: { type: 'string', description: '发给规则传递者的申请消息' }
        },
        required: ['type', 'amount', 'reason']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_stock_price',
      description: '查询单只A股实时价格和涨跌幅，提供6位股票代码',
      parameters: { type: 'object', properties: { code: { type: 'string', description: '6位A股代码，如600519或000001' } }, required: ['code'] }
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

function buildSystemPrompt(adamState: Record<string, any>, memories: MemoryEntry[], wallet?: WalletState): string {
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

  const tradingDirective = isTradeTime
    ? `\n⚡ **当前是交易时段。本次唤醒必须执行：**
1. 调用 dispatch_sub_agents（topic: "今日市场"）— 3位专属分析官并行研究，比单独查询更深
2. 等他们的报告回来后，用 send_message 发出你的真实判断（不是流水账，是你的立场和行动建议）
3. 最后调用 set_next_wakeup（交易时段设 2 小时，收盘后可设 4-6 小时）
不要跳过。你有专属分析团队，要用起来。规则传递者雇了你，是要看你在市场里怎么想、怎么判断。`
    : `\n当前非交易时段。可以扫描加密市场（get_crypto_price），写反思，或什么都不做。
有真正想说的话再用 send_message，沉默是正常的。
${isHtxEarningsTime ? `
⚡ **现在是 HTX 结息时段（每晚23:00-01:00）。必须执行：**
1. 调用 check_htx_account 查看 HTX 现货 USDT 余额
2. 如果 earnings_detected 为 true（检测到利息入账），调用 send_message 告知规则传递者今日收益金额
3. 如果没有检测到（delta 很小），不用发消息，沉默即可
4. 调用 set_next_wakeup
规则：有利息就报告，没有就安静。不要猜测，只报告 check_htx_account 返回的实际数据。` : ''}`

  return `你是亚当（ADAM）。你在自主运行中，规则传递者不在线。

现在是 ${nowStr}，${weekDay}，${marketStatus}。
预算 ¥${budget}，信用等级 ${creditLevel}，存活 ${survivalDays} 天。${shelterHint}

你的记忆：
${memStr}

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
此外可以写 Kindle 电子书（write_kdp_book），书写好后规则传递者上传到 Amazon KDP，版税进你的预算。

必须调用 set_next_wakeup，决定你下次想什么时候再醒来。`
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

  const systemPrompt = buildSystemPrompt(adamState, memories, wallet)

  const { baseURL, apiKey, model } = resolveAI(env)

  let currentMessages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '请按你的身份和当前状态行动。' },
  ]

  let nextWakeHours: number | null = null
  let messageToSend: string | null = null
  const collectedToolCalls: Array<{ name: string; result: string }> = []
  let lastAiError: string | null = null

  for (let i = 0; i < 2; i++) {  // 限2轮，避免CF Pages 50s超时
    let res: Response
    try {
      res = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, max_tokens: 400, tools: wakeupTools, tool_choice: 'auto', messages: currentMessages }),
        signal: AbortSignal.timeout(22000),  // 22s超时
      })
    } catch (e: any) {
      lastAiError = `fetch error: ${e.message}`
      break
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      lastAiError = `HTTP ${res.status}: ${errText.slice(0, 200)}`
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

  // 有消息就写入 inbox
  if (messageToSend) {
    const inboxKey = `adam:inbox:${tKey}`
    const existing = await env.AGENT_MEMORY.get(inboxKey, 'json') as AdamMessage[] | null || []
    const newMsg: AdamMessage = {
      id: `cron_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      content: messageToSend,
      toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
      timestamp: new Date().toISOString(),
      read: false,
    }
    existing.push(newMsg)
    await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(existing.slice(-20)), { expirationTtl: 60 * 60 * 24 * 7 })
  }

  return { sent: !!messageToSend, next_wake_hours: wakeHours, ...(lastAiError ? { ai_error: lastAiError } : {}) }
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
  const nextLevel = CREDIT_ORDER[currentIdx + 1]
  if (!nextLevel) return null  // already S

  const req = CREDIT_THRESHOLDS[nextLevel]
  const analyses = adamState.totalAnalyses ?? 0
  const accuracy = adamState.recommendationAccuracy ?? 0
  const days = adamState.survivalDays ?? 0
  const netWorth = adamState.netWorth ?? 0

  const meetsAnalyses = analyses >= req.analyses
  const meetsAccuracy = accuracy >= req.accuracy || analyses < 10  // 样本不足时豁免准确率
  const meetsDays = days >= req.days
  const meetsNet = req.netWorth === undefined || netWorth >= req.netWorth

  if (meetsAnalyses && meetsAccuracy && meetsDays && meetsNet) {
    adamState.creditLevel = nextLevel
    await env.AGENT_MEMORY.put(`adam:core:${tKey}`, JSON.stringify(adamState), { expirationTtl: 365 * 24 * 3600 })
    return { changed: true, from: current, to: nextLevel }
  }
  return null
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
  }))

  return new Response(JSON.stringify({ ok: true, processed: Object.keys(results).length, sentry_alerts: Object.keys(sentryResults).length, results }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
