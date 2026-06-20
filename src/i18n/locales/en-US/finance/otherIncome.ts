// Translations for src/views/finance/OtherIncome.vue
export default {
  // ── Export filename ──
  exportFileName: 'OtherIncome',

  // ── Search form ──
  labelNo: 'No.',
  placeholderNo: 'Enter No.',
  labelPayer: 'Payer',
  placeholderPayer: 'Enter payer',
  labelIncomeType: 'Income Type',
  placeholderIncomeType: 'Enter income type',
  placeholderReconcileStatus: 'Reconcile Status',
  optionUnreconciled: 'Unreconciled',

  // ── Toolbar ──
  btnAdd: 'Add',
  summaryCount: 'Count: ',
  summaryTotal: 'Total: ',

  // ── Table columns ──
  colSeq: 'No.',
  colNo: 'No.',
  colDate: 'Date',
  colPayer: 'Payer',
  colIncomeType: 'Income Type',
  colFundAccount: 'Fund Account',
  colAmount: 'Amount',
  colAuditStatus: 'Status',
  colRemark: 'Remark',
  colAction: 'Actions',

  // ── Audit status tags ──
  statusAudited: 'Approved',
  statusPending: 'Pending',

  // ── Row action buttons ──
  btnView: 'View',
  btnReverseAudit: 'Unapprove',
  btnAudit: 'Approve',
  btnReconciled: 'Reconciled',
  btnReconcile: 'Reconcile',
  btnDelete: 'Delete',

  // ── Add dialog ──
  dialogAddTitle: 'Add Other Income',
  labelDocDate: 'Date',
  placeholderDate: 'Select date',
  labelPayerForm: 'Payer',
  placeholderPayerForm: 'e.g. Company Name, John',
  labelIncomeTypeForm: 'Income Type',
  placeholderIncomeTypeForm: 'e.g. Interest, Compensation, Refund',
  labelFundAccountForm: 'Fund Account',
  placeholderFundAccount: 'Select account',
  labelAmountForm: 'Amount',
  labelRemarkForm: 'Remark',
  placeholderRemark: 'Enter remark',
  btnCancel: 'Cancel',
  btnConfirm: 'Confirm',

  // ── View dialog ──
  dialogViewTitle: 'View Other Income',
  btnClose: 'Close',

  // ── Validation messages ──
  ruleDate: 'Please select a date',
  rulePayer: 'Please enter payer',
  ruleAmount: 'Please enter amount',
  ruleFundAccount: 'Please select fund account',

  // ── Toast messages ──
  msgAuditConfirm: 'Confirm {action} this income record?',
  msgAuditTip: 'Notice',
  msgAuditSuccess: '{action} succeeded',
  msgAddSuccess: 'Added successfully',
  msgDeleteConfirm: 'Delete income record for "{name}"?',
  msgDeleteTip: 'Notice',
  msgDeleteSuccess: 'Deleted successfully',
  msgAuditFirst: 'Please unapprove before deleting',

  // ── Import: invalid amount ──
  msgAmountInvalid: 'Invalid amount',
}
