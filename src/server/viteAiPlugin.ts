import type { Plugin } from 'vite'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { allTools } from './tools/erpTools'
import { executeTool } from './tools/toolExecutor'
import { handleRealtimeUpgrade } from './realtimeRelay'
import { getAgent, AGENTS } from './agents/agentRegistry'
import { adamTools } from './tools/adamTools'
import { executeAdamTool, kdpPublishQueue } from './tools/adamExecutor'
import { adamAgent } from './agents/adamOrchestrator'
import { detectIntent, getSystemPrompt } from './agents/orchestrator'

// ── OpenAI-compatible API helper ───────────────────────────────────────────────
const AI_MODEL_FAST = 'deepseek-chat'   // 原 claude-haiku
const AI_MODEL_BEST = 'deepseek-chat'   // 原 claude-sonnet

function getAIConfig() {
  return {
    apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    baseURL: (process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, ''),
  }
}

function toOpenAITools(tools: any[]) {
  return tools.map((t: any) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema || t.parameters || { type: 'object', properties: {} },
    },
  }))
}

/** Convert Anthropic-format messages to OpenAI-format messages.
 *  Each message: { role: 'user'|'assistant', content: string|array }
 *   - Anthropic content blocks (type:'text', type:'image', type:'tool_use', type:'tool_result')
 *   - OpenAI content is string for text, or array of {type:'text'|'image_url'} parts
 */
function toOpenAIMessages(anthropicMessages: any[]): any[] {
  const result: any[] = []
  for (const m of anthropicMessages) {
    if (!m || !m.role) continue
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const content = m.content
    if (!content) {
      result.push({ role, content: '' })
      continue
    }
    // Already a string — use as-is
    if (typeof content === 'string') {
      result.push({ role, content })
      continue
    }
    // Array of content blocks
    if (Array.isArray(content)) {
      const oaiParts: any[] = []
      let toolCalls: any[] | undefined
      for (const block of content) {
        if (!block || !block.type) continue
        if (block.type === 'text') {
          oaiParts.push({ type: 'text', text: block.text })
        } else if (block.type === 'image' && block.source) {
          const src = block.source
          if (src.type === 'base64') {
            oaiParts.push({ type: 'image_url', image_url: { url: `data:${src.media_type || 'image/png'};base64,${src.data}` } })
          } else if (src.type === 'url') {
            oaiParts.push({ type: 'image_url', image_url: { url: src.url } })
          }
        } else if (block.type === 'tool_use') {
          toolCalls = toolCalls || []
          toolCalls.push({
            id: block.id,
            type: 'function',
            function: { name: block.name, arguments: JSON.stringify(block.input || {}) },
          })
        } else if (block.type === 'tool_result') {
          // OpenAI tool_results → role: 'tool'
          result.push({ role: 'tool', tool_call_id: block.tool_use_id, content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content) })
        }
      }
      if (oaiParts.length > 0) {
        if (toolCalls) {
          result.push({ role, content: oaiParts, tool_calls: toolCalls })
        } else {
          result.push({ role, content: oaiParts })
        }
      } else if (toolCalls) {
        result.push({ role, content: null, tool_calls: toolCalls })
      }
      continue
    }
    // Fallback
    result.push({ role, content: String(content) })
  }
  return result
}

function getNvidiaConfig() {
  return {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseURL: 'https://integrate.api.nvidia.com',
    model: 'minimaxai/minimax-m2.7',
  }
}

async function doOpenaiCall(opts: {
  model: string
  system: string
  messages: any[]
  tools?: any[]
  max_tokens?: number
}, cfg: { apiKey: string; baseURL: string }): Promise<any> {
  const body: any = {
    model: opts.model,
    max_tokens: opts.max_tokens ?? 4096,
    messages: [
      { role: 'system', content: opts.system },
      ...toOpenAIMessages(opts.messages),
    ],
  }
  if (opts.tools && opts.tools.length > 0) {
    body.tools = toOpenAITools(opts.tools)
    body.tool_choice = 'auto'
  }
  const response = await fetch(`${cfg.baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI API 错误: ${response.status} ${errText}`)
  }
  return response.json()
}

async function openaiCall(opts: {
  model: string
  system: string
  messages: any[]
  tools?: any[]
  max_tokens?: number
}): Promise<any> {
  try {
    return await doOpenaiCall(opts, getAIConfig())
  } catch (primaryErr: any) {
    const nvidia = getNvidiaConfig()
    if (!nvidia.apiKey) throw primaryErr
    console.warn('[ai] 主API失败，切换NVIDIA备用:', primaryErr.message)
    return await doOpenaiCall({ ...opts, model: nvidia.model }, nvidia)
  }
}

/** Convert OpenAI response format to the same shape anthropicCall returned.
 *  The rest of the code expects: { content: [{ type:'text', text:... }, { type:'tool_use', id, name, input }] }
 */
function fromOpenAIResponse(data: any): any {
  const choice = data.choices?.[0]
  if (!choice) return { content: [], stop_reason: 'end_turn' }
  const content: any[] = []
  if (choice.message?.content) {
    content.push({ type: 'text', text: choice.message.content })
  }
  if (choice.message?.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments) })
    }
  }
  return { content, stop_reason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn' }
}


// ── 通知队列（内存，dev环境用） ──────────────────────────────────────────────
interface ScheduledNotification {
  id: string
  type: 'morning' | 'noon' | 'evening'
  title: string
  content: string
  time: string
  read: boolean
}
const notificationQueue: ScheduledNotification[] = []

function pushNotification(n: Omit<ScheduledNotification, 'id' | 'read'>) {
  notificationQueue.unshift({
    ...n,
    id: Date.now().toString(),
    read: false,
  })
  if (notificationQueue.length > 20) notificationQueue.splice(20)
}

// ── Agent 记忆系统（五类）────────────────────────────────────────────────────
type MemoryCategory = 'insight' | 'lesson' | 'strategy' | 'preference' | 'fact'
// insight   = 洞察：从任务中提炼的规律性认知
// lesson    = 教训：失败/被打回的经验，避免重蹈
// strategy  = 策略：证明有效的执行方式
// preference = 偏好：用户/品牌的明确喜好
// fact      = 事实：客观数据基准（销量/价格/受众等）

interface AgentMemory {
  agentId: string
  category: MemoryCategory
  content: string
  timestamp: number
  weight: number  // 1-10，影响下次注入优先级
}

// 每个 Agent 最多保留 30 条记忆，超出按 weight 淘汰最低的；持久化到本地文件
const MEMORY_FILE = resolve(process.cwd(), '.agent-memory.json')

