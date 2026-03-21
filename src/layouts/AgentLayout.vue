<template>
  <div class="agent-layout">

    <!-- ── 侧边栏（桌面端） ── -->
    <aside v-if="!isMobile" class="agent-sidebar">
      <!-- Logo区域：公司名 + 品牌名 -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <img src="/nomad-logo.png" alt="N" class="logo-img" />
        </div>
        <div class="logo-text-wrap">
          <span class="logo-text">数字游牧传媒</span>
          <span class="logo-sub" v-if="brandStore.isConfigured">{{ brandStore.brand.name }}</span>
          <span class="logo-sub dim" v-else>未配置品牌</span>
        </div>
        <span class="ai-dot" title="AI在线"></span>
      </div>

      <!-- 品牌未配置时的醒目警告条 -->
      <div v-if="!brandStore.isConfigured" class="brand-warn-bar" @click="router.push('/agent/brand')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="warn-icon">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>请先配置品牌信息</span>
        <span class="warn-arrow">→</span>
      </div>

      <!-- 导航：总部 -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">总部</div>
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
        <router-link to="/agent/meeting" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconMeeting /></span>
          <span class="nav-item-label">会议室</span>
          <span v-if="meetingStore.isRunning" class="wf-badge wf-active"><span class="active-pulse"></span></span>
        </router-link>

        <!-- 内容部 -->
        <div class="nav-section-label" style="margin-top:10px">
          <span class="dept-emoji-small">✍️</span> 内容部
        </div>
        <router-link to="/agent/copywriting" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconCopy /></span>
          <span class="nav-item-label">林晓文 · 文案</span>
          <span v-if="stepStatuses['/agent/copywriting'] === 'done'" class="wf-badge wf-done">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </router-link>
        <router-link to="/agent/video" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconVideo /></span>
          <span class="nav-item-label">张明远 · 视频</span>
          <span v-if="stepStatuses['/agent/video'] === 'done'" class="wf-badge wf-done">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </router-link>

        <!-- 创意部 -->
        <div class="nav-section-label" style="margin-top:10px">
          <span class="dept-emoji-small">🎨</span> 创意部
        </div>
        <router-link to="/agent/poster" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconPoster /></span>
          <span class="nav-item-label">陈美琪 · 设计</span>
          <span v-if="stepStatuses['/agent/poster'] === 'done'" class="wf-badge wf-done">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </router-link>

        <!-- 品牌部 -->
        <div class="nav-section-label" style="margin-top:10px">
          <span class="dept-emoji-small">💎</span> 品牌部
        </div>
        <router-link to="/agent/brand" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconBrand /></span>
          <span class="nav-item-label">王思远 · 品牌</span>
        </router-link>

        <!-- 情报部 -->
        <div class="nav-section-label" style="margin-top:10px">
          <span class="dept-emoji-small">📈</span> 情报部
        </div>
        <router-link to="/agent/trending" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconTrending /></span>
          <span class="nav-item-label">刘浩然 · 趋势</span>
          <span v-if="stepStatuses['/agent/trending'] === 'done'" class="wf-badge wf-done">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </router-link>

        <!-- 发布部 -->
        <div class="nav-section-label" style="margin-top:10px">
          <span class="dept-emoji-small">🚀</span> 发布部
        </div>
        <router-link to="/agent/publish" class="nav-item" active-class="nav-item--active">
          <span class="nav-item-icon"><IconPublish /></span>
          <span class="nav-item-label">赵欣然 · 发布</span>
          <span v-if="stepStatuses['/agent/publish'] === 'done'" class="wf-badge wf-done">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
          <span style="font-size:14px;font-weight:700;margin-left:8px;color:#1d1d1f">数字游牧传媒</span>
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
          <!-- 主题切换 -->
          <div class="topbar-theme-btns">
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'light' }" title="亮色" @click="appStore.setTheme('light')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'dark' }" title="暗黑" @click="appStore.setTheme('dark')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'eye' }" title="护眼" @click="appStore.setTheme('eye')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
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
import { useAppStore } from '@/stores/app'
import { useMeetingStore } from '@/stores/meeting'
import { useWorkflowStatus } from '@/composables/useWorkflowStatus'

const route = useRoute()
const router = useRouter()
const brandStore = useBrandStore()
const appStore = useAppStore()
const meetingStore = useMeetingStore()

const { stepStatuses, workflowProgressLabel } = useWorkflowStatus()

const drawerOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
function handleResize() { isMobile.value = window.innerWidth < 768 }

