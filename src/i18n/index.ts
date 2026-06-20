import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import elementZhCN from 'element-plus/es/locale/lang/zh-cn'
import elementEnUS from 'element-plus/es/locale/lang/en'

export type Locale = 'zh-CN' | 'en-US'

const STORAGE_KEY = 'erp_locale'

export function getStoredLocale(): Locale {
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'en-US') return 'en-US'
  return 'zh-CN'
}

export function setStoredLocale(loc: Locale) {
  localStorage.setItem(STORAGE_KEY, loc)
}

export const elementLocaleMap = {
  'zh-CN': elementZhCN,
  'en-US': elementEnUS,
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getStoredLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  // Allow flat keys with dots in messages (e.g. 'menu.customer.sale-client')
  missingWarn: false,
  fallbackWarn: false,
})

export default i18n

// Convenience standalone translator for use outside Vue components (router guards, etc.)
export const t = (key: string, ...args: any[]) => (i18n.global.t as any)(key, ...args)

export function setLocale(loc: Locale, opts: { reload?: boolean } = {}) {
  ;(i18n.global.locale as any).value = loc
  setStoredLocale(loc)
  document.documentElement.setAttribute('lang', loc)
  // Reload to refresh Element Plus locale (date pickers, pagination, etc.)
  if (opts.reload !== false) {
    setTimeout(() => location.reload(), 50)
  }
}
