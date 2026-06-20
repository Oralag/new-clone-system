// Translations for src/views/sale/SaleExchange.vue
export default {
  // Export
  exportFileName: 'Exchange Orders',

  // Search
  searchOrderNo: 'Exchange Order No.',
  searchCustomerName: 'Customer Name',
  status: 'Status',
  statusPending: 'Pending',
  statusApproved: 'Approved',
  statusRejected: 'Rejected',

  // Toolbar
  createExchange: 'New Exchange',

  // Expand sections
  expandReturnGoods: 'Returned Products',
  expandExchangeGoods: 'Exchange Products',

  // Expand table columns
  goodsName: 'Product',
  goodsSn: 'SKU',
  spec: 'Spec',
  unit: 'Unit',
  qty: 'Qty',
  taxUnitPrice: 'Unit Price (incl. tax)',
  taxTotal: 'Total (incl. tax)',

  // Main table columns
  seqNo: 'No.',
  orderNo: 'Exchange Order No.',
  customerName: 'Customer',
  exchangeDate: 'Exchange Date',
  handler: 'Handler',
  returnAmount: 'Return Amount',
  exchangeAmount: 'Exchange Amount',
  diffAmount: 'Difference',
  additionalFees: 'Additional Fees',
  reason: 'Reason',
  colStatus: 'Status',
  operation: 'Actions',

  // Fee manage button
  manageFees: 'Manage Fees',
  addFees: '+ Add Fees',

  // Row actions
  view: 'View',
  edit: 'Edit',
  approve: 'Approve',
  reject: 'Reject',
  unapprove: 'Unapprove',
  delete: 'Delete',
  deleteAuditedWarning: 'Please unapprove this exchange order before deleting it.',

  // Form topbar
  back: 'Back',
  viewExchange: 'View Exchange Order',
  editExchange: 'Edit Exchange Order',
  newExchange: 'New Exchange',
  approved: 'Approved',
  save: 'Save',
  saveAndAudit: 'Save & Approve',

  // Form sections
  basicInfo: 'Basic Info',
  returnGoodsSection: 'Returned Products',
  returnGoodsSubtitle: '(Products returned by customer — will be received into stock on approval)',
  exchangeGoodsSection: 'Exchange Products',
  exchangeGoodsSubtitle: '(New products sent to customer — will be shipped out on approval)',
  settlementInfo: 'Settlement',

  // Form fields
  orderNoPlaceholder: '(Auto-generated on save)',
  sourceSaleOrder: 'Source Sale Order',
  sourceNotLinked: 'Not linked',
  reselect: 'Change',
  clear: 'Clear',
  selectSource: 'Select',
  customerRequired: 'Please select a customer',
  selectCustomer: 'Select customer',
  warehouseRequired: 'Please select a warehouse',
  selectWarehouse: 'Select warehouse',
  staffPlaceholder: 'Select or enter handler',
  selectDate: 'Select date',
  exchangeReasonPlaceholder: 'Enter reason for exchange',
  remarkPlaceholder: 'Remark (optional)',

  // Return goods toolbar
  importedFromOrder: 'Imported from source order — adjust qty as needed',
  selectGoods: 'Select Products',
  addManualRow: 'Add Manually',
  goodsCount: '{count} item(s)',
  emptyReturnGoods: 'Please add returned products',
  emptyExchangeGoods: 'Please add exchange products',

  // Exchange goods toolbar
  importFromOutOrder: 'Import from Outbound Order',
  reselectSource: 'Change source: {no}',

  // Table columns (goods detail)
  returnQty: 'Return Qty',
  exchangeQty: 'Exchange Qty',
  remark: 'Remark',
  remarkPlaceholderShort: 'Remark',
  specPlaceholder: 'Spec',

  // Settlement grid
  returnAmountTotal: 'Total Return Amount',
  exchangeAmountTotal: 'Total Exchange Amount',
  diffLabel: 'Difference (Exchange − Return)',
  diffCustomerPay: 'Customer Pays +',
  diffRefundCustomer: 'Refund Customer ',
  freightAmount: 'Freight',
  freightBearer: 'Freight Paid By',
  bearerSeller: 'Seller',
  bearerBuyer: 'Buyer',
  bearerHalf: 'Split 50/50',
  bearerFree: 'Free Shipping',
  additionalFeesLabel: 'Additional Fees',
  addFeeItem: 'Add Fee',

  // Fee types
  feeExpress: 'Express / Logistics',
  feePacking: 'Packaging',
  feeInspection: 'Inspection',
  feeRepair: 'Repair',
  feeToll: 'Toll / Travel',
  feeOther: 'Other',
  feePlaceholder: 'Fee type',
  feeAmountPlaceholder: 'Amount',
  feeBearerUs: 'We Pay',
  feeBearerThem: 'They Pay',
  feePayeePlaceholder: 'Payee',

  // Sale out picker dialog
  saleOutPickerTitle: 'Select Source Sale Outbound Order',
  saleOutSearchPlaceholder: 'Search by order no. / customer',
  colOutOrderNo: 'Outbound Order No.',
  colOutCustomer: 'Customer',
  colOutWarehouse: 'Warehouse',
  colOutAmount: 'Amount',
  colOutDate: 'Date',
  cancelBtn: 'Cancel',
  confirmSelect: 'Confirm',

  // Exchange out picker dialog
  exchangeOutPickerTitle: 'Select Exchange Source Outbound Order',

  // Fee manage dialog
  feeManageTitle: 'Manage Additional Fees',
  feeManageSave: 'Save',
  feeManageSaveSuccess: 'Fees saved successfully',
  feeManageSaveFail: 'Save failed',

  // Manual add dialog
  manualAddReturnTitle: 'Add Returned Product Manually',
  manualAddExchangeTitle: 'Add Exchange Product Manually',
  manualGoodsName: 'Product Name',
  manualGoodsNameRequired: 'Please enter product name',
  manualGoodsNamePlaceholder: 'Enter product name',
  manualGoodsSn: 'SKU',
  manualGoodsSnPlaceholder: 'SKU (optional)',
  manualSpec: 'Spec',
  manualUnit: 'Unit',
  manualUnitPlaceholder: 'e.g. pcs, kg',
  manualQty: 'Qty',
  manualPrice: 'Unit Price (incl. tax)',
  manualConfirm: 'Add',

  // Audit
  auditConfirm: 'Confirm {action} this exchange order?',
  promptTitle: 'Notice',
  auditSuccess: '{action} successful',
  auditLabel1: 'Approve',
  auditLabel0: 'Unapprove',
  auditLabel2: 'Reject',

  // Delete
  deleteConfirm: 'Delete this exchange order?',
  deleteSuccess: 'Deleted successfully',

  // Save
  saveSuccess: 'Saved successfully',
  saveAndAuditSuccess: 'Saved and approved successfully',
}
