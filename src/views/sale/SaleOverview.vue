<template>
  <div class="page-container">
    <!-- 顶部：一键销售 + 快捷操作 -->
    <div class="sale-quick-grid">
      <div class="quick-card quick-card-main" @click="openQuickSale">
        <el-icon :size="28"><ShoppingCart /></el-icon>
        <div class="quick-card-text">
          <div class="quick-card-title">一键销售</div>
          <div class="quick-card-sub">选客户 → 选商品 → 自动生成合同+出库</div>
        </div>
      </div>
      <div class="quick-card quick-card-blue" @click="router.push('/sale/offer')">
        <el-icon :size="20"><Document /></el-icon>
        <span>新增报价</span>
      </div>
      <div class="quick-card quick-card-green" @click="router.push('/sale/contract')">
        <el-icon :size="20"><DocumentChecked /></el-icon>
        <span>新增合同</span>
      </div>
      <div class="quick-card quick-card-orange" @click="router.push('/sale/out')">
        <el-icon :size="20"><Box /></el-icon>
        <span>新增出库</span>
      </div>
      <div class="quick-card quick-card-cyan" @click="router.push('/sale/sample')">
        <el-icon :size="20"><Plus /></el-icon>
        <span>样品单</span>
      </div>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <div class="kpi-period-switch">
        <span
          v-for="p in periods" :key="p.key"
          :class="['period-tag', { active: activePeriod === p.key }]"
          @click="activePeriod = p.key"
        >{{ p.label }}</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}销售额</div>
        <div class="kpi-val blue">¥{{ fmt(kpi.sale) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}成本</div>
        <div class="kpi-val purple">¥{{ fmt(kpi.cost) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}毛利润</div>
        <div class="kpi-val" :style="{ color: kpi.profit >= 0 ? '#16a34a' : '#dc2626' }">
          {{ kpi.profit >= 0 ? '+' : '' }}¥{{ fmt(kpi.profit) }}
        </div>
        <div class="kpi-sub">毛利率 {{ kpi.sale > 0 ? (kpi.profit / kpi.sale * 100).toFixed(1) : '0.0' }}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}净利润</div>
        <div class="kpi-val" :style="{ color: kpi.netProfit >= 0 ? '#0071e3' : '#dc2626' }">
          {{ kpi.netProfit >= 0 ? '+' : '' }}¥{{ fmt(kpi.netProfit) }}
        </div>
        <div class="kpi-sub">扣运费 ¥{{ fmt(kpi.sellerFreight) }}</div>
      </div>
      <div class="kpi-divider"></div>
      <div class="kpi-card">
        <div class="kpi-label">待审核</div>
        <div class="kpi-val orange">{{ kpi.pendingCount }}</div>
        <div class="kpi-sub">报价{{ kpi.pendingOffer }} / 合同{{ kpi.pendingContract }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}客户</div>
        <div class="kpi-val blue">{{ kpi.customers }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}订单</div>
        <div class="kpi-val blue">{{ kpi.orders }}</div>
      </div>
    </div>

    <!-- Tab 数据表格 -->
    <el-card style="margin-top:14px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="最近合同" name="contract">
          <el-table :data="contractRows" style="width:100%" size="small" max-height="400">
            <el-table-column label="单号" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ getContractSn(row) }}</template>
            </el-table-column>
            <el-table-column prop="customer_name" label="客户" min-width="120" show-overflow-tooltip />
            <el-table-column label="金额" align="right" width="100">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:600">¥{{ fmt(Number(row.after_discount || row.total_amount || 0)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="日期" width="100">
              <template #default="{ row }">{{ fmtDt(getContractDate(row)) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status == 1 ? 'success' : row.status == 2 ? 'danger' : row.status == 4 ? 'warning' : 'info'" size="small">
                  {{ row.status == 1 ? '已审核' : row.status == 2 ? '已驳回' : row.status == 4 ? '✓ 已转单' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="140">
              <template #default="{ row }">
                <el-button v-if="row.status == 0" type="primary" link size="small" @click="quickAuditContract(row)">审核</el-button>
                <el-button v-if="row.status == 1" type="success" link size="small" @click="quickConvertToOut(row)">转出库</el-button>
                <el-button link size="small" @click="router.push('/sale/contract')">查看</el-button>
              </template>
            </el-table-column>
            <template #empty><div style="padding:20px 0;color:#aaa">暂无合同</div></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="最近报价" name="offer">
          <el-table :data="offerRows" style="width:100%" size="small" max-height="400">
            <el-table-column label="单号" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ getOfferSn(row) }}</template>
            </el-table-column>
            <el-table-column prop="customer_name" label="客户" min-width="120" show-overflow-tooltip />
            <el-table-column label="金额" align="right" width="100">
              <template #default="{ row }">
                <span style="color:#0071e3">¥{{ fmt(Number(row.after_offer) || Number(row.total_amount) || 0) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="日期" width="100">
              <template #default="{ row }">{{ fmtDt(getOfferDate(row)) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status == 1 ? 'success' : row.status == 2 ? 'danger' : row.status == 4 ? 'warning' : 'info'" size="small">
                  {{ row.status == 1 ? '已审核' : row.status == 2 ? '已驳回' : row.status == 4 ? '已转单' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120">
              <template #default="{ row }">
                <el-button v-if="row.status == 1" type="primary" link size="small" @click="quickOfferToContract(row)">转合同</el-button>
                <el-button link size="small" @click="router.push('/sale/offer')">查看</el-button>
              </template>
            </el-table-column>
            <template #empty><div style="padding:20px 0;color:#aaa">暂无报价</div></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="最近出库" name="saleout">
          <el-table :data="saleOutRows" style="width:100%" size="small" max-height="400">
            <el-table-column label="单号" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ getSaleOutSn(row) }}</template>
            </el-table-column>
            <el-table-column prop="customer_name" label="客户" min-width="120" show-overflow-tooltip />
            <el-table-column label="金额" align="right" width="100">
              <template #default="{ row }">
                <span style="color:#0071e3">¥{{ fmt(Number(row.after_discount) || Number(row.total_amount) || 0) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="日期" width="100">
              <template #default="{ row }">{{ fmtDt(getSaleOutDate(row)) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status == 1 ? 'success' : 'warning'" size="small">
                  {{ row.status == 1 ? '已审核' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <template #empty><div style="padding:20px 0;color:#aaa">暂无出库单</div></template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 一键销售弹窗 -->
    <el-dialog v-model="qsVisible" title="一键销售" width="720px" destroy-on-close>
      <el-form label-width="80px" :disabled="qsSubmitting">
        <el-form-item label="客户">
          <el-select v-model="qs.customer_id" filterable placeholder="选择客户" style="width:100%" @change="onQsCustomerChange">
            <el-option v-for="c in customerList" :key="c.id" :label="c.customer_name || c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="qs.warehouse_id" filterable placeholder="选择仓库" style="width:100%" @change="onQsWarehouseChange">
            <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品">
          <el-button type="primary" size="small" :icon="Plus" @click="qsGoodsRef?.open()">选择商品</el-button>
        </el-form-item>
        <el-table v-if="qs.items.length" :data="qs.items" size="small" style="margin-bottom:12px" border>
          <el-table-column prop="goods_name" label="商品" min-width="140" show-overflow-tooltip />
          <el-table-column prop="spec" label="规格" width="80" />
          <el-table-column prop="unit_name" label="单位" width="60" />
          <el-table-column label="数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.num" :min="1" size="small" style="width:80px" @change="calcQsTotal" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" size="small" style="width:90px" @change="calcQsTotal" />
            </template>
          </el-table-column>
          <el-table-column label="小计" align="right" width="90">
            <template #default="{ row }">¥{{ (row.num * row.price).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="" width="50">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="qs.items.splice($index, 1); calcQsTotal()">删</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="display:flex;gap:16px;margin-bottom:12px">
          <el-form-item label="优惠" style="flex:1;margin-bottom:0">
            <el-input-number v-model="qs.discount" :min="0" :precision="2" size="default" style="width:100%" placeholder="优惠金额" @change="calcQsTotal" />
          </el-form-item>
          <el-form-item label="运费" style="flex:1;margin-bottom:0">
            <div style="display:flex;gap:8px;align-items:center;width:100%">
              <el-input-number v-model="qs.freight" :min="0" :precision="2" size="default" style="flex:1" placeholder="运费" @change="calcQsTotal" />
              <el-select v-model="qs.freightPayer" size="default" style="width:100px" @change="calcQsTotal">
                <el-option label="对方承担" value="buyer" />
                <el-option label="我方承担" value="seller" />
              </el-select>
            </div>
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="qs.remark" placeholder="选填" />
        </el-form-item>
        <div class="qs-total">
          <div v-if="qs.discount > 0 || qs.freight > 0" style="font-size:13px;color:#999;margin-bottom:4px">
            商品合计：¥{{ fmt(qs.goodsTotal) }}
            <span v-if="qs.discount > 0" style="margin-left:12px">优惠：-¥{{ fmt(qs.discount) }}</span>
            <span v-if="qs.freight > 0" style="margin-left:12px">运费：+¥{{ fmt(qs.freight) }}（{{ qs.freightPayer === 'seller' ? '我方承担' : '对方承担' }}）</span>
          </div>
          合计：<span style="color:#0071e3;font-size:18px;font-weight:700">¥{{ fmt(qs.total) }}</span>
        </div>
        <el-divider style="margin:12px 0" />
        <div style="font-weight:600;margin-bottom:8px">本次收款</div>
        <div style="display:flex;gap:16px;margin-bottom:8px">
          <el-form-item label="收款金额" style="flex:1;margin-bottom:0">
            <el-input-number v-model="qs.collectAmount" :min="0" :max="qs.total" :precision="2" size="default" style="width:100%" @change="calcQsOwed" />
          </el-form-item>
          <el-form-item label="收款账户" style="flex:1;margin-bottom:0">
            <el-select v-model="qs.fundId" filterable placeholder="选择账户" style="width:100%" @change="onQsFundChange">
              <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
          </el-form-item>
        </div>
        <div style="display:flex;justify-content:flex-end;font-size:13px;color:#999">
          <span v-if="qs.owed > 0" style="color:#e6a23c">本次欠款：¥{{ fmt(qs.owed) }}</span>
          <span v-else style="color:#67c23a">全额收款</span>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="qsVisible = false">取消</el-button>
        <el-button type="primary" :loading="qsSubmitting" @click="submitQuickSale">
          确认生成（合同+出库）
        </el-button>
      </template>
    </el-dialog>

    <GoodsSelect ref="qsGoodsRef" @confirm="onQsGoodsConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fmtDt } from '@/utils/date'
import { ShoppingCart, Document, DocumentChecked, Box, Plus } from '@element-plus/icons-vue'
import {
  getOfferList, getContractList, getSaleOutList,
  createContract, auditContract, auditContractSilent, createSaleOut, auditSaleOutSilent,
} from '@/api/sale'
import { getGoodsList, getBomList } from '@/api/goods'
import { createCollectReceipt } from '@/api/finance'
import http from '@/api/http'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { stockEffect } from '@/utils/stockEffect'

const router = useRouter()

// ── 数据 ─────────────────────────────────────────────────────────────────────
const offerRows = ref<any[]>([])
const contractRows = ref<any[]>([])
const saleOutRows = ref<any[]>([])
const customerList = ref<any[]>([])
const warehouseList = ref<any[]>([])
const goodsList = ref<any[]>([])
const fundList = ref<any[]>([])
const inhouseList = ref<any[]>([])
const bomList = ref<any[]>([])
const activeTab = ref('contract')

// ── 合同单号解析 ──────────────────────────────────────────────────────────────
function getContractSn(row: any): string {
  const m = (row?.remark || '').match(/^\[NO:([^\]]+)\]/)
  if (m) return m[1]
  return String(row?.order_sn || row?.contract_no || (row?.id ? `HT${String(row.id).padStart(4, '0')}` : '')).trim()
}

// ── 报价单号解析 ──────────────────────────────────────────────────────────────
function getOfferSn(row: any): string {
  const m = (row?.remark || '').match(/^\[NO:([^\]]+)\]/)
  if (m) return m[1]
  return row?.offer_no || row?.order_sn || (row?.id ? `BJ${String(row.id).padStart(4, '0')}` : '')
}

// ── 出库单号解析 ──────────────────────────────────────────────────────────────
function getSaleOutSn(row: any): string {
  const m = (row?.remark || '').match(/^\[NO:([^\]]+)\]/)
  if (m) return m[1]
  return row?.order_sn || row?.order_no || (row?.id ? `CK${String(row.id).padStart(4, '0')}` : '')
}

function firstDate(...values: any[]): string {
  return String(values.find(v => v !== undefined && v !== null && String(v).trim()) || '')
}

function getContractDate(row: any): string {
  return firstDate(row?.sign_date, row?.contract_date, row?.order_date, row?.create_time, row?.created_at)
}

function getOfferDate(row: any): string {
  return firstDate(row?.offer_date, row?.order_date, row?.create_time, row?.created_at)
}

function getSaleOutDate(row: any): string {
  return firstDate(row?.out_date, row?.order_date, row?.create_time, row?.created_at)
}

// ── 成本计算 ──────────────────────────────────────────────────────────────────
const goodsCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of goodsList.value) {
    m[g.id] = Number(g.cost_price || g.purchase_price || g.avg_price || g.in_price || 0)
  }
  const snTC: Record<string, number> = {}, snTQ: Record<string, number> = {}
  for (const ih of inhouseList.value) {
    if (Number(ih.status) !== 1) continue
    try { for (const item of JSON.parse(ih.goods_info || '[]')) {
      const sn = item.goods_sn; if (!sn) continue
      const q = Number(item.num || 0), p = Number(item.price || 0)
      if (q > 0 && p > 0) { snTC[sn] = (snTC[sn] || 0) + q * p; snTQ[sn] = (snTQ[sn] || 0) + q }
    }} catch {}
  }
  const snAvg: Record<string, number> = {}
  for (const sn in snTQ) if (snTQ[sn] > 0) snAvg[sn] = snTC[sn] / snTQ[sn]
  const bomMap: Record<number, { sn: string; num: number }[]> = {}
  for (const b of bomList.value) { const gid = Number(b.goods_id || 0); if (!gid) continue; if (!bomMap[gid]) bomMap[gid] = []; bomMap[gid].push({ sn: b.material_sn || '', num: Number(b.num || 0) }) }
  for (const gid in bomMap) { const g = goodsList.value.find(x => x.id === Number(gid)); if (!g?.goods_sn) continue; let bc = 0; for (const mt of bomMap[Number(gid)]) bc += mt.num * (snAvg[mt.sn] || 0); if (bc > 0) { snTC[g.goods_sn] = bc; snTQ[g.goods_sn] = 1 } }
  for (const g of goodsList.value) { const sn = g.goods_sn; if (sn && snTQ[sn] > 0) m[g.id] = snTC[sn] / snTQ[sn] }
  return m
})

