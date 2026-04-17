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

    <!-- 任务列表 -->
    <div class="task-list">
      <div v-if="filteredTasks.length === 0" class="task-empty">
        <div class="task-empty-icon">✅</div>
        <div class="task-empty-text">暂无{{ activeFilter === 'done' ? '已完成' : '待办' }}任务</div>
      </div>

      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-item"
        @click="openTask(task)"
      >
        <div class="task-check" @click.stop="toggleDone(task)">
          <svg v-if="task.done" width="18" height="18" viewBox="0 0 24 24" fill="#2E6BE6">
            <circle cx="12" cy="12" r="11" fill="#2E6BE6"/>
            <polyline points="7 12 10 15 17 9" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" stroke="#d0d0d0" stroke-width="1.8"/>
          </svg>
        </div>
        <div class="task-body">
          <div class="task-title" :class="{ done: task.done }">{{ task.title }}</div>
          <div class="task-meta">
            <span v-if="task.due" class="task-due" :class="{ overdue: isOverdue(task) }">
              📅 {{ task.due }}
            </span>
            <span v-if="task.tag" class="task-tag" :style="{ background: task.tagColor + '18', color: task.tagColor }">
              {{ task.tag }}
            </span>
          </div>
        </div>
        <div class="task-priority" :class="task.priority" v-if="task.priority === 'high'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f53f3f"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
      </div>
    </div>

    <!-- 新建任务按钮 -->
    <button class="task-fab" @click="showAdd = true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <!-- 新建任务弹窗 -->
    <div v-if="showAdd" class="task-modal-mask" @click.self="showAdd = false">
      <div class="task-modal-sheet">
        <div class="task-modal-header">
          <span>新建任务</span>
          <button class="task-modal-close" @click="showAdd = false">取消</button>
        </div>
        <div class="task-modal-body">
          <input
            v-model="newTask.title"
            class="task-input"
            placeholder="任务名称..."
            autofocus
            @keyup.enter="addTask"
          />
          <div class="task-form-row">
            <label>截止日期</label>
            <input v-model="newTask.due" class="task-input-sm" type="date" />
          </div>
          <div class="task-form-row">
            <label>优先级</label>
            <div class="task-priority-btns">
              <button
                v-for="p in priorities"
                :key="p.key"
                :class="['task-priority-btn', { active: newTask.priority === p.key }]"
                :style="newTask.priority === p.key ? { background: p.color, color: '#fff', borderColor: p.color } : {}"
                @click="newTask.priority = p.key"
              >{{ p.label }}</button>
            </div>
          </div>
          <div class="task-form-row">
            <label>标签</label>
            <div class="task-tag-btns">
              <button
                v-for="t in tagOptions"
                :key="t.label"
                :class="['task-tag-btn', { active: newTask.tag === t.label }]"
                :style="newTask.tag === t.label ? { background: t.color + '20', color: t.color, borderColor: t.color } : {}"
                @click="newTask.tag = newTask.tag === t.label ? '' : t.label; newTask.tagColor = t.color"
              >{{ t.label }}</button>
            </div>
          </div>
        </div>
        <div class="task-modal-footer">
          <button class="task-btn-primary" :disabled="!newTask.title.trim()" @click="addTask">
            添加任务
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  if (route.query.new === '1') {
    showAdd.value = true
  }
})

interface Task {
  id: number
  title: string
  done: boolean
  due?: string
  priority?: string
  tag?: string
  tagColor?: string
}

const tasks = ref<Task[]>([
  { id: 1, title: '跟进阿旗北方采购订单', done: false, due: new Date().toISOString().slice(0, 10), priority: 'high', tag: '采购', tagColor: '#2E6BE6' },
  { id: 2, title: '核对本月应收账款', done: false, due: '', priority: 'normal', tag: '财务', tagColor: '#F5A623' },
  { id: 3, title: '更新商品库存数据', done: false, due: '', priority: 'normal', tag: '仓库', tagColor: '#52C41A' },
])

const activeFilter = ref('todo')
const showAdd = ref(false)
const newTask = ref({ title: '', due: '', priority: 'normal', tag: '', tagColor: '' })

const priorities = [
  { key: 'high', label: '紧急', color: '#f53f3f' },
  { key: 'normal', label: '普通', color: '#2E6BE6' },
  { key: 'low', label: '低优先', color: '#86909c' },
]

