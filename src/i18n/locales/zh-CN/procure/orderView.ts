// Translations for src/views/procure/OrderView.vue (查看采购单)
export default {
  // Page header
  pageTitle: '查看采购单',
  btnBack: '返回',
  tagAudited: '已审核',
  tagPending: '待审核',

  // Basic info section
  sectionBasicInfo: '基本信息',
  labelOrderNo: '采购单号',
  labelSupplier: '供应商',
  labelBuyer: '采购人',
  labelOrderDate: '开单日期',
  labelDeliveryDate: '预计交期',
  labelWarehouse: '仓库',
  labelPayAccount: '付款账户',
  labelNeedInvoice: '是否开票',
  labelRemark: '备注',
  invoiceYes: '是',
  invoiceNo: '否',

  // Goods table columns
  colIndex: '序号',
  colGoodsName: '商品名称',
  colGoodsSn: '商品编码',
  colSpec: '规格型号',
  colUnit: '单位',
  colNum: '采购数量',
  colPriceNoTax: '未税单价',
  colTaxRate: '税率(%)',
  colPriceWithTax: '含税单价',
  colTotalWithTax: '含税合计',

  // Settlement section
  sectionSettle: '结算信息',
  settlePayable: '本单应付',
  settleDiscount: '折扣方式',
  settleAfterDiscount: '折后金额',
  settlePaid: '已付金额',
  settleNoTaxTotal: '未税合计：',
  settleTaxTotal: '税额合计：',
  settleWithTaxTotal: '含税合计：',

  // Discount labels (JS computed)
  discountNone: '无折扣',
  discountPercent: '折',
  discountAmount: '减',
  discountAmountSuffix: '元',

  // Empty state
  emptyDoc: '单据不存在',
}
