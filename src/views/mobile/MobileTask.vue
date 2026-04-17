<template>
  <div class="task-page">
    <!-- 筛选栏 -->
    <div class="task-filter-bar">
      <div
        v-for="f in filters"
        :key="f.key"
        class="task-filter-item"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        {{ f.label }}
        <span v-if="f.count > 0" class="task-filter-count">{{ f.count }}</span>
      </div>
    </div>

    <!-- 今日待跟进提示条 -->
    <div v-if="pendingTodayCount > 0 && activeFilter === 'todo'" class="followup-bar" @click="activeFilter = 'today'">
      <span class="followup-icon">📌</span>
      <span>今日待跟进 <strong>{{ pendingTodayCount }} 条</strong></span>
      <span class="followup-arrow">›</span>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <div v-if="loading && filteredPlans.length === 0" class="task-loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
      </div>
      <div v-else-if="filteredPlans.length === 0" class="task-empty">
        <div class="task-empty-icon">{{ activeFilter === 'done' ? '🎉' : '📋' }}</div>
        <div class="task-empty-text">
          {{ activeFilter === 'done' ? '暂无已完成任务' : activeFilter === 'today' ? '今日无待跟进任务' : '暂无任务' }}
        </div>
      </div>

      <div
        v-for="plan in filteredPlans"
        :key="plan.id"
        class="task-item"
        @click="openPlan(plan)"
      >
        <!-- 完成状态 -->
        <div class="task-check" @click.stop="toggleDone(plan)">
          <svg v-if="plan.status === 'done'" width="20" height="20" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="#00b42a"/>
            <polyline points="7 12 10 15 17 9" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" stroke="#d0d0d0" stroke-width="1.8"/>
          </svg>
        </div>

        <!-- 任务主体 -->
        <div class="task-body">
          <div class="task-title" :class="{ done: plan.status === 'done' }">{{ plan.title }}</div>

          <!-- 被@的人 -->
          <div v-if="plan.mentions?.length" class="task-mentions">
            <span v-for="m in plan.mentions" :key="m.id" class="mention-tag">
              <span>{{ m.avatar }}</span> {{ m.name }}
            </span>
          </div>

          <!-- 元信息 -->
          <div class="task-meta">
            <span v-if="plan.due_date" class="task-due" :class="{ overdue: isOverdue(plan) }">
              📅 {{ plan.due_date }}
            </span>
            <span v-if="plan.status === 'todo'" class="task-status status-todo">待开始</span>
            <span v-if="plan.status === 'doing'" class="task-status status-doing">进行中</span>
            <span v-if="plan.status === 'done'" class="task-status status-done">已完成</span>
            <!-- 跟进状态 -->
            <span v-if="plan.follow_up?.remind_count > 0" class="task-followup">
              🔔 已跟进{{ plan.follow_up.remind_count }}次
            </span>
          </div>
        </div>

        <!-- 紧急标记 -->
        <div v-if="plan.priority === 'high'" class="task-priority-high">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f53f3f"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
      </div>
    </div>

    <!-- 新建任务按钮 -->
    <button class="task-fab" @click="openAdd">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <!-- ── 新建任务弹窗 ── -->
    <div v-if="showAdd" class="task-modal-mask" @click.self="showAdd = false">
      <div class="task-modal-sheet">
        <div class="task-modal-header">
          <span>新建工作计划</span>
          <button class="task-modal-close" @click="showAdd = false">取消</button>
        </div>
        <div class="task-modal-body">
          <!-- 任务标题 -->
          <input
            v-model="form.title"
            class="task-input"
            placeholder="任务名称...（必填）"
            autofocus
          />

          <!-- 任务描述 -->
          <textarea
            v-model="form.description"
            class="task-input task-textarea"
            placeholder="补充说明（选填）..."
            rows="3"
          ></textarea>

          <!-- 截止日期 -->
          <div class="task-form-row">
            <label>截止日期</label>
            <input v-model="form.due_date" class="task-input-sm" type="date" />
          </div>

          <!-- 优先级 -->
          <div class="task-form-row">
            <label>优先级</label>
            <div class="task-priority-btns">
              <button
                v-for="p in priorities"
                :key="p.key"
                :class="['task-priority-btn', { active: form.priority === p.key }]"
                :style="form.priority === p.key ? { background: p.color, color: '#fff', borderColor: p.color } : {}"
                @click="form.priority = p.key"
              >{{ p.label }}</button>
            </div>
          </div>

          <!-- @执行人 -->
          <div class="task-form-row task-form-row-top">
            <label>@执行人</label>
            <button class="at-btn" @click="showAtPicker = !showAtPicker">
              <span v-if="form.mentions.length === 0" class="at-placeholder">点击选择执行人</span>
              <div v-else class="at-selected-list">
                <span v-for="m in form.mentions" :key="m.id" class="at-chip">
                  <span>{{ m.avatar }}</span> {{ m.name }}
                  <span class="at-chip-del" @click.stop="removeMention(m)">×</span>
                </span>
              </div>
            </button>
          </div>

          <!-- @选择器 -->
          <div v-if="showAtPicker" class="at-picker">
            <div class="at-picker-title">选择执行人</div>
            <div class="at-section-label">🤖 智能体</div>
            <div class="at-member-list">
              <div
                v-for="a in agents"
                :key="a.id"
                :class="['at-member-item', { selected: isMentioned(a) }]"
                @click="toggleMention(a)"
              >
                <span class="at-avatar">{{ a.avatar }}</span>
                <span class="at-name">{{ a.name }}</span>
                <svg v-if="isMentioned(a)" width="16" height="16" viewBox="0 0 24 24" fill="#2E6BE6"><polyline points="20 6 9 17 4 12" stroke="#2E6BE6" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
              </div>
            </div>
            <div class="at-section-label">👥 员工</div>
            <div class="at-member-list">
              <div v-if="staffLoading" class="at-loading">加载中...</div>
              <div v-else-if="staffMembers.length === 0" class="at-empty">暂无员工</div>
              <div
                v-for="s in staffMembers"
                :key="s.id"
                :class="['at-member-item', { selected: isMentioned(s) }]"
                @click="toggleMention(s)"
              >
                <span class="at-avatar">{{ s.avatar }}</span>
                <div class="at-name-wrap">
                  <span class="at-name">{{ s.name }}</span>
                  <span v-if="s.dept" class="at-dept">{{ s.dept }}</span>
                </div>
                <svg v-if="isMentioned(s)" width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#2E6BE6" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
              </div>
            </div>
            <button class="at-confirm-btn" @click="showAtPicker = false">确定</button>
          </div>
        </div>

        <div class="task-modal-footer">
          <button
            class="task-btn-primary"
            :disabled="!form.title.trim() || submitting"
            @click="createPlan"
          >
            {{ submitting ? '创建中...' : '创建任务' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── 任务详情弹窗 ── -->
    <div v-if="selectedPlan" class="task-modal-mask" @click.self="selectedPlan = null">
      <div class="task-modal-sheet">
        <div class="task-modal-header">
          <span>任务详情</span>
          <button class="task-modal-close" @click="selectedPlan = null">关闭</button>
        </div>
        <div class="task-modal-body">
          <div class="detail-title">{{ selectedPlan.title }}</div>
          <div v-if="selectedPlan.description" class="detail-desc">{{ selectedPlan.description }}</div>

          <div class="detail-row">
            <span class="detail-label">状态</span>
            <div class="task-status-btns">
              <button v-for="s in statusOptions" :key="s.key"
                :class="['status-btn', { active: selectedPlan.status === s.key }]"
                @click="updateStatus(selectedPlan, s.key)">
                {{ s.label }}
              </button>
            </div>
          </div>

          <div v-if="selectedPlan.mentions?.length" class="detail-row">
            <span class="detail-label">@执行人</span>
            <div class="detail-mentions">
              <span v-for="m in selectedPlan.mentions" :key="m.id" class="mention-tag">
                {{ m.avatar }} {{ m.name }}
              </span>
            </div>
          </div>

          <div v-if="selectedPlan.due_date" class="detail-row">
            <span class="detail-label">截止日期</span>
            <span>{{ selectedPlan.due_date }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">跟进记录</span>
            <div class="followup-info">
              <span v-if="selectedPlan.follow_up?.remind_count > 0">
                已跟进 {{ selectedPlan.follow_up.remind_count }} 次
                <span v-if="selectedPlan.follow_up.last_remind">
                  · 最后 {{ formatTime(selectedPlan.follow_up.last_remind) }}
                </span>
              </span>
              <span v-else class="followup-none">暂无跟进记录</span>
            </div>
          </div>

          <!-- 手动提醒按钮 -->
          <button
            v-if="selectedPlan.status !== 'done'"
            class="remind-btn"
            :disabled="reminding"
            @click="sendRemind(selectedPlan)"
          >
            {{ reminding ? '提醒中...' : '🔔 发送提醒（秘书跟进）' }}
          </button>
        </div>
        <div class="task-modal-footer">
          <button class="task-btn-danger" @click="deletePlan(selectedPlan)">删除任务</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import http from '@/api/http'
import { getAdminList } from '@/api/setting'

const route = useRoute()

// ── 状态 ──
const plans = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const activeFilter = ref('todo')
const showAdd = ref(false)
const selectedPlan = ref<any>(null)
const reminding = ref(false)

// ── 表单 ──
const form = ref({
  title: '',
  description: '',
  due_date: '',
  priority: 'normal',
  mentions: [] as any[],
})
const showAtPicker = ref(false)

// ── @选择器数据 ──
const agents = ref<any[]>([
  { id: 'agent_content', name: '内容部', type: 'agent', avatar: '📝' },
  { id: 'agent_creative', name: '创意部', type: 'agent', avatar: '🎨' },
  { id: 'agent_brand', name: '品牌部', type: 'agent', avatar: '✨' },
  { id: 'agent_secretary', name: '秘书', type: 'agent', avatar: '🤖' },
  { id: 'agent_ai', name: 'AI助手', type: 'agent', avatar: '🧠' },
])
const staffMembers = ref<any[]>([])
const staffLoading = ref(false)

const priorities = [
  { key: 'high', label: '紧急', color: '#f53f3f' },
  { key: 'normal', label: '普通', color: '#2E6BE6' },
  { key: 'low', label: '低优先', color: '#86909c' },
]

const statusOptions = [
  { key: 'todo', label: '待开始' },
  { key: 'doing', label: '进行中' },
  { key: 'done', label: '已完成' },
]

// ── 计算属性 ──
const today = new Date().toISOString().slice(0, 10)

const pendingTodayCount = computed(() =>
  plans.value.filter(p =>
    p.status !== 'done' &&
    (!p.follow_up?.last_remind || !p.follow_up.last_remind.startsWith(today))
  ).length
)

const todoCount = computed(() => plans.value.filter(p => p.status !== 'done').length)
const doneCount = computed(() => plans.value.filter(p => p.status === 'done').length)

const filters = computed(() => [
  { key: 'todo', label: '全部待办', count: todoCount.value },
  { key: 'today', label: '今日跟进', count: pendingTodayCount.value },
  { key: 'done', label: '已完成', count: doneCount.value },
])

const filteredPlans = computed(() => {
  if (activeFilter.value === 'done') return plans.value.filter(p => p.status === 'done')
  if (activeFilter.value === 'today') {
    const t = new Date().toISOString().slice(0, 10)
    return plans.value.filter(p =>
      p.status !== 'done' &&
      (p.due_date === t || !p.follow_up?.last_remind || !p.follow_up.last_remind.startsWith(t))
    )
  }
  return plans.value.filter(p => p.status !== 'done')
})

// ── 方法 ──
function isOverdue(plan: any) {
  if (!plan.due_date || plan.status === 'done') return false
  return new Date(plan.due_date) < new Date(new Date().toDateString())
}

function isMentioned(member: any) {
  return form.value.mentions.some((m: any) => m.id === member.id)
}

function toggleMention(member: any) {
  const idx = form.value.mentions.findIndex((m: any) => m.id === member.id)
  if (idx >= 0) {
    form.value.mentions.splice(idx, 1)
  } else {
    form.value.mentions.push({ ...member })
  }
}

function removeMention(member: any) {
  form.value.mentions = form.value.mentions.filter((m: any) => m.id !== member.id)
}

function openAdd() {
  form.value = { title: '', description: '', due_date: '', priority: 'normal', mentions: [] }
  showAdd.value = true
  showAtPicker.value = false
  loadStaffMembers()
}

function openPlan(plan: any) {
  selectedPlan.value = { ...plan }
}

async function toggleDone(plan: any) {
  const newStatus = plan.status === 'done' ? 'todo' : 'done'
  await http.put(`/work/plans/${plan.id}`, { status: newStatus })
  plan.status = newStatus
}

async function updateStatus(plan: any, status: string) {
  await http.put(`/work/plans/${plan.id}`, { status })
  plan.status = status
  if (selectedPlan.value?.id === plan.id) selectedPlan.value.status = status
}

async function sendRemind(plan: any) {
  reminding.value = true
  try {
    await http.post(`/work/plans/${plan.id}/remind`)
    plan.follow_up = { ...plan.follow_up, remind_count: (plan.follow_up?.remind_count || 0) + 1, last_remind: new Date().toISOString() }
    if (selectedPlan.value?.id === plan.id) selectedPlan.value.follow_up = { ...plan.follow_up }
    alert('✅ 提醒已发送！')
  } catch (e) {
    alert('提醒发送失败')
  } finally {
    reminding.value = false
  }
}

async function deletePlan(plan: any) {
  if (!confirm(`确定删除「${plan.title}」？`)) return
  await http.delete(`/work/plans/${plan.id}`)
  plans.value = plans.value.filter(p => p.id !== plan.id)
  selectedPlan.value = null
}

async function createPlan() {
  if (!form.value.title.trim()) return
  submitting.value = true
  try {
    const res = await http.post('/work/plans', {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      due_date: form.value.due_date,
      priority: form.value.priority,
      mentions: form.value.mentions,
    })
    plans.value.unshift(res.data.plan)
    showAdd.value = false
    activeFilter.value = 'todo'
  } catch (e) {
    alert('创建失败')
  } finally {
    submitting.value = false
  }
}

async function loadStaffMembers() {
  if (staffMembers.value.length > 0) return
  staffLoading.value = true
  try {
    const res = await getAdminList({ list_rows: 500 })
    const rows = res?.data?.rows ?? res?.data ?? []
    staffMembers.value = rows.map((r: any) => ({
      id: String(r.id),
      name: r.name || r.admin_name || '未知',
      type: 'staff',
      avatar: '👤',
      dept: r.dept_name || '',
    }))
  } catch {
    staffMembers.value = []
  } finally {
    staffLoading.value = false
  }
}

async function loadPlans() {
  loading.value = true
  try {
    const res = await http.get('/work/plans')
    plans.value = res.data.plans || []
  } catch {
    plans.value = []
  } finally {
    loading.value = false
  }
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── 初始化 ──
onMounted(async () => {
  await loadPlans()
  if (route.query.new === '1') openAdd()
})

onUnmounted(() => {})
</script>

<script lang="ts">
export default { name: 'MobileTask' }
</script>

<style scoped>
.task-page {
  min-height: 100%;
  background: #f5f5f5;
  padding-bottom: 80px;
}
.task-filter-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 16px;
  overflow-x: auto;
}
.task-filter-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px 10px;
  font-size: 14px;
  color: #86909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.task-filter-item.active { color: #2E6BE6; border-bottom-color: #2E6BE6; font-weight: 600; }
.task-filter-count {
  min-width: 16px; height: 16px; background: #f53f3f; border-radius: 8px;
  font-size: 10px; font-weight: 700; color: #fff; display: flex;
  align-items: center; justify-content: center; padding: 0 4px;
}

.followup-bar {
  display: flex; align-items: center; gap: 6px;
  background: #fff7e6; border-bottom: 1px solid #ffe58f;
  padding: 10px 16px; font-size: 13px; color: #d46b00; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.followup-icon { font-size: 15px; }
.followup-bar strong { font-weight: 600; }
.followup-arrow { margin-left: auto; font-size: 18px; }

.task-loading { text-align: center; padding: 40px; }
.loading-dots { display: flex; justify-content: center; gap: 6px; }
.loading-dots span {
  width: 8px; height: 8px; background: #2E6BE6; border-radius: 50%;
  animation: bounce 1.4s infinite both;
}
.loading-dots span:nth-child(2) { animation-delay: 0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0.32s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

.task-list { padding: 10px 0; }
.task-empty { text-align: center; padding: 60px 0 40px; }
.task-empty-icon { font-size: 40px; margin-bottom: 10px; }
.task-empty-text { font-size: 14px; color: #86909c; }

.task-item {
  display: flex; align-items: flex-start; gap: 12px;
  background: #fff; padding: 14px 16px; border-bottom: 1px solid #f5f5f5;
  cursor: pointer; transition: background 0.1s;
  -webkit-tap-highlight-color: transparent;
}
.task-item:active { background: #fafafa; }
.task-check { flex-shrink: 0; margin-top: 1px; cursor: pointer; padding: 2px; }
.task-body { flex: 1; min-width: 0; }
.task-title { font-size: 15px; color: #1d2129; line-height: 1.4; margin-bottom: 5px; }
.task-title.done { text-decoration: line-through; color: #86909c; }
.task-mentions { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 5px; }
.mention-tag {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 12px; color: #2E6BE6; background: #e8f0ff;
  padding: 2px 7px; border-radius: 999px;
}
.task-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.task-due { font-size: 12px; color: #4e5969; }
.task-due.overdue { color: #f53f3f; }
.task-status { font-size: 12px; padding: 2px 8px; border-radius: 999px; font-weight: 500; }
.status-todo { color: #86909c; background: #f2f3f5; }
.status-doing { color: #2E6BE6; background: #e8f0ff; }
.status-done { color: #00b42a; background: #e8fff0; }
.task-followup { font-size: 12px; color: #86909c; }
.task-priority-high { flex-shrink: 0; margin-top: 2px; }

/* ── FAB ── */
.task-fab {
  position: fixed; right: 20px; bottom: calc(70px + env(safe-area-inset-bottom, 0px));
  width: 52px; height: 52px; background: #2E6BE6; border-radius: 50%;
  border: none; cursor: pointer; display: flex; align-items: center;
  justify-content: center; box-shadow: 0 4px 16px rgba(46,107,230,0.4);
  z-index: 100; -webkit-tap-highlight-color: transparent;
}
.task-fab:active { transform: scale(0.95); }

/* ── 弹窗 ── */
.task-modal-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center;
}
.task-modal-sheet {
  background: #fff; border-radius: 16px 16px 0 0;
  width: 100%;
  /* iOS Safari 兼容：用 dvh + min */
  height: auto;
  max-height: min(92vh, 100dvh);
  min-height: 60vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.2s ease;
  /* iOS 安全区适配 */
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.task-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 12px; border-bottom: 1px solid #f2f3f5; flex-shrink: 0;
  font-size: 16px; font-weight: 600; color: #1d2129;
}
.task-modal-close {
  font-size: 14px; color: #2E6BE6; background: none; border: none;
  cursor: pointer; padding: 4px 8px;
}
.task-modal-body {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
  /* iOS 滚动弹性 */
  -webkit-overflow-scrolling: touch;
}
.task-modal-footer {
  padding: 12px 16px; border-top: 1px solid #f2f3f5; flex-shrink: 0;
  /* 固定在底部 */
  position: sticky; bottom: 0; background: #fff;
}
.task-input {
  width: 100%; height: 48px; background: #f5f5f7; border: 1px solid transparent;
  border-radius: 10px; padding: 0 14px; font-size: 15px; color: #1d2129;
  outline: none; box-sizing: border-box; transition: border-color 0.15s;
}
.task-input:focus { border-color: #2E6BE6; background: #fff; }
.task-textarea { height: auto; padding: 12px 14px; resize: none; line-height: 1.5; }
.task-input-sm { height: 36px; background: #f5f5f7; border: 1px solid transparent; border-radius: 8px; padding: 0 10px; font-size: 14px; color: #1d2129; outline: none; }
.task-input-sm:focus { border-color: #2E6BE6; background: #fff; }
.task-form-row { display: flex; align-items: center; gap: 12px; }
.task-form-row-top { align-items: flex-start; }
.task-form-row label { font-size: 13px; font-weight: 600; color: #4e5969; width: 52px; flex-shrink: 0; padding-top: 6px; }
.task-priority-btns, .task-status-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.task-priority-btn, .status-btn {
  padding: 5px 12px; border: 1px solid #e5e6eb; border-radius: 999px;
  font-size: 13px; color: #4e5969; background: #fff; cursor: pointer; transition: all 0.15s;
}
.status-btn.active { background: #2E6BE6; color: #fff; border-color: #2E6BE6; }
.task-btn-primary {
  width: 100%; height: 48px; background: #2E6BE6; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600; color: #fff; cursor: pointer;
}
.task-btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }
.task-btn-danger {
  width: 100%; height: 44px; background: #fff; border: 1px solid #f53f3f;
  border-radius: 10px; font-size: 15px; font-weight: 500; color: #f53f3f; cursor: pointer;
}

/* ── @选择器 ── */
.at-btn {
  flex: 1; min-height: 44px; background: #f5f5f7; border: 1px solid transparent;
  border-radius: 10px; padding: 8px 12px; cursor: pointer; text-align: left;
  transition: border-color 0.15s;
}
.at-btn:focus { border-color: #2E6BE6; background: #fff; }
.at-placeholder { font-size: 14px; color: #86909c; }
.at-selected-list { display: flex; flex-wrap: wrap; gap: 4px; }
.at-chip {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 13px; color: #2E6BE6; background: #e8f0ff;
  padding: 2px 6px 2px 6px; border-radius: 999px;
}
.at-chip-del { font-size: 16px; line-height: 1; cursor: pointer; margin-left: 2px; }
.at-picker {
  background: #fff; border: 1px solid #e5e6eb; border-radius: 12px;
  padding: 12px; max-height: 280px; overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.at-picker-title { font-size: 13px; color: #86909c; margin-bottom: 8px; font-weight: 600; }
.at-section-label { font-size: 12px; color: #86909c; margin: 8px 0 4px; font-weight: 600; }
.at-member-list { display: flex; flex-direction: column; gap: 2px; }
.at-member-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s;
}
.at-member-item:hover { background: #f5f7ff; }
.at-member-item.selected { background: #e8f0ff; }
.at-avatar { font-size: 20px; flex-shrink: 0; }
.at-name-wrap { display: flex; flex-direction: column; gap: 1px; }
.at-name { font-size: 14px; color: #1d2129; }
.at-dept { font-size: 11px; color: #86909c; }
.at-loading, .at-empty { font-size: 13px; color: #86909c; padding: 8px; text-align: center; }
.at-confirm-btn {
  width: 100%; height: 38px; background: #2E6BE6; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; margin-top: 8px;
}

/* ── 详情页 ── */
.detail-title { font-size: 17px; font-weight: 600; color: #1d2129; line-height: 1.4; margin-bottom: 8px; }
.detail-desc { font-size: 14px; color: #4e5969; line-height: 1.5; background: #f5f5f7; padding: 10px; border-radius: 8px; margin-bottom: 4px; }
.detail-row { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
.detail-label { font-size: 13px; font-weight: 600; color: #4e5969; width: 60px; flex-shrink: 0; padding-top: 2px; }
.detail-mentions { display: flex; flex-wrap: wrap; gap: 4px; }
.followup-info { font-size: 13px; color: #4e5969; }
.followup-none { color: #86909c; }
.remind-btn {
  width: 100%; height: 44px; background: #fff; border: 1px solid #2E6BE6;
  border-radius: 10px; font-size: 15px; font-weight: 600; color: #2E6BE6; cursor: pointer; margin-top: 4px;
}
.remind-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
