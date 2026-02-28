import http from '../http'

export const getSupplierList = (params?: any) => http.get('/procure/ProcureSupplier/index', { params })
export const createSupplier = (data: any) => http.post('/procure/ProcureSupplier/add', data)
export const updateSupplier = (data: any) => http.post('/procure/ProcureSupplier/edit', data)
export const deleteSupplier = (id: number) => http.post('/procure/ProcureSupplier/del', { id })

export const getProcurePlanList = (params?: any) => http.get('/procure/ProcurePlan/index', { params })
export const createProcurePlan = (data: any) => http.post('/procure/ProcurePlan/add', data)
export const deleteProcurePlan = (id: number) => http.post('/procure/ProcurePlan/del', { id })

export const getProcureOrderList = (params?: any) => http.get('/procure/ProcureOrder/index', { params })
export const createProcureOrder = (data: any) => http.post('/procure/ProcureOrder/add', data)
export const updateProcureOrder = (data: any) => http.post('/procure/ProcureOrder/edit', data)
export const deleteProcureOrder = (id: number) => http.post('/procure/ProcureOrder/del', { id })
export const auditProcureOrder = (id: number, status: number) => http.post('/procure/ProcureOrder/audit', { id, status })

export const getProcureInhouseList = (params?: any) => http.get('/procure/ProcureInhouse/index', { params })
export const createProcureInhouse = (data: any) => http.post('/procure/ProcureInhouse/add', data)
export const deleteProcureInhouse = (id: number) => http.post('/procure/ProcureInhouse/del', { id })

export const getProcureReturnList = (params?: any) => http.get('/procure/ProcureReturn/index', { params })
export const createProcureReturn = (data: any) => http.post('/procure/ProcureReturn/add', data)
export const deleteProcureReturn = (id: number) => http.post('/procure/ProcureReturn/del', { id })
