// Cloudflare Pages Function — /adminapi/[[path]]
// Handles KV-based register/login and proxies all other requests to backend

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'

// Paths that trial users MUST be able to call (auth / user info)
const TRIAL_PASSTHROUGH = [
  '/adminapi/login/account',
  '/adminapi/login/register',
  '/adminapi/auth/',
  '/adminapi/login/info',
  '/adminapi/setting/company',
]

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}

function jsonRes(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

// Decode wrapped token → { realToken, backend, account, trial }
function decodeToken(wrapped) {
  try {
    if (!wrapped || !wrapped.startsWith('erp_')) return null
    const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
    const payload = JSON.parse(json)
    return {
      realToken: payload.t || null,
      backend: payload.b || DEFAULT_BACKEND,
      account: payload.a || '',
      company: payload.c || '',
      trial: !!payload.trial,
    }
  } catch {
    return null
  }
}

function wrapToken(realToken, backend, account, company, trial = false) {
  const payload = { t: realToken, b: backend, a: account, c: company }
  if (trial) payload.trial = true
  return 'erp_' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

function isTrialPassthrough(pathname) {
  return TRIAL_PASSTHROUGH.some(p => pathname.startsWith(p))
}

// ── PBKDF2 password utils (Web Crypto) ──────────────────────────────────────
const PBKDF2_ITERATIONS = 120000
const encoder = new TextEncoder()

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return bytes
}
async function deriveHash(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(String(password)), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' }, key, 256)
  return toHex(bits)
}
async function hashPassword(password) {
  const saltBytes = new Uint8Array(16)
  crypto.getRandomValues(saltBytes)
  const saltHex = toHex(saltBytes)
  const hashHex = await deriveHash(password, saltHex, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`
}
function isHashed(p) { return String(p || '').startsWith('pbkdf2$') }
async function verifyPassword(password, stored) {
  if (!stored) return false
  if (!isHashed(stored)) return stored === String(password)
  const [, iterStr, saltHex, hashHex] = stored.split('$')
  const iterations = parseInt(iterStr, 10)
  if (!iterations || !saltHex || !hashHex) return false
  return await deriveHash(password, saltHex, iterations) === hashHex
}

// ── Login backend helper ─────────────────────────────────────────────────────
async function loginBackend(backend, body) {
  const resp = await fetch(`${backend}/adminapi/login/account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return resp.json()
}

// ── /adminapi/login/register ─────────────────────────────────────────────────
async function handleRegister(body, env) {
  const { company_name, mobile, password } = body || {}
  if (!company_name?.trim()) return jsonRes({ code: 0, show: 1, message: '请输入公司名称', data: [] })
  if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) return jsonRes({ code: 0, show: 1, message: '请输入有效的手机号', data: [] })
  if (!password || password.length < 6) return jsonRes({ code: 0, show: 1, message: '密码至少6位', data: [] })

  const kv = env.USERS_KV
  if (!kv) return jsonRes({ code: 0, show: 1, message: '注册服务未配置，请联系管理员', data: [] }, 500)

  const existing = await kv.get(`user:${mobile}`)
  if (existing) return jsonRes({ code: 0, show: 1, message: '该手机号已注册，请直接登录', data: [] })

  const user = {
    company_name: company_name.trim(),
    mobile,
    password: await hashPassword(password),
    admin_id: Date.now(),
    created_at: new Date().toISOString(),
  }
  await kv.put(`user:${mobile}`, JSON.stringify(user))
  return jsonRes({ code: 1, show: 0, message: '注册成功', data: {} })
}

// ── /adminapi/login/account ──────────────────────────────────────────────────
async function handleLogin(body, env) {
  const { account, password } = body || {}
  if (!account || !password) return jsonRes({ code: 0, show: 1, message: '账号和密码不能为空', data: [] })

  const kv = env.USERS_KV
  if (kv) {
    const raw = await kv.get(`user:${account}`)
    if (raw) {
      const user = JSON.parse(raw)

      if (user.status === 'suspended') {
        return jsonRes({ code: 0, show: 1, message: '账号已被暂停，请联系管理员', data: [] })
      }

      const passwordOk = await verifyPassword(password, user.password)
      if (!passwordOk) return jsonRes({ code: 0, show: 1, message: '密码错误', data: [] })

      // upgrade to hashed if stored as plaintext
      if (!isHashed(user.password)) {
        user.password = await hashPassword(password)
        user.updated_at = new Date().toISOString()
        await kv.put(`user:${account}`, JSON.stringify(user))
      }

      const backend = user.backend_url || DEFAULT_BACKEND
      const isPaid = !!user.backend_url

      if (isPaid) {
        try {
          const data = await loginBackend(backend, body)
          if (data.code === 1) {
            const wrapped = wrapToken(data.data.token, backend, account, user.company_name)
            data.data.token = wrapped
            data.data.name = user.company_name
            if (data.data.userInfo) { data.data.userInfo.token = wrapped; data.data.userInfo.name = user.company_name }
            data.data.is_paid = true
            return jsonRes(data)
          }
        } catch {}
        return jsonRes({ code: 0, show: 1, message: '专属后端暂时无法连接，请稍后重试', data: [] })
      }

      // Trial user: use cached master token
      const masterAccount = env.MASTER_ACCOUNT
      const masterPassword = env.MASTER_PASSWORD
      if (!masterAccount || !masterPassword) {
        return jsonRes({ code: 0, show: 1, message: '试用账号未配置管理员凭证，请联系管理员处理', data: [] })
      }
      const CACHE_KEY = 'master_token_cache'
      let realToken = null
      const cached = await kv.get(CACHE_KEY)
      if (cached) {
        realToken = cached
      } else {
        const masterData = await loginBackend(DEFAULT_BACKEND, { account: masterAccount, password: masterPassword })
        realToken = masterData.code === 1 ? masterData.data.token : null
        if (realToken) await kv.put(CACHE_KEY, realToken, { expirationTtl: 82800 })
      }
      if (!realToken) return jsonRes({ code: 0, show: 1, message: '登录失败，请重试', data: [] })

      const trialToken = wrapToken(realToken, DEFAULT_BACKEND, account, user.company_name, true)
      return jsonRes({
        code: 1, show: 0, message: '',
        data: {
          token: trialToken,
          name: user.company_name,
          avatar: '',
          role_name: '体验用户',
          is_paid: false,
          is_trial: true,
          userInfo: { name: user.company_name, account, role_name: '体验用户', token: trialToken },
        },
      })
    }
  }

  // Not in KV — proxy to default backend (existing admin accounts)
  const data = await loginBackend(DEFAULT_BACKEND, body)
  if (data.code === 1) {
    const wrapped = wrapToken(data.data.token, DEFAULT_BACKEND, account, data.data.name || '')
    data.data.token = wrapped
    if (data.data.userInfo) data.data.userInfo.token = wrapped
  }
  return jsonRes(data)
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const pathname = url.pathname

  // Handle register/login directly here (not proxied)
  if (request.method === 'POST' && pathname === '/adminapi/login/register') {
    let body
    try { body = await request.json() } catch { body = {} }
    return handleRegister(body, env)
  }

  if (request.method === 'POST' && pathname === '/adminapi/login/account') {
    let body
    try { body = await request.json() } catch { body = {} }
    return handleLogin(body, env)
  }

  // All other requests: decode token and proxy to correct backend
  const wrappedToken = request.headers.get('token') || ''
  const decoded = decodeToken(wrappedToken)

  if (decoded?.trial && !isTrialPassthrough(pathname)) {
    return jsonRes({
      code: 0,
      show: 1,
      message: '体验版暂不支持该功能，请升级正式版后使用',
      data: [],
    })
  }

  const backend = decoded?.backend || DEFAULT_BACKEND
  const realToken = decoded?.realToken || (decoded ? null : wrappedToken)

  const targetUrl = backend + pathname + url.search
  const headers = new Headers(request.headers)
  headers.set('host', new URL(backend).host)
  if (realToken) headers.set('token', realToken)
  else headers.delete('token')
  headers.delete('origin')
  headers.delete('referer')
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ipcountry')
  headers.delete('cf-ray')
  headers.delete('cf-visitor')
  headers.delete('x-forwarded-for')
  headers.delete('x-forwarded-proto')

  try {
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    })
    const response = await fetch(proxyRequest)
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))
    return new Response(response.body, { status: response.status, headers: newHeaders })
  } catch {
    return new Response(JSON.stringify({ code: 0, show: 0, message: 'Proxy error', data: [] }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
