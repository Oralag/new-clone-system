<template>
  <div class="dashboard">

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/></svg>
          <span>Global Operations Center</span>
        </div>
        <h1 class="page-title" style="display:none">数字游牧概览</h1>
      </div>
    </div>

    <!-- Cash Register + Quick Entries -->
    <div class="action-hub">
      <!-- 收银台主按钮 -->
      <div class="cashregister-btn" @click="openNewWindow()">
        <div class="crb-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="2" y="5" width="20" height="14" rx="3"/>
            <path d="M2 10h20M6 15h2M10 15h4"/>
          </svg>
        </div>
        <div class="crb-info">
          <div class="crb-label">零售收银台</div>
          <div class="crb-desc">快速开单 · 扫码结账</div>
        </div>
        <svg class="crb-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-grid">
        <div
          v-for="item in quickItems" :key="item.path"
          class="quick-item"
          @click="router.push(item.path)"
        >
          <div class="quick-icon-wrap" :style="{ background: item.bg }">
            <svg :width="item.sw||20" :height="item.sh||20" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="1.8" v-html="item.svg" />
          </div>
          <span class="quick-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div
        v-for="(stat, idx) in stats" :key="stat.key"
        class="metric-card"
        @click="router.push(stat.link)"
      >
        <div class="metric-bg-icon">
          <el-icon :size="120"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="metric-top">
          <div class="metric-icon-wrap">
            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="metric-trend" :class="idx === 3 && stat.value !== '--' && Number(stat.value) > 0 ? 'trend-warn' : 'trend-up'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <span>实时</span>
          </div>
        </div>
        <div class="metric-label">{{ stat.label }}</div>
        <div class="metric-value">{{ stat.value }}</div>
        <div class="metric-sub">{{ stat.sub }}</div>
      </div>
    </div>

    <!-- Charts + Guide -->
    <div class="charts-row">
      <div class="left-col">
      <!-- Sales trend -->
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <div class="card-micro">Performance Metrics</div>
            <h3 class="card-title">近{{ trendDays }}天销售趋势</h3>
          </div>
          <div class="chart-tabs">
            <button :class="['chart-tab', trendDays === 7 ? 'active' : '']" @click="setTrendDays(7)">7天</button>
            <button :class="['chart-tab', trendDays === 30 ? 'active' : '']" @click="setTrendDays(30)">30天</button>
          </div>
        </div>
        <div ref="saleTrendRef" class="chart-area" />
      </div>

      <!-- Goods Ranking -->
      <div class="rank-card">
        <div class="card-header-row">
          <div>
            <div class="card-micro">Top Products</div>
            <h3 class="card-title">商品销售排行</h3>
          </div>
          <div class="chart-tabs">
            <button :class="['chart-tab', rankMode === 'qty' ? 'active' : '']" @click="rankMode = 'qty'">销售数量</button>
            <button :class="['chart-tab', rankMode === 'amt' ? 'active' : '']" @click="rankMode = 'amt'">销售金额</button>
          </div>
        </div>
        <div v-if="rankList.length === 0" class="rank-empty">暂无销售数据</div>
        <div v-else class="rank-list">
          <div v-for="(item, idx) in rankList" :key="item.name" class="rank-row">
            <div class="rank-no" :class="idx < 3 ? `rank-top${idx+1}` : ''">{{ idx + 1 }}</div>
            <div class="rank-name">
              <span>{{ item.name }}</span>
              <span v-if="item.spec" class="rank-spec">{{ item.spec }}</span>
            </div>
            <div class="rank-bar-wrap">
              <div class="rank-bar" :style="{ width: (item.value / rankList[0].value * 100).toFixed(1) + '%' }" />
            </div>
            <div class="rank-val">
              {{ rankMode === 'qty' ? item.value + (item.unit ? ' ' + item.unit : '') : '¥' + item.value.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Guide / Insights 右侧 -->
      <div class="right-col">
        <!-- 新手向导卡片 -->
        <div v-if="!guideHidden" class="guide-side-card">
          <div class="guide-side-header">
            <div class="guide-side-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              新手向导
            </div>
            <div class="guide-side-actions">
              <div class="gmp-bar-wrap">
                <div class="gmp-bar" :style="{ width: (completedSteps.size / guideSteps.length * 100) + '%' }" />
              </div>
              <span class="gmp-label">{{ completedSteps.size }}/{{ guideSteps.length }} 完成</span>
              <button class="guide-hide-btn" @click="hideGuide" title="收起向导">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <!-- 步骤导航小点 -->
          <div class="guide-dots">
            <div v-for="(step, i) in guideSteps" :key="i"
              class="guide-dot" :class="{ active: guideStep === i, done: completedSteps.has(i) }"
              @click="guideStep = i" :title="step.title" />
          </div>
          <!-- 当前步骤内容 -->
          <div class="guide-step-num" style="display:flex;align-items:center;gap:6px">
            Step {{ guideStep + 1 }}
            <span v-if="completedSteps.has(guideStep)" style="font-size:11px;color:#16a34a;background:#dcfce7;padding:2px 8px;border-radius:10px">✓ 已完成</span>
          </div>
          <div class="guide-step-name">{{ guideSteps[guideStep].title }}</div>
          <p class="guide-step-desc">{{ guideSteps[guideStep].desc }}</p>
          <!-- 完成提示 -->
          <div v-if="completedSteps.has(guideStep) && guideStep < guideSteps.length - 1"
            style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;color:#16a34a">
            太棒了！已完成此步骤。继续下一步：<strong>{{ guideSteps[guideStep + 1].title }}</strong>
          </div>
          <div v-else-if="completedSteps.size === guideSteps.length"
            style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;color:#16a34a">
            🎉 恭喜！您已完成所有入门向导，系统已全部准备就绪！
          </div>
          <button class="guide-goto-btn" @click="guideGoto">
            前往 {{ guideSteps[guideStep].title }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div class="guide-nav-btns">
            <button class="gnb-prev" :disabled="guideStep === 0" @click="guideStep--">← 上一步</button>
            <button v-if="guideStep < guideSteps.length - 1" class="gnb-next" @click="markDoneAndNext">
              {{ completedSteps.has(guideStep) ? '继续下一步 →' : '标记完成并继续 →' }}
            </button>
            <button v-else class="gnb-finish" @click="markDoneAndFinish">{{ completedSteps.size === guideSteps.length ? '重新开始' : '标记完成' }}</button>
          </div>
        </div>
        <!-- 收起后的小入口 -->
        <div v-else class="guide-collapsed" @click="showGuide">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span>新手向导</span>
        </div>

        <!-- AI Insights -->
        <div class="insights-card">
          <div class="insights-bg">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.5" opacity="0.08">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="insights-header">
            <div class="insights-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/></svg>
            </div>
            <div>
              <div class="insights-title">智能洞察</div>
              <div class="insights-sub">AI 数据引擎</div>
            </div>
          </div>
          <div class="insights-list">
            <div class="insight-item" v-for="item in insightItems" :key="item.tag">
              <div class="insight-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                {{ item.tag }}
              </div>
              <p class="insight-text">"{{ item.text }}"</p>
            </div>
          </div>
          <button class="insights-btn" @click="router.push('/finance/overview')">查看财务总览 →</button>
        </div>
      </div>
    </div>

    <!-- Fund Flow -->
    <div v-if="flowVisible" class="flow-card">
      <div class="card-header-row">
        <div>
          <div class="card-micro">Finance</div>
          <h3 class="card-title">资金流水明细</h3>
        </div>
        <button class="btn-close-sm" @click="flowVisible = false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <el-table :data="fundFlowList" size="small" style="width:100%">
        <el-table-column prop="fund_name" label="账户" width="120" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <span class="flow-tag" :class="row.flow_type === 'income' ? 'tag-green' : row.flow_type === 'refund' ? 'tag-blue' : 'tag-red'">
              {{ row.flow_type === 'income' ? '收入' : row.flow_type === 'refund' ? '冲红' : '支出' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ fontWeight: 600, color: row.flow_type === 'income' ? '#16a34a' : '#dc2626' }">
              {{ row.flow_type === 'income' ? '+' : '-' }}¥{{ Number(row.amount||0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="摘要" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="160" />
      </el-table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onActivated, onDeactivated, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()

const stats = ref([
  { key: 'sale',     label: '今日销售额', value: '--', sub: '含销售+零售',   icon: 'Money',         link: '/dashboard/today-sales' },
  { key: 'order',    label: '今日订单',   value: '--', sub: '销售+零售单数', icon: 'ShoppingCart',  link: '/dashboard/today-sales' },
  { key: 'customer', label: '客户总数',   value: '--', sub: '全部客户',      icon: 'User',          link: '/sale/client' },
  { key: 'stock',    label: '库存预警',   value: '--', sub: '负库存+零库存', icon: 'WarningFilled', link: '/warehouse/stock' },
])

const insightItems = ref([
  { tag: 'Loading...', text: 'AI 正在分析您的业务数据...' },
])

function buildInsights(data: {
  todaySale: number, stockWarn: number, customerCount: number,
  todayOrders: number, pendingReceivable: number
}) {
  const items = []
  if (data.todaySale > 0) {
    items.push({ tag: '今日销售', text: `今日已完成销售 ¥${data.todaySale.toFixed(2)}，共 ${data.todayOrders} 笔订单。` })
  } else {
    items.push({ tag: '营业提醒', text: '今日暂无销售记录，可前往收银台或新建销售合同开始营业。' })
  }
  if (data.stockWarn > 0) {
    items.push({ tag: '⚠️ 库存预警', text: `当前有 ${data.stockWarn} 种商品库存不足或为零，建议及时采购补货。` })
  } else {
    items.push({ tag: '库存正常', text: '库存状态良好，暂无缺货或预警商品。' })
  }
  if (data.pendingReceivable > 0) {
    items.push({ tag: '应收提醒', text: `当前待收款金额 ¥${data.pendingReceivable.toFixed(2)}，请及时跟进客户回款。` })
  } else if (data.customerCount > 0) {
    items.push({ tag: '客户概览', text: `系统共有 ${data.customerCount} 位客户，当前应收款状态良好。` })
  }
  insightItems.value = items
}

const quickItems = [
  {
    label: '客户管理', path: '/sale/client',
    bg: 'rgba(52,211,153,0.12)', color: '#16a34a',
    svg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  {
    label: '销售报价', path: '/sale/offer',
    bg: 'rgba(249,115,22,0.1)', color: '#ea580c',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  },
  {
    label: '采购订单', path: '/procure/order',
    bg: 'rgba(139,92,246,0.1)', color: '#7c3aed',
    svg: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  },
  {
    label: '库存总览', path: '/warehouse/stock',
    bg: 'rgba(236,72,153,0.1)', color: '#db2777',
    svg: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  },
  {
    label: '应收账款', path: '/finance/receivable',
    bg: 'rgba(0,113,227,0.08)', color: '#0071e3',
    svg: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M6 15h2M12 15h4"/>',
  },
  {
    label: '商品管理', path: '/goods/info',
    bg: 'rgba(234,179,8,0.1)', color: '#ca8a04',
    svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  },
  {
    label: '员工档案', path: '/personnel/staff',
    bg: 'rgba(20,184,166,0.1)', color: '#0d9488',
    svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  {
    label: '系统设置', path: '/setting/admin',
    bg: 'rgba(100,116,139,0.1)', color: '#475569',
    svg: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  },
]

function openNewWindow() { window.open('/#/cashregister', '_blank') }

// ── 新手向导 ──
const guideStep = ref(0)
const guideHidden = ref(localStorage.getItem('erp_guide_hidden') === '1')
const completedSteps = ref<Set<number>>(new Set(
  JSON.parse(localStorage.getItem('erp_guide_done') || '[]')
))
function hideGuide() { guideHidden.value = true; localStorage.setItem('erp_guide_hidden', '1') }
function showGuide() { guideHidden.value = false; localStorage.removeItem('erp_guide_hidden') }

function saveCompletedSteps() {
  localStorage.setItem('erp_guide_done', JSON.stringify([...completedSteps.value]))
}

function markDoneAndNext() {
  completedSteps.value.add(guideStep.value)
  saveCompletedSteps()
  guideStep.value++
}

function markDoneAndFinish() {
  completedSteps.value.add(guideStep.value)
  saveCompletedSteps()
  if (completedSteps.value.size === guideSteps.length) {
    guideStep.value = 0
  }
}

const guideSteps = [
  {
    title: '新增客户',
    sub: '客户管理',
    path: '/sale/client',
    desc: '销售流程的第一步是在系统中建立客户档案，记录客户的基本信息、联系方式和等级。',
    actions: [
      '进入 销售 → 客户管理',
      '点击右上角「新增」按钮',
      '填写客户名称、联系人、手机号等信息',
      '保存客户档案',
    ],
    tip: '客户等级会影响价格策略，建议先设置好客户等级（销售 → 客户等级）。',
  },
  {
    title: '创建销售报价',
    sub: '销售报价',
    path: '/sale/offer',
    desc: '向客户发送报价单，明确商品、数量、单价，让客户确认后方可执行。',
    actions: [
      '进入 销售 → 销售报价',
      '点击「新增报价」',
      '选择刚才创建的客户',
      '添加商品并填写报价数量和单价',
      '提交并发送报价给客户',
    ],
    tip: '报价单确认后可直接转换为销售合同，无需重复录入数据。',
  },
  {
    title: '签订销售合同',
    sub: '销售合同',
    path: '/sale/contract',
    desc: '客户确认报价后，签订正式合同，锁定交货日期和付款条件。',
    actions: [
      '进入 销售 → 销售合同',
      '点击「新增合同」或从报价单转入',
      '确认合同金额、交货日期、付款方式',
      '审核合同',
    ],
    tip: '合同审核后会触发库存预留逻辑，确保履约库存充足。',
  },
  {
    title: '销售出库',
    sub: '销售出库',
    path: '/sale/out',
    desc: '商品发货时创建出库单，系统自动扣减库存并生成应收账款。',
    actions: [
      '进入 销售 → 销售出库',
      '点击「新增出库」',
      '关联销售合同（可自动带入商品）',
      '填写实际出库数量和出库仓库',
      '审核出库单',
    ],
    tip: '出库单审核后，库存自动扣减，应收账款自动生成，无需手动操作财务。',
  },
  {
    title: '应收账款 & 收款',
    sub: '财务收款',
    path: '/finance/receivable',
    desc: '出库后产生应收款，客户付款时在系统中录入收款单进行核销。',
    actions: [
      '进入 财务 → 应收账款，查看待收款项',
      '客户付款后进入 财务 → 收款单',
      '点击「新增收款单」',
      '选择客户和待核销的应收账款',
      '填写收款金额和收款账户，确认',
    ],
    tip: '支持部分收款，剩余未核销金额会在应收账款中继续显示，方便跟踪催收。',
  },
  {
    title: '查看销售报表',
    sub: '销售统计',
    path: '/reports/sale-rate',
    desc: '流程完成后，在报表模块查看销售统计和利润分析，持续优化业务。',
    actions: [
      '进入 报表 → 销售统计，查看销售额趋势',
      '进入 报表 → 销售台账，查看每笔明细',
      '进入 报表 → 利润报表，分析毛利情况',
    ],
    tip: '可在工作台首页的"近30天销售趋势"图快速查看整体表现。',
  },
]

function guideGoto() {
  completedSteps.value.add(guideStep.value)
  saveCompletedSteps()
  router.push(guideSteps[guideStep.value].path)
}

const saleTrendRef = ref<HTMLDivElement>()
const fundFlowList = ref<any[]>([])
const flowVisible = ref(false)
const trendDays = ref(30)
const rankMode = ref<'qty' | 'amt'>('qty')

// 缓存原始数据，供切换天数时重绘
const _saleRows = ref<any[]>([])
const _retailRows = ref<any[]>([])

// 商品排行（从 goods_info 聚合）
const rankList = computed(() => {
  const map: Record<string, { name: string; spec: string; unit: string; qty: number; amt: number }> = {}
  const parseGoods = (r: any) => {
    const items: any[] = parseGoodsInfo(r.goods_info)
    items.forEach(i => {
      const baseName = i.goods_name || i.name || `商品${i.goods_id}`
      const spec = i.spec || ''
      const key = spec ? `${baseName}||${spec}` : baseName
      if (!map[key]) map[key] = { name: baseName, spec, unit: i.unit_name || '', qty: 0, amt: 0 }
      const qty = Number(i.num || 0)
      const price = Number(i.price || i.sale_price || 0)
      map[key].qty += qty
      map[key].amt += qty * price
    })
  }
  _saleRows.value.forEach(r => parseGoods(r))
  _retailRows.value.forEach(r => parseGoods(r))
  const sorted = Object.values(map).sort((a, b) =>
    rankMode.value === 'qty' ? b.qty - a.qty : b.amt - a.amt
  ).slice(0, 10)
  return sorted.map(i => ({
    name: i.name,
    spec: i.spec,
    unit: i.unit,
    value: rankMode.value === 'qty' ? i.qty : i.amt,
  }))
})

const dashboardLoading = ref(false)
let lastRefreshAt = 0
let refreshListenersBound = false

function getToday() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseGoodsInfo(goodsInfo: any) {
  if (Array.isArray(goodsInfo)) return goodsInfo
  if (typeof goodsInfo !== 'string' || !goodsInfo) return []
  try {
    return JSON.parse(goodsInfo)
  } catch {
    return []
  }
}

async function loadDashboardData(force = false) {
  const now = Date.now()
  if (dashboardLoading.value) return
  if (!force && now - lastRefreshAt < 3000) return

  dashboardLoading.value = true
  try {
    const today = getToday()
    const [saleRes, retailRes, customerRes, procureRes, goodsRes, fundFlowRes] = await Promise.allSettled([
      http.get('/stock/SaleOutOrder/index',     { params: { list_rows: 2000 } }),
      http.get('/retail/order/index',           { params: { list_rows: 2000 } }),
      http.get('/shop/ShopCustomer/index',      { params: { list_rows: 1 } }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 2000 } }),
      http.get('/goods/ShopGoods/index',        { params: { list_rows: 2000, status: 1 } }),
      http.get('/finance/fundFlow/index',       { params: { list_rows: 500 } }),
    ])

    const rows = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? (r.value?.data?.rows ?? r.value?.rows ?? []) : []

    const saleRows: any[]   = rows(saleRes)
    const retailRows: any[] = rows(retailRes)

    const todaySale   = saleRows.filter((r: any) => (r.out_date   || '').slice(0, 10) === today)
    const todayRetail = retailRows.filter((r: any) => (r.order_date || '').slice(0, 10) === today)
    const saleAmt   = todaySale.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
    const retailAmt = todayRetail.reduce((s: number, r: any) => s + Number(r.pay_amount || r.total_amount || 0), 0)
    stats.value[0].value = '¥' + (saleAmt + retailAmt).toFixed(2)
    stats.value[1].value = String(todaySale.length + todayRetail.length)

    const custData = customerRes.status === 'fulfilled' ? (customerRes.value?.data ?? customerRes.value) : {}
    stats.value[2].value = String(custData?.total ?? 0)

    const stockMap: Record<number, number> = {}
    rows(procureRes).forEach((r: any) => {
      if (Number(r.status) !== 1) return
      const items = parseGoodsInfo(r.goods_info)
      items.forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num || 0) })
    })
    ;[...saleRows, ...retailRows].forEach((r: any) => {
      if (r.out_date !== undefined && Number(r.status) !== 1) return
      const items = parseGoodsInfo(r.goods_info)
      items.forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num || 0) })
    })
    const goodsList: any[] = rows(goodsRes)
    stats.value[3].value = String(goodsList.filter(g => (stockMap[g.id] ?? 0) <= 0).length)

    if (fundFlowRes.status === 'fulfilled') {
      fundFlowList.value = fundFlowRes.value?.data?.rows ?? fundFlowRes.value?.rows ?? []
    }

    _saleRows.value = saleRows
    _retailRows.value = retailRows
    drawTrendChart(trendDays.value)

    // Build AI insights from real data
    try {
      const receivableRes = await http.get('/finance/Receivable/index', { params: { list_rows: 1000 } })
      const receivableRows = receivableRes?.data?.rows ?? []
      const pendingReceivable = receivableRows
        .filter((r: any) => Number(r.status) !== 1 && Number(r.un_collect || r.amount || 0) > 0)
        .reduce((s: number, r: any) => s + Number(r.un_collect || r.amount || 0), 0)
      buildInsights({
        todaySale: saleAmt + retailAmt,
        stockWarn: Number(stats.value[3].value) || 0,
        customerCount: Number(stats.value[2].value) || 0,
        todayOrders: todaySale.length + todayRetail.length,
        pendingReceivable,
      })
    } catch {
      buildInsights({
        todaySale: saleAmt + retailAmt,
        stockWarn: Number(stats.value[3].value) || 0,
        customerCount: Number(stats.value[2].value) || 0,
        todayOrders: todaySale.length + todayRetail.length,
        pendingReceivable: 0,
      })
    }
    lastRefreshAt = Date.now()
  } finally {
    dashboardLoading.value = false
  }
}

function handleWindowResume() {
  if (document.visibilityState === 'hidden') return
  loadDashboardData()
}

function bindRefreshListeners() {
  if (refreshListenersBound) return
  window.addEventListener('focus', handleWindowResume)
  document.addEventListener('visibilitychange', handleWindowResume)
  refreshListenersBound = true
}

function unbindRefreshListeners() {
  if (!refreshListenersBound) return
  window.removeEventListener('focus', handleWindowResume)
  document.removeEventListener('visibilitychange', handleWindowResume)
  refreshListenersBound = false
}

onActivated(() => {
  bindRefreshListeners()
  loadDashboardData(true)
})

onDeactivated(() => {
  unbindRefreshListeners()
})

onUnmounted(() => {
  unbindRefreshListeners()
})

function setTrendDays(n: number) {
  trendDays.value = n
  drawTrendChart(n)
}

function drawTrendChart(n: number) {
  if (!saleTrendRef.value) return
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const pad = (x: number) => String(x).padStart(2, '0')
    days.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`)
  }
  const dayMap: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
  _saleRows.value.forEach((r: any) => { const d = (r.out_date || '').slice(0, 10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.total_amount || 0) })
  _retailRows.value.forEach((r: any) => { const d = (r.order_date || '').slice(0, 10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.pay_amount || r.total_amount || 0) })
  const values = days.map(d => dayMap[d])
  const maxVal = Math.max(...values, 1)

  if (values.every(v => v === 0)) {
    saleTrendRef.value.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:rgba(29,29,31,0.25);font-size:13px;font-weight:500;letter-spacing:-0.01em">近${n}天暂无销售数据</div>`
    return
  }

  const W = 500, H = 200, pL = 10, pR = 10, pT = 20, pB = 36
  const smooth = (pts: string[]) => {
    let d = `M${pts[0]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i-1].split(',').map(Number)
      const [x1, y1] = pts[i].split(',').map(Number)
      const cx = (x0 + x1) / 2
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
    }
    return d
  }
  const pts = values.map((v, i) => {
    const x = (pL + (i / (days.length - 1)) * (W - pL - pR)).toFixed(1)
    const y = (pT + (1 - v / maxVal) * (H - pT - pB)).toFixed(1)
    return `${x},${y}`
  })
  const linePath = smooth(pts)
  const lastPt = pts[pts.length-1].split(',')
  const firstPt = pts[0].split(',')
  const areaPath = `${linePath} L${lastPt[0]},${H - pB} L${firstPt[0]},${H - pB} Z`
  const step = n <= 7 ? 1 : Math.ceil(n / 6)
  const labels = days.filter((_, i) => i % step === 0 || i === n - 1).map(d => {
    const i = days.indexOf(d)
    const x = (pL + (i / (n - 1)) * (W - pL - pR)).toFixed(1)
    return `<text x="${x}" y="${H - 8}" text-anchor="middle" font-size="10" font-weight="600" fill="rgba(29,29,31,0.3)" font-family="Inter,-apple-system,sans-serif">${d.slice(5)}</text>`
  }).join('')
  const grids = [0.25, 0.5, 0.75, 1].map(p => {
    const y = (pT + (1 - p) * (H - pT - pB)).toFixed(1)
    const val = (maxVal * p / 1000).toFixed(1)
    return `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>
            <text x="${pL}" y="${Number(y) - 4}" font-size="9" font-weight="600" fill="rgba(29,29,31,0.25)" font-family="Inter,-apple-system,sans-serif">${val}k</text>`
  }).join('')
  saleTrendRef.value.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stop-color="#0071e3" stop-opacity="0.15"/>
          <stop offset="95%" stop-color="#0071e3" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grids}
      <path d="${areaPath}" fill="url(#areaGrad)"/>
      <path d="${linePath}" fill="none" stroke="#0071e3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${labels}
    </svg>`
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  padding: 8px 0 40px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 8px;
  animation: dash-fade-up 0.8s cubic-bezier(0.23,1,0.32,1) both;
}

@keyframes dash-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--dim);
  margin-bottom: 12px;
}

