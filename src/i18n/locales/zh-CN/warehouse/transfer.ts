// Translations for src/views/warehouse/Transfer.vue (调拨管理)
export default {
  exportFileName: '调拨单',

  // Search
  searchKeyword: '调拨单号/仓库',
  searchReconcileStatus: '核对状态',
  filterUnreconciled: '未核对',

  // Toolbar
  btnAdd: '新增调拨单',

  // List table columns
  colTransferNo: '调拨单号',
  colAllotDate: '调拨日期',
  colFromWarehouse: '调出仓库',
  colToWarehouse: '调入仓库',
  colTotalAmount: '入库总价',
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
  btnUnaudit: '反审核',
  btnReconciled: '已核对',
  btnReconcile: '核对',
  btnDelete: '删除',
  titleAuditedCannotDelete: '请先反审核再删除',

  // Form page
  formTitleView: '查看调拨单',
  formTitleEdit: '编辑调拨单',
  formTitleAdd: '新增调拨单',
  btnBack: '返回',
  btnSave: '保存（Ctrl+S）',

  // Form fields
  fieldTransferNo: '调拨单号',
  fieldAllotDate: '调拨日期',
  fieldFromWarehouse: '调出仓库',
  fieldToWarehouse: '调入仓库',
  fieldRemark: '备注',
  placeholderTransferNo: '不填写自动生成',
  placeholderFromWarehouse: '调出仓库',
  placeholderToWarehouse: '调入仓库',

  // Goods toolbar
  btnSelectGoods: '选择商品',
  btnAddRow: '手动添加行',
  totalAmountLabel: '入库总价：',

  // Goods table columns
  colIndex: '#',
  colGoodsName: '商品名称',
  colGoodsSn: '商品编码',
  colSpec: '属性',
  colUnit: '商品单位',
  colNum: '数量',
  colBatchNum: '批量',
  colInPrice: '入库单价',
  colInPriceBatch: '批量',
  colInTotal: '入库总金额',
  colStockNum: '库存数量',
  colOutBatchNo: '调出批次号',
  colOutBatchNoBatch: '批量',
  colInBatchNo: '调入批次号',
  colInBatchNoBatch: '批量',
  colItemRemark: '备注',
  placeholderGoodsName: '商品名称',
  placeholderGoodsSn: '编码',
  placeholderOutBatchNo: '调出批次号',
  placeholderInBatchNo: '调入批次号',
  placeholderItemRemark: '备注',
  emptyTableText: '请点击「选择商品」添加明细',

  // Footer summary
  summaryTotal: '合计：',
  summaryNum: '数量',
  summaryTotalAmount: '入库总价',

  // Batch set dialog
  batchSetTitle: '批量设置：{label}',
  btnBatchCancel: '取消',
  btnBatchConfirm: '确定',

  // Audit confirm
  auditLabel: '审核',
  unauditLabel: '反审核',
  msgAuditConfirm: '确定要{action}该调拨单吗？',
  msgConfirmTitle: '提示',
  msgSuccess: '操作成功',
  msgSaveSuccess: '保存成功',
  msgDeleteSuccess: '删除成功',
  msgConfirmDelete: '确定删除该调拨单吗？',

  // Validation
  warnSelectDate: '请选择调拨日期',
  warnSelectFromWarehouse: '请选择调出仓库',
  warnSelectToWarehouse: '请选择调入仓库',
  warnAddGoods: '请添加商品明细',
}
