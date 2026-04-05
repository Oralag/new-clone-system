<template>
  <div class="content-dept">

    <!-- ── 顶部：员工卡 + 今日任务栏 ── -->
    <DeptEmployeeCard
      name="Maya"
      role="文案专员"
      emoji="✍️"
      desc="文案 · 视频全链路内容生产"
      color="#f59e0b"
      illustId="content"
      :busy="false"
      :stats="[
        { value: copywritingResults.length, label: '已生文案' },
        { value: videoResults.length, label: '已生脚本' },
        { value: publishCount, label: '已发布' },
      ]"
    />

    <!-- ── 三栏主体 ── -->
    <div class="three-col">

      <!-- 左侧：任务面板 -->
      <aside class="left-panel">

        <!-- 今日目标 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#f59e0b"></span>
            今日目标
          </div>
          <div class="goal-input-wrap">
            <textarea
              v-model="todayGoal"
              class="goal-input"
              placeholder="设定今日内容目标..."
              rows="3"
              @blur="saveGoal"
            />
          </div>
        </div>

        <!-- 快捷指令 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#6366f1"></span>
            快捷指令
          </div>
          <div class="quick-list">
            <button
              v-for="q in quickPrompts"
              :key="q.text"
              class="quick-item"
              @click="sendPrompt(q.text)"
            >
              <span class="quick-emoji">{{ q.emoji }}</span>
              <span class="quick-text">{{ q.text }}</span>
            </button>
          </div>
        </div>

        <!-- 状态监控 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#10b981"></span>
            部门状态
          </div>
          <div class="status-list">
            <div class="status-row">
              <span class="status-label">文案专员</span>
              <span class="status-badge green">待命</span>
            </div>
            <div class="status-row">
              <span class="status-label">视频脚本</span>
              <span class="status-badge green">待命</span>
            </div>
            <div class="status-row">
              <span class="status-label">今日产出</span>
              <span class="status-badge blue">{{ copywritingResults.length + videoResults.length }} 件</span>
            </div>
          </div>
        </div>

      </aside>

      <!-- 中间：对话区 -->
      <section class="chat-panel" :style="{ '--ac': '#f59e0b' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">✍️</span>
            <div>
              <div class="chat-agent-name">Maya · 文案专员</div>
              <div class="chat-agent-sub">内容部 · 文案 & 视频脚本</div>
            </div>
          </div>
          <div class="chat-chips">
            <button class="chip-btn" @click="$router.push('/agent/copywriting')">文案生成</button>
            <button class="chip-btn" @click="$router.push('/agent/video')">视频脚本</button>
          </div>
        </div>
        <AgentChat agent-id="copywriter" ref="chatRef" />
      </section>

      <!-- 右侧：产出列表 -->
      <aside class="right-panel">

        <!-- 今日文案 -->
        <div class="panel-card output-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#f59e0b"></span>
            今日文案
            <span class="panel-count">{{ copywritingResults.length }}</span>
          </div>
          <div v-if="copywritingResults.length === 0" class="output-empty">
            <span>暂无产出</span>
          </div>
          <div v-else class="output-list">
            <div
              v-for="(r, i) in copywritingResults.slice().reverse().slice(0, 5)"
              :key="i"
              class="output-item"
              @click="previewIdx = i; previewType = 'copy'"
            >
              <div class="output-item-top">
                <span class="output-type copy">文案</span>
                <span class="output-time">{{ r.platform || '通用' }}</span>
              </div>
              <div class="output-title">{{ r.topic || r.content?.slice(0, 30) || '无标题' }}{{ (r.topic || r.content || '').length > 30 ? '…' : '' }}</div>
            </div>
          </div>
          <button
            v-if="copywritingResults.length > 0"
            class="send-next-btn"
            @click="sendToCreative"
            :class="{ sent: sentToCreative }"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
              <path d="M2 5.5h7M6 3l3 2.5L6 8"/>
            </svg>
            {{ sentToCreative ? '已发给创意部 ✓' : '发给创意部 →' }}
          </button>
        </div>

        <!-- 今日脚本 -->
        <div class="panel-card output-card" style="margin-top:10px">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#ef4444"></span>
            今日脚本
            <span class="panel-count">{{ videoResults.length }}</span>
          </div>
          <div v-if="videoResults.length === 0" class="output-empty">
            <span>暂无产出</span>
          </div>
          <div v-else class="output-list">
            <div
              v-for="(r, i) in videoResults.slice().reverse().slice(0, 4)"
              :key="i"
              class="output-item"
            >
              <div class="output-item-top">
                <span class="output-type video">脚本</span>
                <span class="output-time">视频</span>
              </div>
              <div class="output-title">{{ r.topic || r.title || '无标题' }}</div>
            </div>
          </div>
        </div>

        <!-- 发布队列 -->
        <div class="panel-card" style="margin-top:10px">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#10b981"></span>
            准确率
          </div>
          <div class="accuracy-bar">
            <div class="accuracy-label">内容质量</div>
            <div class="accuracy-track">
              <div class="accuracy-fill" style="width:88%"></div>
            </div>
            <span class="accuracy-pct">88%</span>
          </div>
          <div class="accuracy-bar" style="margin-top:8px">
            <div class="accuracy-label">按时产出</div>
            <div class="accuracy-track">
              <div class="accuracy-fill" style="width:96%"></div>
            </div>
            <span class="accuracy-pct">96%</span>
          </div>
        </div>

      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import { usePipelineStore } from '@/stores/pipeline'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'
