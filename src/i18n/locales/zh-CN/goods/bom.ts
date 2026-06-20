// Translations for src/views/goods/Bom.vue (BOM清单)
export default {
  // Left panel
  leftPanelTitle: '成品列表',
  btnAddFinishedGoods: '新增成品',
  searchPlaceholder: '搜索成品名称/编码',
  goodsNameEmpty: '（未命名）',
  emptyTip: '暂无成品，点击右上角新增',

  // Right panel
  rightPanelTitle: '物料清单',
  unitLabel: '单位：',
  hintSelectGoods: '← 请从左侧选择成品',
  btnEditGoodsInfo: '编辑成品信息',
  btnAddMaterial: '添加物料',
  btnGotoProcure: '一键采购BOM',
  emptyRight: '从左侧选择一个成品，查看其物料清单',

  // BOM table columns
  colIndex: '序号',
  colMaterialName: '物料名称',
  colMaterialCode: '物料编码',
  colUsage: '用量',
  colUnit: '单位',
  colUnitPrice: '单价',
  colSubtotal: '小计',
  colActions: '操作',
  btnDelete: '删除',
  summaryTotal: '合计',

  // Selection bar
  selectedCount: '已选 {count} 条',
  btnBatchDelete: '批量删除',

  // Cost summary
  costMaterialCount: '物料数：',
  costUnit: '种',
  costTotalLabel: '物料总成本：',

  // BOM dialog
  dialogAddTitle: '新增BOM成品',
  dialogEditTitle: '编辑成品信息',
  fieldSelectExisting: '选已有商品',
  selectExistingPlaceholder: '搜索已有商品自动填入',
  fieldGoodsName: '商品名称',
  goodsNamePlaceholder: '请输入成品名称',
  fieldGoodsSn: '商品编码',
  goodsSnPlaceholder: '如 SP0000001',
  fieldSpec: '规格型号',
  specPlaceholder: '如 250克',
  fieldUnit: '单位',
  unitPlaceholder: '如 袋/盒/瓶',
  btnCancel: '取消',
  btnConfirm: '确定',

  // Material dialog
  matDialogTitle: '添加物料',
  matSearchPlaceholder: '搜索物料名称/编码',
  noMaterial: '无匹配物料',
  selectedItems: '已选 {count} 项',
  btnNextStep: '下一步（已选 {count}）',
  btnBackReselect: '返回重选',
  btnConfirmAdd: '确认添加',
  matColName: '物料名称',
  matColCode: '编码',
  matColUsage: '用量',
  matColUnit: '单位',
  matColUnitPrice: '单价',
  matColSubtotal: '小计',

  // Messages
  msgGoodsNameRequired: '商品名称不能为空',
  msgAddSuccess: '新增成功',
  msgEditSuccess: '修改成功',
  msgSaveFailed: '保存失败',
  msgLoadFailed: '加载失败',
  msgLoadMaterialFailed: '加载物料失败',
  msgLoadGoodsFailed: '加载商品失败',
  msgDeleteSuccess: '删除成功',
  msgCopySuccess: '复制成功',
  msgCopyFailed: '复制失败',
  msgAddMaterialSuccess: '成功添加 {count} 条物料',
  msgAddMaterialFailed: '添加失败',
  msgNoBomItems: '当前BOM无物料',
  msgConfirmDeleteMaterial: '确认删除物料「{name}」？',
  msgConfirmBatchDelete: '确认删除选中的 {count} 条物料？',
  msgConfirmDeleteBom: '确认删除成品「{name}」的所有BOM物料？',
  msgTip: '提示',
}
