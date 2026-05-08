<template>
  <div class="offline-page">
    <div class="page-header">
      <div class="page-title">🏪 线下运营</div>
      <div class="page-desc">线下客户、代理商、经销商管理，私域社群运营，线下活动策划</div>
    </div>

    <!-- 切换 tabs -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="客户管理" name="customers">
        <!-- 客户列表 -->
        <div class="toolbar">
          <el-button size="small" type="primary" @click="addCustomer">+ 新增客户</el-button>
          <div style="flex:1"></div>
          <el-input v-model="customerKeyword" size="small" placeholder="搜索客户/联系人" style="width:180px" clearable @change="loadCustomers" />
        </div>
        <div class="customer-list">
          <div v-if="loadingCustomers" class="loading-state">加载中…</div>
          <div v-else-if="!customers.length" class="empty-state">暂无客户数据</div>
          <div v-else>
            <div v-for="c in customers" :key="c.id" class="customer-card">
              <div class="customer-avatar">{{ c.name.charAt(0) }}</div>
              <div class="customer-info">
                <div class="customer-name-row">
                  <span class="customer-name">{{ c.name }}</span>
                  <span class="type-tag" :class="'type-' + c.type">{{ getCustomerTypeText(c.type) }}</span>
                </div>
                <div class="customer-meta">
                  <span>{{ c.contact || '-' }}</span>
                  <span>·</span>
                  <span>{{ c.phone || '-' }}</span>
                  <span>·</span>
                  <span>累计消费 ¥{{ c.totalAmount?.toLocaleString() || 0 }}</span>
                </div>
              </div>
              <div class="customer-actions">
                <el-button size="small" @click="viewCustomer(c)">详情</el-button>
                <el-button size="small" type="primary" plain @click="followUp(c)">跟进</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="私域社群" name="community">
        <div class="community-grid">
          <div v-for="g in groups" :key="g.id" class="group-card" :style="{ borderTopColor: g.color }">
            <div class="group-hd">
              <span class="group-icon">{{ g.emoji }}</span>
              <div class="group-info">
                <div class="group-name">{{ g.name }}</div>
                <div class="group-meta">{{ g.memberCount }}人 · {{ g.type }}</div>
              </div>
            </div>
            <div class="group-stats">
              <div class="g-stat"><span>{{ g.todayActive }}</span><small>今日活跃</small></div>
              <div class="g-stat"><span>{{ g.weekMsg }}</span><small>本周消息</small></div>
              <div class="g-stat"><span>¥{{ g.todaySales?.toLocaleString() }}</span><small>今日转化</small></div>
            </div>
            <div class="group-actions">
              <el-button size="small" @click="sendToGroup(g)">发消息</el-button>
              <el-button size="small" @click="groupDetail(g)">管理</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="线下活动" name="events">
        <div class="event-list">
          <div v-for="e in events" :key="e.id" class="event-card">
            <div class="event-status" :class="'status-' + e.status">{{ getEventStatusText(e.status) }}</div>
            <div class="event-body">
              <div class="event-title">{{ e.title }}</div>
              <div class="event-meta">
                <span>📅 {{ e.date }}</span>
                <span>📍 {{ e.location || '-' }}</span>
                <span>👥 {{ e.attendees || 0 }}人</span>
              </div>
            </div>
            <div class="event-actions">
              <el-button size="small" @click="eventDetail(e)">详情</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="AI运营" name="ai">
        <div class="ai-agent-list">
          <div v-for="agent in opsAgents" :key="agent.id" class="ai-agent-card" :style="{ borderLeftColor: agent.color }">
            <div class="agent-avatar">{{ agent.emoji }}</div>
            <div class="agent-info">
              <div class="agent-name">{{ agent.name }}</div>
              <div class="agent-specialty">{{ agent.specialty }}</div>
            </div>
            <el-button size="small" type="primary" @click="startAgent(agent)">启动</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const activeTab = ref('customers')
const loadingCustomers = ref(false)
const customers = ref<any[]>([])
const customerKeyword = ref('')

const groups = ref([
  { id: 'vip', name: 'VIP客户群', emoji: '👑', type: 'VIP客户', color: '#f59e0b', memberCount: 156, todayActive: 42, weekMsg: 328, todaySales: 12580 },
  { id: 'normal', name: '普通客户群', emoji: '💬', type: '普通客户', color: '#3b82f6', memberCount: 1234, todayActive: 89, weekMsg: 652, todaySales: 3890 },
  { id: 'potential', name: '潜在客户群', emoji: '🌱', type: '潜在客户', color: '#10b981', memberCount: 567, todayActive: 23, weekMsg: 145, todaySales: 0 },
])

const events = ref([
  { id: 1, title: '2026春季产品品鉴会', date: '2026-04-20', location: '上海市静安区xxx酒店', attendees: 45, status: 'completed' },
  { id: 2, title: '渠道代理商培训会', date: '2026-05-15', location: '线上直播', attendees: 32, status: 'ongoing' },
  { id: 3, title: '618大促线下启动会', date: '2026-06-01', location: '待定', attendees: 0, status: 'planned' },
])

