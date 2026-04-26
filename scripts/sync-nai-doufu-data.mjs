import fs from 'fs'

const API_BASE = process.env.ERP_API_BASE || 'https://nomaderp.pages.dev/adminapi'
const CANON = {
  id: 884,
  goods_sn: 'SP0000151',
  goods_name: '实惠/奶豆腐',
  unit_name: '个',
  cost_price: 12,
}
const APPLY = process.argv.includes('--apply')
const LIST_ROWS = Number(process.env.LIST_ROWS || 500)

const DOCUMENTS = [
  ['零售单', '/retail/order/index', [
    '/retail/order/edit',
    '/retail/order/update',
    '/retail/order/save',
    '/retail/RetailOrder/edit',
    '/retail/RetailOrder/update',
    '/retail/RetailOrder/save',
  ]],
  ['零售退货', '/retail/return/index', '/retail/return/edit'],
  ['销售合同', '/shop/ContractOrder/index', '/shop/ContractOrder/edit'],
  ['销售出库', '/stock/SaleOutOrder/index', '/stock/SaleOutOrder/edit'],
  ['销售退货', '/stock/SaleReturnOrder/index', '/stock/SaleReturnOrder/edit'],
  ['采购订单', '/stock/PurchaseOrder/index', '/stock/PurchaseOrder/edit'],
  ['采购入库', '/procure/ProcureInhouse/index', '/procure/ProcureInhouse/edit'],
  ['采购退货', '/procure/ProcureReturn/index', '/procure/ProcureReturn/edit'],
  ['其他入库', '/stock/OtherIn/index', '/stock/OtherIn/edit'],
  ['其他出库', '/stock/OtherOut/index', '/stock/OtherOut/edit'],
  ['库存调拨', '/stock/Allocation/index', '/stock/Allocation/edit'],
  ['生产计划', '/production/plan/index', '/production/plan/edit'],
  ['生产入库', '/production/inhouse/index', '/production/inhouse/edit'],
  ['生产领料', '/production/material/index', '/production/material/edit'],
  ['生产退料', '/production/returnMaterial/index', '/production/returnMaterial/edit'],
]

function compact(v) {
  return String(v ?? '').trim().replace(/\s+/g, '')
}

function decodeCredentials() {
  const account = process.env.ERP_ACCOUNT
  const password = process.env.ERP_PASSWORD
  if (account && password) return { account, password }
  const src = fs.readFileSync(new URL('./upload-brand-images.mjs', import.meta.url), 'utf8')
  const accountMatch = src.match(/account:\s*['"]([^'"]+)['"]/) || src.match(/ERP_ACCOUNT\s*=\s*['"]([^'"]+)['"]/) 
  const passwordMatch = src.match(/password:\s*['"]([^'"]+)['"]/) || src.match(/ERP_PASSWORD\s*=\s*['"]([^'"]+)['"]/) 
  if (!accountMatch || !passwordMatch) throw new Error('缺少 ERP 登录信息，请设置 ERP_ACCOUNT/ERP_PASSWORD')
  return { account: accountMatch[1], password: passwordMatch[1] }
}

