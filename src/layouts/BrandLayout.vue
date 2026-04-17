<template>
  <div class="brand-layout" :class="{ 'edit-mode-active': brandEdit.editMode }">
    <!-- 编辑模式顶部提示条 -->
    <div v-if="brandEdit.editMode" class="edit-mode-bar">
      <span class="edit-mode-bar-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </span>
      <span>编辑模式 — 点击页面上的 <strong>✏️</strong> 图标即可编辑内容</span>
      <button class="edit-mode-bar-exit" @click="brandEdit.exitEditMode()">退出编辑</button>
    </div>

    <!-- 顶部导航栏 -->
    <header class="brand-topnav" :class="{ 'topnav-scrolled': scrolled }">
      <!-- 左：Logo + 返回 -->
      <div class="topnav-left">
        <button v-if="isFromERP" class="topnav-back" @click="$router.push('/portal')" title="返回ERP">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="topnav-logo" @click="$router.push('/brand')">
          <div class="topnav-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#7c3aed" stroke-width="1.8" stroke-linejoin="round"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="#7c3aed" stroke-width="1.8"/>
              <path d="M16 10a4 4 0 01-8 0" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="topnav-brand-name">{{ brandEdit.config.brandName }}</span>
        </div>
        <span v-if="shopStore.shopMode === 'wholesale'" class="topnav-mode-badge">采购商模式</span>
        <span v-else-if="shopStore.shopMode === 'retail'" class="topnav-mode-badge retail">零售模式</span>
        <button v-if="shopStore.shopMode === 'wholesale'" class="topnav-switch-btn" @click="shopStore.setShopMode('retail')" title="切换到零售模式">切换零售</button>
      </div>

      <!-- 中：主导航 -->
      <nav class="topnav-center" v-if="shopStore.shopMode !== null">
        <router-link to="/brand" class="topnav-link" :class="{ active: isExactBrand }">首页</router-link>
        <router-link to="/brand/products" class="topnav-link" active-class="active">商店</router-link>
        <router-link to="/brand/reviews" class="topnav-link" active-class="active">评价</router-link>
        <router-link to="/brand/story" class="topnav-link" active-class="active">品牌故事</router-link>
        <router-link to="/brand/shipping" class="topnav-link" active-class="active">物流</router-link>
        <router-link to="/brand/support" class="topnav-link" active-class="active">支持</router-link>
        <router-link to="/brand/orders" class="topnav-link" active-class="active">订单查询</router-link>
      </nav>
      <!-- 未选模式时仍然显示首页导航，引导用户 -->
      <nav v-else class="topnav-center">
        <router-link to="/brand" class="topnav-link" :class="{ active: isExactBrand }">选择模式</router-link>
      </nav>

      <!-- 右：搜索 + 购物车 + 编辑 -->
      <div class="topnav-right">
        <!-- 搜索 -->
        <div class="topnav-search-wrap" :class="{ open: searchOpen }">
          <input
            v-if="searchOpen"
            v-model="searchKeyword"
            ref="searchInputRef"
            class="topnav-search-input"
            placeholder="搜索产品..."
            @keyup.enter="doSearch"
            @keyup.esc="closeSearch"
          />
          <button class="topnav-icon-btn" @click="toggleSearch" title="搜索">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
        </div>

        <!-- 购物车 -->
        <router-link to="/brand/cart" class="topnav-cart-btn">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
          <span v-if="shopStore.cartCount > 0" class="topnav-cart-badge">{{ shopStore.cartCount }}</span>
        </router-link>

        <div class="topnav-divider"></div>

        <!-- 编辑模式按钮（仅ERP登录用户，桌面端显示） -->
        <button
          v-if="brandEdit.isLoggedIn"
          class="topnav-edit-btn"
          :class="{ active: brandEdit.editMode }"
          @click="brandEdit.toggleEditMode()"
          title="编辑模式"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          {{ brandEdit.editMode ? '编辑中' : '编辑' }}
        </button>

        <router-link to="/brand/settings" class="topnav-settings-btn" title="设置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </router-link>
        <!-- 移动端汉堡按钮 -->
        <button class="topnav-hamburger" @click="mobileMenuOpen = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </header>
    <transition name="drawer">
      <div v-if="mobileMenuOpen" class="mobile-drawer-overlay" @click.self="mobileMenuOpen = false">
        <div class="mobile-drawer">
          <div class="mobile-drawer-header">
            <span class="mobile-drawer-brand">{{ brandEdit.config.brandName }}</span>
            <button class="mobile-drawer-close" @click="mobileMenuOpen = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <nav class="mobile-drawer-nav">
            <router-link v-for="link in mobileLinks" :key="link.to" :to="link.to" class="mobile-drawer-link" active-class="active" @click="mobileMenuOpen = false">{{ link.label }}</router-link>
          </nav>
          <div class="mobile-drawer-footer">
            <router-link v-if="shopStore.shopMode !== 'retail'" to="/brand/wholesale-apply" class="mobile-drawer-cta" @click="mobileMenuOpen = false">申请成为采购商</router-link>
            <button v-if="shopStore.shopMode === 'wholesale'" class="mobile-drawer-cta mobile-drawer-cta-switch" @click="shopStore.setShopMode('retail'); mobileMenuOpen = false">切换到零售模式</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 内容区 -->
    <main class="brand-main">
      <!-- 结账成功提示 -->
      <transition name="brand-toast">
        <div v-if="shopStore.checkoutSuccess" class="brand-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          订单提交成功！感谢您的购买。
        </div>
      </transition>
      <router-view />
    </main>

    <!-- 品牌页脚 -->
    <footer v-if="shopStore.shopMode !== null" class="brand-footer">
      <div class="brand-footer-inner">
        <div class="brand-footer-top">
          <div class="brand-footer-col brand-footer-brand">
            <div class="brand-footer-logo">
              <div class="brand-footer-logo-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#7c3aed" stroke-width="1.8" stroke-linejoin="round"/>
                  <line x1="3" y1="6" x2="21" y2="6" stroke="#7c3aed" stroke-width="1.8"/>
                  <path d="M16 10a4 4 0 01-8 0" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <span>{{ brandEdit.config.brandName }}</span>
            </div>
            <p class="brand-footer-slogan">{{ brandEdit.config.brandSlogan }}</p>
            <p class="brand-footer-tagline">覆盖 120+ 国家 · 50,000+ 数字游民的选择</p>
          </div>
          <div class="brand-footer-col">
            <h4>商店</h4>
            <router-link to="/brand/products">所有产品</router-link>
            <router-link to="/brand/products?tag=new">新品上市</router-link>
            <router-link to="/brand/products?tag=hot">热销单品</router-link>
            <router-link to="/brand/products?tag=sale">特惠专区</router-link>
          </div>
          <div class="brand-footer-col">
            <h4>品牌</h4>
            <router-link to="/brand/story">品牌故事</router-link>
            <router-link to="/brand/reviews">用户评价</router-link>
            <router-link v-if="shopStore.shopMode !== 'retail'" to="/brand/wholesale-apply">采购商申请</router-link>
          </div>
          <div class="brand-footer-col">
            <h4>帮助</h4>
            <router-link to="/brand/shipping">物流配送</router-link>
            <router-link to="/brand/support">客户支持</router-link>
            <router-link to="/brand/orders">订单查询</router-link>
            <router-link to="/brand/settings">账户设置</router-link>
          </div>
        </div>
        <div class="brand-footer-bottom">
          <p>© 2026 {{ brandEdit.config.brandName }}. All rights reserved.</p>
          <p class="brand-footer-icp">Powered by NOMADIC DAIRY · nomadicdairy.pages.dev</p>
        </div>
      </div>
    </footer>

    <!-- 客服智能体浮窗 -->
    <BrandCustomerService />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShopStore } from '@/stores/shopStore'
