import http from '../http'

export const getGoodsList = (params?: any) => http.get('/goods/ShopGoods/index', { params })
export const readGoods = (id: number) => http.get('/goods/ShopGoods/read', { params: { id } })
export const createGoods = (data: any) => http.post('/goods/ShopGoods/add', data)
export const updateGoods = (data: any) => http.post('/goods/ShopGoods/edit', data)
export const deleteGoods = (id: number) => http.post('/goods/ShopGoods/del', { id })

export const getGoodsCateList = (params?: any) => http.get('/goods/ShopGoodsCate/index', { params })
export const createGoodsCate = (data: any) => http.post('/goods/ShopGoodsCate/add', data)
export const updateGoodsCate = (data: any) => http.post('/goods/ShopGoodsCate/edit', data)
export const deleteGoodsCate = (id: number) => http.post('/goods/ShopGoodsCate/del', { id })

export const getUnitList = (params?: any) => http.get('/goods/ShopUnit/index', { params })
export const createUnit = (data: any) => http.post('/goods/ShopUnit/add', data)
export const updateUnit = (data: any) => http.post('/goods/ShopUnit/edit', data)
export const deleteUnit = (id: number) => http.post('/goods/ShopUnit/del', { id })

export const getBrandList = (params?: any) => http.get('/goods/ShopBrand/index', { params })
export const createBrand = (data: any) => http.post('/goods/ShopBrand/add', data)
export const updateBrand = (data: any) => http.post('/goods/ShopBrand/edit', data)
export const deleteBrand = (id: number) => http.post('/goods/ShopBrand/del', { id })

export const getSpecList = (params?: any) => http.get('/goods/ShopSpec/index', { params })
export const createSpec = (data: any) => http.post('/goods/ShopSpec/add', data)
export const updateSpec = (data: any) => http.post('/goods/ShopSpec/edit', data)
export const deleteSpec = (id: number) => http.post('/goods/ShopSpec/del', { id })

export const getBomList = (params?: any) => http.get('/goods/BomGoods/index', { params })
export const getBomByGoods = (id: number) => http.get('/goods/BomGoods/detail', { params: { id } })
export const createBom = (data: any) => http.post('/goods/BomGoods/add', data)
export const updateBom = (data: any) => http.post('/goods/BomGoods/edit', data)
export const deleteBom = (id: number) => http.post('/goods/BomGoods/del', { id })

export const getGoodsPriceList = (params?: any) => http.get('/goods/ShopGoodsPrice/index', { params })
export const updateGoodsPrice = (data: any) => http.post('/goods/ShopGoodsPrice/edit', data)

export const getUnitConvert = (goods_id: number) => http.get('/goods/GoodsUnitConvert/index', { params: { goods_id } })
export const saveUnitConvert = (data: { goods_id: number; units: { unit_name: string; ratio: number }[] }) => http.post('/goods/GoodsUnitConvert/save', data)
