// Translations for src/views/finance/CollectReceipt.vue (Collection Receipt)
export default {
  // Search bar
  searchReceiptNo: 'Receipt No.',
  searchContactName: 'Recipient',
  searchType: 'Type',
  searchRemarkKw: 'Type/Remark keyword',
  searchDateFrom: 'Start date',
  searchDateTo: 'End date',
  btnRefresh: 'Refresh',
  btnCreate: 'New Receipt',

  // Summary
  summaryFilter: 'Results:',
  summaryCount: 'records',
  summaryTotal: 'Total Collected:',
  summaryNet: 'Net Collection:',

  // Type option labels (value attrs are DB-stored, not translated)
  typeCustomer: 'Customer',
  typeSupplier: 'Supplier',
  typeStaff: 'Staff',
  typeOther: 'Other',
  typePrepay: 'Prepay Top-up',

  // Table columns
  colIndex: 'No.',
  colReceiptNo: 'Receipt No.',
  colType: 'Type',
  colContact: 'Recipient',
  colAmount: 'Amount',
  colRefund: 'Refund',
  colNet: 'Net',
  colAccount: 'Account',
  colDate: 'Date',
  colRemark: 'Remark',
  colActions: 'Actions',

  // Action buttons
  btnOriginalOrder: 'Source',
  btnUnaudit: 'Unapprove',
  btnReconciled: 'Reconciled',
  btnReconcile: 'Reconcile',
  btnDelete: 'Delete',
  labelPrepay: 'Prepay',

  // Create drawer
  drawerTitle: 'New Collection Receipt',
  formContactType: 'Recipient Type',
  ruleContactTypeRequired: 'Please select a type',
  formContact: 'Recipient',
  ruleContactRequired: 'Please select a recipient',
  formContactOther: 'Recipient',
  ruleContactNameRequired: 'Please enter a name',
  formContactPlaceholder: 'Please select',
  formContactOtherPlaceholder: 'Enter recipient name',
  formAmount: 'Amount',
  ruleAmountRequired: 'Please enter an amount',
  formAccount: 'Account',
  formAccountPlaceholder: 'Select account',
  formDate: 'Date',
  formOrderNo: 'Linked Order',
  formOrderNoPlaceholder: 'Order / contract number (optional)',
  formRemark: 'Remark',
  formRemarkPlaceholder: 'Remark',
  btnCancel: 'Cancel',
  btnSave: 'Save',

  // Quick-add contact dialog
  quickAddTitlePrefix: 'Quick Add',
  quickFormName: 'Name',
  quickFormNamePlaceholder: 'Enter name',
  quickBtnCancel: 'Cancel',
  quickBtnConfirm: 'Add',

  // Add fund account dialog
  addFundTitle: 'New Fund Account',
  addFundName: 'Account Name',
  addFundNamePlaceholder: 'Enter account name',
  addFundBalance: 'Opening Balance',
  addFundBtnCancel: 'Cancel',
  addFundBtnConfirm: 'Add',

  // Messages
  msgRequiredFields: 'Please fill in all required fields',
  msgSaveSuccess: 'Saved successfully',
  msgSaveFailed: 'Save failed',
  confirmDeleteTitle: 'Notice',
  confirmDeleteMsg: 'Delete this collection receipt? The corresponding fund account balance will be reversed.',
  msgDeleteSuccess: 'Deleted successfully',
  confirmUnauditTitle: 'Notice',
  confirmUnauditMsg: 'Unapprove this collection receipt? It can be deleted after unapproval.',
  msgUnauditSuccess: 'Unapproved successfully',
  msgQuickAddNameRequired: 'Please enter a name',
  msgQuickAddSuccess: 'Added successfully',
  msgQuickAddFailed: 'Add failed',
  msgAddFundNameRequired: 'Please enter an account name',
  msgAddFundSuccess: 'Account added successfully',
  msgAddFundFailed: 'Add failed',
}
