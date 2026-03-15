<template>
  <div class="dashboard">

    <!-- Captain（全局唯一） -->
    <CaptainBar />

    <!-- 部门 Tab -->
    <div class="dept-tabs">
      <div
        v-for="dept in departments"
        :key="dept.id"
        class="dept-tab"
        :class="{ active: activeDept === dept.id }"
        @click="activeDept = dept.id"
      >
        <span class="dept-tab-emoji">{{ dept.emoji }}</span>
        <span class="dept-tab-name">{{ dept.name }}</span>
        <span v-if="dept.active" class="dept-active-dot" />
      </div>
    </div>

    <!-- 当前部门 -->
    <div v-if="currentDept" class="dept-panel">

      <!-- 部门头 -->
      <div class="dept-header">
        <div class="dept-header-left">
          <span class="dept-big-emoji">{{ currentDept.emoji }}</span>
          <div>
            <div class="dept-name">{{ currentDept.name }}</div>
            <div class="dept-desc">{{ currentDept.desc }}</div>
          </div>
        </div>
        <div class="dept-header-right">
          <span class="dept-status-tag">{{ currentDept.members.length }} 名员工在岗</span>
        </div>
      </div>

      <!-- 员工卡片 -->
      <div class="members-grid">
        <div
          v-for="member in currentDept.members"
          :key="member.id"
          class="member-card"
          @click="$router.push(member.path)"
        >
          <div class="member-avatar" :style="{ background: member.color + '18', color: member.color }">
            {{ member.emoji }}
          </div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-role">{{ member.role }}</div>
          </div>
          <div class="member-status">
            <span class="online-dot" />
            在岗
          </div>
          <div class="member-action">开始任务 →</div>
        </div>
      </div>

      <!-- 部门讨论区 -->
      <div class="dept-discussion">
        <div class="discussion-header">
          <span class="section-label">💬 部门动态</span>
          <span class="discussion-count">{{ currentDeptMessages.length }} 条</span>
        </div>

        <div class="discussion-feed" ref="feedRef">
          <div
            v-for="(msg, i) in currentDeptMessages"
            :key="i"
            class="feed-item"
            :class="{ 'feed-system': msg.type === 'system', 'feed-user': msg.type === 'user' }"
          >
            <div class="feed-avatar" :style="msg.color ? { background: msg.color + '20', color: msg.color } : {}">
              {{ msg.emoji || '💬' }}
            </div>
            <div class="feed-body">
              <div class="feed-meta">
                <span class="feed-name">{{ msg.name }}</span>
                <span class="feed-time">{{ msg.time }}</span>
              </div>
              <div class="feed-text">{{ msg.text }}</div>
            </div>
          </div>
          <div v-if="currentDeptMessages.length === 0" class="discussion-empty">
            暂无动态，发起任务后员工会在这里汇报进展
          </div>
        </div>

        <!-- 用户发言 -->
        <div class="discussion-input-row">
          <input
            v-model="discussInput"
            class="discussion-input"
            :placeholder="`向${currentDept.name}下达指示...`"
            @keydown.enter="postDiscussion"
          />
          <button class="discussion-send" @click="postDiscussion" :disabled="!discussInput.trim()">发送</button>
        </div>
      </div>
    </div>

    <!-- 跨部门协作流 -->
    <div class="pipeline-card">
      <div class="pipeline-header">
        <span class="section-label">🔗 协作流水线</span>
        <button class="link-btn" @click="showNewPipeline = true">+ 新建任务流</button>
      </div>

      <div v-if="pipelines.length > 0" class="pipeline-list">
        <div v-for="(pl, i) in pipelines" :key="i" class="pipeline-row">
          <div class="pipeline-title">{{ pl.title }}</div>
          <div class="pipeline-steps">
            <div
              v-for="(step, si) in pl.steps"
              :key="si"
              class="pipeline-step"
              :class="step.status"
            >
              <span class="step-emoji">{{ step.emoji }}</span>
              <span class="step-name">{{ step.name }}</span>
              <span class="step-status-icon">
                {{ step.status === 'done' ? '✅' : step.status === 'active' ? '🔄' : '⏳' }}
              </span>
              <div v-if="si < pl.steps.length - 1" class="step-arrow">→</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="pipeline-empty">
        <div style="font-size:28px;margin-bottom:8px">🔗</div>
        <div style="font-size:13px;font-weight:600;color:#1d1d1f;margin-bottom:4px">还没有协作任务</div>
        <div style="font-size:12px;color:rgba(29,29,31,0.4)">通过 Captain 发令或手动创建跨部门流水线</div>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="stats-row">
      <div v-for="s in stats" :key="s.label" class="stat-card">
        <div class="stat-emoji">{{ s.emoji }}</div>
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTrendingStore } from '@/stores/agent'
import CaptainBar from '@/components/CaptainBar.vue'

