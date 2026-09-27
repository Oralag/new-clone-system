type Row = Record<string, any>
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
export function exhibitionItems(value: any): Row[] {
  try {
    const result = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(result) ? result : []
  } catch { return [] }
}
export function exhibitionSaleAmount(row: Row) {
  // Explicit zero is a complimentary sale; do not fall back to the pre-discount lines.
  if (row.total_amount != null && row.total_amount !== '') return money(Number(row.total_amount) - Number(row.discount_amount || 0))
  return money(Number(row.pay_amount || 0))
}
export function exhibitionOrderCost(row: Row) {
  const items = exhibitionItems(row.goods_info)
  let amount = 0
  let missing = items.length ? 0 : 1
  for (const item of items) {
    const qty = Number(item.num ?? item.qty ?? item.quantity ?? 0)
    const cost = Number(item.cost_price)
    if (item.cost_price == null || item.cost_price === '' || !Number.isFinite(cost) || cost < 0) missing++
    else amount += qty * cost
  }
  return { amount: money(amount), missing }
}
export function exhibitionOrderFees(row: Row) {
  return money(exhibitionItems(row.fee_items).reduce((sum, fee) => {
    // RetailOrder uses buyer=our company, seller=customer, half=50%.
    const share = fee.bearer === 'seller' || fee.bearer === 'free' ? 0 : fee.bearer === 'half' ? 0.5 : 1
    return sum + Number(fee.amount || 0) * share
  }, 0))
}
export function isExhibitionReceiptExpense(row: Row) {
  return Number(row.exhibition_payment_id || 0) > 0
}
export function calculateExhibitionFinance(orders: Row[], expenses: Row[], returns: Row[] = []) {
  const audited = orders.filter(row => Number(row.status) === 1)
  const byId = new Map(audited.map(row => [Number(row.id), row]))
  const byNo = new Map(audited.filter(row => row.order_sn || row.order_no).map(row => [String(row.order_sn || row.order_no), row]))
  const confirmedExpenses = expenses.filter(row => Number(row.status) === 1)
  let revenue = 0, cost = 0, fees = 0, missingCosts = 0, refund = 0, returnedCost = 0
  for (const row of audited) {
    revenue += exhibitionSaleAmount(row)
    const itemCost = exhibitionOrderCost(row)
    cost += itemCost.amount
    missingCosts += itemCost.missing
    fees += exhibitionOrderFees(row)
  }
  const matchedReturns: Row[] = []
  for (const row of returns) {
    if (Number(row.status) !== 1) continue
    const order = byId.get(Number(row.order_id || row.retail_order_id)) || byNo.get(String(row.order_no || row.order_sn || ''))
    if (!order) continue
    matchedReturns.push(row)
    refund += Number(row.amount ?? row.refund_amount ?? row.total_amount ?? 0)
    const original = exhibitionItems(order.goods_info)
    const returned = exhibitionItems(row.goods_info)
    if (!returned.length) missingCosts++
    for (const item of returned) {
      const matches = original.filter(candidate => Number(candidate.goods_id || candidate.id) === Number(item.goods_id || item.id) && String(candidate.spec || candidate.spec_name || '') === String(item.spec || item.spec_name || ''))
      const value = matches.length === 1 ? matches[0].cost_price : item.cost_price
      if (value == null || value === '' || !Number.isFinite(Number(value))) missingCosts++
      else returnedCost += Number(value) * Number(item.num ?? item.qty ?? item.quantity ?? 0)
    }
  }
  const categories = new Map<string, number>()
  let expenseAmount = 0, unpaid = 0
  for (const row of confirmedExpenses) {
    const amount = Number(row.amount || 0)
    expenseAmount += amount
    const name = String(row.name || row.type_name || '其他费用')
    categories.set(name, (categories.get(name) || 0) + amount)
    if (row.payment_status === 'pending' || /【待付款】|\[待付款\]/.test(row.remark || '')) unpaid += amount
  }
  return {
    count: audited.length, draftCount: orders.length - audited.length,
    revenue: money(revenue - refund), refund: money(refund),
    cost: money(cost - returnedCost), fees: money(fees), expenses: money(expenseAmount),
    profit: money(revenue - refund - cost + returnedCost - fees - expenseAmount),
    collected: money(audited.reduce((sum, row) => sum + Number(row.pay_amount || 0), 0) - refund),
    unpaid: money(unpaid), missingCosts, returns: matchedReturns,
    categories: [...categories].map(([name, amount]) => ({ name, amount: money(amount) })),
  }
}
