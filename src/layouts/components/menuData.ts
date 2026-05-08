export interface MenuItem {
  key: string
  title: string
  icon?: string
  path?: string
  children?: MenuItem[]
}

export interface TopMenuItem {
  key: string
  title: string
  icon: string
  children: MenuItem[]
}

export const menuData: TopMenuItem[] = [
  {
    key: 'dashboard',
    title: '首页',
    icon: 'Odometer',
    children: [
      { key: 'dashboard', title: '工作台', path: '/dashboard' },
    ],
  },
  {
    key: 'customer',
    title: '客户',
    icon: 'UserFilled',
    children: [
      { key: 'sale-client', title: '客户管理', path: '/sale/client' },
      { key: 'sale-sea', title: '客户公海', path: '/sale/sea' },
      { key: 'sale-level', title: '客户等级', path: '/sale/level' },
    ],
  },
  {
    key: 'sale',
    title: '销售',
    icon: 'ShoppingCart',
    children: [
      { key: 'sale-overview', title: '销售总览', path: '/sale/overview' },
      { key: 'sale-offer', title: '销售报价', path: '/sale/offer' },
      { key: 'sale-sample', title: '样品管理', path: '/sale/sample' },
      { key: 'sale-contract', title: '销售合同', path: '/sale/contract' },
      { key: 'sale-out', title: '销售出库', path: '/sale/out' },
      { key: 'sale-return', title: '销售退货', path: '/sale/return' },
      { key: 'sale-commission-setting', title: '提成设置', path: '/sale/commission-setting' },
    ],
  },
  {
    key: 'retail',
    title: '零售',
    icon: 'Shop',
    children: [
      { key: 'retail-overview', title: '零售总览', path: '/retail/overview' },
      { key: 'retail-store', title: '门店管理', path: '/retail/store' },
      { key: 'retail-order', title: '零售订单', path: '/retail/order' },
      { key: 'retail-return', title: '零售退货', path: '/retail/return' },
      { key: 'retail-customer', title: '会员管理', path: '/retail/customer' },
      { key: 'retail-recharge', title: '会员充值', path: '/retail/recharge' },
      { key: 'retail-points', title: '积分记录', path: '/retail/points' },
      { key: 'retail-coupon', title: '优惠券', path: '/retail/coupon' },
    ],
  },
  {
    key: 'procure',
    title: '采购',
    icon: 'Box',
    children: [
      { key: 'procure-supplier', title: '供应商管理', path: '/procure/supplier' },
      { key: 'procure-plan', title: '采购计划', path: '/procure/plan' },
      { key: 'procure-order', title: '采购订单', path: '/procure/order' },
      { key: 'procure-inhouse', title: '采购入库', path: '/procure/inhouse' },
      { key: 'procure-return', title: '采购退货', path: '/procure/return' },
    ],
  },
  {
    key: 'warehouse',
    title: '仓库',
    icon: 'House',
    children: [
      { key: 'warehouse-stock', title: '库存总览', path: '/warehouse/stock' },
      { key: 'warehouse-scrap', title: '报废管理', path: '/warehouse/scrap' },
      { key: 'warehouse-transfer', title: '调拨管理', path: '/warehouse/transfer' },
      { key: 'warehouse-flow', title: '出入库流水', path: '/warehouse/flow' },
      { key: 'warehouse-pick', title: '拣货管理', path: '/warehouse/pick' },
      { key: 'warehouse-check', title: '盘点管理', path: '/warehouse/check' },
      { key: 'warehouse-other-in', title: '其他入库', path: '/warehouse/other-in' },
      { key: 'warehouse-other-out', title: '其他出库', path: '/warehouse/other-out' },
      { key: 'warehouse-warning', title: '库存预警', path: '/warehouse/warning' },
      { key: 'warehouse-name', title: '仓库管理', path: '/warehouse/name' },
      { key: 'warehouse-batch', title: '批次管理', path: '/warehouse/batch' },
      { key: 'warehouse-serial', title: '序列号管理', path: '/warehouse/serial' },
    ],
  },
  {
    key: 'production',
    title: '生产',
    icon: 'Tools',
    children: [
      { key: 'production-overview', title: '生产总览', path: '/production/overview' },
      { key: 'production-plan', title: '生产计划', path: '/production/plan' },
      { key: 'production-inhouse', title: '生产入库', path: '/production/inhouse' },
      { key: 'production-material', title: '领料管理', path: '/production/material' },
    ],
  },
  {
    key: 'outsource',
    title: '委外',
    icon: 'Connection',
    children: [
      { key: 'outsource-plan', title: '委外计划', path: '/outsource/plan' },
      { key: 'outsource-inhouse', title: '委外入库', path: '/outsource/inhouse' },
      { key: 'outsource-receive', title: '收货管理', path: '/outsource/receive' },
      { key: 'outsource-quality', title: '质检管理', path: '/outsource/quality' },
      { key: 'outsource-payable', title: '应付账款', path: '/outsource/payable' },
      { key: 'outsource-payment', title: '付款管理', path: '/outsource/payment' },
    ],
  },
  {
    key: 'finance',
    title: '财务',
    icon: 'Money',
    children: [
      { key: 'finance-overview', title: '财务总览', path: '/finance/overview' },
      { key: 'finance-profit', title: '利润表', path: '/reports/finance' },
      { key: 'finance-receivable', title: '应收账款', path: '/finance/receivable' },
      { key: 'finance-payable', title: '应付账款', path: '/finance/payable' },
      { key: 'finance-collect-receipt', title: '收款单', path: '/finance/collect-receipt' },
      { key: 'finance-pay-receipt', title: '付款单', path: '/finance/pay-receipt' },
      { key: 'finance-invoice', title: '发票管理', path: '/finance/invoice' },
      { key: 'finance-statement', title: '对账单', path: '/finance/statement' },
      { key: 'finance-expense', title: '费用管理', path: '/finance/expense' },
      { key: 'finance-fund', title: '资金账户', path: '/finance/fund' },
      { key: 'finance-fund-flow', title: '资金流水', path: '/finance/fund-flow' },
      { key: 'finance-income-expense-flow', title: '收支流水', path: '/finance/income-expense-flow' },
      { key: 'finance-cost', title: '成本核算', path: '/finance/cost' },
      { key: 'finance-prepay', title: '预收款', path: '/finance/prepay' },
      { key: 'finance-supplier-prepay', title: '预付款', path: '/finance/supplier-prepay' },
      { key: 'finance-other-expense', title: '其他支出', path: '/finance/other-expense' },
      { key: 'finance-other-income', title: '其他收入', path: '/finance/other-income' },
    ],
  },
  {
    key: 'goods',
    title: '商品',
    icon: 'Goods',
    children: [
      { key: 'goods-info', title: '商品列表', path: '/goods/info' },
      { key: 'goods-unit', title: '计量单位', path: '/goods/unit' },
      { key: 'goods-brand', title: '品牌管理', path: '/goods/brand' },
      { key: 'goods-bom', title: 'BOM清单', path: '/goods/bom' },
    ],
  },
  {
    key: 'reports',
    title: '报表',
    icon: 'TrendCharts',
    children: [
      { key: 'reports-overview', title: '报表总览', path: '/reports/overview' },
      { key: 'reports-sale-rate', title: '销售统计', path: '/reports/sale-rate' },
      { key: 'reports-sale-ledger', title: '销售台账', path: '/reports/sale-ledger' },
      { key: 'reports-commission', title: '提成报表', path: '/reports/commission' },
      { key: 'reports-procure', title: '采购统计', path: '/reports/procure' },
      { key: 'reports-procure-ledger', title: '采购台账', path: '/reports/procure-ledger' },
      { key: 'reports-stock', title: '库存报表', path: '/reports/stock' },
      { key: 'reports-profit', title: '利润报表', path: '/reports/profit' },
      { key: 'reports-finance', title: '财务报表', path: '/reports/finance' },
    ],
  },
  {
    key: 'office',
    title: '办公',
    icon: 'Briefcase',
    children: [
      { key: 'office-task', title: '任务管理', path: '/office/task' },
      { key: 'office-cloud', title: '云盘', path: '/office/cloud' },
      { key: 'office-remind', title: '日程提醒', path: '/office/remind' },
      { key: 'office-notice', title: '公告通知', path: '/office/notice' },
      { key: 'office-approval', title: '审批流程', path: '/office/approval' },
      { key: 'office-work-report', title: '工作汇报', path: '/office/work-report' },
      { key: 'office-visit', title: '外勤打卡', path: '/office/visit' },
      { key: 'office-expense', title: '报销申请', path: '/office/expense' },
      { key: 'office-leave', title: '请假申请', path: '/office/leave' },
      { key: 'office-overtime', title: '加班申请', path: '/office/overtime' },
      { key: 'office-business', title: '出差申请', path: '/office/business' },
    ],
  },
  {
    key: 'setting',
    title: '设置',
    icon: 'Setting',
    children: [
      { key: 'setting-dept', title: '部门管理', path: '/setting/dept' },
      { key: 'setting-role', title: '角色管理', path: '/setting/role' },
      { key: 'setting-jobs', title: '职务管理', path: '/setting/jobs' },
      { key: 'setting-admin', title: '账号管理', path: '/setting/admin' },
      { key: 'setting-params', title: '参数设置', path: '/setting/params' },
      { key: 'setting-print', title: '打印模板', path: '/setting/print' },
      { key: 'setting-operation-log', title: '操作日志', path: '/setting/operation-log' },
      { key: 'setting-company', title: '企业信息', path: '/setting/company' },
    ],
  },
  {
    key: 'personnel',
    title: '人事',
    icon: 'User',
    children: [
      { key: 'personnel-salary', title: '薪资管理', path: '/personnel/salary' },
      { key: 'personnel-job-change', title: '异动记录', path: '/personnel/job-change' },
      { key: 'personnel-resign', title: '离职管理', path: '/personnel/resign' },
      { key: 'personnel-car', title: '用车管理', path: '/personnel/car' },
      { key: 'personnel-attendance', title: '考勤管理', path: '/personnel/attendance' },
      { key: 'personnel-recruit', title: '招聘管理', path: '/personnel/recruit' },
      { key: 'personnel-staff', title: '员工档案', path: '/personnel/staff' },
      { key: 'personnel-contract', title: '劳动合同', path: '/personnel/contract' },
      { key: 'personnel-social', title: '社保管理', path: '/personnel/social' },
      { key: 'personnel-welfare', title: '福利管理', path: '/personnel/welfare' },
    ],
  },
  {
    key: 'ecommerce',
    title: '电商运营',
    icon: 'DataLine',
    children: [
      { key: 'ecommerce-overview', title: '运营大屏', path: '/ecommerce/overview' },
      { key: 'ecommerce-platforms', title: '平台管理', path: '/ecommerce/platforms' },
      { key: 'ecommerce-orders', title: '订单中心', path: '/ecommerce/orders' },
      { key: 'ecommerce-stock', title: '库存同步', path: '/ecommerce/stock' },
      { key: 'ecommerce-offline', title: '线下运营', path: '/ecommerce/offline' },
      { key: 'ecommerce-agent', title: '智能运营', path: '/ecommerce/agent' },
    ],
  },
]
