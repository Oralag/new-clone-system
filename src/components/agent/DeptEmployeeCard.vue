<template>
  <div class="dept-employee-card" :style="{ '--dc': color }">
    <!-- 左侧：像素风头图 -->
    <div class="dec-illus">
      <svg :viewBox="'0 0 12 12'" width="56" height="56" style="image-rendering:pixelated;opacity:0.3" v-html="illusHtml"></svg>
    </div>
    <!-- 中部：员工信息 -->
    <div class="dec-info">
      <div class="dec-top">
        <span class="dec-emoji">{{ emoji }}</span>
        <div>
          <div class="dec-name">{{ name }}</div>
          <div class="dec-role">{{ role }}</div>
        </div>
        <span class="dec-status-dot" :class="{ busy: busy }"></span>
        <span class="dec-status-text">{{ busy ? '工作中' : '待命' }}</span>
      </div>
      <div class="dec-desc">{{ desc }}</div>
    </div>
    <!-- 右侧：今日数据 -->
    <div class="dec-stats">
      <div v-for="s in stats" :key="s.label" class="dec-stat-item">
        <span class="dec-stat-value">{{ s.value }}</span>
        <span class="dec-stat-label">{{ s.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  role: string
  emoji: string
  desc: string
  color: string
  busy?: boolean
  stats?: { value: number | string; label: string }[]
  illustId?: string
}>()

// 各部门专属像素插画（与 Dashboard 一致）
const illusMap: Record<string, string> = {
  content:   `<rect x="2" y="1" width="5" height="1" fill="white"/><rect x="1" y="2" width="1" height="7" fill="white"/><rect x="6" y="2" width="1" height="7" fill="white"/><rect x="2" y="9" width="5" height="1" fill="white"/><rect x="2" y="3" width="4" height="1" fill="white"/><rect x="2" y="5" width="4" height="1" fill="white"/><rect x="2" y="7" width="3" height="1" fill="white"/>`,
  creative:  `<rect x="4" y="1" width="4" height="1" fill="white"/><rect x="3" y="2" width="1" height="1" fill="white"/><rect x="8" y="2" width="1" height="1" fill="white"/><rect x="2" y="3" width="1" height="4" fill="white"/><rect x="9" y="3" width="1" height="2" fill="white"/><rect x="2" y="7" width="1" height="1" fill="white"/><rect x="3" y="8" width="3" height="1" fill="white"/><rect x="7" y="6" width="3" height="1" fill="white"/><rect x="6" y="7" width="1" height="3" fill="white"/><rect x="7" y="9" width="3" height="1" fill="white"/>`,
  brand:     `<rect x="5" y="1" width="2" height="2" fill="white"/><rect x="1" y="4" width="10" height="2" fill="white"/><rect x="3" y="6" width="2" height="1" fill="white"/><rect x="7" y="6" width="2" height="1" fill="white"/><rect x="2" y="7" width="2" height="2" fill="white"/><rect x="8" y="7" width="2" height="2" fill="white"/><rect x="5" y="8" width="2" height="1" fill="white"/>`,
  intel:     `<rect x="1" y="8" width="1" height="1" fill="white"/><rect x="2" y="7" width="1" height="1" fill="white"/><rect x="3" y="6" width="1" height="1" fill="white"/><rect x="4" y="5" width="1" height="1" fill="white"/><rect x="5" y="6" width="1" height="1" fill="white"/><rect x="6" y="5" width="1" height="1" fill="white"/><rect x="7" y="4" width="1" height="1" fill="white"/><rect x="8" y="3" width="1" height="1" fill="white"/><rect x="9" y="2" width="2" height="1" fill="white"/><rect x="10" y="2" width="1" height="3" fill="white"/><rect x="1" y="9" width="10" height="1" fill="white"/>`,
  publish:   `<rect x="5" y="1" width="2" height="1" fill="white"/><rect x="4" y="2" width="1" height="1" fill="white"/><rect x="7" y="2" width="1" height="1" fill="white"/><rect x="3" y="3" width="1" height="1" fill="white"/><rect x="8" y="3" width="1" height="1" fill="white"/><rect x="5" y="1" width="2" height="5" fill="white"/><rect x="2" y="6" width="8" height="1" fill="white"/><rect x="2" y="7" width="3" height="2" fill="white"/><rect x="7" y="7" width="3" height="2" fill="white"/><rect x="2" y="9" width="8" height="1" fill="white"/>`,
  marketing: `<rect x="1" y="7" width="2" height="3" fill="white"/><rect x="4" y="5" width="2" height="5" fill="white"/><rect x="7" y="3" width="2" height="7" fill="white"/><rect x="1" y="10" width="10" height="1" fill="white"/>`,
  designer:  `<rect x="1" y="1" width="6" height="4" fill="white"/><rect x="8" y="3" width="1" height="6" fill="white"/><rect x="7" y="4" width="1" height="1" fill="white"/><rect x="9" y="4" width="1" height="1" fill="white"/><rect x="8" y="9" width="1" height="2" fill="white"/><rect x="1" y="6" width="6" height="4" fill="white"/>`,
}

const illusHtml = computed(() => illusMap[props.illustId || ''] || illusMap.content)
</script>

<style scoped>
.dept-employee-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-left: 4px solid var(--dc, #0071e3);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  animation: fadeUp 0.2s ease both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dec-illus {
  width: 56px; height: 56px;
  border-radius: 12px;
  background: var(--dc, #0071e3);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.dec-info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.dec-top {
  display: flex; align-items: center; gap: 8px;
}
.dec-emoji { font-size: 22px; flex-shrink: 0; }
.dec-name { font-size: 15px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.02em; }
.dec-role { font-size: 11px; color: #999999; margin-top: 1px; }
.dec-status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #34d399;
  animation: statuspulse 2.5s ease-in-out infinite;
  flex-shrink: 0;
}
.dec-status-dot.busy { background: #0071e3; }
@keyframes statuspulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50%      { box-shadow: 0 0 0 4px rgba(52,211,153,0.06); }
}
.dec-status-text { font-size: 11px; font-weight: 600; color: #34d399; }
.dec-status-dot.busy + .dec-status-text { color: #0071e3; }
.dec-desc { font-size: 12px; color: #666666; line-height: 1.4; }

.dec-stats {
  display: flex; gap: 16px; flex-shrink: 0;
}
.dec-stat-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  min-width: 44px;
}
.dec-stat-value {
  font-size: 20px; font-weight: 800; color: #1A1A1A;
  letter-spacing: -0.04em; line-height: 1;
}
.dec-stat-label {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #BBBBBB;
}

@media (max-width: 600px) {
  .dept-employee-card { flex-wrap: wrap; }
  .dec-illus { display: none; }
  .dec-stats { width: 100%; justify-content: flex-start; }
}
</style>
