<template>
  <div class="ops-dashboard">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="hero-kicker">线上电商运营</span>
        <h1>先看平台、订单、库存，再把动作交给管家。</h1>
        <p>
          这里的总览只看电商运营数据，不再混读 ERP 线下销售、客户和仓库数据。平台接入、订单处理、库存同步、活动动作放前面；客户和线下作为辅助。
        </p>
      </div>
      <div class="hero-actions">
        <button class="hero-btn hero-btn-primary" @click="sendCaptainPrompt('基于当前线上电商运营数据，给我一个简短行动建议')">
          让管家做电商晨报
        </button>
        <button class="hero-btn" @click="router.push('/ecommerce/orders')">进入订单中心</button>
      </div>
    </section>

    <section class="kpi-grid">
      <article v-for="item in kpis" :key="item.key" class="kpi-card" @click="router.push(item.path)">
        <div class="kpi-head">
          <span class="kpi-label">{{ item.label }}</span>
          <span class="kpi-badge" :class="item.tone">{{ item.tag }}</span>
        </div>
        <div class="kpi-value">{{ item.value }}</div>
        <div class="kpi-sub">{{ item.sub }}</div>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">平台概况</div>
            <div class="panel-sub">只展示线上平台状态，不再掺 ERP 线下业务数字。</div>
          </div>
          <button class="panel-link" @click="router.push('/ecommerce/platforms')">查看平台管理</button>
        </div>
        <div v-if="loadingPlatforms" class="empty-state">加载中...</div>
        <div v-else class="platform-grid">
          <div v-for="platform in platforms" :key="platform.id || platform.name" class="platform-card">
            <div class="platform-head">
              <div class="platform-name">{{ platform.name }}</div>
              <span class="platform-badge" :class="platform.connected ? 'ok' : 'idle'">
                {{ platform.connected ? '已接入' : '未接入' }}
              </span>
            </div>
            <div class="platform-meta">
              <span>店铺：{{ platform.shopName || platform.shop_name || '未配置' }}</span>
              <span>同步：{{ platform.syncCycle || platform.sync_cycle || '未设置' }}</span>
            </div>
            <div class="platform-stats">
              <div class="platform-stat">
                <small>今日订单</small>
                <strong>{{ platform.orders ?? 0 }}</strong>
              </div>
              <div class="platform-stat">
                <small>今日销售</small>
                <strong>¥{{ formatMoney(platform.sales ?? 0) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">线上运营动作</div>
            <div class="panel-sub">平台、订单、库存是主轴，动作都回到电商模块或管家。</div>
          </div>
        </div>
        <div class="action-grid">
          <button v-for="item in actionItems" :key="item.title" class="action-card" @click="item.action()">
            <div class="action-icon">{{ item.icon }}</div>
            <div class="action-title">{{ item.title }}</div>
            <div class="action-desc">{{ item.desc }}</div>
          </button>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">电商提醒</div>
            <div class="panel-sub">基于电商总览接口返回的提醒，不再读 ERP 线下预警。</div>
          </div>
          <button class="panel-link" @click="sendCaptainPrompt('根据当前线上电商数据，帮我排一个今天的处理优先级')">交给管家排优先级</button>
        </div>
        <div v-if="loadingAlerts" class="empty-state">加载中...</div>
        <div v-else class="signal-list">
          <div v-for="alert in alerts" :key="alert.title" class="signal-item">
            <span class="signal-dot" :class="alert.tone"></span>
            <div class="signal-body">
              <div class="signal-title">{{ alert.title }}</div>
              <div class="signal-desc">{{ alert.desc }}</div>
            </div>
            <button class="signal-action" @click="alert.action()">处理</button>
          </div>
        </div>
      </article>

      <article class="panel steward-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">运营专员团队</div>
            <div class="panel-sub">线上运营有人负责，只是统一挂在 ERP 管家下面协同工作。</div>
          </div>
        </div>
        <div class="mode-list">
          <button v-for="mode in captainModes" :key="mode.title" class="mode-card" @click="sendCaptainPrompt(mode.prompt)">
            <div class="mode-emoji">{{ mode.emoji }}</div>
            <div class="mode-title">{{ mode.title }}</div>
            <div class="mode-desc">{{ mode.desc }}</div>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()
const loadingPlatforms = ref(false)
const loadingOrders = ref(false)
const loadingAlerts = ref(false)


const kpiState = ref({
  todayOrders: 0,
  todaySales: 0,
  lowStockCount: 0,
  pendingOrders: 0,
})

const platforms = ref<any[]>([])
const alerts = ref<Array<{ title: string; desc: string; tone: 'danger' | 'warn' | 'safe'; action: () => void }>>([])

const kpis = computed(() => [
  {
    key: 'sales',
    label: '今日线上销售',
    value: `¥${formatMoney(kpiState.value.todaySales)}`,
    sub: `今日订单 ${kpiState.value.todayOrders} 笔`,
    tag: '经营',
    tone: 'teal',
    path: '/ecommerce/orders',
  },
  {
    key: 'pending',
    label: '待处理订单',
    value: String(kpiState.value.pendingOrders),
    sub: '优先清理待发货与异常单',
    tag: '订单',
    tone: kpiState.value.pendingOrders > 0 ? 'amber' : 'slate',
    path: '/ecommerce/orders',
  },
  {
    key: 'warning',
    label: '库存同步风险',
    value: String(kpiState.value.lowStockCount),
    sub: kpiState.value.lowStockCount > 0 ? '建议优先检查补货与同步状态' : '当前库存状态平稳',
    tag: '库存',
    tone: kpiState.value.lowStockCount > 0 ? 'amber' : 'slate',
    path: '/ecommerce/stock',
  },
  {
    key: 'platforms',
    label: '已接入平台',
    value: String(platforms.value.filter((item: any) => !!item.connected).length),
    sub: `共 ${platforms.value.length} 个平台入口`,
    tag: '平台',
    tone: 'teal',
    path: '/ecommerce/platforms',
  },
])

const actionItems = [
  {
    icon: '🔗',
    title: '看平台接入',
    desc: '先看各平台接入和同步状态',
    action: () => router.push('/ecommerce/platforms'),
  },
  {
    icon: '📋',
    title: '看订单中心',
    desc: '查看平台订单与待发货',
    action: () => router.push('/ecommerce/orders'),
  },
  {
    icon: '📦',
    title: '查库存同步',
    desc: '先看库存风险与补货动作',
    action: () => router.push('/ecommerce/stock'),
  },
  {
    icon: '🤖',
    title: '让管家排线上优先级',
    desc: '自动给出平台、订单、库存的处理顺序',
    action: () => sendCaptainPrompt('根据当前线上电商情况，给我排一个平台、订单、库存的处理优先级'),
  },
]

const captainModes = [
  {
    emoji: '📊',
    title: '数据官模式',
    desc: '看平台销售、订单和库存异常，输出经营判断。',
    prompt: '切到数据官模式，帮我看今天各平台销售、订单和库存异常点。',
  },
  {
    emoji: '📦',
    title: '补货专员模式',
    desc: '根据库存同步和缺货风险判断补货动作。',
    prompt: '切到补货专员模式，结合当前电商库存风险给我补货建议。',
  },
  {
    emoji: '🎯',
    title: '活动策划模式',
    desc: '围绕线上平台和销售目标生成活动动作。',
    prompt: '切到活动策划模式，结合当前线上平台情况给我一个近期活动建议。',
  },
]

function sendCaptainPrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: prompt }))
}

