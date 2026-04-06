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
  const credentialScope = `${datestamp}/${service}/request`
  const stringToSign = ['HMAC-SHA256', amzdate, credentialScope, await hashHex(canonicalRequest)].join('\n')

  let sigKey = await hmac('volc' + secretAccessKey, datestamp)
  sigKey = await hmac(sigKey, service)
  sigKey = await hmac(sigKey, 'request')
  sigKey = await hmac(sigKey, 'aws4_request')

  const sigBuf = await hmac(sigKey, stringToSign)
  const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

  return {
    'Content-Type': 'application/json',
    'Host': host,
    'X-Date': amzdate,
    'Authorization': `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

export const onRequestPost: PagesFunction<{ VOLC_ACCESS_KEY_ID: string; VOLC_SECRET_KEY: string }> = async ({ request, env }) => {
  const akId = env.VOLC_ACCESS_KEY_ID
  const akSecret = env.VOLC_SECRET_KEY
  if (!akId || !akSecret) {
    return Response.json({ status: 'error', message: '未配置 VOLC_ACCESS_KEY_ID / VOLC_SECRET_KEY' }, { status: 500 })
  }

  const { type, prompt, ratio } = await request.json() as { type: 'image' | 'video'; prompt: string; ratio?: string }

  if (type === 'image') {
    const ratioMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 }, '3:4': { width: 768, height: 1024 },
      '4:3': { width: 1024, height: 768 }, '9:16': { width: 576, height: 1024 }, '16:9': { width: 1024, height: 576 },
    }
    const size = ratioMap[ratio || '3:4']
    const reqBody = JSON.stringify({ req_key: 'seedream_3_0_t2i_to_image', prompt, width: size.width, height: size.height, return_url: true })
    const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
    const resp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers, body: reqBody })
    const data = await resp.json() as any
    if (data?.code === 10000 && data?.data?.image_urls?.[0]) {
      return Response.json({ status: 'ok', url: data.data.image_urls[0] })
    }
    const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size.width}&height=${size.height}&nologo=true&model=flux`
    return Response.json({ status: 'ok', url: fallback, fallback: true, reason: data?.message || JSON.stringify(data) })
  }

  if (type === 'video') {
    const ratioMap: Record<string, string> = { '16:9': '1280x720', '9:16': '720x1280', '1:1': '720x720' }
    const reqBody = JSON.stringify({ req_key: 'jimeng_video_t2v_async', prompt, duration: 5, resolution: ratioMap[ratio || '9:16'] || '720x1280', return_url: true })
    const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
    const resp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers, body: reqBody })
    const data = await resp.json() as any
    if (data?.code === 10000 && data?.data?.task_id) {
      return Response.json({ status: 'ok', task_id: data.data.task_id })
    }
    return Response.json({ status: 'error', message: data?.message || JSON.stringify(data) }, { status: 500 })
  }

  return Response.json({ status: 'error', message: '不支持的 type' }, { status: 400 })
}
