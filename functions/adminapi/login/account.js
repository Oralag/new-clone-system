// Cloudflare Pages Function — /adminapi/login/account
// For KV-registered users: verify password, check backend_url, proxy to correct backend
// For unknown users: proxy directly to default railway

const DEFAULT_BACKEND = 'https://erp-server-production-b1b6.up.railway.app'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

// Paid user token — carries real Railway token + backend URL
function wrapToken(realToken, backend, account, company) {
  const payload = { t: realToken, b: backend, a: account, c: company }
  return 'erp_' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

// Trial user token — NO real token, sandbox flag set
// The proxy ([[path]].js) detects trial:true and returns empty data
function makeTrialToken(account, company) {
  const payload = { b: DEFAULT_BACKEND, a: account, c: company, trial: true }
  return 'erp_' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

async function loginBackend(backend, body) {
  const resp = await fetch(`${backend}/adminapi/login/account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return resp.json()
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method !== 'POST') {
    return jsonRes({ code: 0, show: 1, message: '请求方式错误', data: [] }, 405)
  }

  let body
  try { body = await request.json() } catch { body = {} }

  const { account, password } = body
  const kv = env.USERS_KV

  // ── KV registered user ────────────────────────────────────────────────────
  if (kv && account && password) {
    const raw = await kv.get(`user:${account}`)
    if (raw) {
      const user = JSON.parse(raw)

      // Check for suspended status
      if (user.status === 'suspended') {
        return jsonRes({ code: 0, show: 1, message: '账号已被暂停，请联系管理员', data: [] })
      }

      if (user.password !== password) {
        return jsonRes({ code: 0, show: 1, message: '密码错误', data: [] })
      }

      const backend = user.backend_url || DEFAULT_BACKEND
      const isPaid = !!user.backend_url

      // Paid user: try logging into their dedicated backend
      if (isPaid) {
        try {
          const data = await loginBackend(backend, body)
          if (data.code === 1) {
            const realToken = data.data.token
            const wrappedToken = wrapToken(realToken, backend, account, user.company_name)
            data.data.token = wrappedToken
            data.data.name = user.company_name
            if (data.data.userInfo) {
              data.data.userInfo.token = wrappedToken
              data.data.userInfo.name = user.company_name
            }
            data.data.is_paid = true
            return new Response(JSON.stringify(data), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders() },
            })
          }
        } catch {}
        return jsonRes({ code: 0, show: 1, message: '专属后端暂时无法连接，请稍后重试', data: [] })
      }

      // Trial user: issue a sandboxed token with no real Railway access
      // The proxy will intercept all data API calls and return empty results
      const trialToken = makeTrialToken(account, user.company_name)
      return jsonRes({
        code: 1, show: 0, message: '',
        data: {
          token: trialToken,
          name: user.company_name,
          avatar: '',
          role_name: '体验用户',
          is_paid: false,
          is_trial: true,
          userInfo: {
            id: user.admin_id,
            admin_id: user.admin_id,
            name: user.company_name,
            account,
            role_name: '体验用户',
            token: trialToken,
          },
        }
      })
    }
  }

  // ── Not in KV — proxy to default backend (existing accounts) ─────────────
  try {
    const data = await loginBackend(DEFAULT_BACKEND, body)
    if (data.code === 1) {
      const wrapped = wrapToken(data.data.token, DEFAULT_BACKEND, account, data.data.name)
      data.data.token = wrapped
      if (data.data.userInfo) data.data.userInfo.token = wrapped
    }
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch {
    return jsonRes({ code: 0, show: 1, message: '服务器错误，请重试', data: [] }, 500)
  }
}
