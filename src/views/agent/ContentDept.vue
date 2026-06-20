<template>
  <div class="content-dept">

    <!-- ── 顶部：员工卡 + 今日任务栏 ── -->
    <DeptEmployeeCard
      name="Maya"
      :role="t('agentContentDept.role')"
      emoji="✍️"
      :desc="t('agentContentDept.desc')"
      color="#f59e0b"
      illustId="content"
      :busy="false"
      :stats="[
        { value: copywritingResults.length, label: t('agentContentDept.kpiCopy') },
        { value: videoResults.length, label: t('agentContentDept.kpiVideo') },
        { value: publishCount, label: t('agentContentDept.kpiPublished') },
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
            {{ t('agentContentDept.todayGoalTitle') }}
          </div>
          <div class="goal-input-wrap">
            <textarea
              v-model="todayGoal"
              class="goal-input"
              :placeholder="t('agentContentDept.goalPlaceholder')"
              rows="3"
              @blur="saveGoal"
            />
          </div>
        </div>

        <!-- 快捷指令 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#6366f1"></span>
            {{ t('agentContentDept.quickPromptsTitle') }}
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
            <span class="status-label">{{ t('agentContentDept.copywriter') }}</span>
              <span class="status-badge green">{{ t('agentContentDept.standby') }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">{{ t('agentContentDept.videoScript') }}</span>
              <span class="status-badge green">{{ t('agentContentDept.standby') }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">{{ t('agentContentDept.todayOutput') }}</span>
              <span class="status-badge blue">{{ t('agentContentDept.outputCount', { count: copywritingResults.length + videoResults.length }) }}</span>
            </div>
          </div>
        </div>

        <!-- 近期发布计划 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#7c3aed"></span>
            {{ t('agentContentDept.recentPlansTitle') }}
            <router-link to="/agent/calendar" class="panel-link-sm">{{ t('common.view') }} {{ t('common.all') }}</router-link>
          </div>
          <div class="cal-mini-list">
            <div v-for="p in upcomingPlans(3)" :key="p.id" class="cal-mini-item">
              <span class="cal-mini-ch">{{ CH_EMOJI[p.channel] ?? '📄' }}</span>
              <div class="cal-mini-body">
                <div class="cal-mini-title">{{ p.title }}</div>
                <div class="cal-mini-meta">{{ p.date }}</div>
              </div>
              <span class="cal-mini-status" :class="'cms-' + p.status">{{ STATUS_LABEL[p.status] }}</span>
            </div>
            <div v-if="upcomingPlans(3).length === 0" class="cal-mini-empty">{{ t('agentContentDept.noUpcoming') }}</div>
          </div>
        </div>

      </aside>

      <!-- 中间：对话区 -->
      <section class="chat-panel" :style="{ '--ac': '#f59e0b' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">✍️</span>
            <div>
              <div class="chat-agent-name">Maya · {{ t('agentContentDept.role') }}</div>
              <div class="chat-agent-sub">{{ t('agentLayout.contentDept') }} · {{ t('agentContentDept.copywriting') }} & {{ t('agentContentDept.videoScript') }}</div>
            </div>
          </div>
          <div class="chat-chips">
            <button class="chip-btn" @click="$router.push('/agent/copywriting')">{{ t('agentContentDept.copywriting') }}</button>
            <button class="chip-btn" @click="$router.push('/agent/video')">{{ t('agentContentDept.videoScript') }}</button>
          </div>
        </div>
        <div class="product-selector-row">
          <ProductSelector @change="selectedProduct = $event" />
        </div>
        <AgentChat agent-id="copywriter" ref="chatRef" :context-data="agentContext" />
      </section>

      <!-- 右侧：产出列表 -->
      <aside class="right-panel">

        <!-- 今日文案 -->
        <div class="panel-card output-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#f59e0b"></span>
            {{ t('agentContentDept.todayCopy') }}
            <span class="panel-count">{{ copywritingResults.length }}</span>
          </div>
          <div v-if="copywritingResults.length === 0" class="output-empty">
            <span>{{ t('agentContentDept.noOutput') }}</span>
          </div>
          <div v-else class="output-list">
            <div
              v-for="(r, i) in copywritingResults.slice().reverse().slice(0, 5)"
              :key="i"
              class="output-item"
              @click="previewIdx = i; previewType = 'copy'"
            >
              <div class="output-item-top">
                <span class="output-type copy">{{ t('agentContentDept.copywriting') }}</span>
                <span class="output-time">{{ r.platform || t('agentContentDept.generic') }}</span>
              </div>
              <div class="output-title">{{ r.topic || r.content?.slice(0, 30) || t('agentContentDept.noTitle') }}{{ (r.topic || r.content || '').length > 30 ? '…' : '' }}</div>
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
            {{ sentToCreative ? t('agentContentDept.sentToCreativeDone') : t('agentContentDept.sentToCreative') }}
          </button>
        </div>

        <!-- 今日脚本 -->
        <div class="panel-card output-card" style="margin-top:10px">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#ef4444"></span>
            {{ t('agentContentDept.todayVideo') }}
            <span class="panel-count">{{ videoResults.length }}</span>
          </div>
          <div v-if="videoResults.length === 0" class="output-empty">
            <span>{{ t('agentContentDept.noOutput') }}</span>
          </div>
          <div v-else class="output-list">
            <div
              v-for="(r, i) in videoResults.slice().reverse().slice(0, 4)"
              :key="i"
              class="output-item"
            >
              <div class="output-item-top">
                <span class="output-type video">{{ t('agentContentDept.videoScript') }}</span>
                <span class="output-time">{{ t('agentContentDept.video') }}</span>
              </div>
              <div class="output-title">{{ r.topic || r.title || t('agentContentDept.noTitle') }}</div>
            </div>
          </div>
        </div>

        <!-- 发布队列 -->
        <div class="panel-card" style="margin-top:10px">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#10b981"></span>
            {{ t('agentContentDept.accuracyTitle') }}
          </div>
          <div class="accuracy-bar">
            <div class="accuracy-label">{{ t('agentContentDept.contentQuality') }}</div>
            <div class="accuracy-track">
              <div class="accuracy-fill" style="width:88%"></div>
            </div>
            <span class="accuracy-pct">88%</span>
          </div>
          <div class="accuracy-bar" style="margin-top:8px">
            <div class="accuracy-label">{{ t('agentContentDept.onTimeOutput') }}</div>
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
import { useI18n } from 'vue-i18n'
import { useTrendingStore } from '@/stores/agent'
import { usePipelineStore } from '@/stores/pipeline'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'
import ProductSelector from '@/components/agent/ProductSelector.vue'
import type { SelectedGoods } from '@/components/agent/ProductSelector.vue'
import { ElMessage } from 'element-plus'
import { useContentCalendar } from '@/composables/useContentCalendar'

const { upcomingPlans } = useContentCalendar()
const { t } = useI18n()

const CH_EMOJI: Record<string, string> = {
  '公众号': '📗', '微信公众号': '📗', '视频号': '📹',
  '抖音号': '🎵', '小红书': '📕', '快手号': '📱', '微博': '🌐',
}
const STATUS_LABEL: Record<string, string> = {
  idea: t('agentDashboard.statusIdea'),
  draft: t('agentDashboard.statusDraft'),
  scheduled: t('agentDashboard.statusScheduled'),
  published: t('agentDashboard.statusPublished'),
}

const agentStore = useTrendingStore()
const pipelineStore = usePipelineStore()
const chatRef = ref<InstanceType<typeof AgentChat>>()
const sentToCreative = ref(false)
const selectedProduct = ref<SelectedGoods | null>(null)

const agentContext = computed(() => {
  if (!selectedProduct.value) return {}
  const g = selectedProduct.value
  const lines = [`【内容主角商品】`]
  lines.push(`商品名称：${g.name}`)
  if (g.price) lines.push(`售价：¥${g.price}`)
  if (g.spec_name) lines.push(`规格：${g.spec_name}`)
  if (g.cate_name) lines.push(`分类：${g.cate_name}`)
  if (g.unit_name) lines.push(`单位：${g.unit_name}`)
  if (g.remark) lines.push(`备注/描述：${g.remark}`)
  lines.push(`\n请基于以上商品信息生成内容，文案中必须体现该商品的名称和核心卖点。`)
  return { productContext: lines.join('\n') }
})

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
  { emoji: '🔥', text: t('agentContentDept.prompt1') },
  { emoji: '📱', text: t('agentContentDept.prompt2') },
  { emoji: '✍️', text: t('agentContentDept.prompt3') },
  { emoji: '🎬', text: t('agentContentDept.prompt4') },
  { emoji: '💡', text: t('agentContentDept.prompt5') },
]

function sendPrompt(text: string) {
  chatRef.value?.sendQuickPrompt?.(text)
}

function sendToCreative() {
  const results = copywritingResults.value
  if (results.length === 0) return
  const latest = results[results.length - 1]
  const title = latest.topic || latest.content?.slice(0, 20) || t('agentContentDept.contentCopy')
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
  ElMessage.success(t('agentContentDept.sentToast'))
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
.product-selector-row {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: rgba(245,158,11,0.03);
}

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

.panel-link-sm {
  margin-left: auto; font-size: 10px; font-weight: 600;
  color: #7c3aed; text-decoration: none;
}
.panel-link-sm:hover { text-decoration: underline; }

.cal-mini-list { display: flex; flex-direction: column; gap: 6px; }
.cal-mini-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
.cal-mini-item:last-child { border-bottom: none; }
.cal-mini-ch { font-size: 16px; flex-shrink: 0; }
.cal-mini-body { flex: 1; min-width: 0; }
.cal-mini-title { font-size: 11px; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cal-mini-meta { font-size: 10px; color: #94a3b8; margin-top: 1px; }
.cal-mini-status { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
.cms-idea      { background: rgba(148,163,184,0.12); color: #64748b; }
.cms-draft     { background: rgba(245,158,11,0.1); color: #d97706; }
.cms-scheduled { background: rgba(124,58,237,0.1); color: #7c3aed; }
.cms-published { background: rgba(16,185,129,0.1); color: #059669; }
.cal-mini-empty { font-size: 11px; color: #94a3b8; padding: 8px 0; text-align: center; }
</style>
