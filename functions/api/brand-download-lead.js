// /api/brand-download-lead — 外人下载产品资料前留资
// POST { mobile, name, company, tenant? } → KV brand:download-leads:<ts>-<mobile>
// GET  ?tenant=<account> → 列出该租户收到的下载申请（需 x-erp-token）

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
    const raw = token.slice(4)
    const pad = raw + '='.repeat((4 - raw.length % 4) % 4)
    return JSON.parse(decodeURIComponent(escape(atob(pad))))
  } catch { return null }
}

export async function onRequest(context) {
  const { request, env } = context
  const kv = env.USERS_KV

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method === 'POST') {
    let body
    try { body = await request.json() } catch { return json({ code: 0, message: '请求格式错误' }, 400) }
    const mobile = String(body?.mobile || '').trim()
    const name = String(body?.name || '').trim()
    const company = String(body?.company || '').trim()
    const tenant = String(body?.tenant || '17747344571').trim()

    if (!/^1\d{10}$/.test(mobile)) return json({ code: 0, message: '手机号格式不正确' }, 400)
    if (!name) return json({ code: 0, message: '请填写姓名' }, 400)
    if (!company) return json({ code: 0, message: '请填写公司名称' }, 400)

    const ts = Date.now()
    const record = {
      mobile, name, company, tenant, ts,
      ua: request.headers.get('user-agent') || '',
      ip: request.headers.get('cf-connecting-ip') || '',
    }
    await kv.put(`brand:download-leads:${tenant}:${ts}-${mobile}`, JSON.stringify(record))
    return json({ code: 1, message: 'ok' })
  }

  if (request.method === 'GET') {
    const erpToken = request.headers.get('x-erp-token') || ''
    const payload = decodeErpToken(erpToken)
    if (!payload?.a) return json({ code: 0, message: '未授权' }, 401)
    const tenant = payload.a
    const list = await kv.list({ prefix: `brand:download-leads:${tenant}:` })
    const rows = []
    for (const k of list.keys) {
      const v = await kv.get(k.name)
      if (v) rows.push(JSON.parse(v))
    }
    rows.sort((a, b) => b.ts - a.ts)
    return json({ code: 1, data: rows })
  }

  return json({ code: 0, message: 'method not allowed' }, 405)
}
