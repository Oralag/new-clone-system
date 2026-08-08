<template>
  <div class="studio">

    <!-- ── 顶栏 ── -->
    <div class="studio-header">
      <div class="studio-title-group">
        <span class="studio-icon">🖼️</span>
        <div>
          <div class="studio-title">内容工作台</div>
          <div class="studio-sub">上传产品素材 · 一键裁切 · AI生文案 · 打包下载</div>
        </div>
      </div>
      <!-- 平台选择 -->
      <div class="platform-tabs">
        <button
          v-for="p in PLATFORMS"
          :key="p.key"
          class="ptab"
          :class="{ active: platform === p.key }"
          @click="platform = p.key"
        >
          <span>{{ p.emoji }}</span>
          {{ p.name }}
          <span class="ptab-size">{{ p.size }}</span>
        </button>
      </div>
    </div>

    <div class="studio-body">

      <!-- ══ 左栏：上传 & 配置 ══ -->
      <aside class="studio-left">

        <!-- 上传区 -->
        <div
          class="upload-zone"
          :class="{ dragging }"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <input ref="fileInput" type="file" multiple accept="image/*" style="display:none" @change="onFileChange" />
          <div class="upload-icon">📷</div>
          <div class="upload-tip">拖入或点击上传产品图片</div>
          <div class="upload-hint">支持 JPG/PNG，可批量</div>
        </div>

        <!-- 文件列表 -->
        <div v-if="files.length" class="file-list">
          <div v-for="(f, i) in files" :key="i" class="file-item">
            <img :src="f.preview" class="file-thumb" />
            <div class="file-info">
              <div class="file-name">{{ f.name }}</div>
              <div class="file-meta">{{ f.size }} · {{ f.orientation }}</div>
            </div>
            <button class="file-del" @click="removeFile(i)">×</button>
          </div>
        </div>

        <!-- 素材库入口 -->
        <button class="lib-btn" @click="$router.push('/agent/assets')">
          🗂️ 从素材库选取
        </button>

        <!-- 配置区 -->
        <div class="config-card">
          <div class="config-title">文字浮层</div>
          <div class="config-row">
            <label class="config-label">主标题</label>
            <input v-model="textLine1" class="config-input" placeholder="如：73%高钙 · 30%蛋白质" />
          </div>
          <div class="config-row">
            <label class="config-label">副标题</label>
            <input v-model="textLine2" class="config-input" placeholder="如：牧区纯坊 · 草原直发" />
          </div>
          <div class="config-row">
            <label class="config-label">仅封面加字</label>
            <input type="checkbox" v-model="onlyCover" style="accent-color:#6366f1" />
          </div>
          <div class="config-row" style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0">
            <label class="config-label">品牌Logo水印</label>
            <input type="checkbox" v-model="showLogo" style="accent-color:#6366f1" />
          </div>
          <div v-if="showLogo" class="logo-preview-row">
            <img v-if="brandLogoUrl" :src="brandLogoUrl" class="logo-thumb" />
            <span v-else class="logo-missing">品牌配置中未设置Logo</span>
            <label class="logo-upload-btn">
              更换
              <input type="file" accept="image/png,image/svg+xml" style="display:none" @change="onLogoUpload" />
            </label>
          </div>
          <div class="config-row">
            <label class="config-label">横版填充</label>
            <select v-model="fillMode" class="config-select">
              <option value="blur">模糊背景</option>
              <option value="color">品牌色背景</option>
              <option value="crop">居中裁切</option>
            </select>
          </div>
        </div>

        <!-- 处理按钮 -->
        <button
          class="process-btn"
          :disabled="!files.length || processing"
          @click="processAll"
        >
          <span v-if="processing">处理中 {{ doneCount }}/{{ files.length }}…</span>
          <span v-else>一键处理 {{ files.length }} 张图片</span>
        </button>
      </aside>

      <!-- ══ 右栏：预览 & 文案 ══ -->
      <div class="studio-right">

        <!-- 预览网格 -->
        <div v-if="results.length" class="preview-grid">
          <div v-for="(r, i) in results" :key="i" class="preview-card">
            <img :src="r.dataUrl" class="preview-img" />
            <div class="preview-footer">
              <span class="preview-label">{{ r.name }}</span>
              <button class="dl-btn" @click="downloadOne(r)">↓</button>
            </div>
          </div>
        </div>
        <div v-else-if="!files.length" class="preview-empty">
          上传素材后，处理结果将在这里预览
        </div>
        <div v-else class="preview-empty">
          点击左侧「一键处理」开始
        </div>

        <!-- 文案生成 -->
        <div v-if="results.length" class="copy-section">
          <div class="copy-section-hd">
            <span class="copy-title">AI 生成文案</span>
            <button class="gen-btn" :disabled="genLoading" @click="generateCopy">
              {{ genLoading ? '生成中…' : '生成' + platformObj?.name + '文案' }}
            </button>
          </div>
          <div v-if="generatedCopy" class="copy-output">
            <div class="copy-block">
              <div class="copy-block-label">标题</div>
              <div class="copy-block-text">{{ generatedCopy.title }}</div>
            </div>
            <div class="copy-block">
              <div class="copy-block-label">正文</div>
              <pre class="copy-block-text copy-body">{{ generatedCopy.body }}</pre>
            </div>
            <div class="copy-block">
              <div class="copy-block-label">话题标签</div>
              <div class="copy-block-text copy-tags">{{ generatedCopy.tags }}</div>
            </div>
            <button class="copy-all-btn" @click="copyToClipboard">复制全部文案</button>
          </div>
        </div>

        <!-- 打包下载 -->
        <div v-if="results.length" class="export-bar">
          <button class="export-btn" @click="downloadAll">
            打包下载全部 {{ results.length }} 张
          </button>
          <span class="export-hint">逐张下载，可直接上传{{ platformObj?.name }}</span>
        </div>
      </div>
    </div>

    <!-- 隐藏画布 -->
    <canvas ref="canvasRef" style="display:none" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'

