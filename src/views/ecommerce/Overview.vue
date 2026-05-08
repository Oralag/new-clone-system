<template>
  <div class="ecommerce-overview">
    <!-- 顶部 KPI 卡片 -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#0ea5e9">📊</div>
        <div class="kpi-info">
          <div class="kpi-value">{{ kpi.todayOrders }}</div>
          <div class="kpi-label">今日订单</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#10b981">💰</div>
        <div class="kpi-info">
          <div class="kpi-value">¥{{ kpi.todaySales.toLocaleString() }}</div>
          <div class="kpi-label">今日销售额</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#f59e0b">📦</div>
        <div class="kpi-info">
          <div class="kpi-value">{{ kpi.lowStockCount }}</div>
          <div class="kpi-label">低库存预警</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#ec4899">👥</div>
        <div class="kpi-info">
          <div class="kpi-value">{{ kpi.pendingOrders }}</div>
          <div class="kpi-label">待处理订单</div>
        </div>
      </div>
    </div>

    <!-- 平台销售概况 -->
    <div class="section-title">📈 各平台销售概况</div>
    <div class="platform-grid">
      <div v-for="p in platforms" :key="p.name" class="platform-card" :style="{ borderLeftColor: p.color }">
        <div class="platform-hd">
          <span class="platform-name">{{ p.name }}</span>
          <span class="platform-status" :class="p.connected ? 'green' : 'red'">
            {{ p.connected ? '已连接' : '未连接' }}
          </span>
        </div>
        <div class="platform-stats">
          <div class="stat-item">
            <div class="stat-val">{{ p.orders }}</div>
            <div class="stat-lbl">今日订单</div>
          </div>
          <div class="stat-item">
            <div class="stat-val">¥{{ p.sales.toLocaleString() }}</div>
            <div class="stat-lbl">今日销售</div>
          </div>
          <div class="stat-item">
            <div class="stat-val">{{ p.gmv.toLocaleString() }}</div>
            <div class="stat-lbl">本月GMV</div>
          </div>
        </div>
        <div class="platform-trend">
          <span :class="p.trendUp ? 'up' : 'down'">
            {{ p.trendUp ? '↑' : '↓' }} {{ p.trend }}%
          </span>
          <span class="trend-lbl"> vs 昨日</span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section-title">⚡ 快捷入口</div>
    <div class="quick-grid">
      <div class="quick-item" @click="$router.push('/ecommerce/platforms')">
        <div class="quick-icon">🔗</div>
        <div class="quick-text">平台管理</div>
      </div>
      <div class="quick-item" @click="$router.push('/ecommerce/orders')">
        <div class="quick-icon">📋</div>
        <div class="quick-text">订单中心</div>
      </div>
      <div class="quick-item" @click="$router.push('/ecommerce/stock')">
        <div class="quick-icon">📦</div>
        <div class="quick-text">库存同步</div>
      </div>
      <div class="quick-item" @click="$router.push('/ecommerce/offline')">
        <div class="quick-icon">🏪</div>
        <div class="quick-text">线下运营</div>
      </div>
      <div class="quick-item" @click="$router.push('/ecommerce/agent')">
        <div class="quick-icon">🤖</div>
        <div class="quick-text">智能运营</div>
      </div>
    </div>

    <!-- AI 运营助手入口 -->
    <div class="agent-banner" @click="$router.push('/ecommerce/agent')">
      <div class="agent-banner-icon">🤖</div>
      <div class="agent-banner-info">
        <div class="agent-banner-title">AI 智能运营团队</div>
        <div class="agent-banner-desc">5位专员随时待命，数据监控·智能补货·促销策划</div>
      </div>
      <div class="agent-banner-arrow">→</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import http from '@/api/http'

const kpi = ref({
  todayOrders: 0,
  todaySales: 0,
  lowStockCount: 0,
  pendingOrders: 0,
})

const platforms = ref([
  { name: '淘宝', color: '#ff5000', connected: true, orders: 0, sales: 0, gmv: 0, trend: '0', trendUp: true },
  { name: '京东', color: '#e2231a', connected: true, orders: 0, sales: 0, gmv: 0, trend: '0', trendUp: true },
  { name: '拼多多', color: '#e2231a', connected: true, orders: 0, sales: 0, gmv: 0, trend: '0', trendUp: false },
  { name: '抖音', color: '#000000', connected: true, orders: 0, sales: 0, gmv: 0, trend: '0', trendUp: true },
  { name: '快手', color: '#ff0000', connected: false, orders: 0, sales: 0, gmv: 0, trend: '0', trendUp: false },
  { name: '微信小店', color: '#07c160', connected: true, orders: 0, sales: 0, gmv: 0, trend: '0', trendUp: true },
])

onMounted(async () => {
  try {
    const r = await http.post('/erp/ecommerce/overview', {}, { silent: true })
    if (r.data) {
      kpi.value = { ...kpi.value, ...r.data.kpi }
      if (r.data.platforms) {
        platforms.value = r.data.platforms
      }
    }
  } catch { /* silent */ }
})
</script>

<style scoped>
.ecommerce-overview { padding: 16px; }
.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi-card { background: #fff; border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.kpi-info { flex: 1; }
.kpi-value { font-size: 22px; font-weight: 700; color: #1a1a1a; line-height: 1.2; }
.kpi-label { font-size: 12px; color: #999; margin-top: 2px; }

.section-title { font-size: 15px; font-weight: 600; color: #1a1a1a; margin: 16px 0 10px; }

.platform-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.platform-card { background: #fff; border-radius: 12px; padding: 12px; border-left: 3px solid; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.platform-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.platform-name { font-size: 13px; font-weight: 600; color: #333; }
.platform-status { font-size: 11px; padding: 1px 6px; border-radius: 10px; }
.platform-status.green { background: #d1fae5; color: #059669; }
.platform-status.red { background: #fee2e2; color: #dc2626; }
.platform-stats { display: flex; gap: 8px; }
.stat-item { flex: 1; }
.stat-val { font-size: 13px; font-weight: 700; color: #333; }
.stat-lbl { font-size: 10px; color: #999; }
.platform-trend { margin-top: 6px; font-size: 12px; }
.trend-lbl { color: #999; }
.up { color: #059669; font-weight: 600; }
.down { color: #dc2626; font-weight: 600; }

.quick-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px; }
.quick-item { background: #f8f9fa; border-radius: 12px; padding: 14px 8px; text-align: center; cursor: pointer; transition: all 0.2s; }
.quick-item:hover { background: #e8f4ff; transform: translateY(-1px); }
.quick-icon { font-size: 22px; margin-bottom: 6px; }
.quick-text { font-size: 11px; color: #555; font-weight: 500; }

.agent-banner { background: linear-gradient(135deg, #0891b2, #0e7490); border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 14px; color: #fff; cursor: pointer; }
.agent-banner-icon { font-size: 32px; }
.agent-banner-info { flex: 1; }
.agent-banner-title { font-size: 15px; font-weight: 700; }
.agent-banner-desc { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.agent-banner-arrow { font-size: 20px; opacity: 0.6; }
</style>
