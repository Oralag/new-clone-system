// Cloudflare Pages Function — /api/admin-console
// Super admin API: list/update/delete KV users
// Protected: only account 17747344571 can call this

const SUPER_ADMIN = '17747344571'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

// Decode the wrapped erp_ token to get account
function decodeToken(wrapped) {
  try {
    if (!wrapped || !wrapped.startsWith('erp_')) return null
    const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
    return JSON.parse(json)
  } catch { return null }
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  // Auth check
  const token = request.headers.get('x-admin-token') || ''
  const payload = decodeToken(token)
  if (!payload || payload.a !== SUPER_ADMIN) {
    return jsonRes({ code: 0, message: '无权限' }, 403)
  }

  const kv = env.USERS_KV
  if (!kv) return jsonRes({ code: 0, message: 'KV未配置' }, 500)

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'list'

  // ── LIST all users ─────────────────────────────────────────────────────────
  if (request.method === 'GET' && action === 'list') {
    const TRIAL_DAYS = 15
    const list = await kv.list({ prefix: 'user:' })
    const users = []
    for (const key of list.keys) {
      const raw = await kv.get(key.name)
      if (raw) {
        const user = JSON.parse(raw)
        let trialDaysLeft = null
        if (user.trial_start_at) {
          const elapsed = Date.now() - new Date(user.trial_start_at).getTime()
          trialDaysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed / 86400000))
        }
        users.push({
          mobile: user.mobile,
          company_name: user.company_name,
          backend_url: user.backend_url || null,
          status: user.status || 'active',
          created_at: user.created_at,
          is_paid: !!user.backend_url,
          trial_start_at: user.trial_start_at || null,
          trial_expire_at: user.trial_expire_at || null,
          trial_days_left: trialDaysLeft,
          plan_label: user.plan_label || null,
          paid_until: user.paid_until || null,
        })
      }
    }
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return jsonRes({ code: 1, data: users })
  }

  // ── UPDATE user (set backend_url / status / reset password) ───────────────
  if (request.method === 'POST' && action === 'update') {
    const body = await request.json()
    const { mobile, backend_url, status, password, plan_label, paid_until } = body
    if (!mobile) return jsonRes({ code: 0, message: '缺少mobile' })

    const raw = await kv.get(`user:${mobile}`)
    if (!raw) return jsonRes({ code: 0, message: '用户不存在' })

    const user = JSON.parse(raw)
    if (backend_url !== undefined) user.backend_url = backend_url || null
    if (status !== undefined) user.status = status
    if (password) user.password = password
    if (plan_label !== undefined) user.plan_label = plan_label
    if (paid_until !== undefined) user.paid_until = paid_until
    user.updated_at = new Date().toISOString()

    await kv.put(`user:${mobile}`, JSON.stringify(user))
    return jsonRes({ code: 1, message: '更新成功' })
  }

  // ── DELETE user ────────────────────────────────────────────────────────────
  if (request.method === 'DELETE' && action === 'delete') {
    const body = await request.json()
    const { mobile } = body
    if (!mobile) return jsonRes({ code: 0, message: '缺少mobile' })
    await kv.delete(`user:${mobile}`)
    return jsonRes({ code: 1, message: '已删除' })
  }

  return jsonRes({ code: 0, message: '未知操作' }, 400)
}
