<template>
  <div class="brand-reviews" :class="{ 'edit-mode-active': brandEdit.editMode }">
    <div class="br-top">
      <h2 class="br-title">用户声音</h2>
      <p class="br-sub">来自全球数字游民的真实反馈</p>
    </div>

    <!-- Stats summary -->
    <div class="br-stats editable-block" style="position:relative">
      <div class="br-stat-card">
        <p class="br-big-num">{{ cfg.totalRating }}</p>
        <div class="br-stars">
          <svg v-for="i in 5" :key="i" width="22" height="22" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <p class="br-stat-label">基于 {{ cfg.totalReviews.toLocaleString() }} 条评价</p>
      </div>
      <div class="br-rating-bars">
        <div v-for="(pct, star) in cfg.ratingDist" :key="star" class="br-bar-row">
          <span class="br-bar-star">{{ 5 - star }} 星</span>
          <div class="br-bar-track"><div class="br-bar-fill" :style="{ width: pct + '%' }"></div></div>
          <span class="br-bar-pct">{{ pct }}%</span>
        </div>
      </div>
      <div class="br-stat-card br-verified">
        <p class="br-big-num green">{{ cfg.recommendRate }}%</p>
        <p class="br-stat-sublabel">推荐率</p>
        <p class="br-stat-label">基于真实订单评价</p>
      </div>
      <button class="edit-trigger" @click="openEdit('summary')" title="编辑评分摘要">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        编辑数据
      </button>
    </div>

    <!-- Review cards -->
    <div class="br-list">
      <div
        v-for="(review, i) in cfg.reviews"
        :key="review.id"
        class="br-card editable-block"
        style="position:relative"
      >
        <div class="br-card-top">
          <img :src="review.avatar" :alt="review.userName" class="br-avatar" referrerpolicy="no-referrer" />
          <div>
            <p class="br-username">{{ review.userName }}</p>
            <p class="br-date">{{ review.date }}</p>
          </div>
          <div class="br-stars-sm">
            <svg v-for="j in review.rating" :key="j" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
        </div>
        <p class="br-comment">{{ review.comment }}</p>
        <button class="edit-trigger" @click="openEdit('review', i)" title="编辑评价">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          编辑
        </button>
      </div>

      <!-- Add review (edit mode) -->
      <div v-if="brandEdit.editMode" class="br-add-card" @click="openEdit('add')">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(29,29,31,0.3)" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>添加评价</span>
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
          <!-- Summary -->
          <template v-if="editType === 'summary'">
            <label class="bed-label">总评分</label>
            <input v-model.number="editData.totalRating" type="number" step="0.1" min="1" max="5" class="bed-input" />
            <label class="bed-label">总评价数</label>
            <input v-model.number="editData.totalReviews" type="number" class="bed-input" />
            <label class="bed-label">推荐率 (%)</label>
            <input v-model.number="editData.recommendRate" type="number" min="0" max="100" class="bed-input" />
            <label class="bed-label">星级分布 (5星→1星, 百分比)</label>
            <div class="bed-row" v-for="(pct, i) in editData.ratingDist" :key="i">
              <span class="bed-star-label">{{ 5 - i }}星</span>
              <input v-model.number="editData.ratingDist[i]" type="number" min="0" max="100" class="bed-input bed-input-sm" />
              <span class="bed-pct-label">%</span>
            </div>
          </template>
          <!-- Review edit/add -->
          <template v-else-if="editType === 'review' || editType === 'add'">
            <label class="bed-label">用户名</label>
            <input v-model="editData.userName" type="text" class="bed-input" />
            <label class="bed-label">头像 URL</label>
            <div class="bed-input-row"><input v-model="editData.avatar" type="url" class="bed-input" placeholder="https://... 或点击上传" /><button class="bed-upload-btn" @click="upload(v => editData.avatar = v)">上传</button></div>
            <label class="bed-label">评分 (1-5)</label>
            <input v-model.number="editData.rating" type="number" min="1" max="5" class="bed-input" />
            <label class="bed-label">评论内容</label>
            <textarea v-model="editData.comment" class="bed-textarea" rows="3"></textarea>
            <label class="bed-label">日期</label>
            <input v-model="editData.date" type="date" class="bed-input" />
          </template>
        </div>
        <div class="bed-footer">
          <button v-if="editType === 'review'" class="bed-delete" @click="deleteReview">删除</button>
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
import { useImageUpload } from '@/composables/useImageUpload'
const { triggerUpload } = useImageUpload()
function upload(setter: (v: string) => void) { triggerUpload(setter) }

const brandEdit = useBrandEditStore()
const cfg = computed(() => brandEdit.config)

const editDialogVisible = ref(false)
const editType = ref('')
const editIdx = ref(-1)
const editData = ref<any>({})
const dialogTitle = computed(() => {
  const map: Record<string, string> = { summary: '编辑评分数据', review: '编辑评价', add: '添加评价' }
  return map[editType.value] || '编辑'
})

function openEdit(type: string, idx?: number) {
  if (!brandEdit.editMode) return
  editType.value = type
  editIdx.value = idx ?? -1
  if (type === 'summary') {
    editData.value = {
      totalRating: cfg.value.totalRating,
      totalReviews: cfg.value.totalReviews,
      recommendRate: cfg.value.recommendRate,
      ratingDist: [...cfg.value.ratingDist],
    }
  } else if (type === 'review' && idx !== undefined) {
    editData.value = { ...cfg.value.reviews[idx] }
  } else if (type === 'add') {
    editData.value = { userName: '', avatar: `https://picsum.photos/seed/user${Date.now()}/100/100`, rating: 5, comment: '', date: new Date().toISOString().slice(0, 10) }
  }
  editDialogVisible.value = true
}

