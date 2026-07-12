// Translations for src/views/sale/SaleReturn.vue (Sales Return)
export default {
  // Export filename
  exportFileName: 'Sales Return Orders',

  // Search area
  searchOrderNoPlaceholder: 'Return No.',
  searchCustomerNamePlaceholder: 'Customer Name',
  searchStatusPlaceholder: 'Status',
  statusPending: 'Pending',
  statusAudited: 'Approved',
  statusRejected: 'Rejected',
  statusUnreconciled: 'Unreconciled',

  // Toolbar
  btnAddReturn: 'New Return',

  // List columns
  colIndex: 'No.',
  colReturnOrderNo: 'Return No.',
  colCustomerName: 'Customer',
  colReturnDate: 'Return Date',
  colReturnUser: 'Returned By',
  colReturnAmount: 'Return Amount',
  colReason: 'Reason',
  colStatus: 'Status',
  colAction: 'Actions',

  // Expanded detail
  expandTitle: 'Product Details',
  colGoodsName: 'Product',
  colGoodsSn: 'SKU',
  colSpec: 'Spec',
  colUnit: 'Unit',
  colQty: 'Qty',
  colTaxPrice: 'Unit Price (incl. tax)',
  colTaxTotal: 'Total (incl. tax)',
  colRemark: 'Notes',

  // Inline actions
  btnView: 'View',
  btnEdit: 'Edit',
  btnAudit: 'Approve',
  btnReject: 'Reject',
  btnUnaudit: 'Revoke Approval',
  btnReconciled: 'Reconciled',
  btnReconcile: 'Reconcile',
  btnDelete: 'Delete',
  warnUnauditBeforeDelete: 'Please revoke approval before deleting this return order',

  // Form page header
  btnBack: 'Back',
  formTitleView: 'View Return Order',
  formTitleEdit: 'Edit Return Order',
  formTitleCreate: 'New Return',
  btnSave: 'Save',
  saveShortcut: '(Ctrl+S)',
  btnSaveAndAudit: 'Save & Approve',

  // Linked sale-out order
  secLinkedSaleOut: 'Linked Sale-Out Order',
  labelCustomer: 'Customer: ',
  labelWarehouse: 'Warehouse: ',
  labelOrderTotal: 'Order Total: ',
  labelCollected: 'Collected: ',
  btnReselect: 'Reselect',
  btnSelectSaleOut: 'Select Sale-Out Order',
  emptyDash: '—',

  // Basic info
  secBasicInfo: 'Basic Info',
  labelReturnOrderNo: 'Return No.',
  returnOrderNoAutoTip: '(Auto-generated after save)',
  returnOrderNoAutoPlaceholder: 'Auto-generated',
  labelCustomerName: 'Customer',
  placeholderSelectCustomer: 'Please select a customer',
  msgSelectCustomer: 'Please select a customer',
  labelCustomerLevel: 'Customer Level',
  placeholderLevel: 'Level (optional)',
  labelReturnUser: 'Returned By',
  placeholderReturnUser: 'Select or enter handler',
  labelReturnDate: 'Return Date',
  placeholderDate: 'Please select date',
  labelReason: 'Reason',
  placeholderReason: 'Please enter return reason',
  labelWarehouseField: 'Warehouse',
  placeholderSelectWarehouse: 'Please select a warehouse',
  labelNeedInvoice: 'Invoice Required',
  switchYes: 'Yes',
  switchNo: 'No',
  labelRemark: 'Notes',
  placeholderRemark: 'Please enter a remark',
  labelAttachment: 'Attachment',
  btnUploadAttachment: 'Upload',

  // Product detail
  btnSelectGoods: 'Select Products',
  btnAddGoodsManual: 'Add Product',
  goodsImportedTip: 'Products imported from sale-out order. Just enter return quantities.',
  goodsCountPrefix: 'Total',
  goodsCountSuffix: 'item(s)',
  emptyGoodsTip: 'Click the buttons above to add products',
  placeholderGoodsName: 'Product name',
  placeholderGoodsSn: 'SKU',
  placeholderSelectSpec: 'Please select spec',
  placeholderSpec: 'Spec',
  placeholderUnit: 'Unit',
  colOutQty: 'Out Qty',
  colReturnQty: 'Return Qty',
  colNoTaxPrice: 'Unit Price (excl. tax)',
  colTaxRate: 'Tax Rate (%)',
  colTaxAmount: 'Tax Amount',
  colTaxPriceShort: 'Unit Price (incl.)',
  colTaxTotalShort: 'Total (incl.)',
  btnBatch: 'Batch',
  placeholderRemarkShort: 'Notes',
  tooltipNoLevelPrice: 'No agent price for this product. Click to save current price as the fixed agent price.',
  btnRecordLevelPrice: 'Save Agent Price',

  // Settlement
  secSettlement: 'Settlement',
  labelTotalReturnAmount: 'Total Return Amount',
  labelDiscountType: 'Discount Type',
  discountNone: 'No Discount',
  discountAmount: 'By Amount',
  discountPercent: 'By Percentage',
  labelDiscountPercent: 'Discount (%)',
  labelDiscountAmount: 'Discount Amount',
  labelActualReturnAmount: 'Net Refund',
  labelRefundAccount: 'Refund Account',
  placeholderRefundAccount: 'Select refund account (optional)',
  summaryTaxTotal: 'Total (incl. tax): ',
  summaryActualReturn: 'Net Refund: ',

  // Dialog: manual add
  dialogManualAddTitle: 'Add Product Row',
  manualGoodsNamePlaceholder: 'Please enter product name',
  manualGoodsSnPlaceholder: 'Product SKU (optional)',
  manualSpecPlaceholder: 'Spec (optional)',
  manualUnitPlaceholder: 'e.g., pcs, kg',
  manualLabelReturnQty: 'Return Qty',
  manualLabelTaxPrice: 'Unit Price (incl. tax)',
  btnCancel: 'Cancel',
  btnConfirmAdd: 'Add',

  // Dialog: batch edit
  dialogBatchEditTitle: 'Batch Set {label}',
  btnConfirm: 'Confirm',

  // Dialog: quick add customer
  dialogQuickAddCustomerTitle: 'Quick Add Customer',
  quickCustomerNamePlaceholder: 'Please enter customer name',
  btnConfirmCreate: 'Create',

  // Dialog: pick sale-out order
  dialogPickSaleOutTitle: 'Select Sale-Out Order',
  saleOutSearchPlaceholder: 'Search by order no. / customer',
  colSaleOutOrderSn: 'Sale-Out No.',
  colPickCustomer: 'Customer',
  colPickWarehouse: 'Warehouse',
  colOutAmount: 'Amount',
  colOutDate: 'Out Date',
  btnConfirmSelect: 'Confirm',

  // Field labels (for batch edit)
  fieldNum: 'Return Qty',
  fieldPriceNoTax: 'Unit Price (excl. tax)',
  fieldTaxRate: 'Tax Rate (%)',
  fieldPrice: 'Unit Price (incl. tax)',

  // Confirmations / messages
  confirmTitle: 'Notice',
  confirmDeleteReturn: 'Delete this return order?',
  msgDeleted: 'Deleted',
  confirmAuditAction: '{action} this return order?',
  actionApprove: 'Approve',
  actionReject: 'Reject',
  actionUnaudit: 'Revoke Approval',
  msgActionSuccess: '{action} succeeded',
  msgActionFailed: 'Operation failed',

  // Save flow
  msgRequiredFields: 'Please fill in required fields',
  msgAtLeastOneItem: 'Please add at least one product',
  msgSaveAndAuditSuccess: 'Saved and approved successfully',
  msgSaveOkAuditFailed: 'Saved, but approval failed: {error}. Please approve manually.',
  msgSaveSuccess: 'Saved successfully',
  msgSaveFailed: 'Save failed',

  // Refund flow
  msgRefundOrderCreated: 'Customer has no outstanding balance; a refund payment order was created automatically.',

  // Agent price
  msgLevelPriceSaved: 'Saved: {name} agent price ¥{price}',

  // Batch edit
  msgBatchSetDone: 'Batch set {label} to {value}',

  // Quick add customer
  msgCustomerCreated: 'Customer created successfully',
  msgCreateFailed: 'Create failed',

  // Stock-in marker
  stockInMarker: 'Sales Return Stock-In #{id}',
  refundRemark: 'Sales Return Refund {orderNo}',
}
