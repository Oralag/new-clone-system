<template>
  <div class="brand-orders">
    <div class="bo-header">
      <h2 class="bo-title">我的订单</h2>
      <p class="bo-sub">官网和小程序的订单都在这里</p>
    </div>

    <!-- 没登录：扫码登录后才能看订单 -->
    <div v-if="!webUser" class="bo-login">
      <p class="bo-login-title">登录后查看订单</p>
      <p class="bo-login-sub">用微信扫一扫小程序码登录，账号就是小程序会员</p>
      <button class="bo-btn bo-login-go" @click="showLogin = true">扫码登录</button>
    </div>
    <div v-else class="bo-user">
      <span>{{ maskPhone(webUser.phone) }}<template v-if="webUser.name"> · {{ webUser.name }}</template></span>
      <span class="bo-user-btns">
        <button class="bo-user-link" :disabled="searching" @click="doSearch">{{ searching ? '刷新中…' : '刷新' }}</button>
        <button class="bo-user-link" @click="logout">退出登录</button>
      </span>
    </div>

    <div v-if="webUser && searched && !searching && !errorMsg && results.length === 0" class="bo-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(29,29,31,0.2)" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <p>还没有订单</p>
      <p class="bo-empty-hint">以前没登录时下的单，收货手机号和这个账号一样的也会显示在这里</p>
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
          <span v-if="order.source !== 'web'" class="bo-pay-hint">小程序订单，请在小程序里付款</span>
          <template v-else>
            <button class="bo-link-btn" :disabled="busy === order.order_no" @click="doCancel(order.order_no)">取消订单</button>
            <button v-if="tokenOf(order)" class="bo-pay-btn" :disabled="opening === order.order_no" @click="continuePay(order)">
              {{ opening === order.order_no ? '正在获取支付码…' : '继续付款' }}
            </button>
          </template>
        </div>
        <div v-else-if="[1, 2, 3, 5].includes(order.status)" class="bo-pay-row">
          <button v-if="order.tracking_no" class="bo-link-btn" :disabled="trackLoading === order.order_no" @click="toggleTrack(order)">
            {{ trackLoading === order.order_no ? '查询中…' : trackFor === order.order_no ? '收起物流' : '查看物流' }}
          </button>
          <span v-else-if="order.status === 1" class="bo-pay-hint">商家发货后这里能查物流</span>
          <template v-if="canRefund(order)">
            <button class="bo-link-btn" @click="openForm(order, 'service')">申请售后</button>
            <button class="bo-link-btn" @click="openForm(order, 'refund')">申请退款</button>
          </template>
        </div>
        <div v-if="serviceSent[order.order_no]" class="bo-refund">售后申请已提交，商家会尽快打电话联系您</div>

        <!-- 物流轨迹 -->
        <div v-if="trackFor === order.order_no" class="bo-track">
          <div v-if="trackError" class="bo-track-empty">{{ trackError }}</div>
          <template v-else-if="track">
            <div class="bo-track-head">{{ track.carrier || order.express_company || '快递' }} · {{ track.number }}</div>
            <div v-if="!track.events.length" class="bo-track-empty">快递公司还没有返回轨迹，一般揽收后几小时内会有，稍后再来看</div>
            <ol v-else class="bo-track-list">
              <li v-for="(e, i) in track.events" :key="i" :class="{ latest: i === 0 }">
                <div class="bo-track-desc">{{ e.description }}<template v-if="e.location">（{{ e.location }}）</template></div>
                <div class="bo-track-time">{{ fmtTime(e.time) }}</div>
              </li>
            </ol>
          </template>
        </div>

        <!-- 退款 / 售后申请表 -->
        <div v-if="formFor === order.order_no" class="bo-refund-form">
          <p class="bo-rf-title">{{ formKind === 'refund' ? `申请退款 · ¥${order.total_amount.toFixed(2)}` : '申请售后' }}</p>
          <div class="bo-rf-reasons">
            <button v-for="r in formReasons(order)" :key="r" class="bo-rf-chip" :class="{ on: refundReason === r }" @click="refundReason = r">{{ r }}</button>
          </div>
          <textarea v-model="refundDetail" class="bo-rf-text" maxlength="150" :placeholder="detailPlaceholder"></textarea>
          <p class="bo-rf-hint">{{ formKind === 'refund'
            ? '提交后商家会尽快处理，同意后钱原路退回您的微信。'
            : order.status === 1 ? '提交后商家会打您的收货手机号联系处理。' : '提交后商家会打您的收货手机号联系，换货、补发不用重新付款。' }}</p>
          <div class="bo-rf-btns">
            <button class="bo-link-btn" @click="formFor = ''">取消</button>
            <button class="bo-pay-btn" :disabled="!canSubmitForm || busy === order.order_no" @click="submitForm(order)">
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

    <BrandLoginDialog v-if="showLogin" reason="登录后查看你的订单" @close="showLogin = false" @success="handleLoggedIn" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BrandWebPayDialog from '@/components/BrandWebPayDialog.vue'
