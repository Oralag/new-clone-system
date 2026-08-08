import { verifyErpToken } from '../utils/verifyErpToken'

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any)
  }
  return btoa(bin)
}

async function edgeTTS(text: string, voice: string, xmlLang: string): Promise<ArrayBuffer> {
  const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
  const url = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`
  const resp = await fetch(url, { headers: { Upgrade: 'websocket' } })
  const ws = (resp as any).webSocket
  if (!ws) throw new Error('Edge TTS WebSocket 建立失败')
  ws.accept()

  const ts = () => new Date().toISOString()
  const reqId = crypto.randomUUID().replace(/-/g, '')

  ws.send(`X-Timestamp:${ts()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' }, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' } } } })}`)

  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${xmlLang}'><voice name='${voice}'><prosody rate='+0%' pitch='+0Hz'>${xmlEscape(text)}</prosody></voice></speak>`
  ws.send(`X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts()}Z\r\nPath:ssml\r\n\r\n${ssml}`)

  const chunks: Uint8Array[] = []
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const timer = setTimeout(() => { try { ws.close() } catch {} ; reject(new Error('Edge TTS 超时')) }, 25000)
    ws.addEventListener('message', async (ev: any) => {
      const d = ev.data
      if (typeof d === 'string') {
        if (d.includes('Path:turn.end')) {
          clearTimeout(timer)
          try { ws.close() } catch {}
          if (chunks.length === 0) return reject(new Error('Edge TTS 未收到音频'))
          const total = chunks.reduce((s, c) => s + c.length, 0)
          const merged = new Uint8Array(total)
          let o = 0
          for (const c of chunks) { merged.set(c, o); o += c.length }
          resolve(merged.buffer)
        }
      } else {
        const buf = d instanceof ArrayBuffer ? d : await (d as Blob).arrayBuffer()
        const view = new DataView(buf)
        const headerLen = view.getUint16(0, false)
        chunks.push(new Uint8Array(buf, 2 + headerLen))
      }
    })
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Edge TTS 连接错误')) })
    ws.addEventListener('close', () => { clearTimeout(timer); if (chunks.length === 0) reject(new Error('Edge TTS 连接关闭')) })
  })
}

