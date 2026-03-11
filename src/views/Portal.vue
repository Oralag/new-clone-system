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
            <rect x="4" y="4" width="18" height="18" rx="3" fill="currentColor" opacity="0.9" />
            <rect x="26" y="4" width="18" height="18" rx="3" fill="currentColor" opacity="0.6" />
            <rect x="4" y="26" width="18" height="18" rx="3" fill="currentColor" opacity="0.6" />
            <rect x="26" y="26" width="18" height="18" rx="3" fill="currentColor" opacity="0.3" />
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
            <circle cx="24" cy="16" r="8" fill="currentColor" opacity="0.9" />
            <path d="M8 38c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6" />
            <circle cx="36" cy="30" r="5" fill="currentColor" opacity="0.8" />
            <path d="M33 30h6M36 27v6" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
        <div class="card-content">
          <h2 class="card-title">智能体工作流</h2>
          <p class="card-desc">AI 内容创作、热搜抓取、自动生成文案与视频</p>
        </div>
        <div class="card-arrow">→</div>
      </div>

      <div class="portal-card portal-card--coming">
        <div class="card-icon coming-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="3" opacity="0.4" />
            <path d="M24 16v8l5 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />
          </svg>
        </div>
        <div class="card-content">
          <h2 class="card-title" style="opacity:0.4">即将推出</h2>
          <p class="card-desc" style="opacity:0.3">更多功能模块敬请期待</p>
        </div>
        <div class="card-arrow" style="opacity:0.2">→</div>
      </div>
    </div>

    <div class="portal-footer">
      <span class="logout-btn" @click="logout">退出登录</span>
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
  background: linear-gradient(135deg, #0f1117, #1a1f2e, #0d1b3e);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.portal-header {
  text-align: center;
  margin-bottom: 60px;
}

.portal-title {
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 12px;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #fff, #a8c4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.portal-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  letter-spacing: 1px;
}

.portal-cards {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 960px;
  width: 100%;
}

.portal-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 36px 32px;
  width: 280px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.portal-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.portal-card:hover:not(.portal-card--coming) {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.portal-card:hover:not(.portal-card--coming)::before {
  opacity: 1;
}

.portal-card--coming {
  cursor: default;
  opacity: 0.5;
}

.card-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.card-icon svg {
  width: 40px;
  height: 40px;
}

.erp-icon {
  background: linear-gradient(135deg, #165dff, #0e42d2);
  color: #fff;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.4);
}

.agent-icon {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
}

.coming-icon {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 10px;
}

.card-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  margin: 0;
}

.card-arrow {
  margin-top: 24px;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.portal-card:hover:not(.portal-card--coming) .card-arrow {
  color: rgba(255, 255, 255, 0.95);
  transform: translateX(4px);
}

.portal-footer {
  margin-top: 60px;
}

.logout-btn {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: color 0.2s;
}

.logout-btn:hover {
  color: rgba(255, 255, 255, 0.7);
}
</style>
