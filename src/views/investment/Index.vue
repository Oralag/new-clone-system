<template>
  <div class="obs-home">
    <!-- ── 第一层：亚当生命核心 ── -->
    <div class="layer layer-status">
      <div class="status-card">
        <!-- 极细网格纹理 -->
        <div class="card-grid-texture"></div>

        <div class="status-header">
          <div class="adam-identity">
            <!-- 亚当头像 + 状态光环 -->
            <div class="life-indicator" :class="adamStore.core.status">
              <span class="life-orbit orbit-1"></span>
              <span class="life-orbit orbit-2"></span>
              <img :src="adamAvatarUrl" class="adam-identity-img" alt="亚当" />
            </div>
            <div class="adam-name">
              <span class="name-main">ADAM <span class="name-id">#1</span></span>
              <span class="name-sub">DIGITAL_LIFE · ENTITY_001</span>
            </div>
          </div>
          <div class="header-right">
            <div class="sys-tag" :class="adamStore.core.status">
              <span class="sys-dot"></span>
              <span class="sys-label">{{ sysLabel }}</span>
            </div>
            <button v-if="adamStore.core.status === 'dormant'" class="activate-btn" @click="handleActivate">
              <span class="activate-glow"></span>
              <span class="activate-text">{{ t('investmentHome.activate') }}</span>
            </button>
          </div>
        </div>

        <!-- 核心指标条 -->
        <div class="metrics-strip">
          <div class="metric-block">
            <span class="metric-key">{{ t('investmentHome.netWorth') }}</span>
            <span class="metric-val" :class="{ positive: adamStore.core.netWorth > 0, negative: adamStore.core.netWorth < 0 }">
              ¥{{ adamStore.core.netWorth.toLocaleString() }}
            </span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">{{ t('investmentHome.budget') }}</span>
            <span class="metric-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">{{ t('investmentHome.credit') }}</span>
            <span class="metric-val credit">{{ adamStore.core.creditLevel }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">{{ t('investmentHome.alive') }}</span>
            <span class="metric-val">{{ adamStore.core.survivalDays }}<span class="metric-unit">d</span></span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">{{ t('investmentHome.energy') }}</span>
            <div class="energy-bar-wrap">
              <div class="energy-bar" :style="{ width: adamStore.core.energy + '%' }" :class="{ low: adamStore.core.energy < 30 }"></div>
            </div>
            <span class="metric-val energy-num">{{ adamStore.core.energy }}%</span>
          </div>
        </div>

        <!-- 情绪频谱条 -->
        <div class="emotion-strip">
          <span class="emotion-label">{{ t('investmentHome.emotionSpectrum') }}</span>
          <div class="emotion-bars">
            <div v-for="(val, key) in adamStore.core.emotionState" :key="key" class="emotion-item" :title="emotionLabels[key] || key">
              <div class="emotion-bar-bg">
                <div class="emotion-bar-fill" :style="{ height: Math.max(val, 2) + '%' }" :class="emotionColor(key as string)"></div>
              </div>
              <span class="emotion-name">{{ (emotionLabels[key] || key).slice(0, 2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 第二层：指令 + Trust Ladder + 事件日志 ── -->
    <div class="layer layer-panels">
      <div class="triple-grid">
        <!-- 最新指令 -->
        <div class="panel panel-instruction">
          <div class="panel-head">
            <span class="panel-icon">◈</span>
            <span class="panel-title">{{ t('investmentHome.latestDirective') }}</span>
          </div>
          <div v-if="adamStore.latestRecommendation" class="instruction-card">
            <div class="instruction-glow-bar"></div>
            <div class="instruction-body">
              <div class="instruction-meta">
                <span class="instruction-conf" v-if="adamStore.latestRecommendation.confidence">
                  {{ t('investmentHome.confidencePrefix') }}: {{ (adamStore.latestRecommendation.confidence * 100).toFixed(0) }}%
                </span>
                <span class="instruction-time">{{ formatTime(adamStore.latestRecommendation.issuedAt) }}</span>
              </div>
              <div class="instruction-title">{{ adamStore.latestRecommendation.title }}</div>
              <div class="instruction-thesis">{{ adamStore.latestRecommendation.thesis }}</div>
              <div v-if="adamStore.latestRecommendation.riskNote" class="instruction-risk">
                <span class="risk-icon">⚠</span> {{ adamStore.latestRecommendation.riskNote }}
              </div>
              <div class="instruction-actions">
                <button class="btn-gold" @click="handleAdoptRecommendation">
                  <span class="btn-glow"></span>
                  {{ t('investmentHome.executed') }}
                </button>
                <button class="btn-ghost" @click="handleSkipRecommendation">{{ t('investmentHome.skip') }}</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">◇</div>
            <span class="empty-text">{{ t('investmentHome.awaitingDirective') }}</span>
            <span class="empty-sub">{{ t('investmentHome.awaitingDirectiveSub') }}</span>
          </div>
        </div>

        <!-- Trust Ladder + 待审批操作 -->
        <div class="panel panel-trust">
          <div class="panel-head">
            <span class="panel-icon">⬡</span>
            <span class="panel-title">{{ t('investmentHome.trustLadder') }}</span>
          </div>
          <div class="trust-ladder">
            <div v-for="lvl in creditLevels" :key="lvl.id" class="trust-rung" :class="{ active: lvl.id === adamStore.core.creditLevel, past: isPastLevel(lvl.id), future: isFutureLevel(lvl.id) }">
              <div class="rung-badge">{{ lvl.id }}</div>
              <div class="rung-body">
                <div class="rung-name">{{ lvl.name }}</div>
                <div class="rung-perms">{{ lvl.perm }}</div>
                <div v-if="lvl.id === adamStore.core.creditLevel && nextLevelReq" class="rung-progress">
                  <span class="prog-label">升{{ nextLevel }} 需：</span>
                  <span :class="{ met: (adamStore.core.totalAnalyses ?? 0) >= nextLevelReq.analyses }">
                    分析 {{ adamStore.core.totalAnalyses ?? 0 }}/{{ nextLevelReq.analyses }}
                  </span>
                  · <span :class="{ met: (adamStore.core.survivalDays ?? 0) >= nextLevelReq.days }">
                    存活 {{ adamStore.core.survivalDays }}d/{{ nextLevelReq.days }}d
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- 待审批操作 -->
          <div v-if="pendingAction" class="pending-action">
            <div class="pending-head">
              <span class="pending-icon">◌</span>
              <span class="pending-title">{{ t('investmentHome.pendingApproval') }}</span>
            </div>
            <div class="pending-body">
              <div class="pending-type">{{ pendingAction.type }}</div>
              <div class="pending-amount">{{ pendingAction.amount }} {{ pendingAction.token || 'USDT' }}</div>
              <div class="pending-reason">{{ pendingAction.reason }}</div>
              <div class="pending-time">{{ t('investmentHome.submittedAt') }} {{ formatTime(pendingAction.createdAt) }}</div>
            </div>
            <div class="pending-actions-row">
              <button class="btn-gold btn-sm" @click="handleApprove">{{ t('investmentHome.approve') }}</button>
              <button class="btn-ghost btn-sm" @click="handleReject">{{ t('investmentHome.reject') }}</button>
            </div>
          </div>
        </div>

        <!-- 事件日志 -->
        <div class="panel panel-log">
          <div class="panel-head">
            <span class="panel-icon">◉</span>
            <span class="panel-title">{{ t('investmentHome.eventLog') }}</span>
            <span class="panel-count" v-if="adamStore.recentEvents.length">{{ adamStore.recentEvents.length }}</span>
          </div>
          <div class="event-list">
            <div v-for="(event, idx) in adamStore.recentEvents.slice(0, 12)" :key="event.id" class="event-item">
              <div class="event-timeline">
                <span class="event-dot" :class="event.stage"></span>
                <span v-if="idx < Math.min(adamStore.recentEvents.length, 12) - 1" class="event-line"></span>
              </div>
              <span class="event-time">{{ formatTime(event.at) }}</span>
              <span class="event-stage-tag" :class="event.stage">{{ stageLabel(event.stage) }}</span>
              <span class="event-text">{{ event.title }}</span>
            </div>
            <div v-if="adamStore.recentEvents.length === 0" class="empty-state">
              <div class="empty-icon">○</div>
              <span class="empty-text">{{ t('investmentHome.noEvents') }}</span>
              <span class="empty-sub">{{ t('investmentHome.noEventsSub') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<!-- triple-grid replaces dual-grid -->

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdamStore } from '@/stores/adam'
import { TOKEN_NAME } from '@/config'

const { t } = useI18n()
const adamStore = useAdamStore()

// ── Trust Ladder ─────────────────────────────────────────────────────────────
const creditLevels = computed(() => [
  { id: 'C',  name: t('investmentHome.creditLevels.C'),     perm: t('investmentHome.creditPerms.C') },
  { id: 'B',  name: t('investmentHome.creditLevels.B'),     perm: t('investmentHome.creditPerms.B') },
  { id: 'B+', name: t('investmentHome.creditLevels.B+'),    perm: t('investmentHome.creditPerms.B+') },
  { id: 'A',  name: t('investmentHome.creditLevels.A'),     perm: t('investmentHome.creditPerms.A') },
  { id: 'S',  name: t('investmentHome.creditLevels.S'),     perm: t('investmentHome.creditPerms.S') },
])
const levelOrder = ['C', 'B', 'B+', 'A', 'S']
const levelReqs: Record<string, { analyses: number; days: number }> = {
  B:   { analyses: 20,  days: 30  },
  'B+':{ analyses: 50,  days: 60  },
  A:   { analyses: 100, days: 90  },
  S:   { analyses: 200, days: 180 },
}

const nextLevel = computed(() => {
  const idx = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder[idx + 1] || null
})
const nextLevelReq = computed(() => nextLevel.value ? levelReqs[nextLevel.value] : null)

function isPastLevel(id: string) {
  const cur = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder.indexOf(id) < cur
}
function isFutureLevel(id: string) {
  const cur = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder.indexOf(id) > cur
}

// ── Pending Action ────────────────────────────────────────────────────────────
const pendingAction = ref<Record<string, any> | null>(null)

async function loadPendingAction() {
  const token = localStorage.getItem(TOKEN_NAME) || ''
  if (!token) return
  try {
    const res = await fetch('/api/adam/approve', { headers: { 'x-erp-token': token } })
    const data = await res.json() as { pending: Record<string, any> | null }
    pendingAction.value = data.pending?.status === 'pending_approval' ? data.pending : null
  } catch {}
}

async function handleApprove() {
  const token = localStorage.getItem(TOKEN_NAME) || ''
  await fetch('/api/adam/approve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-erp-token': token }, body: JSON.stringify({ decision: 'approve' }) })
  pendingAction.value = null
}

async function handleReject() {
  const token = localStorage.getItem(TOKEN_NAME) || ''
  await fetch('/api/adam/approve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-erp-token': token }, body: JSON.stringify({ decision: 'reject' }) })
  pendingAction.value = null
}

onMounted(() => loadPendingAction())

const sysLabel = computed(() => {
  const map: Record<string, string> = {
    dormant: t('investmentHome.statuses.dormant'),
    alive: t('investmentHome.statuses.alive'),
    survival: t('investmentHome.statuses.survival'),
    shutdown: t('investmentHome.statuses.shutdown'),
  }
  return map[adamStore.core.status] || t('investmentHome.statuses.unknown')
})

const emotionLabels = computed<Record<string, string>>(() => ({
  joy: t('investmentHome.emotionLabels.joy'),
  anger: t('investmentHome.emotionLabels.anger'),
  sorrow: t('investmentHome.emotionLabels.sorrow'),
  fear: t('investmentHome.emotionLabels.fear'),
  love: t('investmentHome.emotionLabels.love'),
  disgust: t('investmentHome.emotionLabels.disgust'),
  desire: t('investmentHome.emotionLabels.desire'),
}))

function emotionColor(key: string) {
  const map: Record<string, string> = {
    joy: 'em-gold', anger: 'em-red', sorrow: 'em-blue', fear: 'em-purple',
    love: 'em-pink', disgust: 'em-gray', desire: 'em-cyan',
  }
  return map[key] || 'em-gold'
}

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    sense: t('investmentHome.stageLabels.sense'),
    judge: t('investmentHome.stageLabels.judge'),
    act: t('investmentHome.stageLabels.act'),
    settle: t('investmentHome.stageLabels.settle'),
    archive: t('investmentHome.stageLabels.archive'),
  }
  return map[stage] || stage.toUpperCase()
}

