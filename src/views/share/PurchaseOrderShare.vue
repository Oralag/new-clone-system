<template>
  <div class="share-page">
    <div v-if="loading" class="loading-wrap">
      <div class="spinner"></div>
      <p>{{ $t('share.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-wrap">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
    </div>

    <template v-else-if="order.id">
      <!-- 顶部工具栏 -->
      <div class="topbar no-print">
        <div class="topbar-inner">
          <span class="topbar-title">{{ $t('share.purchaseSingle.topbarTitle') }}</span>
          <button class="dl-btn" @click="doPrint">⬇ {{ $t('share.downloadPdf') }}</button>
        </div>
      </div>

      <!-- 公司头部 -->
      <div class="doc-header">
        <div class="company-name-wrap">
          <img v-if="showLogo" src="/brand-logo.png" class="brand-logo" alt="logo" />
          <div v-else class="company-name">{{ $t('share.companyFallback') }}</div>
        </div>
        <div class="doc-title">{{ $t('share.purchaseSingle.docTitle') }}</div>
        <div class="doc-meta">
          <span>{{ $t('share.purchaseSingle.orderNo') }}: {{ order.order_no || order.order_sn }}</span>
          <span>{{ $t('share.purchaseSingle.date') }}: {{ fmtDate(order.order_date) }}</span>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="section">
        <div class="section-title">{{ $t('share.purchaseSingle.sectionBasic') }}</div>
        <div class="field-grid">
          <div class="field">
            <label>{{ $t('share.purchaseSingle.supplier') }}</label>
            <span>{{ order.supplier_name || $t('share.customerFallback') }}</span>
          </div>
          <div class="field">
            <label>{{ $t('share.purchaseSingle.buyer') }}</label>
            <span>{{ order.admin_name || $t('share.customerFallback') }}</span>
          </div>
          <div class="field">
            <label>{{ $t('share.purchaseSingle.createdDate') }}</label>
            <span>{{ fmtDate(order.order_date) }}</span>
          </div>
          <div class="field">
            <label>{{ $t('share.purchaseSingle.deliveryDate') }}</label>
            <span>{{ order.delivery_date ? fmtDate(order.delivery_date) : $t('share.noDate') }}</span>
          </div>
          <div class="field">
            <label>{{ $t('share.purchaseSingle.warehouse') }}</label>
            <span>{{ order.warehouse_name || $t('share.customerFallback') }}</span>
          </div>
          <div v-if="order.remark" class="field full">
            <label>{{ $t('share.purchaseSingle.remark') }}</label>
            <span>{{ order.remark }}</span>
          </div>
        </div>
      </div>

      <!-- 商品明细 -->
      <div class="section">
        <div class="section-title">{{ $t('share.purchaseSingle.sectionGoods') }}</div>
        <div class="goods-list">
          <div class="goods-header">
            <span class="g-name">{{ $t('share.purchaseSingle.goodsName') }}</span>
            <span class="g-num">{{ $t('share.purchaseSingle.qty') }}</span>
            <span class="g-price">{{ $t('share.purchaseSingle.unitPrice') }}</span>
            <span class="g-sub">{{ $t('share.purchaseSingle.subtotal') }}</span>
          </div>
          <div v-for="(item, i) in goods" :key="i" class="goods-row">
            <div class="g-name">
              <span class="item-name">{{ item.goods_name }}</span>
              <span v-if="item.spec" class="item-spec">{{ item.spec }}</span>
            </div>
            <span class="g-num">{{ item.num }}{{ item.unit_name || '' }}</span>
            <span class="g-price">¥{{ fmt(item.price) }}</span>
            <span class="g-sub">¥{{ fmt(Number(item.price) * Number(item.num)) }}</span>
          </div>
        </div>
      </div>

      <!-- 金额汇总 -->
      <div class="section summary-section">
        <div class="summary-row">
          <span class="summary-label">{{ $t('share.purchaseSingle.totalAmount') }}</span>
          <span class="summary-amount">¥{{ fmt(order.after_discount > 0 ? order.after_discount : order.total_amount) }}</span>
        </div>
        <div v-if="Number(order.pay_amount) > 0" class="summary-row sub">
          <span class="summary-label">{{ $t('share.purchaseSingle.paidAmount') }}</span>
          <span class="paid">¥{{ fmt(order.pay_amount) }}</span>
        </div>
        <div class="summary-row sub balance">
          <span class="summary-label">{{ $t('share.purchaseSingle.unpaidAmount') }}</span>
          <span class="owed">¥{{ fmt(Math.max(0, Number(order.after_discount > 0 ? order.after_discount : order.total_amount) - Number(order.pay_amount || 0))) }}</span>
        </div>
      </div>

      <!-- 底部状态 -->
      <div class="doc-footer no-print">
        <div class="status-badge" :class="order.status === 1 ? 'audited' : 'pending'">
          {{ order.status === 1 ? $t('share.purchaseSingle.approved') : $t('share.purchaseSingle.pending') }}
        </div>
        <p class="footer-hint">{{ $t('share.purchaseSingle.footerHint') }}</p>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const route = useRoute()
const { t } = useI18n()
const loading = ref(true)
const error = ref('')
const order = ref<any>({})

function decodeToken(token: string): any {
  try {
    if (!token?.startsWith('erp_')) return {}
    const json = decodeURIComponent(escape(atob(token.slice(4))))
    return JSON.parse(json)
  } catch { return {} }
}

const LOGO_ACCOUNTS = ['17747344571']

const tokenPayload = computed(() => decodeToken(route.query.token as string))
const showLogo = computed(() => LOGO_ACCOUNTS.includes(tokenPayload.value?.a))

const goods = computed(() => {
  const raw = order.value.goods_info
  if (!raw) return []
  try { return Array.isArray(raw) ? raw : JSON.parse(raw) } catch { return [] }
})

function fmt(v: any) { return Number(v || 0).toFixed(2) }
function fmtDate(d: any) { return d ? String(d).slice(0, 10) : t('share.noDate') }
function doPrint() { window.print() }

onMounted(async () => {
  const id = route.params.id
  const token = route.query.token as string
  if (!token) { error.value = t('share.purchaseSingle.invalidLink'); loading.value = false; return }
  try {
    const res = await axios.get(`/adminapi/stock/PurchaseOrder/detail?id=${id}`, {
      headers: { token }
    })
    if (res.data?.code === 1) {
      order.value = res.data?.data?.row || res.data?.data || {}
    } else {
      error.value = res.data?.message || t('share.purchaseSingle.noAccess')
    }
  } catch {
    error.value = t('share.purchaseSingle.networkError')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
* { box-sizing: border-box; }

.topbar {
  position: sticky; top: 0; z-index: 100;
  background: #1d1d1f;
  box-shadow: 0 1px 8px rgba(0,0,0,0.3);
}
.topbar-inner {
  max-width: 860px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
}
.topbar-title { color: #fff; font-size: 15px; font-weight: 600; }
.dl-btn {
  background: #0071e3; color: #fff;
  border: none; border-radius: 8px;
  padding: 8px 20px; font-size: 14px; font-weight: 600;
  cursor: pointer;
}
.dl-btn:hover { background: #0077ed; }

.share-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding: 0 0 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
}

.loading-wrap, .error-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 60vh; gap: 16px;
  color: #86868b; font-size: 15px;
}
.spinner {
  width: 36px; height: 36px; border: 3px solid #e5e5ea;
  border-top-color: #0071e3; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 40px; }

.doc-header {
  background: linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%);
  color: #fff; padding: 28px 20px 24px;
  text-align: center;
}
.company-name-wrap { margin-bottom: 6px; }
.company-name { font-size: 13px; letter-spacing: 3px; opacity: 0.6; }
.brand-logo { height: 48px; width: auto; object-fit: contain; opacity: 0.9; filter: brightness(0) invert(1); }
.doc-title { font-size: 22px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
.doc-meta { display: flex; flex-direction: column; gap: 4px; font-size: 12px; opacity: 0.75; }

.section {
  background: #fff; margin: 12px 12px 0;
  border-radius: 14px; padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 13px; font-weight: 600; color: #86868b;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 14px; padding-bottom: 10px;
  border-bottom: 1px solid #f2f2f7;
}

.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 8px; }
.field.full { grid-column: 1/-1; }
.field label { display: block; font-size: 11px; color: #86868b; margin-bottom: 3px; }
.field span { font-size: 14px; color: #1d1d1f; font-weight: 500; }

.goods-list { font-size: 13px; }
.goods-header, .goods-row {
  display: grid;
  grid-template-columns: 1fr 60px 70px 80px;
  gap: 4px; padding: 8px 0;
}
.goods-header { color: #86868b; font-size: 11px; font-weight: 600; border-bottom: 1px solid #f2f2f7; }
.goods-row { border-bottom: 1px solid #f9f9fb; }
.goods-row:last-child { border-bottom: none; }
.g-name { min-width: 0; }
.g-num, .g-price, .g-sub { text-align: right; }
.item-name { display: block; color: #1d1d1f; font-weight: 500; }
.item-spec { display: block; font-size: 11px; color: #86868b; margin-top: 2px; }

.summary-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #f2f2f7;
}
.summary-row:last-child { border-bottom: none; }
.summary-row.sub { font-size: 13px; color: #86868b; }
.summary-label { font-size: 14px; color: #1d1d1f; }
.summary-row:first-child .summary-label { font-weight: 700; font-size: 15px; }
.summary-amount { font-size: 22px; font-weight: 700; color: #0071e3; }
.paid { color: #34c759; font-weight: 600; }
.owed { color: #ff3b30; font-weight: 700; font-size: 16px; }
.balance .summary-label { font-weight: 600; color: #1d1d1f; }

.doc-footer { text-align: center; padding: 20px 20px 0; }
.status-badge {
  display: inline-block; padding: 4px 14px;
  border-radius: 20px; font-size: 13px; font-weight: 600;
  margin-bottom: 12px;
}
.status-badge.audited { background: #d1f7e0; color: #1a7a3c; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.footer-hint { font-size: 12px; color: #c7c7cc; }

@media print {
  .no-print { display: none !important; }
  .share-page { background: #fff; padding: 0; }
  .section { box-shadow: none; border-radius: 0; }
}
</style>
