import http from '../http'

export const getSaleRateList = (params?: any) => http.get('/reports/SaleRate/index', { params })
export const getSaleLedgerList = (params?: any) => http.get('/reports/SaleLedger/index', { params })
export const getCommissionList = (params?: any) => http.get('/reports/Commission/index', { params })
export const getProcureReportList = (params?: any) => http.get('/reports/Procure/index', { params })
export const getStockReportList = (params?: any) => http.get('/reports/Stock/index', { params })
export const getProfitList = (params?: any) => http.get('/reports/Profit/index', { params })
export const getFinanceReportList = (params?: any) => http.get('/reports/Finance/index', { params })
