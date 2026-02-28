// 客户等级 + 等级商品价格，全部 localStorage 本地存储
// 因后端无对应接口，数据存本地持久化

export interface LevelItem { id: number; name: string; discount?: number }

const LEVEL_KEY = 'erp_customer_levels'
const LEVEL_MAP_KEY = 'erp_customer_level_map'   // { customerId: levelId }
const LEVEL_PRICE_KEY = 'erp_level_prices'        // { `${levelId}_${goodsId}`: price }

const DEFAULT_LEVELS: LevelItem[] = [
  { id: 1, name: '零售', discount: 100 },
  { id: 2, name: '批发商', discount: 90 },
  { id: 3, name: '代理商', discount: 80 },
  { id: 4, name: 'VIP', discount: 85 },
]

export function loadLevels(): LevelItem[] {
  try {
    const v = localStorage.getItem(LEVEL_KEY)
    return v ? JSON.parse(v) : DEFAULT_LEVELS
  } catch { return DEFAULT_LEVELS }
}

export function saveLevels(list: LevelItem[]) {
  localStorage.setItem(LEVEL_KEY, JSON.stringify(list))
}

export function loadLevelMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(LEVEL_MAP_KEY) || '{}') } catch { return {} }
}

export function saveLevelMap(map: Record<number, number>) {
  localStorage.setItem(LEVEL_MAP_KEY, JSON.stringify(map))
}

export function loadLevelPrices(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LEVEL_PRICE_KEY) || '{}') } catch { return {} }
}

export function saveLevelPrices(prices: Record<string, number>) {
  localStorage.setItem(LEVEL_PRICE_KEY, JSON.stringify(prices))
}

export function getLevelPrice(levelId: number, goodsId: number): number | null {
  const prices = loadLevelPrices()
  const v = prices[`${levelId}_${goodsId}`]
  return v !== undefined ? v : null
}

export function setLevelPrice(levelId: number, goodsId: number, price: number) {
  const prices = loadLevelPrices()
  prices[`${levelId}_${goodsId}`] = price
  saveLevelPrices(prices)
}

export function removeLevelPrice(levelId: number, goodsId: number) {
  const prices = loadLevelPrices()
  delete prices[`${levelId}_${goodsId}`]
  saveLevelPrices(prices)
}

/** 根据客户ID获取其等级对应某商品的价格，没有则返回 null */
export function getPriceByCustomer(customerId: number, goodsId: number): number | null {
  const levelMap = loadLevelMap()
  const levelId = levelMap[customerId]
  if (!levelId) return null
  return getLevelPrice(levelId, goodsId)
}

/** 根据客户ID获取其等级ID */
export function getCustomerLevelId(customerId: number): number | null {
  const levelMap = loadLevelMap()
  return levelMap[customerId] ?? null
}
