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
    label: '经营管理',
    sub: '销售 · 采购 · 仓储 · 财务',
    path: '/mobile/sale/overview',
    color: '#2E6BE6',
    bg: 'rgba(46,107,230,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  },
  {
    label: '智能体工作流',
    sub: '内容创作 · 平面设计 · 营销顾问',
    path: '/agent/content',
    color: '#722ED1',
    bg: 'rgba(114,46,209,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#722ED1" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  },
  {
    label: '对外投资',
    sub: '投资总览 · 生态园区 · 市场动态',
    path: '/mobile/investment/overview',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  },
  {
    label: '数据报表',
    sub: '销售统计 · 财务报表 · 库存报表',
    path: '/mobile/stats',
    color: '#52C41A',
    bg: 'rgba(82,196,26,0.1)',
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
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