async function api(path, { method = 'GET', token, body, params } = {}) {
  const url = new URL(API_BASE + path)
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && url.searchParams.set(k, String(v)))
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { throw new Error(`${path} 返回非 JSON: ${text.slice(0, 160)}`) }
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}: ${text.slice(0, 160)}`)
  return json
}

async function login() {
  const { account, password } = decodeCredentials()
  const json = await api('/login/account', { method: 'POST', body: { account, password, terminal: 1 } })
  if (json.code !== 1 || !json.data?.token) throw new Error('登录失败: ' + JSON.stringify(json))
  return json.data.token
}

async function fetchAll(path, token, baseParams = {}) {
  const rows = []
  for (let page = 1; page <= 200; page++) {
    const json = await api(path, { token, params: { ...baseParams, page, list_rows: LIST_ROWS } })
    const pageRows = json.data?.rows || json.data?.list || []
    if (!Array.isArray(pageRows) || pageRows.length === 0) break
    rows.push(...pageRows)
    const total = Number(json.data?.total || 0)
    if (pageRows.length < LIST_ROWS || (total && rows.length >= total)) break
  }
  return rows
}

function parseGoodsInfo(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') {
    if (Array.isArray(raw.goods_info)) return raw.goods_info
    if (Array.isArray(raw.items)) return raw.items
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' ? parseGoodsInfo(parsed) : parseGoodsInfo(parsed)
  } catch {
    return []
  }
}

function itemName(item) {
  return String(item?.goods_name ?? item?.name ?? item?.product_name ?? item?.title ?? '').trim()
}

function itemSn(item) {
  return String(item?.goods_sn ?? item?.sn ?? item?.goods_code ?? item?.code ?? item?.barcode ?? '').trim()
}

function shouldFix(item, wrongIds) {
  const gid = Number(item?.goods_id || item?.id || item?.product_id || item?.shop_goods_id || 0)
  const name = compact(itemName(item))
  const sn = itemSn(item)
  return wrongIds.has(gid) || name === '奶豆腐' || name === '实惠奶豆腐' || sn === CANON.goods_sn && (gid !== CANON.id || compact(itemName(item)) !== compact(CANON.goods_name))
}

function fixItem(item, wrongIds) {
  if (!shouldFix(item, wrongIds)) return { item, changed: false }
  const fixed = {
    ...item,
    goods_id: CANON.id,
    goods_name: CANON.goods_name,
    goods_sn: CANON.goods_sn,
    unit_name: item.unit_name || item.unit || CANON.unit_name,
    cost_price: Number(item.cost_price || 0) > 0 ? item.cost_price : CANON.cost_price,
  }
  if ('name' in fixed) fixed.name = CANON.goods_name
  if ('product_name' in fixed) fixed.product_name = CANON.goods_name
  return { item: fixed, changed: JSON.stringify(fixed) !== JSON.stringify(item) }
}

function fixRow(row, wrongIds) {
  const items = parseGoodsInfo(row.goods_info)
  if (!items.length) return null
  let changed = false
  const fixed = items.map(item => {
    const res = fixItem(item, wrongIds)
    changed = changed || res.changed
    return res.item
  })
  return changed ? fixed : null
}

async function findWrongGoodsIds(token) {
  const goods = await fetchAll('/goods/ShopGoods/index', token, {})
  const wrong = new Set()
  let canonical = goods.find(g => Number(g.id) === CANON.id)
    || goods.find(g => String(g.goods_sn || '').trim() === CANON.goods_sn)
  for (const g of goods) {
    const id = Number(g.id || 0)
    const name = compact(g.goods_name)
    if (id && id !== CANON.id && (name === '奶豆腐' || name === '实惠奶豆腐')) wrong.add(id)
  }
  if (!canonical) throw new Error(`找不到标准商品 ${CANON.goods_name} (${CANON.goods_sn})`)
  CANON.id = Number(canonical.id)
  CANON.goods_sn = canonical.goods_sn || CANON.goods_sn
  CANON.goods_name = canonical.goods_name || CANON.goods_name
  CANON.unit_name = canonical.unit_name || CANON.unit_name
  CANON.cost_price = Number(canonical.cost_price || CANON.cost_price)
  return wrong
}

function rowNo(row) {
  return row.order_sn || row.order_no || row.contract_no || row.plan_sn || row.id
}

async function main() {
  const token = await login()
  const wrongIds = await findWrongGoodsIds(token)
  const summary = []
  const failures = []
  console.log(`${APPLY ? '执行更新' : '预演'}：标准商品 ${CANON.id} ${CANON.goods_name} ${CANON.goods_sn}，错误商品ID=${[...wrongIds].join(',') || '无'}`)

  for (const [label, indexPath, editPath] of DOCUMENTS) {
    let rows = []
    try { rows = await fetchAll(indexPath, token) } catch (e) { failures.push(`${label} 查询失败: ${e.message}`); continue }
    const changes = []
    for (const row of rows) {
      const fixed = fixRow(row, wrongIds)
      if (fixed) changes.push({ row, fixed })
    }
    let updated = 0
    if (!APPLY) {
      summary.push({ label, total: rows.length, changed: changes.length, updated })
      continue
    }
    for (const change of changes) {
      try {
        const editPaths = Array.isArray(editPath) ? editPath : [editPath]
        let success = false
        let lastError = ''
        for (const path of editPaths) {
          try {
            const json = await api(path, { token, method: 'POST', body: { id: change.row.id, goods_info: JSON.stringify(change.fixed) } })
            if (json.code !== 1) throw new Error(json.msg || JSON.stringify(json))
            success = true
            updated += 1
            break
          } catch (e) {
            lastError = e.message
          }
        }
        if (!success) throw new Error(lastError)
      } catch (e) {
        failures.push(`${label} ${rowNo(change.row)} 更新失败: ${e.message}`)
      }
    }
    summary.push({ label, total: rows.length, changed: changes.length, updated })
  }

  for (const s of summary) console.log(`${s.label}: 扫描 ${s.total}，${APPLY ? `命中 ${s.changed}，成功更新 ${s.updated}` : `待更新 ${s.changed}`}`)
  if (failures.length) {
    console.log('\n失败/跳过:')
    for (const f of failures) console.log(`- ${f}`)
  }
  const totalChanged = summary.reduce((n, s) => n + s.changed, 0)
  const totalUpdated = summary.reduce((n, s) => n + (s.updated || 0), 0)
  console.log(`\n合计${APPLY ? `命中: ${totalChanged}，成功更新: ${totalUpdated}` : `待更新: ${totalChanged}`}`)
  if (!APPLY) console.log('如数量确认无误，执行：node scripts/sync-nai-doufu-data.mjs --apply')
}

main().catch(e => {
  console.error(e.message || e)
  process.exit(1)
})
