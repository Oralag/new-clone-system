import type { Plugin } from 'vite'
import Anthropic from '@anthropic-ai/sdk'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'path'

export function aiChatPlugin(): Plugin {
  return {
    name: 'ai-chat-plugin',
    configureServer(server) {
      // Load .env so process.env has ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL
      loadDotenv({ path: resolve(process.cwd(), '.env') })
      server.middlewares.use('/api/ai-chat', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          })
          res.end()
          return
        }
        if (req.method !== 'POST') return next()

        const body: Buffer[] = []
        for await (const chunk of req as any) body.push(chunk)
        const { messages, systemPrompt, images } = JSON.parse(Buffer.concat(body).toString())

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY，请在 .env 文件中设置' }))
          return
        }

        const clientOptions: any = { apiKey }
        if (process.env.ANTHROPIC_BASE_URL) {
          clientOptions.baseURL = process.env.ANTHROPIC_BASE_URL
        }
        const client = new Anthropic(clientOptions)

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        try {
          // Build the messages array — inject images into the last user message if present
          const apiMessages: Anthropic.MessageParam[] = messages.map((m: any, idx: number) => {
            const isLastUser = m.role === 'user' && idx === messages.length - 1
            if (isLastUser && images && images.length > 0) {
              const content: Anthropic.ContentBlockParam[] = images.map((img: { data: string; mediaType: string }) => ({
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: img.data,
                },
              }))
              content.push({ type: 'text', text: m.content || '请识别这张单据图片，提取所有关键信息并帮我录入系统。' })
              return { role: 'user' as const, content }
            }
            return { role: m.role as 'user' | 'assistant', content: m.content }
          })

          const stream = await client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: systemPrompt,
            messages: apiMessages,
          })

          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            }
          }
          res.write('data: [DONE]\n\n')
        } catch (e: any) {
          res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`)
        } finally {
          res.end()
        }
      })
    },
  }
}
