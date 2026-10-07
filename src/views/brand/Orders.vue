<template>
  <div class="brand-orders">
    <div class="bo-header">
      <h2 class="bo-title">订单查询</h2>
      <p class="bo-sub">输入下单时填写的收货手机号，查看订单状态</p>
    </div>
    <div class="bo-form">
      <input v-model="query" type="tel" maxlength="11" placeholder="收货手机号" class="bo-input" @keyup.enter="doSearch" />
      <button class="bo-btn" @click="doSearch" :disabled="searching">
        {{ searching ? '查询中...' : '查询' }}
      </button>
    </div>

    <div v-if="searched && !searching && !errorMsg && results.length === 0" class="bo-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(29,29,31,0.2)" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <p>这个手机号下没有订单</p>
      <p class="bo-empty-hint">请确认是下单时填写的收货手机号</p>
    </div>

    <div v-if="results.length > 0" class="bo-list">
      <div v-for="order in results" :key="order.order_no" class="bo-card">
        <div class="bo-card-row">
          <span class="bo-order-no">订单号：{{ order.order_no }}</span>
          <span class="bo-status" :class="statusClass(order.status)">{{ WEB_ORDER_STATUS_TEXT[order.status] || '处理中' }}</span>
        </div>
        <div class="bo-card-row">
          <span class="bo-date">下单时间：{{ fmtTime(order.created_at) }}<template v-if="order.source !== 'web'"> · 小程序</template></span>
          <span class="bo-amount">¥{{ order.total_amount.toFixed(2) }}</span>
        </div>
        <div v-if="order.items.length" class="bo-card-goods">
          {{ order.items.map(i => `${i.goods_name} × ${i.qty}`).join('、') }}<template v-if="order.freight_amount > 0">（含运费 ¥{{ order.freight_amount.toFixed(2) }}）</template>
        </div>
        <div v-if="order.tracking_no" class="bo-tracking">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          {{ order.express_company ? order.express_company + ' ' : '' }}运单号：{{ order.tracking_no }}
        </div>
        <div v-if="order.status === 0" class="bo-pay-row">
          <button v-if="tokenOf(order.order_no)" class="bo-pay-btn" :disabled="opening === order.order_no" @click="continuePay(order.order_no)">
            {{ opening === order.order_no ? '正在获取支付码…' : '继续付款' }}
          </button>
          <span v-else class="bo-pay-hint">请在下单的那台电脑上继续付款，超时未付会自动取消</span>
        </div>
      </div>
    </div>

    <!-- 查询失败：原因打在页面上，别伪装成「没有订单」 -->
    <div v-if="errorMsg" class="bo-error">{{ errorMsg }}</div>

    <BrandWebPayDialog
      v-if="payOrder"
      :order-no="payOrder.order_no"
      :token="payOrder.token"
      :code-url="payOrder.code_url"
      :amount="payOrder.total_amount"
      :expires-at="payOrder.expires_at"
      @paid="doSearch"
      @close="payOrder = null"
      @done="payOrder = null"
      @view-orders="payOrder = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BrandWebPayDialog from '@/components/BrandWebPayDialog.vue'
import {
  lookupWebOrders, getWebOrderStatus, loadMyWebOrders, WEB_ORDER_STATUS_TEXT, type WebOrderRow,
} from '@/api/brandWebOrder'

const route = useRoute()
const query = ref('')
const searching = ref(false)
const searched = ref(false)
const errorMsg = ref('')
const results = ref<WebOrderRow[]>([])
const opening = ref('')
const payOrder = ref<{ order_no: string; token: string; code_url: string; total_amount: number; expires_at: string | null } | null>(null)

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  errorMsg.value = ''
  if (!/^1[3-9]\d{9}$/.test(q)) {
    errorMsg.value = '请输入正确的11位手机号'
    return
  }
  searching.value = true
  searched.value = false
  try {
    const data = await lookupWebOrders(q)
    results.value = data.rows || []
  } catch (e: any) {
    results.value = []
    errorMsg.value = `查询失败：${e?.message || '请稍后再试'}`
  } finally {
    searching.value = false
    searched.value = true
  }
}

