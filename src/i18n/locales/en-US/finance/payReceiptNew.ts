// Translations for src/views/finance/PayReceiptNew.vue
export default {
  // ── Page header ──
  pageTitle: 'New Payment',
  btnBack: 'Back',
  btnSave: 'Save (Ctrl+S)',

  // ── Basic info fields ──
  labelOrderSn: 'Receipt No.',
  placeholderOrderSn: 'Receipt No. (leave blank to auto-generate)',
  labelPayDate: 'Payment Date',
  labelSupplier: 'Supplier',
  placeholderSupplier: 'Select supplier',
  labelPrepay: 'Prepayment',
  labelUnpayAmount: 'Current Payable',

  // ── Payment lines ──
  sectionPayLines: 'Payment',
  colFundAccount: 'Payment Account',
  colAmount: 'Amount',
  placeholderFundAccount: 'Select payment account',
  totalLabel: 'Total',

  // ── Lower fields ──
  labelDiscountAmount: 'Discount Amount',
  placeholderDiscountAmount: 'Discount amount',
  labelTotalAmount: 'Total Amount',
  labelPrepayDeduct: 'Prepayment Deduction',
  notePrepayDeduct: 'Note: Excess will be converted to supplier prepayment automatically',
  labelVerifyType: 'Verification Mode',
  radioManual: 'Manual',
  radioAuto: 'Auto',
  labelRemark: 'Notes',
  placeholderRemark: 'Notes',
  labelAttachment: 'Attachment',
  btnSelectFile: 'Select File',

  // ── Quick add supplier dialog ──
  dialogQuickAddSupplier: 'Quick Add Supplier',
  labelSupplierName: 'Name',
  placeholderSupplierName: 'Enter supplier name',
  btnCancelQuick: 'Cancel',
  btnConfirmQuick: 'Confirm Add',

  // ── Add fund account dialog ──
  dialogAddFund: 'Add Fund Account',
  labelFundName: 'Account Name',
  placeholderFundName: 'Enter account name',
  labelFundBalance: 'Initial Balance',
  btnCancelFund: 'Cancel',
  btnConfirmFund: 'Confirm Add',

  // ── Toast messages ──
  msgSelectSupplier: 'Please select a supplier',
  msgFillAmount: 'Please enter payment amount',
  msgSelectFundAccount: 'Please select a payment account for each line',
  msgSaveMultiSuccess: 'Recorded against {count} purchase orders, {total} payments total',
  msgSaveSuccess: 'Payment receipt saved successfully',
  msgSaveSplitSuccess: 'Split into {count} payments by account',
  msgSaveFailed: 'Save failed',
  msgSupplierNameRequired: 'Please enter a name',
  msgSupplierAddSuccess: 'Added successfully',
  msgFundNameRequired: 'Please enter account name',
  msgFundAddSuccess: 'Fund account added successfully',
}
