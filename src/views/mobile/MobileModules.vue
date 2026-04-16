<template>
  <div class="mod-page">
    <div class="mod-content">
      <!-- ERP 经营管理 -->
      <div class="mod-group">
        <div class="mod-group-hd">
          <div class="mod-group-icon" style="background:rgba(46,107,230,0.12)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span>经营管理</span>
        </div>
        <div class="mod-grid">
          <div class="mod-card" v-for="m in erpModules" :key="m.path" @click="go(m.path)">
            <div class="mod-card-icon" :style="{ background: m.bg }">
              <span v-html="m.icon" />
            </div>
            <div class="mod-card-label">{{ m.label }}</div>
          </div>
        </div>
      </div>

      <!-- 智能体工作流 -->
      <div class="mod-group">
        <div class="mod-group-hd">
          <div class="mod-group-icon" style="background:rgba(114,46,209,0.12)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#722ED1" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span>智能体工作流</span>
        </div>
        <div class="mod-grid">
          <div class="mod-card" v-for="m in aiModules" :key="m.path" @click="go(m.path)">
            <div class="mod-card-icon" :style="{ background: m.bg }">
              <span v-html="m.icon" />
            </div>
            <div class="mod-card-label">{{ m.label }}</div>
          </div>
        </div>
      </div>

      <!-- 对外投资 -->
      <div class="mod-group">
        <div class="mod-group-hd">
          <div class="mod-group-icon" style="background:rgba(245,166,35,0.12)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <span>对外投资</span>
        </div>
        <div class="mod-grid">
          <div class="mod-card" v-for="m in investModules" :key="m.path" @click="go(m.path)">
            <div class="mod-card-icon" :style="{ background: m.bg }">
              <span v-html="m.icon" />
            </div>
            <div class="mod-card-label">{{ m.label }}</div>
          </div>
        </div>
      </div>

      <!-- 数据报表 -->
      <div class="mod-group">
        <div class="mod-group-hd">
          <div class="mod-group-icon" style="background:rgba(82,196,26,0.12)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span>数据报表</span>
        </div>
        <div class="mod-grid">
          <div class="mod-card" v-for="m in reportModules" :key="m.path" @click="go(m.path)">
            <div class="mod-card-icon" :style="{ background: m.bg }">
              <span v-html="m.icon" />
            </div>
            <div class="mod-card-label">{{ m.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
function go(path: string) { router.push(path) }

const erpModules = [
  { label: '销售管理', path: '/mobile/sale/overview', bg: 'rgba(46,107,230,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' },
  { label: '采购管理', path: '/mobile/procure/order', bg: 'rgba(114,46,209,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#722ED1" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>' },
  { label: '仓储管理', path: '/mobile/warehouse/stock', bg: 'rgba(5,150,105,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { label: '财务总览', path: '/mobile/finance/overview', bg: 'rgba(245,166,35,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { label: '客户管理', path: '/mobile/sale/client', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
]

const aiModules = [
  { label: '内容创作', path: '/agent/content', bg: 'rgba(82,196,26,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
  { label: '平面设计', path: '/agent/designer', bg: 'rgba(245,166,35,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="1.8"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"/></svg>' },
  { label: '营销顾问', path: '/agent/marketing', bg: 'rgba(235,87,87,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EB5757" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { label: '热搜抓取', path: '/agent/trending', bg: 'rgba(250,140,22,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FA8C16" stroke-width="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' },
]

const investModules = [
  { label: '投资总览', path: '/mobile/investment/overview', bg: 'rgba(245,166,35,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { label: '生态园区', path: '/mobile/investment/city', bg: 'rgba(46,107,230,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { label: '市场动态', path: '/mobile/investment/market', bg: 'rgba(82,196,26,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
]

const reportModules = [
  { label: '销售统计', path: '/mobile/stats', bg: 'rgba(46,107,230,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { label: '采购统计', path: '/reports/procure', bg: 'rgba(114,46,209,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#722ED1" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>' },
  { label: '财务报表', path: '/reports/finance', bg: 'rgba(245,166,35,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { label: '库存报表', path: '/reports/stock', bg: 'rgba(5,150,105,0.1)', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/></svg>' },
]
</script>

<style scoped>
.mod-page { min-height: 100vh; background: #f0f2f5; }
.wx-nav-bar { background: #fff; display: flex; align-items: center; height: 44px; padding: 0 4px; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 20; }
.wx-nav-left { flex: 1; display: flex; align-items: center; }
.wx-nav-title { font-size: 17px; font-weight: 700; color: #1d2129; text-align: center; flex: 0 0 auto; padding: 0 8px; }
.wx-nav-right { flex: 1; }
.nav-icon-btn { width: 40px; height: 40px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 6px; }

.mod-content { padding: 12px 12px 24px; display: flex; flex-direction: column; gap: 12px; }

.mod-group {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.mod-group-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  border-bottom: 1px solid #f5f5f5;
}
.mod-group-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mod-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #f5f5f5;
  padding: 1px 0;
}

.mod-card {
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 4px 10px;
  cursor: pointer;
  transition: background 0.1s;
  -webkit-tap-highlight-color: transparent;
}
.mod-card:active { background: #f5f5f5; }

.mod-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mod-card-label {
  font-size: 12px;
  color: #333;
  text-align: center;
  line-height: 1.2;
}
</style>