import { useBrandEditStore } from '@/stores/brandEdit'
import BrandCustomerService from '@/components/BrandCustomerService.vue'

const shopStore = useShopStore()
const brandEdit = useBrandEditStore()
const route = useRoute()
const router = useRouter()
const scrolled = ref(false)
const searchOpen = ref(false)
const searchKeyword = ref('')
const searchInputRef = ref<HTMLInputElement>()

const mobileMenuOpen = ref(false)

const mobileLinks = [
  { to: '/brand', label: '首页' },
  { to: '/brand/products', label: '商店' },
  { to: '/brand/reviews', label: '用户评价' },
  { to: '/brand/story', label: '品牌故事' },
  { to: '/brand/shipping', label: '物流配送' },
  { to: '/brand/support', label: '客户支持' },
  { to: '/brand/orders', label: '订单查询' },
  { to: '/brand/cart', label: '购物车' },
  { to: '/brand/settings', label: '设置' },
]

// SEO: 动态更新 meta 标签
const META_MAP: Record<string, { title: string; desc: string }> = {
  '/brand': { title: 'NOMADIC DAIRY — 专为数字游民设计的装备品牌', desc: '轻巧、耐久、可持续。覆盖 120+ 国家，50,000+ 数字游民的选择。' },
  '/brand/products': { title: '全部商品 · NOMADIC DAIRY', desc: '探索 NOMADIC DAIRY 全系列装备，筑梦旅途每一站。' },
  '/brand/story': { title: '品牌故事 · NOMADIC DAIRY', desc: '从一次亚洲之旅诞生的品牌，专为数字游民而生。' },
  '/brand/reviews': { title: '用户评价 · NOMADIC DAIRY', desc: '来自全球 120+ 国家的数字游民的真实反馈，评分 4.8/5。' },
  '/brand/shipping': { title: '物流配送 · NOMADIC DAIRY', desc: '全球配送，DHL、FedEx、顺丰速运，30天无忧退换。' },
  '/brand/support': { title: '客户支持 · NOMADIC DAIRY', desc: '7×24在线客服，随时解答您的问题。' },
  '/brand/orders': { title: '订单查询 · NOMADIC DAIRY', desc: '输入手机号或订单号，实时查询您的订单状态。' },
  '/brand/wholesale-apply': { title: '采购商申请 · NOMADIC DAIRY', desc: '申请成为 NOMADIC DAIRY 采购商，享受专属批发价格。' },
  '/brand/checkout': { title: '结账 · NOMADIC DAIRY', desc: '安全支付，全球配送。' },
}

