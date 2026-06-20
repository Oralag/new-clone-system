// Translations for src/views/sale/SaleReturn.vue (销售退货)
export default {
  // 导出文件名
  exportFileName: '销售退货单',

  // 搜索区
  searchOrderNoPlaceholder: '退货单号',
  searchCustomerNamePlaceholder: '客户名称',
  searchStatusPlaceholder: '状态',
  statusPending: '待审核',
  statusAudited: '已审核',
  statusRejected: '已驳回',
  statusUnreconciled: '未核对',

  // 工具栏
  btnAddReturn: '新增退货',

  // 列表表头
  colIndex: '序号',
  colReturnOrderNo: '退货单号',
  colCustomerName: '客户名称',
  colReturnDate: '退货日期',
  colReturnUser: '退货人',
  colReturnAmount: '退货金额',
  colReason: '退货原因',
  colStatus: '状态',
  colAction: '操作',

  // 展开明细
  expandTitle: '商品明细',
  colGoodsName: '商品名称',
  colGoodsSn: '编码',
  colSpec: '规格',
  colUnit: '单位',
  colQty: '数量',
  colTaxPrice: '含税单价',
  colTaxTotal: '含税合计',
  colRemark: '备注',

  // 行内操作按钮
  btnView: '查看',
  btnEdit: '编辑',
  btnAudit: '审核',
  btnReject: '驳回',
  btnUnaudit: '反审核',
  btnReconciled: '已核对',
  btnReconcile: '核对',
  btnDelete: '删除',
  warnUnauditBeforeDelete: '请先执行【反审核】，再删除该退货单',

  // 表单页头部
  btnBack: '返回',
  formTitleView: '查看退货单',
  formTitleEdit: '编辑退货单',
  formTitleCreate: '新增退货',
  btnSave: '保存',
  saveShortcut: '(Ctrl+S)',
  btnSaveAndAudit: '保存并审核',

  // 关联销售出库单
  secLinkedSaleOut: '关联销售出库单',
  labelCustomer: '客户：',
  labelWarehouse: '仓库：',
  labelOrderTotal: '出库总额：',
  labelCollected: '已收款：',
  btnReselect: '重新选择',
  btnSelectSaleOut: '选择销售出库单',
  emptyDash: '—',

  // 基本信息
  secBasicInfo: '基本信息',
  labelReturnOrderNo: '退货单号',
  returnOrderNoAutoTip: '（保存后自动生成）',
  returnOrderNoAutoPlaceholder: '自动生成',
  labelCustomerName: '客户名称',
  placeholderSelectCustomer: '请选择客户',
  msgSelectCustomer: '请选择客户',
  labelCustomerLevel: '客户等级',
  placeholderLevel: '等级（可选）',
  labelReturnUser: '退货人',
  placeholderReturnUser: '请选择或输入退货人',
  labelReturnDate: '退货日期',
  placeholderDate: '请选择日期',
  labelReason: '退货原因',
  placeholderReason: '请输入退货原因',
  labelWarehouseField: '仓库',
  placeholderSelectWarehouse: '请选择仓库',
  labelNeedInvoice: '是否开票',
  switchYes: '是',
  switchNo: '否',
  labelRemark: '备注',
  placeholderRemark: '请输入备注',
  labelAttachment: '附件',
  btnUploadAttachment: '上传附件',

  // 商品明细
  btnSelectGoods: '选择商品',
  btnAddGoodsManual: '新增商品',
  goodsImportedTip: '已从出库单导入商品，填写退货数量即可',
  goodsCountPrefix: '共',
  goodsCountSuffix: '件商品',
  emptyGoodsTip: '请点击上方按钮添加商品',
  placeholderGoodsName: '商品名称',
  placeholderGoodsSn: '编码',
  placeholderSelectSpec: '请选择规格',
  placeholderSpec: '规格',
  placeholderUnit: '单位',
  colOutQty: '出库数量',
  colReturnQty: '退货数量',
  colNoTaxPrice: '未税单价',
  colTaxRate: '税率(%)',
  colTaxAmount: '税额',
  colTaxPriceShort: '含税单价',
  colTaxTotalShort: '含税合计',
  btnBatch: '批量',
  placeholderRemarkShort: '备注',
  tooltipNoLevelPrice: '此商品无代理价，点击将当前价格记录为固定代理价',
  btnRecordLevelPrice: '记录代理价',

  // 结算信息
  secSettlement: '结算信息',
  labelTotalReturnAmount: '退货金额合计',
  labelDiscountType: '折扣方式',
  discountNone: '无折扣',
  discountAmount: '按金额折扣',
  discountPercent: '按百分比折扣',
  labelDiscountPercent: '折扣(%)',
  labelDiscountAmount: '折扣金额',
  labelActualReturnAmount: '实退金额',
  labelRefundAccount: '退款账户',
  placeholderRefundAccount: '请选择退款账户（可选）',
  summaryTaxTotal: '含税合计：',
  summaryActualReturn: '实退金额：',

  // 弹框：手动新增商品
  dialogManualAddTitle: '新增商品行',
  manualGoodsNamePlaceholder: '请输入商品名称',
  manualGoodsSnPlaceholder: '商品编码（可选）',
  manualSpecPlaceholder: '规格（可选）',
  manualUnitPlaceholder: '如：个、kg',
  manualLabelReturnQty: '退货数量',
  manualLabelTaxPrice: '含税单价',
  btnCancel: '取消',
  btnConfirmAdd: '确认添加',

  // 弹框：批量编辑
  dialogBatchEditTitle: '批量设置 {label}',
  btnConfirm: '确认',

  // 弹框：快速新增客户
  dialogQuickAddCustomerTitle: '快速新增客户',
  quickCustomerNamePlaceholder: '请输入客户名称',
  btnConfirmCreate: '确认创建',

  // 弹框：选择销售出库单
  dialogPickSaleOutTitle: '选择销售出库单',
  saleOutSearchPlaceholder: '搜索出库单号/客户名称',
  colSaleOutOrderSn: '出库单号',
  colPickCustomer: '客户',
  colPickWarehouse: '仓库',
  colOutAmount: '出库金额',
  colOutDate: '出库日期',
  btnConfirmSelect: '确认选择',

  // 字段标签（批量编辑下拉用）
  fieldNum: '退货数量',
  fieldPriceNoTax: '未税单价',
  fieldTaxRate: '税率(%)',
  fieldPrice: '含税单价',

  // 提示/确认
  confirmTitle: '提示',
  confirmDeleteReturn: '确定删除该退货单？',
  msgDeleted: '删除成功',
  confirmAuditAction: '确定{action}该退货单？',
  actionApprove: '审核通过',
  actionReject: '驳回',
  actionUnaudit: '反审核',
  msgActionSuccess: '{action}成功',
  msgActionFailed: '操作失败',

  // 保存流程
  msgRequiredFields: '请填写必填项',
  msgAtLeastOneItem: '请至少添加一件商品',
  msgSaveAndAuditSuccess: '保存并审核成功',
  msgSaveOkAuditFailed: '保存成功，但审核失败：{error}，请手动审核',
  msgSaveSuccess: '保存成功',
  msgSaveFailed: '保存失败',

  // 退款流程
  msgRefundOrderCreated: '客户无欠款，已自动创建退款付款单',

  // 代理价
  msgLevelPriceSaved: '已记录：{name} 代理价 ¥{price}',

  // 批量编辑
  msgBatchSetDone: '已批量设置 {label} 为 {value}',

  // 快速新增客户
  msgCustomerCreated: '客户创建成功',
  msgCreateFailed: '创建失败',

  // 入库标记
  stockInMarker: '销售退货入库#{id}',
  refundRemark: '销售退货退款 {orderNo}',
}
