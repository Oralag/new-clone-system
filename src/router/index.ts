import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { t } from '@/i18n'

const SUPER_ADMIN = '17747344571'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768)
}

router.beforeEach((to, _from, next) => {
  // Title: prefer i18n key derived from route.name, fall back to meta.title
  const routeKey = to.name ? `route.${String(to.name)}` : ''
  const i18nTitle = routeKey ? t(routeKey) : ''
  // If t() returns the key unchanged, the key wasn't defined — use meta.title fallback
  const pageTitle = (i18nTitle && i18nTitle !== routeKey)
    ? i18nTitle
    : ((to.meta?.title as string) || t('layout.pageNotFound'))
  document.title = `${pageTitle} - ${t('app.name')}`

  // 移动端：根路径 / portal → 模块选择页（第一落地页）
  if (isMobileDevice() && (to.path === '/' || to.path === '/portal')) {
    return next({ path: '/mobile/modules' })
  }
  // 移动端禁止进入旧 PC 首页链路，统一到模块选择页
  if (isMobileDevice() && to.path === '/dashboard' && String(to.query?.legacy || '') !== '1') {
    return next({ path: '/mobile/modules' })
  }
  if (isMobileDevice() && to.path === '/dashboard/today-sales' && String(to.query?.legacy || '') !== '1') {
    return next({ path: '/mobile/sale/today' })
  }

  if (to.meta?.public) {
    return next()
  }

  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Force re-login for trial tokens that still point to the old production backend.
  // After migration to erp-trial.onrender.com, old trial tokens must be invalidated.
  const token = auth.token
  if (token.startsWith('erp_')) {
    try {
      // Must use decodeURIComponent(escape(...)) to handle Chinese characters in company names
      const json = decodeURIComponent(escape(atob(token.slice(4))))
      const payload = JSON.parse(json)
      if (payload.trial && payload.b && !payload.b.includes('erp-trial')) {
        auth.clearAuth()
        return next({ path: '/login', query: { redirect: to.fullPath, reason: 'token_refresh' } })
      }
    } catch { /* malformed token — proceed, login guard above handles re-auth */ }
  }

  // Restore permissions from userInfo on page refresh (pinia store is empty after refresh)
  const permStore = usePermissionStore()
  if (auth.userInfo && permStore.permConfig === null && !permStore.isSubAccount) {
    auth.initPermissions()
  }

  // Super admin only pages
  if (to.meta?.superAdmin) {
    const account = auth.userInfo?.account || ''
    if (account !== SUPER_ADMIN) {
      return next({ path: '/dashboard' })
    }
  }

  // Sub-account permission check
  if (permStore.isSubAccount && to.path !== '/dashboard') {
    if (!permStore.canAccessPath(to.path)) {
      return next({ path: '/dashboard' })
    }
  }

  next()
})

export default router
