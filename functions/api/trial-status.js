// Cloudflare Pages Function — /api/trial-status
// Returns trial status from KV for the current user

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token',
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

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

  const token = request.headers.get('token') || ''
  const payload = decodeErpToken(token)
  if (!payload?.a) return jsonRes({ code: 0, message: '未授权' }, 401)

  const kv = env.USERS_KV
  if (!kv) return jsonRes({ code: 0, message: 'KV未配置' }, 500)

  const raw = await kv.get(`user:${payload.a}`)
  if (!raw) return jsonRes({ code: 0, message: '用户不存在' }, 404)

  const user = JSON.parse(raw)
  const trial_start_ts = user.trial_start_at
    ? new Date(user.trial_start_at).getTime()
    : null

  return jsonRes({
    code: 1,
    data: { trial_start_ts },
  })
}
