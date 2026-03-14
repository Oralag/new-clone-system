import { createFund, getFundList, updateFund } from '@/api/finance'

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export async function adjustFundBalance(options: {
  fundId?: number | null
  fundName?: string | null
  delta: number
  allowCreate?: boolean
}) {
  const delta = Number(options.delta || 0)
  if (!delta) return null

  const fundId = Number(options.fundId || 0)
  const fundName = String(options.fundName || '').trim()
  if (!fundId && !fundName) return null

  const res = await getFundList({ list_rows: 500 })
  const funds: any[] = res.data?.rows ?? res.data?.list ?? []
  let fund = funds.find((item: any) => Number(item.id) === fundId)
  if (!fund && fundName) {
    fund = funds.find((item: any) => String(item.name || '').trim() === fundName)
  }

  if (!fund) {
    if (!options.allowCreate || !fundName || delta < 0) return null
    const created = await createFund({ name: fundName, type: 2, balance: roundMoney(delta) })
    return created?.data ?? created ?? null
  }

  const nextBalance = roundMoney(Number(fund.balance || 0) + delta)
  await updateFund({
    id: fund.id,
    name: fund.name,
    type: fund.type,
    balance: nextBalance,
    remark: fund.remark,
  })
  return { ...fund, balance: nextBalance }
}
