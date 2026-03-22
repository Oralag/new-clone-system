<template>
  <div class="market-page">
    <!-- 板块热度 -->
    <div class="panel">
      <div class="panel-head">
        <span class="panel-icon">◈</span>
        <span class="panel-title">SECTOR_HEAT</span>
        <span class="panel-desc">板块热度</span>
      </div>
      <div class="sector-grid" v-if="sectorData.length">
        <div v-for="sector in sectorData" :key="sector.name" class="sector-card" :class="sector.level">
          <div class="sector-header">
            <span class="sector-name">{{ sector.name }}</span>
            <span class="sector-val">{{ sector.heat }}%</span>
          </div>
          <div class="sector-bar">
            <div class="sector-fill" :style="{ width: sector.heat + '%' }"></div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">◇</div>
        <span class="empty-text">AWAITING_SCAN</span>
        <span class="empty-sub">亚当尚未扫描板块数据</span>
      </div>
    </div>

    <!-- 北向资金 -->
    <div class="panel">
      <div class="panel-head">
        <span class="panel-icon flow-icon">◉</span>
        <span class="panel-title">NORTHBOUND_FLOW</span>
        <span class="panel-desc">北向资金</span>
      </div>
      <div class="flow-grid">
        <div class="flow-card main-flow">
          <span class="flow-label">TODAY_NET</span>
          <span class="flow-val" :class="{ positive: northboundNet > 0, negative: northboundNet < 0 }">
            {{ northboundNet > 0 ? '+' : '' }}{{ northboundNet.toFixed(2) }}
            <span class="flow-unit">亿</span>
          </span>
        </div>
        <div class="flow-card">
          <span class="flow-label">DATA_SOURCE</span>
          <span class="flow-source">{{ northboundSource }}</span>
        </div>
        <div class="flow-card">
          <span class="flow-label">STATUS</span>
          <div class="flow-status">
            <span class="flow-status-dot" :class="{ active: northboundNet !== 0 }"></span>
            <span class="flow-status-text">{{ northboundNet !== 0 ? 'LIVE' : 'PENDING' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 市场信号事件 -->
    <div class="panel">
      <div class="panel-head">
        <span class="panel-icon signal-icon">⟐</span>
        <span class="panel-title">MARKET_SIGNALS</span>
        <span class="panel-desc">市场信号</span>
        <span class="panel-count" v-if="marketSignals.length">{{ marketSignals.length }}</span>
      </div>
      <div class="signal-list">
        <div v-for="(signal, idx) in marketSignals" :key="signal.id" class="signal-item">
          <div class="signal-timeline">
            <span class="signal-dot"></span>
            <span v-if="idx < marketSignals.length - 1" class="signal-line"></span>
          </div>
          <div class="signal-meta">
            <span class="signal-time">{{ formatTime(signal.at) }}</span>
          </div>
          <div class="signal-body">
            <span class="signal-title">{{ signal.title }}</span>
            <span class="signal-summary">{{ signal.summary }}</span>
          </div>
        </div>
        <div v-if="marketSignals.length === 0" class="empty-state">
          <div class="empty-icon">○</div>
          <span class="empty-text">NO_SIGNALS</span>
          <span class="empty-sub">等待亚当的情报站开始工作</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'

const adamStore = useAdamStore()

// Phase 1: 静态占位数据，后续由亚当工具调用填充
const sectorData = ref<Array<{ name: string; heat: number; level: string }>>([])
const northboundNet = ref(0)
const northboundSource = ref('等待情报站数据')

const marketSignals = computed(() =>
  adamStore.events
    .filter((e) => e.type === 'market_signal_detected')
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20),
)

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${min}`
  } catch {
    return '--/-- --:--'
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   股票市场 — Market.vue
   Bloomberg Terminal-style data visualization
   ═══════════════════════════════════════════════════ */

.market-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 共用面板 ── */
.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
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
.flow-icon { color: #00E5A0; }
.signal-icon { color: #00D4FF; }
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
  opacity: 0.4;
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

/* ── 板块热度 ── */
.sector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1px;
  padding: 1px;
  background: var(--border);
}
.sector-card {
  padding: 12px 14px;
  background: var(--card-bg);
}
.sector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.sector-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--dark);
}
.sector-val {
  font-size: 11px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
}
.sector-card.hot .sector-val { color: #FF4D4D; }
.sector-card.warm .sector-val { color: #F5A623; }
.sector-card.cool .sector-val { color: #00D4FF; }
.sector-bar {
  height: 3px;
  background: var(--faint);
  border-radius: 2px;
  overflow: hidden;
}
.sector-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}
.sector-card.hot .sector-fill { background: linear-gradient(90deg, #FF4D4D, #FF6B35); }
.sector-card.warm .sector-fill { background: linear-gradient(90deg, #F5A623, #FFD93D); }
.sector-card.cool .sector-fill { background: linear-gradient(90deg, #00D4FF, #00E5A0); }
/* 默认 */
.sector-fill { background: linear-gradient(90deg, #F5A623, #FF6B35); }

/* ── 北向资金 ── */
.flow-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: var(--border);
}
.flow-card {
  padding: 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.flow-card.main-flow {
  position: relative;
}
.flow-card.main-flow::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: #F5A623;
  opacity: 0.3;
  border-radius: 1px;
}
.flow-label {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.6;
}
.flow-val {
  font-size: 24px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--dark);
  letter-spacing: -0.02em;
}
.flow-val.positive { color: #FF4D4D; }
.flow-val.negative { color: #00E5A0; }
.flow-unit {
  font-size: 12px;
  opacity: 0.5;
  margin-left: 2px;
}
.flow-source {
  font-size: 12px;
  color: var(--dim);
  font-family: inherit;
}
.flow-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.flow-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dim);
  opacity: 0.5;
}
.flow-status-dot.active {
  background: #00E5A0;
  box-shadow: 0 0 6px rgba(0,229,160,0.4);
  animation: livePulse 2s ease-in-out infinite;
}
@keyframes livePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.flow-status-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
}
.flow-status-dot.active + .flow-status-text { color: #00E5A0; }

/* ── 市场信号 ── */
.signal-list {
  padding: 12px 16px 14px;
  max-height: 480px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.signal-item {
  display: flex;
  gap: 10px;
  min-height: 36px;
}
.signal-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10px;
  flex-shrink: 0;
  padding-top: 5px;
}
.signal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00D4FF;
  box-shadow: 0 0 4px rgba(0,212,255,0.4);
  flex-shrink: 0;
}
.signal-line {
  width: 1px;
  flex: 1;
  min-height: 16px;
  background: var(--border);
}
.signal-meta {
  flex-shrink: 0;
  padding-top: 2px;
}
.signal-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 72px;
  display: block;
}
.signal-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  padding-bottom: 12px;
}
.signal-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--dark);
  line-height: 1.4;
}
.signal-summary {
  font-size: 11px;
  color: var(--dim);
  line-height: 1.5;
}

/* 空状态 */
.empty-state {
  padding: 36px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.empty-icon {
  font-size: 18px;
  color: var(--dim);
  opacity: 0.25;
}
.empty-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
  opacity: 0.4;
}
.empty-sub {
  font-size: 11px;
  color: var(--dim);
  opacity: 0.35;
}

@media (max-width: 767px) {
  .sector-grid { grid-template-columns: 1fr; }
  .flow-grid { grid-template-columns: 1fr; }
}
</style>
