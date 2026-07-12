// Translations for src/views/production/Material.vue (Material Requisition)
export default {
  // Search bar
  searchOrderSn: 'Requisition No.',
  searchGoodsName: 'Product Name',
  searchReconcileStatus: 'Reconcile Status',
  searchUnreconciled: 'Unreconciled',
  btnSearch: 'Search',
  btnReset: 'Reset',
  btnAdd: 'Add Requisition',

  // Table columns
  colOrderSn: 'Requisition No.',
  colAdminName: 'Requestor',
  colPickDate: 'Pick Date',
  colWarehouse: 'Issue Warehouse',
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
  actionUnaudit: 'Revoke Approval',
  actionReturn: 'Return',
  actionDelete: 'Delete',
  actionDeleteDisabledTip: 'Please revoke approval before deleting',

  // Form page – top bar
  formTitleView: 'View Requisition',
  formTitleEdit: 'Edit Requisition',
  formTitleAdd: 'New Requisition',
  formBtnBack: 'Back',
  formBtnSave: 'Save',

  // Form fields
  fieldPickDate: 'Pick Date',
  fieldAdminName: 'Requestor',
  fieldDefaultWarehouse: 'Default Warehouse',
  fieldWarehousePlaceholder: 'Select warehouse',
  fieldRelatedPlan: 'Production Plan',
  fieldPlanPlaceholder: 'Optional',

  // Goods toolbar
  btnSelectGoods: 'Select Products',
  btnAddRow: 'Add Row Manually',
  totalPrice: 'Total: ',

  // Goods table columns
  colGoodsName: 'Product Name',
  colGoodsSn: 'Product Code',
  colUnit: 'Unit',
  colOutWarehouse: 'Issue Warehouse',
  colWarehousePlaceholder: 'Warehouse',
  colStock: 'Stock',
  colPickQty: 'Requisition Qty',
  colOutPrice: 'Issue Unit Price',
  colSubtotal: 'Subtotal',
  colRemark: 'Notes',
  colRemarkPlaceholder: 'Notes',
  btnBatch: 'Batch',

  // Footer
  footerTotal: 'Total: Qty {qty}  Amount {price}',
  fieldRemark: 'Notes',

  // Batch set dialog
  batchSetTitle: 'Batch Set: {label}',
  batchSetCancel: 'Cancel',
  batchSetConfirm: 'Confirm',

  // Return dialog
  returnDialogTitle: 'Material Return',
  returnFieldDate: 'Return Date',
  returnFieldWarehouse: 'Return Warehouse',
  returnFieldWarehousePlaceholder: 'Select warehouse',
  returnFieldReturner: 'Returner',
  returnFieldReturnerPlaceholder: 'Returner',
  returnColGoodsName: 'Product Name',
  returnColGoodsSn: 'Product Code',
  returnColUnit: 'Unit',
  returnColQty: 'Return Qty',
  returnColInPrice: 'Inbound Unit Price',
  returnColSubtotal: 'Subtotal',
  returnColReason: 'Return Reason',
  returnColReasonPlaceholder: 'Reason',
  returnTotalPrice: 'Return Total: ',
  returnFieldRemark: 'Notes',
  returnBtnCancel: 'Cancel',
  returnBtnSave: 'Save',

  // Validation / messages
  msgPickDateRequired: 'Please select a pick date',
  msgAddGoods: 'Please add products',
  msgSaveSuccess: 'Saved successfully. {count} inventory item(s) deducted',
  msgSaveFailed: 'Save failed',
  msgAuditConfirm: 'Confirm {action} this requisition?',
  msgAuditTip: 'Notice',
  msgAlreadyAudited: 'This requisition is already approved',
  msgNotAudited: 'This requisition has not been approved yet',
  msgAuditSuccess: 'Approved. {count} inventory item(s) deducted',
  msgUnauditSuccess: 'Approval Revoked. {count} inventory item(s) restored',
  msgActionSuccess: 'Success',
  msgActionFailed: 'Operation failed',
  msgDeleteConfirm: 'Confirm delete?',
  msgDeleteSuccess: 'Deleted successfully',
  msgAutoFillGoods: '{count} material(s) auto-filled from BOM',
  msgReturnDateRequired: 'Please select a return date',
  msgReturnWarehouseRequired: 'Please select a return warehouse',
  msgReturnGoodsRequired: 'Please add return items',
  msgReturnSaveSuccess: 'Material returned successfully. Inventory restored',
  msgReturnSaveFailed: 'Save failed',
  msgSaveNoId: 'Saved but no requisition ID returned — inventory sync skipped',

  // Export file name
  exportFileName: 'Material Requisitions',

  // Reconcile toggle (table cell)
  reconcileToggleOn: 'Reconciled',
  reconcileToggleOff: 'Reconcile',

  // Row-level validation (used in validateBeforeSave)
  msgValidateMissingInfo: '{row} is missing product information',
  msgValidatePickQtyRequired: '{row} requisition qty must be greater than 0',
  msgValidateWarehouseRequired: '{row} please select an issue warehouse',

  // Audit labels (used in doAudit labels record)
  auditLabelApprove: 'Approve',
  auditLabelReject: 'Reject',
  auditLabelUnapprove: 'Revoke Approval',
}