function saveEdit() {
  if (editType.value === 'summary') {
    brandEdit.updateConfig({
      totalRating: editData.value.totalRating,
      totalReviews: editData.value.totalReviews,
      recommendRate: editData.value.recommendRate,
      ratingDist: editData.value.ratingDist,
    })
  } else if (editType.value === 'review') {
    const reviews = cfg.value.reviews.map((r, i) => i === editIdx.value ? { ...r, ...editData.value } : r)
    brandEdit.updateConfig({ reviews })
  } else if (editType.value === 'add') {
    const newReview = { ...editData.value, id: 'r' + Date.now() }
    brandEdit.updateConfig({ reviews: [...cfg.value.reviews, newReview] })
  }
  editDialogVisible.value = false
}

function deleteReview() {
  const reviews = cfg.value.reviews.filter((_, i) => i !== editIdx.value)
  brandEdit.updateConfig({ reviews })
  editDialogVisible.value = false
}
</script>

<style scoped>
.brand-reviews { padding: 40px 48px 80px; max-width: 1100px; }
.br-top { text-align: center; margin-bottom: 48px; }
.br-title { font-size: 40px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
.br-sub { font-size: 16px; color: rgba(29,29,31,0.45); }

.br-stats { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 24px; margin-bottom: 48px; }
.br-stat-card { background: #f5f5f7; border-radius: 36px; padding: 40px; text-align: center; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; }
.br-big-num { font-size: 64px; font-weight: 800; letter-spacing: -0.04em; color: #1d1d1f; }
.br-big-num.green { color: #34c759; }
.br-stars { display: flex; gap: 4px; }
.br-stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(29,29,31,0.4); }
.br-stat-sublabel { font-size: 16px; font-weight: 700; color: rgba(29,29,31,0.6); }

.br-rating-bars { background: #fff; border-radius: 36px; padding: 40px; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 12px; justify-content: center; }
.br-bar-row { display: flex; align-items: center; gap: 12px; }
.br-bar-star { font-size: 12px; font-weight: 600; color: rgba(29,29,31,0.5); width: 28px; }
.br-bar-track { flex: 1; height: 8px; background: #f5f5f7; border-radius: 999px; overflow: hidden; }
.br-bar-fill { height: 100%; background: #f59e0b; border-radius: 999px; transition: width 0.6s cubic-bezier(0.23,1,0.32,1); }
.br-bar-pct { font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.4); width: 36px; text-align: right; }

.br-list { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.br-card { background: #fff; border-radius: 24px; padding: 24px; border: 1px solid rgba(0,0,0,0.05); transition: box-shadow 0.3s; }
.br-card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
.br-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.br-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.br-username { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
.br-date { font-size: 11px; color: rgba(29,29,31,0.35); }
.br-stars-sm { display: flex; gap: 2px; margin-left: auto; }
.br-comment { font-size: 14px; color: rgba(29,29,31,0.65); line-height: 1.65; }

.br-add-card { border: 2px dashed rgba(124,58,237,0.25); border-radius: 24px; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; cursor: pointer; color: rgba(29,29,31,0.35); font-size: 14px; font-weight: 600; min-height: 120px; transition: border-color 0.2s; }
.br-add-card:hover { border-color: #7c3aed; color: #7c3aed; }

/* Edit dialog */
.brand-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.brand-edit-dialog { background: #fff; border-radius: 20px; width: 480px; max-width: 95vw; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bed-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bed-title { font-size: 16px; font-weight: 700; }
.bed-close { background: none; border: none; cursor: pointer; font-size: 18px; color: rgba(29,29,31,0.4); }
.bed-body { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.bed-label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.5); text-transform: uppercase; letter-spacing: 0.05em; }
.bed-input { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; flex: 1; }
.bed-input-row { display: flex; gap: 8px; align-items: center; }
.bed-upload-btn { padding: 10px 14px; background: #f5f5f7; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
.bed-upload-btn:hover { background: #e8e8ed; }
.bed-input:focus { border-color: #7c3aed; }
.bed-input-sm { flex: 1; }
.bed-textarea { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; resize: vertical; font-family: inherit; }
.bed-textarea:focus { border-color: #7c3aed; }
.bed-row { display: flex; align-items: center; gap: 8px; }
.bed-star-label { font-size: 12px; font-weight: 600; width: 24px; color: rgba(29,29,31,0.5); }
.bed-pct-label { font-size: 12px; color: rgba(29,29,31,0.4); }
.bed-footer { padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 10px; align-items: center; }
.bed-delete { padding: 10px 16px; border-radius: 10px; background: #fee2e2; color: #dc2626; border: none; font-size: 14px; font-weight: 600; cursor: pointer; margin-right: auto; }
.bed-cancel { padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.bed-save { padding: 10px 24px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
.bed-save:hover { background: #6d28d9; }

@media (max-width: 900px) {
  .brand-reviews { padding: 24px; }
  .br-stats { grid-template-columns: 1fr; }
  .br-list { grid-template-columns: 1fr; }
}
</style>
