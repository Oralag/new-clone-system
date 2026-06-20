// Translations for src/views/sale/CustomerLevel.vue
export default {
  // Left level panel
  customerLevel: 'Customer Tier',
  emptyLevels: 'No tiers yet. Click + at the top right to add one',

  // Right price panel
  levelPricesTitle: '"{name}" Tier Prices',
  priceHint: 'Set exclusive prices for products at this tier. Applied automatically when distributors place orders in the mini program.',
  btnAddGoodsPrice: 'Add Product Price',
  priceSearchPlaceholder: 'Search product name/code',
  priceEmpty: 'No price settings yet. Click above to add.',

  // Price table columns
  colIndex: 'No.',
  colGoodsSn: 'Product Code',
  colGoodsName: 'Product Name',
  colUnit: 'Unit',
  colSellPrice: 'System Sell Price',
  colDiscount: 'Discount',
  colLevelPrice: 'Tier Price',
  colAction: 'Action',

  // Discount modes
  discountModePct: 'Percent',
  discountModeFold: 'Fold',

  // Action buttons
  btnDelete: 'Delete',

  // No selection tip
  noSelectionTip: 'Please select a tier on the left to set product prices.',

  // Tier add/edit dialog
  dialogAddLevel: 'Add Tier',
  dialogEditLevel: 'Edit Tier',
  formLevelName: 'Tier Name',
  formLevelNamePlaceholder: 'e.g. Distributor, Wholesaler',
  formDiscountPct: 'Discount Percent',
  formDiscountPlaceholder: 'e.g. 90 means 10% off',
  formDiscountHint: '1~100, 100 = no discount, 90 = 10% off',
  formCommissionRate: 'Commission Rate',
  formCommissionHint: 'Distributor commission percent for referral orders. 0 = no distribution.',
  btnCancel: 'Cancel',
  btnConfirm: 'Confirm',

  // Goods picker dialog
  dialogPickGoods: 'Select Products and Set Tier Price',
  pickerSearchPlaceholder: 'Search product name/code',
  pickerCatePlaceholder: 'Category',
  colCate: 'Category',
  colPickSellPrice: 'Sell Price',
  pickerSelectedTip: '{count} selected. Set exact prices in the price table after confirming.',
  btnConfirmAdd: 'Confirm Add',

  // Toast messages
  msgInputLevelName: 'Please enter tier name',
  msgOperationSuccess: 'Operation successful',
  msgConfirmDeleteLevel: 'Delete this tier? All product prices under this tier will also be deleted.',
  msgTipTitle: 'Tip',
  msgDeleteSuccess: 'Deleted successfully',
  msgConfirmDeletePrice: 'Delete the tier price for this product?',
  msgDeleted: 'Deleted',
  msgAddSuccess: '{count} product(s) added. Please adjust exclusive prices in the price table.',

  // Default goods name fallback
  defaultGoodsName: 'Product {id}',
}
