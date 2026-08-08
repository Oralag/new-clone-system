// 客户等级 + 等级商品价格
// 数据源：后端 customer_levels / customer_level_prices / sale_customers.level_name
// 前端启动时 initCustomerLevels() 一次性拉全部到内存 cache；getter 从 cache 读；
// setter 立即更新 cache，同时后台异步同步到后端。
// localStorage 只作为后端不可达时的应急 fallback。

import { readScopedJson, writeScopedJson } from './storageScope'
import http from '@/api/http'
import {
  getLevels as apiGetLevels,
  addLevel as apiAddLevel,
  editLevel as apiEditLevel,
  delLevel as apiDelLevel,
  getLevelPrices as apiGetLevelPrices,
  saveLevelPrice as apiSaveLevelPrice,
  delLevelPrice as apiDelLevelPrice,
} from '@/api/customerLevel'

export interface LevelItem { id: number; name: string; discount?: number }

const LEVEL_KEY = 'erp_customer_levels'
const LEVEL_MAP_KEY = 'erp_customer_level_map'
const LEVEL_PRICE_KEY = 'erp_level_prices'

// 内存 cache
let _levels: LevelItem[] = []
let _priceMap: Record<string, number> = {}         // `${levelId}_${goodsId}` -> price
let _customerLevelMap: Record<number, number> = {} // customerId -> levelId
let _ready = false

function levelIdByName(name: string): number | null {
  if (!name) return null
  const lv = _levels.find(l => l.name === name)
  return lv ? Number(lv.id) : null
}

/** app 启动时调用一次；从后端拉全部到内存 cache */
export async function initCustomerLevels(): Promise<void> {
  try {
    // 1. 等级列表
    const lvRes: any = await apiGetLevels()
    const rawLevels: any[] = lvRes?.data ?? []
    _levels = rawLevels.map(l => ({
      id: Number(l.id),
      name: String(l.name),
      discount: l.discount != null ? Number(l.discount) : 100,
    }))

    // 2. 每个等级下的商品价格（并行）
    const priceResults = await Promise.all(
      _levels.map(lv => apiGetLevelPrices(lv.id).catch(() => ({ data: [] } as any))),
    )
    _priceMap = {}
    priceResults.forEach((res: any, i) => {
      const lid = _levels[i].id
      for (const p of (res?.data ?? [])) {
        _priceMap[`${lid}_${p.goods_id}`] = Number(p.level_price)
      }
    })

    // 3. 客户 -> 等级 id 映射（通过 level_name 匹配）
    const custRes: any = await http.get('/shop/ShopCustomer/index', { params: { page: 1, list_rows: 2000 } })
    const custs: any[] = custRes?.data?.rows ?? []
    _customerLevelMap = {}
    for (const c of custs) {
      const lid = levelIdByName(c.level_name)
      if (lid) _customerLevelMap[Number(c.id)] = lid
    }

    _ready = true

    // 顺便更新 localStorage 作为 offline cache
    writeScopedJson(LEVEL_KEY, _levels)
    writeScopedJson(LEVEL_PRICE_KEY, _priceMap)
    writeScopedJson(LEVEL_MAP_KEY, _customerLevelMap)
  } catch (e) {
    console.warn('[customerLevel] 后端拉取失败，fallback 到 localStorage', e)
    _levels = readScopedJson<LevelItem[]>(LEVEL_KEY, [])
    _priceMap = readScopedJson<Record<string, number>>(LEVEL_PRICE_KEY, {})
    _customerLevelMap = readScopedJson<Record<number, number>>(LEVEL_MAP_KEY, {})
    _ready = false
  }
}

export function isCustomerLevelReady(): boolean { return _ready }

export function loadLevels(): LevelItem[] {
  if (_levels.length) return _levels.slice()
  return readScopedJson<LevelItem[]>(LEVEL_KEY, [])
}

/** 批量替换等级列表 —— 对比 cache 找出 add/edit/del，逐个同步到后端 */
export async function saveLevels(list: LevelItem[]): Promise<void> {
  const oldById = new Map(_levels.map(l => [l.id, l]))
  const newById = new Map(list.map(l => [l.id, l]))

  // 删除：old 有 new 无
  for (const [id] of oldById) {
    if (!newById.has(id)) {
      try { await apiDelLevel(id) } catch (e) { console.warn('[customerLevel] delLevel 失败', id, e) }
    }
  }
  // 新增 or 编辑
  for (const item of list) {
    const old = oldById.get(item.id)
    if (!old) {
      try {
        const r: any = await apiAddLevel({ name: item.name, discount: item.discount ?? 100 })
        // 后端会分配 id，若跟传入的不一致更新本地
        if (r?.data?.id && r.data.id !== item.id) item.id = Number(r.data.id)
      } catch (e) { console.warn('[customerLevel] addLevel 失败', item, e) }
    } else if (old.name !== item.name || old.discount !== item.discount) {
      try { await apiEditLevel({ id: item.id, name: item.name, discount: item.discount }) } catch (e) { console.warn('[customerLevel] editLevel 失败', item, e) }
    }
  }
  _levels = list.slice()
  writeScopedJson(LEVEL_KEY, _levels)
}

