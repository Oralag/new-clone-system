import { defineStore } from 'pinia'
import { loginApi, logoutApi } from '@/api/login'
import { TOKEN_NAME, USER_INFO_KEY } from '@/config'

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
      this.token = data.token
      this.userInfo = data.userInfo || data
      localStorage.setItem(TOKEN_NAME, this.token)
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo))
    },

    logout() {
      logoutApi().catch(() => {})
      this.token = ''
      this.userInfo = null
      localStorage.removeItem(TOKEN_NAME)
      localStorage.removeItem(USER_INFO_KEY)
    },

    clearAuth() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem(TOKEN_NAME)
      localStorage.removeItem(USER_INFO_KEY)
    },
  },
})
