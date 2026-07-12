// Translations for src/views/warehouse/StockAll.vue (Stock Overview)
export default {
  // Drawer / sidebar
  drawerTitle: 'Filter by Category',
  sidebarLabel: 'Category',
  allWarehouses: 'All Warehouses',
  allCategories: 'All',
  filterCategory: 'Category',

  // Top bar stats
  statNegativeStock: 'Negative Stock',
  statGoodsTotal: 'Total Products',
  statTotalQty: 'Total Qty',
  statTotalValue: 'Stock Value',
  statLowStock: 'Low Stock',
  statZeroStock: 'Zero Stock',

  // Status filter
  filterAll: 'All',
  filterLow: 'Low Stock',
  filterZero: 'Zero Stock',
  filterNormal: 'Normal',

  // Search
  searchPlaceholder: 'Product name / code',

  // Mobile cards
  mobileEmpty: 'No data',
  mobileUnitLabel: 'Unit',
  mobileStockLabel: 'Stock',
  btnFlow: 'History',
  btnPurchase: 'Purchase',
  btnSale: 'Sale',
  colNoCode: 'No code',

  // Table columns
  colIndex: 'No.',
  colGoodsName: 'Product Name',
  colGoodsSn: 'Product Code',
  colCate: 'Category',
  colSpec: 'Spec',
  colUnit: 'Unit',
  colStock: 'Stock',
  colStockStatus: 'Stock Status',
  colAvgPrice: 'Moving Avg. Price',
  colStockValue: 'Stock Value',
  colInOutRecord: 'In/Out Records',
  colSafeSetting: 'Safety Stock',
  colFlowBtn: 'History',
  colQuickJump: 'Quick Jump',
  btnSet: 'Set',

  // In-out record tags
  tagInhouse: 'Purchase In',
  tagReturn: 'Return',
  tagSaleOut: 'Sale Out',
  tagRetail: 'Retail',
  tagOtherIn: 'Other In',
  tagOtherOut: 'Other Out',
  tagProdIn: 'Prod. In',
  tagProdOut: 'Prod. Pick',
  tagNoRecord: 'No records',
  tagTimes: 'x',

  // Stock status labels
  statusNegative: 'Negative',
  statusZero: 'Zero',
  statusLow: 'Low',
  statusHigh: 'Overstock',
  statusNormal: 'Normal',

  // Pagination
  pagerTotal: 'Total {total}',

  // Safe stock dialog
  safeDialogTitle: 'Set Safety Stock',
  fieldSafeMin: 'Min Stock',
  fieldSafeMax: 'Max Stock',
  placeholderSafeMin: 'Alert when below this value',
  placeholderSafeMax: '0 = unlimited',
  btnCancel: 'Cancel',
  btnSave: 'Save',

  // Flow dialog
  flowDialogTitle: 'Stock History — {name}',
  flowColType: 'Type',
  flowColOrderSn: 'Order No.',
  flowColView: 'View',
  flowColQty: 'Qty',
  flowColPrice: 'Price',
  flowColDate: 'Date',
  flowColPartner: 'Notes / Counterparty',
  btnViewDoc: 'View',
  flowTotalIn: 'Total In: ',
  flowTotalOut: 'Total Out: ',
  flowNetChange: 'Net: ',
  flowRecordCount: '{count} records',
  flowEmpty: 'No records',
  btnClose: 'Close',

  // Category form dialog
  cateFormTitleAdd: 'Add Category',
  cateFormTitleEdit: 'Edit Category',
  fieldCateName: 'Category Name',
  fieldCateParent: 'Parent Category',
  fieldCateSort: 'Sort',
  placeholderCateName: 'Enter category name',
  placeholderCateParent: 'Select (optional)',
  btnCateCancel: 'Cancel',
  btnCateConfirm: 'Confirm',

  // Messages
  msgWarnCateName: 'Please enter a category name',
  msgWarnDupCate: '"{name}" already exists at this level',
  msgCateSuccess: 'Operation succeeded',
  msgDeleteCateConfirm: 'Delete this category?',
  msgConfirmTitle: 'Notice',
  msgSafeSuccess: 'Saved successfully',
  msgSafeFail: 'Failed to save',

  // Health hint
  healthHint: 'Normal {healthy} / Negative {neg} / Zero {zero} / Low {low}',
  scopeAll: 'Scope: All',
  scopeWarehouse: 'Warehouse: {name}',
  scopeCategory: 'Category: {name}',
  scopeKeyword: 'Keyword: {kw}',
  partnerGuest: 'Walk-in',
}
