// Translations for src/views/production/Overview.vue (Production Overview)
export default {
  // Quick action bar
  btnGenerateBomPlan: 'One-Click BOM Production Plan',
  btnRefresh: 'Refresh',

  // Stat cards
  statTotalPlans: 'Total Production Plans',
  statTotalPlansSub: 'All plans',
  statActivePlans: 'In Progress',
  statActivePlansSub: 'Plans to complete',
  statDonePlans: 'Completed',
  statDonePlansSub: 'This month',
  statInhouseOrders: 'Inbound Orders',
  statInhouseOrdersSub: 'Last 30 days',

  // Active plans card
  activePlansTitle: 'Active Production Plans',
  activePlansViewAll: 'View All',
  activePlansEmpty: 'No active production plans',
  planTagUrgent: 'Urgent',
  planTagHigh: 'High',
  planProgressSchedule: 'Scheduled',
  planProgressInhouse: 'Inbound',
  planDelivery: 'Delivery: ',

  // BOM material status card
  bomStatusTitle: 'BOM Material Stock Status',
  bomStatusManage: 'Manage BOM',
  bomStatusLoading: 'Loading…',
  bomStatusEmpty: 'No BOM data available',
  bomStatusCanMake: 'Can make {count}',
  bomStatusLack: 'Material insufficient',
  bomStatusMore: '{count} more products →',

  // Recent production receipt card
  recentInhouseTitle: 'Recent Production Receipt',
  recentInhouseViewAll: 'View All',
  recentColOrderSn: 'Inbound No.',
  recentColGoodsName: 'Product Name',
  recentColQty: 'Inbound Qty',
  recentColUnit: 'Unit',
  recentColWarehouse: 'Warehouse',
  recentColDate: 'Inbound Date',
  recentColStatus: 'Status',
  statusAudited: 'Approved',
  statusRejected: 'Rejected',
  statusPending: 'Pending',

  // Generate BOM plan dialog
  genDialogTitle: 'One-Click BOM Production Plan',
  genStep1Title: 'Select Products to Produce',
  genSearchPlaceholder: 'Search product name…',
  genHintCount: '{count} products with BOM configured',
  genCanMake: 'Can make: {count}',
  genQtyLabel: 'Qty',
  genProcessPriceLabel: 'Processing Unit Price',
  genProcessPricePlaceholder: 'Optional',
  genProcessPriceUnit: 'CNY',
  genGoodsEmpty: 'No products with BOM configuration found',

  genStep2Title: 'Configure Production Parameters',
  genFieldFinishedWarehouse: 'Finished Goods Warehouse',
  genFieldMaterialWarehouse: 'Raw Material Warehouse',
  genFieldWarehousePlaceholder: 'Select warehouse',
  genFieldDate: 'Plan Date',
  genFieldDatePlaceholder: 'Select date',
  genFieldRemark: 'Notes',
  genRemarkPlaceholder: 'Optional notes',

  genPreviewTitle: 'Production Preview (BOM Material Consumption)',
  genPreviewColGoods: 'Finished Good',
  genPreviewColQty: 'Production Qty',
  genPreviewColUnit: 'Unit',
  genPreviewColProcessPrice: 'Processing Unit Price',
  genPreviewColMaterials: 'Material Consumption',
  genPreviewStockLabel: 'Stock: {count}',

  genBtnCancel: 'Cancel',
  genBtnGenerate: 'Confirm Generate',
  genBtnGenerating: 'Generating…',

  // Generate log messages
  genLogStart: 'Starting: {goods} × {qty}',
  genLogPlanCreated: '  ✓ Production plan created (ID: {id})',
  genLogPlanAudited: '  ✓ Production plan approved',
  genLogMaterialCreated: '  ✓ Requisition created and approved ({count} material types)',
  genLogMaterialFailed: '  ⚠ Requisition failed: {error} (continuing)',
  genLogInhouseCreated: '  ✓ Inbound order created and approved (ID: {id})',
  genLogItemFailed: '  ✗ Failed: {error}',
  genDoneSuccess: 'One-click generation complete!',

  // Validation
  msgBomLoading: 'Please wait for BOM data to finish loading',
  msgSelectWarehouse: 'Please select a finished goods warehouse',
  msgSelectMaterialWarehouse: 'Please select a raw material warehouse',
  msgLackingStock: 'The following products have insufficient material stock: {names}. Continue anyway?',
  msgLackingStockTitle: 'Insufficient Stock Confirmation',
}
