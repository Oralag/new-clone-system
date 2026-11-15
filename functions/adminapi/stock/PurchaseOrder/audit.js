import { AUDIT_PURCHASE_ORDER_SQL, INSTALL_PURCHASE_AUDIT_SQL } from './auditSql.js'
import { verifyJwtHs256 } from './jwt.js'

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'
const NEON_SQL_URL = 'https://ep-steep-dew-a1iir071-pooler.ap-southeast-1.aws.neon.tech/sql'
const NEON_CONN = 'postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071-pooler.ap-southeast-1.aws.neon.tech/neondb'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
    'Cache-Control': 'no-store',
  }
}

function jsonBody(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function decodeWrappedToken(wrapped) {
  try {
    if (!wrapped || !wrapped.startsWith('erp_')) return null
    const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
    const payload = JSON.parse(json)
    return {
      realToken: payload.t || null,
      backend: payload.b || DEFAULT_BACKEND,
      trial: !!payload.trial,
    }
  } catch {
    return null
  }
}

async function neonQuery(query, params = []) {
  const res = await fetch(NEON_SQL_URL, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': NEON_CONN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, params }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.message || '数据库错误')
  }
  return json
}

async function proxyAudit(request, backend, realToken) {
  const headers = new Headers()
  headers.set('content-type', 'application/json')
  if (realToken) headers.set('token', realToken)
  const body = await request.clone().text()
  const res = await fetch(`${backend}/adminapi/stock/PurchaseOrder/audit`, {
    method: 'POST',
    headers,
    body,
  })
  const text = await res.text()
  const out = new Headers(res.headers)
  Object.entries(corsHeaders()).forEach(([key, value]) => out.set(key, value))
  out.delete('content-encoding')
  return new Response(text, { status: res.status, headers: out })
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() })
  if (request.method !== 'POST') return jsonBody({ code: 0, message: '方法不允许', data: [] }, 405)

  const headerToken = request.headers.get('token') || ''
  const decoded = decodeWrappedToken(headerToken)
  if (decoded?.trial) {
    return proxyAudit(request, decoded.backend || DEFAULT_BACKEND, decoded.realToken)
  }

  const realToken = decoded?.realToken || headerToken
  let claims
  try {
    claims = await verifyJwtHs256(realToken, env?.JWT_SECRET || 'erp_secret_2024')
  } catch (error) {
    return jsonBody({ code: -1, message: error.message || 'token无效或已过期', data: [] }, 401)
  }

  let body
  try { body = await request.json() } catch { body = {} }
  const id = Number(body.id)
  const status = Number(body.status)
  const shopId = Number(claims.shop_id || 1)
  const adminId = Number(claims.id || 0)
  if (!Number.isSafeInteger(id) || id <= 0) return jsonBody({ code: 0, message: 'id不能为空', data: [] })
  if (![0, 1].includes(status)) return jsonBody({ code: 0, message: 'status必须是0或1', data: [] })

  try {
    const admin = await neonQuery(
      'SELECT id FROM public.admins WHERE id = $1 AND shop_id = $2 AND deleted_at IS NULL LIMIT 1',
      [adminId, shopId],
    )
    if (!admin.rows?.length) return jsonBody({ code: -1, message: 'token无效或已过期', data: [] }, 401)
    await neonQuery(INSTALL_PURCHASE_AUDIT_SQL)
    await neonQuery(AUDIT_PURCHASE_ORDER_SQL)
    const result = await neonQuery(
      'SELECT public.audit_purchase_order($1, $2, $3, $4) AS result',
      [id, status, shopId, adminId],
    )
    const data = result.rows?.[0]?.result ?? {}
    return jsonBody({ code: 1, data, message: '' })
  } catch (error) {
    return jsonBody({ code: 0, message: error.message || '审核失败', data: [] })
  }
}