import { ElMessage } from 'element-plus'

const agentStore = useTrendingStore()
const pipelineStore = usePipelineStore()
const chatRef = ref<InstanceType<typeof AgentChat>>()
const sentToCreative = ref(false)

const copywritingResults = computed(() => agentStore.copywritingResults)
const videoResults = computed(() => agentStore.videoResults)
const publishCount = computed(() => agentStore.history.filter(h => h.status === 'published').length)

// 今日目标
const todayGoal = ref(localStorage.getItem('content_dept_goal') || '')
function saveGoal() {
  localStorage.setItem('content_dept_goal', todayGoal.value)
}

// 预览
const previewIdx = ref(-1)
const previewType = ref<'copy' | 'video'>('copy')

// 快捷指令
const quickPrompts = [
  { emoji: '🔥', text: '根据今日热搜写一篇小红书爆款文案' },
  { emoji: '📱', text: '写一条抖音视频开场白，吸引眼球' },
  { emoji: '✍️', text: '帮我写3个标题，选题：新品上线' },
  { emoji: '🎬', text: '写一个60秒短视频脚本框架' },
  { emoji: '💡', text: '分析最近爆款内容的共同规律' },
]

function sendPrompt(text: string) {
  chatRef.value?.sendQuickPrompt?.(text)
}

function sendToCreative() {
  const results = copywritingResults.value
  if (results.length === 0) return
  const latest = results[results.length - 1]
  const title = latest.topic || latest.content?.slice(0, 20) || '内容文案'
  // 找到 intel 阶段完成的任务，推进到 creative
  const task = pipelineStore.tasks.find(t => t.currentStage === 1 && t.status === 'running')
  if (task) {
    pipelineStore.recordOutput(task.id, 'content', title)
    pipelineStore.advanceStage(task.id)
  } else {
    // 没有流水线任务则新建
    pipelineStore.createTask(title)
    const newTask = pipelineStore.tasks[0]
    pipelineStore.advanceStage(newTask.id) // intel→content
    pipelineStore.recordOutput(newTask.id, 'content', title)
    pipelineStore.advanceStage(newTask.id) // content→creative
  }
  sentToCreative.value = true
  ElMessage.success('已发给创意部，可在任务中心查看')
  setTimeout(() => { sentToCreative.value = false }, 3000)
}
</script>

<style scoped>
.content-dept {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 40px;
  max-width: 1400px;
}

/* ── 三栏布局 ── */
.three-col {
  display: grid;
  grid-template-columns: 220px 1fr 220px;
  gap: 14px;
  align-items: start;
}

