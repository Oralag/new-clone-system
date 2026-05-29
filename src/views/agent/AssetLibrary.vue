<template>
  <div class="library">

    <div class="lib-header">
      <div class="lib-title-group">
        <span class="lib-icon">🗂️</span>
        <div>
          <div class="lib-title">素材库</div>
          <div class="lib-sub">{{ totalCount }} 张素材 · 点击选取后可直接在内容工作台使用</div>
        </div>
      </div>
      <div class="lib-actions">
        <button class="upload-btn" @click="triggerUpload">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v14M8 6l4-4 4 4"/><path d="M3 18v2h18v-2"/></svg>
          上传新素材
        </button>
        <button v-if="selected.length" class="use-btn" @click="goToStudio">
          在内容工作台使用 ({{ selected.length }})
        </button>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      上传中 {{ uploadDone }}/{{ uploadTotal }}…
    </div>
    <input ref="uploadInput" type="file" multiple accept="image/*" style="display:none" @change="onUpload" />

    <!-- 分类标签 -->
    <div class="cat-tabs">
      <button
        v-for="cat in manifest.categories"
        :key="cat.id"
        class="cat-tab"
        :class="{ active: activeCat === cat.id }"
        @click="activeCat = cat.id; activeGroup = null"
      >{{ cat.name }}</button>
    </div>

    <!-- 分组标签 -->
    <div v-if="currentCat" class="group-tabs">
      <button
        class="gtab"
        :class="{ active: activeGroup === null }"
        @click="activeGroup = null"
      >全部</button>
      <button
        v-for="g in currentCat.groups"
        :key="g.id"
        class="gtab"
        :class="{ active: activeGroup === g.id }"
        @click="activeGroup = g.id"
      >{{ g.name }} ({{ g.images.length }})</button>
    </div>

    <!-- 图片网格 -->
    <div class="img-grid">
      <div
        v-for="img in currentImages"
        :key="img.path"
        class="img-card"
        :class="{ selected: isSelected(img) }"
        @click="toggleSelect(img)"
      >
        <div class="img-wrap">
          <img :src="img.path" :alt="img.name" loading="lazy" />
          <div v-if="isSelected(img)" class="img-check">✓</div>
        </div>
        <div class="img-label">{{ img.name }}</div>
        <div class="img-meta">{{ img.w }}×{{ img.h }}</div>
      </div>
    </div>

    <div v-if="!currentImages.length" class="empty">
      暂无素材
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface AssetImage { name: string; path: string; w: number; h: number }
interface AssetGroup  { id: string; name: string; images: AssetImage[] }
interface AssetCat    { id: string; name: string; groups: AssetGroup[] }
interface Manifest    { categories: AssetCat[] }

const router = useRouter()
const manifest = ref<Manifest>({ categories: [] })
const activeCat   = ref<string>('')
const activeGroup = ref<string | null>(null)
const selected    = ref<AssetImage[]>([])
const uploading   = ref(false)
const uploadDone  = ref(0)
const uploadTotal = ref(0)
const uploadInput = ref<HTMLInputElement>()

onMounted(async () => {
  const res = await fetch('/brand-images/manifest.json')
  manifest.value = await res.json()
  if (manifest.value.categories.length) activeCat.value = manifest.value.categories[0].id
})

const currentCat = computed(() =>
  manifest.value.categories.find(c => c.id === activeCat.value)
)

const currentImages = computed(() => {
  if (!currentCat.value) return []
  if (!activeGroup.value) return currentCat.value.groups.flatMap(g => g.images)
  return currentCat.value.groups.find(g => g.id === activeGroup.value)?.images ?? []
})

const totalCount = computed(() =>
  manifest.value.categories.reduce((s, c) => s + c.groups.reduce((ss, g) => ss + g.images.length, 0), 0)
)

function isSelected(img: AssetImage) {
  return selected.value.some(s => s.path === img.path)
}
function toggleSelect(img: AssetImage) {
  if (isSelected(img)) selected.value = selected.value.filter(s => s.path !== img.path)
  else selected.value.push(img)
}

function goToStudio() {
  // 把选中图片的URL传给内容工作台
  sessionStorage.setItem('studio_assets', JSON.stringify(selected.value.map(s => s.path)))
  router.push('/agent/studio')
}

function triggerUpload() { uploadInput.value?.click() }

async function onUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  uploading.value = true
  uploadDone.value = 0
  uploadTotal.value = files.length

  // 上传到服务器（Pages Function）
  for (const file of Array.from(files)) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', activeCat.value || '未分类')
    formData.append('group', activeGroup.value || '上传')
    try {
      await fetch('/api/assets/upload', { method: 'POST', body: formData })
    } catch {}
    uploadDone.value++
  }

  uploading.value = false
  // 刷新 manifest
  const res = await fetch('/brand-images/manifest.json?t=' + Date.now())
  manifest.value = await res.json()
}
</script>

<style scoped>
.library { display: flex; flex-direction: column; gap: 14px; max-width: 1300px; }

.lib-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px; padding: 16px 20px;
}
.lib-title-group { display: flex; align-items: center; gap: 12px; }
.lib-icon { font-size: 28px; }
.lib-title { font-size: 17px; font-weight: 700; color: #111; }
.lib-sub   { font-size: 12px; color: #888; margin-top: 2px; }
.lib-actions { display: flex; gap: 10px; }

.upload-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: 1.5px solid #e5e7eb; border-radius: 8px;
  background: #fff; cursor: pointer; font-size: 13px; color: #374151;
}
.upload-btn:hover { border-color: #6366f1; color: #6366f1; }

.use-btn {
  padding: 8px 18px; background: #6366f1; color: #fff;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.use-btn:hover { background: #4f46e5; }

.upload-progress {
  background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px;
  padding: 10px 16px; font-size: 13px; color: #92400e;
}

.cat-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.cat-tab {
  padding: 8px 18px; border: 1.5px solid #e5e7eb; border-radius: 20px;
  background: #fff; cursor: pointer; font-size: 13px; font-weight: 500; color: #555;
}
.cat-tab.active { border-color: #6366f1; background: #eef2ff; color: #6366f1; }

.group-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.gtab {
  padding: 5px 14px; border: 1px solid #e5e7eb; border-radius: 6px;
  background: #f9fafb; cursor: pointer; font-size: 12px; color: #6b7280;
}
.gtab.active { border-color: #10b981; background: #ecfdf5; color: #059669; font-weight: 600; }

.img-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.img-card {
  background: #fff; border: 2px solid transparent; border-radius: 10px;
  overflow: hidden; cursor: pointer; transition: all .15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.img-card:hover { border-color: #c7d2fe; transform: translateY(-2px); }
.img-card.selected { border-color: #6366f1; }

.img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; background: #f3f4f6; }
.img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-check {
  position: absolute; top: 8px; right: 8px;
  width: 24px; height: 24px; background: #6366f1; color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
}
.img-label { padding: 6px 8px 2px; font-size: 12px; font-weight: 500; color: #374151; }
.img-meta  { padding: 0 8px 8px; font-size: 11px; color: #9ca3af; }

.empty { text-align: center; padding: 60px; color: #9ca3af; font-size: 14px; }
</style>
