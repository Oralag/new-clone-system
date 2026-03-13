<template>
  <!-- 顶部横幅 -->
  <div class="trial-banner" v-if="isTrial && !bannerDismissed">
    <span class="banner-icon">🆓</span>
    <span class="banner-text">
      您当前使用的是<strong>体验版</strong>，数据为演示环境，升级付费版获得独立数据库与全功能支持
    </span>
    <button class="banner-upgrade-btn" @click="router.push('/pricing')">了解付费版 →</button>
    <button class="banner-close" @click="bannerDismissed = true">×</button>
  </div>

  <!-- 首次登录欢迎弹框 -->
  <el-dialog v-model="showWelcome" width="500px" :show-close="false" append-to-body align-center>
    <div class="welcome-body">
      <div class="welcome-icon">🎉</div>
      <div class="welcome-title">欢迎使用数字游牧 ERP</div>
      <div class="welcome-sub">您正在使用<strong>免费体验版</strong>，可以浏览所有功能界面</div>

      <div class="compare-row">
        <div class="compare-col">
          <div class="col-head trial">体验版（当前）</div>
          <div class="col-item no">✗ 数据共享演示环境</div>
          <div class="col-item no">✗ 无法保存数据</div>
          <div class="col-item no">✗ 新增/编辑禁用</div>
          <div class="col-item ok">✓ 完整界面体验</div>
        </div>
        <div class="compare-arrow">→</div>
        <div class="compare-col">
          <div class="col-head paid">💎 付费版</div>
          <div class="col-item ok">✓ 专属独立数据库</div>
          <div class="col-item ok">✓ 数据永久保存</div>
          <div class="col-item ok">✓ 全部功能开放</div>
          <div class="col-item ok">✓ 完整界面体验</div>
        </div>
      </div>

      <div class="welcome-actions">
        <button class="btn-pricing" @click="showWelcome = false; router.push('/pricing')">
          查看付费版详情 →
        </button>
        <button class="btn-later" @click="showWelcome = false">先体验一下</button>
      </div>
    </div>
  </el-dialog>

  <!-- 写操作升级提示（由 http 拦截器触发） -->
  <el-dialog v-model="showUpgrade" width="400px" append-to-body align-center>
    <div class="upgrade-body">
      <div class="upgrade-icon">🔒</div>
      <div class="upgrade-title">付费版功能</div>
      <div class="upgrade-sub">数据写入、编辑和导入功能仅对付费版开放</div>
      <button class="btn-pricing full" @click="showUpgrade = false; router.push('/pricing')">
        查看付费版，立即升级 →
      </button>
      <button class="btn-later full" @click="showUpgrade = false">关闭</button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { trialUpgradeTrigger } from '@/api/http'

const router = useRouter()
const auth = useAuthStore()
const showWelcome = ref(false)
const showUpgrade = ref(false)
const bannerDismissed = ref(false)

const isTrial = computed(() => {
  const token = auth.token
  if (!token?.startsWith('erp_')) return false
  try {
    const raw = token.slice(4)
    const pad = raw + '='.repeat((4 - raw.length % 4) % 4)
    const json = decodeURIComponent(escape(atob(pad)))
    const payload = JSON.parse(json)
    return !!payload.trial
  } catch {
    return false
  }
})

onMounted(() => {
  trialUpgradeTrigger.show = () => { showUpgrade.value = true }

  if (isTrial.value) {
    const key = `trial_welcomed_${auth.userInfo?.account}`
    if (!sessionStorage.getItem(key)) {
      setTimeout(() => {
        showWelcome.value = true
        sessionStorage.setItem(key, '1')
      }, 800)
    }
  }
})

defineExpose({ showUpgrade })
</script>

<style scoped>
.trial-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(90deg, #fff7e6, #fffbe6);
  border-bottom: 1px solid #ffe58f;
  padding: 9px 20px;
  font-size: 13px;
  color: #874d00;
  flex-shrink: 0;
}
.banner-icon { flex-shrink: 0; }
.banner-text { flex: 1; line-height: 1.4; }
.banner-text strong { font-weight: 700; }
.banner-upgrade-btn {
  background: #fa8c16;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 6px;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}
.banner-upgrade-btn:hover { background: #d46b08; }
.banner-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #d48806;
  padding: 0 4px;
  opacity: 0.6;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.banner-close:hover { opacity: 1; }

/* Welcome */
.welcome-body { padding: 8px 0 4px; text-align: center; }
.welcome-icon { font-size: 36px; margin-bottom: 10px; }
.welcome-title { font-size: 18px; font-weight: 800; color: #1d2129; margin-bottom: 6px; }
.welcome-sub { font-size: 13px; color: #86909c; margin-bottom: 20px; }
.welcome-sub strong { color: #fa8c16; }

.compare-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  text-align: left;
}
.compare-col { flex: 1; }
.compare-arrow { color: #c9cdd4; font-size: 20px; flex-shrink: 0; }

.col-head {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
  margin-bottom: 8px;
}
.col-head.trial { background: #f2f3f5; color: #4e5969; }
.col-head.paid { background: #fa8c16; color: #fff; }

.col-item { font-size: 12px; padding: 3px 0; color: #4e5969; }
.col-item.ok { color: #00b42a; }
.col-item.no { color: #c9cdd4; text-decoration: line-through; }

.welcome-actions { display: flex; gap: 8px; }

/* Upgrade */
.upgrade-body { padding: 8px 0 4px; text-align: center; }
.upgrade-icon { font-size: 36px; margin-bottom: 10px; }
.upgrade-title { font-size: 18px; font-weight: 800; color: #1d2129; margin-bottom: 6px; }
.upgrade-sub { font-size: 13px; color: #86909c; margin-bottom: 20px; }

/* Buttons */
.btn-pricing {
  flex: 1;
  background: linear-gradient(135deg, #fa8c16, #d46b08);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 16px;
  border-radius: 8px;
  transition: opacity 0.15s;
}
.btn-pricing:hover { opacity: 0.9; }
.btn-pricing.full { display: block; width: 100%; margin-bottom: 8px; }

.btn-later {
  flex: 1;
  background: #f2f3f5;
  color: #4e5969;
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.15s;
}
.btn-later:hover { background: #e8eaed; }
.btn-later.full { display: block; width: 100%; }
</style>
