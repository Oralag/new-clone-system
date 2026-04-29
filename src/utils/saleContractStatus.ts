export function isEffectiveSaleContractStatus(status: any): boolean {
  const normalized = Number(status)
  return normalized === 1 || normalized === 4
}

export function isEffectiveSaleContract(row: any): boolean {
  return isEffectiveSaleContractStatus(row?.status)
}

export function getSaleContractStatusText(status: any): string {
  return Number(status) === 4 ? '已转单' : '已审核'
}
