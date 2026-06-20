<template>
  <div class="bulletin-page">

    <!-- 顶部标题 -->
    <div class="bulletin-header">
      <div class="bulletin-header-left">
        <div class="bulletin-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round">
            <rect x="2" y="3" width="16" height="14" rx="2.5"/>
            <path d="M2 7h16M6 10.5h8M6 13h5"/>
          </svg>
        </div>
        <div>
          <h2 class="bulletin-title">{{ t('agentBulletin.title') }}</h2>
          <div class="bulletin-subtitle">{{ t('agentBulletin.subtitle') }}</div>
        </div>
      </div>
      <div class="bulletin-actions">
        <button v-if="meetingStore.topic" class="action-btn" @click="router.push('/agent/meeting')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="1" y="2" width="11" height="9" rx="2"/><path d="M4 7h5"/>
          </svg>
          {{ t('agentBulletin.backMeeting') }}
        </button>
        <button v-if="agentStore.flowResults.length > 0" class="action-btn primary" @click="router.push('/agent/publish')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M6.5 1v9M3.5 4L6.5 1l3 3"/><path d="M1 10v2h11v-2"/>
          </svg>
          {{ t('agentBulletin.goPublish') }}
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!meetingStore.topic && agentStore.flowResults.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">{{ t('agentBulletin.emptyTitle') }}</div>
      <div class="empty-desc">{{ t('agentBulletin.emptyDesc') }}</div>
      <button class="goto-meeting-btn" @click="router.push('/agent/meeting')">{{ t('agentBulletin.gotoMeeting') }}</button>
    </div>

    <template v-else>

      <!-- 会议决议卡片 -->
      <div v-if="meetingStore.topic" class="section-card">
        <div class="section-hd">
          <div class="section-hd-left">
            <span class="section-icon">🎯</span>
            <span class="section-title">{{ t('agentBulletin.recentDecision') }}</span>
            <span class="phase-pill" :class="'pill-' + meetingStore.phase">{{ phaseLabel }}</span>
          </div>
          <span class="section-topic">{{ meetingStore.topic }}</span>
        </div>

        <!-- 任务分配状态 -->
        <div v-if="Object.keys(meetingStore.assignedTasks).length > 0" class="task-grid">
          <div
            v-for="(task, agentId) in meetingStore.assignedTasks"
            :key="agentId"
            class="task-card"
            :style="{ '--tc': STAFF[agentId as keyof typeof STAFF]?.color || '#6366f1' }"
          >
            <div class="task-card-hd">
              <span class="task-emoji">{{ STAFF[agentId as keyof typeof STAFF]?.emoji || '⚙️' }}</span>
              <span class="task-agent">{{ STAFF[agentId as keyof typeof STAFF]?.title || agentId }}</span>
              <span class="task-status-dot" :class="execClass(agentId)"></span>
            </div>
            <div class="task-desc">{{ task }}</div>
            <div class="task-status-label" :class="execClass(agentId)">
              {{ execLabel(agentId) }}
            </div>
          </div>
        </div>

        <!-- 会议纪要 -->
        <div v-if="meetingStore.summary" class="summary-block">
          <div class="summary-label">{{ t('agentBulletin.summary') }}</div>
          <div class="summary-text">{{ meetingStore.summary }}</div>
        </div>
      </div>

      <!-- 内容产出 -->
      <div v-if="agentStore.flowResults.length > 0" class="section-card">
        <div class="section-hd">
          <div class="section-hd-left">
            <span class="section-icon">📦</span>
            <span class="section-title">{{ t('agentBulletin.output') }}</span>
            <span class="count-badge">{{ agentStore.flowResults.length }} {{ t('common.items') }}</span>
          </div>
          <button class="goto-publish-link" @click="router.push('/agent/publish')">
            {{ t('agentBulletin.goPublishDept') }} →
          </button>
        </div>

        <div class="output-grid">
          <div
            v-for="(item, idx) in agentStore.flowResults"
            :key="idx"
            class="output-card"
          >
            <div class="output-hd">
              <span class="output-type" :class="item.type">{{ typeLabel(item.type) }}</span>
              <span class="output-platform">{{ item.platformName }}</span>
            </div>
            <div class="output-topic">{{ item.topic }}</div>
            <div class="output-preview">{{ item.content.slice(0, 120) }}{{ item.content.length > 120 ? '…' : '' }}</div>
            <div class="output-ft">
              <button class="output-btn" @click="copyText(item.content)">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                  <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><path d="M2 8.5V1.5h7"/>
                </svg>
                {{ t('common.copy') }}
              </button>
              <button class="output-btn primary" @click="router.push('/agent/publish')">
                {{ t('common.view') }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useMeetingStore } from '@/stores/meeting'
