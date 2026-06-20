// Translations for src/views/warehouse/OtherIn.vue (其他入库)
export default {
  // Search
  searchInNo: '入库单号',
  searchGoodsName: '商品名称',
  searchReconcileStatus: '核对状态',
  filterUnreconciled: '未核对',
  btnSearch: '查询',
  btnReset: '重置',

  // Toolbar
  btnAdd: '新增其他入库',

  // List table columns
  colInNo: '入库单号',
  colInMan: '入库人',
  colInDate: '入库日期',
  colWarehouseName: '入库仓库',
  colTotalPrice: '入库总价',
  colRemark: '备注',
  colStatus: '状态',
  colActions: '操作',

  // Status labels
  statusAudited: '已审核',
  statusRejected: '已驳回',
  statusPending: '待审核',

  // Row actions
  btnView: '查看',
  btnEdit: '编辑',
  btnAudit: '审核',
  btnReject: '驳回',
  btnUnaudit: '反审核',
  btnReconciled: '已核对',
  btnReconcile: '核对',
  btnDelete: '删除',
  titleAuditedCannotDelete: '请先反审核再删除',

  // Form page
  formTitleView: '查看其他入库',
  formTitleEdit: '编辑其他入库',
  formTitleAdd: '新增其他入库',
  btnBack: '返回',
  btnSave: '保存（Ctrl+S）',

  // Form fields
  fieldInNo: '入库单号',
  fieldInMan: '入库人',
  fieldInDate: '入库日期',
  fieldWarehouse: '入库仓库',
  fieldRemark: '备注',
  placeholderInNo: '不填写自动生成',
  placeholderInMan: '入库人',
  placeholderWarehouse: '选择仓库',

  // Goods toolbar
  btnSelectGoods: '选择商品',
  btnAddRow: '手动添加行',
  totalPriceLabel: '入库总价：',

  // Goods table columns
  colIndex: '#',
  colGoodsName: '商品名称',
  colGoodsSn: '商品编码',
  colCate: '分类',
  colSpec: '规格型号',
  colUnit: '单位',
  colNum: '数量',
  colBatchNum: '批量',
  colInPrice: '入库单价',
  colInPriceBatch: '批量',
  colInTotal: '入库总金额',
  colBatchNo: '批次号',
  colWarehouse: '仓库',
  colItemRemark: '备注',
  placeholderGoodsName: '商品名称',
  placeholderGoodsSn: '编码',
  placeholderSpec: '规格',
  placeholderBatchNo: '批次号',
  placeholderWarehouse: '仓库',
  placeholderItemRemark: '备注',
  emptyTableText: '请点击「选择商品」添加明细',

  // Footer summary
  summaryTotal: '合计：',
  summaryNum: '数量',
  summaryTotalPrice: '入库总价',

  // Batch set dialog
  batchSetTitle: '批量设置：{label}',
  btnBatchCancel: '取消',
  btnBatchConfirm: '确定',

  // Audit confirm
  auditLabel: '审核',
  rejectLabel: '驳回',
  unauditLabel: '反审核',
  msgAuditConfirm: '确定要{action}该入库单吗？',
  msgConfirmTitle: '提示',
  msgSuccess: '操作成功',
  msgSaveSuccess: '保存成功',
  msgDeleteSuccess: '删除成功',
  msgConfirmDelete: '确定删除该入库单吗？',

  // Validation
  warnSelectDate: '请选择入库日期',
  warnSelectWarehouse: '请选择入库仓库',
  warnAddGoods: '请添加商品明细',
}