const goodsCostBySn = computed(() => {
  const m: Record<string, number> = {}
  for (const g of goodsList.value) {
    const sn = String(g.goods_sn || '')
    if (!sn) continue
    const c = Number(goodsCostMap.value[g.id] || g.cost_price || g.purchase_price || g.avg_price || g.in_price || 0)
    if (c > 0) m[sn] = c
  }
  return m
})

// ── 时间维度切换 ──────────────────────────────────────────────────────────────
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
  const y = now.getFullYear(), m = now.getMonth() // 0-indexed
  const prefix = dateStr?.slice(0, 10) || ''
  if (!prefix) return false
  if (activePeriod.value === 'month') return prefix.slice(0, 7) === `${y}-${String(m + 1).padStart(2, '0')}`
  if (activePeriod.value === 'year') return prefix.startsWith(String(y))
  // quarter
  const qStart = Math.floor(m / 3) * 3 // 0,3,6,9
  const from = `${y}-${String(qStart + 1).padStart(2, '0')}-01`
  const toMonth = qStart + 3
  const to = toMonth > 11
    ? `${y + 1}-01-01`
    : `${y}-${String(toMonth + 1).padStart(2, '0')}-01`
  return prefix >= from && prefix < to
}

// ── KPI ───────────────────────────────────────────────────────────────────────
const kpi = computed(() => {
  let sale = 0, cost = 0, sellerFreight = 0
  const customerSet = new Set<number>()
  let orders = 0

  for (const c of contractRows.value) {
    const d = getContractDate(c)
    if (inPeriod(d)) {
      sale += Number(c.after_discount || c.total_amount || 0)
      try {
        for (const g of JSON.parse(c.goods_info || '[]')) {
          const qty = Number(g.num || 0)
          const unitCost = Number(
            g.cost_price ||
            g.cost ||
            g.purchase_price ||
            g.in_price ||
            g.avg_price ||
            goodsCostMap.value[g.goods_id] ||
            goodsCostBySn.value[g.goods_sn] ||
            0
          )
          cost += qty * unitCost
        }
      } catch {}
      if (c.freight_bearer === 'seller') sellerFreight += Number(c.freight_amount || 0)
      if (c.customer_id) customerSet.add(c.customer_id)
      orders++
    }
  }

  const pendingOffer = offerRows.value.filter(r => Number(r.status) === 0).length
  const pendingContract = contractRows.value.filter(r => Number(r.status) === 0).length
  const grossProfit = sale - cost
  const netProfit = grossProfit - sellerFreight

  return {
    sale, cost,
    profit: grossProfit,
    netProfit,
    sellerFreight,
    pendingCount: pendingOffer + pendingContract,
    pendingOffer, pendingContract,
    customers: customerSet.size,
    orders,
  }
})

