import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TOKEN_NAME, API_URL } from '@/config'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const http = axios.create({
  baseURL: API_URL,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
})

// Upgrade dialog trigger — set by TrialBanner component
export const trialUpgradeTrigger = { show: () => {} }

// 防止多个 code:-1 同时弹出多个弹窗
let isShowingAuthDialog = false

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_NAME)
    if (token) config.headers['token'] = token
    // 带上用户 ID，方便 Worker 等边缘函数识别身份
    try {
      const userInfo = JSON.parse(localStorage.getItem('erp_user') || 'null')
      const uid = userInfo?.admin_id || userInfo?.id
      if (uid) config.headers['x-user-id'] = String(uid)
    } catch { /* 忽略 */ }
    return config
  },
  (error) => Promise.reject(error),
)

// 503 auto-retry: Render free tier cold-starts return 503 before the process is ready
async function retryRequest(config: any): Promise<any> {
  await new Promise(r => setTimeout(r, 5000))
  return http(config)
}

http.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 1) return res
    if (res.code === -1) {
      // 清除 localStorage 和 Pinia store
      localStorage.removeItem(TOKEN_NAME)
      try {
        const authStore = useAuthStore()
        authStore.token = ''
        authStore.userInfo = null
      } catch { /* store 可能未初始化 */ }
      if (!isShowingAuthDialog) {
        isShowingAuthDialog = true
        ElMessageBox.alert('登录已过期，请重新登录', '提示', {
          confirmButtonText: '确定',
          callback: () => {
            isShowingAuthDialog = false
            router.push('/login')
          },
        })
      }
      return Promise.reject(new Error(res.message || '未授权'))
    }
    // 体验版限制 — 弹升级引导而不是普通报错
    if (res.message?.includes('体验版')) {
      trialUpgradeTrigger.show()
      return Promise.reject(new Error(res.message))
    }
    // 静默模式：不弹错误提示
    const silent = (response.config as any)?.silent
    if (res.message && !silent) {
      ElMessage({ message: res.message, type: 'error', duration: 2000, showClose: true })
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  async (error) => {
    const status = error.response?.status
    const config = error.config
    // 503: Render cold-start — retry once automatically
    if (status === 503 && !config?._retried) {
      config._retried = true
      ElMessage({ message: '服务器正在启动，5秒后自动重试…', type: 'warning', duration: 4500, showClose: true })
      return retryRequest(config)
    }
    const method = config?.method?.toUpperCase()
    const isMutation = method === 'POST' || method === 'PUT' || method === 'DELETE'
    if (status === 401 || status === 403) {
      localStorage.removeItem(TOKEN_NAME)
      try {
        if (router.currentRoute && router.currentRoute.value && router.currentRoute.value.path !== '/login') {
          ElMessage.error('无访问权限，请重新登录')
          router.push('/login')
        }
      } catch { /* 忽略路由访问错误 */ }
    } else if (isMutation && status && status !== 404) {
      const messages: Record<number, string> = { 400: '请求参数错误', 500: '服务器内部错误' }
      ElMessage.error(messages[status] ?? '操作失败，请重试')
    } else if (!isMutation && status && status >= 500) {
      ElMessage.error('服务器繁忙，请稍后重试')
    }
    return Promise.reject(error)
  },
)

export default http
