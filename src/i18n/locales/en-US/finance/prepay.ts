export default {
  // Toolbar / search
  searchPlaceholder: 'Customer / Supplier / Order No.',
  typePlaceholder: 'Type',
  typeCustomer: 'Customer Prepayment',
  typeSupplier: 'Supplier Deposit',
  addBtn: 'Add {type}',
  addCustomerPrepay: 'Add Prepayment',
  addSupplierPrepay: 'Add Deposit',

  // Table columns
  index: 'No.',
  orderNo: 'Order No.',
  type: 'Type',
  counterpart: 'Customer / Supplier',
  amount: 'Amount',
  usedAmount: 'Written-off',
  balance: 'Available Balance',
  fundAccount: 'Fund Account',
  date: 'Date',
  handler: 'Handler',
  remark: 'Remark',
  operation: 'Action',

  // Row actions
  reconciled: 'Reconciled',
  reconcile: 'Reconcile',
  deleteDisabledTip: 'Written off — cannot delete',
  delete: 'Delete',

  // Pagination
  totalCount: '{n} records total',

  // Dialog title
  dialogTitleCustomer: 'Add Customer Prepayment',
  dialogTitleSupplier: 'Add Supplier Deposit',

  // Form labels
  formType: 'Type',
  formCustomerName: 'Customer Name',
  formCustomerNamePlaceholder: 'Enter customer name',
  formSupplierName: 'Supplier Name',
  formSupplierNamePlaceholder: 'Enter supplier name',
  formAmount: 'Amount',
  formFundAccount: 'Fund Account',
  formFundAccountPlaceholder: 'Select account',
  formDate: 'Date',
  formRemark: 'Remark',

  // Validation messages
  ruleType: 'Please select a type',
  ruleAmount: 'Please enter an amount',
  ruleFund: 'Please select a fund account',
  ruleDate: 'Please select a date',

  // Action buttons
  cancel: 'Cancel',
  confirm: 'Confirm',

  // Messages
  saveSuccess: 'Recorded successfully — fund account balance updated',
  saveFailed: 'Failed to record',
  recordNotFound: 'Record not found',
  deleteUsedWarning: 'This prepayment has been written off (¥{amount}). Please reverse the write-off first.',
  deleteConfirmMsg: 'Delete this prepayment?\n\nCounterpart: {target}\nAmount: ¥{amount}\n\nThe fund account balance will be reversed on deletion.',
  deleteConfirmTitle: 'Delete Prepayment',
  deleteConfirmBtn: 'Confirm Delete',
  deleteSuccess: 'Deleted — fund account balance reversed',
}
