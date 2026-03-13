import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TOKEN_NAME, API_URL } from '@/config'
import router from '@/router'

const http = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Upgrade dialog trigger — set by TrialBanner component
export const trialUpgradeTrigger = { show: () => {} }

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_NAME)
    if (token) config.headers['token'] = token
    return config
  },
  (error) => Promise.reject(error),
)

http.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 1) return res
    if (res.code === -1) {
      localStorage.removeItem(TOKEN_NAME)
      ElMessageBox.alert('登录已过期，请重新登录', '提示', {
        confirmButtonText: '确定',
        callback: () => router.push('/login'),
      })
      return Promise.reject(new Error(res.message || '未授权'))
    }
    // 体验版限制 — 弹升级引导而不是普通报错
    if (res.message?.includes('体验版')) {
      trialUpgradeTrigger.show()
      return Promise.reject(new Error(res.message))
    }
    if (res.message) {
      ElMessage({ message: res.message, type: 'error', duration: 2000, showClose: true })
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    const status = error.response?.status
    const method = error.config?.method?.toUpperCase()
    const isMutation = method === 'POST' || method === 'PUT' || method === 'DELETE'
    if (status === 401 || status === 403) {
      ElMessage.error('无访问权限，请重新登录')
    } else if (isMutation && status && status !== 404) {
      const messages: Record<number, string> = { 400: '请求参数错误', 500: '服务器内部错误' }
      ElMessage.error(messages[status] ?? '操作失败，请重试')
    }
    return Promise.reject(error)
  },
)

export default http
