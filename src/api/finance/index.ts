import http from '../http'

function normalizeExpenseRow(row: any) {
  if (!row || typeof row !== 'object') return row
  const typeName = row.type_name || row.title || row.expense_type || row.expense_name || row.name || ''
  const applyDate = row.apply_date || row.expense_date || row.created_at || ''
  return {
    ...row,
    type_name: typeName,
    title: row.title || typeName,
    expense_type: row.expense_type || typeName,
    apply_date: applyDate,
    expense_date: row.expense_date || applyDate,
  }
}

function normalizeExpenseResponse(res: any) {
  const rows = Array.isArray(res?.data?.rows) ? res.data.rows : null
  const list = Array.isArray(res?.data?.list) ? res.data.list : null
  if (rows) res.data.rows = rows.map(normalizeExpenseRow)
  if (list) res.data.list = list.map(normalizeExpenseRow)
  return res
}

function buildExpensePayload(data: any) {
  const payload = { ...(data || {}) }
  const typeName = String(payload.type_name || payload.title || payload.expense_type || payload.expense_name || '').trim()
  const expenseDate = payload.apply_date || payload.expense_date || ''

  delete payload.type_name
  delete payload.apply_date

  if (typeName && !payload.title) payload.title = typeName
  if (expenseDate && !payload.expense_date) payload.expense_date = expenseDate

  return payload
}

export const getReceivableList = (params?: any) => http.get('/finance/CollectAccounts/index', { params })
export const getPayableList = (params?: any) => http.get('/finance/PayAccounts/index', { params })
export const getCollectReceiptList = (params?: any) => http.get('/finance/CollectReceipt/index', { params })
export const createCollectReceipt = (data: any) => http.post('/finance/CollectReceipt/add', data)
export const deleteCollectReceipt = (id: number) => http.post('/finance/CollectReceipt/del', { id })
export const getPayReceiptList = (params?: any) => http.get('/finance/PayReceipt/index', { params })
export const createPayReceipt = (data: any) => http.post('/finance/PayReceipt/add', data)
export const deletePayReceipt = (id: number) => http.post('/finance/PayReceipt/del', { id })
export const getInvoiceList = (params?: any) => http.get('/finance/Invoice/index', { params })
export const createInvoice = (data: any) => http.post('/finance/Invoice/add', data)
export const deleteInvoice = (id: number) => http.post('/finance/Invoice/del', { id })
export const getStatementList = (params?: any) => http.get('/finance/Statement/index', { params })
export const createStatement = (data: any) => http.post('/finance/Statement/add', data)
export const deleteStatement = (id: number) => http.post('/finance/Statement/del', { id })
export async function getExpenseList(params?: any) {
  const safeParams = { ...(params || {}) }
  if (safeParams.type_name && !safeParams.title) safeParams.title = safeParams.type_name
  delete safeParams.type_name
  return normalizeExpenseResponse(await http.get('/finance/Expense/index', { params: safeParams }))
}
export const createExpense = (data: any) => http.post('/finance/Expense/add', buildExpensePayload(data))
export const deleteExpense = (id: number) => http.post('/finance/Expense/del', { id })
export const getFundList = (params?: any) => http.get('/finance/Fund/index', { params })
export const createFund = (data: any) => http.post('/finance/Fund/add', data)
export const updateFund = (data: any) => http.post('/finance/Fund/edit', data)
export const deleteFund = (id: number) => http.post('/finance/Fund/del', { id })
export const getFundFlowList = (params?: any) => http.get('/finance/FundFlow/index', { params })
export const getCostList = (params?: any) => http.get('/finance/Cost/index', { params })
export const createCost = (data: any) => http.post('/finance/Cost/add', data)
export const deleteCost = (id: number) => http.post('/finance/Cost/del', { id })
