import http from '../http'

export const getExhibitions = () => http.get('/retail/exhibition/index')
export const saveExhibition = (data: any) => http.post('/retail/exhibition/save', data)
export const getExhibitionDetail = (id: number) => http.get('/retail/exhibition/detail', { params: { id } })
export const getExhibitionCandidates = (start_date: string, end_date: string) => http.get('/retail/exhibition/candidates', { params: { start_date, end_date } })
export const assignExhibition = (exhibition_id: number, rows: any[], type = 'order') => http.post('/retail/exhibition/assign', {
  exhibition_id, type, ids: rows.map(r => Number(r.id)),
  previous: Object.fromEntries(rows.map(r => [r.id, Number(r.exhibition_id || 0)])),
})
export const payExhibitionExpense = (data: any) => http.post('/retail/exhibition/payExpense', data)
export const undoExhibitionExpensePayment = (id: number) => http.post('/retail/exhibition/undoExpensePayment', { id })
