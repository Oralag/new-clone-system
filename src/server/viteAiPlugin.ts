import type { Plugin } from 'vite'
import Anthropic from '@anthropic-ai/sdk'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { allTools } from './tools/erpTools'
import { executeTool } from './tools/toolExecutor'
import { detectIntent, getSystemPrompt } from './agents/orchestrator'
import { getAgent, AGENTS } from './agents/agentRegistry'

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
          const body = await readBodyJson(req)
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
          // Not a local user — forward to railway proxy (vite proxy handles it)
          return next()
        } catch {
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
        const { messages, images } = JSON.parse(Buffer.concat(body).toString())
        const erpToken = ((req as any).headers['x-erp-token'] as string) || ''

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY，请在 .env 文件中设置' }))
          return
        }

        const clientOptions: any = { apiKey }
        if (process.env.ANTHROPIC_BASE_URL) clientOptions.baseURL = process.env.ANTHROPIC_BASE_URL
        const client = new Anthropic(clientOptions)

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        })

        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          // Detect intent from last user message
          const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
          const intent = detectIntent(lastUserMsg?.content || '')
          const systemPrompt = getSystemPrompt(intent)

          // Build API messages — inject images into last user message if present
          const apiMessages: Anthropic.MessageParam[] = messages.map((m: any, idx: number) => {
            const isLastUser = m.role === 'user' && idx === messages.length - 1
            if (isLastUser && images?.length > 0) {
              const content: Anthropic.ContentBlockParam[] = images.map((img: { data: string; mediaType: string }) => ({
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: img.data,
                },
              }))
              content.push({ type: 'text', text: m.content || '请识别这张单据图片并帮我录入系统。' })
              return { role: 'user' as const, content }
            }
            return { role: m.role as 'user' | 'assistant', content: m.content }
          })

          // Agentic loop — up to 5 iterations
          let loopMessages: Anthropic.MessageParam[] = [...apiMessages]
          for (let i = 0; i < 5; i++) {
            const response = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: systemPrompt,
              tools: allTools,
              messages: loopMessages,
            })

            // Stream text blocks
            for (const block of response.content) {
              if (block.type === 'text' && block.text) {
                send({ type: 'text', text: block.text })
              }
            }

            if (response.stop_reason !== 'tool_use') break

            // Execute tool calls
            const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
            const toolResults: Anthropic.ToolResultBlockParam[] = []

            for (const toolUse of toolUseBlocks) {
              send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
              const result = await executeTool(toolUse.name, toolUse.input as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }

            loopMessages = [
              ...loopMessages,
              { role: 'assistant', content: response.content },
              { role: 'user', content: toolResults },
            ]
          }

          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          send({ type: 'error', error: e.message })
        } finally {
          res.end()
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

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY' })); return }

        const clientOptions: any = { apiKey }
        if (process.env.ANTHROPIC_BASE_URL) clientOptions.baseURL = process.env.ANTHROPIC_BASE_URL
        const client = new Anthropic(clientOptions)

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const apiMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
            role: m.role as 'user' | 'assistant', content: m.content
          }))
          let loopMessages = [...apiMessages]
          for (let i = 0; i < 5; i++) {
            const response = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: brandContext
                ? `${agent.systemPrompt}\n\n---\n【当前品牌信息】\n${brandContext}`
                : agent.systemPrompt,
              tools: allTools,
              messages: loopMessages,
            })
            for (const block of response.content) {
              if (block.type === 'text' && block.text) send({ type: 'text', text: block.text })
            }
            if (response.stop_reason !== 'tool_use') break
            const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
            const toolResults: Anthropic.ToolResultBlockParam[] = []
            for (const toolUse of toolUseBlocks) {
              send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
              const result = await executeTool(toolUse.name, toolUse.input as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }
            loopMessages = [...loopMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }]
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

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY' })); return }

        const clientOptions: any = { apiKey }
        if (process.env.ANTHROPIC_BASE_URL) clientOptions.baseURL = process.env.ANTHROPIC_BASE_URL
        const client = new Anthropic(clientOptions)

        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' })
        const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

        try {
          const captain = AGENTS.captain
          const apiMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
            role: m.role as 'user' | 'assistant', content: m.content
          }))

          // Phase 1: Captain 分析任务，决定调用哪些Agent
          send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '' })
          let loopMessages = [...apiMessages]
          let captainResponse = ''
          for (let i = 0; i < 3; i++) {
            const response = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 2048,
              system: captain.systemPrompt,
              tools: allTools,
              messages: loopMessages,
            })
            for (const block of response.content) {
              if (block.type === 'text' && block.text) {
                captainResponse += block.text
                send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: block.text })
              }
            }
            if (response.stop_reason !== 'tool_use') break
            // Captain调用ERP工具
            const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
            const toolResults: Anthropic.ToolResultBlockParam[] = []
            for (const toolUse of toolUseBlocks) {
              send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
              const result = await executeTool(toolUse.name, toolUse.input as Record<string, any>, erpToken)
              send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }
            loopMessages = [...loopMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }]
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

            // 员工接令回报
            send({ type: 'agent_start', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, task: dispatch.task })
            send({ type: 'agent_ack', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, text: `收到，开始执行。` })

            let agentOutput = ''
            const taskPrompt = `Captain指令：${dispatch.task}\n\n请直接执行并交付成果。`
            const subMessages: Anthropic.MessageParam[] = [{ role: 'user', content: taskPrompt }]
            let subLoop = [...subMessages]
            for (let i = 0; i < 3; i++) {
              const subResp = await client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 2048,
                system: subAgent.systemPrompt,
                tools: allTools,
                messages: subLoop,
              })
              for (const block of subResp.content) {
                if (block.type === 'text' && block.text) {
                  agentOutput += block.text
                  send({ type: 'agent_thinking', agentId: subAgent.id, agentName: subAgent.name, text: block.text })
                }
              }
              if (subResp.stop_reason !== 'tool_use') break
              const subToolUseBlocks = subResp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
              const subToolResults: Anthropic.ToolResultBlockParam[] = []
              for (const toolUse of subToolUseBlocks) {
                send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
                const result = await executeTool(toolUse.name, toolUse.input as Record<string, any>, erpToken)
                send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
                subToolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
              }
              subLoop = [...subLoop, { role: 'assistant', content: subResp.content }, { role: 'user', content: subToolResults }]
            }
            // 员工完成汇报
            send({ type: 'agent_done', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, output: agentOutput })
            agentOutputs.push({ agentId: subAgent.id, agentName: subAgent.name, output: agentOutput })
          }

          // Phase 3: Captain 汇总所有员工产出
          if (agentOutputs.length > 0) {
            const summaryContext = agentOutputs.map(a => `【${a.agentName}提交】\n${a.output}`).join('\n\n---\n\n')
            const summaryPrompt = `原始指令：${messages[messages.length - 1]?.content}\n\n各团队成员已完成任务，汇总如下：\n\n${summaryContext}\n\n请以Captain身份，简洁有力地综合以上成果，直接呈现给决策者。不要逐个复述，给出整体判断和可执行建议。`
            send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '\n\n---\n**📋 Captain 综合汇报**\n\n' })
            const summaryResp = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 2048,
              system: AGENTS.captain.systemPrompt,
              messages: [{ role: 'user', content: summaryPrompt }],
            })
            for (const block of summaryResp.content) {
              if (block.type === 'text' && block.text) {
                send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: block.text })
              }
            }
          }

          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          send({ type: 'error', error: e.message })
        } finally {
          res.end()
        }
      })
    },
  }
}
