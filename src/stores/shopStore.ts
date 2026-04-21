import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'https://nomaderp.pages.dev/adminapi'

export interface ShopProduct {
  id: string
  erpId: number          // ERP 商品 id
  name: string
  description: string
  price: number          // 零售价 (sell_price)
  wholesalePrice: number // 批发价 (remark JSON)
  minOrderQuantity: number
  image: string
  headerImages: string[]
  detailImage: string
  detailImages: string[]
  category: string
  tags: string[]         // 'new' | 'hot' | 'sale'
  rating: number
  reviewsCount: number
  sort: number
}

export interface ShopCartItem extends ShopProduct {
  quantity: number
  isWholesale: boolean
}

// 从 ERP 商品的 remark 字段解析品牌中心展示数据
function parseRemark(remark: string): Partial<ShopProduct> {
  try {
    const data = JSON.parse(remark || '{}')
    if (data.__brand__) return data.__brand__
  } catch { /* ignore */ }
  return {}
}

// 将 ERP 商品数据转换为 ShopProduct
function erpGoodsToShopProduct(item: any): ShopProduct {
  const brand = parseRemark(item.remark || '')
  return {
    id: String(item.id),
    erpId: item.id,
    name: item.goods_name || item.name || '',
    description: brand.description || item.goods_memo || '',
    price: parseFloat(item.sell_price) || 0,
    wholesalePrice: brand.wholesalePrice || 0,
    minOrderQuantity: brand.minOrderQuantity || 1,
    image: brand.image || (item.images ? item.images.split(',')[0] : '') || '',
    headerImages: brand.headerImages || [],
    detailImage: brand.detailImage || '',
    detailImages: brand.detailImages || [],
    category: item.cate_name || '',
    tags: brand.tags || [],
    rating: brand.rating || 5.0,
    reviewsCount: brand.reviewsCount || 0,
    sort: item.sort || 0,
    show: brand.show === true,
  }
}

export const useShopStore = defineStore('shop', () => {
  const shopMode = ref<'retail' | 'wholesale' | null>(null)
  const cart = ref<ShopCartItem[]>([])
  const products = ref<ShopProduct[]>([])
  const checkoutSuccess = ref(false)
  const loading = ref(false)

  const isWholesale = computed(() => shopMode.value === 'wholesale')
  const totalAmount = computed(() =>
    cart.value.reduce((sum, item) =>
      sum + (item.isWholesale ? item.wholesalePrice : item.price) * item.quantity, 0)
  )
  const cartCount = computed(() => cart.value.length)

  // 从 ERP 拉取商品列表
  async function fetchProducts() {
    loading.value = true
    try {
      const token = localStorage.getItem('erp_token') || ''
      let json: any

      if (token) {
        // 已登录：走正常 adminapi 代理（支持编辑权限）
        const res = await fetch(`${API_BASE}/goods/ShopGoods/index?list_rows=200&can_sale=1&status=1&goods_type=1&page=1`, {
          headers: { token }
        })
        json = await res.json()
      } else {
        // 未登录：走公开接口
        const res = await fetch('/api/brand-goods')
        json = await res.json()
      }

      if (json.code === 1 && json.data?.rows) {
        const rows: ShopProduct[] = json.data.rows
          .map(erpGoodsToShopProduct)
          .filter((p: ShopProduct) => p.name && (p as any).show === true)
          .sort((a: ShopProduct, b: ShopProduct) => a.sort - b.sort)
        products.value = rows
      }
    } catch (e) {
      console.error('fetchProducts error', e)
    } finally {
      loading.value = false
    }
  }

  // 保存单个商品的品牌中心字段到 ERP remark
  async function saveBrandFields(erpId: number, brandData: Partial<ShopProduct>) {
    const token = localStorage.getItem('erp_token') || ''
    if (!token) return

    // 先拿当前 remark
    const res = await fetch(`${API_BASE}/goods/ShopGoods/index?id=${erpId}`, {
      headers: { token }
    })
    const json = await res.json()
    const current = json.data?.rows?.[0]
    let existingRemark: any = {}
    try { existingRemark = JSON.parse(current?.remark || '{}') } catch { /* ignore */ }

    existingRemark.__brand__ = { ...existingRemark.__brand__, ...brandData }

    await fetch(`${API_BASE}/goods/ShopGoods/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify({ id: erpId, remark: JSON.stringify(existingRemark) }),
    })

    // 本地同步
    const idx = products.value.findIndex(p => p.erpId === erpId)
    if (idx >= 0) {
      products.value[idx] = { ...products.value[idx], ...brandData }
    }
  }

  // 保存商品排序到 ERP
  async function saveSortOrder(items: { erpId: number; sort: number }[]) {
    const token = localStorage.getItem('erp_token') || ''
    if (!token) return
    await Promise.all(items.map(({ erpId, sort }) =>
      fetch(`${API_BASE}/goods/ShopGoods/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ id: erpId, sort }),
      })
    ))
  }

  function setShopMode(mode: 'retail' | 'wholesale' | null) {
    if (shopMode.value !== null && mode !== null && shopMode.value !== mode) {
      // 模式切换时清空购物车，避免价格混乱
      cart.value = []
    }
    shopMode.value = mode
    if (mode) localStorage.setItem('brand_shop_mode', mode)
    else localStorage.removeItem('brand_shop_mode')
  }

  function resetShopMode() {
    shopMode.value = null
    localStorage.removeItem('brand_shop_mode')
  }

  function addToCart(product: ShopProduct) {
    const ws = isWholesale.value
    const existing = cart.value.find(item => item.id === product.id && item.isWholesale === ws)
    if (existing) {
      existing.quantity += ws ? product.minOrderQuantity : 1
    } else {
      cart.value.push({ ...product, quantity: ws ? product.minOrderQuantity : 1, isWholesale: ws })
    }
  }

  function removeFromCart(id: string, isWholesaleFlag: boolean) {
    cart.value = cart.value.filter(item => !(item.id === id && item.isWholesale === isWholesaleFlag))
  }

  function updateQuantity(id: string, isWholesaleFlag: boolean, delta: number) {
    const item = cart.value.find(i => i.id === id && i.isWholesale === isWholesaleFlag)
    if (!item) return
    const min = isWholesaleFlag ? item.minOrderQuantity : 1
    item.quantity = Math.max(min, item.quantity + delta)
  }

  function checkout() {
    if (cart.value.length === 0) return
    cart.value = []
    checkoutSuccess.value = true
    setTimeout(() => { checkoutSuccess.value = false }, 3000)
  }

  function clearCart() {
    cart.value = []
  }

  return {
    shopMode, cart, products, checkoutSuccess, loading,
    isWholesale, totalAmount, cartCount,
    setShopMode, resetShopMode, fetchProducts, saveBrandFields, saveSortOrder,
    addToCart, removeFromCart, updateQuantity, checkout, clearCart,
  }
})
