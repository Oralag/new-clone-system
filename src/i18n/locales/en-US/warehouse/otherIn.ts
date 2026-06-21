// Translations for src/views/warehouse/OtherIn.vue (Other Inbound)
export default {
  // Search
  searchInNo: 'Inbound Order No.',
  searchGoodsName: 'Product Name',
  searchReconcileStatus: 'Reconcile Status',
  filterUnreconciled: 'Unreconciled',
  btnSearch: 'Search',
  btnReset: 'Reset',

  // Toolbar
  btnAdd: 'New Other Inbound',

  // List table columns
  colInNo: 'Inbound No.',
  colInMan: 'Received By',
  colInDate: 'Inbound Date',
  colWarehouseName: 'Warehouse',
  colTotalPrice: 'Total Value',
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
  btnReject: 'Reject',
  btnUnaudit: 'Unapprove',
  btnReconciled: 'Reconciled',
  btnReconcile: 'Reconcile',
  btnDelete: 'Delete',
  titleAuditedCannotDelete: 'Unapprove before deleting',

  // Form page
  formTitleView: 'View Other Inbound',
  formTitleEdit: 'Edit Other Inbound',
  formTitleAdd: 'New Other Inbound',
  btnBack: 'Back',
  btnSave: 'Save (Ctrl+S)',

  // Form fields
  fieldInNo: 'Inbound No.',
  fieldInMan: 'Received By',
  fieldInDate: 'Inbound Date',
  fieldWarehouse: 'Warehouse',
  fieldRemark: 'Remark',
  placeholderInNo: 'Auto-generated if left blank',
  placeholderInMan: 'Received by',
  placeholderWarehouse: 'Select warehouse',

  // Goods toolbar
  btnSelectGoods: 'Select Products',
  btnAddRow: 'Add Row Manually',
  totalPriceLabel: 'Total Value: ',

  // Goods table columns
  colIndex: '#',
  colGoodsName: 'Product Name',
  colGoodsSn: 'Product Code',
  colCate: 'Category',
  colSpec: 'Spec / Model',
  colUnit: 'Unit',
  colNum: 'Quantity',
  colBatchNum: 'Batch',
  colInPrice: 'Unit Price',
  colInPriceBatch: 'Batch',
  colInTotal: 'Line Total',
  colBatchNo: 'Batch No.',
  colWarehouse: 'Warehouse',
  colItemRemark: 'Remark',
  placeholderGoodsName: 'Product name',
  placeholderGoodsSn: 'Code',
  placeholderSpec: 'Spec',
  placeholderBatchNo: 'Batch No.',
  placeholderItemRemark: 'Remark',
  emptyTableText: 'Click "Select Products" to add items',

  // Footer summary
  summaryTotal: 'Total:',
  summaryNum: 'Qty',
  summaryTotalPrice: 'Total Value',

  // Batch set dialog
  batchSetTitle: 'Batch Set: {label}',
  btnBatchCancel: 'Cancel',
  btnBatchConfirm: 'Confirm',

  // Audit confirm
  auditLabel: 'Approve',
  rejectLabel: 'Reject',
  unauditLabel: 'Unapprove',
  msgAuditConfirm: 'Confirm {action} this inbound order?',
  msgConfirmTitle: 'Notice',
  msgSuccess: 'Operation succeeded',
  msgSaveSuccess: 'Saved successfully',
  msgDeleteSuccess: 'Deleted successfully',
  msgConfirmDelete: 'Delete this inbound order?',

  // Validation
  warnSelectDate: 'Please select an inbound date',
  warnSelectWarehouse: 'Please select a warehouse',
  warnAddGoods: 'Please add at least one product',
}