import { useTrendingStore } from '@/stores/agent'

const router = useRouter()
const meetingStore = useMeetingStore()
const agentStore = useTrendingStore()
const { t } = useI18n()

const STAFF: Record<string, { title: string; emoji: string; color: string }> = {
  captain:    { title: t('agentBulletin.staffCaptain'), emoji: '🎯', color: '#6366f1' },
  copywriter: { title: t('agentBulletin.staffCopywriter'), emoji: '✍️', color: '#f59e0b' },
  video:      { title: t('agentBulletin.staffVideo'), emoji: '🎬', color: '#ef4444' },
  poster:     { title: t('agentBulletin.staffPoster'), emoji: '🎨', color: '#ec4899' },
  brand:      { title: t('agentBulletin.staffBrand'), emoji: '💎', color: '#8b5cf6' },
  trend:      { title: t('agentBulletin.staffTrend'), emoji: '📈', color: '#06b6d4' },
  publisher:  { title: t('agentBulletin.staffPublisher'), emoji: '🚀', color: '#10b981' },
}

const phaseLabel = computed(() => {
  const map: Record<string, string> = {
    idle: t('agentBulletin.phaseIdle'),
    opening: t('agentBulletin.phaseOpening'),
    discussing: t('agentBulletin.phaseDiscussing'),
    summarizing: t('agentBulletin.phaseSummarizing'),
    executing: t('agentBulletin.phaseExecuting'),
    done: t('agentBulletin.phaseDone'),
  }
  return map[meetingStore.phase] || ''
})

function execClass(agentId: string) {
  const s = meetingStore.executionStatus[agentId]
  return s ? `st-${s}` : 'st-pending'
}

function execLabel(agentId: string) {
  const s = meetingStore.executionStatus[agentId]
  if (!s || s === 'pending') return t('agentBulletin.execPending')
  if (s === 'running') return t('agentBulletin.execRunning')
  if (s === 'done') return t('agentBulletin.execDone')
  return t('agentBulletin.execError')
}

function typeLabel(type: string) {
  return {
    copy: t('agentBulletin.typeCopy'),
    poster: t('agentBulletin.typePoster'),
    video_script: t('agentBulletin.typeVideoScript'),
  }[type] ?? type
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
  ElMessage.success(t('agentBulletin.copied'))
}
</script>

<style scoped>
.bulletin-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}

