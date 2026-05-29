<template>
  <div class="cal-page">

    <div class="cal-toolbar">
      <div class="cal-filters">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          class="filter-btn"
          :class="{ 'filter-active': activeFilter === f.value }"
          @click="activeFilter = f.value"
        >{{ f.label }}</button>
      </div>
      <button class="add-btn" @click="openAdd">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
        新建内容
      </button>
    </div>

    <div class="plan-board">
      <div v-for="col in COLS" :key="col.status" class="board-col">
        <div class="col-hd">
          <span class="col-dot" :style="{ background: col.color }"></span>
          <span class="col-title">{{ col.label }}</span>
          <span class="col-count">{{ filteredPlans(col.status).length }}</span>
        </div>
        <div class="col-cards">
          <div
            v-for="p in filteredPlans(col.status)"
            :key="p.id"
            class="plan-card"
            :style="{ '--ac': channelColor(p.channel) }"
          >
            <div class="pc-top">
              <span class="pc-ch">{{ channelEmoji(p.channel) }} {{ p.channel }}</span>
              <span class="pc-date">{{ p.date }}</span>
            </div>
            <div class="pc-title">{{ p.title }}</div>
            <div class="pc-tags">
              <span v-for="t in p.tags" :key="t" class="pc-tag">{{ t }}</span>
            </div>
            <div class="pc-actions">
              <button class="pc-btn" @click="moveForward(p)">{{ nextAction(p.status) }}</button>
            </div>
          </div>
          <div v-if="filteredPlans(col.status).length === 0" class="col-empty">暂无内容</div>
        </div>
      </div>
    </div>

    <!-- 新建弹窗 -->
    <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
      <div class="modal-box">
        <div class="modal-title">新建内容计划</div>

        <div class="form-group">
          <label class="form-label">标题</label>
          <input v-model="form.title" class="form-input" placeholder="内容标题" />
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">发布渠道</label>
            <select v-model="form.channel" class="form-input form-select">
              <option v-for="c in CH_OPTIONS" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">计划日期</label>
            <input v-model="form.date" class="form-input" type="date" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">标签（逗号分隔）</label>
          <input v-model="form.tagsRaw" class="form-input" placeholder="如：品牌故事,种草" />
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-confirm" @click="confirmAdd">创建</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useContentCalendar, type PlanStatus, type ContentPlan as Plan } from '@/composables/useContentCalendar'

type Status = PlanStatus

const { plans, addPlan, updateStatus } = useContentCalendar()

const COLS = [
  { status: 'idea' as Status,      label: '选题池',   color: '#94a3b8' },
  { status: 'draft' as Status,     label: '创作中',   color: '#f59e0b' },
  { status: 'scheduled' as Status, label: '待发布',   color: '#7c3aed' },
  { status: 'published' as Status, label: '已发布',   color: '#10b981' },
]

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: '公众号', label: '公众号' },
  { value: '小红书', label: '小红书' },
  { value: '抖音号', label: '抖音号' },
  { value: '视频号', label: '视频号' },
]

const CH_OPTIONS = ['公众号', '微信公众号', '视频号', '抖音号', '小红书', '快手号', '微博']

const CH_META: Record<string, { emoji: string; color: string }> = {
  '公众号':    { emoji: '📗', color: '#07c160' },
  '微信公众号': { emoji: '📗', color: '#07c160' },
  '视频号':    { emoji: '📹', color: '#07c160' },
  '抖音号':    { emoji: '🎵', color: '#161823' },
  '小红书':    { emoji: '📕', color: '#fe2c55' },
  '快手号':    { emoji: '📱', color: '#ff6600' },
  '微博':      { emoji: '🌐', color: '#e6162d' },
}

const activeFilter = ref('all')
const showModal = ref(false)
const form = ref({ title: '', channel: '公众号', date: '', tagsRaw: '' })

function filteredPlans(status: Status) {
  return plans.value.filter(p =>
    p.status === status && (activeFilter.value === 'all' || p.channel.includes(activeFilter.value))
  )
}

function channelEmoji(ch: string) { return CH_META[ch]?.emoji ?? '📄' }
function channelColor(ch: string) { return CH_META[ch]?.color ?? '#64748b' }

const NEXT_STATUS: Record<Status, Status> = { idea: 'draft', draft: 'scheduled', scheduled: 'published', published: 'published' }
const NEXT_LABEL: Record<Status, string> = { idea: '开始创作', draft: '标记待发', scheduled: '标记已发', published: '已发布' }

function nextAction(s: Status) { return NEXT_LABEL[s] }

