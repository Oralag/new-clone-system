// Cloudflare Pages Function — /adminapi/login/register

const TRIAL_BACKEND = 'https://erp-trial.onrender.com'

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

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method !== 'POST') {
    return jsonRes({ code: 0, show: 1, message: '请求方式错误', data: [] }, 405)
  }

  let body
  try { body = await request.json() } catch {
    return jsonRes({ code: 0, show: 1, message: '请求格式错误', data: [] })
  }

  const { company_name, mobile, password } = body

  if (!company_name || !company_name.trim()) {
    return jsonRes({ code: 0, show: 1, message: '请输入公司名称', data: [] })
  }
  if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) {
    return jsonRes({ code: 0, show: 1, message: '请输入有效的手机号', data: [] })
  }
  if (!password || password.length < 6) {
    return jsonRes({ code: 0, show: 1, message: '密码至少6位', data: [] })
  }

  const kv = env.USERS_KV
  if (!kv) {
    return jsonRes({ code: 0, show: 1, message: '注册服务未配置，请联系管理员', data: [] }, 500)
  }

  const existing = await kv.get(`user:${mobile}`)
  if (existing) {
    return jsonRes({ code: 0, show: 1, message: '该手机号已注册，请直接登录', data: [] })
  }

  const user = {
    company_name: company_name.trim(),
    mobile,
    password: String(password),
    admin_id: Date.now(),
    created_at: new Date().toISOString(),
  }
  await kv.put(`user:${mobile}`, JSON.stringify(user))

  // Pre-create isolated company on trial backend (fire-and-forget)
  fetch(`${TRIAL_BACKEND}/adminapi/login/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name: company_name.trim(), account: mobile, password: String(password) }),
  }).catch(() => {})

  return jsonRes({ code: 1, show: 0, message: '注册成功', data: {} })
}
