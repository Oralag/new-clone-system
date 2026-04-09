import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import {
  ArrowDown, ArrowRight, ArrowUp, Bell, Bottom, Box,
  CircleCheck, CircleCheckFilled, CircleClose, Clock, Close, Cpu,
  Delete, Document, DocumentChecked, Download, Edit, Filter,
  Finished, GoodsFilled, Grid, InfoFilled, List, Loading,
  Microphone, Minus, Money, Moon, OfficeBuilding, Picture,
  Plus, Promotion, RefreshLeft, Search, Select, SetUp,
  Shop, ShoppingCart, Sunny, TrendCharts, User, View, Wallet, Warning,
} from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import './assets/mobile.css'
import App from './App.vue'
import router from './router'

// 新 SW 激活后立即刷新页面，避免旧缓存导致空白页
registerSW({
  onNeedRefresh() { window.location.reload() },
  onRegisteredSW(_, sw) {
    // 每60秒检查一次更新
    setInterval(() => sw && sw.update(), 60 * 1000)
  }
})

const app = createApp(App)

const usedIcons = {
  ArrowDown, ArrowRight, ArrowUp, Bell, Bottom, Box,
  CircleCheck, CircleCheckFilled, CircleClose, Clock, Close, Cpu,
  Delete, Document, DocumentChecked, Download, Edit, Filter,
  Finished, GoodsFilled, Grid, InfoFilled, List, Loading,
  Microphone, Minus, Money, Moon, OfficeBuilding, Picture,
  Plus, Promotion, RefreshLeft, Search, Select, SetUp,
  Shop, ShoppingCart, Sunny, TrendCharts, User, View, Wallet, Warning,
}
for (const [key, component] of Object.entries(usedIcons)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

const savedTheme = localStorage.getItem('erp_theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

app.mount('#app')
