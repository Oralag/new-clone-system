<template>
  <div class="m-meeting-pinned">
    <div class="m-meeting-header">
      <div class="m-meeting-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2">
          <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/>
        </svg>
        <span>会议室</span>
      </div>
      <button class="m-meeting-more" @click="router.push('/mobile/meeting')">全部 ›</button>
    </div>

    <!-- 进行中会议 -->
    <div v-if="activeMeeting" class="m-meeting-active" @click="joinMeeting">
      <div class="m-meeting-active-dot" />
      <div class="m-meeting-active-info">
        <div class="m-meeting-active-title">{{ activeMeeting.title }}</div>
        <div class="m-meeting-active-sub">
          <span v-for="p in (activeMeeting.participants || []).slice(0, 3)" :key="p.user_id" class="m-meeting-participant-tag">
            {{ p.user_name }}
          </span>
          <span v-if="(activeMeeting.participants || []).length > 3">+{{ activeMeeting.participants.length - 3 }}</span>
        </div>
      </div>
      <div class="m-meeting-join-btn">进入</div>
    </div>

    <!-- 三个入口 -->
    <div class="m-meeting-actions">
      <div class="m-meeting-action" @click="handleInstantMeeting">
        <div class="m-meeting-action-icon" style="background: rgba(0,113,227,0.1)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        </div>
        <span>立即开会</span>
      </div>
      <div class="m-meeting-action" @click="showSchedule = true">
        <div class="m-meeting-action-icon" style="background: rgba(249,115,22,0.1)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span>预约会议</span>
      </div>
      <div class="m-meeting-action" @click="showJoinByCode = true">
        <div class="m-meeting-action-icon" style="background: rgba(5,150,105,0.1)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        </div>
        <span>输入码加入</span>
      </div>
    </div>

    <!-- 最近会议 -->
    <div v-if="recentMeetings.length > 0" class="m-meeting-recent">
      <div v-for="m in recentMeetings" :key="m.id" class="m-meeting-recent-item" @click="viewMeeting(m)">
        <div class="m-meeting-recent-dot" :class="m.status" />
        <div class="m-meeting-recent-info">
          <div class="m-meeting-recent-title">{{ m.title }}</div>
          <div class="m-meeting-recent-time">{{ formatTime(m.scheduled_at || m.created_at) }}</div>
        </div>
        <div class="m-meeting-recent-status">
          <span v-if="m.status === 'active'" class="m-meeting-status-active">进行中</span>
          <span v-else-if="m.status === 'ended'" class="m-meeting-status-ended">已结束</span>
          <span v-else class="m-meeting-status-scheduled">已预约</span>
        </div>
      </div>
    </div>

    <!-- 预约会议弹窗 -->
    <div v-if="showSchedule" class="m-modal-mask" @click.self="showSchedule = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>预约会议</span>
          <button class="m-modal-close" @click="showSchedule = false">取消</button>
        </div>
        <div class="m-modal-body">
          <div class="m-form-item">
            <label>会议名称</label>
            <input v-model="scheduleForm.title" class="m-input" placeholder="如：销售部周会" />
          </div>
          <div class="m-form-item">
            <label>开始时间</label>
            <input v-model="scheduleForm.scheduled_at" class="m-input" type="datetime-local" />
          </div>
          <div class="m-form-item">
            <label>时长</label>
            <div class="m-form-tags">
              <span v-for="d in durations" :key="d.value" :class="['m-form-tag', scheduleForm.duration === d.value ? 'active' : '']" @click="scheduleForm.duration = d.value">{{ d.label }}</span>
            </div>
          </div>
          <div class="m-form-item">
            <label>参与人</label>
            <div class="m-participant-list">
              <div v-for="p in scheduleForm.participants" :key="p.id" class="m-participant-chip">
                {{ p.name }}
                <button class="m-chip-remove" @click="removeParticipant(p.id)">×</button>
              </div>
              <button class="m-participant-add" @click="showParticipantPicker = true">+ 添加</button>
            </div>
          </div>
          <div class="m-form-item">
            <label>议题（可选）</label>
            <textarea v-model="scheduleForm.agenda" class="m-textarea" placeholder="本次会议议题..." rows="3" />
          </div>
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-primary" :disabled="!scheduleForm.title || !scheduleForm.scheduled_at || scheduleLoading" @click="createScheduledMeeting">
            {{ scheduleLoading ? '创建中...' : '创建会议' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 输入码加入弹窗 -->
    <div v-if="showJoinByCode" class="m-modal-mask" @click.self="showJoinByCode = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>输入码加入</span>
          <button class="m-modal-close" @click="showJoinByCode = false">取消</button>
        </div>
        <div class="m-modal-body">
          <div class="m-form-item">
            <label>会议码</label>
            <input v-model="joinCode" class="m-input" type="text" placeholder="请输入6位会议码" maxlength="6" />
          </div>
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-primary" :disabled="joinCode.length < 6 || joinLoading" @click="joinByCode">
            {{ joinLoading ? '加入中...' : '加入会议' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 参与人选择器 -->
    <div v-if="showParticipantPicker" class="m-modal-mask" @click.self="showParticipantPicker = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>选择参与人</span>
          <button class="m-modal-close" @click="showParticipantPicker = false">确定</button>
        </div>
        <div class="m-modal-body">
          <div class="m-pick-search">
            <input v-model="pickSearch" class="m-input" placeholder="搜索成员..." />
          </div>
          <div class="m-pick-list">
            <div v-for="m in filteredMembers" :key="m.id" class="m-pick-item" @click="toggleParticipant(m)">
              <div class="m-pick-check">
                <svg v-if="isSelected(m.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="m-pick-avatar">{{ m.name?.[0] || '?' }}</div>
              <div class="m-pick-info">
                <div class="m-pick-name">{{ m.name }}</div>
                <div class="m-pick-role">{{ m.dept || m.role || '成员' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { ElMessage } from 'element-plus'

const router = useRouter()

const activeMeeting = ref<any>(null)
const recentMeetings = ref<any[]>([])
const showSchedule = ref(false)
const showJoinByCode = ref(false)
const showParticipantPicker = ref(false)
const scheduleLoading = ref(false)
const joinLoading = ref(false)
const joinCode = ref('')
const pickSearch = ref('')
const allMembers = ref<any[]>([])

const durations = [
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
]

const scheduleForm = ref({
  title: '',
  scheduled_at: '',
  duration: 60,
  participants: [] as any[],
  agenda: '',
})

const filteredMembers = computed(() => {
  if (!pickSearch.value) return allMembers.value
  const q = pickSearch.value.toLowerCase()
  return allMembers.value.filter((m: any) => m.name?.toLowerCase().includes(q))
})

function isSelected(id: number) {
  return scheduleForm.value.participants.some((p: any) => p.id === id)
}

function toggleParticipant(m: any) {
  if (isSelected(m.id)) {
    scheduleForm.value.participants = scheduleForm.value.participants.filter((p: any) => p.id !== m.id)
  } else {
    scheduleForm.value.participants.push(m)
  }
}

function removeParticipant(id: number) {
  scheduleForm.value.participants = scheduleForm.value.participants.filter((p: any) => p.id !== id)
}

async function createScheduledMeeting() {
  scheduleLoading.value = true
  try {
    await http.post('/meeting/schedule', {
      title: scheduleForm.value.title,
      scheduled_at: scheduleForm.value.scheduled_at,
      duration_minutes: scheduleForm.value.duration,
      participants: scheduleForm.value.participants.map((p: any) => p.id),
      agenda: scheduleForm.value.agenda,
    })
    ElMessage.success('会议预约成功')
    showSchedule.value = false
    loadMeetings()
  } catch (e: any) {
    ElMessage.error(e?.message || '预约失败')
  } finally {
    scheduleLoading.value = false
  }
}

async function joinByCode() {
  joinLoading.value = true
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
    joinLoading.value = false
  }
}

function handleInstantMeeting() {
  router.push('/mobile/meeting/instant')
}

function joinMeeting() {
  if (activeMeeting.value) {
    router.push(`/mobile/meeting/${activeMeeting.value.id}`)
  }
}

function viewMeeting(m: any) {
  router.push(`/mobile/meeting/${m.id}`)
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadMeetings() {
  try {
    const res = await http.get('/meeting/recent', { params: { list_rows: 5 } })
    const meetings = res?.data?.rows ?? res?.rows ?? []
    recentMeetings.value = meetings
    activeMeeting.value = meetings.find((m: any) => m.status === 'active') || null
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
.m-meeting-pinned {
  background: #fff;
  margin: 12px 12px 0;
  border-radius: 16px;
  padding: 14px 14px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.m-meeting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.m-meeting-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1d2129;
}
.m-meeting-more {
  border: none;
  background: transparent;
  color: #86909c;
  font-size: 13px;
  cursor: pointer;
}

/* 进行中 */
.m-meeting-active {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff7e6;
  border: 1px solid #ffe59e;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-meeting-active:active { background: #fff3cd; }
.m-meeting-active-dot {
  width: 8px; height: 8px;
  background: #00b42a;
  border-radius: 50%;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.m-meeting-active-info { flex: 1; min-width: 0; }
.m-meeting-active-title { font-size: 13px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-meeting-active-sub { display: flex; gap: 4px; margin-top: 3px; flex-wrap: wrap; }
.m-meeting-participant-tag {
  font-size: 10px;
  color: #92400e;
  background: #fef3c7;
  padding: 1px 6px;
  border-radius: 4px;
}
.m-meeting-join-btn {
  background: #0071e3;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

/* 三个入口 */
.m-meeting-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.m-meeting-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  background: #f5f5f7;
  border-radius: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-meeting-action:active { background: #e8f0fe; }
.m-meeting-action-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.m-meeting-action span { font-size: 11px; font-weight: 600; color: #4e5969; }

/* 最近会议 */
.m-meeting-recent { border-top: 1px solid #f2f3f5; padding-top: 10px; }
.m-meeting-recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-meeting-recent-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.m-meeting-recent-dot.active { background: #00b42a; }
.m-meeting-recent-dot.ended { background: #86909c; }
.m-meeting-recent-dot.scheduled { background: #0071e3; }
.m-meeting-recent-info { flex: 1; min-width: 0; }
.m-meeting-recent-title { font-size: 13px; color: #1d2129; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-meeting-recent-time { font-size: 11px; color: #86909c; margin-top: 2px; }
.m-meeting-status-active { font-size: 11px; font-weight: 600; color: #00b42a; }
.m-meeting-status-ended { font-size: 11px; color: #86909c; }
.m-meeting-status-scheduled { font-size: 11px; font-weight: 600; color: #0071e3; }

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
.m-modal-close { border: none; background: transparent; color: #0071e3; font-size: 14px; cursor: pointer; }
.m-modal-body { flex: 1; overflow-y: auto; padding: 16px; }
.m-modal-footer { padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px); border-top: 1px solid #f2f3f5; flex-shrink: 0; }

.m-form-item { margin-bottom: 16px; }
.m-form-item label { display: block; font-size: 13px; font-weight: 600; color: #4e5969; margin-bottom: 8px; }
.m-input {
  width: 100%;
  height: 44px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
  color: #1d2129;
  outline: none;
  box-sizing: border-box;
  transition: border 0.15s;
}
.m-input:focus { border-color: #0071e3; background: #fff; }
.m-textarea { width: 100%; background: #f5f5f7; border: 1px solid transparent; border-radius: 10px; padding: 10px 12px; font-size: 14px; color: #1d2129; outline: none; resize: none; box-sizing: border-box; }
.m-textarea:focus { border-color: #0071e3; background: #fff; }
.m-form-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.m-form-tag {
  padding: 6px 14px;
  background: #f5f5f7;
  border-radius: 999px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-form-tag.active { background: #0071e3; color: #fff; }
.m-participant-list { display: flex; flex-wrap: wrap; gap: 8px; }
.m-participant-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e8f0fe;
  color: #0071e3;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}
.m-chip-remove { border: none; background: transparent; color: #0071e3; cursor: pointer; font-size: 16px; padding: 0; line-height: 1; }
.m-participant-add {
  border: 1px dashed #0071e3;
  background: transparent;
  color: #0071e3;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
}

.m-pick-search { margin-bottom: 12px; }
.m-pick-list { display: flex; flex-direction: column; }
.m-pick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #f2f3f5;
}
.m-pick-check {
  width: 20px; height: 20px;
  border: 2px solid #e5e6eb;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-pick-item:has(.m-pick-check svg) .m-pick-check { background: #e8f0fe; border-color: #0071e3; }
.m-pick-avatar {
  width: 36px; height: 36px;
  background: #0071e3;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}
.m-pick-info { flex: 1; }
.m-pick-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-pick-role { font-size: 12px; color: #86909c; }

.m-btn-primary {
  width: 100%;
  height: 48px;
  background: #0071e3;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}
.m-btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }
.m-btn-primary:active:not(:disabled) { background: #005bb5; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
