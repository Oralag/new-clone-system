// Translations for src/views/production/Material.vue (领料管理)
export default {
  // Search bar
  searchOrderSn: '领料单号',
  searchGoodsName: '商品名称',
  searchReconcileStatus: '核对状态',
  searchUnreconciled: '未核对',
  btnSearch: '查询',
  btnReset: '重置',
  btnAdd: '新增领料',

  // Table columns
  colOrderSn: '领料单号',
  colAdminName: '领料人',
  colPickDate: '领料日期',
  colWarehouse: '出库仓库',
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
  actionReturn: '退料',
  actionDelete: '删除',
  actionDeleteDisabledTip: '请先反审核再删除',

  // Form page – top bar
  formTitleView: '查看领料单',
  formTitleEdit: '编辑领料单',
  formTitleAdd: '新增领料单',
  formBtnBack: '返回',
  formBtnSave: '保存',

  // Form fields
  fieldPickDate: '领料日期',
  fieldAdminName: '领料人',
  fieldDefaultWarehouse: '默认仓库',
  fieldWarehousePlaceholder: '选择仓库',
  fieldRelatedPlan: '关联计划',
  fieldPlanPlaceholder: '可选',

  // Goods toolbar
  btnSelectGoods: '选择商品',
  btnAddRow: '手动添加行',
  totalPrice: '领料总价：',

  // Goods table columns
  colGoodsName: '商品名称',
  colGoodsSn: '商品编码',
  colUnit: '单位',
  colOutWarehouse: '出库仓库',
  colWarehousePlaceholder: '选仓库',
  colStock: '库存',
  colPickQty: '领料数量',
  colOutPrice: '出库单价',
  colSubtotal: '小计',
  colRemark: '备注',
  colRemarkPlaceholder: '备注',
  btnBatch: '批量',

  // Footer
  footerTotal: '合计：数量 {qty}  总价 {price}',
  fieldRemark: '备注',

  // Batch set dialog
  batchSetTitle: '批量设置：{label}',
  batchSetCancel: '取消',
  batchSetConfirm: '确定',

  // Return dialog
  returnDialogTitle: '退料',
  returnFieldDate: '退料日期',
  returnFieldWarehouse: '退回仓库',
  returnFieldWarehousePlaceholder: '选择仓库',
  returnFieldReturner: '退料人',
  returnFieldReturnerPlaceholder: '退料人',
  returnColGoodsName: '商品名称',
  returnColGoodsSn: '商品编码',
  returnColUnit: '单位',
  returnColQty: '退料数量',
  returnColInPrice: '入库单价',
  returnColSubtotal: '小计',
  returnColReason: '退料原因',
  returnColReasonPlaceholder: '原因',
  returnTotalPrice: '退料总价：',
  returnFieldRemark: '备注',
  returnBtnCancel: '取消',
  returnBtnSave: '保存',

  // Validation / messages
  msgPickDateRequired: '请选择领料日期',
  msgAddGoods: '请添加商品',
  msgSaveSuccess: '保存成功，库存已扣减 {count} 项',
  msgSaveFailed: '保存失败',
  msgAuditConfirm: '确定{action}该领料单？',
  msgAuditTip: '提示',
  msgAlreadyAudited: '该领料单已审核，无需重复操作',
  msgNotAudited: '该领料单未审核，无法反审核',
  msgAuditSuccess: '审核成功，库存已扣减 {count} 项',
  msgUnauditSuccess: '反审核成功，库存已回滚 {count} 项',
  msgActionSuccess: '操作成功',
  msgActionFailed: '操作失败',
  msgDeleteConfirm: '确定删除？',
  msgDeleteSuccess: '删除成功',
  msgAutoFillGoods: '已自动填入 {count} 种物料',
  msgReturnDateRequired: '请选择退料日期',
  msgReturnWarehouseRequired: '请选择退回仓库',
  msgReturnGoodsRequired: '请添加退料商品',
  msgReturnSaveSuccess: '退料保存成功，库存已恢复',
  msgReturnSaveFailed: '保存失败',
  msgSaveNoId: '保存成功但未获取到领料单ID，无法同步库存',

  // Export file name
  exportFileName: '生产领料',

  // Reconcile toggle (table cell)
  reconcileToggleOn: '已核对',
  reconcileToggleOff: '核对',

  // Row-level validation (used in validateBeforeSave)
  msgValidateMissingInfo: '{row}缺少商品信息',
  msgValidatePickQtyRequired: '{row}的领料数量必须大于0',
  msgValidateWarehouseRequired: '{row}请选择出库仓库',

  // Audit labels (used in doAudit labels record)
  auditLabelApprove: '审核',
  auditLabelReject: '驳回',
  auditLabelUnapprove: '反审核',
}