const brandStore = useBrandStore()
const router = useRouter()

onMounted(async () => {
  await loadLogoImg()
  const raw = sessionStorage.getItem('studio_assets')
  if (!raw) return
  sessionStorage.removeItem('studio_assets')
  const paths: string[] = JSON.parse(raw)
  for (const path of paths) {
    try {
      const res = await fetch(path)
      const blob = await res.blob()
      const name = decodeURIComponent(path.split('/').pop() || path)
      const file = new File([blob], name, { type: blob.type })
      await addFiles([file])
    } catch {}
  }
})

const PLATFORMS = [
  { key: 'xhs',   name: '小红书', emoji: '📕', size: '3:4', w: 1080, h: 1440 },
  { key: 'dy',    name: '抖音',   emoji: '🎵', size: '9:16', w: 1080, h: 1920 },
  { key: 'wx',    name: '微信',   emoji: '💬', size: '16:9', w: 1440, h: 810  },
  { key: 'sq',    name: '通用方形', emoji: '⬛', size: '1:1', w: 1080, h: 1080 },
]

const platform = ref('xhs')
const platformObj = computed(() => PLATFORMS.find(p => p.key === platform.value))

const textLine1 = ref(brandStore.brand?.sellingPoints?.split('\n')[0] || '')
const textLine2 = ref(brandStore.brand?.name || '')
const onlyCover = ref(true)
const fillMode = ref<'blur' | 'color' | 'crop'>('blur')
const showLogo = ref(true)

// Logo: 优先用白色版（深色背景图上更清晰）
const brandLogoUrl = computed(() =>
  brandStore.brand?.logoUrlWhite || brandStore.brand?.logoUrl || null
)
let logoImg: HTMLImageElement | null = null

async function loadLogoImg() {
  const url = brandLogoUrl.value
  if (!url) { logoImg = null; return }
  try { logoImg = await loadImg(url) } catch { logoImg = null }
}

