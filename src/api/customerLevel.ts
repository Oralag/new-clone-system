import http from './http'

export interface LevelItem {
  id: number
  name: string
  discount: number
  commission_rate: number
  sort: number
}

export interface LevelPriceRow {
  id: number
  level_id: number
  goods_id: number
  level_price: number
  goods_name?: string
  goods_sn?: string
  unit_name?: string
  sell_price?: number
}

export const getLevels = () => http.get('/adminapi/customer-level/list')
export const addLevel = (data: { name: string; discount?: number; commission_rate?: number; sort?: number }) =>
  http.post('/adminapi/customer-level/add', data)
export const editLevel = (data: { id: number; name?: string; discount?: number; commission_rate?: number; sort?: number }) =>
  http.post('/adminapi/customer-level/edit', data)
export const delLevel = (id: number) => http.post('/adminapi/customer-level/del', { id })

export const getLevelPrices = (level_id: number) =>
  http.get('/adminapi/customer-level/prices', { params: { level_id } })
export const saveLevelPrice = (level_id: number, goods_id: number, level_price: number) =>
  http.post('/adminapi/customer-level/prices/save', { level_id, goods_id, level_price })
export const delLevelPrice = (level_id: number, goods_id: number) =>
  http.post('/adminapi/customer-level/prices/del', { level_id, goods_id })