// ── 快捷操作 ──────────────────────────────────────────────────────────────────
async function quickAuditContract(row: any) {
  await ElMessageBox.confirm(`确定审核通过合同「${getContractSn(row)}」？`, '审核', { type: 'warning' })
  await auditContract(row.id, 1)
  ElMessage.success('审核成功')
  loadData()
}

async function quickConvertToOut(row: any) {
  sessionStorage.setItem('saleout_from_contract', JSON.stringify({
    contract_id: row.id,
    contract_sn: row.order_sn || '',
    customer_id: row.customer_id,
    customer_name: row.customer_name || '',
    admin_name: row.admin_name || '',
    warehouse_id: row.warehouse_id || '',
    warehouse_name: row.warehouse_name || '',
    remark: row.remark || '',
    goods_info: row.goods_info || '[]',
    discount_type: row.discount_type || 'none',
    discount_value: row.discount_value || 0,
    total_amount: row.total_amount || 0,
  }))
  // 标记合同为"已转单"状态
  try {
    await http.post('/shop/ContractOrder/edit', { id: row.id, status: 4 })
  } catch { /* ignore */ }
  router.push('/sale/out')
}

function quickOfferToContract(row: any) {
  sessionStorage.setItem('sale_contract_draft_from_offer', JSON.stringify({
    source_offer_id: row.id,
    source_offer_no: row.order_sn || row.offer_no || '',
    customer_id: row.customer_id,
    customer_name: row.customer_name || '',
    admin_name: row.admin_name || '',
    goods_info: row.goods_info || '[]',
  }))
  router.push('/sale/contract?from=offer')
}