async function volcSign(
  accessKeyId: string, secretAccessKey: string,
  method: string, path: string, query: string,
  bodyStr: string, host: string, service: string
): Promise<Record<string, string>> {
  const enc = new TextEncoder()

  const now = new Date()
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzdate  = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'

  const hashHex = async (data: string) => {
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(data))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const hmac = async (key: ArrayBuffer | string, msg: string): Promise<ArrayBuffer> => {
    const rawKey = typeof key === 'string' ? enc.encode(key) : key
    const k = await crypto.subtle.importKey('raw', rawKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', k, enc.encode(msg))
  }

  const payloadHash = await hashHex(bodyStr)
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-date:${amzdate}\n`
  const signedHeaders = 'content-type;host;x-date'
  const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join('\n')
  const region = 'cn-north-1'
  const credentialScope = `${datestamp}/${region}/${service}/request`
  const stringToSign = ['HMAC-SHA256', amzdate, credentialScope, await hashHex(canonicalRequest)].join('\n')

  let sigKey = await hmac(secretAccessKey, datestamp)
  sigKey = await hmac(sigKey, region)
  sigKey = await hmac(sigKey, service)
  sigKey = await hmac(sigKey, 'request')

  const sigBuf = await hmac(sigKey, stringToSign)
  const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

  return {
    'Content-Type': 'application/json',
    'Host': host,
    'X-Date': amzdate,
    'Authorization': `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

export const onRequestPost: PagesFunction<{ VOLC_ACCESS_KEY_ID: string; VOLC_SECRET_KEY: string; SILICONFLOW_API_KEY: string }> = async ({ request, env }) => {
  if (!(await verifyErpToken(request, env))) {
    return Response.json({ status: 'error', message: '未授权' }, { status: 401 })
  }

  const { type, prompt, ratio, task_id, image_url, lang } = await request.json() as { type: 'image' | 'video' | 'query' | 'tts'; prompt: string; ratio?: string; task_id?: string; image_url?: string; lang?: string }

  // TTS 配音（AI 分身人口播用）：Edge TTS 免费匿名接口（微软 Edge 浏览器 Read Aloud 同源）
  if (type === 'tts') {
    if (!prompt?.trim()) return Response.json({ status: 'error', message: '缺少口播文本' }, { status: 400 })
    const text = prompt.trim().slice(0, 1500)
    const isEn = lang === 'en'
    const voice = (env as any).EDGE_TTS_VOICE || (isEn ? 'en-US-AriaNeural' : 'zh-CN-XiaoxiaoNeural')
    const xmlLang = isEn ? 'en-US' : 'zh-CN'
    try {
      const audioBuf = await edgeTTS(text, voice, xmlLang)
      const base64 = arrayBufferToBase64(audioBuf)
      return Response.json({ status: 'ok', audio: `data:audio/mp3;base64,${base64}`, engine: 'edge_tts' })
    } catch (e: any) {
      // 兜底：英文再试一次 Workers AI MeloTTS
      if (isEn) {
        const ai = (env as any).AI
        if (ai) {
          try {
            const out = await ai.run('@cf/myshell-ai/melotts', { prompt: text, lang: 'en' })
            const audio = typeof out === 'string' ? out : out?.audio
            if (audio) return Response.json({ status: 'ok', audio: `data:audio/mp3;base64,${audio}`, engine: 'melotts' })
          } catch { /* fallthrough */ }
        }
      }
      return Response.json({ status: 'error', message: `TTS 失败: ${e?.message || e}` }, { status: 500 })
    }
  }

  if (type === 'image') {
    const ratioMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 }, '3:4': { width: 768, height: 1024 },
      '4:3': { width: 1024, height: 768 }, '9:16': { width: 576, height: 1024 }, '16:9': { width: 1024, height: 576 },
    }
    const size = ratioMap[ratio || '3:4']
    // image_url 存在 = 垫图生图（FLUX Kontext：保持原图主体，按指令修改局部，如换衣服）
    if (image_url) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=kontext&image=${encodeURIComponent(image_url)}&width=${size.width}&height=${size.height}&nologo=true&seed=${Date.now()}`
      return Response.json({ status: 'ok', url, engine: 'kontext' })
    }
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size.width}&height=${size.height}&nologo=true&model=flux&seed=${Date.now()}`
    return Response.json({ status: 'ok', url })
  }

  if (type === 'video') {
    const akId = env.VOLC_ACCESS_KEY_ID
    const akSecret = env.VOLC_SECRET_KEY
    if (!akId || !akSecret) {
      return Response.json({ status: 'error', message: '未配置视频生成密钥' }, { status: 500 })
    }
    const ratioMap: Record<string, string> = { '16:9': '16:9', '9:16': '9:16', '1:1': '1:1', '3:4': '3:4', '4:3': '4:3' }
    // image_url 可选：传入形象照即为图生视频（AI 分身人动态化），不传为纯文生视频
    // 优先即梦3.0 Pro；账号未开通时，纯文生视频自动降级到老版接口（jimeng_video_t2v_async）
    const reqPayload: Record<string, any> = { req_key: 'jimeng_ti2v_v30_pro', prompt, frames: 121, aspect_ratio: ratioMap[ratio || '9:16'] || '9:16' }
    if (image_url) reqPayload.image_urls = [image_url]
    const reqBody = JSON.stringify(reqPayload)
    const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
    const resp = await fetch('https://visual.volcengineapi.com/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31', { method: 'POST', headers, body: reqBody })
    const data = await resp.json() as any
    if (data?.code === 10000 && data?.data?.task_id) {
      return Response.json({ status: 'ok', task_id: data.data.task_id })
    }

    const denied = /access denied/i.test(String(data?.message || ''))
    if (denied && !image_url) {
      // 降级：老版文生视频（CVProcess + jimeng_video_t2v_async）
      const sizeMap: Record<string, string> = { '16:9': '1280x720', '9:16': '720x1280', '1:1': '720x720' }
      const legacyBody = JSON.stringify({
        req_key: 'jimeng_video_t2v_async',
        prompt,
        duration: 5,
        resolution: sizeMap[ratio || '9:16'] || '720x1280',
        return_url: true,
      })
      const lh = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', legacyBody, 'visual.volcengineapi.com', 'cv')
      const lresp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers: lh, body: legacyBody })
      const ldata = await lresp.json() as any
      if (ldata?.code === 10000 && ldata?.data?.task_id) {
        return Response.json({ status: 'ok', task_id: `legacy:${ldata.data.task_id}`, engine: 'legacy' })
      }
      return Response.json({ status: 'error', message: `3.0 Pro 未开通，老版接口也失败：${ldata?.message || JSON.stringify(ldata)}` }, { status: 500 })
    }

    let msg = data?.message || JSON.stringify(data)
    if (denied) {
      msg = image_url
        ? '图生视频（分身人）需要「即梦AI-视频生成3.0 Pro」：你的火山账号只开通了老版文生视频。请到火山引擎控制台 → 视觉智能 → 即梦AI → 开通视频生成3.0 Pro（有免费额度）'
        : '火山账号未开通「即梦AI-视频生成3.0 Pro」：请到火山引擎控制台 → 视觉智能 → 即梦AI → 开通'
    }
    return Response.json({ status: 'error', message: msg }, { status: 500 })
  }

  if (type === 'query') {
    const akId = env.VOLC_ACCESS_KEY_ID
    const akSecret = env.VOLC_SECRET_KEY
    if (!akId || !akSecret) return Response.json({ status: 'error', message: '未配置密钥' }, { status: 500 })
    if (!task_id) return Response.json({ status: 'error', message: '缺少 task_id' }, { status: 400 })
    const reqBody = JSON.stringify({ req_key: 'jimeng_ti2v_v30_pro', task_id })
    const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVSync2AsyncGetResult&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
    const resp = await fetch('https://visual.volcengineapi.com/?Action=CVSync2AsyncGetResult&Version=2022-08-31', { method: 'POST', headers, body: reqBody })
    const data = await resp.json() as any
    const taskData = data?.data
    if (!taskData) return Response.json({ status: 'error', message: data?.message || JSON.stringify(data) }, { status: 500 })
    // Volcengine status: "done"|"succeed" 成功, "failed" 失败, 其他 处理中
    const rawStatus = taskData.status
    if (rawStatus === 'done' || rawStatus === 'succeed' || rawStatus === 1) {
      const videoUrl = taskData.video_url || taskData.video_urls?.[0] || taskData.binary_data_base64?.[0] || ''
      return Response.json({ status: 'done', videoUrl })
    }
    if (rawStatus === 'failed' || rawStatus === 2) {
      return Response.json({ status: 'error', message: taskData.message || '生成失败' })
    }
    return Response.json({ status: 'processing', progress: taskData.progress || 0 })
  }

  return Response.json({ status: 'error', message: '不支持的 type' }, { status: 400 })
}
