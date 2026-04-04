<template>
  <div class="task-center">

    <!-- 黑板区 -->
    <div class="blackboard">
      <div class="blackboard-inner">
        <div class="bb-col">
          <div class="bb-section-title">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 4v3l2 1.2"/>
            </svg>
            今日重点
          </div>
          <textarea
            v-if="editingFocus"
            v-model="todayFocus"
            class="bb-textarea"
            placeholder="写下今天最重要的事..."
            rows="3"
            @blur="saveFocus"
            autofocus
          />
          <div v-else class="bb-focus-text" @click="editingFocus = true">
            <span v-if="todayFocus">{{ todayFocus }}</span>
            <span v-else class="bb-placeholder">点击写下今日重点...</span>
          </div>
          <button v-if="!editingFocus" class="bb-edit-btn" @click="editingFocus = true">编辑</button>
        </div>

        <div class="bb-divider"></div>

        <div class="bb-col">
          <div class="bb-section-title">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M2 6.5l3 3 6-6"/>
            </svg>
            进行中
          </div>
          <div v-if="runningTasks.length === 0" class="bb-empty">暂无运行中的任务</div>
          <div v-for="t in runningTasks" :key="t.id" class="bb-running-item">
            <span class="bb-running-dot"></span>
            <span>{{ t.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 流水线进度卡 -->
    <div class="section-hd">
      <h3 class="section-title">流水线任务</h3>
      <span class="section-sub">{{ pipelines.length }} 条记录</span>
    </div>

    <div v-if="pipelines.length === 0" class="empty-state">
      <div class="empty-icon">⚡</div>
      <div class="empty-title">暂无流水线任务</div>
      <div class="empty-desc">在会议室发起工作流，任务进度会在这里显示</div>
      <button class="btn-goto" @click="$router.push('/agent/meeting')">前往会议室 →</button>
    </div>

    <div v-else class="pipeline-list">
      <div v-for="p in pipelines" :key="p.id" class="pipeline-card">
        <div class="pipeline-card-top">
          <div class="pipeline-info">
            <span class="pipeline-name">{{ p.topic }}</span>
            <span class="pipeline-time">{{ p.time }}</span>
          </div>
          <span class="pipeline-status" :class="p.status">{{ statusLabel(p.status) }}</span>
        </div>
        <!-- 步骤条 -->
        <div class="pipeline-steps">
          <div
            v-for="(step, i) in p.steps"
            :key="i"
            class="pipeline-step"
            :class="{ done: i < p.current, active: i === p.current, pending: i > p.current }"
          >
            <div class="step-dot">
              <svg v-if="i < p.current" width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4l2 2 3-3" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              <span v-else-if="i === p.current" class="step-pulse"></span>
            </div>
            <span class="step-label">{{ step }}</span>
            <div v-if="i < p.steps.length - 1" class="step-line" :class="{ done: i < p.current }"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMeetingStore } from '@/stores/meeting'

const meetingStore = useMeetingStore()

// 今日重点
const FOCUS_KEY = 'agent_today_focus'
const todayFocus = ref(localStorage.getItem(FOCUS_KEY) || '')
const editingFocus = ref(false)
function saveFocus() {
  localStorage.setItem(FOCUS_KEY, todayFocus.value)
  editingFocus.value = false
}

// 进行中任务（从 meetingStore 读）
const runningTasks = computed(() => {
  if (meetingStore.isRunning) {
    return [{ id: 'meeting', name: '会议室流水线运行中' }]
  }
  return []
})

// 流水线历史（从 meetingStore 的 messages 构建）
const pipelines = computed(() => {
  const results = meetingStore.flowResults ?? []
  if (results.length === 0 && !meetingStore.topic) return []
  const steps = ['情报部', '文案', '海报', '审核', '发布']
  const current = meetingStore.isRunning ? meetingStore.phase === 'executing' ? 2 : 1 : steps.length
  return meetingStore.topic ? [{
    id: 'current',
    topic: meetingStore.topic || '当前任务',
    time: '刚刚',
    status: meetingStore.isRunning ? 'running' : meetingStore.phase === 'done' ? 'done' : 'pending',
    steps,
    current: meetingStore.phase === 'done' ? steps.length : current,
  }] : []
})

function statusLabel(s: string) {
  return { running: '运行中', done: '已完成', pending: '等待中', failed: '失败' }[s] || s
}
</script>

<style scoped>
.task-center {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
  max-width: 900px;
}

/* 黑板 */
.blackboard {
  background: #1a2234;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.blackboard-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: start;
}
.bb-col { display: flex; flex-direction: column; gap: 10px; }
.bb-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.5);
}
.bb-divider {
  width: 1px;
  background: rgba(255,255,255,0.08);
  align-self: stretch;
}
.bb-focus-text {
  font-size: 15px;
  color: rgba(255,255,255,0.85);
  line-height: 1.6;
  min-height: 60px;
  cursor: pointer;
  white-space: pre-wrap;
}
.bb-placeholder { color: rgba(255,255,255,0.2); font-style: italic; }
.bb-textarea {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.6;
  width: 100%;
}
.bb-textarea:focus { border-color: rgba(0,113,227,0.5); }
.bb-edit-btn {
  align-self: flex-start;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.bb-edit-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
.bb-empty { font-size: 13px; color: rgba(255,255,255,0.25); font-style: italic; }
.bb-running-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: rgba(255,255,255,0.7);
}
.bb-running-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399;
  animation: pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50% { box-shadow: 0 0 0 5px rgba(52,211,153,0.06); }
}

