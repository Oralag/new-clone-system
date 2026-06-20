// Translations for src/views/finance/Overview.vue (财务总览)
export default {
  // Quick action bar
  quickCollect: '快速收款',
  quickPay: '快速付款',

  // Summary cards
  cardFundBalance: '资金余额',
  cardFundBalanceSub: '= 收入 ¥{income} − 支出 ¥{expense}',
  cardTotalIncome: '总资金收入',
  cardTotalIncomeSub: '{count} 笔收入',
  cardTotalExpense: '总资金支出',
  cardTotalExpenseSub: '{count} 笔支出',
  cardPayableTotal: '应付总额',
  cardPayableSub: '{count} 笔欠款',
  cardReceivableTotal: '应收总金额',
  cardReceivableSub: '待收 ¥{amount}',

  // Account balance card
  accountBalance: '账户余额',
  accountBalanceManage: '管理',
  accountTypBank: '银行账户',
  accountTypCash: '现金',
  accountTypThirdParty: '第三方',
  accountTypDefault: '账户',
  accountTotal: '合计',
  accountCount: '{count} 个账户',
  accountNoData: '暂无账户数据',

  // Cash flow trend card
  flowTrend: '收支趋势',
  flowTrendView: '查看流水',
  flowTrendRange7d: '7天',
  flowTrendRange3m: '3个月',
  flowTrendRangeAll: '全部',
  flowTrendIncomeTotal: '收入合计',
  flowTrendExpenseTotal: '支出合计',
  flowTrendNetIn: '净流入',
  flowTrendNetOut: '净流出',
  flowTrendNoData: '暂无收支数据',
  flowTrendAriaLabel: '收支趋势折线图',

  // Trend series names (also used in flowTrendSummary lookup — keep in sync with script)
  trendSeriesSaleCollect: '销售收款',
  trendSeriesRetailIncome: '零售收入',
  trendSeriesPurchaseExpense: '采购支出',
  trendSeriesOtherExpense: '其他支出',

  // Prepay (customer) card
  prepayCustomer: '预收款',
  prepayCustomerMore: '更多',
  prepayCustomerSub: '客户预收',
  prepayCustomerNoData: '暂无预收款',

  // Prepay (supplier) card
  prepaySupplier: '预付款',
  prepaySupplierMore: '更多',
  prepaySupplierSub: '供应商预付',
  prepaySupplierNoData: '暂无预付款',

  // Recent collections card
  recentCollect: '近期收款',
  recentCollectMore: '更多',
  recentCollectRefund: '已退款 ¥{amount}',
  recentCollectNoData: '暂无收款记录',

  // Recent payments card
  recentPay: '近期付款',
  recentPayMore: '更多',
  recentPayRefund: '已退款 ¥{amount}',
  recentPayNoData: '暂无付款记录',

  // Accounts receivable card
  receivable: '应收账款',
  receivableMore: '更多',
  receivableNoData: '暂无应收款',

  // Purchase payables card
  purchasePay: '采购货款',
  purchasePayMore: '更多',
  purchasePayNoData: '暂无采购货款',

  // Sale out orders card
  saleOut: '销售出库单',
  saleOutMore: '更多',
  saleOutNoData: '暂无收款记录',

  // Retail orders card
  retail: '零售单款',
  retailMore: '更多',
  retailWalkIn: '散客',
  retailNoData: '暂无零售单',

  // Fund flow section (collapsible)
  flowSectionTitle: '资金流水明细（{count} 条收支记录）',
  flowColDate: '日期',
  flowColSource: '来源',
  flowColType: '类型',
  flowColTypeIncome: '收入',
  flowColTypeExpense: '支出',
  flowColAmount: '金额',
  flowViewAll: '查看完整流水',

  // Quick collect dialog
  collectDialogTitle: '快速收款',
  collectOcrPlaceholder: '粘贴付款截图文字 / 转账记录，一键识别金额和备注',
  collectOcrBtn: '识别',
  collectFormType: '类型',
  collectTypReceipt: '收款单（客户）',
  collectTypOther: '其他收入',
  collectFormContact: '收款对象',
  collectContactPlaceholder: '选择客户',
  collectFormOtherDesc: '收入说明',
  collectOtherDescPlaceholder: '如：利息收入、赔偿金',
  collectFormFund: '收款账户',
  collectFundPlaceholder: '选择账户',
  collectFundOtherBtn: '其他',
  collectFundNamePlaceholder: '手动输入账户名称',
  collectFormAmount: '收款金额',
  collectFormDate: '收款日期',
  collectFormRemark: '备注',
  collectRemarkPlaceholder: '备注说明',
  collectCancel: '取消',
  collectConfirm: '确认收款',

  // Quick pay dialog
  payDialogTitle: '快速付款',
  payOcrPlaceholder: '粘贴付款截图文字 / 转账记录，一键识别金额和备注',
  payOcrBtn: '识别',
  payFormType: '类型',
  payTypReceipt: '付款单（供应商）',
  payTypOther: '其他支出',
  payFormContact: '付款对象',
  payContactPlaceholder: '选择供应商',
  payFormOtherDesc: '支出说明',
  payOtherDescPlaceholder: '如：办公用品、快递费',
  payFormFund: '付款账户',
  payFundPlaceholder: '选择账户',
  payFundOtherBtn: '其他支出账户',
  payFundNamePlaceholder: '手动输入账户名称',
  payFormAmount: '付款金额',
  payFormDate: '付款日期',
  payFormRemark: '备注',
  payRemarkPlaceholder: '备注说明',
  payCancel: '取消',
  payConfirm: '确认付款',

  // Misc display labels
  multiSupplier: '多供应商',
  chartMonthLabel: '{month}月',
  unitWan: '万',

  // Flow item source labels (shown in fund flow table)
  flowSrcCollect: '收款单',
  flowSrcPrepayReceive: '预收款',
  flowSrcRetail: '零售单',
  flowSrcRecharge: '会员充值',
  flowSrcPurchasePay: '采购付款',
  flowSrcCustomerRefund: '客户退款',
  flowSrcStaffExpense: '员工费用',
  flowSrcOtherExpense: '其他支出',
  flowSrcPay: '付款',
  flowSrcExpense: '费用',
  flowSrcExpensePaid: '费用(已付)',
  flowSrcCustomerPrepay: '客户预收款',
  flowSrcSupplierPrepay: '供应商预付款',
  flowSrcPurchaseReturn: '采购退货退款',

  // ElMessage / validation
  msgCollectAmountRequired: '请输入收款金额',
  msgCollectDescRequired: '请输入收入说明',
  msgPayAmountRequired: '请输入付款金额',
  msgPayDescRequired: '请输入支出说明',
  msgOcrSuccess: '识别完成：金额 ¥{amount}，请确认收款信息',
  msgOcrNoAmount: '未能识别到金额，请手动填写',
  msgPayOcrSuccess: '识别完成：金额 ¥{amount}，请确认付款信息',
  msgPayOcrSuccessExpense: '识别完成：¥{amount}（日常费用，已设为其他支出）',
  msgCollectSaved: '收款记录已保存',
  msgOtherIncomeSaved: '其他收入已保存',
  msgPaySaved: '付款记录已保存',
  msgOtherExpenseSaved: '其他支出已保存',
  msgSaveFailed: '保存失败',
}