/* ── 通用面板卡 ── */
.panel-card {
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.panel-hd {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #AAAAAA;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.panel-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.panel-count {
  margin-left: auto;
  background: #F0F0EE;
  color: #666;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
}

/* 左侧面板 */
.left-panel { display: flex; flex-direction: column; gap: 10px; }

.goal-input {
  width: 100%; border: 1px solid #E8E8E8; border-radius: 8px;
  padding: 8px 10px; font-size: 12px; color: #333;
  background: #F8F8F6; resize: none; outline: none;
  font-family: inherit; line-height: 1.5; box-sizing: border-box;
}
.goal-input:focus { border-color: #f59e0b; }

.quick-list { display: flex; flex-direction: column; gap: 6px; }
.quick-item {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 8px 10px; border-radius: 8px;
  background: #F8F8F6; border: 1px solid transparent;
  cursor: pointer; text-align: left; font-family: inherit;
  transition: all 0.15s;
}
.quick-item:hover { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.2); }
.quick-emoji { font-size: 13px; flex-shrink: 0; }
.quick-text { font-size: 11px; color: #555; line-height: 1.4; }

.status-list { display: flex; flex-direction: column; gap: 7px; }
.status-row { display: flex; align-items: center; justify-content: space-between; }
.status-label { font-size: 12px; color: #555; }
.status-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border-radius: 20px;
}
.status-badge.green { background: rgba(52,211,153,0.1); color: #059669; }
.status-badge.blue  { background: rgba(0,113,227,0.08); color: #0071e3; }

/* 中间对话区 */
.chat-panel {
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-left: 3px solid var(--ac, #f59e0b);
  border-radius: 14px;
  padding: 16px 16px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: hidden;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}
.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 14px; flex-shrink: 0;
}
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-agent-emoji { font-size: 24px; }
.chat-agent-name { font-size: 14px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.02em; }
.chat-agent-sub { font-size: 11px; color: #AAAAAA; margin-top: 1px; }
.chat-chips { display: flex; gap: 5px; }
.chip-btn {
  background: #F8F8F6; border: 1px solid #E8E8E8;
  border-radius: 20px; padding: 4px 10px;
  font-size: 11px; font-weight: 500; color: #666;
  cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.15s;
}
.chip-btn:hover { border-color: var(--ac, #f59e0b); color: var(--ac, #f59e0b); }
.chat-panel :deep(.agent-bar) {
  border: none !important; border-radius: 0 !important;
  box-shadow: none !important; background: transparent !important;
  margin-bottom: 0 !important;
  border-top: 1px solid rgba(0,0,0,0.06) !important;
}

/* 右侧产出面板 */
.right-panel { display: flex; flex-direction: column; gap: 0; }

.output-empty {
  padding: 16px 0; text-align: center;
  font-size: 12px; color: #CCCCCC; font-style: italic;
}
.output-list { display: flex; flex-direction: column; gap: 6px; }
.output-item {
  padding: 9px 10px; border-radius: 8px;
  background: #F8F8F6; cursor: pointer;
  transition: background 0.15s;
}
.output-item:hover { background: #F0F0EE; }
.output-item-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px;
}
.output-type {
  font-size: 9px; font-weight: 800; padding: 1px 7px;
  border-radius: 10px; text-transform: uppercase; letter-spacing: 0.06em;
}
.output-type.copy  { background: rgba(245,158,11,0.12); color: #d97706; }
.output-type.video { background: rgba(239,68,68,0.1); color: #dc2626; }
.output-time { font-size: 10px; color: #CCCCCC; }
.output-title {
  font-size: 12px; color: #333; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.send-next-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; margin-top: 10px; padding: 8px;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3);
  border-radius: 8px; font-size: 12px; font-weight: 600; color: #d97706;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.send-next-btn:hover:not(.sent) { background: #f59e0b; color: white; border-color: #f59e0b; }
.send-next-btn.sent { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3); color: #059669; cursor: default; }

/* 准确率 */
.accuracy-bar { display: flex; align-items: center; gap: 8px; }
.accuracy-label { font-size: 11px; color: #666; width: 56px; flex-shrink: 0; }
.accuracy-track {
  flex: 1; height: 5px; background: #F0F0EE; border-radius: 3px; overflow: hidden;
}
.accuracy-fill { height: 100%; background: #f59e0b; border-radius: 3px; }
.accuracy-pct { font-size: 11px; font-weight: 700; color: #f59e0b; width: 30px; text-align: right; flex-shrink: 0; }

@media (max-width: 1100px) {
  .three-col { grid-template-columns: 1fr; }
  .left-panel, .right-panel { display: none; }
}
</style>