const tagOptions = [
  { label: '采购', color: '#2E6BE6' },
  { label: '销售', color: '#00b42a' },
  { label: '财务', color: '#F5A623' },
  { label: '仓库', color: '#52C41A' },
  { label: '客户', color: '#9254de' },
]

const todoCount = computed(() => tasks.value.filter(t => !t.done).length)
const doneCount = computed(() => tasks.value.filter(t => t.done).length)

const filters = computed(() => [
  { key: 'todo', label: '待办', count: todoCount.value },
  { key: 'done', label: '已完成', count: 0 },
])

const filteredTasks = computed(() => {
  if (activeFilter.value === 'done') return tasks.value.filter(t => t.done)
  return tasks.value.filter(t => !t.done)
})

function isOverdue(task: Task) {
  if (!task.due || task.done) return false
  return new Date(task.due) < new Date(new Date().toDateString())
}

function toggleDone(task: Task) {
  task.done = !task.done
}

function openTask(task: Task) {
  // 未来可以打开任务详情
}

let nextId = 100
function addTask() {
  if (!newTask.value.title.trim()) return
  tasks.value.unshift({
    id: nextId++,
    title: newTask.value.title.trim(),
    done: false,
    due: newTask.value.due || undefined,
    priority: newTask.value.priority,
    tag: newTask.value.tag || undefined,
    tagColor: newTask.value.tagColor || undefined,
  })
  newTask.value = { title: '', due: '', priority: 'normal', tag: '', tagColor: '' }
  showAdd.value = false
}
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

/* ── 筛选栏 ── */
.task-filter-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 16px;
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
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.task-filter-item.active {
  color: #2E6BE6;
  border-bottom-color: #2E6BE6;
  font-weight: 600;
}
.task-filter-count {
  min-width: 16px;
  height: 16px;
  background: #f53f3f;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* ── 任务列表 ── */
.task-list {
  padding: 10px 0;
}
.task-empty {
  text-align: center;
  padding: 60px 0 40px;
}
.task-empty-icon { font-size: 40px; margin-bottom: 10px; }
.task-empty-text { font-size: 14px; color: #86909c; }

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fff;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.task-item:active { background: #fafafa; }
.task-check {
  flex-shrink: 0;
  margin-top: 1px;
  cursor: pointer;
  padding: 2px;
}
.task-body { flex: 1; min-width: 0; }
.task-title {
  font-size: 15px;
  color: #1d2129;
  line-height: 1.4;
  margin-bottom: 4px;
}
.task-title.done {
  color: #86909c;
  text-decoration: line-through;
}
.task-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.task-due {
  font-size: 12px;
  color: #86909c;
}
.task-due.overdue { color: #f53f3f; }
.task-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}
.task-priority { flex-shrink: 0; margin-top: 2px; }

/* ── FAB ── */
.task-fab {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 52px;
  height: 52px;
  background: #2E6BE6;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(46,107,230,0.4);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
  z-index: 50;
}
.task-fab:active { transform: scale(0.92); }

/* ── 弹窗 ── */
.task-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.task-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}
.task-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
  flex-shrink: 0;
}
.task-modal-close {
  border: none;
  background: transparent;
  color: #2E6BE6;
  font-size: 14px;
  cursor: pointer;
}
.task-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.task-modal-footer {
  padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px);
  border-top: 1px solid #f2f3f5;
  flex-shrink: 0;
}
.task-input {
  width: 100%;
  height: 48px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 16px;
  color: #1d2129;
  outline: none;
  box-sizing: border-box;
}
.task-input:focus { border-color: #2E6BE6; background: #fff; }
.task-input-sm {
  height: 36px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 14px;
  color: #1d2129;
  outline: none;
}
.task-input-sm:focus { border-color: #2E6BE6; background: #fff; }
.task-form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.task-form-row label {
  font-size: 13px;
  font-weight: 600;
  color: #4e5969;
  width: 52px;
  flex-shrink: 0;
}
.task-priority-btns, .task-tag-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.task-priority-btn, .task-tag-btn {
  padding: 5px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 999px;
  font-size: 13px;
  color: #4e5969;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.task-btn-primary {
  width: 100%;
  height: 48px;
  background: #2E6BE6;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}
.task-btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
