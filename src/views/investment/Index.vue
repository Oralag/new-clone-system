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
              <span class="activate-text">ACTIVATE</span>
            </button>
          </div>
        </div>

        <!-- 核心指标条 -->
        <div class="metrics-strip">
          <div class="metric-block">
            <span class="metric-key">NET_WORTH</span>
            <span class="metric-val" :class="{ positive: adamStore.core.netWorth > 0, negative: adamStore.core.netWorth < 0 }">
              ¥{{ adamStore.core.netWorth.toLocaleString() }}
            </span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">BUDGET</span>
            <span class="metric-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">CREDIT</span>
            <span class="metric-val credit">{{ adamStore.core.creditLevel }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">ALIVE</span>
            <span class="metric-val">{{ adamStore.core.survivalDays }}<span class="metric-unit">d</span></span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">ENERGY</span>
            <div class="energy-bar-wrap">
              <div class="energy-bar" :style="{ width: adamStore.core.energy + '%' }" :class="{ low: adamStore.core.energy < 30 }"></div>
            </div>
            <span class="metric-val energy-num">{{ adamStore.core.energy }}%</span>
          </div>
        </div>

        <!-- 情绪频谱条 -->
        <div class="emotion-strip">
          <span class="emotion-label">EMOTION_SPECTRUM</span>
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

    <!-- ── 第二层：指令 + 事件日志 ── -->
    <div class="layer layer-panels">
      <div class="dual-grid">
        <!-- 最新指令 -->
        <div class="panel panel-instruction">
          <div class="panel-head">
            <span class="panel-icon">◈</span>
            <span class="panel-title">LATEST_DIRECTIVE</span>
          </div>
          <div v-if="adamStore.latestRecommendation" class="instruction-card">
            <div class="instruction-glow-bar"></div>
            <div class="instruction-body">
              <div class="instruction-meta">
                <span class="instruction-conf" v-if="adamStore.latestRecommendation.confidence">
                  CONF: {{ (adamStore.latestRecommendation.confidence * 100).toFixed(0) }}%
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
                  已执行
                </button>
                <button class="btn-ghost" @click="handleSkipRecommendation">跳过</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">◇</div>
            <span class="empty-text">AWAITING_DIRECTIVE</span>
            <span class="empty-sub">亚当尚未发出指令</span>
          </div>
        </div>

        <!-- 事件日志 -->
        <div class="panel panel-log">
          <div class="panel-head">
            <span class="panel-icon">◉</span>
            <span class="panel-title">EVENT_LOG</span>
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
              <span class="empty-text">NO_EVENTS</span>
              <span class="empty-sub">等待亚当的第一个动作</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdamStore } from '@/stores/adam'

const adamStore = useAdamStore()

const sysLabel = computed(() => {
  const map: Record<string, string> = { dormant: 'DORMANT', alive: 'SYS.ONLINE', survival: 'SURVIVAL', shutdown: 'SHUTDOWN' }
  return map[adamStore.core.status] || 'UNKNOWN'
})

const emotionLabels: Record<string, string> = {
  joy: '喜悦', anger: '愤怒', sorrow: '悲伤', fear: '恐惧',
  love: '热爱', disgust: '厌恶', desire: '渴望',
}

function emotionColor(key: string) {
  const map: Record<string, string> = {
    joy: 'em-gold', anger: 'em-red', sorrow: 'em-blue', fear: 'em-purple',
    love: 'em-pink', disgust: 'em-gray', desire: 'em-cyan',
  }
  return map[key] || 'em-gold'
}

