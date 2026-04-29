<template>
  <div class="ro-page">
    <!-- Header -->
    <div class="ro-header">
      <div>
        <div class="ro-badge">Reports Dashboard</div>
        <h2 class="ro-title">报表总览</h2>
        <p class="ro-sub">基于销售合同 · 零售订单 · 采购订单的实时核算</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width:240px"
          @change="loadAll"
        />
        <el-button :icon="Refresh" :loading="loading" @click="loadAll">刷新</el-button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="ro-kpi-grid">
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/sale/contract')">
        <div class="ro-kpi-icon" style="background:rgba(0,113,227,0.08)">
          <el-icon :size="22" color="#0071e3"><Money /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">销售合同收入</div>
          <div class="ro-kpi-value" style="color:#0071e3">¥{{ fmt(saleTotal) }}</div>
          <div class="ro-kpi-sub">{{ saleContracts.length }} 笔合同 · 点击查看</div>
        </div>
      </div>
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/retail/order')">
        <div class="ro-kpi-icon" style="background:rgba(16,185,129,0.08)">
          <el-icon :size="22" color="#10b981"><Shop /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">零售订单收入</div>
          <div class="ro-kpi-value" style="color:#10b981">¥{{ fmt(retailTotal) }}</div>
          <div class="ro-kpi-sub">{{ retailOrders.length }} 笔订单 · 点击查看</div>
        </div>
      </div>
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/procure/order')">
        <div class="ro-kpi-icon" style="background:rgba(124,58,237,0.08)">
          <el-icon :size="22" color="#7c3aed"><ShoppingCart /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">采购总支出</div>
          <div class="ro-kpi-value" style="color:#7c3aed">¥{{ fmt(procureTotal) }}</div>
          <div class="ro-kpi-sub">{{ procureOrders.length }} 笔采购 · 点击查看</div>
        </div>
      </div>
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/reports/profit')">
        <div class="ro-kpi-icon" :style="{ background: netProfit >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)' }">
          <el-icon :size="22" :color="netProfit >= 0 ? '#16a34a' : '#dc2626'"><TrendCharts /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">净利润</div>
          <div class="ro-kpi-value" :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ netProfit >= 0 ? '' : '-' }}¥{{ fmt(Math.abs(netProfit)) }}
          </div>
          <div class="ro-kpi-sub">毛利率 {{ grossMargin.toFixed(1) }}% · 净利率 {{ netMargin.toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <!-- 利润核算表 -->
    <div class="ro-chart-card">
      <div class="ro-card-header">
        <div class="ro-card-title">
          利润核算表
          <span class="ro-card-hint">收入（合同+零售）− 采购支出 = 毛利润</span>
        </div>
        <router-link to="/reports/profit" class="ro-link">查看完整利润报表 →</router-link>
      </div>

      <div class="ro-profit-body">
        <!-- 收入 -->
        <div class="ro-profit-col">
          <div class="ro-col-header blue">
            <span>收入来源</span>
            <span>¥{{ fmt(saleTotal + retailTotal) }}</span>
          </div>
          <div class="ro-section-label">销售合同（{{ saleContracts.length }} 单）</div>
          <div v-if="saleContracts.length === 0 && !loading" class="ro-empty-sm">暂无已审核合同</div>
          <div v-for="row in saleContracts.slice(0, 6)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.customer_name || row.order_sn || '-' }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.sign_date || row.created_at) }}</span>
            <span class="ro-dr-amt blue">+¥{{ fmt(row.total_amount || 0) }}</span>
          </div>
          <div v-if="saleContracts.length > 6" class="ro-more">还有 {{ saleContracts.length - 6 }} 笔合同...</div>

          <div class="ro-section-label" style="margin-top:12px">零售订单（{{ retailOrders.length }} 单）</div>
          <div v-if="retailOrders.length === 0 && !loading" class="ro-empty-sm">暂无零售订单</div>
          <div v-for="row in retailOrders.slice(0, 6)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.member_name || row.customer_name || '散客' }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.order_date || row.created_at) }}</span>
            <span class="ro-dr-amt green">+¥{{ fmt(row.pay_amount || row.total_amount || 0) }}</span>
          </div>
          <div v-if="retailOrders.length > 6" class="ro-more">还有 {{ retailOrders.length - 6 }} 笔订单...</div>
        </div>

        <!-- 支出 -->
        <div class="ro-profit-col">
          <div class="ro-col-header purple">
            <span>支出明细</span>
            <span>¥{{ fmt(procureTotal + freightTotal + expenseTotal) }}</span>
          </div>
          <div class="ro-section-label">采购订单（{{ procureOrders.length }} 单）</div>
          <div v-if="procureOrders.length === 0 && !loading" class="ro-empty-sm">暂无采购订单</div>
          <div v-for="row in procureOrders.slice(0, 8)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ getProcureSupplierLabel(row) || row.order_sn || '-' }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.order_date || row.created_at) }}</span>
            <span class="ro-dr-amt red">−¥{{ fmt(row.total_amount || 0) }}</span>
          </div>
          <div v-if="procureOrders.length > 8" class="ro-more">还有 {{ procureOrders.length - 8 }} 笔采购...</div>

          <div class="ro-section-label" style="margin-top:12px">我方承担运费</div>
          <div v-if="freightTotal === 0 && !loading" class="ro-empty-sm">无运费承担</div>
          <div v-for="row in freightRows" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.customer_name || '-' }}（{{ freightLabel(row) }}）</span>
            <span class="ro-dr-date">{{ fmtDt(row.sign_date || row.created_at) }}</span>
            <span class="ro-dr-amt red">−¥{{ fmt(myFreight(row)) }}</span>
          </div>

          <div class="ro-section-label" style="margin-top:12px">费用支出（{{ expenseList.length }} 笔）</div>
          <div v-if="expenseList.length === 0 && !loading" class="ro-empty-sm">暂无费用记录</div>
          <div v-for="row in expenseList.slice(0, 6)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.title || row.expense_type || '-' }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.expense_date || row.created_at) }}</span>
            <span class="ro-dr-amt red">−¥{{ fmt(row.amount || 0) }}</span>
          </div>
          <div v-if="expenseList.length > 6" class="ro-more">还有 {{ expenseList.length - 6 }} 笔费用...</div>
        </div>

        <!-- 汇总 -->
        <div class="ro-summary-col">
          <div class="ro-col-header ro-col-header-summary">
            <span>核算汇总</span>
          </div>
          <div class="ro-sum-block">
            <div class="ro-sum-row">
              <span class="ro-sum-label">合同收入</span>
              <span style="color:#0071e3;font-weight:600">¥{{ fmt(saleTotal) }}</span>
            </div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">零售收入</span>
              <span style="color:#10b981;font-weight:600">¥{{ fmt(retailTotal) }}</span>
            </div>
            <div class="ro-sum-row ro-sum-total">
              <span class="ro-sum-label">总收入</span>
              <span style="color:#0071e3;font-size:17px;font-weight:800">¥{{ fmt(saleTotal + retailTotal) }}</span>
            </div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">采购支出</span>
              <span style="color:#7c3aed;font-weight:600">−¥{{ fmt(procureTotal) }}</span>
            </div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row ro-sum-total">
              <span class="ro-sum-label">毛利润</span>
              <span :style="{ color: grossProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'18px', fontWeight:800 }">
                {{ grossProfit >= 0 ? '+' : '-' }}¥{{ fmt(Math.abs(grossProfit)) }}
              </span>
            </div>
            <div class="ro-sum-row ro-sum-hint">毛利率 {{ grossMargin.toFixed(1) }}%</div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">我方运费</span>
              <span style="color:#f59e0b;font-weight:600">−¥{{ fmt(freightTotal) }}</span>
            </div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">费用支出</span>
              <span style="color:#f59e0b;font-weight:600">−¥{{ fmt(expenseTotal) }}</span>
            </div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row ro-sum-total">
              <span class="ro-sum-label" style="font-weight:700">净利润</span>
              <span :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'20px', fontWeight:800 }">
                {{ netProfit >= 0 ? '+' : '-' }}¥{{ fmt(Math.abs(netProfit)) }}
              </span>
            </div>
            <div class="ro-sum-row ro-sum-hint">净利率 {{ netMargin.toFixed(1) }}%</div>
          </div>

          <!-- 客户预收款余额（单独展示，不计入利润） -->
          <div class="ro-sum-block ro-prepay-block" style="margin-top:16px">
            <div class="ro-sum-row" style="cursor:pointer" @click="$router.push('/finance/prepay')">
              <span class="ro-sum-label" style="color:#92400e;font-weight:600">客户预收款</span>
              <span style="color:#d97706;font-size:15px;font-weight:800">¥{{ fmt(prepayTotalAmount) }}</span>
            </div>
            <div class="ro-sum-row">
              <span class="ro-sum-label" style="color:#a16207">已核销</span>
              <span style="color:#d97706;font-weight:600">−¥{{ fmt(prepayUsedAmount) }}</span>
            </div>
            <div class="ro-sum-divider" style="background:#fde68a"></div>
            <div class="ro-sum-row">
              <span class="ro-sum-label" style="color:#92400e;font-weight:700">待核销余额</span>
              <span style="color:#d97706;font-size:17px;font-weight:800">¥{{ fmt(prepayBalance) }}</span>
            </div>
            <!-- 核销明细：按客户展示已核销合同 -->
            <div v-if="prepayVerifyRows.length > 0" style="margin-top:10px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a16207;margin-bottom:6px">
                核销明细
              </div>
              <div v-for="item in prepayVerifyRows" :key="item.customer_id" class="ro-prepay-verify-row">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:12px;font-weight:600;color:#92400e">{{ item.customer_name }}</span>
                  <span style="font-size:12px;color:#d97706;font-weight:600">−¥{{ fmt(item.used_amount) }}</span>
                </div>
                <div v-for="c in item.contracts" :key="c.id"
                     class="ro-prepay-contract-row"
                     @click="$router.push('/sale/contract')">
                  <span style="font-size:11px;color:#1d1d1f;flex:1">{{ c.order_sn || c.customer_name || '-' }}</span>
                  <span style="font-size:11px;color:rgba(29,29,31,0.4)">{{ fmtDt(c.sign_date || c.created_at) }}</span>
                  <span style="font-size:11px;color:#0071e3;font-weight:600">¥{{ fmt(c.total_amount||0) }}</span>
                </div>
                <div v-if="item.contracts.length === 0" style="font-size:11px;color:rgba(29,29,31,0.35);padding:2px 0">
                  暂无关联合同
                </div>
              </div>
            </div>
            <div style="font-size:11px;color:#a16207;margin-top:8px;display:flex;align-items:center;gap:4px;cursor:pointer"
                 @click="$router.push('/finance/prepay')">
              <span>{{ prepayList.length }} 笔预收款 · 点击查看完整明细 →</span>
            </div>
          </div>

          <!-- 库存总值 -->
          <div class="ro-sum-block" style="margin-top:16px">
            <div class="ro-sum-row ro-kpi-clickable" style="cursor:pointer" @click="$router.push('/warehouse/stock')">
              <span class="ro-sum-label">库存总值</span>
              <span style="color:#ca8a04;font-weight:700">¥{{ fmt(stockTotal) }}</span>
            </div>
            <div class="ro-sum-row ro-kpi-clickable" style="cursor:pointer" @click="$router.push('/warehouse/stock')">
              <span class="ro-sum-label">库存SKU数</span>
              <span style="color:#ca8a04;font-weight:600">{{ stockRows.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品利润明细（从合同+零售明细中解析） -->
    <div class="ro-chart-card">
      <div class="ro-card-header">
        <div class="ro-card-title">商品销售利润明细 <span class="ro-card-hint">（有BOM → BOM物料成本；无BOM → 商品采购价）</span></div>
        <router-link to="/reports/profit" class="ro-link">完整报表 →</router-link>
      </div>
      <div v-if="goodsProfitRows.length === 0 && !loading" class="ro-empty">暂无商品销售数据</div>
      <el-table v-else :data="goodsProfitRows" size="small" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column prop="goods_name" label="商品" min-width="130" show-overflow-tooltip />
        <el-table-column label="销售数量" align="right" width="80">
          <template #default="{ row }">{{ row.num }}</template>
        </el-table-column>
        <el-table-column label="销售额" align="right" width="100">
          <template #default="{ row }">
            <span style="color:#0071e3">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成本" align="right" width="110">
          <template #default="{ row }">
            <el-tooltip :content="row.has_bom ? 'BOM物料成本' : '商品采购价'" placement="top">
              <span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="毛利润" align="right" width="100" sortable prop="profit">
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
      </el-table>
    </div>

    <!-- 底部: 零售/销售/采购供应商 -->
    <div class="ro-charts-row">
      <div class="ro-chart-card" style="flex:1;min-width:0;overflow:hidden">
        <div class="ro-card-header">
          <div class="ro-card-title">零售客户排行</div>
          <router-link to="/retail/order" class="ro-link">查看零售 →</router-link>
        </div>
        <div v-if="retailCustomerRows.length === 0 && !loading" class="ro-empty">暂无零售数据</div>
        <div v-else class="ro-sale-list">
          <div v-for="row in retailCustomerRows.slice(0, 8)" :key="row.customer_name" class="ro-sale-row">
            <span class="ro-sale-name">{{ row.customer_name || '散客' }}</span>
            <div class="ro-sale-bar-wrap">
              <div class="ro-sale-bar" style="background:linear-gradient(to right,#0071e3,#34aadc)"
                   :style="{ width: getBarWidth(retailCustomerRows, row.amount, 'amount') }" />
            </div>
            <span class="ro-sale-amt" style="color:#0071e3">¥{{ fmt(row.amount) }}</span>
          </div>
        </div>
      </div>

      <div class="ro-chart-card" style="flex:1;min-width:0;overflow:hidden">
        <div class="ro-card-header">
          <div class="ro-card-title">销售合同客户排行</div>
          <router-link to="/sale/contract" class="ro-link">查看销售 →</router-link>
        </div>
        <div v-if="saleCustomerRows.length === 0 && !loading" class="ro-empty">暂无销售数据</div>
        <div v-else class="ro-sale-list">
          <div v-for="row in saleCustomerRows.slice(0, 8)" :key="row.customer_name" class="ro-sale-row">
            <span class="ro-sale-name">{{ row.customer_name || '—' }}</span>
            <div class="ro-sale-bar-wrap">
              <div class="ro-sale-bar" style="background:linear-gradient(to right,#30d158,#34c759)"
                   :style="{ width: getBarWidth(saleCustomerRows, row.amount, 'amount') }" />
            </div>
            <span class="ro-sale-amt" style="color:#30d158">¥{{ fmt(row.amount) }}</span>
          </div>
        </div>
      </div>

      <div class="ro-chart-card" style="flex:1;min-width:0;overflow:hidden">
        <div class="ro-card-header">
          <div class="ro-card-title">供应商采购排行</div>
          <router-link to="/procure/order" class="ro-link">查看采购 →</router-link>
        </div>
        <div v-if="supplierRows.length === 0 && !loading" class="ro-empty">暂无采购数据</div>
        <div v-else class="ro-sale-list">
          <div v-for="row in supplierRows.slice(0, 8)" :key="row.supplier_name" class="ro-sale-row">
            <span class="ro-sale-name">{{ row.supplier_name || '无供应商' }}</span>
            <div class="ro-sale-bar-wrap">
              <div class="ro-sale-bar" style="background:linear-gradient(to right,#7c3aed,#a78bfa)"
                   :style="{ width: getBarWidth(supplierRows, row.amount, 'amount') }" />
            </div>
            <span class="ro-sale-amt" style="color:#7c3aed">¥{{ fmt(row.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { Refresh, Money, ShoppingCart, TrendCharts, Shop } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { useStockRefreshStore } from '@/stores/stockRefresh'
const stockRefreshStore = useStockRefreshStore()
watch(() => stockRefreshStore.version, () => loadAll())
import { getStockReportList } from '@/api/reports'
import { getContractList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getProcureOrderList } from '@/api/procure'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'
import { buildCustomerPrepayBreakdown } from '@/utils/prepay'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)

const saleContracts = ref<any[]>([])
const retailOrders = ref<any[]>([])
const procureOrders = ref<any[]>([])
const stockRows = ref<any[]>([])
const goodsList = ref<any[]>([])
const bomList = ref<any[]>([])
const expenseList = ref<any[]>([])
const prepayList = ref<any[]>([])
const collectReceipts = ref<any[]>([])
const supplierList = ref<any[]>([])

// --- Totals from raw orders ---
const saleTotal = computed(() =>
  saleContracts.value.reduce((s, r) => s + Number(r.total_amount || 0), 0)
)
const retailTotal = computed(() =>
  retailOrders.value.reduce((s, r) => s + Number(r.pay_amount || r.total_amount || 0), 0)
)
const procureTotal = computed(() =>
  procureOrders.value.reduce((s, r) => s + Number(r.total_amount || 0), 0)
)
const stockTotal = computed(() =>
  stockRows.value.reduce((s, r) => s + Number(r.qty || 0) * Number(r.avg_price || 0), 0)
)

// goods_id -> cost_price from goods master
const goodsCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of goodsList.value) m[g.id] = Number(g.cost_price || 0)
  return m
})

// goods_id set that has BOM (for label only)
const hasBomSet = computed(() => {
  const s = new Set<number>()
  for (const b of bomList.value) { if (b.goods_id) s.add(b.goods_id) }
  return s
})

// Cost = goods master cost_price (already set by user to reflect actual unit cost)
function getUnitCost(goodsId: number): number {
  return goodsCostMap.value[goodsId] || 0
}

// --- Freight: our share from contracts ---
// freight_bearer: 'buyer'(客户全付) | 'seller'(我们全付) | 'half'(各半) | 'free'(免运费)
function myFreight(row: any): number {
  const f = Number(row.freight_amount || 0)
  if (!f) return 0
  const b = row.freight_bearer
  if (b === 'seller') return f
  if (b === 'half') return f / 2
  return 0  // buyer pays or free
}
const freightRows = computed(() => saleContracts.value.filter(r => myFreight(r) > 0))
const freightTotal = computed(() => saleContracts.value.reduce((s, r) => s + myFreight(r), 0))
function freightLabel(row: any): string {
  const b = row.freight_bearer
  if (b === 'seller') return '我方全付'
  if (b === 'half') return '各承担一半'
  return ''
}

// --- Expense total ---
const expenseTotal = computed(() => expenseList.value.reduce((s, r) => s + Number(r.amount || 0), 0))

// --- Net profit = gross - freight - expense ---
const netProfit = computed(() => grossProfit.value - freightTotal.value - expenseTotal.value)
const netMargin = computed(() => {
  const income = saleTotal.value + retailTotal.value
  return income > 0 ? (netProfit.value / income * 100) : 0
})

const prepayBreakdown = computed(() => buildCustomerPrepayBreakdown(prepayList.value, collectReceipts.value))
const prepayCustomerStats = computed(() => prepayBreakdown.value.customerStats)
const prepayTotalAmount = computed(() =>
  prepayCustomerStats.value.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
)
const prepayUsedAmount = computed(() =>
  prepayCustomerStats.value.reduce((sum, item) => sum + Number(item.used_amount || 0), 0)
)
const prepayBalance = computed(() =>
  prepayCustomerStats.value.reduce((sum, item) => sum + Number(item.balance || 0), 0)
)

function normalizeName(value: any): string {
  return String(value ?? '').trim().toLowerCase()
}

// Build verify rows: per-customer view of which contracts were paid via prepay (核销)
// CollectReceipt records with "预付款核销" in remark → keyed by customer_id
const prepayVerifyRows = computed(() => {
  return prepayCustomerStats.value
    .filter(item => Number(item.used_amount || 0) > 0)
    .map(item => {
      const contracts = saleContracts.value.filter(c => {
        if (item.customer_id) return Number(c.customer_id) === Number(item.customer_id)
        return normalizeName(c.customer_name) === normalizeName(item.customer_name)
      })
      return {
        customer_id: item.customer_id || 0,
        customer_name: item.customer_name,
        used_amount: Number(item.used_amount || 0),
        contracts,
      }
    })
    .sort((a, b) => b.used_amount - a.used_amount)
})

// grossProfit now uses BOM/cost_price based unit cost
const grossProfit = computed(() => {
  // income - cost of goods sold
  let cogs = 0
  const addCogs = (goodsInfo: string | null) => {
    if (!goodsInfo) return
    try {
      for (const g of JSON.parse(goodsInfo)) {
        cogs += Number(g.num || 0) * getUnitCost(g.goods_id)
      }
    } catch {}
  }
  for (const c of saleContracts.value) addCogs(c.goods_info)
  for (const r of retailOrders.value) addCogs(r.goods_info)
  return saleTotal.value + retailTotal.value - cogs
})
const grossMargin = computed(() => {
  const income = saleTotal.value + retailTotal.value
  return income > 0 ? (grossProfit.value / income * 100) : 0
})

// --- Supplier aggregation from raw purchase orders ---
function getProcureSupplierLabel(row: any): string {
  try {
    const items = typeof row.goods_info === 'string' ? JSON.parse(row.goods_info) : (row.goods_info || [])
    const ids = [...new Set(items.map((i: any) => Number(i.supplier_id)).filter(Boolean))]
    if (ids.length > 1) return '多供应商'
    if (ids.length === 1) {
      const item = items.find((i: any) => i.supplier_id)
      return item?.supplier_name || supplierList.value.find((s: any) => s.id === ids[0])?.name || row.supplier_name || '—'
    }
  } catch {}
  return row.supplier_name || supplierList.value.find((s: any) => s.id === row.supplier_id)?.name || '—'
}

const supplierRows = computed(() => {
  const map: Record<string, number> = {}
  for (const o of procureOrders.value) {
    const k = getProcureSupplierLabel(o)
    map[k] = (map[k] || 0) + Number(o.total_amount || 0)
  }
  return Object.entries(map)
    .map(([supplier_name, amount]) => ({ supplier_name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

const retailCustomerRows = computed(() => {
  const map: Record<string, number> = {}
  for (const o of retailOrders.value) {
    const k = o.customer_name || '散客'
    map[k] = (map[k] || 0) + Number(o.pay_amount || o.total_amount || 0)
  }
  return Object.entries(map)
    .map(([customer_name, amount]) => ({ customer_name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

const saleCustomerRows = computed(() => {
  const map: Record<string, number> = {}
  for (const o of saleContracts.value) {
    const k = o.customer_name || '—'
    map[k] = (map[k] || 0) + Number(o.total_amount || 0)
  }
  return Object.entries(map)
    .map(([customer_name, amount]) => ({ customer_name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

// --- Goods profit using BOM/cost_price ---
const goodsProfitRows = computed(() => {
  const map: Record<string, { goods_name: string; num: number; sale_amount: number; cost_amount: number; has_bom: boolean }> = {}

  const add = (goodsInfo: string | null) => {
    if (!goodsInfo) return
    try {
      for (const g of JSON.parse(goodsInfo)) {
        const key = String(g.goods_id)
        const unitCost = getUnitCost(g.goods_id)
        const hasBom = hasBomSet.value.has(g.goods_id)
        if (!map[key]) map[key] = { goods_name: g.goods_name || '-', num: 0, sale_amount: 0, cost_amount: 0, has_bom: hasBom }
        const qty = Number(g.num || 0)
        map[key].num += qty
        map[key].sale_amount += qty * Number(g.price || 0)
        map[key].cost_amount += qty * unitCost
      }
    } catch {}
  }

  for (const c of saleContracts.value) add(c.goods_info)
  for (const r of retailOrders.value) add(r.goods_info)

  return Object.values(map)
    .map(r => ({
      ...r,
      profit: r.sale_amount - r.cost_amount,
      profit_rate: r.sale_amount > 0 ? ((r.sale_amount - r.cost_amount) / r.sale_amount * 100) : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
})

function fmt(v: number | string): string {
  const n = Number(v)
  if (isNaN(n)) return '0.00'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getBarWidth(list: any[], val: number, _field: string): string {
  const max = Math.max(...list.map(r => r.amount), 1)
  return Math.max(4, val / max * 100).toFixed(1) + '%'
}

async function loadAll() {
  loading.value = true
  const params: any = { list_rows: 500 }
  if (dateRange.value) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }
  try {
    const receiptParams: any = { list_rows: 2000 }
    if (dateRange.value) {
      receiptParams.start_date = dateRange.value[0]
      receiptParams.end_date = dateRange.value[1]
    }

    const prepayParams: any = { list_rows: 500, pay_type: 'customer' }
    if (dateRange.value) {
      prepayParams.start_date = dateRange.value[0]
      prepayParams.end_date = dateRange.value[1]
    }

    const [contracts, retail, procure, stock, goods, bom, expense, prepay, receipts] = await Promise.allSettled([
      getContractList(params),
      getRetailOrderList(params),
      getProcureOrderList(params),
      getStockReportList({ list_rows: 500 }),
      getGoodsList({ list_rows: 500 }),
      getBomList({ list_rows: 500 }),
      getExpenseList({ ...params }),
      http.get('/finance/Prepay/index', { params: prepayParams }),
      http.get('/finance/CollectReceipt/index', { params: receiptParams }),
    ])
    saleContracts.value = contracts.status === 'fulfilled'
      ? (contracts.value?.data?.rows ?? contracts.value?.data?.data ?? []).filter(isEffectiveSaleContract) : []
    retailOrders.value = retail.status === 'fulfilled'
      ? (retail.value?.data?.rows ?? retail.value?.data?.data ?? []).filter((r: any) => Number(r.status) === 1) : []
    procureOrders.value = procure.status === 'fulfilled'
      ? (procure.value?.data?.rows ?? procure.value?.data?.data ?? []).filter((r: any) => Number(r.status) === 1) : []
    stockRows.value = stock.status === 'fulfilled'
      ? (stock.value?.data?.rows ?? []) : []
    goodsList.value = goods.status === 'fulfilled'
      ? (goods.value?.data?.rows ?? []) : []
    bomList.value = bom.status === 'fulfilled'
      ? (bom.value?.data?.rows ?? []) : []
    expenseList.value = expense.status === 'fulfilled'
      ? (expense.value?.data?.rows ?? []) : []
    prepayList.value = prepay.status === 'fulfilled'
      ? (prepay.value?.data?.rows ?? []) : []
    collectReceipts.value = receipts.status === 'fulfilled'
      ? (receipts.value?.data?.rows ?? []) : []
    const sup = await http.get('/procure/supplier/index', { params: { list_rows: 500 } }).catch(() => null)
    supplierList.value = sup?.data?.rows ?? []
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
onActivated(loadAll)
</script>

<style scoped>
.ro-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  background: #f5f6fa;
  overflow-x: hidden;
  box-sizing: border-box;
}
.ro-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.ro-badge {
  font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em;
  color:#0071e3; background:rgba(0,113,227,0.08); padding:3px 10px; border-radius:20px;
  display:inline-block; margin-bottom:6px;
}
.ro-title { font-size:22px; font-weight:700; color:#1d1d1f; margin:0 0 4px; }
.ro-sub { font-size:13px; color:rgba(29,29,31,0.4); margin:0; }

.ro-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.ro-kpi-card {
  background:#fff; border-radius:16px; padding:20px; display:flex; align-items:center;
  gap:16px; border:1px solid #e8eaf0; box-shadow:0 2px 8px rgba(0,0,0,0.04);
}
.ro-kpi-clickable { cursor:pointer; transition:box-shadow 0.2s, transform 0.2s; }
.ro-kpi-clickable:hover { box-shadow:0 6px 24px rgba(0,0,0,0.10); transform:translateY(-2px); }
.ro-kpi-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ro-kpi-label { font-size:12px; color:rgba(29,29,31,0.4); margin-bottom:4px; }
.ro-kpi-value { font-size:20px; font-weight:700; letter-spacing:-0.03em; }
.ro-kpi-sub { font-size:11px; color:rgba(29,29,31,0.3); margin-top:2px; }

.ro-charts-row { display:flex; gap:16px; flex-wrap:wrap; }
.ro-chart-card {
  background:#fff; border-radius:16px; padding:20px; border:1px solid #e8eaf0;
  box-shadow:0 2px 8px rgba(0,0,0,0.04);
}
.ro-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.ro-card-title { font-size:14px; font-weight:600; color:#1d1d1f; }
.ro-card-hint { font-size:12px; color:rgba(29,29,31,0.35); font-weight:400; margin-left:6px; }
.ro-link { font-size:12px; color:#0071e3; text-decoration:none; }
.ro-link:hover { text-decoration:underline; }
.ro-empty { text-align:center; color:#cbd5e1; padding:30px 0; font-size:13px; }
.ro-empty-sm { color:#cbd5e1; font-size:12px; padding:4px 0; }
.ro-more { font-size:11px; color:rgba(29,29,31,0.3); padding:3px 0; }

/* 利润核算 */
.ro-profit-body { display:flex; gap:0; align-items:flex-start; overflow:hidden; }
.ro-profit-col { flex:1; min-width:0; padding-right:20px; border-right:1px solid #f0f0f5; margin-right:20px; overflow:hidden; }
.ro-profit-col:last-child { border-right:none; margin-right:0; }
.ro-summary-col { width:230px; flex-shrink:0; }

.ro-col-header {
  display:flex; justify-content:space-between; align-items:center;
  padding:8px 12px; border-radius:8px; margin-bottom:12px; font-size:13px; font-weight:700;
}
.ro-col-header.blue { background:rgba(0,113,227,0.06); color:#0071e3; }
.ro-col-header.purple { background:rgba(124,58,237,0.06); color:#7c3aed; }

.ro-section-label {
  font-size:11px; font-weight:600; color:rgba(29,29,31,0.4); text-transform:uppercase;
  letter-spacing:0.08em; margin-bottom:6px;
}
.ro-detail-row { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid #fafafa; }
.ro-dr-name { font-size:12px; color:#1d1d1f; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ro-dr-date { font-size:11px; color:rgba(29,29,31,0.3); flex-shrink:0; }
.ro-dr-amt { font-size:12px; font-weight:600; flex-shrink:0; }
.blue { color:#0071e3; }
.green { color:#10b981; }
.red { color:#dc2626; }

.ro-sum-block { background:#f8fafc; border-radius:12px; padding:16px; }
.ro-prepay-block { background:#fffbeb !important; border:1px solid #fde68a; }
.ro-sum-row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; }
.ro-sum-total { border-top:1px solid #e8eaf0; padding-top:10px; margin-top:4px; }
.ro-sum-label { font-size:13px; color:rgba(29,29,31,0.5); }
.ro-sum-divider { height:1px; background:#e8eaf0; margin:4px 0; }

.ro-sale-list { display:flex; flex-direction:column; gap:10px; }
.ro-sale-row { display:flex; align-items:center; gap:10px; }
.ro-sale-name { font-size:12px; color:#1d1d1f; width:90px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ro-sale-bar-wrap { flex:1; background:#f5f5f7; border-radius:4px; height:6px; }
.ro-sale-bar { height:6px; border-radius:4px; background:linear-gradient(to right,#0071e3,#60a5fa); min-width:4px; transition:width 0.5s cubic-bezier(0.23,1,0.32,1); }
.ro-sale-amt { font-size:12px; font-weight:600; color:#0071e3; width:80px; text-align:right; flex-shrink:0; }

.ro-prepay-verify-row {
  background: rgba(254,243,199,0.5);
  border-radius: 8px;
  padding: 6px 8px;
  margin-bottom: 6px;
}
.ro-prepay-contract-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0 3px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.ro-prepay-contract-row:hover { background: rgba(0,113,227,0.06); }

.ro-sum-hint { font-size:11px; color:rgba(29,29,31,0.4); }
.ro-col-header-summary { background:#f8fafc; color:#1d1d1f; }

@media (max-width:1200px) {
  .ro-kpi-grid { grid-template-columns:repeat(2,1fr); }
  .ro-profit-body { flex-direction:column; gap:16px; }
  .ro-profit-col { padding-right:0; border-right:none; margin-right:0; border-bottom:1px solid #f0f0f5; padding-bottom:16px; }
  .ro-summary-col { width:100%; }
}
</style>
