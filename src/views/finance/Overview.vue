<template>
  <div class="fin-overview">
    <!-- 顶部统计卡片 -->
    <div class="sum-cards-row">
      <div class="sum-card-col" v-for="card in summaryCards" :key="card.key">
        <el-card class="sum-card" shadow="hover" :class="card.route ? 'sum-card-link' : ''" @click="card.route && router.push(card.route)">
          <div class="sum-inner">
            <div class="sum-info">
              <div class="sum-label">{{ card.label }}</div>
              <div class="sum-value" :style="{ color: card.color }">¥{{ card.value }}</div>
              <div class="sum-sub">{{ card.sub }}</div>
            </div>
            <div class="sum-icon" :style="{ background: card.bg, color: card.color }">
              <el-icon :size="22"><component :is="card.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 第二行：账户余额 + 收支趋势图 -->
    <el-row :gutter="14">
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Wallet /></el-icon>
              <span>资金账户余额</span>
            </div>
          </template>
          <div class="inline-list" v-if="fundList.length">
            <div class="inline-item clickable" v-for="f in fundList" :key="f.id" @click="router.push('/finance/fund')">
              <div class="inline-name">{{ f.name }}</div>
              <div class="inline-value blue">¥{{ Number(f.balance||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ f.type || '账户' }}</div>
            </div>
            <div class="inline-item total-item">
              <div class="inline-name">合计</div>
              <div class="inline-value red">¥{{ fundTotal }}</div>
              <div class="inline-sub">{{ fundList.length }} 个账户</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无账户数据</div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><TrendCharts /></el-icon>
              <span>近期资金流水趋势</span>
              <span style="font-size:11px;color:#c9cdd4;margin-left:auto">最近7天</span>
            </div>
          </template>
          <div class="trend-chart">
            <svg :width="chartW" height="120" style="overflow:visible">
              <!-- Y轴参考线 -->
              <line v-for="i in 4" :key="i" :x1="0" :y1="(i-1)*30" :x2="chartW" :y2="(i-1)*30"
                stroke="#f0f0f0" stroke-width="1" />
              <!-- 收入折线 -->
              <polyline v-if="trendIncome.length > 1"
                :points="trendIncome.map((v,i) => `${i*(chartW/(trendDays.length-1))},${90 - v * 80}`).join(' ')"
                fill="none" stroke="#00b42a" stroke-width="2" stroke-linejoin="round" />
              <!-- 支出折线 -->
              <polyline v-if="trendExpense.length > 1"
                :points="trendExpense.map((v,i) => `${i*(chartW/(trendDays.length-1))},${90 - v * 80}`).join(' ')"
                fill="none" stroke="#f53f3f" stroke-width="2" stroke-linejoin="round" />
              <!-- 收入点 -->
              <circle v-for="(v,i) in trendIncome" :key="'in'+i"
                :cx="i*(chartW/(trendDays.length-1||1))" :cy="90 - v * 80" r="3" fill="#00b42a" />
              <!-- 支出点 -->
              <circle v-for="(v,i) in trendExpense" :key="'ex'+i"
                :cx="i*(chartW/(trendDays.length-1||1))" :cy="90 - v * 80" r="3" fill="#f53f3f" />
              <!-- X轴标签 -->
              <text v-for="(d,i) in trendDays" :key="'d'+i"
                :x="i*(chartW/(trendDays.length-1||1))" y="110" text-anchor="middle"
                font-size="10" fill="#86909c">{{ d }}</text>
            </svg>
            <!-- 图例 -->
            <div class="trend-legend">
              <span class="legend-dot income"></span><span>收入</span>
              <span class="legend-dot expense" style="margin-left:12px"></span><span>支出</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行：预付款 + 近期收款 + 近期付款 -->
    <el-row :gutter="14">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Money /></el-icon>
              <span>预付款</span>
              <span class="header-total green">¥{{ prepayTotal }}</span>
            </div>
          </template>
          <div class="inline-list" v-if="prepayList.length">
            <div class="inline-item clickable" v-for="r in prepayList.slice(0,6)" :key="r.id" @click="router.push('/finance/prepay')">
              <div class="inline-name">{{ r.customer_name || r.supplier_name || '—' }}</div>
              <div class="inline-value green">¥{{ Number(r.amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.pay_type === 'customer' ? '客户预收' : '供应商预付' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无预付款</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><TrendCharts /></el-icon>
              <span>近期收款</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click="router.push('/finance/collect-receipt')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="collectList.length">
            <div class="inline-item clickable" v-for="r in collectList.slice(0,6)" :key="r.id" @click="router.push('/finance/collect-receipt')">
              <div class="inline-name">{{ r.contact_name || r.customer_name || '—' }}</div>
              <div class="inline-value green">¥{{ Number(r.amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ (r.receipt_date||r.created_at||'').slice(0,10) }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无收款记录</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Bottom /></el-icon>
              <span>近期付款</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click="router.push('/finance/pay-receipt')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="payList.length">
            <div class="inline-item clickable" v-for="r in payList.slice(0,6)" :key="r.id" @click="router.push('/finance/pay-receipt')">
              <div class="inline-name">{{ r.contact_name || r.supplier_name || '—' }}</div>
              <div class="inline-value red">¥{{ Number(r.amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ (r.pay_date||r.created_at||'').slice(0,10) }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无付款记录</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第四行：应收 + 应付 + 采购货款 -->
    <el-row :gutter="14">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><DocumentChecked /></el-icon>
              <span>应收账款</span>
              <span class="header-total orange">¥{{ receivableTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/receivable')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="receivableList.length">
            <div class="inline-item clickable" v-for="r in receivableList.slice(0,6)" :key="r.id" @click="router.push('/finance/receivable')">
              <div class="inline-name">{{ r.customer_name || '—' }}</div>
              <div class="inline-value orange">¥{{ Number(r.un_receive_amount||r.amount||r.total_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || r.order_sn || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无应收款</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Document /></el-icon>
              <span>应付账款</span>
              <span class="header-total red">¥{{ payableTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/payable')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="payableList.length">
            <div class="inline-item clickable" v-for="r in payableList.slice(0,6)" :key="r.id" @click="router.push('/finance/payable')">
              <div class="inline-name">{{ r.supplier_name || '—' }}</div>
              <div class="inline-value red">¥{{ Number(r.un_pay_amount||r.amount||r.total_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || r.order_sn || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无应付款</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Box /></el-icon>
              <span>采购货款</span>
              <span class="header-total red">¥{{ purchasePayTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/procure/order')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="purchasePayList.length">
            <div class="inline-item clickable" v-for="r in purchasePayList.slice(0,6)" :key="r.id" @click="router.push('/procure/order')">
              <div class="inline-name">{{ r.supplier_name || '—' }}</div>
              <div class="inline-value red">¥{{ Number(r.total_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无采购货款</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资金流水（折叠） -->
    <div class="flow-section">
      <div class="flow-toggle" @click="flowVisible = !flowVisible">
        <el-icon :size="13"><List /></el-icon>
        <span>资金流水明细（账户所有收支记录）</span>
        <el-icon :size="12" style="margin-left:auto"><component :is="flowVisible ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
      </div>
      <div v-if="flowVisible">
        <el-table :data="fundFlowList" size="small" border style="width:100%">
          <el-table-column prop="fund_name" label="账户" width="130" />
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.flow_type === 'income' ? 'success' : 'danger'" size="small">
                {{ row.flow_type === 'income' ? '收入' : row.flow_type === 'refund' ? '冲红' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.flow_type === 'income' ? '#00b42a' : '#f53f3f', fontWeight: '600' }">
                {{ row.flow_type === 'income' ? '+' : '-' }}¥{{ Number(row.amount||0).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="余额" width="120" align="right">
            <template #default="{ row }">¥{{ Number(row.after_balance||0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="摘要" min-width="200" show-overflow-tooltip />
          <el-table-column label="时间" width="160" prop="created_at" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Wallet, TrendCharts, Bottom, DocumentChecked, Document, Money, List, ArrowUp, ArrowDown, Box } from '@element-plus/icons-vue'
import http from '@/api/http'
import { getFundList } from '@/api/finance'

const router = useRouter()

const fundList = ref<any[]>([])
const prepayList = ref<any[]>([])
const collectList = ref<any[]>([])
const payList = ref<any[]>([])
const receivableList = ref<any[]>([])
const payableList = ref<any[]>([])
const purchasePayList = ref<any[]>([])
const fundFlowList = ref<any[]>([])
const flowVisible = ref(false)
const chartW = 480

const fundTotal = computed(() =>
  fundList.value.reduce((s, f) => s + Number(f.balance || 0), 0).toFixed(2)
)
const prepayTotal = computed(() =>
  prepayList.value.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)
)
// 资金收入/支出 = 流水（唯一准确来源，避免重复计算）
const collectTotal = computed(() =>
  fundFlowList.value.filter(r => r.flow_type === 'income')
    .reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)
)
const payTotal = computed(() =>
  fundFlowList.value.filter(r => r.flow_type === 'expense')
    .reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)
)
const receivableTotal = computed(() =>
  receivableList.value.reduce((s, r) => s + Number(r.amount || r.total_amount || 0), 0).toFixed(2)
)
const payableTotal = computed(() =>
  payableList.value.reduce((s, r) => s + Number(r.amount || r.total_amount || 0), 0).toFixed(2)
)
const purchasePayTotal = computed(() =>
  purchasePayList.value.reduce((s, r) => s + Number(r.total_amount || 0), 0).toFixed(2)
)

// 近7天趋势数据
const trendDays = computed(() => {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(`${d.getMonth()+1}/${d.getDate()}`)
  }
  return days
})

function buildTrend(type: string) {
  const map: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    map[key] = 0
  }
  for (const r of fundFlowList.value) {
    if (r.flow_type !== type) continue
    const day = (r.created_at || '').slice(0, 10)
    if (map[day] !== undefined) map[day] += Number(r.amount || 0)
  }
  const vals = Object.values(map)
  const max = Math.max(...vals, 1)
  return vals.map(v => v / max)
}
const trendIncome = computed(() => buildTrend('income'))
const trendExpense = computed(() => buildTrend('expense'))

const summaryCards = computed(() => [
  { key: 'fund', label: '账户余额', value: fundTotal.value, sub: `${fundList.value.length} 个账户`, color: '#165dff', bg: '#e8f0fe', icon: 'Wallet', route: '/finance/fund' },
  { key: 'collect', label: '资金收入', value: collectTotal.value, sub: `${fundFlowList.value.filter(r => r.flow_type === 'income').length} 笔收入`, color: '#00b42a', bg: '#e6f7f0', icon: 'TrendCharts', route: '/finance/collect-receipt' },
  { key: 'pay', label: '资金支出', value: payTotal.value, sub: `${fundFlowList.value.filter(r => r.flow_type === 'expense').length} 笔支出`, color: '#f53f3f', bg: '#fff0f0', icon: 'Bottom', route: '/finance/pay-receipt' },
  { key: 'prepay', label: '预付款', value: prepayTotal.value, sub: `${prepayList.value.length} 笔`, color: '#ff7d00', bg: '#fff7e6', icon: 'Money', route: '/finance/prepay' },
  { key: 'receivable', label: '应收款', value: receivableTotal.value, sub: `${receivableList.value.length} 笔待收`, color: '#00b42a', bg: '#e6f7f0', icon: 'DocumentChecked', route: '/finance/receivable' },
  { key: 'payable', label: '应付款', value: payableTotal.value, sub: `${payableList.value.length} 笔待付`, color: '#f53f3f', bg: '#fff0f0', icon: 'Document', route: '/finance/payable' },
  { key: 'purchase', label: '采购货款', value: purchasePayTotal.value, sub: `${purchasePayList.value.length} 笔采购`, color: '#722ed1', bg: '#f3e8ff', icon: 'Box', route: '/procure/order' },
])

onMounted(async () => {
  try {
    const [fundRes, prepayRes, collectRes, payRes, receivableRes, payableRes, flowRes, purchaseRes] = await Promise.all([
      getFundList({ list_rows: 100 }),
      http.get('/finance/Prepay/index', { params: { list_rows: 200 } }),
      http.get('/finance/CollectReceipt/index', { params: { list_rows: 50 } }),
      http.get('/finance/PayReceipt/index', { params: { list_rows: 50 } }),
      http.get('/finance/CollectAccounts/index', { params: { list_rows: 200 } }),
      http.get('/finance/PayAccounts/index', { params: { list_rows: 200 } }),
      http.get('/finance/fundFlow/index', { params: { list_rows: 1000 } }),
      http.get('/stock/PurchaseOrder/index', { params: { list_rows: 200 } }),
    ])
    fundList.value = fundRes.data?.rows ?? []
    prepayList.value = prepayRes.data?.rows ?? []
    collectList.value = collectRes.data?.rows ?? []
    payList.value = payRes.data?.rows ?? []
    receivableList.value = receivableRes.data?.rows ?? []
    payableList.value = payableRes.data?.rows ?? []
    fundFlowList.value = flowRes.data?.rows ?? []
    purchasePayList.value = purchaseRes.data?.rows ?? []
  } catch {}
})
</script>

<style scoped>
.fin-overview {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sum-cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.sum-card-col {
  flex: 1 1 calc(14.28% - 12px);
  min-width: 160px;
}
.sum-card { border-radius: 10px; }
.sum-card-link { cursor: pointer; transition: box-shadow 0.15s, transform 0.1s; }
.sum-card-link:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; transform: translateY(-1px); }
.sum-card :deep(.el-card__body) { padding: 12px 14px; }
.sum-inner { display: flex; align-items: center; justify-content: space-between; }
.sum-info { flex: 1; min-width: 0; }
.sum-label { font-size: 11px; color: #86909c; margin-bottom: 4px; }
.sum-value { font-size: 18px; font-weight: 700; line-height: 1.2; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sum-sub { font-size: 11px; color: #c9cdd4; }
.sum-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-left: 8px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
.header-total { margin-left: auto; font-size: 14px; font-weight: 700; }
.header-total.green { color: #00b42a; }
.header-total.red { color: #f53f3f; }
.header-total.orange { color: #ff7d00; }
.header-total.blue { color: #165dff; }

/* 内联列表（横向排列） */
.inline-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
}
.inline-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 16px 6px 0;
  border-right: 1px solid #f0f0f0;
  margin-right: 16px;
  min-width: 100px;
}
.inline-item:last-child { border-right: none; }
.inline-item.clickable { cursor: pointer; border-radius: 6px; transition: background 0.15s; }
.inline-item.clickable:hover { background: #f0f7ff; }
.total-item { border-left: 2px solid #e8e8e8; padding-left: 16px; margin-left: 4px; }
.inline-name { font-size: 12px; color: #4e5969; margin-bottom: 2px; white-space: nowrap; }
.inline-value { font-size: 15px; font-weight: 700; line-height: 1.2; margin-bottom: 2px; }
.inline-value.blue { color: #165dff; }
.inline-value.green { color: #00b42a; }
.inline-value.red { color: #f53f3f; }
.inline-value.orange { color: #ff7d00; }
.inline-sub { font-size: 11px; color: #c9cdd4; }

/* 趋势图 */
.trend-chart { padding: 4px 0 0; }
.trend-legend { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 12px; color: #86909c; }
.legend-dot { width: 10px; height: 3px; border-radius: 2px; display: inline-block; }
.legend-dot.income { background: #00b42a; }
.legend-dot.expense { background: #f53f3f; }

.empty-tip { font-size: 13px; color: #86909c; padding: 8px 0; }

/* 资金流水折叠区 */
.flow-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}
.flow-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  color: #86909c;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.flow-toggle:hover { background: #f7f8fa; }
</style>
