<template>
  <div class="portal-page">
    <div class="portal-header">
      <h1 class="portal-title">数字游牧</h1>
      <p class="portal-subtitle">请选择要进入的模块</p>
    </div>
    <div class="portal-cards">
      <div class="portal-card" @click="go('/dashboard')">
        <div class="card-icon erp-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="18" height="18" rx="3" fill="currentColor" opacity="0.9"/>
            <rect x="26" y="4" width="18" height="18" rx="3" fill="currentColor" opacity="0.6"/>
            <rect x="4" y="26" width="18" height="18" rx="3" fill="currentColor" opacity="0.6"/>
            <rect x="26" y="26" width="18" height="18" rx="3" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
        <div class="card-content">
          <h2 class="card-title">ERP 管理系统</h2>
          <p class="card-desc">销售、采购、仓库、财务、人事一体化管理</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
      <div class="portal-card" @click="go('/agent')">
        <div class="card-icon agent-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="16" r="8" fill="currentColor" opacity="0.9"/>
            <path d="M8 38c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
            <circle cx="36" cy="30" r="5" fill="currentColor" opacity="0.8"/>
            <path d="M33 30h6M36 27v6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="card-content">
          <h2 class="card-title">智能体工作流</h2>
          <p class="card-desc">内容创作、热搜抓取、自动生成文案与视频</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
      <div class="portal-card portal-card--disabled">
        <div class="card-icon more-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="24" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="36" cy="24" r="4" fill="currentColor" opacity="0.4"/>
          </svg>
        </div>
        <div class="card-content">
          <h2 class="card-title">即将推出</h2>
          <p class="card-desc">更多功能模块敬请期待</p>
        </div>
      </div>
    </div>
    <div class="portal-footer">
      <button class="btn-logout" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function go(path: string) {
  router.push(path)
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.portal-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
}
.portal-header {
  text-align: center;
  margin-bottom: 40px;
}
.portal-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}
.portal-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}
.portal-cards {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 900px;
}
.portal-card {
  background: white;
  border-radius: 16px;
  padding: 32px 28px;
  width: 260px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s;
  position: relative;
}
.portal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
}
.portal-card--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.portal-card--disabled:hover {
  transform: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 12px;
}
.erp-icon {
  background: #e8f4fd;
  color: #409eff;
}
.agent-icon {
  background: #fef0f0;
  color: #f56c6c;
}
.more-icon {
  background: #f5f7fa;
  color: #909399;
}
.card-icon svg {
  width: 100%;
  height: 100%;
}
.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
}
.card-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
  line-height: 1.6;
}
.card-arrow {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #c0c4cc;
}
.portal-footer {
  margin-top: 48px;
}
.btn-logout {
  background: none;
  border: 1px solid #dcdfe6;
  color: #909399;
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-logout:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}
</style>