export function loadLevelMap(): Record<number, number> {
  if (Object.keys(_customerLevelMap).length) return { ..._customerLevelMap }
  return readScopedJson<Record<number, number>>(LEVEL_MAP_KEY, {})
}

/** 保存客户 -> 等级绑定 —— 对比 cache 找出变化的客户，逐个 POST 更新 level_name */
export async function saveLevelMap(map: Record<number, number>): Promise<void> {
  const levelNameById = new Map(_levels.map(l => [l.id, l.name]))
  for (const cidStr of Object.keys(map)) {
    const cid = Number(cidStr)
    const newLid = Number(map[cid])
    const oldLid = _customerLevelMap[cid]
    if (oldLid !== newLid) {
      const name = levelNameById.get(newLid) || ''
      if (name) {
        try { await http.post('/shop/ShopCustomer/edit', { id: cid, level_name: name }) }
        catch (e) { console.warn('[customerLevel] 更新客户等级失败', cid, name, e) }
      }
    }
  }
  _customerLevelMap = { ...map }
  writeScopedJson(LEVEL_MAP_KEY, _customerLevelMap)
}

export function loadLevelPrices(): Record<string, number> {
  if (Object.keys(_priceMap).length) return { ..._priceMap }
  return readScopedJson<Record<string, number>>(LEVEL_PRICE_KEY, {})
}

export function saveLevelPrices(prices: Record<string, number>): void {
  // 全量覆盖：找出增删改，逐个同步。大多数场景用 setLevelPrice/removeLevelPrice 单条改，
  // 这个批量入口保留是为了兼容旧调用点，尽量避免使用。
  const oldKeys = new Set(Object.keys(_priceMap))
  const newKeys = new Set(Object.keys(prices))
  // 删除
  for (const k of oldKeys) {
    if (!newKeys.has(k)) {
      const [lid, gid] = k.split('_').map(Number)
      apiDelLevelPrice(lid, gid).catch(e => console.warn('[customerLevel] delLevelPrice 失败', k, e))
    }
  }
  // 新增/更新
  for (const k of newKeys) {
    if (_priceMap[k] !== prices[k]) {
      const [lid, gid] = k.split('_').map(Number)
      apiSaveLevelPrice(lid, gid, prices[k]).catch(e => console.warn('[customerLevel] saveLevelPrice 失败', k, e))
    }
  }
  _priceMap = { ...prices }
  writeScopedJson(LEVEL_PRICE_KEY, _priceMap)
}

export function getLevelPrice(levelId: number, goodsId: number): number | null {
  if (!levelId || !goodsId) return null
  const key = `${levelId}_${goodsId}`
  if (_priceMap[key] !== undefined) return _priceMap[key]
  // cache 未就绪时的兜底：读 localStorage 上次同步快照
  if (!Object.keys(_priceMap).length) {
    const snapshot = readScopedJson<Record<string, number>>(LEVEL_PRICE_KEY, {})
    if (snapshot[key] !== undefined) return snapshot[key]
  }
  return null
}

export function setLevelPrice(levelId: number, goodsId: number, price: number): void {
  _priceMap[`${levelId}_${goodsId}`] = price
  writeScopedJson(LEVEL_PRICE_KEY, _priceMap)
  apiSaveLevelPrice(levelId, goodsId, price).catch(e => console.warn('[customerLevel] setLevelPrice 后端失败', e))
}

export function removeLevelPrice(levelId: number, goodsId: number): void {
  delete _priceMap[`${levelId}_${goodsId}`]
  writeScopedJson(LEVEL_PRICE_KEY, _priceMap)
  apiDelLevelPrice(levelId, goodsId).catch(e => console.warn('[customerLevel] removeLevelPrice 后端失败', e))
}

/** 根据客户ID获取其等级对应某商品的价格，没有则返回 null */
export function getPriceByCustomer(customerId: number, goodsId: number): number | null {
  const lid = _customerLevelMap[customerId]
  if (!lid) return null
  return getLevelPrice(lid, goodsId)
}

/** 根据客户ID获取其等级ID */
export function getCustomerLevelId(customerId: number): number | null {
  return _customerLevelMap[customerId] ?? null
}

/** 该等级 × 商品是否已有单独价 */
export function hasCustomLevelPrice(levelId: number, goodsId: number): boolean {
  return `${levelId}_${goodsId}` in _priceMap
}
