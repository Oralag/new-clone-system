<template>
  <div class="wl-overlay" @click.self="emit('close')">
    <div class="wl-card" role="dialog" aria-modal="true" aria-label="微信扫码登录">
      <button class="wl-x" aria-label="关闭" @click="emit('close')">×</button>
      <p class="wl-title">{{ title }}</p>
      <p class="wl-sub">{{ subtitle }}</p>

      <div class="wl-qr" :class="{ dim: state !== 'waiting' }">
        <img v-if="qr" :src="qr" alt="小程序登录码" />
        <div v-else-if="!errorMsg" class="wl-qr-loading">登录码生成中…</div>
        <div v-if="state === 'scanned'" class="wl-mask">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22a447" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>已扫码<br />请在手机上点「确认登录」</span>
        </div>
        <div v-else-if="state === 'expired' || state === 'cancelled' || errorMsg" class="wl-mask">
          <span>{{ errorMsg || (state === 'cancelled' ? '你在手机上取消了登录' : '登录码已过期') }}</span>
          <button class="wl-refresh" @click="start">刷新登录码</button>
        </div>
      </div>

      <p class="wl-wx">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#07c160"><path d="M8.7 4C4.9 4 2 6.5 2 9.6c0 1.8 1 3.4 2.6 4.4l-.7 2 2.4-1.2c.8.2 1.6.4 2.4.4h.6a5.3 5.3 0 01-.2-1.5c0-3.3 3.1-5.9 7-5.9h.5C15.9 5.6 12.6 4 8.7 4zm-2.3 3.2a.9.9 0 110 1.8.9.9 0 010-1.8zm4.7 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.1 9c-3.3 0-5.9 2.2-5.9 4.8s2.6 4.8 5.9 4.8c.7 0 1.3-.1 1.9-.3l2 1-.5-1.7c1.4-.9 2.4-2.3 2.4-3.8 0-2.6-2.6-4.8-5.8-4.8zm-2 2.6a.8.8 0 110 1.6.8.8 0 010-1.6zm4 0a.8.8 0 110 1.6.8.8 0 010-1.6z"/></svg>
        打开手机微信「扫一扫」
      </p>
      <p class="wl-tip">账号就是小程序会员，官网和小程序的订单、积分都在一起</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { startWebLogin, pollWebLogin, saveWebSession, type WebUser } from '@/api/brandWebOrder'

const props = defineProps<{ reason?: string }>()
const emit = defineEmits<{ close: []; success: [user: WebUser] }>()

const qr = ref('')
const state = ref<'waiting' | 'scanned' | 'expired' | 'cancelled'>('waiting')
const errorMsg = ref('')
let sid = ''
let timer: ReturnType<typeof setTimeout> | null = null
let alive = true

const title = computed(() => '微信扫码登录')
const subtitle = computed(() => props.reason || '登录后才能下单付款、查看订单')

function stopPoll() {
  if (timer) { clearTimeout(timer); timer = null }
}

async function start() {
  stopPoll()
  qr.value = ''
  errorMsg.value = ''
  state.value = 'waiting'
  try {
    const r = await startWebLogin()
    if (!alive) return
    sid = r.sid
    qr.value = r.qr
    poll()
  } catch (e: any) {
    errorMsg.value = `登录码生成失败：${e?.message || '请稍后再试'}`
  }
}

function poll() {
  timer = setTimeout(async () => {
    if (!alive) return
    try {
      const r = await pollWebLogin(sid)
      if (!alive) return
      if (r.status === 'confirmed' && r.token && r.user) {
        saveWebSession({ token: r.token, user: r.user })
        emit('success', r.user)
        return
      }
      if (r.status === 'expired' || r.status === 'cancelled') { state.value = r.status; return }
      state.value = r.status === 'scanned' ? 'scanned' : 'waiting'
    } catch { /* 网络抖一下继续轮询 */ }
    poll()
  }, 2000)
}

onMounted(start)
onBeforeUnmount(() => { alive = false; stopPoll() })
</script>

<style scoped>
.wl-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.wl-card {
  position: relative; width: 100%; max-width: 360px;
  background: #fff; border-radius: 24px; padding: 32px 28px 24px;
  text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}
.wl-x {
  position: absolute; top: 12px; right: 14px; width: 32px; height: 32px;
  border: none; background: transparent; font-size: 24px; line-height: 1;
  color: rgba(29,29,31,0.35); cursor: pointer; border-radius: 50%;
}
.wl-x:hover { background: #f5f5f7; color: #1d1d1f; }
.wl-title { font-size: 20px; font-weight: 800; color: #1d1d1f; margin: 0 0 6px; }
.wl-sub { font-size: 13px; color: rgba(29,29,31,0.5); margin: 0 0 18px; }
.wl-qr {
  position: relative; width: 220px; height: 220px; margin: 0 auto 14px; padding: 10px;
  border: 1.5px solid rgba(0,0,0,0.08); border-radius: 16px;
  display: flex; align-items: center; justify-content: center; box-sizing: border-box;
}
.wl-qr img { width: 100%; height: 100%; }
.wl-qr.dim img { opacity: 0.12; }
.wl-qr-loading { font-size: 13px; color: rgba(29,29,31,0.4); }
.wl-mask {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  font-size: 13px; font-weight: 700; color: #1d1d1f; line-height: 1.6; padding: 16px;
}
.wl-refresh { height: 34px; padding: 0 16px; border-radius: 10px; border: none; background: #1d1d1f; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }
.wl-refresh:hover { background: #7c3aed; }
.wl-wx { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: rgba(29,29,31,0.6); margin: 0 0 8px; }
.wl-tip { font-size: 11px; color: rgba(29,29,31,0.4); margin: 0; line-height: 1.6; }
</style>
