import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

const SUPER_ADMIN = '17747344571'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta?.title || '页面'} - 数字游牧ERP`

  if (to.meta?.public) {
    return next()
  }

  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
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