function updateMeta() {
  const cfg = brandEdit.config
  const meta = META_MAP[route.path] || {
    title: `${route.meta?.title || 'NOMADIC DAIRY'}`,
    desc: cfg.heroDesc,
  }
  // title
  document.title = meta.title
  // description
  let descEl = document.querySelector('meta[name="description"]')
  if (!descEl) { descEl = document.createElement('meta'); descEl.setAttribute('name', 'description'); document.head.appendChild(descEl) }
  descEl.setAttribute('content', meta.desc)
  // OG tags
  const ogMap: Record<string, string> = {
    'og:title': meta.title,
    'og:description': meta.desc,
    'og:image': cfg.heroImage,
    'og:type': 'website',
  }
  for (const [prop, content] of Object.entries(ogMap)) {
    let el = document.querySelector(`meta[property="${prop}"]`)
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
    el.setAttribute('content', content)
  }
}

watch(() => route.path, updateMeta, { immediate: false })

// 精确匹配 /brand 首页
const isExactBrand = computed(() => route.path === '/brand' || route.path === '/brand/')

// 从ERP内部跳转过来才显示返回按钮
const isFromERP = computed(() => !!localStorage.getItem('erp_token'))

// 每次进入品牌中心加载商品（不重置已有模式）
onMounted(async () => {
  // 根据当前路径设置模式
  if (route.path === '/brand/retail') {
    shopStore.setShopMode('retail')
  } else if (route.path === '/brand/wholesale') {
    shopStore.setShopMode('wholesale')
  } else if (route.path === '/brand' || route.path === '/brand/') {
    shopStore.resetShopMode()
  }
  // URL 参数 ?mode=wholesale|retail 直接设置模式（优先级最高）
  const modeParam = route.query.mode as string
  if (modeParam === 'wholesale' || modeParam === 'retail') {
    shopStore.setShopMode(modeParam)
  }
  // 从云端同步品牌配置
  brandEdit.syncFromCloud()
  if (shopStore.products.length === 0) {
    await shopStore.fetchProducts()
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  updateMeta()
})

// 路径变化时同步模式
watch(() => route.path, (path) => {
  if (path === '/brand/retail') {
    shopStore.setShopMode('retail')
  } else if (path === '/brand/wholesale') {
    shopStore.setShopMode('wholesale')
  } else if (path === '/brand' || path === '/brand/') {
    shopStore.resetShopMode()
  }
  // 零售用户不能访问采购商申请页
  if (shopStore.shopMode === 'retail' && path === '/brand/wholesale-apply') {
    router.replace('/brand/products')
  }
}, { immediate: true })

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  brandEdit.exitEditMode()
})

