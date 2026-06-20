// Translations for src/views/finance/PayReceiptNew.vue
export default {
  // ── 页面标题 ──
  pageTitle: '新增付款单',
  btnBack: '返回',
  btnSave: '保存 (Ctrl+S)',

  // ── 基本信息字段 ──
  labelOrderSn: '付款单号',
  placeholderOrderSn: '付款单号（留空自动生成）',
  labelPayDate: '付款日期',
  labelSupplier: '供应商',
  placeholderSupplier: '请选择供应商',
  labelPrepay: '预付款',
  labelUnpayAmount: '当前欠款',

  // ── 付款明细 ──
  sectionPayLines: '付款',
  colFundAccount: '付款账户',
  colAmount: '付款金额',
  placeholderFundAccount: '选择付款账户',
  totalLabel: '合计',

  // ── 下方字段 ──
  labelDiscountAmount: '优惠金额',
  placeholderDiscountAmount: '优惠金额',
  labelTotalAmount: '合计金额',
  labelPrepayDeduct: '预付款抵扣',
  notePrepayDeduct: '注意: 多收的金额将会自动转为供应商预付款',
  labelVerifyType: '付款单据核销',
  radioManual: '手动核销',
  radioAuto: '自动核销',
  labelRemark: '备注',
  placeholderRemark: '备注',
  labelAttachment: '附件',
  btnSelectFile: '选择文件',

  // ── 快速新增供应商弹窗 ──
  dialogQuickAddSupplier: '快速新增供应商',
  labelSupplierName: '名称',
  placeholderSupplierName: '请输入供应商名称',
  btnCancelQuick: '取消',
  btnConfirmQuick: '确认新增',

  // ── 新增资金账户弹窗 ──
  dialogAddFund: '新增资金账户',
  labelFundName: '账户名称',
  placeholderFundName: '请输入账户名称',
  labelFundBalance: '初始余额',
  btnCancelFund: '取消',
  btnConfirmFund: '确认新增',

  // ── 消息提示 ──
  msgSelectSupplier: '请选择供应商',
  msgFillAmount: '请填写付款金额',
  msgSelectFundAccount: '请为每一条付款明细选择付款账户',
  msgSaveMultiSuccess: '已按 {count} 张采购单分别记账，共 {total} 笔付款',
  msgSaveSuccess: '付款单保存成功',
  msgSaveSplitSuccess: '已按付款账户拆分保存 {count} 笔付款单',
  msgSaveFailed: '保存失败',
  msgSupplierNameRequired: '请输入名称',
  msgSupplierAddSuccess: '新增成功',
  msgFundNameRequired: '请输入账户名称',
  msgFundAddSuccess: '新增账户成功',
}