function tokenOf(orderNo: string) {
  return loadMyWebOrders().find(o => o.order_no === orderNo)?.token || ''
}

async function continuePay(orderNo: string) {
  const token = tokenOf(orderNo)
  if (!token) return
  opening.value = orderNo
  errorMsg.value = ''
  try {
    const s = await getWebOrderStatus(orderNo, token, true)
    if (s.status !== 0 || !s.code_url) {
      // 已经付了或已关闭：刷新列表显示最新状态
      await doSearch()
      return
    }
    payOrder.value = { order_no: orderNo, token, code_url: s.code_url, total_amount: s.total_amount, expires_at: s.expires_at }
  } catch (e: any) {
    errorMsg.value = `获取支付码失败：${e?.message || '请稍后再试'}`
  } finally {
    opening.value = ''
  }
}

function fmtTime(v: string) {
  return v ? new Date(v).toLocaleString('zh-CN', { hour12: false }) : ''
}

function statusClass(status: number) {
  if (status === 3) return 'status-done'
  if (status === 2) return 'status-shipping'
  if (status === 4) return 'status-cancel'
  return 'status-pending'
}

onMounted(() => {
  // 从付款弹窗「查看订单」跳过来会带手机号，直接查
  const m = String(route.query.mobile || '')
  if (m) {
    query.value = m
    doSearch()
  }
})
</script>

<style scoped>
.brand-orders { max-width: 700px; margin: 0 auto; padding: 48px 24px 80px; }
.bo-header { margin-bottom: 32px; }
.bo-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
.bo-sub { font-size: 14px; color: rgba(29,29,31,0.45); }
.bo-form { display: flex; gap: 12px; margin-bottom: 32px; }
.bo-input { flex: 1; padding: 14px 20px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 14px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.bo-input:focus { border-color: #7c3aed; }
.bo-btn { padding: 0 28px; background: #1d1d1f; color: #fff; border-radius: 14px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.bo-btn:hover:not(:disabled) { background: #7c3aed; }
.bo-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.bo-empty { text-align: center; color: rgba(29,29,31,0.4); padding: 48px 0; }
.bo-empty svg { margin: 0 auto 16px; display: block; }
.bo-empty p { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.bo-empty-hint { font-size: 13px !important; font-weight: 400 !important; color: rgba(29,29,31,0.3); }

.bo-list { display: flex; flex-direction: column; gap: 12px; }
.bo-card { background: #f5f5f7; border-radius: 16px; padding: 20px 24px; transition: box-shadow 0.2s; }
.bo-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.bo-card-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.bo-order-no { font-size: 13px; font-weight: 700; }
.bo-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.status-pending { color: #d97706; background: rgba(217,119,6,0.1); }
.status-shipping { color: #0071e3; background: rgba(0,113,227,0.1); }
.status-done { color: #34c759; background: rgba(52,199,89,0.1); }
.status-cancel { color: rgba(29,29,31,0.4); background: rgba(0,0,0,0.06); }
.bo-date { font-size: 12px; color: rgba(29,29,31,0.4); }
.bo-amount { font-size: 17px; font-weight: 800; }
.bo-card-goods { font-size: 12px; color: rgba(29,29,31,0.5); margin-top: 4px; }
.bo-tracking { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #0071e3; font-weight: 600; margin-top: 8px; }
.bo-error { text-align: center; color: #ef4444; font-size: 14px; padding: 24px 0; }
.bo-pay-row { display: flex; align-items: center; justify-content: flex-end; margin-top: 12px; }
.bo-pay-btn { height: 36px; padding: 0 18px; border-radius: 12px; border: none; background: #1d1d1f; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.bo-pay-btn:hover:not(:disabled) { background: #7c3aed; }
.bo-pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.bo-pay-hint { font-size: 12px; color: rgba(29,29,31,0.45); }

@media (max-width: 768px) {
  .brand-orders { padding: 24px 16px 60px; }
  .bo-title { font-size: 24px; }
  .bo-form { flex-direction: column; }
  .bo-btn { padding: 14px; }
  .bo-card { padding: 16px; }
}
</style>
