// Translations for src/views/goods/Bom.vue (Bill of Materials)
export default {
  // Left panel
  leftPanelTitle: 'Finished Goods',
  btnAddFinishedGoods: 'Add Finished Good',
  searchPlaceholder: 'Search name / code',
  goodsNameEmpty: '(Unnamed)',
  emptyTip: 'No finished goods yet, click the button above to add',

  // Right panel
  rightPanelTitle: 'Bill of Materials',
  unitLabel: 'Unit: ',
  hintSelectGoods: '← Select a finished good from the left',
  btnEditGoodsInfo: 'Edit Product Information',
  btnAddMaterial: 'Add Material',
  btnGotoProcure: 'Quick Purchase BOM',
  emptyRight: 'Select a finished good on the left to view its BOM',

  // BOM table columns
  colIndex: 'No.',
  colMaterialName: 'Material Name',
  colMaterialCode: 'Material Code',
  colUsage: 'Qty Used',
  colUnit: 'Unit',
  colUnitPrice: 'Unit Price',
  colSubtotal: 'Subtotal',
  colActions: 'Actions',
  btnDelete: 'Delete',
  summaryTotal: 'Total',

  // Selection bar
  selectedCount: '{count} selected',
  btnBatchDelete: 'Batch Delete',

  // Cost summary
  costMaterialCount: 'Materials: ',
  costUnit: ' type(s)',
  costTotalLabel: 'Total Material Cost: ',

  // BOM dialog
  dialogAddTitle: 'Add BOM Finished Good',
  dialogEditTitle: 'Edit Finished Good Info',
  fieldSelectExisting: 'Select Existing',
  selectExistingPlaceholder: 'Search existing goods to auto-fill',
  fieldGoodsName: 'Product Name',
  goodsNamePlaceholder: 'Enter finished good name',
  fieldGoodsSn: 'Product Code',
  goodsSnPlaceholder: 'e.g. SP0000001',
  fieldSpec: 'Spec / Model',
  specPlaceholder: 'e.g. 250g',
  fieldUnit: 'Unit',
  unitPlaceholder: 'e.g. bag/box/bottle',
  btnCancel: 'Cancel',
  btnConfirm: 'Confirm',

  // Material dialog
  matDialogTitle: 'Add Materials',
  matSearchPlaceholder: 'Search material name / code',
  noMaterial: 'No matching materials',
  selectedItems: '{count} selected',
  btnNextStep: 'Next ({count} selected)',
  btnBackReselect: 'Back to Reselect',
  btnConfirmAdd: 'Confirm Add',
  matColName: 'Material Name',
  matColCode: 'Code',
  matColUsage: 'Qty Used',
  matColUnit: 'Unit',
  matColUnitPrice: 'Unit Price',
  matColSubtotal: 'Subtotal',

  // Messages
  msgGoodsNameRequired: 'Goods name is required',
  msgAddSuccess: 'Added successfully',
  msgEditSuccess: 'Updated successfully',
  msgSaveFailed: 'Save failed',
  msgLoadFailed: 'Load failed',
  msgLoadMaterialFailed: 'Failed to load materials',
  msgLoadGoodsFailed: 'Failed to load goods',
  msgDeleteSuccess: 'Deleted successfully',
  msgCopySuccess: 'Copied successfully',
  msgCopyFailed: 'Copy failed',
  msgAddMaterialSuccess: '{count} material(s) added successfully',
  msgAddMaterialFailed: 'Add failed',
  msgNoBomItems: 'No materials in current BOM',
  msgConfirmDeleteMaterial: 'Delete material "{name}"?',
  msgConfirmBatchDelete: 'Delete the selected {count} material(s)?',
  msgConfirmDeleteBom: 'Delete all BOM materials for "{name}"?',
  msgTip: 'Confirm',
}
