import { defineStore } from 'pinia'
import { menuData, type TopMenuItem } from '@/layouts/components/menuData'

export const PERM_PREFIX = '__perm__:'

export interface PermConfig {
  menus: string[]  // allowed sub-menu keys (e.g. 'reports-sale-rate', 'sale-out')
}

// All top-level menu keys (for legacy migration detection)
const TOP_MENU_KEYS = new Set(menuData.map(m => m.key))

// Expand legacy top-level keys to all their child keys
function expandLegacyKeys(keys: string[]): string[] {
  const expanded: string[] = []
  for (const key of keys) {
    if (TOP_MENU_KEYS.has(key)) {
      // Old format: top-level key → expand to all children
      const topMenu = menuData.find(m => m.key === key)
      if (topMenu) {
        topMenu.children.forEach(c => expanded.push(c.key))
      }
    } else {
      expanded.push(key)
    }
  }
  return expanded
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    isSubAccount: false,
    permConfig: null as PermConfig | null,
  }),

  getters: {
    allowedMenuKeys(state): string[] {
      if (!state.isSubAccount || !state.permConfig) return menuData.flatMap(m => m.children.map(c => c.key))
      return state.permConfig.menus
    },

    // Returns top-level menu items, with children filtered to only allowed sub-menus
    filteredMenuData(state): TopMenuItem[] {
      if (!state.isSubAccount) return menuData
      // 子账号：无论有没有角色，始终隐藏设置菜单
      const base = menuData.filter(m => m.key !== 'setting')
      if (!state.permConfig) return base
      const allowed = new Set(state.permConfig.menus)
      const result: TopMenuItem[] = []
      for (const menu of base) {
        const visibleChildren = menu.children.filter(c => allowed.has(c.key))
        if (visibleChildren.length > 0) {
          result.push({ ...menu, children: visibleChildren })
        }
      }
      return result
    },

    // Check if a route path is accessible
    canAccessPath(): (path: string) => boolean {
      return (path: string) => {
        if (!this.isSubAccount || !this.permConfig) return true
        if (path === '/dashboard' || path === '/' || path === '') return true
        const allowed = new Set(this.permConfig.menus)
        for (const menu of menuData) {
          for (const child of menu.children) {
            if (child.path && path.startsWith('/' + child.path.replace(/^\//, ''))) {
              return allowed.has(child.key)
            }
          }
        }
        return false
      }
    },
  },

  actions: {
    // Called on login — parse remark field for sub-account permissions
    setFromUserInfo(userInfo: Record<string, any>) {
      const SUPER_ADMIN = '17747344571'
      // 非超管账号一律视为子账号
      if (userInfo?.account !== SUPER_ADMIN) {
        const remark: string = userInfo?.remark || ''
        if (remark.startsWith(PERM_PREFIX)) {
          try {
            const json = remark.slice(PERM_PREFIX.length)
            const parsed = JSON.parse(json) as PermConfig
            const keys = expandLegacyKeys(parsed.menus || [])
            this.permConfig = { menus: keys }
          } catch {
            this.permConfig = null
          }
        } else {
          this.permConfig = null
        }
        this.isSubAccount = true
        return
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