function onLogoUpload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const url = URL.createObjectURL(f)
  // 临时覆盖到品牌配置（仅本次会话）
  if (brandStore.brand) {
    brandStore.brand.logoUrlWhite = url
    brandStore.brand.logoUrl = url
  }
  loadImg(url).then(img => { logoImg = img })
}

interface FileItem { file: File; name: string; preview: string; size: string; orientation: string }
interface Result  { name: string; dataUrl: string; blob?: Blob }

const files = ref<FileItem[]>([])
const results = ref<Result[]>([])
const processing = ref(false)
const doneCount = ref(0)
const fileInput = ref<HTMLInputElement>()
const canvasRef = ref<HTMLCanvasElement>()
const dragging = ref(false)
const genLoading = ref(false)
const generatedCopy = ref<{ title: string; body: string; tags: string } | null>(null)

function formatSize(b: number) {
  return b > 1048576 ? (b / 1048576).toFixed(1) + 'MB' : (b / 1024).toFixed(0) + 'KB'
}

async function addFiles(rawFiles: FileList | File[]) {
  for (const f of Array.from(rawFiles)) {
    if (!f.type.startsWith('image/')) continue
    const url = URL.createObjectURL(f)
    const img = await loadImg(url)
    files.value.push({
      file: f,
      name: f.name,
      preview: url,
      size: formatSize(f.size),
      orientation: img.width > img.height ? '横版' : img.width < img.height ? '竖版' : '方形',
    })
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(input.files)
}
function onDrop(e: DragEvent) {
  dragging.value = false
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
}
function removeFile(i: number) {
  files.value.splice(i, 1)
  results.value.splice(i, 1)
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

async function processOne(item: FileItem, index: number): Promise<Result> {
  const p = platformObj.value!
  const canvas = canvasRef.value!
  canvas.width  = p.w
  canvas.height = p.h
  const ctx = canvas.getContext('2d')!
  const img = await loadImg(item.preview)

  const sw = img.width, sh = img.height
  const tw = p.w, th = p.h
  const sRatio = sw / sh, tRatio = tw / th

  if (fillMode.value === 'crop' || Math.abs(sRatio - tRatio) < 0.05) {
    // Center crop
    const scale = Math.max(tw / sw, th / sh)
    const dw = sw * scale, dh = sh * scale
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh)

  } else if (sRatio > tRatio + 0.05) {
    // Landscape source
    if (fillMode.value === 'blur') {
      // Draw blurred bg
      const bgScale = Math.max(tw / sw, th / sh)
      ctx.filter = 'blur(24px) brightness(0.65)'
      ctx.drawImage(img, (tw - sw * bgScale) / 2, (th - sh * bgScale) / 2, sw * bgScale, sh * bgScale)
      ctx.filter = 'none'
      // White tint
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, 0, tw, th)
    } else {
      // Solid brand color
      ctx.fillStyle = brandStore.brand?.primaryColor || '#87CEEB'
      ctx.fillRect(0, 0, tw, th)
    }
    // Main image: fit width, center vertically
    const mh = Math.round(tw / sRatio)
    ctx.drawImage(img, 0, Math.round((th - mh) / 2), tw, mh)

  } else {
    // Portrait: fit height, center horizontally
    const mw = Math.round(th * sRatio)
    if (fillMode.value === 'blur') {
      const bgScale = Math.max(tw / sw, th / sh)
      ctx.filter = 'blur(24px) brightness(0.65)'
      ctx.drawImage(img, (tw - sw * bgScale) / 2, (th - sh * bgScale) / 2, sw * bgScale, sh * bgScale)
      ctx.filter = 'none'
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, 0, tw, th)
    } else {
      ctx.fillStyle = brandStore.brand?.primaryColor || '#87CEEB'
      ctx.fillRect(0, 0, tw, th)
    }
    ctx.drawImage(img, Math.round((tw - mw) / 2), 0, mw, th)
  }

  // Text overlay
  const needText = textLine1.value || textLine2.value
  const isFirst = index === 0
  if (needText && (!onlyCover.value || isFirst)) {
    const barH = logoImg && showLogo.value ? 130 : 110
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, th - barH, tw, barH)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    if (textLine1.value) {
      ctx.font = `bold ${Math.round(tw * 0.038)}px PingFang SC, sans-serif`
      ctx.fillText(textLine1.value, tw / 2, th - barH + 42)
    }
    if (textLine2.value) {
      ctx.font = `${Math.round(tw * 0.026)}px PingFang SC, sans-serif`
      ctx.fillStyle = '#dddddd'
      ctx.fillText(textLine2.value, tw / 2, th - barH + 82)
    }
  }

  // Logo watermark — 右下角，统一位置固定大小
  if (showLogo.value && logoImg) {
    const logoW = Math.round(tw * 0.32)         // 宽度 = 画布的32%
    const logoH = Math.round(logoW * (logoImg.height / logoImg.width))
    const marginR = Math.round(tw * 0.04)
    const marginB = Math.round(th * 0.022)
    ctx.globalAlpha = 0.82
    ctx.drawImage(logoImg, tw - logoW - marginR, th - logoH - marginB, logoW, logoH)
    ctx.globalAlpha = 1
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  return { name: item.name.replace(/\.[^.]+$/, '') + `_${p.key}.jpg`, dataUrl }
}

