// Translations for src/views/procure/Return.vue (采购退货)
export default {
  exportFileName: '采购退货单',
  exportColReturnNo: '退货单号',
  exportColOrderSn: '关联采购单',
  exportColSupplierName: '供应商',
  exportColReturnDate: '退货日期',
  exportColTotalAmount: '退货金额',
  exportColStatus: '状态',
  msgActionSuccess: '{action}成功',
  errNoWarehouse: '未找到退货仓库，无法同步库存',
  errNoOrder: '未找到关联采购单，无法同步财务',
  errNoOrderFound: '未找到关联采购单',

  // List page - search
  searchReturnNo: '退货单号',
  searchSupplierName: '供应商名称',
  searchStatusPlaceholder: '状态',
  statusPending: '待审核',
  statusAudited: '已审核',
  statusRejected: '已驳回',
  statusUnreconciled: '未核对',

  // Expand detail
  expandTitle: '退货商品明细',
  colExpandGoodsName: '商品名称',
  colExpandSpec: '规格',
  colExpandUnit: '单位',
  colExpandReturnNum: '退货数量',
  colExpandPriceWithTax: '含税单价',
  colExpandReturnAmount: '退货金额',

  // List table columns
  colIndex: '序号',
  colReturnNo: '退货单号',
  colLinkedOrder: '关联采购单',
  colSupplier: '供应商',
  colReturnDate: '退货日期',
  colReturnAmount: '退货金额',
  colStatus: '状态',
  colActions: '操作',

  // Status tags
  tagAudited: '已审核',
  tagRejected: '已驳回',
  tagPending: '待审核',

  // Row actions
  actionView: '查看',
  actionReconciled: '已核对',
  actionReconcile: '核对',

  // Form page - title
  formTitleView: '查看退货单',
  formTitleEdit: '编辑退货单',
  formTitleCreate: '新增退货单',
  tagAuditedForm: '已审核',
  btnBack: '返回',

  // Form - linked order section
  sectionLinkedOrder: '关联采购订单',
  labelSupplierInfo: '供应商：',
  labelWarehouseInfo: '仓库：',
  labelOrderTotal: '采购总额：',
  labelOrderPaid: '已付款：',
  labelOrderUnpaid: '未付款：',
  btnReselect: '重新选择',
  btnSelectOrder: '选择采购订单',
  emptyOrder: '—',

  // Form - goods section
  sectionGoods: '退货商品明细',
  hintSelectOrderFirst: '请先选择关联的采购订单',
  hintSelectAndFill: '勾选要退货的商品并填写退货数量（不可超过采购数量）',
  colGoodsName: '商品名称',
  colSpec: '规格',
  colUnit: '单位',
  colPurchaseNum: '采购数量',
  colReturnNum: '退货数量',
  colPriceWithTax: '含税单价',
  colReturnAmountCol: '退货金额',

  // Form - settlement section
  sectionSettle: '结算信息',
  settleReturnTotal: '退货金额合计',
  settleOrderTotal: '采购订单总额',
  settleOrderPaid: '已付款金额',
  settleOrderUnpaid: '未付款金额',
  settleDeductPayable: '抵扣应付金额',
  settleRefundAccount: '退回资金账户',
  settleHint: '审核后将自动扣减库存；退货金额优先抵扣未付款，剩余部分退回资金账户',

  // Form - remark section
  labelRemark: '备注',
  remarkPlaceholder: '退货原因（可选）',

  // Order picker dialog
  dialogOrderPickerTitle: '选择采购订单',
  orderPickerSearchPlaceholder: '搜索采购单号/供应商',
  colOrderNo: '采购单号',
  colOrderSupplier: '供应商',
  colOrderWarehouse: '仓库',
  colOrderAmount: '采购金额',
  colOrderDate: '采购日期',
  btnCancel: '取消',
  btnConfirmSelect: '确认选择',

  // Validation & messages
  msgSelectOrder: '请选择关联的采购订单',
  msgSelectGoods: '请至少选择一件商品并填写退货数量',
  msgSaveSuccess: '保存成功',
  msgSaveFailed: '保存失败',
  msgDeleteConfirm: '确定删除该退货单？',
  msgDeleteSuccess: '删除成功',
  msgPrompt: '提示',
  msgAuditPrefix: '确定',
  msgAuditSuffix: '该退货单？',
  msgAuditPassHint: '\n审核后将自动扣减库存并退款至资金账户。',
  msgReverseHint: '\n反审核将撤销库存和财务变动。',
  actionAuditPass: '审核通过',
  actionReject: '驳回',
  actionReverseAudit: '反审核',
  msgOperationFailed: '操作失败',
}
