<template>
  <div class="apps-page">

    <!-- 顶部 -->
    <div class="apps-header">
      <div class="apps-title">{{ t('mobileApps.title') }}</div>
      <div class="apps-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="searchKeyword" class="apps-search-input" :placeholder="t('mobileApps.searchPlaceholder')" />
        <button v-if="searchKeyword" class="apps-search-clear" @click="searchKeyword = ''">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="apps-body">
      <div v-for="section in filteredSections" :key="section.key" class="apps-section">
        <div class="section-header">
          <div class="section-dot" :style="{ background: getColor(section.key) }"></div>
          <span class="section-title">{{ t(section.title) }}</span>
        </div>
        <div class="apps-grid">
          <div
            v-for="item in section.children"
            :key="item.key"
            class="app-item"
            :class="{ 'app-item--pressed': pressedKey === item.key }"
            @touchstart.passive="pressedKey = item.key"
            @touchend="pressedKey = null"
            @touchcancel="pressedKey = null"
            @click="navigate(item.path)"
          >
            <div class="app-icon" :style="{ background: getColor(section.key) }">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" v-html="getIcon(item.key)" />
            </div>
            <span class="app-label">{{ t(item.title) }}</span>
          </div>
        </div>
      </div>

      <div v-if="filteredSections.length === 0" class="apps-empty">
        {{ t('mobileApps.noResults', { keyword: searchKeyword }) }}
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { menuData } from '@/layouts/components/menuData'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const searchKeyword = ref('')
const pressedKey = ref<string | null>(null)

const appSections = menuData.filter(s => s.key !== 'dashboard')

const filteredSections = computed(() => {
  const kw = searchKeyword.value.trim()
  if (!kw) return appSections
  return appSections
    .map(s => ({
      ...s,
      children: s.children.filter((c: any) => t(c.title).toLocaleLowerCase().includes(kw.toLocaleLowerCase())),
    }))
    .filter(s => s.children.length > 0)
})

function navigate(path?: string) {
  if (!path) return
  router.push(path)
}

const moduleColors: Record<string, string> = {
  customer:   '#16a34a',
  sale:       '#0071e3',
  retail:     '#f97316',
  procure:    '#7c3aed',
  warehouse:  '#0891b2',
  production: '#db2777',
  outsource:  '#ca8a04',
  finance:    '#059669',
  goods:      '#dc2626',
  reports:    '#475569',
  office:     '#16a34a',
  setting:    '#64748b',
  personnel:  '#0d9488',
}

function getColor(key: string) { return moduleColors[key] || '#0071e3' }

const iconMap: Record<string, string> = {
  'sale-client':   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  'sale-sea':      '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  'sale-level':    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'sale-commission-setting': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'sale-offer':    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  'sale-contract': '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  'sale-out':      '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'sale-return':   '<path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 0 1 0 8h-1"/>',
  'retail-store':  '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'retail-order':  '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>',
  'retail-return': '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.71L1 10"/>',
  'retail-customer':'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'retail-recharge':'<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  'retail-points': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'retail-coupon': '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  'procure-supplier':'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'procure-plan':  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>',
  'procure-order': '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  'procure-inhouse':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'procure-return':'<path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 0 1 0 8h-1"/>',
  'warehouse-stock':'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'warehouse-flow':'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  'warehouse-other-in':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'warehouse-other-out':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  'warehouse-check':'<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  'warehouse-name': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'warehouse-warning':'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  'finance-overview':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'finance-collect-receipt':'<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  'finance-pay-receipt':'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  'finance-receivable':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'finance-payable':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'finance-fund':  '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  'finance-expense':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>',
  'goods-info':    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  'reports-overview':'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  'reports-sale-rate':'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  'personnel-staff':'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  'personnel-salary':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
}
const defaultIcon = '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>'
function getIcon(key: string) { return iconMap[key] || defaultIcon }
</script>

<style scoped>
.apps-page {
  min-height: 100%;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.apps-header {
  background: #fff;
  padding: 14px 16px 10px;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.apps-title {
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.apps-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f2f3f5;
  border-radius: 8px;
  padding: 8px 12px;
}
.apps-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1d2129;
}
.apps-search-input::placeholder { color: #c2c8d5; }
.apps-search-clear { background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; }

.apps-body {
  flex: 1;
  padding-bottom: 80px;
}

.apps-section {
  background: #fff;
  margin-top: 6px;
  padding: 12px 16px 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}
.section-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #86909c;
  letter-spacing: 0.01em;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 4px;
  margin-bottom: 6px;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 4px 2px;
  border-radius: 10px;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.1s;
}
.app-item--pressed { opacity: 0.65; transform: scale(0.95); }

.app-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

.app-label {
  font-size: 11px;
  color: #333;
  text-align: center;
  line-height: 1.3;
  word-break: keep-all;
  font-weight: 400;
}

.apps-empty {
  margin: 60px auto;
  text-align: center;
  font-size: 14px;
  color: #86909c;
}
</style>
