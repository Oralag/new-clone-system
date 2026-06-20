<template>
  <div class="pr-wrap">
    <div class="pr-header">
      <span class="pr-label">🎨 {{ t('posterRenderer.title') }}</span>
      <div class="pr-btns">
        <button class="pr-btn" @click="downloadPng" :disabled="downloading">
          <svg v-if="!downloading" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v14M8 12l4 4 4-4M3 20h18"/></svg>
          <span class="pr-spin" v-else />
          {{ downloading ? t('posterRenderer.downloading') : t('posterRenderer.downloadPng') }}
        </button>
        <button class="pr-btn secondary" @click="handleSave" :disabled="saving || saved">
          {{ saved ? t('posterRenderer.saved') : t('posterRenderer.saveQueue') }}
        </button>
      </div>
    </div>

    <div class="pr-preview-container" ref="containerRef">
      <div class="pr-scaled-outer" :style="outerStyle">
        <div class="pr-poster-inner" ref="posterRef" v-html="sanitizedHtml" />
      </div>
    </div>

    <div v-if="downloadError" class="pr-error">{{ downloadError }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import html2canvas from 'html2canvas'
import { useTrendingStore } from '@/stores/agent'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  posterHtml: string
  platform?: string
}>()

const emit = defineEmits<{
  (e: 'saved', dataUrl: string): void
}>()

const agentStore = useTrendingStore()
const { t } = useI18n()
const containerRef = ref<HTMLDivElement>()
const posterRef = ref<HTMLDivElement>()
const downloading = ref(false)
const downloadError = ref('')
const saving = ref(false)
const saved = ref(false)
const containerWidth = ref(320)

// 解析海报原始尺寸
const posterSize = computed(() => {
  const widthMatch = props.posterHtml.match(/width:\s*(\d+)px/)
  const heightMatch = props.posterHtml.match(/height:\s*(\d+)px/)
  return {
    w: widthMatch ? parseInt(widthMatch[1]) : 1080,
    h: heightMatch ? parseInt(heightMatch[1]) : 1440,
  }
})

const scale = computed(() => containerWidth.value / posterSize.value.w)

const outerStyle = computed(() => ({
  width: `${containerWidth.value}px`,
  height: `${posterSize.value.h * scale.value}px`,
  overflow: 'hidden',
  position: 'relative' as const,
}))

// 过滤 script 标签
const sanitizedHtml = computed(() =>
  props.posterHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
)

onMounted(async () => {
  await nextTick()
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth || 320
  }
})

// 对 posterRef 内部元素应用缩放
function applyScale() {
  if (!posterRef.value) return
  const el = posterRef.value.firstElementChild as HTMLElement
  if (el) {
    el.style.transform = `scale(${scale.value})`
    el.style.transformOrigin = 'top left'
  }
}

// Watch and apply scale after html renders
const posterSizeTrigger = computed(() => `${props.posterHtml}-${scale.value}`)
watch(posterSizeTrigger, async () => {
  await nextTick()
  applyScale()
}, { immediate: true })

async function renderToCanvas(): Promise<HTMLCanvasElement> {
  // Create off-screen container at full size
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `position:fixed;left:-9999px;top:-9999px;z-index:-1;overflow:hidden;`
  const inner = document.createElement('div')
  inner.innerHTML = sanitizedHtml.value
  const poster = inner.firstElementChild as HTMLElement
  if (poster) {
    poster.style.transform = ''
    poster.style.transformOrigin = ''
  }
  wrapper.appendChild(inner)
  document.body.appendChild(wrapper)

  await nextTick()
  try {
    const canvas = await html2canvas(poster || inner, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      backgroundColor: null,
      width: posterSize.value.w,
      height: posterSize.value.h,
    })
    return canvas
  } finally {
    document.body.removeChild(wrapper)
  }
}

async function downloadPng() {
  downloading.value = true
  downloadError.value = ''
  try {
    const canvas = await renderToCanvas()
    const link = document.createElement('a')
    link.download = `poster-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success(t('posterRenderer.downloadSuccess'))
  } catch (e: any) {
    downloadError.value = t('posterRenderer.downloadFailed')
    ElMessage.error(t('posterRenderer.downloadError'))
  } finally {
    downloading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    let dataUrl = ''
    try {
      const canvas = await renderToCanvas()
      dataUrl = canvas.toDataURL('image/png')
    } catch {
      // 保存失败时用空URL，保留HTML内容
    }

    agentStore.setFlowResults([
      ...agentStore.flowResults,
      {
        platform: props.platform || 'xiaohongshu',
        platformName: props.platform === 'douyin'
          ? t('posterRenderer.platformDouyin')
          : props.platform === 'weibo'
            ? t('posterRenderer.platformWeibo')
            : t('posterRenderer.platformXhs'),
        topic: '',
        type: 'poster',
        content: props.posterHtml,
        imageUrl: dataUrl || undefined,
      },
    ])
    saved.value = true
    emit('saved', dataUrl)
    ElMessage({ message: t('posterRenderer.savedToast'), type: 'success', duration: 2500 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.pr-wrap {
  background: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  margin: 10px 0;
}

.pr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid #efefef;
}
.pr-label {
  font-size: 12px;
  font-weight: 700;
  color: #555;
}
.pr-btns {
  display: flex;
  gap: 6px;
}
.pr-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  background: #1d1d1f;
  color: #fff;
  border: none;
}
.pr-btn:hover:not(:disabled) { background: #333; }
.pr-btn:disabled { opacity: 0.5; cursor: default; }
.pr-btn.secondary {
  background: transparent;
  color: #555;
  border: 1px solid #ddd;
}
.pr-btn.secondary:hover:not(:disabled) { border-color: #10b981; color: #10b981; }
.pr-spin {
  width: 10px; height: 10px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.pr-preview-container {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
}
.pr-scaled-outer {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
}
.pr-poster-inner {
  transform-origin: top left;
}

.pr-error {
  padding: 8px 14px;
  font-size: 11px;
  color: #ef4444;
  background: #fef2f2;
}
</style>
