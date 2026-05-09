<template>
  <div class="ops-platforms-page">
    <section class="hero">
      <div>
        <span class="hero-kicker">平台接入管理</span>
        <div class="hero-title">平台管理</div>
        <div class="hero-desc">管理已接入的电商平台状态、API配置和同步策略。</div>
      </div>
    </section>

    <section class="platform-list">
      <div v-for="p in platforms" :key="p.id" class="platform-card">
        <div class="platform-icon" :style="{ background: p.color }">{{ p.emoji }}</div>
        <div class="platform-info">
          <div class="platform-row">
            <span class="platform-name">{{ p.name }}</span>
            <span class="badge" :class="p.connected ? 'badge-ok' : 'badge-idle'">
              {{ p.connected ? '已接入' : '未接入' }}
            </span>
          </div>
          <div class="platform-meta">
            <span>店铺：{{ p.shopName || '未配置' }}</span>
            <span>·</span>
            <span>同步：{{ p.syncCycle }}</span>
            <span>·</span>
            <span>最后同步：{{ p.lastSync || '从未' }}</span>
          </div>
        </div>
        <div class="platform-actions">
          <button class="btn" :class="p.connected ? 'btn-ghost' : 'btn-primary'" @click="togglePlatform(p)">
            {{ p.connected ? '断开' : '接入' }}
          </button>
          <button class="btn btn-ghost" @click="showConfig(p)">配置</button>
          <button class="btn btn-ghost" @click="syncNow(p)" :disabled="!p.connected || syncingId === p.id">
            {{ syncingId === p.id ? '同步中…' : '同步' }}
          </button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">全局同步策略</div>
          <div class="panel-sub">设置自动同步的频率和内容范围。</div>
        </div>
      </div>
      <div class="config-grid">
        <div class="config-row">
          <span class="config-label">自动同步</span>
          <el-switch v-model="config.autoSync" @change="saveConfig" />
        </div>
        <div class="config-row">
          <span class="config-label">同步频率</span>
          <el-select v-model="config.syncInterval" size="small" style="width:160px" @change="saveConfig">
            <el-option label="每15分钟" value="15min" />
            <el-option label="每30分钟" value="30min" />
            <el-option label="每小时" value="1hour" />
            <el-option label="每6小时" value="6hour" />
          </el-select>
        </div>
        <div class="config-row">
          <span class="config-label">同步内容</span>
          <div class="config-checkboxes">
            <el-checkbox v-model="config.syncOrders" @change="saveConfig">订单</el-checkbox>
            <el-checkbox v-model="config.syncStock" @change="saveConfig">库存</el-checkbox>
            <el-checkbox v-model="config.syncGoods" @change="saveConfig">商品</el-checkbox>
            <el-checkbox v-model="config.syncCustomer" @change="saveConfig">客户</el-checkbox>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

interface Platform {
  id: string
  name: string
  emoji: string
  color: string
  connected: boolean
  shopName?: string
  syncCycle: string
  lastSync?: string
}

const platforms = ref<Platform[]>([])
const syncingId = ref('')
const config = ref({
  autoSync: true,
  syncInterval: '30min',
  syncOrders: true,
  syncStock: true,
  syncGoods: false,
  syncCustomer: false,
})

onMounted(async () => {
  try {
    const r = await http.post('/erp/ecommerce/platforms', {}, { silent: true })
    if (r.data?.platforms) {
      platforms.value = r.data.platforms
    }
    if (r.data?.config) {
      config.value = { ...config.value, ...r.data.config }
    }
  } catch { /* silent */ }
})

function togglePlatform(p: Platform) {
  if (p.connected) {
    p.connected = false
    http.post('/erp/ecommerce/platforms/toggle', { platform: p.id, connected: false }, { silent: true }).catch(() => {})
    ElMessage({ message: `${p.name} 已断开`, type: 'info' })
  } else {
    showConfig(p)
  }
}

function showConfig(p: Platform) {
  if (!p.connected) {
    ElMessage({ message: `${p.name} 接入配置功能开发中，请联系管理员配置API密钥`, type: 'info' })
  }
}

async function syncNow(p: Platform) {
  syncingId.value = p.id
  try {
    await http.post('/erp/ecommerce/sync', { platform: p.id }, { silent: true })
    p.lastSync = new Date().toLocaleTimeString()
    ElMessage({ message: `${p.name} 同步成功`, type: 'success' })
  } catch (e: any) {
    ElMessage({ message: `${p.name} 同步失败：${e.message}`, type: 'error' })
  } finally {
    syncingId.value = ''
  }
}

async function saveConfig() {
  try {
    await http.post('/erp/ecommerce/platforms/config', {
      autoSync: config.value.autoSync,
      syncInterval: config.value.syncInterval,
      syncOrders: config.value.syncOrders,
      syncStock: config.value.syncStock,
      syncGoods: config.value.syncGoods,
      syncCustomer: config.value.syncCustomer,
    }, { silent: true })
  } catch { /* silent */ }
}
</script>

<style scoped>
.ops-platforms-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero,
.panel {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.18), transparent 30%),
    linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
}

.hero-kicker {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(13, 148, 136, 0.1);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.hero-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.platform-card {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.platform-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.platform-info {
  flex: 1;
}

.platform-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.platform-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.badge-ok {
  background: rgba(13, 148, 136, 0.12);
  color: #0f766e;
}
.badge-idle {
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
}

.platform-meta {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  flex-wrap: wrap;
}

.platform-actions {
  display: flex;
  gap: 8px;
}

.btn {
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
  color: #334155;
  transition: all 0.15s;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
}
.btn-ghost:hover {
  background: #f1f5f9;
}

.panel {
  padding: 20px;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.panel-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.config-row:last-child {
  border-bottom: none;
}

.config-label {
  font-size: 13px;
  color: #475569;
  min-width: 80px;
}

.config-checkboxes {
  display: flex;
  gap: 16px;
}
</style>
