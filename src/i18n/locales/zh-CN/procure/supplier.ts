// Translations for src/views/procure/SupplierList.vue (供应商列表)
export default {
  // Category panel
  catePanelTitle: '供应商分类',
  cateSearchPlaceholder: '搜索分类',
  cateAll: '全部',
  cateEmpty: '暂无分类',

  // Search bar
  searchPlaceholder: '名称/手机号',
  btnSearch: '查询',
  btnReset: '重置',

  // Toolbar
  btnAdd: '新增供应商',
  btnImport: '导入',
  btnExport: '导出',

  // Selected bar
  selectedCount: '已选',
  selectedUnit: '条',
  btnClearSelection: '取消选择',
  btnBatchDelete: '批量删除',

  // Table columns
  colSupplierName: '供应商名称',
  colContact: '联系人',
  colMobile: '手机号',
  colCategory: '供应商分类',
  colAddress: '地址',
  colBankAccount: '银行账户',
  colDebt: '欠款',
  colTotalPurchase: '累计采购',
  colActions: '操作',

  // Row actions
  actionView: '查看',
  actionEdit: '编辑',
  actionDelete: '删除',

  // Form dialog titles
  formTitleView: '查看供应商',
  formTitleEdit: '编辑供应商',
  formTitleAdd: '新增供应商',

  // Form labels
  labelSupplierName: '供应商名称',
  supplierNamePlaceholder: '请输入供应商名称',
  supplierNameRequired: '请输入供应商名称',
  labelCategory: '供应商分类',
  categoryPlaceholder: '请选择',
  labelContact: '联系人',
  contactPlaceholder: '请输入',
  labelMobile: '手机号',
  mobilePlaceholder: '请输入',
  labelAddress: '地址',
  addressPlaceholder: '请输入',
  labelRemark: '备注',
  remarkPlaceholder: '请输入',

  // Finance panel (in form)
  financePanelTitle: '往来账目',
  financeDebt: '欠款金额',
  financeTotalPurchase: '累计采购',
  financeTotalPaid: '累计付款',
  financePrepaid: '预付款',

  // Form footer
  createTimeNote: '创建时间：',
  btnClose: '关闭',
  btnStartEdit: '编辑',
  btnConfirm: '确定',

  // Category form dialog
  cateFormTitleAdd: '新增分类',
  cateFormTitleEdit: '编辑分类',
  labelCateName: '分类名称',
  cateNamePlaceholder: '请输入分类名称',
  btnCancel: '取消',
  btnCateConfirm: '确定',

  // Import preview dialog
  dialogImportTitle: '导入预览',
  importPreviewCount: '条，确认后导入。',
  btnImportCancel: '取消',
  btnConfirmImport: '确认导入',

  // Messages
  msgCateNameRequired: '请输入分类名称',
  msgCateOpSuccess: '操作成功',
  msgCateDeleteConfirm: '确定删除该分类？已关联供应商的分类将被清除。',
  msgDeleteSuccess: '删除成功',
  msgDeleteConfirm: '确定删除该供应商吗？',
  msgBatchDeleteConfirmPrefix: '确定删除选中的',
  msgBatchDeleteConfirmSuffix: '个供应商吗？',
  msgBatchDeleteTitle: '批量删除',
  msgBatchDeleteSuccess: '已删除',
  msgBatchDeleteSuccessSuffix: '个供应商',
  msgNoDataExport: '暂无数据可导出',
  msgExportSuccess: '已导出',
  msgExportSuccessSuffix: '条数据',
  msgExcelEmpty: 'Excel文件无数据',
  msgOpSuccess: '操作成功',
  msgOpFailed: '操作失败',
  msgPrompt: '提示',
  msgImportDonePrefix: '导入完成：成功',
  msgImportDoneUnit: '条',
  msgImportDoneFailed: '，失败',
  msgImportNewCate: '自动新建',
  msgImportNewCateSuffix: '个分类',

  exportFilePrefix: '供应商列表_',

  // Export sheet headers (used in handleExport)
  exportSupplierName: '供应商名称',
  exportCategory: '供应商分类',
  exportContact: '联系人',
  exportMobile: '手机号',
  exportAddress: '地址',
  exportBank: '银行账户',
  exportRemark: '备注',
}
