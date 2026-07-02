// Translations for src/views/sale/SaleExchange.vue
export default {
  // Export
  exportFileName: '换货单',

  // Search
  searchOrderNo: '换货单号',
  searchCustomerName: '客户名称',
  status: '状态',
  statusPending: '待审核',
  statusApproved: '已审核',
  statusRejected: '已驳回',

  // Toolbar
  createExchange: '新增换货',
  createReissue: '新增补发',
  createDropdown: '新增',

  // Order type (换货 vs 补发)
  colType: '类型',
  typeExchange: '换货',
  typeReissue: '补发',
  typeFilterPlaceholder: '类型',

  // Expand sections
  expandReturnGoods: '退回商品',
  expandExchangeGoods: '换出商品',

  // Expand table columns
  goodsName: '商品名称',
  goodsSn: '编码',
  spec: '规格',
  unit: '单位',
  qty: '数量',
  taxUnitPrice: '含税单价',
  taxTotal: '含税合计',

  // Main table columns
  seqNo: '序号',
  orderNo: '换货单号',
  customerName: '客户名称',
  exchangeDate: '换货日期',
  handler: '经办人',
  returnAmount: '退货金额',
  exchangeAmount: '换出金额',
  diffAmount: '差价',
  additionalFees: '附加费用',
  reason: '换货原因',
  colStatus: '状态',
  operation: '操作',

  // Fee manage button
  manageFees: '管理费用',
  addFees: '+ 补充费用',

  // Row actions
  view: '查看',
  edit: '编辑',
  approve: '审核',
  reject: '驳回',
  unapprove: '反审核',
  delete: '删除',
  deleteAuditedWarning: '请先执行【反审核】，再删除该单据',

  // Form topbar
  back: '返回',
  viewExchange: '查看换货单',
  editExchange: '编辑换货单',
  newExchange: '新增换货',
  viewReissue: '查看补发单',
  editReissue: '编辑补发单',
  newReissue: '新增补发',
  approved: '已审核',
  save: '保存',
  saveAndAudit: '保存并审核',

  // Form sections
  basicInfo: '基本信息',
  returnGoodsSection: '退回商品',
  returnGoodsSubtitle: '（客户退回的商品，审核后入库）',
  exchangeGoodsSection: '换出商品',
  exchangeGoodsSubtitle: '（发给客户的新商品，审核后出库）',
  reissueGoodsSection: '补发商品',
  reissueGoodsSubtitle: '（补发给客户的商品，审核后出库，成本由商家承担）',
  settlementInfo: '结算信息',
  reissueAmountTotal: '补发金额合计',
  reissueAmountHint: '（不计应收，成本由商家承担）',

  // Form fields
  orderNoPlaceholder: '（保存后自动生成）',
  sourceSaleOrder: '原销售单',
  sourceNotLinked: '未关联',
  reselect: '重选',
  clear: '清除',
  selectSource: '选择',
  customerRequired: '请选择客户',
  selectCustomer: '请选择客户',
  warehouseRequired: '请选择仓库',
  selectWarehouse: '请选择仓库',
  staffPlaceholder: '请选择或输入经办人',
  selectDate: '请选择日期',
  exchangeReasonPlaceholder: '请输入换货原因',
  reissueReasonPlaceholder: '请输入补发原因（破损/缺漏等）',
  remarkPlaceholder: '备注（可选）',

  // Return goods toolbar
  importedFromOrder: '已从原销售单导入，调整数量即可',
  selectGoods: '选择商品',
  addManualRow: '手动添加',
  goodsCount: '共 {count} 件',
  emptyReturnGoods: '请添加退回商品',
  emptyExchangeGoods: '请添加换出商品',
  emptyReissueGoods: '请添加补发商品',

  // Exchange goods toolbar
  importFromOutOrder: '从出库单导入',
  reselectSource: '重选来源单：{no}',

  // Table columns (goods detail)
  returnQty: '退货数量',
  exchangeQty: '换出数量',
  remark: '备注',
  remarkPlaceholderShort: '备注',
  specPlaceholder: '规格',

  // Settlement grid
  returnAmountTotal: '退货金额合计',
  exchangeAmountTotal: '换出金额合计',
  diffLabel: '差价（换出−退货）',
  diffCustomerPay: '客户补付 +',
  diffRefundCustomer: '应退客户 ',
  freightAmount: '运费金额',
  freightBearer: '运费承担',
  bearerSeller: '卖方承担',
  bearerBuyer: '买方承担',
  bearerHalf: '各承担一半',
  bearerFree: '免运费',
  additionalFeesLabel: '附加费用',
  addFeeItem: '添加费用项',

  // Fee types
  feeExpress: '快递/物流',
  feePacking: '包装支出',
  feeInspection: '检测费',
  feeRepair: '维修费',
  feeToll: '路费/收费站',
  feeOther: '其他支出',
  feePlaceholder: '费用类型',
  feeAmountPlaceholder: '金额',
  feeBearerUs: '我方承担',
  feeBearerThem: '对方承担',
  feePayeePlaceholder: '收款单位',

  // Sale out picker dialog
  saleOutPickerTitle: '选择原销售出库单',
  saleOutSearchPlaceholder: '搜索出库单号/客户名称',
  colOutOrderNo: '出库单号',
  colOutCustomer: '客户',
  colOutWarehouse: '仓库',
  colOutAmount: '出库金额',
  colOutDate: '出库日期',
  cancelBtn: '取消',
  confirmSelect: '确认选择',

  // Exchange out picker dialog
  exchangeOutPickerTitle: '选择换出来源出库单',

  // Fee manage dialog
  feeManageTitle: '管理附加费用',
  feeManageSave: '保存',
  feeManageSaveSuccess: '费用保存成功',
  feeManageSaveFail: '保存失败',

  // Manual add dialog
  manualAddReturnTitle: '手动添加退回商品',
  manualAddExchangeTitle: '手动添加换出商品',
  manualAddReissueTitle: '手动添加补发商品',
  manualGoodsName: '商品名称',
  manualGoodsNameRequired: '请输入商品名称',
  manualGoodsNamePlaceholder: '请输入商品名称',
  manualGoodsSn: '商品编码',
  manualGoodsSnPlaceholder: '商品编码（可选）',
  manualSpec: '规格',
  manualUnit: '单位',
  manualUnitPlaceholder: '如：个、kg',
  manualQty: '数量',
  manualPrice: '含税单价',
  manualConfirm: '确认添加',

  // Audit
  auditConfirm: '确认{action}此单据吗？',
  promptTitle: '提示',
  auditSuccess: '{action}成功',
  auditLabel1: '审核',
  auditLabel0: '反审核',
  auditLabel2: '驳回',

  // Delete
  deleteConfirm: '确认删除此单据吗？',
  deleteSuccess: '删除成功',

  // Save
  saveSuccess: '保存成功',
  saveAndAuditSuccess: '保存并审核成功',
}
