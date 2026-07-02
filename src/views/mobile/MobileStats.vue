<template>
  <div class="mstats">
    <div class="mstats-scroll">

    <!-- 今日核心指标 -->
    <div class="ms-kpi-grid">
      <div class="ms-kpi-card" @click="router.push('/mobile/sale/today')">
        <div class="ms-kpi-label">{{ t('mobileStats.todayRevenue') }}</div>
        <div class="ms-kpi-value">¥{{ todayStats.saleAmt }}</div>
        <div class="ms-kpi-sub">{{ t('mobileStats.todayOrders', { count: todayStats.orderCount }) }}</div>
      </div>
      <div class="ms-kpi-card" @click="router.push('/finance/fund-flow?type=expense&date=today')">
        <div class="ms-kpi-label">{{ t('mobileStats.todayExpense') }}</div>
        <div class="ms-kpi-value">¥{{ todayExpense }}</div>
        <div class="ms-kpi-sub">{{ t('mobileStats.paymentAndExpense') }}</div>
      </div>
    </div>

    <!-- 销售入口 -->
    <div class="ms-entry-grid">
      <div class="ms-entry-card" @click="router.push('/mobile/sale/contract')">
        <div class="ms-entry-ico">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d2129" stroke-width="1.6"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div class="ms-entry-text">{{ t('mobileTodaySale.entrySaleOrders') }}</div>
      </div>
      <div class="ms-entry-card" @click="router.push('/mobile/retail/order')">
        <div class="ms-entry-ico">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d2129" stroke-width="1.6"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <div class="ms-entry-text">{{ t('mobileTodaySale.entryRetailOrders') }}</div>
      </div>
      <div class="ms-entry-card" @click="router.push('/mobile/online/overview')">
        <div class="ms-entry-ico">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d2129" stroke-width="1.6"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div class="ms-entry-text">{{ t('mobileTodaySale.entryOnlineOrders') }}</div>
      </div>
    </div>

    <!-- 智能洞察 -->
    <div class="ms-insights-card">
      <div class="ms-insights-header">
        <div class="ms-insights-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/></svg>
        </div>
        <div class="ms-insights-title">{{ t('mobileStats.insightsTitle') }}</div>
        <div class="ms-insights-sub">{{ t('mobileStats.insightsSub') }}</div>
      </div>
      <div class="ms-insights-list">
        <div v-for="item in insightItems" :key="item.tag" class="ms-insight-item">
          <div class="ms-insight-tag">{{ item.tag }}</div>
          <div class="ms-insight-text">{{ item.text }}</div>
        </div>
      </div>
    </div>

    <!-- 利润分析趋势 -->
    <div class="ms-profit-card">
      <div class="ms-profit-header">
        <div class="ms-profit-title">💹 {{ t('mobileStats.profitTrend') }}</div>
        <div class="ms-sale-tabs">
          <button :class="['ms-tab', profitPeriod === 'today' ? 'active' : '']" @click="profitPeriod = 'today'">{{ t('mobileStats.today') }}</button>
          <button :class="['ms-tab', profitPeriod === '7d' ? 'active' : '']" @click="profitPeriod = '7d'">{{ t('mobileStats.days7') }}</button>
          <button :class="['ms-tab', profitPeriod === '30d' ? 'active' : '']" @click="profitPeriod = '30d'">{{ t('mobileStats.days30') }}</button>
          <button :class="['ms-tab', profitPeriod === '3m' ? 'active' : '']" @click="profitPeriod = '3m'">{{ t('mobileStats.months3') }}</button>
        </div>
      </div>
      <div class="ms-profit-summary">
        <div class="ms-profit-sum-item">
          <div class="ms-profit-sum-label">{{ t('mobileStats.revenue') }}</div>
          <div class="ms-profit-sum-val" style="color:#0071e3">¥{{ profitChartData.totalRevenue }}</div>
        </div>
        <div class="ms-profit-sum-item">
          <div class="ms-profit-sum-label">{{ t('mobileStats.cost') }}</div>
          <div class="ms-profit-sum-val" style="color:#f53f3f">¥{{ profitChartData.totalExpense }}</div>
        </div>
        <div class="ms-profit-sum-item">
          <div class="ms-profit-sum-label">{{ t('mobileStats.profit') }}</div>
          <div class="ms-profit-sum-val" :style="{ color: profitChartData.profitPositive ? '#00b42a' : '#f53f3f' }">¥{{ profitChartData.totalProfit }}</div>
        </div>
        <div class="ms-profit-sum-item">
          <div class="ms-profit-sum-label">{{ t('mobileStats.margin') }}</div>
          <div class="ms-profit-sum-val" :style="{ color: profitChartData.profitPositive ? '#00b42a' : '#f53f3f' }">{{ profitChartData.marginPct }}%</div>
        </div>
      </div>
      <!-- SVG 利润柱状图：以零为基准，绿色=正利润，红色=亏损 -->
      <div class="ms-profit-chart-wrap">
        <svg class="ms-profit-svg" :viewBox="`0 0 ${profitChartData.bars.length * 8} 60`" preserveAspectRatio="none">
          <!-- 零基准线 -->
          <line x1="0" y1="30" :x2="profitChartData.bars.length * 8" y2="30"
            stroke="rgba(0,0,0,0.12)" stroke-width="0.5" stroke-dasharray="2,2"/>
          <!-- 复合颜色柱：出库（深色）+ 零售（浅色） -->
          <template v-for="(b, i) in profitChartData.bars" :key="i">
            <!-- 出库部分（靠近零线） -->
            <rect
              :x="i * 8 + 1" :width="6" rx="1"
              :y="b.profit >= 0 ? 30 - b.saleH : 30 + b.retailH"
              :height="Math.max(b.saleH, b.h > 0 && b.saleH === 0 ? 0 : b.saleH)"
              :fill="b.profit >= 0 ? '#00b42a' : '#f53f3f'"
              :opacity="b.isToday ? 1 : 0.75"
            />
            <!-- 零售部分（远离零线的顶端/底端，浅色） -->
            <rect
              :x="i * 8 + 1" :width="6" rx="1"
              :y="b.profit >= 0 ? 30 - b.h : 30"
              :height="Math.max(b.retailH, 0)"
              :fill="b.profit >= 0 ? '#34d399' : '#fca5a5'"
              :opacity="b.isToday ? 1 : 0.75"
            />
          </template>
        </svg>
        <!-- X轴日期标签 -->
        <div class="ms-profit-xlabels">
          <span v-for="(lb, i) in profitChartData.xLabels" :key="i">{{ lb }}</span>
        </div>
      </div>
      <div class="ms-profit-legend">
        <span class="ms-legend-dot" style="background:#00b42a"></span><span>{{ t('mobileStats.outboundProfit') }}</span>
        <span class="ms-legend-dot" style="background:#34d399;margin-left:10px"></span><span>{{ t('mobileStats.retailProfit') }}</span>
        <span class="ms-legend-dot" style="background:#f53f3f;margin-left:10px"></span><span>{{ t('mobileStats.loss') }}</span>
        <span style="margin-left:auto;font-size:10px;color:#c2c8d5">{{ t('mobileStats.revenueMinusCost') }}</span>
      </div>
    </div>

    <!-- 销售统计 -->
    <div class="ms-sale-card" style="margin-top:12px">
      <div class="ms-sale-top">
        <div class="ms-sale-title">{{ t('mobileStats.businessOverview') }}</div>
        <div class="ms-sale-tabs">
          <button :class="['ms-tab', statPeriod === 'today' ? 'active' : '']" @click="statPeriod = 'today'">{{ t('mobileStats.today') }}</button>
          <button :class="['ms-tab', statPeriod === '7d' ? 'active' : '']" @click="statPeriod = '7d'">{{ t('mobileStats.days7') }}</button>
          <button :class="['ms-tab', statPeriod === '30d' ? 'active' : '']" @click="statPeriod = '30d'">{{ t('mobileStats.days30') }}</button>
          <button :class="['ms-tab', statPeriod === '3m' ? 'active' : '']" @click="statPeriod = '3m'">{{ t('mobileStats.months3') }}</button>
        </div>
      </div>
      <div class="ms-main-row">
        <div class="ms-main-item">
          <div class="ms-main-label">{{ t('mobileStats.totalSales') }}</div>
          <div class="ms-main-value">¥{{ salesStats.totalAmt }}</div>
        </div>
        <div class="ms-main-item">
          <div class="ms-main-label">{{ t('mobileStats.orderCount') }}</div>
          <div class="ms-main-value">{{ salesStats.orderCount }}</div>
        </div>
        <div class="ms-main-item">
          <div class="ms-main-label">{{ t('mobileStats.expenseAmt') }}</div>
          <div class="ms-main-value">¥{{ salesStats.expenseAmt }}</div>
        </div>
      </div>
      <div class="ms-sub-row">
        <div class="ms-sub-item">
          <div class="ms-sub-label">{{ t('mobileStats.salesOutbound') }}</div>
          <div class="ms-sub-val">¥{{ salesStats.saleAmt }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">{{ t('mobileStats.retailIncome') }}</div>
          <div class="ms-sub-val">¥{{ salesStats.retailAmt }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">{{ t('mobileStats.salesOrders') }}</div>
          <div class="ms-sub-val">{{ salesStats.saleCount }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">{{ t('mobileStats.retailOrders') }}</div>
          <div class="ms-sub-val">{{ salesStats.retailCount }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">{{ t('mobileStats.customersInvolved') }}</div>
          <div class="ms-sub-val">{{ salesStats.customerCount }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">{{ t('mobileStats.stockWarning') }}</div>
          <div class="ms-sub-val" :style="{ color: stockWarn > 0 ? '#f53f3f' : '#00b42a' }">{{ stockWarn }}</div>
        </div>
      </div>
      <!-- 趋势 -->
      <div v-if="salesStats.sparkData.length > 1" class="ms-spark">
        <div class="ms-spark-label">{{ t('mobileStats.trend') }}</div>
        <div class="ms-spark-bars">
          <div
            v-for="(bar, i) in salesStats.sparkData"
            :key="i"
            class="ms-spark-bar"
            :style="{ height: salesStats.sparkMax > 0 ? Math.max(4, (bar.amt / salesStats.sparkMax) * 44) + 'px' : '4px' }"
            :class="{ today: bar.isToday }"
            :title="`${bar.date}: ¥${bar.amt.toFixed(2)}`"
          />
        </div>
      </div>
      <div class="ms-report-btn" @click="router.push('/mobile/sale/today')">{{ t('mobileStats.viewFullReport') }} →</div>
    </div>

    <!-- 快捷跳转 -->
    <div class="ms-quick-links">
      <div class="ms-ql-title">{{ t('mobileStats.reportCenter') }}</div>
      <div class="ms-ql-grid">
        <div class="ms-ql-item" @click="router.push('/mobile/sale/today')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>{{ t('mobileStats.salesReport') }}</span>
        </div>
        <div class="ms-ql-item" @click="router.push('/mobile/finance/overview')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>{{ t('mobileStats.financeOverview') }}</span>
        </div>
        <div class="ms-ql-item" @click="router.push('/mobile/finance/receivable')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <span>{{ t('mobileStats.receivable') }}</span>
        </div>
        <div class="ms-ql-item" @click="router.push('/mobile/warehouse/stock')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          <span>{{ t('mobileStats.stockOverview') }}</span>
        </div>
      </div>
    </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'

const router = useRouter()
const { t } = useI18n()

const MEITUAN_CUSTOMER_ID = 63

const insightItems = ref([{ tag: t('mobileStats.loadingTag'), text: t('mobileStats.loadingText') }])
const statPeriod = ref<'today' | '7d' | '30d' | '3m'>('today')
const stockWarn = ref(0)
const customerTotal = ref(0)
const todayExpense = ref('0.00')

const _saleRows = ref<any[]>([])
const _retailRows = ref<any[]>([])
const _meituanRows = ref<any[]>([])
const _fundFlowRows = ref<any[]>([])
const _costPriceMap = ref<Record<number, number>>({})
const profitPeriod = ref<'today' | '7d' | '30d' | '3m'>('today')

function meituanDate(r: any) {
  return (r.sign_date || r.order_date || '').slice(0, 10)
}
function meituanAmount(r: any) {
  return Number(r.after_discount || r.total_amount || 0)
}
function isMeituan(r: any) {
  return Number(r.customer_id) === MEITUAN_CUSTOMER_ID && Number(r.status) === 1
}

function getToday() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseGoodsInfo(g: any) {
  if (Array.isArray(g)) return g
  if (typeof g !== 'string' || !g) return []
  try { return JSON.parse(g) } catch { return [] }
}

function getFlowDate(row: any) {
  return String(
    row?.flow_date ||
    row?.pay_date ||
    row?.expense_date ||
    row?.apply_date ||
    row?.created_at ||
    row?.create_time ||
    row?.date ||
    '',
  ).slice(0, 10)
}

function isExpenseFlow(row: any) {
  const flowNo = String(row?.flow_no || '').toUpperCase()
  if (flowNo.startsWith('SK')) return false
  if (flowNo.startsWith('FK')) return true
  const type = String(row?.flow_type || row?.type || row?._direction || '').toLowerCase()
  if (type) return type !== 'income'
  return Number(row?.amount || 0) < 0
}

function calcTodayExpense(rows: any[], today: string) {
  return rows
    .filter((row: any) => getFlowDate(row) === today && isExpenseFlow(row))
    .reduce((sum: number, row: any) => sum + Math.abs(Number(row.amount || 0)), 0)
}

const todayStats = computed(() => {
  const today = getToday()
  const fSale = _saleRows.value.filter((r: any) => Number(r.status) === 1 && (r.out_date||'').slice(0,10) === today)
  const fRetail = _retailRows.value.filter((r: any) => Number(r.status) === 1 && (r.order_date||'').slice(0,10) === today)
  const fMeituan = _meituanRows.value.filter((r: any) => isMeituan(r) && meituanDate(r) === today)
  const saleAmt = fSale.reduce((s: number, r: any) => s + Number(r.total_amount||0), 0)
  const retailAmt = fRetail.reduce((s: number, r: any) => s + Number(r.pay_amount||r.total_amount||0), 0)
  const meituanAmt = fMeituan.reduce((s: number, r: any) => s + meituanAmount(r), 0)
  const fmt = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : n.toFixed(2)
  return { saleAmt: fmt(saleAmt + retailAmt + meituanAmt), orderCount: fSale.length + fRetail.length + fMeituan.length }
})

const salesStats = computed(() => {
  const today = getToday()
  const now = new Date()
  const cutoff = (days: number) => {
    const d = new Date(now); d.setDate(d.getDate() - (days - 1)); d.setHours(0,0,0,0)
    return d.toISOString().slice(0, 10)
  }
  let fromDate: string, periodDays: number
  if (statPeriod.value === 'today') { fromDate = today; periodDays = 1 }
  else if (statPeriod.value === '7d') { fromDate = cutoff(7); periodDays = 7 }
  else if (statPeriod.value === '30d') { fromDate = cutoff(30); periodDays = 30 }
  else { fromDate = cutoff(90); periodDays = 90 }

  const fSale = _saleRows.value.filter((r: any) => Number(r.status) === 1 && (() => { const d = (r.out_date||'').slice(0,10); return d >= fromDate && d <= today })())
  const fRetail = _retailRows.value.filter((r: any) => Number(r.status) === 1 && (() => { const d = (r.order_date||'').slice(0,10); return d >= fromDate && d <= today })())
  const fMeituan = _meituanRows.value.filter((r: any) => isMeituan(r) && (() => { const d = meituanDate(r); return d >= fromDate && d <= today })())
  const saleAmt = fSale.reduce((s: number, r: any) => s + Number(r.total_amount||0), 0)
  const retailAmt = fRetail.reduce((s: number, r: any) => s + Number(r.pay_amount||r.total_amount||0), 0)
  const meituanAmt = fMeituan.reduce((s: number, r: any) => s + meituanAmount(r), 0)
  const totalAmt = saleAmt + retailAmt + meituanAmt
  const orderCount = fSale.length + fRetail.length + fMeituan.length
  const avgAmt = orderCount > 0 ? totalAmt / orderCount : 0
  const custSet = new Set<string>()
  fSale.forEach((r: any) => { if (r.customer_id) custSet.add(String(r.customer_id)) })
  fRetail.forEach((r: any) => { if (r.customer_id) custSet.add(String(r.customer_id)) })
  fMeituan.forEach((r: any) => { if (r.customer_id) custSet.add(String(r.customer_id)) })

  const days: string[] = []
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const pad = (x: number) => String(x).padStart(2, '0')
    days.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`)
  }
  const dayMap: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
  fSale.forEach((r: any) => { const d = (r.out_date||'').slice(0,10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.total_amount||0) })
  fRetail.forEach((r: any) => { const d = (r.order_date||'').slice(0,10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.pay_amount||r.total_amount||0) })
  fMeituan.forEach((r: any) => { const d = meituanDate(r); if (dayMap[d] !== undefined) dayMap[d] += meituanAmount(r) })
  const sparkData = days.map(d => ({ date: d.slice(5), amt: dayMap[d], isToday: d === today }))
  const sparkMax = Math.max(...sparkData.map(b => b.amt), 1)
  const expenseAmt = _fundFlowRows.value
    .filter((row: any) => { const d = getFlowDate(row); return d >= fromDate && d <= today && isExpenseFlow(row) })
    .reduce((sum: number, row: any) => sum + Math.abs(Number(row.amount || 0)), 0)

  const fmt = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : n.toFixed(2)

  return {
    totalAmt: fmt(totalAmt), saleAmt: fmt(saleAmt), retailAmt: fmt(retailAmt),
    orderCount, saleCount: fSale.length, retailCount: fRetail.length,
    avgAmt: fmt(avgAmt), expenseAmt: fmt(expenseAmt), customerCount: custSet.size, sparkData, sparkMax,
  }
})

const profitChartData = computed(() => {
  const now = new Date()
  const today = getToday()
  const days = profitPeriod.value === 'today' ? 1 : profitPeriod.value === '7d' ? 7 : profitPeriod.value === '30d' ? 30 : 90
  const dateArr: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const pad = (x: number) => String(x).padStart(2, '0')
    dateArr.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`)
  }
  const fromDate = dateArr[0]

  const revenueMap: Record<string, number> = Object.fromEntries(dateArr.map(d => [d, 0]))
  const retailMap: Record<string, number> = Object.fromEntries(dateArr.map(d => [d, 0]))
  _saleRows.value.filter((r: any) => Number(r.status) === 1).forEach((r: any) => {
    const d = (r.out_date || '').slice(0, 10)
    if (revenueMap[d] !== undefined) revenueMap[d] += Number(r.total_amount || 0)
  })
  _retailRows.value.filter((r: any) => Number(r.status) === 1).forEach((r: any) => {
    const d = (r.order_date || '').slice(0, 10)
    const amt = Number(r.pay_amount || r.total_amount || 0)
    if (revenueMap[d] !== undefined) revenueMap[d] += amt
    if (retailMap[d] !== undefined) retailMap[d] += amt
  })
  _meituanRows.value.filter(isMeituan).forEach((r: any) => {
    const d = meituanDate(r)
    const amt = meituanAmount(r)
    if (revenueMap[d] !== undefined) revenueMap[d] += amt
    if (retailMap[d] !== undefined) retailMap[d] += amt
  })

  // 支出 = COGS（卖出商品的成本价 × 数量），与营收口径一致（都基于订单，不基于现金流）
  const expenseMap: Record<string, number> = Object.fromEntries(dateArr.map(d => [d, 0]))
  const getCost = (item: any) => {
    const gid = Number(item.goods_id || 0)
    return _costPriceMap.value[gid] || Number(item.cost_price || item.in_price || item.avg_price || 0)
  }
  _saleRows.value.filter((r: any) => Number(r.status) === 1).forEach((r: any) => {
    const d = (r.out_date || '').slice(0, 10)
    if (expenseMap[d] === undefined) return
    parseGoodsInfo(r.goods_info).forEach((item: any) => {
      expenseMap[d] += Number(item.num || 0) * getCost(item)
    })
  })
  _retailRows.value.filter((r: any) => Number(r.status) === 1).forEach((r: any) => {
    const d = (r.order_date || '').slice(0, 10)
    if (expenseMap[d] === undefined) return
    parseGoodsInfo(r.goods_info).forEach((item: any) => {
      expenseMap[d] += Number(item.num || 0) * getCost(item)
    })
  })
  _meituanRows.value.filter(isMeituan).forEach((r: any) => {
    const d = meituanDate(r)
    if (expenseMap[d] === undefined) return
    parseGoodsInfo(r.goods_info).forEach((item: any) => {
      expenseMap[d] += Number(item.num || 0) * getCost(item)
    })
  })

  const data = dateArr.map(d => ({
    date: d, revenue: revenueMap[d], retail: retailMap[d],
    expense: expenseMap[d], profit: revenueMap[d] - expenseMap[d], isToday: d === today,
    retailShare: revenueMap[d] > 0 ? retailMap[d] / revenueMap[d] : 0,
  }))
  const maxAbs = Math.max(...data.map(d => Math.abs(d.profit)), 1)
  const bars = data.map(d => {
    const h = Math.max(Math.round((Math.abs(d.profit) / maxAbs) * 28), d.profit !== 0 ? 1 : 0)
    const retailH = Math.round(h * d.retailShare)
    return { ...d, h, retailH, saleH: h - retailH }
  })

  const skip = days <= 7 ? 1 : days <= 30 ? 6 : 15
  const xLabels = dateArr.filter((_, i) => i % skip === 0 || i === dateArr.length - 1).map(d => d.slice(5))

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalExpense = data.reduce((s, d) => s + d.expense, 0)
  const totalProfit = totalRevenue - totalExpense
  const fmt = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : n.toFixed(2)
  const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'
  return { bars, xLabels, totalRevenue: fmt(totalRevenue), totalExpense: fmt(totalExpense), totalProfit: fmt(Math.abs(totalProfit)), profitPositive: totalProfit >= 0, marginPct }
})

function buildInsights(data: { todaySale: number, stockWarn: number, customerCount: number, todayOrders: number, pendingReceivable: number }) {
  const items = []
  if (data.todaySale > 0) {
    items.push({ tag: t('mobileStats.insightTodaySales'), text: t('mobileStats.insightTodaySalesText', { amount: data.todaySale.toFixed(2), count: data.todayOrders }) })
  } else {
    items.push({ tag: t('mobileStats.insightReminder'), text: t('mobileStats.insightReminderText') })
  }
  if (data.stockWarn > 0) {
    items.push({ tag: t('mobileStats.insightStockWarning'), text: t('mobileStats.insightStockWarningText', { count: data.stockWarn }) })
  } else {
    items.push({ tag: t('mobileStats.insightStockOk'), text: t('mobileStats.insightStockOkText') })
  }
  if (data.pendingReceivable > 0) {
    items.push({ tag: t('mobileStats.insightReceivable'), text: t('mobileStats.insightReceivableText', { amount: data.pendingReceivable.toFixed(2) }) })
  } else {
    items.push({ tag: t('mobileStats.insightCustomers'), text: t('mobileStats.insightCustomersText', { count: data.customerCount }) })
  }
  insightItems.value = items
}

onMounted(async () => {
  const today = getToday()
  const [saleRes, retailRes, customerRes, procureRes, goodsRes, fundFlowRes, meituanRes] = await Promise.allSettled([
    http.get('/stock/SaleOutOrder/index', { params: { list_rows: 2000 } }),
    http.get('/retail/order/index', { params: { list_rows: 2000 } }),
    http.get('/shop/ShopCustomer/index', { params: { list_rows: 1 } }),
    http.get('/procure/ProcureInhouse/index', { params: { list_rows: 2000 } }),
    http.get('/goods/ShopGoods/index', { params: { list_rows: 2000, status: 1 } }),
    http.get('/finance/fundFlow/index', { params: { list_rows: 500 } }),
    http.get('/shop/ContractOrder/index', { params: { list_rows: 2000, customer_id: MEITUAN_CUSTOMER_ID } }),
  ])
  const rows = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value?.data?.rows ?? r.value?.rows ?? []) : []
  const saleRows = rows(saleRes)
  const retailRows = rows(retailRes)
  const meituanRowsAll = rows(meituanRes)
  _saleRows.value = saleRows
  _retailRows.value = retailRows
  _meituanRows.value = meituanRowsAll

  const todaySale = saleRows.filter((r: any) => Number(r.status) === 1 && (r.out_date||'').slice(0,10) === today)
  const todayRetail = retailRows.filter((r: any) => Number(r.status) === 1 && (r.order_date||'').slice(0,10) === today)
  const todayMeituan = meituanRowsAll.filter((r: any) => isMeituan(r) && meituanDate(r) === today)
  const saleAmt = todaySale.reduce((s: number, r: any) => s + Number(r.total_amount||0), 0)
  const retailAmt = todayRetail.reduce((s: number, r: any) => s + Number(r.pay_amount||r.total_amount||0), 0)
  const meituanAmt = todayMeituan.reduce((s: number, r: any) => s + meituanAmount(r), 0)
  _fundFlowRows.value = rows(fundFlowRes)
  todayExpense.value = calcTodayExpense(_fundFlowRows.value, today).toFixed(2)

  const stockMap: Record<number, number> = {}
  rows(procureRes).forEach((r: any) => {
    if (Number(r.status) !== 1) return
    parseGoodsInfo(r.goods_info).forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num||0) })
  })
  ;[...saleRows, ...retailRows].forEach((r: any) => {
    if (Number(r.status) !== 1) return
    parseGoodsInfo(r.goods_info).forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num||0) })
  })
  const goodsList = rows(goodsRes)
  stockWarn.value = goodsList.filter((g: any) => (stockMap[g.id] ?? 0) <= 0).length

  // 构建成本价 Map：先从商品档案取 cost_price，再用采购入库加权均价覆盖（更准确）
  const costMap: Record<number, number> = {}
  goodsList.forEach((g: any) => {
    const c = Number(g.cost_price || g.purchase_price || g.avg_price || g.in_price || 0)
    if (c > 0) costMap[Number(g.id)] = c
  })
  const purchaseTotals: Record<number, { cost: number; qty: number }> = {}
  rows(procureRes).forEach((r: any) => {
    if (Number(r.status) !== 1) return
    parseGoodsInfo(r.goods_info).forEach((item: any) => {
      const gid = Number(item.goods_id || 0)
      const qty = Number(item.num || 0)
      const price = Number(item.price || item.cost_price || item.in_price || 0)
      if (gid > 0 && qty > 0 && price > 0) {
        if (!purchaseTotals[gid]) purchaseTotals[gid] = { cost: 0, qty: 0 }
        purchaseTotals[gid].cost += qty * price
        purchaseTotals[gid].qty += qty
      }
    })
  })
  Object.entries(purchaseTotals).forEach(([gid, { cost, qty }]) => {
    if (qty > 0) costMap[Number(gid)] = cost / qty
  })
  _costPriceMap.value = costMap

  const custData = customerRes.status === 'fulfilled' ? (customerRes.value?.data ?? customerRes.value) : {}
  const customerCount = Number(custData?.total ?? 0)
  customerTotal.value = customerCount

  try {
    const recRes = await http.get('/finance/Receivable/index', { params: { list_rows: 1000 } })
    const recRows = recRes?.data?.rows ?? []
    const pendingReceivable = recRows
      .filter((r: any) => Number(r.status) === 1 && Number(r.un_collect || 0) > 0)
      .reduce((s: number, r: any) => s + Number(r.un_collect || 0), 0)
    buildInsights({ todaySale: saleAmt + retailAmt + meituanAmt, stockWarn: stockWarn.value, customerCount, todayOrders: todaySale.length + todayRetail.length + todayMeituan.length, pendingReceivable })
  } catch {
    buildInsights({ todaySale: saleAmt + retailAmt + meituanAmt, stockWarn: stockWarn.value, customerCount, todayOrders: todaySale.length + todayRetail.length + todayMeituan.length, pendingReceivable: 0 })
  }
})
</script>

