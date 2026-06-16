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
  if (!request.headers.get('x-erp-token')) {
    return Response.json({ status: 'error', message: '未授权' }, { status: 401 })
  }

  const { type, prompt, ratio, task_id } = await request.json() as { type: 'image' | 'video' | 'query'; prompt: string; ratio?: string; task_id?: string }

  if (type === 'image') {
    const ratioMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 }, '3:4': { width: 768, height: 1024 },
      '4:3': { width: 1024, height: 768 }, '9:16': { width: 576, height: 1024 }, '16:9': { width: 1024, height: 576 },
    }
    const size = ratioMap[ratio || '3:4']
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
    const reqBody = JSON.stringify({ req_key: 'jimeng_ti2v_v30_pro', prompt, frames: 121, aspect_ratio: ratioMap[ratio || '9:16'] || '9:16' })
    const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
    const resp = await fetch('https://visual.volcengineapi.com/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31', { method: 'POST', headers, body: reqBody })
    const data = await resp.json() as any
    if (data?.code === 10000 && data?.data?.task_id) {
      return Response.json({ status: 'ok', task_id: data.data.task_id })
    }
    return Response.json({ status: 'error', message: data?.message || JSON.stringify(data) }, { status: 500 })
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
