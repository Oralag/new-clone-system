import { fmtDt } from './date'

function toNumber(value: any) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function text(value: any) {
  return String(value || '').trim()
}

export function isProductionLaborExpense(row: any) {
  const typeName = text(row?.type_name || row?.title || row?.expense_type || row?.name)
  const remark = text(row?.remark_clean || row?.remark)
  return /加工成本|生产人工成本|人工成本/.test(typeName) || /生产入库加工成本|生产入库人工成本/.test(remark)
}

export function buildExpensePayableRows(expenseRows: any[]) {
  return (expenseRows || [])
    .filter((row: any) => row?.payment_status === 'pending')
    .filter((row: any) => isProductionLaborExpense(row))
    .filter((row: any) => toNumber(row?.amount) > 0)
    .map((row: any) => {
      const amount = toNumber(row.amount)
      const orderNo = text(row.order_sn || row.expense_no) || `FY${row.id || ''}`
      const dueDate = fmtDt(text(row.expense_date || row.apply_date || row.created_at))
      return {
        id: `expense_${row.id}`,
        expense_id: row.id,
        __payable_source: 'expense',
        source_name: '生产成本',
        supplier_id: 0,
        supplier_name: text(row.name || row.type_name) || '加工成本',
        contact_name: text(row.applicant_name || row.admin_name || orderNo) || '生产入库',
        contact_mobile: '',
        prepay: 0,
        order_amount: amount,
        paid_amount: 0,
        un_pay_amount: amount,
        return_amount: 0,
        orders: [{
          order_id: `expense_${row.id}`,
          order_no: orderNo,
          order_amount: amount,
          paid_amount: 0,
          un_pay_amount: amount,
          due_date: dueDate,
          source_name: '生产成本',
          remark: text(row.remark_clean || row.remark),
        }],
      }
    })
}
