<template>
  <div v-if="visible" class="ic-overlay" @click.self="cancel">
    <div class="ic-dialog">
      <div class="ic-header">
        <span class="ic-title">裁剪图片</span>
        <div class="ic-header-actions">
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 16/9 }" @click="setRatio(16/9)">16:9</button>
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 1 }" @click="setRatio(1)">1:1</button>
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 4/3 }" @click="setRatio(4/3)">4:3</button>
          <button class="ic-ratio-btn" :class="{ active: aspectRatio === 0 }" @click="setRatio(0)">自由</button>
        </div>
        <button class="ic-close" @click="cancel">✕</button>
      </div>
      <div class="ic-body">
        <div class="ic-canvas-wrap">
          <img ref="imgRef" :src="src" class="ic-img" @load="initCropper" />
        </div>
      </div>
      <div class="ic-footer">
        <button class="ic-cancel" @click="cancel">取消</button>
        <button class="ic-confirm" @click="confirm" :disabled="!ready">
          <svg v-if="!ready" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="ic-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ ready ? '确认裁剪' : '初始化中...' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import Cropper from 'cropperjs/dist/cropper.esm.js'

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
let cropper: Cropper | null = null
const ready = ref(false)
const aspectRatio = ref(props.ratio ?? 16/9)

function setRatio(r: number) {
  aspectRatio.value = r
  cropper?.setAspectRatio(r === 0 ? NaN : r)
}

function initCropper() {
  if (cropper) { cropper.destroy(); cropper = null }
  ready.value = false
  if (!imgRef.value) return
  cropper = new Cropper(imgRef.value, {
    aspectRatio: aspectRatio.value === 0 ? NaN : aspectRatio.value,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.85,
    responsive: true,
    background: true,
    ready() { ready.value = true },
  })
}

watch(() => props.visible, async (v) => {
  if (v) {
    await nextTick()
    // img load event will trigger initCropper
  } else {
    cropper?.destroy(); cropper = null
    ready.value = false
  }
})

function confirm() {
  if (!cropper || !ready.value) return
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

<style>
/* cropperjs core styles (no external CSS file in v2) */
.cropper-container{direction:ltr;font-size:0;line-height:0;position:relative;touch-action:none;user-select:none}.cropper-container img{display:block;height:100%;image-orientation:0deg;max-height:none!important;max-width:none!important;min-height:0!important;min-width:0!important;width:100%}.cropper-wrap-box,.cropper-canvas,.cropper-drag-box,.cropper-crop-box,.cropper-modal{bottom:0;left:0;position:absolute;right:0;top:0}.cropper-wrap-box,.cropper-canvas{overflow:hidden}.cropper-drag-box{background-color:#fff;opacity:0}.cropper-modal{background-color:#000;opacity:.5}.cropper-view-box{display:block;height:100%;outline:1px solid #39f;outline-color:rgba(51,153,255,.75);overflow:hidden;width:100%}.cropper-dashed{border:0 dashed #eee;display:block;opacity:.5;position:absolute}.cropper-dashed.dashed-h{border-bottom-width:1px;border-top-width:1px;height:calc(100% / 3);left:0;top:calc(100% / 3);width:100%}.cropper-dashed.dashed-v{border-left-width:1px;border-right-width:1px;height:100%;left:calc(100% / 3);top:0;width:calc(100% / 3)}.cropper-center{display:block;height:0;left:50%;opacity:.75;position:absolute;top:50%;width:0}.cropper-center::before,.cropper-center::after{background-color:#eee;content:" ";display:block;position:absolute}.cropper-center::before{height:1px;left:-3px;top:0;width:7px}.cropper-center::after{height:7px;left:0;top:-3px;width:1px}.cropper-face,.cropper-line,.cropper-point{display:block;height:100%;opacity:.1;position:absolute;width:100%}.cropper-face{background-color:#fff;left:0;top:0}.cropper-line{background-color:#39f}.cropper-line.line-e{cursor:ew-resize;right:-3px;top:0;width:5px}.cropper-line.line-n{cursor:ns-resize;height:5px;left:0;top:-3px}.cropper-line.line-w{cursor:ew-resize;left:-3px;top:0;width:5px}.cropper-line.line-s{bottom:-3px;cursor:ns-resize;height:5px;left:0}.cropper-point{background-color:#39f;height:5px;opacity:.75;width:5px}.cropper-point.point-e{cursor:ew-resize;margin-top:-3px;right:-3px;top:50%}.cropper-point.point-n{cursor:ns-resize;left:50%;margin-left:-3px;top:-3px}.cropper-point.point-w{cursor:ew-resize;left:-3px;margin-top:-3px;top:50%}.cropper-point.point-s{bottom:-3px;cursor:s-resize;left:50%;margin-left:-3px}.cropper-point.point-ne{cursor:nesw-resize;right:-3px;top:-3px}.cropper-point.point-nw{cursor:nwse-resize;left:-3px;top:-3px}.cropper-point.point-sw{bottom:-3px;cursor:nesw-resize;left:-3px}.cropper-point.point-se{bottom:-3px;cursor:nwse-resize;height:20px;opacity:1;right:-3px;width:20px}@media(min-width:768px){.cropper-point.point-se{height:15px;width:15px}}@media(min-width:992px){.cropper-point.point-se{height:10px;width:10px}}@media(min-width:1200px){.cropper-point.point-se{height:5px;opacity:.75;width:5px}}.cropper-point.point-se::before{background-color:#39f;bottom:-50%;content:" ";display:block;height:200%;opacity:0;position:absolute;right:-50%;width:200%}.cropper-invisible{opacity:0}.cropper-bg{background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAADklEQVQI12FgkP+fDgAB5gFk/RFQfQAAAABJRU5ErkJggg==")}.cropper-hide{display:block;height:1px;position:absolute;width:1px}.cropper-hidden{display:none!important}.cropper-move{cursor:move}.cropper-crop{cursor:crosshair}.cropper-disabled .cropper-drag-box,.cropper-disabled .cropper-face,.cropper-disabled .cropper-line,.cropper-disabled .cropper-point{cursor:not-allowed}
</style>
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
.ic-body { flex: 1; overflow: hidden; min-height: 0; background: #1a1a1a; }
.ic-canvas-wrap { width: 100%; height: 420px; max-height: 60vh; }
.ic-img { display: block; max-width: 100%; max-height: 100%; }
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
.ic-spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