import BrandLoginDialog from '@/components/BrandLoginDialog.vue'
import {
  lookupWebOrders, getWebOrderStatus, loadMyWebOrders, applyWebRefund, cancelWebOrder, submitWebLead, getWebOrderTracking,
  loadWebSession, clearWebSession, WebNeedLoginError,
  WEB_ORDER_STATUS_TEXT, type WebOrderRow, type WebRefundInfo, type WebTrackInfo, type WebUser,
} from '@/api/brandWebOrder'

const webUser = ref<WebUser | null>(loadWebSession()?.user || null)
const showLogin = ref(false)
function maskPhone(p: string) {
  return /^\d{11}$/.test(p || '') ? `${p.slice(0, 3)}****${p.slice(7)}` : (p || '')
}
function handleLoggedIn(user: WebUser) {
  webUser.value = user
  showLogin.value = false
  doSearch()
}
function logout() {
  clearWebSession()
  webUser.value = null
  results.value = []
  searched.value = false
}
// 任何接口回「请先登录」（过期/会员被删）：退回未登录界面
function handleErr(e: any, prefix: string) {
  if (e instanceof WebNeedLoginError) {
    logout()
    return
  }
  errorMsg.value = `${prefix}${e?.message || '请稍后再试'}`
}

const searching = ref(false)
const searched = ref(false)
const errorMsg = ref('')
const results = ref<WebOrderRow[]>([])
const opening = ref('')
const payOrder = ref<{ order_no: string; token: string; code_url: string; total_amount: number; expires_at: string | null } | null>(null)

async function doSearch() {
  if (!webUser.value) return
  errorMsg.value = ''
  searching.value = true
  searched.value = false
  try {
    const data = await lookupWebOrders()
    results.value = data.rows || []
  } catch (e: any) {
    results.value = []
    handleErr(e, '查询失败：')
  } finally {
    searching.value = false
    searched.value = true
  }
}

// 付款凭证：后端给的（自己名下的单）优先，其次是这台电脑下单时记下的
function tokenOf(order: WebOrderRow) {
  return order.pay_token || loadMyWebOrders().find(o => o.order_no === order.order_no)?.token || ''
}

