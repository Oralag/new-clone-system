// Translations for src/views/sale/CustomerLevel.vue (客户等级)
export default {
  // 左侧等级面板
  customerLevel: '客户等级',
  emptyLevels: '暂无等级，点击右上角新增',

  // 右侧价格面板
  levelPricesTitle: '「{name}」等级价格',
  priceHint: '为该等级下各商品设置专属价格，小程序分销商下单时自动套用',
  btnAddGoodsPrice: '添加商品价格',
  priceSearchPlaceholder: '搜索商品名称/编码',
  priceEmpty: '暂无价格设置，点击上方添加',

  // 价格表列
  colIndex: '序号',
  colGoodsSn: '商品编码',
  colGoodsName: '商品名称',
  colUnit: '单位',
  colSellPrice: '系统销售价',
  colDiscount: '折扣',
  colLevelPrice: '等级专属价',
  colAction: '操作',

  // 折扣模式
  discountModePct: '百分比',
  discountModeFold: '折扣',

  // 操作按钮
  btnDelete: '删除',

  // 无选中提示
  noSelectionTip: '请从左侧选择一个等级，设置对应的商品价格',

  // 等级新增/编辑弹框
  dialogAddLevel: '新增等级',
  dialogEditLevel: '编辑等级',
  formLevelName: '等级名称',
  formLevelNamePlaceholder: '如：分销商、批发商',
  formDiscountPct: '折扣百分比',
  formDiscountPlaceholder: '如：90 表示九折',
  formDiscountHint: '1~100，100 = 不打折，90 = 9折',
  formCommissionRate: '佣金比例',
  formCommissionHint: '分销商推广订单的佣金百分比，0 = 不参与分销',
  btnCancel: '取消',
  btnConfirm: '确定',

  // 商品选择器弹框
  dialogPickGoods: '选择商品并设置等级价',
  pickerSearchPlaceholder: '搜索商品名称/编码',
  pickerCatePlaceholder: '商品分类',
  colCate: '分类',
  colPickSellPrice: '销售价',
  pickerSelectedTip: '已选 {count} 件，确认后在价格表里设置具体价格。',
  btnConfirmAdd: '确认添加',

  // 提示消息
  msgInputLevelName: '请输入等级名称',
  msgOperationSuccess: '操作成功',
  msgConfirmDeleteLevel: '确定删除该等级？该等级下的所有商品价格也会一并删除。',
  msgTipTitle: '提示',
  msgDeleteSuccess: '删除成功',
  msgConfirmDeletePrice: '确定删除该商品的等级价格？',
  msgDeleted: '已删除',
  msgAddSuccess: '已添加 {count} 件商品，请在价格表中调整专属价格',

  // 默认商品名兜底
  defaultGoodsName: '商品{id}',
}
