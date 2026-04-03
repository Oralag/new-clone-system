// 本地图片上传 → 裁剪 → canvas 压缩 → base64
import { createApp, defineComponent, ref, h } from 'vue'
import ImageCropper from '@/components/ImageCropper.vue'

// 动态挂载裁剪弹窗，返回裁剪后的 base64（用户取消则返回 null）
function openCropper(src: string, ratio?: number): Promise<string | null> {
  return new Promise((resolve) => {
    const mount = document.createElement('div')
    document.body.appendChild(mount)

    const app = createApp(defineComponent({
      setup() {
        const visible = ref(true)
        function onConfirm(b64: string) {
          visible.value = false
          resolve(b64)
          cleanup()
        }
        function onCancel() {
          visible.value = false
          resolve(null)
          cleanup()
        }
        function cleanup() {
          setTimeout(() => { app.unmount(); mount.remove() }, 300)
        }
        return () => h(ImageCropper, {
          visible: visible.value,
          src,
          ratio,
          onConfirm,
          onCancel,
        })
      }
    }))
    app.mount(mount)
  })
}

// 文件转 base64 dataURL（原始，不压缩，供裁剪器使用）
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useImageUpload() {
  // 选文件 → 裁剪弹窗 → 返回裁剪后的 base64
  // ratio: 16/9 | 1 | 4/3 | 0(自由) | undefined(默认自由)
  function triggerUpload(onResult: (base64: string) => void, ratio?: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const dataUrl = await fileToDataUrl(file)
        const result = await openCropper(dataUrl, ratio)
        if (result) onResult(result)
      } catch {
        alert('图片处理失败，请重试')
      }
    }
    input.click()
  }

  return { triggerUpload }
}
