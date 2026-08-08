// 共享工具：真实校验 x-erp-token（防止伪造 token 盗刷生图/视频/TTS额度）
// 策略：解码 erp_ 包装token → 调 ERP 后端轻量接口验证 → KV 缓存10分钟
// 网络异常时放行（fail-open，保可用性）；后端明确返回未授权(code===-1)时拒绝

const DEFAULT_BACKEND = 'https://saas.mzth.cn/adminapi'

function decodeErpToken(wrapped: string): { realToken: string; backend: string } {
  try {
    if (wrapped && wrapped.startsWith('erp_')) {
      const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
      const payload = JSON.parse(json)
      return {
        realToken: payload.t || wrapped,
        backend: (payload.b ? payload.b + '/adminapi' : DEFAULT_BACKEND),
      }
    }
  } catch { /* 非包装格式，按原样使用 */ }
  return { realToken: wrapped, backend: DEFAULT_BACKEND }
}

export async function verifyErpToken(request: Request, env: any): Promise<boolean> {
  const wrapped = request.headers.get('x-erp-token') || ''
  if (!wrapped) return false

  const { realToken, backend } = decodeErpToken(wrapped)
  if (!realToken) return false

  const kv: KVNamespace | undefined = env?.AGENT_MEMORY
  const cacheKey = `tokval:${realToken.slice(-24)}`

  if (kv) {
    try {
      const cached = await kv.get(cacheKey)
      if (cached === '1') return true
      if (cached === '0') return false
    } catch { /* KV异常不阻断 */ }
  }

  try {
    const res = await fetch(`${backend}/setting/admin/index?list_rows=1`, {
      headers: { token: realToken, 'Content-Type': 'application/json' },
    })
    const data = await res.json() as any
    const valid = data?.code !== -1
    if (kv) {
      try { await kv.put(cacheKey, valid ? '1' : '0', { expirationTtl: valid ? 600 : 60 }) } catch {}
    }
    return valid
  } catch {
    // 后端不可达时放行，避免误伤正常用户
    return true
  }
}
