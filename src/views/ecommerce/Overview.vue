<template>
  <div class="ops-dashboard">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="hero-kicker">线上电商运营</span>
        <h1>先看平台、订单、库存，再把动作交给管家。</h1>
        <p>
          这里的主轴还是线上电商运营。平台接入、订单处理、库存同步、活动动作放前面；客户和线下作为辅助，不再抢主线。
        </p>
      </div>
      <div class="hero-actions">
        <button class="hero-btn hero-btn-primary" @click="sendCaptainPrompt('分析今天的销售、库存预警和待处理事项，给我一个简短行动建议')">
          让管家做晨报
        </button>
        <button class="hero-btn" @click="router.push('/dashboard')">进入 ERP 首页</button>
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
            <div class="panel-title">线上关键提醒</div>
            <div class="panel-sub">优先从订单、库存和待处理事项里找今天最该动的点。</div>
          </div>
          <button class="panel-link" @click="sendCaptainPrompt('把当前关键提醒按优先级排一下，并告诉我先做哪三件事')">交给管家判断</button>
        </div>
        <div class="signal-list">
          <div v-for="signal in signals" :key="signal.title" class="signal-item">
            <span class="signal-dot" :class="signal.tone"></span>
            <div class="signal-body">
              <div class="signal-title">{{ signal.title }}</div>
              <div class="signal-desc">{{ signal.desc }}</div>
            </div>
            <button class="signal-action" @click="signal.action()">处理</button>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">线上运营动作</div>
            <div class="panel-sub">平台、订单、库存是主轴，动作都回到原有模块或管家。</div>
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
            <div class="panel-title">库存预警前排</div>
            <div class="panel-sub">线上单量起来后，先盯最紧急的商品，再决定是否补货。</div>
          </div>
          <button class="panel-link" @click="router.push('/warehouse/warning')">查看全部</button>
        </div>
        <div v-if="loading" class="empty-state">加载中...</div>
        <div v-else-if="warnings.length === 0" class="empty-state">当前没有库存预警。</div>
        <div v-else class="warning-list">
          <div v-for="item in warnings" :key="`${item.goods_name}-${item.warehouse_name}`" class="warning-item">
            <div>
              <div class="warning-title">{{ item.goods_name }}</div>
              <div class="warning-meta">{{ item.warehouse_name || '未分仓' }} · 当前 {{ item.stock_num }} / 最低 {{ item.min_num }}</div>
            </div>
            <button class="signal-action" @click="sendCaptainPrompt(`针对商品${item.goods_name}做补货判断，并告诉我是否需要生成采购草稿`)">
              补货判断
            </button>
          </div>
        </div>
      </article>

      <article class="panel steward-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">运营专员团队</div>
            <div class="panel-sub">线上运营仍然有人，只是统一挂在 ERP 管家下面协同工作。</div>
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
const loading = ref(false)
const metrics = ref({
  todaySales: 0,
  todayOrders: 0,
  customerCount: 0,
  lowStockCount: 0,
  pendingContracts: 0,
  pendingShipments: 0,
})
const warnings = ref<any[]>([])

const kpis = computed(() => [
  {
    key: 'sales',
    label: '今日线上销售',
    value: `¥${metrics.value.todaySales.toFixed(2)}`,
    sub: `今日订单 ${metrics.value.todayOrders} 笔`,
    tag: '经营',
    tone: 'teal',
    path: '/dashboard/today-sales',
  },
  {
    key: 'warning',
    label: '库存预警',
    value: String(metrics.value.lowStockCount),
    sub: metrics.value.lowStockCount > 0 ? '建议优先检查预警商品' : '当前库存状态平稳',
    tag: metrics.value.lowStockCount > 0 ? '需处理' : '正常',
    tone: metrics.value.lowStockCount > 0 ? 'amber' : 'slate',
    path: '/warehouse/warning',
  },
  {
    key: 'contracts',
    label: '待处理单据',
    value: String(metrics.value.pendingContracts),
    sub: '先清理待处理，再看增长动作',
    tag: '审核',
    tone: 'slate',
    path: '/sale/contract',
  },
  {
    key: 'customers',
    label: '客户沉淀',
    value: String(metrics.value.customerCount),
    sub: '进入客户管理继续跟进',
    tag: '客户',
    tone: 'teal',
    path: '/sale/client',
  },
])

