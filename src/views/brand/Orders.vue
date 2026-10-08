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
        <!-- 退款/售后进度 -->
        <div v-if="order.refund" class="bo-refund" :class="`rf-${order.refund.status}`">
          <b>{{ refundTitle(order.refund) }}</b>
          <span v-if="order.refund.status === 1"> · ¥{{ order.refund.amount.toFixed(2) }} 原路退回微信</span>
          <div v-if="order.refund.note" class="bo-refund-note">商家：{{ order.refund.note }}</div>
        </div>

        <div v-if="order.status === 0" class="bo-pay-row">
          <template v-if="tokenOf(order.order_no)">
            <button class="bo-link-btn" :disabled="busy === order.order_no" @click="doCancel(order.order_no)">取消订单</button>
            <button class="bo-pay-btn" :disabled="opening === order.order_no" @click="continuePay(order.order_no)">
              {{ opening === order.order_no ? '正在获取支付码…' : '继续付款' }}
            </button>
          </template>
          <span v-else class="bo-pay-hint">请在下单的那台电脑上继续付款，超时未付会自动取消</span>
        </div>
        <div v-else-if="canRefund(order)" class="bo-pay-row">
          <button class="bo-link-btn" @click="openRefund(order)">{{ order.status === 1 ? '申请退款' : '申请售后' }}</button>
        </div>

        <!-- 退款/售后申请表 -->
        <div v-if="refundFor === order.order_no" class="bo-refund-form">
          <p class="bo-rf-title">{{ order.status === 1 ? '申请退款' : '申请售后' }} · ¥{{ order.total_amount.toFixed(2) }}</p>
          <div class="bo-rf-reasons">
            <button v-for="r in refundReasons(order)" :key="r" class="bo-rf-chip" :class="{ on: refundReason === r }" @click="refundReason = r">{{ r }}</button>
          </div>
          <textarea v-model="refundDetail" class="bo-rf-text" maxlength="150" placeholder="补充说明（选填）：比如破损情况、想换货还是退款"></textarea>
          <p class="bo-rf-hint">提交后商家会尽快处理，同意后钱原路退回您的微信；也可能联系您协商换货或补发。</p>
          <div class="bo-rf-btns">
            <button class="bo-link-btn" @click="refundFor = ''">取消</button>
            <button class="bo-pay-btn" :disabled="!refundReason || busy === order.order_no" @click="submitRefund(order)">
              {{ busy === order.order_no ? '提交中…' : '提交申请' }}
            </button>
          </div>
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
  lookupWebOrders, getWebOrderStatus, loadMyWebOrders, applyWebRefund, cancelWebOrder,
  WEB_ORDER_STATUS_TEXT, type WebOrderRow, type WebRefundInfo,
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

const busy = ref('')
const refundFor = ref('')
const refundReason = ref('')
const refundDetail = ref('')

// 被拒绝的申请可以重新提交；处理中/已退款的不再显示按钮
function canRefund(order: WebOrderRow) {
  if (![1, 2, 3].includes(order.status)) return false
  return !order.refund || order.refund.status === 2
}
function refundReasons(order: WebOrderRow) {
  return order.status === 1
    ? ['不想要了', '拍错了/多拍了', '地址填错了', '其他']
    : ['商品破损/变质', '发错货/少发', '质量问题', '没收到货', '其他']
}
function refundTitle(r: WebRefundInfo) {
  if (r.status === 1) return '已退款'
  if (r.status === 2) return '退款申请未通过'
  return r.note ? '商家正在和您协商处理' : '退款/售后申请处理中'
}
function openRefund(order: WebOrderRow) {
  refundFor.value = order.order_no
  refundReason.value = ''
  refundDetail.value = ''
}
async function submitRefund(order: WebOrderRow) {
  const reason = [refundReason.value, refundDetail.value.trim()].filter(Boolean).join('：')
  busy.value = order.order_no
  errorMsg.value = ''
  try {
    await applyWebRefund(order.order_no, query.value.trim(), reason)
    refundFor.value = ''
    await doSearch()
  } catch (e: any) {
    errorMsg.value = `提交失败：${e?.message || '请稍后再试'}`
  } finally {
    busy.value = ''
  }
}
async function doCancel(orderNo: string) {
  const token = tokenOf(orderNo)
  if (!token || !confirm('确定取消这个订单吗？')) return
  busy.value = orderNo
  errorMsg.value = ''
  try {
    await cancelWebOrder(orderNo, token)
  } catch (e: any) {
    errorMsg.value = e?.message || '取消失败，请稍后再试'
  } finally {
    busy.value = ''
    await doSearch()
  }
}

function fmtTime(v: string) {
  return v ? new Date(v).toLocaleString('zh-CN', { hour12: false }) : ''
}

function statusClass(status: number) {
  if (status === 3) return 'status-done'
  if (status === 2) return 'status-shipping'
  if (status === 4) return 'status-cancel'
  if (status === 5) return 'status-refund'
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
.bo-pay-row { gap: 10px; }
.bo-link-btn { height: 36px; padding: 0 16px; border-radius: 12px; border: 1.5px solid rgba(0,0,0,0.12); background: #fff; color: #1d1d1f; font-size: 13px; font-weight: 700; cursor: pointer; }
.bo-link-btn:hover:not(:disabled) { border-color: #7c3aed; }
.bo-link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.status-refund { color: #7c3aed; background: rgba(124,58,237,0.1); }
.bo-refund { margin-top: 10px; font-size: 12px; padding: 8px 12px; border-radius: 10px; background: rgba(124,58,237,0.07); color: #6d28d9; line-height: 1.6; }
.bo-refund.rf-1 { background: rgba(52,199,89,0.1); color: #15803d; }
.bo-refund.rf-2 { background: rgba(0,0,0,0.05); color: rgba(29,29,31,0.6); }
.bo-refund-note { margin-top: 2px; }
.bo-refund-form { margin-top: 12px; padding: 14px; border-radius: 14px; background: #fff; border: 1.5px solid rgba(124,58,237,0.2); }
.bo-rf-title { font-size: 14px; font-weight: 800; margin: 0 0 10px; }
.bo-rf-reasons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.bo-rf-chip { padding: 6px 12px; border-radius: 999px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 12px; cursor: pointer; }
.bo-rf-chip.on { border-color: #7c3aed; color: #6d28d9; background: rgba(124,58,237,0.06); font-weight: 700; }
.bo-rf-text { width: 100%; box-sizing: border-box; min-height: 64px; padding: 10px 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; resize: vertical; outline: none; font-family: inherit; }
.bo-rf-text:focus { border-color: #7c3aed; }
.bo-rf-hint { font-size: 11px; color: rgba(29,29,31,0.45); margin: 8px 0 0; line-height: 1.6; }
.bo-rf-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }

@media (max-width: 768px) {
  .brand-orders { padding: 24px 16px 60px; }
  .bo-title { font-size: 24px; }
  .bo-form { flex-direction: column; }
  .bo-btn { padding: 14px; }
  .bo-card { padding: 16px; }
}
</style>