async function continuePay(order: WebOrderRow) {
  const orderNo = order.order_no
  const token = tokenOf(order)
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
const formFor = ref('')
const formKind = ref<'refund' | 'service'>('refund')
const refundReason = ref('')
const refundDetail = ref('')
const serviceSent = ref<Record<string, boolean>>({})

// 被拒绝的申请可以重新提交；处理中/已退款的不再显示按钮
function canRefund(order: WebOrderRow) {
  if (![1, 2, 3].includes(order.status)) return false
  return !order.refund || order.refund.status === 2
}
// 退款走 ERP 退款管理（同意即原路退钱）；售后（改地址、换货、补发）不退钱，走官网留言让商家联系
function formReasons(order: WebOrderRow) {
  if (formKind.value === 'refund') {
    return order.status === 1
      ? ['不想要了', '拍错了/多拍了', '地址填错了', '其他']
      : ['商品破损/变质', '发错货/少发', '质量问题', '没收到货', '其他']
  }
  return order.status === 1
    ? ['修改收货地址', '修改商品/数量', '催发货', '其他问题']
    : ['换货', '补发（少发/漏发）', '商品有问题', '其他问题']
}
const detailPlaceholder = computed(() => {
  if (refundReason.value === '修改收货地址') return '请填写新的收货地址（姓名、手机、省市区、详细地址）'
  return formKind.value === 'refund' ? '补充说明（选填）：比如破损情况' : '请说明具体情况，比如想换成什么、少了哪件'
})
// 售后需要写清楚要怎么处理，补充说明必填
const canSubmitForm = computed(() => !!refundReason.value && (formKind.value === 'refund' || !!refundDetail.value.trim()))

const trackFor = ref('')
const trackLoading = ref('')
const track = ref<WebTrackInfo | null>(null)
const trackError = ref('')
async function toggleTrack(order: WebOrderRow) {
  if (trackFor.value === order.order_no) { trackFor.value = ''; return }
  trackLoading.value = order.order_no
  track.value = null
  trackError.value = ''
  try {
    track.value = await getWebOrderTracking(order.order_no)
  } catch (e: any) {
    if (e instanceof WebNeedLoginError) { logout(); return }
    trackError.value = `物流查询失败：${e?.message || '请稍后再试'}`
  } finally {
    trackLoading.value = ''
    trackFor.value = order.order_no
  }
}
function refundTitle(r: WebRefundInfo) {
  if (r.status === 1) return '已退款'
  if (r.status === 2) return '退款申请未通过'
  return r.note ? '商家正在和您协商处理' : '退款/售后申请处理中'
}
function openForm(order: WebOrderRow, kind: 'refund' | 'service') {
  formFor.value = order.order_no
  formKind.value = kind
  refundReason.value = ''
  refundDetail.value = ''
}
async function submitForm(order: WebOrderRow) {
  const reason = [refundReason.value, refundDetail.value.trim()].filter(Boolean).join('：')
  const mobile = webUser.value?.phone || ''
  busy.value = order.order_no
  errorMsg.value = ''
  try {
    if (formKind.value === 'refund') {
      await applyWebRefund(order.order_no, reason)
      formFor.value = ''
      await doSearch()
    } else {
      const goods = order.items.map(i => `${i.goods_name} × ${i.qty}`).join('、')
      await submitWebLead({
        type: 'support',
        name: `订单 ${order.order_no}`,
        mobile,
        content: `【售后·${refundReason.value}】订单 ${order.order_no}（${WEB_ORDER_STATUS_TEXT[order.status] || ''}，¥${order.total_amount.toFixed(2)}）\n商品：${goods}\n说明：${refundDetail.value.trim()}`,
      })
      formFor.value = ''
      serviceSent.value = { ...serviceSent.value, [order.order_no]: true }
    }
  } catch (e: any) {
    handleErr(e, '提交失败：')
  } finally {
    busy.value = ''
  }
}
async function doCancel(orderNo: string) {
  if (!confirm('确定取消这个订单吗？')) return
  busy.value = orderNo
  errorMsg.value = ''
  try {
    await cancelWebOrder(orderNo)
  } catch (e: any) {
    handleErr(e, '')
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
  if (webUser.value) doSearch()
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
.bo-login { text-align: center; padding: 40px 24px; background: #f5f5f7; border-radius: 20px; }
.bo-login-title { font-size: 18px; font-weight: 800; margin: 0 0 6px; }
.bo-login-sub { font-size: 13px; color: rgba(29,29,31,0.5); margin: 0 0 20px; }
.bo-login-go { height: 44px; }
.bo-user { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; margin-bottom: 16px; border-radius: 14px; background: rgba(52,199,89,0.1); color: #15803d; font-size: 13px; font-weight: 600; }
.bo-user-btns { display: flex; gap: 14px; }
.bo-user-link { border: none; background: none; color: rgba(29,29,31,0.5); font-size: 12px; cursor: pointer; text-decoration: underline; padding: 0; }
.bo-user-link:disabled { opacity: 0.5; cursor: default; }
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
.bo-pay-row { flex-wrap: wrap; }
.bo-track { margin-top: 12px; padding: 14px 16px; border-radius: 14px; background: #fff; border: 1.5px solid rgba(0,113,227,0.15); }
.bo-track-head { font-size: 13px; font-weight: 800; margin-bottom: 10px; }
.bo-track-empty { font-size: 12px; color: rgba(29,29,31,0.5); line-height: 1.6; }
.bo-track-list { list-style: none; margin: 0; padding: 0 0 0 14px; border-left: 2px solid rgba(0,0,0,0.08); }
.bo-track-list li { position: relative; padding: 0 0 12px 12px; }
.bo-track-list li::before { content: ''; position: absolute; left: -20px; top: 4px; width: 8px; height: 8px; border-radius: 50%; background: rgba(0,0,0,0.18); }
.bo-track-list li.latest::before { background: #0071e3; box-shadow: 0 0 0 3px rgba(0,113,227,0.15); }
.bo-track-list li.latest .bo-track-desc { color: #0071e3; font-weight: 700; }
.bo-track-desc { font-size: 13px; color: #1d1d1f; line-height: 1.5; }
.bo-track-time { font-size: 11px; color: rgba(29,29,31,0.4); margin-top: 2px; }

@media (max-width: 768px) {
  .brand-orders { padding: 24px 16px 60px; }
  .bo-title { font-size: 24px; }
  .bo-form { flex-direction: column; }
  .bo-btn { padding: 14px; }
  .bo-card { padding: 16px; }
}
</style>
