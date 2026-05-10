function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function toCents(value: number) {
  return Math.round((Number(value) || 0) * 100)
}

function allocateProportionally(baseCents: number[], targetCents: number) {
  const safeTargetCents = Math.max(0, Math.round(Number(targetCents) || 0))
  const totalBaseCents = baseCents.reduce((sum, cents) => sum + Math.max(0, cents), 0)

  if (!baseCents.length || totalBaseCents <= 0) {
    return baseCents.map(() => 0)
  }

  const exactShares = baseCents.map(cents => (Math.max(0, cents) / totalBaseCents) * safeTargetCents)
  const floorShares = exactShares.map(share => Math.floor(share))
  let remainder = Math.max(0, safeTargetCents - floorShares.reduce((sum, cents) => sum + cents, 0))

  const rankedIndexes = exactShares
    .map((share, index) => ({ index, fraction: share - floorShares[index] }))
    .sort((a, b) => b.fraction - a.fraction)

  for (let i = 0; i < rankedIndexes.length && remainder > 0; i += 1, remainder -= 1) {
    floorShares[rankedIndexes[i].index] += 1
  }

  return floorShares
}

function buildSettledItems(normalizedItems: any[], lineCents: number[]) {
  return normalizedItems.map((item, index) => {
    const lineAmount = Math.max(0, (lineCents[index] || 0) / 100)
    return {
      ...item,
      price: item.num > 0 ? Number((lineAmount / item.num).toFixed(6)) : 0,
      line_amount: roundMoney(lineAmount),
      discount_share: roundMoney(item.num * item.original_price - lineAmount),
    }
  })
}

export function normalizeRetailSettlement(totalAmount: number, payAmount?: number | null) {
  const total = Math.max(0, roundMoney(totalAmount))
  const pay = Math.max(0, roundMoney(Number(payAmount ?? total) || 0))
  const discount = roundMoney(total - pay)
  return { totalAmount: total, payAmount: pay, discountAmount: discount }
}

export function distributeRetailItems(
  items: any[],
  payAmount?: number | null,
  options?: { targetIndex?: number | null },
) {
  const normalizedItems = (items || []).map((item: any) => {
    const num = Math.max(0, Number(item?.num || 0))
    const price = Math.max(0, Number(item?.price || 0))
    return {
      ...item,
      num,
      price,
      original_price: Number.isFinite(Number(item?.original_price))
        ? Number(item.original_price)
        : price,
    }
  })

  const totalAmount = roundMoney(normalizedItems.reduce((sum, item) => sum + item.num * item.price, 0))
  const { payAmount: actualPayAmount, discountAmount } = normalizeRetailSettlement(totalAmount, payAmount)

  if (!normalizedItems.length || totalAmount <= 0) {
    return {
      items: normalizedItems.map(item => ({
        ...item,
        line_amount: roundMoney(item.num * item.price),
        discount_share: 0,
      })),
      totalAmount,
      payAmount: actualPayAmount,
      discountAmount,
    }
  }

  const totalCents = toCents(totalAmount)
  const targetCents = toCents(actualPayAmount)
  const baseLineCents = normalizedItems.map(item => toCents(item.num * item.price))
  const targetIndex = Number.isInteger(options?.targetIndex)
    ? Number(options?.targetIndex)
    : -1

  if (targetIndex < 0 || targetIndex >= normalizedItems.length) {
    const lineCents = allocateProportionally(baseLineCents, targetCents)
    return {
      items: buildSettledItems(normalizedItems, lineCents),
      totalAmount,
      payAmount: actualPayAmount,
      discountAmount,
    }
  }

  const lineCents = [...baseLineCents]
  const deltaCents = targetCents - totalCents

  if (deltaCents >= 0) {
    lineCents[targetIndex] += deltaCents
  } else {
    let remainingReduction = -deltaCents
    const reducibleOnTarget = Math.min(lineCents[targetIndex], remainingReduction)
    lineCents[targetIndex] -= reducibleOnTarget
    remainingReduction -= reducibleOnTarget

    if (remainingReduction > 0) {
      const otherIndexes = normalizedItems
        .map((_, index) => index)
        .filter(index => index !== targetIndex)
      const otherBaseCents = otherIndexes.map(index => baseLineCents[index])
      const otherTargetTotal = Math.max(0, otherBaseCents.reduce((sum, cents) => sum + cents, 0) - remainingReduction)
      const allocatedOtherCents = allocateProportionally(otherBaseCents, otherTargetTotal)
      otherIndexes.forEach((index, idx) => {
        lineCents[index] = allocatedOtherCents[idx]
      })
    }
  }

  return {
    items: buildSettledItems(normalizedItems, lineCents),
    totalAmount,
    payAmount: actualPayAmount,
    discountAmount,
  }
}