async function processAll() {
  processing.value = true
  doneCount.value = 0
  results.value = []
  for (let i = 0; i < files.value.length; i++) {
    const r = await processOne(files.value[i], i)
    results.value.push(r)
    doneCount.value++
  }
  processing.value = false
}

function downloadOne(r: Result) {
  const a = document.createElement('a')
  a.href = r.dataUrl
  a.download = r.name
  a.click()
}

async function downloadAll() {
  for (let i = 0; i < results.value.length; i++) {
    await new Promise(res => setTimeout(res, 150))
    downloadOne(results.value[i])
  }
}

async function generateCopy() {
  genLoading.value = true
  generatedCopy.value = null
  const brand = brandStore.brand
  const p = platformObj.value!
  const prompt = `请为以下品牌生成一篇${p.name}推广帖，要求真实、有小红书感、不要广告腔。

品牌：${brand?.name || ''}
口号：${brand?.slogan || ''}
核心卖点：${brand?.sellingPoints || ''}
产品：${brand?.products?.join('、') || ''}

请返回JSON格式：
{"title":"标题（20字内，有钩子）","body":"正文（200-300字，口语化，有段落）","tags":"10个话题标签"}`

  try {
    const token = localStorage.getItem('erp_token') || ''
    const resp = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false }),
    })
    let text = ''
    const reader = resp.body!.getReader()
    const dec = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = dec.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') break
        try {
          const ev = JSON.parse(data)
          if (ev.type === 'text') text += ev.text
        } catch {}
      }
    }
    const match = text.match(/\{[\s\S]*\}/)
    if (match) generatedCopy.value = JSON.parse(match[0])
    else generatedCopy.value = { title: '生成失败', body: text, tags: '' }
  } catch (e) {
    generatedCopy.value = { title: '请求失败', body: String(e), tags: '' }
  }
  genLoading.value = false
}

