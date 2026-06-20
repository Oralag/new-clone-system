// Translations for src/views/sale/SaleOverview.vue
export default {
  // Quick action cards
  quickSaleTitle: '一键销售',
  quickSaleSub: '选客户 → 选商品 → 自动生成合同+出库',
  quickAddOffer: '新增报价',
  quickAddContract: '新增合同',
  quickAddOut: '新增出库',
  quickAddSample: '样品单',

  // Period tabs
  periodMonth: '本月',
  periodQuarter: '本季',
  periodYear: '本年',
  periodAll: '全部',

  // KPI labels
  kpiSale: '{period}销售额',
  kpiCost: '{period}成本',
  kpiGrossProfit: '{period}毛利润',
  kpiGrossMargin: '毛利率 {rate}%',
  kpiNetProfit: '{period}净利润',
  kpiFreightDeduct: '扣运费 ¥{amount}',
  kpiPending: '待审核',
  kpiPendingDetail: '报价{offer} / 合同{contract}',
  kpiCustomers: '{period}客户',
  kpiOrders: '{period}订单',

  // Tab labels
  tabContracts: '最近合同',
  tabOffers: '最近报价',
  tabSaleOuts: '最近出库',

  // Table columns
  colOrderNo: '单号',
  colCustomer: '客户',
  colAmount: '金额',
  colDate: '日期',
  colStatus: '状态',
  colAction: '操作',

  // Action buttons
  btnAudit: '审核',
  btnConvertToOut: '转出库',
  btnView: '查看',
  btnConvertToContract: '转合同',

  // Empty states
  emptyContract: '暂无合同',
  emptyOffer: '暂无报价',
  emptySaleOut: '暂无出库单',

  // Contract status labels
  statusConverted: '✓ 已转单',
  statusAuditedWithOut: '已审核并出库',
  statusAudited: '已审核',
  statusRejected: '已驳回',
  statusPending: '待审核',

  // Offer status
  offerStatusAudited: '已审核',
  offerStatusRejected: '已驳回',
  offerStatusConverted: '已转单',
  offerStatusPending: '待审核',

  // Sale out status
  saleOutStatusAudited: '已审核',
  saleOutStatusPending: '待审核',

  // Quick sale dialog
  qsDialogTitle: '一键销售',
  qsCustomerLabel: '客户',
  qsWarehouseLabel: '仓库',
  qsGoodsLabel: '商品',
  qsSelectCustomer: '选择客户',
  qsSelectWarehouse: '选择仓库',
  qsSelectGoods: '选择商品',
  qsColGoods: '商品',
  qsColSpec: '规格',
  qsColUnit: '单位',
  qsColQty: '数量',
  qsColPrice: '单价',
  qsColSubtotal: '小计',
  qsColDelete: '删',
  qsDiscountLabel: '优惠',
  qsFreightLabel: '运费',
  qsRemarkLabel: '备注',
  qsDiscountPlaceholder: '优惠金额',
  qsFreightPlaceholder: '运费',
  qsRemarkPlaceholder: '选填',
  qsPayerBuyer: '对方承担',
  qsPayerSeller: '我方承担',
  qsGoodsTotal: '商品合计：¥{amount}',
  qsDiscountOff: '优惠：-¥{amount}',
  qsFreightAdd: '运费：+¥{amount}（{payer}）',
  qsTotal: '合计：',
  qsCollectTitle: '本次收款',
  qsCollectAmountLabel: '收款金额',
  qsCollectFundLabel: '收款账户',
  qsSelectFund: '选择账户',
  qsOwed: '本次欠款：¥{amount}',
  qsFullPaid: '全额收款',
  qsCancelBtn: '取消',
  qsConfirmBtn: '确认生成（合同+出库）',

  // Messages
  confirmAuditContract: '确定审核通过合同「{sn}」？',
  confirmAuditTitle: '审核',
  msgAuditSuccess: '审核成功',
  warnSelectCustomer: '请选择客户',
  warnSelectWarehouse: '请选择仓库',
  warnSelectGoods: '请选择商品',
  errContractCreate: '合同创建失败',
  errSaleOutCreate: '出库单创建失败',
  msgQuickSaleDoneCollectedOwed: '一键销售完成！收款 ¥{amount}，欠款 ¥{owed}',
  msgQuickSaleDoneCollected: '一键销售完成！收款 ¥{amount}',
  msgQuickSaleDoneSimple: '一键销售完成！合同+出库单已生成并审核',
  errOperationFailed: '操作失败，请重试',
}
