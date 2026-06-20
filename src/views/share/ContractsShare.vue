<template>
  <div class="share-root">
    <div v-if="loading" class="state-wrap">
      <div class="spinner"></div><p>{{ $t('share.loading') }}</p>
    </div>
    <div v-else-if="error" class="state-wrap">
      <div style="font-size:36px">⚠️</div><p>{{ error }}</p>
    </div>

    <div v-else class="doc">
      <!-- ── 文档头部 ── -->
      <div class="doc-header no-print">
        <div class="brand-wrap">
          <img v-if="showLogo" src="/brand-logo.png" class="brand-logo" alt="logo" />
          <div v-else class="brand">{{ $t('share.companyFull') }}</div>
        </div>
        <div class="doc-title">{{ $t('share.contractBatch.docTitle') }}</div>
        <div class="doc-sub">{{ $t('share.contractBatch.footerTotal', { count: contracts.length }) }} · {{ today }}</div>
        <div class="doc-total-wrap">
          <div class="doc-total-label">{{ $t('share.contractBatch.totalLabel') }}</div>
          <div class="doc-total">¥{{ totalAmount }}</div>
          <div v-if="Number(totalPending) > 0" class="doc-pending">{{ $t('share.contractBatch.pendingLabel') }} ¥{{ totalPending }}</div>
          <div v-else class="doc-clear">{{ $t('share.contractBatch.cleared') }}</div>
        </div>
      </div>
      <!-- 打印版头部 -->
      <div class="doc-header-print print-only">
        <div class="ph-left">
          <div class="ph-brand">{{ $t('share.companyFallback') }}</div>
          <div class="ph-title">{{ $t('share.contractBatch.docTitle') }}</div>
          <div class="ph-sub">{{ $t('share.contractBatch.footerTotal', { count: contracts.length }) }} · {{ $t('share.contractBatch.generatedOn') }}: {{ today }}</div>
        </div>
        <div class="ph-right">
          <div class="ph-total-label">{{ $t('share.contractBatch.totalLabel') }}</div>
          <div class="ph-total">¥{{ totalAmount }}</div>
          <div class="ph-pending">{{ $t('share.contractBatch.pendingLabel') }} ¥{{ totalPending }}</div>
        </div>
      </div>

      <!-- ── 合同列表 ── -->
      <div class="contract-list">
        <div v-for="(c, idx) in contracts" :key="c.id" class="contract-row">
          <!-- 行头 -->
          <div class="row-head">
            <span class="row-idx">{{ idx + 1 }}</span>
            <div class="row-main">
              <div class="row-top">
                <span class="row-sn">{{ c.order_sn || c.contract_no || c.order_no }}</span>
                <span class="row-customer">{{ c.customer_name }}</span>
                <span class="row-date">{{ fmtDate(c.sign_date || c.order_date) }}</span>
              </div>
              <!-- 商品明细 -->
              <div class="goods-list">
                <div v-for="(item, i) in parseGoods(c.goods_info)" :key="i" class="goods-item">
                  <span class="gi-name">{{ item.goods_name }}<span v-if="item.spec" class="gi-spec">（{{ item.spec }}）</span></span>
                  <span class="gi-num">× {{ item.num }}{{ item.unit_name || '' }}</span>
                  <span class="gi-price">¥{{ fmt(Number(item.price) * Number(item.num)) }}</span>
                </div>
              </div>
            </div>
            <!-- 金额列 -->
            <div class="row-amounts">
              <div class="amt-total">¥{{ fmt(c.total_amount) }}</div>
              <div v-if="pendingAmt(c) > 0" class="amt-pending">{{ $t('share.contractBatch.pendingLabel') }} ¥{{ fmt(pendingAmt(c)) }}</div>
              <div v-else class="amt-clear">{{ $t('share.contractBatch.cleared') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 底部汇总 ── -->
      <div class="doc-footer">
        <div class="footer-row">
          <span>{{ $t('share.contractBatch.footerTotal', { count: contracts.length }) }}</span>
          <span class="f-total">¥{{ totalAmount }}</span>
        </div>
        <div class="footer-row sub">
          <span>{{ $t('share.contractBatch.footerPending') }}</span>
          <span class="f-pending">¥{{ totalPending }}</span>
        </div>
        <div class="footer-hint">{{ $t('share.contractBatch.footerHint', { date: today }) }}</div>
      </div>

      <!-- ── 下载按钮 ── -->
      <div class="dl-wrap no-print">
        <button class="dl-btn" @click="window.print()">⬇ {{ $t('share.downloadPdf') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const route = useRoute()
const { t, locale } = useI18n()
const loading = ref(true)
const error = ref('')
const contracts = ref<any[]>([])
const today = new Date().toLocaleDateString(locale.value === 'en-US' ? 'en-CA' : 'zh-CN')

function decodeToken(token: string): any {
  try {
    if (!token?.startsWith('erp_')) return {}
    const json = decodeURIComponent(escape(atob(token.slice(4))))
    return JSON.parse(json)
  } catch { return {} }
}

const LOGO_ACCOUNTS = ['17747344571']
const showLogo = computed(() => LOGO_ACCOUNTS.includes(decodeToken(route.query.token as string)?.a))

function fmt(v: any) { return Number(v || 0).toFixed(2) }
function fmtDate(d: any) { return d ? String(d).slice(0, 10) : t('share.noDate') }
function parseGoods(raw: any): any[] {
  if (!raw) return []
  try { return Array.isArray(raw) ? raw : JSON.parse(raw) } catch { return [] }
}
function pendingAmt(c: any) {
  return Math.max(0, Number(c.total_amount || 0) - Number(c.receive_amount || 0))
}
const totalAmount = computed(() =>
  contracts.value.reduce((s, c) => s + Number(c.total_amount || 0), 0).toFixed(2)
)
const totalPending = computed(() =>
  contracts.value.reduce((s, c) => s + pendingAmt(c), 0).toFixed(2)
)

onMounted(async () => {
  const idsRaw = route.query.ids as string
  const token = route.query.token as string
  if (!token || !idsRaw) { error.value = t('share.contractBatch.invalidLink'); loading.value = false; return }
  const ids = idsRaw.split(',').map(s => s.trim()).filter(Boolean)
  if (!ids.length) { error.value = t('share.contractBatch.invalidIds'); loading.value = false; return }
  try {
    const results = await Promise.all(
      ids.map(id =>
        axios.get(`/adminapi/shop/ContractOrder/detail?id=${id}`, { headers: { token } })
          .then(r => r.data?.code === 1 ? (r.data?.data?.row || r.data?.data || null) : null)
          .catch(() => null)
      )
    )
    contracts.value = results.filter(Boolean)
    if (!contracts.value.length) error.value = t('share.contractBatch.noAccess')
  } catch {
    error.value = t('share.contractBatch.networkError')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.share-root {
  min-height: 100vh;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
  color: #1d1d1f;
}

.state-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 80vh; gap: 14px;
  color: #86868b; font-size: 15px;
}
.spinner {
  width: 34px; height: 34px; border: 3px solid #e5e5ea;
  border-top-color: #0071e3; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 文档容器 ── */
.doc {
  max-width: 860px; margin: 0 auto;
  padding: 28px 16px 40px;
}

/* ── 页头（屏幕版） ── */
.doc-header {
  background: linear-gradient(135deg, #1d1d1f 0%, #2d2d2f 100%);
  border-radius: 16px; padding: 28px 32px 24px;
  margin-bottom: 16px; color: #fff;
}
.brand-wrap { margin-bottom: 6px; }
.brand { font-size: 11px; letter-spacing: 3px; opacity: 0.5; }
.brand-logo { height: 48px; width: auto; object-fit: contain; opacity: 0.9; filter: brightness(0) invert(1); }
.doc-title { font-size: 30px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
.doc-sub { font-size: 13px; opacity: 0.55; margin-bottom: 20px; }
.doc-total-wrap { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
.doc-total-label { font-size: 13px; opacity: 0.6; }
.doc-total { font-size: 36px; font-weight: 700; color: #5ac8fa; }
.doc-pending { font-size: 14px; color: #ff9f9f; font-weight: 600; }
.doc-clear { font-size: 14px; color: #7ddf9e; font-weight: 600; }

/* 打印版页头 */
.doc-header-print {
  display: none;
  padding: 0 0 16px; margin-bottom: 16px;
  border-bottom: 2px solid #1d1d1f;
  justify-content: space-between; align-items: flex-end;
}
.ph-brand { font-size: 10px; letter-spacing: 3px; color: #86868b; margin-bottom: 4px; }
.ph-title { font-size: 24px; font-weight: 700; }
.ph-sub { font-size: 12px; color: #86868b; margin-top: 2px; }
.ph-right { text-align: right; }
.ph-total-label { font-size: 11px; color: #86868b; }
.ph-total { font-size: 26px; font-weight: 700; color: #0071e3; }
.ph-pending { font-size: 13px; color: #ff3b30; font-weight: 600; }

/* ── 合同列表 ── */
.contract-list {
  background: #fff; border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  margin-bottom: 16px;
}
.contract-row {
  border-bottom: 1px solid #f0f2f5;
  padding: 18px 20px;
  transition: background 0.1s;
}
.contract-row:last-child { border-bottom: none; }
.contract-row:hover { background: #fafafa; }

.row-head { display: flex; align-items: flex-start; gap: 14px; }
.row-idx {
  width: 24px; height: 24px; border-radius: 50%;
  background: #0071e3; color: #fff;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}
.row-main { flex: 1; min-width: 0; }
.row-top {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 8px 16px; margin-bottom: 10px;
}
.row-sn { font-size: 14px; font-weight: 700; color: #1d1d1f; }
.row-customer { font-size: 13px; color: #0071e3; font-weight: 600; }
.row-date { font-size: 12px; color: #86868b; }

/* 商品列表 */
.goods-list { display: flex; flex-direction: column; gap: 5px; }
.goods-item {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 13px;
}
.gi-name { color: #3a3a3c; flex: 1; min-width: 0; }
.gi-spec { color: #86868b; font-size: 12px; }
.gi-num { color: #86868b; white-space: nowrap; font-size: 12px; }
.gi-price { color: #1d1d1f; font-weight: 600; white-space: nowrap; min-width: 80px; text-align: right; }

/* 金额列 */
.row-amounts { text-align: right; flex-shrink: 0; min-width: 110px; }
.amt-total { font-size: 17px; font-weight: 700; color: #0071e3; }
.amt-pending { font-size: 12px; color: #ff3b30; font-weight: 600; margin-top: 3px; }
.amt-clear { font-size: 12px; color: #34c759; font-weight: 600; margin-top: 3px; }

/* ── 底部汇总 ── */
.doc-footer {
  background: #fff; border-radius: 14px; padding: 20px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07); margin-bottom: 16px;
}
.footer-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; font-size: 15px; font-weight: 600;
  border-bottom: 1px solid #f0f2f5;
}
.footer-row.sub { font-size: 13px; font-weight: 400; color: #86868b; border-bottom: none; }
.f-total { font-size: 24px; font-weight: 700; color: #0071e3; }
.f-pending { color: #ff3b30; font-weight: 700; }
.footer-hint { font-size: 12px; color: #c7c7cc; text-align: center; margin-top: 12px; }

/* ── 下载按钮 ── */
.dl-wrap { text-align: center; }
.dl-btn {
  background: #0071e3; color: #fff;
  border: none; border-radius: 12px;
  padding: 14px 40px; font-size: 16px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.3px;
  transition: background 0.15s;
}
.dl-btn:hover { background: #0077ed; }
.dl-btn:active { background: #005bbf; }

/* ── 移动端 ── */
@media (max-width: 600px) {
  .doc { padding: 16px 10px 32px; }
  .doc-header { padding: 20px 18px; border-radius: 12px; }
  .doc-total { font-size: 28px; }
  .contract-row { padding: 14px 14px; }
  .row-amounts { min-width: 90px; }
  .amt-total { font-size: 15px; }
}

/* ── 打印 ── */
@media print {
  .no-print { display: none !important; }
  .print-only { display: flex !important; }
  .share-root { background: #fff; }
  .doc { max-width: 100%; padding: 0; }
  .doc-header-print { display: flex; }
  .contract-list { box-shadow: none; border-radius: 0; border: 1px solid #e5e5ea; }
  .doc-footer { box-shadow: none; border-radius: 0; border: 1px solid #e5e5ea; margin-top: 12px; }
  .contract-row:hover { background: transparent; }
}
</style>
