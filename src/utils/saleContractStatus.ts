export function isEffectiveSaleContractStatus(status: any): boolean {
  const normalized = Number(status)
  return normalized === 1 || normalized === 4
}

export function isEffectiveSaleContract(row: any): boolean {
  return isEffectiveSaleContractStatus(row?.status)
}

export function getSaleContractStatusText(status: any, row?: any): string {
  const normalized = Number(status)
  if (normalized === 4) return '已转单'
  if (normalized === 1) {
    const hasLinkedSaleOut = Boolean(
      row?.sale_out_id ||
      row?.saleout_id ||
      row?.out_id ||
      row?.linked_sale_out_id ||
      row?.converted_out_id ||
      row?.contract_out_id
    )
    return hasLinkedSaleOut ? '已审核并出库' : '已审核'
  }
  return '待审核'
}
