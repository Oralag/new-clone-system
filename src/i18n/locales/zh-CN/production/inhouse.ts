// Translations for src/views/production/Inhouse.vue (生产入库)
export default {
  // Search bar
  searchOrderSn: '入库单号',
  searchGoodsName: '商品名称',
  searchReconcileStatus: '核对状态',
  searchUnreconciled: '未核对',
  btnSearch: '查询',
  btnReset: '重置',
  btnAdd: '新增生产入库',

  // Expand row – cost detail
  expandLoadingCost: '查询领料成本中...',
  expandLoadFailed: '加载失败',
  expandColGoodsName: '商品名称',
  expandColInQty: '入库数量',
  expandColMaterialPrice: '物料单价',
  expandColProcessPrice: '加工单价',
  expandColInPrice: '入库单价',
  expandColTotalCost: '总成本',
  expandMaterialCost: '领料成本：',
  expandTotalCost: '合计成本：',
  expandAvgPrice: '入库均价：',

  // Table columns
  colOrderSn: '入库单号',
  colGoodsName: '商品名称',
  colInQty: '入库数量',
  colUnit: '单位',
  colInCost: '入库成本',
  colWarehouse: '入库仓库',
  colDate: '入库日期',
  colStatus: '状态',
  colActions: '操作',

  // Status tags
  statusAudited: '已审核',
  statusRejected: '已驳回',
  statusPending: '待审核',

  // Row actions
  actionView: '查看',
  actionEdit: '编辑',
  actionAudit: '审核',
  actionReject: '驳回',
  actionUnaudit: '反审核',
  actionReconciled: '已核对',
  actionReconcile: '核对',
  actionDelete: '删除',
  actionDeleteDisabledTip: '请先反审核再删除',

  // Form page – top bar
  formTitleView: '查看生产入库',
  formTitleEdit: '编辑生产入库',
  formTitleAdd: '新增生产入库',
  formBtnBack: '返回',
  formBtnSave: '保存',
  formBtnSaveAndAudit: '保存并审核',

  // Form fields
  fieldPlanOrder: '生产计划单',
  fieldPlanOrderPlaceholder: '请选择生产计划单',
  fieldPlanOrderBtn: '选择生产计划单',
  fieldOrderSn: '入库单号',
  fieldOrderSnPlaceholder: '入库单号（不填写自动生成）',
  fieldInDate: '入库日期',
  fieldWarehouse: '入库仓库',
  fieldWarehousePlaceholder: '请选择仓库',
  fieldBackFlush: '倒冲领料',
  fieldBackFlushOn: '已开启',
  fieldBackFlushOff: '未开启',
  fieldBackFlushDisabledTip: '该计划已有手工领料单，不可倒冲',
  fieldRemark: '备注',

  // Goods list section
  goodsSectionTitle: '商品清单',
  goodsSummaryCost: '成本合计：',
  goodsSummaryInPrice: '入库总价：',
  goodsEmptyText: '请先选择生产计划单',

  // Goods table columns
  colGoodsSn: '商品编码',
  colSpec: '规格型号',
  colPlanNum: '生产数量',
  colAvailableIn: '可入库数量',
  colThisInQty: '本次入库数量',
  colMaterialPrice: '物料单价',
  colMaterialTotal: '物料合计',
  colProcessPrice: '加工单价',
  colProcessTotal: '加工合计',
  colTotalCost: '总成本',
  colInPrice: '入库单价',
  btnBatch: '批量',

  // Plan picker dialog
  planPickerTitle: '选择生产计划单',
  planPickerColSn: '计划单号',
  planPickerColGoodsName: '商品名称',
  planPickerColScheduleNum: '排产数量',
  planPickerColActualNum: '已生产',
  planPickerColFinishDate: '完工日期',
  planPickerColStatus: '状态',

  // Batch set dialog
  batchSetTitle: '批量设置 {label}',
  batchSetCancel: '取消',
  batchSetConfirm: '确定',

  // Batch field labels
  batchLabelNum: '本次入库数量',
  batchLabelMaterialPrice: '物料单价',
  batchLabelMaterialTotal: '物料合计（按数量平摊）',
  batchLabelProcessPrice: '加工单价',
  batchLabelProcessTotal: '加工合计（按数量平摊）',

  // Validation / messages
  msgSelectPlan: '请选择生产计划单',
  msgAddGoods: '请添加商品',
  msgSaveSuccess: '保存成功',
  msgSaveAndAuditSuccess: '保存并审核成功，库存已增加 {count} 项',
  msgSaveFailed: '保存失败',
  msgBackFlushSuccess: '倒冲领料完成，已扣减 {count} 种原材料',
  msgBackFlushFailed: '倒冲领料失败：{error}，请手工补录领料单',
  msgAutoMaterialCost: '已自动带入物料成本：¥{amount}',
  msgAutoMaterialCostSimple: '已自动带入物料成本',
  msgAuditConfirm: '确定{action}该生产入库单？',
  msgAuditTip: '提示',
  msgAuditSuccess: '{action}成功，库存已增加 {count} 项',
  msgUnauditSuccess: '{action}成功，库存已回滚 {count} 项',
  msgActionFailed: '操作失败',
  msgDeleteConfirm: '确定删除该生产入库记录？',
  msgDeleteSuccess: '删除成功',

  // Audit action labels
  auditActionApprove: '审核通过',
  auditActionReject: '驳回',
  auditActionUnaudit: '反审核',

  exportFileName: '生产入库',
}
