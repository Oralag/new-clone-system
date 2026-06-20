import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './style.css'
import './assets/mobile.css'
import App from './App.vue'
import router from './router'
import i18n, { elementLocaleMap, getStoredLocale } from './i18n'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus, { locale: elementLocaleMap[getStoredLocale()] })

document.documentElement.setAttribute('lang', getStoredLocale())

const savedTheme = localStorage.getItem('erp_theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

app.mount('#app')

// 移除启动骨架屏
setTimeout(() => {
  const loadingEl = document.getElementById('app-loading')
  if (!loadingEl) return
  loadingEl.classList.add('fade-out')
  setTimeout(() => loadingEl.remove(), 350)
}, 300)
