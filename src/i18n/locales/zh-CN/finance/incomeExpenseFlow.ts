export default {
  // Page header
  pageTitle: '收支流水',
  pageSub: '仅统计销售订单收入与采购订单支出，不包含收款单、付款单、费用、零售或其他流水。',
  refresh: '刷新',

  // Summary cards
  salesIncome: '销售收入',
  salesOrders: '{n} 笔销售订单',
  purchaseExpense: '采购支出',
  purchaseOrders: '{n} 笔采购订单',
  netAmount: '收支净额',
  netFormula: '销售收入 - 采购支出',

  // Toolbar / filters
  searchPlaceholder: '搜索对象/单号/备注',
  flowTypePlaceholder: '收支类型',
  flowTypeIncome: '收入',
  flowTypeExpense: '支出',
  rangeSeparator: '至',
  startDate: '开始日期',
  endDate: '结束日期',
  totalCount: '共 {n} 条',

  // Table columns
  date: '日期',
  type: '类型',
  source: '来源单据',
  counterpart: '对象',
  orderNo: '单号',
  amount: '金额',
  status: '状态',
  remark: '备注',
  operation: '操作',
  view: '查看',

  // Tag labels (rendered from computed)
  income: '收入',
  expense: '支出',

  // Data source labels (constructed in JS)
  sourceIncome: '销售订单',
  sourceExpense: '采购订单',
  multiSupplier: '多供应商',
  approved: '已审核',
}
