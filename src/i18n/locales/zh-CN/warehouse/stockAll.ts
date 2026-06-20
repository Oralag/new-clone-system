// Translations for src/views/warehouse/StockAll.vue (库存总览)
export default {
  // Drawer / sidebar
  drawerTitle: '分类筛选',
  sidebarLabel: '分类',
  allWarehouses: '全部仓库',
  allCategories: '全部',
  filterCategory: '分类',

  // Top bar stats
  statNegativeStock: '负库存',
  statGoodsTotal: '商品总数',
  statTotalQty: '总库存',
  statTotalValue: '库存总值',
  statLowStock: '库存不足',
  statZeroStock: '零库存',

  // Status filter
  filterAll: '全部',
  filterLow: '库存不足',
  filterZero: '零库存',
  filterNormal: '正常',

  // Search
  searchPlaceholder: '商品名称/编码',

  // Mobile cards
  mobileEmpty: '暂无数据',
  mobileUnitLabel: '单位',
  mobileStockLabel: '库存',
  btnFlow: '流水',
  btnPurchase: '采购',
  btnSale: '销售',
  colNoCode: '无编码',

  // Table columns
  colIndex: '序号',
  colGoodsName: '商品名称',
  colGoodsSn: '商品编码',
  colCate: '分类',
  colSpec: '规格',
  colUnit: '单位',
  colStock: '库存',
  colStockStatus: '库存状态',
  colAvgPrice: '移动均价',
  colStockValue: '库存货值',
  colInOutRecord: '出入库记录',
  colSafeSetting: '安全库存',
  colFlowBtn: '流水',
  colQuickJump: '快捷跳转',
  btnSet: '设置',

  // In-out record tags
  tagInhouse: '采购入库',
  tagReturn: '退货',
  tagSaleOut: '销售出库',
  tagRetail: '零售',
  tagOtherIn: '其他入库',
  tagOtherOut: '其他出库',
  tagProdIn: '生产入库',
  tagProdOut: '生产领料',
  tagNoRecord: '无记录',
  tagTimes: '次',

  // Stock status labels
  statusNegative: '负库存',
  statusZero: '零库存',
  statusLow: '库存不足',
  statusHigh: '库存过高',
  statusNormal: '正常',

  // Pagination
  pagerTotal: '共 {total} 条',

  // Safe stock dialog
  safeDialogTitle: '设置安全库存',
  fieldSafeMin: '最低库存',
  fieldSafeMax: '最高库存',
  placeholderSafeMin: '低于此值触发不足预警',
  placeholderSafeMax: '0表示不限',
  btnCancel: '取消',
  btnSave: '保存',

  // Flow dialog
  flowDialogTitle: '出入库流水 — {name}',
  flowColType: '类型',
  flowColOrderSn: '单据编号',
  flowColView: '跳转',
  flowColQty: '数量',
  flowColPrice: '单价',
  flowColDate: '日期',
  flowColPartner: '备注/对方',
  btnViewDoc: '查看',
  flowTotalIn: '入库合计：',
  flowTotalOut: '出库合计：',
  flowNetChange: '净变动：',
  flowRecordCount: '共 {count} 笔',
  flowEmpty: '暂无记录',
  btnClose: '关闭',

  // Category form dialog
  cateFormTitleAdd: '新增分类',
  cateFormTitleEdit: '编辑分类',
  fieldCateName: '分类名称',
  fieldCateParent: '上级分类',
  fieldCateSort: '排序',
  placeholderCateName: '请输入分类名称',
  placeholderCateParent: '请选择（可选）',
  btnCateCancel: '取消',
  btnCateConfirm: '确定',

  // Messages
  msgWarnCateName: '请输入分类名称',
  msgWarnDupCate: '同级分类下已存在"{name}"，请使用其他名称',
  msgCateSuccess: '操作成功',
  msgDeleteCateConfirm: '确定删除该分类？',
  msgConfirmTitle: '提示',
  msgSafeSuccess: '设置成功',
  msgSafeFail: '设置失败',

  // Health hint
  healthHint: '正常 {healthy} / 负库存 {neg} / 零库存 {zero} / 不足 {low}',
  scopeAll: '当前范围：全部',
  scopeWarehouse: '仓库：{name}',
  scopeCategory: '分类：{name}',
  scopeKeyword: '关键词：{kw}',
  partnerGuest: '散客',
}
