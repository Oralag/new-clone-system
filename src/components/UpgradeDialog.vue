<template>
  <el-dialog
    v-model="visible"
    :width="step === 'pay' ? '480px' : '860px'"
    :show-close="false"
    append-to-body
    align-center
    class="upgrade-dialog-wrap"
  >
    <div class="ud">
      <button class="ud-close" @click="visible = false">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <template v-if="step === 'plan'">
        <div class="ud-layout">
          <div class="ud-left">
            <div class="ud-brand">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="8" fill="url(#udg)"/>
                <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue',Arial,sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
                <circle cx="27" cy="8" r="4" fill="#F19D38"/>
                <defs><linearGradient id="udg" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#1C2B48"/><stop offset="100%" stop-color="#1D3974"/></linearGradient></defs>
              </svg>
              <span>{{ t('upgradeDialog.brand') }}</span>
            </div>
            <h2 class="ud-headline">{{ t('upgradeDialog.headline') }}</h2>
            <p class="ud-sub">{{ t('upgradeDialog.subline') }}</p>

            <div class="tier-tabs">
              <button
                class="tier-tab"
                :class="{ active: activeTier === 'vip' }"
                @click="activeTier = 'vip'; selectedBilling = 'monthly'"
              >
                <span class="tier-icon">⭐</span> VIP
              </button>
              <button
                class="tier-tab svip-tab"
                :class="{ active: activeTier === 'svip' }"
                @click="activeTier = 'svip'; selectedBilling = 'monthly'"
              >
                <span class="tier-icon">👑</span> SVIP
                <span class="tier-badge">{{ t('upgradeDialog.recommended') }}</span>
              </button>
            </div>

            <div class="price-cards">
              <div
                v-for="b in billingOptions"
                :key="b.id"
                class="price-card"
                :class="{ 'price-card-active': selectedBilling === b.id, 'price-card-svip': activeTier === 'svip' && selectedBilling === b.id }"
                @click="selectedBilling = b.id"
              >
                <div class="pc-tag-row">
                  <span class="pc-label">{{ b.label }}</span>
                  <span v-if="b.tag" class="pc-badge">{{ b.tag }}</span>
                </div>
                <div class="pc-price">
                  <span class="pc-currency">¥</span>
                  <span class="pc-num">{{ pricing[activeTier][b.id].price }}</span>
                  <span class="pc-period">/{{ pricing[activeTier][b.id].period }}</span>
                </div>
                <div v-if="pricing[activeTier][b.id].note" class="pc-note">{{ pricing[activeTier][b.id].note }}</div>
              </div>
            </div>
          </div>

          <div class="ud-right">
            <div class="ud-perm-title">{{ t('upgradeDialog.featureCompare') }}</div>
            <div class="ud-perms">
              <div v-for="g in currentPermGroups" :key="g.label" class="perm-group">
                <div class="perm-group-label">{{ g.label }}</div>
                <div class="perm-items">
                  <div v-for="item in g.items" :key="item.text" class="perm-item">
                    <span class="perm-check" :class="item.included ? 'check-yes' : 'check-no'">
                      {{ item.included ? '✓' : '✗' }}
                    </span>
                    <span :class="item.included ? '' : 'perm-dim'">{{ item.text }}</span>
                  </div>
                </div>
              </div>
            </div>
            <button class="ud-cta" :class="activeTier === 'svip' ? 'ud-cta-svip' : ''" @click="step = 'pay'">
              {{ t('upgradeDialog.confirmPlan') }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <p class="ud-cta-note">{{ t('upgradeDialog.ctaNote') }}</p>
          </div>
        </div>
      </template>

      <template v-if="step === 'pay'">
        <div class="pay-wrap">
          <button class="pay-back" @click="step = 'plan'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {{ t('common.back') }}
          </button>

          <div class="pay-header">
            <div class="pay-title">{{ t('upgradeDialog.scanToPay') }}</div>
            <div class="pay-plan-info">
              {{ t('upgradeDialog.selectedPlan') }}: <strong>{{ activeTier === 'svip' ? 'SVIP' : 'VIP' }} · {{ currentPrice.label }}</strong>
              <span class="pay-price">¥{{ currentPrice.price }} / {{ currentPrice.period }}</span>
            </div>
          </div>

          <div class="qr-area">
            <div class="qr-box">
              <div class="qr-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.25">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
                  <rect x="14" y="14" width="3" height="3" fill="currentColor" stroke="none"/><rect x="18" y="14" width="3" height="3" fill="currentColor" stroke="none"/><rect x="14" y="18" width="3" height="3" fill="currentColor" stroke="none"/><rect x="18" y="18" width="3" height="3" fill="currentColor" stroke="none"/>
                </svg>
                <div class="qr-placeholder-text">{{ t('upgradeDialog.wechatQr') }}</div>
                <div class="qr-placeholder-hint">{{ t('upgradeDialog.replaceQrHint') }}</div>
              </div>
            </div>
            <div class="qr-wechat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#07C160"><path d="M9.5 4C5.36 4 2 6.91 2 10.5c0 1.99 1.03 3.78 2.66 4.97L4 18l2.74-1.37C7.72 16.87 8.6 17 9.5 17c.17 0 .33 0 .5-.01A5.97 5.97 0 009.5 15c0-3.31 2.91-6 6.5-6 .17 0 .33 0 .5.01C15.79 6.64 12.94 4 9.5 4zm-1.75 3.5a1 1 0 110 2 1 1 0 010-2zm3.5 0a1 1 0 110 2 1 1 0 010-2zM16 11c-2.76 0-5 1.79-5 4s2.24 4 5 4c.66 0 1.29-.1 1.87-.3L20 20l-.57-2.28A3.92 3.92 0 0021 15c0-2.21-2.24-4-5-4zm-1.25 2.5a.75.75 0 110 1.5.75.75 0 010-1.5zm2.5 0a.75.75 0 110 1.5.75.75 0 010-1.5z"/></svg>
              {{ t('upgradeDialog.wechatPay') }}
            </div>
          </div>

          <div class="pay-steps">
            <div class="pay-step"><span class="ps-num">1</span>{{ t('upgradeDialog.payStep1') }}</div>
            <div class="pay-step"><span class="ps-num">2</span>{{ t('upgradeDialog.payStep2') }}</div>
            <div class="pay-step"><span class="ps-num">3</span>{{ t('upgradeDialog.payStep3') }}</div>
          </div>

          <button class="pay-confirm-btn" @click="step = 'done'">
            {{ t('upgradeDialog.paidConfirm') }}
          </button>

          <div class="pay-alt">
            {{ t('upgradeDialog.altContactPrefix') }} <strong>nomad_erp</strong> {{ t('upgradeDialog.altContactMiddle') }} <strong>contact@nomaderp.com</strong> {{ t('upgradeDialog.altContactSuffix') }}
          </div>
        </div>
      </template>

      <template v-if="step === 'done'">
        <div class="done-wrap">
          <div class="done-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="done-title">{{ t('upgradeDialog.doneTitle') }}</div>
          <div class="done-desc">{{ t('upgradeDialog.doneDescPrefix') }} <strong>{{ t('upgradeDialog.twoHours') }}</strong> {{ t('upgradeDialog.doneDescMiddle') }}<br/>{{ t('upgradeDialog.doneDescSuffix') }}</div>
          <div class="done-contact">
            {{ t('upgradeDialog.urgentContact') }} <strong>nomad_erp</strong>{{ t('upgradeDialog.wechatLabel') }}
          </div>
          <button class="done-close-btn" @click="visible = false">{{ t('upgradeDialog.doneClose') }}</button>
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const visible = ref(false)
const step = ref<'plan' | 'pay' | 'done'>('plan')
const activeTier = ref<'vip' | 'svip'>('vip')
const selectedBilling = ref<'monthly' | 'annual' | 'lifetime'>('monthly')

type BillingId = 'monthly' | 'annual' | 'lifetime'
type TierId = 'vip' | 'svip'

const billingOptions = computed<{ id: BillingId; label: string; tag?: string }[]>(() => [
  { id: 'monthly', label: t('upgradeDialog.billingMonthly') },
  { id: 'annual', label: t('upgradeDialog.billingAnnual'), tag: t('upgradeDialog.billingAnnualTag') },
  { id: 'lifetime', label: t('upgradeDialog.billingLifetime') },
])

const pricing = computed<Record<TierId, Record<BillingId, { price: string; period: string; label: string; note: string }>>>(() => ({
  vip: {
    monthly: { price: '39', period: t('upgradeDialog.periodMonth'), label: t('upgradeDialog.billingMonthly'), note: '' },
    annual: { price: '299', period: t('upgradeDialog.periodYear'), label: t('upgradeDialog.billingAnnual'), note: t('upgradeDialog.vipAnnualNote') },
    lifetime: { price: '1599', period: t('upgradeDialog.periodLifetime'), label: t('upgradeDialog.billingLifetime'), note: t('upgradeDialog.vipLifetimeNote') },
  },
  svip: {
    monthly: { price: '129', period: t('upgradeDialog.periodMonth'), label: t('upgradeDialog.billingMonthly'), note: '' },
    annual: { price: '999', period: t('upgradeDialog.periodYear'), label: t('upgradeDialog.billingAnnual'), note: t('upgradeDialog.svipAnnualNote') },
    lifetime: { price: '3999', period: t('upgradeDialog.periodLifetime'), label: t('upgradeDialog.billingLifetime'), note: t('upgradeDialog.svipLifetimeNote') },
  },
}))

const currentPrice = computed(() => pricing.value[activeTier.value][selectedBilling.value])

const vipPerms = computed(() => [
  {
    label: t('upgradeDialog.vipGroupCore'),
    items: [
      { text: t('upgradeDialog.permCustomerSalesProcure'), included: true },
      { text: t('upgradeDialog.permWarehouseRetail'), included: true },
      { text: t('upgradeDialog.permFinance'), included: true },
      { text: t('upgradeDialog.permProductionOutsource'), included: false },
      { text: t('upgradeDialog.permPersonnel'), included: false },
    ],
  },
  {
    label: t('upgradeDialog.groupDataSecurity'),
    items: [
      { text: t('upgradeDialog.permDedicatedDb'), included: true },
      { text: t('upgradeDialog.permDataRetention'), included: true },
      { text: t('upgradeDialog.permAutoBackup'), included: true },
      { text: t('upgradeDialog.permCollab10'), included: true },
    ],
  },
  {
    label: t('upgradeDialog.groupAiAnalytics'),
    items: [
      { text: t('upgradeDialog.permReportsAnalytics'), included: true },
      { text: t('upgradeDialog.permAiAssistant'), included: false },
      { text: t('upgradeDialog.permAiAutomation'), included: false },
    ],
  },
  {
    label: t('upgradeDialog.groupService'),
    items: [
      { text: t('upgradeDialog.permTrainingDocs'), included: true },
      { text: t('upgradeDialog.permStandardSupport'), included: true },
      { text: t('upgradeDialog.permPrioritySupport'), included: false },
    ],
  },
])

const svipPerms = computed(() => [
  {
    label: t('upgradeDialog.svipGroupCore'),
    items: [
      { text: t('upgradeDialog.permCustomerSalesProcure'), included: true },
      { text: t('upgradeDialog.permWarehouseRetail'), included: true },
      { text: t('upgradeDialog.permFinance'), included: true },
      { text: t('upgradeDialog.permProductionOutsource'), included: true },
      { text: t('upgradeDialog.permPersonnel'), included: true },
    ],
  },
  {
    label: t('upgradeDialog.groupDataSecurity'),
    items: [
      { text: t('upgradeDialog.permDedicatedDb'), included: true },
      { text: t('upgradeDialog.permDataRetention'), included: true },
      { text: t('upgradeDialog.permAutoBackup'), included: true },
      { text: t('upgradeDialog.permCollabUnlimited'), included: true },
    ],
  },
  {
    label: t('upgradeDialog.groupAiAnalytics'),
    items: [
      { text: t('upgradeDialog.permReportsAnalytics'), included: true },
      { text: t('upgradeDialog.permAiUnlimited'), included: true },
      { text: t('upgradeDialog.permAiAutomation'), included: true },
    ],
  },
  {
    label: t('upgradeDialog.groupService'),
    items: [
      { text: t('upgradeDialog.permTrainingDocs'), included: true },
      { text: t('upgradeDialog.permTwoHourSupport'), included: true },
      { text: t('upgradeDialog.permMigrationConfig'), included: true },
    ],
  },
])

const currentPermGroups = computed(() => activeTier.value === 'svip' ? svipPerms.value : vipPerms.value)

function open() {
  step.value = 'plan'
  activeTier.value = 'vip'
  selectedBilling.value = 'monthly'
  visible.value = true
}

defineExpose({ open })
</script>

<style>
.upgrade-dialog-wrap .el-dialog {
  border-radius: 24px !important;
  overflow: hidden;
  padding: 0 !important;
  transition: width 0.3s ease !important;
}
.upgrade-dialog-wrap .el-dialog__header { display: none !important; }
.upgrade-dialog-wrap .el-dialog__body { padding: 0 !important; }
</style>

<style scoped>
* { box-sizing: border-box; }

.ud {
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1d1d1f;
}

.ud-close {
  position: absolute; top: 16px; right: 16px; z-index: 10;
  width: 28px; height: 28px;
  border: none; background: rgba(0,0,0,0.06);
  border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(29,29,31,0.4);
  transition: background 0.15s;
}
.ud-close:hover { background: rgba(0,0,0,0.12); color: #1d1d1f; }

/* ── Layout ── */
.ud-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 560px;
}
.ud-left {
  padding: 34px 30px 28px;
  background: #fff;
}
.ud-right {
  padding: 34px 28px 28px;
  background: #f8f8fa;
  border-left: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}
.ud-brand {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 700; color: #1d3974;
  margin-bottom: 18px;
}
.ud-headline {
  font-size: 30px; line-height: 1.12; letter-spacing: 0;
  margin: 0 0 10px; font-weight: 800;
}
.ud-sub {
  margin: 0 0 24px;
  color: rgba(29,29,31,0.45);
  font-size: 13px; line-height: 1.5;
}

.tier-tabs {
  display: inline-flex;
  gap: 8px;
  margin-bottom: 18px;
}
.tier-tab {
  position: relative;
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #fff;
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
}
.tier-tab.active {
  background: #111827;
  color: white;
  border-color: #111827;
}
.svip-tab.active {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  border-color: transparent;
}
.tier-badge {
  background: rgba(255,255,255,0.18);
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 700;
}

.price-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.price-card {
  border: 1.5px solid rgba(0,0,0,0.08);
  border-radius: 18px;
  padding: 16px 14px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 148px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.price-card:hover { transform: translateY(-1px); border-color: rgba(0,0,0,0.14); }
.price-card-active {
  border-color: #1d1d1f;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
}
.price-card-svip.price-card-active {
  border-color: #7c3aed;
  box-shadow: 0 12px 30px rgba(124,58,237,0.18);
}
.pc-tag-row {
  display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
}
.pc-label {
  font-size: 12px; font-weight: 700; color: #1d1d1f;
}
.pc-badge {
  font-size: 10px; font-weight: 700; color: #b45309;
  background: #fef3c7; padding: 2px 6px; border-radius: 999px;
}
.pc-price { display: flex; align-items: flex-end; gap: 2px; flex-wrap: wrap; }
.pc-currency { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
.pc-num { font-size: 28px; line-height: 1; font-weight: 800; }
.pc-period { font-size: 12px; color: rgba(29,29,31,0.45); margin-bottom: 3px; }
.pc-note { margin-top: 10px; font-size: 11px; color: rgba(29,29,31,0.5); line-height: 1.4; }

.ud-perm-title {
  font-size: 14px; font-weight: 800; margin-bottom: 14px;
}
.ud-perms {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 2px;
}
.perm-group {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 16px;
  padding: 14px 14px 12px;
}
.perm-group-label {
  font-size: 12px; font-weight: 800; margin-bottom: 10px;
}
.perm-items { display: flex; flex-direction: column; gap: 8px; }
.perm-item {
  display: flex; gap: 8px; align-items: flex-start;
  font-size: 12px; line-height: 1.45; color: #1d1d1f;
}
.perm-check {
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 1px;
}
.check-yes { background: rgba(16,185,129,0.12); color: #059669; }
.check-no { background: rgba(0,0,0,0.06); color: rgba(29,29,31,0.35); }
.perm-dim { color: rgba(29,29,31,0.35); }
.ud-cta {
  margin-top: 16px;
  width: 100%;
  border: none;
  border-radius: 16px;
  background: #111827;
  color: white;
  font-size: 14px; font-weight: 800;
  padding: 14px 18px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
}
.ud-cta-svip { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); }
.ud-cta-note {
  margin: 10px 0 0;
  font-size: 11px; color: rgba(29,29,31,0.4); text-align: center;
}

.pay-wrap {
  padding: 32px 32px 28px;
  text-align: center;
}
.pay-back {
  display: inline-flex; align-items: center; gap: 6px;
  border: none; background: transparent; cursor: pointer;
  color: rgba(29,29,31,0.55); font-size: 12px; font-weight: 700;
  margin-bottom: 16px; align-self: flex-start;
}
.pay-header { margin-bottom: 18px; }
.pay-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
.pay-plan-info { font-size: 13px; color: rgba(29,29,31,0.45); line-height: 1.5; }
.pay-plan-info strong { color: #1d1d1f; }
.pay-price { display: block; font-size: 18px; color: #1d1d1f; font-weight: 800; margin-top: 4px; }
.qr-area { margin: 0 auto 18px; }
.qr-box {
  width: 232px; height: 232px; margin: 0 auto 14px;
  border-radius: 24px; background: #f5f5f7;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(0,0,0,0.06);
}
.qr-placeholder { color: rgba(0,0,0,0.28); display: flex; flex-direction: column; align-items: center; }
.qr-placeholder-text { margin-top: 12px; font-size: 13px; font-weight: 700; color: rgba(29,29,31,0.55); }
.qr-placeholder-hint { font-size: 11px; margin-top: 4px; }
.qr-wechat-icon {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: #07C160;
}
.pay-steps {
  display: flex; flex-direction: column; gap: 8px;
  text-align: left; margin: 0 auto 18px; max-width: 280px;
}
.pay-step {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: rgba(29,29,31,0.65);
}
.ps-num {
  width: 20px; height: 20px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: #111827; color: white; font-size: 11px; font-weight: 700;
  flex-shrink: 0;
}
.pay-confirm-btn {
  width: 100%; border: none; border-radius: 16px;
  background: #111827; color: white;
  font-size: 14px; font-weight: 800; padding: 14px 18px;
  cursor: pointer; margin-bottom: 12px;
}
.pay-alt {
  font-size: 12px; color: rgba(29,29,31,0.45); line-height: 1.6;
}

.done-wrap {
  padding: 46px 34px 36px;
  text-align: center;
}
.done-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
}
.done-title { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
.done-desc { font-size: 13px; color: rgba(29,29,31,0.55); line-height: 1.7; margin-bottom: 14px; }
.done-contact { font-size: 12px; color: rgba(29,29,31,0.45); margin-bottom: 18px; }
.done-close-btn {
  border: none; border-radius: 16px; background: #111827; color: white;
  font-size: 14px; font-weight: 800; padding: 14px 24px; cursor: pointer;
}

@media (max-width: 920px) {
  .ud-layout { grid-template-columns: 1fr; }
  .ud-right { border-left: none; border-top: 1px solid rgba(0,0,0,0.05); }
}
@media (max-width: 680px) {
  .ud-left, .ud-right, .pay-wrap, .done-wrap { padding-left: 20px; padding-right: 20px; }
  .price-cards { grid-template-columns: 1fr; }
}
</style>
