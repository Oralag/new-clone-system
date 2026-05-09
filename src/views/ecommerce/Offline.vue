<template>
  <div class="ops-customer-page">
    <section class="hero">
      <div>
        <div class="hero-title">客户增长</div>
        <div class="hero-desc">线下客户、私域跟进、样品与活动动作，统一回到原有 ERP 客户链路和管家里处理。</div>
      </div>
      <div class="hero-actions">
        <button class="ghost-btn" @click="router.push('/sale/client')">客户管理</button>
        <button class="primary-btn" @click="sendCaptainPrompt('帮我梳理最近客户跟进重点，给我一个简短的客户运营建议')">让管家给建议</button>
      </div>
    </section>

    <section class="stat-grid">
      <article class="stat-card">
        <div class="stat-label">客户总数</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-sub">当前系统内客户主档数量</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">本页展示</div>
        <div class="stat-value">{{ customers.length }}</div>
        <div class="stat-sub">最近拉取的客户样本</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">可直接动作</div>
        <div class="stat-value">4</div>
        <div class="stat-sub">客户、样品、合同、管家跟进</div>
      </article>
    </section>

    <section class="grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">最近客户</div>
            <div class="panel-sub">展示真实客户数据，详细管理仍回客户模块。</div>
          </div>
          <button class="link-btn" @click="router.push('/sale/client')">进入客户管理</button>
        </div>

        <div class="toolbar">
          <input v-model.trim="keyword" class="keyword-input" placeholder="搜索客户名称" @keyup.enter="loadCustomers" />
          <button class="ghost-btn" @click="loadCustomers">查询</button>
        </div>

        <div v-if="loading" class="empty-state">加载中...</div>
        <div v-else-if="customers.length === 0" class="empty-state">没有匹配到客户。</div>
        <div v-else class="customer-list">
          <div v-for="customer in customers" :key="customer.id" class="customer-card">
            <div class="avatar">{{ (customer.customer_name || customer.nickname || customer.name || '?').slice(0, 1) }}</div>
            <div class="customer-main">
              <div class="customer-name">{{ customer.customer_name || customer.nickname || customer.name || '未命名客户' }}</div>
              <div class="customer-meta">
                {{ customer.mobile || customer.phone || '无手机号' }}
                <span>·</span>
                余额 {{ Number(customer.balance || 0).toFixed(2) }}
              </div>
            </div>
            <div class="customer-actions">
              <button class="ghost-btn small" @click="router.push('/sale/client')">详情</button>
              <button class="primary-btn small" @click="sendCaptainPrompt(`围绕客户${customer.customer_name || customer.nickname || customer.name}，给我一个下一步跟进建议`)">
                跟进建议
              </button>
            </div>
          </div>
        </div>
      </article>

      <article class="panel actions-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">客户运营动作</div>
            <div class="panel-sub">这里不再做假的 CRM 页面，而是回到真实模块和管家。</div>
          </div>
        </div>

        <div class="action-list">
          <button class="action-card" @click="router.push('/sale/sample')">
            <div class="action-title">样品跟进</div>
            <div class="action-desc">内部送样、客户寄样都在样品单模块继续做。</div>
          </button>
          <button class="action-card" @click="router.push('/sale/contract')">
            <div class="action-title">销售转化</div>
            <div class="action-desc">跟进成熟客户后，直接进入合同模块，不另造订单壳。</div>
          </button>
          <button class="action-card" @click="sendCaptainPrompt('站在线下私域运营的角度，给我一版客户跟进话术和活动建议')">
            <div class="action-title">私域建议</div>
            <div class="action-desc">让管家给你客户跟进、社群和活动建议。</div>
          </button>
          <button class="action-card" @click="sendCaptainPrompt('帮我整理一个本周客户跟进清单，按优先级列出来')">
            <div class="action-title">跟进清单</div>
            <div class="action-desc">用管家把客户动作排好顺序。</div>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const customers = ref<any[]>([])
const stats = reactive({ total: 0 })

function sendCaptainPrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: prompt }))
}

async function loadCustomers() {
  loading.value = true
  try {
    const response = await http.get('/shop/ShopCustomer/index', {
      params: {
        list_rows: 12,
        keyword: keyword.value || undefined,
      },
    })
    customers.value = response.data?.rows ?? response.rows ?? []
    stats.total = Number(response.data?.total ?? response.total ?? customers.value.length)
  } catch {
    customers.value = []
    stats.total = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCustomers()
})
</script>

<style scoped>
.ops-customer-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero,
.panel,
.stat-card {
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

.stat-grid,
.grid {
  display: grid;
  gap: 14px;
}

.stat-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid {
  grid-template-columns: 1.2fr 0.9fr;
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

.keyword-input {
  width: 220px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
}

.customer-list,
.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.customer-card,
.action-card {
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 18px;
  padding: 14px;
  background: #f8fafc;
}

.customer-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
}

.customer-main {
  flex: 1;
}

.customer-name,
.action-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.customer-meta,
.action-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.customer-actions {
  display: flex;
  gap: 8px;
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

.ghost-btn {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
  color: #334155;
}

.primary-btn.small,
.ghost-btn.small {
  padding: 9px 12px;
  font-size: 12px;
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
