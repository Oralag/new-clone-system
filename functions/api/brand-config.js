// /api/brand-config — 品牌页配置云端同步（per-tenant）
// GET + x-erp-token: 读取自己的配置
// GET + ?shop=mobile: 公开读取指定租户的配置
// POST + x-erp-token: 保存自己的配置

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function decodeErpToken(token) {
  try {
    if (!token?.startsWith('erp_')) return null
    const j = decodeURIComponent(escape(atob(token.slice(4))))
    return JSON.parse(j)
  } catch { return null }
}

// erp_ 包装 token 本身没有签名，a（账号）和 b（后端）都可以伪造。
// 写操作必须：按账号从可信来源确定后端（不信 token 里的 b）→ 用 t 去该后端校验登录态，
// 校验失败或后端不可达一律拒绝（fail-closed）。
const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'
const TRIAL_BACKEND = 'https://erp-trial.onrender.com'
const ADMIN_ACCOUNT = '17747344571'

async function trustedBackendFor(kv, account) {
  if (account === ADMIN_ACCOUNT) return DEFAULT_BACKEND
  try {
    const raw = await kv.get(`user:${account}`)
    if (!raw) return null
    const user = JSON.parse(raw)
    if (user.status === 'suspended') return null
    return (user.backend_url || TRIAL_BACKEND).replace(/\/+$/, '')
  } catch { return null }
}

async function verifyWriteToken(kv, payload) {
  if (!payload?.a || !payload?.t) return false
  const backend = await trustedBackendFor(kv, String(payload.a))
  if (!backend) return false
  try {
    const res = await fetch(`${backend}/adminapi/setting/admin/index?list_rows=1`, {
      headers: { token: String(payload.t), 'Content-Type': 'application/json' },
    })
    if (!res.ok) return false
    const data = await res.json()
    // 未登录 / token 无效 → 拒绝；其余（含无权限的业务错误）说明 token 属于该后端的有效会话
    if (data?.code === -1) return false
    if (/未登录|token无效|已过期/.test(String(data?.message || ''))) return false
    return true
  } catch { return false }
}

export async function onRequest(context) {
  const { request, env } = context
  const kv = env.USERS_KV

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method === 'GET') {
    const url = new URL(request.url)
    const shopParam = url.searchParams.get('shop')
    const erpToken = request.headers.get('x-erp-token') || ''
    const payload = decodeErpToken(erpToken)

    // Determine which account's config to read
    const account = payload?.a || shopParam || null

    if (account) {
      const value = await kv.get(`brand_page_config:${account}`)
      // Fallback to global key for the owner (backward compat)
      if (!value && account === '17747344571') {
        const global = await kv.get('brand_page_config_v1')
        return json({ code: 1, data: global ? JSON.parse(global) : null })
      }
      return json({ code: 1, data: value ? JSON.parse(value) : null })
    }

    // No account context — return owner's config (public default)
    const global = await kv.get('brand_page_config_v1')
    return json({ code: 1, data: global ? JSON.parse(global) : null })
  }

  if (request.method === 'POST') {
    const erpToken = request.headers.get('x-erp-token') || ''
    const payload = decodeErpToken(erpToken)
    if (!payload?.a || !(await verifyWriteToken(kv, payload))) {
      return json({ code: 0, message: '未授权' }, 401)
    }

    const body = await request.json()
    const account = payload.a
    await kv.put(`brand_page_config:${account}`, JSON.stringify(body))

    // Also update global key for the owner (keeps public page working)
    if (account === '17747344571') {
      await kv.put('brand_page_config_v1', JSON.stringify(body))
    }

    return json({ code: 1, message: 'ok' })
  }

  return json({ code: 0, message: 'method not allowed' }, 405)
}
