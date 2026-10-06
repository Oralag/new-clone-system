// 系统默认资金账户：采购付款默认走「公司支出账户」，销售收款默认走「公司收入账户」。
// 按 id 认（可以改名，不能删除）；其它租户没有这两个 id 时按名称兜底。
export const EXPENSE_FUND_ID = 7
export const INCOME_FUND_ID = 58
export const PROTECTED_FUND_IDS = [EXPENSE_FUND_ID, INCOME_FUND_ID]

export function isProtectedFund(id: any) {
  return PROTECTED_FUND_IDS.includes(Number(id))
}

function pick(funds: any[], id: number, keyword: string) {
  const list = Array.isArray(funds) ? funds : []
  return list.find(f => Number(f?.id) === id)
    || list.find(f => String(f?.name || '').includes(keyword))
    || null
}

export function getDefaultExpenseFund(funds: any[]) {
  return pick(funds, EXPENSE_FUND_ID, '支出')
}

export function getDefaultIncomeFund(funds: any[]) {
  return pick(funds, INCOME_FUND_ID, '收入')
}