const opsAgents = ref([
  { id: 'ops_offline', name: '线下&私域专员', emoji: '🏪', specialty: '线下活动·私域社群', color: '#8b5cf6' },
  { id: 'ops_data', name: '数据官', emoji: '📊', specialty: '数据监控·异常预警', color: '#0ea5e9' },
  { id: 'ops_pricing', name: '定价专员', emoji: '💰', specialty: '定价策略·利润优化', color: '#f59e0b' },
])

onMounted(() => {
  if (activeTab.value === 'customers') loadCustomers()
})

async function loadCustomers() {
  loadingCustomers.value = true
  try {
    const r = await http.post('/erp/ecommerce/customers', { keyword: customerKeyword.value }, { silent: true })
    customers.value = r.data?.list || []
  } catch { customers.value = [] }
  finally { loadingCustomers.value = false }
}

function getCustomerTypeText(t: string) {
  const map: Record<string, string> = { agent: '代理商', distributor: '经销商', retailer: '零售商', individual: '个人客户' }
  return map[t] || t
}

function getEventStatusText(s: string) {
  const map: Record<string, string> = { completed: '已完成', ongoing: '进行中', planned: '筹备中', cancelled: '已取消' }
  return map[s] || s
}

function addCustomer() { ElMessage({ message: '新增客户功能开发中', type: 'info' }) }
function viewCustomer(c: any) { ElMessage({ message: `查看客户 ${c.name} 详情`, type: 'info' }) }
function followUp(c: any) { ElMessage({ message: `跟进客户 ${c.name}，跳转至私域运营界面`, type: 'info' }) }
function sendToGroup(g: any) { ElMessage({ message: `向 ${g.name} 发送消息功能开发中`, type: 'info' }) }
function groupDetail(g: any) { ElMessage({ message: `管理 ${g.name}`, type: 'info' }) }
function eventDetail(e: any) { ElMessage({ message: `查看活动 ${e.title}`, type: 'info' }) }
function startAgent(agent: any) { ElMessage({ message: `启动 ${agent.name}，跳转至AI运营对话`, type: 'info' }) }
</script>

<style scoped>
.offline-page { padding: 16px; }
.page-header { margin-bottom: 14px; }
.page-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.page-desc { font-size: 13px; color: #999; }
.main-tabs { }
.toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
.customer-list { display: flex; flex-direction: column; gap: 8px; }
.customer-card { background: #fff; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.customer-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
.customer-info { flex: 1; min-width: 0; }
.customer-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.customer-name { font-size: 14px; font-weight: 600; color: #333; }
.type-tag { font-size: 10px; padding: 1px 6px; border-radius: 6px; }
.type-agent { background: #dbeafe; color: #2563eb; }
.type-distributor { background: #f3e8ff; color: #7c3aed; }
.type-retailer { background: #d1fae5; color: #059669; }
.type-individual { background: #f3f4f6; color: #666; }
.customer-meta { font-size: 12px; color: #999; display: flex; gap: 6px; flex-wrap: wrap; }
.customer-actions { display: flex; gap: 6px; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #999; }

.community-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.group-card { background: #fff; border-radius: 12px; padding: 14px; border-top: 3px solid; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.group-hd { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.group-icon { font-size: 28px; }
.group-name { font-size: 14px; font-weight: 600; color: #333; }
.group-meta { font-size: 12px; color: #999; }
.group-stats { display: flex; gap: 8px; margin-bottom: 10px; }
.g-stat { flex: 1; text-align: center; }
.g-stat span { display: block; font-size: 15px; font-weight: 700; color: #333; }
.g-stat small { font-size: 10px; color: #999; }
.group-actions { display: flex; gap: 6px; }

.event-list { display: flex; flex-direction: column; gap: 10px; }
.event-card { background: #fff; border-radius: 12px; padding: 14px; display: flex; gap: 12px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.event-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; min-width: 60px; text-align: center; }
.status-completed { background: #d1fae5; color: #059669; }
.status-ongoing { background: #fef3c7; color: #d97706; }
.status-planned { background: #dbeafe; color: #2563eb; }
.event-body { flex: 1; }
.event-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
.event-meta { display: flex; gap: 12px; font-size: 12px; color: #999; flex-wrap: wrap; }
.event-actions { display: flex; gap: 6px; }

.ai-agent-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.ai-agent-card { background: #fff; border-radius: 12px; padding: 14px; display: flex; gap: 12px; align-items: center; border-left: 3px solid; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.agent-avatar { font-size: 28px; }
.agent-info { flex: 1; }
.agent-name { font-size: 14px; font-weight: 600; color: #333; }
.agent-specialty { font-size: 12px; color: #999; margin-top: 2px; }
</style>