// ── 扁平 SVG 图标组件 ──────────────────────────────────────────────────────
const IconMeeting = defineComponent({ render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' }, [
  h('rect', { x: 1, y: 2, width: 13, height: 9, rx: 2, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('path', { d: 'M5 13h5M7.5 11v2', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
  h('circle', { cx: 4.5, cy: 6.5, r: 1.2, fill: 'currentColor', opacity: 0.7 }),
  h('circle', { cx: 7.5, cy: 6.5, r: 1.2, fill: 'currentColor', opacity: 0.7 }),
  h('circle', { cx: 10.5, cy: 6.5, r: 1.2, fill: 'currentColor', opacity: 0.7 }),
]) })

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

// 移动端导航项
const mobileNavItems = [
  { path: '/agent', icon: defineComponent({ render: () => h('svg', { width:15, height:15, viewBox:'0 0 15 15', fill:'none' }, [h('rect',{x:1,y:1,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3}),h('rect',{x:8,y:1,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3}),h('rect',{x:1,y:8,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3}),h('rect',{x:8,y:8,width:6,height:6,rx:1.5,stroke:'currentColor','stroke-width':1.3})]) }), label: '工作台' },
  { path: '/agent/meeting', icon: IconMeeting, label: '会议室' },
  { path: '/agent/brand',   icon: IconBrand,   label: '王思远 · 品牌' },
  { path: '/agent/trending', icon: IconTrending, label: '刘浩然 · 趋势' },
  { path: '/agent/copywriting', icon: IconCopy, label: '林晓文 · 文案' },
  { path: '/agent/poster',  icon: IconPoster,  label: '陈美琪 · 设计' },
  { path: '/agent/video',   icon: IconVideo,   label: '张明远 · 视频' },
  { path: '/agent/publish', icon: IconPublish, label: '赵欣然 · 发布' },
  { path: '/agent/history', icon: IconHistory, label: '历史记录' },
]

// 页面标题映射
const pageTitleMap: Record<string, string> = {
  '/agent': '工作台',
  '/agent/meeting': '会议室',
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
  background: var(--gray);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--dark);
}

/* ── 侧边栏 ── */
.agent-sidebar {
  width: 210px;
  background: var(--gray);
  border-right: 1px solid var(--border);
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
  border-bottom: 1px solid var(--border);
}
.logo-icon { width: 28px; height: 28px; border-radius: 7px; overflow: hidden; flex-shrink: 0; }
.logo-img { width: 100%; height: 100%; object-fit: contain; }
.logo-text-wrap { flex: 1; min-width: 0; }
.logo-text { display: block; font-size: 12px; font-weight: 700; color: var(--dark); letter-spacing: -0.02em; white-space: nowrap; }
.logo-sub { display: block; font-size: 10px; color: var(--dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logo-sub.dim { color: #f59e0b; }
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

/* 品牌未配置警告条 */
.brand-warn-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 10px 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(245,158,11,0.09);
  border: 1px solid rgba(245,158,11,0.25);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  transition: background 0.15s;
}
.brand-warn-bar:hover { background: rgba(245,158,11,0.15); }
.warn-icon { flex-shrink: 0; }
.warn-arrow { margin-left: auto; }

/* 部门小emoji标签 */
.dept-emoji-small {
  margin-right: 3px;
  font-size: 10px;
}

/* 导航 */
.sidebar-nav { padding: 6px 8px 0; flex: 1; }
.nav-section-label {
  padding: 4px 6px 3px;
  font-size: 9.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--dim);
  display: flex; align-items: center;
}
.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--mid);
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 1px;
}
.nav-item:hover { background: var(--faint); color: var(--dark); }
.nav-item--active {
  background: var(--card-bg) !important;
  color: var(--dark) !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
}
.nav-item--active .nav-item-icon { color: #0071e3; }
.nav-item-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-item-label { flex: 1; letter-spacing: -0.01em; }

/* 工作流徽标 */
.wf-badge { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wf-done { color: #16a34a; }
.active-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: #0071e3;
  box-shadow: 0 0 0 2px rgba(0,113,227,0.2);
  animation: aipulse 2s ease-in-out infinite;
}

/* 底部 */
.sidebar-footer {
  padding: 6px 8px 12px;
  border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 1px;
}
.nav-item--back { color: var(--dim); }
.nav-item--back:hover { color: var(--mid); }

/* ── 主内容 ── */
.agent-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

/* 顶栏 */
.agent-topbar {
  height: 52px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.topbar-title { font-size: 15px; font-weight: 700; color: var(--dark); margin: 0; letter-spacing: -0.02em; }
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

.topbar-theme-btns {
  display: flex; align-items: center; gap: 4px;
  background: var(--gray); border-radius: 999px; padding: 4px 6px;
  border: 1px solid var(--border);
}
.topbar-theme-btn {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--mid); transition: background 0.15s, color 0.15s;
}
.topbar-theme-btn:hover { background: var(--gray-2); color: var(--dark); }
.topbar-theme-btn.active { background: var(--card-bg); color: var(--blue); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

.workflow-progress-tag {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--mid);
  background: var(--gray); border-radius: 20px; padding: 4px 11px;
}
.ai-status { display: flex; align-items: center; gap: 5px; }
.ai-status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399; box-shadow: 0 0 0 2px rgba(52,211,153,0.2);
  animation: aipulse 2.5s ease-in-out infinite;
}
.ai-status-text { font-size: 11px; font-weight: 600; color: var(--mid); }

/* 内容区 */
.agent-content { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--gray); }

/* ── 移动端 ── */
.mobile-topbar {
  height: 50px; background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 14px; gap: 10px;
  position: sticky; top: 0; z-index: 20; flex-shrink: 0;
}
.mobile-menu-btn { background: none; border: none; padding: 6px; cursor: pointer; color: var(--mid); display: flex; align-items: center; }
.mobile-title { flex: 1; font-size: 15px; font-weight: 700; color: var(--dark); letter-spacing: -0.02em; }
.drawer-inner { padding: 10px 8px 14px; }
.drawer-logo { display: flex; align-items: center; padding: 8px 6px 14px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }

@media (max-width: 767px) {
  .agent-layout { display: block; height: auto; min-height: 100vh; }
  .agent-main { min-height: calc(100vh - 50px); }
  .agent-content { padding: 14px 12px 24px; }
}
</style>