function moveForward(p: Plan) {
  if (p.status === 'published') return
  updateStatus(p.id, NEXT_STATUS[p.status])
  ElMessage.success('状态已更新')
}

function openAdd() {
  form.value = { title: '', channel: '公众号', date: '', tagsRaw: '' }
  showModal.value = true
}

function confirmAdd() {
  if (!form.value.title.trim()) { ElMessage.warning('请填写标题'); return }
  addPlan({
    title: form.value.title.trim(),
    channel: form.value.channel,
    date: form.value.date || '待定',
    status: 'idea',
    tags: form.value.tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean),
  })
  showModal.value = false
  ElMessage.success('已添加到选题池')
}
</script>

<style scoped>
.cal-page { display: flex; flex-direction: column; gap: 16px; height: 100%; }

.cal-toolbar {
  display: flex; align-items: center; justify-content: space-between;
}

.cal-filters { display: flex; gap: 6px; }

.filter-btn {
  border: 1px solid rgba(148,163,184,0.2); border-radius: 999px;
  padding: 6px 14px; font-size: 12px; font-weight: 600; color: #64748b;
  background: #fff; cursor: pointer; transition: all 0.15s;
}
.filter-btn:hover { background: rgba(124,58,237,0.06); border-color: rgba(124,58,237,0.2); color: #7c3aed; }
.filter-active { background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.25); color: #7c3aed; }

.add-btn {
  display: flex; align-items: center; gap: 6px;
  border: none; border-radius: 10px; padding: 8px 16px;
  font-size: 12px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #7c3aed, #6d28d9); cursor: pointer;
  transition: opacity 0.15s;
}
.add-btn:hover { opacity: 0.88; }

.plan-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.board-col {
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
  overflow-y: auto;
}

.col-hd {
  display: flex; align-items: center; gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148,163,184,0.12);
}
.col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.col-title { font-size: 13px; font-weight: 700; color: #0f172a; flex: 1; }
.col-count { font-size: 11px; color: #94a3b8; background: #e2e8f0; padding: 2px 7px; border-radius: 999px; }

.col-cards { display: flex; flex-direction: column; gap: 8px; }

.plan-card {
  background: #fff;
  border: 1px solid rgba(148,163,184,0.14);
  border-left: 3px solid var(--ac);
  border-radius: 12px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
  box-shadow: 0 2px 8px rgba(15,23,42,0.04);
}

.pc-top { display: flex; align-items: center; justify-content: space-between; }
.pc-ch { font-size: 11px; color: #64748b; font-weight: 600; }
.pc-date { font-size: 10px; color: #94a3b8; }
.pc-title { font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.4; }

.pc-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.pc-tag { font-size: 10px; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 999px; }

.pc-actions { display: flex; justify-content: flex-end; }
.pc-btn {
  border: 1px solid rgba(124,58,237,0.2); border-radius: 6px; padding: 4px 10px;
  font-size: 11px; font-weight: 600; color: #7c3aed;
  background: rgba(124,58,237,0.06); cursor: pointer; transition: background 0.15s;
}
.pc-btn:hover { background: rgba(124,58,237,0.12); }

.col-empty { font-size: 12px; color: #cbd5e1; text-align: center; padding: 20px 0; }

/* Modal */
.modal-mask {
  position: fixed; inset: 0; background: rgba(15,23,42,0.4);
  backdrop-filter: blur(4px); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #fff; border-radius: 20px; padding: 28px;
  width: 440px; max-width: calc(100vw - 32px);
  box-shadow: 0 24px 80px rgba(15,23,42,0.18);
}
.modal-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }
.form-row { display: flex; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-label { font-size: 12px; font-weight: 600; color: #334155; }
.form-input {
  border: 1px solid rgba(148,163,184,0.3); border-radius: 10px;
  padding: 10px 12px; font-size: 13px; color: #0f172a; outline: none;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #7c3aed; }
.form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
.btn-cancel { border: 1px solid rgba(148,163,184,0.2); border-radius: 10px; padding: 9px 20px; font-size: 13px; font-weight: 600; color: #64748b; background: #f8fafc; cursor: pointer; }
.btn-cancel:hover { background: #f1f5f9; }
.btn-confirm { border: none; border-radius: 10px; padding: 9px 20px; font-size: 13px; font-weight: 600; color: #fff; background: linear-gradient(135deg, #7c3aed, #6d28d9); cursor: pointer; transition: opacity 0.15s; }
.btn-confirm:hover { opacity: 0.88; }
</style>
