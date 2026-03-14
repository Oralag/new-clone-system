<template>
  <!-- 顶部横幅 (ERP系统内部) -->
  <div class="trial-banner" v-if="isTrial && !bannerDismissed">
    <span class="banner-dot"></span>
    <span class="banner-text">
      <template v-if="trialExpired">
        <strong>体验已到期</strong> · 升级付费版继续使用全部功能
      </template>
      <template v-else-if="trialStarted">
        <strong>体验版</strong> · 剩余 <strong class="days-highlight">{{ daysLeft }} 天</strong>体验时间 · 数据为演示环境
      </template>
      <template v-else>
        <strong>体验版</strong> · 数据为演示环境，新增/编辑不可用
      </template>
    </span>
    <button class="banner-upgrade-btn" @click="upgradeDialog?.open()">升级付费版 →</button>
    <button class="banner-close" @click="bannerDismissed = true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>

  <!-- 写操作拦截弹窗 -->
  <el-dialog v-model="showWriteBlock" width="400px" append-to-body align-center class="write-block-dialog">
    <div class="wb-body">
      <button class="wb-close" @click="showWriteBlock = false">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <div class="wb-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <div class="wb-title">体验版限制</div>
      <div class="wb-desc">数据写入、编辑和导入功能仅对付费版开放</div>

      <!-- 未领取：显示领取按钮 -->
      <template v-if="!trialStarted && !trialExpired">
        <div class="wb-divider">
          <span>或者</span>
        </div>
        <div class="wb-trial-card" @click="claimTrial">
          <div class="wb-trial-left">
            <div class="wb-trial-icon">🎁</div>
            <div>
              <div class="wb-trial-title">领取 15 天免费体验</div>
              <div class="wb-trial-desc">解锁全部功能，体验付费版完整能力</div>
            </div>
          </div>
          <div class="wb-trial-btn">立即领取</div>
        </div>
      </template>

      <!-- 已领取未到期 -->
      <template v-else-if="trialStarted && !trialExpired">
        <div class="wb-trial-active">
          <div class="wb-trial-active-icon">⏳</div>
          <div>
            <div class="wb-trial-active-title">体验期进行中</div>
            <div class="wb-trial-active-desc">剩余 <strong>{{ daysLeft }} 天</strong>，到期后需升级付费版</div>
          </div>
        </div>
      </template>

      <!-- 已到期 -->
      <template v-else-if="trialExpired">
        <div class="wb-trial-expired">
          <div class="wb-trial-expired-icon">⌛</div>
          <div class="wb-trial-expired-text">15 天体验已到期，请升级付费版继续使用</div>
        </div>
      </template>

      <button class="wb-upgrade-btn" @click="showWriteBlock = false; upgradeDialog?.open()">
        {{ trialExpired ? '立即升级付费版 →' : '了解付费版，立即升级' }}
      </button>
      <button class="wb-cancel" @click="showWriteBlock = false">关闭</button>
    </div>
  </el-dialog>

  <!-- 领取成功弹窗 -->
  <el-dialog v-model="showClaimSuccess" width="360px" append-to-body align-center class="write-block-dialog">
    <div class="wb-body" style="text-align:center">
      <div class="claim-success-icon">🎉</div>
      <div class="wb-title">体验已激活！</div>
      <div class="wb-desc">您已成功领取 <strong>15 天</strong>免费体验<br/>到期时间：{{ trialExpireDate }}</div>
      <button class="wb-upgrade-btn" @click="showClaimSuccess = false">开始体验</button>
    </div>
  </el-dialog>

  <UpgradeDialog ref="upgradeDialog" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { trialUpgradeTrigger } from '@/api/http'
import UpgradeDialog from '@/components/UpgradeDialog.vue'

const auth = useAuthStore()
const showWriteBlock = ref(false)
const showClaimSuccess = ref(false)
const bannerDismissed = ref(false)
const upgradeDialog = ref<InstanceType<typeof UpgradeDialog> | null>(null)

const isTrial = computed(() => {
  const token = auth.token
  if (!token?.startsWith('erp_')) return false
  try {
    const raw = token.slice(4)
    const pad = raw + '='.repeat((4 - raw.length % 4) % 4)
    const json = decodeURIComponent(escape(atob(pad)))
    return !!JSON.parse(json).trial
  } catch { return false }
})

// 本地存储 key，按账号区分
const storageKey = computed(() => `trial_start_${auth.userInfo?.account || 'default'}`)

const trialStartTs = computed(() => {
  const v = localStorage.getItem(storageKey.value)
  return v ? parseInt(v) : null
})

const TRIAL_DAYS = 15
const MS_PER_DAY = 86400000

const trialStarted = computed(() => !!trialStartTs.value)

const daysLeft = computed(() => {
  if (!trialStartTs.value) return 0
  const elapsed = Date.now() - trialStartTs.value
  const left = TRIAL_DAYS - Math.floor(elapsed / MS_PER_DAY)
  return Math.max(0, left)
})

const trialExpired = computed(() => trialStarted.value && daysLeft.value === 0)

const trialExpireDate = computed(() => {
  if (!trialStartTs.value) return ''
  const d = new Date(trialStartTs.value + TRIAL_DAYS * MS_PER_DAY)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
})

