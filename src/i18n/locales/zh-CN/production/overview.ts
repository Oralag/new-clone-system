// Translations for src/views/production/Overview.vue (生产总览)
export default {
  // Quick action bar
  btnGenerateBomPlan: '一键生产成品BOM计划',
  btnRefresh: '刷新数据',

  // Stat cards
  statTotalPlans: '生产计划总数',
  statTotalPlansSub: '全部计划',
  statActivePlans: '进行中',
  statActivePlansSub: '待完成计划',
  statDonePlans: '已完成',
  statDonePlansSub: '本月完成',
  statInhouseOrders: '成品入库单',
  statInhouseOrdersSub: '最近30天',

  // Active plans card
  activePlansTitle: '进行中的生产计划',
  activePlansViewAll: '查看全部',
  activePlansEmpty: '暂无进行中的生产计划',
  planTagUrgent: '紧急',
  planTagHigh: '高',
  planProgressSchedule: '排产',
  planProgressInhouse: '入库',
  planDelivery: '交货：',

  // BOM material status card
  bomStatusTitle: 'BOM物料库存状态',
  bomStatusManage: '管理BOM',
  bomStatusLoading: '加载中…',
  bomStatusEmpty: '暂无BOM清单数据',
  bomStatusCanMake: '可生产 {count}',
  bomStatusLack: '物料不足',
  bomStatusMore: '还有 {count} 个产品 →',

  // Recent production inbound card
  recentInhouseTitle: '最近生产入库记录',
  recentInhouseViewAll: '查看全部',
  recentColOrderSn: '入库单号',
  recentColGoodsName: '商品名称',
  recentColQty: '入库数量',
  recentColUnit: '单位',
  recentColWarehouse: '入库仓库',
  recentColDate: '入库日期',
  recentColStatus: '状态',
  statusAudited: '已审核',
  statusRejected: '已驳回',
  statusPending: '待审核',

  // Generate BOM plan dialog
  genDialogTitle: '一键生产成品BOM计划',
  genStep1Title: '选择要生产的产品',
  genSearchPlaceholder: '搜索产品名称…',
  genHintCount: '共 {count} 个有BOM的产品',
  genCanMake: '可生产: {count}',
  genQtyLabel: '数量',
  genProcessPriceLabel: '加工单价',
  genProcessPricePlaceholder: '可不填',
  genProcessPriceUnit: '元',
  genGoodsEmpty: '没有找到有BOM配置的产品',

  genStep2Title: '配置生产参数',
  genFieldFinishedWarehouse: '成品入库仓库',
  genFieldMaterialWarehouse: '原料领料仓库',
  genFieldWarehousePlaceholder: '选择仓库',
  genFieldDate: '计划日期',
  genFieldDatePlaceholder: '选择日期',
  genFieldRemark: '备注',
  genRemarkPlaceholder: '可选备注',

  genPreviewTitle: '生产预览（BOM原料消耗）',
  genPreviewColGoods: '成品',
  genPreviewColQty: '生产数量',
  genPreviewColUnit: '单位',
  genPreviewColProcessPrice: '加工单价',
  genPreviewColMaterials: '消耗原料',
  genPreviewStockLabel: '库存{count}',

  genBtnCancel: '取消',
  genBtnGenerate: '确认一键生成',
  genBtnGenerating: '生成中…',

  // Generate log messages
  genLogStart: '开始生成：{goods} × {qty}',
  genLogPlanCreated: '  ✓ 生产计划已创建（ID: {id}）',
  genLogPlanAudited: '  ✓ 生产计划已审核通过',
  genLogMaterialCreated: '  ✓ 领料单已创建并审核（共 {count} 种原料）',
  genLogMaterialFailed: '  ⚠ 领料失败：{error}（可继续）',
  genLogInhouseCreated: '  ✓ 生产入库单已创建并审核（ID: {id}）',
  genLogItemFailed: '  ✗ 失败：{error}',
  genDoneSuccess: '一键生成完成！',

  // Validation
  msgBomLoading: '请先等待BOM数据加载完毕',
  msgSelectWarehouse: '请选择入库仓库',
  msgSelectMaterialWarehouse: '请选择领料仓库',
  msgLackingStock: '以下产品物料库存不足：{names}，是否继续？',
  msgLackingStockTitle: '库存不足确认',
}