function handleScroll() {
  scrolled.value = window.scrollY > 10
}

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    await nextTick()
    searchInputRef.value?.focus()
  }
}

function closeSearch() {
  searchOpen.value = false
  searchKeyword.value = ''
}

function doSearch() {
  if (!searchKeyword.value.trim()) return
  router.push({ path: '/brand/products', query: { q: searchKeyword.value.trim() } })
  closeSearch()
}
</script>

<style scoped>
.brand-layout {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* ── 编辑模式提示条 ─────────────────────────────────── */
.edit-mode-bar {
  position: sticky;
  top: 0;
  z-index: 101;
  background: #7c3aed;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.edit-mode-bar-icon { display: flex; align-items: center; opacity: 0.8; }
.edit-mode-bar-exit {
  margin-left: auto;
  padding: 4px 14px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.edit-mode-bar-exit:hover { background: rgba(255,255,255,0.35); }

/* 编辑模式下可编辑区域全局高亮样式（供子页面使用） */
:global(.edit-mode-active .editable-block) {
  position: relative;
  outline: 2px dashed rgba(124,58,237,0.3);
  border-radius: 8px;
  transition: outline-color 0.2s;
}
:global(.edit-mode-active .editable-block:hover) {
  outline-color: #7c3aed;
}
:global(.edit-mode-active .edit-trigger) {
  display: flex !important;
}
:global(.edit-trigger) {
  display: none;
  position: absolute;
  top: 8px; right: 8px;
  z-index: 10;
  width: 28px; height: 28px;
  border-radius: 8px;
  background: #7c3aed;
  color: #fff;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 12px rgba(124,58,237,0.4);
  transition: transform 0.2s;
}
:global(.edit-trigger:hover) { transform: scale(1.1); }

/* ── TopNav ─────────────────────────────────── */
.brand-topnav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.edit-mode-active .brand-topnav { top: 36px; }
.brand-topnav.topnav-scrolled {
  border-bottom-color: rgba(0,0,0,0.06);
  box-shadow: 0 1px 20px rgba(0,0,0,0.04);
}

.topnav-left { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.topnav-back {
  width: 32px; height: 32px; border-radius: 9px;
  background: #f5f5f7; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(29,29,31,0.5); transition: background 0.2s, color 0.2s;
}
.topnav-back:hover { background: #e8e8ed; color: #1d1d1f; }
.topnav-logo { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.topnav-logo-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: linear-gradient(135deg, #ede9fe, #f3e8ff);
  display: flex; align-items: center; justify-content: center;
}
.topnav-brand-name { font-size: 14px; font-weight: 800; color: #1d1d1f; letter-spacing: 0.02em; }
.topnav-mode-badge {
  font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
  background: rgba(124,58,237,0.1); color: #7c3aed; letter-spacing: 0.02em;
}
.topnav-mode-badge.retail { background: rgba(0,113,227,0.1); color: #0071e3; }
.topnav-switch-btn { padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 6px; border: 1.5px solid rgba(0,113,227,0.3); background: transparent; color: #0071e3; cursor: pointer; transition: all 0.2s; }
.topnav-switch-btn:hover { background: rgba(0,113,227,0.08); }

.topnav-center {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 4px; background: rgba(0,0,0,0.04); border-radius: 999px;
  padding: 4px; max-width: 520px; margin: 0 auto;
}
.topnav-link {
  padding: 6px 14px; border-radius: 999px;
  font-size: 12px; font-weight: 600; color: rgba(29,29,31,0.5);
  text-decoration: none; transition: background 0.2s, color 0.2s; white-space: nowrap;
}
.topnav-link:hover { color: #1d1d1f; }
.topnav-link.active { background: #fff; color: #1d1d1f; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }

.topnav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.topnav-search-wrap { display: flex; align-items: center; gap: 4px; }
.topnav-search-input {
  width: 160px; padding: 6px 12px;
  border: 1.5px solid rgba(124,58,237,0.4); border-radius: 10px;
  font-size: 13px; outline: none;
  background: #fff; transition: border-color 0.2s;
}
.topnav-search-input:focus { border-color: #7c3aed; }

.topnav-icon-btn {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(29,29,31,0.45); transition: background 0.2s, color 0.2s;
}
.topnav-icon-btn:hover { background: #f5f5f7; color: #1d1d1f; }

.topnav-cart-btn {
  position: relative; width: 40px; height: 40px; border-radius: 12px;
  background: #1d1d1f; color: #fff;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none; transition: background 0.2s, transform 0.2s;
}
.topnav-cart-btn:hover { background: #0071e3; transform: scale(1.05); }
.topnav-cart-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px;
  background: #7c3aed; color: #fff; border-radius: 999px;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; border: 2px solid #fff;
}

.topnav-edit-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 10px;
  font-size: 12px; font-weight: 700;
  border: 1.5px solid rgba(124,58,237,0.3);
  background: transparent; color: #7c3aed;
  cursor: pointer; transition: all 0.2s;
}
.topnav-edit-btn:hover { background: rgba(124,58,237,0.08); }
.topnav-edit-btn.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }

.topnav-divider { width: 1px; height: 22px; background: rgba(0,0,0,0.08); margin: 0 2px; }
.topnav-settings-btn {
  width: 32px; height: 32px; border-radius: 9px;
  background: transparent; color: rgba(29,29,31,0.4);
  display: flex; align-items: center; justify-content: center;
  text-decoration: none; transition: background 0.2s, color 0.2s;
}
.topnav-settings-btn:hover { background: #f5f5f7; color: #1d1d1f; }

/* ── Main ─────────────────────────────────── */
.brand-main { flex: 1; position: relative; }

/* ── Toast ─────────────────────────────────── */
.brand-toast {
  position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
  z-index: 9999; background: #7c3aed; color: #fff;
  padding: 12px 24px; border-radius: 999px;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 20px 50px rgba(124,58,237,0.3); white-space: nowrap;
}
.brand-toast-enter-active, .brand-toast-leave-active { transition: all 0.4s cubic-bezier(0.23,1,0.32,1); }
.brand-toast-enter-from, .brand-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-16px); }

@media (max-width: 768px) {
  .topnav-center { display: none; }
  .topnav-edit-btn { display: none; }
  .edit-mode-bar { display: none; }
  .brand-topnav { padding: 0 16px; }
  .topnav-hamburger { display: flex; }
  /* 移动端：限制在 .wx-content 可用高度内，禁止撑破 */
  .brand-layout {
    min-height: 0 !important;
    height: 100%;
    overflow: hidden;
  }
  .brand-main {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .brand-footer {
    /* footer 变成普通文档流，在 .brand-main 内部滚动 */
    flex-shrink: 0;
  }
}

/* ── Hamburger ─────────────────────────────────── */
.topnav-hamburger {
  display: none;
  align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px;
  background: #f5f5f7; border: none; cursor: pointer;
  color: #1d1d1f; margin-left: 4px;
}

/* ── Mobile Drawer ─────────────────────────────────── */
.mobile-drawer-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
}
.mobile-drawer {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 280px; background: #fff;
  display: flex; flex-direction: column;
  box-shadow: -20px 0 60px rgba(0,0,0,0.15);
}
.mobile-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.06);
}
.mobile-drawer-brand { font-size: 14px; font-weight: 800; color: #1d1d1f; }
.mobile-drawer-close {
  width: 32px; height: 32px; border-radius: 8px;
  background: #f5f5f7; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(29,29,31,0.5);
}
.mobile-drawer-nav {
  flex: 1; padding: 16px 16px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto;
}
.mobile-drawer-link {
  padding: 12px 16px; border-radius: 12px;
  font-size: 15px; font-weight: 600; color: #1d1d1f;
  text-decoration: none; transition: background 0.15s;
}
.mobile-drawer-link:hover, .mobile-drawer-link.active { background: #f5f5f7; color: #7c3aed; }
.mobile-drawer-footer { padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 10px; }
.mobile-drawer-cta {
  display: block; padding: 14px; background: #7c3aed; color: #fff;
  border-radius: 14px; font-size: 14px; font-weight: 700;
  text-align: center; text-decoration: none; transition: background 0.2s; border: none; cursor: pointer;
}
.mobile-drawer-cta-switch { background: rgba(0,113,227,0.1); color: #0071e3; }
.mobile-drawer-cta:hover { background: #6d28d9; }

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .mobile-drawer, .drawer-leave-active .mobile-drawer { transition: transform 0.3s cubic-bezier(0.23,1,0.32,1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .mobile-drawer, .drawer-leave-to .mobile-drawer { transform: translateX(100%); }

/* ── Footer ─────────────────────────────────── */
.brand-footer {
  background: #1d1d1f; color: rgba(255,255,255,0.65);
  padding: 0;
  padding-bottom: env(safe-area-inset-bottom);
}
.brand-footer-inner { max-width: 1200px; margin: 0 auto; padding: 64px 48px 32px; }
.brand-footer-top {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px; margin-bottom: 48px;
}
.brand-footer-logo {
  display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
}
.brand-footer-logo-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: linear-gradient(135deg, #ede9fe, #f3e8ff);
  display: flex; align-items: center; justify-content: center;
}
.brand-footer-logo span { font-size: 14px; font-weight: 800; color: #fff; }
.brand-footer-slogan { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
.brand-footer-tagline { font-size: 11px; color: rgba(255,255,255,0.3); }
.brand-footer-col h4 {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: rgba(255,255,255,0.4);
  margin-bottom: 16px;
}
.brand-footer-col a {
  display: block; font-size: 13px; color: rgba(255,255,255,0.55);
  text-decoration: none; margin-bottom: 10px;
  transition: color 0.2s;
}
.brand-footer-col a:hover { color: #fff; }
.brand-footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 24px;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 8px;
  font-size: 11px; color: rgba(255,255,255,0.25);
}
.brand-footer-icp { font-size: 11px; color: rgba(255,255,255,0.2); }

@media (max-width: 768px) {
  .brand-footer-top { grid-template-columns: 1fr 1fr; gap: 24px; }
  .brand-footer-brand { grid-column: 1 / -1; }
  .brand-footer-inner { padding: 28px 20px 20px; }
  .brand-footer-bottom { flex-direction: column; align-items: flex-start; gap: 4px; }
  .brand-footer-col h4 { margin-bottom: 10px; }
  .brand-footer-col a { margin-bottom: 8px; }
}
</style>
