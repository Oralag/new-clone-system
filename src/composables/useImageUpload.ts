// 本地图片上传 → 裁剪 → 上传到 KV → 返回 URL
import { createApp, defineComponent, ref, h } from 'vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { TOKEN_NAME } from '@/config'

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
        return () => h(ImageCropper, { visible: visible.value, src, ratio, onConfirm, onCancel })
      }
    }))
    app.mount(mount)
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadBase64(base64: string): Promise<string> {
  const token = localStorage.getItem(TOKEN_NAME) || ''
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
    body: JSON.stringify({ data: base64 }),
  })
  const json = await res.json() as { code: number; url: string }
  if (json.code !== 1) throw new Error('上传失败')
  return json.url
}

export function useImageUpload() {
  function triggerUpload(onResult: (url: string) => void, ratio?: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const dataUrl = await fileToDataUrl(file)
        const cropped = await openCropper(dataUrl, ratio)
        if (!cropped) return
        const url = await uploadBase64(cropped)
        onResult(url)
      } catch (e: any) {
        alert(e?.message || '图片处理失败，请重试')
      }
    }
    input.click()
  }

  return { triggerUpload }
}
