<template>
  <div class="overview-page">

    <section class="specs-grid">
      <div
        v-for="spec in SPECS"
        :key="spec.id"
        class="spec-card"
        :style="{ '--accent': spec.color, '--accent-bg': spec.colorBg }"
      >
        <div class="spec-hd">
          <div class="spec-icon">{{ spec.emoji }}</div>
          <div class="spec-info">
            <div class="spec-name">{{ spec.name }}</div>
            <div class="spec-tag">{{ spec.tagline }}</div>
          </div>
          <div class="spec-status" :class="spec.ready ? 'status-on' : 'status-idle'">
            {{ spec.ready ? '就绪' : '待接入' }}
          </div>
        </div>
        <div class="spec-insight" :class="'tone-' + spec.tone">
          {{ spec.insight }}
        </div>
        <div class="spec-ft">
          <button class="wake-btn" @click="wakeSpec(spec)">派发任务 →</button>
        </div>
      </div>
    </section>

    <section class="bottom-row">
      <article class="panel todo-panel">
        <div class="panel-title">快速开始</div>
        <div class="todo-list">
          <div v-for="item in TODOS" :key="item.id" class="todo-item">
            <div class="todo-left">
              <span class="todo-dot" :style="{ background: item.color }"></span>
              <span class="todo-text">{{ item.text }}</span>
            </div>
            <button class="todo-btn" @click="handleTodo(item)">{{ item.action }}</button>
          </div>
        </div>
      </article>

      <article class="panel platform-panel">
        <div class="panel-hd">
          <div class="panel-title">平台接入状态</div>
          <span class="connected-count">
            {{ platforms.filter(p => p.connected).length }} / {{ platforms.length }} 已接入
          </span>
        </div>
        <div class="platform-grid">
          <div v-for="p in platforms" :key="p.id" class="platform-dot">
            <div class="pdot-icon" :style="{ background: p.connected ? p.color : '#e2e8f0' }">
              {{ p.emoji }}
            </div>
            <div class="pdot-name">{{ p.name }}</div>
            <div class="pdot-status" :class="p.connected ? 'p-on' : 'p-off'">
              {{ p.connected ? '已接入' : '未接入' }}
            </div>
          </div>
        </div>
        <button class="link-btn" @click="router.push('/ecommerce/platforms')">
          {{ platforms.some(p => p.connected) ? '管理平台接入 →' : '接入第一个平台 →' }}
        </button>
      </article>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlatforms } from '@/composables/usePlatforms'

const router = useRouter()
const { platforms } = usePlatforms()

const SPECS = [
  {
    id: 'ops_data', emoji: '📊', name: '数据官',
    color: '#0ea5e9', colorBg: 'rgba(14,165,233,0.08)',
    tagline: '监控销售与平台异常',
    ready: false,
    insight: '平台接入后自动启动，实时监控各平台销售异常、退货率波动、订单趋势，主动推送预警。',
    tone: 'idle',
  },
  {
    id: 'ops_restock', emoji: '📦', name: '补货专员',
    color: '#f97316', colorBg: 'rgba(249,115,22,0.08)',
    tagline: '库存分析 + 采购草稿',
    ready: true,
    insight: '现在就能查 ERP 库存预警、分析周转天数、生成补货建议。平台接入后联动各平台销量，补货更准。',
    tone: 'teal',
  },
  {
    id: 'ops_customer', emoji: '🤝', name: '客户运营',
    color: '#8b5cf6', colorBg: 'rgba(139,92,246,0.08)',
    tagline: '客户分层 + 跟进策略',
    ready: true,
    insight: '现在就能对 ERP 客户做 RFM 分层、整理跟进清单、制定私域运营方案。平台接入后补充电商买家数据。',
    tone: 'teal',
  },
  {
    id: 'ops_promo', emoji: '🎯', name: '活动策划',
    color: '#ef4444', colorBg: 'rgba(239,68,68,0.08)',
    tagline: '促销方案 + GMV预测',
    ready: true,
    insight: '现在就能基于行业规律和 ERP 历史销售数据策划促销方案。平台接入后结合各平台 GMV 精算投入产出。',
    tone: 'teal',
  },
]

