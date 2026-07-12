<template>
  <div class="brand-story" :class="{ 'edit-mode-active': brandEdit.editMode }">
    <!-- Hero -->
    <section class="bs-hero editable-block" style="position:relative">
      <img :src="cfg.storyHeroImage" alt="Story Hero" class="bs-hero-img" referrerpolicy="no-referrer" />
      <div class="bs-hero-overlay">
        <div class="bs-hero-text">
          <p class="bs-eyebrow">品牌故事</p>
          <h1 class="bs-hero-title">从一次亚洲之旅<br>诞生的品牌</h1>
        </div>
      </div>
      <button class="edit-trigger" @click="openEdit('hero')" title="编辑封面图">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        编辑封面
      </button>
    </section>

    <div class="bs-body">
      <!-- Chapters -->
      <div
        v-for="(ch, i) in cfg.chapters"
        :key="i"
        class="bs-chapter editable-block"
        style="position:relative"
      >
        <div class="bs-chapter-num">{{ String(i+1).padStart(2,'0') }}</div>
        <div class="bs-chapter-content">
          <h2 class="bs-ch-title">{{ ch.title }}</h2>
          <p class="bs-ch-text">{{ ch.text }}</p>
        </div>
        <button class="edit-trigger" @click="openEdit('chapter', i)" title="编辑章节">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          编辑
        </button>
      </div>

      <!-- Stats -->
      <div class="bs-stats editable-block" style="position:relative">
        <div class="bs-stat" v-for="(s, i) in cfg.stats" :key="i">
          <p class="bs-stat-num">{{ s.num }}</p>
          <p class="bs-stat-label">{{ s.label }}</p>
        </div>
        <button class="edit-trigger" @click="openEdit('stats')" title="编辑数据">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          编辑数据
        </button>
      </div>

      <!-- Values -->
      <div class="bs-team">
        <h2 class="bs-section-title">团队理念</h2>
        <div class="bs-values">
          <div
            v-for="(v, i) in cfg.values"
            :key="i"
            class="bs-value-card editable-block"
            style="position:relative"
          >
            <div class="bs-value-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="v.color" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </div>
            <h3 class="bs-value-title">{{ v.title }}</h3>
            <p class="bs-value-desc">{{ v.desc }}</p>
            <button class="edit-trigger" @click="openEdit('value', i)" title="编辑理念">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              编辑
            </button>
          </div>
        </div>
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
          <!-- Hero image -->
          <template v-if="editType === 'hero'">
            <label class="bed-label">封面图片 URL</label>
            <div class="bed-input-row"><input v-model="editData.storyHeroImage" type="url" class="bed-input" placeholder="https://... 或点击上传" /><button class="bed-upload-btn" @click="upload(v => editData.storyHeroImage = v)">上传</button></div>
            <img v-if="editData.storyHeroImage" :src="editData.storyHeroImage" class="bed-preview-img" referrerpolicy="no-referrer" />
          </template>
          <!-- Chapter -->
          <template v-else-if="editType === 'chapter'">
            <label class="bed-label">章节标题</label>
            <input v-model="editData.title" type="text" class="bed-input" />
            <label class="bed-label">章节内容</label>
            <textarea v-model="editData.text" class="bed-textarea" rows="4"></textarea>
          </template>
          <!-- Stats -->
          <template v-else-if="editType === 'stats'">
            <div v-for="(s, i) in editData.stats" :key="i" class="bed-row">
              <input v-model="s.num" type="text" class="bed-input bed-input-sm" placeholder="数字" />
              <input v-model="s.label" type="text" class="bed-input bed-input-sm" placeholder="标签" />
            </div>
          </template>
          <!-- Value card -->
          <template v-else-if="editType === 'value'">
            <label class="bed-label">标题</label>
            <input v-model="editData.title" type="text" class="bed-input" />
            <label class="bed-label">描述</label>
            <textarea v-model="editData.desc" class="bed-textarea" rows="2"></textarea>
            <label class="bed-label">颜色</label>
            <input v-model="editData.color" type="color" class="bed-color" />
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
  const map: Record<string, string> = { hero: '编辑封面图', chapter: '编辑章节', stats: '编辑数据板块', value: '编辑团队理念' }
  return map[editType.value] || '编辑'
})

