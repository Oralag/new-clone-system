// Translations for src/views/sale/SaleOverview.vue
export default {
  // Quick action cards
  quickSaleTitle: 'Quick Sale',
  quickSaleSub: 'Select customer → Select products → Auto-create contract + outbound',
  quickAddOffer: 'New Quote',
  quickAddContract: 'New Contract',
  quickAddOut: 'New Shipment',
  quickAddSample: 'Sample Order',

  // Period tabs
  periodMonth: 'This Month',
  periodQuarter: 'This Quarter',
  periodYear: 'This Year',
  periodAll: 'All Time',

  // KPI labels
  kpiSale: '{period} Sales',
  kpiCost: '{period} Cost',
  kpiGrossProfit: '{period} Gross Profit',
  kpiGrossMargin: 'Margin {rate}%',
  kpiNetProfit: '{period} Net Profit',
  kpiFreightDeduct: 'Freight -¥{amount}',
  kpiPending: 'Pending Audit',
  kpiPendingDetail: 'Quote {offer} / Contract {contract}',
  kpiCustomers: '{period} Customers',
  kpiOrders: '{period} Orders',

  // Tab labels
  tabContracts: 'Recent Contracts',
  tabOffers: 'Recent Quotes',
  tabSaleOuts: 'Recent Outbounds',

  // Table columns
  colOrderNo: 'Order No.',
  colCustomer: 'Customer',
  colAmount: 'Amount',
  colDate: 'Date',
  colStatus: 'Status',
  colAction: 'Action',

  // Action buttons
  btnAudit: 'Approve',
  btnConvertToOut: 'To Outbound',
  btnView: 'View',
  btnConvertToContract: 'To Contract',

  // Empty states
  emptyContract: 'No contracts',
  emptyOffer: 'No quotes',
  emptySaleOut: 'No shipments',

  // Contract status labels
  statusConverted: '✓ Converted',
  statusAuditedWithOut: 'Audited & Outbound',
  statusAudited: 'Approved',
  statusRejected: 'Rejected',
  statusPending: 'Pending',

  // Offer status
  offerStatusAudited: 'Approved',
  offerStatusRejected: 'Rejected',
  offerStatusConverted: 'Converted',
  offerStatusPending: 'Pending',

  // Sale out status
  saleOutStatusAudited: 'Approved',
  saleOutStatusPending: 'Pending',

  // Quick sale dialog
  qsDialogTitle: 'Quick Sale',
  qsCustomerLabel: 'Customer',
  qsWarehouseLabel: 'Warehouse',
  qsGoodsLabel: 'Products',
  qsSelectCustomer: 'Select customer',
  qsSelectWarehouse: 'Select warehouse',
  qsSelectGoods: 'Select products',
  qsColGoods: 'Product',
  qsColSpec: 'Spec',
  qsColUnit: 'Unit',
  qsColQty: 'Qty',
  qsColPrice: 'Price',
  qsColSubtotal: 'Subtotal',
  qsColDelete: 'Del',
  qsDiscountLabel: 'Discount',
  qsFreightLabel: 'Freight',
  qsRemarkLabel: 'Notes',
  qsDiscountPlaceholder: 'Discount amount',
  qsFreightPlaceholder: 'Freight',
  qsRemarkPlaceholder: 'Optional',
  qsPayerBuyer: 'Buyer pays',
  qsPayerSeller: 'Seller pays',
  qsGoodsTotal: 'Subtotal: ¥{amount}',
  qsDiscountOff: 'Discount: -¥{amount}',
  qsFreightAdd: 'Freight: +¥{amount} ({payer})',
  qsTotal: 'Total:',
  qsCollectTitle: 'Collect Payment',
  qsCollectAmountLabel: 'Amount',
  qsCollectFundLabel: 'Account',
  qsSelectFund: 'Select account',
  qsOwed: 'Owed: ¥{amount}',
  qsFullPaid: 'Paid in full',
  qsCancelBtn: 'Cancel',
  qsConfirmBtn: 'Confirm (Contract + Outbound)',

  // Messages
  confirmAuditContract: 'Confirm audit of contract "{sn}"?',
  confirmAuditTitle: 'Approve',
  msgAuditSuccess: 'Audited successfully',
  warnSelectCustomer: 'Please select a customer',
  warnSelectWarehouse: 'Please select a warehouse',
  warnSelectGoods: 'Please select products',
  errContractCreate: 'Failed to create contract',
  errSaleOutCreate: 'Failed to create shipment',
  msgQuickSaleDoneCollectedOwed: 'Quick sale complete! Collected ¥{amount}, Owed ¥{owed}',
  msgQuickSaleDoneCollected: 'Quick sale complete! Collected ¥{amount}',
  msgQuickSaleDoneSimple: 'Quick sale complete! Contract + shipment created and audited',
  errOperationFailed: 'Operation failed, please try again',
}