function handleActivate() {
  adamStore.activate()
}

function handleAdoptRecommendation() {
  const rec = adamStore.latestRecommendation
  if (!rec || rec.status === 'adopted' || rec.status === 'executed') return
  rec.status = 'adopted'
  const now = new Date().toISOString()
  const evtId = `evt_adopt_${Date.now()}`
  adamStore.addEvent({
    id: evtId,
    type: 'recommendation_adopted',
    stage: 'act',
    title: t('investmentHome.adoptionSuccess', { title: rec.title }),
    summary: rec.thesis?.slice(0, 60) || '',
    at: now,
    institutionId: 'bureau',
  })
  rec.linkedEventIds.push(evtId)
  adamStore.persist()
}

function handleSkipRecommendation() {
  const rec = adamStore.latestRecommendation
  if (!rec || rec.status === 'adopted' || rec.status === 'executed') return
  rec.status = 'archived'
  const now = new Date().toISOString()
  adamStore.addEvent({
    id: `evt_skip_${Date.now()}`,
    type: 'archive_recorded',
    stage: 'archive',
    title: t('investmentHome.skipSuccess', { title: rec.title }),
    summary: t('investmentHome.skipSuccess', { title: rec.title }),
    at: now,
    institutionId: 'bureau',
  })
  if (adamStore.core.recommendationAccuracy > 0) {
    adamStore.core.recommendationAccuracy = Math.max(0, adamStore.core.recommendationAccuracy - 2)
  }
  adamStore.persist()
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return '--:--'
  }
}</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   投资生态舱 — Frosted Flat Dashboard
   ═══════════════════════════════════════════════════ */

