<template>
  <div class="agent-layout">

    <!-- ── 侧边栏（桌面端） ── -->
    <aside v-if="!isMobile" class="agent-sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <img src="/nomad-logo.png" alt="N" class="logo-img" />
        </div>
        <div class="logo-text-wrap">
          <span class="logo-text">Nomad Agent</span>
          <span class="logo-sub">AI 内容工作流</span>
        </div>
        <span class="ai-dot" title="AI在线"></span>
      </div>

      <!-- 品牌卡 -->
      <div class="brand-card" @click="router.push('/agent/brand')">
        <template v-if="brandStore.isConfigured">
          <div class="brand-avatar">{{ brandStore.brand.name.charAt(0) }}</div>
          <div class="brand-info">
            <div class="brand-name">{{ brandStore.brand.name }}</div>
            <div class="brand-sub">{{ brandStore.brand.subIndustry || brandStore.brand.industry || '未设置行业' }}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="brand-edit-icon">
            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          </svg>
        </template>
        <template v-else>
          <div class="brand-warn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span class="brand-unconfigured-text">配置品牌信息</span>
          <span class="brand-arrow">→</span>
        </template>
      </div>

      <!-- 导航 -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">工作区</div>
        <router-link to="/agent" class="nav-item" active-class="nav-item--active" exact>
          <span class="nav-item-icon">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <rect x="8" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <rect x="1" y="8" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <rect x="8" y="8" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            </svg>
          </span>
          <span class="nav-item-label">工作台</span>
        </router-link>

        <div class="nav-section-label" style="margin-top:8px">生产流程</div>
        <router-link
          v-for="item in workflowNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-item-icon"><component :is="item.icon" /></span>
          <span class="nav-item-label">{{ item.label }}</span>
          <span v-if="stepStatuses[item.path] === 'done'" class="wf-badge wf-done">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span v-else-if="stepStatuses[item.path] === 'active'" class="wf-badge wf-active">
            <span class="active-pulse"></span>
          </span>
        </router-link>

        <div class="nav-section-label" style="margin-top:8px">发布</div>
        <router-link to="/agent/publish" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconPublish /></span>
          <span class="nav-item-label">发布管理</span>
          <span v-if="stepStatuses['/agent/publish'] === 'done'" class="wf-badge wf-done">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span v-else-if="stepStatuses['/agent/publish'] === 'active'" class="wf-badge wf-active">
            <span class="active-pulse"></span>
          </span>
        </router-link>
      </nav>

      <!-- 底部 -->
      <div class="sidebar-footer">
        <router-link to="/agent/history" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconHistory /></span>
          <span class="nav-item-label">历史记录</span>
        </router-link>
        <router-link to="/portal" class="nav-item nav-item--back">
          <span class="nav-item-icon"><IconBack /></span>
          <span class="nav-item-label">返回主页</span>
        </router-link>
      </div>
    </aside>

    <!-- ── 移动端顶栏 ── -->
    <div v-if="isMobile" class="mobile-topbar">
      <button class="mobile-menu-btn" @click="drawerOpen = true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="mobile-title">{{ currentPageTitle }}</span>
    </div>

    <!-- 移动端抽屉 -->
    <el-drawer v-if="isMobile" v-model="drawerOpen" direction="ltr" size="75%" :with-header="false">
      <div class="drawer-inner">
        <div class="drawer-logo">
          <img src="/nomad-logo.png" alt="N" style="width:28px;height:28px;border-radius:7px;object-fit:contain" />
          <span style="font-size:14px;font-weight:700;margin-left:8px;color:#1d1d1f">Nomad Agent</span>
        </div>
        <router-link
          v-for="item in mobileNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
          @click="drawerOpen = false"
        >
          <span class="nav-item-icon"><component :is="item.icon" /></span>
          <span class="nav-item-label">{{ item.label }}</span>
        </router-link>
        <router-link to="/portal" class="nav-item nav-item--back" @click="drawerOpen = false">
          <span class="nav-item-icon"><IconBack /></span>
          <span class="nav-item-label">返回主页</span>
        </router-link>
      </div>
    </el-drawer>

    <!-- ── 主内容区 ── -->
    <main class="agent-main">
      <!-- 顶栏 -->
      <header v-if="!isMobile" class="agent-topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">{{ currentPageTitle }}</h1>
          <div v-if="brandStore.isConfigured" class="topbar-brand-tag">
            <span class="brand-dot"></span>{{ brandStore.brand.name }}
          </div>
          <div v-else class="topbar-brand-warn" @click="router.push('/agent/brand')">
            ⚠ 未配置品牌
          </div>
        </div>
        <div class="topbar-right">
          <div class="workflow-progress-tag">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0">
              <path d="M1 6h2l2-4 2 8 2-4 1 0" stroke="#0071e3" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ workflowProgressLabel }}</span>
          </div>
          <div class="ai-status">
            <span class="ai-status-dot"></span>
            <span class="ai-status-text">AI 在线</span>
          </div>
        </div>
      </header>

      <!-- 内容 -->
      <section class="agent-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import { useWorkflowStatus } from '@/composables/useWorkflowStatus'

