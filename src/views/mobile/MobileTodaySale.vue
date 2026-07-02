<template>
  <div class="today-sale">
    <div class="ts-header">
      <span class="ts-back" @click="router.back()">‹</span>
      <span class="ts-title">{{ t('mobileStats.salesReport') }}</span>
    </div>

    <div class="ts-entries">
      <div class="ts-entry" @click="router.push('/mobile/sale/contract')">
        <div class="ts-entry-icon blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div class="ts-entry-text">{{ t('mobileTodaySale.entrySaleOrders') }}</div>
      </div>
      <div class="ts-entry" @click="router.push('/mobile/retail/order')">
        <div class="ts-entry-icon orange">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <div class="ts-entry-text">{{ t('mobileTodaySale.entryRetailOrders') }}</div>
      </div>
      <div class="ts-entry" @click="router.push('/mobile/online/overview')">
        <div class="ts-entry-icon green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div class="ts-entry-text">{{ t('mobileTodaySale.entryOnlineOrders') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
</script>

<style scoped>
.today-sale {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f7;
}

.ts-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.ts-back {
  font-size: 24px;
  color: #0071e3;
  margin-right: 10px;
  cursor: pointer;
  line-height: 1;
}
.ts-title {
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
}

.ts-entries {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  padding: 16px 12px;
  background: #f5f5f7;
}
.ts-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 12px;
  padding: 18px 8px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.ts-entry:active {
  background: #f5f5f7;
}
.ts-entry-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  color: #fff;
}
.ts-entry-icon.blue { background: #0071e3; }
.ts-entry-icon.orange { background: #f77234; }
.ts-entry-icon.green { background: #00b42a; }
.ts-entry-text {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  text-align: center;
}
</style>
