<template>
  <div class="page-container">
    <!-- 筛选栏 -->
    <el-card style="margin-bottom:14px">
      <el-form inline>
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
    </el-card>

    <!-- 顶部汇总卡片行 -->
    <div class="sum-row">
      <div class="sum-item">
        <div class="sum-label">营业收入</div>
        <div class="sum-val blue">¥{{ fmt(totals.revenue) }}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">销售成本</div>
        <div class="sum-val purple">¥{{ fmt(totals.cost) }}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">毛利润</div>
        <div class="sum-val" :style="{ color: totals.grossProfit >= 0 ? '#16a34a' : '#dc2626' }">
          {{ totals.grossProfit >= 0 ? '+' : '' }}¥{{ fmt(totals.grossProfit) }}
        </div>
        <div class="sum-sub">毛利率 {{ totals.grossRate.toFixed(1) }}%</div>
      </div>
      <div class="sum-divider"></div>
      <div class="sum-item">
        <div class="sum-label">费用支出</div>
        <div class="sum-val orange">−¥{{ fmt(totals.expense) }}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">运费（我方）</div>
        <div class="sum-val orange">−¥{{ fmt(totals.freight) }}</div>
      </div>
      <div class="sum-divider"></div>
      <div class="sum-item sum-item--big">
        <div class="sum-label" style="font-weight:700">净利润</div>
        <div class="sum-val" :style="{ color: totals.netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'24px' }">
          {{ totals.netProfit >= 0 ? '+' : '' }}¥{{ fmt(totals.netProfit) }}
        </div>
        <div class="sum-sub">净利率 {{ totals.netRate.toFixed(1) }}%</div>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:60px 0">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <template v-else>
      <!-- Tab 切换 -->
      <el-card>
        <el-tabs v-model="viewMode">
          <el-tab-pane label="按月份" name="month" />
          <el-tab-pane label="按单据" name="order" />
          <el-tab-pane label="按单品" name="goods" />
          <el-tab-pane label="按客户" name="customer" />
        </el-tabs>

        <!-- ====== 按月份 ====== -->
        <el-table v-if="viewMode === 'month'" :data="monthRows" style="width:100%"
          :default-sort="{ prop: 'month', order: 'descending' }"
          show-summary :summary-method="getSummary">
          <el-table-column prop="month" label="月份" width="100" sortable />
          <el-table-column label="营业收入" align="right" min-width="120" sortable prop="revenue">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.revenue) }}</span></template>
          </el-table-column>
          <el-table-column label="销售成本" align="right" min-width="120" sortable prop="cost">
            <template #default="{ row }"><span style="color:#7c3aed">¥{{ fmt(row.cost) }}</span></template>
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
              <el-tag :type="row.grossRate >= 20 ? 'success' : row.grossRate > 0 ? 'warning' : 'danger'" size="small">{{ row.grossRate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="费用" align="right" min-width="100" sortable prop="expense">
            <template #default="{ row }"><span style="color:#f59e0b">{{ row.expense > 0 ? '−' : '' }}¥{{ fmt(row.expense) }}</span></template>
          </el-table-column>
          <el-table-column label="运费" align="right" min-width="100" sortable prop="freight">
            <template #default="{ row }"><span style="color:#f59e0b">{{ row.freight > 0 ? '−' : '' }}¥{{ fmt(row.freight) }}</span></template>
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
              <el-tag :type="row.netRate >= 20 ? 'success' : row.netRate > 0 ? 'warning' : 'danger'" size="small">{{ row.netRate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
        </el-table>

        <!-- ====== 按单据 ====== -->
        <el-table v-else-if="viewMode === 'order'" :data="orderRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
          <el-table-column label="类型" align="center" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.source === '零售' ? 'success' : 'primary'">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="order_no" label="单号" min-width="150" show-overflow-tooltip />
          <el-table-column prop="customer_name" label="客户" min-width="120" show-overflow-tooltip />
          <el-table-column prop="order_date" label="日期" width="100" />
          <el-table-column label="销售额" align="right" width="120">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span></template>
          </el-table-column>
          <el-table-column label="成本" align="right" width="120">
            <template #default="{ row }"><span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span></template>
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
              <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.profit_rate.toFixed(1) }}%</el-tag>
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
              <el-tag :type="row.net_rate >= 20 ? 'success' : row.net_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.net_rate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
        </el-table>

        <!-- ====== 按单品 ====== -->
        <el-table v-else-if="viewMode === 'goods'" :data="goodsRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
          <el-table-column prop="goods_name" label="商品名称" min-width="160" show-overflow-tooltip />
          <el-table-column label="销售数量" prop="num" align="right" width="90" sortable />
          <el-table-column label="销售额" align="right" width="120" sortable prop="sale_amount">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span></template>
          </el-table-column>
          <el-table-column label="单位成本" align="right" width="100">
            <template #default="{ row }">
              <el-tooltip :content="row.cost_source" placement="top">
                <span style="color:#7c3aed;cursor:help">¥{{ fmt(row.unit_cost) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="总成本" align="right" width="120">
            <template #default="{ row }"><span style="color:#7c3aed;font-weight:600">¥{{ fmt(row.cost_amount) }}</span></template>
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
              <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.profit_rate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源" align="center" width="70">
            <template #default="{ row }">
              <el-tag size="small" :type="row.source === '零售' ? 'success' : 'primary'">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
        </el-table>

        <!-- ====== 按客户 ====== -->
        <el-table v-else :data="customerRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
          <el-table-column prop="customer_name" label="客户" min-width="160" show-overflow-tooltip />
          <el-table-column label="订单数" prop="order_count" align="right" width="80" sortable />
          <el-table-column label="销售额" align="right" width="130" sortable prop="sale_amount">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span></template>
          </el-table-column>
          <el-table-column label="成本" align="right" width="130" sortable prop="cost_amount">
            <template #default="{ row }"><span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span></template>
          </el-table-column>
          <el-table-column label="运费" align="right" width="100">
            <template #default="{ row }"><span style="color:#f59e0b">{{ row.freight > 0 ? '−' : '' }}¥{{ fmt(row.freight) }}</span></template>
          </el-table-column>
          <el-table-column label="毛利润" align="right" width="130" sortable prop="profit">
            <template #default="{ row }">
              <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="毛利率" align="right" width="90">
            <template #default="{ row }">
              <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.profit_rate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="净利润" align="right" width="130" sortable prop="net_profit">
            <template #default="{ row }">
              <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:700 }">
                {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
              </span>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
        </el-table>

        <!-- 说明 -->
        <div class="pl-note">
          <el-icon><InfoFilled /></el-icon>
          收入来源：销售合同 + 零售订单；成本优先取库存移动均价，无均价时取商品采购价；净利润 = 毛利润 − 费用 − 我方运费
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { InfoFilled, Loading } from '@element-plus/icons-vue'
import { getContractList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const viewMode = ref<'month' | 'order' | 'goods' | 'customer'>('month')

const saleContracts = ref<any[]>([])
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
    if (bomCost > 0) { snTotalCost[sn] = bomCost; snTotalQty[sn] = 1 }
  }
  for (const g of goodsList.value) {
    const sn = g.goods_sn
    if (sn && snTotalQty[sn] > 0) m[g.id] = snTotalCost[sn] / snTotalQty[sn]
  }
  return m
})

function getUnitCost(gid: number): { unitCost: number; costSource: string } {
  const c = goodsCostMap.value[gid] || 0
  return { unitCost: c, costSource: c > 0 ? `成本 ¥${c.toFixed(2)}` : '未设置成本价' }
}

function myFreight(row: any): number {
  const f = Number(row.freight_amount || 0)
  if (!f) return 0
  if (row.freight_bearer === 'seller') return f
  if (row.freight_bearer === 'half') return f / 2
  return 0
}

// ====== 按月份 ======
const monthRows = computed(() => {
  const map: Record<string, { month: string; revenue: number; cost: number; expense: number; freight: number }> = {}
  const ensure = (m: string) => { if (!map[m]) map[m] = { month: m, revenue: 0, cost: 0, expense: 0, freight: 0 } }
  for (const c of saleContracts.value) {
    const m = (c.contract_date || c.create_time || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].revenue += Number(c.after_discount || c.total_amount || 0)
    try { for (const g of JSON.parse(c.goods_info || '[]')) map[m].cost += Number(g.num || 0) * (goodsCostMap.value[g.goods_id] || 0) } catch {}
    map[m].freight += myFreight(c)
  }
  for (const r of retailOrders.value) {
    const m = (r.order_date || r.create_time || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    try { for (const g of JSON.parse(r.goods_info || '[]')) { const q = Number(g.num || 0); map[m].revenue += q * Number(g.price || 0); map[m].cost += q * (goodsCostMap.value[g.goods_id] || 0) } } catch {}
  }
  for (const e of expenseList.value) {
    const m = (e.expense_date || e.create_time || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].expense += Number(e.amount || 0)
  }
  return Object.values(map).map(r => {
    const grossProfit = r.revenue - r.cost
    const grossRate = r.revenue > 0 ? (grossProfit / r.revenue * 100) : 0
    const netProfit = grossProfit - r.expense - r.freight
    const netRate = r.revenue > 0 ? (netProfit / r.revenue * 100) : 0
    return { ...r, grossProfit, grossRate, netProfit, netRate }
  }).sort((a, b) => b.month.localeCompare(a.month))
})

// ====== 按单据 ======
const orderRows = computed(() => {
  const result: any[] = []
  for (const c of saleContracts.value) {
    let cost_amount = 0
    try { for (const g of JSON.parse(c.goods_info || '[]')) cost_amount += Number(g.num || 0) * getUnitCost(g.goods_id).unitCost } catch {}
    const sale_amount = Number(c.after_discount || c.total_amount || 0)
    const freight = myFreight(c)
    const profit = sale_amount - cost_amount
    const net_profit = profit - freight
    result.push({
      source: '合同',
      order_no: ((c.remark || '').match(/^\[NO:([^\]]+)\]/) || [])[1] || c.order_sn || c.contract_no || `HT${String(c.id).padStart(4, '0')}`,
      customer_name: c.customer_name || '—',
      order_date: (c.contract_date || c.create_time || '').slice(0, 10),
      sale_amount, cost_amount, profit, freight, net_profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (net_profit / sale_amount * 100) : 0,
    })
  }
  for (const r of retailOrders.value) {
    let sale_amount = 0, cost_amount = 0
    try { for (const g of JSON.parse(r.goods_info || '[]')) { const q = Number(g.num || 0); sale_amount += q * Number(g.price || 0); cost_amount += q * getUnitCost(g.goods_id).unitCost } } catch {}
    const profit = sale_amount - cost_amount
    result.push({
      source: '零售', order_no: r.order_sn || r.order_no || `零售订单 ${(r.order_date || r.create_time || '').slice(0, 10)}`,
      customer_name: r.customer_name || r.member_name || '散客',
      order_date: (r.order_date || r.create_time || '').slice(0, 10),
      sale_amount, cost_amount, profit, freight: 0, net_profit: profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
    })
  }
  return result.sort((a, b) => b.profit - a.profit)
})

// ====== 按单品 ======
const goodsRows = computed(() => {
  const map: Record<string, any> = {}
  const add = (goodsInfo: string | null, source: string, discountRatio = 1) => {
    if (!goodsInfo) return
    try {
      for (const g of JSON.parse(goodsInfo)) {
        const key = `${g.goods_id}_${source}`
        const { unitCost, costSource } = getUnitCost(g.goods_id)
        if (!map[key]) map[key] = { goods_name: g.goods_name || '-', goods_id: g.goods_id, num: 0, sale_amount: 0, unit_cost: unitCost, cost_source: costSource, source }
        const qty = Number(g.num || 0)
        map[key].num += qty
        map[key].sale_amount += qty * Number(g.price || 0) * discountRatio
      }
    } catch {}
  }
  for (const c of saleContracts.value) {
    const actualAmount = Number(c.after_discount || c.total_amount || 0)
    let rawTotal = 0
    try { for (const g of JSON.parse(c.goods_info || '[]')) rawTotal += Number(g.num || 0) * Number(g.price || 0) } catch {}
    add(c.goods_info, '合同', rawTotal > 0 ? actualAmount / rawTotal : 1)
  }
  for (const r of retailOrders.value) add(r.goods_info, '零售')
  return Object.values(map).map((r: any) => ({
    ...r,
    cost_amount: r.num * r.unit_cost,
    profit: r.sale_amount - r.num * r.unit_cost,
    profit_rate: r.sale_amount > 0 ? ((r.sale_amount - r.num * r.unit_cost) / r.sale_amount * 100) : 0,
  })).sort((a: any, b: any) => b.profit - a.profit)
})

// ====== 按客户 ======
const customerRows = computed(() => {
  const map: Record<string, { customer_name: string; order_count: number; sale_amount: number; cost_amount: number; freight: number }> = {}
  for (const c of saleContracts.value) {
    const name = c.customer_name || '—'
    if (!map[name]) map[name] = { customer_name: name, order_count: 0, sale_amount: 0, cost_amount: 0, freight: 0 }
    map[name].order_count++
    map[name].sale_amount += Number(c.after_discount || c.total_amount || 0)
    map[name].freight += myFreight(c)
    try { for (const g of JSON.parse(c.goods_info || '[]')) map[name].cost_amount += Number(g.num || 0) * getUnitCost(g.goods_id).unitCost } catch {}
  }
  for (const r of retailOrders.value) {
    const name = r.customer_name || r.member_name || '散客'
    if (!map[name]) map[name] = { customer_name: name, order_count: 0, sale_amount: 0, cost_amount: 0, freight: 0 }
    map[name].order_count++
    try { for (const g of JSON.parse(r.goods_info || '[]')) { const q = Number(g.num || 0); map[name].sale_amount += q * Number(g.price || 0); map[name].cost_amount += q * getUnitCost(g.goods_id).unitCost } } catch {}
  }
  return Object.values(map).map(r => {
    const profit = r.sale_amount - r.cost_amount
    const net_profit = profit - r.freight
    return {
      ...r, profit, net_profit,
      profit_rate: r.sale_amount > 0 ? (profit / r.sale_amount * 100) : 0,
      net_rate: r.sale_amount > 0 ? (net_profit / r.sale_amount * 100) : 0,
    }
  }).sort((a, b) => b.profit - a.profit)
})

// 汇总
const totals = computed(() => {
  const revenue = monthRows.value.reduce((s, r) => s + r.revenue, 0)
  const cost = monthRows.value.reduce((s, r) => s + r.cost, 0)
  const expense = monthRows.value.reduce((s, r) => s + r.expense, 0)
  const freight = monthRows.value.reduce((s, r) => s + r.freight, 0)
  const grossProfit = revenue - cost
  const netProfit = grossProfit - expense - freight
  return {
    revenue, cost, expense, freight, grossProfit, netProfit,
    grossRate: revenue > 0 ? (grossProfit / revenue * 100) : 0,
    netRate: revenue > 0 ? (netProfit / revenue * 100) : 0,
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
.page-container { display: flex; flex-direction: column; gap: 14px; }
.sum-row {
  display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;
  padding: 20px 24px; background: #fff; border-radius: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.sum-item { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
.sum-item--big { background: #f8fafc; border-radius: 10px; padding: 10px 16px; }
.sum-label { font-size: 11px; color: rgba(29,29,31,0.4); }
.sum-val { font-size: 18px; font-weight: 700; }
.sum-sub { font-size: 11px; color: rgba(29,29,31,0.4); }
.sum-divider { width: 1px; background: #e8eaf0; align-self: stretch; margin: 0 4px; }
.blue { color: #0071e3; }
.purple { color: #7c3aed; }
.orange { color: #f59e0b; }
.pl-note {
  display: flex; align-items: center; gap: 6px; font-size: 12px;
  color: rgba(29,29,31,0.4); padding: 12px 0 0;
}
</style>
