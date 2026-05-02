import http from '../http'

export const getSupplierList = (params?: any) => http.get('/procure/supplier/index', { params })
export const createSupplier = (data: any) => http.post('/procure/supplier/add', data)
export const updateSupplier = (data: any) => http.post('/procure/supplier/edit', data)
export const deleteSupplier = (id: number) => http.post('/procure/supplier/del', { id: String(id) })

export const getProcurePlanList = (params?: any) => http.get('/procure/ProcurePlan/index', { params })
export const createProcurePlan = (data: any) => http.post('/procure/ProcurePlan/add', data)
export const deleteProcurePlan = (id: number) => http.post('/procure/ProcurePlan/del', { id })
export const auditProcurePlan = (id: number, status: number) => http.post('/procure/ProcurePlan/audit', { id, status })

export const getProcureOrderList = (params?: any) => http.get('/stock/PurchaseOrder/index', { params })
export const createProcureOrder = (data: any) => http.post('/stock/PurchaseOrder/add', data)
export const updateProcureOrder = (data: any) => http.post('/stock/PurchaseOrder/edit', data)
export const deleteProcureOrder = (id: number) => http.post('/stock/PurchaseOrder/del', { id })
export async function auditProcureOrder(id: number, status: number) {
  try {
    return await http.post('/stock/PurchaseOrder/audit', { id, status })
  } catch (error: any) {
    // 兼容老后端：无 audit 路由时，降级为 edit + status 更新
    if (Number(error?.response?.status) === 404) {
      return http.post('/stock/PurchaseOrder/edit', { id, status })
    }
    throw error
  }
}

export const getProcureInhouseList = (params?: any) => http.get('/procure/ProcureInhouse/index', { params })
export const createProcureInhouse = (data: any) => http.post('/procure/ProcureInhouse/add', data)
export const updateProcureInhouse = (data: any) => http.post('/procure/ProcureInhouse/edit', data)
export const deleteProcureInhouse = (id: number) => http.post('/procure/ProcureInhouse/del', { id })
export const auditProcureInhouse = (id: number, status: number) => http.post('/procure/ProcureInhouse/audit', { id, status })

export const getProcureReturnList = (params?: any) => http.get('/procure/ProcureReturn/index', { params })
export const createProcureReturn = (data: any) => http.post('/procure/ProcureReturn/add', data)
export const deleteProcureReturn = (id: number) => http.post('/procure/ProcureReturn/del', { id })
export const auditProcureReturn = (id: number, status: number) => http.post('/procure/ProcureReturn/audit', { id, status })