/* 章节标题 */
.section-hd { display: flex; align-items: center; gap: 10px; }
.section-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin: 0; }
.section-sub { font-size: 11px; color: #999999; }

/* 空状态 */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: #1A1A1A; margin-bottom: 6px; }
.empty-desc { font-size: 13px; color: #666666; margin-bottom: 20px; }
.btn-goto {
  padding: 9px 20px; background: #0071e3; color: #fff;
  border: none; border-radius: 10px; font-size: 13px; cursor: pointer; font-family: inherit;
}
.btn-goto:hover { background: #0066cc; }

/* 流水线卡片 */
.pipeline-list { display: flex; flex-direction: column; gap: 12px; }
.pipeline-card {
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.pipeline-card-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.pipeline-info { display: flex; flex-direction: column; gap: 2px; }
.pipeline-name { font-size: 14px; font-weight: 700; color: #1A1A1A; }
.pipeline-time { font-size: 11px; color: #999999; }
.pipeline-status {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px;
}
.pipeline-status.running { background: rgba(0,113,227,0.1); color: #0071e3; }
.pipeline-status.done    { background: rgba(52,211,153,0.1); color: #059669; }
.pipeline-status.pending { background: rgba(245,158,11,0.1); color: #d97706; }
.pipeline-status.failed  { background: rgba(239,68,68,0.1);  color: #dc2626; }

/* 步骤条 */
.pipeline-steps {
  display: flex;
  align-items: center;
  gap: 0;
}
.pipeline-step {
  display: flex; align-items: center; gap: 0;
  flex: 1;
}
.pipeline-step:last-child { flex: 0; }
.step-dot {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
.pipeline-step.done   .step-dot { background: #34d399; }
.pipeline-step.active .step-dot { background: #0071e3; }
.pipeline-step.pending .step-dot { background: #E8E8E8; }
.step-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: white;
  animation: pulse 1.5s ease-in-out infinite;
}
.step-label {
  font-size: 10px; font-weight: 600;
  white-space: nowrap;
  position: absolute;
  transform: translateX(-50%) translateY(14px);
  margin-left: 10px;
}
.pipeline-step.done   .step-label { color: #059669; }
.pipeline-step.active .step-label { color: #0071e3; }
.pipeline-step.pending .step-label { color: #CCCCCC; }
.step-line {
  flex: 1;
  height: 2px;
  background: #E8E8E8;
  margin: 0 2px;
  transition: background 0.3s;
}
.step-line.done { background: #34d399; }

@media (max-width: 600px) {
  .blackboard-inner { grid-template-columns: 1fr; }
  .bb-divider { width: auto; height: 1px; }
}
</style>
