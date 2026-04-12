import http from '../http'

export const getStockList = (params?: any) => http.get('/stock/StockAll/index', { params })
export const getScrapList = (params?: any) => http.get('/stock/Scrap/index', { params })
export const createScrap = (data: any) => http.post('/stock/Scrap/add', data)
export const deleteScrap = (id: number) => http.post('/stock/Scrap/del', { id })

export const getTransferList = (params?: any) => http.get('/stock/Allocation/index', { params })
export const createTransfer = (data: any) => http.post('/stock/Allocation/add', data)
export const updateTransfer = (data: any) => http.post('/stock/Allocation/edit', data)
export const auditTransfer = (data: any) => http.post('/stock/Allocation/audit', data)
export const deleteTransfer = (id: number) => http.post('/stock/Allocation/del', { id })

export const getFlowList = (params?: any) => http.get('/stock/InOutFlow/index', { params })

export const getPickList = (params?: any) => http.get('/stock/Pick/index', { params })
export const createPick = (data: any) => http.post('/stock/Pick/add', data)
export const deletePick = (id: number) => http.post('/stock/Pick/del', { id })

export const getCheckList = (params?: any) => http.get('/stock/StockCheck/index', { params })
export const createCheck = (data: any) => http.post('/stock/StockCheck/add', data)
export const deleteCheck = (id: number) => http.post('/stock/StockCheck/del', { id })

export const getOtherInList = (params?: any) => http.get('/stock/OtherIn/index', { params })
export const createOtherIn = (data: any) => http.post('/stock/OtherIn/add', data)
export const updateOtherIn = (data: any) => http.post('/stock/OtherIn/edit', data)
export const deleteOtherIn = (id: number) => http.post('/stock/OtherIn/del', { id })

export const getOtherOutList = (params?: any) => http.get('/stock/OtherOut/index', { params })
export const createOtherOut = (data: any) => http.post('/stock/OtherOut/add', data)
export const updateOtherOut = (data: any) => http.post('/stock/OtherOut/edit', data)
export const deleteOtherOut = (id: number) => http.post('/stock/OtherOut/del', { id })

export const getWarningList = (params?: any) => http.get('/stock/StockWarning/index', { params })
export const getLocationList = (params?: any) => http.get('/stock/Location/index', { params })
export const createLocation = (data: any) => http.post('/stock/Location/add', data)
export const deleteLocation = (id: number) => http.post('/stock/Location/del', { id })

export const getWarehouseList = (params?: any) => http.get('/stock/WarehouseName/index', { params })
export const createWarehouse = (data: any) => http.post('/stock/WarehouseName/add', data)
export const updateWarehouse = (data: any) => http.post('/stock/WarehouseName/edit', data)
export const deleteWarehouse = (id: number) => http.post('/stock/WarehouseName/del', { id })

export const getBatchList = (params?: any) => http.get('/stock/Batch/index', { params })
export const getSerialList = (params?: any) => http.get('/stock/Serial/index', { params })