<style scoped>
.mstats {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f7;
  overflow: hidden;
}
.mstats-scroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
  padding-bottom: 20px;
}

/* 今日核心指标 */
.ms-kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px 12px 0;
}
.ms-kpi-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px 14px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.ms-kpi-card:active { background: #f0f5ff; }
.ms-kpi-label { font-size: 11px; color: #86909c; font-weight: 600; margin-bottom: 6px; }
.ms-kpi-value { font-size: 22px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; margin-bottom: 4px; }
.ms-kpi-sub { font-size: 11px; color: #c2c8d5; }

/* 销售入口（3 列） */
.ms-entry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  padding: 10px 12px 0;
}
.ms-entry-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.ms-entry-card:active { background: #f0f5ff; }
.ms-entry-ico {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.ms-entry-text {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}

/* 智能洞察 */
.ms-insights-card {
  background: #1d1d1f;
  border-radius: 16px;
  margin: 12px 12px 0;
  padding: 16px;
  color: white;
}
.ms-insights-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ms-insights-icon { width: 30px; height: 30px; background: #0071e3; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ms-insights-title { font-size: 15px; font-weight: 700; letter-spacing: -0.02em; }
.ms-insights-sub { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-left: auto; }
.ms-insights-list { display: flex; flex-direction: column; gap: 8px; }
.ms-insight-item { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 12px; }
.ms-insight-tag { font-size: 10px; font-weight: 700; color: #0071e3; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
.ms-insight-text { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5; }

/* 利润分析趋势 */
.ms-profit-card {
  background: #fff;
  border-radius: 16px;
  margin: 12px 12px 0;
  padding: 16px 16px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.ms-profit-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ms-profit-title { font-size: 14px; font-weight: 700; color: #1d2129; }
.ms-profit-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 14px; }
.ms-profit-sum-item { background: #f5f5f7; border-radius: 8px; padding: 8px 6px; text-align: center; }
.ms-profit-sum-label { font-size: 10px; color: #86909c; margin-bottom: 3px; font-weight: 600; }
.ms-profit-sum-val { font-size: 13px; font-weight: 800; letter-spacing: -0.03em; }
.ms-profit-chart-wrap { margin-bottom: 6px; }
.ms-profit-svg { width: 100%; height: 60px; display: block; }
.ms-profit-xlabels { display: flex; justify-content: space-between; padding: 2px 0; }
.ms-profit-xlabels span { font-size: 9px; color: #c2c8d5; }
.ms-profit-legend { display: flex; align-items: center; gap: 4px; padding-top: 4px; border-top: 1px solid #f2f3f5; margin-top: 4px; }
.ms-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.ms-profit-legend span { font-size: 10px; color: #86909c; }

/* 销售统计 */
.ms-sale-card { background: #fff; border-radius: 16px; margin: 0 12px; padding: 16px 16px 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.ms-sale-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ms-sale-title { font-size: 15px; font-weight: 700; color: #1d2129; }
.ms-sale-tabs { display: flex; gap: 4px; }
.ms-tab { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #e5e6eb; background: transparent; color: #86909c; -webkit-tap-highlight-color: transparent; }
.ms-tab.active { background: #0071e3; color: #fff; border-color: #0071e3; }
.ms-main-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.ms-main-item { background: #f5f5f7; border-radius: 10px; padding: 10px 10px 8px; }
.ms-main-label { font-size: 10px; font-weight: 600; color: #86909c; margin-bottom: 4px; }
.ms-main-value { font-size: 15px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; }
.ms-sub-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.ms-sub-item { text-align: center; background: rgba(0,113,227,0.04); border-radius: 8px; padding: 8px 4px; }
.ms-sub-label { font-size: 10px; color: #86909c; margin-bottom: 3px; }
.ms-sub-val { font-size: 13px; font-weight: 700; color: #1d2129; letter-spacing: -0.02em; }
.ms-spark { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 12px; }
.ms-spark-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #86909c; flex-shrink: 0; padding-bottom: 2px; }
.ms-spark-bars { display: flex; align-items: flex-end; gap: 2px; flex: 1; height: 48px; }
.ms-spark-bar { flex: 1; min-height: 4px; border-radius: 2px 2px 0 0; background: rgba(0,113,227,0.2); transition: height 0.3s; }
.ms-spark-bar.today { background: #0071e3; }
.ms-report-btn { font-size: 12px; font-weight: 700; color: #0071e3; text-align: center; padding: 8px; border: 1px solid rgba(0,113,227,0.2); border-radius: 10px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ms-report-btn:active { background: rgba(0,113,227,0.06); }

/* 快捷跳转 */
.ms-quick-links { background: #fff; border-radius: 16px; margin: 0 12px; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.ms-ql-title { font-size: 13px; font-weight: 700; color: #1d2129; margin-bottom: 12px; }
.ms-ql-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.ms-ql-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 4px; background: #f5f5f7; border-radius: 10px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ms-ql-item:active { background: #e8f0fe; }
.ms-ql-item span { font-size: 11px; color: #4e5969; font-weight: 500; text-align: center; }
</style>
