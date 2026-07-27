export interface MenuItem {
  key: string
  title: string // i18n key (e.g. 'menu.item.sale-client')
  icon?: string
  path?: string
  children?: MenuItem[]
}

export interface TopMenuItem {
  key: string
  title: string // i18n key (e.g. 'menu.group.dashboard')
  icon: string
  children: MenuItem[]
}

// `title` fields hold i18n keys; consumers resolve via t(item.title).
// Display helpers in this file handle both i18n keys and raw strings (legacy fallback).
export const menuData: TopMenuItem[] = [
  {
    key: 'dashboard',
    title: 'menu.group.dashboard',
    icon: 'Odometer',
    children: [
      { key: 'dashboard', title: 'menu.item.dashboard', path: '/dashboard' },
    ],
  },
  {
    key: 'customer',
    title: 'menu.group.customer',
    icon: 'UserFilled',
    children: [
      { key: 'sale-client', title: 'menu.item.sale-client', path: '/sale/client' },
      { key: 'sale-sea', title: 'menu.item.sale-sea', path: '/sale/sea' },
      { key: 'sale-level', title: 'menu.item.sale-level', path: '/sale/level' },
    ],
  },
  {
    key: 'sale',
    title: 'menu.group.sale',
    icon: 'ShoppingCart',
    children: [
      { key: 'sale-overview', title: 'menu.item.sale-overview', path: '/sale/overview' },
      { key: 'sale-offer', title: 'menu.item.sale-offer', path: '/sale/offer' },
      { key: 'sale-sample', title: 'menu.item.sale-sample', path: '/sale/sample' },
      { key: 'sale-contract', title: 'menu.item.sale-contract', path: '/sale/contract' },
      { key: 'sale-out', title: 'menu.item.sale-out', path: '/sale/out' },
      { key: 'sale-return', title: 'menu.item.sale-return', path: '/sale/return' },
      { key: 'sale-exchange', title: 'menu.item.sale-exchange', path: '/sale/exchange' },
      { key: 'sale-commission-setting', title: 'menu.item.sale-commission-setting', path: '/sale/commission-setting' },
    ],
  },
  {
    key: 'online',
    title: 'menu.group.online',
    icon: 'Monitor',
    children: [
      { key: 'online-overview', title: 'menu.item.online-overview', path: '/online/overview' },
      { key: 'online-meituan', title: 'menu.item.online-meituan', path: '/online/meituan' },
      { key: 'online-wechat', title: 'menu.item.online-wechat', path: '/online/wechat' },
      { key: 'online-pinduoduo', title: 'menu.item.online-pinduoduo', path: '/online/pinduoduo' },
      { key: 'online-douyin', title: 'menu.item.online-douyin', path: '/online/douyin' },
      { key: 'online-xiaohongshu', title: 'menu.item.online-xiaohongshu', path: '/online/xiaohongshu' },
    ],
  },
  {
    key: 'retail',
    title: 'menu.group.retail',
    icon: 'Shop',
    children: [
      { key: 'retail-overview', title: 'menu.item.retail-overview', path: '/retail/overview' },
      { key: 'retail-store', title: 'menu.item.retail-store', path: '/retail/store' },
      { key: 'retail-order', title: 'menu.item.retail-order', path: '/retail/order' },
      { key: 'retail-return', title: 'menu.item.retail-return', path: '/retail/return' },
      { key: 'retail-customer', title: 'menu.item.retail-customer', path: '/retail/customer' },
      { key: 'retail-recharge', title: 'menu.item.retail-recharge', path: '/retail/recharge' },
      { key: 'retail-points', title: 'menu.item.retail-points', path: '/retail/points' },
      { key: 'retail-coupon', title: 'menu.item.retail-coupon', path: '/retail/coupon' },
    ],
  },
  {
    key: 'procure',
    title: 'menu.group.procure',
    icon: 'Box',
    children: [
      { key: 'procure-supplier', title: 'menu.item.procure-supplier', path: '/procure/supplier' },
      { key: 'procure-plan', title: 'menu.item.procure-plan', path: '/procure/plan' },
      { key: 'procure-order', title: 'menu.item.procure-order', path: '/procure/order' },
      { key: 'procure-inhouse', title: 'menu.item.procure-inhouse', path: '/procure/inhouse' },
      { key: 'procure-return', title: 'menu.item.procure-return', path: '/procure/return' },
    ],
  },
  {
    key: 'warehouse',
    title: 'menu.group.warehouse',
    icon: 'House',
    children: [
      { key: 'warehouse-stock', title: 'menu.item.warehouse-stock', path: '/warehouse/stock' },
      { key: 'warehouse-scrap', title: 'menu.item.warehouse-scrap', path: '/warehouse/scrap' },
      { key: 'warehouse-transfer', title: 'menu.item.warehouse-transfer', path: '/warehouse/transfer' },
      { key: 'warehouse-flow', title: 'menu.item.warehouse-flow', path: '/warehouse/flow' },
      { key: 'warehouse-pick', title: 'menu.item.warehouse-pick', path: '/warehouse/pick' },
      { key: 'warehouse-check', title: 'menu.item.warehouse-check', path: '/warehouse/check' },
      { key: 'warehouse-other-in', title: 'menu.item.warehouse-other-in', path: '/warehouse/other-in' },
      { key: 'warehouse-other-out', title: 'menu.item.warehouse-other-out', path: '/warehouse/other-out' },
      { key: 'warehouse-warning', title: 'menu.item.warehouse-warning', path: '/warehouse/warning' },
      { key: 'warehouse-name', title: 'menu.item.warehouse-name', path: '/warehouse/name' },
      { key: 'warehouse-batch', title: 'menu.item.warehouse-batch', path: '/warehouse/batch' },
      { key: 'warehouse-serial', title: 'menu.item.warehouse-serial', path: '/warehouse/serial' },
    ],
  },
  {
    key: 'production',
    title: 'menu.group.production',
    icon: 'Tools',
    children: [
      { key: 'production-overview', title: 'menu.item.production-overview', path: '/production/overview' },
      { key: 'production-plan', title: 'menu.item.production-plan', path: '/production/plan' },
      { key: 'production-inhouse', title: 'menu.item.production-inhouse', path: '/production/inhouse' },
      { key: 'production-material', title: 'menu.item.production-material', path: '/production/material' },
    ],
  },
  {
    key: 'outsource',
    title: 'menu.group.outsource',
    icon: 'Connection',
    children: [
      { key: 'outsource-plan', title: 'menu.item.outsource-plan', path: '/outsource/plan' },
      { key: 'outsource-inhouse', title: 'menu.item.outsource-inhouse', path: '/outsource/inhouse' },
      { key: 'outsource-receive', title: 'menu.item.outsource-receive', path: '/outsource/receive' },
      { key: 'outsource-quality', title: 'menu.item.outsource-quality', path: '/outsource/quality' },
      { key: 'outsource-payable', title: 'menu.item.outsource-payable', path: '/outsource/payable' },
      { key: 'outsource-payment', title: 'menu.item.outsource-payment', path: '/outsource/payment' },
    ],
  },
  {
    key: 'finance',
    title: 'menu.group.finance',
    icon: 'Money',
    children: [
      { key: 'finance-overview', title: 'menu.item.finance-overview', path: '/finance/overview' },
      { key: 'finance-profit', title: 'menu.item.finance-profit', path: '/reports/finance' },
      { key: 'finance-receivable', title: 'menu.item.finance-receivable', path: '/finance/receivable' },
      { key: 'finance-payable', title: 'menu.item.finance-payable', path: '/finance/payable' },
      { key: 'finance-collect-receipt', title: 'menu.item.finance-collect-receipt', path: '/finance/collect-receipt' },
      { key: 'finance-pay-receipt', title: 'menu.item.finance-pay-receipt', path: '/finance/pay-receipt' },
      { key: 'finance-invoice', title: 'menu.item.finance-invoice', path: '/finance/invoice' },
      { key: 'finance-statement', title: 'menu.item.finance-statement', path: '/finance/statement' },
      { key: 'finance-expense', title: 'menu.item.finance-expense', path: '/finance/expense' },
      { key: 'finance-fund', title: 'menu.item.finance-fund', path: '/finance/fund' },
      { key: 'finance-fund-flow', title: 'menu.item.finance-fund-flow', path: '/finance/fund-flow' },
      { key: 'finance-income-expense-flow', title: 'menu.item.finance-income-expense-flow', path: '/finance/income-expense-flow' },
      { key: 'finance-cost', title: 'menu.item.finance-cost', path: '/finance/cost' },
      { key: 'finance-prepay', title: 'menu.item.finance-prepay', path: '/finance/prepay' },
      { key: 'finance-supplier-prepay', title: 'menu.item.finance-supplier-prepay', path: '/finance/supplier-prepay' },
      { key: 'finance-other-expense', title: 'menu.item.finance-other-expense', path: '/finance/other-expense' },
      { key: 'finance-other-income', title: 'menu.item.finance-other-income', path: '/finance/other-income' },
    ],
  },
  {
    key: 'goods',
    title: 'menu.group.goods',
    icon: 'Goods',
    children: [
      { key: 'goods-info', title: 'menu.item.goods-info', path: '/goods/info' },
      { key: 'goods-unit', title: 'menu.item.goods-unit', path: '/goods/unit' },
      { key: 'goods-brand', title: 'menu.item.goods-brand', path: '/goods/brand' },
      { key: 'goods-bom', title: 'menu.item.goods-bom', path: '/goods/bom' },
    ],
  },
  {
    key: 'reports',
    title: 'menu.group.reports',
    icon: 'TrendCharts',
    children: [
      { key: 'reports-overview', title: 'menu.item.reports-overview', path: '/reports/overview' },
      { key: 'reports-sale-rate', title: 'menu.item.reports-sale-rate', path: '/reports/sale-rate' },
      { key: 'reports-sale-ledger', title: 'menu.item.reports-sale-ledger', path: '/reports/sale-ledger' },
      { key: 'reports-commission', title: 'menu.item.reports-commission', path: '/reports/commission' },
      { key: 'reports-procure', title: 'menu.item.reports-procure', path: '/reports/procure' },
      { key: 'reports-procure-ledger', title: 'menu.item.reports-procure-ledger', path: '/reports/procure-ledger' },
      { key: 'reports-stock', title: 'menu.item.reports-stock', path: '/reports/stock' },
      { key: 'reports-profit', title: 'menu.item.reports-profit', path: '/reports/profit' },
      { key: 'reports-finance', title: 'menu.item.reports-finance', path: '/reports/finance' },
    ],
  },
  {
    key: 'office',
    title: 'menu.group.office',
    icon: 'Briefcase',
    children: [
      { key: 'office-task', title: 'menu.item.office-task', path: '/office/task' },
      { key: 'office-cloud', title: 'menu.item.office-cloud', path: '/office/cloud' },
      { key: 'office-remind', title: 'menu.item.office-remind', path: '/office/remind' },
      { key: 'office-notice', title: 'menu.item.office-notice', path: '/office/notice' },
      { key: 'office-approval', title: 'menu.item.office-approval', path: '/office/approval' },
      { key: 'office-work-report', title: 'menu.item.office-work-report', path: '/office/work-report' },
      { key: 'office-visit', title: 'menu.item.office-visit', path: '/office/visit' },
      { key: 'office-expense', title: 'menu.item.office-expense', path: '/office/expense' },
      { key: 'office-leave', title: 'menu.item.office-leave', path: '/office/leave' },
      { key: 'office-overtime', title: 'menu.item.office-overtime', path: '/office/overtime' },
      { key: 'office-business', title: 'menu.item.office-business', path: '/office/business' },
    ],
  },
  {
    key: 'setting',
    title: 'menu.group.setting',
    icon: 'Setting',
    children: [
      { key: 'setting-dept', title: 'menu.item.setting-dept', path: '/setting/dept' },
      { key: 'setting-role', title: 'menu.item.setting-role', path: '/setting/role' },
      { key: 'setting-jobs', title: 'menu.item.setting-jobs', path: '/setting/jobs' },
      { key: 'setting-admin', title: 'menu.item.setting-admin', path: '/setting/admin' },
      { key: 'setting-params', title: 'menu.item.setting-params', path: '/setting/params' },
      { key: 'setting-print', title: 'menu.item.setting-print', path: '/setting/print' },
      { key: 'setting-operation-log', title: 'menu.item.setting-operation-log', path: '/setting/operation-log' },
      { key: 'setting-company', title: 'menu.item.setting-company', path: '/setting/company' },
    ],
  },
  {
    key: 'personnel',
    title: 'menu.group.personnel',
    icon: 'User',
    children: [
      { key: 'personnel-salary', title: 'menu.item.personnel-salary', path: '/personnel/salary' },
      { key: 'personnel-job-change', title: 'menu.item.personnel-job-change', path: '/personnel/job-change' },
      { key: 'personnel-resign', title: 'menu.item.personnel-resign', path: '/personnel/resign' },
      { key: 'personnel-car', title: 'menu.item.personnel-car', path: '/personnel/car' },
      { key: 'personnel-attendance', title: 'menu.item.personnel-attendance', path: '/personnel/attendance' },
      { key: 'personnel-recruit', title: 'menu.item.personnel-recruit', path: '/personnel/recruit' },
      { key: 'personnel-staff', title: 'menu.item.personnel-staff', path: '/personnel/staff' },
      { key: 'personnel-contract', title: 'menu.item.personnel-contract', path: '/personnel/contract' },
      { key: 'personnel-social', title: 'menu.item.personnel-social', path: '/personnel/social' },
      { key: 'personnel-welfare', title: 'menu.item.personnel-welfare', path: '/personnel/welfare' },
    ],
  },
  {
    key: 'miniapp',
    title: 'menu.group.miniapp',
    icon: 'Cellphone',
    children: [
      { key: 'mini-orders', title: 'menu.item.mini-orders', path: '/sale/mini-orders' },
      { key: 'mini-service', title: '小程序客服', path: '/sale/mini-service' },
      { key: 'mini-videos', title: 'menu.item.mini-videos', path: '/sale/mini-videos' },
      { key: 'mini-qrcode', title: 'menu.item.mini-qrcode', path: '/sale/mini-qrcode' },
      { key: 'distributor', title: 'menu.item.distributor', path: '/sale/distributor' },
      { key: 'distributor-withdraw', title: '分销提现审批', path: '/sale/distributor-withdraw' },
      { key: 'refund', title: 'menu.item.refund', path: '/sale/refund' },
    ],
  },
]
