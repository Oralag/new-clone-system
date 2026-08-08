import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'https://nomaderp.pages.dev/adminapi'

export interface SkuVariant {
  label: string    // 如 "1盒" "2盒"
  price: number    // 该规格零售价
  erpId?: number
  image?: string   // 规格图片 URL（选填）
}

export interface ShopProduct {
  id: string
  erpId: number          // ERP 商品 id
  name: string
  description: string
  price: number          // 零售价 (sell_price)
  wholesalePrice: number // 批发价 (remark JSON)
  minOrderQuantity: number
  spec: string           // 规格，如 "16次泡" "250克"
  unit: string           // 单位，如 "盒" "袋"
  erpCategory: string    // ERP 商品分类（cate_name），brand.category 没填时兜底
  // 休闲快消品的固定供货价（不按零售价折算，逐个商品填）
  supplyPrices: { t2: number; t1: number } | null
  image: string
  headerImages: string[]
  detailImage: string
  detailImages: string[]
  skuImages: string[]    // SKU白底图
  skuVariants: SkuVariant[] // 规格列表（含各自价格）
  category: string       // 小程序分类（__brand__.category），与小程序同源
  memberOnly: boolean    // 会员专属商品
  tags: string[]         // 'new' | 'hot' | 'sale'
  rating: number
  reviewsCount: number
  sort: number
  delivery?: boolean     // 是否进门店外卖商品池
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
    // ERP 的 spec 有历史脏数据（存过 JSON 串），以 { 或 [ 开头的一律当空
    spec: /^\s*[{[]/.test(String(item.spec || '')) ? '' : String(item.spec || ''),
    unit: item.unit_name || '',
    erpCategory: item.cate_name || '',
    supplyPrices: (brand as any).supplyPrices || null,
    image: brand.image || (item.images ? item.images.split(',')[0] : '') || '',
    headerImages: brand.headerImages || [],
    detailImage: brand.detailImage || '',
    detailImages: brand.detailImages || [],
    skuImages: brand.skuImages || [],
    skuVariants: (() => {
      const variants: SkuVariant[] = (brand.skuVariants as SkuVariant[]) || []
      const groups: any[] = (brand as any).specGroups || []
      if (!groups.length) return variants
      return variants.map(v => {
        if (v.image) return v
        const parts = String(v.label || '').split(' / ')
        for (let gi = 0; gi < groups.length; gi++) {
          const val = (groups[gi]?.values || []).find((x: any) => x.label === parts[gi])
          if (val?.image) return { ...v, image: val.image }
        }
        return v
      })
    })(),
    // 分类跟小程序同源：用 __brand__.category（小程序分类），不是 ERP 后台的商品分类树 cate_name
    category: (brand as any).category || '',
    memberOnly: (brand as any).member_only === true || (brand as any).memberOnly === true,
    tags: brand.tags || [],
    rating: brand.rating || 5.0,
    reviewsCount: brand.reviewsCount || 0,
    sort: item.sort || 0,
    show: brand.show === true,
    // 门店外卖池：品牌已上架的默认可送，门店独有的单独开 delivery，deliveryOff 显式排除
    delivery: (brand as any).deliveryOff === true
      ? false
      : (brand.show === true || (brand as any).delivery === true),
  }
}

export const useShopStore = defineStore('shop', () => {
  const shopMode = ref<'retail' | 'wholesale' | null>(null)
  const cart = ref<ShopCartItem[]>([])
  const products = ref<ShopProduct[]>([])
  // 全量（含只在门店卖、未上架商城的），products 按 channel 从这里筛
  const allProducts = ref<ShopProduct[]>([])
  const channel = ref<'shop' | 'delivery'>('shop')
  const checkoutSuccess = ref(false)
  const loading = ref(false)

  const isWholesale = computed(() => shopMode.value === 'wholesale')
  const totalAmount = computed(() =>
    cart.value.reduce((sum, item) =>
      sum + (item.isWholesale ? item.wholesalePrice : item.price) * item.quantity, 0)
  )
  const cartCount = computed(() => cart.value.length)

  // 从 ERP 拉取商品列表
  // 按当前渠道从全量里筛出要展示的商品
  function applyChannel() {
    products.value = channel.value === 'delivery'
      ? allProducts.value.filter(p => p.delivery === true)
      : allProducts.value.filter(p => (p as any).show === true)
  }

  function setChannel(c: 'shop' | 'delivery') {
    channel.value = c
    applyChannel()
  }

  async function fetchProducts() {
    loading.value = true
    try {
      const token = localStorage.getItem('erp_token') || ''
      let json: any

      if (token) {
        // 已登录：走正常 adminapi 代理（支持编辑权限）
        const res = await fetch(`${API_BASE}/goods/ShopGoods/index?list_rows=1000&can_sale=1&status=1&page=1`, {
          headers: { token }
        })
        json = await res.json()
      } else {
        // 未登录：走公开接口，带上 shop 参数路由到对应租户
        const shopCode = new URLSearchParams(window.location.hash.split('?')[1] || '').get('shop')
          || localStorage.getItem('brand_shop_code') || ''
        const goodsUrl = shopCode ? `/api/brand-goods?shop=${encodeURIComponent(shopCode)}` : '/api/brand-goods'
        const res = await fetch(goodsUrl)
        json = await res.json()
      }

      if (json.code === 1 && json.data?.rows) {
        const rows: ShopProduct[] = json.data.rows
          .map(erpGoodsToShopProduct)
          .filter((p: ShopProduct) => p.name && ((p as any).show === true || p.delivery === true))
          .sort((a: ShopProduct, b: ShopProduct) => a.sort - b.sort)
        allProducts.value = rows
        applyChannel()
      }
    } catch (e) {
      console.error('fetchProducts error', e)
    } finally {
      loading.value = false
    }
  }

  // 保存单个商品的品牌中心字段到 ERP remark
  // 用 patchBrand（PG jsonb 原子 merge，只改传入的字段，绝不覆盖其他）
  async function saveBrandFields(erpId: number, brandData: Partial<ShopProduct>) {
    const token = localStorage.getItem('erp_token') || ''
    if (!token) return

    await fetch(`${API_BASE}/goods/ShopGoods/patchBrand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify({ id: erpId, brand_fields: brandData }),
    })

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
    shopMode, cart, products, allProducts, channel, checkoutSuccess, loading,
    isWholesale, totalAmount, cartCount,
    setShopMode, resetShopMode, setChannel, fetchProducts, saveBrandFields, saveSortOrder,
    addToCart, removeFromCart, updateQuantity, checkout, clearCart,
  }
})
