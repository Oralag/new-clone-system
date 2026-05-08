<template>
  <div class="stock-page">
    <div class="page-header">
      <div class="page-title">📦 库存同步</div>
      <div class="page-desc">各平台库存统一管理、智能预警、自动补货建议</div>
    </div>

    <!-- 快捷统计 -->
    <div class="stat-row">
      <div class="stat-chip green">{{ stats.total }} <span>商品</span></div>
      <div class="stat-chip">{{ stats.normal }} <span>正常</span></div>
      <div class="stat-chip yellow">{{ stats.warning }} <span>预警</span></div>
      <div class="stat-chip red">{{ stats.critical }} <span>紧急补货</span></div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button size="small" @click="syncAll" :loading="syncing">同步全平台库存</el-button>
      <el-button size="small" type="primary" @click="$router.push('/ecommerce/agent')">🤖 AI智能分析</el-button>
      <div class="action-right">
        <el-input v-model="keyword" size="small" placeholder="搜索商品" style="width:160px" clearable />
      </div>
    </div>

    <!-- 库存列表 -->
    <div class="stock-list">
      <div v-if="loading" class="loading-state">加载中…</div>
      <div v-else-if="!stockList.length" class="empty-state">暂无库存数据</div>
      <div v-else>
        <div v-for="item in stockList" :key="item.goodsId" class="stock-card">
          <div class="stock-info">
            <div class="stock-name">{{ item.goodsName }}</div>
            <div class="stock-meta">
              <span>SKU：{{ item.sku || '-' }}</span>
              <span>·</span>
              <span>仓库：{{ item.warehouse || '默认仓库' }}</span>
            </div>
          </div>
          <div class="stock-level">
            <div class="stock-num" :class="getStockClass(item.stock, item.threshold)">{{ item.stock }}</div>
            <div class="stock-unit">{{ item.unit || '件' }}</div>
          </div>
          <div class="stock-threshold">
            <div class="threshold-label">预警线</div>
            <div class="threshold-val">{{ item.threshold }} {{ item.unit || '件' }}</div>
          </div>
          <div class="stock-status">
            <span class="status-tag" :class="getStockClass(item.stock, item.threshold)">
              {{ getStockStatus(item.stock, item.threshold) }}
            </span>
          </div>
          <div class="stock-platforms">
            <span v-for="p in item.platforms?.slice(0,3)" :key="p" class="plat-chip">{{ p }}</span>
            <span v-if="(item.platforms?.length || 0) > 3" class="plat-more">+{{ (item.platforms?.length || 0) - 3 }}</span>
          </div>
          <div class="stock-actions">
            <el-button size="small" @click="editThreshold(item)">设预警</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadStock" @current-change="loadStock"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const loading = ref(false)
const syncing = ref(false)
const stockList = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')

const stats = ref({ total: 0, normal: 0, warning: 0, critical: 0 })

onMounted(() => loadStock())

async function loadStock() {
  loading.value = true
  try {
    const r = await http.post('/erp/ecommerce/stock', {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
    }, { silent: true })
    stockList.value = r.data?.list || []
    total.value = r.data?.total || 0
    if (r.data?.stats) stats.value = r.data.stats
  } catch { stockList.value = [] }
  finally { loading.value = false }
}

async function syncAll() {
  syncing.value = true
  try {
    await http.post('/erp/ecommerce/stock/sync_all', {}, { silent: true })
    ElMessage({ message: '全平台库存同步完成', type: 'success' })
    loadStock()
  } catch (e: any) {
    ElMessage({ message: `同步失败：${e.message}`, type: 'error' })
  } finally { syncing.value = false }
}

function getStockClass(stock: number, threshold: number): string {
  if (stock === 0) return 'red'
  if (stock <= threshold * 0.5) return 'red'
  if (stock <= threshold) return 'yellow'
  return 'green'
}

function getStockStatus(stock: number, threshold: number): string {
  if (stock === 0) return '已售罄'
  if (stock <= threshold * 0.5) return '紧急补货'
  if (stock <= threshold) return '库存预警'
  return '库存充足'
}

function editThreshold(item: any) {
  ElMessage({ message: `设置 ${item.goodsName} 预警线功能开发中`, type: 'info' })
}
</script>

<style scoped>
.stock-page { padding: 16px; }
.page-header { margin-bottom: 14px; }
.page-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.page-desc { font-size: 13px; color: #999; }
.stat-row { display: flex; gap: 8px; margin-bottom: 14px; }
.stat-chip { background: #fff; border-radius: 10px; padding: 8px 14px; font-size: 16px; font-weight: 700; color: #333; }
.stat-chip span { font-size: 12px; font-weight: 400; color: #999; margin-left: 4px; }
.stat-chip.green { border-left: 3px solid #10b981; }
.stat-chip.yellow { border-left: 3px solid #f59e0b; }
.stat-chip.red { border-left: 3px solid #ef4444; }
.action-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
.action-right { flex: 1; display: flex; justify-content: flex-end; }
.stock-list { display: flex; flex-direction: column; gap: 8px; }
.stock-card { background: #fff; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.stock-info { flex: 1; min-width: 0; }
.stock-name { font-size: 14px; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stock-meta { font-size: 12px; color: #999; margin-top: 2px; display: flex; gap: 6px; }
.stock-level { display: flex; align-items: baseline; gap: 4px; min-width: 60px; }
.stock-num { font-size: 20px; font-weight: 800; }
.stock-num.green { color: #10b981; }
.stock-num.yellow { color: #f59e0b; }
.stock-num.red { color: #ef4444; }
.stock-unit { font-size: 11px; color: #999; }
.stock-threshold { min-width: 70px; text-align: center; }
.threshold-label { font-size: 10px; color: #999; }
.threshold-val { font-size: 12px; color: #666; }
.stock-status { min-width: 70px; }
.status-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.status-tag.green { background: #d1fae5; color: #059669; }
.status-tag.yellow { background: #fef3c7; color: #d97706; }
.status-tag.red { background: #fee2e2; color: #dc2626; }
.stock-platforms { display: flex; gap: 4px; min-width: 80px; flex-wrap: wrap; }
.plat-chip { font-size: 10px; background: #f3f4f6; color: #666; padding: 2px 6px; border-radius: 6px; }
.plat-more { font-size: 10px; color: #999; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #999; }
.pagination-wrap { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>
