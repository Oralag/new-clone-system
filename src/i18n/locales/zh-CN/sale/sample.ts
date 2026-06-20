// Translations for src/views/sale/sample.vue
export default {
  // Summary cards
  summarySamples: '样品单',
  summaryPending: '待审核',
  summarySampleCost: '样品费用',
  summaryReceivable: '客户应收',

  // Export
  exportFileName: '样品单',

  // Search placeholders / options
  searchKeyword: '样品单号/客户/运单号',
  searchCustomerName: '客户名称',
  sampleType: '样品类型',
  status: '状态',
  typeFree: '免费',
  typePaid: '收费',
  typeBorrow: '借样',
  statusPending: '待审核',
  statusApproved: '已审核',
  statusRejected: '已驳回',
  statusUnreconciled: '未核对',

  // Toolbar
  createSample: '新增样品单',

  // Expand table columns
  goodsName: '商品名称',
  goodsSn: '编码',
  spec: '规格',
  unit: '单位',
  qty: '数量',
  costUnitPrice: '成本单价',
  remark: '备注',

  // Main table columns
  sampleNo: '样品单号',
  colType: '类型',
  customer: '客户',
  sampleDate: '发样日期',
  warehouse: '仓库',
  freight: '运费',
  receivable: '应收',
  companyCost: '公司费用',
  expenseStatus: '费用状态',
  expensePaid: '已付款',
  expensePending: '待付款',
  trackingNo: '运单号',
  colStatus: '状态',
  operation: '操作',

  // Row buttons
  view: '查看',
  edit: '编辑',
  approve: '审核',
  reject: '驳回',
  unapprove: '反审核',
  reconciled: '已核对',
  reconcile: '核对',
  delete: '删除',

  // Form header
  back: '返回',
  viewSample: '查看样品单',
  editSample: '编辑样品单',
  newSample: '新增样品单',
  approved: '已审核',
  save: '保存',

  // Sections
  basicInfo: '基本信息',
  sampleDetail: '样品明细',
  logisticsSettle: '物流与结算',

  // Form fields
  sampleNoPlaceholder: '保存后自动生成',
  typeFreeSample: '免费样品',
  typePaidSample: '收费样品',
  typeBorrowSample: '借样',
  internalUse: '内部领用',
  customerNamePlaceholder: '可直接录入潜在客户',
  staff: '经办人',
  staffPlaceholder: '请选择或输入经办人',
  expectedReturn: '预计退回',

  // Detail toolbar
  selectGoods: '选择商品',
  addManualRow: '手动添加行',
  rowCount: '共 {count} 行',
  emptyGoods: '请选择样品商品',

  // Detail columns
  chargeUnitPrice: '收费单价',

  // Settlement
  sampleCharge: '样品收费',
  sampleCostLabel: '样品成本',
  freightLabel: '运费',
  freightBearer: '承担方',
  bearerCompany: '公司承担',
  bearerCustomer: '客户承担',
  bearerHalf: '各半',
  bearerFree: '免运费',
  customerReceivable: '客户应收',
  paidAmount: '已收金额',
  receiptFund: '收款账户',
  companyCostLabel: '公司费用',
  expenseStatusLabel: '费用状态',
  expenseFund: '付款账户',
  courier: '快递公司',
  trackingNoLabel: '运单号',
  remarkLabel: '备注',

  // Freight short labels (table)
  freightCompany: '公司',
  freightCustomer: '客户',

  // BOM expand dialog
  bomExpandConfirmContent: '「{name}」有BOM配置，是否展开BOM明细加入样品？\n（礼盒组装选"展开"，普通成品选"不展开"）',
  bomExpandTitle: '展开BOM',
  bomExpandConfirm: '展开',
  bomExpandCancel: '不展开',

  // Internal placeholder
  internalLabel: '内部',

  // Validation messages
  msgPickCustomer: '请选择或填写客户',
  msgPickSampleDate: '请选择发样日期',
  msgPickWarehouse: '请选择仓库',
  msgAddItems: '请添加样品明细',
  msgReceiptFundRequired: '已收金额大于0时请选择收款账户',
  msgExpenseFundRequired: '公司费用已付款时请选择付款账户',
  msgSaveSuccess: '保存成功',

  // Audit
  auditConfirm: '确定{action}该样品单？',
  auditPaidNeedFund: '该样品单已收金额大于0，请先编辑选择收款账户',
  auditExpenseNeedFund: '该样品单费用为已付款，请先编辑选择付款账户',
  promptTitle: '提示',
  msgOpSuccess: '操作成功',

  // Delete
  deleteConfirm: '确定删除该样品单？',
  msgDeleteSuccess: '删除成功',
}
