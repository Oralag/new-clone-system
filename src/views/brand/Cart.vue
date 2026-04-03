<template>
  <div class="brand-cart">
    <div class="bc-header">
      <h2 class="bc-title">您的购物车</h2>
      <button class="bc-continue" @click="$router.push('/brand/products')">
        继续购物
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <div v-if="shopStore.cart.length === 0" class="bc-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(29,29,31,0.15)" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
      <p class="bc-empty-title">购物车空空如也</p>
      <button class="bc-shop-btn" @click="$router.push('/brand/products')">去选购产品</button>
    </div>

    <div v-else class="bc-list">
      <div v-for="item in shopStore.cart" :key="`${item.id}-${item.isWholesale}`" class="bc-item">
        <div class="bc-item-img-wrap">
          <img :src="item.image" :alt="item.name" class="bc-item-img" referrerpolicy="no-referrer" />
        </div>
        <div class="bc-item-body">
          <div class="bc-item-row">
            <h3 class="bc-item-name">{{ item.name }}</h3>
            <span class="bc-item-total">¥{{ (item.isWholesale ? item.wholesalePrice : item.price) * item.quantity }}</span>
          </div>
          <div class="bc-item-meta">
            <span :class="['bc-item-badge', item.isWholesale ? 'badge-blue' : 'badge-gray']">
              {{ item.isWholesale ? '批发订单' : '零售订单' }}
            </span>
            <span class="bc-item-unit">单价: ¥{{ item.isWholesale ? item.wholesalePrice : item.price }}</span>
          </div>
          <div class="bc-item-controls">
            <div class="bc-qty-group">
              <button class="bc-qty-btn" @click="shopStore.updateQuantity(item.id, item.isWholesale, item.isWholesale ? -item.minOrderQuantity : -1)">−</button>
              <span class="bc-qty-num">{{ item.quantity }}</span>
              <button class="bc-qty-btn" @click="shopStore.updateQuantity(item.id, item.isWholesale, item.isWholesale ? item.minOrderQuantity : 1)">+</button>
            </div>
            <button class="bc-remove-btn" @click="shopStore.removeFromCart(item.id, item.isWholesale)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 结算栏 -->
      <div class="bc-checkout">
        <div>
          <p class="bc-total-label">Order Total</p>
          <p class="bc-total-num">¥{{ shopStore.totalAmount }}</p>
        </div>
        <button class="bc-pay-btn" @click="$router.push('/brand/checkout')">立即结算</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useShopStore } from '@/stores/shopStore'
const shopStore = useShopStore()
</script>

<style scoped>
.brand-cart { max-width: 800px; margin: 0 auto; padding: 40px 48px 80px; }
.bc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.bc-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; }
.bc-continue {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: #0071e3;
  background: none; border: none; cursor: pointer; transition: gap 0.2s;
}
.bc-continue:hover { gap: 10px; }

.bc-empty { text-align: center; padding: 80px 24px; background: #f5f5f7; border-radius: 36px; border: 2px dashed rgba(0,0,0,0.08); }
.bc-empty svg { margin: 0 auto 24px; display: block; }
.bc-empty-title { font-size: 22px; font-weight: 700; color: rgba(29,29,31,0.4); margin-bottom: 24px; }
.bc-shop-btn { padding: 12px 28px; background: #0071e3; color: #fff; border-radius: 999px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; }

.bc-list { display: flex; flex-direction: column; gap: 16px; }
.bc-item {
  padding: 24px; background: #fff; border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.05);
  display: flex; gap: 24px; align-items: center;
  transition: box-shadow 0.3s;
}
.bc-item:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
.bc-item-img-wrap { width: 110px; height: 110px; border-radius: 18px; overflow: hidden; background: #f5f5f7; flex-shrink: 0; }
.bc-item-img { width: 100%; height: 100%; object-fit: cover; }
.bc-item-body { flex: 1; }
.bc-item-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.bc-item-name { font-size: 16px; font-weight: 700; }
.bc-item-total { font-size: 18px; font-weight: 800; }
.bc-item-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.bc-item-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 6px; }
.badge-blue { background: rgba(0,113,227,0.1); color: #0071e3; }
.badge-gray { background: #f5f5f7; color: rgba(29,29,31,0.45); }
.bc-item-unit { font-size: 12px; color: rgba(29,29,31,0.4); }
.bc-item-controls { display: flex; justify-content: space-between; align-items: center; }
.bc-qty-group { display: flex; align-items: center; gap: 16px; background: #f5f5f7; border-radius: 14px; padding: 4px 6px; }
.bc-qty-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; font-size: 18px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.bc-qty-btn:hover { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.bc-qty-num { font-size: 16px; font-weight: 800; min-width: 32px; text-align: center; }
.bc-remove-btn { padding: 10px; color: #ff3b30; background: transparent; border: none; border-radius: 14px; cursor: pointer; transition: background 0.2s; }
.bc-remove-btn:hover { background: rgba(255,59,48,0.06); }

.bc-checkout {
  display: flex; justify-content: space-between; align-items: center;
  background: #1d1d1f; color: #fff;
  padding: 40px 48px; border-radius: 36px; margin-top: 16px;
  flex-wrap: wrap; gap: 24px;
}
.bc-total-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
.bc-total-num { font-size: 48px; font-weight: 800; letter-spacing: -0.04em; }
.bc-pay-btn {
  padding: 18px 48px; background: #0071e3; color: #fff;
  border-radius: 999px; font-size: 18px; font-weight: 700;
  border: none; cursor: pointer; transition: transform 0.2s;
  box-shadow: 0 20px 40px rgba(0,113,227,0.3);
}
.bc-pay-btn:hover { transform: scale(1.02); }

@media (max-width: 768px) {
  .brand-cart { padding: 20px; }
  .bc-checkout { padding: 28px; flex-direction: column; align-items: stretch; }
  .bc-pay-btn { width: 100%; text-align: center; }
}
</style>
