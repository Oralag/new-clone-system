// Translations for src/views/production/Plan.vue (Production Plan)
export default {
  // Status filter buttons
  statusAll: 'All',
  statusNotStarted: 'Not Started',
  statusInProgress: 'In Progress',
  statusDone: 'Completed',

  // Search bar
  searchOrderSn: 'Production No.',
  btnSearch: 'Search',
  btnReset: 'Reset',

  // Toolbar
  btnAdd: 'Add (F9)',
  btnDelete: 'Delete',
  btnExport: 'Export',

  // Expand row (goods detail)
  expandColCode: 'Code',
  expandColGoodsName: 'Product Name',
  expandColSpec: 'Spec',
  expandColUnit: 'Unit',
  expandColPlanNum: 'Planned Qty',

  // Table columns
  colIndex: 'No.',
  colOrderSn: 'Production No.',
  colSaleOrderSn: 'Sale Order No.',
  colPlanDate: 'Order Date',
  colFinishDate: 'Delivery Date',
  colPriority: 'Priority',
  colScheduleNum: 'Scheduled Qty',
  colPlanNum: 'Production Qty',
  colInhouseNum: 'Inbound Qty',
  colSchedulePct: 'Schedule Progress',
  colPlanPct: 'Production Progress',
  colInhousePct: 'Inbound Progress',
  colFlowStatus: 'Flow Status',
  colActions: 'Actions',

  // Priority tags
  priorityNormal: 'Normal',
  priorityHigh: 'High',
  priorityUrgent: 'Urgent',
  priorityLow: 'Low',

  // Flow step labels
  stepMaterialPending: 'Pending Pick',
  stepMaterialDone: 'Picked',
  stepInhousePending: 'Pending Inbound',
  stepInhouseDone: 'Received',

  // Row actions
  actionView: 'View',
  actionEdit: 'Edit',
  actionPickMaterial: 'Pick Material',
  actionMaterialDone: 'Picked ✓',
  actionInhouseDone: 'Received ✓',
  actionInhouse: 'Inbound',
  actionReconciled: 'Reconciled',
  actionReconcile: 'Reconcile',
  actionDelete: 'Delete',

  // Summary bar
  summaryTotal: 'Total',
  summarySchedule: 'Scheduled: {value}',
  summaryPlan: 'Produced: {value}',
  summaryInhouse: 'Inbound: {value}',

  // Pagination
  paginationTotal: '{total} records total',

  // Form top bar
  formTitleView: 'View Production Plan',
  formTitleEdit: 'Edit Production Plan',
  formTitleAdd: 'New Production Plan',
  formBtnBack: 'Back',
  formBtnSave: 'Save (Ctrl+S)',

  // Form fields
  fieldSaleOrder: 'Sales Order',
  fieldSaleOrderPlaceholder: 'Sale order no.',
  fieldSaleOrderBtn: 'Select Sales Order',
  fieldOrderSn: 'Production No.',
  fieldOrderSnPlaceholder: 'Leave blank to auto-generate',
  fieldPlanDate: 'Order Date',
  fieldFinishDate: 'Delivery Date',
  fieldPriority: 'Priority',
  fieldRemark: 'Notes',
  fieldRemarkPlaceholder: 'Notes (optional)',

  // Goods section
  goodsSectionTitle: 'Product List',
  goodsBtnSelect: '+ Select Products',
  goodsColCode: 'Product Code',
  goodsColName: 'Product Name',
  goodsColAttr: 'Attr',
  goodsColSpec: 'Specification',
  goodsColUnit: 'Unit',
  goodsColActualNum: 'Produced Qty',
  goodsColThisNum: 'This Production Qty',
  goodsColStock: 'Stock Qty',
  goodsColActions: 'Actions',
  goodsColBomConsume: 'BOM Consumption',
  goodsColDelete: 'Delete',

  // BOM section
  bomSectionTitle: 'BOM Material Requirements',
  bomBtnPickMaterial: 'Pick Material',
  bomLoading: 'Loading...',
  bomColMaterialName: 'Material Name',
  bomColMaterialSn: 'Material Code',
  bomColSpec: 'Spec',
  bomColUnitUsage: 'Unit Usage',
  bomColNeedQty: 'Required Qty',
  bomColStock: 'Stock',
  bomColGap: 'Shortage',
  bomGapSufficient: 'Sufficient',

  // Sale picker dialog
  salePickerTitle: 'Select Sales Order',
  salePickerColOrderSn: 'Sale Order No.',
  salePickerColCustomer: 'Customer',
  salePickerColDate: 'Date',
  salePickerColAmount: 'Amount',
  salePickerBtnCancel: 'Cancel',
  salePickerBtnConfirm: 'Confirm',

  // BOM consume dialog
  bomConsumeEmptyTip: 'No BOM configured for this product. Please add it in "Products > BOM List" first.',
  bomConsumeQtyInfo: 'Production qty: {qty}, material requirements:',
  bomConsumeColMaterialName: 'Material Name',
  bomConsumeColMaterialSn: 'Material Code',
  bomConsumeColUnitUsage: 'Unit Usage',
  bomConsumeColNeedQty: 'Required Qty',
  bomConsumeColStock: 'Stock',
  bomConsumeColGap: 'Shortage',
  bomConsumeSummaryTotal: 'Total',
  bomConsumeGapSufficient: 'Sufficient',

  // Delete / block messages
  msgCannotDeleteHasMaterial: 'This production plan has an approved requisition and cannot be deleted directly.<br/>Please go to <b>Production → Material Management</b> to <b>revoke approval</b> the requisition first.',
  msgCannotDeleteTitle: 'Cannot Delete',
  msgCannotDeleteConfirm: 'Go to Material Management',
  msgCannotBatchDeleteHasMaterial: '{count} selected plan(s) have approved requisitions and cannot be deleted.<br/>Please go to <b>Production → Material Management</b> to <b>revoke approval</b> the requisitions first.',
  msgDeleteConfirm: 'Confirm delete this production plan?',
  msgDeleteTip: 'Notice',
  msgDeleteSuccess: 'Deleted successfully',
  msgBatchDeleteConfirm: 'Confirm delete {count} selected record(s)?',
  msgAddGoods: 'Please add products',
  msgSaveSuccess: 'Saved successfully',
  msgSaveFailed: '{error}',
  msgExportDev: 'Export feature coming soon',
  msgGetBomFailed: 'Failed to load BOM data',
}
