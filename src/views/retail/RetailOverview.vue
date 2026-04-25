<template>
  <div class="page-container">
    <!-- 顶部：收银台 + 快捷操作 -->
    <el-row :gutter="14" style="margin-bottom:14px">
      <el-col :span="8">
        <div class="quick-card quick-card-main" @click="openCashRegister">
          <el-icon :size="28"><ShoppingCart /></el-icon>
          <div class="quick-card-text">
            <div class="quick-card-title">收银台</div>
            <div class="quick-card-sub">扫码 → 选商品 → 快速结账收款</div>
          </div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="quick-card quick-card-blue" @click="router.push('/retail/order')">
          <el-icon :size="20"><Document /></el-icon>
          <span>零售订单</span>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="quick-card quick-card-green" @click="router.push('/retail/customer')">
          <el-icon :size="20"><User /></el-icon>
          <span>会员管理</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-card quick-card-orange" @click="router.push('/retail/return')">
          <el-icon :size="20"><RefreshLeft /></el-icon>
          <span>零售退货</span>
        </div>
      </el-col>
    </el-row>

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
        <div class="kpi-label">{{ periodLabel }}营业额</div>
        <div class="kpi-val blue">¥{{ fmt(kpi.revenue) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}订单数</div>
        <div class="kpi-val purple">{{ kpi.orderCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">客单价</div>
        <div class="kpi-val green">¥{{ fmt(kpi.avgOrder) }}</div>
      </div>
      <div class="kpi-divider"></div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}会员消费</div>
        <div class="kpi-val blue">¥{{ fmt(kpi.memberRevenue) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ periodLabel }}退货</div>
        <div class="kpi-val orange">{{ kpi.returnCount }}</div>
      </div>
    </div>

    <!-- 收款方式明细 -->
    <div class="pay-breakdown-row" v-if="kpi.payBreakdown.length">
      <div class="pay-breakdown-title">收款方式汇总</div>
      <div class="pay-breakdown-cards">
        <div v-for="m in kpi.payBreakdown" :key="m.method" class="pay-breakdown-card">
          <div class="pay-bd-icon" :style="{ background: m.color }">{{ m.icon }}</div>
          <div class="pay-bd-info">
            <div class="pay-bd-label">{{ m.label }}</div>
            <div class="pay-bd-amount">¥{{ fmt(m.amount) }}</div>
          </div>
          <div class="pay-bd-meta">
            <span class="pay-bd-count">{{ m.count }}笔</span>
            <span class="pay-bd-pct">{{ m.pct }}%</span>
          </div>
          <div class="pay-bd-bar"><div class="pay-bd-bar-fill" :style="{ width: m.pct + '%', background: m.color }"></div></div>
        </div>
      </div>
    </div>

    <!-- Tab 数据表格 -->
    <el-card style="margin-top:14px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="最近订单" name="order">
          <el-table :data="orderRows" style="width:100%" size="small" max-height="400">
            <el-table-column label="单号" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ row.order_sn || `LS${(row.order_date || row.created_at || '').slice(0, 10).replace(/-/g, '')}${String(row.id).padStart(3,'0')}` }}</template>
            </el-table-column>
            <el-table-column prop="member_name" label="会员" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ row.member_name || '散客' }}</template>
            </el-table-column>
            <el-table-column label="实付" align="right" width="100">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:600">¥{{ fmt(Number(row.pay_amount || 0)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" align="center" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="payTagType(row.pay_type)">{{ payLabel(row.pay_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="日期" width="100">
              <template #default="{ row }">{{ fmtDt(row.order_date || row.create_time) }}</template>
            </el-table-column>
            <el-table-column label="商品明细" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="goods-detail">{{ parseGoodsInfo(row.goods_info) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="80">
              <template #default="{ row }">
                <el-button link size="small" @click="showOrderDetail(row)">详情</el-button>
              </template>
            </el-table-column>
            <template #empty><div style="padding:20px 0;color:#aaa">暂无订单</div></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="最近退货" name="return">
          <el-table :data="returnRows" style="width:100%" size="small" max-height="400">
            <el-table-column label="单号" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.return_no || row.order_no || `TH${String(row.id).padStart(4,'0')}` }}</template>
            </el-table-column>
            <el-table-column prop="store_name" label="门店" min-width="120" show-overflow-tooltip />
            <el-table-column label="金额" align="right" width="100">
              <template #default="{ row }">
                <span style="color:#dc2626;font-weight:600">¥{{ fmt(Number(row.amount || row.total_amount || 0)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status == 1 ? 'success' : row.status == 2 ? 'danger' : 'warning'" size="small">
                  {{ row.status == 1 ? '已审核' : row.status == 2 ? '已驳回' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="日期" width="100">
              <template #default="{ row }">{{ fmtDt(row.create_time) }}</template>
            </el-table-column>
            <template #empty><div style="padding:20px 0;color:#aaa">暂无退货</div></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="热销商品" name="hotGoods">
          <el-table :data="hotGoodsRows" style="width:100%" size="small" max-height="400">
            <el-table-column type="index" label="排名" width="60" align="center">
              <template #default="{ $index }">
                <span :class="['rank-badge', { top3: $index < 3 }]">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="goods_name" label="商品名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="销量" align="right" width="100">
              <template #default="{ row }">
                <span style="font-weight:600">{{ row.totalQty }}</span>
              </template>
            </el-table-column>
            <el-table-column label="销售额" align="right" width="120">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.totalAmount) }}</span>
              </template>
            </el-table-column>
            <template #empty><div style="padding:20px 0;color:#aaa">暂无数据</div></template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="560px" destroy-on-close>
      <div v-if="detailRow" class="order-detail">
        <div class="detail-header">
          <div class="detail-kv"><span class="detail-k">单号</span><span class="detail-v">{{ detailRow.order_sn || `LS${(detailRow.order_date || detailRow.created_at || '').slice(0, 10).replace(/-/g, '')}${String(detailRow.id).padStart(3,'0')}` }}</span></div>
          <div class="detail-kv"><span class="detail-k">日期</span><span class="detail-v">{{ fmtDt(detailRow.order_date || detailRow.create_time) }}</span></div>
          <div class="detail-kv"><span class="detail-k">会员</span><span class="detail-v">{{ detailRow.member_name || '散客' }}</span></div>
          <div class="detail-kv"><span class="detail-k">支付方式</span><span class="detail-v">{{ payLabel(detailRow.pay_type) }}</span></div>
        </div>
        <el-table :data="detailGoods" size="small" border style="margin:12px 0">
          <el-table-column prop="goods_name" label="商品" min-width="140" show-overflow-tooltip />
          <el-table-column prop="unit_name" label="单位" width="60" align="center" />
          <el-table-column prop="num" label="数量" width="70" align="right" />
          <el-table-column label="单价" width="90" align="right">
            <template #default="{ row }">¥{{ Number(row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:600">¥{{ (Number(row.num || 0) * Number(row.price || 0)).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="detail-footer">
          <span>商品合计：¥{{ fmt(Number(detailRow.total_amount || 0)) }}</span>
          <span>折扣：¥{{ fmt(Number(detailRow.discount_amount || 0)) }}</span>
          <span class="detail-pay">实付：¥{{ fmt(Number(detailRow.pay_amount || 0)) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart, Document, User, RefreshLeft } from '@element-plus/icons-vue'
import { getRetailOrderList, getRetailReturnList } from '@/api/retail'
import { fmtDt } from '@/utils/date'

const router = useRouter()

// ── 数据 ─────────────────────────────────────────────────────────────────────
const orderRows = ref<any[]>([])
const returnRows = ref<any[]>([])
const activeTab = ref('order')

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
  const y = now.getFullYear(), m = now.getMonth()
  const prefix = dateStr?.slice(0, 10) || ''
  if (!prefix) return false
  if (activePeriod.value === 'month') return prefix.slice(0, 7) === `${y}-${String(m + 1).padStart(2, '0')}`
  if (activePeriod.value === 'year') return prefix.startsWith(String(y))
  // quarter
  const qStart = Math.floor(m / 3) * 3
  const from = `${y}-${String(qStart + 1).padStart(2, '0')}-01`
  const toMonth = qStart + 3
  const to = toMonth > 11
    ? `${y + 1}-01-01`
    : `${y}-${String(toMonth + 1).padStart(2, '0')}-01`
  return prefix >= from && prefix < to
}

// ── 支付方式映射 ──────────────────────────────────────────────────────────────
const payMethodMap: Record<string, string> = {
  cash: '现金', wechat: '微信', alipay: '支付宝', balance: '会员余额', card: '银行卡',
}
function payLabel(method: string) { return payMethodMap[method] || method || '现金' }
function payTagType(method: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, any> = { cash: '', wechat: 'success', alipay: 'primary', balance: 'warning', card: 'info' }
  return map[method] || ''
}

// ── 商品明细解析 ──────────────────────────────────────────────────────────────
function parseGoodsInfo(info: string): string {
  try {
    const items = JSON.parse(info || '[]')
    return items.map((i: any) => `${i.goods_name}×${i.num}`).join('、')
  } catch { return '' }
}

// ── KPI ───────────────────────────────────────────────────────────────────────
const kpi = computed(() => {
  let revenue = 0, orderCount = 0, memberRevenue = 0
  const payAmountMap: Record<string, number> = {}
  const payCountMap: Record<string, number> = {}

  for (const o of orderRows.value) {
    const d = o.order_date || o.create_time || ''
    if (inPeriod(d)) {
      const pay = Number(o.pay_amount || 0)
      revenue += pay
      orderCount++
      const pm = o.pay_type || 'cash'
      payAmountMap[pm] = (payAmountMap[pm] || 0) + pay
      payCountMap[pm] = (payCountMap[pm] || 0) + 1
      if (o.member_id && o.member_id !== 0) memberRevenue += pay
    }
  }

  const returnCount = returnRows.value.filter(r => inPeriod(r.create_time || '')).length
  const avgOrder = orderCount > 0 ? revenue / orderCount : 0

  const payStyleMap: Record<string, { icon: string; color: string }> = {
    cash: { icon: '💵', color: '#16a34a' },
    wechat: { icon: '💬', color: '#07c160' },
    alipay: { icon: '🔵', color: '#1677ff' },
    balance: { icon: '👤', color: '#f59e0b' },
    card: { icon: '💳', color: '#6366f1' },
  }

  // 收款方式明细
  const payBreakdown = Object.entries(payAmountMap)
    .sort((a, b) => b[1] - a[1])
    .map(([method, amount]) => ({
      method,
      label: payMethodMap[method] || method,
      amount,
      count: payCountMap[method] || 0,
      pct: revenue > 0 ? Math.round(amount / revenue * 100) : 0,
      icon: payStyleMap[method]?.icon || '💰',
      color: payStyleMap[method]?.color || '#999',
    }))

  return { revenue, orderCount, avgOrder, memberRevenue, returnCount, payBreakdown }
})

// ── 热销商品统计 ──────────────────────────────────────────────────────────────
const hotGoodsRows = computed(() => {
  const map: Record<string, { goods_name: string; totalQty: number; totalAmount: number }> = {}
  for (const o of orderRows.value) {
    const d = o.order_date || o.create_time || ''
    if (!inPeriod(d)) continue
    try {
      const items = JSON.parse(o.goods_info || '[]')
      for (const item of items) {
        const key = String(item.goods_id || item.goods_name)
        if (!map[key]) map[key] = { goods_name: item.goods_name || '未知商品', totalQty: 0, totalAmount: 0 }
        map[key].totalQty += Number(item.num || 0)
        map[key].totalAmount += Number(item.num || 0) * Number(item.price || 0)
      }
    } catch {}
  }
  return Object.values(map).sort((a, b) => b.totalQty - a.totalQty).slice(0, 20)
})

// ── 订单详情 ──────────────────────────────────────────────────────────────────
const detailVisible = ref(false)
const detailRow = ref<any>(null)
const detailGoods = ref<any[]>([])

function showOrderDetail(row: any) {
  detailRow.value = row
  try { detailGoods.value = JSON.parse(row.goods_info || '[]') } catch { detailGoods.value = [] }
  detailVisible.value = true
}

// ── 收银台 ──────────────────────────────────────────────────────────────────
function openCashRegister() {
  window.open(router.resolve('/cashregister').href, '_blank')
}

// ── 工具 ──────────────────────────────────────────────────────────────────────
function fmt(v: number): string {
  return isNaN(v) ? '0.00' : v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── 加载 ──────────────────────────────────────────────────────────────────────
async function loadData() {
  const [o, r] = await Promise.allSettled([
    getRetailOrderList({ list_rows: 200 }),
    getRetailReturnList({ list_rows: 100 }),
  ])
  orderRows.value = o.status === 'fulfilled' ? (o.value?.data?.rows ?? []) : []
  returnRows.value = r.status === 'fulfilled' ? (r.value?.data?.rows ?? []) : []
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
.quick-card-main { background: linear-gradient(135deg, #2563eb, #7c3aed); min-height: 72px; }
.quick-card-blue { background: #0071e3; justify-content: center; min-height: 72px; }
.quick-card-green { background: #16a34a; justify-content: center; min-height: 72px; }
.quick-card-orange { background: #f59e0b; justify-content: center; min-height: 72px; }
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
.green { color: #16a34a; }
.orange { color: #f59e0b; }

.kpi-pay-methods { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
.kpi-pay-tag {
  font-size: 11px; padding: 1px 6px; border-radius: 3px;
  background: #e8eaf0; color: #555; font-weight: 500;
}

/* 收款方式汇总 */
.pay-breakdown-row {
  margin-top: 14px; padding: 16px 20px; background: #f8fafc; border-radius: 12px;
}
.pay-breakdown-title {
  font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 12px;
}
.pay-breakdown-cards {
  display: flex; gap: 12px; flex-wrap: wrap;
}
.pay-breakdown-card {
  flex: 1; min-width: 160px; max-width: 240px;
  background: #fff; border-radius: 10px; padding: 14px 16px;
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); border: 1px solid #f0f2f7;
  position: relative; overflow: hidden;
}
.pay-bd-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
  opacity: 0.15;
}
.pay-bd-info { flex: 1; min-width: 0; }
.pay-bd-label { font-size: 12px; color: #999; margin-bottom: 2px; }
.pay-bd-amount { font-size: 17px; font-weight: 700; color: #1d1d1f; }
.pay-bd-meta {
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
}
.pay-bd-count { font-size: 12px; color: #999; }
.pay-bd-pct { font-size: 13px; font-weight: 600; color: #555; }
.pay-bd-bar {
  width: 100%; height: 3px; background: #f0f2f7; border-radius: 2px;
  flex-basis: 100%;
}
.pay-bd-bar-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }

.goods-detail { font-size: 12px; color: #888; }

.rank-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  font-size: 12px; font-weight: 600; color: #999; background: #f0f2f7;
}
.rank-badge.top3 { background: #fff7ed; color: #f59e0b; }

/* 订单详情 */
.order-detail {}
.detail-header {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;
  padding: 12px 0; border-bottom: 1px solid #f0f2f7; margin-bottom: 4px;
}
.detail-kv { display: flex; gap: 8px; font-size: 13px; }
.detail-k { color: #999; min-width: 56px; }
.detail-v { color: #333; font-weight: 500; }
.detail-footer {
  display: flex; justify-content: flex-end; gap: 20px;
  padding: 10px 0 0; font-size: 13px; color: #666;
}
.detail-pay { color: #dc2626; font-weight: 700; font-size: 15px; }
</style>
