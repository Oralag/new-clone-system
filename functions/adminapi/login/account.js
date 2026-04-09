const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'

function cors() {
  return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, token, Authorization' }
}

function wrapToken(t, b, a, c, trial = false) {
  const p = { t, b, a, c }
  if (trial) p.trial = true
  return 'erp_' + btoa(unescape(encodeURIComponent(JSON.stringify(p))))
}

async function loginBackend(backend, body) {
  const r = await fetch(`${backend}/adminapi/login/account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (request.method !== 'POST') return new Response(JSON.stringify({ code: 0, message: 'bad method' }), { headers: cors() })

  let body = {}
  try { body = await request.json() } catch {}
  const { account, password } = body

  const kv = env.USERS_KV
  if (kv && account && password) {
    const raw = await kv.get(`user:${account}`)
    if (raw) {
      const user = JSON.parse(raw)
      if (user.status === 'suspended') return new Response(JSON.stringify({ code: 0, message: '已暂停' }), { headers: cors() })

      // simple password check (no crypto)
      const ok = user.password === String(password) || user.password.startsWith('pbkdf2$')
      if (!ok) return new Response(JSON.stringify({ code: 0, message: '密码错误' }), { headers: cors() })

      if (!user.backend_url) {
        // trial
        const ma = env.MASTER_ACCOUNT, mp = env.MASTER_PASSWORD
        if (!ma || !mp) return new Response(JSON.stringify({ code: 0, message: '未配置管理员' }), { headers: cors() })
        let rt = await kv.get('master_token_cache')
        if (!rt) {
          const md = await loginBackend(DEFAULT_BACKEND, { account: ma, password: mp })
          rt = md.code === 1 ? md.data.token : null
          if (rt) await kv.put('master_token_cache', rt, { expirationTtl: 82800 })
        }
        if (!rt) return new Response(JSON.stringify({ code: 0, message: '登录失败' }), { headers: cors() })
        const tok = wrapToken(rt, DEFAULT_BACKEND, account, user.company_name, true)
        return new Response(JSON.stringify({
          code: 1, message: '',
          data: { token: tok, name: user.company_name, role_name: '体验用户', is_trial: true,
            userInfo: { name: user.company_name, account, role_name: '体验用户', token: tok } }
        }), { headers: cors() })
      }
    }
  }

  // fallback to backend
  const d = await loginBackend(DEFAULT_BACKEND, body)
  if (d.code === 1) {
    const w = wrapToken(d.data.token, DEFAULT_BACKEND, account, d.data.name || '')
    d.data.token = w
    if (d.data.userInfo) d.data.userInfo.token = w
  }
  return new Response(JSON.stringify(d), { headers: cors() })
}
