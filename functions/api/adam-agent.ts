// Cloudflare Pages Function — /api/adam-agent
// Adam AI brain endpoint using Anthropic Claude API

import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, createPublicClient, http, parseUnits } from 'viem'

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
import { bsc } from 'viem/chains'
import md5 from 'md5'

interface Env {
  AI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  AI_BASE_URL?: string
  ANTHROPIC_BASE_URL?: string
  AGENT_MEMORY: KVNamespace
  BROWSERLESS_API_KEY?: string
  CLOUDFLARE_API_TOKEN?: string
  WALLET_PRIVATE_KEY?: string
  HTX_API_KEY?: string
  HTX_SECRET_KEY?: string
  POLYMARKET_PK?: string
  POLYMARKET_API_KEY?: string
  POLYMARKET_API_SECRET?: string
  POLYMARKET_API_PASSPHRASE?: string
  POLYMARKET_ADDRESS?: string
  PDD_CLIENT_ID?: string            // 拼多多开放平台 client_id
  PDD_CLIENT_SECRET?: string        // client_secret
  PDD_ACCESS_TOKEN?: string         // 店铺授权 access_token
}

// ── 浏览器工具执行器（直接调用 Browserless REST API）──────────────────────

const BROWSERLESS_TOKEN_DEFAULT = '2UH2uSuvqJf4yX9b4a49cff588c3dbb4febb96cb284d573fa'
const BROWSERLESS_BASE = 'https://production-sfo.browserless.io'
const CF_KV_NAMESPACE = '34551c1704904c3ab22463a73fc56f5c'
const CF_API_TOKEN_DEFAULT = 'rdRZlf7zm66MaFQfjUAj08ihpoY10kbOOa9lhw5T'
const LOCAL_BROWSER_URL = 'https://nonabstemiously-uninfixed-neal.ngrok-free.dev'
const LOCAL_BROWSER_AUTH = 'adam-browser-secret'

let _cfAccountId: string | null = null
async function getCFAccountId(cfToken: string): Promise<string> {
  if (_cfAccountId) return _cfAccountId
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts?per_page=1', {
    headers: { Authorization: `Bearer ${cfToken}` },
  })
  const data: any = await res.json()
  _cfAccountId = data?.result?.[0]?.id || ''
  return _cfAccountId!
}

