// Translations for src/views/finance/Overview.vue (Finance Overview)
export default {
  // Quick action bar
  quickCollect: 'Quick Collection',
  quickPay: 'Quick Payment',

  // Summary cards
  cardFundBalance: 'Fund Balance',
  cardFundBalanceSub: '= Income ¥{income} − Expense ¥{expense}',
  cardTotalIncome: 'Total Income',
  cardTotalIncomeSub: '{count} income entries',
  cardTotalExpense: 'Total Expense',
  cardTotalExpenseSub: '{count} expense entries',
  cardPayableTotal: 'Total Payable',
  cardPayableSub: '{count} outstanding',
  cardReceivableTotal: 'Total Receivable',
  cardReceivableSub: 'Uncollected ¥{amount}',

  // Account balance card
  accountBalance: 'Account Balance',
  accountBalanceManage: 'Manage',
  accountTypBank: 'Bank Account',
  accountTypCash: 'Cash',
  accountTypThirdParty: 'Third-Party',
  accountTypDefault: 'Account',
  accountTotal: 'Total',
  accountCount: '{count} accounts',
  accountNoData: 'No account data',

  // Cash flow trend card
  flowTrend: 'Cash Flow Trend',
  flowTrendView: 'View Transactions',
  flowTrendRange7d: '7 Days',
  flowTrendRange3m: '3 Months',
  flowTrendRangeAll: 'All',
  flowTrendIncomeTotal: 'Total Income',
  flowTrendExpenseTotal: 'Total Expense',
  flowTrendNetIn: 'Net Inflow',
  flowTrendNetOut: 'Net Outflow',
  flowTrendNoData: 'No cash flow data',
  flowTrendAriaLabel: 'Cash flow trend chart',

  // Trend series names (also used in flowTrendSummary lookup — keep in sync with script)
  trendSeriesSaleCollect: 'Sales Collections',
  trendSeriesRetailIncome: 'Retail Income',
  trendSeriesPurchaseExpense: 'Purchase Payments',
  trendSeriesOtherExpense: 'Other Expenses',

  // Prepay (customer) card
  prepayCustomer: 'Customer Prepay',
  prepayCustomerMore: 'More',
  prepayCustomerSub: 'Customer Advance',
  prepayCustomerNoData: 'No customer prepayments',

  // Prepay (supplier) card
  prepaySupplier: 'Supplier Prepay',
  prepaySupplierMore: 'More',
  prepaySupplierSub: 'Supplier Advance',
  prepaySupplierNoData: 'No supplier prepayments',

  // Recent collections card
  recentCollect: 'Recent Collections',
  recentCollectMore: 'More',
  recentCollectRefund: 'Refunded ¥{amount}',
  recentCollectNoData: 'No collection records',

  // Recent payments card
  recentPay: 'Recent Payments',
  recentPayMore: 'More',
  recentPayRefund: 'Refunded ¥{amount}',
  recentPayNoData: 'No payment records',

  // Accounts receivable card
  receivable: 'Accounts Receivable',
  receivableMore: 'More',
  receivableNoData: 'No receivables',

  // Purchase payables card
  purchasePay: 'Purchase Payables',
  purchasePayMore: 'More',
  purchasePayNoData: 'No purchase payables',

  // Sale out orders card
  saleOut: 'Sales Out Orders',
  saleOutMore: 'More',
  saleOutNoData: 'No records',

  // Retail orders card
  retail: 'Retail Orders',
  retailMore: 'More',
  retailWalkIn: 'Walk-in',
  retailNoData: 'No retail orders',

  // Fund flow section (collapsible)
  flowSectionTitle: 'Transaction Detail ({count} entries)',
  flowColDate: 'Date',
  flowColSource: 'Source',
  flowColType: 'Type',
  flowColTypeIncome: 'Income',
  flowColTypeExpense: 'Expense',
  flowColAmount: 'Amount',
  flowViewAll: 'View All Transactions',

  // Quick collect dialog
  collectDialogTitle: 'Quick Collection',
  collectOcrPlaceholder: 'Paste payment screenshot text / transfer record to auto-detect amount and note',
  collectOcrBtn: 'Detect',
  collectFormType: 'Type',
  collectTypReceipt: 'Receipt (Customer)',
  collectTypOther: 'Other Income',
  collectFormContact: 'Collect From',
  collectContactPlaceholder: 'Select customer',
  collectFormOtherDesc: 'Income Description',
  collectOtherDescPlaceholder: 'e.g. Interest income, Compensation',
  collectFormFund: 'Collection Account',
  collectFundPlaceholder: 'Select account',
  collectFundOtherBtn: 'Other',
  collectFundNamePlaceholder: 'Enter account name manually',
  collectFormAmount: 'Amount',
  collectFormDate: 'Collection Date',
  collectFormRemark: 'Remark',
  collectRemarkPlaceholder: 'Add a note',
  collectCancel: 'Cancel',
  collectConfirm: 'Confirm Collection',

  // Quick pay dialog
  payDialogTitle: 'Quick Payment',
  payOcrPlaceholder: 'Paste payment screenshot text / transfer record to auto-detect amount and note',
  payOcrBtn: 'Detect',
  payFormType: 'Type',
  payTypReceipt: 'Payment (Supplier)',
  payTypOther: 'Other Expense',
  payFormContact: 'Pay To',
  payContactPlaceholder: 'Select supplier',
  payFormOtherDesc: 'Expense Description',
  payOtherDescPlaceholder: 'e.g. Office supplies, Shipping fee',
  payFormFund: 'Payment Account',
  payFundPlaceholder: 'Select account',
  payFundOtherBtn: 'Other Account',
  payFundNamePlaceholder: 'Enter account name manually',
  payFormAmount: 'Amount',
  payFormDate: 'Payment Date',
  payFormRemark: 'Remark',
  payRemarkPlaceholder: 'Add a note',
  payCancel: 'Cancel',
  payConfirm: 'Confirm Payment',

  // Misc display labels
  multiSupplier: 'Multiple Suppliers',
  chartMonthLabel: 'M{month}',
  unitWan: 'W',

  // Flow item source labels (shown in fund flow table)
  flowSrcCollect: 'Collection',
  flowSrcPrepayReceive: 'Advance Receipt',
  flowSrcRetail: 'Retail',
  flowSrcRecharge: 'Member Recharge',
  flowSrcPurchasePay: 'Purchase Payment',
  flowSrcCustomerRefund: 'Customer Refund',
  flowSrcStaffExpense: 'Staff Expense',
  flowSrcOtherExpense: 'Other Expense',
  flowSrcPay: 'Payment',
  flowSrcExpense: 'Expense',
  flowSrcExpensePaid: 'Expense (Paid)',
  flowSrcCustomerPrepay: 'Customer Advance',
  flowSrcSupplierPrepay: 'Supplier Advance',
  flowSrcPurchaseReturn: 'Purchase Return Refund',

  // ElMessage / validation
  msgCollectAmountRequired: 'Please enter collection amount',
  msgCollectDescRequired: 'Please enter income description',
  msgPayAmountRequired: 'Please enter payment amount',
  msgPayDescRequired: 'Please enter expense description',
  msgOcrSuccess: 'Detected: ¥{amount} — please verify collection details',
  msgOcrNoAmount: 'Could not detect amount, please enter manually',
  msgPayOcrSuccess: 'Detected: ¥{amount} — please verify payment details',
  msgPayOcrSuccessExpense: 'Detected: ¥{amount} (daily expense — set to Other Expense)',
  msgCollectSaved: 'Collection record saved',
  msgOtherIncomeSaved: 'Other income saved',
  msgPaySaved: 'Payment record saved',
  msgOtherExpenseSaved: 'Other expense saved',
  msgSaveFailed: 'Save failed',
}
