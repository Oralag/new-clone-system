// Cloudflare Pages Function — /adminapi/login/account
// v2 — trial isolation: each trial user gets their own isolated backend account

import { verifyPassword } from '../../utils/password.js'

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'
const TRIAL_BACKEND = 'https://erp-trial.onrender.com'
const ADMIN_ACCOUNT = '17747344571'

function cors() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}

function respond(data) {
  return new Response(JSON.stringify(data), { headers: cors() })
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

// Try to log a trial user into their own isolated backend account.
// Returns the backend real token on success, null on failure.
async function tryGetOwnToken(backend, account, password, companyName) {
  try {
    const data = await loginBackend(backend, { account, password })
    if (data.code === 1) return data.data.token
  } catch {}
  // Account doesn't exist on backend yet — create it, then retry once
  try {
    await fetch(`${backend}/adminapi/login/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: companyName, account, password }),
    })
    const data2 = await loginBackend(backend, { account, password })
    if (data2.code === 1) return data2.data.token
  } catch {}
  return null
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (request.method !== 'POST') return respond({ code: 0, message: 'bad method' })

  let body = {}
  try { body = await request.json() } catch {}
  const { account, password } = body

  if (!account || !password) return respond({ code: 0, message: '账号和密码不能为空' })

  const kv = env.USERS_KV
  if (kv) {
    const raw = await kv.get(`user:${account}`)
    if (raw) {
      const user = JSON.parse(raw)

      if (user.status === 'suspended') {
        return respond({ code: 0, message: '账号已被暂停，请联系管理员' })
      }

      const ok = await verifyPassword(password, user.password)
      if (!ok) return respond({ code: 0, message: '密码错误' })

      if (user.backend_url && account !== ADMIN_ACCOUNT) {
        // Paid user — use tryGetOwnToken for all backends (handles auto account creation)
        const backendUrl = user.backend_url
        const token = await tryGetOwnToken(backendUrl, account, password, user.company_name)
        if (token) {
          const w = wrapToken(token, backendUrl, account, user.company_name)
          return respond({
            code: 1, message: '',
            data: {
              token: w,
              name: user.company_name,
              is_paid: true,
              userInfo: { name: user.company_name, account, token: w },
            },
          })
        }
        return respond({ code: 0, message: '服务器启动中，约60秒后可登录，请稍候重试' })
      }

      if (account !== ADMIN_ACCOUNT) {
        // Trial user — log into their own isolated account on TRIAL_BACKEND
        const ownToken = await tryGetOwnToken(TRIAL_BACKEND, account, password, user.company_name)
        if (ownToken) {
          const tok = wrapToken(ownToken, TRIAL_BACKEND, account, user.company_name, true)
          return respond({
            code: 1, message: '',
            data: {
              token: tok,
              name: user.company_name,
              role_name: '体验用户',
              is_trial: true,
              userInfo: { name: user.company_name, account, role_name: '体验用户', token: tok },
            },
          })
        }
        // TRIAL_BACKEND cold start — tell user to retry
        return respond({ code: 0, message: '试用服务器启动中，约60秒后可登录，请稍候重试' })
      }

      // Master admin found in KV — fall through to direct DEFAULT_BACKEND login below
    }
  }

  // Not in KV — try DEFAULT_BACKEND then TRIAL_BACKEND (handles sub-accounts)
  const backendsToTry = [
    { backend: DEFAULT_BACKEND, kvAccount: account === ADMIN_ACCOUNT ? account : ADMIN_ACCOUNT },
    { backend: TRIAL_BACKEND, kvAccount: account },
  ]
  for (const { backend, kvAccount } of backendsToTry) {
    let d
    try { d = await loginBackend(backend, body) } catch { continue }
    if (!d || d.code !== 1) continue

    const displayName = d.data?.userInfo?.name || d.data?.name || account
    const companyName = d.data?.userInfo?.company_name || d.data?.name || kvAccount

    const w = wrapToken(d.data.token, backend, kvAccount, companyName)
    d.data.token = w
    if (d.data.userInfo) d.data.userInfo.token = w

    // Write searchable entry so this account can be found by friends search
    if (kv) {
      await kv.put(`searchable:${account}`, JSON.stringify({
        company_name: companyName,
        name: displayName,
        mobile: account,
        created_at: new Date().toISOString(),
      }))
    }
    return respond(d)
  }
  return respond({ code: 0, message: '账号不存在，请先注册' })
}
