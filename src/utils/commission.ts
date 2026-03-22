// 提成设置本地存储工具
// erp_commission_rates: { staffId: ratePercent }  e.g. { 1: 5.0 }  (%)

import { readScopedJson, writeScopedJson } from './storageScope'

const RATES_KEY = 'erp_commission_rates'

export interface CommissionRate {
  staffId: number
  staffName: string
  rate: number  // 百分比，如 5 表示 5%
}

export function loadCommissionRates(): CommissionRate[] {
  return readScopedJson<CommissionRate[]>(RATES_KEY, [])
}

export function saveCommissionRates(rates: CommissionRate[]): void {
  writeScopedJson(RATES_KEY, rates)
}

export function getCommissionRate(staffId: number): number {
  const rates = loadCommissionRates()
  return rates.find(r => r.staffId === staffId)?.rate ?? 0
}

export function setCommissionRate(staffId: number, staffName: string, rate: number): void {
  const rates = loadCommissionRates()
  const idx = rates.findIndex(r => r.staffId === staffId)
  if (idx >= 0) {
    rates[idx] = { staffId, staffName, rate }
  } else {
    rates.push({ staffId, staffName, rate })
  }
  saveCommissionRates(rates)
}
