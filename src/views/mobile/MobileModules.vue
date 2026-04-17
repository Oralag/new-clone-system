<template>
  <div class="mod-page">
    <div class="mod-content">
      <div
        v-for="m in modules"
        :key="m.path"
        class="mod-big-card"
        @click="go(m.path)"
        :style="{ borderLeftColor: m.color }"
      >
        <div class="mod-big-icon" :style="{ background: m.bg }">
          <span v-html="m.icon" />
        </div>
        <div class="mod-big-info">
          <div class="mod-big-title">{{ m.label }}</div>
          <div class="mod-big-sub">{{ m.sub }}</div>
        </div>
        <span class="mod-big-arrow">›</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
function go(path: string) { router.push(path) }

const modules = [
  {
    label: '游牧 ERP',
    sub: '销售 · 采购 · 仓库 · 财务 · 人事',
    path: '/mobile/sale/overview',
    color: '#2E6BE6',
    bg: 'rgba(46,107,230,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="#2E6BE6"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="#2E6BE6" opacity="0.6"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="#2E6BE6" opacity="0.6"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="#2E6BE6" opacity="0.35"/></svg>',
  },
  {
    label: '智能体工作流',
    sub: '多Agent协作 · 内容生产 · 自动流转',
    path: '/agent',
    color: '#722ED1',
    bg: 'rgba(114,46,209,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2L9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z" fill="#722ED1" opacity="0.9"/></svg>',
  },
  {
    label: '对外投资',
    sub: '市场分析 · 智能决策 · 资产管理',
    path: '/investment',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#F5A623" stroke-width="1.5" opacity="0.6"/><circle cx="12" cy="12" r="4" fill="#F5A623" opacity="0.9"/></svg>',
  },
  {
    label: '品牌主页 & 零售',
    sub: '品牌展示 · 零售商城 · 采购商入口',
    path: '/brand',
    color: '#52C41A',
    bg: 'rgba(82,196,26,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#52C41A" stroke-width="1.8" stroke-linejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="#52C41A" stroke-width="1.8"/><path d="M16 10a4 4 0 01-8 0" stroke="#52C41A" stroke-width="1.8" stroke-linecap="round"/></svg>',
  },
]
</script>

<style scoped>
.mod-page { min-height: 100%; background: #f0f2f5; }
.mod-content { padding: 14px 14px 24px; display: flex; flex-direction: column; gap: 12px; }

.mod-big-card {
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  cursor: pointer;
  border-left: 4px solid #2E6BE6;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.mod-big-card:active { background: #f9f9f9; }

.mod-big-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mod-big-info { flex: 1; }
.mod-big-title { font-size: 16px; font-weight: 700; color: #1d2129; margin-bottom: 4px; }
.mod-big-sub { font-size: 12px; color: #86909c; }

.mod-big-arrow { font-size: 22px; color: #ccc; flex-shrink: 0; }
</style>