const TODOS = [
  {
    id: 1, color: '#0ea5e9',
    text: '接入第一个平台，解锁数据官实时监控',
    action: '去接入',
    route: '/ecommerce/platforms',
    prompt: '',
  },
  {
    id: 2, color: '#f97316',
    text: '让补货专员查一下当前 ERP 库存预警',
    action: '去工作台',
    route: '/ecommerce/agent',
    spec: 'ops_restock',
    prompt: '补货专员，帮我查一下当前 ERP 库存预警，哪些商品库存不足，按紧急程度排序。',
  },
  {
    id: 3, color: '#ef4444',
    text: '让活动策划专员出一个近期促销方案',
    action: '去工作台',
    route: '/ecommerce/agent',
    spec: 'ops_promo',
    prompt: '活动策划，结合当前销售情况和近期电商节点，给我3个可以立即执行的促销方案。',
  },
]

const WAKE_PROMPTS: Record<string, string> = {
  ops_data: '数据官，帮我分析一下当前运营数据，有什么异常需要关注？',
  ops_restock: '补货专员，帮我查一下当前库存预警，哪些商品需要优先补货？',
  ops_customer: '客户运营，帮我分析一下客户分层情况，哪些客户需要重点跟进？',
  ops_promo: '活动策划，帮我出一个近期可以执行的促销活动方案。',
}

function wakeSpec(spec: typeof SPECS[0]) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: WAKE_PROMPTS[spec.id] }))
  router.push(`/ecommerce/agent?spec=${spec.id}`)
}

function handleTodo(item: typeof TODOS[0]) {
  if (item.prompt) {
    window.dispatchEvent(new CustomEvent('captain-fill', { detail: item.prompt }))
  }
  if (item.route) {
    const query = (item as any).spec ? `?spec=${(item as any).spec}` : ''
    router.push(item.route + query)
  }
}
</script>

<style scoped>
.overview-page { display: flex; flex-direction: column; gap: 16px; }

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.spec-card {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-left: 3px solid var(--accent);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-hd { display: flex; align-items: center; gap: 10px; }

.spec-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--accent-bg);
  flex-shrink: 0;
}

.spec-info { flex: 1; }
.spec-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.spec-tag { font-size: 11px; color: #64748b; margin-top: 2px; }

.spec-status {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.status-on { background: rgba(16, 185, 129, 0.1); color: #059669; }
.status-idle { background: rgba(148, 163, 184, 0.12); color: #64748b; }

.spec-insight {
  font-size: 12px;
  line-height: 1.6;
  padding: 10px 12px;
  border-radius: 12px;
  flex: 1;
}
.tone-teal { background: rgba(13, 148, 136, 0.07); color: #0f766e; }
.tone-idle { background: #f8fafc; color: #64748b; }

.spec-ft { display: flex; justify-content: flex-end; }

.wake-btn {
  border: 1px solid rgba(13, 148, 136, 0.2);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #0f766e;
  background: rgba(13, 148, 136, 0.06);
  cursor: pointer;
  transition: background 0.15s;
}
.wake-btn:hover { background: rgba(13, 148, 136, 0.12); }

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
.platform-panel .panel-title { margin-bottom: 0; }

.connected-count {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 999px;
}

.todo-list { display: flex; flex-direction: column; gap: 10px; }

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.todo-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.todo-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.todo-text { font-size: 12px; color: #334155; }

.todo-btn {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #334155;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.todo-btn:hover { background: #f1f5f9; }

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.platform-dot { display: flex; flex-direction: column; align-items: center; gap: 4px; }

.pdot-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background 0.2s;
}

.pdot-name { font-size: 11px; color: #334155; font-weight: 600; }

.pdot-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
}
.p-on { background: rgba(16, 185, 129, 0.1); color: #059669; }
.p-off { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }

.link-btn {
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: #0f766e;
  cursor: pointer;
  padding: 0;
}
.link-btn:hover { text-decoration: underline; }
</style>
