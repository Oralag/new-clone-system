import type { Plugin } from 'vite'
import Anthropic from '@anthropic-ai/sdk'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { allTools } from './tools/erpTools'
import { executeTool } from './tools/toolExecutor'
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
    },
  }
}