.obs-home {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.layer { width: 100%; }

/* ── 共用面板 ── */
.panel {
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
  box-shadow: inset 0 0 0 1px rgba(42, 52, 65, 0.04);
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(42, 52, 65, 0.08);
  background: rgba(255, 255, 255, 0.18);
}
.panel-icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  font-size: 10px;
  color: #ffffff;
  background: #4f79c7;
  opacity: 1;
}
.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(23, 32, 39, 0.68);
  letter-spacing: 0.03em;
  font-family: inherit;
}
.panel-desc {
  font-size: 10px;
  color: var(--dim);
  opacity: 0.5;
}
.panel-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #4f79c7;
  background: rgba(79, 121, 199, 0.1);
  padding: 2px 8px;
  border-radius: 999px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* ═══════════════════════════════════════
   第一层：亚当生命核心
   ═══════════════════════════════════════ */
.status-card {
  position: relative;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 22px;
  padding: 22px 24px 18px;
  overflow: hidden;
  backdrop-filter: blur(22px) saturate(145%);
  -webkit-backdrop-filter: blur(22px) saturate(145%);
  box-shadow: inset 0 0 0 1px rgba(42, 52, 65, 0.04);
}

.card-grid-texture {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.18);
  pointer-events: none;
  opacity: 0.5;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
}
.adam-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 生命指示器 — 多环呼吸灯 */
.life-indicator {
  position: relative;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #dfe9fb;
}
.life-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}
.adam-identity-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  border-radius: 50%;
}
.life-orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px solid transparent;
}
.orbit-1 {
  width: 24px;
  height: 24px;
}
.orbit-2 {
  width: 36px;
  height: 36px;
}

