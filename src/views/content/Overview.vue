<template>
  <div class="co-page">

    <section class="metrics-row">
      <div v-for="m in METRICS" :key="m.id" class="metric-card" :style="{ '--ac': m.color }">
        <div class="metric-icon">{{ m.emoji }}</div>
        <div class="metric-body">
          <div class="metric-val">{{ m.value }}</div>
          <div class="metric-label">{{ m.label }}</div>
        </div>
        <div class="metric-trend" :class="m.up ? 'trend-up' : 'trend-flat'">{{ m.trend }}</div>
      </div>
    </section>

    <section class="mid-row">
      <article class="panel channel-panel">
        <div class="panel-hd">
          <div class="panel-title">渠道接入状态</div>
          <span class="connected-badge">
            {{ channels.filter(c => c.connected).length }} / {{ channels.length }} 已接入
          </span>
        </div>
        <div class="channel-grid">
          <div v-for="c in channels" :key="c.id" class="ch-dot">
            <div class="ch-icon" :style="{ background: c.connected ? c.color : '#e2e8f0' }">{{ c.emoji }}</div>
            <div class="ch-name">{{ c.name }}</div>
            <div class="ch-status" :class="c.connected ? 'cs-on' : 'cs-off'">
              {{ c.connected ? '已接入' : '未接入' }}
            </div>
          </div>
        </div>
        <button class="link-btn" @click="router.push('/content/channels')">
          {{ channels.some(c => c.connected) ? '管理渠道接入 →' : '接入第一个渠道 →' }}
        </button>
      </article>

      <article class="panel calendar-panel">
        <div class="panel-hd">
          <div class="panel-title">近期发布计划</div>
          <button class="link-btn" @click="router.push('/content/calendar')">查看全部 →</button>
        </div>
        <div class="plan-list">
          <div v-for="p in PLANS" :key="p.id" class="plan-item">
            <div class="plan-left">
              <span class="plan-ch">{{ p.chEmoji }}</span>
              <div>
                <div class="plan-title">{{ p.title }}</div>
                <div class="plan-meta">{{ p.date }} · {{ p.channel }}</div>
              </div>
            </div>
            <span class="plan-status" :class="'ps-' + p.status">{{ STATUS_LABEL[p.status] }}</span>
          </div>
        </div>
      </article>
    </section>

    <section class="agents-row">
      <div class="panel-title" style="margin-bottom:12px">AI 内容专员</div>
      <div class="agents-grid">
        <div v-for="a in AGENTS" :key="a.id" class="agent-card" :style="{ '--ac': a.color, '--ac-bg': a.colorBg }">
          <div class="agent-hd">
            <div class="agent-icon">{{ a.emoji }}</div>
            <div>
              <div class="agent-name">{{ a.name }}</div>
              <div class="agent-role">{{ a.role }}</div>
            </div>
          </div>
          <div class="agent-desc">{{ a.desc }}</div>
          <button class="wake-btn" @click="wakeAgent(a)">派发任务 →</button>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useChannels } from '@/composables/useChannels'

const router = useRouter()
const { channels } = useChannels()

const METRICS = [
  { id: 'fans',    emoji: '👥', color: '#8b5cf6', value: '—',  label: '全渠道粉丝', trend: '渠道接入后显示', up: false },
  { id: 'posts',   emoji: '📝', color: '#f59e0b', value: '—',  label: '本月发布内容', trend: '渠道接入后显示', up: false },
  { id: 'reads',   emoji: '👁',  color: '#0ea5e9', value: '—',  label: '本月总阅读量', trend: '渠道接入后显示', up: false },
  { id: 'engage',  emoji: '💬', color: '#10b981', value: '—',  label: '互动率', trend: '渠道接入后显示', up: false },
]

const PLANS = [
  { id: 1, chEmoji: '📗', channel: '公众号', title: '品牌故事系列 · 第一篇', date: '今天', status: 'draft' },
  { id: 2, chEmoji: '📕', channel: '小红书', title: '产品体验测评笔记', date: '明天', status: 'scheduled' },
  { id: 3, chEmoji: '🎵', channel: '抖音号', title: '工厂溯源短视频', date: '后天', status: 'scheduled' },
]

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿', scheduled: '待发布', published: '已发布',
}

