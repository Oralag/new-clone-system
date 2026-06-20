// Translations for src/views/finance/CollectReceipt.vue (收款单)
export default {
  // 搜索栏
  searchReceiptNo: '收款单号',
  searchContactName: '收款对象',
  searchType: '类型',
  searchRemarkKw: '类型/备注关键词',
  searchDateFrom: '开始日期',
  searchDateTo: '结束日期',
  btnRefresh: '刷新',
  btnCreate: '新增收款单',

  // 统计摘要
  summaryFilter: '筛选结果：',
  summaryCount: '笔',
  summaryTotal: '收款合计：',
  summaryNet: '净收款：',

  // 类型选项标签（displayed in UI — value attrs are DB-stored, not translated）
  typeCustomer: '客户',
  typeSupplier: '供应商',
  typeStaff: '员工',
  typeOther: '其他',
  typePrepay: '预付款充值',

  // 表格列
  colIndex: '序号',
  colReceiptNo: '收款单号',
  colType: '类型',
  colContact: '收款对象',
  colAmount: '收款金额',
  colRefund: '退款金额',
  colNet: '净收款',
  colAccount: '收款账户',
  colDate: '收款日期',
  colRemark: '备注',
  colActions: '操作',

  // 操作按钮
  btnOriginalOrder: '原单',
  btnUnaudit: '反审核',
  btnReconciled: '已核对',
  btnReconcile: '核对',
  btnDelete: '删除',
  labelPrepay: '预付款',

  // 新增收款单抽屉
  drawerTitle: '新增收款单',
  formContactType: '收款对象类型',
  ruleContactTypeRequired: '请选择类型',
  formContact: '收款对象',
  ruleContactRequired: '请选择收款对象',
  formContactOther: '收款对象',
  ruleContactNameRequired: '请输入名称',
  formContactPlaceholder: '请选择',
  formContactOtherPlaceholder: '请输入收款对象名称',
  formAmount: '收款金额',
  ruleAmountRequired: '请输入收款金额',
  formAccount: '收款账户',
  formAccountPlaceholder: '请选择账户',
  formDate: '收款日期',
  formOrderNo: '关联单据',
  formOrderNoPlaceholder: '关联订单/合同编号（可选）',
  formRemark: '备注',
  formRemarkPlaceholder: '备注',
  btnCancel: '取消',
  btnSave: '保存',

  // 快速新增联系人弹框
  quickAddTitlePrefix: '快速新增',
  quickFormName: '名称',
  quickFormNamePlaceholder: '请输入名称',
  quickBtnCancel: '取消',
  quickBtnConfirm: '确认新增',

  // 新增资金账户弹框
  addFundTitle: '新增资金账户',
  addFundName: '账户名称',
  addFundNamePlaceholder: '请输入账户名称',
  addFundBalance: '初始余额',
  addFundBtnCancel: '取消',
  addFundBtnConfirm: '确认新增',

  // 消息提示
  msgRequiredFields: '请填写必填项',
  msgSaveSuccess: '保存成功',
  msgSaveFailed: '保存失败',
  confirmDeleteTitle: '提示',
  confirmDeleteMsg: '确定删除该收款单？删除后将回退对应资金账户余额。',
  msgDeleteSuccess: '删除成功',
  confirmUnauditTitle: '提示',
  confirmUnauditMsg: '确定反审核该收款单？反审核后可删除。',
  msgUnauditSuccess: '反审核成功',
  msgQuickAddNameRequired: '请输入名称',
  msgQuickAddSuccess: '新增成功',
  msgQuickAddFailed: '新增失败',
  msgAddFundNameRequired: '请输入账户名称',
  msgAddFundSuccess: '新增账户成功',
  msgAddFundFailed: '新增失败',
}
