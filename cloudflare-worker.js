export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    // AI chat endpoint
    if (url.pathname === '/api/ai-chat') {
      return handleAIChat(request, env)
    }

    // Proxy all other requests to backend
    const targetUrl = 'https://saas.mzth.cn' + url.pathname + url.search
    const headers = new Headers(request.headers)
    headers.set('host', 'saas.mzth.cn')
    headers.delete('origin')
    headers.delete('referer')

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    })

    const response = await fetch(proxyRequest)
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    })
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}

async function handleAIChat(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' })}\n\ndata: [DONE]\n\n`,
      { headers: { 'Content-Type': 'text/event-stream', ...corsHeaders() } }
    )
  }

  const { messages, systemPrompt } = await request.json()

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'messages-2023-12-15',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  })

  // Stream SSE back to client
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  ;(async () => {
    const reader = anthropicRes.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`))
            }
          } catch {}
        }
      }
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'))
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...corsHeaders(),
    },
  })
}
