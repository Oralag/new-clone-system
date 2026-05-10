function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function normalizeRetailSettlement(totalAmount: number, payAmount?: number | null) {
  const total = Math.max(0, roundMoney(totalAmount))
  const pay = clamp(roundMoney(Number(payAmount ?? total) || 0), 0, total)
  const discount = roundMoney(total - pay)
  return { totalAmount: total, payAmount: pay, discountAmount: discount }
}

export function distributeRetailItems(items: any[], payAmount?: number | null) {
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

  const targetCents = Math.round(actualPayAmount * 100)
  const exactShares = normalizedItems.map(item => (item.num * item.price / totalAmount) * targetCents)
  const floorShares = exactShares.map(share => Math.floor(share))
  let remainder = Math.max(0, targetCents - floorShares.reduce((sum, cents) => sum + cents, 0))

  const rankedIndexes = exactShares
    .map((share, index) => ({ index, fraction: share - floorShares[index] }))
    .sort((a, b) => b.fraction - a.fraction)

  for (let i = 0; i < rankedIndexes.length && remainder > 0; i += 1, remainder -= 1) {
    floorShares[rankedIndexes[i].index] += 1
  }

  return {
    items: normalizedItems.map((item, index) => {
      const lineAmount = floorShares[index] / 100
      return {
        ...item,
        price: item.num > 0 ? Number((lineAmount / item.num).toFixed(6)) : 0,
        line_amount: roundMoney(lineAmount),
        discount_share: roundMoney(item.num * item.original_price - lineAmount),
      }
    }),
    totalAmount,
    payAmount: actualPayAmount,
    discountAmount,
  }
}
