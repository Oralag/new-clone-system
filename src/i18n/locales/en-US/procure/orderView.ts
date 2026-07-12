// Translations for src/views/procure/OrderView.vue (Purchase Order View)
export default {
  // Page header
  pageTitle: 'View Purchase Order',
  btnBack: 'Back',
  tagAudited: 'Approved',
  tagPending: 'Pending',

  // Basic info section
  sectionBasicInfo: 'Basic Information',
  labelOrderNo: 'Order No.',
  labelSupplier: 'Supplier',
  labelBuyer: 'Buyer',
  labelOrderDate: 'Order Date',
  labelDeliveryDate: 'Expected Delivery',
  labelWarehouse: 'Warehouse',
  labelPayAccount: 'Payment Account',
  labelNeedInvoice: 'Invoice Required',
  labelRemark: 'Notes',
  invoiceYes: 'Yes',
  invoiceNo: 'No',

  // Goods table columns
  colIndex: 'No.',
  colGoodsName: 'Product Name',
  colGoodsSn: 'Product Code',
  colSpec: 'Spec/Model',
  colUnit: 'Unit',
  colNum: 'Purchase Qty',
  colPriceNoTax: 'Price (Ex-Tax)',
  colTaxRate: 'Tax Rate (%)',
  colPriceWithTax: 'Price (Inc-Tax)',
  colTotalWithTax: 'Total (Inc-Tax)',

  // Settlement section
  sectionSettle: 'Settlement',
  settlePayable: 'Order Payable',
  settleDiscount: 'Discount Type',
  settleAfterDiscount: 'After Discount',
  settlePaid: 'Amount Paid',
  settleNoTaxTotal: 'Ex-Tax Total:',
  settleTaxTotal: 'Tax Amount:',
  settleWithTaxTotal: 'Inc-Tax Total:',

  // Discount labels (JS computed)
  discountNone: 'No Discount',
  discountPercent: '% off',
  discountAmount: 'Minus ¥',
  discountAmountSuffix: '',

  // Empty state
  emptyDoc: 'Document not found',
}