function stageLabel(stage: string) {
  const map: Record<string, string> = { sense: 'SENSE', judge: 'JUDGE', act: 'ACT', settle: 'SETTLE', archive: 'ARCHIVE' }
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
    title: `已执行指令: ${rec.title}`,
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
    title: `跳过指令: ${rec.title}`,
    summary: '规则传递者选择跳过',
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
   黑曜石观测舱 — Index.vue
   Bloomberg Terminal + Vercel Dashboard aesthetic
   ═══════════════════════════════════════════════════ */

.obs-home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.layer { width: 100%; }

/* ── 共用面板 ── */
.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(245,166,35,0.02) 0%, transparent 100%);
}
.panel-icon {
  font-size: 10px;
  color: #F5A623;
  opacity: 0.6;
}
.panel-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.panel-desc {
  font-size: 10px;
  color: var(--dim);
  opacity: 0.5;
}
.panel-count {
  margin-left: auto;
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  background: var(--faint);
  padding: 1px 6px;
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* ═══════════════════════════════════════
   第一层：亚当生命核心
   ═══════════════════════════════════════ */
.status-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 24px 16px;
  overflow: hidden;
}

/* 极细网格纹理 */
.card-grid-texture {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(245,166,35,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,166,35,0.02) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.life-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}
.adam-identity-img {
  width: 36px;
  height: 36px;
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
  background: #00E5A0;
  box-shadow: 0 0 12px rgba(0,229,160,0.5), 0 0 24px rgba(0,229,160,0.2);
  animation: corePulse 2.5s ease-in-out infinite;
}
.life-indicator.alive .orbit-1 {
  border-color: rgba(0,229,160,0.25);
  animation: orbitSpin 8s linear infinite;
}
.life-indicator.alive .orbit-2 {
  border-color: rgba(0,229,160,0.10);
  animation: orbitSpin 12s linear infinite reverse;
}

/* 状态: dormant */
.life-indicator.dormant .life-core { background: var(--dim); opacity: 0.5; }
.life-indicator.dormant .orbit-1 { border-color: var(--border); }
.life-indicator.dormant .orbit-2 { border-color: transparent; }

