<template>
  <div class="wp-overlay" @click.self="handleClose">
    <div class="wp-card" role="dialog" aria-modal="true" aria-label="微信扫码支付">
      <button class="wp-x" aria-label="关闭" @click="handleClose">×</button>

      <!-- 付款中 -->
      <template v-if="state === 'paying'">
        <p class="wp-title">请使用微信扫码支付</p>
        <p class="wp-amount">¥{{ amount.toFixed(2) }}</p>
        <div class="wp-qr">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="微信支付二维码" />
          <div v-else class="wp-qr-loading">二维码生成中…</div>
        </div>
        <p class="wp-wx">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#07c160"><path d="M8.7 4C4.9 4 2 6.5 2 9.6c0 1.8 1 3.4 2.6 4.4l-.7 2 2.4-1.2c.8.2 1.6.4 2.4.4h.6a5.3 5.3 0 01-.2-1.5c0-3.3 3.1-5.9 7-5.9h.5C15.9 5.6 12.6 4 8.7 4zm-2.3 3.2a.9.9 0 110 1.8.9.9 0 010-1.8zm4.7 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.1 9c-3.3 0-5.9 2.2-5.9 4.8s2.6 4.8 5.9 4.8c.7 0 1.3-.1 1.9-.3l2 1-.5-1.7c1.4-.9 2.4-2.3 2.4-3.8 0-2.6-2.6-4.8-5.8-4.8zm-2 2.6a.8.8 0 110 1.6.8.8 0 010-1.6zm4 0a.8.8 0 110 1.6.8.8 0 010-1.6z"/></svg>
          打开手机微信「扫一扫」付款
        </p>
        <div class="wp-wait">
          <span class="wp-dot"></span>
          正在确认订单支付
          <span class="wp-count">{{ countdownText }}</span>
        </div>
        <p class="wp-no">订单号 {{ orderNo }}</p>
      </template>

      <!-- 已付款 -->
      <template v-else-if="state === 'paid'">
        <div class="wp-icon wp-icon-ok">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p class="wp-result-title">支付成功</p>
        <p class="wp-result-sub">已收到 ¥{{ amount.toFixed(2) }}，我们会尽快安排发货</p>
        <p class="wp-no wp-no-strong">订单号 {{ orderNo }}</p>
        <div class="wp-btns">
          <button class="wp-btn-outline" @click="emit('view-orders')">查看订单</button>
          <button class="wp-btn" @click="emit('done')">继续购物</button>
        </div>
      </template>

      <!-- 倒计时到了还没确认到付款 -->
      <template v-else-if="state === 'timeout'">
        <div class="wp-icon wp-icon-wait">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
        </div>
        <p class="wp-result-title">还没有收到付款</p>
        <p class="wp-result-sub">
          订单先为您保留到 {{ keepUntilText }}，购物车里的商品也还在。<br />
          如果您已经付过款，请点「我已付款」再查一次。
        </p>
        <div class="wp-btns">
          <button class="wp-btn-outline" :disabled="checking" @click="handleRecheck">{{ checking ? '查询中…' : '我已付款' }}</button>
          <button class="wp-btn" @click="restart">继续扫码付款</button>
        </div>
        <p v-if="recheckMsg" class="wp-err">{{ recheckMsg }}</p>
      </template>

      <!-- 订单已关闭（超时 / 被取消） -->
      <template v-else-if="state === 'closed'">
        <div class="wp-icon wp-icon-closed">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </div>
        <p class="wp-result-title">订单已关闭</p>
        <p class="wp-result-sub">超过付款时间没有付款，订单已自动取消。购物车里的商品还在，可以重新下单。</p>
        <div class="wp-btns">
          <button class="wp-btn" @click="handleClose">知道了</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getWebOrderStatus } from '@/api/brandWebOrder'

const props = defineProps<{
  orderNo: string
  token: string
  codeUrl: string
  amount: number
  expiresAt?: string | null
}>()
const emit = defineEmits<{ paid: [orderNo: string]; close: []; done: []; 'view-orders': [] }>()

const COUNTDOWN_SECONDS = 5 * 60
const POLL_MS = 3000
const WX_CHECK_EVERY = 4          // 每 4 次轮询（约 12 秒）让后端主动问一次微信，防回调晚到

const state = ref<'paying' | 'paid' | 'timeout' | 'closed'>('paying')
const qrDataUrl = ref('')
const remaining = ref(COUNTDOWN_SECONDS)
const checking = ref(false)
const recheckMsg = ref('')
const expiresAt = ref<string | null>(props.expiresAt || null)
let pollTimer: ReturnType<typeof setTimeout> | undefined
let tickTimer: ReturnType<typeof setInterval> | undefined
let polls = 0
let alive = true

