<template>
  <div class="m-my">
    <!-- 顶部用户卡片 -->
    <div class="m-my-hero">
      <div class="m-my-avatar">{{ (authStore.userName || '我').charAt(0) }}</div>
      <div class="m-my-name">{{ authStore.userName || '用户' }}</div>
      <div class="m-my-meta">
        <span>{{ authStore.userInfo?.dept || authStore.userInfo?.position || '成员' }}</span>
        <span v-if="authStore.userInfo?.shop_id"> · 企业ID {{ authStore.userInfo.shop_id }}</span>
      </div>
    </div>

    <!-- 数据卡片 -->
    <div class="m-my-stats">
      <div class="m-my-stat" @click="router.push('/sale/client')">
        <div class="m-my-stat-val">{{ stats.customerCount }}</div>
        <div class="m-my-stat-label">客户</div>
      </div>
      <div class="m-my-stat-divider" />
      <div class="m-my-stat" @click="router.push('/finance/receivable')">
        <div class="m-my-stat-val">¥{{ stats.receivable }}</div>
        <div class="m-my-stat-label">应收款</div>
      </div>
      <div class="m-my-stat-divider" />
      <div class="m-my-stat" :class="{ warn: Number(stats.stockWarn) > 0 }" @click="router.push('/warehouse/warning')">
        <div class="m-my-stat-val">{{ stats.stockWarn }}</div>
        <div class="m-my-stat-label">库存预警</div>
      </div>
    </div>

    <!-- 新功能快捷入口 -->
    <div class="m-my-section">
      <div class="m-my-section-title">协作工具</div>
      <div class="m-my-feature-grid">
        <div class="m-my-feature-item" @click="router.push('/mobile/activity')">
          <div class="m-my-feature-icon" style="background:rgba(0,113,227,0.1)">📰</div>
          <div class="m-my-feature-name">工作动态</div>
          <div class="m-my-feature-desc">查看团队操作记录</div>
        </div>
        <div class="m-my-feature-item" @click="router.push('/mobile/ai-bot')">
          <div class="m-my-feature-icon" style="background:rgba(124,58,237,0.1)">🦢</div>
          <div class="m-my-feature-name">AI 管家</div>
          <div class="m-my-feature-desc">动嘴就能录单</div>
        </div>
        <div class="m-my-feature-item" @click="router.push('/mobile/meeting')">
          <div class="m-my-feature-icon" style="background:rgba(5,150,105,0.1)">🎙️</div>
          <div class="m-my-feature-name">会议室</div>
          <div class="m-my-feature-desc">随时发起或加入</div>
        </div>
        <div class="m-my-feature-item" @click="router.push('/mobile/contacts')">
          <div class="m-my-feature-icon" style="background:rgba(249,115,22,0.1)">👥</div>
          <div class="m-my-feature-name">通讯录</div>
          <div class="m-my-feature-desc">快速找到同事</div>
        </div>
      </div>
    </div>

    <!-- PC端跳转入口 -->
    <div class="m-my-section">
      <div class="m-my-section-title">业务管理</div>
      <div class="m-my-menu-list">
        <div class="m-my-menu-item" @click="router.push('/dashboard')">
          <div class="m-my-menu-icon" style="background:rgba(0,113,227,0.1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <span class="m-my-menu-label">首页工作台</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="m-my-menu-item" @click="router.push('/portal')">
          <div class="m-my-menu-icon" style="background:rgba(124,58,237,0.1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <span class="m-my-menu-label">切换工作台</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="m-my-menu-item" @click="router.push('/mobile/stats')">
          <div class="m-my-menu-icon" style="background:rgba(5,150,105,0.1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <span class="m-my-menu-label">数据报表</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>

    <!-- 系统工具 -->
    <div class="m-my-section">
      <div class="m-my-section-title">系统</div>
      <div class="m-my-menu-list">
        <div class="m-my-menu-item" @click="router.push('/setting')">
          <div class="m-my-menu-icon" style="background:rgba(8,145,178,0.1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <span class="m-my-menu-label">系统设置</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="m-my-menu-item" @click="handleTheme">
          <div class="m-my-menu-icon" style="background:rgba(0,113,227,0.08)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </div>
          <span class="m-my-menu-label">切换主题</span>
          <div class="m-my-theme-btns">
            <span class="m-my-theme-btn" :class="{ active: appStore.theme === 'light' }" @click.stop="appStore.setTheme('light')">☀️</span>
            <span class="m-my-theme-btn" :class="{ active: appStore.theme === 'dark' }" @click.stop="appStore.setTheme('dark')">🌙</span>
            <span class="m-my-theme-btn" :class="{ active: appStore.theme === 'eye' }" @click.stop="appStore.setTheme('eye')">📖</span>
          </div>
        </div>
        <div class="m-my-menu-item" @click="copyLink">
          <div class="m-my-menu-icon" style="background:rgba(217,119,6,0.1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <span class="m-my-menu-label">复制链接</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="m-my-menu-item" @click="checkUpdate">
          <div class="m-my-menu-icon" style="background:rgba(5,150,105,0.1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
          </div>
          <span class="m-my-menu-label">检查更新</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="m-my-footer">
      <div class="m-my-version">数字游牧 ERP v3.0</div>
      <div class="m-my-copyright">© {{ new Date().getFullYear() }} 游牧观文化传媒出品</div>
    </div>

    <!-- 退出登录 -->
    <div class="m-my-logout-wrap">
      <button class="m-my-logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <!-- 数据概览 -->
    <div class="m-my-cards">
      <div class="m-my-card" @click="router.push('/mobile/sale/out')">
        <div class="m-my-card-num">{{ (myStats.todaySale / 10000).toFixed(1) }}w</div>
        <div class="m-my-card-label">本月销售额</div>
      </div>
      <div class="m-my-card" @click="router.push('/mobile/sale/out')">
        <div class="m-my-card-num">{{ myStats.todayOrders }}</div>
        <div class="m-my-card-label">本月订单</div>
      </div>
      <div class="m-my-card" @click="router.push('/mobile/procure/order')">
        <div class="m-my-card-num">{{ myStats.pendingCount }}</div>
        <div class="m-my-card-label">待审核</div>
      </div>
      <div class="m-my-card" @click="router.push('/mobile/finance/overview')">
        <div class="m-my-card-num">{{ (myStats.receivable / 10000).toFixed(1) }}w</div>
        <div class="m-my-card-label">应收款</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import http from '@/api/http'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const stats = ref({ customerCount: 0, receivable: '0', stockWarn: 0 })

