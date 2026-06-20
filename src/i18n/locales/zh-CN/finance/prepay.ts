export default {
  // Toolbar / search
  searchPlaceholder: '客户名/供应商名/单号',
  typePlaceholder: '类型',
  typeCustomer: '客户预收款',
  typeSupplier: '供应商预付款',
  addBtn: '新增{type}',
  addCustomerPrepay: '新增预收款',
  addSupplierPrepay: '新增预付款',

  // Table columns
  index: '序号',
  orderNo: '单号',
  type: '类型',
  counterpart: '客户/供应商',
  amount: '金额',
  usedAmount: '已核销',
  balance: '剩余可用',
  fundAccount: '入账账户',
  date: '日期',
  handler: '经办人',
  remark: '备注',
  operation: '操作',

  // Row actions
  reconciled: '已核对',
  reconcile: '核对',
  deleteDisabledTip: '已核销，无法删除',
  delete: '删除',

  // Pagination
  totalCount: '共 {n} 条',

  // Dialog title
  dialogTitleCustomer: '新增预收款',
  dialogTitleSupplier: '新增预付款',

  // Form labels
  formType: '类型',
  formCustomerName: '客户名称',
  formCustomerNamePlaceholder: '请输入客户名称',
  formSupplierName: '供应商名称',
  formSupplierNamePlaceholder: '请输入供应商名称',
  formAmount: '金额',
  formFundAccount: '入账账户',
  formFundAccountPlaceholder: '请选择账户',
  formDate: '日期',
  formRemark: '备注',

  // Validation messages
  ruleType: '请选择类型',
  ruleAmount: '请输入金额',
  ruleFund: '请选择入账账户',
  ruleDate: '请选择日期',

  // Action buttons
  cancel: '取消',
  confirm: '确定',

  // Messages
  saveSuccess: '录入成功，已更新账户余额',
  saveFailed: '录入失败',
  recordNotFound: '未找到该记录',
  deleteUsedWarning: '该预付款已核销 ¥{amount}，无法删除。请先撤销相关核销记录',
  deleteConfirmMsg: '确定删除该预付款？\n\n对象：{target}\n金额：¥{amount}\n\n删除后将同步回退资金账户余额',
  deleteConfirmTitle: '删除预付款',
  deleteConfirmBtn: '确定删除',
  deleteSuccess: '删除成功，资金账户余额已回退',
}
