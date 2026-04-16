import type { RouteRecordRaw } from 'vue-router'

// Lazy-load all views
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/portal',
    name: 'Portal',
    component: () => import('@/views/Portal.vue'),
    meta: { title: '选择模块', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '工作台' } },
      { path: 'dashboard/today-sales', name: 'TodaySales', component: () => import('@/views/dashboard/TodaySales.vue'), meta: { title: '今日销售' } },

      // Sale
      { path: 'sale/overview', name: 'SaleOverview', component: () => import('@/views/sale/SaleOverview.vue'), meta: { title: '销售总览' } },
      { path: 'sale/client', name: 'SaleClient', component: () => import('@/views/sale/ClientList.vue'), meta: { title: '客户管理' } },
      { path: 'sale/sea', name: 'SaleSea', component: () => import('@/views/sale/ClientSea.vue'), meta: { title: '客户公海' } },
      { path: 'sale/level', name: 'SaleLevel', component: () => import('@/views/sale/CustomerLevel.vue'), meta: { title: '客户等级' } },
      { path: 'sale/commission-setting', name: 'SaleCommissionSetting', component: () => import('@/views/sale/CommissionSetting.vue'), meta: { title: '提成设置' } },
      { path: 'sale/offer', name: 'SaleOffer', component: () => import('@/views/sale/Offer.vue'), meta: { title: '销售报价' } },
      { path: 'sale/contract', name: 'SaleContract', component: () => import('@/views/sale/Contract.vue'), meta: { title: '销售合同' } },
      { path: 'sale/out', name: 'SaleOut', component: () => import('@/views/sale/SaleOut.vue'), meta: { title: '销售出库' } },
      { path: 'sale/return', name: 'SaleReturn', component: () => import('@/views/sale/SaleReturn.vue'), meta: { title: '销售退货' } },

      // Retail
      { path: 'retail/overview', name: 'RetailOverview', component: () => import('@/views/retail/RetailOverview.vue'), meta: { title: '零售总览' } },
      { path: 'retail/store', name: 'RetailStore', component: () => import('@/views/retail/StoreManagement.vue'), meta: { title: '门店管理' } },
      { path: 'retail/order', name: 'RetailOrder', component: () => import('@/views/retail/RetailOrder.vue'), meta: { title: '零售订单' } },
      { path: 'retail/return', name: 'RetailReturn', component: () => import('@/views/retail/RetailReturn.vue'), meta: { title: '零售退货' } },
      { path: 'retail/customer', name: 'RetailCustomer', component: () => import('@/views/retail/MemberManage.vue'), meta: { title: '会员管理' } },
      { path: 'retail/recharge', name: 'RetailRecharge', component: () => import('@/views/retail/MemberRecharge.vue'), meta: { title: '会员充值' } },
      { path: 'retail/points', name: 'RetailPoints', component: () => import('@/views/retail/PointsRecord.vue'), meta: { title: '积分记录' } },
      { path: 'retail/coupon', name: 'RetailCoupon', component: () => import('@/views/retail/Coupon.vue'), meta: { title: '优惠券' } },

      // Procure
      { path: 'procure/supplier', name: 'ProcureSupplier', component: () => import('@/views/procure/SupplierList.vue'), meta: { title: '供应商管理' } },
      { path: 'procure/plan', name: 'ProcurePlan', component: () => import('@/views/procure/Plan.vue'), meta: { title: '采购计划' } },
      { path: 'procure/order', name: 'ProcureOrder', component: () => import('@/views/procure/Order.vue'), meta: { title: '采购订单' } },
      { path: 'procure/inhouse', name: 'ProcureInhouse', component: () => import('@/views/procure/Inhouse.vue'), meta: { title: '采购入库' } },
      { path: 'procure/return', name: 'ProcureReturn', component: () => import('@/views/procure/Return.vue'), meta: { title: '采购退货' } },

      // Warehouse
      { path: 'warehouse/stock', name: 'WarehouseStock', component: () => import('@/views/warehouse/StockAll.vue'), meta: { title: '库存总览' } },
      { path: 'warehouse/scrap', name: 'WarehouseScrap', component: () => import('@/views/warehouse/Scrap.vue'), meta: { title: '报废管理' } },
      { path: 'warehouse/transfer', name: 'WarehouseTransfer', component: () => import('@/views/warehouse/Transfer.vue'), meta: { title: '调拨管理' } },
      { path: 'warehouse/flow', name: 'WarehouseFlow', component: () => import('@/views/warehouse/InOutFlow.vue'), meta: { title: '出入库流水' } },
      { path: 'warehouse/pick', name: 'WarehousePick', component: () => import('@/views/warehouse/Pick.vue'), meta: { title: '拣货管理' } },
      { path: 'warehouse/check', name: 'WarehouseCheck', component: () => import('@/views/warehouse/StockCheck.vue'), meta: { title: '盘点管理' } },
      { path: 'warehouse/other-in', name: 'WarehouseOtherIn', component: () => import('@/views/warehouse/OtherIn.vue'), meta: { title: '其他入库' } },
      { path: 'warehouse/other-out', name: 'WarehouseOtherOut', component: () => import('@/views/warehouse/OtherOut.vue'), meta: { title: '其他出库' } },
      { path: 'warehouse/warning', name: 'WarehouseWarning', component: () => import('@/views/warehouse/StockWarning.vue'), meta: { title: '库存预警' } },
      { path: 'warehouse/location', name: 'WarehouseLocation', component: () => import('@/views/warehouse/Location.vue'), meta: { title: '仓位管理' } },
      { path: 'warehouse/name', name: 'WarehouseName', component: () => import('@/views/warehouse/WarehouseName.vue'), meta: { title: '仓库管理' } },
      { path: 'warehouse/batch', name: 'WarehouseBatch', component: () => import('@/views/warehouse/Batch.vue'), meta: { title: '批次管理' } },
      { path: 'warehouse/serial', name: 'WarehouseSerial', component: () => import('@/views/warehouse/Serial.vue'), meta: { title: '序列号管理' } },

      // Production
      { path: 'production/overview', name: 'ProductionOverview', component: () => import('@/views/production/Overview.vue'), meta: { title: '生产总览' } },
      { path: 'production/plan', name: 'ProductionPlan', component: () => import('@/views/production/Plan.vue'), meta: { title: '生产计划' } },
      { path: 'production/inhouse', name: 'ProductionInhouse', component: () => import('@/views/production/Inhouse.vue'), meta: { title: '生产入库' } },
      { path: 'production/material', name: 'ProductionMaterial', component: () => import('@/views/production/Material.vue'), meta: { title: '领料管理' } },

      // Outsource
      { path: 'outsource/plan', name: 'OutsourcePlan', component: () => import('@/views/outsource/Plan.vue'), meta: { title: '委外计划' } },
      { path: 'outsource/inhouse', name: 'OutsourceInhouse', component: () => import('@/views/outsource/Inhouse.vue'), meta: { title: '委外入库' } },
      { path: 'outsource/receive', name: 'OutsourceReceive', component: () => import('@/views/outsource/Receive.vue'), meta: { title: '收货管理' } },
      { path: 'outsource/quality', name: 'OutsourceQuality', component: () => import('@/views/outsource/Quality.vue'), meta: { title: '质检管理' } },
      { path: 'outsource/payable', name: 'OutsourcePayable', component: () => import('@/views/outsource/Payable.vue'), meta: { title: '应付账款' } },
      { path: 'outsource/payment', name: 'OutsourcePayment', component: () => import('@/views/outsource/Payment.vue'), meta: { title: '付款管理' } },

      // Finance
      { path: 'finance/overview', name: 'FinanceOverview', component: () => import('@/views/finance/Overview.vue'), meta: { title: '财务总览' } },
      { path: 'finance/receivable', name: 'FinanceReceivable', component: () => import('@/views/finance/Receivable.vue'), meta: { title: '应收账款' } },
      { path: 'finance/payable', name: 'FinancePayable', component: () => import('@/views/finance/Payable.vue'), meta: { title: '应付账款' } },
      { path: 'finance/collect-receipt', name: 'FinanceCollectReceipt', component: () => import('@/views/finance/CollectReceipt.vue'), meta: { title: '收款单' } },
      { path: 'finance/pay-receipt', name: 'FinancePayReceipt', component: () => import('@/views/finance/PayReceipt.vue'), meta: { title: '付款单' } },
      { path: 'finance/pay-receipt/new', name: 'FinancePayReceiptNew', component: () => import('@/views/finance/PayReceiptNew.vue'), meta: { title: '新增付款单' } },
      { path: 'finance/invoice', name: 'FinanceInvoice', component: () => import('@/views/finance/Invoice.vue'), meta: { title: '发票管理' } },
      { path: 'finance/statement', name: 'FinanceStatement', component: () => import('@/views/finance/Statement.vue'), meta: { title: '对账单' } },
      { path: 'finance/expense', name: 'FinanceExpense', component: () => import('@/views/finance/Expense.vue'), meta: { title: '费用管理' } },
      { path: 'finance/fund', name: 'FinanceFund', component: () => import('@/views/finance/Fund.vue'), meta: { title: '资金账户' } },
      { path: 'finance/fund-flow', name: 'FinanceFundFlow', component: () => import('@/views/finance/FundFlow.vue'), meta: { title: '资金流水' } },
      { path: 'finance/cost', name: 'FinanceCost', component: () => import('@/views/finance/Cost.vue'), meta: { title: '成本核算' } },
      { path: 'finance/prepay', name: 'FinancePrepay', component: () => import('@/views/finance/Prepay.vue'), props: { fixedType: 'customer' }, meta: { title: '预收款' } },
      { path: 'finance/supplier-prepay', name: 'FinanceSupplierPrepay', component: () => import('@/views/finance/Prepay.vue'), props: { fixedType: 'supplier' }, meta: { title: '预付款' } },
      { path: 'finance/other-expense', name: 'FinanceOtherExpense', component: () => import('@/views/finance/OtherExpense.vue'), meta: { title: '其他支出' } },
      { path: 'finance/other-income', name: 'FinanceOtherIncome', component: () => import('@/views/finance/OtherIncome.vue'), meta: { title: '其他收入' } },
      { path: 'finance/fix-receivable', name: 'FixReceivable', component: () => import('@/views/finance/FixReceivable.vue'), meta: { title: '修复收款数据' } },

      // Goods
      { path: 'goods/info', name: 'GoodsInfo', component: () => import('@/views/goods/Info.vue'), meta: { title: '商品资料' } },
      { path: 'goods/cate', name: 'GoodsCate', component: () => import('@/views/goods/Cate.vue'), meta: { title: '商品分类' } },
      { path: 'goods/unit', name: 'GoodsUnit', component: () => import('@/views/goods/Unit.vue'), meta: { title: '计量单位' } },
      { path: 'goods/brand', name: 'GoodsBrand', component: () => import('@/views/goods/Brand.vue'), meta: { title: '品牌管理' } },
      { path: 'goods/spec', name: 'GoodsSpec', component: () => import('@/views/goods/Spec.vue'), meta: { title: '规格设置' } },
      { path: 'goods/bom', name: 'GoodsBom', component: () => import('@/views/goods/Bom.vue'), meta: { title: 'BOM清单' } },
      { path: 'goods/price', name: 'GoodsPrice', component: () => import('@/views/goods/Price.vue'), meta: { title: '商品价格' } },

      // Reports
      { path: 'reports/overview', name: 'ReportsOverview', component: () => import('@/views/reports/Overview.vue'), meta: { title: '报表总览' } },
      { path: 'reports/sale-rate', name: 'ReportsSaleRate', component: () => import('@/views/reports/SaleRate.vue'), meta: { title: '销售统计' } },
      { path: 'reports/sale-ledger', name: 'ReportsSaleLedger', component: () => import('@/views/reports/SaleLedger.vue'), meta: { title: '销售台账' } },
      { path: 'reports/commission', name: 'ReportsCommission', component: () => import('@/views/reports/Commission.vue'), meta: { title: '提成报表' } },
      { path: 'reports/procure', name: 'ReportsProcure', component: () => import('@/views/reports/Procure.vue'), meta: { title: '采购统计' } },
      { path: 'reports/procure-ledger', name: 'ReportsProcureLedger', component: () => import('@/views/reports/ProcureLedger.vue'), meta: { title: '采购台账' } },
      { path: 'reports/stock', name: 'ReportsStock', component: () => import('@/views/reports/Stock.vue'), meta: { title: '库存报表' } },
      { path: 'reports/profit', name: 'ReportsProfit', component: () => import('@/views/reports/Profit.vue'), meta: { title: '利润报表' } },
      { path: 'reports/finance', name: 'ReportsFinance', component: () => import('@/views/reports/Finance.vue'), meta: { title: '财务报表' } },

      // Office
      { path: 'office/task', name: 'OfficeTask', component: () => import('@/views/office/Task.vue'), meta: { title: '任务管理' } },
      { path: 'office/cloud', name: 'OfficeCloud', component: () => import('@/views/office/Cloud.vue'), meta: { title: '云盘' } },
      { path: 'office/remind', name: 'OfficeRemind', component: () => import('@/views/office/Remind.vue'), meta: { title: '日程提醒' } },
      { path: 'office/notice', name: 'OfficeNotice', component: () => import('@/views/office/Notice.vue'), meta: { title: '公告通知' } },
      { path: 'office/approval', name: 'OfficeApproval', component: () => import('@/views/office/Approval.vue'), meta: { title: '审批流程' } },
      { path: 'office/work-report', name: 'OfficeWorkReport', component: () => import('@/views/office/WorkReport.vue'), meta: { title: '工作汇报' } },
      { path: 'office/visit', name: 'OfficeVisit', component: () => import('@/views/office/Visit.vue'), meta: { title: '外勤打卡' } },
      { path: 'office/expense', name: 'OfficeExpense', component: () => import('@/views/office/Expense.vue'), meta: { title: '报销申请' } },
      { path: 'office/leave', name: 'OfficeLeave', component: () => import('@/views/office/Leave.vue'), meta: { title: '请假申请' } },
      { path: 'office/overtime', name: 'OfficeOvertime', component: () => import('@/views/office/Overtime.vue'), meta: { title: '加班申请' } },
      { path: 'office/business', name: 'OfficeBusiness', component: () => import('@/views/office/Business.vue'), meta: { title: '出差申请' } },

      // Setting
      { path: 'setting/dept', name: 'SettingDept', component: () => import('@/views/setting/Dept.vue'), meta: { title: '部门管理' } },
      { path: 'setting/role', name: 'SettingRole', component: () => import('@/views/setting/Role.vue'), meta: { title: '角色管理' } },
      { path: 'setting/jobs', name: 'SettingJobs', component: () => import('@/views/setting/Jobs.vue'), meta: { title: '职务管理' } },
      { path: 'setting/admin', name: 'SettingAdmin', component: () => import('@/views/setting/Admin.vue'), meta: { title: '账号管理' } },
      { path: 'setting/params', name: 'SettingParams', component: () => import('@/views/setting/Params.vue'), meta: { title: '参数设置' } },
      { path: 'setting/print', name: 'SettingPrint', component: () => import('@/views/setting/Print.vue'), meta: { title: '打印模板' } },
      { path: 'setting/operation-log', name: 'SettingOperationLog', component: () => import('@/views/setting/OperationLog.vue'), meta: { title: '操作日志' } },
      { path: 'setting/company', name: 'SettingCompany', component: () => import('@/views/setting/Company.vue'), meta: { title: '企业信息' } },

      // Personnel
      { path: 'personnel/salary', name: 'PersonnelSalary', component: () => import('@/views/personnel/Salary.vue'), meta: { title: '薪资管理' } },
      { path: 'personnel/job-change', name: 'PersonnelJobChange', component: () => import('@/views/personnel/JobChange.vue'), meta: { title: '异动记录' } },
      { path: 'personnel/resign', name: 'PersonnelResign', component: () => import('@/views/personnel/Resign.vue'), meta: { title: '离职管理' } },
      { path: 'personnel/car', name: 'PersonnelCar', component: () => import('@/views/personnel/Car.vue'), meta: { title: '用车管理' } },
      { path: 'personnel/attendance', name: 'PersonnelAttendance', component: () => import('@/views/personnel/Attendance.vue'), meta: { title: '考勤管理' } },
      { path: 'personnel/recruit', name: 'PersonnelRecruit', component: () => import('@/views/personnel/Recruit.vue'), meta: { title: '招聘管理' } },
      { path: 'personnel/staff', name: 'PersonnelStaff', component: () => import('@/views/personnel/Staff.vue'), meta: { title: '员工档案' } },
      { path: 'personnel/contract', name: 'PersonnelContract', component: () => import('@/views/personnel/Contract.vue'), meta: { title: '劳动合同' } },
      { path: 'personnel/social', name: 'PersonnelSocial', component: () => import('@/views/personnel/Social.vue'), meta: { title: '社保管理' } },
      { path: 'personnel/welfare', name: 'PersonnelWelfare', component: () => import('@/views/personnel/Welfare.vue'), meta: { title: '福利管理' } },
    ],
  },
  // ── 移动协作模块（独立布局）────────────
  {
    path: '/mobile',
    component: () => import('@/layouts/MobileLayout.vue'),
    redirect: '/mobile/workbench',
    children: [
      { path: 'workbench', name: 'MobileWorkbench', component: () => import('@/views/mobile/MobileWorkbench.vue'), meta: { title: '工作台' } },
      { path: 'chat', name: 'MobileChat', component: () => import('@/views/mobile/MobileChat.vue'), meta: { title: '消息' } },
      { path: 'chat/new', name: 'MobileNewChat', component: () => import('@/views/mobile/MobileNewChat.vue'), meta: { title: '发起会话' } },
      { path: 'chat/:id', name: 'MobileGroupChat', component: () => import('@/views/mobile/MobileGroupChat.vue'), meta: { title: '群聊' } },
      { path: 'contacts', name: 'MobileContacts', component: () => import('@/views/mobile/MobileContacts.vue'), meta: { title: '通讯录' } },
      { path: 'activity', name: 'MobileActivity', component: () => import('@/views/mobile/MobileActivity.vue'), meta: { title: '工作动态' } },
      { path: 'ai-bot', name: 'MobileAIBot', component: () => import('@/views/mobile/MobileAIBot.vue'), meta: { title: 'AI 管家' } },
      { path: 'my', name: 'MobileMy', component: () => import('@/views/mobile/MobileMy.vue'), meta: { title: '我的' } },
      // ── 业务模块（复用 PC 端组件，MobileLayout 包裹）──
      // Sale
      { path: 'sale/overview', name: 'MobileSaleOverview', component: () => import('@/views/sale/SaleOverview.vue'), meta: { title: '销售总览' } },
      { path: 'sale/client', name: 'MobileSaleClient', component: () => import('@/views/sale/ClientList.vue'), meta: { title: '客户管理' } },
      { path: 'sale/out', name: 'MobileSaleOut', component: () => import('@/views/sale/SaleOut.vue'), meta: { title: '销售出库' } },
      { path: 'sale/return', name: 'MobileSaleReturn', component: () => import('@/views/sale/SaleReturn.vue'), meta: { title: '销售退货' } },
      // Procure
      { path: 'procure/supplier', name: 'MobileProcureSupplier', component: () => import('@/views/procure/SupplierList.vue'), meta: { title: '供应商管理' } },
      { path: 'procure/order', name: 'MobileProcureOrder', component: () => import('@/views/procure/Order.vue'), meta: { title: '采购订单' } },
      { path: 'procure/inhouse', name: 'MobileProcureInhouse', component: () => import('@/views/procure/Inhouse.vue'), meta: { title: '采购入库' } },
      // Warehouse
      { path: 'warehouse/stock', name: 'MobileWarehouseStock', component: () => import('@/views/warehouse/StockAll.vue'), meta: { title: '库存总览' } },
      { path: 'warehouse/warning', name: 'MobileWarehouseWarning', component: () => import('@/views/warehouse/StockWarning.vue'), meta: { title: '库存预警' } },
      // Finance
      { path: 'finance/overview', name: 'MobileFinanceOverview', component: () => import('@/views/finance/Overview.vue'), meta: { title: '财务总览' } },
      { path: 'finance/receivable', name: 'MobileFinanceReceivable', component: () => import('@/views/finance/Receivable.vue'), meta: { title: '应收账款' } },
      // Goods
      { path: 'goods/info', name: 'MobileGoodsInfo', component: () => import('@/views/goods/Info.vue'), meta: { title: '商品资料' } },
      { path: 'goods/brand', name: 'MobileGoodsBrand', component: () => import('@/views/goods/Brand.vue'), meta: { title: '品牌管理' } },
      // Production
      { path: 'production/plan', name: 'MobileProductionPlan', component: () => import('@/views/production/Plan.vue'), meta: { title: '生产计划' } },
      // Personnel
      { path: 'personnel/staff', name: 'MobilePersonnelStaff', component: () => import('@/views/personnel/Staff.vue'), meta: { title: '员工档案' } },
      // Investment
      { path: 'investment/overview', name: 'MobileInvestmentOverview', component: () => import('@/views/investment/Index.vue'), meta: { title: '投资管理' } },
    ],
  },

  // Catch-all redirect
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },

  // 超级管理员控制台（独立页面，无 AdminLayout）
  {
    path: '/admin-console',
    name: 'AdminConsole',
    component: () => import('@/views/AdminConsole.vue'),
    meta: { title: '租户管理控制台', superAdmin: true },
  },

  // 付费版介绍页
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('@/views/Pricing.vue'),
    meta: { title: '升级付费版', public: true },
  },

  // 独立页面（不使用 AdminLayout）
  {
    path: '/cashregister',
    name: 'CashRegister',
    component: () => import('@/views/retail/CashRegister.vue'),
    meta: { title: '收银台' },
  },
  // 智能体工作流（独立布局）
  {
    path: '/agent',
    component: () => import('@/layouts/AgentLayout.vue'),
    children: [
      { path: '', name: 'AgentDashboard', component: () => import('@/views/agent/Dashboard.vue'), meta: { title: '智能体工作台' } },
      { path: 'meeting', name: 'AgentMeeting', component: () => import('@/views/agent/MeetingRoom.vue'), meta: { title: '会议室' } },
      { path: 'tasks', name: 'AgentTasks', component: () => import('@/views/agent/TaskCenter.vue'), meta: { title: '任务中心' } },
      { path: 'triggers', name: 'AgentTriggers', component: () => import('@/views/agent/Triggers.vue'), meta: { title: '触发器' } },
      { path: 'content', name: 'AgentContent', component: () => import('@/views/agent/ContentDept.vue'), meta: { title: '内容部' } },
      { path: 'creative', name: 'AgentCreative', component: () => import('@/views/agent/CreativeDept.vue'), meta: { title: '创意部' } },
      { path: 'brand', name: 'AgentBrand', component: () => import('@/views/agent/BrandDept.vue'), meta: { title: '品牌部' } },
      { path: 'brand-settings', name: 'AgentBrandSettings', component: () => import('@/views/agent/Brand.vue'), meta: { title: '品牌配置' } },
      { path: 'trending', name: 'AgentTrending', component: () => import('@/views/agent/Trending.vue'), meta: { title: '热搜抓取' } },
      { path: 'copywriting', name: 'AgentCopywriting', component: () => import('@/views/agent/Copywriting.vue'), meta: { title: '文案生成' } },
      { path: 'poster', name: 'AgentPoster', component: () => import('@/views/agent/Poster.vue'), meta: { title: '图文海报' } },
      { path: 'video', name: 'AgentVideo', component: () => import('@/views/agent/Video.vue'), meta: { title: '视频生成' } },
      { path: 'creative-lab', name: 'AgentCreativeLab', component: () => import('@/views/agent/CreativeLab.vue'), meta: { title: 'AI创意实验室' } },
      { path: 'publish', name: 'AgentPublish', component: () => import('@/views/agent/Publish.vue'), meta: { title: '发布管理' } },
      { path: 'history', name: 'AgentHistory', component: () => import('@/views/agent/History.vue'), meta: { title: '历史记录' } },
      { path: 'marketing', name: 'AgentMarketing', component: () => import('@/views/investment/Marketing.vue'), meta: { title: '营销顾问' } },
      { path: 'designer', name: 'AgentDesigner', component: () => import('@/views/investment/Designer.vue'), meta: { title: '平面设计师' } },
    ],
  },
  // 品牌主页 & 零售中心（独立布局，公开访问无需ERP登录）
  {
    path: '/brand',
    component: () => import('@/layouts/BrandLayout.vue'),
    meta: { public: true },
    children: [
      { path: '', name: 'BrandIndex', component: () => import('@/views/brand/Index.vue'), meta: { title: 'NOMADIC DAIRY', public: true } },
      { path: 'retail', name: 'BrandRetail', component: () => import('@/views/brand/Index.vue'), meta: { title: '零售商城 - NOMADIC DAIRY', public: true } },
      { path: 'wholesale', name: 'BrandWholesale', component: () => import('@/views/brand/Index.vue'), meta: { title: '采购商主页 - NOMADIC DAIRY', public: true } },
      { path: 'products', name: 'BrandProducts', component: () => import('@/views/brand/Products.vue'), meta: { title: '全部产品 - NOMADIC DAIRY', public: true } },
      { path: 'product/:id', name: 'BrandProductDetail', component: () => import('@/views/brand/ProductDetail.vue'), meta: { title: '产品详情 - NOMADIC DAIRY', public: true } },
      { path: 'cart', name: 'BrandCart', component: () => import('@/views/brand/Cart.vue'), meta: { title: '购物车 - NOMADIC DAIRY', public: true } },
      { path: 'reviews', name: 'BrandReviews', component: () => import('@/views/brand/Reviews.vue'), meta: { title: '用户评价 - NOMADIC DAIRY', public: true } },
      { path: 'story', name: 'BrandStory', component: () => import('@/views/brand/Story.vue'), meta: { title: '品牌故事 - NOMADIC DAIRY', public: true } },
      { path: 'shipping', name: 'BrandShipping', component: () => import('@/views/brand/Shipping.vue'), meta: { title: '物流查询 - NOMADIC DAIRY', public: true } },
      { path: 'support', name: 'BrandSupport', component: () => import('@/views/brand/Support.vue'), meta: { title: '客户支持 - NOMADIC DAIRY', public: true } },
      { path: 'settings', name: 'BrandSettings', component: () => import('@/views/brand/Settings.vue'), meta: { title: '品牌设置 - NOMADIC DAIRY', public: true } },
      { path: 'orders', name: 'BrandOrders', component: () => import('@/views/brand/Orders.vue'), meta: { title: '订单查询 - NOMADIC DAIRY', public: true } },
      { path: 'wholesale-apply', name: 'BrandWholesaleApply', component: () => import('@/views/brand/WholesaleApply.vue'), meta: { title: '采购商申请 - NOMADIC DAIRY', public: true } },
      { path: 'checkout', name: 'BrandCheckout', component: () => import('@/views/brand/Checkout.vue'), meta: { title: '结账 - NOMADIC DAIRY', public: true } },
    ],
  },
  // 投资部门（独立布局 — 黑曜石观测舱）
  {
    path: '/investment',
    component: () => import('@/layouts/InvestmentLayout.vue'),
    children: [
      { path: '', name: 'InvestmentIndex', component: () => import('@/views/investment/Index.vue'), meta: { title: '亚当观测舱' } },
      { path: 'city', name: 'InvestmentCity', component: () => import('@/views/investment/City.vue'), meta: { title: '生态园区' } },
      { path: 'market', name: 'InvestmentMarket', component: () => import('@/views/investment/Market.vue'), meta: { title: '市场' } },
      { path: 'marketing', name: 'InvestmentMarketing', component: () => import('@/views/investment/Marketing.vue'), meta: { title: '营销顾问' } },
      { path: 'designer', name: 'InvestmentDesigner', component: () => import('@/views/investment/Designer.vue'), meta: { title: '平面设计师' } },
      { path: 'archive', name: 'InvestmentArchive', component: () => import('@/views/investment/Archive.vue'), meta: { title: '档案馆' } },
      { path: 'library', name: 'InvestmentLibrary', component: () => import('@/views/investment/Library.vue'), meta: { title: '图书馆' } },
      { path: 'workspace', redirect: '/investment/city' },
    ],
  },
]

export default routes
