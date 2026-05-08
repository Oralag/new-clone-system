import OpenAI from 'openai'
import type { IncomingMessage, ServerResponse } from 'node:http'

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
  baseURL: (process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '') + '/v1',
})

export async function handleAIChat(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('Method Not Allowed')
    return
  }

  const body: Buffer[] = []
  for await (const chunk of req) {
    body.push(chunk)
  }
  const { messages, systemPrompt } = JSON.parse(Buffer.concat(body).toString())

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  try {
    const stream = await client.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      stream: true,
    })

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
  } catch (e: any) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`)
  } finally {
    res.end()
  }
}
