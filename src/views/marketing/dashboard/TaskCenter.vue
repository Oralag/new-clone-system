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
            {{ t('agentTaskCenter.focusTitle') }}
          </div>
          <textarea
            v-if="editingFocus"
            v-model="todayFocus"
            class="bb-textarea"
            :placeholder="t('agentTaskCenter.focusPlaceholder')"
            rows="3"
            @blur="saveFocus"
            autofocus
          />
          <div v-else class="bb-focus-text" @click="editingFocus = true">
            <span v-if="todayFocus">{{ todayFocus }}</span>
            <span v-else class="bb-placeholder">{{ t('agentTaskCenter.focusClickHint') }}</span>
          </div>
          <button v-if="!editingFocus" class="bb-edit-btn" @click="editingFocus = true">{{ t('common.edit') }}</button>
        </div>

        <div class="bb-divider"></div>

        <div class="bb-col">
          <div class="bb-section-title">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M2 6.5l3 3 6-6"/>
            </svg>
            {{ t('agentTaskCenter.runningTitle') }}
          </div>
          <div v-if="activeTasks.length === 0" class="bb-empty">{{ t('agentTaskCenter.noRunningTasks') }}</div>
          <div v-for="t in activeTasks" :key="t.id" class="bb-running-item">
            <span class="bb-running-dot"></span>
            <span>{{ t.title }}</span>
            <span class="bb-stage-tag" :style="{ background: currentStageColor(t) + '22', color: currentStageColor(t) }">
              {{ currentStageLabel(t) }}
            </span>
          </div>
        </div>

        <div class="bb-divider"></div>

        <div class="bb-col bb-col-new">
          <div class="bb-section-title">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M6.5 2v9M2 6.5h9"/>
            </svg>
            {{ t('agentTaskCenter.newTaskTitle') }}
          </div>
          <div class="bb-new-wrap">
            <input
              v-model="newTaskTitle"
              class="bb-input"
              :placeholder="t('agentTaskCenter.taskNamePlaceholder')"
              @keydown.enter="createTask"
            />
            <button class="bb-create-btn" @click="createTask" :disabled="!newTaskTitle.trim()">{{ t('common.create') }}</button>
          </div>
          <div class="bb-stats">
            <span>{{ t('agentTaskCenter.totalTasks', { count: pipelineStore.tasks.length }) }}</span>
            <span>·</span>
            <span>{{ t('agentTaskCenter.doneTasks', { count: doneTasks.length }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 流水线任务列表 -->
    <div class="section-hd">
      <h3 class="section-title">{{ t('agentTaskCenter.pipelineTitle') }}</h3>
      <span class="section-sub">{{ t('agentTaskCenter.pipelineCount', { count: pipelineStore.tasks.length }) }}</span>
      <button v-if="doneTasks.length > 0" class="clear-done-btn" @click="clearDone">{{ t('agentTaskCenter.clearDone') }}</button>
    </div>

    <div v-if="pipelineStore.tasks.length === 0" class="empty-state">
      <div class="empty-icon">⚡</div>
      <div class="empty-title">{{ t('agentTaskCenter.noPipelineTasks') }}</div>
      <div class="empty-desc">{{ t('agentTaskCenter.noPipelineHint') }}</div>
      <button class="btn-goto" @click="$router.push('/agent/meeting')">{{ t('agentTaskCenter.gotoMeeting') }}</button>
    </div>

    <div v-else class="pipeline-list">
      <div v-for="task in pipelineStore.tasks" :key="task.id" class="pipeline-card">
        <div class="pipeline-card-top">
          <div class="pipeline-info">
            <span class="pipeline-name">{{ task.title }}</span>
            <span class="pipeline-time">{{ fmtTime(task.createdAt) }}</span>
          </div>
          <div class="pipeline-card-actions">
            <span class="pipeline-status" :class="task.status">{{ statusLabel(task.status) }}</span>
            <button v-if="task.status !== 'done'" class="advance-btn" @click="pipelineStore.advanceStage(task.id)" :title="t('agentTaskCenter.advanceTitle')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M2 6h8M7 3l3 3-3 3"/>
              </svg>
              {{ t('agentTaskCenter.advance') }}
            </button>
            <button class="del-btn" @click="pipelineStore.removeTask(task.id)" :title="t('common.delete')">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                <path d="M2 2l7 7M9 2l-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 步骤条 -->
        <div class="pipeline-steps">
          <template v-for="(stage, i) in PIPELINE_STAGES" :key="stage.id">
            <div
              class="pipeline-step"
              :class="{
                done: i < task.currentStage || task.status === 'done',
                active: i === task.currentStage && task.status !== 'done',
                pending: i > task.currentStage && task.status !== 'done'
              }"
            >
              <div class="step-dot" :style="i < task.currentStage || task.status === 'done' ? { background: stage.color } : i === task.currentStage && task.status !== 'done' ? { background: stage.color } : {}">
                <svg v-if="i < task.currentStage || task.status === 'done'" width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2 3-3" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <span v-else-if="i === task.currentStage && task.status !== 'done'" class="step-pulse" :style="{ background: 'white' }"></span>
              </div>
              <span class="step-label" :style="(i <= task.currentStage || task.status === 'done') ? { color: stage.color } : {}">
                {{ stage.emoji }} {{ stage.label }}
              </span>
            </div>
            <div v-if="i < PIPELINE_STAGES.length - 1" class="step-line" :class="{ done: i < task.currentStage || task.status === 'done' }" :style="i < task.currentStage || task.status === 'done' ? { background: PIPELINE_STAGES[i].color } : {}"></div>
          </template>
        </div>

        <!-- 各阶段产出 -->
        <div v-if="hasOutputs(task)" class="stage-outputs">
          <div v-for="stage in PIPELINE_STAGES" :key="stage.id">
            <div v-if="task.stageOutputs[stage.id]" class="output-item">
              <span class="output-stage-tag" :style="{ background: stage.color + '18', color: stage.color }">{{ stage.emoji }} {{ stage.label }}</span>
              <span class="output-text">{{ task.stageOutputs[stage.id] }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePipelineStore, PIPELINE_STAGES } from '@/stores/pipeline'

const pipelineStore = usePipelineStore()
const { t } = useI18n()

// 今日重点
const FOCUS_KEY = 'agent_today_focus'
const todayFocus = ref(localStorage.getItem(FOCUS_KEY) || '')
const editingFocus = ref(false)
function saveFocus() {
  localStorage.setItem(FOCUS_KEY, todayFocus.value)
  editingFocus.value = false
}

// 新建任务
const newTaskTitle = ref('')
function createTask() {
  if (!newTaskTitle.value.trim()) return
  pipelineStore.createTask(newTaskTitle.value.trim())
  newTaskTitle.value = ''
}

// 计算属性
const activeTasks = computed(() => pipelineStore.tasks.filter(t => t.status === 'running' || t.status === 'pending'))
const doneTasks = computed(() => pipelineStore.tasks.filter(t => t.status === 'done'))

function clearDone() {
  doneTasks.value.forEach(t => pipelineStore.removeTask(t.id))
}

function currentStageLabel(task: typeof pipelineStore.tasks[0]) {
  return PIPELINE_STAGES[task.currentStage]?.label || ''
}
function currentStageColor(task: typeof pipelineStore.tasks[0]) {
  return PIPELINE_STAGES[task.currentStage]?.color || '#999'
}

function hasOutputs(task: typeof pipelineStore.tasks[0]) {
  return Object.keys(task.stageOutputs).length > 0
}

function statusLabel(s: string) {
  return {
    running: t('agentTaskCenter.statusRunning'),
    done: t('agentTaskCenter.statusDone'),
    pending: t('agentTaskCenter.statusPending'),
    blocked: t('agentTaskCenter.statusBlocked'),
  }[s] || s
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - ts
  if (diff < 60000) return t('agentTaskCenter.justNow')
  if (diff < 3600000) return t('agentTaskCenter.minutesAgo', { count: Math.floor(diff / 60000) })
  if (d.toDateString() === now.toDateString()) return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  return `${d.getMonth()+1}/${d.getDate()}`
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
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 24px;
  align-items: start;
}
.bb-col { display: flex; flex-direction: column; gap: 10px; }
.bb-col-new { gap: 8px; }
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
  font-size: 15px; color: rgba(255,255,255,0.85);
  line-height: 1.6; min-height: 60px; cursor: pointer; white-space: pre-wrap;
}
.bb-placeholder { color: rgba(255,255,255,0.2); font-style: italic; }
.bb-textarea {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px; padding: 10px 12px; font-size: 14px;
  color: rgba(255,255,255,0.9); resize: none; outline: none;
  font-family: inherit; line-height: 1.6; width: 100%;
}
.bb-textarea:focus { border-color: rgba(0,113,227,0.5); }
.bb-edit-btn {
  align-self: flex-start; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
  padding: 4px 12px; font-size: 11px; color: rgba(255,255,255,0.4);
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.bb-edit-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
.bb-empty { font-size: 13px; color: rgba(255,255,255,0.25); font-style: italic; }
.bb-running-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: rgba(255,255,255,0.7);
}
.bb-running-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #34d399;
  animation: pulse 2s ease-in-out infinite; flex-shrink: 0;
}
.bb-stage-tag {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border-radius: 10px; flex-shrink: 0;
}
.bb-new-wrap { display: flex; gap: 6px; }
.bb-input {
  flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px; padding: 8px 10px; font-size: 13px;
  color: rgba(255,255,255,0.9); outline: none; font-family: inherit;
}
.bb-input:focus { border-color: rgba(0,113,227,0.5); }
.bb-input::placeholder { color: rgba(255,255,255,0.25); }
.bb-create-btn {
  background: #0071e3; border: none; border-radius: 8px;
  padding: 8px 14px; font-size: 12px; font-weight: 600;
  color: white; cursor: pointer; font-family: inherit; white-space: nowrap;
  transition: background 0.15s;
}
.bb-create-btn:hover:not(:disabled) { background: #0066cc; }
.bb-create-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.bb-stats { font-size: 11px; color: rgba(255,255,255,0.3); display: flex; gap: 6px; }

@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50% { box-shadow: 0 0 0 5px rgba(52,211,153,0.06); }
}

