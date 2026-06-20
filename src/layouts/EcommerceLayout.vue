<template>
  <div class="ecom-layout">
    <aside class="ecom-sidebar">
      <div class="ecom-logo" @click="router.push('/portal')">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="#0f766e" stroke-width="1.8" />
          <path d="M7 14l3-3 2 2 5-5" stroke="#0f766e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8 21h8M12 17v4" stroke="#0f766e" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <div class="ecom-logo-text">
          <span class="ecom-logo-name">{{ $t('ecommerce.centerTitle') }}</span>
          <span class="ecom-logo-sub">{{ $t('ecommerce.centerSubtitle') }}</span>
        </div>
      </div>

      <nav class="ecom-nav">
        <router-link to="/ecommerce/overview" class="ecom-nav-item" active-class="ecom-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M7 15l3-3 2 2 5-5" />
          </svg>
          <span>{{ $t('ecommerce.navOverview') }}</span>
        </router-link>
        <router-link to="/ecommerce/agent" class="ecom-nav-item" active-class="ecom-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <path d="M18 6l3 3-3 3" />
          </svg>
          <span>{{ $t('ecommerce.navAgent') }}</span>
        </router-link>
        <router-link to="/ecommerce/platforms" class="ecom-nav-item" active-class="ecom-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>{{ $t('ecommerce.navPlatforms') }}</span>
        </router-link>
        <router-link to="/ecommerce/meituan" class="ecom-nav-item" active-class="ecom-nav-active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <span>{{ $t('ecommerce.navMeituan') }}</span>
        </router-link>
      </nav>

      <div class="ecom-sidebar-footer">
        <div class="ecom-foot-card">
          <div class="ecom-foot-title">{{ $t('ecommerce.footTitle') }}</div>
          <div class="ecom-foot-desc">{{ $t('ecommerce.footDesc') }}</div>
        </div>
        <div class="ecom-back-btn" @click="router.push('/portal')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span>{{ $t('ecommerce.backHome') }}</span>
        </div>
      </div>
    </aside>

    <main class="ecom-main">
      <div class="ecom-topbar">
        <div class="ecom-topbar-copy">
          <div class="ecom-topbar-title">{{ routeTitle }}</div>
          <div class="ecom-topbar-sub">{{ $t('ecommerce.topbarSub') }}</div>
        </div>
        <CaptainBar class="ecom-captain" />
      </div>
      <div class="ecom-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CaptainBar from '@/components/CaptainBar.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const routeTitle = computed(() => {
  const routeName = String(route.name || '')
  if (routeName && ['EcommerceOverview', 'EcommercePlatforms', 'EcommerceOrders', 'EcommerceStock', 'EcommerceOffline', 'EcommerceAgent'].includes(routeName)) {
    return t(`ecommerce.routeTitle.${routeName}`)
  }
  return (route.meta.title as string) || t('ecommerce.centerTitle')
})
</script>

<style scoped>
.ecom-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.08), transparent 24%),
    linear-gradient(180deg, #f4f7f6 0%, #eef2f0 100%);
}

.ecom-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.88);
  border-right: 1px solid rgba(15, 118, 110, 0.08);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
}

.ecom-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.ecom-logo-text {
  display: flex;
  flex-direction: column;
}

.ecom-logo-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.ecom-logo-sub {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.ecom-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ecom-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  color: #475569;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: 0.18s ease;
}

.ecom-nav-item:hover {
  background: rgba(15, 118, 110, 0.08);
  color: #0f766e;
}

.ecom-nav-active {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.14), rgba(20, 184, 166, 0.08));
  color: #0f766e;
  box-shadow: inset 0 0 0 1px rgba(13, 148, 136, 0.12);
}

.ecom-sidebar-footer {
  padding: 12px 10px 16px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.ecom-foot-card {
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.95), rgba(204, 251, 241, 0.82));
  margin-bottom: 10px;
}

.ecom-foot-title {
  font-size: 12px;
  font-weight: 700;
  color: #134e4a;
}

.ecom-foot-desc {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.5;
  color: #0f766e;
}

.ecom-back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
}

.ecom-back-btn:hover {
  background: rgba(148, 163, 184, 0.1);
  color: #0f172a;
}

.ecom-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ecom-topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 16px 18px 10px;
  backdrop-filter: blur(18px);
  background: linear-gradient(180deg, rgba(244, 247, 246, 0.94), rgba(244, 247, 246, 0.74));
}

.ecom-topbar-copy {
  margin-bottom: 10px;
}

.ecom-topbar-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.ecom-topbar-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.ecom-captain {
  width: 100%;
}

.ecom-content {
  flex: 1;
  min-width: 0;
  padding: 0 18px 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
