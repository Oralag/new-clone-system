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

export const onRequestPost: PagesFunction<{ VOLC_ACCESS_KEY_ID: string; VOLC_SECRET_KEY: string }> = async ({ request, env }) => {
  const akId = env.VOLC_ACCESS_KEY_ID
  const akSecret = env.VOLC_SECRET_KEY
  if (!akId || !akSecret) {
    return Response.json({ status: 'error', message: '未配置密钥' }, { status: 500 })
  }

  const { task_id } = await request.json() as { task_id: string }
  if (!task_id) return Response.json({ status: 'error', message: '缺少 task_id' }, { status: 400 })

  const reqBody = JSON.stringify({ req_key: 'jimeng_ti2v_v30_pro', task_id })
  const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVSync2AsyncGetResult&Version=2022-08-31', reqBody, 'visual.volcengineapi.com', 'cv')
  const resp = await fetch('https://visual.volcengineapi.com/?Action=CVSync2AsyncGetResult&Version=2022-08-31', {
    method: 'POST', headers, body: reqBody,
  })
  const data = await resp.json() as any

  // 即梦3.0 Pro状态：in_queue=排队, generating=生成中, done=完成, not_found/expired=失败
  const rawStatus: string = data?.data?.status ?? ''
  const statusMap: Record<string, string> = { in_queue: 'queued', generating: 'processing', done: 'done', not_found: 'failed', expired: 'failed' }
  const videoUrl = data?.data?.video_url || ''

  return Response.json({
    status: statusMap[rawStatus] ?? 'processing',
    video_url: videoUrl,
    raw_status: rawStatus,
  })
}