/* 状态: survival */
.life-indicator.survival .life-core {
  background: #FF4D4D;
  box-shadow: 0 0 12px rgba(255,77,77,0.5);
  animation: corePulse 1s ease-in-out infinite;
}
.life-indicator.survival .orbit-1 {
  border-color: rgba(255,77,77,0.3);
  animation: orbitSpin 4s linear infinite;
}
.life-indicator.survival .orbit-2 {
  border-color: rgba(255,77,77,0.15);
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
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
}
.name-id { color: #F5A623; }
.name-sub {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
  opacity: 0.6;
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
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.sys-tag.alive { background: rgba(0,229,160,0.06); border: 1px solid rgba(0,229,160,0.15); }
.sys-tag.dormant { background: var(--faint); border: 1px solid var(--border); }
.sys-tag.survival { background: rgba(255,77,77,0.06); border: 1px solid rgba(255,77,77,0.15); }
.sys-tag.shutdown { background: var(--faint); border: 1px solid var(--border); }
.sys-dot { width: 5px; height: 5px; border-radius: 50%; }
.sys-tag.alive .sys-dot { background: #00E5A0; }
.sys-tag.dormant .sys-dot { background: var(--dim); }
.sys-tag.survival .sys-dot { background: #FF4D4D; animation: corePulse 1s ease-in-out infinite; }
.sys-tag.shutdown .sys-dot { background: var(--dim); opacity: 0.3; }
.sys-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.sys-tag.alive .sys-label { color: #00E5A0; }
.sys-tag.dormant .sys-label { color: var(--dim); }
.sys-tag.survival .sys-label { color: #FF4D4D; }
.sys-tag.shutdown .sys-label { color: var(--dim); opacity: 0.5; }

/* 激活按钮 */
.activate-btn {
  position: relative;
  padding: 8px 20px;
  border-radius: 4px;
  border: 1px solid rgba(245,166,35,0.35);
  background: transparent;
  color: #F5A623;
  font-size: 11px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}
.activate-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(245,166,35,0.08), transparent);
  animation: glowSweep 3s ease-in-out infinite;
}
@keyframes glowSweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.activate-btn:hover {
  background: #F5A623;
  color: var(--card-bg);
  box-shadow: 0 0 20px rgba(245,166,35,0.3), 0 0 40px rgba(245,166,35,0.1);
  border-color: #F5A623;
}
.activate-text { position: relative; z-index: 1; }

/* ── 核心指标条 ── */
.metrics-strip {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
  position: relative;
  overflow-x: auto;
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
  background: var(--border);
  flex-shrink: 0;
}
.metric-key {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.6;
}
.metric-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--dark);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: -0.02em;
}
.metric-val.positive { color: #00E5A0; }
.metric-val.negative { color: #FF4D4D; }
.metric-val.credit { color: #F5A623; }
.metric-unit { font-size: 11px; opacity: 0.5; margin-left: 1px; }
.metric-val.energy-num { font-size: 12px; }

/* 精力条 */
.energy-bar-wrap {
  width: 60px;
  height: 3px;
  background: var(--faint);
  border-radius: 2px;
  overflow: hidden;
}
.energy-bar {
  height: 100%;
  background: linear-gradient(90deg, #00E5A0, #00D4FF);
  border-radius: 2px;
  transition: width 0.5s ease;
}
.energy-bar.low {
  background: linear-gradient(90deg, #FF4D4D, #FF6B35);
}

/* ── 情绪频谱 ── */
.emotion-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}
.emotion-label {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.1em;
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
  background: var(--faint);
  border-radius: 2px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.emotion-bar-fill {
  width: 100%;
  border-radius: 2px 2px 0 0;
  transition: height 0.5s ease;
  min-height: 1px;
}
.emotion-bar-fill.em-gold { background: #F5A623; }
.emotion-bar-fill.em-red { background: #FF4D4D; }
.emotion-bar-fill.em-blue { background: #5B8DEF; }
.emotion-bar-fill.em-purple { background: #A78BFA; }
.emotion-bar-fill.em-pink { background: #EC4899; }
.emotion-bar-fill.em-gray { background: var(--dim); }
.emotion-bar-fill.em-cyan { background: #00D4FF; }
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

/* 指令卡片 */
.instruction-card {
  position: relative;
  padding: 16px;
  background: linear-gradient(180deg, rgba(245,166,35,0.03) 0%, transparent 100%);
}
.instruction-glow-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #F5A623;
  box-shadow: 0 0 8px rgba(245,166,35,0.5), 0 0 16px rgba(245,166,35,0.2);
}
.instruction-body { padding-left: 14px; }
.instruction-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.instruction-conf {
  font-size: 9px;
  font-weight: 700;
  color: #F5A623;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  background: rgba(245,166,35,0.08);
  border-radius: 3px;
}
.instruction-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.instruction-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 6px;
  line-height: 1.4;
}
.instruction-thesis {
  font-size: 12px;
  color: var(--mid);
  margin-bottom: 6px;
  line-height: 1.6;
}
.instruction-risk {
  font-size: 11px;
  color: rgba(255,77,77,0.70);
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
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid rgba(245,166,35,0.35);
  background: transparent;
  color: #F5A623;
  font-size: 11px;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
}
.btn-gold .btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(245,166,35,0.06), transparent);
}
.btn-gold:hover {
  background: #F5A623;
  color: var(--card-bg);
  box-shadow: 0 0 12px rgba(245,166,35,0.25);
}
.btn-ghost {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--dim);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: var(--mid);
  color: var(--dark);
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
.event-dot.sense { background: #00D4FF; box-shadow: 0 0 4px rgba(0,212,255,0.4); }
.event-dot.judge { background: #F5A623; box-shadow: 0 0 4px rgba(245,166,35,0.4); }
.event-dot.act { background: #00E5A0; box-shadow: 0 0 4px rgba(0,229,160,0.4); }
.event-dot.settle { background: #A78BFA; box-shadow: 0 0 4px rgba(167,139,250,0.4); }
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
.event-stage-tag.sense { color: #00D4FF; background: rgba(0,212,255,0.08); }
.event-stage-tag.judge { color: #F5A623; background: rgba(245,166,35,0.08); }
.event-stage-tag.act { color: #00E5A0; background: rgba(0,229,160,0.08); }
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