/* 章节标题 */
.section-hd { display: flex; align-items: center; gap: 10px; }
.section-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin: 0; }
.section-sub { font-size: 11px; color: #999999; }
.clear-done-btn {
  margin-left: auto; background: none; border: 1px solid #E8E8E8;
  border-radius: 8px; padding: 4px 12px; font-size: 11px; color: #999;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.clear-done-btn:hover { border-color: #ef4444; color: #ef4444; }

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
  background: #ffffff; border: 1px solid #E8E8E8;
  border-radius: 14px; padding: 18px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.pipeline-card-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.pipeline-info { display: flex; flex-direction: column; gap: 2px; }
.pipeline-name { font-size: 14px; font-weight: 700; color: #1A1A1A; }
.pipeline-time { font-size: 11px; color: #999999; }
.pipeline-card-actions { display: flex; align-items: center; gap: 8px; }
.pipeline-status {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
}
.pipeline-status.running { background: rgba(0,113,227,0.1); color: #0071e3; }
.pipeline-status.done    { background: rgba(52,211,153,0.1); color: #059669; }
.pipeline-status.pending { background: rgba(245,158,11,0.1); color: #d97706; }
.pipeline-status.blocked { background: rgba(239,68,68,0.1);  color: #dc2626; }

.advance-btn {
  display: flex; align-items: center; gap: 4px;
  background: #F8F8F6; border: 1px solid #E8E8E8;
  border-radius: 8px; padding: 4px 10px;
  font-size: 11px; font-weight: 600; color: #555;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.advance-btn:hover { background: #0071e3; color: white; border-color: #0071e3; }
.del-btn {
  background: none; border: none; cursor: pointer;
  color: #CCCCCC; padding: 4px; border-radius: 6px;
  transition: color 0.15s; display: flex; align-items: center;
}
.del-btn:hover { color: #ef4444; }

/* 步骤条 */
.pipeline-steps {
  display: flex; align-items: center; margin-bottom: 4px;
  padding-bottom: 20px; position: relative;
}
.pipeline-step { display: flex; align-items: center; position: relative; }
.step-dot {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s; background: #E8E8E8;
}
.step-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}
.step-label {
  font-size: 11px; font-weight: 600; white-space: nowrap;
  position: absolute; top: 26px; left: 50%; transform: translateX(-50%);
  color: #CCCCCC; transition: color 0.2s;
}
.step-line {
  flex: 1; height: 2px; background: #E8E8E8;
  margin: 0 4px; transition: background 0.3s; min-width: 24px;
}

/* 阶段产出 */
.stage-outputs {
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid #F0F0EE;
  display: flex; flex-direction: column; gap: 6px;
}
.output-item {
  display: flex; align-items: flex-start; gap: 8px;
}
.output-stage-tag {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border-radius: 10px; flex-shrink: 0; white-space: nowrap;
}
.output-text {
  font-size: 12px; color: #555; line-height: 1.5;
  flex: 1;
}

@media (max-width: 700px) {
  .blackboard-inner { grid-template-columns: 1fr; }
  .bb-divider { width: auto; height: 1px; }
}
</style>
