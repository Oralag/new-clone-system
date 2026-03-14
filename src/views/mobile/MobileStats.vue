<template>
  <div class="mstats">

    <!-- 智能洞察 -->
    <div class="ms-insights-card">
      <div class="ms-insights-header">
        <div class="ms-insights-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/></svg>
        </div>
        <div class="ms-insights-title">智能洞察</div>
        <div class="ms-insights-sub">AI 数据引擎</div>
      </div>
      <div class="ms-insights-list">
        <div v-for="item in insightItems" :key="item.tag" class="ms-insight-item">
          <div class="ms-insight-tag">{{ item.tag }}</div>
          <div class="ms-insight-text">{{ item.text }}</div>
        </div>
      </div>
    </div>

    <!-- 销售统计 -->
    <div class="ms-sale-card">
      <div class="ms-sale-top">
        <div class="ms-sale-title">销售统计</div>
        <div class="ms-sale-tabs">
          <button :class="['ms-tab', statPeriod === 'today' ? 'active' : '']" @click="statPeriod = 'today'">今天</button>
          <button :class="['ms-tab', statPeriod === '7d' ? 'active' : '']" @click="statPeriod = '7d'">7天</button>
          <button :class="['ms-tab', statPeriod === '30d' ? 'active' : '']" @click="statPeriod = '30d'">30天</button>
          <button :class="['ms-tab', statPeriod === '3m' ? 'active' : '']" @click="statPeriod = '3m'">3月</button>
        </div>
      </div>
      <div class="ms-main-row">
        <div class="ms-main-item">
          <div class="ms-main-label">销售总额</div>
          <div class="ms-main-value">¥{{ salesStats.totalAmt }}</div>
        </div>
        <div class="ms-main-item">
          <div class="ms-main-label">订单数</div>
          <div class="ms-main-value">{{ salesStats.orderCount }}</div>
        </div>
        <div class="ms-main-item">
          <div class="ms-main-label">均单金额</div>
          <div class="ms-main-value">¥{{ salesStats.avgAmt }}</div>
        </div>
      </div>
      <div class="ms-sub-row">
        <div class="ms-sub-item">
          <div class="ms-sub-label">销售出库</div>
          <div class="ms-sub-val">¥{{ salesStats.saleAmt }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">零售收款</div>
          <div class="ms-sub-val">¥{{ salesStats.retailAmt }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">销售单数</div>
          <div class="ms-sub-val">{{ salesStats.saleCount }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">零售单数</div>
          <div class="ms-sub-val">{{ salesStats.retailCount }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">涉及客户</div>
          <div class="ms-sub-val">{{ salesStats.customerCount }}</div>
        </div>
        <div class="ms-sub-item">
          <div class="ms-sub-label">库存预警</div>
          <div class="ms-sub-val" :style="{ color: stockWarn > 0 ? '#f53f3f' : '#00b42a' }">{{ stockWarn }}</div>
        </div>
      </div>
      <!-- 趋势 -->
      <div v-if="salesStats.sparkData.length > 1" class="ms-spark">
        <div class="ms-spark-label">趋势</div>
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
      <div class="ms-report-btn" @click="router.push('/reports/sale-rate')">查看完整销售报表 →</div>
    </div>

    <!-- 快捷跳转 -->
    <div class="ms-quick-links">
      <div class="ms-ql-title">报表中心</div>
      <div class="ms-ql-grid">
        <div class="ms-ql-item" @click="router.push('/reports/sale-rate')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>销售统计</span>
        </div>
        <div class="ms-ql-item" @click="router.push('/finance/overview')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>财务总览</span>
        </div>
        <div class="ms-ql-item" @click="router.push('/finance/receivable')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <span>应收账款</span>
        </div>
        <div class="ms-ql-item" @click="router.push('/warehouse/stock')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          <span>库存总览</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()

const insightItems = ref([{ tag: '加载中...', text: 'AI 正在分析您的业务数据...' }])
const statPeriod = ref<'today' | '7d' | '30d' | '3m'>('today')
const stockWarn = ref(0)

const _saleRows = ref<any[]>([])
const _retailRows = ref<any[]>([])

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

  const fSale = _saleRows.value.filter((r: any) => { const d = (r.out_date||'').slice(0,10); return d >= fromDate && d <= today })
  const fRetail = _retailRows.value.filter((r: any) => { const d = (r.order_date||'').slice(0,10); return d >= fromDate && d <= today })
  const saleAmt = fSale.reduce((s: number, r: any) => s + Number(r.total_amount||0), 0)
  const retailAmt = fRetail.reduce((s: number, r: any) => s + Number(r.pay_amount||r.total_amount||0), 0)
  const totalAmt = saleAmt + retailAmt
  const orderCount = fSale.length + fRetail.length
  const avgAmt = orderCount > 0 ? totalAmt / orderCount : 0
  const custSet = new Set<string>()
  fSale.forEach((r: any) => { if (r.customer_id) custSet.add(String(r.customer_id)) })
  fRetail.forEach((r: any) => { if (r.customer_id) custSet.add(String(r.customer_id)) })

  const days: string[] = []
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const pad = (x: number) => String(x).padStart(2, '0')
    days.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`)
  }
  const dayMap: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
  fSale.forEach((r: any) => { const d = (r.out_date||'').slice(0,10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.total_amount||0) })
  fRetail.forEach((r: any) => { const d = (r.order_date||'').slice(0,10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.pay_amount||r.total_amount||0) })
  const sparkData = days.map(d => ({ date: d.slice(5), amt: dayMap[d], isToday: d === today }))
  const sparkMax = Math.max(...sparkData.map(b => b.amt), 1)
  const fmt = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : n.toFixed(2)

  return {
    totalAmt: fmt(totalAmt), saleAmt: fmt(saleAmt), retailAmt: fmt(retailAmt),
    orderCount, saleCount: fSale.length, retailCount: fRetail.length,
    avgAmt: fmt(avgAmt), customerCount: custSet.size, sparkData, sparkMax,
  }
})

function buildInsights(data: { todaySale: number, stockWarn: number, customerCount: number, todayOrders: number, pendingReceivable: number }) {
  const items = []
  if (data.todaySale > 0) {
    items.push({ tag: '今日销售', text: `今日已完成销售 ¥${data.todaySale.toFixed(2)}，共 ${data.todayOrders} 笔订单。` })
  } else {
    items.push({ tag: '营业提醒', text: '今日暂无销售记录，可前往收银台或新建销售合同开始营业。' })
  }
  if (data.stockWarn > 0) {
    items.push({ tag: '⚠️ 库存预警', text: `当前有 ${data.stockWarn} 种商品库存不足或为零，建议及时采购补货。` })
  } else {
    items.push({ tag: '库存正常', text: '库存状态良好，暂无缺货或预警商品。' })
  }
  if (data.pendingReceivable > 0) {
    items.push({ tag: '应收提醒', text: `当前待收款金额 ¥${data.pendingReceivable.toFixed(2)}，请及时跟进客户回款。` })
  } else {
    items.push({ tag: '客户概览', text: `系统共有 ${data.customerCount} 位客户，当前应收款状态良好。` })
  }
  insightItems.value = items
}

onMounted(async () => {
  const today = getToday()
  const [saleRes, retailRes, customerRes, procureRes, goodsRes] = await Promise.allSettled([
    http.get('/stock/SaleOutOrder/index', { params: { list_rows: 2000 } }),
    http.get('/retail/order/index', { params: { list_rows: 2000 } }),
    http.get('/shop/ShopCustomer/index', { params: { list_rows: 1 } }),
    http.get('/procure/ProcureInhouse/index', { params: { list_rows: 2000 } }),
    http.get('/goods/ShopGoods/index', { params: { list_rows: 2000, status: 1 } }),
  ])
  const rows = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value?.data?.rows ?? r.value?.rows ?? []) : []
  const saleRows = rows(saleRes)
  const retailRows = rows(retailRes)
  _saleRows.value = saleRows
  _retailRows.value = retailRows

  const todaySale = saleRows.filter((r: any) => (r.out_date||'').slice(0,10) === today)
  const todayRetail = retailRows.filter((r: any) => (r.order_date||'').slice(0,10) === today)
  const saleAmt = todaySale.reduce((s: number, r: any) => s + Number(r.total_amount||0), 0)
  const retailAmt = todayRetail.reduce((s: number, r: any) => s + Number(r.pay_amount||r.total_amount||0), 0)

  const stockMap: Record<number, number> = {}
  rows(procureRes).forEach((r: any) => {
    if (Number(r.status) !== 1) return
    parseGoodsInfo(r.goods_info).forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num||0) })
  })
  ;[...saleRows, ...retailRows].forEach((r: any) => {
    if (r.out_date !== undefined && Number(r.status) !== 1) return
    parseGoodsInfo(r.goods_info).forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num||0) })
  })
  const goodsList = rows(goodsRes)
  stockWarn.value = goodsList.filter((g: any) => (stockMap[g.id] ?? 0) <= 0).length

  const custData = customerRes.status === 'fulfilled' ? (customerRes.value?.data ?? customerRes.value) : {}
  const customerCount = Number(custData?.total ?? 0)

  try {
    const recRes = await http.get('/finance/Receivable/index', { params: { list_rows: 1000 } })
    const recRows = recRes?.data?.rows ?? []
    const pendingReceivable = recRows
      .filter((r: any) => Number(r.status) !== 1 && Number(r.un_collect||r.amount||0) > 0)
      .reduce((s: number, r: any) => s + Number(r.un_collect||r.amount||0), 0)
    buildInsights({ todaySale: saleAmt + retailAmt, stockWarn: stockWarn.value, customerCount, todayOrders: todaySale.length + todayRetail.length, pendingReceivable })
  } catch {
    buildInsights({ todaySale: saleAmt + retailAmt, stockWarn: stockWarn.value, customerCount, todayOrders: todaySale.length + todayRetail.length, pendingReceivable: 0 })
  }
})
</script>

<style scoped>
.mstats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 80px;
  background: #f5f5f7;
  min-height: 100%;
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
