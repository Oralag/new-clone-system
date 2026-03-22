<template>
  <div class="market-page">
    <!-- 板块热度 -->
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">板块热度</span>
        <span class="panel-desc">Sector Heat</span>
      </div>
      <div class="sector-grid">
        <div v-for="sector in sectorData" :key="sector.name" class="sector-card" :class="sector.level">
          <div class="sector-name">{{ sector.name }}</div>
          <div class="sector-bar">
            <div class="sector-fill" :style="{ width: sector.heat + '%' }"></div>
          </div>
          <div class="sector-val">{{ sector.heat }}%</div>
        </div>
      </div>
      <div v-if="sectorData.length === 0" class="empty-state">
        <span class="empty-text">亚当尚未扫描板块数据</span>
      </div>
    </div>

    <!-- 北向资金 -->
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">北向资金</span>
        <span class="panel-desc">Northbound Flow</span>
      </div>
      <div class="flow-summary">
        <div class="flow-item">
          <span class="flow-label">今日净买入</span>
          <span class="flow-val" :class="{ positive: northboundNet > 0, negative: northboundNet < 0 }">
            {{ northboundNet > 0 ? '+' : '' }}{{ northboundNet.toFixed(2) }}亿
          </span>
        </div>
        <div class="flow-item">
          <span class="flow-label">数据来源</span>
          <span class="flow-val muted">{{ northboundSource }}</span>
        </div>
      </div>
    </div>

    <!-- 市场信号事件 -->
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">市场信号</span>
        <span class="panel-desc">Market Signals</span>
      </div>
      <div class="signal-list">
        <div v-for="signal in marketSignals" :key="signal.id" class="signal-item">
          <span class="signal-time">{{ formatTime(signal.at) }}</span>
          <span class="signal-dot"></span>
          <div class="signal-body">
            <span class="signal-title">{{ signal.title }}</span>
            <span class="signal-summary">{{ signal.summary }}</span>
          </div>
        </div>
        <div v-if="marketSignals.length === 0" class="empty-state">
          <span class="empty-text">暂无市场信号 — 等待亚当的情报站开始工作</span>
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
.market-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--dark);
}
.panel-desc {
  font-size: 10px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* 板块热度 */
.sector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 14px 16px;
}
.sector-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--faint);
}
.sector-name {
  font-size: 12px;
  color: var(--mid);
  min-width: 56px;
}
.sector-bar {
  flex: 1;
  height: 4px;
  background: var(--faint);
  border-radius: 2px;
  overflow: hidden;
}
.sector-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #F5A623, #FF6B35);
  transition: width 0.5s ease;
}
.sector-card.hot .sector-fill { background: linear-gradient(90deg, #FF4D4D, #FF6B35); }
.sector-card.warm .sector-fill { background: linear-gradient(90deg, #F5A623, #FFD93D); }
.sector-card.cool .sector-fill { background: linear-gradient(90deg, #00D4FF, #00E5A0); }
.sector-val {
  font-size: 10px;
  font-weight: 600;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 32px;
  text-align: right;
}

/* 北向资金 */
.flow-summary {
  display: flex;
  gap: 32px;
  padding: 16px;
}
.flow-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.flow-label {
  font-size: 10px;
  color: var(--dim);
}
.flow-val {
  font-size: 18px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--dark);
}
.flow-val.positive { color: #FF4D4D; }
.flow-val.negative { color: #00E5A0; }
.flow-val.muted {
  font-size: 12px;
  font-weight: 400;
  color: var(--dim);
  font-family: inherit;
}

/* 市场信号 */
.signal-list {
  padding: 8px 16px 14px;
}
.signal-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.signal-item:last-child { border-bottom: none; }
.signal-time {
  font-size: 10px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 72px;
  flex-shrink: 0;
  padding-top: 2px;
}
.signal-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #00D4FF;
  flex-shrink: 0;
  margin-top: 6px;
}
.signal-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.signal-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--dark);
}
.signal-summary {
  font-size: 11px;
  color: var(--dim);
  line-height: 1.5;
}

.empty-state {
  padding: 28px 16px;
  text-align: center;
}
.empty-text {
  font-size: 12px;
  color: var(--dim);
}

@media (max-width: 767px) {
  .sector-grid { grid-template-columns: 1fr; }
  .flow-summary { flex-direction: column; gap: 12px; }
}
</style>