function claimTrial() {
  const now = Date.now()
  localStorage.setItem(storageKey.value, String(now))
  // Sync to server KV
  const token = auth.token || ''
  fetch('/api/claim-trial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
  }).catch(() => {})
  showWriteBlock.value = false
  showClaimSuccess.value = true
}

onMounted(() => {
  trialUpgradeTrigger.show = () => { showWriteBlock.value = true }
})
</script>

<style>
.write-block-dialog .el-dialog { border-radius: 20px !important; overflow: hidden; padding: 0 !important; }
.write-block-dialog .el-dialog__header { display: none !important; }
.write-block-dialog .el-dialog__body { padding: 0 !important; }
</style>

<style scoped>
/* ── Trial Banner ── */
.trial-banner {
  display: flex; align-items: center; gap: 10px;
  background: #1d1d1f; padding: 10px 20px;
  font-size: 13px; color: rgba(255,255,255,0.55);
  flex-shrink: 0;
}
.banner-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #f5a623; flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
.banner-text { flex: 1; line-height: 1.4; font-weight: 500; }
.banner-text strong { color: #fff; font-weight: 700; }
.days-highlight { color: #f5a623; }
.banner-upgrade-btn {
  background: #fff; color: #1d1d1f; border: none; cursor: pointer;
  font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 999px;
  white-space: nowrap; flex-shrink: 0; transition: background 0.15s;
}
.banner-upgrade-btn:hover { background: rgba(255,255,255,0.88); }
.banner-close {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.3); padding: 2px;
  display: flex; align-items: center; flex-shrink: 0; transition: color 0.15s;
}
.banner-close:hover { color: rgba(255,255,255,0.7); }

/* ── Write block dialog ── */
.wb-body {
  position: relative; padding: 32px 28px 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.wb-close {
  position: absolute; top: 14px; right: 14px;
  width: 28px; height: 28px; background: rgba(0,0,0,0.05);
  border: none; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(29,29,31,0.4); transition: background 0.15s;
}
.wb-close:hover { background: rgba(0,0,0,0.1); }
.wb-icon {
  width: 52px; height: 52px; background: #f5f5f7; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px; color: #1d1d1f;
}
.wb-title { font-size: 17px; font-weight: 800; color: #1d1d1f; margin-bottom: 6px; text-align: center; }
.wb-desc { font-size: 13px; color: rgba(29,29,31,0.45); margin-bottom: 16px; line-height: 1.5; text-align: center; }

/* divider */
.wb-divider {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 12px; color: rgba(29,29,31,0.2); font-size: 11px;
}
.wb-divider::before, .wb-divider::after {
  content: ''; flex: 1; height: 1px; background: rgba(0,0,0,0.07);
}

/* Trial claim card */
.wb-trial-card {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: #f5f5f7; border: 1.5px solid rgba(0,0,0,0.07);
  border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;
  cursor: pointer; transition: border-color 0.2s, background 0.2s;
}
.wb-trial-card:hover { border-color: #1d1d1f; background: #efefef; }
.wb-trial-left { display: flex; align-items: center; gap: 10px; }
.wb-trial-icon { font-size: 24px; flex-shrink: 0; }
.wb-trial-title { font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 2px; }
.wb-trial-desc { font-size: 11px; color: rgba(29,29,31,0.45); }
.wb-trial-btn {
  flex-shrink: 0; background: #1d1d1f; color: #fff;
  font-size: 11px; font-weight: 700; padding: 7px 14px;
  border-radius: 999px; white-space: nowrap;
}

/* Trial active */
.wb-trial-active {
  display: flex; align-items: center; gap: 10px;
  background: #f5f5f7; border-radius: 12px; padding: 13px 16px;
  margin-bottom: 14px;
}
.wb-trial-active-icon { font-size: 22px; flex-shrink: 0; }
.wb-trial-active-title { font-size: 13px; font-weight: 700; color: #1d1d1f; margin-bottom: 2px; }
.wb-trial-active-desc { font-size: 12px; color: rgba(29,29,31,0.45); }
.wb-trial-active-desc strong { color: #1d1d1f; }

/* Trial expired */
.wb-trial-expired {
  display: flex; align-items: center; gap: 10px;
  background: #fff5f5; border: 1px solid rgba(255,59,48,0.12);
  border-radius: 12px; padding: 13px 16px; margin-bottom: 14px;
}
.wb-trial-expired-icon { font-size: 22px; flex-shrink: 0; }
.wb-trial-expired-text { font-size: 12px; color: rgba(29,29,31,0.55); line-height: 1.5; }

.wb-upgrade-btn {
  display: block; width: 100%; background: #1d1d1f; color: #fff;
  border: none; cursor: pointer; font-size: 14px; font-weight: 700;
  padding: 13px; border-radius: 12px; margin-bottom: 8px; transition: background 0.15s;
}
.wb-upgrade-btn:hover { background: #3a3a3a; }
.wb-cancel {
  display: block; width: 100%; background: none; color: rgba(29,29,31,0.4);
  border: 1px solid rgba(0,0,0,0.09); cursor: pointer; font-size: 13px;
  padding: 11px; border-radius: 12px; transition: background 0.15s;
}
.wb-cancel:hover { background: rgba(0,0,0,0.03); }

/* Claim success */
.claim-success-icon { font-size: 44px; margin-bottom: 14px; text-align: center; }
</style>
