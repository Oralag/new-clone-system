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

// 阿斯娜历史拿货价；商品 ID 来自线上 ERP 商品档案；价格根据历史合同自动整理。
// 含税价格（price 字段）；带 1% 税的合同已换算回含税整数。
const DEFAULT_LEVEL_PRICES: Record<string, number> = {
  // ── 奶茶类 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_980`]: 20,      // 新/青砖奶茶
  [`${ASINA_WHOLESALE_LEVEL_ID}_996`]: 20,      // 青砖奶茶成品
  [`${ASINA_WHOLESALE_LEVEL_ID}_976`]: 17,      // 暂用/茶 新旧更替
  [`${ASINA_WHOLESALE_LEVEL_ID}_867`]: 14,      // 5g/青砖袋泡茶
  [`${ASINA_WHOLESALE_LEVEL_ID}_868`]: 12,      // 16g青砖袋泡茶
  [`${ASINA_WHOLESALE_LEVEL_ID}_869`]: 10,      // 青砖碎茶

  [`${ASINA_WHOLESALE_LEVEL_ID}_871`]: 9.5,     // 小青砖茶砖
  // ── 奶条类 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_1007`]: 29,      // 原味奶条成品
  [`${ASINA_WHOLESALE_LEVEL_ID}_1008`]: 13,     // 甜味奶条成品
  [`${ASINA_WHOLESALE_LEVEL_ID}_876`]: 6.4,     // 憨野/奶条
  [`${ASINA_WHOLESALE_LEVEL_ID}_916`]: 12.5,    // 脆奶条/散装/科尔沁
  [`${ASINA_WHOLESALE_LEVEL_ID}_933`]: 10.4,    // 透明成品/奶条/原味/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_936`]: 9.6,     // 透明成品/奶条/甜味/线下

  // ── 奶皮/奶酪类 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_935`]: 16.5,     // 透明成品/奶皮卷/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_937`]: 16.6,     // 透明成品/鲜奶皮/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_938`]: 16.5,    // 透明成品/鲜奶酪/甜味/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_941`]: 16.5,    // 透明成品/鲜奶酪/原味/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_934`]: 15.5,    // 透明成品/奶皮千层/线下

  [`${ASINA_WHOLESALE_LEVEL_ID}_968`]: 15,      // 大/奶皮
  [`${ASINA_WHOLESALE_LEVEL_ID}_981`]: 23,       // 烤奶皮
  // ── 奶豆腐类 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_988`]: 22,      // 原味传统奶豆腐/成品袋装
  [`${ASINA_WHOLESALE_LEVEL_ID}_985`]: 22,      // 甜味传统奶豆腐/袋装成品

  [`${ASINA_WHOLESALE_LEVEL_ID}_927`]: 24.75,   // 小奶豆腐砖/1斤
  [`${ASINA_WHOLESALE_LEVEL_ID}_926`]: 29.7,    // 大奶豆腐砖/1.2斤
  // ── 炒米类 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_875`]: 9.8,     // 憨野/冻炒米
  [`${ASINA_WHOLESALE_LEVEL_ID}_885`]: 17,       // 冻炒米/散装
  [`${ASINA_WHOLESALE_LEVEL_ID}_924`]: 9.9,     // 冻炒米/袋装
  [`${ASINA_WHOLESALE_LEVEL_ID}_994`]: 8,       // 冻炒米成品盒
  [`${ASINA_WHOLESALE_LEVEL_ID}_964`]: 9.8,     // 透明成品/冻炒米/线下
  [`${ASINA_WHOLESALE_LEVEL_ID}_921`]: 25,      // 嚼口脆炒米糖/散装
  [`${ASINA_WHOLESALE_LEVEL_ID}_901`]: 7.5,     // 手工白花炒米/散装
  // ── 奶果子类 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_991`]: 28,      // 奶果子/散装
  [`${ASINA_WHOLESALE_LEVEL_ID}_992`]: 20,      // 奶果子/盒装/成品
  [`${ASINA_WHOLESALE_LEVEL_ID}_835`]: 50,      // 奶果子/小包装/成品
  // ── 锅巴/黄油/其他奶品 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_877`]: 8.5,     // 憨野/奶锅巴/
  [`${ASINA_WHOLESALE_LEVEL_ID}_989`]: 11.5,    // 蒙古黄油/瓶装成品
  [`${ASINA_WHOLESALE_LEVEL_ID}_915`]: 9.9,     // 黄油渣/盒
  [`${ASINA_WHOLESALE_LEVEL_ID}_899`]: 35,      // 纯净/黄油/斤
  [`${ASINA_WHOLESALE_LEVEL_ID}_919`]: 30,      // 黄油/斤

  [`${ASINA_WHOLESALE_LEVEL_ID}_917`]: 10.9,    // 机器乌日末液体
  [`${ASINA_WHOLESALE_LEVEL_ID}_920`]: 15,      // 手工乌日末液体
  [`${ASINA_WHOLESALE_LEVEL_ID}_880`]: 15,      // 阿润月饼/五仁馅
  [`${ASINA_WHOLESALE_LEVEL_ID}_882`]: 15,      // 阿润月饼/黄油渣馅
  [`${ASINA_WHOLESALE_LEVEL_ID}_3092`]: 40,     // 干噎酸奶
  // ── 包装耗材 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_836`]: 5.2,     // 礼盒/2026
  [`${ASINA_WHOLESALE_LEVEL_ID}_864`]: 1,       // 礼盒/腰封
  [`${ASINA_WHOLESALE_LEVEL_ID}_1018`]: 8,      // 礼盒/蓝界

  [`${ASINA_WHOLESALE_LEVEL_ID}_1010`]: 0.4225, // 奶油球
  [`${ASINA_WHOLESALE_LEVEL_ID}_958`]: 1.8,     // 小/长方/亚克力/乳清奶条盒
  [`${ASINA_WHOLESALE_LEVEL_ID}_957`]: 2.8,     // 大/长方/亚克力/待用
  [`${ASINA_WHOLESALE_LEVEL_ID}_959`]: 3,       // 大/牛薄脆盒/亚克力
  [`${ASINA_WHOLESALE_LEVEL_ID}_963`]: 2,       // 小/方形/亚克力盒
  [`${ASINA_WHOLESALE_LEVEL_ID}_1031`]: 0.37,   // 专底盒/奶条
  [`${ASINA_WHOLESALE_LEVEL_ID}_1033`]: 0.71,   // 专袋/奶条
  [`${ASINA_WHOLESALE_LEVEL_ID}_1032`]: 0.87,   // 专盒/冻炒米
  [`${ASINA_WHOLESALE_LEVEL_ID}_1030`]: 0.325,  // 专外盒/奶果子
  [`${ASINA_WHOLESALE_LEVEL_ID}_1029`]: 0.8,    // 专内盒/奶果子
  [`${ASINA_WHOLESALE_LEVEL_ID}_990`]: 0.1,     // 奶果子/专用塑膜袋
  [`${ASINA_WHOLESALE_LEVEL_ID}_993`]: 0.1,     // 冻炒米专用/塑膜袋
  [`${ASINA_WHOLESALE_LEVEL_ID}_1024`]: 0.05,   // 标签/不干胶/奶条/甜味
  [`${ASINA_WHOLESALE_LEVEL_ID}_1020`]: 0.03,   // 标签/不干胶/奶果子
  [`${ASINA_WHOLESALE_LEVEL_ID}_900`]: 1,       // 透专标签/脆香奶条/微甜
  [`${ASINA_WHOLESALE_LEVEL_ID}_953`]: 1,       // 透专标签/奶酪/甜味
  [`${ASINA_WHOLESALE_LEVEL_ID}_954`]: 1,       // 透专标签/乳清奶条/甜味
  // ── 其他 ──
  [`${ASINA_WHOLESALE_LEVEL_ID}_874`]: 57,      // 黄金纬度/牛肉干/成品袋
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

/** 只检查 localStorage 自定义价格（不含 DEFAULT_LEVEL_PRICES） */
export function hasCustomLevelPrice(levelId: number, goodsId: number): boolean {
  const custom = readScopedJson<Record<string, number>>(LEVEL_PRICE_KEY, {})
  return (`${levelId}_${goodsId}`) in custom
}