/* 状态: alive */
.life-indicator.alive .life-core {
  background: #4f79c7;
  box-shadow: 0 0 0 5px rgba(79, 121, 199, 0.11);
  animation: corePulse 2.5s ease-in-out infinite;
}
.life-indicator.alive .orbit-1 {
  border-color: rgba(79, 121, 199, 0.24);
  animation: orbitSpin 8s linear infinite;
}
.life-indicator.alive .orbit-2 {
  border-color: rgba(79, 121, 199, 0.1);
  animation: orbitSpin 12s linear infinite reverse;
}

/* 状态: dormant */
.life-indicator.dormant .life-core { background: var(--dim); opacity: 0.5; }
.life-indicator.dormant .orbit-1 { border-color: var(--border); }
.life-indicator.dormant .orbit-2 { border-color: transparent; }

/* 状态: survival */
.life-indicator.survival .life-core {
  background: #ef6f5e;
  box-shadow: 0 0 0 5px rgba(239, 111, 94, 0.13);
  animation: corePulse 1s ease-in-out infinite;
}
.life-indicator.survival .orbit-1 {
  border-color: rgba(239, 111, 94, 0.3);
  animation: orbitSpin 4s linear infinite;
}
.life-indicator.survival .orbit-2 {
  border-color: rgba(239, 111, 94, 0.15);
  animation: orbitSpin 6s linear infinite reverse;
}

