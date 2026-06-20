import { defineStore } from 'pinia'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export interface TabItem {
  title: string
  titleKey?: string // i18n key, e.g. 'route.SaleClient'
  path: string
  name?: string
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as TabItem[],
    activeTab: '',
  }),

  actions: {
    addTab(route: RouteLocationNormalizedLoaded) {
      const path = route.path
      if (path === '/dashboard' || path === '/') return
      const exists = this.tabs.find((t) => t.path === path)
      if (!exists) {
        const metaKey = (route.meta as any)?.titleKey as string | undefined
        const titleKey = metaKey || (route.name ? `route.${String(route.name)}` : undefined)
        this.tabs.push({
          title: (route.meta?.title as string) || route.name as string || path,
          titleKey,
          path,
          name: route.name as string,
        })
      }
      this.activeTab = path
    },

    closeTab(path: string) {
      const idx = this.tabs.findIndex((t) => t.path === path)
      if (idx !== -1) {
        this.tabs.splice(idx, 1)
        if (this.activeTab === path) {
          this.activeTab = this.tabs[idx - 1]?.path || this.tabs[0]?.path || '/dashboard'
        }
      }
    },

    closeOtherTabs(path: string) {
      this.tabs = this.tabs.filter((t) => t.path === path)
      this.activeTab = path
    },

    closeAllTabs() {
      this.tabs = []
      this.activeTab = '/dashboard'
    },
  },
})