/* 顶部 */
.bulletin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid #6366f1;
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  gap: 12px;
  flex-wrap: wrap;
}
.bulletin-header-left { display: flex; align-items: center; gap: 12px; }
.bulletin-icon {
  width: 40px; height: 40px; border-radius: 11px;
  background: rgba(99,102,241,0.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.bulletin-title { font-size: 17px; font-weight: 800; color: #1d1d1f; margin: 0 0 3px; letter-spacing: -0.03em; }
.bulletin-subtitle { font-size: 11px; color: rgba(29,29,31,0.4); }

.bulletin-actions { display: flex; gap: 8px; flex-shrink: 0; }
.action-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 10px;
  background: #f5f5f7; font-size: 12px; font-weight: 600;
  color: rgba(29,29,31,0.7); cursor: pointer; font-family: inherit;
  transition: all 0.15s; text-decoration: none;
}
.action-btn:hover { background: #ebebed; color: #1d1d1f; }
.action-btn.primary { background: #6366f1; color: #fff; border-color: transparent; }
.action-btn.primary:hover { background: #4f46e5; }

/* 空状态 */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px; text-align: center;
  background: #fff; border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-title { font-size: 17px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px; }
.empty-desc { font-size: 13px; color: rgba(29,29,31,0.4); margin-bottom: 20px; max-width: 320px; }
.goto-meeting-btn {
  padding: 10px 24px; background: #6366f1; color: #fff;
  border: none; border-radius: 10px; font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: background 0.15s;
}
.goto-meeting-btn:hover { background: #4f46e5; }

/* 区块卡片 */
.section-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  overflow: hidden;
}
.section-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  flex-wrap: wrap; gap: 8px;
}
.section-hd-left { display: flex; align-items: center; gap: 8px; }
.section-icon { font-size: 16px; }
.section-title { font-size: 14px; font-weight: 700; color: #1d1d1f; }
.section-topic {
  font-size: 12px; color: rgba(29,29,31,0.5);
  max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.phase-pill {
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  background: rgba(0,0,0,0.05); color: rgba(29,29,31,0.4);
}
.pill-executing { background: rgba(99,102,241,0.1); color: #6366f1; }
.pill-done { background: rgba(16,185,129,0.1); color: #10b981; }
.pill-discussing, .pill-opening { background: rgba(99,102,241,0.1); color: #6366f1; }
.pill-summarizing { background: rgba(245,158,11,0.1); color: #f59e0b; }

.count-badge {
  font-size: 10px; font-weight: 700;
  background: rgba(99,102,241,0.1); color: #6366f1;
  padding: 2px 8px; border-radius: 20px;
}

.goto-publish-link {
  font-size: 12px; font-weight: 600; color: #6366f1;
  background: none; border: none; cursor: pointer; font-family: inherit;
}
.goto-publish-link:hover { opacity: 0.7; }

/* 任务卡片网格 */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px 18px;
}
.task-card {
  background: #f9f9fb;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 14px;
  border-left: 3px solid var(--tc, #6366f1);
  display: flex; flex-direction: column; gap: 8px;
}
.task-card-hd { display: flex; align-items: center; gap: 7px; }
.task-emoji { font-size: 16px; }
.task-agent { font-size: 12px; font-weight: 700; color: #1d1d1f; flex: 1; }
.task-status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(0,0,0,0.15);
}
.task-status-dot.st-running { background: #6366f1; animation: pulse 1.2s ease-in-out infinite; }
.task-status-dot.st-done { background: #10b981; }
.task-status-dot.st-error { background: #ef4444; }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

.task-desc { font-size: 12px; color: rgba(29,29,31,0.55); line-height: 1.5; }
.task-status-label {
  font-size: 10px; font-weight: 700;
  align-self: flex-start;
  padding: 2px 8px; border-radius: 10px;
  background: rgba(0,0,0,0.05); color: rgba(29,29,31,0.4);
}
.task-status-label.st-running { background: rgba(99,102,241,0.1); color: #6366f1; }
.task-status-label.st-done { background: rgba(16,185,129,0.1); color: #10b981; }
.task-status-label.st-error { background: rgba(239,68,68,0.1); color: #ef4444; }

/* 会议纪要 */
.summary-block {
  padding: 14px 18px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.summary-label { font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.35); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.summary-text { font-size: 12.5px; color: #1d1d1f; line-height: 1.7; white-space: pre-wrap; }

/* 内容产出网格 */
.output-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  padding: 16px 18px;
}
.output-card {
  background: #f9f9fb;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 14px;
  display: flex; flex-direction: column; gap: 8px;
  transition: border-color 0.15s;
}
.output-card:hover { border-color: rgba(99,102,241,0.2); }

.output-hd { display: flex; align-items: center; gap: 8px; }
.output-type {
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 6px;
}
.output-type.copy { background: rgba(99,102,241,0.1); color: #6366f1; }
.output-type.poster { background: rgba(16,185,129,0.1); color: #10b981; }
.output-type.video_script { background: rgba(239,68,68,0.1); color: #ef4444; }
.output-platform { font-size: 11px; color: rgba(29,29,31,0.4); }

.output-topic { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.output-preview {
  font-size: 12px; color: rgba(29,29,31,0.5); line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
  overflow: hidden;
}

.output-ft { display: flex; gap: 6px; margin-top: auto; padding-top: 4px; }
.output-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 7px;
  background: #fff; border: 1px solid rgba(0,0,0,0.1);
  font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.6);
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.output-btn:hover { background: #f0f0f2; color: #1d1d1f; }
.output-btn.primary { background: #6366f1; color: #fff; border-color: transparent; }
.output-btn.primary:hover { background: #4f46e5; }

/* 响应式 */
@media (max-width: 768px) {
  .bulletin-header { flex-direction: column; align-items: flex-start; }
  .task-grid { grid-template-columns: 1fr; }
  .output-grid { grid-template-columns: 1fr; }
}
</style>
