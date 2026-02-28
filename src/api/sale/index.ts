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

export const getContractList = (params?: any) => http.get('/shop/ContractOrder/index', { params })
export const getContractDetail = (id: number) => http.get('/shop/ContractOrder/detail', { params: { id } })
export const createContract = (data: any) => http.post('/shop/ContractOrder/add', data)
export const updateContract = (data: any) => http.post('/shop/ContractOrder/edit', data)
export const deleteContract = (id: number) => http.post('/shop/ContractOrder/del', { id })

export const getSaleOutList = (params?: any) => http.get('/stock/SaleOutOrder/index', { params })
export const getSaleOutDetail = (id: number) => http.get('/stock/SaleOutOrder/detail', { params: { id } })
export const createSaleOut = (data: any) => http.post('/stock/SaleOutOrder/add', data)
export const deleteSaleOut = (id: number) => http.post('/stock/SaleOutOrder/del', { id })

export const getSaleReturnList = (params?: any) => http.get('/stock/SaleReturnOrder/index', { params })
export const createSaleReturn = (data: any) => http.post('/stock/SaleReturnOrder/add', data)
export const deleteSaleReturn = (id: number) => http.post('/stock/SaleReturnOrder/del', { id })
