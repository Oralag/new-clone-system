import { USER_INFO_KEY } from '@/config'

function normalizePart(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-')
    .replace(/-+/g, '-')
}

export function getStorageScopeId() {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY)
    const user = raw ? JSON.parse(raw) : null
    const account = normalizePart(user?.account || '')
    const company = normalizePart(user?.name || localStorage.getItem('erp_company_name') || '')
    const scope = [account, company].filter(Boolean).join('__')
    return scope || 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export function getScopedStorageKey(baseKey: string) {
  return `${baseKey}__${getStorageScopeId()}`
}

export function readScopedJson<T>(baseKey: string, fallback: T): T {
  const scopedKey = getScopedStorageKey(baseKey)
  try {
    const scopedValue = localStorage.getItem(scopedKey)
    if (scopedValue) return JSON.parse(scopedValue) as T
  } catch { /* ignore */ }

  try {
    const legacyValue = localStorage.getItem(baseKey)
    if (legacyValue) {
      const parsed = JSON.parse(legacyValue) as T
      localStorage.setItem(scopedKey, JSON.stringify(parsed))
      localStorage.removeItem(baseKey)
      return parsed
    }
  } catch { /* ignore */ }

  return fallback
}

export function writeScopedJson(baseKey: string, value: unknown) {
  localStorage.setItem(getScopedStorageKey(baseKey), JSON.stringify(value))
}
