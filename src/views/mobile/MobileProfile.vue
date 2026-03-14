<template>
  <div class="profile-page">

    <!-- 顶部用户卡片 -->
    <div class="profile-header">
      <div class="avatar-circle">{{ (authStore.userName || '用').charAt(0) }}</div>
      <div class="user-info">
        <div class="user-name">{{ authStore.userName || '用户' }}</div>
        <div class="user-meta">企业代码：{{ authStore.userInfo?.shop_id || '——' }}</div>
      </div>
    </div>

    <div class="profile-body">

      <!-- 功能入口 -->
      <div class="func-card">
        <div class="func-title">常用功能</div>
        <div class="func-list">
          <div class="func-item" @click="router.push('/dashboard')">
            <div class="func-icon" style="background:rgba(0,113,227,0.08)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span class="func-label">返回首页</span>
            <svg class="func-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          <div class="func-item" @click="copyUrl">
            <div class="func-icon" style="background:rgba(52,211,153,0.1)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <span class="func-label">电脑端网址</span>
            <svg class="func-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          <div class="func-item last" @click="router.push('/portal')">
            <div class="func-icon" style="background:rgba(139,92,246,0.1)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <span class="func-label">切换工作台</span>
            <svg class="func-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>

      <div class="tech-support">技术支持：数字游牧 ERP</div>

      <!-- 退出按钮 -->
      <button class="logout-btn" @click="handleLogout">安全退出</button>

      <div class="version-text">v 2.0.0</div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

function copyUrl() {
  const url = 'https://nomaderp.pages.dev'
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('网址已复制到剪贴板')
  }).catch(() => {
    ElMessage.info('电脑端地址：' + url)
  })
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
    authStore.logout()
    router.push('/login')
  } catch {
    // cancelled
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f7;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── 用户卡片 ── */
.profile-header {
  background: #fff;
  padding: 32px 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #0071e3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #1d2129;
  letter-spacing: -0.01em;
}

.user-meta {
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}

/* ── 主体 ── */
.profile-body {
  flex: 1;
  padding: 16px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 功能卡片 ── */
.func-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px 16px 0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.func-title {
  font-size: 13px;
  font-weight: 700;
  color: #86909c;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.func-list { display: flex; flex-direction: column; }

.func-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid #f5f5f7;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.func-item.last { border-bottom: none; }
.func-item:active { background: #f5f5f7; margin: 0 -4px; padding-left: 4px; padding-right: 4px; border-radius: 8px; }

.func-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.func-label {
  flex: 1;
  font-size: 15px;
  color: #1d2129;
  font-weight: 500;
}

.func-arrow { flex-shrink: 0; }

/* ── 底部 ── */
.tech-support {
  text-align: center;
  font-size: 12px;
  color: #c2c8d5;
  padding: 4px 0;
}

.logout-btn {
  width: 100%;
  height: 50px;
  background: #fff;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.15s;
}
.logout-btn:active { background: #fef2f2; }

.version-text {
  text-align: center;
  font-size: 12px;
  color: #c2c8d5;
}
</style>
