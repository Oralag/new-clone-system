<template>
  <div class="page-container">
    <el-card>
      <!-- 筛选栏 -->
      <el-form inline style="margin-bottom:8px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="loadData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadData">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 顶部汇总卡片 -->
      <div class="pl-summary">
        <div class="pl-card">
          <div class="pl-card-label">营业收入</div>
          <div class="pl-card-val blue">¥{{ fmt(totals.revenue) }}</div>
        </div>
        <div class="pl-card">
          <div class="pl-card-label">销售成本</div>
          <div class="pl-card-val purple">¥{{ fmt(totals.cost) }}</div>
        </div>
        <div class="pl-card">
          <div class="pl-card-label">毛利润</div>
          <div class="pl-card-val" :style="{ color: totals.grossProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ totals.grossProfit >= 0 ? '+' : '' }}¥{{ fmt(totals.grossProfit) }}
          </div>
          <div class="pl-card-rate">毛利率 {{ totals.grossRate.toFixed(1) }}%</div>
        </div>
        <div class="pl-divider"></div>
        <div class="pl-card">
          <div class="pl-card-label">费用支出</div>
          <div class="pl-card-val orange">−¥{{ fmt(totals.expense) }}</div>
        </div>
        <div class="pl-card">
          <div class="pl-card-label">运费（我方）</div>
          <div class="pl-card-val orange">−¥{{ fmt(totals.freight) }}</div>
        </div>
        <div class="pl-divider"></div>
        <div class="pl-card pl-card-highlight">
          <div class="pl-card-label" style="font-weight:700">净利润</div>
          <div class="pl-card-val" :style="{ color: totals.netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'22px' }">
            {{ totals.netProfit >= 0 ? '+' : '' }}¥{{ fmt(totals.netProfit) }}
          </div>
          <div class="pl-card-rate">净利率 {{ totals.netRate.toFixed(1) }}%</div>
        </div>
      </div>

      <!-- 按月利润表 -->
      <div v-if="loading" style="text-align:center;padding:40px 0">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>
      <el-table v-else :data="monthRows" style="width:100%;margin-top:16px"
        :default-sort="{ prop: 'month', order: 'descending' }"
        show-summary :summary-method="getSummary">
        <el-table-column prop="month" label="月份" width="100" sortable />
        <el-table-column label="营业收入" align="right" min-width="120" sortable prop="revenue">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.revenue) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销售成本" align="right" min-width="120" sortable prop="cost">
          <template #default="{ row }">
            <span style="color:#7c3aed">¥{{ fmt(row.cost) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利润" align="right" min-width="120" sortable prop="grossProfit">
          <template #default="{ row }">
            <span :style="{ color: row.grossProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.grossProfit >= 0 ? '+' : '' }}¥{{ fmt(row.grossProfit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" align="right" width="90">
          <template #default="{ row }">
            <el-tag :type="row.grossRate >= 20 ? 'success' : row.grossRate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.grossRate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="费用" align="right" min-width="100" sortable prop="expense">
          <template #default="{ row }">
            <span style="color:#f59e0b">{{ row.expense > 0 ? '−' : '' }}¥{{ fmt(row.expense) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="运费" align="right" min-width="100" sortable prop="freight">
          <template #default="{ row }">
            <span style="color:#f59e0b">{{ row.freight > 0 ? '−' : '' }}¥{{ fmt(row.freight) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="净利润" align="right" min-width="120" sortable prop="netProfit">
          <template #default="{ row }">
            <span :style="{ color: row.netProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight:700 }">
              {{ row.netProfit >= 0 ? '+' : '' }}¥{{ fmt(row.netProfit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="净利率" align="right" width="90">
          <template #default="{ row }">
            <el-tag :type="row.netRate >= 20 ? 'success' : row.netRate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.netRate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">暂无数据，请选择日期范围查询</div></template>
      </el-table>

      <!-- 说明 -->
      <div class="pl-note">
        <el-icon><InfoFilled /></el-icon>
        收入来源：销售合同 + 销售出库单（已审核）+ 零售订单；成本优先取库存移动均价(avg_price)，无均价时取商品采购价；净利润 = 毛利润 − 费用 − 我方运费
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { InfoFilled, Loading } from '@element-plus/icons-vue'
import { getContractList, getSaleOutList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)

const saleContracts = ref<any[]>([])
const saleOutOrders = ref<any[]>([])
const retailOrders = ref<any[]>([])
const goodsList = ref<any[]>([])
const procureInhouseList = ref<any[]>([])
const bomList = ref<any[]>([])
const expenseList = ref<any[]>([])

// 移动加权平均价：采购入库 + BOM物料成本，兜底商品 cost_price
const goodsCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of goodsList.value) m[g.id] = Number(g.cost_price || 0)
  const snTotalCost: Record<string, number> = {}
  const snTotalQty: Record<string, number> = {}
  for (const ih of procureInhouseList.value) {
    if (Number(ih.status) !== 1) continue
    try {
      for (const item of JSON.parse(ih.goods_info || '[]')) {
        const sn = item.goods_sn
        if (!sn) continue
        const qty = Number(item.num || 0)
        const price = Number(item.price || 0)
        if (qty > 0 && price > 0) {
          snTotalCost[sn] = (snTotalCost[sn] || 0) + qty * price
          snTotalQty[sn] = (snTotalQty[sn] || 0) + qty
        }
      }
    } catch {}
  }
  // BOM产品：成品均价 = 各物料用量 × 物料采购均价 之和
  const snAvgPrice: Record<string, number> = {}
  for (const sn in snTotalQty) {
    if (snTotalQty[sn] > 0) snAvgPrice[sn] = snTotalCost[sn] / snTotalQty[sn]
  }
  const bomMap: Record<number, { material_sn: string; num: number }[]> = {}
  for (const b of bomList.value) {
    const gid = Number(b.goods_id || 0)
    if (!gid) continue
    if (!bomMap[gid]) bomMap[gid] = []
    bomMap[gid].push({ material_sn: b.material_sn || '', num: Number(b.num || 0) })
  }
  for (const gid in bomMap) {
    const g = goodsList.value.find(x => x.id === Number(gid))
    const sn = g?.goods_sn
    if (!sn) continue
    let bomCost = 0
    for (const mat of bomMap[Number(gid)]) {
      bomCost += mat.num * (snAvgPrice[mat.material_sn] || 0)
    }
    if (bomCost > 0) {
      snTotalCost[sn] = bomCost
      snTotalQty[sn] = 1
    }
  }
  for (const g of goodsList.value) {
    const sn = g.goods_sn
    if (sn && snTotalQty[sn] > 0) m[g.id] = snTotalCost[sn] / snTotalQty[sn]
  }
  return m
})

function getItemsCost(goodsInfo: string): { revenue: number; cost: number } {
  let revenue = 0, cost = 0
  try {
    for (const g of JSON.parse(goodsInfo || '[]')) {
      const qty = Number(g.num || 0)
      revenue += qty * Number(g.price || 0)
      cost += qty * (goodsCostMap.value[g.goods_id] || 0)
    }
  } catch {}
  return { revenue, cost }
}

function myFreight(row: any): number {
  const f = Number(row.freight_amount || 0)
  if (!f) return 0
  if (row.freight_bearer === 'seller') return f
  if (row.freight_bearer === 'half') return f / 2
  return 0
}

function getMonth(dateStr: string): string {
  return (dateStr || '').slice(0, 7)
}

const monthRows = computed(() => {
  const map: Record<string, { month: string; revenue: number; cost: number; expense: number; freight: number }> = {}

  const ensure = (m: string) => {
    if (!map[m]) map[m] = { month: m, revenue: 0, cost: 0, expense: 0, freight: 0 }
  }

  for (const c of saleContracts.value) {
    const m = getMonth(c.contract_date || c.create_time || '')
    if (!m) continue
    ensure(m)
    const { revenue, cost } = getItemsCost(c.goods_info)
    map[m].revenue += revenue
    map[m].cost += cost
    map[m].freight += myFreight(c)
  }

  for (const o of saleOutOrders.value) {
    const m = getMonth(o.out_date || o.create_time || '')
    if (!m) continue
    ensure(m)
    const { revenue, cost } = getItemsCost(o.goods_info)
    map[m].revenue += revenue
    map[m].cost += cost
  }

  for (const r of retailOrders.value) {
    const m = getMonth(r.order_date || r.create_time || '')
    if (!m) continue
    ensure(m)
    const { revenue, cost } = getItemsCost(r.goods_info)
    map[m].revenue += revenue
    map[m].cost += cost
  }

  for (const e of expenseList.value) {
    const m = getMonth(e.expense_date || e.create_time || '')
    if (!m) continue
    ensure(m)
    map[m].expense += Number(e.amount || 0)
  }

  return Object.values(map)
    .map(r => {
      const grossProfit = r.revenue - r.cost
      const grossRate = r.revenue > 0 ? (grossProfit / r.revenue * 100) : 0
      const netProfit = grossProfit - r.expense - r.freight
      const netRate = r.revenue > 0 ? (netProfit / r.revenue * 100) : 0
      return { ...r, grossProfit, grossRate, netProfit, netRate }
    })
    .sort((a, b) => b.month.localeCompare(a.month))
})

const totals = computed(() => {
  const revenue = monthRows.value.reduce((s, r) => s + r.revenue, 0)
  const cost     = monthRows.value.reduce((s, r) => s + r.cost, 0)
  const expense  = monthRows.value.reduce((s, r) => s + r.expense, 0)
  const freight  = monthRows.value.reduce((s, r) => s + r.freight, 0)
  const grossProfit = revenue - cost
  const netProfit   = grossProfit - expense - freight
  return {
    revenue, cost, expense, freight, grossProfit, netProfit,
    grossRate: revenue > 0 ? (grossProfit / revenue * 100) : 0,
    netRate:   revenue > 0 ? (netProfit   / revenue * 100) : 0,
  }
})

function getSummary() {
  const t = totals.value
  return ['合计', `¥${fmt(t.revenue)}`, `¥${fmt(t.cost)}`,
    `${t.grossProfit >= 0 ? '+' : ''}¥${fmt(t.grossProfit)}`, `${t.grossRate.toFixed(1)}%`,
    `¥${fmt(t.expense)}`, `¥${fmt(t.freight)}`,
    `${t.netProfit >= 0 ? '+' : ''}¥${fmt(t.netProfit)}`, `${t.netRate.toFixed(1)}%`]
}

function fmt(v: number): string {
  return isNaN(v) ? '0.00' : v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  loading.value = true
  const params: any = { list_rows: 1000 }
  if (dateRange.value) {
    params.start_date = dateRange.value[0]
    params.end_date   = dateRange.value[1]
  }
  try {
    const [c, o, r, g, ih, b, e] = await Promise.allSettled([
      getContractList(params),
      getSaleOutList({ ...params, status: 1 }),
      getRetailOrderList(params),
      getGoodsList({ list_rows: 500 }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
      getBomList({ list_rows: 500 }),
      getExpenseList(params),
    ])
    saleContracts.value      = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []) : []
    saleOutOrders.value      = o.status === 'fulfilled' ? (o.value?.data?.rows  ?? []) : []
    retailOrders.value       = r.status === 'fulfilled' ? (r.value?.data?.rows  ?? []) : []
    goodsList.value          = g.status === 'fulfilled' ? (g.value?.data?.rows  ?? []) : []
    procureInhouseList.value = ih.status === 'fulfilled' ? (ih.value?.data?.rows ?? []) : []
    bomList.value            = b.status === 'fulfilled' ? (b.value?.data?.rows  ?? []) : []
    expenseList.value        = e.status === 'fulfilled' ? (e.value?.data?.rows  ?? []) : []
  } finally {
    loading.value = false
  }
}

function onReset() {
  dateRange.value = null
  loadData()
}

loadData()
</script>

<style scoped>
.page-container {}
.pl-summary {
  display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;
  padding: 16px 20px; background: #f8fafc; border-radius: 12px; margin-bottom: 16px;
}
.pl-card { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
.pl-card-highlight { background: #fff; border-radius: 8px; padding: 8px 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.pl-card-label { font-size: 11px; color: rgba(29,29,31,0.4); }
.pl-card-val { font-size: 18px; font-weight: 700; }
.pl-card-rate { font-size: 11px; color: rgba(29,29,31,0.4); }
.pl-divider { width: 1px; background: #e8eaf0; align-self: stretch; margin: 0 4px; }
.blue { color: #0071e3; }
.purple { color: #7c3aed; }
.orange { color: #f59e0b; }
.pl-note {
  display: flex; align-items: center; gap: 6px; font-size: 12px;
  color: rgba(29,29,31,0.4); padding: 12px 0 0;
}
</style>
