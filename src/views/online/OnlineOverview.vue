<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">线上总览</h2>
      </div>
      <div style="display:flex;gap:8px">
        <span
          v-for="p in periods" :key="p.key"
          :class="['period-tag', { active: activePeriod === p.key }]"
          @click="activePeriod = p.key"
        >{{ p.label }}</span>
      </div>
    </div>

    <!-- 各平台 KPI 卡片 -->
    <div class="platform-grid">
      <div
        v-for="pl in PLATFORMS" :key="pl.key"
        class="platform-card"
        :style="{ borderTop: `3px solid ${pl.color}` }"
        @click="router.push(pl.path)"
      >
        <div class="pl-name" :style="{ color: pl.color }">{{ pl.name }}</div>
        <div class="pl-stat">
          <span class="pl-label">订单</span>
          <span class="pl-val">{{ platformKpi(pl.customerId).count }}</span>
        </div>
        <div class="pl-stat">
          <span class="pl-label">{{ periodLabel }}收入</span>
          <span class="pl-val blue">¥{{ fmt(platformKpi(pl.customerId).income) }}</span>
        </div>
        <div class="pl-stat">
          <span class="pl-label">{{ periodLabel }}支出</span>
          <span class="pl-val red">¥{{ fmt(platformKpi(pl.customerId).expense) }}</span>
        </div>
        <div class="pl-stat">
          <span class="pl-label">净收入</span>
          <span class="pl-val" :class="platformKpi(pl.customerId).net >= 0 ? 'green' : 'red'">
            ¥{{ fmt(platformKpi(pl.customerId).net) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 汇总 KPI -->
    <div class="kpi-row" style="margin-top:14px">
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}总订单</div>
        <div class="kpi-val blue">{{ totalKpi.count }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}总收入</div>
        <div class="kpi-val green">¥{{ fmt(totalKpi.income) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}总支出</div>
        <div class="kpi-val red">¥{{ fmt(totalKpi.expense) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}净收入</div>
        <div class="kpi-val" :class="totalKpi.net >= 0 ? 'green' : 'red'">¥{{ fmt(totalKpi.net) }}</div>
      </div>
    </div>

    <!-- 最近订单 -->
    <el-card style="margin-top:14px">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600">最近订单</span>
          <el-select v-model="filterPlatform" clearable placeholder="全部平台" style="width:140px" size="small">
            <el-option v-for="pl in PLATFORMS" :key="pl.key" :label="pl.name" :value="pl.customerId" />
          </el-select>
        </div>
      </template>
      <el-table :data="recentRows" v-loading="loading" size="small" border style="width:100%">
        <el-table-column label="平台" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :color="getPlatformColor(row.customer_id)" effect="dark" style="color:#fff">
              {{ getPlatformName(row.customer_id) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="单号" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ getOrderSn(row) }}</template>
        </el-table-column>
        <el-table-column label="日期" width="105">
          <template #default="{ row }">{{ fmtDt(getOrderDate(row)) }}</template>
        </el-table-column>
        <el-table-column label="收入" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(getOrderAmount(row)) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status == 1 ? 'success' : 'info'" size="small">
              {{ row.status == 1 ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template #default="{ row }">
            <el-button link size="small" @click="goToPlatform(row.customer_id)">查看</el-button>
          </template>
        </el-table-column>
        <template #empty><div style="padding:20px 0;color:#aaa">暂无订单</div></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fmtDt } from '@/utils/date'
import { getContractList } from '@/api/sale'
import http from '@/api/http'

const router = useRouter()
const loading = ref(false)
const allContracts = ref<any[]>([])
const expenses = ref<any[]>([])
const filterPlatform = ref<number | null>(null)

const PLATFORMS = [
  { key: 'wechat',      name: '微信小店', customerId: 10, color: '#07C160', path: '/online/wechat' },
  { key: 'pinduoduo',   name: '拼多多',   customerId: 12, color: '#E02E2E', path: '/online/pinduoduo' },
  { key: 'douyin',      name: '抖音',     customerId: 7,  color: '#161823', path: '/online/douyin' },
  { key: 'xiaohongshu', name: '小红书',   customerId: 11, color: '#FF2442', path: '/online/xiaohongshu' },
  { key: 'meituan',     name: '美团',     customerId: 63, color: '#FFCD00', path: '/online/meituan' },
  { key: 'taobao',      name: '淘宝',     customerId: 8,  color: '#FF6600', path: '/online/wechat' },
] as const

const ONLINE_CUST_IDS = new Set(PLATFORMS.map(p => p.customerId))

const periods = [
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季' },
  { key: 'year', label: '本年' },
  { key: 'all', label: '全部' },
] as const
type PeriodKey = typeof periods[number]['key']
const activePeriod = ref<PeriodKey>('month')
const periodLabel = computed(() => {
  const map: Record<PeriodKey, string> = { month: '本月', quarter: '本季', year: '本年', all: '' }
  return map[activePeriod.value]
})

function inPeriod(dateStr: string): boolean {
  if (activePeriod.value === 'all') return true
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  const prefix = String(dateStr || '').slice(0, 10)
  if (!prefix) return false
  if (activePeriod.value === 'month') return prefix.slice(0, 7) === `${y}-${String(m + 1).padStart(2, '0')}`
  if (activePeriod.value === 'year') return prefix.startsWith(String(y))
  const qStart = Math.floor(m / 3) * 3
  const from = `${y}-${String(qStart + 1).padStart(2, '0')}-01`
  const toMonth = qStart + 3
  const to = toMonth > 11 ? `${y + 1}-01-01` : `${y}-${String(toMonth + 1).padStart(2, '0')}-01`
  return prefix >= from && prefix < to
}

function getOrderDate(row: any): string {
  return String(row?.sign_date || row?.order_date || row?.create_time || '')
}

function getOrderSn(row: any): string {
  const m = (row?.remark || '').match(/^\[NO:([^\]]+)\]/)
  if (m) return m[1]
  return String(row?.order_sn || row?.id || '')
}

function getOrderAmount(row: any): number {
  const ad = Number(row?.after_discount)
  const tot = Number(row?.total_amount || 0)
  return (ad > 0 && ad <= tot) ? ad : tot
}

function getPlatformName(custId: number): string {
  return PLATFORMS.find(p => p.customerId === Number(custId))?.name ?? '未知'
}

function getPlatformColor(custId: number): string {
  return PLATFORMS.find(p => p.customerId === Number(custId))?.color ?? '#999'
}

function goToPlatform(custId: number) {
  const path = PLATFORMS.find(p => p.customerId === Number(custId))?.path
  if (path) router.push(path)
}

// KPI 计算
function platformKpi(custId: number) {
  let count = 0, income = 0, expense = 0
  for (const r of allContracts.value) {
    if (Number(r.customer_id) !== custId) continue
    if (Number(r.status) !== 1) continue
    const d = getOrderDate(r)
    if (!inPeriod(d)) continue
    count++
    income += getOrderAmount(r)
  }
  for (const e of expenses.value) {
    if (Number(e.customer_id) !== custId) continue
    const d = String(e.expense_date || e.create_time || '')
    if (!inPeriod(d)) continue
    expense += Number(e.amount || 0)
  }
  return { count, income, expense, net: income - expense }
}

const totalKpi = computed(() => {
  let count = 0, income = 0, expense = 0
  for (const pl of PLATFORMS) {
    const k = platformKpi(pl.customerId)
    count += k.count; income += k.income; expense += k.expense
  }
  return { count, income, expense, net: income - expense }
})

const recentRows = computed(() => {
  let rows = allContracts.value.filter(r => ONLINE_CUST_IDS.has(Number(r.customer_id)))
  if (filterPlatform.value) rows = rows.filter(r => Number(r.customer_id) === filterPlatform.value)
  return rows
    .slice()
    .sort((a, b) => getOrderDate(b).localeCompare(getOrderDate(a)))
    .slice(0, 50)
})

function fmt(v: number): string {
  return isNaN(v) ? '0.00' : v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  loading.value = true
  try {
    const [c, e] = await Promise.allSettled([
      getContractList({ list_rows: 5000 }),
      http.get('/finance/Expense/index', { params: { list_rows: 2000 } }),
    ])
    const allRows: any[] = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []) : []
    allContracts.value = allRows.filter((r: any) => ONLINE_CUST_IDS.has(Number(r.customer_id)))
    expenses.value = e.status === 'fulfilled' ? (e.value?.data?.rows ?? []) : []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-title { font-size: 20px; font-weight: 700; margin: 0; }
.period-tag {
  padding: 4px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  transition: all 0.2s;
}
.period-tag.active { background: #0071e3; color: #fff; }

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.platform-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,.08);
  cursor: pointer;
  transition: box-shadow .2s;
}
.platform-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,.14); }
.pl-name { font-weight: 700; font-size: 15px; margin-bottom: 10px; }
.pl-stat { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px; }
.pl-label { color: #888; }
.pl-val { font-weight: 600; }

.kpi-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.kpi-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 20px;
  box-shadow: 0 1px 6px rgba(0,0,0,.08);
  min-width: 140px;
  flex: 1;
}
.kpi-label { font-size: 12px; color: #999; margin-bottom: 4px; }
.kpi-val { font-size: 22px; font-weight: 700; }
.blue { color: #0071e3; }
.green { color: #16a34a; }
.red { color: #dc2626; }
</style>
