// Translations for src/views/warehouse/OtherOut.vue (Other Outbound)
export default {
  // Search
  searchOutNo: 'Outbound Order No.',
  searchGoodsName: 'Product Name',
  searchReconcileStatus: 'Reconcile Status',
  filterUnreconciled: 'Unreconciled',
  btnSearch: 'Search',
  btnReset: 'Reset',

  // Toolbar
  btnAdd: 'New Other Outbound',

  // List table columns
  colOutNo: 'Outbound No.',
  colOutMan: 'Issued By',
  colOutDate: 'Outbound Date',
  colWarehouseName: 'Warehouse',
  colTotalPrice: 'Total Value',
  colReason: 'Reason',
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
  formTitleView: 'View Other Outbound',
  formTitleEdit: 'Edit Other Outbound',
  formTitleAdd: 'New Other Outbound',
  btnBack: 'Back',
  btnSave: 'Save (Ctrl+S)',

  // Form fields
  fieldOutNo: 'Outbound No.',
  fieldOutMan: 'Issued By',
  fieldOutDate: 'Outbound Date',
  fieldWarehouse: 'Warehouse',
  fieldReason: 'Reason',
  fieldRemark: 'Remark',
  placeholderOutNo: 'Auto-generated if left blank',
  placeholderOutMan: 'Issued by',
  placeholderWarehouse: 'Select warehouse',
  placeholderReason: 'Enter reason',

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
  colStockNum: 'Stock Qty',
  colNum: 'Quantity',
  colBatchNum: 'Batch',
  colOutPrice: 'Unit Price',
  colOutPriceBatch: 'Batch',
  colOutTotal: 'Line Total',
  colBatchNo: 'Batch No.',
  colWarehouse: 'Warehouse',
  colItemRemark: 'Remark',
  placeholderGoodsName: 'Product name',
  placeholderGoodsSn: 'Code',
  placeholderSpec: 'Spec',
  placeholderBatchNo: 'Batch No.',
  placeholderWarehouse: 'Warehouse',
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
  msgAuditConfirm: 'Confirm {action} this outbound order?',
  msgConfirmTitle: 'Notice',
  msgSuccess: 'Operation succeeded',
  msgSaveSuccess: 'Saved successfully',
  msgDeleteSuccess: 'Deleted successfully',
  msgConfirmDelete: 'Delete this outbound order?',

  // Validation
  warnSelectDate: 'Please select an outbound date',
  warnSelectWarehouse: 'Please select a warehouse',
  warnAddGoods: 'Please add at least one product',
}
