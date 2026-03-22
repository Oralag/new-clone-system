import { defineStore } from 'pinia'
import { loginApi, logoutApi } from '@/api/login'
import { TOKEN_NAME, USER_INFO_KEY } from '@/config'
import { usePermissionStore } from './permission'

const AUTH_STORAGE_KEYS = [
  TOKEN_NAME,
  USER_INFO_KEY,
  'erp_company_name',
  'brand_profile',
  'brand_profile_savedAt',
  'erp_brand_data',
  'erp_ai_chat_history',
  'agent_history',
  'agent_flow_results',
]

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_NAME) || '',
    userInfo: (() => {
      try {
        return JSON.parse(localStorage.getItem(USER_INFO_KEY) || 'null')
      } catch {
        return null
      }
    })() as Record<string, any> | null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.name || state.userInfo?.account || '用户',
    avatar: (state) => state.userInfo?.avatar || '',
  },

  actions: {
    async login(account: string, password: string) {
      const res: any = await loginApi({ account, password })
      const data = res.data
      if (!data?.token) throw new Error('登录失败：未获取到token')
      this.token = data.token
      this.userInfo = data.userInfo || data
      localStorage.setItem(TOKEN_NAME, this.token)
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo))
      usePermissionStore().setFromUserInfo(this.userInfo!)
    },

    initPermissions() {
      if (this.userInfo) {
        usePermissionStore().setFromUserInfo(this.userInfo)
      }
    },

    _clearAllState() {
      this.token = ''
      this.userInfo = null
      AUTH_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
      usePermissionStore().clear()
    },

    logout() {
      logoutApi().catch(() => {})
      this._clearAllState()
    },

    clearAuth() {
      this._clearAllState()
    },
  },
})
