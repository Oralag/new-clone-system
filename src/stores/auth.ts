import { defineStore } from 'pinia'
import { loginApi, logoutApi } from '@/api/login'
import { getAdminList, getRoleList } from '@/api/setting'
import { TOKEN_NAME, USER_INFO_KEY } from '@/config'
import { usePermissionStore } from './permission'
import { useBrandStore } from './brand'

const AUTH_STORAGE_KEYS = [
  TOKEN_NAME,
  USER_INFO_KEY,
  'erp_company_name',
  'brand_profile',
  'brand_profile_savedAt',
  'erp_brand_data',
  'brand_profiles_v2',
  'brand_active_id',
  'erp_ai_chat_history',
  'agent_history',
  'agent_flow_results',
  'meeting_session',
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
      // 子账号权限兜底：登录响应通常不带 remark（权限串），不补拉的话
      // 子账号会被当成全权限账号，所有功能全部可见
      await this.ensureSubAccountRemark()
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo))
      usePermissionStore().setFromUserInfo(this.userInfo!)
    },

    // 登录响应没带权限串时补拉权限。
    // 注意：权限串的真正来源是【角色】(设置→角色)，账号上的 remark 只是保存账号时复制的副本，
    // 老账号往往没有这份副本 → 必须回退到按角色查，否则会被当成全权限账号。
    async ensureSubAccountRemark() {
      const SUPER_ADMIN = '17747344571'
      const PERM = '__perm__:'
      const info = this.userInfo
      if (!info?.account || info.account === SUPER_ADMIN) return
      if (typeof info.remark === 'string' && info.remark.startsWith(PERM)) return

      let roleId: any = info.role_id
      let roleName: string = info.role_name || ''

      // 1) 先查管理员列表：拿账号自己的 remark 副本，同时补齐 role_id / role_name
      try {
        const res: any = await getAdminList({ list_rows: 500 })
        const rows = res?.data?.rows ?? res?.data?.list ?? res?.data ?? []
        const me = Array.isArray(rows)
          ? rows.find((r: any) => String(r.account) === String(info.account))
          : null
        if (me) {
          if (me.role_id != null) roleId = me.role_id
          if (me.role_name) roleName = me.role_name
          if (typeof me.remark === 'string' && me.remark.startsWith(PERM)) {
            info.remark = me.remark
            return
          }
        }
      } catch { /* 继续走角色兜底 */ }

      // 2) 账号上没有副本 → 按角色取权限串（角色才是权限的唯一来源）
      if (roleId == null && !roleName) return
      try {
        const res: any = await getRoleList({ list_rows: 500 })
        const roles = res?.data?.rows ?? res?.data?.list ?? res?.data ?? []
        if (!Array.isArray(roles)) return
        const role = roles.find((r: any) =>
          (roleId != null && String(r.id) === String(roleId)) ||
          (!!roleName && r.name === roleName)
        )
        // 角色权限串存在 `permissions` 字段（不是 remark）
        const rolePerm = role && typeof role.permissions === 'string' ? role.permissions : ''
        if (rolePerm.startsWith(PERM)) {
          info.remark = rolePerm
        }
      } catch { /* 拉取失败保持原样，不阻断登录 */ }
    },

    initPermissions() {
      if (!this.userInfo) return
      usePermissionStore().setFromUserInfo(this.userInfo)
      // 已登录的老会话：localStorage 里的 userInfo 没有权限串时，
      // 后台补拉一次（无需退出重新登录）
      const remark = this.userInfo.remark
      if (typeof remark !== 'string' || !remark.startsWith('__perm__:')) {
        this.refreshPermissions()
      }
    },

    // 异步补拉权限并落盘生效
    async refreshPermissions() {
      if (!this.userInfo) return
      await this.ensureSubAccountRemark()
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo))
      usePermissionStore().setFromUserInfo(this.userInfo)
    },

    _clearAllState() {
      // 清除账号专属的 AI 聊天历史
      const id = this.userInfo?.id || this.userInfo?.account || ''
      if (id) localStorage.removeItem(`erp_ai_chat_history_${id}`)

      this.token = ''
      this.userInfo = null
      AUTH_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
      usePermissionStore().clear()
      useBrandStore().reset()
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