function copyToClipboard() {
  if (!generatedCopy.value) return
  const text = `${generatedCopy.value.title}\n\n${generatedCopy.value.body}\n\n${generatedCopy.value.tags}`
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.studio { display: flex; flex-direction: column; gap: 16px; max-width: 1300px; }

.studio-header {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.studio-title-group { display: flex; align-items: center; gap: 12px; }
.studio-icon { font-size: 28px; }
.studio-title { font-size: 17px; font-weight: 700; color: #111; }
.studio-sub   { font-size: 12px; color: #888; margin-top: 2px; }

.platform-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.ptab {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  transition: all .15s;
}
.ptab.active { border-color: #6366f1; background: #eef2ff; color: #6366f1; font-weight: 600; }
.ptab-size { font-size: 11px; color: #aaa; }

.studio-body { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }

/* Left */
.studio-left { display: flex; flex-direction: column; gap: 12px; }

.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: all .15s;
  background: #fafafa;
}
.upload-zone.dragging { border-color: #6366f1; background: #eef2ff; }
.upload-zone:hover { border-color: #6366f1; }
.upload-icon { font-size: 32px; margin-bottom: 8px; }
.upload-tip { font-size: 14px; font-weight: 600; color: #374151; }
.upload-hint { font-size: 12px; color: #9ca3af; margin-top: 4px; }

.file-list { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
.file-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: #f9fafb; border-radius: 8px; }
.file-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-meta { font-size: 11px; color: #9ca3af; }
.file-del { background: none; border: none; color: #d1d5db; cursor: pointer; font-size: 16px; padding: 0 4px; }
.file-del:hover { color: #ef4444; }

.config-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 14px 16px; }
.config-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px; }
.config-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.config-label { font-size: 12px; color: #6b7280; width: 64px; flex-shrink: 0; }
.config-input  { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px; font-size: 12px; outline: none; }
.config-input:focus { border-color: #6366f1; }
.config-select { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px; font-size: 12px; }

.logo-preview-row {
  display: flex; align-items: center; gap: 8px; margin-top: 6px;
  padding: 6px 8px; background: #f9fafb; border-radius: 8px;
}
.logo-thumb { height: 28px; width: auto; max-width: 120px; object-fit: contain; background: #333; border-radius: 4px; padding: 3px 6px; }
.logo-missing { font-size: 11px; color: #9ca3af; flex: 1; }
.logo-upload-btn {
  font-size: 11px; color: #6366f1; cursor: pointer; padding: 3px 8px;
  border: 1px solid #c7d2fe; border-radius: 5px; white-space: nowrap;
}
.logo-upload-btn:hover { background: #eef2ff; }

.lib-btn {
  width: 100%;
  padding: 10px;
  background: #f3f4f6;
  color: #374151;
  border: 1.5px dashed #d1d5db;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
}
.lib-btn:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }

.process-btn {
  width: 100%;
  padding: 12px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.process-btn:hover:not(:disabled) { background: #4f46e5; }
.process-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Right */
.studio-right { display: flex; flex-direction: column; gap: 16px; }

.preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.preview-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 8px; overflow: hidden; }
.preview-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
.preview-footer { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; }
.preview-label { font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.dl-btn { background: none; border: 1px solid #e5e7eb; border-radius: 5px; padding: 2px 8px; font-size: 13px; cursor: pointer; color: #6366f1; }
.dl-btn:hover { background: #eef2ff; }

.preview-empty {
  background: #fff;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  padding: 60px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Copy section */
.copy-section { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 16px; }
.copy-section-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.copy-title { font-size: 14px; font-weight: 600; color: #374151; }
.gen-btn {
  padding: 7px 16px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.gen-btn:disabled { opacity: .5; }
.gen-btn:hover:not(:disabled) { background: #d97706; }

.copy-output { display: flex; flex-direction: column; gap: 10px; }
.copy-block { background: #f9fafb; border-radius: 8px; padding: 10px 12px; }
.copy-block-label { font-size: 11px; color: #9ca3af; margin-bottom: 4px; font-weight: 500; }
.copy-block-text { font-size: 13px; color: #374151; line-height: 1.6; }
.copy-body { white-space: pre-wrap; margin: 0; font-family: inherit; }
.copy-all-btn {
  align-self: flex-start;
  padding: 7px 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.export-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 10px;
}
.export-btn {
  padding: 10px 24px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.export-btn:hover { background: #059669; }
.export-hint { font-size: 12px; color: #9ca3af; }
</style>