const route = useRoute()
const router = useRouter()
const brandStore = useBrandStore()

const { stepStatuses, workflowProgressLabel } = useWorkflowStatus()

const drawerOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
function handleResize() { isMobile.value = window.innerWidth < 768 }

// ── 扁平 SVG 图标组件 ──────────────────────────────────────────────────────
const IconTrending = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('path', { d: 'M1 11L5 7L8 10L14 3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M11 3h3v3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconCopy = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('rect', { x: 3, y: 4, width: 9, height: 9, rx: 1.5, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('path', { d: 'M5 4V3a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
]) })

const IconPoster = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('rect', { x: 1, y: 1, width: 13, height: 13, rx: 2, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('rect', { x: 3, y: 3, width: 5, height: 4, rx: 1, stroke: 'currentColor', 'stroke-width': 1.1 }),
  h('path', { d: 'M9.5 4.5h2M9.5 7h2M3 9.5h9M3 11.5h6', stroke: 'currentColor', 'stroke-width': 1.1, 'stroke-linecap': 'round' }),
]) })

const IconVideo = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('rect', { x: 1, y: 3, width: 9, height: 9, rx: 1.5, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('path', { d: 'M10 6.5l4-2.5v7l-4-2.5V6.5Z', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }),
]) })

const IconLab = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('path', { d: 'M5.5 1v4.5L2 12a1 1 0 001 1h9a1 1 0 001-1L9.5 5.5V1', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M4.5 1h6', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
  h('circle', { cx: 6, cy: 9, r: 1, fill: 'currentColor', opacity: 0.6 }),
  h('circle', { cx: 9, cy: 10, r: 0.7, fill: 'currentColor', opacity: 0.4 }),
]) })

const IconPublish = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('path', { d: 'M7.5 1v9M4.5 4L7.5 1l3 3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M2 11v2h11v-2', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconHistory = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('path', { d: 'M3 7.5A4.5 4.5 0 117.5 12', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
  h('path', { d: 'M3 4v3.5h3.5', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M7.5 5v3l2 1.2', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconBack = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('path', { d: 'M9.5 2.5L5 7.5l4.5 5', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconBrand = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('path', { d: 'M7.5 1.5l1.8 4h4l-3.3 2.4 1.3 4-3.8-2.8-3.8 2.8 1.3-4L1.7 5.5h4l1.8-4z', stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }),
]) })

const workflowNavItems = [
  { path: '/agent/trending',     icon: IconTrending, label: '热搜抓取' },
  { path: '/agent/copywriting',  icon: IconCopy,     label: '文案生成' },
  { path: '/agent/poster',       icon: IconPoster,   label: '图文海报' },
  { path: '/agent/video',        icon: IconVideo,    label: '视频生成' },
  { path: '/agent/creative-lab', icon: IconLab,      label: 'AI创意实验室' },
]

const mobileNavItems = [
  { path: '/agent',              icon: defineComponent({ render: () => h('svg', { width:15, height:15, viewBox:'0 0 15 15', fill:'none' }, [h('rect',{x:1,y:1,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3}),h('rect',{x:8,y:1,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3}),h('rect',{x:1,y:8,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3}),h('rect',{x:8,y:8,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3})]) }), label: '工作台' },
  { path: '/agent/brand',        icon: IconBrand,    label: '品牌设置' },
  ...workflowNavItems,
  { path: '/agent/publish',      icon: IconPublish,  label: '发布管理' },
  { path: '/agent/history',      icon: IconHistory,  label: '历史记录' },
]

const pageTitleMap: Record<string, string> = {
  '/agent': '工作台',
  '/agent/brand': '品牌设置',
  '/agent/trending': '热搜抓取',
  '/agent/copywriting': '文案生成',
  '/agent/poster': '图文海报',
  '/agent/video': '视频生成',
  '/agent/creative-lab': 'AI创意实验室',
  '/agent/publish': '发布管理',
  '/agent/history': '历史记录',
}
const currentPageTitle = computed(() => pageTitleMap[route.path] || '智能体工作流')
</script>

<style scoped>
.agent-layout {
  display: flex;
  height: 100vh;
  background: #f5f5f7;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1d1d1f;
}

/* ── 侧边栏 ── */
.agent-sidebar {
  width: 200px;
  background: #f5f5f7;
  border-right: 1px solid rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.agent-sidebar::-webkit-scrollbar { display: none; }

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 16px 14px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.logo-icon { width: 28px; height: 28px; border-radius: 7px; overflow: hidden; flex-shrink: 0; }
.logo-img { width: 100%; height: 100%; object-fit: contain; }
.logo-text-wrap { flex: 1; min-width: 0; }
.logo-text { display: block; font-size: 12.5px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em; white-space: nowrap; }
.logo-sub { display: block; font-size: 10px; color: rgba(29,29,31,0.35); margin-top: 1px; white-space: nowrap; }
.ai-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 2px rgba(52,211,153,0.2);
  flex-shrink: 0;
  animation: aipulse 2.5s ease-in-out infinite;
}
@keyframes aipulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50% { box-shadow: 0 0 0 5px rgba(52,211,153,0.06); }
}

/* 品牌卡 */
.brand-card {
  display: flex; align-items: center; gap: 8px;
  margin: 10px 10px 4px;
  padding: 9px 10px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.brand-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.09); border-color: rgba(0,0,0,0.12); }
