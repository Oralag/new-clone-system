import http from '../http'

function cleanExpenseRemark(remark: any) {
  return String(remark || '')
    .replace(/【待付款】|【已付款】|\[待付款\]|\[已付款\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function detectExpensePaymentStatus(row: any) {
  const explicit = String(row?.payment_status || row?.pay_status || '').toLowerCase()
  if (explicit === 'pending' || explicit === '待付款' || explicit === 'unpaid') return 'pending'
  if (explicit === 'paid' || explicit === '已付款') return 'paid'
  const remark = String(row?.remark || '')
  if (/【已付款】|\[已付款\]/.test(remark)) return 'paid'
  if (/【待付款】|\[待付款\]/.test(remark)) return 'pending'
  return ''
}

function normalizeExpenseRow(row: any) {
  if (!row || typeof row !== 'object') return row
  const typeName = row.type_name || row.title || row.expense_type || row.expense_name || row.name || ''
  const applyDate = row.apply_date || row.expense_date || row.created_at || ''
  const paymentStatus = detectExpensePaymentStatus(row)
  return {
    ...row,
    type_name: typeName,
    title: row.title || typeName,
    expense_type: row.expense_type || typeName,
    apply_date: applyDate,
    expense_date: row.expense_date || applyDate,
    remark_clean: cleanExpenseRemark(row.remark),
    payment_status: paymentStatus,
    payment_status_text: paymentStatus === 'paid' ? '已付款' : paymentStatus === 'pending' ? '待付款' : '未标记',
    payment_status_tag: paymentStatus === 'paid' ? 'success' : paymentStatus === 'pending' ? 'warning' : 'info',
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
  const typeName = String(payload.type_name || payload.title || payload.expense_type || payload.expense_name || payload.name || '').trim()
  const expenseDate = payload.apply_date || payload.expense_date || ''
  const paymentStatus = detectExpensePaymentStatus(payload)
  const cleanRemark = cleanExpenseRemark(payload.remark)
  const remark = paymentStatus === 'paid'
    ? `【已付款】${cleanRemark ? ` ${cleanRemark}` : ''}`
    : paymentStatus === 'pending'
      ? `【待付款】${cleanRemark ? ` ${cleanRemark}` : ''}`
      : cleanRemark

  return {
    name: payload.name || typeName,
    amount: Number(payload.amount || 0),
    expense_date: expenseDate,
    remark,
    order_sn: payload.order_sn || payload.expense_no || '',
    applicant_name: payload.applicant_name || '',
  }
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
export const updateExpense = (data: any) => http.post('/finance/Expense/edit', { id: Number(data?.id || 0), ...buildExpensePayload(data) })
export const deleteExpense = (id: number) => http.post('/finance/Expense/del', { id })
export const getFundList = (params?: any) => http.get('/finance/Fund/index', { params })
export const createFund = (data: any) => http.post('/finance/Fund/add', data)
export const updateFund = (data: any) => http.post('/finance/Fund/edit', data)
export const deleteFund = (id: number) => http.post('/finance/Fund/del', { id })
export const getFundFlowList = (params?: any) => http.get('/finance/FundFlow/index', { params })
export const getCostList = (params?: any) => http.get('/finance/Cost/index', { params })
export const createCost = (data: any) => http.post('/finance/Cost/add', data)
export const deleteCost = (id: number) => http.post('/finance/Cost/del', { id })
