// Translations for src/views/finance/FundFlow.vue (Fund Flow)
export default {
  // Page title
  pageTitle: 'Transaction Log',

  // Summary cards (all view)
  summaryBalance: 'Fund Balance',
  summaryBalanceFormula: 'Income ¥{income} − Expense ¥{expense} = ¥{balance}',
  summaryIncome: 'Total Income',
  summaryIncomeDesc: 'Sum of all income entries',
  summaryExpense: 'Total Expense',
  summaryExpenseDesc: 'Sum of all expense entries',
  summaryUnpaid: 'Unpaid',
  summaryUnpaidDesc: 'Source: Accounts Payable + Pending expenses',
  summaryUncollected: 'Uncollected',
  summaryUncollectedDesc: 'Source: Approved sales contract receivables',

  // Income breakdown bar
  incomeBreakdownTotal: 'Total Income',
  incomeBreakdownRetail: 'Retail Income',
  incomeBreakdownSales: 'Sales Collections',
  incomeBreakdownOther: 'Other Income',

  // Expense breakdown bar
  expenseBreakdownTotal: 'Total Expense',
  expenseBreakdownPurchase: 'Purchase Payments',
  expenseBreakdownDelivery: 'Shipping & Delivery',
  expenseBreakdownStore: 'Store Expenses',
  expenseBreakdownOther: 'Other Expenses',

  // Toolbar / filters
  filterKeywordPlaceholder: 'Search name / order no.',
  filterTypePlaceholder: 'Type',
  filterTypeIncome: 'Income',
  filterTypeExpense: 'Expense',
  filterSourcePlaceholder: 'Source',
  dateScopeToday: 'Today',
  tableCount: '{count} records',

  // Table columns
  colDate: 'Date',
  colAccount: 'Account',
  colSource: 'Source',
  colObject: 'Party',
  colOrderNo: 'Order No.',
  colAmount: 'Amount',
  colRemark: 'Remark',

  // Mobile card labels
  mobileAccount: 'Account',
  mobileOrderNo: 'Order No.',
  mobileRemark: 'Remark',
  mobileNoData: 'No transactions',
}
