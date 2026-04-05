<template>
  <div class="page-container">
    <el-card>
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

      <!-- 汇总栏 -->
      <div class="pf-summary" v-if="rows.length > 0">
        <div class="pf-sum-item">
          <span class="pf-sum-label">总销售额</span>
          <span class="pf-sum-val blue">¥{{ fmt(totalSale) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">商品成本</span>
          <span class="pf-sum-val purple">¥{{ fmt(totalCost) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">毛利润</span>
          <span class="pf-sum-val" :style="{ color: totalProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ totalProfit >= 0 ? '+' : '' }}¥{{ fmt(totalProfit) }}
          </span>
        </div>
        <div class="pf-sum-item pf-sum-divider-v"></div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">我方运费</span>
          <span class="pf-sum-val" style="color:#f59e0b">−¥{{ fmt(freightTotal) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">费用支出</span>
          <span class="pf-sum-val" style="color:#f59e0b">−¥{{ fmt(expenseTotal) }}</span>
        </div>
        <div class="pf-sum-item pf-sum-divider-v"></div>
        <div class="pf-sum-item">
          <span class="pf-sum-label" style="font-weight:700">净利润</span>
          <span class="pf-sum-val" :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ netProfit >= 0 ? '+' : '' }}¥{{ fmt(netProfit) }}
          </span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">毛利率</span>
          <el-tag :type="overallRate >= 20 ? 'success' : overallRate > 0 ? 'warning' : 'danger'">
            {{ overallRate.toFixed(1) }}%
          </el-tag>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">净利率</span>
          <el-tag :type="netRate >= 20 ? 'success' : netRate > 0 ? 'warning' : 'danger'">
            {{ netRate.toFixed(1) }}%
          </el-tag>
        </div>
      </div>

      <!-- 数据说明 -->
      <div class="pf-note">
        <el-icon><InfoFilled /></el-icon>
        成本价优先取库存移动均价(avg_price)，无均价时取商品采购价(cost_price)；运费按合同承担比例扣除；费用来自费用管理模块；净利润 = 毛利润 − 运费 − 费用
      </div>

      <!-- 切换Tab -->
      <el-tabs v-model="viewMode" style="margin-bottom:4px">
        <el-tab-pane label="按单品" name="goods" />
        <el-tab-pane label="按单据" name="order" />
      </el-tabs>

      <div v-if="loading" style="text-align:center;padding:40px 0">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>

      <!-- 单品维度 -->
      <el-table v-else-if="viewMode === 'goods'" :data="rows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column prop="goods_name" label="商品名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="销售数量" prop="num" align="right" width="80" />
        <el-table-column label="销售额" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#0071e3">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位成本" align="right" width="100">
          <template #default="{ row }">
            <el-tooltip :content="row.cost_source" placement="top">
              <span style="color:#7c3aed;cursor:help">¥{{ fmt(row.unit_cost) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="总成本" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#7c3aed;font-weight:600">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利润" align="right" width="110" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成本来源" align="center" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.has_bom ? 'warning' : 'info'">
              {{ row.has_bom ? 'BOM' : '采购价' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" align="center" width="70">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === '零售' ? 'success' : row.source === '出库单' ? 'warning' : 'primary'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
      </el-table>

      <!-- 单据维度 -->
      <el-table v-else :data="orderRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column label="单据类型" align="center" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === '零售' ? 'success' : row.source === '出库单' ? 'warning' : 'primary'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="单号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customer_name" label="客户" min-width="120" show-overflow-tooltip />
        <el-table-column prop="order_date" label="日期" width="100" />
        <el-table-column label="销售额" align="right" width="120">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成本" align="right" width="120">
          <template #default="{ row }">
            <span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利润" align="right" width="120" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="净利润" align="right" width="120" sortable prop="net_profit">
          <template #default="{ row }">
            <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="净利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.net_rate >= 20 ? 'success' : row.net_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.net_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { InfoFilled, Loading } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { getContractList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const viewMode = ref<'goods' | 'order'>('goods')

const saleContracts = ref<any[]>([])
const retailOrders = ref<any[]>([])
const goodsList = ref<any[]>([])
const procureInhouseList = ref<any[]>([])
const bomList = ref<any[]>([])
const expenseList = ref<any[]>([])

// goods_id -> 移动加权平均价（采购入库 + BOM物料成本），兜底商品 cost_price
const goodsCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of goodsList.value) {
    m[g.id] = Number(g.cost_price || 0)
  }
  // 采购入库移动均价
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
    if (sn && snTotalQty[sn] > 0) {
      m[g.id] = snTotalCost[sn] / snTotalQty[sn]
    }
  }
  return m
})

// goods_id set that has BOM defined (for labeling only)
const hasBomSet = computed(() => {
  const s = new Set<number>()
  for (const b of bomList.value) {
    if (b.goods_id) s.add(b.goods_id)
  }
  return s
})

// Cost: 优先采购入库移动均价，兜底商品 cost_price
function getUnitCost(goodsId: number): { unitCost: number; hasBom: boolean; costSource: string } {
  const c = goodsCostMap.value[goodsId] || 0
  const hasBom = hasBomSet.value.has(goodsId)
  const g = goodsList.value.find(x => x.id === goodsId)
  const hasAvg = g?.goods_sn && procureInhouseList.value.length > 0
  return {
    unitCost: c,
    hasBom,
    costSource: c > 0 ? `${hasAvg ? '采购均价' : '采购价'} ¥${c.toFixed(2)}${hasBom ? '（含BOM）' : ''}` : '未设置成本价',
  }
}

const rows = computed(() => {
  const map: Record<string, {
    goods_name: string; goods_id: number; num: number; sale_amount: number
    unit_cost: number; has_bom: boolean; cost_source: string; source: string
  }> = {}

  const add = (goodsInfo: string | null, source: string, discountRatio = 1) => {
    if (!goodsInfo) return
    try {
      const items = JSON.parse(goodsInfo)
      for (const g of items) {
        const key = `${g.goods_id}_${source}`
        const { unitCost, hasBom, costSource } = getUnitCost(g.goods_id)
        if (!map[key]) {
          map[key] = {
            goods_name: g.goods_name || '-', goods_id: g.goods_id,
            num: 0, sale_amount: 0,
            unit_cost: unitCost, has_bom: hasBom, cost_source: costSource, source,
          }
        }
        const qty = Number(g.num || 0)
        const price = Number(g.price || 0)
        map[key].num += qty
        map[key].sale_amount += qty * price * discountRatio
      }
    } catch {}
  }

  for (const c of saleContracts.value) {
    // 计算优惠比例：实际金额 / 商品原价合计
    const actualAmount = Number(c.after_discount || c.total_amount || 0)
    let rawTotal = 0
    try { for (const g of JSON.parse(c.goods_info || '[]')) rawTotal += Number(g.num || 0) * Number(g.price || 0) } catch {}
    const ratio = rawTotal > 0 ? actualAmount / rawTotal : 1
    add(c.goods_info, '合同', ratio)
  }
  for (const r of retailOrders.value) add(r.goods_info, '零售')

  return Object.values(map)
    .map(r => ({
      ...r,
      cost_amount: r.num * r.unit_cost,
      profit: r.sale_amount - r.num * r.unit_cost,
      profit_rate: r.sale_amount > 0
        ? ((r.sale_amount - r.num * r.unit_cost) / r.sale_amount * 100) : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
})

// 单据维度：按每张合同/零售单一行
const orderRows = computed(() => {
  const result: any[] = []

  for (const c of saleContracts.value) {
    let cost_amount = 0
    try {
      for (const g of JSON.parse(c.goods_info || '[]')) {
        const qty = Number(g.num || 0)
        cost_amount += qty * getUnitCost(g.goods_id).unitCost
      }
    } catch {}
    const sale_amount = Number(c.after_discount || c.total_amount || 0)
    const freight = myFreight(c)
    const profit = sale_amount - cost_amount
    const net_profit = profit - freight
    result.push({
      source: '合同',
      order_no: ((c.remark || '').match(/^\[NO:([^\]]+)\]/) || [])[1] || c.order_sn || c.contract_no || `HT${String(c.id).padStart(4, '0')}`,
      customer_name: c.customer_name || '—',
      order_date: fmtDt(c.contract_date || c.create_time),
      sale_amount, cost_amount, profit, freight, net_profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (net_profit / sale_amount * 100) : 0,
    })
  }

  for (const r of retailOrders.value) {
    let sale_amount = 0
    let cost_amount = 0
    try {
      for (const g of JSON.parse(r.goods_info || '[]')) {
        const qty = Number(g.num || 0)
        sale_amount += qty * Number(g.price || 0)
        cost_amount += qty * getUnitCost(g.goods_id).unitCost
      }
    } catch {}
    const profit = sale_amount - cost_amount
    result.push({
      source: '零售',
      order_no: r.order_sn || r.order_no || `LS${(r.order_date || r.create_time || '').slice(0, 10).replace(/-/g, '')}${String(r.id).padStart(3, '0')}`,
      customer_name: r.customer_name || r.member_name || '散客',
      order_date: fmtDt(r.order_date || r.create_time),
      sale_amount, cost_amount, profit, freight: 0, net_profit: profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
    })
  }

  return result.sort((a, b) => b.profit - a.profit)
})

const totalSale = computed(() => rows.value.reduce((s, r) => s + r.sale_amount, 0))
const totalCost = computed(() => rows.value.reduce((s, r) => s + r.cost_amount, 0))
const totalProfit = computed(() => totalSale.value - totalCost.value)
const overallRate = computed(() =>
  totalSale.value > 0 ? (totalProfit.value / totalSale.value * 100) : 0
)

// Freight: our share from contracts
function myFreight(row: any): number {
  const f = Number(row.freight_amount || 0)
  if (!f) return 0
  const b = row.freight_bearer
  if (b === 'seller') return f
  if (b === 'half') return f / 2
  return 0
}
const freightTotal = computed(() => saleContracts.value.reduce((s, r) => s + myFreight(r), 0))
const expenseTotal = computed(() => expenseList.value.reduce((s, r) => s + Number(r.amount || 0), 0))
const netProfit = computed(() => totalProfit.value - freightTotal.value - expenseTotal.value)
const netRate = computed(() => totalSale.value > 0 ? (netProfit.value / totalSale.value * 100) : 0)

function fmt(v: number | string): string {
  const n = Number(v)
  return isNaN(n) ? '0.00' : n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  loading.value = true
  const params: any = { list_rows: 500 }
  if (dateRange.value) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }
  try {
    const [c, r, g, ih, b, e] = await Promise.allSettled([
      getContractList(params),
      getRetailOrderList(params),
      getGoodsList({ list_rows: 500 }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
      getBomList({ list_rows: 500 }),
      getExpenseList(params),
    ])
    saleContracts.value      = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []) : []
    retailOrders.value       = r.status === 'fulfilled' ? (r.value?.data?.rows  ?? []) : []
    goodsList.value          = g.status === 'fulfilled' ? (g.value?.data?.rows  ?? []) : []
    procureInhouseList.value = ih.status === 'fulfilled' ? (ih.value?.data?.rows ?? []).filter((r: any) => r.status === 1) : []
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

onMounted(loadData)
</script>

<style scoped>
.page-container {}
.pf-summary {
  display: flex; gap: 32px; flex-wrap: wrap;
  padding: 16px 20px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px;
}
.pf-sum-item { display:flex; flex-direction:column; gap:4px; }
.pf-sum-item.pf-sum-divider-v { width:1px; background:#e8eaf0; align-self:stretch; margin:0 4px; }
.pf-sum-label { font-size:11px; color:rgba(29,29,31,0.4); }
.pf-sum-val { font-size:18px; font-weight:700; }
.blue { color:#0071e3; }
.purple { color:#7c3aed; }
.pf-note {
  display:flex; align-items:center; gap:6px; font-size:12px;
  color:rgba(29,29,31,0.4); padding:6px 0 12px;
}
</style>