const router = useRouter()
const agentStore = useTrendingStore()

// ── 部门定义 ──────────────────────────────────────────────────────────────────
const departments = ref([
  {
    id: 'content',
    name: '内容部',
    emoji: '✍️',
    desc: '文案、海报、视频全链路内容生产',
    active: true,
    members: [
      { id: 'copywriter', name: '文案专员', role: '平台爆款文案 · 标题优化', emoji: '✍️', color: '#f59e0b', path: '/agent/copywriting' },
      { id: 'poster',     name: '设计专员', role: '海报方案 · 视觉创意',     emoji: '🎨', color: '#ec4899', path: '/agent/poster' },
      { id: 'video',      name: '视频专员', role: '短视频脚本 · 分镜设计',   emoji: '🎬', color: '#ef4444', path: '/agent/video' },
    ],
  },
  {
    id: 'brand',
    name: '品牌部',
    emoji: '💎',
    desc: '品牌战略、调性把控、竞品分析',
    active: true,
    members: [
      { id: 'brand', name: '品牌专员', role: '品牌策略 · 内容调性审核', emoji: '💎', color: '#8b5cf6', path: '/agent/brand' },
    ],
  },
  {
    id: 'publish',
    name: '发布部',
    emoji: '🚀',
    desc: '多平台排期、发布计划、数据复盘',
    active: true,
    members: [
      { id: 'publisher', name: '发布专员', role: '多平台排期 · 发布计划', emoji: '🚀', color: '#10b981', path: '/agent/publish' },
    ],
  },
  {
    id: 'intel',
    name: '情报部',
    emoji: '📈',
    desc: '热点追踪、趋势分析、选题建议',
    active: true,
    members: [
      { id: 'trend', name: '趋势专员', role: '热点分析 · 选题方向', emoji: '📈', color: '#06b6d4', path: '/agent/trending' },
    ],
  },
])

const activeDept = ref('content')
const currentDept = computed(() => departments.value.find(d => d.id === activeDept.value)!)

// ── 部门讨论区 ────────────────────────────────────────────────────────────────
interface FeedMsg {
  type: 'agent' | 'user' | 'system'
  name: string
  emoji?: string
  color?: string
  text: string
  time: string
}

const deptDiscussions = ref<Record<string, FeedMsg[]>>({
  content: [
    { type: 'agent', name: '趋势专员', emoji: '📈', color: '#06b6d4', text: '抓到今日小红书热门话题：#数字游牧生活，建议内容部跟进。', time: '10:32' },
    { type: 'agent', name: '文案专员', emoji: '✍️', color: '#f59e0b', text: '收到，已生成3个版本文案，请设计专员确认视觉风格。', time: '10:35' },
    { type: 'agent', name: '设计专员', emoji: '🎨', color: '#ec4899', text: '视觉方案已出，走莫兰迪色系。视频专员可以按这个调性出分镜。', time: '10:41' },
  ],
  brand: [
    { type: 'agent', name: '品牌专员', emoji: '💎', color: '#8b5cf6', text: '本周内容整体调性偏向年轻化，符合品牌战略方向。继续保持。', time: '09:15' },
  ],
  publish: [
    { type: 'agent', name: '发布专员', emoji: '🚀', color: '#10b981', text: '本周发布计划：周二小红书，周四抖音，周六微信。等内容部确认后排期。', time: '09:00' },
  ],
  intel: [
    { type: 'agent', name: '趋势专员', emoji: '📈', color: '#06b6d4', text: '今日抖音TOP3：#春日穿搭 #数字游牧 #远程办公。建议优先跟进第2个。', time: '08:55' },
  ],
})

