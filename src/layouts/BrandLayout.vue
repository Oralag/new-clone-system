<template>
  <div class="brand-layout" :class="{ 'edit-mode-active': brandEdit.editMode }">
    <!-- 编辑模式顶部提示条 -->
    <div v-if="brandEdit.editMode" class="edit-mode-bar">
      <span class="edit-mode-bar-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </span>
      <span>{{ t('brandLayout.editModeHintPrefix') }} <strong>✏️</strong> {{ t('brandLayout.editModeHintSuffix') }}</span>
      <button class="edit-mode-bar-exit" @click="brandEdit.exitEditMode()">{{ t('brandLayout.exitEdit') }}</button>
    </div>

    <!-- 顶部导航栏 -->
    <header class="brand-topnav" :class="{ 'topnav-scrolled': scrolled }">
      <!-- 左：Logo + 返回 -->
      <div class="topnav-left">
        <button v-if="isFromERP" class="topnav-back" @click="$router.push('/portal')" :title="t('brandLayout.backToErp')">
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
        <span v-if="shopStore.shopMode === 'wholesale'" class="topnav-mode-badge">{{ t('brandLayout.wholesaleMode') }}</span>
        <span v-else-if="shopStore.shopMode === 'retail'" class="topnav-mode-badge retail">{{ t('brandLayout.retailMode') }}</span>
        <button v-if="shopStore.shopMode === 'wholesale'" class="topnav-switch-btn" @click="shopStore.setShopMode('retail')" :title="t('brandLayout.switchToRetail')">{{ t('brandLayout.switchRetail') }}</button>
      </div>

      <!-- 中：主导航 -->
      <nav class="topnav-center" v-if="shopStore.shopMode !== null">
        <router-link to="/brand" class="topnav-link" :class="{ active: isExactBrand }">{{ t('brandLayout.home') }}</router-link>
        <router-link to="/brand/products" class="topnav-link" active-class="active">{{ t('brandLayout.shop') }}</router-link>
        <router-link to="/brand/reviews" class="topnav-link" active-class="active">{{ t('brandLayout.reviews') }}</router-link>
        <router-link to="/brand/story" class="topnav-link" active-class="active">{{ t('brandLayout.story') }}</router-link>
        <router-link to="/brand/shipping" class="topnav-link" active-class="active">{{ t('brandLayout.shipping') }}</router-link>
        <router-link to="/brand/support" class="topnav-link" active-class="active">{{ t('brandLayout.support') }}</router-link>
        <router-link to="/brand/orders" class="topnav-link" active-class="active">{{ t('brandLayout.orderLookup') }}</router-link>
      </nav>
      <!-- 未选模式时仍然显示首页导航，引导用户 -->
      <nav v-else class="topnav-center">
        <router-link to="/brand" class="topnav-link" :class="{ active: isExactBrand }">{{ t('brandLayout.selectMode') }}</router-link>
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
            :placeholder="t('brandLayout.searchPlaceholder')"
            @keyup.enter="doSearch"
            @keyup.esc="closeSearch"
          />
          <button class="topnav-icon-btn" @click="toggleSearch" :title="t('common.search')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
        </div>

        <!-- 采购单汇总（批发）：件数 + 合计，点开看明细 -->
        <button v-if="shopStore.isWholesale" class="topnav-bag" :class="{ filled: bagPieces > 0 }" @click="bagOpen = true">
          <span class="topnav-bag-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6a1 1 0 011 1v1h2a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h2V4a1 1 0 011-1z"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/></svg>
            <span v-if="bagPieces > 0" class="topnav-bag-badge">{{ bagPieces }}</span>
          </span>
          <span v-if="bagPieces > 0" class="topnav-bag-text">
            <span class="topnav-bag-pieces">{{ bagPieces }} 件 ·</span>
            <span class="topnav-bag-amt">¥{{ fmtAmount(shopStore.totalAmount) }}</span>
          </span>
          <span v-else class="topnav-bag-text topnav-bag-empty">采购单</span>
        </button>
        <!-- 零售：购物车 -->
        <router-link v-else to="/brand/cart" class="topnav-bag">
          <span class="topnav-bag-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L4 6v14a2 2 0 002 2h12a2 2 0 002-2V6l-2-4z"/><line x1="4" y1="6" x2="20" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span v-if="shopStore.cartCount > 0" class="topnav-bag-badge">{{ shopStore.cartCount }}</span>
          </span>
        </router-link>

        <div class="topnav-divider"></div>

        <!-- 分享按钮（仅ERP登录用户可见，访客看不到） -->
        <button v-if="brandEdit.isLoggedIn" class="topnav-share-btn" @click="openShare" title="分享给别人">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>
          分享
        </button>

        <!-- 编辑模式按钮（仅ERP登录用户，桌面端显示） -->
        <button
          v-if="brandEdit.isLoggedIn"
          class="topnav-edit-btn"
          :class="{ active: brandEdit.editMode }"
          @click="brandEdit.toggleEditMode()"
          :title="t('brandLayout.editMode')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          {{ brandEdit.editMode ? t('brandLayout.editing') : t('common.edit') }}
        </button>

        <router-link to="/brand/settings" class="topnav-settings-btn" :title="t('brandLayout.settings')">
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
            <!-- 分享（仅ERP登录用户可见） -->
            <button v-if="brandEdit.isLoggedIn" class="mobile-drawer-cta mobile-drawer-cta-share" @click="mobileMenuOpen = false; openShare()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>
              分享这个页面
            </button>
            <router-link v-if="shopStore.shopMode !== 'retail'" to="/brand/wholesale-apply" class="mobile-drawer-cta" @click="mobileMenuOpen = false">{{ t('brandLayout.applyWholesale') }}</router-link>
            <button v-if="shopStore.shopMode === 'wholesale'" class="mobile-drawer-cta mobile-drawer-cta-switch" @click="shopStore.setShopMode('retail'); mobileMenuOpen = false">{{ t('brandLayout.switchToRetail') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 分享面板 -->
    <transition name="drawer">
      <div v-if="shareOpen" class="share-overlay" @click.self="shareOpen = false">
        <div class="share-panel">
          <div class="share-head">
            <h3>分享{{ shareModeLabel }}</h3>
            <button class="share-close" @click="shareOpen = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- 分享哪个页面 -->
          <div class="share-tabs">
            <button
              v-for="opt in SHARE_TARGETS"
              :key="opt.mode"
              class="share-tab"
              :class="{ active: shareMode === opt.mode }"
              @click="shareMode = opt.mode"
            >{{ opt.label }}</button>
          </div>

          <div class="share-qr">
            <img v-if="shareQr" :src="shareQr" alt="二维码" />
            <div v-else class="share-qr-empty">生成中...</div>
          </div>
          <p class="share-qr-tip">长按二维码保存，或截图发给对方</p>

          <div class="share-link">{{ shareUrl }}</div>
          <button class="share-copy" :class="{ done: shareCopied }" @click="copyShareLink">
            <svg v-if="!shareCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {{ shareCopied ? '已复制' : '复制链接' }}
          </button>
          <p class="share-note">对方不需要登录，打开就能看。</p>
        </div>
      </div>
    </transition>

    <!-- 采购单明细面板 -->
    <transition name="drawer">
      <div v-if="bagOpen" class="bag-overlay" @click.self="bagOpen = false">
        <div class="bag-panel">
          <div class="bag-head">
            <h3>采购单</h3>
            <button class="bag-close" @click="bagOpen = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <p v-if="!shopStore.cart.length" class="bag-empty">还没加产品 —— 在产品页点「加入采购单」。</p>

          <template v-else>
            <ul class="bag-list">
              <li v-for="item in shopStore.cart" :key="item.id" class="bag-item">
                <img :src="item.image" :alt="item.name" class="bag-item-img" referrerpolicy="no-referrer" loading="lazy" decoding="async" />
                <div class="bag-item-main">
                  <span class="bag-item-name">{{ item.name }}</span>
                  <span class="bag-item-unit">
                    ¥{{ item.wholesalePrice }} / {{ item.unit || '件' }}
                    <template v-if="item.minOrderQuantity > 1"> · 起订 {{ item.minOrderQuantity }}</template>
                  </span>
                </div>
                <div class="bag-item-right">
                  <div class="bag-step">
                    <button class="bag-step-btn" @click="bagStep(item, -1)" aria-label="减少">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <span class="bag-step-qty">{{ item.quantity }}</span>
                    <button class="bag-step-btn" @click="bagStep(item, 1)" aria-label="增加">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                  <span class="bag-item-amt">¥{{ fmtAmount(item.wholesalePrice * item.quantity) }}</span>
                </div>
              </li>
            </ul>

            <!-- 每套规则各算各的门槛，混批时分开提示 -->
            <div class="bag-gaps">
              <div v-for="g in bagGaps" :key="g.scheme" class="bag-gap" :class="{ reached: !g.next }">
                <span class="bag-gap-label">{{ g.label }} <b>¥{{ fmtAmount(g.subtotal) }}</b></span>
                <span v-if="g.next" class="bag-gap-text">距「{{ g.next.tier.name }}」还差 <b>¥{{ fmtAmount(g.next.gap) }}</b></span>
                <span v-else class="bag-gap-text">已达最高档 ✓</span>
              </div>
            </div>

            <div class="bag-foot">
              <div class="bag-total">
                <span>合计 {{ bagPieces }} 件</span>
                <strong>¥{{ fmtAmount(shopStore.totalAmount) }}</strong>
              </div>
              <router-link to="/brand/cart" class="bag-checkout" @click="bagOpen = false">去结算</router-link>
            </div>
          </template>
        </div>
      </div>
    </transition>

    <!-- 内容区 -->
    <main class="brand-main">
      <!-- 结账成功提示 -->
      <transition name="brand-toast">
        <div v-if="shopStore.checkoutSuccess" class="brand-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {{ t('brandLayout.orderSuccess') }}
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
            <p class="brand-footer-tagline">{{ t('brandLayout.footerTagline') }}</p>
          </div>
          <div class="brand-footer-col">
            <h4>{{ t('brandLayout.shop') }}</h4>
            <router-link to="/brand/products">{{ t('brandLayout.allProducts') }}</router-link>
            <router-link to="/brand/products?tag=new">{{ t('brandLayout.newArrivals') }}</router-link>
            <router-link to="/brand/products?tag=hot">{{ t('brandLayout.bestSellers') }}</router-link>
            <router-link to="/brand/products?tag=sale">{{ t('brandLayout.saleZone') }}</router-link>
          </div>
          <div class="brand-footer-col">
            <h4>{{ t('brandLayout.brand') }}</h4>
            <router-link to="/brand/story">{{ t('brandLayout.story') }}</router-link>
            <router-link to="/brand/reviews">{{ t('brandLayout.customerReviews') }}</router-link>
            <router-link v-if="shopStore.shopMode !== 'retail'" to="/brand/wholesale-apply">{{ t('brandLayout.applyWholesale') }}</router-link>
          </div>
          <div class="brand-footer-col">
            <h4>{{ t('brandLayout.help') }}</h4>
            <router-link to="/brand/shipping">{{ t('brandLayout.shippingDelivery') }}</router-link>
            <router-link to="/brand/support">{{ t('brandLayout.customerSupport') }}</router-link>
            <router-link to="/brand/orders">{{ t('brandLayout.orderLookup') }}</router-link>
            <router-link to="/brand/settings">{{ t('brandLayout.accountSettings') }}</router-link>
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
import { useI18n } from 'vue-i18n'
import { useShopStore } from '@/stores/shopStore'
import { useBrandEditStore } from '@/stores/brandEdit'
import BrandCustomerService from '@/components/BrandCustomerService.vue'
import { schemeOf, nextThreshold, fmtAmount, SCHEME_LABEL } from '@/utils/wholesaleTiers'
import type { Scheme } from '@/utils/wholesaleTiers'
import type { ShopCartItem } from '@/stores/shopStore'

const shopStore = useShopStore()
const brandEdit = useBrandEditStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const scrolled = ref(false)
const searchOpen = ref(false)
const searchKeyword = ref('')
const searchInputRef = ref<HTMLInputElement>()

const mobileMenuOpen = ref(false)

// ── 顶栏采购单汇总 ────────────────────────────────────────────────────
const bagOpen = ref(false)
// cartCount 是行数，顶栏要的是件数
const bagPieces = computed(() => shopStore.cart.reduce((n, i) => n + i.quantity, 0))

// 三套规则的门槛各算各的，混批时每套单独提示还差多少
const bagGaps = computed(() => {
  const sums = new Map<Scheme, number>()
  for (const item of shopStore.cart) {
    const s = schemeOf(item)
    sums.set(s, (sums.get(s) || 0) + item.wholesalePrice * item.quantity)
  }
  return [...sums].map(([scheme, subtotal]) => ({
    scheme,
    label: SCHEME_LABEL[scheme],
    subtotal,
    next: nextThreshold(scheme, subtotal),
  }))
})

// 减到不够一个起订量就整条移出（updateQuantity 会卡在起订量上下不来）
function bagStep(item: ShopCartItem, dir: 1 | -1) {
  const step = item.isWholesale ? Math.max(1, item.minOrderQuantity) : 1
  if (dir < 0 && item.quantity - step < step) {
    shopStore.removeFromCart(item.id, item.isWholesale)
    return
  }
  shopStore.updateQuantity(item.id, item.isWholesale, dir * step)
}

// 面板开着时切走页面就关掉，免得挡住新页面
watch(() => route.fullPath, () => { bagOpen.value = false })

const mobileLinks = computed(() => ([
  { to: '/brand', label: t('brandLayout.home') },
  { to: '/brand/products', label: t('brandLayout.shop') },
  { to: '/brand/reviews', label: t('brandLayout.customerReviews') },
  { to: '/brand/story', label: t('brandLayout.story') },
  { to: '/brand/shipping', label: t('brandLayout.shippingDelivery') },
  { to: '/brand/support', label: t('brandLayout.customerSupport') },
  { to: '/brand/orders', label: t('brandLayout.orderLookup') },
  { to: '/brand/cart', label: t('brandLayout.cart') },
  { to: '/brand/settings', label: t('brandLayout.settings') },
]))

// SEO: 动态更新 meta 标签
function getMetaMap() {
  return {
    '/brand': { title: t('brandLayout.metaHomeTitle'), desc: t('brandLayout.metaHomeDesc') },
    '/brand/products': { title: t('brandLayout.metaProductsTitle'), desc: t('brandLayout.metaProductsDesc') },
    '/brand/story': { title: t('brandLayout.metaStoryTitle'), desc: t('brandLayout.metaStoryDesc') },
    '/brand/reviews': { title: t('brandLayout.metaReviewsTitle'), desc: t('brandLayout.metaReviewsDesc') },
    '/brand/shipping': { title: t('brandLayout.metaShippingTitle'), desc: t('brandLayout.metaShippingDesc') },
    '/brand/support': { title: t('brandLayout.metaSupportTitle'), desc: t('brandLayout.metaSupportDesc') },
    '/brand/orders': { title: t('brandLayout.metaOrdersTitle'), desc: t('brandLayout.metaOrdersDesc') },
    '/brand/wholesale-apply': { title: t('brandLayout.metaWholesaleTitle'), desc: t('brandLayout.metaWholesaleDesc') },
    '/brand/checkout': { title: t('brandLayout.metaCheckoutTitle'), desc: t('brandLayout.metaCheckoutDesc') },
  }
}

function updateMeta() {
  const cfg = brandEdit.config
  const metaMap = getMetaMap()
  const meta = metaMap[route.path] || {
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
    'og:image': cfg.heroImages?.[0] || cfg.heroImage,
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

// ── 分享：生成干净的公开链接 + 二维码 ────────────────────────────
// 只发对外能打开的 /brand/* 路由，绝不把 ?v= 构建时间戳之类的内部参数带出去
const SHARE_TARGETS = [
  { mode: 'wholesale', label: '采购商主页', path: '/brand/wholesale' },
  { mode: 'retail', label: '零售商城', path: '/brand/retail' },
  { mode: 'pricelist', label: '拿货价目表', path: '/brand/products?mode=wholesale' },
] as const

const shareOpen = ref(false)
const shareMode = ref<'wholesale' | 'retail' | 'pricelist'>('wholesale')
const shareQr = ref('')
const shareCopied = ref(false)

const shareTarget = computed(() => SHARE_TARGETS.find(o => o.mode === shareMode.value) || SHARE_TARGETS[0])
const shareModeLabel = computed(() => shareTarget.value.label)
const shareUrl = computed(() => `${location.origin}/#${shareTarget.value.path}`)

function openShare() {
  // 默认分享当前所处的身份，省得每次手动切
  shareMode.value = shopStore.shopMode === 'retail' ? 'retail' : 'wholesale'
  shareCopied.value = false
  shareOpen.value = true
}

watch([shareOpen, shareUrl], async () => {
  if (!shareOpen.value) return
  shareQr.value = ''
  try {
    const QRCode = (await import('qrcode')).default
    shareQr.value = await QRCode.toDataURL(shareUrl.value, {
      width: 480, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#1d1d1f', light: '#ffffff' },
    })
  } catch (e) {
    console.warn('[share] 二维码生成失败', e)
  }
}, { immediate: false })

function legacyCopy(url: string): boolean {
  // 微信内置浏览器 / 旧 Safari 里 clipboard API 不可用或被挂住，退回 execCommand
  const ta = document.createElement('textarea')
  ta.value = url
  ta.style.cssText = 'position:fixed;top:-9999px;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  ta.setSelectionRange(0, url.length)   // iOS 上必须显式设选区
  let ok = false
  try { ok = document.execCommand('copy') } catch { /* 实在不行就让用户手动长按选中 */ }
  document.body.removeChild(ta)
  return ok
}

async function copyShareLink() {
  const url = shareUrl.value
  let ok = false
  try {
    // 权限未授予时 writeText 可能一直挂着不 resolve，加超时兜底，
    // 否则按钮永远不给反馈（用户以为没点上）
    await Promise.race([
      navigator.clipboard.writeText(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('clipboard timeout')), 600)),
    ])
    ok = true
  } catch {
    ok = legacyCopy(url)
  }
  // 两种都失败也给反馈：链接就在上面，用户可以手动长按复制
  shareCopied.value = true
  if (!ok) console.warn('[share] 自动复制失败，请手动长按链接复制')
  setTimeout(() => { shareCopied.value = false }, 2000)
}

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

/* ── 采购单 / 购物车入口（原来是纯黑圆角购物车图标） ─────────────────── */
.topnav-bag {
  display: flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 12px; border-radius: 999px;
  border: 1.5px solid rgba(0,0,0,0.08); background: #f5f5f7;
  color: rgba(29,29,31,0.6); text-decoration: none;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  white-space: nowrap;
}
.topnav-bag:hover { background: #ecebf3; color: #1d1d1f; }
.topnav-bag.filled { background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.28); color: #6d28d9; }
.topnav-bag.filled:hover { background: rgba(124,58,237,0.14); }
.topnav-bag-icon { position: relative; display: flex; align-items: center; }
.topnav-bag-badge {
  position: absolute; top: -7px; right: -8px;
  min-width: 16px; height: 16px;
  background: #7c3aed; color: #fff; border-radius: 999px;
  font-size: 9.5px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; border: 2px solid #fff;
}
/* 桌面上件数已经写在文字里了，角标就是重复 */
.topnav-bag.filled .topnav-bag-badge { display: none; }
.topnav-bag-text { display: flex; align-items: baseline; gap: 4px; }
.topnav-bag-amt { font-variant-numeric: tabular-nums; }

/* ── 采购单明细面板 ─────────────────────────────── */
/* align-items: flex-start —— 不然面板会被拉满整屏高，底部按钮撞上客服浮窗 */
.bag-overlay { position: fixed; inset: 0; z-index: 8900; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; justify-content: flex-end; align-items: flex-start; padding: 72px 20px 20px; }
.bag-panel {
  width: 100%; max-width: 400px; max-height: 100%;
  background: #fff; border-radius: 22px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 30px 70px rgba(0,0,0,0.22);
}
.bag-list { max-height: 46vh; }
.bag-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bag-head h3 { font-size: 16px; font-weight: 800; }
.bag-close { width: 32px; height: 32px; border-radius: 9px; background: #f5f5f7; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(29,29,31,0.5); }
.bag-close:hover { background: #e8e8ed; color: #1d1d1f; }
.bag-empty { padding: 36px 20px; text-align: center; font-size: 13px; color: rgba(29,29,31,0.35); }
.bag-list { flex: 1; overflow-y: auto; padding: 6px 0; margin: 0; list-style: none; }
.bag-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; }
.bag-item-img { width: 44px; height: 44px; border-radius: 10px; object-fit: contain; background: #f5f5f7; flex-shrink: 0; }
.bag-item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.bag-item-name { font-size: 13px; font-weight: 700; color: #1d1d1f; line-height: 1.3; }
.bag-item-unit { font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.38); }
.bag-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
.bag-step { display: flex; align-items: center; gap: 2px; padding: 2px; border-radius: 9px; background: #f5f5f7; }
.bag-step-btn { width: 22px; height: 22px; border: none; border-radius: 7px; background: #fff; color: rgba(29,29,31,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.bag-step-btn:hover { color: #7c3aed; }
.bag-step-qty { min-width: 28px; text-align: center; font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }
.bag-item-amt { font-size: 12.5px; font-weight: 800; color: #1d1d1f; font-variant-numeric: tabular-nums; }
.bag-gaps { padding: 10px 20px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 6px; }
.bag-gap { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; font-size: 11.5px; font-weight: 600; color: rgba(29,29,31,0.45); }
.bag-gap-text { color: #d97706; font-weight: 700; }
.bag-gap.reached .bag-gap-text { color: #16a34a; }
.bag-foot { padding: 14px 20px 18px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 12px; }
.bag-total { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 11.5px; font-weight: 600; color: rgba(29,29,31,0.45); }
.bag-total strong { font-size: 19px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; }
.bag-checkout { padding: 12px 22px; border-radius: 14px; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; transition: background 0.2s; }
.bag-checkout:hover { background: #6d28d9; }
.drawer-enter-active .bag-panel, .drawer-leave-active .bag-panel { transition: transform 0.3s cubic-bezier(0.23,1,0.32,1); }
.drawer-enter-from .bag-panel, .drawer-leave-to .bag-panel { transform: translateY(-12px) scale(0.97); }

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

/* ── 分享 ────────────────────────────────────────── */
.topnav-share-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 10px;
  font-size: 12px; font-weight: 700;
  border: 1.5px solid rgba(0,0,0,0.1);
  background: transparent; color: rgba(29,29,31,0.65);
  cursor: pointer; transition: all 0.2s;
}
.topnav-share-btn:hover { background: rgba(0,0,0,0.05); color: #1d1d1f; }

.share-overlay {
  position: fixed; inset: 0; z-index: 4000;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.share-panel {
  width: 100%; max-width: 340px;
  background: #fff; border-radius: 22px; padding: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  max-height: 90vh; overflow-y: auto;
}
.share-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.share-head h3 { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
.share-close {
  width: 28px; height: 28px; border-radius: 8px; border: none;
  background: #f5f5f7; color: rgba(29,29,31,0.5);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.share-close:hover { background: #ebebed; color: #1d1d1f; }

.share-tabs { display: flex; gap: 6px; background: #f5f5f7; padding: 4px; border-radius: 12px; margin-bottom: 16px; }
.share-tab {
  flex: 1; padding: 7px 4px; border-radius: 9px; border: none;
  background: transparent; color: rgba(29,29,31,0.55);
  font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.18s;
  white-space: nowrap;
}
.share-tab.active { background: #fff; color: #1d1d1f; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

.share-qr {
  display: flex; align-items: center; justify-content: center;
  padding: 14px; background: #fff; border: 1.5px solid rgba(0,0,0,0.07);
  border-radius: 16px; margin-bottom: 10px;
}
.share-qr img { width: 190px; height: 190px; display: block; }
.share-qr-empty {
  width: 190px; height: 190px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: rgba(29,29,31,0.35);
}
.share-qr-tip { text-align: center; font-size: 11px; color: rgba(29,29,31,0.4); margin-bottom: 16px; }

.share-link {
  padding: 11px 13px; background: #f5f5f7; border-radius: 11px;
  font-size: 11px; color: rgba(29,29,31,0.6); word-break: break-all;
  line-height: 1.5; margin-bottom: 10px; user-select: all;
}
.share-copy {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 12px; border-radius: 13px; border: none;
  background: #7c3aed; color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s;
}
.share-copy:hover { background: #6d28d9; }
.share-copy.done { background: #10b981; }
.share-note { text-align: center; font-size: 11px; color: rgba(29,29,31,0.35); margin-top: 10px; }

.mobile-drawer-cta-share {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  background: transparent; border: 1.5px solid rgba(0,0,0,0.12);
  color: rgba(29,29,31,0.7);
}
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
  .topnav-edit-btn {
    display: flex;
    width: 36px;
    height: 36px;
    padding: 0;
    justify-content: center;
    font-size: 0;
    border-radius: 10px;
  }
  /* 手机端顶栏挤，分享缩成纯图标（抽屉里另有一个带文字的入口） */
  .topnav-share-btn {
    display: flex; width: 36px; height: 36px; padding: 0;
    justify-content: center; font-size: 0; border-radius: 10px;
  }
  /* 手机顶栏窄，「N 件 ·」收进图标角标，只留金额 */
  .topnav-bag { height: 34px; padding: 0 10px; gap: 6px; font-size: 11.5px; }
  .topnav-bag-pieces { display: none; }
  .topnav-bag-empty { display: none; }
  .topnav-bag.filled .topnav-bag-badge { display: flex; }
  .bag-overlay { padding: 0; align-items: flex-end; }
  .bag-panel { max-width: 100%; border-radius: 22px 22px 0 0; max-height: 82vh; }
  .drawer-enter-from .bag-panel, .drawer-leave-to .bag-panel { transform: translateY(100%); }
  .edit-mode-bar { display: none; }
  .topnav-switch-btn { display: none; }
  .topnav-mode-badge { display: none; }
  .brand-topnav { padding: 0 16px; }
  .topnav-hamburger { display: flex; }
  /* 移动端：限制在 .wx-content 可用高度内，禁止撑破 */
  .brand-layout {
    min-height: 0 !important;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .brand-main {
    flex: 0 0 auto;
    overflow-x: hidden;
    /* 底部留出 TabBar 空间，内容滚动到底时不会被遮挡 */
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 16px);
  }
  .brand-footer {
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
