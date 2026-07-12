<template>
  <div class="page-container">
    <!-- 筛选栏 -->
    <el-card style="margin-bottom:14px">
      <el-form inline>
        <el-form-item :label="$t('reports.finance.dateLabel')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('reports.finance.rangeSeparator')"
            :start-placeholder="$t('reports.finance.startPlaceholder')"
            :end-placeholder="$t('reports.finance.endPlaceholder')"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="loadData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadData">{{ $t('reports.finance.query') }}</el-button>
          <el-button @click="onReset">{{ $t('reports.finance.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 顶部汇总卡片行 -->
    <div class="sum-row">
      <div class="sum-item">
        <div class="sum-label">{{ $t('reports.finance.revenue') }}</div>
        <div class="sum-val blue">¥{{ fmt(totals.revenue) }}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">{{ $t('reports.finance.cost') }}</div>
        <div class="sum-val purple">¥{{ fmt(totals.cost) }}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">{{ $t('reports.finance.grossProfit') }}</div>
        <div class="sum-val" :style="{ color: totals.grossProfit >= 0 ? '#16a34a' : '#dc2626' }">
          {{ totals.grossProfit >= 0 ? '+' : '' }}¥{{ fmt(totals.grossProfit) }}
        </div>
        <div class="sum-sub">{{ $t('reports.finance.grossRate') }} {{ totals.grossRate.toFixed(1) }}%</div>
      </div>
      <div class="sum-divider"></div>
      <div class="sum-item">
        <div class="sum-label">{{ $t('reports.finance.expense') }}</div>
        <div class="sum-val orange">−¥{{ fmt(totals.expense) }}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">{{ $t('reports.finance.freight') }}</div>
        <div class="sum-val orange">−¥{{ fmt(totals.freight) }}</div>
      </div>
      <div class="sum-item">
        <div class="sum-label">{{ $t('reports.finance.docExpense') }}</div>
        <div class="sum-val orange">−¥{{ fmt(totals.docExpense) }}</div>
      </div>
      <div class="sum-divider"></div>
      <div class="sum-item sum-item--big">
        <div class="sum-label" style="font-weight:700">{{ $t('reports.finance.netProfit') }}</div>
        <div class="sum-val" :style="{ color: totals.netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'24px' }">
          {{ totals.netProfit >= 0 ? '+' : '' }}¥{{ fmt(totals.netProfit) }}
        </div>
        <div class="sum-sub">{{ $t('reports.finance.netRate') }} {{ totals.netRate.toFixed(1) }}%</div>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:60px 0">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <template v-else>
      <!-- Tab 切换 -->
      <el-card>
        <el-tabs v-model="viewMode">
          <el-tab-pane :label="$t('reports.finance.tabMonth')" name="month" />
          <el-tab-pane :label="$t('reports.finance.tabOrder')" name="order" />
          <el-tab-pane :label="$t('reports.finance.tabGoods')" name="goods" />
          <el-tab-pane :label="$t('reports.finance.tabCustomer')" name="customer" />
        </el-tabs>

        <!-- ====== 按月份 ====== -->
        <el-table v-if="viewMode === 'month'" :data="monthRows" style="width:100%"
          :default-sort="{ prop: 'month', order: 'descending' }"
          show-summary :summary-method="getSummary">
          <el-table-column prop="month" :label="$t('reports.finance.colMonth')" width="100" sortable />
          <el-table-column :label="$t('reports.finance.colRevenue')" align="right" min-width="120" sortable prop="revenue">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.revenue) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colCost')" align="right" min-width="120" sortable prop="cost">
            <template #default="{ row }"><span style="color:#7c3aed">¥{{ fmt(row.cost) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossProfit')" align="right" min-width="120" sortable prop="grossProfit">
            <template #default="{ row }">
              <span :style="{ color: row.grossProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                {{ row.grossProfit >= 0 ? '+' : '' }}¥{{ fmt(row.grossProfit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossRate')" align="right" width="90">
            <template #default="{ row }">
              <el-tag :type="row.grossRate >= 20 ? 'success' : row.grossRate > 0 ? 'warning' : 'danger'" size="small">{{ row.grossRate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colExpense')" align="right" min-width="100" sortable prop="expense">
            <template #default="{ row }"><span style="color:#f59e0b">{{ row.expense > 0 ? '−' : '' }}¥{{ fmt(row.expense) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colFreight')" align="right" min-width="100" sortable prop="freight">
            <template #default="{ row }"><span style="color:#f59e0b">{{ row.freight > 0 ? '−' : '' }}¥{{ fmt(row.freight) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colDocExpense')" align="right" min-width="100" sortable prop="docExpense">
            <template #default="{ row }"><span style="color:#f59e0b">{{ row.docExpense > 0 ? '−' : '' }}¥{{ fmt(row.docExpense) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colNetProfit')" align="right" min-width="120" sortable prop="netProfit">
            <template #default="{ row }">
              <span :style="{ color: row.netProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight:700 }">
                {{ row.netProfit >= 0 ? '+' : '' }}¥{{ fmt(row.netProfit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colNetRate')" align="right" width="90">
            <template #default="{ row }">
              <el-tag :type="row.netRate >= 20 ? 'success' : row.netRate > 0 ? 'warning' : 'danger'" size="small">{{ row.netRate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">{{ $t('reports.finance.noData') }}</div></template>
        </el-table>

        <!-- ====== 按单据 ====== -->
        <el-table v-else-if="viewMode === 'order'" :data="orderRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
          <el-table-column :label="$t('reports.finance.colType')" align="center" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.source === '零售' ? 'success' : 'primary'">{{ sourceLabel(row.source) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="order_no" :label="$t('reports.finance.colOrderNo')" min-width="150" show-overflow-tooltip />
          <el-table-column prop="customer_name" :label="$t('reports.finance.colCustomer')" min-width="120" show-overflow-tooltip />
          <el-table-column prop="order_date" :label="$t('reports.finance.colDate')" width="100" />
          <el-table-column :label="$t('reports.finance.colSaleAmount')" align="right" width="120">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colCostAmount')" align="right" width="120">
            <template #default="{ row }"><span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossProfit')" align="right" width="120" sortable prop="profit">
            <template #default="{ row }">
              <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossRate')" align="right" width="80">
            <template #default="{ row }">
              <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.profit_rate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colNetProfit')" align="right" width="120" sortable prop="net_profit">
            <template #default="{ row }">
              <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colNetRate')" align="right" width="80">
            <template #default="{ row }">
              <el-tag :type="row.net_rate >= 20 ? 'success' : row.net_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.net_rate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">{{ $t('reports.finance.noData') }}</div></template>
        </el-table>

        <!-- ====== 按单品 ====== -->
        <el-table v-else-if="viewMode === 'goods'" :data="goodsRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
          <el-table-column prop="goods_name" :label="$t('reports.finance.colGoodsName')" min-width="160" show-overflow-tooltip />
          <el-table-column :label="$t('reports.finance.colSaleQty')" prop="num" align="right" width="90" sortable />
          <el-table-column :label="$t('reports.finance.colSaleAmount')" align="right" width="120" sortable prop="sale_amount">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colUnitCost')" align="right" width="100">
            <template #default="{ row }">
              <el-tooltip :content="row.cost_source" placement="top">
                <span style="color:#7c3aed;cursor:help">¥{{ fmt(row.unit_cost) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colTotalCost')" align="right" width="120">
            <template #default="{ row }"><span style="color:#7c3aed;font-weight:600">¥{{ fmt(row.cost_amount) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossProfit')" align="right" width="120" sortable prop="profit">
            <template #default="{ row }">
              <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossRate')" align="right" width="80">
            <template #default="{ row }">
              <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.profit_rate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colSource')" align="center" width="70">
            <template #default="{ row }">
              <el-tag size="small" :type="row.source === '零售' ? 'success' : 'primary'">{{ sourceLabel(row.source) }}</el-tag>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">{{ $t('reports.finance.noData') }}</div></template>
        </el-table>

        <!-- ====== 按客户 ====== -->
        <el-table v-else :data="customerRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
          <el-table-column prop="customer_name" :label="$t('reports.finance.colCustomer')" min-width="160" show-overflow-tooltip />
          <el-table-column :label="$t('reports.finance.colOrderCount')" prop="order_count" align="right" width="80" sortable />
          <el-table-column :label="$t('reports.finance.colSaleAmount')" align="right" width="130" sortable prop="sale_amount">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colCostAmount')" align="right" width="130" sortable prop="cost_amount">
            <template #default="{ row }"><span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colFreight')" align="right" width="100">
            <template #default="{ row }"><span style="color:#f59e0b">{{ row.freight > 0 ? '−' : '' }}¥{{ fmt(row.freight) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossProfit')" align="right" width="130" sortable prop="profit">
            <template #default="{ row }">
              <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colGrossRate')" align="right" width="90">
            <template #default="{ row }">
              <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">{{ row.profit_rate.toFixed(1) }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.finance.colNetProfit')" align="right" width="130" sortable prop="net_profit">
            <template #default="{ row }">
              <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:700 }">
                {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
              </span>
            </template>
          </el-table-column>
          <template #empty><div style="padding:40px 0;color:#aaa">{{ $t('reports.finance.noData') }}</div></template>
        </el-table>

        <!-- 说明 -->
        <div class="pl-note">
          <el-icon><InfoFilled /></el-icon>
          {{ $t('reports.finance.note') }}
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

function sourceLabel(source: string): string {
  if (source === '零售') return t('reports.finance.sourceRetail')
  if (source === '销售单' || source === '出库单') return t('reports.finance.sourceSales')
  return source || '-'
}
import { fmtDt } from '@/utils/date'
import { getContractList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'
import { findNaiDoufuGoods } from '@/utils/goodsAlias'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'
import {
  createProfitCostContext, loadUnitConvertRows, loadBomItems,
  calcContractSaleAmount, calcRetailSaleAmount, myFreightShare,
  aggregateGoodsProfit, aggregateMonthProfit, calcOrderCost,
  type ProfitCostContext, type BomItemFlat,
} from '@/utils/profitCalc'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const viewMode = ref<'month' | 'order' | 'goods' | 'customer'>('month')

const saleContracts = ref<any[]>([])
const retailOrders = ref<any[]>([])
const goodsList = ref<any[]>([])
const procureInhouseList = ref<any[]>([])
const bomList = ref<any[]>([])
const bomItemList = ref<BomItemFlat[]>([])
const unitConvertList = ref<any[]>([])
const expenseList = ref<any[]>([])
const procureOrders = ref<any[]>([])  // 已审核采购单（取 expense_amount）

// 成本上下文 — 算法统一在 @/utils/profitCalc
const costCtx = computed<ProfitCostContext>(() => createProfitCostContext({
  goodsList: goodsList.value,
  inhouseList: procureInhouseList.value,
  bomHeaders: bomList.value,
  bomItems: bomItemList.value,
  unitConvertRows: unitConvertList.value,
}))

// ====== 按月份 ======
const monthRows = computed(() => aggregateMonthProfit({
  contracts: saleContracts.value,
  retails: retailOrders.value,
  expenses: expenseList.value,
  procureOrders: procureOrders.value,
}, costCtx.value, findNaiDoufuGoods))

// ====== 按单据 ======
const orderRows = computed(() => {
  const result: any[] = []
  for (const c of saleContracts.value) {
    const sale_amount = calcContractSaleAmount(c)
    const cost_amount = calcOrderCost(c.goods_info, costCtx.value, findNaiDoufuGoods)
    const freight = myFreightShare(c)
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
    const sale_amount = calcRetailSaleAmount(r)
    const cost_amount = calcOrderCost(r.goods_info, costCtx.value, findNaiDoufuGoods)
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

// ====== 按单品 ======
const goodsRows = computed(() => {
  const docs = [
    ...saleContracts.value.map(c => ({ goodsInfo: c.goods_info, source: '合同', saleAmount: calcContractSaleAmount(c) })),
    ...retailOrders.value.map(r => ({ goodsInfo: r.goods_info, source: '零售', saleAmount: calcRetailSaleAmount(r) })),
  ]
  return aggregateGoodsProfit(docs, costCtx.value, { keyWithSource: true, aliasResolver: findNaiDoufuGoods })
})

// ====== 按客户 ======
const customerRows = computed(() => {
  const map: Record<string, { customer_name: string; order_count: number; sale_amount: number; cost_amount: number; freight: number }> = {}
  for (const o of orderRows.value) {
    const name = o.customer_name || '—'
    if (!map[name]) map[name] = { customer_name: name, order_count: 0, sale_amount: 0, cost_amount: 0, freight: 0 }
    map[name].order_count++
    map[name].sale_amount += o.sale_amount
    map[name].cost_amount += o.cost_amount
    map[name].freight += o.freight
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
  const docExpense = monthRows.value.reduce((s, r) => s + r.docExpense, 0)
  const grossProfit = revenue - cost
  const netProfit = grossProfit - expense - freight - docExpense
  return {
    revenue, cost, expense, freight, docExpense, grossProfit, netProfit,
    grossRate: revenue > 0 ? (grossProfit / revenue * 100) : 0,
    netRate: revenue > 0 ? (netProfit / revenue * 100) : 0,
  }
})

function getSummary() {
  const totalsVal = totals.value
  return [t('reports.finance.colSummaryTotal'), `¥${fmt(totalsVal.revenue)}`, `¥${fmt(totalsVal.cost)}`,
    `${totalsVal.grossProfit >= 0 ? '+' : ''}¥${fmt(totalsVal.grossProfit)}`, `${totalsVal.grossRate.toFixed(1)}%`,
    `¥${fmt(totalsVal.expense)}`, `¥${fmt(totalsVal.freight)}`, `¥${fmt(totalsVal.docExpense)}`,
    `${totalsVal.netProfit >= 0 ? '+' : ''}¥${fmt(totalsVal.netProfit)}`, `${totalsVal.netRate.toFixed(1)}%`]
}

function fmt(v: number): string {
  return isNaN(v) ? '0.00' : v.toLocaleString(locale.value === 'en-US' ? 'en-US' : 'zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  loading.value = true
  const params: any = { list_rows: 2000 }
  if (dateRange.value) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }
  try {
    const [c, r, g, ih, b, e, po] = await Promise.allSettled([
      getContractList(params),
      getRetailOrderList(params),
      getGoodsList({ list_rows: 3000 }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
      getBomList({ list_rows: 500 }),
      getExpenseList(params),
      http.get('/stock/PurchaseOrder/index', { params: { ...params, list_rows: 2000 } }),
    ])
    saleContracts.value      = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []).filter(isEffectiveSaleContract) : []
    retailOrders.value       = r.status === 'fulfilled' ? (r.value?.data?.rows  ?? []).filter((r: any) => Number(r.status) === 1) : []
    goodsList.value          = g.status === 'fulfilled' ? (g.value?.data?.rows  ?? []) : []
    procureInhouseList.value = ih.status === 'fulfilled' ? (ih.value?.data?.rows ?? []).filter((r: any) => r.status === 1) : []
    const bomHeaders         = b.status === 'fulfilled' ? (b.value?.data?.list ?? b.value?.data?.rows ?? []) : []
    bomList.value            = bomHeaders
    expenseList.value        = e.status === 'fulfilled' ? (e.value?.data?.rows  ?? []) : []
    procureOrders.value      = po.status === 'fulfilled' ? (po.value?.data?.rows ?? []).filter((r: any) => Number(r.status) === 1) : []

    // 多单位换算 + BOM 物料明细（只读接口）
    const [ucRows, bomItems] = await Promise.all([
      loadUnitConvertRows(http, goodsList.value),
      loadBomItems(http, bomHeaders),
    ])
    unitConvertList.value = ucRows
    bomItemList.value = bomItems
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
