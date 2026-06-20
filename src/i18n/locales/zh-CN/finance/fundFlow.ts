// Translations for src/views/finance/FundFlow.vue (资金流水)
export default {
  // Page title
  pageTitle: '资金明细',

  // Summary cards (all view)
  summaryBalance: '资金余额',
  summaryBalanceFormula: '收入 ¥{income} − 支出 ¥{expense} = ¥{balance}',
  summaryIncome: '累计收入',
  summaryIncomeDesc: '按所有资金收入明细汇总',
  summaryExpense: '累计支出',
  summaryExpenseDesc: '按所有资金支出明细汇总',
  summaryUnpaid: '未付款',
  summaryUnpaidDesc: '来源：应付账款 + 待付款费用',
  summaryUncollected: '未收款',
  summaryUncollectedDesc: '来源：已审核销售合同应收账款',

  // Income breakdown bar
  incomeBreakdownTotal: '累计收入',
  incomeBreakdownRetail: '零售收入',
  incomeBreakdownSales: '销售收款',
  incomeBreakdownOther: '其他收入',

  // Expense breakdown bar
  expenseBreakdownTotal: '累计支出',
  expenseBreakdownPurchase: '采购支出',
  expenseBreakdownDelivery: '快递运费',
  expenseBreakdownStore: '店面支出',
  expenseBreakdownOther: '其他支出',

  // Toolbar / filters
  filterKeywordPlaceholder: '搜索名称/单号',
  filterTypePlaceholder: '收支类型',
  filterTypeIncome: '收入',
  filterTypeExpense: '支出',
  filterSourcePlaceholder: '来源',
  dateScopeToday: '今日',
  tableCount: '共 {count} 条',

  // Table columns
  colDate: '日期',
  colAccount: '账户',
  colSource: '来源',
  colObject: '对象',
  colOrderNo: '单号',
  colAmount: '金额',
  colRemark: '备注',

  // Mobile card labels
  mobileAccount: '账户',
  mobileOrderNo: '单号',
  mobileRemark: '备注',
  mobileNoData: '暂无资金流水',
}