const AGENTS = [
  {
    id: 'content_strategist', emoji: '💎', name: 'Iris', role: '内容策略师',
    color: '#8b5cf6', colorBg: 'rgba(139,92,246,0.08)',
    desc: '规划内容矩阵、选题方向，结合品牌调性制定各渠道差异化内容策略。',
  },
  {
    id: 'content_writer', emoji: '✍️', name: 'Maya', role: '文案专员',
    color: '#f59e0b', colorBg: 'rgba(245,158,11,0.08)',
    desc: '公众号长文、小红书笔记、视频脚本，批量生产符合各渠道风格的内容。',
  },
  {
    id: 'content_creative', emoji: '🎨', name: '创意部', role: '视觉创意',
    color: '#ef4444', colorBg: 'rgba(239,68,68,0.08)',
    desc: '海报设计方向、封面图风格、短视频视觉语言，让内容颜值在线。',
  },
]

const WAKE_PROMPTS: Record<string, string> = {
  content_strategist: 'Iris，帮我规划下个月各渠道的内容方向，结合近期热点和品牌调性给出选题清单。',
  content_writer: 'Maya，帮我写一篇适合公众号发布的品牌故事文章，字数1500字左右，风格真诚有温度。',
  content_creative: '创意部，帮我出本月小红书主图的视觉风格方向，给3个不同的风格参考。',
}

function wakeAgent(a: typeof AGENTS[0]) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: WAKE_PROMPTS[a.id] }))
  router.push(`/content/agent?spec=${a.id}`)
}
</script>

<style scoped>
.co-page { display: flex; flex-direction: column; gap: 16px; }

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  background: #fff;
  border: 1px solid rgba(148,163,184,0.14);
  border-left: 3px solid var(--ac);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(15,23,42,0.04);
}

.metric-icon { font-size: 22px; }
.metric-body { flex: 1; }
.metric-val { font-size: 20px; font-weight: 800; color: #0f172a; }
.metric-label { font-size: 11px; color: #64748b; margin-top: 2px; }
.metric-trend { font-size: 10px; color: #94a3b8; white-space: nowrap; }
.trend-up { color: #10b981; }
.trend-flat { color: #94a3b8; }

.mid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(15,23,42,0.05);
}

.panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title { font-size: 14px; font-weight: 700; color: #0f172a; }

.connected-badge {
  font-size: 11px; color: #64748b;
  background: #f1f5f9; padding: 3px 8px; border-radius: 999px;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.ch-dot { display: flex; flex-direction: column; align-items: center; gap: 4px; }

.ch-icon {
  width: 38px; height: 38px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; transition: background 0.2s;
}

.ch-name { font-size: 11px; color: #334155; font-weight: 600; text-align: center; }
.ch-status { font-size: 10px; padding: 2px 6px; border-radius: 999px; }
.cs-on  { background: rgba(16,185,129,0.1); color: #059669; }
.cs-off { background: rgba(148,163,184,0.1); color: #94a3b8; }

.link-btn {
  border: none; background: none;
  font-size: 12px; font-weight: 600; color: #7c3aed;
  cursor: pointer; padding: 0;
}
.link-btn:hover { text-decoration: underline; }

.plan-list { display: flex; flex-direction: column; gap: 8px; }

.plan-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 12px; background: #f8fafc;
}

.plan-left { display: flex; align-items: center; gap: 10px; }
.plan-ch { font-size: 18px; }
.plan-title { font-size: 12px; font-weight: 600; color: #0f172a; }
.plan-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.plan-status { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
.ps-draft      { background: rgba(148,163,184,0.12); color: #64748b; }
.ps-scheduled  { background: rgba(245,158,11,0.1); color: #d97706; }
.ps-published  { background: rgba(16,185,129,0.1); color: #059669; }

.agents-row { }

.agents-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.agent-card {
  background: #fff;
  border: 1px solid rgba(148,163,184,0.14);
  border-left: 3px solid var(--ac);
  border-radius: 20px;
  padding: 18px;
  display: flex; flex-direction: column; gap: 10px;
  box-shadow: 0 4px 20px rgba(15,23,42,0.05);
}

.agent-hd { display: flex; align-items: center; gap: 10px; }
.agent-icon { font-size: 22px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--ac-bg); flex-shrink: 0; }
.agent-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.agent-role { font-size: 11px; color: #64748b; }
.agent-desc { font-size: 12px; line-height: 1.6; color: #475569; background: #f8fafc; padding: 10px 12px; border-radius: 12px; flex: 1; }

.wake-btn {
  align-self: flex-end;
  border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px; padding: 6px 14px;
  font-size: 12px; font-weight: 600; color: #7c3aed;
  background: rgba(124,58,237,0.06); cursor: pointer; transition: background 0.15s;
}
.wake-btn:hover { background: rgba(124,58,237,0.12); }
</style>