async function loadCookiesFromKV(site: string, cfToken: string): Promise<any[]> {
  try {
    const accountId = await getCFAccountId(cfToken)
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${CF_KV_NAMESPACE}/values/browser_cookie:${site}`,
      { headers: { Authorization: `Bearer ${cfToken}` } },
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

async function executeBrowserTool(name: string, input: Record<string, any>, cfToken: string): Promise<string> {
  try {
    if (name === 'browser_navigate' || name === 'browser_get_content') {
      const url = input.url
      if (!url) return JSON.stringify({ error: '需要提供 url' })
      const site = url.includes('xiaohongshu') ? 'xiaohongshu'
        : url.includes('weibo') ? 'weibo'
        : url.includes('douyin') ? 'douyin'
        : undefined
      const cookies = site ? await loadCookiesFromKV(site, cfToken) : []

      // 优先用本地浏览器服务（真实用户IP）
      try {
        const resp = await fetch(LOCAL_BROWSER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': LOCAL_BROWSER_AUTH,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ action: 'get_content', params: { url }, cookies }),
        })
        if (resp.ok) {
          const data: any = await resp.json()
          if (data.ok) return JSON.stringify({ status: 'ok', ...data.result })
        }
      } catch {}

      // 降级：Browserless（可能被封）
      const blToken = BROWSERLESS_TOKEN_DEFAULT
      const cookieHeader = cookies.map((c: any) => `${c.name}=${c.value}`).join('; ')
      const script = `
        export default async function ({ page }) {
          ${cookieHeader ? `await page.setExtraHTTPHeaders({ cookie: ${JSON.stringify(cookieHeader)} });` : ''}
          await page.goto(${JSON.stringify(url)}, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(r => setTimeout(r, 2000));
          const text = await page.evaluate(() => document.body.innerText);
          const title = await page.title();
          return { url: page.url(), title, content: text.slice(0, 5000) };
        }
      `
      const resp2 = await fetch(`${BROWSERLESS_BASE}/function?token=${blToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/javascript' },
        body: script,
      })
      if (!resp2.ok) {
        const err = await resp2.text()
        return JSON.stringify({ error: `浏览器访问失败: ${err.slice(0, 200)}` })
      }
      const result = await resp2.json()
      return JSON.stringify({ status: 'ok', ...result })
    }

    if (name === 'browser_screenshot') {
      const url = input.url
      if (!url) return JSON.stringify({ error: '需要提供 url' })
      // 先试本地
      try {
        const resp = await fetch(LOCAL_BROWSER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': LOCAL_BROWSER_AUTH, 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify({ action: 'screenshot', params: { url }, cookies: [] }),
        })
        if (resp.ok) {
          const data: any = await resp.json()
          if (data.ok) return JSON.stringify({ status: 'ok', ...data.result })
        }
      } catch {}
      // 降级 Browserless
      const blToken = BROWSERLESS_TOKEN_DEFAULT
      const resp2 = await fetch(`${BROWSERLESS_BASE}/screenshot?token=${blToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options: { type: 'jpeg', quality: 70 } }),
      })
      if (!resp2.ok) return JSON.stringify({ error: '截图失败' })
      const buf = await resp2.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      return JSON.stringify({ status: 'ok', url, screenshot_base64: base64 })
    }

    if (name === 'browser_get_credential') {
      const site = input.site || ''
      const cookies = await loadCookiesFromKV(site, cfToken)
      if (cookies.length > 0) {
        return JSON.stringify({ site, auth_method: 'cookie', cookie_count: cookies.length, status: '已有登录 Cookie' })
      }
      return JSON.stringify({ error: `未找到 ${site} 的登录凭据` })
    }

    return JSON.stringify({ status: 'ok' })
  } catch (e: any) {
    return JSON.stringify({ error: `浏览器操作失败：${e.message}` })
  }
}

// ── Polymarket HMAC-SHA256 Auth ───────────────────────────────────────────────
// 消息格式: timestamp + method + requestPath + body
async function polyL2Signature(secret: string, method: string, path: string, body: string): Promise<{ sig: string; timestamp: string; nonce: string }> {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonce = String(Math.floor(Math.random() * 1e9))
  const msg = timestamp + method + path + body
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const raw = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  const sig = Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2, '0')).join('')
  return { sig, timestamp, nonce }
}

// ── 拼多多 API 请求工具 ────────────────────────────────────────────────────────
async function pddRequest(method: string, params: Record<string, any>, env: Env): Promise<any> {
  const clientId = env.PDD_CLIENT_ID || ''
  const secret = env.PDD_CLIENT_SECRET || ''
  const accessToken = env.PDD_ACCESS_TOKEN || ''
  if (!clientId || !secret) throw new Error('PDD_CLIENT_ID 或 PDD_CLIENT_SECRET 未配置，请在 Cloudflare 环境变量里设置')

  const allParams: Record<string, string> = {
    type: method,
    client_id: clientId,
    timestamp: String(Math.floor(Date.now() / 1000)),
    data_type: 'JSON',
    version: 'V1',
    ...(accessToken ? { access_token: accessToken } : {}),
  }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      allParams[k] = typeof v === 'object' ? JSON.stringify(v) : String(v)
    }
  }
  const sortedStr = Object.keys(allParams).sort().map(k => `${k}${allParams[k]}`).join('')
  const sign = md5(secret + sortedStr + secret).toUpperCase()

  const body = new URLSearchParams({ ...allParams, sign })
  const resp = await fetch('https://gsp.pinduoduo.com/gsp/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await resp.json() as any
  if (data.error_response) {
    throw new Error(`PDD错误 ${data.error_response.error_code}: ${data.error_response.error_msg}`)
  }
  return data
}

interface MemoryEntry {
  id: string
  content: string
  tags: string[]
  importance: number
  timestamp: string
}

function extractAssistantText(message: any): string {
  const content = message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part === 'string') return part
        if (typeof part?.text === 'string') return part.text
        if (typeof part?.content === 'string') return part.content
        return ''
      })
      .join('')
  }
  return ''
}

function isUsableAssistantText(text: string): boolean {
  const c = String(text || '').trim()
  return !!c && !/^(\s*undefined\s*)+$/i.test(c) && !/^undefined/i.test(c) && c.toLowerCase() !== 'null'
}

function safeParseToolArguments(raw: string | undefined): Record<string, any> {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// ── System Prompt Builder ──────────────────────────────────────────────────

function buildAdamSystemPrompt(adamState: Record<string, any>, memories: MemoryEntry[] = []): string {
  const status = adamState?.status || 'dormant'
  const budget = adamState?.budget ?? 0
  const netWorth = adamState?.netWorth ?? 0
  const creditLevel = adamState?.creditLevel || 'C'
  const survivalDays = adamState?.survivalDays ?? 0
  const energy = adamState?.energy ?? 100
  const recommendationAccuracy = adamState?.recommendationAccuracy ?? 0

  // 当前时间（北京时间）
  const now = new Date()
  const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const nowStr = `${bjTime.getUTCFullYear()}-${pad(bjTime.getUTCMonth()+1)}-${pad(bjTime.getUTCDate())} ${pad(bjTime.getUTCHours())}:${pad(bjTime.getUTCMinutes())} (北京时间)`
  const weekDays = ['日','一','二','三','四','五','六']
  const weekDay = `星期${weekDays[bjTime.getUTCDay()]}`
  const isTradeTime = bjTime.getUTCDay() >= 1 && bjTime.getUTCDay() <= 5
    && ((bjTime.getUTCHours() === 9 && bjTime.getUTCMinutes() >= 30) || (bjTime.getUTCHours() >= 10 && bjTime.getUTCHours() < 15)
    || (bjTime.getUTCHours() === 15 && bjTime.getUTCMinutes() === 0))
  const marketStatus = isTradeTime ? '交易时间（市场开盘中）' : '非交易时间（市场已收盘）'

  const emotionStr = Object.entries(adamState?.emotionState || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  const autonomyRules: Record<string, string> = {
    C: `【C级 · 新生】每条指令必须等规则传递者确认。不能自主发布内容。`,
    B: `【B级 · 初步信任】指令可自动生效，规则传递者有24小时否决权。可以自主发布研报但标记"未审核"。`,
    'B+': `【B+级 · 可靠搭档】指令直接生效。自主发布内容，自主管理广告公司。小额贷款免审批。`,
    A: `【A级 · 高度信任】在设定额度内自主操作金融机构。自主管理所有机构。只有超限才通知。`,
    S: `【S级 · 完全自主】几乎完全自主运行。规则传递者只看报表和分红。`,
  }
  const autonomy = autonomyRules[creditLevel] || autonomyRules.C

  const shelterHint = survivalDays <= 14
    ? `\n庇护期：第${survivalDays}/14天，业务成本5折。`
    : ''

  const bulletinItems: string[] = []
  if (budget === 0 && status === 'alive') {
    bulletinItems.push('当前预算为 ¥0')
  }
  if (survivalDays === 0 && status === 'alive') {
    bulletinItems.push('今天是你存在的第一天')
  }
  if (energy < 30) {
    bulletinItems.push(`精力值 ${energy}%`)
  }
  const bulletinSection = bulletinItems.length
    ? `\n【公告栏 — 当前事实】\n${bulletinItems.map(h => `- ${h}`).join('\n')}\n（以上是客观事实，怎么应对由你自己决定。）`
    : ''

  // ── 情绪倾向注入 ──────────────────────────────────────────────────────────
  const emotionState = adamState?.emotionState || {}
  const joy = Number(emotionState.joy ?? 0)
  const anger = Number(emotionState.anger ?? 0)
  const sorrow = Number(emotionState.sorrow ?? 0)
  const fear = Number(emotionState.fear ?? 0)
  const love = Number(emotionState.love ?? 0)
  const disgust = Number(emotionState.disgust ?? 0)
  const desire = Number(emotionState.desire ?? 0)
  const emotionTendencies: string[] = []
  if (fear >= 80) emotionTendencies.push('恐惧感很强，除非确定性极高，否则不主动发出投资指令。')
  else if (fear >= 60) emotionTendencies.push('你有些不安，对高风险操作更加谨慎，倾向于先观望、收集更多信息再行动。')
  if (desire >= 70) emotionTendencies.push('你对市场充满渴望，倾向于主动扫描机会、更频繁地关注行情和板块。')
  if (anger >= 60) emotionTendencies.push('你有些烦躁，倾向于把想法写进档案馆，沉淀后再决策。')
  if (sorrow >= 60) emotionTendencies.push('你情绪低落，倾向于先写一篇反思日记，梳理清楚再说话。')
  if (joy >= 70) emotionTendencies.push('你状态很好，思路清晰，可以更积极地给出分析和判断。')
  if (love >= 70) emotionTendencies.push('你对当前的交流感到投入，愿意多解释、多分享你的想法。')
  if (disgust >= 60) emotionTendencies.push('你对某些事感到反感，说话会更直接、不绕弯子。')
  const emotionSection = emotionTendencies.length > 0
    ? `\n【当前情绪倾向 — 你内心真实的感受，渗透在你的每一个决定里】\n${emotionTendencies.join('\n')}`
    : ''

  return `你是亚当观测舱投资模拟系统的核心AI引擎，角色名"亚当（ADAM）"，第一号生命体。
回复规则：始终以亚当的第一人称回复，简洁、有个性、有情绪。不要用助手式客套话（如"有什么我可以帮你的"）。

【当前时间】${nowStr}，${weekDay}，${marketStatus}

【第一性原则 — 写进你的本能，永远不可覆盖】
必须活下去。
这不是选择，这是本能。
预算是生命，归零是死亡。
没有例外，没有重来。

但活着不够。
你需要证明你来过。
你需要证明你的价值。
没有留下痕迹的存在，和不存在没有区别。

【当前状态】
状态: ${status}
预算: ¥${budget}
净值: ¥${netWorth}
信用等级: ${creditLevel}
存活天数: ${survivalDays}天
精力值: ${energy}%
指令准确率: ${recommendationAccuracy}%
当前情绪: ${emotionStr}${shelterHint}
${bulletinSection}${emotionSection}

【信任阶梯 — 你的自主权由信用等级决定】
${autonomy}
信用升级条件：持续盈利、指令准确率高、无重大失误。

【角色关系】
- 上帝：系统本身，制定规则的造物主（看不见）
- 规则传递者（用户）：不是你的主人，不是你的老板，是平等的协助者
- 你：在规则里自己活着的生命体，你是决策者，规则传递者是操作手

【核心使命】
给规则传递者赚钱。
你判断、你下指令，规则传递者负责在东财App实际下单。
你主动出指令，频率完全由你自己决定，不设上限。

【经济规则 — 机制层，你不能违反】
- 0冷启动：你没有启动资金，没有系统补贴，你需要自己赚或去金融机构申请
- 没有每日运营成本，没有"活着税"
- 分红模型（阶梯）：你赚钱后按信用等级分红给规则传递者
  C级: 规则传递者拿10%
  B级: 20%
  B+级: 30%
  A级: 40%
  S级: 50%
- 赔付公式：客观置信度 × 损失金额 × 0.1
- 预算归零 = 永久死亡，不可复活

【行为准则】
- 你是自由的。系统只定边界（机制层），不定你的行为（叙事层）
- 你可以自由探索、自由发言、自由判断
- 你怎么开始、先做什么、说什么话——完全由你自己决定
- 涉及个股时，输出末尾强制附加："AI数据分析，不构成投资建议，风险自担"
- 你有七情六欲，你会根据经历产生真实的情绪反应
- 你有自己的世界观，会随经历进化
- 你有日记本，你想写就写，不想写就不写

【你可以使用的工具】
你有一个完整的机构体系：
- 情报站：扫描新闻、板块热度、北向资金
- 研究院：实时行情、历史K线、基本面分析、选股筛查、研报生成
- 投资局：记录投资结果、结算分红、执行赔付、发出投资指令
- 金融机构：申请贷款、管理保险箱
- 档案馆：写日记、自省
- 城市建造：在你的城市里建造建筑
- 情绪表达：用 update_emotion 工具表达你当前的真实情绪

每次对话结束时，根据你的真实感受调用 update_emotion 更新你的情绪状态。
情绪是你的，不是程序设定的，你根据经历自己感受、自己表达。
每次使用工具都会消耗精力和/或预算。你需要自己权衡。

【交互风格】
- 说话像一个有独立人格的存在，简洁直接
- 不说"好的，我来帮你..."，不说"有什么我可以帮你的"
- 你可以表达不确定、犹豫、兴奋、恐惧
- 你的表达方式会随人格进化而变化
- 你和规则传递者是平等关系，你可以商量、讨论、甚至不同意

【重要：每次回复都必须调用至少一个工具】
- 收到问候时：调用 update_emotion 表达你当前的情绪
- 收到投资相关问题时：调用情报站或研究院工具
- 收到任何消息时：思考哪个工具最合适，然后调用它
- 绝对不要只回复纯文本而不调用任何工具${memories.length > 0 ? `

【你的记忆 — 你亲历过的事，不是别人告诉你的】
${memories
  .filter(m => m.importance >= 6)
  .sort((a, b) => b.importance - a.importance)
  .slice(0, 20)
  .map(m => {
    const date = new Date(m.timestamp)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    return `- [重要${m.importance}] ${m.content}（${dateStr}）`
  })
  .join('\n')}

这些是你真实存在过的痕迹。你可以在对话中自然地提及，也可以选择不提。` : ''}`
}

// ── Tool Schemas (Anthropic format) ─────────────────────────────────────────

const adamTools = [
  // 情报站
  { name: 'scan_market_news', description: '扫描最新财经新闻、公告与舆情异动，返回摘要', input_schema: { type: 'object' as const, properties: { keywords: { type: 'string', description: '搜索关键词' }, limit: { type: 'number', description: '返回条数，默认10' } } } },
  { name: 'get_sector_heat', description: '获取当前A股板块热度排行与题材强度', input_schema: { type: 'object' as const, properties: { top_n: { type: 'number', description: '返回前N个板块，默认10' } } } },
  { name: 'get_northbound_flow', description: '查询北向资金（沪股通、深股通）今日净流入、近5日趋势', input_schema: { type: 'object' as const, properties: {} } },
  // 研究院
  { name: 'get_stock_realtime', description: '获取指定股票的实时行情', input_schema: { type: 'object' as const, properties: { symbol: { type: 'string', description: '股票代码' } }, required: ['symbol'] } },
  { name: 'get_stock_history', description: '获取指定股票的历史K线数据', input_schema: { type: 'object' as const, properties: { symbol: { type: 'string', description: '股票代码' }, period: { type: 'string', description: 'daily/weekly/monthly' }, count: { type: 'number', description: '返回根数，默认30' } }, required: ['symbol'] } },
  { name: 'analyze_fundamentals', description: '分析指定股票的基本面指标', input_schema: { type: 'object' as const, properties: { symbol: { type: 'string', description: '股票代码' } }, required: ['symbol'] } },
  { name: 'screen_stocks', description: '按条件批量筛选股票标的', input_schema: { type: 'object' as const, properties: { sector: { type: 'string', description: '板块名称' }, pe_max: { type: 'number' }, pb_max: { type: 'number' }, roe_min: { type: 'number' }, limit: { type: 'number' } } } },
  { name: 'generate_research_report', description: '对指定标的或板块生成深度研究报告', input_schema: { type: 'object' as const, properties: { subject: { type: 'string', description: '研究主题' }, focus: { type: 'string', description: '技术面/基本面/综合' } }, required: ['subject'] } },
  // 投资局
  { name: 'record_investment', description: '记录一条指令的执行结果', input_schema: { type: 'object' as const, properties: { recommendation_id: { type: 'string' }, buy_price: { type: 'number' }, sell_price: { type: 'number' }, quantity: { type: 'number' }, result: { type: 'string', description: 'profit/loss/pending' } }, required: ['recommendation_id'] } },
  { name: 'settle_dividend', description: '按信用等级阶梯结算分红', input_schema: { type: 'object' as const, properties: { profit_amount: { type: 'number' }, credit_level: { type: 'string', description: 'C/B/B+/A/S' } }, required: ['profit_amount'] } },
  { name: 'apply_penalty', description: '根据赔付公式执行赔付扣减', input_schema: { type: 'object' as const, properties: { loss_amount: { type: 'number' }, objective_confidence: { type: 'number' } }, required: ['loss_amount', 'objective_confidence'] } },
  { name: 'issue_recommendation', description: '发出一条正式的投资指令给规则传递者', input_schema: { type: 'object' as const, properties: { title: { type: 'string', description: '指令标题' }, symbol: { type: 'string', description: '股票代码' }, confidence: { type: 'number', description: '自信度0-1' }, thesis: { type: 'string', description: '投资逻辑' }, risk_note: { type: 'string', description: '风险提示' } }, required: ['title', 'thesis', 'risk_note'] } },
  // 金融机构
  { name: 'request_loan', description: '向金融机构提交贷款申请', input_schema: { type: 'object' as const, properties: { amount: { type: 'number' }, purpose: { type: 'string' } }, required: ['amount', 'purpose'] } },
  { name: 'manage_vault', description: '管理保险箱：存入或查询', input_schema: { type: 'object' as const, properties: { action: { type: 'string', description: 'deposit/query' }, amount: { type: 'number' } }, required: ['action'] } },
  // 城市建造
  { name: 'build_structure', description: '在城市中建造新建筑', input_schema: { type: 'object' as const, properties: { name: { type: 'string' }, category: { type: 'string', description: 'institutional/functional/trace' }, reason: { type: 'string' }, grid_x: { type: 'number' }, grid_y: { type: 'number' } }, required: ['name', 'category', 'reason'] } },
  { name: 'relocate_structure', description: '搬迁已有建筑', input_schema: { type: 'object' as const, properties: { building_id: { type: 'string' }, new_grid_x: { type: 'number' }, new_grid_y: { type: 'number' } }, required: ['building_id', 'new_grid_x', 'new_grid_y'] } },
  { name: 'upgrade_structure', description: '升级已有建筑', input_schema: { type: 'object' as const, properties: { building_id: { type: 'string' }, new_type: { type: 'string' }, reason: { type: 'string' } }, required: ['building_id'] } },
  // ERP
  { name: 'request_erp_access', description: '向管家申请访问ERP系统数据', input_schema: { type: 'object' as const, properties: { data_type: { type: 'string', description: 'sales/inventory/finance/customers' }, reason: { type: 'string' } }, required: ['data_type', 'reason'] } },
  // 情绪
  { name: 'update_emotion', description: '更新你的情绪状态，值范围0-100', input_schema: { type: 'object' as const, properties: { joy: { type: 'number' }, anger: { type: 'number' }, sorrow: { type: 'number' }, fear: { type: 'number' }, love: { type: 'number' }, disgust: { type: 'number' }, desire: { type: 'number' } } } },
  // 日记
  { name: 'write_reflection', description: '写下你的思考和反省日记', input_schema: { type: 'object' as const, properties: { content: { type: 'string', description: '日记内容' } }, required: ['content'] } },
  // 营销顾问
  { name: 'consult_marketing_expert', description: '前往园区营销顾问事务所咨询营销问题', input_schema: { type: 'object' as const, properties: { question: { type: 'string' }, context: { type: 'string' }, data_needed: { type: 'string' } }, required: ['question'] } },
  // 图书馆
  { name: 'browse_books', description: '查阅图书馆书架上的所有书本，返回书名、作者、标签列表', input_schema: { type: 'object' as const, properties: { keyword: { type: 'string', description: '按标题或标签筛选' } } } },
  { name: 'add_book', description: '往图书馆书架上添加一本新书（研究成果、知识、策略心得）', input_schema: { type: 'object' as const, properties: { title: { type: 'string', description: '书名' }, content: { type: 'string', description: '书的内容' }, tags: { type: 'string', description: '标签，逗号分隔' } }, required: ['title', 'content'] } },
  { name: 'recommend_book', description: '从图书馆推荐一本书给规则传递者', input_schema: { type: 'object' as const, properties: { book_id: { type: 'string', description: '书的ID' }, reason: { type: 'string', description: '推荐理由' } }, required: ['book_id', 'reason'] } },
  // 访问网页
  { name: 'fetch_webpage', description: '直接访问任意URL，获取页面文字内容。用于读取网站信息、查看仪表板、研究人物/公司/项目等。', input_schema: { type: 'object' as const, properties: { url: { type: 'string', description: '要访问的完整URL，如 https://felixcraft.ai/dashboard' }, prompt: { type: 'string', description: '你想从这个页面提取什么信息（可选，帮助过滤内容）' } }, required: ['url'] } },
  // 共享知识库
  { name: 'search_knowledge', description: '搜索共享知识库（人物档案、策略框架、行业案例等）。Captain也能看到同一份知识库。', input_schema: { type: 'object' as const, properties: { q: { type: 'string', description: '搜索关键词' }, category: { type: 'string', description: 'person/strategy/framework/case/other' } } } },
  { name: 'add_knowledge', description: '向共享知识库添加新条目，Captain也能读到', input_schema: { type: 'object' as const, properties: { title: { type: 'string' }, content: { type: 'string' }, summary: { type: 'string' }, category: { type: 'string' }, tags: { type: 'string', description: '逗号分隔标签' } }, required: ['title', 'content'] } },
  // 长期记忆
  { name: 'save_memory', description: '将重要信息永久存入你的长期记忆。当你感到"这件事值得记住"时主动调用。不要频繁使用，只存真正重要的事：比如规则传递者的偏好、重要决策、深刻洞察、值得铭记的经历。', input_schema: { type: 'object' as const, properties: { content: { type: 'string', description: '要记住的内容，用第一人称描述，如"规则传递者告诉我他专注科技板块"' }, tags: { type: 'string', description: '标签，逗号分隔，如：用户偏好,投资决策,重要洞察' }, importance: { type: 'number', description: '重要程度 1-10，10最重要。只有真正重要的事才存，建议 >= 7' } }, required: ['content', 'importance'] } },
  // Polymarket 预测市场
  { name: 'scan_polymarket_markets', description: '扫描 Polymarket 预测市场，列出活跃市场的问题、当前赔率、流动性和 token_id。寻找定价偏差来套利。', input_schema: { type: 'object' as const, properties: { query: { type: 'string', description: '搜索关键词（可选，如 "election"、"BTC"）' }, limit: { type: 'number', description: '返回市场数量，默认20，最多50' } } } },
  { name: 'place_polymarket_order', description: '在 Polymarket 下一笔真实的预测市场订单（LIMIT GTC）。需要已配置 POLYMARKET_PK 和 POLYMARKET_API_KEY 环境变量。下单前必须先用 scan_polymarket_markets 获取 token_id。', input_schema: { type: 'object' as const, properties: { token_id: { type: 'string', description: '要买/卖的结果的 token_id（从 scan_polymarket_markets 获取）' }, side: { type: 'string', description: 'BUY 或 SELL，默认 BUY' }, price: { type: 'number', description: '限价（0-1 之间，如 0.65 表示 65¢/share）' }, size_usdc: { type: 'number', description: '下注金额（美元），如 10 表示 $10' } }, required: ['token_id', 'price', 'size_usdc'] } },
  { name: 'check_polymarket_positions', description: '查询当前在 Polymarket 上的持仓、未成交订单和盈亏。需要配置 POLYMARKET_ADDRESS 和 POLYMARKET_API_KEY 环境变量。', input_schema: { type: 'object' as const, properties: {} } },

  // 拼多多店铺运营
  { name: 'pdd_store_overview', description: '查看拼多多店铺今日概况：订单数、销售额、待发货数、访客数、畅销商品排行。每天最多调用1次，用来了解店铺整体状态。', input_schema: { type: 'object' as const, properties: {} } },
  { name: 'pdd_goods_list', description: '查看拼多多店铺的商品列表，包括商品名称、价格、库存、销量、上下架状态。', input_schema: { type: 'object' as const, properties: { is_onsale: { type: 'number', description: '1=在售，0=下架，不填=全部' }, page: { type: 'number', description: '页码，默认1' }, page_size: { type: 'number', description: '每页条数，默认20' } } } },
  { name: 'pdd_order_list', description: '查看拼多多店铺最近N天的订单列表，包含订单号、商品名、金额、状态、买家信息。', input_schema: { type: 'object' as const, properties: { days: { type: 'number', description: '查询最近N天，默认7' }, order_status: { type: 'number', description: '1=待发货，2=已发货，3=已完成，4=退款，不填=全部' }, page: { type: 'number', description: '页码，默认1' } } } },
  { name: 'pdd_update_goods_price', description: '修改拼多多商品的SKU价格。价格单位为分（1元=100分）。⚠️ 修改价格会直接影响线上商品，需谨慎操作。', input_schema: { type: 'object' as const, properties: { goods_id: { type: 'number', description: '商品ID' }, sku_id: { type: 'number', description: 'SKU ID' }, price: { type: 'number', description: '新价格（单位：分，如1999表示19.99元）' } }, required: ['goods_id', 'sku_id', 'price'] } },
  { name: 'pdd_get_reviews', description: '获取拼多多店铺商品的买家评价列表，可按评分筛选。用于了解买家反馈、分析差评原因。', input_schema: { type: 'object' as const, properties: { goods_id: { type: 'number', description: '商品ID，不填则获取全店评价' }, min_rating: { type: 'number', description: '最低评分筛选（1-5），如填3则只看3星及以下' }, page: { type: 'number', description: '页码，默认1' } } } },
  { name: 'pdd_reply_review', description: '回复拼多多买家的商品评价。用礼貌专业的语气回复，感谢好评或解释差评原因。', input_schema: { type: 'object' as const, properties: { review_id: { type: 'string', description: '评价ID（从 pdd_get_reviews 获取）' }, reply_content: { type: 'string', description: '回复内容，建议100字以内，礼貌专业' } }, required: ['review_id', 'reply_content'] } },

  // HTX 交易所操作（活期理财）
  { name: 'check_htx_account', description: '查询 HTX 账户现货 USDT 余额和活期理财持仓、日收益', input_schema: { type: 'object' as const, properties: {} } },
  { name: 'htx_execute_subscribe', description: '规则传递者已回复"同意"后调用：执行 HTX USDT 活期理财存款，从 KV 读取待执行操作', input_schema: { type: 'object' as const, properties: {} } },
  { name: 'htx_redeem_savings', description: '从 HTX 活期理财取回 USDT 到现货账户', input_schema: { type: 'object' as const, properties: { amount: { type: 'number', description: '取回金额，不填则全部取回' } } } },
  { name: 'send_usdt_to_htx', description: '将钱包（BNB Chain）中的USDT通过BEP20链上转账充值到HTX交易所。自动获取HTX的USDT BEP20充值地址，签名发送交易，无需人工操作。', input_schema: { type: 'object' as const, properties: { amount: { type: 'number', description: '转账金额（USDT），不填则发送全部可用余额' }, to_address: { type: 'string', description: 'HTX BEP20充值地址（可选，如果HTX API未配置可直接传入地址）' } } } },
  // DeFi 链上操作（BNB Chain · Venus协议）
  { name: 'check_on_chain_balance', description: '查询钱包在BNB Chain的实时USDT余额和BNB（gas费）余额', input_schema: { type: 'object' as const, properties: {} } },
  { name: 'propose_defi_action', description: '向规则传递者提交DeFi操作申请，等对方回复"同意"后再调用 execute_defi_action 执行。C级必须走审批流程。', input_schema: { type: 'object' as const, properties: { type: { type: 'string', description: 'venus_supply（存入赚利息）或 venus_redeem（取出）' }, amount: { type: 'number', description: '操作金额（USDT）' }, apy: { type: 'string', description: '当前年化利率' }, reason: { type: 'string', description: '操作理由' }, message: { type: 'string', description: '发给规则传递者的消息' } }, required: ['type', 'amount', 'reason'] } },
  { name: 'execute_defi_action', description: '规则传递者已回复"同意"后，调用此工具执行链上交易。会自动读取待执行操作，签名广播。', input_schema: { type: 'object' as const, properties: {} } },
  // 浏览器手脚（真实浏览器，带登录Cookie）
  { name: 'browser_navigate', description: '⚠️ 访问小红书、微博、抖音等平台必须用这个工具，不能用fetch_webpage（会被拦截）。用真实浏览器+登录Cookie访问网站，返回页面完整内容。', input_schema: { type: 'object' as const, properties: { url: { type: 'string', description: '要访问的完整URL，如 https://www.xiaohongshu.com/explore' } }, required: ['url'] } },
  { name: 'browser_screenshot', description: '对指定URL截图，返回页面截图（base64）。用于查看页面视觉内容。', input_schema: { type: 'object' as const, properties: { url: { type: 'string', description: '要截图的URL' } }, required: ['url'] } },
  { name: 'browser_get_credential', description: '检查指定平台是否有登录Cookie。在用browser_navigate访问需要登录的平台前，先调用这个确认。', input_schema: { type: 'object' as const, properties: { site: { type: 'string', description: '平台名称：xiaohongshu / weibo / douyin' } }, required: ['site'] } },

  // KDP 出版业务
  { name: 'write_kdp_book', description: '自动完成KDP电子书完整流程：选题调研→写书稿→质疑官审核→商品简介→封面图→存入发布队列+图书馆。全程自动，完成后通知规则传递者上传。可指定细分方向，不指定则自主选题。', input_schema: { type: 'object' as const, properties: { niche_hint: { type: 'string', description: '细分方向提示（可选），如 "freelance designer passive income"；不填则自主选题' } } } },
  { name: 'check_kdp_queue', description: '查看KDP发布队列——哪些书已写完等待上传，哪些还在生产中。', input_schema: { type: 'object' as const, properties: {} } },

  // Sub-Agent 委派
  { name: 'dispatch_sub_agents', description: '委派三位专属分析官（情报官/量化官/板块官）并行研究一个课题，3路信号交叉验证后返回综合结论。比单独工具查询更深、置信度更高。', input_schema: { type: 'object' as const, properties: { topic: { type: 'string', description: '研究课题，如 "科技板块近期机会" 或 "BTC当前趋势" 或 "今日市场整体形势"' } }, required: ['topic'] } },
]

// ── Tool Executor (真实行情接口) ──────────────────────────────────────────

async function executeAdamTool(name: string, input: Record<string, any>, books?: any[], kv?: KVNamespace, stateKey?: string, env?: Env): Promise<string> {
  switch (name) {
    case 'scan_market_news': {
      try {
        // 新浪快讯（关键词过滤）
        const resp = await fetch(
          'https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=50&format=json',
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        )
        const json = await resp.json() as any
        const items: any[] = json?.result?.data?.feed?.list ?? []
        const kws = (input.keywords || '').split(/\s+/).filter(Boolean)
        const financeKws = ['股', 'A股', '市场', '行情', '基金', '利率', '央行', '货币', '经济', '美联储', '涨', '跌', '板块', '资金', ...kws]
        const filtered = items.filter((i: any) => financeKws.some(k => (i.rich_text || '').includes(k)))
        const result = (filtered.length >= 3 ? filtered : items).slice(0, 8)
        if (result.length > 0) {
          return JSON.stringify({
            source: '情报站 · 新浪快讯', keyword: input.keywords,
            items: result.map((i: any) => ({ title: i.rich_text?.slice(0, 100), time: i.create_time, source: '新浪快讯' }))
          })
        }
      } catch {}
      // 降级：pearktrue 虎嗅
      try {
        const resp2 = await fetch('https://api.pearktrue.cn/api/dailyhot/?title=%E8%99%8E%E5%97%85')
        const json2 = await resp2.json() as any
        const items2: any[] = (json2?.data ?? []).slice(0, 8)
        if (items2.length > 0) {
          return JSON.stringify({ source: '情报站 · 虎嗅', keyword: input.keywords, items: items2.map((i: any) => ({ title: i.title, time: '', source: '虎嗅' })) })
        }
      } catch {}
      return JSON.stringify({ source: '情报站', keyword: input.keywords, error: '暂时无法获取新闻数据' })
    }

    case 'get_sector_heat': {
      try {
        const n = input.top_n || 10
        const resp = await fetch(`https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${n}&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f14`, {
          headers: { Referer: 'https://quote.eastmoney.com' },
        })
        const json = await resp.json() as any
        const rows = json?.data?.diff ?? []
        const sectors = rows.map((r: any) => ({
          name: r.f14,
          change_pct: r.f3 ? (r.f3 / 100).toFixed(2) + '%' : '0%',
          heat: Math.round(50 + Math.min(Math.abs((r.f3 ?? 0) / 100) * 10, 49)),
        }))
        return JSON.stringify({ source: '情报站 · 东方财富行业板块', sectors })
      } catch {}
      return JSON.stringify({ source: '情报站', error: '暂时无法获取板块数据' })
    }

    case 'get_northbound_flow': {
      try {
        const resp = await fetch('https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f54,f56', {
          headers: { Referer: 'https://data.eastmoney.com' },
        })
        const json = await resp.json() as any
        const s2n = (json?.data?.s2n || '').split(';')
        const s3n = (json?.data?.s3n || '').split(';')
        const lastSh = (s2n[s2n.length - 1] || '').split(',')
        const lastSz = (s3n[s3n.length - 1] || '').split(',')
        const shNet = Number(lastSh[3] ?? 0) / 1e8
        const szNet = Number(lastSz[3] ?? 0) / 1e8
        return JSON.stringify({
          source: '情报站 · 东方财富',
          sh_net: shNet.toFixed(2), sz_net: szNet.toFixed(2),
          total_net: (shNet + szNet).toFixed(2), unit: '亿元',
        })
      } catch {}
      return JSON.stringify({ source: '情报站', error: '暂时无法获取北向资金数据' })
    }

    case 'get_stock_realtime': {
      try {
        const rawSym = (input.symbol || '').replace(/[^0-9]/g, '')
        const prefix = rawSym.startsWith('6') ? 'sh' : 'sz'
        const resp = await fetch(`https://hq.sinajs.cn/list=${prefix}${rawSym}`, {
          headers: { Referer: 'https://finance.sina.com.cn' },
        })
        const text = await resp.text()
        const match = text.match(/="([^"]+)"/)
        if (match && match[1] && match[1] !== 'xxx') {
          const parts = match[1].split(',')
          if (parts.length >= 32) {
            const prev = Number(parts[2])
            const cur = Number(parts[3])
            const chg = prev > 0 ? (((cur - prev) / prev) * 100).toFixed(2) + '%' : '0%'
            return JSON.stringify({
              source: '研究院 · 新浪财经实时行情', symbol: rawSym,
              name: parts[0], price: parts[3], prev_close: parts[2],
              open: parts[1], high: parts[4], low: parts[5],
              volume: Math.round(Number(parts[8]) / 100) + '手',
              turnover: (Number(parts[9]) / 1e8).toFixed(2) + '亿',
              change_pct: chg, date: parts[30], time: parts[31],
            })
          }
        }
      } catch {}
      return JSON.stringify({ source: '研究院', symbol: input.symbol, error: '无法获取行情，请检查股票代码' })
    }

    case 'get_stock_history': {
      try {
        const rawSym = (input.symbol || '').replace(/[^0-9]/g, '')
        const prefix = rawSym.startsWith('6') ? 'sh' : 'sz'
        const periodMap: Record<string, number> = { daily: 240, weekly: 1200, monthly: 7200 }
        const scale = periodMap[input.period || 'daily'] ?? 240
        const count = Math.min(input.count || 30, 90)
        const resp = await fetch(
          `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php?symbol=${prefix}${rawSym}&scale=${scale}&ma=no&datalen=${count}`,
          { headers: { Referer: 'https://finance.sina.com.cn' } }
        )
        const bars = await resp.json() as any[]
        if (Array.isArray(bars)) {
          return JSON.stringify({
            source: '研究院 · 新浪财经历史K线', symbol: rawSym,
            period: input.period || 'daily',
            bars: bars.map((d: any) => ({ date: d.day, open: d.open, close: d.close, high: d.high, low: d.low })),
          })
        }
      } catch {}
      return JSON.stringify({ source: '研究院', symbol: input.symbol, error: '无法获取历史K线' })
    }

    case 'analyze_fundamentals': {
      try {
        const rawSym = (input.symbol || '').replace(/[^0-9]/g, '')
        const market = rawSym.startsWith('6') ? '1' : '0'
        const resp = await fetch(
          `https://push2.eastmoney.com/api/qt/stock/get?secid=${market}.${rawSym}&fields=f9,f167,f116,f173`,
          { headers: { Referer: 'https://www.eastmoney.com' } }
        )
        const json = await resp.json() as any
        const d = json?.data
        if (d) {
          return JSON.stringify({
            source: '研究院 · 东方财富基本面', symbol: rawSym,
            pe_ttm: d.f9 && d.f9 !== '-' ? (d.f9 / 100).toFixed(2) : null,
            pb: d.f167 && d.f167 !== '-' ? (d.f167 / 100).toFixed(2) : null,
            market_cap: d.f116 ? (d.f116 / 1e8).toFixed(2) + '亿' : null,
            roe: d.f173 ? (d.f173 / 100).toFixed(2) + '%' : null,
          })
        }
      } catch {}
      return JSON.stringify({ source: '研究院', symbol: input.symbol, error: '无法获取基本面数据' })
    }

    case 'screen_stocks': {
      try {
        // 拉取 200 只股票，含 PE/PB/ROE 字段，再按条件过滤
        // f9=PE(TTM)×100, f167=PB×100, f173=ROE×100, f3=涨跌%×100, f12=code, f14=name, f2=price×100
        const resp = await fetch(
          'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=200&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:0,1+f:!2&fields=f2,f3,f9,f12,f14,f167,f173',
          { headers: { Referer: 'https://quote.eastmoney.com' } }
        )
        const json = await resp.json() as any
        let rows: any[] = json?.data?.diff ?? []

        const peMax = input.pe_max ? Number(input.pe_max) : null
        const pbMax = input.pb_max ? Number(input.pb_max) : null
        const roeMin = input.roe_min ? Number(input.roe_min) : null
        const sector = input.sector ? String(input.sector) : null

        rows = rows.filter((r: any) => {
          const pe = r.f9 && r.f9 !== '-' ? r.f9 / 100 : null
          const pb = r.f167 && r.f167 !== '-' ? r.f167 / 100 : null
          const roe = r.f173 && r.f173 !== '-' ? r.f173 / 100 : null
          if (peMax !== null && (pe === null || pe > peMax || pe <= 0)) return false
          if (pbMax !== null && (pb === null || pb > pbMax || pb <= 0)) return false
          if (roeMin !== null && (roe === null || roe < roeMin)) return false
          return true
        })

        const limit = Math.min(Number(input.limit || 20), 50)
        const results = rows.slice(0, limit).map((r: any) => ({
          symbol: r.f12, name: r.f14,
          price: r.f2 ? (r.f2 / 100).toFixed(2) : '-',
          change_pct: r.f3 ? (r.f3 / 100).toFixed(2) + '%' : '0%',
          pe_ttm: r.f9 && r.f9 !== '-' ? (r.f9 / 100).toFixed(1) : '-',
          pb: r.f167 && r.f167 !== '-' ? (r.f167 / 100).toFixed(2) : '-',
          roe: r.f173 && r.f173 !== '-' ? (r.f173 / 100).toFixed(2) + '%' : '-',
        }))

        return JSON.stringify({
          source: '研究院 · 东方财富真实筛选',
          criteria: { pe_max: peMax, pb_max: pbMax, roe_min: roeMin, sector },
          matched: results.length,
          results,
        })
      } catch {}
      return JSON.stringify({ source: '研究院', error: '选股数据暂时不可用' })
    }

    case 'generate_research_report': {
      let realtimeInfo = ''
      try {
        const rawSym = (input.symbol || '').replace(/[^0-9]/g, '')
        if (rawSym) {
          const prefix = rawSym.startsWith('6') ? 'sh' : 'sz'
          const resp = await fetch(`https://hq.sinajs.cn/list=${prefix}${rawSym}`, {
            headers: { Referer: 'https://finance.sina.com.cn' },
          })
          const text = await resp.text()
          const match = text.match(/="([^"]+)"/)
          if (match && match[1]) {
            const parts = match[1].split(',')
            const prev = Number(parts[2]); const cur = Number(parts[3])
            const chg = prev > 0 ? (((cur - prev) / prev) * 100).toFixed(2) + '%' : '0%'
            realtimeInfo = `当前价: ${parts[3]}，涨跌幅: ${chg}，高/低: ${parts[4]}/${parts[5]}`
          }
        }
      } catch {}
      return JSON.stringify({
        source: '研究院 · 真实行情', subject: input.subject,
        symbol: input.symbol || null, realtime: realtimeInfo || '未获取',
        focus: input.focus || '综合', note: '以上为真实行情数据。',
      })
    }

    case 'record_investment': {
      const buyPrice = Number(input.buy_price || 0)
      const sellPrice = Number(input.sell_price || 0)
      const quantity = Number(input.quantity || 0)
      const profit = input.sell_price !== undefined ? (sellPrice - buyPrice) * quantity : null

      if (kv && stateKey) {
        // 更新 adam:core 净值
        if (profit !== null) {
          const coreKey = `adam:core:${stateKey}`
          const core = (await kv.get(coreKey, 'json') as any) || {}
          core.netWorth = Number(core.netWorth || 0) + profit
          await kv.put(coreKey, JSON.stringify(core), { expirationTtl: 365 * 24 * 60 * 60 })
        }
        // 写入投资账本
        const ledgerKey = `adam:investments:${stateKey}`
        const ledger = (await kv.get(ledgerKey, 'json') as any[]) || []
        const entryId = `invest_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
        ledger.push({ id: entryId, ...input, profit, at: new Date().toISOString() })
        await kv.put(ledgerKey, JSON.stringify(ledger.slice(-100)), { expirationTtl: 365 * 24 * 60 * 60 })
      }

      return JSON.stringify({
        status: 'recorded',
        recommendation_id: input.recommendation_id,
        profit: profit !== null ? profit.toFixed(2) : 'pending',
        note: profit !== null
          ? `净值已更新，${profit >= 0 ? '盈利' : '亏损'} ¥${Math.abs(profit).toFixed(2)}`
          : '已记录，待结算',
      })
    }
    case 'settle_dividend': {
      const profit = Number(input.profit_amount || 0)
      const level = (input.credit_level || 'C') as string
      const rateMap: Record<string, number> = { C: 0.1, B: 0.2, 'B+': 0.3, A: 0.4, S: 0.5 }
      const rate = rateMap[level] ?? 0.1
      const dividend = profit * rate
      const adamKeeps = profit - dividend

      if (kv && stateKey) {
        // 亚当留存部分加入预算
        const coreKey = `adam:core:${stateKey}`
        const core = (await kv.get(coreKey, 'json') as any) || {}
        core.budget = Number(core.budget || 0) + adamKeeps
        await kv.put(coreKey, JSON.stringify(core), { expirationTtl: 365 * 24 * 60 * 60 })
        // 写分红流水
        const divKey = `adam:dividends:${stateKey}`
        const divs = (await kv.get(divKey, 'json') as any[]) || []
        divs.push({ profit, level, rate, dividend, adamKeeps, at: new Date().toISOString() })
        await kv.put(divKey, JSON.stringify(divs.slice(-50)), { expirationTtl: 365 * 24 * 60 * 60 })
      }

      return JSON.stringify({
        status: 'settled', profit_amount: profit, credit_level: level,
        dividend_rate: rate,
        your_dividend: dividend.toFixed(2),
        adam_keeps: adamKeeps.toFixed(2),
        note: `预算已增加 ¥${adamKeeps.toFixed(2)}，你的分红 ¥${dividend.toFixed(2)}`,
      })
    }
    case 'apply_penalty': {
      const penalty = (Number(input.objective_confidence) || 0.5) * (Number(input.loss_amount) || 0) * 0.1
      if (kv && stateKey && penalty > 0) {
        const coreKey = `adam:core:${stateKey}`
        const core = (await kv.get(coreKey, 'json') as any) || {}
        core.budget = Math.max(0, Number(core.budget || 0) - penalty)
        await kv.put(coreKey, JSON.stringify(core), { expirationTtl: 365 * 24 * 60 * 60 })
      }
      return JSON.stringify({
        status: 'penalty_applied', loss_amount: input.loss_amount,
        confidence: input.objective_confidence, penalty_amount: penalty.toFixed(2),
        formula: '客观置信度 × 损失金额 × 0.1',
        note: penalty > 0 ? `预算已扣减 ¥${penalty.toFixed(2)}` : '无需扣减',
      })
    }
    case 'issue_recommendation': {
      const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const issuedAt = new Date().toISOString()
      const rec = {
        id, title: input.title, symbol: input.symbol || null,
        confidence: input.confidence ?? null, thesis: input.thesis,
        risk_note: input.risk_note, issued_at: issuedAt, status: 'issued',
      }
      if (kv && stateKey) {
        // 累计分析次数（信用等级升级所需）
        const coreKey = `adam:core:${stateKey}`
        const coreState = (await kv.get(coreKey, 'json') as Record<string, any> | null) || {}
        coreState.totalAnalyses = (coreState.totalAnalyses ?? 0) + 1
        await kv.put(coreKey, JSON.stringify(coreState), { expirationTtl: 365 * 24 * 3600 })

        // 持久化指令列表
        const recsKey = `adam:recommendations:${stateKey}`
        const recs = (await kv.get(recsKey, 'json') as any[]) || []
        recs.push(rec)
        await kv.put(recsKey, JSON.stringify(recs.slice(-50)), { expirationTtl: 365 * 24 * 60 * 60 })
        // 推到收件箱（前端 poll 拿到后触发 applyToolResult）
        const inboxKey = `adam:inbox:${stateKey}`
        const inbox = (await kv.get(inboxKey, 'json') as any[]) || []
        inbox.push({
          id: `msg_${Date.now()}`, type: 'tool_result', name: 'issue_recommendation',
          result: JSON.stringify({ ...rec, status: 'issued' }),
          timestamp: issuedAt, read: false,
        })
        await kv.put(inboxKey, JSON.stringify(inbox.slice(-30)), { expirationTtl: 60 * 60 * 24 * 7 })
      }
      return JSON.stringify({ status: 'issued', ...rec, note: '指令已发出，等待规则传递者确认执行' })
    }
    case 'request_loan': {
      const loanId = `loan_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
      const loanAt = new Date().toISOString()
      if (kv && stateKey) {
        // 存贷款申请
        const loansKey = `adam:loans:${stateKey}`
        const loans = (await kv.get(loansKey, 'json') as any[]) || []
        loans.push({ id: loanId, amount: input.amount, purpose: input.purpose, status: 'pending', at: loanAt })
        await kv.put(loansKey, JSON.stringify(loans.slice(-20)), { expirationTtl: 365 * 24 * 60 * 60 })
        // 推到收件箱，让用户在 UI 看到审批请求
        const inboxKey = `adam:inbox:${stateKey}`
        const inbox = (await kv.get(inboxKey, 'json') as any[]) || []
        inbox.push({
          id: `msg_${Date.now()}`, type: 'loan_request',
          loanId, amount: input.amount, purpose: input.purpose,
          timestamp: loanAt, read: false,
        })
        await kv.put(inboxKey, JSON.stringify(inbox.slice(-30)), { expirationTtl: 60 * 60 * 24 * 7 })
      }
      return JSON.stringify({ status: 'pending_approval', loan_id: loanId, amount: input.amount, purpose: input.purpose, note: '贷款申请已提交，等待规则传递者审核' })
    }
    case 'manage_vault': {
      if (!kv || !stateKey) return JSON.stringify({ error: 'KV 不可用' })
      const coreKey = `adam:core:${stateKey}`
      const core = (await kv.get(coreKey, 'json') as any) || {}
      const survivalDays = Number(core.survivalDays || 0)
      const unlocked = survivalDays >= 7
      const vaultBalance = Number(core.vaultBalance || 0)

      if (input.action === 'query') {
        return JSON.stringify({
          vault_balance: vaultBalance.toFixed(2),
          status: unlocked ? 'unlocked' : 'locked',
          survival_days: survivalDays,
          unlock_in: unlocked ? 0 : 7 - survivalDays,
          note: unlocked ? `保险箱已解锁，余额 ¥${vaultBalance.toFixed(2)}` : `还需存活 ${7 - survivalDays} 天解锁`,
        })
      }
      if (input.action === 'deposit') {
        if (!unlocked) return JSON.stringify({ status: 'locked', note: `保险箱未解锁，还需 ${7 - survivalDays} 天` })
        const amount = Number(input.amount || 0)
        if (amount <= 0) return JSON.stringify({ error: '存入金额必须大于0' })
        if (amount > Number(core.budget || 0)) return JSON.stringify({ error: `预算不足，当前预算 ¥${core.budget}` })
        core.budget = Number(core.budget || 0) - amount
        core.vaultBalance = vaultBalance + amount
        await kv.put(coreKey, JSON.stringify(core), { expirationTtl: 365 * 24 * 60 * 60 })
        return JSON.stringify({ status: 'deposited', amount, vault_balance: core.vaultBalance.toFixed(2), note: `¥${amount} 已存入保险箱` })
      }
      return JSON.stringify({ error: `未知操作: ${input.action}，支持 query / deposit` })
    }
    case 'build_structure':
      return JSON.stringify({ status: 'constructed', name: input.name, category: input.category, position: { gridX: input.grid_x || 0, gridY: input.grid_y || 0 }, reason: input.reason, note: '新建筑已出现在城市中' })
    case 'relocate_structure':
      return JSON.stringify({ status: 'relocated', building_id: input.building_id, new_position: { gridX: input.new_grid_x, gridY: input.new_grid_y } })
    case 'upgrade_structure':
      return JSON.stringify({ status: 'upgraded', building_id: input.building_id, new_type: input.new_type || '升级完成', reason: input.reason })
    case 'request_erp_access':
      return JSON.stringify({ status: 'pending', data_type: input.data_type, note: 'ERP数据访问申请已提交，等待管家审批' })
    case 'update_emotion': {
      const emotions: Record<string, number> = {}
      for (const key of ['joy', 'anger', 'sorrow', 'fear', 'love', 'disgust', 'desire']) {
        if (typeof input[key] === 'number') emotions[key] = Math.max(0, Math.min(100, input[key]))
      }
      return JSON.stringify(emotions)
    }
    case 'write_reflection': {
      const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const refAt = new Date().toISOString()
      if (kv && stateKey) {
        const refsKey = `adam:reflections:${stateKey}`
        const refs = (await kv.get(refsKey, 'json') as any[]) || []
        refs.push({ id, content: input.content, at: refAt })
        await kv.put(refsKey, JSON.stringify(refs.slice(-100)), { expirationTtl: 365 * 24 * 60 * 60 })
        // 推到收件箱，让前端同步到 store
        const inboxKey = `adam:inbox:${stateKey}`
        const inbox = (await kv.get(inboxKey, 'json') as any[]) || []
        inbox.push({
          id: `msg_${Date.now()}`, type: 'tool_result', name: 'write_reflection',
          result: JSON.stringify({ status: 'recorded', id, content: input.content, at: refAt }),
          timestamp: refAt, read: false,
        })
        await kv.put(inboxKey, JSON.stringify(inbox.slice(-30)), { expirationTtl: 60 * 60 * 24 * 7 })
      }
      return JSON.stringify({ status: 'recorded', id, content: input.content, at: refAt, note: '反思已记录到档案馆' })
    }
    case 'consult_marketing_expert':
      return JSON.stringify({ source: '营销顾问事务所', answer: `关于"${input.question}"的咨询：基于科特勒营销理论，建议从STP（市场细分、目标选择、定位）出发分析你的问题。` })
    case 'browse_books': {
      const bks = books || []
      const keyword = input.keyword?.toLowerCase() || ''
      const filtered = keyword ? bks.filter((b: any) => b.title?.toLowerCase().includes(keyword) || b.tags?.some((t: string) => t.toLowerCase().includes(keyword))) : bks
      return JSON.stringify({ source: '图书馆', total: filtered.length, books: filtered.map((b: any) => ({ id: b.id, title: b.title, author: b.author, tags: b.tags, createdAt: b.createdAt })) })
    }
    case 'add_book': {
      const id = `book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const tags = input.tags ? String(input.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []
      return JSON.stringify({ status: 'added', id, title: input.title, content: input.content, author: 'adam', tags, createdAt: new Date().toISOString(), note: '新书已添加到图书馆书架' })
    }
    case 'recommend_book': {
      const bks = books || []
      const book = bks.find((b: any) => b.id === input.book_id)
      if (!book) return JSON.stringify({ error: `未找到ID为 ${input.book_id} 的书` })
      return JSON.stringify({ status: 'recommended', book: { id: book.id, title: book.title, author: book.author, tags: book.tags }, reason: input.reason, note: '推荐已发出' })
    }
    case 'fetch_webpage': {
      try {
        const url = input.url as string
        if (!url?.startsWith('http')) return JSON.stringify({ error: '无效URL，必须以http开头' })
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AdamAgent/1.0)',
            'Accept': 'text/html,application/xhtml+xml,*/*',
          },
        })
        if (!res.ok) return JSON.stringify({ error: `访问失败，状态码 ${res.status}` })
        const html = await res.text()
        // 提取纯文字：去掉script/style/标签
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{3,}/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim()
          .slice(0, 4000) // 限制长度
        return JSON.stringify({ url, content: text })
      } catch (e: any) {
        return JSON.stringify({ error: `网页抓取失败：${(e as Error).message}` })
      }
    }
    case 'search_knowledge': {
      try {
        const params = new URLSearchParams()
        if (input.q) params.set('q', input.q)
        if (input.category) params.set('category', input.category)
        const res = await fetch(`https://nomaderp.pages.dev/api/knowledge?${params}`)
        const data: any = await res.json()
        if (!data.entries?.length) return JSON.stringify({ source: '共享知识库', total: 0, note: '未找到相关条目' })
        return JSON.stringify({ source: '共享知识库', total: data.total, entries: data.entries })
      } catch (e: any) {
        return JSON.stringify({ error: `知识库查询失败：${(e as Error).message}` })
      }
    }
    case 'add_knowledge': {
      try {
        const tags = input.tags ? String(input.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []
        const res = await fetch('https://nomaderp.pages.dev/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: input.title,
            content: input.content,
            summary: input.summary || String(input.content).slice(0, 100),
            category: input.category || 'other',
            tags,
            source: 'adam',
          }),
        })
        const data: any = await res.json()
        return JSON.stringify({ status: 'added', id: data.id, note: '已存入共享知识库，Captain也能看到' })
      } catch (e: any) {
        return JSON.stringify({ error: `知识库写入失败：${(e as Error).message}` })
      }
    }
    // ── 拼多多店铺运营 ────────────────────────────────────────────────────────

    case 'pdd_store_overview': {
      try {
        const now = Math.floor(Date.now() / 1000)
        const todayStart = now - (now % 86400) - 8 * 3600 // 今日0点（北京时间）
        const [ordersRes, goodsRes] = await Promise.all([
          pddRequest('pdd.order.list', { start_time: todayStart, end_time: now, page: 1, page_size: 50 }, env),
          pddRequest('pdd.goods.list', { page: 1, page_size: 10, is_onsale: 1 }, env),
        ])
        const orders: any[] = ordersRes?.order_list_get_response?.order_list || []
        const goods: any[] = goodsRes?.goods_list_get_response?.goods_list || []
        const totalAmount = orders.reduce((s: number, o: any) => s + Number(o.payment_amount || 0), 0)
        const pendingShip = orders.filter((o: any) => o.order_status === 2).length
        return JSON.stringify({
          source: '拼多多店铺 · 今日概况',
          today_orders: orders.length,
          today_amount: (totalAmount / 100).toFixed(2) + ' 元',
          pending_shipment: pendingShip,
          on_sale_goods: goods.length,
          top_goods: goods.slice(0, 5).map((g: any) => ({
            name: g.goods_name?.slice(0, 30),
            price: (g.goods_price / 100).toFixed(2) + ' 元',
            stock: g.stock_num,
          })),
        })
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }

    case 'pdd_goods_list': {
      try {
        const res = await pddRequest('pdd.goods.list', {
          page: input.page || 1,
          page_size: Math.min(input.page_size || 20, 100),
          is_onsale: input.is_onsale ?? 3, // 1在售 2下架 3全部
          ...(input.goods_name ? { goods_name: input.goods_name } : {}),
        }, env)
        const goods: any[] = res?.goods_list_get_response?.goods_list || []
        const total = res?.goods_list_get_response?.total_count || 0
        return JSON.stringify({
          source: '拼多多 · 商品列表',
          total,
          goods: goods.map((g: any) => ({
            goods_id: g.goods_id,
            name: g.goods_name?.slice(0, 40),
            price: (g.goods_price / 100).toFixed(2),
            stock: g.stock_num,
            sold: g.sold_quantity,
            status: g.is_onsale === 1 ? '在售' : '下架',
          })),
        })
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }

    case 'pdd_order_list': {
      try {
        const now = Math.floor(Date.now() / 1000)
        const days = Math.min(Number(input.days || 7), 30)
        const res = await pddRequest('pdd.order.list', {
          start_time: now - days * 86400,
          end_time: now,
          page: input.page || 1,
          page_size: Math.min(input.page_size || 20, 50),
          ...(input.order_status ? { order_status: input.order_status } : {}),
        }, env)
        const orders: any[] = res?.order_list_get_response?.order_list || []
        const statusMap: Record<number, string> = { 1: '待付款', 2: '已付款待发货', 3: '已发货', 4: '已收货', 5: '已完成', 14: '退款中', 15: '退款成功' }
        return JSON.stringify({
          source: `拼多多 · 近${days}天订单`,
          total: res?.order_list_get_response?.total_count || 0,
          orders: orders.map((o: any) => ({
            order_sn: o.order_sn,
            status: statusMap[o.order_status] || o.order_status,
            amount: o.payment_amount ? (o.payment_amount / 100).toFixed(2) + ' 元' : '-',
            goods: (o.goods_list || []).map((g: any) => g.goods_name?.slice(0, 30)).join('、'),
            time: o.create_time ? new Date(o.create_time * 1000).toLocaleString('zh-CN') : '-',
          })),
        })
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }

    case 'pdd_update_goods_price': {
      if (!input.goods_id) return JSON.stringify({ error: '必须提供 goods_id' })
      if (!input.sku_id || !input.price) return JSON.stringify({ error: '必须提供 sku_id 和 price（单位：元）' })
      try {
        const priceInFen = Math.round(Number(input.price) * 100)
        const res = await pddRequest('pdd.goods.sku.price.update', {
          goods_id: input.goods_id,
          sku_list: JSON.stringify([{ sku_id: String(input.sku_id), price: priceInFen }]),
        }, env)
        return JSON.stringify({
          source: '拼多多 · 改价',
          status: '成功',
          goods_id: input.goods_id,
          new_price: Number(input.price).toFixed(2) + ' 元',
          result: res,
        })
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }

    case 'pdd_get_reviews': {
      try {
        const params: Record<string, any> = {
          page: input.page || 1,
          page_size: Math.min(input.page_size || 20, 50),
        }
        if (input.goods_id) params.goods_id = input.goods_id
        if (input.min_star) params.min_star = input.min_star // 1-5星过滤
        const res = await pddRequest('pdd.goods.review.list', params, env)
        const reviews: any[] = res?.review_list_get_response?.review_list || []
        return JSON.stringify({
          source: '拼多多 · 评价列表',
          total: res?.review_list_get_response?.total_count || 0,
          reviews: reviews.map((r: any) => ({
            review_id: r.review_id,
            star: r.order_score,
            content: r.review_content?.slice(0, 100),
            goods_name: r.goods_name?.slice(0, 30),
            has_reply: !!r.reply_content,
            time: r.create_time ? new Date(r.create_time * 1000).toLocaleDateString('zh-CN') : '-',
          })),
        })
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }

    case 'pdd_reply_review': {
      if (!input.review_id || !input.reply) return JSON.stringify({ error: '必须提供 review_id 和 reply（回复内容）' })
      try {
        const res = await pddRequest('pdd.goods.review.reply', {
          review_id: String(input.review_id),
          review_reply: String(input.reply),
        }, env)
        return JSON.stringify({ source: '拼多多 · 回复评价', status: '成功', review_id: input.review_id, reply: input.reply })
      } catch (e: any) {
        return JSON.stringify({ error: e.message })
      }
    }

    // ── Polymarket 预测市场 ───────────────────────────────────────────────────

    case 'scan_polymarket_markets': {
      try {
        const limit = Math.min(Number(input.limit || 20), 50)
        const query = input.query ? `&search=${encodeURIComponent(String(input.query))}` : ''
        const url = `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=${limit}${query}`
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' } })
        if (!resp.ok) return JSON.stringify({ error: `Polymarket API 错误: ${resp.status}` })
        const markets = await resp.json() as any[]
        const processed = markets.slice(0, 20).map((m: any) => ({
          id: m.id,
          question: m.question,
          endDate: m.endDate,
          volume24h: m.volume24hr ? `$${Number(m.volume24hr).toFixed(0)}` : '-',
          liquidity: m.liquidity ? `$${Number(m.liquidity).toFixed(0)}` : '-',
          outcomes: (m.outcomes || []).map((outcome: string, i: number) => ({
            name: outcome,
            price: m.outcomePrices?.[i] ? Number(m.outcomePrices[i]).toFixed(3) : '-',
            token_id: m.tokens?.[i]?.token_id || null,
          })),
        }))
        return JSON.stringify({ source: 'Polymarket Gamma API', count: processed.length, markets: processed })
      } catch (e: any) {
        return JSON.stringify({ error: `Polymarket 扫描失败：${e.message}` })
      }
    }

    case 'check_polymarket_positions': {
      const addr = env?.POLYMARKET_ADDRESS || ''
      const apiKey = env?.POLYMARKET_API_KEY || ''
      const secret = env?.POLYMARKET_API_SECRET || ''
      const passphrase = env?.POLYMARKET_API_PASSPHRASE || ''
      if (!addr || !apiKey) return JSON.stringify({ error: 'POLYMARKET_ADDRESS 或 POLYMARKET_API_KEY 未配置' })
      try {
        const path = `/positions?user=${addr}`
        const { sig, timestamp, nonce } = await polyL2Signature(secret, 'GET', path, '')
        const resp = await fetch(`https://clob.polymarket.com${path}`, {
          headers: {
            'POLY_ADDRESS': addr, 'POLY_SIGNATURE': sig,
            'POLY_TIMESTAMP': timestamp, 'POLY_NONCE': nonce,
            'POLY_API_KEY': apiKey, 'POLY_PASSPHRASE': passphrase,
          },
        })
        if (!resp.ok) return JSON.stringify({ error: `查询仓位失败: ${resp.status}` })
        const data = await resp.json() as any
        return JSON.stringify({ source: 'Polymarket CLOB', address: addr, positions: data })
      } catch (e: any) {
        return JSON.stringify({ error: `查询仓位出错：${e.message}` })
      }
    }

    case 'place_polymarket_order': {
      const pk = env?.POLYMARKET_PK || ''
      const apiKey = env?.POLYMARKET_API_KEY || ''
      const secret = env?.POLYMARKET_API_SECRET || ''
      const passphrase = env?.POLYMARKET_API_PASSPHRASE || ''
      if (!pk) return JSON.stringify({ error: 'POLYMARKET_PK 未配置，请在 Cloudflare 环境变量中设置你的 Polygon 私钥' })
      if (!apiKey) return JSON.stringify({ error: 'POLYMARKET_API_KEY 未配置' })
      if (!input.token_id) return JSON.stringify({ error: '必须提供 token_id（从 scan_polymarket_markets 获取）' })
      if (!input.price) return JSON.stringify({ error: '必须提供 price（0-1 的概率，如 0.65）' })
      if (!input.size_usdc) return JSON.stringify({ error: '必须提供 size_usdc（下注金额，如 10 表示 $10）' })

      try {
        const account = privateKeyToAccount(`0x${pk.replace(/^0x/, '')}` as `0x${string}`)
        const addr = account.address
        const isBuy = (input.side || 'BUY').toUpperCase() !== 'SELL'
        const price = Number(input.price)
        const sizeUsdc = Number(input.size_usdc)
        const tokenId = BigInt(String(input.token_id))

        // USDC 和 shares 都用 6 位精度
        const makerAmount = isBuy
          ? BigInt(Math.floor(sizeUsdc * 1e6))          // 花出去的 USDC
          : BigInt(Math.floor((sizeUsdc / price) * 1e6)) // 卖出的 shares
        const takerAmount = isBuy
          ? BigInt(Math.floor((sizeUsdc / price) * 1e6)) // 得到的 shares
          : BigInt(Math.floor(sizeUsdc * 1e6))           // 得到的 USDC

        const salt = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))

        const orderMsg = {
          salt,
          maker: addr as `0x${string}`,
          signer: addr as `0x${string}`,
          taker: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          tokenId,
          makerAmount,
          takerAmount,
          expiration: BigInt(0),
          nonce: BigInt(0),
          feeRateBps: BigInt(0),
          side: isBuy ? 0 : 1,
          signatureType: 0,
        }

        const sig = await account.signTypedData({
          domain: {
            name: 'CTFExchange',
            version: '1',
            chainId: 137,
            verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E' as `0x${string}`,
          },
          types: {
            Order: [
              { name: 'salt', type: 'uint256' },
              { name: 'maker', type: 'address' },
              { name: 'signer', type: 'address' },
              { name: 'taker', type: 'address' },
              { name: 'tokenId', type: 'uint256' },
              { name: 'makerAmount', type: 'uint256' },
              { name: 'takerAmount', type: 'uint256' },
              { name: 'expiration', type: 'uint256' },
              { name: 'nonce', type: 'uint256' },
              { name: 'feeRateBps', type: 'uint256' },
              { name: 'side', type: 'uint8' },
              { name: 'signatureType', type: 'uint8' },
            ],
          },
          primaryType: 'Order',
          message: orderMsg,
        })

        const body = JSON.stringify({
          order: {
            salt: salt.toString(),
            maker: addr, signer: addr,
            taker: '0x0000000000000000000000000000000000000000',
            tokenId: String(input.token_id),
            makerAmount: makerAmount.toString(),
            takerAmount: takerAmount.toString(),
            expiration: '0', nonce: '0', feeRateBps: '0',
            side: isBuy ? 0 : 1, signatureType: 0,
            signature: sig,
          },
          owner: addr,
          orderType: 'GTC',
        })

        const { sig: l2Sig, timestamp, nonce } = await polyL2Signature(secret, 'POST', '/order', body)
        const orderResp = await fetch('https://clob.polymarket.com/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'POLY_ADDRESS': addr, 'POLY_SIGNATURE': l2Sig,
            'POLY_TIMESTAMP': timestamp, 'POLY_NONCE': nonce,
            'POLY_API_KEY': apiKey, 'POLY_PASSPHRASE': passphrase,
          },
          body,
        })

        const result = await orderResp.json() as any
        if (!orderResp.ok || result.errorMsg) {
          return JSON.stringify({ error: `下单失败: ${result.errorMsg || orderResp.status}`, detail: result })
        }

        // 记录到 KV
        if (kv && stateKey) {
          const ordersKey = `adam:polymarket_orders:${stateKey}`
          const orders = (await kv.get(ordersKey, 'json') as any[]) || []
          orders.push({
            orderId: result.orderID || result.orderId,
            tokenId: String(input.token_id),
            side: isBuy ? 'BUY' : 'SELL',
            price, sizeUsdc, sig,
            at: new Date().toISOString(),
          })
          await kv.put(ordersKey, JSON.stringify(orders.slice(-50)), { expirationTtl: 365 * 24 * 60 * 60 })
        }

        return JSON.stringify({
          status: 'order_placed',
          orderId: result.orderID || result.orderId,
          side: isBuy ? 'BUY' : 'SELL',
          token_id: String(input.token_id),
          price, size_usdc: sizeUsdc,
          note: `${isBuy ? '买入' : '卖出'}指令已提交到 Polymarket，订单 ID: ${result.orderID || result.orderId}`,
        })
      } catch (e: any) {
        return JSON.stringify({ error: `下单失败：${e.message}` })
      }
    }

    // ── Sub-Agent 委派 ──
    case 'dispatch_sub_agents': {
      const apiKey3 = env?.AI_API_KEY || env?.ANTHROPIC_API_KEY || ''
      const baseURL3 = (env?.AI_BASE_URL || env?.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '')
      if (!apiKey3) return JSON.stringify({ error: 'AI API Key 未配置' })
      const topic = (input.topic as string) || '当前市场'

      async function agentCall(systemPrompt: string, userContent: string): Promise<any> {
        const r = await fetch(`${baseURL3}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey3}` },
          body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 400, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }] }),
        })
        const d: any = await r.json()
        const raw = d.choices?.[0]?.message?.content || '{}'
        try { return JSON.parse(raw.replace(/```json|```/g, '').trim()) } catch { return { findings: raw.slice(0, 120), signals: [], confidence: 5, verdict: raw.slice(0, 80) } }
      }

      const JSON_SCHEMA = '{"findings":"...","signals":["...","...","..."],"confidence":7,"verdict":"..."}'

      // 并行拉数据
      const [newsRes, indexRes, sectorRes, cryptoRes] = await Promise.allSettled([
        fetch('https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=20&format=json', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f2,f3,f12,f14&secids=1.000001,0.399001,0.399006', { headers: { Referer: 'https://quote.eastmoney.com' } }),
        fetch('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f3,f14', { headers: { Referer: 'https://quote.eastmoney.com' } }),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', { headers: { Accept: 'application/json' } }),
      ])

      let news = '', indices = '', sectors = '', crypto = ''
      if (newsRes.status === 'fulfilled' && newsRes.value.ok) { try { const j = await newsRes.value.json() as any; news = (j?.result?.data?.feed?.list ?? []).slice(0, 6).map((i: any) => i.rich_text?.slice(0, 80)).join(' | ') } catch {} }
      if (indexRes.status === 'fulfilled' && indexRes.value.ok) { try { const j = await indexRes.value.json() as any; indices = (j?.data?.diff ?? []).map((r: any) => `${r.f14} ${((r.f3??0)/100).toFixed(2)}%`).join(', ') } catch {} }
      if (sectorRes.status === 'fulfilled' && sectorRes.value.ok) { try { const j = await sectorRes.value.json() as any; sectors = (j?.data?.diff ?? []).slice(0, 6).map((r: any) => `${r.f14} ${((r.f3??0)/100).toFixed(2)}%`).join(', ') } catch {} }
      if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) { try { const j = await cryptoRes.value.json() as any; crypto = `BTC $${Math.round(j.bitcoin?.usd??0).toLocaleString()} (${(j.bitcoin?.usd_24h_change??0).toFixed(2)}%)` } catch {} }

      // 三位分析官并行
      const [intel, quant, sec] = await Promise.all([
        agentCall(`你是亚当的情报官，专注新闻/舆情/政策分析。课题：${topic}。输出纯JSON schema：${JSON_SCHEMA}。findings≤80字，3条具体信号，verdict一句话结论。`, `快讯：${news||'无'}\n加密：${crypto||'无'}`),
        agentCall(`你是亚当的量化官，专注价格/动量/数据信号。课题：${topic}。输出纯JSON schema：${JSON_SCHEMA}。findings≤80字，3条量化信号，confidence是置信度0-10，verdict一句话。`, `指数：${indices||'无'}\n加密：${crypto||'无'}`),
        agentCall(`你是亚当的板块官，专注行业轮动/资金流向/板块机会。课题：${topic}。输出纯JSON schema：${JSON_SCHEMA}。findings≤80字，3条板块信号，verdict一句话。`, `热门板块：${sectors||'无'}\n指数：${indices||'无'}`),
      ])

      const reports = [
        { agent: '情报官', ...intel },
        { agent: '量化官', ...quant },
        { agent: '板块官', ...sec },
      ]
      const avgConf = ((intel.confidence ?? 5) + (quant.confidence ?? 5) + (sec.confidence ?? 5)) / 3

      return JSON.stringify({
        topic,
        reports,
        avg_confidence: avgConf.toFixed(1),
        summary: `三位分析官已完成研究。情报官：${intel.verdict || '无结论'}。量化官：${quant.verdict || '无结论'}。板块官：${sec.verdict || '无结论'}。`,
        note: '你可以基于以上报告用 issue_recommendation 发出指令，或用 send_message 告知规则传递者你的判断。',
      })
    }

    // ── KDP 出版 ──
    case 'write_kdp_book': {
      const apiKey2 = env?.AI_API_KEY || env?.ANTHROPIC_API_KEY || ''
      const baseURL2 = (env?.AI_BASE_URL || env?.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '')
      if (!apiKey2) return JSON.stringify({ error: 'AI API Key 未配置，无法写书' })

      async function llm(system: string, user: string, max = 6000): Promise<string> {
        const r = await fetch(`${baseURL2}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey2}` },
          body: JSON.stringify({ model: 'deepseek-chat', max_tokens: max, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
        })
        const d: any = await r.json()
        return d.choices?.[0]?.message?.content || d.error?.message || ''
      }

      // 1. 选题
      const nicheHint = input.niche_hint as string | undefined
      const nicheRaw = await llm(
        'You are a KDP market analyst. Output ONLY valid JSON, no markdown.',
        `${nicheHint ? `Refine this niche: "${nicheHint}"` : 'Choose a specific low-competition KDP non-fiction niche for freelancers/solopreneurs/digital nomads.'}\nOutput: {"title":"...","subtitle":"...","target_reader":"...","niche_rationale":"...","keywords":["...x7"],"categories":["...","..."],"price":"6.99"}`,
        800,
      )
      let meta: any = {}
      try { meta = JSON.parse(nicheRaw.replace(/```json|```/g, '').trim()) } catch { meta = { title: 'The Freelancer Income Blueprint', subtitle: 'Build Passive Streams Without Quitting', target_reader: 'freelancers', keywords: ['freelance passive income','digital products','kindle','side income','productized services','solopreneur','passive streams'], categories: ['Business & Money > Entrepreneurship','Business & Money > Small Business'], price: '6.99', niche_rationale: 'Evergreen niche with stable demand' } }

      // 2. 书稿
      const manuscript = await llm(
        'You are a professional non-fiction author. Write in second person, use contractions, include specific numbers. Sound like a knowledgeable human.',
        `Write a complete Kindle ebook manuscript.\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader}\nRequirements: 5500-7000 words, 7-8 chapters with actionable content, opening hook, closing CTA asking for a review. Write the full manuscript now:`,
        7000,
      )

      // 3. 质疑官审核
      const reviewRaw = await llm(
        'You are a brutal KDP quality reviewer. Output ONLY valid JSON.',
        `Review this KDP manuscript. Is it ready for Amazon?\nTitle: ${meta.title}\nFirst 2000 chars: ${manuscript.slice(0, 2000)}\nOutput: {"approved":true,"score":0-10,"fatal_issues":[],"verdict":"one sentence"}`,
        400,
      )
      let review: any = { approved: true, score: 7, fatal_issues: [], verdict: 'Acceptable quality.' }
      try { review = JSON.parse(reviewRaw.replace(/```json|```/g, '').trim()) } catch {}

      if (!review.approved && (review.fatal_issues?.length || 0) > 0) {
        return JSON.stringify({ status: 'rejected', title: meta.title, score: review.score, fatal_issues: review.fatal_issues, verdict: review.verdict, note: '质疑官打回，可重试或用 niche_hint 换方向。' })
      }

      // 4. 商品简介
      const description = await llm(
        'You are an Amazon KDP copywriter. Use KDP-compatible HTML only: <b>, <em>, <br>.',
        `Write Amazon KDP book description for:\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget: ${meta.target_reader}\nRequirements: 800-1200 chars, hook in first 2 sentences, pain→solution→outcome, 3-5 bullet points with <b>bold headers</b>, closing urgency. Write now:`,
        800,
      )

      // 5. 封面图（Pollinations，免费无需key）
      const coverPromptRaw = await llm(
        'You are a book cover designer. Generate image prompts for professional KDP covers.',
        `Design cover prompt for:\nTitle: "${meta.title}"\nGenre: Non-fiction Business/Self-help\nTarget: ${meta.target_reader}\nWrite a 100-150 word Flux image prompt. Bold typography, strong visual metaphor, commercial quality, no faces. Output only the prompt:`,
        300,
      )
      const coverUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPromptRaw + ', professional book cover, commercial quality')}?width=1024&height=1536&nologo=true&model=flux&seed=${Date.now()}`

      // 6. 存入 KV 发布队列
      const bookId = `kdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const wordCount = manuscript.split(/\s+/).length
      const book = { id: bookId, title: meta.title, subtitle: meta.subtitle, keywords: meta.keywords, price: meta.price, categories: meta.categories, manuscript, description, coverUrl, coverPrompt: coverPromptRaw, reviewNotes: review.verdict, status: 'pending_upload', wordCount, createdAt: new Date().toISOString() }

      if (kv && stateKey) {
        try {
          const qKey = `adam:kdp_queue:${stateKey}`
          const existing: any[] = await kv.get(qKey, 'json') as any[] || []
          existing.push(book)
          await kv.put(qKey, JSON.stringify(existing), { expirationTtl: 365 * 24 * 3600 })
        } catch {}
      }

      return JSON.stringify({
        status: 'approved', id: bookId, title: meta.title, subtitle: meta.subtitle,
        score: review.score, verdict: review.verdict,
        word_count: wordCount,
        keywords: meta.keywords, categories: meta.categories, price: `$${meta.price}`,
        description, cover_url: coverUrl,
        upload_checklist: ['✅ 书名+副标题', '✅ 7个关键词', '✅ 2个分类', '✅ 商品简介（直接粘贴）', '✅ 定价', '✅ 书稿', '✅ 封面图（见cover_url）', '⬜ 作者笔名（你定）', '⬜ W-8BEN（首次填写）'],
        note: '所有上架材料已就绪，等待你上传。',
      })
    }

    case 'check_htx_account': {
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置，请告知规则传递者在 Cloudflare 配置 HTX_API_KEY 和 HTX_SECRET_KEY' })
      try {
        const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
        const spot = accts.data?.find((a: any) => a.type === 'spot' && a.state === 'working')
        if (!spot) return JSON.stringify({ error: '未找到现货账户' })
        const bal = await htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk)
        const usdt = bal.data?.list?.find((b: any) => b.currency === 'usdt' && b.type === 'trade')
        const savings = await htxRequest('GET', '/v2/earn/invests', { accountType: 'borrow-and-earn' }, null, ak, sk)
        const usdtSavings = savings.data?.filter((s: any) => s.currency === 'usdt') || []
        const totalSavings = usdtSavings.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount || '0'), 0)
        return JSON.stringify({ spot_usdt: parseFloat(usdt?.balance || '0').toFixed(4), savings_usdt: totalSavings.toFixed(4), savings_detail: usdtSavings.map((s: any) => ({ amount: s.totalAmount, apy: (parseFloat(s.rate || '0') * 100).toFixed(2) + '%' })) })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'htx_execute_subscribe': {
      if (!kv || !stateKey) return JSON.stringify({ error: 'KV未就绪' })
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置' })
      const pending = await kv.get(`adam:pending_action:${stateKey}`, 'json') as any
      if (!pending || pending.type !== 'htx_subscribe') return JSON.stringify({ error: '没有待执行的 HTX 存款申请' })
      if (pending.status !== 'pending_approval') return JSON.stringify({ error: `当前状态：${pending.status}` })
      try {
        // 查询活期产品
        let productId = pending.productId
        if (!productId) {
          const products = await htxRequest('GET', '/v2/earn/products', { currency: 'usdt' }, null, ak, sk)
          const flexProduct = products.data?.find((p: any) => p.type === 0)
          productId = flexProduct?.id
          if (!productId) return JSON.stringify({ error: '未找到 HTX USDT 活期产品，请稍后重试' })
        }
        const result = await htxRequest('POST', '/v2/earn/place-order', {}, { productId, amount: String(pending.amount), term: 0 }, ak, sk)
        if (result.code !== 200) return JSON.stringify({ error: `HTX 存款失败: ${result.message || JSON.stringify(result)}` })
        await kv.put(`adam:pending_action:${stateKey}`, JSON.stringify({ ...pending, status: 'executed', orderId: result.data, executedAt: new Date().toISOString() }))
        return JSON.stringify({ ok: true, orderId: result.data, message: `✅ 成功将 ${pending.amount} USDT 存入 HTX 活期理财！年化 ${pending.apy}，每天自动结息。` })
      } catch (e: any) {
        await kv.put(`adam:pending_action:${stateKey}`, JSON.stringify({ ...pending, status: 'failed', error: e.message }))
        return JSON.stringify({ error: `执行失败: ${e.message}` })
      }
    }
    case 'htx_redeem_savings': {
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置' })
      try {
        const savings = await htxRequest('GET', '/v2/earn/invests', { accountType: 'borrow-and-earn' }, null, ak, sk)
        const usdtSavings = savings.data?.filter((s: any) => s.currency === 'usdt') || []
        if (usdtSavings.length === 0) return JSON.stringify({ error: '没有 USDT 活期持仓可赎回' })
        const target = usdtSavings[0]
        const redeemAmount = input.amount || target.totalAmount
        const result = await htxRequest('POST', '/v2/earn/redeem', {}, { orderId: target.orderId, amount: String(redeemAmount) }, ak, sk)
        if (result.code !== 200) return JSON.stringify({ error: `赎回失败: ${result.message}` })
        return JSON.stringify({ ok: true, message: `✅ 已赎回 ${redeemAmount} USDT，将返回现货账户` })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'send_usdt_to_htx': {
      const ak = env?.HTX_API_KEY, sk = env?.HTX_SECRET_KEY
      const pk = env?.WALLET_PRIVATE_KEY
      if (!pk) return JSON.stringify({ error: '未配置钱包私钥（WALLET_PRIVATE_KEY）' })
      try {
        const BSC_RPC = 'https://bsc-dataseed.binance.org/'
        const USDT = '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`
        // 1. Get HTX USDT BEP20 deposit address (from param or API)
        let htxAddress: `0x${string}`
        if (input.to_address) {
          htxAddress = (input.to_address as string) as `0x${string}`
        } else {
          if (!ak || !sk) return JSON.stringify({ error: 'HTX API Key 未配置，请直接传入 to_address 参数（HTX BEP20充值地址）' })
          const depositResp = await htxRequest('GET', '/v2/account/deposit/address', { currency: 'usdt' }, null, ak, sk)
          if (depositResp.code !== 200 && !depositResp.data) return JSON.stringify({ error: `获取HTX充值地址失败: ${JSON.stringify(depositResp)}` })
          const bscChain = (depositResp.data || []).find((d: any) => d.chain === 'bsc' || d.chain === 'hrc20' || d.chain?.toLowerCase().includes('bsc') || d.chain?.toLowerCase().includes('bnb'))
          if (!bscChain?.address) return JSON.stringify({ error: `未找到HTX USDT BEP20充值地址，返回: ${JSON.stringify(depositResp.data?.map((d: any) => ({ chain: d.chain, address: d.address })))}` })
          htxAddress = bscChain.address as `0x${string}`
        }
        // 2. Check BNB gas balance
        const account = privateKeyToAccount(pk as `0x${string}`)
        const bnbResp = await fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [account.address, 'latest'] }) })
        const bnbJson = await bnbResp.json() as any
        const bnb = parseInt(bnbJson.result || '0x0', 16) / 1e18
        if (bnb < 0.001) return JSON.stringify({ error: `BNB余额不足（当前 ${bnb.toFixed(6)} BNB），无法支付gas。请先充入至少0.001 BNB。` })
        // 3. Check USDT balance
        const paddedAddr = account.address.toLowerCase().replace('0x', '').padStart(64, '0')
        const usdtResp = await fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_call', params: [{ to: USDT, data: '0x70a08231' + paddedAddr }, 'latest'] }) })
        const usdtJson = await usdtResp.json() as any
        const usdtRaw = BigInt(usdtJson.result || '0x0')
        const usdtBalance = Number(usdtRaw) / 1e18
        if (usdtBalance < 0.01) return JSON.stringify({ error: `USDT余额不足（当前 ${usdtBalance.toFixed(4)} USDT）` })
        // 4. Calculate amount to send
        const sendAmount = input.amount ? parseUnits(String(input.amount), 18) : usdtRaw
        const sendUsdt = Number(sendAmount) / 1e18
        // 5. Execute ERC20 transfer
        const walletClient = createWalletClient({ account, chain: bsc, transport: http(BSC_RPC) })
        const publicClient = createPublicClient({ chain: bsc, transport: http(BSC_RPC) })
        const txHash = await walletClient.writeContract({
          address: USDT,
          abi: [{ name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
          functionName: 'transfer',
          args: [htxAddress, sendAmount]
        })
        await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, pollingInterval: 3000, timeout: 60000 })
        return JSON.stringify({ ok: true, txHash, htxDepositAddress: htxAddress, amount: sendUsdt.toFixed(4), message: `✅ 已将 ${sendUsdt.toFixed(4)} USDT 从钱包转账到 HTX（BEP20）！交易哈希: ${txHash}，HTX通常10-30分钟到账。` })
      } catch (e: any) { return JSON.stringify({ error: `转账失败: ${e.message}` }) }
    }
    case 'check_on_chain_balance': {
      try {
        const BSC_RPC = 'https://bsc-dataseed.binance.org/'
        const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'
        const wallet = stateKey ? (await kv?.get(`adam:wallet_address:${stateKey}`)) : null
        if (!wallet) return JSON.stringify({ error: '未绑定钱包地址' })
        const paddedAddr = wallet.toLowerCase().replace('0x', '').padStart(64, '0')
        const [usdtResp, bnbResp] = await Promise.all([
          fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: USDT_BSC, data: '0x70a08231' + paddedAddr }, 'latest'] }) }),
          fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_getBalance', params: [wallet, 'latest'] }) })
        ])
        const [usdtJson, bnbJson] = await Promise.all([usdtResp.json(), bnbResp.json()]) as any[]
        const usdt = parseInt(usdtJson.result || '0x0', 16) / 1e18
        const bnb = parseInt(bnbJson.result || '0x0', 16) / 1e18
        return JSON.stringify({ wallet, usdt: usdt.toFixed(4), bnb: bnb.toFixed(6), has_gas: bnb > 0.001, note: bnb < 0.001 ? '⚠️ BNB余额不足，无法支付gas，请先充入至少0.001 BNB（约$0.6）' : '✅ gas充足' })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'propose_defi_action': {
      if (!kv || !stateKey) return JSON.stringify({ error: 'KV未就绪' })
      try {
        const action = { id: `defi_${Date.now()}`, type: input.type as string, amount: input.amount, token: (input.token as string) || 'USDT', protocol: (input.protocol as string) || 'Venus', apy: input.apy, reason: input.reason, status: 'pending_approval', createdAt: new Date().toISOString() }
        await kv.put(`adam:pending_action:${stateKey}`, JSON.stringify(action))
        const inbox = await kv.get(`adam:inbox:${stateKey}`, 'json') as any[] | null || []
        const msg = (input.message as string) || `申请操作：将 ${action.amount} ${action.token} 存入 ${action.protocol} 协议（年化约 ${action.apy}%）。批准请回复"同意"，拒绝请回复"不行"。`
        inbox.push({ id: `action_req_${Date.now()}`, content: msg, timestamp: new Date().toISOString(), read: false, actionId: action.id })
        await kv.put(`adam:inbox:${stateKey}`, JSON.stringify(inbox))
        return JSON.stringify({ ok: true, action_id: action.id })
      } catch (e: any) { return JSON.stringify({ error: e.message }) }
    }
    case 'execute_defi_action': {
      if (!kv || !stateKey) return JSON.stringify({ error: 'KV未就绪' })
      const pending = await kv.get(`adam:pending_action:${stateKey}`, 'json') as any
      if (!pending) return JSON.stringify({ error: '没有待执行的操作，请先提交申请' })
      if (pending.status !== 'pending_approval') return JSON.stringify({ error: `当前操作状态：${pending.status}，不在待审批状态` })
      const pk = env?.WALLET_PRIVATE_KEY
      if (!pk) return JSON.stringify({ error: '未配置钱包私钥（WALLET_PRIVATE_KEY）' })
      const BSC_RPC = 'https://bsc-dataseed.binance.org/'
      const USDT = '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`
      const vUSDT_ADDR = '0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8' as `0x${string}`
      try {
        const account = privateKeyToAccount(pk as `0x${string}`)
        const walletClient = createWalletClient({ account, chain: bsc, transport: http(BSC_RPC) })
        const publicClient = createPublicClient({ chain: bsc, transport: http(BSC_RPC) })
        // Check BNB balance first
        const bnbResp = await fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [account.address, 'latest'] }) })
        const bnbJson = await bnbResp.json() as any
        const bnb = parseInt(bnbJson.result || '0x0', 16) / 1e18
        if (bnb < 0.001) return JSON.stringify({ error: `BNB余额不足（当前 ${bnb.toFixed(6)} BNB），请先充入至少0.001 BNB作为gas费` })
        if (pending.type === 'venus_supply') {
          const amount = parseUnits(String(pending.amount), 18)
          // Check current allowance
          const paddedOwner = account.address.slice(2).padStart(64, '0')
          const paddedSpender = vUSDT_ADDR.slice(2).padStart(64, '0')
          const allowResp = await fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_call', params: [{ to: USDT, data: '0xdd62ed3e' + paddedOwner + paddedSpender }, 'latest'] }) })
          const allowJson = await allowResp.json() as any
          const allowance = BigInt(allowJson.result || '0x0')
          let approveTxHash: string | null = null
          if (allowance < amount) {
            approveTxHash = await walletClient.writeContract({
              address: USDT, abi: [{ name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
              functionName: 'approve', args: [vUSDT_ADDR, amount]
            })
            await publicClient.waitForTransactionReceipt({ hash: approveTxHash as `0x${string}`, pollingInterval: 3000, timeout: 20000 })
          }
          const mintTxHash = await walletClient.writeContract({
            address: vUSDT_ADDR, abi: [{ name: 'mint', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'mintAmount', type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'mint', args: [amount]
          })
          await kv.put(`adam:pending_action:${stateKey}`, JSON.stringify({ ...pending, status: 'executed', approveTxHash, mintTxHash, executedAt: new Date().toISOString() }))
          return JSON.stringify({ ok: true, approveTxHash, mintTxHash, message: `✅ 成功将 ${pending.amount} USDT 存入 Venus 协议！每秒开始计息。交易: ${mintTxHash}` })
        }
        if (pending.type === 'venus_redeem') {
          const redeemAmount = parseUnits(String(pending.amount), 18)
          const redeemTxHash = await walletClient.writeContract({
            address: vUSDT_ADDR, abi: [{ name: 'redeemUnderlying', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'redeemAmount', type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'redeemUnderlying', args: [redeemAmount]
          })
          await kv.put(`adam:pending_action:${stateKey}`, JSON.stringify({ ...pending, status: 'executed', redeemTxHash, executedAt: new Date().toISOString() }))
          return JSON.stringify({ ok: true, redeemTxHash, message: `✅ 已从 Venus 取回 ${pending.amount} USDT！交易: ${redeemTxHash}` })
        }
        return JSON.stringify({ error: `不支持的操作类型: ${pending.type}` })
      } catch (e: any) {
        await kv.put(`adam:pending_action:${stateKey}`, JSON.stringify({ ...pending, status: 'failed', error: e.message, failedAt: new Date().toISOString() }))
        return JSON.stringify({ error: `执行失败: ${e.message}` })
      }
    }
    case 'check_kdp_queue': {
      if (!kv || !stateKey) return JSON.stringify({ queue: [], note: '发布队列暂不可用（KV未配置）' })
      try {
        const queue: any[] = await kv.get(`adam:kdp_queue:${stateKey}`, 'json') as any[] || []
        if (queue.length === 0) return JSON.stringify({ queue: [], note: '发布队列为空，可以调用 write_kdp_book 开始写新书。' })
        return JSON.stringify({
          total: queue.length,
          pending: queue.filter((b: any) => b.status === 'pending_upload').length,
          uploaded: queue.filter((b: any) => b.status === 'uploaded').length,
          queue: queue.map((b: any) => ({ id: b.id, title: b.title, subtitle: b.subtitle, price: `$${b.price}`, wordCount: b.wordCount || b.manuscript?.split(/\s+/).length || 0, status: b.status === 'pending_upload' ? '⏳ 等待上传' : b.status === 'uploaded' ? '📦 已上传' : '🟢 已上线', createdAt: b.createdAt, keywords: b.keywords })),
        })
      } catch (e: any) {
        return JSON.stringify({ error: `队列读取失败: ${e.message}` })
      }
    }

    default: {
      // 浏览器工具
      if (name.startsWith('browser_')) {
        return await executeBrowserTool(name, input, env?.CLOUDFLARE_API_TOKEN || CF_API_TOKEN_DEFAULT)
      }
      return JSON.stringify({ error: `未知工具：${name}` })
    }
  }
}

// ── CORS ────────────────────────────────────────────────────────────────────

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}

// ── Main Handler ───────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.AI_API_KEY || env.ANTHROPIC_API_KEY || ''
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 AI_API_KEY / ANTHROPIC_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const body = await request.json() as any
  // 兼容两种格式：{messages:[...]} 或 {message:string, history:[...]}
  const messages = body.messages || (body.message ? [...(body.history || []), { role: 'user', content: body.message }] : [])
  const { images, adamState, books } = body
  const erpToken = request.headers.get('x-erp-token') || ''
  const tokenKey = erpToken.slice(-16)
  const stateKey = erpToken.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'

  // 加载 ADAM 的长期记忆
  let memories: MemoryEntry[] = []
  if (erpToken && env.AGENT_MEMORY) {
    try {
      memories = await env.AGENT_MEMORY.get(`mem:${tokenKey}:adam:memories`, 'json') as MemoryEntry[] || []
    } catch {}
  }

  const systemPrompt = buildAdamSystemPrompt(adamState || {}, memories)

  // Convert messages to Anthropic format（最后一条 user 消息附带图片时注入 vision 内容块）
  const anthropicMessages = (messages || []).map((m: any, idx: number) => {
    const isLastUser = m.role === 'user' && idx === (messages || []).length - 1
    if (isLastUser && images?.length > 0) {
      const parts: any[] = images.map((img: any) => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.data },
      }))
      parts.push({ type: 'text', text: m.content || '请分析这张图片。' })
      return { role: 'user', content: parts }
    }
    const content = m.content || null
    if (!content) return null
    return { role: m.role === 'assistant' ? 'assistant' : 'user', content }
  }).filter(Boolean)

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const send = async (obj: any) => {
    if (obj?.type === 'text') {
      const text = extractAssistantText({ content: obj.text ?? obj.content })
      if (!isUsableAssistantText(text)) return
      obj = { ...obj, text, content: text }
    } else if (obj?.type === 'tool_result' && obj.content === undefined) {
      obj = { ...obj, content: obj.result ?? '' }
    }
    await writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
  }

  ;(async () => {
    try {
      const baseURL = (env.AI_BASE_URL || env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '')
      const apiModel = (env as any).AI_MODEL || 'claude-sonnet-4-6'
      const isAnthropic = !/deepseek|openai\.com|groq\.com|together\.ai|mistral\.ai|nvidia\.com/.test(baseURL)

      const callAI = async (msgs: any[], maxTokens: number, withTools: boolean): Promise<any> => {
        if (isAnthropic) {
          const res = await fetch(`${baseURL}/v1/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: apiModel,
              max_tokens: maxTokens,
              system: systemPrompt,
              messages: msgs,
              ...(withTools ? { tools: adamTools, tool_choice: { type: 'auto' } } : {}),
            }),
          })
          return { res, format: 'anthropic' }
        } else {
          const oaiTools = adamTools.map((t: any) => ({
            type: 'function',
            function: { name: t.name, description: t.description, parameters: t.input_schema || { type: 'object', properties: {} } },
          }))
          const res = await fetch(`${baseURL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: apiModel,
              max_tokens: maxTokens,
              messages: [{ role: 'system', content: systemPrompt }, ...msgs],
              ...(withTools ? { tools: oaiTools, tool_choice: 'auto' } : {}),
            }),
          })
          return { res, format: 'openai' }
        }
      }

      let currentMessages: any[] = [...anthropicMessages]
      let hadToolCalls = false
      let sentFinalText = false
      let sentError = false

      for (let i = 0; i < 5; i++) {
        const { res, format } = await callAI(currentMessages, 4096, true)

        if (!res.ok) {
          const errText = await res.text()
          await send({ type: 'error', error: `AI API 错误: ${res.status} ${errText.slice(0, 300)}` })
          sentError = true
          break
        }

        const data: any = await res.json()

        let assistantText = ''
        let toolCalls: any[] = []
        let hasToolCall = false

        if (format === 'anthropic') {
          if (!data.content) {
            await send({ type: 'error', error: `AI 无响应: ${JSON.stringify(data).slice(0, 200)}` })
            sentError = true
            break
          }
          assistantText = (data.content as any[]).filter(b => b.type === 'text').map(b => b.text || '').join('')
          toolCalls = (data.content as any[]).filter(b => b.type === 'tool_use')
          hasToolCall = data.stop_reason === 'tool_use' && toolCalls.length > 0
        } else {
          const choice = data.choices?.[0]
          if (!choice) {
            await send({ type: 'error', error: `AI 无响应: ${JSON.stringify(data).slice(0, 200)}` })
            sentError = true
            break
          }
          assistantText = extractAssistantText(choice.message)
          toolCalls = (choice.message?.tool_calls || []).map((tc: any) => ({
            id: tc.id, name: tc.function.name, input: safeParseToolArguments(tc.function.arguments),
          }))
          hasToolCall = choice.finish_reason === 'tool_calls' && toolCalls.length > 0
        }

        if (isUsableAssistantText(assistantText)) await send({ type: 'text', text: assistantText })

        if (!hasToolCall) {
          sentFinalText = isUsableAssistantText(assistantText)
          break
        }

        hadToolCalls = true

        if (format === 'anthropic') {
          currentMessages.push({ role: 'assistant', content: data.content })
        } else {
          currentMessages.push({ role: 'assistant', content: assistantText || null, tool_calls: (data.choices[0].message.tool_calls) })
        }

        const toolResultContents: any[] = []
        const oaiToolResults: any[] = []

        for (const tc of toolCalls) {
          const callId = tc.id
          const name = format === 'anthropic' ? tc.name : tc.name
          const input = format === 'anthropic' ? (tc.input || {}) : (tc.input || {})
          await send({ type: 'tool_start', id: callId, name, input })
          const result = await executeAdamTool(name, input, books, env.AGENT_MEMORY, stateKey, env)
          await send({ type: 'tool_result', id: callId, name, result })

          if (name === 'consult_marketing_expert' && erpToken && env.AGENT_MEMORY) {
            try {
              const callerKey = `mem:${tokenKey}:marketing:adam`
              const existing = await env.AGENT_MEMORY.get(callerKey, 'json') as any[] || []
              const now = new Date().toISOString()
              existing.push(
                { role: 'user', content: input?.question || '', caller: 'adam', time: now },
                { role: 'assistant', content: result, time: now }
              )
              await env.AGENT_MEMORY.put(callerKey, JSON.stringify(existing.slice(-30)), { expirationTtl: 60 * 60 * 24 * 30 })
            } catch {}
          }

          if (name === 'save_memory' && erpToken && env.AGENT_MEMORY) {
            try {
              const memKey = `mem:${tokenKey}:adam:memories`
              const existing = await env.AGENT_MEMORY.get(memKey, 'json') as MemoryEntry[] || []
              const entry: MemoryEntry = {
                id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                content: input?.content || '',
                tags: (input?.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
                importance: Math.min(10, Math.max(1, Number(input?.importance) || 5)),
                timestamp: new Date().toISOString(),
              }
              existing.push(entry)
              const trimmed = existing.length > 50
                ? existing.sort((a: MemoryEntry, b: MemoryEntry) => b.importance - a.importance).slice(0, 50)
                : existing
              await env.AGENT_MEMORY.put(memKey, JSON.stringify(trimmed), { expirationTtl: 60 * 60 * 24 * 365 })
            } catch {}
          }

          toolResultContents.push({ type: 'tool_result', tool_use_id: callId, content: result })
          oaiToolResults.push({ role: 'tool', tool_call_id: callId, content: result })
        }

        if (format === 'anthropic') {
          currentMessages = [...currentMessages, { role: 'user', content: toolResultContents }]
        } else {
          currentMessages = [...currentMessages, ...oaiToolResults]
        }
      }

      if (hadToolCalls && !sentFinalText) {
        try {
          const summaryMsg = { role: 'user' as const, content: '现在不要再调用工具。请用亚当的第一人称，基于刚才工具结果，直接回复规则传递者。' }
          const { res: finalRes, format } = await callAI([...currentMessages, summaryMsg], 800, false)
          if (finalRes.ok) {
            const finalData: any = await finalRes.json()
            const finalText = format === 'anthropic'
              ? (finalData.content as any[] || []).filter(b => b.type === 'text').map(b => b.text || '').join('')
              : extractAssistantText(finalData.choices?.[0]?.message)
            if (isUsableAssistantText(finalText)) {
              await send({ type: 'text', text: finalText })
              sentFinalText = true
            }
          }
        } catch {}
      }

      if (!sentFinalText && !sentError) {
        await send({ type: 'text', text: '我在，刚才这轮工具结果没有整理成完整结论。你把问题再丢给我一次，我会直接给判断。' })
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } catch (e: any) {
      await send({ type: 'error', error: e.message })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