function loadMemoryStore(): Map<string, AgentMemory[]> {
  try {
    if (existsSync(MEMORY_FILE)) {
      const raw = JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'))
      return new Map(Object.entries(raw))
    }
  } catch (_) {}
  return new Map()
}

function saveMemoryStore(store: Map<string, AgentMemory[]>) {
  try {
    writeFileSync(MEMORY_FILE, JSON.stringify(Object.fromEntries(store)), 'utf-8')
  } catch (_) {}
}

const agentMemoryStore: Map<string, AgentMemory[]> = loadMemoryStore()

function addAgentMemory(agentId: string, category: MemoryCategory, content: string, weight = 5) {
  if (!agentMemoryStore.has(agentId)) agentMemoryStore.set(agentId, [])
  const memories = agentMemoryStore.get(agentId)!
  memories.push({ agentId, category, content, timestamp: Date.now(), weight })
  if (memories.length > 30) {
    memories.sort((a, b) => b.weight - a.weight)
    memories.splice(30)
  }
  saveMemoryStore(agentMemoryStore)
}

function getAgentMemoryPrompt(agentId: string): string {
  const memories = agentMemoryStore.get(agentId)
  if (!memories || memories.length === 0) return ''

  // 按类别分组，各取 weight 最高的
  const grouped: Record<MemoryCategory, AgentMemory[]> = {
    insight: [], lesson: [], strategy: [], preference: [], fact: [],
  }
  for (const m of memories) grouped[m.category].push(m)

  const categoryLabel: Record<MemoryCategory, string> = {
    insight: '💡 洞察', lesson: '⚠️ 教训', strategy: '✅ 有效策略',
    preference: '🎯 偏好', fact: '📊 数据基准',
  }

  const lines: string[] = []
  for (const cat of Object.keys(grouped) as MemoryCategory[]) {
    const items = grouped[cat].sort((a, b) => b.weight - a.weight).slice(0, 3)
    if (items.length === 0) continue
    lines.push(`${categoryLabel[cat]}：`)
    items.forEach(m => lines.push(`  - ${m.content}`))
  }

  return lines.length > 0
    ? `\n\n【你的经验记忆 — 过往任务沉淀，影响本次决策30%】\n${lines.join('\n')}`
    : ''
}

// ── Agent 亲和度系统 ─────────────────────────────────────────────────────────
interface AffinityRecord {
  score: number       // -100 ~ 100，0 为中性
  interactions: number
}

// key 格式：`agentA:agentB`（字母序，保证唯一）
const affinityStore: Map<string, AffinityRecord> = new Map()

function affinityKey(a: string, b: string): string {
  return [a, b].sort().join(':')
}

function updateAffinity(agentA: string, agentB: string, outcome: 'agree' | 'conflict' | 'neutral') {
  const key = affinityKey(agentA, agentB)
  const record = affinityStore.get(key) ?? { score: 0, interactions: 0 }
  const delta = outcome === 'agree' ? 5 : outcome === 'conflict' ? -3 : 1
  record.score = Math.max(-100, Math.min(100, record.score + delta))
  record.interactions++
  affinityStore.set(key, record)
}

function getAffinity(agentA: string, agentB: string): number {
  return affinityStore.get(affinityKey(agentA, agentB))?.score ?? 0
}

// Captain 分配子团队时，优先选亲和度高的组合
function sortByAffinity(agentIds: string[]): string[] {
  if (agentIds.length <= 1) return agentIds
  // 计算每个 Agent 与其他人的平均亲和度，高的排前面
  return [...agentIds].sort((a, b) => {
    const avgA = agentIds.filter(x => x !== a).reduce((s, x) => s + getAffinity(a, x), 0) / (agentIds.length - 1)
    const avgB = agentIds.filter(x => x !== b).reduce((s, x) => s + getAffinity(b, x), 0) / (agentIds.length - 1)
    return avgB - avgA
  })
}

// ── 定时触发（早09:00 / 午13:00 / 晚18:00）───────────────────────────────────
function startScheduler(apiKey: string) {
  const checkInterval = 60 * 1000 // 每分钟检查一次

  let lastFiredHour = -1

  setInterval(() => {
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()

    // 触发时间：9:00 / 13:00 / 18:00，每个整点只触发一次
    const triggerHours = [9, 13, 18]
    if (triggerHours.includes(h) && m === 0 && lastFiredHour !== h) {
      lastFiredHour = h
      runScheduledTrigger(h, apiKey)
    }
  }, checkInterval)
}

async function runScheduledTrigger(hour: number, apiKey: string) {
  const type = hour === 9 ? 'morning' : hour === 13 ? 'noon' : 'evening'
  const typeLabel = { morning: '早报', noon: '午检', evening: '晚结' }[type]

  const prompts: Record<string, string> = {
    morning: `现在是早上9点。请做今日早报：
1. 用 query_sales 查询今日销售数据（今天的）
2. 用 query_purchases 查询今日采购数据
3. 用 query_finance 查询资金账户余额
综合以上数据，生成一份简洁的今日经营早报，包含关键数字和今日需要关注的事项。200字以内。`,

    noon: `现在是下午1点。请做午检报告：
1. 用 query_sales 查询今日上午的销售情况
2. 如有未完成的采购或销售订单，提醒跟进
生成一份简洁的午检提醒，重点突出今天上午的进展和下午需要处理的事项。150字以内。`,

    evening: `现在是下午6点。请做今日收盘总结：
1. 用 query_sales 查询今日销售汇总
2. 用 query_purchases 查询今日采购汇总
3. 用 query_finance 查询今日资金变化
生成一份今日经营日报，包含：今日成绩、待处理事项、明日建议。200字以内。`,
  }

  try {
    const oaiTools = toOpenAITools(allTools)
    let currentMessages: any[] = [{ role: 'user', content: prompts[type] }]
    let content = ''

    for (let i = 0; i < 3; i++) {
      const data = await openaiCall({
        model: AI_MODEL_FAST,
        system: getSystemPrompt('query'),
        tools: oaiTools,
        messages: currentMessages,
      })
      const blocks = data.content || []
      for (const block of blocks) {
        if (block.type === 'text' && block.text) content += block.text
      }
      const toolUses = blocks.filter((b: any) => b.type === 'tool_use')
      if (toolUses.length === 0 || data.stop_reason === 'end_turn') break
      currentMessages.push({ role: 'assistant', content: blocks })
      const toolResults: any[] = []
      for (const toolUse of toolUses) {
        const result = await executeTool(toolUse.name, toolUse.input || {}, '')
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
      }
      currentMessages.push({ role: 'user', content: toolResults })
    }

    if (content) {
      pushNotification({
        type,
        title: `${typeLabel} · ${new Date().toLocaleDateString('zh-CN')}`,
        content,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      })
    }
  } catch (e: any) {
    console.error(`[scheduler] ${typeLabel} 触发失败:`, e.message)
  }
}