function handleTheme() { /* 由内联按钮处理 */ }

function copyLink() {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制')
  }).catch(() => {
    ElMessage.info(url)
  })
}

function checkUpdate() {
  ElMessage.info('当前已是最新版本')
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '退出', { type: 'warning' })
    await http.post('/login/logout')
  } catch { /* 忽略API错误 */ }
  authStore._clearAllState()
  router.push('/login')
}

onMounted(async () => {
  const [custRes, recRes] = await Promise.allSettled([
    http.get('/shop/ShopCustomer/index', { params: { list_rows: 1 } }),
    http.get('/finance/Receivable/index', { params: { list_rows: 100 } }),
  ])

  if (custRes.status === 'fulfilled') {
    stats.value.customerCount = custRes.value?.data?.total ?? 0
  }

  if (recRes.status === 'fulfilled') {
    const rows = recRes.value?.data?.rows ?? recRes.value?.rows ?? []
    const uncollected = rows
      .filter((r: any) => Number(r.status) !== 1 && Number(r.un_collect || r.amount || 0) > 0)
      .reduce((s: number, r: any) => s + Number(r.un_collect || r.amount || 0), 0)
    stats.value.receivable = uncollected >= 10000
      ? (uncollected / 10000).toFixed(1) + 'w'
      : uncollected.toFixed(0)
  }
})
</script>

<style scoped>
.m-my-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #eee;
  margin: 0 16px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.m-my-card {
  background: #fff;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background .15s;
}
.m-my-card:active { background: #f5f5f5; }
.m-my-card-num {
  font-size: 20px;
  font-weight: 700;
  color: #2E6BE6;
  line-height: 1.2;
  margin-bottom: 4px;
}
.m-my-card:nth-child(3) .m-my-card-num { color: #FF6B35; }
.m-my-card-label {
  font-size: 11px;
  color: #999;
}
.m-my {
  min-height: 100%;
  background: #f5f5f7;
  padding-bottom: 40px;
}

/* ── 用户卡片 ── */
.m-my-hero {
  background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%);
  padding: 28px 16px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.m-my-avatar {
  width: 68px; height: 68px;
  background: rgba(255,255,255,0.2);
  border: 3px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}
.m-my-name { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; }
.m-my-meta { font-size: 13px; color: rgba(255,255,255,0.7); }

/* ── 数据卡片 ── */
.m-my-stats {
  display: flex;
  align-items: center;
  background: #fff;
  margin: -16px 12px 0;
  border-radius: 14px;
  padding: 16px 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
}
.m-my-stat { flex: 1; text-align: center; cursor: pointer; }
.m-my-stat:active { opacity: 0.7; }
.m-my-stat-val { font-size: 20px; font-weight: 800; color: #1d2129; letter-spacing: -0.02em; }
.m-my-stat.warn .m-my-stat-val { color: #f53f3f; }
.m-my-stat-label { font-size: 11px; color: #86909c; margin-top: 3px; font-weight: 600; }
.m-my-stat-divider { width: 1px; height: 28px; background: #f2f3f5; }

/* ── 通用区块 ── */
.m-my-section { padding: 16px 12px 0; }
.m-my-section-title { font-size: 13px; font-weight: 700; color: #86909c; margin-bottom: 8px; padding-left: 2px; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── 功能网格 ── */
.m-my-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.m-my-feature-item {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-my-feature-item:active { background: #f5f5f7; }
.m-my-feature-icon { font-size: 22px; margin-bottom: 6px; }
.m-my-feature-name { font-size: 14px; font-weight: 700; color: #1d2129; margin-bottom: 2px; }
.m-my-feature-desc { font-size: 11px; color: #86909c; }

/* ── 菜单列表 ── */
.m-my-menu-list {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.m-my-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid #f7f8fa;
}
.m-my-menu-item:last-child { border-bottom: none; }
.m-my-menu-item:active { background: #f5f5f7; }
.m-my-menu-icon {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-my-menu-label { flex: 1; font-size: 14px; font-weight: 600; color: #1d2129; }
.m-my-theme-btns { display: flex; gap: 4px; }
.m-my-theme-btn {
  width: 26px; height: 26px;
  background: #f5f5f7;
  border: 2px solid transparent;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.m-my-theme-btn.active { border-color: #0071e3; background: #e8f0fe; }

/* ── 底部 ── */
.m-my-footer { text-align: center; padding: 20px 0 12px; }
.m-my-version { font-size: 12px; font-weight: 600; color: #c2c8d5; margin-bottom: 3px; }
.m-my-copyright { font-size: 11px; color: #d1d5db; }
.m-my-logout-wrap { padding: 0 12px; }
.m-my-logout-btn {
  width: 100%;
  height: 48px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #f53f3f;
  cursor: pointer;
}
.m-my-logout-btn:active { background: #fff5f5; }
</style>
