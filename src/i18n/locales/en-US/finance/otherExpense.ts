// Translations for src/views/finance/OtherExpense.vue
export default {
  // ── Export filename ──
  exportFileName: 'OtherExpenses',

  // ── Search form ──
  labelNo: 'No.',
  placeholderNo: 'Enter No.',
  labelPayee: 'Payee',
  placeholderPayee: 'Enter payee',
  labelExpenseType: 'Expense Type',
  placeholderExpenseType: 'Enter expense type',
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
  colPayee: 'Payee',
  colExpenseType: 'Expense Type',
  colFundAccount: 'Fund Account',
  colAmount: 'Amount',
  colAuditStatus: 'Status',
  colRemark: 'Notes',
  colAction: 'Actions',

  // ── Audit status tags ──
  statusAudited: 'Approved',
  statusPending: 'Pending',

  // ── Row action buttons ──
  btnView: 'View',
  btnReverseAudit: 'Revoke Approval',
  btnAudit: 'Approve',
  btnReconciled: 'Reconciled',
  btnReconcile: 'Reconcile',
  btnDelete: 'Delete',

  // ── Add dialog ──
  dialogAddTitle: 'Add Other Expense',
  labelDocDate: 'Date',
  placeholderDate: 'Select date',
  labelPayeeForm: 'Payee',
  placeholderPayeeForm: 'e.g. Company Name, John',
  labelExpenseTypeForm: 'Expense Type',
  placeholderExpenseTypeForm: 'e.g. Rent, Labor, Packaging',
  labelFundAccountForm: 'Fund Account',
  placeholderFundAccount: 'Select account',
  labelAmountForm: 'Amount',
  labelRemarkForm: 'Notes',
  placeholderRemark: 'Enter notes',
  btnCancel: 'Cancel',
  btnConfirm: 'Confirm',

  // ── View dialog ──
  dialogViewTitle: 'View Other Expense',
  btnClose: 'Close',

  // ── Validation messages ──
  ruleDate: 'Please select a date',
  rulePayee: 'Please enter payee',
  ruleAmount: 'Please enter amount',
  ruleFundAccount: 'Please select fund account',

  // ── Toast messages ──
  msgAuditConfirm: 'Confirm {action} this expense record?',
  msgAuditTip: 'Notice',
  msgAuditSuccess: '{action} succeeded',
  msgAddSuccess: 'Added successfully',
  msgDeleteConfirm: 'Delete expense record for "{name}"?',
  msgDeleteTip: 'Notice',
  msgDeleteSuccess: 'Deleted successfully',
  msgAuditFirst: 'Please revoke approval before deleting',

  // ── Import: invalid amount ──
  msgAmountInvalid: 'Invalid amount',
}
