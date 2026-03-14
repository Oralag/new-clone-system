<template>
  <div class="fin-overview">
    <!-- 快捷操作栏 -->
    <div class="quick-action-bar">
      <div class="quick-action-card collect" @click="openQuickCollect">
        <el-icon :size="20"><Plus /></el-icon>
        <span>快速收款</span>
      </div>
      <div class="quick-action-card pay" @click="openQuickPay">
        <el-icon :size="20"><Minus /></el-icon>
        <span>快速付款</span>
      </div>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="sum-cards-row">
      <div :class="['sum-card-col', card.key === 'fund' ? 'sum-card-col--wide' : 'sum-card-col--narrow']" v-for="card in summaryCards" :key="card.key">
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
        <el-card shadow="hover" style="cursor:pointer" @click="router.push('/finance/fund')">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Wallet /></el-icon>
              <span>账户余额</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click.stop="router.push('/finance/fund')">管理</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="fundList.length">
            <div class="inline-item clickable" v-for="f in fundList" :key="f.id" @click="router.push('/finance/fund')">
              <div class="inline-name">{{ f.name }}</div>
              <div class="inline-value blue">¥{{ Number(f.balance||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ { 1: '银行账户', 2: '现金', 3: '第三方' }[f.type] || f.type_name || '账户' }}</div>
            </div>
            <div class="inline-item total-item">
              <div class="inline-name">合计</div>
              <div class="inline-value red">¥{{ accountTotal }}</div>
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
              <el-button link type="primary" size="small" style="margin-left:auto" @click="router.push('/finance/fund-flow')">查看明细</el-button>
            </div>
          </template>
          <div class="trend-chart">
            <svg :width="chartW" height="120" style="overflow:visible">
              <!-- Y轴参考线 -->
              <line v-for="i in 4" :key="i" :x1="0" :y1="(i-1)*30" :x2="chartW" :y2="(i-1)*30"
                stroke="rgba(0,0,0,0.05)" stroke-width="1" />
              <!-- 收入折线 -->
              <polyline v-if="trendIncome.length > 1"
                :points="trendIncome.map((v,i) => `${i*(chartW/(trendDays.length-1))},${90 - v * 80}`).join(' ')"
                fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round" />
              <!-- 支出折线 -->
              <polyline v-if="trendExpense.length > 1"
                :points="trendExpense.map((v,i) => `${i*(chartW/(trendDays.length-1))},${90 - v * 80}`).join(' ')"
                fill="none" stroke="#dc2626" stroke-width="2" stroke-linejoin="round" />
              <!-- 收入点 -->
              <circle v-for="(v,i) in trendIncome" :key="'in'+i"
                :cx="i*(chartW/(trendDays.length-1||1))" :cy="90 - v * 80" r="3" fill="#16a34a" />
              <!-- 支出点 -->
              <circle v-for="(v,i) in trendExpense" :key="'ex'+i"
                :cx="i*(chartW/(trendDays.length-1||1))" :cy="90 - v * 80" r="3" fill="#dc2626" />
              <!-- X轴标签 -->
              <text v-for="(d,i) in trendDays" :key="'d'+i"
                :x="i*(chartW/(trendDays.length-1||1))" y="110" text-anchor="middle"
                font-size="10" fill="rgba(29,29,31,0.35)">{{ d }}</text>
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
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/prepay')">更多</el-button>
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

    <!-- 第四行：应收 + 采购货款 -->
    <el-row :gutter="14">
      <el-col :span="12">
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
              <div class="inline-value orange">¥{{ Number(r.un_pay_amount ?? (Number(r.total_amount||r.amount||0) - Number(r.paid_amount||0))).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_sn || r.order_no || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无应收款</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Box /></el-icon>
              <span>采购货款（待付）</span>
              <span class="header-total red">¥{{ purchasePayTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/payable')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="purchasePayList.length">
            <div class="inline-item clickable" v-for="r in purchasePayList.slice(0,6)" :key="r.id" @click="router.push('/finance/payable')">
              <div class="inline-name">{{ r.supplier_name || '—' }}</div>
              <div class="inline-value red">¥{{ Number(r.un_pay_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无采购货款</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第五行：销售单款 + 零售单款 -->
    <el-row :gutter="14">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Document /></el-icon>
              <span>销售出库单</span>
              <span class="header-total blue">¥{{ saleOutTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/sale/out')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="saleOutList.length">
            <div class="inline-item clickable" v-for="r in saleOutList.slice(0,6)" :key="r.id" @click="router.push('/sale/out')">
              <div class="inline-name">{{ r.customer_name || '—' }}</div>
              <div class="inline-value blue">¥{{ Number(r.total_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无收款记录</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Money /></el-icon>
              <span>零售单款</span>
              <span class="header-total green">¥{{ retailTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/retail/order')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="retailList.length">
            <div class="inline-item clickable" v-for="r in retailList.slice(0,6)" :key="r.id" @click="router.push('/retail/order')">
              <div class="inline-name">{{ r.member_name || r.customer_name || r.contact_name || '—' }}</div>
              <div class="inline-value green">¥{{ Number(r.pay_amount||r.total_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无零售单</div>
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
        <el-table :data="normalizedFundFlowList" size="small" border style="width:100%">
          <el-table-column prop="fund_name" label="账户" width="130" />
          <el-table-column prop="source" label="来源" width="110" />
          <el-table-column prop="name" label="对象" min-width="120" show-overflow-tooltip />
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.flow_type === 'income' ? 'success' : 'danger'" size="small">
                {{ row.flow_type === 'income' ? '收入' : row.flow_type === 'refund' ? '冲红' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.flow_type === 'income' ? '#16a34a' : '#dc2626', fontWeight: '600' }">
                {{ row.flow_type === 'income' ? '+' : '-' }}¥{{ Number(row.amount||0).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="余额" width="120" align="right">
            <template #default="{ row }">¥{{ Number(row.after_balance||0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="order_no" label="单号" min-width="130" show-overflow-tooltip />
          <el-table-column prop="remark" label="摘要" min-width="200" show-overflow-tooltip />
          <el-table-column label="时间" width="160" prop="created_at" />
        </el-table>
      </div>
    </div>
  </div>

  <!-- 快速收款弹窗 -->
  <el-dialog v-model="collectDialogVisible" title="快速收款" width="460px" :close-on-click-modal="false">
    <!-- 一键识别 -->
    <div class="ocr-bar">
      <el-input
        v-model="collectOcrText"
        placeholder="粘贴付款截图文字 / 转账记录，一键识别金额和备注"
        clearable
        @keydown.enter="parseCollectOcr"
      >
        <template #append>
          <el-button @click="parseCollectOcr">识别</el-button>
        </template>
      </el-input>
    </div>
    <el-form :model="collectForm" label-width="80px" style="margin-top:12px">
      <el-form-item label="收款对象">
        <div class="contact-row">
          <el-select
            v-model="collectForm.contact_id"
            filterable clearable placeholder="选择客户"
            style="flex:1"
            @change="onCollectContactChange"
          >
            <el-option v-for="c in clientList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button class="other-btn" :type="collectForm.contact_id === -1 ? 'primary' : 'default'" @click="toggleCollectOther">其他</el-button>
        </div>
        <el-input v-if="collectForm.contact_id === -1" v-model="collectForm.contact_name" placeholder="手动输入名称" style="margin-top:6px" />
      </el-form-item>
      <el-form-item label="收款账户">
        <div class="contact-row">
          <el-select v-model="collectForm.fund_id" filterable clearable placeholder="选择账户" style="flex:1" @change="onCollectFundChange">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
          <el-button class="other-btn" :type="collectForm.fund_id === -1 ? 'primary' : 'default'" @click="toggleCollectFundOther">其他</el-button>
        </div>
        <el-input v-if="collectForm.fund_id === -1" v-model="collectForm.fund_name" placeholder="手动输入账户名称" style="margin-top:6px" />
      </el-form-item>
      <el-form-item label="收款金额">
        <el-input-number v-model="collectForm.amount" :min="0" :precision="2" style="width:100%" />
      </el-form-item>
      <el-form-item label="收款日期">
        <el-date-picker v-model="collectForm.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="collectForm.remark" placeholder="备注说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="collectDialogVisible = false">取消</el-button>
      <el-button type="success" :loading="collectSaving" @click="saveCollect">确认收款</el-button>
    </template>
  </el-dialog>

  <!-- 快速付款弹窗 -->
  <el-dialog v-model="payDialogVisible" title="快速付款" width="460px" :close-on-click-modal="false">
    <!-- 一键识别 -->
    <div class="ocr-bar">
      <el-input
        v-model="payOcrText"
        placeholder="粘贴付款截图文字 / 转账记录，一键识别金额和备注"
        clearable
        @keydown.enter="parsePayOcr"
      >
        <template #append>
          <el-button @click="parsePayOcr">识别</el-button>
        </template>
      </el-input>
    </div>
    <el-form :model="payForm" label-width="80px" style="margin-top:12px">
      <el-form-item label="付款对象">
        <div class="contact-row">
          <el-select
            v-model="payForm.contact_id"
            filterable clearable placeholder="选择供应商"
            style="flex:1"
            @change="onPayContactChange"
          >
            <el-option v-for="s in supplierList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button class="other-btn" :type="payForm.contact_id === -1 ? 'primary' : 'default'" @click="togglePayOther">其他</el-button>
        </div>
        <el-input v-if="payForm.contact_id === -1" v-model="payForm.contact_name" placeholder="手动输入名称" style="margin-top:6px" />
      </el-form-item>
      <el-form-item label="付款账户">
        <div class="contact-row">
          <el-select v-model="payForm.fund_id" filterable clearable placeholder="选择账户" style="flex:1" @change="onPayFundChange">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
          <el-button class="other-btn" :type="payForm.fund_id === -1 ? 'primary' : 'default'" @click="togglePayFundOther">其他支出账户</el-button>
        </div>
        <el-input v-if="payForm.fund_id === -1" v-model="payForm.fund_name" placeholder="手动输入账户名称" style="margin-top:6px" />
      </el-form-item>
      <el-form-item label="付款金额">
        <el-input-number v-model="payForm.amount" :min="0" :precision="2" style="width:100%" />
      </el-form-item>
      <el-form-item label="付款日期">
        <el-date-picker v-model="payForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="payForm.remark" placeholder="备注说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="payDialogVisible = false">取消</el-button>
      <el-button type="danger" :loading="paySaving" @click="savePay">确认付款</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Wallet, TrendCharts, Bottom, DocumentChecked, Document, Money, List, ArrowUp, ArrowDown, Box, Plus, Minus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'
import { getFundList } from '@/api/finance'
import { normalizeFundFlowRows } from '@/utils/fundFlow'

const router = useRouter()

const fundList = ref<any[]>([])
const clientList = ref<any[]>([])
const supplierList = ref<any[]>([])
const prepayList = ref<any[]>([])
const collectList = ref<any[]>([])
const payList = ref<any[]>([])
const receivableList = ref<any[]>([])
const payableList = ref<any[]>([])
const purchasePayList = ref<any[]>([])
const fundFlowList = ref<any[]>([])
const saleOutList = ref<any[]>([])
const retailList = ref<any[]>([])
const flowVisible = ref(false)
const chartW = 480

const normalizedFundFlowList = computed(() => normalizeFundFlowRows(fundFlowList.value))
// 收入/支出 统一从资金流水（FundFlow）汇总，与资金流水页保持一致
const collectTotal = computed(() => sumFundFlowIncome(normalizedFundFlowList.value).toFixed(2))
const payTotal = computed(() => sumFundFlowExpense(normalizedFundFlowList.value).toFixed(2))
const accountTotal = computed(() =>
  fundList.value.reduce((s, r) => s + Number(r.balance || 0), 0).toFixed(2)
)
const fundTotal = computed(() =>
  Math.max(0, Number(collectTotal.value) - Number(payTotal.value)).toFixed(2)
)
const prepayTotal = computed(() =>
  prepayList.value.filter((r: any) => r.pay_type === 'customer').reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)
)
const receivableTotal = computed(() =>
  receivableList.value.reduce((s, r) => s + Number(r.un_pay_amount ?? (Number(r.total_amount || r.amount || 0) - Number(r.paid_amount || 0))), 0).toFixed(2)
)
function getPayableUnpaidAmount(r: any): number {
  if (r?.un_pay_amount !== undefined && r?.un_pay_amount !== null && r?.un_pay_amount !== '') {
    return Math.max(0, Number(r.un_pay_amount || 0))
  }
  const orderAmount = Number(r?.order_amount || 0)
  const paidAmount = Number(r?.paid_amount || 0)
  return Math.max(0, orderAmount - paidAmount)
}
const payableTotal = computed(() =>
  payableList.value.reduce((s, r) => s + getPayableUnpaidAmount(r), 0).toFixed(2)
)
const purchasePayTotal = computed(() =>
  purchasePayList.value.reduce((s, r) => s + Number(r.un_pay_amount || 0), 0).toFixed(2)
)

const saleOutTotal = computed(() =>
  saleOutList.value.reduce((s, r) => s + Number(r.total_amount || 0), 0).toFixed(2)
)

const retailTotal = computed(() =>
  retailList.value.reduce((s, r) => s + Number(r.pay_amount || r.total_amount || 0), 0).toFixed(2)
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
  for (const r of normalizedFundFlowList.value) {
    if (type === 'income' && r.flow_type !== 'income') continue
    if (type === 'expense' && r.flow_type === 'income') continue
    const day = (r.created_at || '').slice(0, 10)
    if (map[day] !== undefined) map[day] += Number(r.amount || 0)
  }
  const vals = Object.values(map)
  const max = Math.max(...vals, 1)
  return vals.map(v => v / max)
}
const trendIncome = computed(() => buildTrend('income'))
const trendExpense = computed(() => buildTrend('expense'))

const summaryCards = computed(() => {
  const income = Number(collectTotal.value)
  const expense = Number(payTotal.value)
  const balance = fundTotal.value
  return [
  { key: 'fund', label: '资金余额', value: balance, sub: `= 收入 ¥${income.toFixed(2)} − 支出 ¥${expense.toFixed(2)}`, color: '#0071e3', bg: 'rgba(0,113,227,0.08)', icon: 'Wallet', route: '/finance/fund-flow' },
  { key: 'collect', label: '总资金收入', value: collectTotal.value, sub: `${normalizedFundFlowList.value.filter(r => r.flow_type === 'income').length} 笔已入账`, color: '#16a34a', bg: '#e6f7f0', icon: 'TrendCharts', route: '/finance/fund-flow' },
  { key: 'pay', label: '总资金支出', value: payTotal.value, sub: `${normalizedFundFlowList.value.filter(r => r.flow_type !== 'income').length} 笔已出账`, color: '#dc2626', bg: '#fff0f0', icon: 'Bottom', route: '/finance/fund-flow' },
  { key: 'payable', label: '应付总额', value: payableTotal.value, sub: `${payableList.value.filter((r) => getPayableUnpaidAmount(r) > 0).length} 笔欠款`, color: '#ff4d4f', bg: '#fff1f0', icon: 'DocumentChecked', route: '/finance/payable' },
  { key: 'receivable', label: '应收总额', value: receivableTotal.value, sub: `${receivableList.value.length} 笔待收`, color: '#16a34a', bg: '#e6f7f0', icon: 'DocumentChecked', route: '/finance/receivable' },
  ]
})

// 快速收款
const collectDialogVisible = ref(false)
const collectSaving = ref(false)
const collectOcrText = ref('')
const collectForm = ref<any>({ contact_id: null, contact_name: '', contact_type: 'customer', fund_id: null, fund_name: '', amount: 0, receipt_date: new Date().toISOString().slice(0, 10), remark: '' })

function openQuickCollect() {
  collectOcrText.value = ''
  collectForm.value = { contact_id: null, contact_name: '', contact_type: 'customer', fund_id: null, fund_name: '', amount: 0, receipt_date: new Date().toISOString().slice(0, 10), remark: '' }
  collectDialogVisible.value = true
}
function toggleCollectOther() {
  collectForm.value.contact_id = collectForm.value.contact_id === -1 ? null : -1
  collectForm.value.contact_name = ''
  collectForm.value.contact_type = 'other'
}
function onCollectContactChange(id: number) {
  const c = clientList.value.find((x: any) => x.id === id)
  collectForm.value.contact_name = c?.name || ''
  collectForm.value.contact_type = 'customer'
}
function toggleCollectFundOther() {
  collectForm.value.fund_id = collectForm.value.fund_id === -1 ? null : -1
  collectForm.value.fund_name = ''
}
function onCollectFundChange(id: number) {
  const f = fundList.value.find((x: any) => x.id === id)
  collectForm.value.fund_name = f?.name || ''
}
// 通用自然语言解析：支持 "跑腿费5元" "水电费50" "¥123.45" "收到张三500块" 等格式
function parseNaturalText(text: string): { amount: number; remark: string; date: string; isExpense: boolean } {
  // 1. 金额识别：优先匹配"XX费/XX款/XX钱 + 数字"，其次 ¥数字，其次独立数字
  let amount = 0
  // 自然语言：文字+数字+单位，如 "跑腿费5元" "水费50" "工资3000块"
  const nlMatch = text.match(/[\u4e00-\u9fa5a-zA-Z]+\s*[：:＝=]?\s*[¥￥]?\s*(\d+(?:[.,]\d+)?)\s*(?:元|块|¥|￥)?/)
  // 标准金额格式：¥123.45 / 金额：123.45
  const formalMatch = text.match(/(?:金额|共计|合计|支付|收到|转账)[：:＝=\s]*[¥￥]?\s*(\d+(?:[.,]\d+)?)/)
  // 纯货币符号：¥123
  const symbolMatch = text.match(/[¥￥]\s*(\d+(?:[.,]\d+)?)/)
  // 结尾数字+单位
  const trailMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:元|块|円)/)

  const candidates = [formalMatch, symbolMatch, nlMatch, trailMatch].filter(Boolean)
  if (candidates.length > 0) {
    // 取最大值（通常是最主要的金额）
    const amounts = candidates.map(m => parseFloat(m![1].replace(',', '.')))
    amount = Math.max(...amounts)
  }

  // 2. 备注识别：优先显式备注字段，否则提取文字部分（去掉数字和货币符号）
  let remark = ''
  const remarkMatch = text.match(/(?:备注|摘要|说明|用途|事由)[：:]\s*(.+)/)
  if (remarkMatch) {
    remark = remarkMatch[1].trim()
  } else {
    // 自然语言：去掉数字、货币符号、空白，剩余文字作为备注
    remark = text
      .replace(/[¥￥]\s*\d+(?:[.,]\d+)?/g, '')
      .replace(/\d+(?:[.,]\d+)?\s*(?:元|块|円)?/g, '')
      .replace(/(?:金额|共计|合计|支付|收到|转账|备注|摘要|说明|用途)[：:＝=\s]*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // 3. 日期识别
  let date = new Date().toISOString().slice(0, 10)
  const dateMatch = text.match(/(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})/)
  const shortDateMatch = text.match(/(\d{1,2})[./月](\d{1,2})[日号]?/)
  if (dateMatch) {
    date = `${dateMatch[1]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[3].padStart(2,'0')}`
  } else if (shortDateMatch) {
    const y = new Date().getFullYear()
    date = `${y}-${shortDateMatch[1].padStart(2,'0')}-${shortDateMatch[2].padStart(2,'0')}`
  }

  // 4. 判断是否为日常费用类（提示应走费用管理）
  const expenseKeywords = /跑腿|快递|运费|水费|电费|燃气|网费|电话|话费|房租|租金|物业|餐费|饭费|打车|交通|停车|办公|文具|耗材|广告|维修|保险|税|罚款|利息|手续费|服务费|工资|薪资|奖金|提成|社保|公积金|福利/
  const isExpense = expenseKeywords.test(text)

  return { amount, remark, date, isExpense }
}

function parseCollectOcr() {
  const text = collectOcrText.value.trim()
  if (!text) return
  const { amount, remark, date } = parseNaturalText(text)
  if (amount > 0) collectForm.value.amount = amount
  if (remark) collectForm.value.remark = remark
  collectForm.value.receipt_date = date
  if (amount > 0) {
    ElMessage.success(`识别完成：金额 ¥${amount}，请确认收款信息`)
  } else {
    ElMessage.warning('未能识别到金额，请手动填写')
  }
}

async function saveCollect() {
  if (!collectForm.value.amount) { ElMessage.warning('请输入收款金额'); return }
  const name = collectForm.value.contact_id === -1 ? collectForm.value.contact_name : (clientList.value.find((x: any) => x.id === collectForm.value.contact_id)?.name || collectForm.value.contact_name || '')
  const fundName = collectForm.value.fund_id === -1 ? collectForm.value.fund_name : (fundList.value.find((x: any) => x.id === collectForm.value.fund_id)?.name || '')
  collectSaving.value = true
  try {
    await http.post('/finance/CollectReceipt/add', {
      contact_name: name,
      contact_type: collectForm.value.contact_id !== -1 && collectForm.value.contact_id ? 'customer' : 'other',
      fund_name: fundName,
      amount: collectForm.value.amount,
      receipt_date: collectForm.value.receipt_date,
      remark: collectForm.value.remark,
    })
    ElMessage.success('收款记录已保存')
    collectDialogVisible.value = false
  } catch { ElMessage.error('保存失败') } finally { collectSaving.value = false }
}

// 快速付款
const payDialogVisible = ref(false)
const paySaving = ref(false)
const payOcrText = ref('')
const payForm = ref<any>({ contact_id: null, contact_name: '', contact_type: 'other', fund_id: null, fund_name: '', amount: 0, pay_date: new Date().toISOString().slice(0, 10), remark: '' })

function openQuickPay() {
  payOcrText.value = ''
  payForm.value = { contact_id: null, contact_name: '', contact_type: 'other', fund_id: null, fund_name: '', amount: 0, pay_date: new Date().toISOString().slice(0, 10), remark: '' }
  payDialogVisible.value = true
}
function togglePayOther() {
  payForm.value.contact_id = payForm.value.contact_id === -1 ? null : -1
  payForm.value.contact_name = ''
  payForm.value.contact_type = 'other'
}
function onPayContactChange(id: number) {
  const s = supplierList.value.find((x: any) => x.id === id)
  payForm.value.contact_name = s?.name || ''
  payForm.value.contact_type = 'supplier'
}
function togglePayFundOther() {
  payForm.value.fund_id = payForm.value.fund_id === -1 ? null : -1
  payForm.value.fund_name = ''
}
function onPayFundChange(id: number) {
  const f = fundList.value.find((x: any) => x.id === id)
  payForm.value.fund_name = f?.name || ''
}
function parsePayOcr() {
  const text = payOcrText.value.trim()
  if (!text) return
  const { amount, remark, date, isExpense } = parseNaturalText(text)
  if (amount > 0) payForm.value.amount = amount
  if (remark) payForm.value.remark = remark
  payForm.value.pay_date = date
  // 费用类自动设置为其他付款
  if (isExpense && payForm.value.contact_id === null) {
    payForm.value.contact_id = -1
    payForm.value.contact_name = remark || ''
  }
  if (amount > 0) {
    const hint = isExpense ? `识别完成：¥${amount}（日常费用，已设为其他支出）` : `识别完成：金额 ¥${amount}，请确认付款信息`
    ElMessage.success(hint)
  } else {
    ElMessage.warning('未能识别到金额，请手动填写')
  }
}

async function savePay() {
  if (!payForm.value.amount) { ElMessage.warning('请输入付款金额'); return }
  const name = payForm.value.contact_id === -1 ? payForm.value.contact_name : (supplierList.value.find((x: any) => x.id === payForm.value.contact_id)?.name || payForm.value.contact_name || '')
  const fundName = payForm.value.fund_id === -1 ? payForm.value.fund_name : (fundList.value.find((x: any) => x.id === payForm.value.fund_id)?.name || '')
  paySaving.value = true
  try {
    await http.post('/finance/PayReceipt/add', {
      contact_name: name,
      contact_type: payForm.value.contact_id !== -1 && payForm.value.contact_id ? 'supplier' : 'other',
      fund_name: fundName,
      amount: payForm.value.amount,
      pay_date: payForm.value.pay_date,
      remark: payForm.value.remark,
    })
    ElMessage.success('付款记录已保存')
    payDialogVisible.value = false
  } catch { ElMessage.error('保存失败') } finally { paySaving.value = false }
}

onMounted(async () => {
  try {
    const [fundRes, prepayRes, collectRes, payRes, receivableRes, payableRes, flowRes, purchaseRes, saleOutRes, retailRes, clientRes, supplierRes] = await Promise.all([
      getFundList({ list_rows: 100 }),
      http.get('/finance/Prepay/index', { params: { list_rows: 200 } }),
      http.get('/finance/CollectReceipt/index', { params: { list_rows: 1000 } }),
      http.get('/finance/PayReceipt/index', { params: { list_rows: 1000 } }),
      http.get('/finance/CollectAccounts/index', { params: { list_rows: 200 } }),
      http.get('/finance/PayAccounts/index', { params: { list_rows: 200 } }),
      http.get('/finance/FundFlow/index', { params: { list_rows: 1000 } }),
      http.get('/finance/PayAccounts/index', { params: { list_rows: 200 } }),
      http.get('/stock/SaleOutOrder/index', { params: { list_rows: 50 } }),
      http.get('/retail/order/index', { params: { list_rows: 200 } }),
      http.get('/shop/ShopCustomer/index', { params: { list_rows: 500 } }),
      http.get('/procure/supplier/index', { params: { list_rows: 500 } }),
    ])
    fundList.value = fundRes.data?.rows ?? fundRes.data?.list ?? []
    prepayList.value = prepayRes.data?.rows ?? prepayRes.data?.list ?? []
    collectList.value = collectRes.data?.rows ?? collectRes.data?.list ?? []
    payList.value = payRes.data?.rows ?? payRes.data?.list ?? []
    receivableList.value = receivableRes.data?.rows ?? receivableRes.data?.list ?? []
    payableList.value = payableRes.data?.rows ?? payableRes.data?.list ?? []
    fundFlowList.value = flowRes.data?.rows ?? flowRes.data?.list ?? []
    purchasePayList.value = (purchaseRes.data?.rows ?? purchaseRes.data?.list ?? []).filter((r: any) => Number(r.un_pay_amount || 0) > 0)
    saleOutList.value = saleOutRes.data?.rows ?? saleOutRes.data?.list ?? []
    retailList.value = retailRes.data?.rows ?? retailRes.data?.list ?? []
    clientList.value = clientRes.data?.rows ?? clientRes.data?.list ?? []
    supplierList.value = supplierRes.data?.rows ?? supplierRes.data?.list ?? []
  } catch {}
})
</script>

<style scoped>
/* 一键识别栏 */
.ocr-bar {
  margin-bottom: 4px;
  background: var(--gray, #f5f5f7);
  border-radius: 12px;
  padding: 10px 12px;
}
.ocr-bar :deep(.el-input-group__append) {
  background: #0071e3;
  color: #fff;
  border: none;
  font-weight: 600;
  cursor: pointer;
  border-radius: 0 8px 8px 0;
  transition: background 0.15s;
}
.ocr-bar :deep(.el-input-group__append:hover) { background: #005bbf; }

/* 对象选择行 */
.contact-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.other-btn {
  flex-shrink: 0;
  border-radius: 8px !important;
  font-size: 12px !important;
  padding: 0 10px !important;
}

.quick-action-bar {
  display: flex;
  gap: 12px;
}
.quick-action-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  user-select: none;
}
.quick-action-card:hover { opacity: 0.85; transform: translateY(-1px); }
.quick-action-card.collect { background: #e6f7f0; color: #16a34a; border: 1px solid #bbf7d0; }
.quick-action-card.pay { background: #fff0f0; color: #dc2626; border: 1px solid #fecaca; }
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
  min-width: 160px;
}
.sum-card-col--wide {
  flex: 2 1 280px;
  min-width: 220px;
}
.sum-card-col--narrow {
  flex: 1 1 140px;
  min-width: 130px;
}
.sum-card { border-radius: 14px; }
.sum-card-link { cursor: pointer; transition: box-shadow 0.15s, transform 0.1s; }
.sum-card-link:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; transform: translateY(-1px); }
.sum-card :deep(.el-card__body) { padding: 12px 14px; }
.sum-inner { display: flex; align-items: center; justify-content: space-between; }
.sum-info { flex: 1; min-width: 0; }
.sum-label { font-size: 11px; color: rgba(29,29,31,0.35); margin-bottom: 4px; }
.sum-value { font-size: 18px; font-weight: 700; line-height: 1.2; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sum-sub { font-size: 11px; color: rgba(29,29,31,0.2); }
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
  color: #1d1d1f;
}
.header-total { margin-left: auto; font-size: 14px; font-weight: 700; }
.header-total.green { color: #16a34a; }
.header-total.red { color: #dc2626; }
.header-total.orange { color: #ea580c; }
.header-total.blue { color: #0071e3; }

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
  border-right: 1px solid rgba(0,0,0,0.05);
  margin-right: 16px;
  min-width: 100px;
}
.inline-item:last-child { border-right: none; }
.inline-item.clickable { cursor: pointer; border-radius: 10px; transition: background 0.15s; }
.inline-item.clickable:hover { background: #f0f7ff; }
.total-item { border-left: 2px solid rgba(0,0,0,0.06); padding-left: 16px; margin-left: 4px; }
.inline-name { font-size: 12px; color: rgba(29,29,31,0.5); margin-bottom: 2px; white-space: nowrap; }
.inline-value { font-size: 15px; font-weight: 700; line-height: 1.2; margin-bottom: 2px; }
.inline-value.blue { color: #0071e3; }
.inline-value.green { color: #16a34a; }
.inline-value.red { color: #dc2626; }
.inline-value.orange { color: #ea580c; }
.inline-sub { font-size: 11px; color: rgba(29,29,31,0.2); }

/* 趋势图 */
.trend-chart { padding: 4px 0 0; }
.trend-legend { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 12px; color: rgba(29,29,31,0.35); }
.legend-dot { width: 10px; height: 3px; border-radius: 2px; display: inline-block; }
.legend-dot.income { background: #16a34a; }
.legend-dot.expense { background: #dc2626; }

.empty-tip { font-size: 13px; color: rgba(29,29,31,0.35); padding: 8px 0; }

/* 资金流水折叠区 */
.flow-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
}
.flow-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  color: rgba(29,29,31,0.35);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.flow-toggle:hover { background: #f5f5f7; }
</style>
