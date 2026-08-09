import type { ShopProduct } from '@/stores/shopStore'

// 批发拿货价体系：三套规则，按商品的品牌分类（__brand__.category）走各自的档位。
// 要调价只改这一处 —— 产品页价目表和顶栏采购单汇总都从这里取。
//   精选（乳制品/食品）—— 拿货价 = 零售价 × 系数，零售价一改自动跟着对
//   周边（文创）      —— 按整单零售价累计满额打折
//   休闲（快消）      —— 固定供货价，逐个商品填（__brand__.supplyPrices），不按零售价折算
export type Scheme = 'agent' | 'craft' | 'fmcg'

// min = 起批门槛的数值版，算「还差多少钱到下一档」用
export interface Tier {
  key: string
  name: string
  rate: number
  profit: string
  threshold: string
  min: number
  short: string
}

export const AGENT_TIERS: Tier[] = [
  { key: 'a1', name: '初级代理', rate: 0.70, profit: '利润率 30%', threshold: '¥3,900', min: 3900, short: '初级' },
  { key: 'a2', name: '二级代理', rate: 0.65, profit: '利润率 35%', threshold: '¥18,000', min: 18000, short: '二级' },
  { key: 'a3', name: '一级代理', rate: 0.60, profit: '利润率 40%', threshold: '¥38,000', min: 38000, short: '一级' },
]
export const CRAFT_TIERS: Tier[] = [
  { key: 'c1', name: '满 ¥3,000', rate: 0.60, profit: '6 折', threshold: '¥3,000', min: 3000, short: '满3000·6折' },
  { key: 'c2', name: '满 ¥10,000', rate: 0.50, profit: '5 折', threshold: '¥10,000', min: 10000, short: '满1万·5折' },
]
export const FMCG_TIERS: Tier[] = [
  { key: 't2', name: '二级供货价', rate: 0, profit: '线下专供', threshold: '¥899', min: 899, short: '二级供货' },
  { key: 't1', name: '一级供货价', rate: 0, profit: '线下专供', threshold: '¥3,800', min: 3800, short: '一级供货' },
]
export const TIER_SETS: Record<Scheme, Tier[]> = { agent: AGENT_TIERS, craft: CRAFT_TIERS, fmcg: FMCG_TIERS }

export const SCHEME_LABEL: Record<Scheme, string> = {
  agent: '乳制品 · 食品',
  craft: '文创周边',
  fmcg: '休闲快消',
}

export function schemeOf(product: Pick<ShopProduct, 'category' | 'erpCategory'>): Scheme {
  // 品牌分类优先，没填就用 ERP 商品分类兜底
  const cat = product.category || product.erpCategory || ''
  if (cat.includes('周边')) return 'craft'
  if (cat.includes('休闲')) return 'fmcg'
  return 'agent'
}

export function tierOf(product: ShopProduct, idx = 0): Tier {
  const list = TIER_SETS[schemeOf(product)]
  return list[Math.min(idx, list.length - 1)]
}

/** 返回 null 表示这个商品该档位还没定价（休闲快消品没填供货价） */
export function tierPrice(product: ShopProduct, idx = 0): number | null {
  const tier = tierOf(product, idx)
  if (schemeOf(product) === 'fmcg') {
    const v = product.supplyPrices?.[tier.key as 't1' | 't2']
    return v && v > 0 ? v : null
  }
  // 商品单独填了批发价 = 谈好的固定价，所有档位都用它
  if (product.wholesalePrice > 0) return product.wholesalePrice
  return Math.round(product.price * tier.rate * 100) / 100
}

export function fmt(n: number | null): string {
  return n === null ? '待定' : '¥' + (Math.round(n * 100) / 100)
}

/** 金额千分位，整数不带小数 —— 顶栏汇总用 */
export function fmtAmount(n: number): string {
  const v = Math.round(n * 100) / 100
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * 某一套规则下，当前小计还差多少到下一个门槛。
 * 已经到顶返回 null（模板据此显示「已达最高档」）。
 */
export function nextThreshold(scheme: Scheme, subtotal: number): { tier: Tier; gap: number } | null {
  const tier = TIER_SETS[scheme].find(t => subtotal < t.min)
  return tier ? { tier, gap: Math.round((tier.min - subtotal) * 100) / 100 } : null
}
