<template>
  <div class="platforms-page">
    <div class="page-header">
      <div class="page-title">🔗 平台管理</div>
      <div class="page-desc">管理6大电商平台的接入状态、API配置和同步策略</div>
    </div>

    <!-- 平台列表 -->
    <div class="platform-list">
      <div v-for="p in platforms" :key="p.id" class="platform-item">
        <div class="platform-logo" :style="{ background: p.color }">{{ p.emoji }}</div>
        <div class="platform-body">
          <div class="platform-name-row">
            <span class="platform-name">{{ p.name }}</span>
            <span class="badge" :class="p.connected ? 'badge-green' : 'badge-gray'">
              {{ p.connected ? '已接入' : '未接入' }}
            </span>
          </div>
          <div class="platform-meta">
            <span>店铺：{{ p.shopName || '未配置' }}</span>
            <span>·</span>
            <span>同步周期：{{ p.syncCycle }}</span>
            <span>·</span>
            <span>最后同步：{{ p.lastSync || '从未' }}</span>
          </div>
        </div>
        <div class="platform-actions">
          <button class="btn btn-sm" :class="p.connected ? 'btn-outline' : 'btn-primary'" @click="togglePlatform(p)">
            {{ p.connected ? '断开' : '接入' }}
          </button>
          <button class="btn btn-sm btn-outline" @click="showConfig(p)">配置</button>
          <button class="btn btn-sm btn-outline" @click="syncNow(p)" :disabled="!p.connected || syncingId === p.id">
            {{ syncingId === p.id ? '同步中…' : '同步' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 同步设置 -->
    <div class="section-title">⚙️ 全局同步策略</div>
    <div class="config-card">
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

const platforms = ref<Platform[]>([
  { id: 'taobao', name: '淘宝', emoji: '🛒', color: '#ff5000', connected: false, shopName: '', syncCycle: '每30分钟', lastSync: '' },
  { id: 'jd', name: '京东', emoji: '📦', color: '#e2231a', connected: false, shopName: '', syncCycle: '每30分钟', lastSync: '' },
  { id: 'pdd', name: '拼多多', emoji: '💚', color: '#e2231a', connected: false, shopName: '', syncCycle: '每30分钟', lastSync: '' },
  { id: 'douyin', name: '抖音', emoji: '🎵', color: '#000000', connected: false, shopName: '', syncCycle: '每30分钟', lastSync: '' },
  { id: 'kuaishou', name: '快手', emoji: '📱', color: '#ff0000', connected: false, shopName: '', syncCycle: '每30分钟', lastSync: '' },
  { id: 'wxd', name: '微信小店', emoji: '💬', color: '#07c160', connected: false, shopName: '', syncCycle: '每30分钟', lastSync: '' },
])

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
    ElMessage({ message: `${p.name} 已断开`, type: 'info' })
  } else {
    showConfig(p)
  }
}

function showConfig(p: Platform) {
  ElMessage({ message: `${p.name} 配置功能开发中，请联系管理员配置API密钥`, type: 'info' })
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

function saveConfig() {
  // TODO: save to server
}
</script>

<style scoped>
.platforms-page { padding: 16px; }
.page-header { margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.page-desc { font-size: 13px; color: #999; }
.section-title { font-size: 14px; font-weight: 600; color: #333; margin: 20px 0 10px; }
.platform-list { display: flex; flex-direction: column; gap: 10px; }
.platform-item { background: #fff; border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.platform-logo { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.platform-body { flex: 1; }
.platform-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.platform-name { font-size: 14px; font-weight: 600; color: #333; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.badge-green { background: #d1fae5; color: #059669; }
.badge-gray { background: #f3f4f6; color: #9ca3af; }
.platform-meta { display: flex; gap: 6px; font-size: 12px; color: #999; flex-wrap: wrap; }
.platform-actions { display: flex; gap: 6px; }
.btn { padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; border: 1px solid; transition: all 0.2s; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-primary { background: #0ea5e9; color: #fff; border-color: #0ea5e9; }
.btn-primary:hover { background: #0284c7; }
.btn-outline { background: transparent; color: #555; border-color: #e5e7eb; }
.btn-outline:hover { background: #f9fafb; }
.config-card { background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.config-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.config-row:last-child { border-bottom: none; }
.config-label { font-size: 13px; color: #555; min-width: 80px; }
.config-checkboxes { display: flex; gap: 16px; }
</style>
