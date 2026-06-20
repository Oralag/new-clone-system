// Translations for src/views/procure/Return.vue (Purchase Return)
export default {
  exportFileName: 'Purchase Returns',
  exportColReturnNo: 'Return No.',
  exportColOrderSn: 'Linked Order',
  exportColSupplierName: 'Supplier',
  exportColReturnDate: 'Return Date',
  exportColTotalAmount: 'Return Amount',
  exportColStatus: 'Status',
  msgActionSuccess: '{action} succeeded',
  errNoWarehouse: 'No warehouse found, cannot sync stock',
  errNoOrder: 'No linked purchase order found, cannot sync finance',
  errNoOrderFound: 'Linked purchase order not found',

  // List page - search
  searchReturnNo: 'Return No.',
  searchSupplierName: 'Supplier Name',
  searchStatusPlaceholder: 'Status',
  statusPending: 'Pending',
  statusAudited: 'Approved',
  statusRejected: 'Rejected',
  statusUnreconciled: 'Unreconciled',

  // Expand detail
  expandTitle: 'Return Goods Detail',
  colExpandGoodsName: 'Product Name',
  colExpandSpec: 'Spec',
  colExpandUnit: 'Unit',
  colExpandReturnNum: 'Return Qty',
  colExpandPriceWithTax: 'Price (Inc-Tax)',
  colExpandReturnAmount: 'Return Amount',

  // List table columns
  colIndex: 'No.',
  colReturnNo: 'Return No.',
  colLinkedOrder: 'Linked Order',
  colSupplier: 'Supplier',
  colReturnDate: 'Return Date',
  colReturnAmount: 'Return Amount',
  colStatus: 'Status',
  colActions: 'Actions',

  // Status tags
  tagAudited: 'Approved',
  tagRejected: 'Rejected',
  tagPending: 'Pending',

  // Row actions
  actionView: 'View',
  actionReconciled: 'Reconciled',
  actionReconcile: 'Reconcile',

  // Form page - title
  formTitleView: 'View Return',
  formTitleEdit: 'Edit Return',
  formTitleCreate: 'New Return',
  tagAuditedForm: 'Approved',
  btnBack: 'Back',

  // Form - linked order section
  sectionLinkedOrder: 'Linked Purchase Order',
  labelSupplierInfo: 'Supplier:',
  labelWarehouseInfo: 'Warehouse:',
  labelOrderTotal: 'Order Total:',
  labelOrderPaid: 'Amount Paid:',
  labelOrderUnpaid: 'Amount Unpaid:',
  btnReselect: 'Reselect',
  btnSelectOrder: 'Select Purchase Order',
  emptyOrder: '—',

  // Form - goods section
  sectionGoods: 'Return Goods Detail',
  hintSelectOrderFirst: 'Please select a linked purchase order first',
  hintSelectAndFill: 'Check items to return and enter return quantity (cannot exceed purchase quantity)',
  colGoodsName: 'Product Name',
  colSpec: 'Spec',
  colUnit: 'Unit',
  colPurchaseNum: 'Purchase Qty',
  colReturnNum: 'Return Qty',
  colPriceWithTax: 'Price (Inc-Tax)',
  colReturnAmountCol: 'Return Amount',

  // Form - settlement section
  sectionSettle: 'Settlement',
  settleReturnTotal: 'Total Return Amount',
  settleOrderTotal: 'Order Total',
  settleOrderPaid: 'Amount Paid',
  settleOrderUnpaid: 'Amount Unpaid',
  settleDeductPayable: 'Deduct Payable',
  settleRefundAccount: 'Refund to Account',
  settleHint: 'Approval will automatically deduct stock; return amount offsets unpaid first, remainder refunded to fund account',

  // Form - remark section
  labelRemark: 'Remark',
  remarkPlaceholder: 'Return reason (optional)',

  // Order picker dialog
  dialogOrderPickerTitle: 'Select Purchase Order',
  orderPickerSearchPlaceholder: 'Search order no. / supplier',
  colOrderNo: 'Order No.',
  colOrderSupplier: 'Supplier',
  colOrderWarehouse: 'Warehouse',
  colOrderAmount: 'Order Amount',
  colOrderDate: 'Order Date',
  btnCancel: 'Cancel',
  btnConfirmSelect: 'Confirm Select',

  // Validation & messages
  msgSelectOrder: 'Please select a linked purchase order',
  msgSelectGoods: 'Please select at least one product and enter return quantity',
  msgSaveSuccess: 'Saved successfully',
  msgSaveFailed: 'Save failed',
  msgDeleteConfirm: 'Confirm delete this return?',
  msgDeleteSuccess: 'Deleted successfully',
  msgPrompt: 'Prompt',
  msgAuditPrefix: 'Confirm to ',
  msgAuditSuffix: ' this return?',
  msgAuditPassHint: '\nApproval will automatically deduct stock and refund to fund account.',
  msgReverseHint: '\nUnapprove will undo stock and financial changes.',
  actionAuditPass: 'approve',
  actionReject: 'reject',
  actionReverseAudit: 'unapprove',
  msgOperationFailed: 'Operation failed',
}