function openEdit(type: string, idx?: number) {
  if (!brandEdit.editMode) return
  editType.value = type
  editIdx.value = idx ?? -1
  if (type === 'hero') {
    editData.value = { storyHeroImage: cfg.value.storyHeroImage }
  } else if (type === 'chapter' && idx !== undefined) {
    editData.value = { ...cfg.value.chapters[idx] }
  } else if (type === 'stats') {
    editData.value = { stats: cfg.value.stats.map(s => ({ ...s })) }
  } else if (type === 'value' && idx !== undefined) {
    editData.value = { ...cfg.value.values[idx] }
  }
  editDialogVisible.value = true
}

function saveEdit() {
  if (editType.value === 'hero') {
    brandEdit.updateConfig({ storyHeroImage: editData.value.storyHeroImage })
  } else if (editType.value === 'chapter') {
    const chapters = cfg.value.chapters.map((c, i) => i === editIdx.value ? { ...editData.value } : c)
    brandEdit.updateConfig({ chapters })
  } else if (editType.value === 'stats') {
    brandEdit.updateConfig({ stats: editData.value.stats })
  } else if (editType.value === 'value') {
    const values = cfg.value.values.map((v, i) => i === editIdx.value ? { ...editData.value } : v)
    brandEdit.updateConfig({ values })
  }
  editDialogVisible.value = false
}
</script>

<style scoped>
.brand-story { background: #fff; }
.bs-hero { position: relative; height: 520px; overflow: hidden; }
.bs-hero-img { width: 100%; height: 100%; object-fit: cover; }
.bs-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%); display: flex; align-items: flex-end; padding: 60px; }
.bs-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.6); margin-bottom: 10px; }
.bs-hero-title { font-size: clamp(32px,4vw,56px); font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1.15; }

.bs-body { max-width: 900px; margin: 0 auto; padding: 60px 48px; }
.bs-chapter { display: flex; gap: 32px; margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bs-chapter:last-of-type { border-bottom: none; }
.bs-chapter-num { font-size: 56px; font-weight: 800; color: #f5f5f7; letter-spacing: -0.05em; flex-shrink: 0; width: 72px; line-height: 1; }
.bs-ch-title { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
.bs-ch-text { font-size: 15px; color: rgba(29,29,31,0.55); line-height: 1.75; }

.bs-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; background: #f5f5f7; border-radius: 32px; padding: 48px; margin: 48px 0; }
.bs-stat { text-align: center; }
.bs-stat-num { font-size: 40px; font-weight: 800; letter-spacing: -0.03em; color: #0071e3; }
.bs-stat-label { font-size: 12px; color: rgba(29,29,31,0.45); margin-top: 4px; font-weight: 600; }

.bs-section-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 28px; }
.bs-values { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.bs-value-card { background: #f5f5f7; border-radius: 24px; padding: 28px; border: 1px solid rgba(0,0,0,0.05); }
.bs-value-icon { width: 44px; height: 44px; border-radius: 14px; background: #fff; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.bs-value-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.bs-value-desc { font-size: 13px; color: rgba(29,29,31,0.5); line-height: 1.6; }

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
.bed-color { height: 40px; border-radius: 8px; border: 1.5px solid rgba(0,0,0,0.1); cursor: pointer; }
.bed-row { display: flex; gap: 10px; }
.bed-preview-img { width: 100%; height: 120px; object-fit: cover; border-radius: 10px; margin-top: 4px; }
.bed-footer { padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 10px; justify-content: flex-end; }
.bed-cancel { padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.bed-save { padding: 10px 24px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
.bed-save:hover { background: #6d28d9; }

@media (max-width: 768px) {
  .bs-body { padding: 32px 20px; }
  .bs-stats { grid-template-columns: 1fr 1fr; }
  .bs-values { grid-template-columns: 1fr; }
}
</style>
