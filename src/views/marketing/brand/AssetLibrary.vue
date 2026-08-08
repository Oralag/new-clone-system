<template>
  <div class="library">

    <div class="lib-header">
      <div class="lib-title-group">
        <span class="lib-icon">🗂️</span>
        <div>
          <div class="lib-title">素材库 · {{ activeBrandName }}</div>
          <div class="lib-sub">{{ totalCount }} 张素材 · 每个品牌素材独立，切换品牌即切换素材</div>
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
      「{{ activeBrandName }}」暂无素材，点右上「上传新素材」为该品牌添加图片
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'

interface AssetImage { name: string; path: string; w: number; h: number }
interface AssetGroup  { id: string; name: string; images: AssetImage[] }
interface AssetCat    { id: string; name: string; groups: AssetGroup[] }
interface Manifest    { categories: AssetCat[] }

const router = useRouter()
const brandStore = useBrandStore()
const activeBrandId = computed(() => brandStore.activeBrand?.id || 'default')
const activeBrandName = computed(() => brandStore.activeBrand?.name || '未命名品牌')

// 预置素材归属：静态 manifest 里的素材属于牧区纯坊，其他品牌不显示
const NOMADIC_BRAND_ID = 'mucq_default'
const rawManifest = ref<Manifest>({ categories: [] })
const manifest = ref<Manifest>({ categories: [] })
const activeCat   = ref<string>('')
const activeGroup = ref<string | null>(null)
const selected    = ref<AssetImage[]>([])
const uploading   = ref(false)
const uploadDone  = ref(0)
const uploadTotal = ref(0)
const uploadInput = ref<HTMLInputElement>()

// 用户上传素材（按品牌隔离）
const uploadedKey = computed(() => `agent_uploaded_assets:${activeBrandId.value}`)
function loadUploaded(key: string): AssetImage[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
const uploadedAssets = ref<AssetImage[]>(loadUploaded(uploadedKey.value))

function rebuildManifest() {
  // 静态品牌素材只对牧区纯坊显示
  const brandOwnedCats = activeBrandId.value === NOMADIC_BRAND_ID
    ? rawManifest.value.categories
    : []
  const cats = [...brandOwnedCats]
  if (uploadedAssets.value.length) {
    cats.push({ id: '__uploaded__', name: '我的上传', groups: [{ id: 'up', name: '上传素材', images: uploadedAssets.value }] })
  }
  manifest.value = { categories: cats }
  if (!cats.find(c => c.id === activeCat.value)) {
    activeCat.value = cats[0]?.id || ''
    activeGroup.value = null
  }
}

// 切品牌时重载上传素材 + 重建 manifest
watch(activeBrandId, () => {
  uploadedAssets.value = loadUploaded(uploadedKey.value)
  rebuildManifest()
})

onMounted(async () => {
  try {
    const res = await fetch('/brand-images/manifest.json')
    rawManifest.value = await res.json()
  } catch { rawManifest.value = { categories: [] } }
  rebuildManifest()
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => resolve(ev.target!.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 0, h: 0 })
    img.src = dataUrl
  })
}

async function onUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  uploading.value = true
  uploadDone.value = 0
  uploadTotal.value = files.length

  // 通过现有 /api/upload-image 存 KV（原 /api/assets/upload 端点不存在）
  const token = localStorage.getItem('erp_token') || ''
  for (const file of Array.from(files)) {
    try {
      const dataUrl = await fileToDataUrl(file)
      const resp = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
        body: JSON.stringify({ data: dataUrl }),
      })
      const json = await resp.json() as { code: number; url: string }
      if (json.code === 1 && json.url) {
        const { w, h } = await imageSize(dataUrl)
        uploadedAssets.value.unshift({ name: file.name, path: json.url, w, h })
      }
    } catch { /* 单张失败不阻断 */ }
    uploadDone.value++
  }

  localStorage.setItem(uploadedKey.value, JSON.stringify(uploadedAssets.value))
  rebuildManifest()
  activeCat.value = '__uploaded__'
  activeGroup.value = null
  uploading.value = false
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
