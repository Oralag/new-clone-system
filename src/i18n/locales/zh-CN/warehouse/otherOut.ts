// Translations for src/views/warehouse/OtherOut.vue (其他出库)
export default {
  // Search
  searchOutNo: '出库单号',
  searchGoodsName: '商品名称',
  searchReconcileStatus: '核对状态',
  filterUnreconciled: '未核对',
  btnSearch: '查询',
  btnReset: '重置',

  // Toolbar
  btnAdd: '新增其他出库',

  // List table columns
  colOutNo: '出库单号',
  colOutMan: '出库人',
  colOutDate: '出库日期',
  colWarehouseName: '出库仓库',
  colTotalPrice: '出库总价',
  colReason: '出库原因',
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
  formTitleView: '查看其他出库',
  formTitleEdit: '编辑其他出库',
  formTitleAdd: '新增其他出库',
  btnBack: '返回',
  btnSave: '保存（Ctrl+S）',

  // Form fields
  fieldOutNo: '出库单号',
  fieldOutMan: '出库人',
  fieldOutDate: '出库日期',
  fieldWarehouse: '出库仓库',
  fieldReason: '出库原因',
  fieldRemark: '备注',
  placeholderOutNo: '不填写自动生成',
  placeholderOutMan: '出库人',
  placeholderWarehouse: '选择仓库',
  placeholderReason: '请输入出库原因',

  // Goods toolbar
  btnSelectGoods: '选择商品',
  btnAddRow: '手动添加行',
  totalPriceLabel: '出库总价：',

  // Goods table columns
  colIndex: '#',
  colGoodsName: '商品名称',
  colGoodsSn: '商品编码',
  colCate: '分类',
  colSpec: '规格型号',
  colUnit: '单位',
  colStockNum: '库存数量',
  colNum: '数量',
  colBatchNum: '批量',
  colOutPrice: '出库单价',
  colOutPriceBatch: '批量',
  colOutTotal: '出库总金额',
  colBatchNo: '批次号',
  colWarehouse: '仓库',
  colItemRemark: '备注',
  placeholderGoodsName: '商品名称',
  placeholderGoodsSn: '编码',
  placeholderSpec: '规格',
  placeholderBatchNo: '批次号',
  placeholderItemRemark: '备注',
  emptyTableText: '请点击「选择商品」添加明细',

  // Footer summary
  summaryTotal: '合计：',
  summaryNum: '数量',
  summaryTotalPrice: '出库总价',

  // Batch set dialog
  batchSetTitle: '批量设置：{label}',
  btnBatchCancel: '取消',
  btnBatchConfirm: '确定',

  // Audit confirm
  auditLabel: '审核',
  rejectLabel: '驳回',
  unauditLabel: '反审核',
  msgAuditConfirm: '确定要{action}该出库单吗？',
  msgConfirmTitle: '提示',
  msgSuccess: '操作成功',
  msgSaveSuccess: '保存成功',
  msgDeleteSuccess: '删除成功',
  msgConfirmDelete: '确定删除该出库单吗？',

  // Validation
  warnSelectDate: '请选择出库日期',
  warnSelectWarehouse: '请选择出库仓库',
  warnAddGoods: '请添加商品明细',
}
