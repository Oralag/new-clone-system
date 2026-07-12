// Translations for src/views/sale/sample.vue
export default {
  // Summary cards
  summarySamples: 'Samples',
  summaryPending: 'Pending Approval',
  summarySampleCost: 'Sample Cost',
  summaryReceivable: 'Customer Receivable',

  // Export
  exportFileName: 'Samples',

  // Search placeholders / options
  searchKeyword: 'Sample No. / Customer / Tracking No.',
  searchCustomerName: 'Customer Name',
  sampleType: 'Sample Type',
  status: 'Status',
  typeFree: 'Free',
  typePaid: 'Paid',
  typeBorrow: 'Loan',
  statusPending: 'Pending',
  statusApproved: 'Approved',
  statusRejected: 'Rejected',
  statusUnreconciled: 'Unreconciled',

  // Toolbar
  createSample: 'New Sample',

  // Expand table columns
  goodsName: 'Product',
  goodsSn: 'SKU',
  spec: 'Spec',
  unit: 'Unit',
  qty: 'Qty',
  costUnitPrice: 'Unit Cost',
  remark: 'Notes',

  // Main table columns
  sampleNo: 'Sample No.',
  colType: 'Type',
  customer: 'Customer',
  sampleDate: 'Sample Date',
  warehouse: 'Warehouse',
  freight: 'Freight',
  receivable: 'Receivable',
  companyCost: 'Company Cost',
  expenseStatus: 'Expense Status',
  expensePaid: 'Paid',
  expensePending: 'Unpaid',
  trackingNo: 'Tracking No.',
  colStatus: 'Status',
  operation: 'Actions',

  // Row buttons
  view: 'View',
  edit: 'Edit',
  approve: 'Approve',
  reject: 'Reject',
  unapprove: 'Revoke Approval',
  reconciled: 'Reconciled',
  reconcile: 'Reconcile',
  delete: 'Delete',

  // Form header
  back: 'Back',
  viewSample: 'View Sample',
  editSample: 'Edit Sample',
  newSample: 'New Sample',
  approved: 'Approved',
  save: 'Save',

  // Sections
  basicInfo: 'Basic Info',
  sampleDetail: 'Sample Items',
  logisticsSettle: 'Logistics & Settlement',

  // Form fields
  sampleNoPlaceholder: 'Auto-generated on save',
  typeFreeSample: 'Free Sample',
  typePaidSample: 'Paid Sample',
  typeBorrowSample: 'Loaner Sample',
  internalUse: 'Internal Use',
  customerNamePlaceholder: 'Enter prospect directly',
  staff: 'Handler',
  staffPlaceholder: 'Select or enter handler',
  expectedReturn: 'Expected Return',

  // Detail toolbar
  selectGoods: 'Select Products',
  addManualRow: 'Add Row Manually',
  rowCount: '{count} row(s)',
  emptyGoods: 'Please add sample products',

  // Detail columns
  chargeUnitPrice: 'Charge Unit Price',

  // Settlement
  sampleCharge: 'Sample Charge',
  sampleCostLabel: 'Sample Cost',
  freightLabel: 'Freight',
  freightBearer: 'Paid By',
  bearerCompany: 'Company',
  bearerCustomer: 'Customer',
  bearerHalf: 'Split 50/50',
  bearerFree: 'Free Shipping',
  customerReceivable: 'Customer Receivable',
  paidAmount: 'Received Amount',
  receiptFund: 'Receipt Account',
  companyCostLabel: 'Company Cost',
  expenseStatusLabel: 'Expense Status',
  expenseFund: 'Payment Account',
  courier: 'Courier',
  trackingNoLabel: 'Tracking No.',
  remarkLabel: 'Notes',

  // Freight short labels (table)
  freightCompany: 'Company',
  freightCustomer: 'Customer',

  // BOM expand dialog
  bomExpandConfirmContent: '"{name}" has a BOM. Expand BOM details into the sample?\n(Choose "Expand" for gift box assembly, "Keep" for finished goods.)',
  bomExpandTitle: 'Expand BOM',
  bomExpandConfirm: 'Expand',
  bomExpandCancel: 'Keep',

  // Internal placeholder
  internalLabel: 'Internal',

  // Validation messages
  msgPickCustomer: 'Please select or enter a customer',
  msgPickSampleDate: 'Please select sample date',
  msgPickWarehouse: 'Please select a warehouse',
  msgAddItems: 'Please add sample items',
  msgReceiptFundRequired: 'Please select a receipt account when received amount > 0',
  msgExpenseFundRequired: 'Please select a payment account when expense is paid',
  msgSaveSuccess: 'Saved successfully',

  // Audit
  auditConfirm: 'Confirm {action} this sample order?',
  auditPaidNeedFund: 'Received amount > 0. Please edit and select a receipt account first.',
  auditExpenseNeedFund: 'Expense is marked paid. Please edit and select a payment account first.',
  promptTitle: 'Notice',
  msgOpSuccess: 'Operation successful',

  // Delete
  deleteConfirm: 'Delete this sample order?',
  msgDeleteSuccess: 'Deleted successfully',
}
