export default {
  // Page header
  pageTitle: 'Income & Expense Flow',
  pageSub: 'Only sales order income and purchase order expenditure are counted. Collection receipts, payment receipts, expenses, retail, or other transactions are excluded.',
  refresh: 'Refresh',

  // Summary cards
  salesIncome: 'Sales Income',
  salesOrders: '{n} sales orders',
  purchaseExpense: 'Purchase Expenditure',
  purchaseOrders: '{n} purchase orders',
  netAmount: 'Net Amount',
  netFormula: 'Sales Income − Purchase Expenditure',

  // Toolbar / filters
  searchPlaceholder: 'Search counterpart / order no. / remark',
  flowTypePlaceholder: 'Flow Type',
  flowTypeIncome: 'Income',
  flowTypeExpense: 'Expenditure',
  rangeSeparator: 'to',
  startDate: 'Start Date',
  endDate: 'End Date',
  totalCount: '{n} records total',

  // Table columns
  date: 'Date',
  type: 'Type',
  source: 'Source',
  counterpart: 'Counterpart',
  orderNo: 'Order No.',
  amount: 'Amount',
  status: 'Status',
  remark: 'Remark',
  operation: 'Action',
  view: 'View',

  // Tag labels (rendered from computed)
  income: 'Income',
  expense: 'Expenditure',

  // Data source labels (constructed in JS)
  sourceIncome: 'Sales Order',
  sourceExpense: 'Purchase Order',
  multiSupplier: 'Multiple Suppliers',
  approved: 'Approved',
}