// ── 一键销售 ──────────────────────────────────────────────────────────────────
const qsVisible = ref(false)
const qsSubmitting = ref(false)
const qsGoodsRef = ref<InstanceType<typeof GoodsSelect>>()
const qs = reactive({
  customer_id: null as any,
  customer_name: '',
  warehouse_id: null as any,
  warehouse_name: '',
  items: [] as any[],
  remark: '',
  discount: 0,
  freight: 0,
  freightPayer: 'buyer' as 'buyer' | 'seller',
  goodsTotal: 0,
  total: 0,
  collectAmount: 0,
  fundId: null as any,
  fundName: '',
  owed: 0,
})

function openQuickSale() {
  qs.customer_id = null; qs.customer_name = ''
  qs.warehouse_id = null; qs.warehouse_name = ''
  qs.items = []; qs.remark = ''; qs.discount = 0; qs.freight = 0; qs.freightPayer = 'buyer'; qs.goodsTotal = 0; qs.total = 0; qs.collectAmount = 0; qs.fundId = null; qs.fundName = ''; qs.owed = 0
  qsVisible.value = true
}

function onQsCustomerChange(id: number) {
  const c = customerList.value.find(x => x.id === id)
  qs.customer_name = c?.customer_name || c?.name || ''
}

function onQsWarehouseChange(id: number) {
  const w = warehouseList.value.find(x => x.id === id)
  qs.warehouse_name = w?.name || ''
}