function formatMoney(value: number | string) {
  const num = Number(value || 0)
  return num.toFixed(2)
}

function buildAlertsFromKpi() {
  const items: Array<{ title: string; desc: string; tone: 'danger' | 'warn' | 'safe'; action: () => void }> = []

  if (kpiState.value.pendingOrders > 0) {
    items.push({
      title: `有 ${kpiState.value.pendingOrders} 笔待处理订单`,
      desc: '建议先回订单中心检查待发货、退款或异常订单。',
      tone: 'warn',
      action: () => router.push('/ecommerce/orders'),
    })
  }

  if (kpiState.value.lowStockCount > 0) {
    items.push({
      title: `有 ${kpiState.value.lowStockCount} 项库存同步风险`,
      desc: '建议先回库存同步检查缺货、预警和补货动作。',
      tone: 'danger',
      action: () => router.push('/ecommerce/stock'),
    })
  }

  if (!items.length) {
    items.push({
      title: '当前线上看板相对平稳',
      desc: '可以让管家从平台、订单、库存三个角度补一版电商运营建议。',
      tone: 'safe',
      action: () => sendCaptainPrompt('从平台、订单、库存三个角度给我一版电商运营建议'),
    })
  }

  alerts.value = items
}

async function loadOverview() {
  loadingPlatforms.value = true
  loadingAlerts.value = true
  try {
    const response = await http.post('/erp/ecommerce/overview', {}, { silent: true })
    const data = response.data || {}
    kpiState.value = {
      todayOrders: Number(data.kpi?.todayOrders || 0),
      todaySales: Number(data.kpi?.todaySales || 0),
      lowStockCount: Number(data.kpi?.lowStockCount || 0),
      pendingOrders: Number(data.kpi?.pendingOrders || 0),
    }
    platforms.value = Array.isArray(data.platforms) ? data.platforms : []
    buildAlertsFromKpi()
  } catch {
    kpiState.value = {
      todayOrders: 0,
      todaySales: 0,
      lowStockCount: 0,
      pendingOrders: 0,
    }
    platforms.value = []
    buildAlertsFromKpi()
  } finally {
    loadingPlatforms.value = false
    loadingAlerts.value = false
  }
}

