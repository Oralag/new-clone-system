// Cloudflare Pages Function — /adminapi/finance/ledger
// 后台流水查询接口（只读）
// 直连 Neon HTTP SQL API，绕过 erp-server 后端

const NEON_SQL_URL = 'https://ep-steep-dew-a1iir071-pooler.ap-southeast-1.aws.neon.tech/sql'
const NEON_CONN = 'postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071-pooler.ap-southeast-1.aws.neon.tech/neondb'

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

async function neonQuery(query, params = []) {
  const res = await fetch(NEON_SQL_URL, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': NEON_CONN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, params }),
  })
  return res.json()
}

export async function onRequest(context) {
  const { request } = context
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }

  try {
    const url = new URL(request.url)
    const sp = url.searchParams

    const limit = Math.min(parseInt(sp.get('list_rows') || sp.get('limit') || '50'), 2000)
    const page = Math.max(parseInt(sp.get('page') || '1'), 1)
    const offset = (page - 1) * limit

    const where = ['1=1']
    const params = []
    let pi = 1

    if (sp.get('type')) { where.push(`type = $${pi++}`); params.push(sp.get('type')) }
    if (sp.get('flow_category')) { where.push(`flow_category = $${pi++}`); params.push(sp.get('flow_category')) }
    if (sp.get('source')) { where.push(`source = $${pi++}`); params.push(sp.get('source')) }
    if (sp.get('start_date') || sp.get('start_time')) {
      where.push(`date >= $${pi++}`); params.push(sp.get('start_date') || sp.get('start_time'))
    }
    if (sp.get('end_date') || sp.get('end_time')) {
      where.push(`date <= $${pi++}`); params.push(sp.get('end_date') || sp.get('end_time'))
    }
    if (sp.get('contact_name')) {
      where.push(`contact_name ILIKE $${pi++}`); params.push(`%${sp.get('contact_name')}%`)
    }
    if (sp.get('fund_name')) {
      where.push(`fund_name = $${pi++}`); params.push(sp.get('fund_name'))
    }
    if (sp.get('order_id')) {
      where.push(`order_id = $${pi++}`); params.push(parseInt(sp.get('order_id')))
    }

    const whereSQL = where.join(' AND ')

    const [listRes, countRes, sumRes] = await Promise.all([
      neonQuery(
        `SELECT id, date, type, flow_category, source, amount, contact_name, order_id, order_sn, fund_name, remark, created_at
         FROM ledger_flow WHERE ${whereSQL}
         ORDER BY date DESC, id DESC LIMIT $${pi} OFFSET $${pi + 1}`,
        [...params, limit, offset]
      ),
      neonQuery(`SELECT COUNT(*) as total FROM ledger_flow WHERE ${whereSQL}`, params),
      neonQuery(
        `SELECT
          COALESCE(SUM(CASE WHEN type='income' AND flow_category='cash' THEN amount ELSE 0 END), 0) as cash_income,
          COALESCE(SUM(CASE WHEN type='expense' AND flow_category='cash' THEN amount ELSE 0 END), 0) as cash_expense,
          COALESCE(SUM(CASE WHEN flow_category='receivable' THEN amount ELSE 0 END), 0) as receivable_total,
          COALESCE(SUM(CASE WHEN flow_category='payable' THEN amount ELSE 0 END), 0) as payable_total
         FROM ledger_flow WHERE ${whereSQL}`,
        params
      ),
    ])

    const rows = listRes.rows || []
    const total = parseInt(countRes.rows?.[0]?.total || 0)
    const summary = sumRes.rows?.[0] || {}

    return jsonRes({
      code: 1,
      msg: 'success',
      data: {
        rows,
        list: rows,
        total,
        page,
        limit,
        summary: {
          cash_income: parseFloat(summary.cash_income || 0),
          cash_expense: parseFloat(summary.cash_expense || 0),
          cash_balance: parseFloat(summary.cash_income || 0) - parseFloat(summary.cash_expense || 0),
          receivable: parseFloat(summary.receivable_total || 0),
          payable: parseFloat(summary.payable_total || 0),
        },
      },
    })
  } catch (e) {
    return jsonRes({ code: 0, msg: e.message || 'ledger query failed', data: { rows: [], total: 0 } }, 500)
  }
}