function onQsFundChange(id: number) {
  const f = fundList.value.find(x => x.id === id)
  qs.fundName = f?.name || ''
}

function calcQsOwed() {
  qs.owed = Math.max(0, qs.total - (qs.collectAmount || 0))
}

function onQsGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (qs.items.some(i => i.goods_id === g.id)) continue
    qs.items.push({
      goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      spec: g.spec || '', unit_name: g.unit_name || '',
      num: 1, price: Number(g.sell_price) || 0, cost_price: Number(g.cost_price) || 0,
    })
  }
  calcQsTotal()
}

function calcQsTotal() {
  qs.goodsTotal = qs.items.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
  const freightAdd = qs.freightPayer === 'buyer' ? (qs.freight || 0) : 0
  qs.total = qs.goodsTotal - (qs.discount || 0) + freightAdd
  if (qs.total < 0) qs.total = 0
  qs.collectAmount = qs.total
  calcQsOwed()
}

async function submitQuickSale() {
  if (!qs.customer_id) return ElMessage.warning('请选择客户')
  if (!qs.warehouse_id) return ElMessage.warning('请选择仓库')
  if (!qs.items.length) return ElMessage.warning('请选择商品')

  qsSubmitting.value = true
  try {
    const goodsInfo = JSON.stringify(qs.items.map(i => ({
      goods_id: i.goods_id, goods_name: i.goods_name, goods_sn: i.goods_sn,
      spec: i.spec, unit_name: i.unit_name,
      num: i.num, price: i.price, price_no_tax: i.price,
      tax_rate: 0, cost_price: i.cost_price, remark: '',
    })))
    const today = new Date().toISOString().slice(0, 10)

    // 1. 创建合同
    const contractRes = await createContract({
      customer_id: qs.customer_id,
      customer_name: qs.customer_name,
      admin_name: '',
      contract_date: today,
      sign_date: today,
      total_amount: qs.goodsTotal,
      discount_type: qs.discount > 0 ? 'amount' : 'none',
      discount_value: qs.discount || 0,
      after_discount: qs.total,
      freight_amount: qs.freight || 0,
      freight_bearer: qs.freightPayer,
      remark: qs.remark,
      goods_info: goodsInfo,
    })
    const contractId = contractRes?.data?.id || contractRes?.data?.lastId
    if (!contractId) throw new Error('合同创建失败')

    // 2. 审核合同
    await auditContractSilent(contractId, 1).catch(() => {})

    // 3. 创建出库单
    const saleOutRes = await createSaleOut({
      customer_id: qs.customer_id,
      customer_name: qs.customer_name,
      admin_name: '',
      out_date: today,
      warehouse_id: qs.warehouse_id,
      warehouse_name: qs.warehouse_name,
      total_amount: qs.goodsTotal,
      discount_amount: qs.discount || 0,
      after_discount: qs.total,
      freight_amount: qs.freight || 0,
      freight_bearer: qs.freightPayer,
      remark: qs.remark || '来自销售合同',
      goods_info: goodsInfo,
    })
    const saleOutId = saleOutRes?.data?.id || saleOutRes?.data?.lastId
    if (!saleOutId) throw new Error('出库单创建失败')

    // 4. 审核出库单
    await auditSaleOutSilent(saleOutId, 1).catch(() => {})

    // 4.5 标记合同为"已转单" + 设置合同编号（后端不自动生成 order_sn）
    const contractSn = `HT${String(contractId).padStart(4, '0')}`
    await http.post('/shop/ContractOrder/edit', { id: contractId, status: 4, order_sn: contractSn }).catch(() => {})

    // 5. 库存扣减
    try {
      await stockEffect(qs.items, 'deduct', qs.warehouse_id, '一键销售出库')
    } catch {}

    // 6. 收款单用 contractSn 关联（已在 step 4.5 设置）

    // 7. 创建收款单（后端不会自动生成，需前端主动创建）
    if (qs.collectAmount > 0) {
      await createCollectReceipt({
        contact_type: 'customer',
        customer_id: qs.customer_id,
        customer_name: qs.customer_name,
        contact_id: qs.customer_id,
        contact_name: qs.customer_name,
        amount: qs.collectAmount,
        fund_id: qs.fundId || 0,
        fund_name: qs.fundName || '',
        order_sn: contractSn,
        order_no: contractSn,
        receipt_date: today,
        remark: `一键销售收款 - ${contractSn}`,
      })
    }

    // 8. 我方承担运费 → 记入费用管理（remark 含合同编号，反审核时可匹配清理）
    if (qs.freight > 0 && qs.freightPayer === 'seller') {
      try {
        await http.post('/finance/Expense/add', {
          name: '销售运费',
          amount: qs.freight,
          expense_date: today,
          order_sn: contractSn,
          remark: `${qs.customer_name} 销售合同运费（我方承担） - ${contractSn}`,
        })
      } catch {}
    }

    const msg = qs.collectAmount > 0 && qs.fundId
      ? `一键销售完成！收款 ¥${qs.collectAmount.toFixed(2)}${qs.owed > 0 ? '，欠款 ¥' + qs.owed.toFixed(2) : ''}`
      : '一键销售完成！合同+出库单已生成并审核'
    ElMessage.success(msg)
    qsVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败，请重试')
  } finally {
    qsSubmitting.value = false
  }
}

