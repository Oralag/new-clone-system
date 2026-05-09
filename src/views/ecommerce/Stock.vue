<template>
  <div class="ops-stock-page">
    <section class="hero">
      <div>
        <div class="hero-title">库存与补货</div>
        <div class="hero-desc">只看真实库存预警和补货动作，不再做一层假的平台库存同步壳。</div>
      </div>
      <div class="hero-actions">
        <button class="ghost-btn" @click="router.push('/warehouse/stock')">库存总览</button>
        <button class="primary-btn" @click="sendCaptainPrompt('根据当前库存预警，给我一版补货优先级和采购建议')">让管家补货分析</button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-label">库存预警商品</div>
        <div class="stat-value">{{ stats.warning }}</div>
        <div class="stat-sub">当前低于安全线的商品数</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">紧急补货</div>
        <div class="stat-value danger">{{ stats.critical }}</div>
        <div class="stat-sub">当前库存小于等于 0 的商品</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">涉及仓库</div>
        <div class="stat-value">{{ stats.warehouseCount }}</div>
        <div class="stat-sub">预警分布的仓库数量</div>
      </article>
    </section>

    <section class="grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">预警清单</div>
            <div class="panel-sub">先处理最缺货的商品，再让管家生成草稿。</div>
          </div>
          <button class="link-btn" @click="router.push('/warehouse/warning')">查看完整库存预警</button>
        </div>

        <div class="toolbar">
          <input v-model.trim="keyword" class="keyword-input" placeholder="搜索商品名称" />
          <button class="ghost-btn" @click="loadWarnings">刷新</button>
        </div>

        <div v-if="loading" class="empty-state">加载中...</div>
        <div v-else-if="warnings.length === 0" class="empty-state">没有匹配到库存预警商品。</div>
        <div v-else class="warning-list">
          <div v-for="item in warnings" :key="`${item.goods_name}-${item.warehouse_name}`" class="warning-card">
            <div class="warning-main">
              <div class="warning-title">{{ item.goods_name }}</div>
              <div class="warning-meta">{{ item.goods_sn || '未编码' }} · {{ item.warehouse_name || '未分仓' }}</div>
            </div>
            <div class="warning-values">
              <span class="chip chip-current">当前 {{ item.stock_num }}</span>
              <span class="chip">最低 {{ item.min_num }}</span>
              <span class="chip">建议到 {{ item.max_num || Number(item.min_num || 0) * 2 }}</span>
            </div>
            <button class="primary-btn small" @click="sendCaptainPrompt(`针对商品${item.goods_name}和仓库${item.warehouse_name || '默认仓库'}做补货分析，如果需要请准备采购草稿`)">
              补货判断
            </button>
          </div>
        </div>
      </article>

      <article class="panel action-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">下一步动作</div>
            <div class="panel-sub">回到原有 ERP 模块处理，不在这里造第二套库存系统。</div>
          </div>
        </div>

        <div class="action-list">
          <button class="action-card" @click="router.push('/procure/order')">
            <div class="action-title">进入采购订单</div>
            <div class="action-desc">已经确认补货需求后，回到采购模块继续处理。</div>
          </button>
          <button class="action-card" @click="router.push('/warehouse/warning')">
            <div class="action-title">进入库存预警页</div>
            <div class="action-desc">查看完整清单、仓库分布和安全线情况。</div>
          </button>
          <button class="action-card" @click="sendCaptainPrompt('把当前库存预警整理成一份补货优先级清单，简明一点')">
            <div class="action-title">让管家排优先级</div>
            <div class="action-desc">适合你先看今天要先补什么。</div>
          </button>
          <button class="action-card" @click="sendCaptainPrompt('根据当前库存预警，帮我生成一份采购单草稿所需的商品建议')">
            <div class="action-title">让管家准备草稿</div>
            <div class="action-desc">给出商品、数量和建议动作，但仍回采购单审核链路。</div>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const warnings = ref<any[]>([])

const stats = computed(() => {
  const warning = warnings.value.length
  const critical = warnings.value.filter((item: any) => Number(item.stock_num || 0) <= 0).length
  const warehouseCount = new Set(warnings.value.map((item: any) => item.warehouse_name).filter(Boolean)).size
  return { warning, critical, warehouseCount }
})

function sendCaptainPrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: prompt }))
}

async function loadWarnings() {
  loading.value = true
  try {
    const response = await http.get('/erp/ecommerce/stockWarnings', {
      params: {
        list_rows: 50,
        goods_name: keyword.value || undefined,
      },
    })
    warnings.value = response.data?.rows ?? response.rows ?? []
  } catch {
    warnings.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWarnings()
})
</script>

<style scoped>
.ops-stock-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero,
.stat-card,
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

.hero-actions,
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-grid,
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.grid {
  grid-template-columns: 1.25fr 0.9fr;
}

.stat-card {
  padding: 18px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-value {
  margin-top: 14px;
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
}

.stat-value.danger {
  color: #dc2626;
}

.stat-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.panel {
  padding: 20px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
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

.warning-list,
.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-card,
.action-card {
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 18px;
  padding: 14px;
  background: #f8fafc;
}

.warning-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.warning-main {
  flex: 1;
}

.warning-title,
.action-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.warning-meta,
.action-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.warning-values {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(148, 163, 184, 0.12);
  color: #334155;
}

.chip-current {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.keyword-input {
  width: 220px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
}

.primary-btn,
.ghost-btn,
.link-btn {
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
}

.primary-btn.small {
  padding: 9px 12px;
  font-size: 12px;
}

.ghost-btn {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
  color: #334155;
}

.link-btn {
  border: none;
  background: transparent;
  color: #0f766e;
}

.empty-state {
  padding: 36px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.action-card {
  text-align: left;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  cursor: pointer;
}
</style>