const countdownText = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
const keepUntilText = computed(() => {
  if (!expiresAt.value) return '稍后'
  return new Date(expiresAt.value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
})

async function renderQr(url: string) {
  const QRCode = (await import('qrcode')).default
  qrDataUrl.value = await QRCode.toDataURL(url, { width: 440, margin: 1, errorCorrectionLevel: 'M' })
}

function stopTimers() {
  clearTimeout(pollTimer)
  clearInterval(tickTimer)
}

function applyStatus(s: { status: number; paid: boolean; expires_at: string | null }) {
  if (s.expires_at) expiresAt.value = s.expires_at
  if (s.paid) {
    state.value = 'paid'
    stopTimers()
    emit('paid', props.orderNo)
    return true
  }
  if (s.status === 4) {
    state.value = 'closed'
    stopTimers()
    return true
  }
  return false
}

async function poll() {
  if (!alive || state.value !== 'paying') return
  polls += 1
  try {
    const s = await getWebOrderStatus(props.orderNo, props.token, polls % WX_CHECK_EVERY === 0)
    if (applyStatus(s)) return
  } catch { /* 网络抖一下不打断倒计时，下一轮再查 */ }
  if (alive && state.value === 'paying') pollTimer = setTimeout(poll, POLL_MS)
}

function startCountdown() {
  remaining.value = COUNTDOWN_SECONDS
  tickTimer = setInterval(async () => {
    remaining.value -= 1
    if (remaining.value > 0) return
    clearInterval(tickTimer)
    clearTimeout(pollTimer)
    // 到点再主动问一次微信，避免刚付完正好卡在倒计时结束
    try {
      const s = await getWebOrderStatus(props.orderNo, props.token, true)
      if (applyStatus(s)) return
    } catch { /* 下面按超时处理 */ }
    if (state.value === 'paying') state.value = 'timeout'
  }, 1000)
}

function restart() {
  recheckMsg.value = ''
  state.value = 'paying'
  polls = 0
  startCountdown()
  poll()
}

async function handleRecheck() {
  checking.value = true
  recheckMsg.value = ''
  try {
    const s = await getWebOrderStatus(props.orderNo, props.token, true)
    if (!applyStatus(s)) recheckMsg.value = '微信那边还没有这笔付款记录。刚付完的话等几秒再点一次。'
  } catch (e: any) {
    recheckMsg.value = e?.message || '查询失败，请稍后再试'
  } finally {
    checking.value = false
  }
}

function handleClose() {
  if (state.value === 'paid') emit('done')
  else emit('close')
}

onMounted(async () => {
  await renderQr(props.codeUrl)
  startCountdown()
  pollTimer = setTimeout(poll, POLL_MS)
})
onUnmounted(() => {
  alive = false
  stopTimers()
})
</script>

<style scoped>
.wp-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.wp-card {
  position: relative; width: 100%; max-width: 380px;
  background: #fff; border-radius: 24px; padding: 32px 28px 24px;
  text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}
.wp-x {
  position: absolute; top: 12px; right: 14px; width: 32px; height: 32px;
  border: none; background: transparent; font-size: 24px; line-height: 1;
  color: rgba(29,29,31,0.35); cursor: pointer; border-radius: 50%;
}
.wp-x:hover { background: #f5f5f7; color: #1d1d1f; }
.wp-title { font-size: 15px; font-weight: 700; color: #1d1d1f; margin: 0 0 6px; }
.wp-amount { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; color: #1d1d1f; margin: 0 0 16px; font-variant-numeric: tabular-nums; }
.wp-qr {
  width: 220px; height: 220px; margin: 0 auto 14px; padding: 10px;
  border: 1.5px solid rgba(0,0,0,0.08); border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
}
.wp-qr img { width: 100%; height: 100%; image-rendering: pixelated; }
.wp-qr-loading { font-size: 13px; color: rgba(29,29,31,0.4); }
.wp-wx { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: rgba(29,29,31,0.6); margin: 0 0 16px; }
.wp-wait {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(124,58,237,0.07); color: #6d28d9;
  font-size: 13px; font-weight: 700; padding: 8px 14px; border-radius: 999px;
}
.wp-count { font-variant-numeric: tabular-nums; min-width: 36px; text-align: left; }
.wp-dot { width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; animation: wp-pulse 1.2s ease-in-out infinite; }
@keyframes wp-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.7); } }
.wp-no { font-size: 11px; color: rgba(29,29,31,0.35); margin: 14px 0 0; font-variant-numeric: tabular-nums; }
.wp-no-strong { font-size: 12px; color: #6d28d9; font-weight: 700; background: rgba(124,58,237,0.07); display: inline-block; padding: 6px 12px; border-radius: 10px; }

.wp-icon { width: 64px; height: 64px; margin: 4px auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.wp-icon-ok { background: rgba(52,199,89,0.12); color: #22a447; }
.wp-icon-wait { background: rgba(217,119,6,0.1); color: #d97706; }
.wp-icon-closed { background: rgba(0,0,0,0.06); color: rgba(29,29,31,0.5); }
.wp-result-title { font-size: 20px; font-weight: 800; color: #1d1d1f; margin: 0 0 8px; }
.wp-result-sub { font-size: 13px; color: rgba(29,29,31,0.55); line-height: 1.7; margin: 0; }
.wp-btns { display: flex; gap: 10px; justify-content: center; margin-top: 22px; }
.wp-btn, .wp-btn-outline {
  flex: 1; max-width: 150px; height: 44px; border-radius: 14px;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s, border-color 0.2s;
}
.wp-btn { background: #1d1d1f; color: #fff; border: none; }
.wp-btn:hover { background: #7c3aed; }
.wp-btn-outline { background: #fff; color: #1d1d1f; border: 1.5px solid rgba(0,0,0,0.12); }
.wp-btn-outline:hover:not(:disabled) { border-color: #7c3aed; }
.wp-btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }
.wp-err { font-size: 12px; color: #d97706; margin: 12px 0 0; line-height: 1.6; }

@media (prefers-reduced-motion: reduce) { .wp-dot { animation: none; } }
</style>