// ── 工具 ──────────────────────────────────────────────────────────────────────
function fmt(v: number): string {
  return isNaN(v) ? '0.00' : v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── 加载 ──────────────────────────────────────────────────────────────────────
async function loadData() {
  const [c, o, s, cust, wh, g, ih, b, fd] = await Promise.allSettled([
    getContractList({ list_rows: 2000 }),
    getOfferList({ list_rows: 2000 }),
    getSaleOutList({ list_rows: 2000 }),
    http.get('/shop/ShopCustomer/index', { params: { list_rows: 500 } }),
    http.get('/stock/WarehouseName/index', { params: { list_rows: 100 } }),
    getGoodsList({ list_rows: 5000 }),
    http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
    getBomList({ list_rows: 5000 }),
    http.get('/finance/Fund/index', { params: { list_rows: 200 } }),
  ])
  contractRows.value = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []) : []
  offerRows.value = o.status === 'fulfilled' ? (o.value?.data?.rows ?? []) : []
  saleOutRows.value = s.status === 'fulfilled' ? (s.value?.data?.rows ?? []) : []
  customerList.value = cust.status === 'fulfilled' ? (cust.value?.data?.rows ?? []) : []
  warehouseList.value = wh.status === 'fulfilled' ? (wh.value?.data?.rows ?? []) : []
  goodsList.value = g.status === 'fulfilled' ? (g.value?.data?.rows ?? []) : []
  inhouseList.value = ih.status === 'fulfilled' ? (ih.value?.data?.rows ?? []).filter((r: any) => r.status === 1) : []
  bomList.value = b.status === 'fulfilled' ? (b.value?.data?.rows ?? []) : []
  fundList.value = fd.status === 'fulfilled' ? (fd.value?.data?.rows ?? []) : []
}

