<template>
  <div class="profile-page">

    <!-- 顶部用户卡片 -->
    <div class="profile-hero">
      <div class="profile-avatar">{{ (authStore.userName || '用').charAt(0) }}</div>
      <div class="profile-user-name">{{ authStore.userName || '用户' }}</div>
      <div class="profile-user-meta">企业ID：{{ authStore.userInfo?.shop_id || '——' }}</div>
    </div>

    <div class="profile-body">

      <!-- 数据概览 -->
      <div class="profile-stats-row">
        <div class="profile-stat" @click="router.push('/sale/client')">
          <div class="pstat-val">{{ statData.customerCount }}</div>
          <div class="pstat-label">客户数</div>
        </div>
        <div class="profile-stat-divider" />
        <div class="profile-stat" @click="router.push('/finance/receivable')">
          <div class="pstat-val">¥{{ statData.receivable }}</div>
          <div class="pstat-label">待收款</div>
        </div>
        <div class="profile-stat-divider" />
        <div class="profile-stat" @click="router.push('/warehouse/warning')">
          <div class="pstat-val" :style="{ color: Number(statData.stockWarn) > 0 ? '#f53f3f' : '' }">{{ statData.stockWarn }}</div>
          <div class="pstat-label">库存预警</div>
        </div>
      </div>

      <!-- 功能入口 -->
      <div class="profile-menu-card">
        <div class="pmenu-group-title">工作台</div>
        <div class="pmenu-item" @click="router.push(withLegacy('/dashboard'))">
          <div class="pmenu-icon" style="background:rgba(0,113,227,0.1)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span class="pmenu-label">首页工作台</span>
          <svg class="pmenu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
        <div class="pmenu-item" @click="router.push(withLegacy('/mobile/apps'))">
          <div class="pmenu-icon" style="background:rgba(124,58,237,0.1)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <span class="pmenu-label">切换工作台</span>
          <svg class="pmenu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
        <div class="pmenu-item pmenu-item--last" @click="router.push(withLegacy('/dashboard/today-sales'))">
          <div class="pmenu-icon" style="background:rgba(5,150,105,0.1)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <span class="pmenu-label">数据报表</span>
          <svg class="pmenu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <div class="profile-menu-card">
        <div class="pmenu-group-title">系统</div>
        <div class="pmenu-item" @click="copyUrl">
          <div class="pmenu-icon" style="background:rgba(8,145,178,0.1)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <span class="pmenu-label">电脑端网址</span>
          <span class="pmenu-right-text">复制</span>
          <svg class="pmenu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
        <div class="pmenu-item pmenu-item--last" @click="router.push('/setting/company')">
          <div class="pmenu-icon" style="background:rgba(71,85,105,0.1)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <span class="pmenu-label">系统设置</span>
          <svg class="pmenu-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <div class="profile-support-text">技术支持：数字游牧 ERP · v2.0</div>

      <!-- 退出按钮 -->
      <button class="profile-logout-btn" @click="handleLogout">安全退出</button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const statData = ref({ customerCount: '--', receivable: '--', stockWarn: '--' })

onMounted(async () => {
  try {
    const [custRes, recRes] = await Promise.allSettled([
      http.get('/shop/ShopCustomer/index', { params: { list_rows: 1 } }),
      http.get('/finance/Receivable/index', { params: { list_rows: 500 } }),
    ])
    if (custRes.status === 'fulfilled') {
      statData.value.customerCount = String(custRes.value?.data?.total ?? custRes.value?.total ?? '--')
    }
    if (recRes.status === 'fulfilled') {
      const rows = recRes.value?.data?.rows ?? []
      // 已审核(status===1)且有未收款金额的才是真正的应收账款
      const pending = rows
        .filter((r: any) => Number(r.status) === 1 && Number(r.un_collect || 0) > 0)
        .reduce((s: number, r: any) => s + Number(r.un_collect || 0), 0)
      const fmt = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : n.toFixed(0)
      statData.value.receivable = fmt(pending)
    }
  } catch {}
})

function withLegacy(path: string) {
  if (String(route.query?.legacy || '') === '1') {
    return `${path}${path.includes('?') ? '&' : '?'}legacy=1&from=legacy_profile`
  }
  return path
}

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
  } catch {}
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f7;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
}

/* ── 顶部英雄区 ── */
.profile-hero {
  background: linear-gradient(160deg, #0071e3, #0055aa);
  padding: 36px 20px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.profile-avatar {
  width: 72px; height: 72px;
  border-radius: 22px;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 800; color: #fff;
}
.profile-user-name {
  font-size: 20px; font-weight: 800; color: #fff;
  letter-spacing: -0.02em;
}
.profile-user-meta { font-size: 13px; color: rgba(255,255,255,0.6); }

/* ── 数据概览行 ── */
.profile-stats-row {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  margin: -18px 16px 0;
  padding: 16px 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  position: relative;
  z-index: 1;
}
.profile-stat {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.profile-stat:active { opacity: 0.7; }
.profile-stat-divider { width: 1px; height: 32px; background: #f0f0f0; flex-shrink: 0; }
.pstat-val { font-size: 18px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; }
.pstat-label { font-size: 11px; color: #86909c; font-weight: 500; }

/* ── 主体 ── */
.profile-body {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 菜单卡片 ── */
.profile-menu-card {
  background: #fff;
  border-radius: 16px;
  padding: 12px 16px 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}
.pmenu-group-title {
  font-size: 11px; font-weight: 700; color: #86909c;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 10px;
}
.pmenu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f7;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.pmenu-item--last { border-bottom: none; padding-bottom: 14px; }
.pmenu-item:active { opacity: 0.7; }
.pmenu-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pmenu-label { flex: 1; font-size: 15px; color: #1d2129; font-weight: 500; }
.pmenu-right-text { font-size: 12px; color: #0071e3; font-weight: 600; margin-right: 2px; }
.pmenu-arrow { flex-shrink: 0; }

/* ── 底部 ── */
.profile-support-text {
  text-align: center;
  font-size: 12px;
  color: #c2c8d5;
  padding: 4px 0;
}
.profile-logout-btn {
  width: 100%;
  height: 52px;
  background: #fff;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.3px;
  -webkit-tap-highlight-color: transparent;
}
.profile-logout-btn:active { background: #fef2f2; }
</style>