const signals = computed(() => {
  const items = []
  if (metrics.value.lowStockCount > 0) {
    items.push({
      title: `有 ${metrics.value.lowStockCount} 个商品库存预警`,
      desc: '线上缺货最伤转化，先看库存预警页，再决定是否生成补货建议或采购草稿。',
      tone: 'danger',
      action: () => router.push('/warehouse/warning'),
    })
  }
  if (metrics.value.pendingContracts > 0) {
    items.push({
      title: `有 ${metrics.value.pendingContracts} 份合同待审核`,
      desc: '线上运营节奏里，待处理单据会拖慢发货和判断，建议先清理。',
      tone: 'warn',
      action: () => router.push('/sale/contract'),
    })
  }
  items.push({
    title: `当前沉淀 ${metrics.value.customerCount} 位客户`,
    desc: '客户和私域是辅助链路，想做跟进时再回客户模块，不抢线上主轴。',
    tone: 'safe',
    action: () => router.push('/sale/client'),
  })
  if (items.length === 1) {
    items.push({
      title: '今日经营面相对平稳',
      desc: '可以让管家从销售、库存、客户三个角度给你补一版运营建议。',
      tone: 'safe',
      action: () => sendCaptainPrompt('从销售、库存、客户三个角度给我一版今日运营建议'),
    })
  }
  return items
})

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
    desc: '看销售、订单、库存异常，输出经营判断。',
    prompt: '切到数据官模式，帮我看今天销售、库存预警和异常点。',
  },
  {
    emoji: '📦',
    title: '补货专员模式',
    desc: '根据库存预警和销量判断是否补货。',
    prompt: '切到补货专员模式，分析当前库存预警并给我补货建议。',
  },
  {
    emoji: '🎯',
    title: '活动策划模式',
    desc: '围绕客户和销售目标生成活动动作。',
    prompt: '切到活动策划模式，结合现有客户和销售情况给我一个近期活动建议。',
  },
]

function sendCaptainPrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: prompt }))
}

async function loadData() {
  loading.value = true
  const today = new Date().toISOString().slice(0, 10)
  try {
    const [saleRes, retailRes, customerRes, warningRes, contractRes] = await Promise.allSettled([
      http.get('/stock/SaleOutOrder/index', { params: { list_rows: 200, out_date: today } }),
      http.get('/retail/order/index', { params: { list_rows: 200, order_date: today } }),
      http.get('/shop/ShopCustomer/index', { params: { list_rows: 1 } }),
      http.get('/stock/StockWarning/index', { params: { list_rows: 8 } }),
      http.get('/shop/ContractOrder/index', { params: { list_rows: 200 } }),
    ])

    const rows = (result: PromiseSettledResult<any>) =>
      result.status === 'fulfilled' ? (result.value?.data?.rows ?? result.value?.rows ?? []) : []
    const total = (result: PromiseSettledResult<any>) =>
      result.status === 'fulfilled' ? Number(result.value?.data?.total ?? result.value?.total ?? 0) : 0

    const saleRows = rows(saleRes).filter((item: any) => Number(item.status) === 1)
    const retailRows = rows(retailRes).filter((item: any) => Number(item.status) === 1)
    const todaySales = saleRows.reduce((sum: number, item: any) => {
      const amount = item.after_discount != null && item.after_discount !== '' ? Number(item.after_discount) : Number(item.total_amount || 0)
      return sum + amount
    }, 0) + retailRows.reduce((sum: number, item: any) => sum + Number(item.pay_amount || item.total_amount || 0), 0)

    const contractRows = rows(contractRes)
    metrics.value = {
      todaySales,
      todayOrders: saleRows.length + retailRows.length,
      customerCount: total(customerRes),
      lowStockCount: total(warningRes) || rows(warningRes).length,
      pendingContracts: contractRows.filter((item: any) => Number(item.status) === 0).length,
      pendingShipments: 0,
    }
    warnings.value = rows(warningRes).slice(0, 6)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
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

.signal-list,
.warning-list,
.mode-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signal-item,
.warning-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
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
.warning-title,
.action-title,
.mode-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.signal-desc,
.warning-meta,
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
