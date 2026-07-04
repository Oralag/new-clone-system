<template>
  <div v-if="visible" class="ic-overlay" @click.self="cancel">
    <div class="ic-dialog">
      <div class="ic-header">
        <span class="ic-title">{{ t('imageCropper.title') }}</span>
        <div class="ic-header-actions">
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 16/9 }" @click="setRatio(16/9)">16:9</button>
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 1 }" @click="setRatio(1)">1:1</button>
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 4/3 }" @click="setRatio(4/3)">4:3</button>
          <button class="ic-ratio-btn" :class="{ active: Math.abs(aspectRatio - 9/19.5) < 0.001 }" @click="setRatio(9/19.5)">小程序首页</button>
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 0 }" @click="setRatio(0)">{{ t('imageCropper.free') }}</button>
        </div>
        <button class="ic-close" @click="cancel">✕</button>
      </div>
      <div class="ic-body">
        <div class="ic-canvas-wrap" ref="wrapRef">
          <img ref="imgRef" :src="src" class="ic-img" @load="initCropper" />
        </div>
        <div class="ic-toolbar">
          <div class="ic-tools">
            <button class="ic-tool-btn" @click="zoomBy(0.15)" title="放大">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button class="ic-tool-btn" @click="zoomBy(-0.15)" title="缩小">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button class="ic-tool-btn" @click="resetCrop" title="重置">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            </button>
          </div>
          <span class="ic-hint">拖动图片移位 · 拖裁剪框边角调整选区 · 滚轮缩放</span>
        </div>
      </div>
      <div class="ic-footer">
        <button class="ic-cancel" @click="cancel">{{ t('common.cancel') }}</button>
        <button class="ic-confirm" @click="confirm">
          {{ t('imageCropper.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
const ready = ref(false)
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  src: string
  ratio?: number  // 0 = free, undefined = 16/9
}>()

const emit = defineEmits<{
  confirm: [base64: string]
  cancel: []
}>()

const imgRef = ref<HTMLImageElement>()
const wrapRef = ref<HTMLDivElement>()
let cropper: Cropper | null = null
const aspectRatio = ref(props.ratio ?? 16/9)

function setRatio(r: number) {
  aspectRatio.value = r
  cropper?.setAspectRatio(r === 0 ? NaN : r)
}

function zoomBy(ratio: number) {
  cropper?.zoom(ratio)
}

function resetCrop() {
  cropper?.reset()
}

function initCropper() {
  if (cropper) { cropper.destroy(); cropper = null }
  ready.value = false
  if (!imgRef.value || !wrapRef.value) return

  // 根据图片原始宽高比动态设置容器高度，最大 55vh
  const maxH = Math.floor(window.innerHeight * 0.55)
  const wrapW = wrapRef.value.clientWidth || 640
  const natW = imgRef.value.naturalWidth || wrapW
  const natH = imgRef.value.naturalHeight || 360
  const calcH = Math.round(wrapW * natH / natW)
  wrapRef.value.style.height = Math.min(calcH, maxH) + 'px'

  cropper = new Cropper(imgRef.value, {
    aspectRatio: aspectRatio.value === 0 ? NaN : aspectRatio.value,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.85,
    responsive: true,
    background: true,
  })
}

watch(() => props.visible, async (v) => {
  if (v) {
    await nextTick()
    if (imgRef.value?.complete) {
      initCropper()
    }
  } else {
    cropper?.destroy(); cropper = null
  }
})

function confirm() {
  if (!cropper) return
  const canvas = cropper.getCroppedCanvas({ maxWidth: 1400, imageSmoothingQuality: 'high' })
  emit('confirm', canvas.toDataURL('image/jpeg', 0.85))
}

function cancel() {
  emit('cancel')
}

onUnmounted(() => {
  cropper?.destroy()
})
</script>

<style scoped>
.ic-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 99999;
  display: flex; align-items: center; justify-content: center;
}
.ic-dialog {
  background: #fff; border-radius: 20px; width: min(700px, 95vw);
  max-height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 40px 80px rgba(0,0,0,0.3); overflow: hidden;
}
.ic-header {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.07); flex-shrink: 0;
}
.ic-title { font-size: 15px; font-weight: 700; flex-shrink: 0; }
.ic-header-actions { display: flex; gap: 6px; flex: 1; }
.ic-ratio-btn {
  padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 6px;
  border: 1.5px solid rgba(0,0,0,0.15); background: transparent; cursor: pointer;
  color: rgba(29,29,31,0.5); transition: all 0.15s;
}
.ic-ratio-btn.active { border-color: #7c3aed; background: rgba(124,58,237,0.08); color: #7c3aed; }
.ic-close { background: none; border: none; cursor: pointer; font-size: 18px; color: rgba(29,29,31,0.4); margin-left: auto; flex-shrink: 0; }
.ic-body { flex: 1; overflow: hidden; min-height: 0; background: #1a1a1a; display: flex; flex-direction: column; }
.ic-canvas-wrap { width: 100%; height: auto; min-height: 200px; max-height: 55vh; }
.ic-img { display: block; max-width: 100%; max-height: 100%; }
.ic-toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 16px; background: #262626; color: rgba(255,255,255,0.75);
  border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
}
.ic-tools { display: flex; gap: 6px; }
.ic-tool-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; transition: background 0.15s;
}
.ic-tool-btn:hover { background: rgba(255,255,255,0.15); }
.ic-hint { font-size: 11px; color: rgba(255,255,255,0.55); }
@media (max-width: 520px) {
  .ic-hint { display: none; }
}
.ic-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 20px; border-top: 1px solid rgba(0,0,0,0.07); flex-shrink: 0;
}
.ic-cancel {
  padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1);
  background: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
}
.ic-confirm {
  padding: 10px 24px; border-radius: 10px; background: #7c3aed; color: #fff;
  border: none; font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.ic-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
