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
export const createContract = (data: any) => http.post('/shop/ContractOrder/add', data)
export const updateContract = (data: any) => http.post('/shop/ContractOrder/edit', data)
export const deleteContract = (id: number) => http.post('/shop/ContractOrder/del', { id })
export const auditContract = (id: number, status: number) => http.post('/shop/ContractOrder/audit', { id, status })

export const getSaleOutList = (params?: any) => http.get('/stock/SaleOutOrder/index', { params })
export const getSaleOutDetail = (id: number) => http.get('/stock/SaleOutOrder/detail', { params: { id } })
export const createSaleOut = (data: any) => http.post('/stock/SaleOutOrder/add', data)
export const updateSaleOut = (data: any) => http.post('/stock/SaleOutOrder/edit', data)
export const deleteSaleOut = (id: number) => http.post('/stock/SaleOutOrder/del', { id })
export const auditSaleOut = (id: number, status: number) => http.post('/stock/SaleOutOrder/audit', { id, status })

export const getSaleReturnList = (params?: any) => http.get('/stock/SaleReturnOrder/index', { params })
export const createSaleReturn = (data: any) => http.post('/stock/SaleReturnOrder/add', data)
export const deleteSaleReturn = (id: number) => http.post('/stock/SaleReturnOrder/del', { id })
export const auditSaleReturn = (id: number, status: number) => http.post('/stock/SaleReturnOrder/audit', { id, status })