onMounted(loadData)
</script>

<style scoped>
.quick-card {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-radius: 12px; cursor: pointer;
  transition: all 0.2s; color: #fff; font-weight: 600; font-size: 14px;
}
.quick-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.quick-card-main { background: linear-gradient(135deg, #0071e3, #34c759); min-height: 72px; }
.quick-card-blue { background: #0071e3; justify-content: center; min-height: 72px; }
.quick-card-green { background: #16a34a; justify-content: center; min-height: 72px; }
.quick-card-orange { background: #f59e0b; justify-content: center; min-height: 72px; }
.quick-card-cyan { background: #06b6d4; justify-content: center; min-height: 72px; }

.sale-quick-grid {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) repeat(4, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 1400px) {
  .sale-quick-grid {
    grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(140px, 1fr));
  }
}

@media (max-width: 1100px) {
  .sale-quick-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.quick-card-text { display: flex; flex-direction: column; gap: 2px; }
.quick-card-title { font-size: 18px; font-weight: 700; }
.quick-card-sub { font-size: 12px; opacity: 0.85; font-weight: 400; }

.kpi-row {
  display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;
  padding: 16px 20px; background: #f8fafc; border-radius: 12px;
  position: relative;
}
.kpi-period-switch {
  position: absolute; top: 12px; right: 16px;
  display: flex; gap: 4px; background: #e8eaf0; border-radius: 6px; padding: 2px;
}
.period-tag {
  padding: 3px 10px; border-radius: 4px; font-size: 12px; color: #666;
  cursor: pointer; transition: all 0.2s; user-select: none;
}
.period-tag:hover { color: #333; }
.period-tag.active {
  background: #fff; color: #0071e3; font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.kpi-card { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
.kpi-label { font-size: 11px; color: rgba(29,29,31,0.4); }
.kpi-val { font-size: 18px; font-weight: 700; }
.kpi-sub { font-size: 11px; color: rgba(29,29,31,0.4); }
.kpi-divider { width: 1px; background: #e8eaf0; align-self: stretch; margin: 0 4px; }
.blue { color: #0071e3; }
.purple { color: #7c3aed; }
.orange { color: #f59e0b; }

.qs-total {
  text-align: right; padding: 8px 0; font-size: 14px; color: #666;
}
</style>
