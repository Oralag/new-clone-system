import fs from 'fs'

const API_BASE = process.env.ERP_API_BASE || 'https://nomaderp.pages.dev/adminapi'
const APPLY = process.argv.includes('--apply')
const LIST_ROWS = Number(process.env.LIST_ROWS || 500)

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

function parseSaleOutContractRef(row) {
  const contractId = Number(
    row?.contract_id ||
    row?.source_contract_id ||
    row?.from_contract_id ||
    0
  )
  const contractSn = String(
    row?.contract_sn ||
    row?.source_contract_sn ||
    row?.source_order_sn ||
    row?.remark?.match(/销售合同\s*([A-Z0-9]+)/)?.[1] ||
    ''
  ).trim()
  return { contractId, contractSn }
}

function parseContractSn(row) {
  return String(row?.order_sn || row?.contract_no || row?.order_no || '').trim()
}

function rowLabel(row) {
  return parseContractSn(row) || (row?.id ? `HT${String(row.id).padStart(4, '0')}` : String(row?.id || ''))
}

async function main() {
  const token = await login()
  const [contracts, saleOuts] = await Promise.all([
    fetchAll('/shop/ContractOrder/index', token, {}),
    fetchAll('/stock/SaleOutOrder/index', token, {}),
  ])

  const outByContractId = new Map()
  const outByContractSn = new Map()
  for (const so of saleOuts) {
    if (Number(so.status) !== 1) continue
    const ref = parseSaleOutContractRef(so)
    if (ref.contractId > 0) outByContractId.set(ref.contractId, so)
    if (ref.contractSn) outByContractSn.set(ref.contractSn, so)
  }

  const candidates = []
  for (const row of contracts) {
    if (Number(row.status) !== 1) continue
    const sn = parseContractSn(row)
    const byId = outByContractId.get(Number(row.id))
    const bySn = sn ? outByContractSn.get(sn) : null
    if (byId || bySn) {
      candidates.push({
        row,
        matchedBy: byId ? 'contract_id' : 'contract_sn',
        saleOutId: (byId || bySn)?.id,
      })
    }
  }

  console.log(`${APPLY ? '执行回填' : '预演'}：扫描合同 ${contracts.length}，销售出库 ${saleOuts.length}，命中 ${candidates.length}`)
  for (const item of candidates.slice(0, 20)) {
    console.log(`- ${rowLabel(item.row)} -> saleOut#${item.saleOutId} (${item.matchedBy})`)
  }
  if (candidates.length > 20) console.log(`- ... 还有 ${candidates.length - 20} 条`)

  if (!APPLY) {
    console.log('如数量确认无误，执行：node scripts/backfill_contract_statuses_20260507.mjs --apply')
    return
  }

  let updated = 0
  const failures = []
  for (const item of candidates) {
    try {
      const json = await api('/shop/ContractOrder/edit', {
        token,
        method: 'POST',
        body: { id: item.row.id, status: 4 },
      })
      if (json.code !== 1) throw new Error(json.msg || JSON.stringify(json))
      updated += 1
    } catch (e) {
      failures.push(`${rowLabel(item.row)}: ${e.message}`)
    }
  }

  console.log(`成功更新 ${updated} 条`)
  if (failures.length) {
    console.log('失败列表:')
    for (const f of failures) console.log(`- ${f}`)
  }
}

main().catch(e => {
  console.error(e.message || e)
  process.exit(1)
})
