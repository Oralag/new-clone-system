// Translations for src/views/production/Inhouse.vue (Production Inbound)
export default {
  // Search bar
  searchOrderSn: 'Inbound No.',
  searchGoodsName: 'Product Name',
  searchReconcileStatus: 'Reconcile Status',
  searchUnreconciled: 'Unreconciled',
  btnSearch: 'Search',
  btnReset: 'Reset',
  btnAdd: 'Add Production Inbound',

  // Expand row – cost detail
  expandLoadingCost: 'Loading material cost...',
  expandLoadFailed: 'Load failed',
  expandColGoodsName: 'Product Name',
  expandColInQty: 'Inbound Qty',
  expandColMaterialPrice: 'Material Unit Price',
  expandColProcessPrice: 'Processing Unit Price',
  expandColInPrice: 'Inbound Unit Price',
  expandColTotalCost: 'Total Cost',
  expandMaterialCost: 'Material Cost: ',
  expandTotalCost: 'Total Cost: ',
  expandAvgPrice: 'Avg. Inbound Price: ',

  // Table columns
  colOrderSn: 'Inbound No.',
  colGoodsName: 'Product Name',
  colInQty: 'Inbound Qty',
  colUnit: 'Unit',
  colInCost: 'Inbound Cost',
  colWarehouse: 'Warehouse',
  colDate: 'Inbound Date',
  colStatus: 'Status',
  colActions: 'Actions',

  // Status tags
  statusAudited: 'Approved',
  statusRejected: 'Rejected',
  statusPending: 'Pending',

  // Row actions
  actionView: 'View',
  actionEdit: 'Edit',
  actionAudit: 'Approve',
  actionReject: 'Reject',
  actionUnaudit: 'Unapprove',
  actionReconciled: 'Reconciled',
  actionReconcile: 'Reconcile',
  actionDelete: 'Delete',
  actionDeleteDisabledTip: 'Please unapprove before deleting',

  // Form page – top bar
  formTitleView: 'View Production Inbound',
  formTitleEdit: 'Edit Production Inbound',
  formTitleAdd: 'Add Production Inbound',
  formBtnBack: 'Back',
  formBtnSave: 'Save',
  formBtnSaveAndAudit: 'Save & Approve',

  // Form fields
  fieldPlanOrder: 'Production Plan',
  fieldPlanOrderPlaceholder: 'Please select a production plan',
  fieldPlanOrderBtn: 'Select Production Plan',
  fieldOrderSn: 'Inbound No.',
  fieldOrderSnPlaceholder: 'Leave blank to auto-generate',
  fieldInDate: 'Inbound Date',
  fieldWarehouse: 'Warehouse',
  fieldWarehousePlaceholder: 'Select warehouse',
  fieldBackFlush: 'Back-flush',
  fieldBackFlushOn: 'Enabled',
  fieldBackFlushOff: 'Disabled',
  fieldBackFlushDisabledTip: 'This plan already has a manual requisition, back-flush unavailable',
  fieldRemark: 'Remark',

  // Goods list section
  goodsSectionTitle: 'Product List',
  goodsSummaryCost: 'Total Cost: ',
  goodsSummaryInPrice: 'Total Inbound Price: ',
  goodsEmptyText: 'Please select a production plan first',

  // Goods table columns
  colGoodsSn: 'Product Code',
  colSpec: 'Specification',
  colPlanNum: 'Planned Qty',
  colAvailableIn: 'Available Qty',
  colThisInQty: 'This Inbound Qty',
  colMaterialPrice: 'Material Unit Price',
  colMaterialTotal: 'Material Total',
  colProcessPrice: 'Processing Unit Price',
  colProcessTotal: 'Processing Total',
  colTotalCost: 'Total Cost',
  colInPrice: 'Inbound Unit Price',
  btnBatch: 'Batch',

  // Plan picker dialog
  planPickerTitle: 'Select Production Plan',
  planPickerColSn: 'Plan No.',
  planPickerColGoodsName: 'Product Name',
  planPickerColScheduleNum: 'Scheduled Qty',
  planPickerColActualNum: 'Produced',
  planPickerColFinishDate: 'Completion Date',
  planPickerColStatus: 'Status',

  // Batch set dialog
  batchSetTitle: 'Batch Set: {label}',
  batchSetCancel: 'Cancel',
  batchSetConfirm: 'Confirm',

  // Batch field labels
  batchLabelNum: 'This Inbound Qty',
  batchLabelMaterialPrice: 'Material Unit Price',
  batchLabelMaterialTotal: 'Material Total (split by qty)',
  batchLabelProcessPrice: 'Processing Unit Price',
  batchLabelProcessTotal: 'Processing Total (split by qty)',

  // Validation / messages
  msgSelectPlan: 'Please select a production plan',
  msgAddGoods: 'Please add products',
  msgSaveSuccess: 'Saved successfully',
  msgSaveAndAuditSuccess: 'Saved and approved. {count} inventory item(s) updated',
  msgSaveFailed: 'Save failed',
  msgBackFlushSuccess: 'Back-flush complete. {count} raw material(s) deducted',
  msgBackFlushFailed: 'Back-flush failed: {error}. Please create a requisition manually',
  msgAutoMaterialCost: 'Material cost auto-filled: ¥{amount}',
  msgAutoMaterialCostSimple: 'Material cost auto-filled',
  msgAuditConfirm: 'Confirm {action} this production inbound order?',
  msgAuditTip: 'Notice',
  msgAuditSuccess: '{action} succeeded. {count} inventory item(s) increased',
  msgUnauditSuccess: '{action} succeeded. {count} inventory item(s) rolled back',
  msgActionFailed: 'Operation failed',
  msgDeleteConfirm: 'Confirm delete this production inbound record?',
  msgDeleteSuccess: 'Deleted successfully',

  // Audit action labels
  auditActionApprove: 'Approve',
  auditActionReject: 'Reject',
  auditActionUnaudit: 'Unapprove',

  exportFileName: 'Production Inbound',
}
