import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'

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

  // Super admin only pages
  if (to.meta?.superAdmin) {
    const account = auth.userInfo?.account || ''
    if (account !== SUPER_ADMIN) {
      return next({ path: '/dashboard' })
    }
  }

  next()
})

export default router
