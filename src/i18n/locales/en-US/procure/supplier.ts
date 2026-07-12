// Translations for src/views/procure/SupplierList.vue (Supplier List)
export default {
  // Category panel
  catePanelTitle: 'Supplier Category',
  cateSearchPlaceholder: 'Search category',
  cateAll: 'All',
  cateEmpty: 'No categories',

  // Search bar
  searchPlaceholder: 'Name / Phone',
  btnSearch: 'Search',
  btnReset: 'Reset',

  // Toolbar
  btnAdd: 'Add Supplier',
  btnImport: 'Import',
  btnExport: 'Export',

  // Selected bar
  selectedCount: 'Selected',
  selectedUnit: 'item(s)',
  btnClearSelection: 'Clear Selection',
  btnBatchDelete: 'Batch Delete',

  // Table columns
  colSupplierName: 'Supplier Name',
  colContact: 'Contact',
  colMobile: 'Phone',
  colCategory: 'Category',
  colAddress: 'Address',
  colBankAccount: 'Bank Account',
  colDebt: 'Payable',
  colTotalPurchase: 'Total Purchase',
  colActions: 'Actions',

  // Row actions
  actionView: 'View',
  actionEdit: 'Edit',
  actionDelete: 'Delete',

  // Form dialog titles
  formTitleView: 'View Supplier',
  formTitleEdit: 'Edit Supplier',
  formTitleAdd: 'Add Supplier',

  // Form labels
  labelSupplierName: 'Supplier Name',
  supplierNamePlaceholder: 'Enter supplier name',
  supplierNameRequired: 'Please enter supplier name',
  labelCategory: 'Category',
  categoryPlaceholder: 'Select',
  labelContact: 'Contact',
  contactPlaceholder: 'Enter',
  labelMobile: 'Phone',
  mobilePlaceholder: 'Enter',
  labelAddress: 'Address',
  addressPlaceholder: 'Enter',
  labelRemark: 'Notes',
  remarkPlaceholder: 'Enter',

  // Finance panel (in form)
  financePanelTitle: 'Account Summary',
  financeDebt: 'Payable Amount',
  financeTotalPurchase: 'Total Purchase',
  financeTotalPaid: 'Total Paid',
  financePrepaid: 'Prepayment',

  // Form footer
  createTimeNote: 'Created at: ',
  btnClose: 'Close',
  btnStartEdit: 'Edit',
  btnConfirm: 'Confirm',

  // Category form dialog
  cateFormTitleAdd: 'Add Category',
  cateFormTitleEdit: 'Edit Category',
  labelCateName: 'Category Name',
  cateNamePlaceholder: 'Enter category name',
  btnCancel: 'Cancel',
  btnCateConfirm: 'Confirm',

  // Import preview dialog
  dialogImportTitle: 'Import Preview',
  importPreviewCount: ' item(s), confirm to import.',
  btnImportCancel: 'Cancel',
  btnConfirmImport: 'Confirm Import',

  // Messages
  msgCateNameRequired: 'Please enter category name',
  msgCateOpSuccess: 'Success',
  msgCateDeleteConfirm: 'Confirm delete this category? Suppliers linked to it will be unlinked.',
  msgDeleteSuccess: 'Deleted successfully',
  msgDeleteConfirm: 'Confirm delete this supplier?',
  msgBatchDeleteConfirmPrefix: 'Confirm delete the selected',
  msgBatchDeleteConfirmSuffix: 'supplier(s)?',
  msgBatchDeleteTitle: 'Batch Delete',
  msgBatchDeleteSuccess: 'Deleted',
  msgBatchDeleteSuccessSuffix: 'supplier(s)',
  msgNoDataExport: 'No data to export',
  msgExportSuccess: 'Exported',
  msgExportSuccessSuffix: 'record(s)',
  msgExcelEmpty: 'Excel file contains no data',
  msgOpSuccess: 'Success',
  msgOpFailed: 'Operation failed',
  msgPrompt: 'Prompt',
  msgImportDonePrefix: 'Import complete: success',
  msgImportDoneUnit: ' item(s)',
  msgImportDoneFailed: ', failed',
  msgImportNewCate: 'Auto-created',
  msgImportNewCateSuffix: 'category(s)',

  exportFilePrefix: 'SupplierList_',

  // Export sheet headers (used in handleExport)
  exportSupplierName: 'Supplier Name',
  exportCategory: 'Category',
  exportContact: 'Contact',
  exportMobile: 'Phone',
  exportAddress: 'Address',
  exportBank: 'Bank Account',
  exportRemark: 'Notes',
}
