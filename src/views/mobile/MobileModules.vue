<template>
  <div class="modules-page">
    <div class="modules-header">
      <div class="modules-greeting">欢迎回来</div>
      <div class="modules-sub">{{ authStore.userName || '数字游牧' }}</div>
    </div>

    <div class="modules-grid">
      <div
        v-for="m in modules"
        :key="m.key"
        class="module-card"
        :style="{ background: m.bg }"
        @click="router.push(m.path)"
      >
        <div class="module-card-icon">{{ m.icon }}</div>
        <div class="module-card-body">
          <div class="module-card-title">{{ m.title }}</div>
          <div class="module-card-desc">{{ m.desc }}</div>
        </div>
        <div class="module-card-arrow">›</div>
      </div>
    </div>

    <div class="modules-footer">
      <div class="modules-footer-text">数字游牧 · Digital Nomad ERP</div>
      <div class="modules-footer-version">v2.0</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const modules = [
  {
    key: 'erp',
    icon: '📋',
    title: '游牧 ERP',
    desc: '采购、销售、库存、财务全流程管理',
    path: '/mobile/workbench',
    bg: 'linear-gradient(135deg, #2E6BE6 0%, #4A8BF5 100%)',
  },
  {
    key: 'workflow',
    icon: '🔄',
    title: '智能体工作流',
    desc: 'AI 驱动的业务流程自动化',
    path: '/mobile/workflow',
    bg: 'linear-gradient(135deg, #722ED1 0%, #9254DE 100%)',
  },
  {
    key: 'investment',
    icon: '📊',
    title: '对外投资',
    desc: '投资项目管理与收益追踪',
    path: '/mobile/investment',
    bg: 'linear-gradient(135deg, #F5A623 0%, #FFC53D 100%)',
  },
  {
    key: 'report',
    icon: '📈',
    title: '数据报表',
    desc: '经营数据分析与可视化',
    path: '/mobile/stats',
    bg: 'linear-gradient(135deg, #52C41A 0%, #73D13D 100%)',
  },
]
</script>

<style scoped>
.modules-page {
  min-height: 100%;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.modules-header {
  background: #2E6BE6;
  padding: 32px 20px 24px;
  color: #fff;
}

.modules-greeting {
  font-size: 13px;
  opacity: 0.75;
  margin-bottom: 4px;
}

.modules-sub {
  font-size: 22px;
  font-weight: 700;
}

.modules-grid {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-card {
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.module-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.module-card-icon {
  font-size: 32px;
  flex-shrink: 0;
  line-height: 1;
}

.module-card-body {
  flex: 1;
  min-width: 0;
}

.module-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.module-card-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-card-arrow {
  font-size: 22px;
  color: rgba(255,255,255,0.6);
  flex-shrink: 0;
}

.modules-footer {
  text-align: center;
  padding: 20px;
  color: #bbb;
}

.modules-footer-text {
  font-size: 12px;
  margin-bottom: 2px;
}

.modules-footer-version {
  font-size: 11px;
}
</style>
