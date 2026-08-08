// 共享工具：从 x-erp-token 派生稳定的用户标识
// 与 brand-profiles.ts 的 getUserKey 同逻辑：账号级 key，token 刷新/重登后不变
export function getUserKey(erpToken: string): string {
  if (erpToken.startsWith('erp_')) {
    try {
      const json = decodeURIComponent(escape(atob(erpToken.slice(4))))
      const payload = JSON.parse(json)
      // 试用账号：用手机号作为唯一标识
      if (payload.trial && payload.a) return payload.a
      // 付费账号：用 account + backend 前缀组合
      if (payload.a) return `${payload.a}@${(payload.b || '').slice(-8)}`
    } catch {}
  }
  // fallback：取最后16位（兼容旧格式）
  return erpToken.slice(-16)
}