// ── Local user store (dev only) ───────────────────────────────────────────────
const USERS_FILE = resolve(process.cwd(), '.local-users.json')

function readUsers(): Record<string, any> {
  try { return JSON.parse(readFileSync(USERS_FILE, 'utf-8')) } catch { return {} }
}
function writeUsers(users: Record<string, any>) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}
function makeLocalToken(account: string) {
  return `local_${Buffer.from(JSON.stringify({ account, t: Date.now() })).toString('base64')}`
}

function jsonBody(res: any, data: object, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function readBodyJson(req: any): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString())
}

export function aiChatPlugin(): Plugin {
  return {
    name: 'ai-chat-plugin',
    configureServer(server) {
      // Load .env so process.env has AI_API_KEY / ANTHROPIC_API_KEY
      loadDotenv({ path: resolve(process.cwd(), '.env') })

      // ── 启动定时调度器 ──────────────────────────────────────────────────────
      const aiApiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY
      if (aiApiKey) {
        startScheduler(aiApiKey)
        console.log('[scheduler] 早中晚定时触发已启动 (09:00 / 13:00 / 18:00)')
      }

      // ── /api/notifications — 获取未读通知 ──────────────────────────────────
      server.middlewares.use('/api/notifications', async (req: any, res: any, next: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type, x-erp-token' })
          res.end(); return
        }
        // GET：拉取未读通知
        if (req.method === 'GET') {
          const unread = notificationQueue.filter(n => !n.read)
          // 标记已读
          unread.forEach(n => { n.read = true })
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify({ messages: unread }))
          return
        }
        // POST：手动触发（测试用）
        if (req.method === 'POST') {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk)
          const { hour } = JSON.parse(Buffer.concat(chunks).toString())
          const key = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY
          if (!key) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 AI_API_KEY' })); return }
          runScheduledTrigger(hour ?? new Date().getHours(), key)
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify({ ok: true, message: '已触发，稍后刷新通知' }))
          return
        }
        next()
      })

      // ── Register endpoint ────────────────────────────────────────────────
      server.middlewares.use('/adminapi/login/register', async (req: any, res: any, next: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()
        try {
          const body = await readBodyJson(req)
          const { company_name, mobile, password } = body
          if (!company_name) return jsonBody(res, { code: 0, show: 1, message: '请输入公司名称', data: [] })
          if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) return jsonBody(res, { code: 0, show: 1, message: '请输入有效手机号', data: [] })
          if (!password || password.length < 6) return jsonBody(res, { code: 0, show: 1, message: '密码至少6位', data: [] })
          const users = readUsers()
          if (users[mobile]) return jsonBody(res, { code: 0, show: 1, message: '该手机号已注册', data: [] })
          users[mobile] = { company_name, mobile, password, admin_id: Date.now(), created_at: Date.now() }
          writeUsers(users)
          return jsonBody(res, { code: 1, show: 0, message: '注册成功', data: {} })
        } catch (e: any) {
          return jsonBody(res, { code: 0, show: 1, message: e.message || '注册失败', data: [] })
        }
      })

      // ── Login: check local users before proxying to railway ─────────────
      server.middlewares.use('/adminapi/login/account', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next()
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req as any) chunks.push(chunk)
          const rawBody = Buffer.concat(chunks).toString()
          const body = JSON.parse(rawBody)
          const { account, password } = body
          const users = readUsers()
          const user = users[account]
          if (user && user.password === password) {
            const token = makeLocalToken(account)
            return jsonBody(res, {
              code: 1, show: 0, message: '',
              data: {
                token,
                name: user.company_name,
                avatar: '',
                role_name: '企业用户',
                userInfo: { admin_id: user.admin_id, name: user.company_name, account, role_name: '企业用户', token },
              }
            })
          }
          // Not a local user — forward to Railway directly via fetch
          const upstream = await fetch('https://erp-server-production-b1b6.up.railway.app/adminapi/login/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: rawBody,
          })
          const result = await upstream.text()
          res.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(result)
        } catch (e: any) {
          return next()
        }
      })

      // ── Transcribe endpoint (SiliconFlow Whisper) ──────────────────────────
      server.middlewares.use('/api/transcribe', async (req: any, res: any, next: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()
        const apiKey = process.env.SILICONFLOW_API_KEY
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '未配置 SILICONFLOW_API_KEY' })); return
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk)
        const body = Buffer.concat(chunks)
        const contentType = req.headers['content-type'] || ''
        try {
          const sfRes = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': contentType },
            body,
          })
          const result = await sfRes.json() as any
          if (!sfRes.ok) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: result?.message || '转写失败' })); return }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ text: result.text || '' }))
        } catch (e: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: e.message }))
        }
      })

      // ── Trending / Hot Search endpoint ──────────────────────────────────────
      const PLATFORM_ROUTE: Record<string, string> = {
        douyin: 'douyin',
        xiaohongshu: 'toutiao',   // 小红书暂无公开API，用今日头条替代
        kuaishou: 'kuaishou',
        weibo: 'weibo',
        bilibili: 'bilibili',
        zhihu: 'zhihu',
      }
      const PLATFORM_SOURCE: Record<string, string> = {
        xiaohongshu: '今日头条',
        kuaishou: '今日头条',      // 快手 DailyHotApi 不稳定，fallback 到头条
      }
      // Fallback route: if primary route fails, try this one
      const FALLBACK_ROUTE: Record<string, string> = {
        kuaishou: 'toutiao',
      }
      const trendingCache = new Map<string, { data: any[]; ts: number }>()
      const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

      server.middlewares.use('/api/trending', async (req: any, res: any, next: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end(); return
        }
        if (req.method !== 'GET') return next()

        const url = new URL(req.url || '', 'http://localhost')
        const platform = url.searchParams.get('platform') || 'douyin'
        const routeName = PLATFORM_ROUTE[platform]

        if (!routeName) {
          return jsonBody(res, { code: 400, data: [], message: `不支持的平台: ${platform}` }, 400)
        }

        // Check cache
        const cached = trendingCache.get(platform)
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          return jsonBody(res, {
            code: 200,
            data: cached.data,
            source: PLATFORM_SOURCE[platform] || platform,
            fromCache: true,
          })
        }

        try {
          const { handleRoute } = await import(`dailyhot-api/dist/routes/${routeName}.js`)
          // Some routes (e.g. bilibili) expect a Hono-like context object
          const fakeCtx = { req: { query: () => undefined } }
          const result = await handleRoute(fakeCtx, true)
          const items = (result.data || []).map((item: any) => ({
            title: item.title || '',
            heat: typeof item.hot === 'number'
              ? (item.hot >= 10000 ? `${(item.hot / 10000).toFixed(0)}万` : String(item.hot))
              : item.hot || '热门',
            url: item.url || item.mobileUrl || '',
          }))

          trendingCache.set(platform, { data: items, ts: Date.now() })

          return jsonBody(res, {
            code: 200,
            data: items,
            source: PLATFORM_SOURCE[platform] || platform,
            total: items.length,
            updateTime: result.updateTime || new Date().toISOString(),
          })
        } catch (e: any) {
          // Fallback: try pearktrue API
          const PEARKTRUE_NAMES: Record<string, string> = {
            douyin: '抖音', weibo: '微博', bilibili: '哔哩哔哩', zhihu: '知乎',
          }
          const pearkName = PEARKTRUE_NAMES[routeName]
          if (pearkName) {
            try {
              const fbRes = await fetch(`https://api.pearktrue.cn/api/dailyhot/?title=${encodeURIComponent(pearkName)}`)
              const fbJson = await fbRes.json() as any
              if (fbJson.code === 200 && Array.isArray(fbJson.data)) {
                const items = fbJson.data.map((item: any) => ({
                  title: item.title || '',
                  heat: typeof item.hot === 'number'
                    ? (item.hot >= 10000 ? `${(item.hot / 10000).toFixed(0)}万` : String(item.hot))
                    : item.hot || '热门',
                  url: item.url || item.mobileUrl || '',
                }))
                trendingCache.set(platform, { data: items, ts: Date.now() })
                return jsonBody(res, {
                  code: 200, data: items,
                  source: PLATFORM_SOURCE[platform] || platform,
                  total: items.length, fallback: 'pearktrue',
                })
              }
            } catch { /* pearktrue also failed, fall through */ }
          }
          // Fallback 2: use alternative DailyHot route (e.g. kuaishou → toutiao)
          const fbRoute = FALLBACK_ROUTE[platform]
          if (fbRoute) {
            try {
              const { handleRoute: fbHandle } = await import(`dailyhot-api/dist/routes/${fbRoute}.js`)
              const fbResult = await fbHandle({ req: { query: () => undefined } }, true)
              const items = (fbResult.data || []).map((item: any) => ({
                title: item.title || '',
                heat: typeof item.hot === 'number'
                  ? (item.hot >= 10000 ? `${(item.hot / 10000).toFixed(0)}万` : String(item.hot))
                  : item.hot || '热门',
                url: item.url || item.mobileUrl || '',
              }))
              trendingCache.set(platform, { data: items, ts: Date.now() })
              return jsonBody(res, {
                code: 200, data: items,
                source: PLATFORM_SOURCE[platform] || platform,
                total: items.length, fallback: fbRoute,
              })
            } catch { /* fallback route also failed */ }
          }
          console.error(`[trending] ${platform} fetch failed:`, e.message)
          return jsonBody(res, { code: 500, data: [], message: `获取 ${platform} 热搜失败: ${e.message}` }, 500)
        }
      })

      server.middlewares.use('/api/ai-chat', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
          })
          res.end()
          return
        }
        if (req.method !== 'POST') return next()

        const body: Buffer[] = []
        for await (const chunk of req as any) body.push(chunk)
        const { messages, images, userMemory } = JSON.parse(Buffer.concat(body).toString())
        const erpToken = ((req as any).headers['x-erp-token'] as string) || ''

        const { apiKey, baseURL } = getAIConfig()
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '未配置 AI_API_KEY' }))
          return
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        })

        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
          const intent = images?.length > 0 ? 'create' : detectIntent(lastUserMsg?.content || '')
          let systemPrompt = getSystemPrompt(intent)
          if (userMemory) systemPrompt += '\n\n' + userMemory

          // Build messages — inject images into last user message if present
          const lastMsg = messages[messages.length - 1]
          const rawMessages = messages.map((m: any, idx: number) => {
            const isLastUser = m.role === 'user' && idx === messages.length - 1
            if (isLastUser && images?.length > 0) {
              const parts: any[] = images.map((img: any) => ({
                type: 'image',
                source: { type: 'base64', media_type: img.mediaType, data: img.data },
              }))
              parts.push({ type: 'text', text: m.content || '请识别这张单据图片并帮我录入系统。' })
              return { role: 'user', content: parts }
            }
            return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }
          })

          const oaiTools = toOpenAITools(allTools)
          let currentMessages = [...rawMessages]

          for (let i = 0; i < 5; i++) {
            const data = await openaiCall({
              model: AI_MODEL_FAST,
              system: systemPrompt,
              tools: oaiTools,
              messages: currentMessages,
            })
            const blocks = data.content || []

            for (const block of blocks) {
              if (block.type === 'text' && block.text) send({ type: 'text', text: block.text })
            }

            const toolUses = blocks.filter((b: any) => b.type === 'tool_use')
            if (toolUses.length === 0 || data.stop_reason === 'end_turn') break

            currentMessages.push({ role: 'assistant', content: blocks })
            const toolResults: any[] = []
            for (const toolUse of toolUses) {
              send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
              const result = await executeTool(toolUse.name, toolUse.input || {}, erpToken)
              send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }
            currentMessages.push({ role: 'user', content: toolResults })
          }

          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          send({ type: 'error', error: e.message })
        } finally {
          res.end()
        }
      })

      // ── /api/ai-extract-memory — 从对话中提取用户偏好 ──────────────────────────
      server.middlewares.use('/api/ai-extract-memory', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()

        const body: Buffer[] = []
        for await (const chunk of req as any) body.push(chunk)
        const { conversationSummary } = JSON.parse(Buffer.concat(body).toString())

        const { apiKey } = getAIConfig()
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 AI_API_KEY' })); return }

        try {
          const data = await openaiCall({
            model: AI_MODEL_FAST,
            system: `你是偏好提取引擎。分析以下ERP对话，提取用户的使用偏好。
只输出纯JSON（不要markdown代码块），格式如下（省略无法判断的字段）：
{
  "nickName": "用户希望被称呼的方式",
  "aliases": {"用户术语": "ERP标准术语"},
  "defaultWarehouse": "仓库名",
  "topCustomers": ["客户名"],
  "topSuppliers": ["供应商名"],
  "habits": ["观察到的使用习惯"],
  "language": "简洁或详细"
}
不要猜测，只提取对话中明确体现的偏好。没有体现的字段不要输出。`,
            messages: [{ role: 'user', content: conversationSummary }],
            max_tokens: 512,
          })
          const text = data.content?.[0]?.text || '{}'
          const cleaned = text.replace(/\`\`\`json?\s*/g, '').replace(/\`\`\`\s*/g, '').trim()
          const preferences = JSON.parse(cleaned)
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify({ preferences }))
        } catch (e: any) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify({ preferences: {} }))
        }
      })

      // ── /api/agent-chat — 专项Agent独立对话 ─────────────────────────────────
      server.middlewares.use('/api/agent-chat', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, x-erp-token, x-agent-id' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()

        const chunks: Buffer[] = []
        for await (const chunk of req as any) chunks.push(chunk)
        const { messages, agentId, brandContext, productContext, flowResults } = JSON.parse(Buffer.concat(chunks).toString())
        const erpToken = ((req as any).headers['x-erp-token'] as string) || ''

        const agent = getAgent(agentId)
        if (!agent) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: `Unknown agent: ${agentId}` })); return }

        const { apiKey } = getAIConfig()
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 AI_API_KEY' })); return }

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          let systemInstruction = agent.systemPrompt
          if (brandContext) systemInstruction += `\n\n---\n【当前品牌信息】\n${brandContext}`
          if (productContext) systemInstruction += `\n\n---\n${productContext}`

          const oaiTools = toOpenAITools(allTools)
          const oaiMessages = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          }))
          let currentMessages = [...oaiMessages]

          for (let i = 0; i < 5; i++) {
            const data = await openaiCall({
              model: AI_MODEL_FAST,
              system: systemInstruction,
              tools: oaiTools,
              messages: currentMessages,
            })
            const blocks = data.content || []
            for (const block of blocks) {
              if (block.type === 'text' && block.text) send({ type: 'text', text: block.text })
            }
            const toolUses = blocks.filter((b: any) => b.type === 'tool_use')
            if (toolUses.length === 0 || data.stop_reason === 'end_turn') break
            currentMessages.push({ role: 'assistant', content: blocks })
            const toolResults: any[] = []
            for (const toolUse of toolUses) {
              send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
              if (toolUse.name === 'render_video') {
                send({ type: 'text', text: '\n⏳ 视频渲染中，通常需要 1~3 分钟，请稍候...\n' })
              } else if (toolUse.name === 'render_image') {
                send({ type: 'text', text: '\n⏳ 图片渲染中，请稍候...\n' })
              }
              const result = await executeTool(toolUse.name, toolUse.input || {}, erpToken, {
                flowResults: flowResults || [],
                onPublished: (index: number) => { send({ type: 'published', index }) },
              })
              send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }
            currentMessages.push({ role: 'user', content: toolResults })
          }
          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          send({ type: 'error', error: e.message })
        } finally {
          res.end()
        }
      })

      // ── /api/captain-chat — Captain多Agent协作调度 ─────────────────────────
      server.middlewares.use('/api/captain-chat', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, x-erp-token' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()

        const chunks: Buffer[] = []
        for await (const chunk of req as any) chunks.push(chunk)
        const { messages } = JSON.parse(Buffer.concat(chunks).toString())
        const erpToken = ((req as any).headers['x-erp-token'] as string) || ''

        const { apiKey, baseURL } = getAIConfig()
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 AI_API_KEY' })); return }

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        // 执行单个Sub-Agent，返回输出文本
        async function runSubAgent(subAgentId: string, taskPrompt: string): Promise<string> {
          const subAgent = getAgent(subAgentId)
          if (!subAgent) return ''
          send({ type: 'agent_start', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, task: taskPrompt })
          send({ type: 'agent_ack', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, text: '收到，开始执行。' })

          // 注入该 Agent 的历史记忆（影响决策30%）
          const memoryHint = getAgentMemoryPrompt(subAgentId)
          const systemWithMemory = memoryHint
            ? `${subAgent.systemPrompt}${memoryHint}\n\n注意：以上记忆供参考，影响你决策的30%，保留70%空间探索新方案。`
            : subAgent.systemPrompt

          let agentOutput = ''
          const subMessages: any[] = [{ role: 'user', content: taskPrompt }]

          for (let i = 0; i < 3; i++) {
            const subResp = await openaiCall({
              model: AI_MODEL_FAST,
              system: systemWithMemory,
              messages: subMessages,
              tools: toOpenAITools(allTools),
            })
            const textBlocks = subResp.content?.filter((b: any) => b.type === 'text') ?? []
            for (const b of textBlocks) {
              agentOutput += b.text
              send({ type: 'agent_thinking', agentId: subAgent.id, agentName: subAgent.name, text: b.text })
            }
            const toolBlocks = subResp.content?.filter((b: any) => b.type === 'tool_use') ?? []
            if (toolBlocks.length === 0) break
            subMessages.push({ role: 'assistant', content: subResp.content })
            const toolResults: any[] = []
            for (const tb of toolBlocks) {
              send({ type: 'tool_start', id: tb.id, name: tb.name, input: tb.input })
              const result = await executeTool(tb.name, tb.input as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: tb.id, name: tb.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify(result) })
            }
            subMessages.push({ role: 'user', content: toolResults })
          }

          // 执行完成后，把本次任务的关键产出存为策略记忆
          if (agentOutput && agentOutput.length > 50 && subAgentId !== 'skeptic') {
            const summary = agentOutput.slice(0, 120).replace(/\n/g, ' ').trim()
            addAgentMemory(subAgentId, 'strategy', `任务"${taskPrompt.slice(0, 40)}..."的有效做法：${summary}`, 5)
          }

          send({ type: 'agent_done', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, output: agentOutput })
          return agentOutput
        }

        try {
          const captain = AGENTS.captain

          const captainMessages: any[] = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          }))

          // Phase 1: Captain 分析任务
          send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '' })
          let captainResponse = ''

          for (let i = 0; i < 3; i++) {
            const response = await openaiCall({
              model: AI_MODEL_BEST,
              system: captain.systemPrompt,
              messages: captainMessages,
              tools: toOpenAITools(allTools),
            })
            const textBlocks = response.content?.filter((b: any) => b.type === 'text') ?? []
            for (const b of textBlocks) {
              captainResponse += b.text
              send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: b.text })
            }
            const toolBlocks = response.content?.filter((b: any) => b.type === 'tool_use') ?? []
            if (toolBlocks.length === 0) break
            captainMessages.push({ role: 'assistant', content: response.content })
            const toolResults: any[] = []
            for (const tb of toolBlocks) {
              send({ type: 'tool_start', id: tb.id, name: tb.name, input: tb.input })
              const result = await executeTool(tb.name, tb.input as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: tb.id, name: tb.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify(result) })
            }
            captainMessages.push({ role: 'user', content: toolResults })
          }

          // Phase 2: 解析调度指令（支持JSON流水线 + 旧格式兼容）
          const agentOutputs: Array<{ agentId: string; agentName: string; output: string }> = []

          // 按 receives_from 依赖关系将 pipeline 分层，同层无依赖可并行执行
          function groupByDependency(pipeline: any[]): any[][] {
            const layers: any[][] = []
            const placed = new Set<string>()
            let remaining = [...pipeline]
            while (remaining.length > 0) {
              const layer = remaining.filter(step => {
                const deps = step.receives_from
                  ? (Array.isArray(step.receives_from) ? step.receives_from : [step.receives_from])
                  : []
                return deps.every((d: string) => placed.has(d))
              })
              if (layer.length === 0) break
              layer.forEach(s => placed.add(s.agentId))
              layers.push(layer)
              remaining = remaining.filter(s => !placed.has(s.agentId))
            }
            return layers
          }

          // 尝试解析 JSON 流水线
          const pipelineMatch = captainResponse.match(/```dispatch-plan\s*([\s\S]*?)```/)
          if (pipelineMatch) {
            // JSON 流水线模式
            try {
              const plan = JSON.parse(pipelineMatch[1].trim())
              if (plan.mode === 'pipeline' && Array.isArray(plan.pipeline)) {
                const stepOutputs: Record<string, string> = {}
                const layers = groupByDependency(plan.pipeline)
                let gateTriggered = false

                for (const layer of layers) {
                  if (gateTriggered) break

                  if (layer.length > 1) {
                    send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: `\n⚡ **并行执行** ${layer.map(s => getAgent(s.agentId)?.name || s.agentId).join(' / ')}\n` })
                  }

                  await Promise.all(layer.map(async (step) => {
                    const subAgent = getAgent(step.agentId)
                    if (!subAgent) return

                    // 构建任务提示词：如有上游输出则附加
                    let taskPrompt = `Captain指令：${step.task}\n\n请直接执行并交付成果。`
                    const upstream = step.receives_from
                    if (upstream) {
                      const sources = Array.isArray(upstream) ? upstream : [upstream]
                      const upstreamContext = sources
                        .filter((id: string) => stepOutputs[id])
                        .map((id: string) => {
                          const ag = getAgent(id)
                          return `【${ag?.name || id}的产出】\n${stepOutputs[id]}`
                        })
                        .join('\n\n---\n\n')
                      if (upstreamContext) {
                        taskPrompt += `\n\n---\n上游输出供参考：\n${upstreamContext}`
                      }
                    }

                    let output = await runSubAgent(step.agentId, taskPrompt)
                    stepOutputs[step.agentId] = output

                    // 对抗审核：需要质疑官审核的步骤（非 skeptic 自身，非 captain）
                    if (step.auto_review !== false && !['skeptic', 'captain', 'brand'].includes(step.agentId)) {
                      const reviewPrompt = `请审核以下内容：\n\n【原始任务】\n${step.task}\n\n【${subAgent.name}的输出】\n${output}`
                      const reviewOutput = await runSubAgent('skeptic', reviewPrompt)

                      if (reviewOutput.includes('判断：REJECT') || reviewOutput.includes('判断:REJECT')) {
                        send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: `\n\n🔄 **质疑官打回 ${subAgent.name} 的输出，要求重做...**\n` })
                        const lessonText = reviewOutput.slice(0, 150).replace(/\n/g, ' ').trim()
                        addAgentMemory(step.agentId, 'lesson', `被质疑官REJECT：${lessonText}`, 8)
                        updateAffinity(step.agentId, 'skeptic', 'conflict')
                        const retryPrompt = `${taskPrompt}\n\n---\n【质疑官审核意见，必须改进】\n${reviewOutput}`
                        output = await runSubAgent(step.agentId, retryPrompt)
                        stepOutputs[step.agentId] = output
                      } else if (reviewOutput.includes('判断：HOLD') || reviewOutput.includes('判断:HOLD')) {
                        updateAffinity(step.agentId, 'skeptic', 'neutral')
                        stepOutputs[step.agentId] = `${output}\n\n---\n【质疑官建议（HOLD，供参考）】\n${reviewOutput}`
                      } else {
                        updateAffinity(step.agentId, 'skeptic', 'agree')
                      }
                    }

                    agentOutputs.push({ agentId: subAgent.id, agentName: subAgent.name, output })

                    if (step.receives_from) {
                      const upstreams = Array.isArray(step.receives_from) ? step.receives_from : [step.receives_from]
                      upstreams.forEach((upId: string) => updateAffinity(step.agentId, upId, 'agree'))
                    }

                    // brand 审核关卡：设标志，层结束后统一处理
                    if (step.is_gate && step.agentId === 'brand' && output.includes('❌ 不通过')) {
                      gateTriggered = true
                    }
                  }))

                  if (gateTriggered) {
                    send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '\n\n⚠️ **品牌审核未通过**，流水线暂停。请根据品牌Agent的意见修改后重新提交。\n' })
                    res.write('data: [DONE]\n\n')
                    res.end()
                    return
                  }
                }
              }
            } catch (_) {
              // JSON 解析失败，降级到旧格式
            }
          }

          // 旧格式：@@DISPATCH:agentId:任务@@（兼容单dispatch）
          if (agentOutputs.length === 0) {
            const dispatchRe = /@@DISPATCH:(\w+):([^@]+)@@/g
            let m
            while ((m = dispatchRe.exec(captainResponse)) !== null) {
              const agentId = m[1]
              const task = m[2].trim()
              const subAgent = getAgent(agentId)
              if (!subAgent) continue
              const output = await runSubAgent(agentId, `Captain指令：${task}\n\n请直接执行并交付成果。`)
              agentOutputs.push({ agentId: subAgent.id, agentName: subAgent.name, output })
            }
          }

          // Phase 3: Captain 汇总
          if (agentOutputs.length > 0) {
            const summaryContext = agentOutputs.map(a => `【${a.agentName}提交】\n${a.output}`).join('\n\n---\n\n')
            const summaryPrompt = `原始指令：${messages[messages.length - 1]?.content}\n\n各团队成员已完成任务，汇总如下：\n\n${summaryContext}\n\n请以Captain身份，简洁有力地综合以上成果，直接呈现给决策者。不要逐个复述，给出整体判断和可执行建议。`
            send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '\n\n---\n**📋 Captain 综合汇报**\n\n' })

            const summaryResp = await openaiCall({
              model: AI_MODEL_BEST,
              system: AGENTS.captain.systemPrompt,
              messages: [{ role: 'user', content: summaryPrompt }],
            })
            for (const b of summaryResp.content ?? []) {
              if (b.type === 'text') send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: b.text })
            }
          }

          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          send({ type: 'error', error: e.message })
        } finally {
          res.end()
        }
      })

      // ── /api/adam-agent — 亚当投资决策中枢 (Anthropic Claude) ──────────────
      server.middlewares.use('/api/adam-agent', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, x-erp-token' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()

        const chunks: Buffer[] = []
        for await (const chunk of req as any) chunks.push(chunk)
        const { messages, images, adamState } = JSON.parse(Buffer.concat(chunks).toString())
        const erpToken = ((req as any).headers['x-erp-token'] as string) || ''

        const { apiKey, baseURL } = getAIConfig()
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 AI_API_KEY' })); return }

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const systemPrompt = adamAgent.buildSystemPrompt(adamState || {})

          // 构建 OpenAI tools 格式
          const oaiAdamTools = adamTools.map((t: any) => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters || { type: 'object', properties: {} },
            },
          }))

          // 构建消息历史：最后一条 user 消息如有图片则插入 vision 内容块
          const rawAdamMessages = messages.map((m: any, idx: number) => {
            const isLastUser = m.role === 'user' && idx === messages.length - 1
            if (isLastUser && images?.length > 0) {
              const parts: any[] = images.map((img: any) => ({
                type: 'image',
                source: { type: 'base64', media_type: img.mediaType, data: img.data },
              }))
              parts.push({ type: 'text', text: m.content || '请分析这张图片。' })
              return { role: 'user', content: parts }
            }
            return {
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            }
          })

          // 工具调用循环（最多5轮）
          let currentMessages = [...rawAdamMessages]
          for (let i = 0; i < 5; i++) {
            const resp = await openaiCall({
              model: AI_MODEL_BEST,
              system: systemPrompt,
              messages: currentMessages,
              tools: oaiAdamTools,
              max_tokens: 4096,
            })

            const data = fromOpenAIResponse(resp)
            const content = data.content || []

            // 流式输出文本
            for (const block of content) {
              if (block.type === 'text' && block.text) {
                send({ type: 'text', text: block.text })
              }
            }

            // 处理工具调用
            const toolUses = content.filter((b: any) => b.type === 'tool_use')
            if (toolUses.length === 0 || data.stop_reason === 'end_turn') break

            // 把 assistant 回复加入历史
            currentMessages.push({ role: 'assistant', content })

            // 执行工具并收集结果
            const toolResults: any[] = []
            for (const toolUse of toolUses) {
              send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
              const result = await executeAdamTool(toolUse.name, toolUse.input || {}, erpToken)
              send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }

            // 把工具结果加入历史，继续对话
            currentMessages.push({ role: 'user', content: toolResults })
          }

          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          send({ type: 'error', error: e.message })
        } finally {
          res.end()
        }
      })

      // ── /api/brand-chat — 品牌客服智能体（无ERP工具，只用品牌知识库）──────────
      server.middlewares.use('/api/brand-chat', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()

        const chunks: Buffer[] = []
        for await (const chunk of req as any) chunks.push(chunk)
        const { messages, brandContext } = JSON.parse(Buffer.concat(chunks).toString())

        const { apiKey, baseURL } = getAIConfig()
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '未配置 AI_API_KEY' })); return
        }

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const systemPrompt = `你是 NOMADIC DAIRY 的专属客服助手 Nova。

【性格】温暖、专业、简洁。中英文都能流畅沟通，根据用户语言自动切换。
【禁止】绝对不透露你是 AI 或任何底层技术、不讨论竞争对手、不承诺无法实现的功能。
【能力范围】只回答和 NOMADIC DAIRY 品牌相关的问题：
- 产品信息、规格、使用场景
- 批发采购流程、起订量、价格咨询
- 物流时效、配送政策、退换货
- 订单状态查询引导（告知用户去订单查询页面）
- 品牌故事、品牌理念
- 支持渠道、联系方式

【当前品牌信息】
${brandContext || 'NOMADIC DAIRY — 专为数字游民设计的装备品牌，覆盖 120+ 国家。'}

【回复风格】
- 简洁，不超过3段
- 产品价格/库存 → 引导去商店页面查看
- 批发询价 → 引导填写采购商申请表
- 订单问题 → 引导去订单查询页面输入手机号或订单号`

          const data = await openaiCall({
            model: AI_MODEL_FAST,
            system: systemPrompt,
            messages: messages.map((m: any) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            max_tokens: 1024,
          })
          const text = data.content?.[0]?.text || ''
          if (text) send({ type: 'text', text })
          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          send({ type: 'error', error: e.message })
        } finally {
          res.end()
        }
      })

      // ── 多平台发布接口 ────────────────────────────────────────────────────────
      // ── /api/kdp/queue — KDP 发布队列 ──────────────────────────────────────
      server.middlewares.use('/api/kdp/queue', async (req: any, res: any, next: any) => {
        const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PATCH', 'Access-Control-Allow-Headers': 'Content-Type' }
        if (req.method === 'OPTIONS') { res.writeHead(200, cors); res.end(); return }

        // GET — 查询队列
        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json', ...cors })
          res.end(JSON.stringify({
            total: kdpPublishQueue.length,
            books: kdpPublishQueue.map(b => ({
              id: b.id, title: b.title, subtitle: b.subtitle,
              price: b.price, keywords: b.keywords, categories: b.categories,
              status: b.status, createdAt: b.createdAt,
              manuscript_preview: b.manuscript.slice(0, 300) + '...',
            })),
          }))
          return
        }

        // PATCH — 标记已上架 / 获取完整书稿
        if (req.method === 'PATCH') {
          const chunks: Buffer[] = []
          for await (const chunk of req as any) chunks.push(chunk)
          const { id, action } = JSON.parse(Buffer.concat(chunks).toString())
          const book = kdpPublishQueue.find(b => b.id === id)
          if (!book) { res.writeHead(404, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify({ error: '书不存在' })); return }

          if (action === 'get_manuscript') {
            res.writeHead(200, { 'Content-Type': 'application/json', ...cors })
            res.end(JSON.stringify({ id: book.id, title: book.title, manuscript: book.manuscript }))
            return
          }
          if (action === 'mark_uploaded') {
            book.status = 'uploaded'
            res.writeHead(200, { 'Content-Type': 'application/json', ...cors })
            res.end(JSON.stringify({ status: 'ok', message: `《${book.title}》已标记为已上架` }))
            return
          }
          res.writeHead(400, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify({ error: '未知 action' })); return
        }

        next()
      })

      server.middlewares.use('/api/publish', async (req: any, res: any, next: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end(); return
        }
        if (req.method !== 'POST') return next()

        const chunks: Buffer[] = []
        for await (const chunk of req as any) chunks.push(chunk)
        const { platform, title, content, images } = JSON.parse(Buffer.concat(chunks).toString())

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })

        if (platform !== 'xiaohongshu') {
          res.end(JSON.stringify({ status: 'pending', message: `「${platform}」平台暂未接入，敬请期待` })); return
        }

        try {
          const { writeFileSync, mkdirSync } = await import('fs')
          const { spawnSync } = await import('child_process')
          const { homedir } = await import('os')
          const home = homedir()

          // 写临时文件
          const tmpDir = '/tmp/xhs_publish'
          mkdirSync(tmpDir, { recursive: true })
          const titleFile = `${tmpDir}/title.txt`
          const contentFile = `${tmpDir}/content.txt`
          writeFileSync(titleFile, title || '', 'utf-8')
          writeFileSync(contentFile, content || '', 'utf-8')

          // 处理图片（网络 URL 需先下载到本地）
          const localImages: string[] = []
          if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
              const img = images[i]
              if (img.startsWith('http')) {
                const imgPath = `${tmpDir}/img_${i}.jpg`
                const imgResp = await fetch(img)
                const imgBuf = await imgResp.arrayBuffer()
                writeFileSync(imgPath, Buffer.from(imgBuf))
                localImages.push(imgPath)
              } else {
                localImages.push(img)
              }
            }
          } else {
            // 没有图片时使用占位空白图
            const blankImg = `${tmpDir}/blank.jpg`
            if (!existsSync(blankImg)) {
              // 1x1 白色 JPEG
              const jpeg1x1 = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=', 'base64')
              writeFileSync(blankImg, jpeg1x1)
            }
            localImages.push(blankImg)
          }

          // 构建命令参数
          const args = [
            'run', 'python', 'scripts/cli.py', 'publish',
            '--title-file', titleFile,
            '--content-file', contentFile,
          ]
          if (images && images.length > 0) {
            for (const img of localImages) {
              args.push('--images', img)
            }
          }

          const result = spawnSync(
            `${home}/.local/bin/uv`,
            args,
            {
              cwd: `${home}/.agents/skills/xiaohongshu-skills`,
              encoding: 'utf-8',
              timeout: 60000,
            }
          )

          if (result.status === 0) {
            res.end(JSON.stringify({ status: 'ok', message: '发布成功', output: result.stdout }))
          } else {
            const errMsg = result.stderr || result.stdout || '未知错误'
            res.end(JSON.stringify({ status: 'error', message: errMsg.slice(0, 300) }))
          }
        } catch (e: any) {
          res.end(JSON.stringify({ status: 'error', message: e.message }))
        }
      })

      // ── /api/generate-media — 豆包图片 / 即梦视频生成 ──────────────────────
      server.middlewares.use('/api/generate-media', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        res.setHeader('Content-Type', 'application/json')

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const { type, prompt, ratio } = JSON.parse(body) as { type: 'image' | 'video'; prompt: string; ratio?: string }

            const akId = process.env.VOLC_ACCESS_KEY_ID
            const akSecret = process.env.VOLC_SECRET_KEY
            if (!akId || !akSecret) {
              res.end(JSON.stringify({ status: 'error', message: '未配置 VOLC_ACCESS_KEY_ID / VOLC_SECRET_KEY' }))
              return
            }

            const { createHmac, createHash } = await import('crypto')
            async function volcSign(
              accessKeyId: string, secretAccessKey: string,
              method: string, path: string, query: string,
              bodyStr: string, host: string, service: string
            ): Promise<Record<string, string>> {
              const now = new Date()
              const datestamp = now.toISOString().slice(0, 10).replace(/-/g, '')
              const amzdate  = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
              const payloadHash = createHash('sha256').update(bodyStr).digest('hex')
              const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-date:${amzdate}\n`
              const signedHeaders = 'content-type;host;x-date'
              const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join('\n')
              const region = 'cn-north-1'
              const credentialScope = `${datestamp}/${region}/${service}/request`
              const stringToSign = ['HMAC-SHA256', amzdate, credentialScope, createHash('sha256').update(canonicalRequest).digest('hex')].join('\n')
              const sign = (key: Buffer | string, msg: string) => createHmac('sha256', key).update(msg).digest()
              const signingKey = sign(sign(sign(sign(secretAccessKey, datestamp), region), service), 'request')
              const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')
              return {
                'Content-Type': 'application/json', 'Host': host, 'X-Date': amzdate,
                'Authorization': `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
              }
            }

            if (type === 'image') {
              const ratioMap: Record<string, { width: number; height: number }> = {
                '1:1': { width: 1024, height: 1024 }, '3:4': { width: 768, height: 1024 },
                '4:3': { width: 1024, height: 768 }, '9:16': { width: 576, height: 1024 }, '16:9': { width: 1024, height: 576 },
              }
              const size = ratioMap[ratio || '3:4']
              const reqBody = JSON.stringify({ req_key: 'seedream_3_0_t2i_to_image', prompt, width: size.width, height: size.height, return_url: true })
              const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
              const resp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers, body: reqBody })
              const data = await resp.json() as any
              if (data?.code === 10000 && data?.data?.image_urls?.[0]) {
                res.end(JSON.stringify({ status: 'ok', url: data.data.image_urls[0] }))
              } else {
                // 降级 Pollinations
                const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size.width}&height=${size.height}&nologo=true&model=flux`
                res.end(JSON.stringify({ status: 'ok', url: fallback, fallback: true, reason: data?.message || JSON.stringify(data) }))
              }
            } else if (type === 'video') {
              const ratioMap: Record<string, string> = { '16:9': '1280x720', '9:16': '720x1280', '1:1': '720x720' }
              const reqBody = JSON.stringify({ req_key: 'jimeng_video_t2v_async', prompt, duration: 5, resolution: ratioMap[ratio || '9:16'] || '720x1280', return_url: true })
              const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
              const resp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers, body: reqBody })
              const data = await resp.json() as any
              if (data?.code === 10000 && data?.data?.task_id) {
                res.end(JSON.stringify({ status: 'ok', task_id: data.data.task_id }))
              } else {
                res.end(JSON.stringify({ status: 'error', message: data?.message || JSON.stringify(data) }))
              }
            } else {
              res.end(JSON.stringify({ status: 'error', message: '不支持的 type' }))
            }
          } catch (e: any) {
            res.end(JSON.stringify({ status: 'error', message: e.message }))
          }
        })
      })

      // ── WebSocket upgrade: OpenAI Realtime API 语音中继 ──────────────────
      server.httpServer?.on('upgrade', (req: any, socket: any, head: any) => {
        if (req.url?.startsWith('/api/realtime')) {
          handleRealtimeUpgrade(req, socket, head)
        }
      })
    },
  }
}
