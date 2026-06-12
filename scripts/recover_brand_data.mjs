/**
 * Recover brand data for products 988, 994, 996, 1008
 * Their remark.__brand__ was accidentally overwritten with only skuImages.
 * Reconstruct from KV image paths + known CATALOG prices.
 */
const ERP_BASE = 'https://erp-server-xsji.onrender.com'
const MEDIA_BASE = 'https://nomaderp.pages.dev/media'

const token = process.env.ERP_TOKEN
if (!token) { console.error('ERP_TOKEN required'); process.exit(1) }

const PRODUCTS = [
  {
    id: 988,
    headerCount: 6,
    detailCount: 11,
    skuImages: [
      `${MEDIA_BASE}/sku/naidoufu/白底图.png`,
      `${MEDIA_BASE}/sku/naidoufu/111113434.jpg`,
      `${MEDIA_BASE}/sku/naidoufu/121.jpg`,
      `${MEDIA_BASE}/sku/naidoufu/32.jpg`,
    ],
    wholesalePrice: 29,
    minOrderQuantity: 1,
    rating: 4.9,
  },
  {
    id: 994,
    headerCount: 5,
    detailCount: 10,
    skuImages: [
      `${MEDIA_BASE}/sku/dongchami/冻炒米包装白底图.jpg`,
      `${MEDIA_BASE}/sku/dongchami/冻炒米包装白底图2.jpg`,
      `${MEDIA_BASE}/sku/dongchami/冻炒米包装白底图3.jpg`,
    ],
    wholesalePrice: 20,
    minOrderQuantity: 1,
    rating: 4.9,
  },
  {
    id: 996,
    headerCount: 5,
    detailCount: 5,
    skuImages: [
      `${MEDIA_BASE}/sku/qingzhuancha/IMG_5156.JPG`,
      `${MEDIA_BASE}/sku/qingzhuancha/IMG_5157.JPG`,
      `${MEDIA_BASE}/sku/qingzhuancha/IMG_5158.JPG`,
    ],
    wholesalePrice: 29,
    minOrderQuantity: 1,
    rating: 4.9,
  },
  {
    id: 1008,
    headerCount: 4,
    detailCount: 13,
    skuImages: [
      `${MEDIA_BASE}/sku/naotiao/奶条包装白底图.jpg`,
      `${MEDIA_BASE}/sku/naotiao/IMG_3495.JPG`,
    ],
    wholesalePrice: 27,
    minOrderQuantity: 1,
    rating: 4.9,
  },
]

async function getAllProducts() {
  const res = await fetch(`${ERP_BASE}/adminapi/goods/ShopGoods/index?list_rows=500&page=1`, {
    headers: { token }
  })
  const json = await res.json()
  return json.data?.rows || []
}

async function saveRemark(id, remark) {
  const res = await fetch(`${ERP_BASE}/adminapi/goods/ShopGoods/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({ id, remark: JSON.stringify(remark) }),
  })
  const json = await res.json()
  if (json.code !== 1) throw new Error(`Save failed for ${id}: ${JSON.stringify(json)}`)
}

function makeImageUrls(productId, count, type) {
  return Array.from({ length: count }, (_, i) =>
    `${MEDIA_BASE}/goods/${productId}/${type}_${i + 1}.jpg`
  )
}

const allRows = await getAllProducts()
console.log(`Fetched ${allRows.length} products from ERP`)

for (const p of PRODUCTS) {
  const row = allRows.find(r => r.id === p.id)
  if (!row) { console.log(`id=${p.id} NOT FOUND`); continue }

  // Read existing remark (might just have skuImages now)
  let existing = {}
  try { existing = JSON.parse(row.remark || '{}') } catch {}

  const headerImages = makeImageUrls(p.id, p.headerCount, 'header')
  const detailImages = makeImageUrls(p.id, p.detailCount, 'detail')

  existing.__brand__ = {
    ...existing.__brand__,   // preserve any existing fields (e.g. skuImages saved earlier)
    show: true,
    image: headerImages[0],
    headerImages,
    detailImages,
    skuImages: p.skuImages,
    wholesalePrice: p.wholesalePrice,
    minOrderQuantity: p.minOrderQuantity,
    rating: p.rating,
    reviewsCount: 0,
    tags: [],
  }

  process.stdout.write(`Saving id=${p.id} (${row.goods_name})... `)
  await saveRemark(p.id, existing)
  console.log(`OK — ${p.headerCount} header, ${p.detailCount} detail, ${p.skuImages.length} sku`)
}

console.log('\nRecovery complete.')
