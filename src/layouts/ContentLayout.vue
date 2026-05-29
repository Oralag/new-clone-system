<template>
  <div class="cnt-layout">
    <aside class="cnt-sidebar">
      <div class="cnt-logo" @click="router.push('/portal')">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="#7c3aed" stroke-width="1.8"/>
          <path d="M7 8h10M7 12h7" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M8 21h8M12 17v4" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <div class="cnt-logo-text">
          <span class="cnt-logo-name">内容运营中心</span>
          <span class="cnt-logo-sub">AI 专员 + 多渠道 + 内容日历</span>
        </div>
      </div>

      <nav class="cnt-nav">
        <router-link to="/content/overview" class="cnt-nav-item" active-class="cnt-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M7 15l3-3 2 2 5-5"/>
          </svg>
          <span>运营大屏</span>
        </router-link>
        <router-link to="/content/channels" class="cnt-nav-item" active-class="cnt-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9"/>
            <path d="M12 3v2M12 19v2M3 12H1M23 12h-2"/>
          </svg>
          <span>渠道管理</span>
        </router-link>
        <router-link to="/content/calendar" class="cnt-nav-item" active-class="cnt-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span>内容日历</span>
        </router-link>
        <router-link to="/content/agent" class="cnt-nav-item" active-class="cnt-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            <path d="M18 6l3 3-3 3"/>
          </svg>
          <span>内容工作台</span>
        </router-link>
      </nav>

      <div class="cnt-sidebar-footer">
        <div class="cnt-foot-card">
          <div class="cnt-foot-title">AI 内容专员随时待命</div>
          <div class="cnt-foot-desc">策略师、文案、创意三位专员，帮你产出各渠道内容。</div>
        </div>
        <div class="cnt-back-btn" @click="router.push('/portal')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span>返回主页</span>
        </div>
      </div>
    </aside>

    <main class="cnt-main">
      <div class="cnt-topbar">
        <div class="cnt-topbar-copy">
          <div class="cnt-topbar-title">{{ (route.meta.title as string) || '内容运营中心' }}</div>
          <div class="cnt-topbar-sub">AI 内容专员团队 + 多渠道管理 + 内容日历，一站式运营内容业务</div>
        </div>
        <CaptainBar class="cnt-captain" />
      </div>
      <div class="cnt-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import CaptainBar from '@/components/CaptainBar.vue'

const router = useRouter()
const route = useRoute()
</script>

<style scoped>
.cnt-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(124,58,237,0.07), transparent 24%),
    linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%);
}

.cnt-sidebar {
  width: 220px; flex-shrink: 0;
  background: rgba(255,255,255,0.9);
  border-right: 1px solid rgba(124,58,237,0.08);
  backdrop-filter: blur(18px);
  display: flex; flex-direction: column;
}

.cnt-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 16px 16px; cursor: pointer;
  border-bottom: 1px solid rgba(15,23,42,0.06);
}
.cnt-logo-text { display: flex; flex-direction: column; }
.cnt-logo-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.cnt-logo-sub { font-size: 11px; color: #64748b; margin-top: 2px; }

.cnt-nav {
  flex: 1; padding: 12px 10px;
  display: flex; flex-direction: column; gap: 4px;
}

.cnt-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 12px;
  color: #475569; text-decoration: none;
  font-size: 13px; font-weight: 600; transition: 0.18s ease;
}
.cnt-nav-item:hover { background: rgba(124,58,237,0.08); color: #7c3aed; }
.cnt-nav-active {
  background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(139,92,246,0.07));
  color: #7c3aed;
  box-shadow: inset 0 0 0 1px rgba(124,58,237,0.12);
}

.cnt-sidebar-footer {
  padding: 12px 10px 16px;
  border-top: 1px solid rgba(15,23,42,0.06);
}

.cnt-foot-card {
  padding: 12px; border-radius: 12px; margin-bottom: 10px;
  background: linear-gradient(180deg, rgba(245,243,255,0.95), rgba(237,233,254,0.85));
}
.cnt-foot-title { font-size: 12px; font-weight: 700; color: #4c1d95; }
.cnt-foot-desc { margin-top: 4px; font-size: 11px; line-height: 1.5; color: #7c3aed; }

.cnt-back-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 10px;
  font-size: 12px; color: #64748b; cursor: pointer;
}
.cnt-back-btn:hover { background: rgba(148,163,184,0.1); color: #0f172a; }

.cnt-main {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; overflow: hidden;
}

.cnt-topbar {
  padding: 16px 18px 10px;
  backdrop-filter: blur(18px);
  background: linear-gradient(180deg, rgba(245,243,255,0.94), rgba(245,243,255,0.74));
}

.cnt-topbar-copy { margin-bottom: 10px; }
.cnt-topbar-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.cnt-topbar-sub { margin-top: 4px; font-size: 13px; color: #64748b; }

.cnt-captain { width: 100%; }

.cnt-content {
  flex: 1; min-width: 0;
  padding: 0 18px 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
