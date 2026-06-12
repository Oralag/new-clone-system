import http from '../http'

export const getSaleCustomerList = (params?: any) => http.get('/shop/ShopCustomer/index', { params })
export const getSaleCustomerDetail = (id: number) => http.get('/shop/ShopCustomer/detail', { params: { id } })
export const createSaleCustomer = (data: any) => http.post('/shop/ShopCustomer/add', data)
export const updateSaleCustomer = (data: any) => http.post('/shop/ShopCustomer/edit', data)
export const deleteSaleCustomer = (id: number) => http.post('/shop/ShopCustomer/del', { id })

export const getCustomerSeaList = (params?: any) => http.get('/shop/ShopCustomer/seaIndex', { params })
export const claimFromSea = (data: any) => http.post('/shop/ShopCustomer/claim', data)

export const getOfferList = (params?: any) => http.get('/shop/offerOrder/index', { params })
export const getOfferDetail = (id: number) => http.get('/shop/offerOrder/detail', { params: { id } })
export const createOffer = (data: any) => http.post('/shop/offerOrder/add', data)
export const updateOffer = (data: any) => http.post('/shop/offerOrder/edit', data)
export const deleteOffer = (id: number) => http.post('/shop/offerOrder/del', { id })
export const auditOffer = (id: number, status: number) => http.post('/shop/offerOrder/audit', { id, status })

export const getContractList = (params?: any) => http.get('/shop/ContractOrder/index', { params })
export const getContractDetail = (id: number) => http.get('/shop/ContractOrder/detail', { params: { id } })
// 通用：遇到"列不存在"错误时，只删除该列并重试，保留所有其他字段（包括 discount/receive 等）
async function postWithColumnFallback(url: string, data: any): Promise<any> {
  const payload = { ...(data || {}) }
  const badCols = new Set<string>()
  for (let attempt = 0; attempt < 10; attempt++) {
    const body = Object.fromEntries(Object.entries(payload).filter(([k]) => !badCols.has(k)))
    try {
      return await http.post(url, body, { silent: true } as any)
    } catch (error: any) {
      const msg = String(error?.message || '')
      const m = msg.match(/column \"([^\"]+)\" of relation \"[^\"]+\" does not exist/i)
      if (!m) throw error
      badCols.add(m[1])
    }
  }
  throw new Error('保存失败：字段兼容重试次数超限')
}

export async function createContract(data: any) {
  return postWithColumnFallback('/shop/ContractOrder/add', data)
}
export async function updateContract(data: any) {
  return postWithColumnFallback('/shop/ContractOrder/edit', data)
}
export const deleteContract = (id: number) => http.post('/shop/ContractOrder/del', { id })
export async function auditContract(id: number, status: number) {
  try {
    return await http.post('/shop/ContractOrder/audit', { id, status })
  } catch (error: any) {
    // 兼容老后端：无 audit 路由时，降级为 edit + status 更新
    if (Number(error?.response?.status) === 404) {
      return http.post('/shop/ContractOrder/edit', { id, status })
    }
    throw error
  }
}
export async function auditContractSilent(id: number, status: number) {
  try {
    return await http.post('/shop/ContractOrder/audit', { id, status }, { silent: true } as any)
  } catch (error: any) {
    if (Number(error?.response?.status) === 404) {
      return http.post('/shop/ContractOrder/edit', { id, status }, { silent: true } as any)
    }
    throw error
  }
}

export const getSaleOutList = (params?: any) => http.get('/stock/SaleOutOrder/index', { params })
export const getSaleOutDetail = (id: number) => http.get('/stock/SaleOutOrder/detail', { params: { id } })
export const createSaleOut = (data: any) => http.post('/stock/SaleOutOrder/add', data)
export const updateSaleOut = (data: any) => http.post('/stock/SaleOutOrder/edit', data)
export const deleteSaleOut = (id: number) => http.post('/stock/SaleOutOrder/del', { id })
export const auditSaleOut = (id: number, status: number) => http.post('/stock/SaleOutOrder/audit', { id, status })
export const auditSaleOutSilent = (id: number, status: number) => http.post('/stock/SaleOutOrder/audit', { id, status }, { silent: true } as any)

export const getSaleReturnList = (params?: any) => http.get('/stock/SaleReturnOrder/index', { params })
export const createSaleReturn = (data: any) => http.post('/stock/SaleReturnOrder/add', data)
export const updateSaleReturn = (data: any) => http.post('/stock/SaleReturnOrder/edit', data)
export const deleteSaleReturn = (id: number) => http.post('/stock/SaleReturnOrder/del', { id })
export const auditSaleReturn = (id: number, status: number) => http.post('/stock/SaleReturnOrder/audit', { id, status })

export const getSampleList = (params?: any) => http.get('/shop/SampleOrder/index', { params })
export const createSample = (data: any) => http.post('/shop/SampleOrder/add', data)
export const updateSample = (data: any) => http.post('/shop/SampleOrder/edit', data)
export const deleteSample = (id: number) => http.post('/shop/SampleOrder/del', { id })
export const auditSample = (id: number, status: number) => http.post('/shop/SampleOrder/audit', { id, status })