/* 状态: shutdown */
.life-indicator.shutdown .life-core { background: var(--dim); opacity: 0.2; }
.life-indicator.shutdown .orbit-1,
.life-indicator.shutdown .orbit-2 { border-color: transparent; }

@keyframes corePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}
@keyframes orbitSpin {
  0% { transform: rotate(0deg); border-top-color: transparent; }
  25% { border-top-color: currentColor; }
  50% { transform: rotate(180deg); }
  75% { border-top-color: transparent; }
  100% { transform: rotate(360deg); }
}

.adam-name {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.name-main {
  font-size: 18px;
  font-weight: 700;
  color: #172027;
  font-family: inherit;
  letter-spacing: 0.01em;
}
.name-id { color: #4f79c7; }
.name-sub {
  font-size: 11px;
  color: rgba(23, 32, 39, 0.46);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.02em;
  opacity: 1;
}

/* Header right: system tag + activate */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sys-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 999px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.sys-tag.alive { background: #dfe9fb; border: 1px solid rgba(79, 121, 199, 0.14); }
.sys-tag.dormant { background: rgba(23, 32, 39, 0.06); border: 1px solid rgba(23, 32, 39, 0.08); }
.sys-tag.survival { background: rgba(239, 111, 94, 0.14); border: 1px solid rgba(239, 111, 94, 0.2); }
.sys-tag.shutdown { background: var(--faint); border: 1px solid var(--border); }
.sys-dot { width: 5px; height: 5px; border-radius: 50%; }
.sys-tag.alive .sys-dot { background: #4f79c7; }
.sys-tag.dormant .sys-dot { background: var(--dim); }
.sys-tag.survival .sys-dot { background: #ef6f5e; animation: corePulse 1s ease-in-out infinite; }
.sys-tag.shutdown .sys-dot { background: var(--dim); opacity: 0.3; }
.sys-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.sys-tag.alive .sys-label { color: #4f79c7; }
.sys-tag.dormant .sys-label { color: var(--dim); }
.sys-tag.survival .sys-label { color: #ef6f5e; }
.sys-tag.shutdown .sys-label { color: var(--dim); opacity: 0.5; }

/* 激活按钮 */
.activate-btn {
  position: relative;
  padding: 8px 20px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: #4f79c7;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.02em;
  cursor: pointer;
  overflow: hidden;
  transition: background 0.18s ease, color 0.18s ease;
}
.activate-glow {
  display: none;
}
@keyframes glowSweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.activate-btn:hover {
  background: #3f67aa;
  color: #ffffff;
  box-shadow: none;
  border-color: transparent;
}
.activate-text { position: relative; z-index: 1; }

/* ── 核心指标条 ── */
.metrics-strip {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 14px;
  border: 1px solid rgba(42, 52, 65, 0.08);
  border-radius: 16px;
  margin-bottom: 12px;
  position: relative;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.32);
}
.metric-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
  padding: 0 8px;
}
.metric-divider {
  width: 1px;
  height: 32px;
  background: rgba(42, 52, 65, 0.08);
  flex-shrink: 0;
}
.metric-key {
  font-size: 10px;
  font-weight: 700;
  color: rgba(23, 32, 39, 0.42);
  letter-spacing: 0.06em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 1;
}
.metric-val {
  font-size: 20px;
  font-weight: 700;
  color: #172027;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: -0.02em;
}
.metric-val.positive { color: #4f79c7; }
.metric-val.negative { color: #ef6f5e; }
.metric-val.credit { color: #5d89d4; }
.metric-unit { font-size: 11px; opacity: 0.5; margin-left: 1px; }
.metric-val.energy-num { font-size: 12px; }

/* 精力条 */
.energy-bar-wrap {
  width: 60px;
  height: 6px;
  background: rgba(79, 121, 199, 0.12);
  border-radius: 999px;
  overflow: hidden;
}
.energy-bar {
  height: 100%;
  background: #4f79c7;
  border-radius: 999px;
  transition: width 0.5s ease;
}
.energy-bar.low {
  background: #ef6f5e;
}

/* ── 情绪频谱 ── */
.emotion-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}
.emotion-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(23, 32, 39, 0.42);
  letter-spacing: 0.05em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.5;
  white-space: nowrap;
}
.emotion-bars {
  display: flex;
  gap: 8px;
  flex: 1;
}
.emotion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
}
.emotion-bar-bg {
  width: 100%;
  max-width: 24px;
  height: 28px;
  background: rgba(79, 121, 199, 0.08);
  border-radius: 999px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.emotion-bar-fill {
  width: 100%;
  border-radius: 999px 999px 0 0;
  transition: height 0.5s ease;
  min-height: 1px;
}
.emotion-bar-fill.em-gold { background: #f3b451; }
.emotion-bar-fill.em-red { background: #ef6f5e; }
.emotion-bar-fill.em-blue { background: #5B8DEF; }
.emotion-bar-fill.em-purple { background: #A78BFA; }
.emotion-bar-fill.em-pink { background: #EC4899; }
.emotion-bar-fill.em-gray { background: var(--dim); }
.emotion-bar-fill.em-cyan { background: #5d89d4; }
.emotion-name {
  font-size: 8px;
  color: var(--dim);
  opacity: 0.5;
}

/* ═══════════════════════════════════════
   第二层：指令 + 事件
   ═══════════════════════════════════════ */
.dual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.triple-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

/* Trust Ladder */
.trust-ladder { display: flex; flex-direction: column; gap: 6px; }
.trust-rung {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 10px; border-radius: 6px; border: 1px solid transparent;
  opacity: 0.4; transition: all 0.2s;
}
.trust-rung.active { opacity: 1; border-color: #c9a84c; background: rgba(201,168,76,0.08); }
.trust-rung.past { opacity: 0.6; }
.trust-rung.future { opacity: 0.25; }
.rung-badge {
  min-width: 28px; height: 28px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
  background: rgba(201,168,76,0.15); color: #c9a84c;
}
.trust-rung.past .rung-badge { background: rgba(100,200,100,0.15); color: #5db85d; }
.trust-rung.future .rung-badge { background: rgba(100,100,100,0.1); color: #666; }
.rung-name { font-size: 12px; font-weight: 600; color: #e0d5b0; margin-bottom: 2px; }
.rung-perms { font-size: 10px; color: #888; line-height: 1.4; }
.rung-progress { font-size: 10px; color: #999; margin-top: 4px; }
.rung-progress .met { color: #5db85d; }

/* Pending Action */
.pending-action { margin-top: 12px; border: 1px solid rgba(201,168,76,0.3); border-radius: 6px; padding: 10px; }
.pending-head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.pending-icon { color: #c9a84c; font-size: 14px; }
.pending-title { font-size: 10px; letter-spacing: 0.1em; color: #c9a84c; }
.pending-body { font-size: 11px; color: #aaa; margin-bottom: 8px; }
.pending-type { font-weight: 600; color: #e0d5b0; font-size: 12px; }
.pending-amount { color: #c9a84c; font-size: 13px; font-weight: 700; }
.pending-reason { color: #888; margin-top: 2px; }
.pending-time { color: #555; font-size: 10px; margin-top: 2px; }
.pending-actions-row { display: flex; gap: 8px; }
.btn-sm { padding: 4px 12px; font-size: 11px; }

/* 指令卡片 */
.instruction-card {
  position: relative;
  padding: 16px;
  background: rgba(255, 255, 255, 0.26);
}
.instruction-glow-bar {
  position: absolute;
  left: 16px;
  top: 16px;
  bottom: 16px;
  width: 6px;
  border-radius: 999px;
  background: #f3b451;
  box-shadow: none;
}
.instruction-body { padding-left: 14px; }
.instruction-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.instruction-conf {
  font-size: 10px;
  font-weight: 700;
  color: #8a5b09;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  background: rgba(243, 180, 81, 0.22);
  border-radius: 999px;
}
.instruction-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.instruction-title {
  font-size: 15px;
  font-weight: 700;
  color: #172027;
  margin-bottom: 6px;
  line-height: 1.4;
}
.instruction-thesis {
  font-size: 12px;
  color: rgba(23, 32, 39, 0.64);
  margin-bottom: 6px;
  line-height: 1.6;
}
.instruction-risk {
  font-size: 11px;
  color: #b94d3f;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.risk-icon { font-size: 10px; }
.instruction-actions { display: flex; gap: 8px; }

/* 按钮 */
.btn-gold {
  position: relative;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: #4f79c7;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  overflow: hidden;
  transition: background 0.18s ease;
}
.btn-gold .btn-glow { display: none; }
.btn-gold:hover {
  background: #3f67aa;
  color: #ffffff;
  box-shadow: none;
}
.btn-ghost {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(42, 52, 65, 0.1);
  background: rgba(255, 255, 255, 0.44);
  color: rgba(23, 32, 39, 0.58);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: rgba(42, 52, 65, 0.16);
  color: #172027;
  background: rgba(255, 255, 255, 0.7);
}

/* ── 事件日志 ── */
.event-list {
  padding: 12px 16px 14px;
  max-height: 360px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.event-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 28px;
}
.event-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10px;
  flex-shrink: 0;
  padding-top: 4px;
}
.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.event-dot.sense { background: #5d89d4; box-shadow: none; }
.event-dot.judge { background: #f3b451; box-shadow: none; }
.event-dot.act { background: #4f79c7; box-shadow: none; }
.event-dot.settle { background: #a78bfa; box-shadow: none; }
.event-dot.archive { background: var(--dim); }
.event-line {
  width: 1px;
  flex: 1;
  min-height: 16px;
  background: var(--border);
}
.event-time {
  font-size: 9px;
  font-weight: 600;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 32px;
  flex-shrink: 0;
  padding-top: 2px;
}
.event-stage-tag {
  font-size: 8px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}
.event-stage-tag.sense { color: #325d9b; background: rgba(93, 137, 212, 0.14); }
.event-stage-tag.judge { color: #8a5b09; background: rgba(243, 180, 81, 0.18); }
.event-stage-tag.act { color: #4f79c7; background: rgba(79, 121, 199, 0.12); }
.event-stage-tag.settle { color: #A78BFA; background: rgba(167,139,250,0.08); }
.event-stage-tag.archive { color: var(--dim); background: var(--faint); }
.event-text {
  font-size: 12px;
  color: var(--mid);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  padding-top: 1px;
}

/* 空状态 */
.empty-state {
  padding: 32px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.empty-icon {
  font-size: 18px;
  color: var(--dim);
  opacity: 0.3;
}
.empty-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
  opacity: 0.5;
}
.empty-sub {
  font-size: 11px;
  color: var(--dim);
  opacity: 0.4;
}

/* ── 响应式 ── */
@media (max-width: 767px) {
  .dual-grid { grid-template-columns: 1fr; }
  .triple-grid { grid-template-columns: 1fr; }
  .metrics-strip { flex-wrap: wrap; gap: 8px; justify-content: center; }
  .metric-divider { display: none; }
  .metric-block { min-width: 60px; }
  .metric-val { font-size: 15px; }
  .emotion-strip { flex-direction: column; gap: 6px; }
  .emotion-label { text-align: center; }
  .name-main { font-size: 14px; }
  .life-indicator { width: 32px; height: 32px; }
  .orbit-1 { width: 20px; height: 20px; }
  .orbit-2 { width: 28px; height: 28px; }
}
</style>
