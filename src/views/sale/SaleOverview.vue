<template>
  <div class="page-container">
    <!-- 顶部：一键销售 + 快捷操作 -->
    <el-row :gutter="14" style="margin-bottom:14px">
      <el-col :span="8">
        <div class="quick-card quick-card-main" @click="openQuickSale">
          <el-icon :size="28"><ShoppingCart /></el-icon>
          <div class="quick-card-text">
            <div class="quick-card-title">一键销售</div>
            <div class="quick-card-sub">选客户 → 选商品 → 自动生成合同+出库</div>
          </div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="quick-card quick-card-blue" @click="router.push('/sale/offer')">
          <el-icon :size="20"><Document /></el-icon>
          <span>新增报价</span>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="quick-card quick-card-green" @click="router.push('/sale/contract')">
          <el-icon :size="20"><DocumentChecked /></el-icon>
          <span>新增合同</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-card quick-card-orange" @click="router.push('/sale/out')">
          <el-icon :size="20"><Box /></el-icon>
          <span>新增出库</span>
        </div>
      </el-col>
    </el-row>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">本月销售额</div>
        <div class="kpi-val blue">¥{{ fmt(kpi.monthSale) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本月成本</div>
        <div class="kpi-val purple">¥{{ fmt(kpi.monthCost) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本月利润</div>
        <div class="kpi-val" :style="{ color: kpi.monthProfit >= 0 ? '#16a34a' : '#dc2626' }">
          {{ kpi.monthProfit >= 0 ? '+' : '' }}¥{{ fmt(kpi.monthProfit) }}
        </div>
        <div class="kpi-sub">利润率 {{ kpi.monthSale > 0 ? (kpi.monthProfit / kpi.monthSale * 100).toFixed(1) : '0.0' }}%</div>
      </div>
      <div class="kpi-divider"></div>
      <div class="kpi-card">
        <div class="kpi-label">待审核</div>
        <div class="kpi-val orange">{{ kpi.pendingCount }}</div>
        <div class="kpi-sub">报价{{ kpi.pendingOffer }} / 合同{{ kpi.pendingContract }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本月客户</div>
        <div class="kpi-val blue">{{ kpi.monthCustomers }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本月订单</div>
        <div class="kpi-val blue">{{ kpi.monthOrders }}</div>
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
              <template #default="{ row }">{{ (row.contract_date || row.create_time || '').slice(0, 10) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status == 1 ? 'success' : row.status == 2 ? 'danger' : 'warning'" size="small">
                  {{ row.status == 1 ? '已审核' : row.status == 2 ? '已驳回' : '待审核' }}
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
              <template #default="{ row }">{{ (row.offer_date || row.create_time || '').slice(0, 10) }}</template>
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
              <template #default="{ row }">{{ (row.out_date || row.create_time || '').slice(0, 10) }}</template>
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
        <el-form-item label="备注">
          <el-input v-model="qs.remark" placeholder="选填" />
        </el-form-item>
        <div class="qs-total">
          合计：<span style="color:#0071e3;font-size:18px;font-weight:700">¥{{ fmt(qs.total) }}</span>
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
import { ShoppingCart, Document, DocumentChecked, Box, Plus } from '@element-plus/icons-vue'
import {
  getOfferList, getContractList, getSaleOutList,
  createContract, auditContract, createSaleOut, auditSaleOut,
} from '@/api/sale'
import { getGoodsList, getBomList } from '@/api/goods'
import http from '@/api/http'
import GoodsSelect from '@/components/GoodsSelect.vue'

const router = useRouter()

// ── 数据 ─────────────────────────────────────────────────────────────────────
const offerRows = ref<any[]>([])
const contractRows = ref<any[]>([])
const saleOutRows = ref<any[]>([])
const customerList = ref<any[]>([])
const warehouseList = ref<any[]>([])
const goodsList = ref<any[]>([])
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

// ── 成本计算 ──────────────────────────────────────────────────────────────────
const goodsCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of goodsList.value) m[g.id] = Number(g.cost_price || 0)
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

// ── KPI ───────────────────────────────────────────────────────────────────────
const thisMonth = new Date().toISOString().slice(0, 7)

const kpi = computed(() => {
  let monthSale = 0, monthCost = 0
  const customerSet = new Set<number>()
  let monthOrders = 0

  for (const c of contractRows.value) {
    const m = (c.contract_date || c.create_time || '').slice(0, 7)
    if (m === thisMonth) {
      monthSale += Number(c.after_discount || c.total_amount || 0)
      try { for (const g of JSON.parse(c.goods_info || '[]')) monthCost += Number(g.num || 0) * (goodsCostMap.value[g.goods_id] || 0) } catch {}
      if (c.customer_id) customerSet.add(c.customer_id)
      monthOrders++
    }
  }

  const pendingOffer = offerRows.value.filter(r => Number(r.status) === 0).length
  const pendingContract = contractRows.value.filter(r => Number(r.status) === 0).length

  return {
    monthSale, monthCost,
    monthProfit: monthSale - monthCost,
    pendingCount: pendingOffer + pendingContract,
    pendingOffer, pendingContract,
    monthCustomers: customerSet.size,
    monthOrders,
  }
})

// ── 快捷操作 ──────────────────────────────────────────────────────────────────
async function quickAuditContract(row: any) {
  await ElMessageBox.confirm(`确定审核通过合同「${getContractSn(row)}」？`, '审核', { type: 'warning' })
  await auditContract(row.id, 1)
  ElMessage.success('审核成功')
  loadData()
}

function quickConvertToOut(row: any) {
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
  router.push('/sale/out')
}

function quickOfferToContract(row: any) {
  sessionStorage.setItem('sale_contract_draft_from_offer', JSON.stringify({
    offer_id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name || '',
    admin_name: row.admin_name || '',
    goods_info: row.goods_info || '[]',
  }))
  router.push('/sale/contract')
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
  total: 0,
})

function openQuickSale() {
  qs.customer_id = null; qs.customer_name = ''
  qs.warehouse_id = null; qs.warehouse_name = ''
  qs.items = []; qs.remark = ''; qs.total = 0
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
  qs.total = qs.items.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
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
      warehouse_id: qs.warehouse_id,
      warehouse_name: qs.warehouse_name,
      total_amount: qs.total,
      after_discount: qs.total,
      discount_type: 'none',
      discount_value: 0,
      remark: qs.remark,
      goods_info: goodsInfo,
    })
    const contractId = contractRes?.data?.id || contractRes?.data?.lastId
    if (!contractId) throw new Error('合同创建失败')

    // 2. 审核合同
    await auditContract(contractId, 1)

    // 3. 创建出库单
    const saleOutRes = await createSaleOut({
      customer_id: qs.customer_id,
      customer_name: qs.customer_name,
      admin_name: '',
      out_date: today,
      warehouse_id: qs.warehouse_id,
      warehouse_name: qs.warehouse_name,
      total_amount: qs.total,
      after_discount: qs.total,
      discount_type: 'none',
      discount_value: 0,
      contract_id: contractId,
      remark: `来自销售合同 `,
      goods_info: goodsInfo,
    })
    const saleOutId = saleOutRes?.data?.id || saleOutRes?.data?.lastId
    if (!saleOutId) throw new Error('出库单创建失败')

    // 4. 审核出库单（触发库存扣减）
    await auditSaleOut(saleOutId, 1)

    // 5. 库存扣减
    for (const item of qs.items) {
      if (!item.goods_id || !item.num) continue
      try {
        const stockRes = await http.get('/stock/StockAll/index', {
          params: { goods_id: item.goods_id, warehouse_id: qs.warehouse_id, list_rows: 10 }
        })
        const stock = (stockRes.data?.rows ?? [])[0]
        if (stock) {
          const newQty = Math.max(0, Number(stock.qty || 0) - Number(item.num))
          await http.post('/stock/StockAll/edit', { id: stock.id, qty: newQty })
        }
      } catch {}
    }

    ElMessage.success(`一键销售完成！合同+出库单已生成并审核`)
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
  const [c, o, s, cust, wh, g, ih, b] = await Promise.allSettled([
    getContractList({ list_rows: 50 }),
    getOfferList({ list_rows: 50 }),
    getSaleOutList({ list_rows: 50 }),
    http.get('/shop/ShopCustomer/index', { params: { list_rows: 500 } }),
    http.get('/stock/WarehouseName/index', { params: { list_rows: 100 } }),
    getGoodsList({ list_rows: 500 }),
    http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
    getBomList({ list_rows: 500 }),
  ])
  contractRows.value = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []) : []
  offerRows.value = o.status === 'fulfilled' ? (o.value?.data?.rows ?? []) : []
  saleOutRows.value = s.status === 'fulfilled' ? (s.value?.data?.rows ?? []) : []
  customerList.value = cust.status === 'fulfilled' ? (cust.value?.data?.rows ?? []) : []
  warehouseList.value = wh.status === 'fulfilled' ? (wh.value?.data?.rows ?? []) : []
  goodsList.value = g.status === 'fulfilled' ? (g.value?.data?.rows ?? []) : []
  inhouseList.value = ih.status === 'fulfilled' ? (ih.value?.data?.rows ?? []) : []
  bomList.value = b.status === 'fulfilled' ? (b.value?.data?.rows ?? []) : []
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
.quick-card-text { display: flex; flex-direction: column; gap: 2px; }
.quick-card-title { font-size: 18px; font-weight: 700; }
.quick-card-sub { font-size: 12px; opacity: 0.85; font-weight: 400; }

.kpi-row {
  display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;
  padding: 16px 20px; background: #f8fafc; border-radius: 12px;
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
