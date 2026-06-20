// Translations for src/views/production/Plan.vue (生产计划)
export default {
  // Status filter buttons
  statusAll: '全部',
  statusNotStarted: '待开始',
  statusInProgress: '进行中',
  statusDone: '已完成',

  // Search bar
  searchOrderSn: '生产单号',
  btnSearch: '查询',
  btnReset: '重置',

  // Toolbar
  btnAdd: '新增 (F9)',
  btnDelete: '删除',
  btnExport: '导出',

  // Expand row (goods detail)
  expandColCode: '编码',
  expandColGoodsName: '商品名称',
  expandColSpec: '规格',
  expandColUnit: '单位',
  expandColPlanNum: '计划数量',

  // Table columns
  colIndex: '序号',
  colOrderSn: '生产单号',
  colSaleOrderSn: '销售编号',
  colPlanDate: '开单日期',
  colFinishDate: '交货日期',
  colPriority: '优先级',
  colScheduleNum: '排产数量',
  colPlanNum: '生产数量',
  colInhouseNum: '入库数量',
  colSchedulePct: '排产进度',
  colPlanPct: '生产进度',
  colInhousePct: '入库进度',
  colFlowStatus: '流程状态',
  colActions: '操作',

  // Priority tags
  priorityNormal: '正常',
  priorityHigh: '高',
  priorityUrgent: '紧急',
  priorityLow: '低',

  // Flow step labels
  stepMaterialPending: '待领料',
  stepMaterialDone: '已领料',
  stepInhousePending: '待入库',
  stepInhouseDone: '已入库',

  // Row actions
  actionView: '查看',
  actionEdit: '编辑',
  actionPickMaterial: '领料',
  actionMaterialDone: '已领料✓',
  actionInhouseDone: '已入库✓',
  actionInhouse: '入库',
  actionReconciled: '已核对',
  actionReconcile: '核对',
  actionDelete: '删除',

  // Summary bar
  summaryTotal: '合计',
  summarySchedule: '排产: {value}',
  summaryPlan: '生产: {value}',
  summaryInhouse: '入库: {value}',

  // Pagination
  paginationTotal: '共 {total} 条',

  // Form top bar
  formTitleView: '查看生产计划',
  formTitleEdit: '编辑生产计划',
  formTitleAdd: '新增生产计划',
  formBtnBack: '返回',
  formBtnSave: '保存 (Ctrl+S)',

  // Form fields
  fieldSaleOrder: '关联销售',
  fieldSaleOrderPlaceholder: '销售单号',
  fieldSaleOrderBtn: '选择销售单',
  fieldOrderSn: '生产单号',
  fieldOrderSnPlaceholder: '不填写自动生成',
  fieldPlanDate: '开单日期',
  fieldFinishDate: '交货日期',
  fieldPriority: '优先级',
  fieldRemark: '备注',
  fieldRemarkPlaceholder: '备注（可选）',

  // Goods section
  goodsSectionTitle: '商品清单',
  goodsBtnSelect: '+ 选择商品',
  goodsColCode: '商品编码',
  goodsColName: '商品名称',
  goodsColAttr: '属性',
  goodsColSpec: '规格型号',
  goodsColUnit: '单位',
  goodsColActualNum: '已生产数量',
  goodsColThisNum: '本次生产数量',
  goodsColStock: '库存数量',
  goodsColActions: '操作',
  goodsColBomConsume: 'BOM消耗',
  goodsColDelete: '删除',

  // BOM section
  bomSectionTitle: 'BOM 物料需求',
  bomBtnPickMaterial: '去领料',
  bomLoading: '加载中...',
  bomColMaterialName: '物料名称',
  bomColMaterialSn: '物料编码',
  bomColSpec: '规格',
  bomColUnitUsage: '单位用量',
  bomColNeedQty: '需求数量',
  bomColStock: '库存',
  bomColGap: '缺口',
  bomGapSufficient: '充足',

  // Sale picker dialog
  salePickerTitle: '选择销售单',
  salePickerColOrderSn: '销售单号',
  salePickerColCustomer: '客户',
  salePickerColDate: '日期',
  salePickerColAmount: '金额',
  salePickerBtnCancel: '取消',
  salePickerBtnConfirm: '确认选择',

  // BOM consume dialog
  bomConsumeEmptyTip: '该商品暂未配置BOM清单，请先在「商品 > BOM清单」中添加',
  bomConsumeQtyInfo: '生产数量: {qty}，以下为物料需求：',
  bomConsumeColMaterialName: '物料名称',
  bomConsumeColMaterialSn: '物料编码',
  bomConsumeColUnitUsage: '单位用量',
  bomConsumeColNeedQty: '需求数量',
  bomConsumeColStock: '库存',
  bomConsumeColGap: '缺口',
  bomConsumeSummaryTotal: '合计',
  bomConsumeGapSufficient: '充足',

  // Delete / block messages
  msgCannotDeleteHasMaterial: '该生产计划已有审核通过的领料单，无法直接删除。<br/>请先前往「<b>生产 → 领料管理</b>」对领料单执行<b>反审核</b>，再删除计划。',
  msgCannotDeleteTitle: '无法删除',
  msgCannotDeleteConfirm: '去领料管理',
  msgCannotBatchDeleteHasMaterial: '选中的 {count} 条计划已有审核通过的领料单，无法删除。<br/>请先前往「<b>生产 → 领料管理</b>」对相关领料单执行<b>反审核</b>，再删除计划。',
  msgDeleteConfirm: '确定删除该生产计划？',
  msgDeleteTip: '提示',
  msgDeleteSuccess: '删除成功',
  msgBatchDeleteConfirm: '确定删除选中的 {count} 条记录？',
  msgAddGoods: '请添加商品',
  msgSaveSuccess: '保存成功',
  msgSaveFailed: '{error}',
  msgExportDev: '导出功能开发中',
  msgGetBomFailed: '获取BOM数据失败',
}
