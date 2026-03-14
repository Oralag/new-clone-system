// Cloudflare Pages Function — /api/claim-trial
// Called when a trial user claims their 15-day free trial
// Writes trial_start_at into the user's KV record

const TRIAL_DAYS = 15

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token',
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

// Decode erp_ wrapped token
function decodeErpToken(token) {
  try {
    if (!token || !token.startsWith('erp_')) return null
    const raw = token.slice(4)
    const pad = raw + '='.repeat((4 - raw.length % 4) % 4)
    const json = decodeURIComponent(escape(atob(pad)))
    return JSON.parse(json)
  } catch { return null }
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  if (request.method !== 'POST') {
    return jsonRes({ code: 0, message: '请求方式错误' }, 405)
  }

  const kv = env.USERS_KV
  if (!kv) return jsonRes({ code: 0, message: 'KV未配置' }, 500)

  // Get token from header
  const token = request.headers.get('token') || ''
  const payload = decodeErpToken(token)
  if (!payload || !payload.a) {
    return jsonRes({ code: 0, message: '未授权' }, 401)
  }

  const mobile = payload.a
  const raw = await kv.get(`user:${mobile}`)
  if (!raw) return jsonRes({ code: 0, message: '用户不存在' }, 404)

  const user = JSON.parse(raw)

  // Already claimed
  if (user.trial_start_at) {
    const start = new Date(user.trial_start_at).getTime()
    const elapsed = Date.now() - start
    const daysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed / 86400000))
    return jsonRes({
      code: 1,
      message: '已领取',
      data: {
        trial_start_at: user.trial_start_at,
        trial_expire_at: user.trial_expire_at,
        days_left: daysLeft,
        already_claimed: true,
      },
    })
  }

  // Claim trial
  const now = new Date()
  const expireAt = new Date(now.getTime() + TRIAL_DAYS * 86400000)
  user.trial_start_at = now.toISOString()
  user.trial_expire_at = expireAt.toISOString()
  await kv.put(`user:${mobile}`, JSON.stringify(user))

  return jsonRes({
    code: 1,
    message: '领取成功',
    data: {
      trial_start_at: user.trial_start_at,
      trial_expire_at: user.trial_expire_at,
      days_left: TRIAL_DAYS,
      already_claimed: false,
    },
  })
}
