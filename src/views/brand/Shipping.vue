<template>
  <div class="brand-shipping" :class="{ 'edit-mode-active': brandEdit.editMode }">
    <div class="sh-header">
      <h2 class="sh-title">物流查询</h2>
      <p class="sh-sub">实时追踪您的包裹，全球 120+ 国家配送</p>
    </div>

    <div class="sh-track-card">
      <h3 class="sh-track-title">运单追踪</h3>
      <div class="sh-track-input">
        <input v-model="trackingNum" type="text" placeholder="输入运单号，如 NL2026031500001" class="sh-input" />
        <button class="sh-track-btn" @click="doTrack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          查询
        </button>
      </div>
      <div v-if="trackResult !== null" class="sh-track-result">
        <div class="sh-track-steps">
          <div v-for="(step, i) in trackSteps" :key="i" class="sh-step" :class="{ done: i <= trackResult }">
            <div class="sh-step-dot"></div>
            <div class="sh-step-info">
              <p class="sh-step-title">{{ step.title }}</p>
              <p class="sh-step-time">{{ step.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Carriers -->
    <div class="sh-carriers">
      <h3 class="sh-section-title">常用物流服务</h3>
      <div class="sh-carrier-grid">
        <div
          v-for="(carrier, i) in cfg.carriers"
          :key="carrier.name"
          class="sh-carrier-card editable-block"
          style="position:relative"
        >
          <div class="sh-carrier-icon" :style="{ background: carrierBg(i) }">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="carrierColor(i)" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div>
            <h4 class="sh-carrier-name">{{ carrier.name }}</h4>
            <p class="sh-carrier-time">{{ carrier.time }}</p>
          </div>
          <span class="sh-carrier-badge" :style="{ color: carrierColor(i), background: carrierBg(i) }">{{ carrier.type }}</span>
          <button class="edit-trigger" @click="openEdit('carrier', i)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            编辑
          </button>
        </div>
      </div>
    </div>

    <!-- Policies -->
    <div class="sh-policies">
      <div
        v-for="(p, i) in cfg.policies"
        :key="p.title"
        class="sh-policy-card editable-block"
        style="position:relative"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <h4>{{ p.title }}</h4>
        <p>{{ p.desc }}</p>
        <button class="edit-trigger" @click="openEdit('policy', i)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          编辑
        </button>
      </div>
    </div>

    <!-- Edit Dialog -->
    <div v-if="editDialogVisible" class="brand-edit-overlay" @click.self="editDialogVisible = false">
      <div class="brand-edit-dialog">
        <div class="bed-header">
          <span class="bed-title">{{ dialogTitle }}</span>
          <button class="bed-close" @click="editDialogVisible = false">✕</button>
        </div>
        <div class="bed-body">
          <template v-if="editType === 'carrier'">
            <label class="bed-label">物流商名称</label>
            <input v-model="editData.name" type="text" class="bed-input" />
            <label class="bed-label">时效描述</label>
            <input v-model="editData.time" type="text" class="bed-input" placeholder="如：2-3 工作日" />
            <label class="bed-label">类型标签</label>
            <input v-model="editData.type" type="text" class="bed-input" placeholder="如：国际快递" />
          </template>
          <template v-else-if="editType === 'policy'">
            <label class="bed-label">政策标题</label>
            <input v-model="editData.title" type="text" class="bed-input" />
            <label class="bed-label">政策描述</label>
            <textarea v-model="editData.desc" class="bed-textarea" rows="3"></textarea>
          </template>
        </div>
        <div class="bed-footer">
          <button class="bed-cancel" @click="editDialogVisible = false">取消</button>
          <button class="bed-save" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBrandEditStore } from '@/stores/brandEdit'

const brandEdit = useBrandEditStore()
const cfg = computed(() => brandEdit.config)

const trackingNum = ref('')
const trackResult = ref<number | null>(null)
const trackSteps = [
  { title: '订单已确认', time: '2026-03-10 10:00' },
  { title: '商品打包中', time: '2026-03-10 14:30' },
  { title: '已发往物流中心', time: '2026-03-11 09:00' },
  { title: '国际运输中', time: '2026-03-12 18:00' },
  { title: '目的国清关', time: '2026-03-14 12:00' },
  { title: '派送中', time: '2026-03-15 09:30' },
  { title: '已签收', time: '—' },
]
function doTrack() {
  if (!trackingNum.value.trim()) return
  trackResult.value = 4
}

const CARRIER_COLORS = ['#dc2626', '#4f46e5', '#d97706', '#059669']
const CARRIER_BGS = ['rgba(220,38,38,0.08)', 'rgba(79,70,229,0.08)', 'rgba(217,119,6,0.08)', 'rgba(5,150,105,0.08)']
function carrierColor(i: number) { return CARRIER_COLORS[i % CARRIER_COLORS.length] }
function carrierBg(i: number) { return CARRIER_BGS[i % CARRIER_BGS.length] }

const editDialogVisible = ref(false)
const editType = ref('')
const editIdx = ref(-1)
const editData = ref<any>({})
const dialogTitle = computed(() => {
  const map: Record<string, string> = { carrier: '编辑物流商', policy: '编辑物流政策' }
  return map[editType.value] || '编辑'
})

function openEdit(type: string, idx: number) {
  if (!brandEdit.editMode) return
  editType.value = type
  editIdx.value = idx
  if (type === 'carrier') editData.value = { ...cfg.value.carriers[idx] }
  else if (type === 'policy') editData.value = { ...cfg.value.policies[idx] }
  editDialogVisible.value = true
}

function saveEdit() {
  if (editType.value === 'carrier') {
    const carriers = cfg.value.carriers.map((c, i) => i === editIdx.value ? { ...editData.value } : c)
    brandEdit.updateConfig({ carriers })
  } else if (editType.value === 'policy') {
    const policies = cfg.value.policies.map((p, i) => i === editIdx.value ? { ...editData.value } : p)
    brandEdit.updateConfig({ policies })
  }
  editDialogVisible.value = false
}
</script>

<style scoped>
.brand-shipping { padding: 40px 48px 80px; max-width: 1000px; }
.sh-header { margin-bottom: 36px; }
.sh-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
.sh-sub { font-size: 14px; color: rgba(29,29,31,0.45); }

.sh-track-card { background: #fff; border-radius: 28px; padding: 36px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 40px; }
.sh-track-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
.sh-track-input { display: flex; gap: 12px; margin-bottom: 28px; }
.sh-input { flex: 1; padding: 14px 20px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 14px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.sh-input:focus { border-color: #0071e3; }
.sh-track-btn { display: flex; align-items: center; gap: 8px; padding: 0 24px; background: #1d1d1f; color: #fff; border-radius: 14px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.sh-track-btn:hover { background: #0071e3; }

.sh-track-steps { display: flex; flex-direction: column; gap: 0; }
.sh-step { display: flex; gap: 16px; padding: 12px 0; position: relative; }
.sh-step:not(:last-child) .sh-step-dot::after { content: ''; position: absolute; left: 7px; top: 28px; width: 2px; height: calc(100% - 4px); background: #e8e8ed; }
.sh-step-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #e8e8ed; background: #fff; flex-shrink: 0; margin-top: 2px; position: relative; z-index: 1; }
.sh-step.done .sh-step-dot { background: #0071e3; border-color: #0071e3; }
.sh-step.done .sh-step-title { color: #1d1d1f; font-weight: 600; }
.sh-step-title { font-size: 14px; color: rgba(29,29,31,0.4); }
.sh-step-time { font-size: 11px; color: rgba(29,29,31,0.3); margin-top: 2px; }

.sh-section-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
.sh-carrier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
.sh-carrier-card { background: #fff; border-radius: 20px; padding: 20px; border: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; gap: 14px; }
.sh-carrier-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sh-carrier-name { font-size: 14px; font-weight: 700; }
.sh-carrier-time { font-size: 12px; color: rgba(29,29,31,0.45); }
.sh-carrier-badge { margin-left: auto; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }

.sh-policies { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.sh-policy-card { background: #f5f5f7; border-radius: 24px; padding: 28px; border: 1px solid rgba(0,0,0,0.05); }
.sh-policy-card svg { margin-bottom: 14px; }
.sh-policy-card h4 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.sh-policy-card p { font-size: 13px; color: rgba(29,29,31,0.5); line-height: 1.6; }

/* Edit dialog */
.brand-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.brand-edit-dialog { background: #fff; border-radius: 20px; width: 480px; max-width: 95vw; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bed-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bed-title { font-size: 16px; font-weight: 700; }
.bed-close { background: none; border: none; cursor: pointer; font-size: 18px; color: rgba(29,29,31,0.4); }
.bed-body { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.bed-label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.5); text-transform: uppercase; letter-spacing: 0.05em; }
.bed-input { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; }
.bed-input:focus { border-color: #7c3aed; }
.bed-textarea { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; resize: vertical; font-family: inherit; }
.bed-textarea:focus { border-color: #7c3aed; }
.bed-footer { padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 10px; justify-content: flex-end; }
.bed-cancel { padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.bed-save { padding: 10px 24px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
.bed-save:hover { background: #6d28d9; }

@media (max-width: 768px) {
  .brand-shipping { padding: 24px; }
  .sh-carrier-grid { grid-template-columns: 1fr; }
  .sh-policies { grid-template-columns: 1fr; }
}
</style>
