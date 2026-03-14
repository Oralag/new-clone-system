import { defineStore } from 'pinia'
import { menuData, type TopMenuItem } from '@/layouts/components/menuData'

export const PERM_PREFIX = '__perm__:'

export interface PermConfig {
  menus: string[]  // allowed top-level menu keys
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    isSubAccount: false,
    permConfig: null as PermConfig | null,
  }),

  getters: {
    // All menu keys when no restriction
    allMenuKeys: () => menuData.map(m => m.key),

    allowedMenuKeys(state): string[] {
      if (!state.isSubAccount || !state.permConfig) return menuData.map(m => m.key)
      return state.permConfig.menus
    },

    filteredMenuData(state): TopMenuItem[] {
      if (!state.isSubAccount || !state.permConfig) return menuData
      const allowed = new Set(state.permConfig.menus)
      return menuData.filter(m => allowed.has(m.key))
    },

    // Check if a route path is accessible
    canAccessPath(): (path: string) => boolean {
      return (path: string) => {
        if (!this.isSubAccount || !this.permConfig) return true
        const allowed = new Set(this.permConfig.menus)
        for (const menu of menuData) {
          if (!allowed.has(menu.key)) continue
          if (menu.children?.some(c => c.path && path.startsWith(c.path))) return true
        }
        // dashboard always accessible
        if (path === '/dashboard' || path === '/') return true
        return false
      }
    },
  },

  actions: {
    // Called on login — parse remark field for sub-account permissions
    setFromUserInfo(userInfo: Record<string, any>) {
      const remark: string = userInfo?.remark || ''
      if (remark.startsWith(PERM_PREFIX)) {
        try {
          const json = remark.slice(PERM_PREFIX.length)
          this.permConfig = JSON.parse(json) as PermConfig
          this.isSubAccount = true
          return
        } catch {
          // invalid JSON, treat as main account
        }
      }
      this.isSubAccount = false
      this.permConfig = null
    },

    clear() {
      this.isSubAccount = false
      this.permConfig = null
    },
  },
})
