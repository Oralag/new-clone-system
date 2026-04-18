<template>
  <div class="m-meeting-page">
    <!-- 立即开会返回栏 -->
    <div v-if="isInstant" class="m-meeting-back-bar">
      <button class="m-meeting-back-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="m-meeting-back-title">立即开会</span>
    </div>

    <!-- 立即开会全屏界面 -->
    <div v-if="isInstant" class="m-instant-meeting">
      <div class="m-instant-hero">
        <div class="m-instant-icon">🎙️</div>
        <div class="m-instant-title">发起视频会议</div>
        <div class="m-instant-sub">快速发起，链接一键分享</div>
      </div>

      <!-- 会议名称 -->
      <div class="m-instant-form">
        <div class="m-form-item">
          <label>会议名称</label>
          <input v-model="form.title" class="m-input" placeholder="如：销售部周会" />
        </div>
        <!-- 参会人 -->
        <div class="m-form-item">
          <label>邀请参会人</label>
          <div class="m-participant-tags">
            <span
              v-for="p in form.participants"
              :key="p.id"
              class="m-participant-tag"
              @click="removeParticipant(p.id)"
            >
              {{ p.name }} ×
            </span>
            <span class="m-participant-add" @click="showPicker = true">+ 添加</span>
          </div>
        </div>
      </div>

      <!-- 发起按钮 -->
      <div class="m-instant-actions">
        <button
          class="m-btn-primary m-instant-btn"
          :disabled="loading || !form.title.trim()"
          @click="createInstant"
        >
          {{ loading ? '创建中...' : '发起会议' }}
        </button>
      </div>
    </div>

    <!-- 非立即开会模式 - 正常会议室列表 -->
    <div v-if="!isInstant">
      <div class="m-meeting-hero">
        <div class="m-meeting-hero-icon">🎙️</div>
        <div class="m-meeting-hero-title">会议室</div>
        <div class="m-meeting-hero-sub">随时随地，发起或加入会议</div>
      </div>

      <!-- 三个主入口 -->
    <div class="m-meeting-cards">
      <div class="m-meeting-card m-meeting-card-blue" @click="router.push('/mobile/meeting/instant')">
        <div class="m-meeting-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        </div>
        <div class="m-meeting-card-content">
          <div class="m-meeting-card-title">立即开会</div>
          <div class="m-meeting-card-sub">快速发起，邀人加入</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" opacity="0.6">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      <div class="m-meeting-card m-meeting-card-orange" @click="showSchedule = true">
        <div class="m-meeting-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="m-meeting-card-content">
          <div class="m-meeting-card-title">预约会议</div>
          <div class="m-meeting-card-sub">设置时间，提前通知</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" opacity="0.6">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      <div class="m-meeting-card m-meeting-card-green" @click="showJoinByCode = true">
        <div class="m-meeting-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        </div>
        <div class="m-meeting-card-content">
          <div class="m-meeting-card-title">输入码加入</div>
          <div class="m-meeting-card-sub">外部人员，输入6位码加入</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" opacity="0.6">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <!-- 进行中会议 -->
    <div v-if="activeMeetings.length > 0" class="m-meeting-section">
      <div class="m-meeting-section-title">🔴 进行中</div>
      <div v-for="m in activeMeetings" :key="m.id" class="m-meeting-active-item" @click="router.push(`/mobile/meeting/${m.id}`)">
        <div class="m-meeting-active-dot" />
        <div class="m-meeting-active-info">
          <div class="m-meeting-active-title">{{ m.title }}</div>
          <div class="m-meeting-active-meta">
            主持人：{{ m.host_name }} · {{ m.participant_count || 0 }} 人参与
          </div>
        </div>
        <button class="m-meeting-join-btn">进入</button>
      </div>
    </div>

    <!-- 即将开始 -->
    <div v-if="upcomingMeetings.length > 0" class="m-meeting-section">
      <div class="m-meeting-section-title">🟡 即将开始</div>
      <div v-for="m in upcomingMeetings" :key="m.id" class="m-meeting-upcoming-item" @click="viewMeeting(m)">
        <div class="m-meeting-upcoming-time">{{ formatMeetingTime(m.scheduled_at) }}</div>
        <div class="m-meeting-upcoming-info">
          <div class="m-meeting-upcoming-title">{{ m.title }}</div>
          <div class="m-meeting-upcoming-meta">
            {{ m.participant_count || 0 }} 人参与 · {{ m.duration_minutes || 60 }}分钟
          </div>
        </div>
        <div class="m-meeting-upcoming-action">
          <button v-if="canStartEarly(m)" class="m-meeting-early-btn">提前进入</button>
        </div>
      </div>
    </div>

    <!-- 最近会议记录 -->
    <div class="m-meeting-section">
      <div class="m-meeting-section-title">📋 最近会议</div>
      <div v-if="recentMeetings.length === 0" class="m-meeting-empty">
        <div class="m-meeting-empty-icon">📹</div>
        <div class="m-meeting-empty-text">暂无会议记录</div>
      </div>
      <div v-else class="m-meeting-recent-list">
        <div v-for="m in recentMeetings" :key="m.id" class="m-meeting-recent-item" @click="viewMeeting(m)">
          <div class="m-meeting-recent-status" :class="m.status" />
          <div class="m-meeting-recent-info">
            <div class="m-meeting-recent-title">{{ m.title }}</div>
            <div class="m-meeting-recent-meta">{{ formatTime(m.scheduled_at || m.created_at) }}</div>
          </div>
          <span class="m-meeting-recent-status-text">{{ getStatusText(m.status) }}</span>
        </div>
      </div>
    </div>

    <!-- 预约弹窗 -->
    <div v-if="showSchedule" class="m-modal-mask" @click.self="showSchedule = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>预约会议</span>
          <button class="m-modal-close" @click="showSchedule = false">取消</button>
        </div>
        <div class="m-modal-body">
          <div class="m-form-item">
            <label>会议名称</label>
            <input v-model="form.title" class="m-input" placeholder="如：销售部周会" />
          </div>
          <div class="m-form-item">
            <label>开始时间</label>
            <input v-model="form.scheduled_at" class="m-input" type="datetime-local" />
          </div>
          <div class="m-form-item">
            <label>时长</label>
            <div class="m-form-tags">
              <span v-for="d in durations" :key="d.value" :class="['m-form-tag', form.duration === d.value ? 'active' : '']" @click="form.duration = d.value">{{ d.label }}</span>
            </div>
          </div>
          <div class="m-form-item">
            <label>参与人</label>
            <div class="m-participant-list">
              <div v-for="p in form.participants" :key="p.id" class="m-participant-chip">
                {{ p.name }}<button @click="removeParticipant(p.id)">×</button>
              </div>
              <button class="m-participant-add" @click="showPicker = true">+ 添加</button>
            </div>
          </div>
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-primary" :disabled="!form.title || !form.scheduled_at || loading" @click="createSchedule">
            {{ loading ? '创建中...' : '创建会议' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 参与人选择 -->
    <div v-if="showPicker" class="m-modal-mask" @click.self="showPicker = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>选择参与人</span>
          <button class="m-modal-close" @click="showPicker = false">确定</button>
        </div>
        <div class="m-modal-body">
          <div class="m-pick-search"><input v-model="pickSearch" class="m-input" placeholder="搜索成员..." /></div>
          <div class="m-pick-list">
            <div v-for="m in filteredMembers" :key="m.id" class="m-pick-item" @click="toggleParticipant(m)">
              <div class="m-pick-check">
                <svg v-if="isSelected(m.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="m-pick-avatar">{{ m.name?.[0] }}</div>
              <div class="m-pick-info">
                <div class="m-pick-name">{{ m.name }}</div>
                <div class="m-pick-sub">{{ m.position || '成员' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入码弹窗 -->
    <div v-if="showJoinByCode" class="m-modal-mask" @click.self="showJoinByCode = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>输入码加入</span>
          <button class="m-modal-close" @click="showJoinByCode = false">取消</button>
        </div>
        <div class="m-modal-body">
          <div class="m-code-input-wrap">
            <input v-model="joinCode" class="m-code-input" type="text" placeholder="输入6位会议码" maxlength="6" />
          </div>
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-primary" :disabled="joinCode.length < 6 || joining" @click="joinByCode">
            {{ joining ? '加入中...' : '加入会议' }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isInstant = computed(() => route.path.endsWith('/instant'))

const showSchedule = ref(false)
const showJoinByCode = ref(false)
const showPicker = ref(false)
const loading = ref(false)
const joining = ref(false)
const joinCode = ref('')
const pickSearch = ref('')
const allMembers = ref<any[]>([])
const recentMeetings = ref<any[]>([])
const activeMeetings = ref<any[]>([])
const upcomingMeetings = ref<any[]>([])

const durations = [
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
]

const form = ref({
  title: '',
  scheduled_at: '',
  duration: 60,
  participants: [] as any[],
})

const filteredMembers = computed(() => {
  if (!pickSearch.value) return allMembers.value
  const q = pickSearch.value.toLowerCase()
  return allMembers.value.filter((m: any) => m.name?.toLowerCase().includes(q))
})

function isSelected(id: number) {
  return form.value.participants.some((p: any) => p.id === id)
}

function toggleParticipant(m: any) {
  if (isSelected(m.id)) {
    form.value.participants = form.value.participants.filter((p: any) => p.id !== m.id)
  } else {
    form.value.participants.push(m)
  }
}

function removeParticipant(id: number) {
  form.value.participants = form.value.participants.filter((p: any) => p.id !== id)
}

async function createInstant() {
  loading.value = true
  try {
    const res = await http.post('/meeting/create', {
      title: form.value.title || `${authStore.userName}的会议`,
      type: 'instant',
      participants: form.value.participants.map((p: any) => p.id),
    })
    const meetingId = res?.data?.id ?? res?.data?.meeting?.id
    if (meetingId) {
      ElMessage.success('会议已创建')
      router.push(`/mobile/meeting/${meetingId}`)
    } else {
      ElMessage.error('创建失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '创建会议失败')
  } finally {
    loading.value = false
  }
}

async function createSchedule() {
  loading.value = true
  try {
    await http.post('/meeting/schedule', {
      title: form.value.title,
      scheduled_at: form.value.scheduled_at,
      duration_minutes: form.value.duration,
      participants: form.value.participants.map((p: any) => p.id),
    })
    ElMessage.success('预约成功')
    showSchedule.value = false
    form.value = { title: '', scheduled_at: '', duration: 60, participants: [] }
    loadMeetings()
  } catch (e: any) {
    ElMessage.error(e?.message || '预约失败')
  } finally {
    loading.value = false
  }
}

async function joinByCode() {
  joining.value = true
  try {
    const res = await http.post('/meeting/join-by-code', { code: joinCode.value })
    if (res?.data?.meeting) {
      router.push(`/mobile/meeting/${res.data.meeting.id}`)
    } else {
      ElMessage.error('会议码无效')
    }
  } catch {
    ElMessage.error('加入失败')
  } finally {
    joining.value = false
  }
}

function viewMeeting(m: any) {
  router.push(`/mobile/meeting/${m.id}`)
}

function canStartEarly(m: any) {
  const start = new Date(m.scheduled_at).getTime()
  const now = Date.now()
  return start - now < 30 * 60000 // 30分钟内可以提前进入
}

function formatMeetingTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  if (diff < 0) return '已过期'
  if (diff < 3600000) return `${Math.ceil(diff / 60000)}分钟后`
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getStatusText(status: string) {
  const map: Record<string, string> = { active: '进行中', ended: '已结束', scheduled: '已预约', cancelled: '已取消' }
  return map[status] || status
}

async function loadMeetings() {
  try {
    const res = await http.get('/meeting/recent', { params: { list_rows: 20 } })
    const all = res?.data?.rows ?? res?.rows ?? []
    activeMeetings.value = all.filter((m: any) => m.status === 'active')
    upcomingMeetings.value = all.filter((m: any) => m.status === 'scheduled')
    recentMeetings.value = all.filter((m: any) => m.status === 'ended').slice(0, 10)
  } catch { /* 忽略 */ }
}

async function loadMembers() {
  try {
    const res = await http.get('/admin/Admin/index', { params: { list_rows: 100 } })
    allMembers.value = res?.data?.rows ?? res?.rows ?? []
  } catch { /* 忽略 */ }
}

onMounted(() => {
  loadMeetings()
  loadMembers()
})
</script>

<style scoped>
.m-meeting-page {
  min-height: 100%;
  background: #f5f5f7;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.m-meeting-hero {
  background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%);
  padding: 28px 16px 24px;
  text-align: center;
}
.m-meeting-hero-icon { font-size: 40px; margin-bottom: 8px; }
.m-meeting-hero-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 4px; }
.m-meeting-hero-sub { font-size: 13px; color: rgba(255,255,255,0.65); }

.m-meeting-cards { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.m-meeting-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-meeting-card:active { opacity: 0.85; }
.m-meeting-card-blue { background: linear-gradient(135deg, #0071e3, #005bb5); }
.m-meeting-card-orange { background: linear-gradient(135deg, #f97316, #ea580c); }
.m-meeting-card-green { background: linear-gradient(135deg, #10b981, #059669); }
.m-meeting-card-icon {
  width: 48px; height: 48px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-meeting-card-content { flex: 1; }
.m-meeting-card-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 2px; }
.m-meeting-card-sub { font-size: 12px; color: rgba(255,255,255,0.7); }

.m-meeting-section { padding: 0 12px 12px; }
.m-meeting-section-title { font-size: 13px; font-weight: 700; color: #4e5969; margin-bottom: 8px; padding: 0 0 8px; }
.m-meeting-empty { text-align: center; padding: 24px 0; background: #fff; border-radius: 14px; }
.m-meeting-empty-icon { font-size: 32px; margin-bottom: 6px; }
.m-meeting-empty-text { font-size: 13px; color: #86909c; }

.m-meeting-active-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
}
.m-meeting-active-dot {
  width: 10px; height: 10px;
  background: #00b42a;
  border-radius: 50%;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.m-meeting-active-info { flex: 1; }
.m-meeting-active-title { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-meeting-active-meta { font-size: 12px; color: #86909c; margin-top: 2px; }
.m-meeting-join-btn {
  padding: 6px 16px;
  background: #00b42a;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.m-meeting-upcoming-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
}
.m-meeting-upcoming-time {
  font-size: 12px;
  font-weight: 700;
  color: #f97316;
  width: 70px;
  flex-shrink: 0;
  text-align: center;
  background: #fff7e6;
  padding: 4px 8px;
  border-radius: 8px;
}
.m-meeting-upcoming-info { flex: 1; }
.m-meeting-upcoming-title { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-meeting-upcoming-meta { font-size: 12px; color: #86909c; margin-top: 2px; }
.m-meeting-early-btn {
  padding: 5px 12px;
  background: #0071e3;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.m-meeting-recent-list { display: flex; flex-direction: column; gap: 0; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.m-meeting-recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f7f8fa;
  cursor: pointer;
}
.m-meeting-recent-item:last-child { border-bottom: none; }
.m-meeting-recent-item:active { background: #f5f5f7; }
.m-meeting-recent-status { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.m-meeting-recent-status.ended { background: #86909c; }
.m-meeting-recent-status.active { background: #00b42a; }
.m-meeting-recent-status.scheduled { background: #0071e3; }
.m-meeting-recent-info { flex: 1; }
.m-meeting-recent-title { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-meeting-recent-meta { font-size: 12px; color: #86909c; margin-top: 2px; }
.m-meeting-recent-status-text { font-size: 12px; color: #86909c; flex-shrink: 0; }

/* 弹窗 */
.m-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.m-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}
.m-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 16px; font-weight: 700; color: #1d2129;
  flex-shrink: 0;
}
.m-modal-close { border: none; background: transparent; color: #0071e3; font-size: 14px; cursor: pointer; }
.m-modal-body { flex: 1; overflow-y: auto; padding: 16px; }
.m-modal-footer { padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px); border-top: 1px solid #f2f3f5; flex-shrink: 0; }

.m-form-item { margin-bottom: 16px; }
.m-form-item label { display: block; font-size: 13px; font-weight: 600; color: #4e5969; margin-bottom: 8px; }
.m-input {
  width: 100%; height: 44px;
  background: #f5f5f7; border: 1px solid transparent;
  border-radius: 10px; padding: 0 12px;
  font-size: 15px; color: #1d2129; outline: none; box-sizing: border-box;
}
.m-input:focus { border-color: #0071e3; background: #fff; }
.m-form-tags { display: flex; gap: 8px; }
.m-form-tag {
  padding: 6px 14px; background: #f5f5f7; border-radius: 999px;
  font-size: 13px; color: #4e5969; cursor: pointer;
}
.m-form-tag.active { background: #0071e3; color: #fff; }
.m-participant-list { display: flex; flex-wrap: wrap; gap: 8px; }
.m-participant-chip {
  display: flex; align-items: center; gap: 4px;
  background: #e8f0fe; color: #0071e3;
  padding: 4px 10px; border-radius: 999px; font-size: 13px; font-weight: 500;
}
.m-participant-chip button { border: none; background: transparent; color: #0071e3; cursor: pointer; font-size: 16px; }
.m-participant-add {
  border: 1px dashed #0071e3; background: transparent; color: #0071e3;
  padding: 4px 10px; border-radius: 999px; font-size: 13px; cursor: pointer;
}

.m-code-input-wrap { display: flex; justify-content: center; }
.m-code-input {
  width: 200px; height: 56px;
  background: #f5f5f7;
  border: 2px solid transparent;
  border-radius: 14px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 8px;
  text-align: center;
  color: #1d2129;
  outline: none;
}
.m-code-input:focus { border-color: #0071e3; background: #fff; }

.m-pick-search { margin-bottom: 12px; }
.m-pick-list { display: flex; flex-direction: column; }
.m-pick-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; cursor: pointer; border-bottom: 1px solid #f2f3f5;
}
.m-pick-check {
  width: 20px; height: 20px; border: 2px solid #e5e6eb; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.m-pick-avatar {
  width: 36px; height: 36px; background: #0071e3; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 14px; font-weight: 700;
}
.m-pick-info { flex: 1; }
.m-pick-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-pick-sub { font-size: 12px; color: #86909c; }

.m-btn-primary {
  width: 100%; height: 48px;
  background: #0071e3; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600; color: #fff; cursor: pointer;
}
.m-btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }

/* ── 立即开会全屏 ── */
.m-instant-meeting {
  background: linear-gradient(160deg, #2E6BE6 0%, #1B4FCC 100%);
  min-height: 300px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.m-instant-hero { text-align: center; padding: 20px 0; }
.m-instant-icon { font-size: 48px; margin-bottom: 10px; }
.m-instant-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.m-instant-sub { font-size: 13px; color: rgba(255,255,255,0.7); }
.m-instant-form {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.m-instant-actions { padding: 8px 0 12px; }
.m-instant-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  background: #fff;
  color: #2E6BE6;
  cursor: pointer;
  transition: opacity 0.15s;
}
.m-instant-btn:disabled { opacity: 0.6; }
.m-instant-btn:not(:disabled):active { opacity: 0.85; }

/* ── 返回栏（立即开会） ── */
.m-meeting-back-bar {
  background: #2E6BE6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.m-meeting-back-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}
.m-meeting-back-title { font-size: 16px; font-weight: 700; color: #fff; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