.page-title {
  font-size: clamp(40px, 5.5vw, 72px);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.95;
  color: var(--dark);
  margin: 0;
}

.header-actions { display: flex; gap: 10px; align-items: center; }

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: var(--gray);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
}
.btn-secondary:hover { background: var(--gray-2); transform: scale(0.98); }

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #0071e3;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,113,227,0.25);
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
}
.btn-primary:hover { background: rgba(0,113,227,0.88); transform: scale(0.97); }

.btn-agent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(139,92,246,0.18));
  border: 1px solid rgba(124,58,237,0.25);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #7c3aed;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
}
.btn-agent:hover { background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(139,92,246,0.28)); transform: scale(0.97); border-color: rgba(124,58,237,0.45); }

/* ── Metrics ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  background: var(--gray);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 36px 32px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.8s cubic-bezier(0.23,1,0.32,1), box-shadow 0.8s cubic-bezier(0.23,1,0.32,1);
}

.metric-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 40px 80px rgba(0,0,0,0.09);
}

.metric-bg-icon {
  position: absolute;
  right: -16px;
  bottom: -16px;
  color: var(--dark);
  opacity: 0.025;
  pointer-events: none;
  transition: opacity 0.8s;
}
.metric-card:hover .metric-bg-icon { opacity: 0.07; }

.metric-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.metric-icon-wrap {
  width: 60px;
  height: 60px;
  background: var(--card-bg);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0071e3;
  box-shadow: 0 8px 24px rgba(0,0,0,0.07);
  transition: transform 0.5s cubic-bezier(0.23,1,0.32,1);
}
.metric-card:hover .metric-icon-wrap { transform: scale(1.12) rotate(3deg); }

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
.trend-up   { background: rgba(52,211,153,0.1);  color: #16a34a; }
.trend-warn { background: rgba(239,68,68,0.1);   color: #dc2626; }

.metric-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--dim);
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.metric-value {
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: var(--dark);
  line-height: 1;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.metric-sub {
  font-size: 11px;
  color: var(--dim);
  font-weight: 500;
  position: relative;
  z-index: 1;
}

/* ── Charts Row ── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: start;
}
.left-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 新手向导小卡片 */
.guide-side-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 16px 18px;
}
.guide-side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.guide-side-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--dark);
}
.guide-side-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.guide-hide-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--gray);
  color: var(--dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.guide-hide-btn:hover { background: var(--gray-2); color: var(--dark); }

/* 步骤小圆点 */
.guide-dots {
  display: flex;
  gap: 5px;
  margin-bottom: 14px;
}
.guide-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--faint);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.guide-dot.done { background: #16a34a; }
.guide-dot.active { background: #0071e3; width: 20px; border-radius: 4px; }

/* 收起后的小入口 */
.guide-collapsed {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--mid);
  cursor: pointer;
  transition: all 0.15s;
}
.guide-collapsed:hover { background: var(--blue-light); color: #0071e3; border-color: rgba(0,113,227,0.15); }
.guide-collapsed svg { color: #0071e3; flex-shrink: 0; }


.chart-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 36px 36px 28px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.card-micro {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--dim);
  margin-bottom: 6px;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--dark);
  margin: 0;
}

.chart-tabs {
  display: flex;
  background: var(--gray);
  border-radius: 12px;
  padding: 4px;
  gap: 2px;
}

.chart-tab {
  padding: 7px 16px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.chart-tab.active { background: #0071e3; color: white; box-shadow: 0 4px 12px rgba(0,113,227,0.25); }

.chart-area { height: 280px; width: 100%; }

/* ── Insights ── */
.insights-card {
  background: var(--dark);
  border-radius: 24px;
  padding: 24px 22px;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.insights-bg {
  position: absolute;
  top: 0;
  right: 0;
  padding: 20px;
  pointer-events: none;
}

.insights-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.insights-icon {
  width: 48px;
  height: 48px;
  background: #0071e3;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(0,113,227,0.3);
  flex-shrink: 0;
}

.insights-title { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; }
.insights-sub { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,0.18); margin-top: 3px; }

.insights-list { display: flex; flex-direction: column; gap: 14px; flex: 1; position: relative; z-index: 1; }

.insight-item {
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  transition: background 0.3s, transform 0.3s cubic-bezier(0.23,1,0.32,1);
  cursor: pointer;
}
.insight-item:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

.insight-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #0071e3;
  margin-bottom: 8px;
}

.insight-text {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255,255,255,0.65);
  font-weight: 500;
  margin: 0;
  font-style: italic;
}

.insights-btn {
  width: 100%;
  padding: 15px;
  background: var(--card-bg);
  color: var(--dark);
  border: none;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.insights-btn:hover { background: var(--gray); transform: scale(0.99); }

/* ── Action Hub (收银台 + 快捷入口) ── */
.action-hub {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 收银台主按钮 */
.cashregister-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #0071e3, #0055b3);
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
  width: 200px;
  transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
  box-shadow: 0 6px 20px rgba(0,113,227,0.28);
  position: relative;
  overflow: hidden;
}
.cashregister-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
  pointer-events: none;
}
.cashregister-btn:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 12px 32px rgba(0,113,227,0.38);
}
.crb-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.18);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.crb-info { flex: 1; min-width: 0; }
.crb-label { font-size: 14px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.crb-desc { font-size: 10px; color: rgba(255,255,255,0.65); font-weight: 500; margin-top: 2px; }
.crb-arrow { color: rgba(255,255,255,0.6); flex-shrink: 0; transition: transform 0.2s; }
.cashregister-btn:hover .crb-arrow { transform: translateX(3px); }

/* 分割线 */
.action-hub::after {
  content: '';
  display: block;
  width: 1px;
  height: 52px;
  background: var(--border);
  flex-shrink: 0;
}

/* 快捷入口 grid */
.quick-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 12px 4px 10px;
  border-radius: 16px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
}
.quick-item:hover {
  background: var(--gray);
  border-color: var(--border);
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.06);
}

