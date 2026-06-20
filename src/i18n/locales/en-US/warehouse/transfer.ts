// Translations for src/views/warehouse/Transfer.vue (Transfer Management)
export default {
  exportFileName: 'Transfer Orders',

  // Search
  searchKeyword: 'Transfer No. / Warehouse',
  searchReconcileStatus: 'Reconcile Status',
  filterUnreconciled: 'Unreconciled',

  // Toolbar
  btnAdd: 'New Transfer',

  // List table columns
  colTransferNo: 'Transfer No.',
  colAllotDate: 'Transfer Date',
  colFromWarehouse: 'From Warehouse',
  colToWarehouse: 'To Warehouse',
  colTotalAmount: 'Total Value',
  colRemark: 'Remark',
  colStatus: 'Status',
  colActions: 'Actions',

  // Status labels
  statusAudited: 'Approved',
  statusRejected: 'Rejected',
  statusPending: 'Pending',

  // Row actions
  btnView: 'View',
  btnEdit: 'Edit',
  btnAudit: 'Approve',
  btnUnaudit: 'Unapprove',
  btnReconciled: 'Reconciled',
  btnReconcile: 'Reconcile',
  btnDelete: 'Delete',
  titleAuditedCannotDelete: 'Unapprove before deleting',

  // Form page
  formTitleView: 'View Transfer',
  formTitleEdit: 'Edit Transfer',
  formTitleAdd: 'New Transfer',
  btnBack: 'Back',
  btnSave: 'Save (Ctrl+S)',

  // Form fields
  fieldTransferNo: 'Transfer No.',
  fieldAllotDate: 'Transfer Date',
  fieldFromWarehouse: 'From Warehouse',
  fieldToWarehouse: 'To Warehouse',
  fieldRemark: 'Remark',
  placeholderTransferNo: 'Auto-generated if left blank',
  placeholderFromWarehouse: 'From warehouse',
  placeholderToWarehouse: 'To warehouse',

  // Goods toolbar
  btnSelectGoods: 'Select Products',
  btnAddRow: 'Add Row Manually',
  totalAmountLabel: 'Total Value: ',

  // Goods table columns
  colIndex: '#',
  colGoodsName: 'Product Name',
  colGoodsSn: 'Product Code',
  colSpec: 'Attributes',
  colUnit: 'Unit',
  colNum: 'Quantity',
  colBatchNum: 'Batch',
  colInPrice: 'Unit Price',
  colInPriceBatch: 'Batch',
  colInTotal: 'Line Total',
  colStockNum: 'Stock Qty',
  colOutBatchNo: 'From Batch No.',
  colOutBatchNoBatch: 'Batch',
  colInBatchNo: 'To Batch No.',
  colInBatchNoBatch: 'Batch',
  colItemRemark: 'Remark',
  placeholderGoodsName: 'Product name',
  placeholderGoodsSn: 'Code',
  placeholderOutBatchNo: 'From batch no.',
  placeholderInBatchNo: 'To batch no.',
  placeholderItemRemark: 'Remark',
  emptyTableText: 'Click "Select Products" to add items',

  // Footer summary
  summaryTotal: 'Total:',
  summaryNum: 'Qty',
  summaryTotalAmount: 'Total Value',

  // Batch set dialog
  batchSetTitle: 'Batch Set: {label}',
  btnBatchCancel: 'Cancel',
  btnBatchConfirm: 'Confirm',

  // Audit confirm
  auditLabel: 'Approve',
  unauditLabel: 'Unapprove',
  msgAuditConfirm: 'Confirm {action} this transfer?',
  msgConfirmTitle: 'Notice',
  msgSuccess: 'Operation succeeded',
  msgSaveSuccess: 'Saved successfully',
  msgDeleteSuccess: 'Deleted successfully',
  msgConfirmDelete: 'Delete this transfer?',

  // Validation
  warnSelectDate: 'Please select a transfer date',
  warnSelectFromWarehouse: 'Please select a source warehouse',
  warnSelectToWarehouse: 'Please select a destination warehouse',
  warnAddGoods: 'Please add at least one product',
}