.brand-avatar {
  width: 26px; height: 26px; border-radius: 7px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.brand-info { flex: 1; overflow: hidden; }
.brand-name { font-size: 12px; font-weight: 600; color: #1d1d1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand-sub { font-size: 10px; color: rgba(29,29,31,0.4); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand-edit-icon { color: rgba(29,29,31,0.3); flex-shrink: 0; }
.brand-warn-icon { color: #f59e0b; display: flex; align-items: center; flex-shrink: 0; }
.brand-unconfigured-text { font-size: 12px; color: rgba(29,29,31,0.5); flex: 1; }
.brand-arrow { font-size: 12px; color: rgba(29,29,31,0.25); }

/* 导航 */
.sidebar-nav { padding: 6px 8px 0; flex: 1; }
.nav-section-label {
  padding: 4px 6px 3px;
  font-size: 9.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: rgba(29,29,31,0.28);
}
.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(29,29,31,0.5);
  font-size: 12.5px; font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 1px;
}
.nav-item:hover { background: rgba(0,0,0,0.04); color: #1d1d1f; }
.nav-item--active {
  background: #ffffff !important;
  color: #1d1d1f !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
}
.nav-item--active .nav-item-icon { color: #0071e3; }
.nav-item-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-item-label { flex: 1; letter-spacing: -0.01em; }

/* 工作流徽标 */
.wf-badge { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wf-done { color: #16a34a; }
.wf-active { }
.active-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: #0071e3;
  box-shadow: 0 0 0 2px rgba(0,113,227,0.2);
  animation: aipulse 2s ease-in-out infinite;
}

/* 底部 */
.sidebar-footer {
  padding: 6px 8px 12px;
  border-top: 1px solid rgba(0,0,0,0.06);
  display: flex; flex-direction: column; gap: 1px;
}
.nav-item--back { color: rgba(29,29,31,0.3); }
.nav-item--back:hover { color: rgba(29,29,31,0.6); }

/* ── 主内容 ── */
.agent-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

/* 顶栏 */
.agent-topbar {
  height: 52px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.topbar-title { font-size: 15px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: -0.02em; }
.topbar-brand-tag {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #0071e3;
  background: rgba(0,113,227,0.07); border: 1px solid rgba(0,113,227,0.15);
  padding: 3px 10px; border-radius: 20px;
}
.brand-dot { width: 5px; height: 5px; border-radius: 50%; background: #0071e3; }
.topbar-brand-warn {
  font-size: 11px; color: #f59e0b;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  padding: 3px 10px; border-radius: 20px; cursor: pointer; font-weight: 600;
}
.topbar-right { display: flex; align-items: center; gap: 14px; }
.workflow-progress-tag {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.5);
  background: #f5f5f7; border-radius: 20px; padding: 4px 11px;
}
.ai-status { display: flex; align-items: center; gap: 5px; }
.ai-status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399; box-shadow: 0 0 0 2px rgba(52,211,153,0.2);
  animation: aipulse 2.5s ease-in-out infinite;
}
.ai-status-text { font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.4); }

/* 内容区 */
.agent-content { flex: 1; overflow-y: auto; padding: 24px 28px; background: #f5f5f7; }

/* ── 移动端 ── */
.mobile-topbar {
  height: 50px; background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex; align-items: center; padding: 0 14px; gap: 10px;
  position: sticky; top: 0; z-index: 20; flex-shrink: 0;
}
.mobile-menu-btn { background: none; border: none; padding: 6px; cursor: pointer; color: rgba(29,29,31,0.5); display: flex; align-items: center; }
.mobile-title { flex: 1; font-size: 15px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em; }
.drawer-inner { padding: 10px 8px 14px; }
.drawer-logo { display: flex; align-items: center; padding: 8px 6px 14px; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 8px; }

@media (max-width: 767px) {
  .agent-layout { display: block; height: auto; min-height: 100vh; }
  .agent-main { min-height: calc(100vh - 50px); }
  .agent-content { padding: 14px 12px 24px; }
}
</style>
