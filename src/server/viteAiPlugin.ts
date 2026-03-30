import type { Plugin } from 'vite'
import { GoogleGenAI, type Content } from '@google/genai'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { allTools } from './tools/erpTools'
import { executeTool } from './tools/toolExecutor'
import { handleRealtimeUpgrade } from './realtimeRelay'
import { getAgent, AGENTS } from './agents/agentRegistry'
import { adamTools } from './tools/adamTools'
import { executeAdamTool } from './tools/adamExecutor'
import { adamAgent } from './agents/adamOrchestrator'
import { detectIntent, getSystemPrompt } from './agents/orchestrator'

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
      // Load .env so process.env has ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL
      loadDotenv({ path: resolve(process.cwd(), '.env') })

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

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '未配置 GEMINI_API_KEY，请在 .env 文件中设置' }))
          return
        }

        const genAI = new GoogleGenAI({ apiKey })

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

          // Convert messages to Gemini Content format
          const history: Content[] = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }))

          // Build last user message parts (may include images)
          const lastMsg = messages[messages.length - 1]
          const lastParts: any[] = []
          if (images?.length > 0) {
            for (const img of images) {
              lastParts.push({ inlineData: { mimeType: img.mediaType, data: img.data } })
            }
          }
          lastParts.push({ text: lastMsg?.content || '请识别这张单据图片并帮我录入系统。' })

          const chat = genAI.chats.create({
            model: 'gemini-2.0-flash',
            config: {
              systemInstruction: systemPrompt,
              tools: [{ functionDeclarations: allTools }],
            },
            history,
          })

          // Agentic loop — up to 5 iterations
          let currentParts: any[] = lastParts
          for (let i = 0; i < 5; i++) {
            const response = await chat.sendMessage({ message: currentParts })

            // Stream text parts
            const textParts = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.text) ?? []
            for (const part of textParts) {
              if (part.text) send({ type: 'text', text: part.text })
            }

            // Check for function calls
            const fnParts = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall) ?? []
            if (fnParts.length === 0) break

            // Execute tool calls
            const toolResultParts: any[] = []
            for (const part of fnParts) {
              const fc = part.functionCall
              const callId = fc.id || fc.name
              send({ type: 'tool_start', id: callId, name: fc.name, input: fc.args })
              const result = await executeTool(fc.name, fc.args as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: callId, name: fc.name, result })
              toolResultParts.push({
                functionResponse: { name: fc.name, response: { result } },
              })
            }

            currentParts = toolResultParts
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

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 GEMINI_API_KEY' })); return }

        try {
          const genAI = new GoogleGenAI({ apiKey })
          const result = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: conversationSummary }] }],
            config: {
              systemInstruction: `你是偏好提取引擎。分析以下ERP对话，提取用户的使用偏好。
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
            },
          })

          const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
          const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
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
        const { messages, agentId, brandContext } = JSON.parse(Buffer.concat(chunks).toString())
        const erpToken = ((req as any).headers['x-erp-token'] as string) || ''

        const agent = getAgent(agentId)
        if (!agent) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: `Unknown agent: ${agentId}` })); return }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 GEMINI_API_KEY' })); return }

        const genAI = new GoogleGenAI({ apiKey })

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const systemInstruction = brandContext
            ? `${agent.systemPrompt}\n\n---\n【当前品牌信息】\n${brandContext}`
            : agent.systemPrompt

          const history: Content[] = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }))

          const chat = genAI.chats.create({
            model: 'gemini-2.0-flash',
            config: { systemInstruction, tools: [{ functionDeclarations: allTools }] },
            history,
          })

          const lastMsg = messages[messages.length - 1]
          let currentParts: any[] = [{ text: lastMsg?.content || '' }]

          for (let i = 0; i < 5; i++) {
            const response = await chat.sendMessage({ message: currentParts })
            const textParts = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.text) ?? []
            for (const part of textParts) {
              if (part.text) send({ type: 'text', text: part.text })
            }
            const fnParts = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall) ?? []
            if (fnParts.length === 0) break
            const toolResultParts: any[] = []
            for (const part of fnParts) {
              const fc = part.functionCall
              const callId = fc.id || fc.name
              send({ type: 'tool_start', id: callId, name: fc.name, input: fc.args })
              // render_video / render_image take 1-3 minutes — send progress hint
              if (fc.name === 'render_video') {
                send({ type: 'text', text: '\n⏳ 视频渲染中，通常需要 1~3 分钟，请稍候...\n' })
              } else if (fc.name === 'render_image') {
                send({ type: 'text', text: '\n⏳ 图片渲染中，请稍候...\n' })
              }
              const result = await executeTool(fc.name, fc.args as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: callId, name: fc.name, result })
              toolResultParts.push({ functionResponse: { name: fc.name, response: { result } } })
            }
            currentParts = toolResultParts
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

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 GEMINI_API_KEY' })); return }

        const genAI = new GoogleGenAI({ apiKey })

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const captain = AGENTS.captain

          const captainHistory: Content[] = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }))

          const captainChat = genAI.chats.create({
            model: 'gemini-2.0-flash',
            config: { systemInstruction: captain.systemPrompt, tools: [{ functionDeclarations: allTools }] },
            history: captainHistory,
          })

          // Phase 1: Captain 分析任务
          send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '' })
          let captainResponse = ''
          const lastMsg = messages[messages.length - 1]
          let currentParts: any[] = [{ text: lastMsg?.content || '' }]

          for (let i = 0; i < 3; i++) {
            const response = await captainChat.sendMessage({ message: currentParts })
            const textParts = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.text) ?? []
            for (const part of textParts) {
              if (part.text) {
                captainResponse += part.text
                send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: part.text })
              }
            }
            const fnParts = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall) ?? []
            if (fnParts.length === 0) break
            const toolResultParts: any[] = []
            for (const part of fnParts) {
              const fc = part.functionCall
              const callId = fc.id || fc.name
              send({ type: 'tool_start', id: callId, name: fc.name, input: fc.args })
              const result = await executeTool(fc.name, fc.args as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: callId, name: fc.name, result })
              toolResultParts.push({ functionResponse: { name: fc.name, response: { result } } })
            }
            currentParts = toolResultParts
          }

          // Phase 2: 解析 @@DISPATCH:agentId:任务@@ 并依次调用各专项Agent
          const dispatchRe = /@@DISPATCH:(\w+):([^@]+)@@/g
          const dispatches: Array<{ agentId: string; task: string }> = []
          let m
          while ((m = dispatchRe.exec(captainResponse)) !== null) {
            dispatches.push({ agentId: m[1], task: m[2].trim() })
          }

          const agentOutputs: Array<{ agentId: string; agentName: string; output: string }> = []

          for (const dispatch of dispatches) {
            const subAgent = getAgent(dispatch.agentId)
            if (!subAgent) continue

            send({ type: 'agent_start', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, task: dispatch.task })
            send({ type: 'agent_ack', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, text: `收到，开始执行。` })

            let agentOutput = ''
            const taskPrompt = `Captain指令：${dispatch.task}\n\n请直接执行并交付成果。`

            const subChat = genAI.chats.create({
              model: 'gemini-2.0-flash',
              config: { systemInstruction: subAgent.systemPrompt, tools: [{ functionDeclarations: allTools }] },
            })
            let subParts: any[] = [{ text: taskPrompt }]

            for (let i = 0; i < 3; i++) {
              const subResp = await subChat.sendMessage({ message: subParts })
              const subTextParts = subResp.candidates?.[0]?.content?.parts?.filter((p: any) => p.text) ?? []
              for (const part of subTextParts) {
                if (part.text) {
                  agentOutput += part.text
                  send({ type: 'agent_thinking', agentId: subAgent.id, agentName: subAgent.name, text: part.text })
                }
              }
              const subFnParts = subResp.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall) ?? []
              if (subFnParts.length === 0) break
              const subToolResultParts: any[] = []
              for (const part of subFnParts) {
                const fc = part.functionCall
                const callId = fc.id || fc.name
                send({ type: 'tool_start', id: callId, name: fc.name, input: fc.args })
                const result = await executeTool(fc.name, fc.args as Record<string, any>, erpToken)
                send({ type: 'tool_result', id: callId, name: fc.name, result })
                subToolResultParts.push({ functionResponse: { name: fc.name, response: { result } } })
              }
              subParts = subToolResultParts
            }
            send({ type: 'agent_done', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, output: agentOutput })
            agentOutputs.push({ agentId: subAgent.id, agentName: subAgent.name, output: agentOutput })
          }

          // Phase 3: Captain 汇总
          if (agentOutputs.length > 0) {
            const summaryContext = agentOutputs.map(a => `【${a.agentName}提交】\n${a.output}`).join('\n\n---\n\n')
            const summaryPrompt = `原始指令：${messages[messages.length - 1]?.content}\n\n各团队成员已完成任务，汇总如下：\n\n${summaryContext}\n\n请以Captain身份，简洁有力地综合以上成果，直接呈现给决策者。不要逐个复述，给出整体判断和可执行建议。`
            send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '\n\n---\n**📋 Captain 综合汇报**\n\n' })

            const summaryChat = genAI.chats.create({
              model: 'gemini-2.0-flash',
              config: { systemInstruction: AGENTS.captain.systemPrompt },
            })
            const summaryResp = await summaryChat.sendMessage({ message: summaryPrompt })
            const summaryTextParts = summaryResp.candidates?.[0]?.content?.parts?.filter((p: any) => p.text) ?? []
            for (const part of summaryTextParts) {
              if (part.text) send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: part.text })
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

        const apiKey = process.env.ANTHROPIC_API_KEY
        const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY' })); return }

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const systemPrompt = adamAgent.buildSystemPrompt(adamState || {})

          // 构建 Anthropic tools 格式
          const anthropicTools = adamTools.map((t: any) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters || { type: 'object', properties: {} },
          }))

          // 构建消息历史：最后一条 user 消息如有图片则插入 vision 内容块
          const anthropicMessages = messages.map((m: any, idx: number) => {
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
          let currentMessages = [...anthropicMessages]
          for (let i = 0; i < 5; i++) {
            const response = await fetch(`${baseURL}/v1/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                system: systemPrompt,
                tools: anthropicTools,
                messages: currentMessages,
              }),
            })

            if (!response.ok) {
              const errText = await response.text()
              send({ type: 'error', error: `Anthropic API 错误: ${response.status} ${errText}` })
              break
            }

            const data = await response.json() as any
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

      // ── WebSocket upgrade: OpenAI Realtime API 语音中继 ──────────────────
      server.httpServer?.on('upgrade', (req: any, socket: any, head: any) => {
        if (req.url?.startsWith('/api/realtime')) {
          handleRealtimeUpgrade(req, socket, head)
        }
      })
    },
  }
}