.quick-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.23,1,0.32,1);
}
.quick-item:hover .quick-icon-wrap { transform: scale(1.1) rotate(-5deg); }

.quick-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--mid);
  letter-spacing: -0.01em;
  text-align: center;
  white-space: nowrap;
}
.quick-item:hover .quick-label { color: var(--dark); }

/* flow-card */
.flow-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 32px 36px;
}

.card-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

/* ── Goods Ranking ── */
.rank-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 32px 36px;
}

.rank-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: var(--dim);
  font-weight: 500;
}

.rank-list { display: flex; flex-direction: column; gap: 10px; }

.rank-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rank-no {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--gray);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: var(--dim);
  flex-shrink: 0;
}
.rank-top1 { background: #FFD700; color: #7a5c00; }
.rank-top2 { background: #C0C0C0; color: #4a4a4a; }
.rank-top3 { background: #CD7F32; color: #fff; }

.rank-name {
  width: 160px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rank-name > span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-spec {
  font-size: 10px;
  font-weight: 600;
  color: var(--dim);
  background: var(--faint);
  border-radius: 4px;
  padding: 1px 6px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-bar-wrap {
  flex: 1;
  height: 8px;
  background: var(--gray);
  border-radius: 999px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  background: linear-gradient(90deg, #0071e3, #34d399);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.23,1,0.32,1);
}

.rank-val {
  width: 110px;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  color: #0071e3;
  flex-shrink: 0;
}

/* ── Flow ── */
.btn-close-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gray);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mid);
  transition: background 0.15s;
}
.btn-close-sm:hover { background: var(--gray-2); color: var(--dark); }

.flow-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.tag-green { background: rgba(52,211,153,0.1); color: #16a34a; }
.tag-red   { background: rgba(239,68,68,0.1);  color: #dc2626; }
.tag-blue  { background: rgba(0,113,227,0.08); color: #0071e3; }

:deep(.el-table) { border-radius: 16px; overflow: hidden; }
:deep(.el-table th) { background: var(--gray) !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mid); }
:deep(.el-table td) { font-size: 13px; font-weight: 500; }

@media (max-width: 1200px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .quick-grid { grid-template-columns: repeat(4, 1fr); }
  .action-hub { flex-wrap: wrap; }
  .cashregister-btn { width: 100%; }
}

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .quick-grid { grid-template-columns: repeat(4, 1fr); }
  .page-title { font-size: 36px; }
  .header-actions { display: none; }
  .metric-value { font-size: 40px; }

}


/* ── Guide Module (inline card) ── */
.guide-module {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 32px 36px;
}
.guide-module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.guide-module-progress { display: flex; align-items: center; gap: 12px; }
.gmp-bar-wrap { width: 120px; height: 4px; background: var(--faint); border-radius: 999px; overflow: hidden; }
.gmp-bar { height: 100%; background: #0071e3; border-radius: 999px; transition: width 0.5s cubic-bezier(0.23,1,0.32,1); }
.gmp-label { font-size: 11px; font-weight: 700; color: var(--dim); white-space: nowrap; }

.guide-steps-row {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.guide-step-pill { display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
.gsp-no {
  width: 28px; height: 28px; border-radius: 9px;
  background: var(--faint); color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0; transition: all 0.2s;
}
.guide-step-pill.active .gsp-no { background: #0071e3; color: white; box-shadow: 0 4px 12px rgba(0,113,227,0.3); }
.guide-step-pill.done .gsp-no { background: #16a34a; color: white; }
.gsp-title { font-size: 12px; font-weight: 600; color: var(--dim); white-space: nowrap; transition: color 0.2s; }
.guide-step-pill.active .gsp-title { color: #0071e3; font-weight: 700; }
.guide-step-pill.done .gsp-title { color: #16a34a; }
.gsp-connector { width: 32px; height: 2px; background: var(--faint); margin: 0 8px; border-radius: 999px; flex-shrink: 0; transition: background 0.3s; }
.gsp-connector.done { background: #16a34a; }

.guide-detail {
  display: grid; grid-template-columns: 1fr 200px; gap: 32px;
  padding-top: 20px; border-top: 1px solid var(--border);
}
.guide-step-num {
  font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em;
  color: #0071e3; background: rgba(0,113,227,0.08);
  display: inline-block; padding: 4px 10px; border-radius: 999px; margin-bottom: 10px;
}
.guide-step-name { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; color: var(--dark); margin-bottom: 6px; }
.guide-step-desc { font-size: 12px; line-height: 1.6; color: var(--mid); margin: 0 0 12px; }
.guide-action-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.guide-action-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--gray); border-radius: 12px; }
.gar-num {
  width: 20px; height: 20px; border-radius: 6px; background: #0071e3; color: white;
  font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.gar-text { font-size: 13px; font-weight: 500; color: var(--dark); line-height: 1.5; }
.guide-tip-inline {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: var(--mid); line-height: 1.6;
  padding: 10px 14px; background: rgba(0,113,227,0.06);
  border-radius: 12px; border: 1px solid rgba(0,113,227,0.15);
}
.guide-tip-inline svg { flex-shrink: 0; margin-top: 1px; color: #0071e3; }
.guide-detail-right { display: flex; flex-direction: column; gap: 10px; justify-content: flex-start; padding-top: 4px; }
.guide-goto-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px; background: #0071e3; color: white; border: none;
  border-radius: 16px; font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1); box-shadow: 0 6px 20px rgba(0,113,227,0.25);
}
.guide-goto-btn:hover { background: rgba(0,113,227,0.88); transform: scale(0.98); }
.guide-nav-btns { display: flex; gap: 8px; }
.gnb-prev {
  flex: 1; padding: 10px 8px; background: var(--gray); border: none; border-radius: 12px;
  font-size: 12px; font-weight: 600; color: var(--mid); cursor: pointer; transition: all 0.2s;
}
.gnb-prev:hover:not(:disabled) { background: var(--gray-2); color: var(--dark); }
.gnb-prev:disabled { opacity: 0.3; cursor: not-allowed; }
.gnb-next {
  flex: 2; padding: 10px 8px; background: var(--dark); border: none; border-radius: 12px;
  font-size: 12px; font-weight: 700; color: var(--gray); cursor: pointer; transition: all 0.2s;
}
.gnb-finish { flex: 2; padding: 10px 8px; background: #16a34a; border: none; border-radius: 12px; font-size: 12px; font-weight: 700; color: white; cursor: pointer; }

@media (max-width: 900px) {
  .guide-detail { grid-template-columns: 1fr; }
  .gsp-connector { width: 18px; margin: 0 4px; }
}

</style>
