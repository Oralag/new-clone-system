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
        成本价取商品列表cost_price；运费按合同承担比例扣除；费用来自费用管理模块；净利润 = 毛利润 − 运费 − 费用
      </div>

      <div v-if="loading" style="text-align:center;padding:40px 0">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>
      <div v-else-if="rows.length === 0" style="text-align:center;padding:40px 0;color:#aaa">
        暂无利润数据（请先录入销售合同或零售订单）
      </div>
      <el-table v-else :data="rows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
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
            <el-tag size="small" :type="row.source === '零售' ? 'success' : 'primary'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { InfoFilled, Loading } from '@element-plus/icons-vue'
import { getContractList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)

const saleContracts = ref<any[]>([])
const retailOrders = ref<any[]>([])
const goodsList = ref<any[]>([])
const bomList = ref<any[]>([])
const expenseList = ref<any[]>([])

// goods_id -> cost_price map (商品列表里设置的成本价)
const goodsCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of goodsList.value) {
    m[g.id] = Number(g.cost_price || 0)
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

// Cost always comes from the goods master cost_price
// BOM tag is shown for info only — cost_price on finished goods already reflects BOM cost
function getUnitCost(goodsId: number): { unitCost: number; hasBom: boolean; costSource: string } {
  const c = goodsCostMap.value[goodsId] || 0
  const hasBom = hasBomSet.value.has(goodsId)
  return {
    unitCost: c,
    hasBom,
    costSource: c > 0 ? `成本价 ¥${c}${hasBom ? '（含BOM）' : ''}` : '未设置成本价',
  }
}

const rows = computed(() => {
  const map: Record<string, {
    goods_name: string; goods_id: number; num: number; sale_amount: number
    unit_cost: number; has_bom: boolean; cost_source: string; source: string
  }> = {}

  const add = (goodsInfo: string | null, source: string) => {
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
        map[key].sale_amount += qty * price
      }
    } catch {}
  }

  for (const c of saleContracts.value) add(c.goods_info, '合同')
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
    const [c, r, g, b, e] = await Promise.allSettled([
      getContractList(params),
      getRetailOrderList(params),
      getGoodsList({ list_rows: 500 }),
      getBomList({ list_rows: 500 }),
      getExpenseList(params),
    ])
    saleContracts.value = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []) : []
    retailOrders.value  = r.status === 'fulfilled' ? (r.value?.data?.rows  ?? []) : []
    goodsList.value     = g.status === 'fulfilled' ? (g.value?.data?.rows  ?? []) : []
    bomList.value       = b.status === 'fulfilled' ? (b.value?.data?.rows  ?? []) : []
    expenseList.value   = e.status === 'fulfilled' ? (e.value?.data?.rows  ?? []) : []
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