const currentDeptMessages = computed(() => deptDiscussions.value[activeDept.value] || [])

const discussInput = ref('')
const feedRef = ref<HTMLDivElement>()

function getNow() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function postDiscussion() {
  const text = discussInput.value.trim()
  if (!text) return
  if (!deptDiscussions.value[activeDept.value]) deptDiscussions.value[activeDept.value] = []
  deptDiscussions.value[activeDept.value].push({
    type: 'user',
    name: '我',
    emoji: '👤',
    text,
    time: getNow(),
  })
  discussInput.value = ''
  nextTick(() => {
    if (feedRef.value) feedRef.value.scrollTop = feedRef.value.scrollHeight
  })
}

// ── Captain 指令（由 CaptainBar 处理，此处预留流水线联动） ──────────────────

// ── 协作流水线 ────────────────────────────────────────────────────────────────
interface PipelineStep {
  name: string
  emoji: string
  status: 'done' | 'active' | 'pending'
}
interface Pipeline {
  title: string
  steps: PipelineStep[]
}
const pipelines = ref<Pipeline[]>([])
const showNewPipeline = ref(false)

// ── 数据统计 ──────────────────────────────────────────────────────────────────
const stats = computed(() => [
  { emoji: '🔥', value: Object.values(agentStore.trending).reduce((s, a) => s + a.length, 0) || 0, label: '已抓取热搜' },
  { emoji: '✍️', value: agentStore.copywritingResults.length || 0, label: '已生成文案' },
  { emoji: '🎬', value: agentStore.videoResults.length || 0, label: '已生成视频' },
  { emoji: '🚀', value: agentStore.history.filter(h => h.status === 'published').length || 0, label: '已发布内容' },
])
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}

/* ── 部门 Tab ── */
.dept-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dept-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: rgba(29,29,31,0.5);
  transition: all 0.2s;
  position: relative;
}
.dept-tab:hover { border-color: rgba(0,0,0,0.15); color: #1d1d1f; }
.dept-tab.active {
  background: #1d1d1f;
  color: #fff;
  border-color: transparent;
}
.dept-tab-emoji { font-size: 14px; }
.dept-tab-name { letter-spacing: -0.01em; }
.dept-active-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #34d399;
  flex-shrink: 0;
}
.dept-tab.active .dept-active-dot { background: rgba(255,255,255,0.6); }

/* ── 部门面板 ── */
.dept-panel {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 18px;
  overflow: hidden;
}
.dept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.dept-header-left { display: flex; align-items: center; gap: 12px; }
.dept-big-emoji { font-size: 28px; }
.dept-name { font-size: 16px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em; }
.dept-desc { font-size: 12px; color: rgba(29,29,31,0.4); margin-top: 2px; }
.dept-status-tag {
  font-size: 11px; font-weight: 600;
  background: rgba(52,211,153,0.1); color: #16a34a;
  padding: 4px 10px; border-radius: 20px;
}

