import { defineStore } from 'pinia'

let _hideTimer: ReturnType<typeof setTimeout> | null = null

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    theme: 'light',
    activeTopMenu: 'sale', // current top-level menu key (clicked/persistent)
    hoverTopMenu: '' as string, // hovered menu key (flyout)
    flyoutY: 56 as number, // top offset for flyout panel
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setActiveTopMenu(key: string) {
      this.activeTopMenu = key
    },
    setHoverTopMenu(key: string) {
      this.hoverTopMenu = key
    },
    // Show flyout immediately, cancel any pending hide
    showFlyout(key: string, y?: number) {
      if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
      if (y !== undefined) this.flyoutY = y
      this.hoverTopMenu = key
    },
    // Schedule hide with delay — allows mouse to travel to flyout panel
    scheduleHide() {
      if (_hideTimer) clearTimeout(_hideTimer)
      _hideTimer = setTimeout(() => {
        this.hoverTopMenu = ''
        _hideTimer = null
      }, 300)
    },
    // Cancel pending hide (mouse entered flyout)
    cancelHideTimer() {
      if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
    },
  },
})
