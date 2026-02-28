import Anthropic from '@anthropic-ai/sdk'
import type { IncomingMessage, ServerResponse } from 'node:http'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
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
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
  } catch (e: any) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`)
  } finally {
    res.end()
  }
}