onMounted(() => {
  loadOverview()
})
</script>

<style scoped>
.ops-dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 12px;
}

.hero-card,
.panel,
.kpi-card {
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.18), transparent 30%),
    linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
}

.hero-kicker {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(13, 148, 136, 0.1);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 12px;
}

.hero-copy h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  color: #0f172a;
}

.hero-copy p {
  margin: 12px 0 0;
  max-width: 760px;
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 220px;
}

.hero-btn {
  border: 1px solid rgba(13, 148, 136, 0.18);
  border-radius: 14px;
  background: #fff;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
}

.hero-btn-primary {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  padding: 18px;
  cursor: pointer;
}

.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-label {
  font-size: 13px;
  color: #64748b;
}

.kpi-badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.kpi-badge.teal {
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
}

.kpi-badge.amber {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.kpi-badge.slate {
  background: rgba(148, 163, 184, 0.12);
  color: #475569;
}

.kpi-value {
  margin-top: 18px;
  font-size: 34px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.kpi-sub {
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

.panel {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  padding: 20px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.panel-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.panel-link {
  border: none;
  background: transparent;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.platform-grid,
.signal-list,
.mode-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.platform-card,
.signal-item {
  border-radius: 16px;
  background: #f8fafc;
  padding: 14px;
}

.platform-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.platform-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.platform-badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.platform-badge.ok {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.platform-badge.idle {
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
}

.platform-meta {
  display: flex;
  gap: 14px;
  margin-top: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #64748b;
}

.platform-stats {
  display: flex;
  gap: 20px;
  margin-top: 12px;
}

.platform-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.platform-stat small {
  font-size: 11px;
  color: #94a3b8;
}

.platform-stat strong {
  font-size: 15px;
  color: #0f172a;
}

.signal-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.signal-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.signal-dot.danger {
  background: #ef4444;
}

.signal-dot.warn {
  background: #f59e0b;
}

.signal-dot.safe {
  background: #10b981;
}

.signal-body {
  flex: 1;
  min-width: 0;
}

.signal-title,
.action-title,
.mode-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.signal-desc,
.action-desc,
.mode-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.signal-action {
  border: none;
  border-radius: 12px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 12px;
  cursor: pointer;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-card,
.mode-card {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 16px;
  text-align: left;
  cursor: pointer;
}

.action-icon,
.mode-emoji {
  font-size: 26px;
}

.action-title,
.mode-title {
  margin-top: 12px;
}

.empty-state {
  padding: 26px 0;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

.steward-panel {
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 26%),
    rgba(255, 255, 255, 0.96);
}

@media (max-width: 1200px) {
  .kpi-grid,
  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-card {
    flex-direction: column;
  }

  .hero-actions {
    min-width: 0;
    flex-direction: row;
  }
}
</style>
