// 客户等级 + 等级商品价格，全部 localStorage 本地存储
// 因后端无对应接口，数据存本地持久化

import { readScopedJson, writeScopedJson } from './storageScope'

export interface LevelItem { id: number; name: string; discount?: number }

const LEVEL_KEY = 'erp_customer_levels'
const LEVEL_MAP_KEY = 'erp_customer_level_map'   // { customerId: levelId }
const LEVEL_PRICE_KEY = 'erp_level_prices'        // { `${levelId}_${goodsId}`: price }
const ASINA_CUSTOMER_ID = 21
const ASINA_WHOLESALE_LEVEL_ID = 21001

const DEFAULT_LEVELS: LevelItem[] = [
  { id: 1, name: '零售', discount: 100 },
  { id: 2, name: '批发商', discount: 90 },
  { id: 3, name: '代理商', discount: 80 },
  { id: 4, name: 'VIP', discount: 85 },
  { id: ASINA_WHOLESALE_LEVEL_ID, name: '阿斯娜批发价', discount: 100 },
]

const DEFAULT_LEVEL_MAP: Record<number, number> = {
  [ASINA_CUSTOMER_ID]: ASINA_WHOLESALE_LEVEL_ID,
}

// 阿斯娜历史拿货价；商品 ID 来自线上 ERP 商品档案。
const DEFAULT_LEVEL_PRICES: Record<string, number> = {
  [`${ASINA_WHOLESALE_LEVEL_ID}_877`]: 8.5,   // 憨野/奶锅巴/
  [`${ASINA_WHOLESALE_LEVEL_ID}_875`]: 9.8,   // 憨野/冻炒米
  [`${ASINA_WHOLESALE_LEVEL_ID}_994`]: 8,     // 冻炒米成品盒
  [`${ASINA_WHOLESALE_LEVEL_ID}_988`]: 18.5,  // 原味传统奶豆腐/成品袋装
  [`${ASINA_WHOLESALE_LEVEL_ID}_927`]: 24.75, // 小奶豆腐砖/1斤
  [`${ASINA_WHOLESALE_LEVEL_ID}_989`]: 11.5,  // 蒙古黄油/瓶装成品
  [`${ASINA_WHOLESALE_LEVEL_ID}_980`]: 20,    // 新/青砖奶茶
  [`${ASINA_WHOLESALE_LEVEL_ID}_935`]: 16.5,  // 透明成品/奶皮卷/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_937`]: 16.6,  // 透明成品/鲜奶皮/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_938`]: 16.5,  // 透明成品/鲜奶酪/甜味/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_941`]: 16.5,  // 透明成品/鲜奶酪/原味/线下
}

function mergeDefaultLevels(levels: LevelItem[]) {
  const byId = new Map(levels.map(item => [item.id, item]))
  for (const item of DEFAULT_LEVELS) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

export function loadLevels(): LevelItem[] {
  return mergeDefaultLevels(readScopedJson<LevelItem[]>(LEVEL_KEY, DEFAULT_LEVELS))
}

export function saveLevels(list: LevelItem[]) {
  writeScopedJson(LEVEL_KEY, list)
}

export function loadLevelMap(): Record<number, number> {
  return {
    ...DEFAULT_LEVEL_MAP,
    ...readScopedJson<Record<number, number>>(LEVEL_MAP_KEY, {}),
  }
}

export function saveLevelMap(map: Record<number, number>) {
  writeScopedJson(LEVEL_MAP_KEY, map)
}

export function loadLevelPrices(): Record<string, number> {
  return {
    ...DEFAULT_LEVEL_PRICES,
    ...readScopedJson<Record<string, number>>(LEVEL_PRICE_KEY, {}),
  }
}

export function saveLevelPrices(prices: Record<string, number>) {
  writeScopedJson(LEVEL_PRICE_KEY, prices)
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