/* 员工卡片 */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  padding: 16px 22px;
}
.member-card {
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.member-card:hover {
  border-color: rgba(0,0,0,0.14);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}
.member-avatar {
  width: 40px; height: 40px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.member-name { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.member-role { font-size: 11px; color: rgba(29,29,31,0.4); line-height: 1.4; }
.member-status {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #16a34a; font-weight: 600;
}
.online-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399;
  flex-shrink: 0;
}
.member-action {
  font-size: 11px; font-weight: 600;
  color: rgba(29,29,31,0.3);
  transition: color 0.15s;
}
.member-card:hover .member-action { color: #1d1d1f; }

/* 讨论区 */
.dept-discussion {
  border-top: 1px solid rgba(0,0,0,0.05);
  padding: 16px 22px;
}
.discussion-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.section-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: rgba(29,29,31,0.35);
}
.discussion-count {
  font-size: 11px; color: rgba(29,29,31,0.3);
}
.discussion-feed {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.feed-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.feed-system .feed-body {
  background: rgba(99,102,241,0.06);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 10px;
  padding: 8px 12px;
  flex: 1;
}
.feed-user .feed-body {
  background: rgba(29,29,31,0.04);
  border-radius: 10px;
  padding: 8px 12px;
  flex: 1;
}
.feed-avatar {
  width: 28px; height: 28px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  background: rgba(0,0,0,0.05);
  flex-shrink: 0;
}
.feed-body { flex: 1; }
.feed-meta {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 3px;
}
.feed-name { font-size: 12px; font-weight: 700; color: #1d1d1f; }
.feed-time { font-size: 11px; color: rgba(29,29,31,0.3); }
.feed-text { font-size: 12.5px; color: rgba(29,29,31,0.7); line-height: 1.5; }
.discussion-empty {
  font-size: 12px; color: rgba(29,29,31,0.3);
  text-align: center; padding: 20px 0;
}
.discussion-input-row { display: flex; gap: 8px; }
.discussion-input {
  flex: 1;
  background: #f7f8fa;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 13px;
  color: #1d1d1f;
  outline: none;
  transition: border-color 0.15s;
}
.discussion-input:focus { border-color: rgba(0,0,0,0.2); background: #fff; }
.discussion-send {
  background: #1d1d1f;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.discussion-send:disabled { opacity: 0.4; cursor: not-allowed; }
.discussion-send:not(:disabled):hover { opacity: 0.8; }

/* ── 协作流水线 ── */
.pipeline-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 18px;
  padding: 20px 22px;
}
.pipeline-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.link-btn {
  font-size: 12px; font-weight: 600; color: #0071e3;
  background: none; border: none; cursor: pointer; padding: 0;
}
.link-btn:hover { opacity: 0.7; }
.pipeline-list { display: flex; flex-direction: column; gap: 12px; }
.pipeline-row {
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 14px 16px;
}
.pipeline-title { font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 10px; }
.pipeline-steps {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.pipeline-step {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px; font-weight: 600;
  background: #f7f8fa;
  color: rgba(29,29,31,0.45);
}
.pipeline-step.done { background: rgba(52,211,153,0.1); color: #16a34a; }
.pipeline-step.active { background: rgba(99,102,241,0.1); color: #4f46e5; }
.step-arrow { color: rgba(29,29,31,0.2); font-size: 12px; margin-left: 6px; }
.pipeline-empty { text-align: center; padding: 20px 0; }

/* ── 数据统计 ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.stat-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 18px 16px;
  text-align: center;
}
.stat-emoji { font-size: 20px; margin-bottom: 6px; }
.stat-value {
  font-size: 30px; font-weight: 800; color: #1d1d1f;
  letter-spacing: -0.04em; line-height: 1; margin-bottom: 5px;
}
.stat-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: rgba(29,29,31,0.28);
}

/* Dark mode */
:global([data-theme='dark']) .dept-panel,
:global([data-theme='dark']) .pipeline-card,
:global([data-theme='dark']) .stat-card { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .dept-tab { background: #111827; border-color: #1f2937; color: #64748b; }
:global([data-theme='dark']) .dept-tab.active { background: #f8fafc; color: #1d1d1f; }
:global([data-theme='dark']) .member-card { border-color: #1f2937; }
:global([data-theme='dark']) .member-card:hover { background: #1a2332; }
:global([data-theme='dark']) .dept-name,
:global([data-theme='dark']) .member-name,
:global([data-theme='dark']) .pipeline-title,
:global([data-theme='dark']) .stat-value { color: #f8fafc; }
:global([data-theme='dark']) .discussion-input { background: #1a2332; border-color: #2d3f55; color: #f8fafc; }
:global([data-theme='dark']) .discussion-send { background: #f8fafc; color: #1d1d1f; }
:global([data-theme='dark']) .pipeline-step { background: #1a2332; }

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .members-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
