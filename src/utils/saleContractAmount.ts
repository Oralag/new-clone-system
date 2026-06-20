export function parseJsonArray(value: any): any[] {
  if (Array.isArray(value)) return value
  try { return JSON.parse(value || '[]') } catch { return [] }
}

export function calcExchangeDeductFromItems(items: any[]): number {
  return parseJsonArray(items)
    .filter((item: any) => item?.line_type === 'exchange')
    .reduce((sum: number, item: any) => sum + Number(item.num || 0) * Number(item.price || 0), 0)
}

export function getContractExchangeDeduct(contract: any): number {
  const stored = Number(contract?.exchange_deduct || 0)
  if (stored > 0) return stored
  return calcExchangeDeductFromItems(contract?.goods_info)
}

export function calcSaleContractReceivable(contract: any): number {
  const total = Number(contract?.total_amount || 0)
  const discType = String(contract?.discount_type || 'none')
  const discVal = Number(contract?.discount_value || 0)
  const afterDisc = Number(contract?.after_discount)
  const freight = Number(contract?.freight_amount || 0)
  const bearer = String(contract?.freight_bearer || 'seller')
  const income = Number(contract?.income_amount || 0)
  const exchangeDeduct = getContractExchangeDeduct(contract)

  let base = total
  if (Number.isFinite(afterDisc) && afterDisc > 0 && afterDisc <= total) base = afterDisc
  else if (discType === 'amount' && discVal > 0) base = Math.max(0, total - discVal)
  else if (discType === 'percent' && discVal > 0) base = Math.max(0, total * (1 - discVal / 100))

  const freightCharge = bearer === 'buyer' ? freight : bearer === 'half' ? freight / 2 : 0
  return Math.max(0, base + freightCharge - income - exchangeDeduct)
}
