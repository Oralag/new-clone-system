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

    // ── Self-hosted register endpoint ──────────────────────────────────────
    if (url.pathname === '/adminapi/login/register' && request.method === 'POST') {
      return handleRegister(request, env)
    }

    // ── Self-hosted login: check local users first ──────────────────────────
    if (url.pathname === '/adminapi/login/account' && request.method === 'POST') {
      return handleLogin(request, env)
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

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function makeToken(account) {
  const payload = btoa(JSON.stringify({ account, t: Date.now() }))
  return `local_${payload}`
}

async function handleRegister(request, env) {
  let body
  try { body = await request.json() } catch { return jsonRes({ code: 0, show: 1, message: '请求格式错误', data: [] }) }

  const { company_name, mobile, password } = body
  if (!company_name) return jsonRes({ code: 0, show: 1, message: '请输入公司名称', data: [] })
  if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) return jsonRes({ code: 0, show: 1, message: '请输入有效手机号', data: [] })
  if (!password || password.length < 6) return jsonRes({ code: 0, show: 1, message: '密码至少6位', data: [] })

  // Use KV if available, else in-memory (dev preview)
  const kv = env.USERS_KV
  if (kv) {
    const existing = await kv.get(`user:${mobile}`)
    if (existing) return jsonRes({ code: 0, show: 1, message: '该手机号已注册', data: [] })
    const user = { company_name, mobile, password, created_at: Date.now(), admin_id: Date.now() }
    await kv.put(`user:${mobile}`, JSON.stringify(user))
  }

  return jsonRes({ code: 1, show: 0, message: '注册成功', data: {} })
}

async function handleLogin(request, env) {
  let body
  try { body = await request.json() } catch { body = {} }

  const { account, password } = body
  const kv = env.USERS_KV

  // Check local registered users
  if (kv && account && password) {
    const raw = await kv.get(`user:${account}`)
    if (raw) {
      const user = JSON.parse(raw)
      if (user.password === password) {
        const token = makeToken(account)
        await kv.put(`token:${token}`, JSON.stringify({ account, company_name: user.company_name, admin_id: user.admin_id }), { expirationTtl: 2592000 })
        return jsonRes({
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
    }
  }

  // Fall through to saas proxy login
  const targetUrl = 'https://saas.mzth.cn/adminapi/login/account'
  const headers = new Headers({ 'Content-Type': 'application/json', 'host': 'saas.mzth.cn' })
  const response = await fetch(new Request(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }))
  const data = await response.json()
  const newHeaders = new Headers({ 'Content-Type': 'application/json' })
  Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))
  return new Response(JSON.stringify(data), { status: response.status, headers: newHeaders })
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
