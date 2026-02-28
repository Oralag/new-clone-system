import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TOKEN_NAME, API_URL } from '@/config'
import router from '@/router'

const http = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_NAME)
    if (token) {
      config.headers['token'] = token
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle code -1 / 0
http.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 1) {
      return res
    }
    if (res.code === -1) {
      // Unauthorised — clear token and redirect
      localStorage.removeItem(TOKEN_NAME)
      ElMessageBox.alert('登录已过期，请重新登录', '提示', {
        confirmButtonText: '确定',
        callback: () => {
          router.push('/login')
        },
      })
      return Promise.reject(new Error(res.message || '未授权'))
    }
    // code === 0 — business error
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    const status = error.response?.status
    const messages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求地址不存在',
      500: '服务器内部错误',
    }
    ElMessage.error(messages[status] ?? '网络请求失败')
    return Promise.reject(error)
  },
)

export default http
