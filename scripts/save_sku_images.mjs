/**
 * Save skuImages URLs to ERP product remark.__brand__.skuImages
 */
const ERP_BASE = 'https://erp-server-xsji.onrender.com'
const BASE = 'https://nomaderp.pages.dev/media'

const PRODUCT_SKU_MAP = [
  {
    id: 988,
    name: '原味传统奶豆腐',
    skuImages: [
      `${BASE}/sku/naidoufu/白底图.png`,
      `${BASE}/sku/naidoufu/111113434.jpg`,
      `${BASE}/sku/naidoufu/121.jpg`,
      `${BASE}/sku/naidoufu/32.jpg`,
    ]
  },
  {
    id: 994,
    name: '冻炒米',
    skuImages: [
      `${BASE}/sku/dongchami/冻炒米包装白底图.jpg`,
      `${BASE}/sku/dongchami/冻炒米包装白底图2.jpg`,
      `${BASE}/sku/dongchami/冻炒米包装白底图3.jpg`,
    ]
  },
  {
    id: 1008,
    name: '奶条',
    skuImages: [
      `${BASE}/sku/naotiao/奶条包装白底图.jpg`,
      `${BASE}/sku/naotiao/IMG_3495.JPG`,
    ]
  },
]

const token = process.env.ERP_TOKEN
if (!token) { console.error('ERP_TOKEN required'); process.exit(1) }

async function getRemark(id) {
  const res = await fetch(`${ERP_BASE}/adminapi/goods/ShopGoods/index?id=${id}`, {
    headers: { token }
  })
  const json = await res.json()
  const row = json.data?.rows?.[0]
  try { return JSON.parse(row?.remark || '{}') } catch { return {} }
}

async function save(id, skuImages) {
  const existing = await getRemark(id)
  existing.__brand__ = { ...existing.__brand__, skuImages }
  const res = await fetch(`${ERP_BASE}/adminapi/goods/ShopGoods/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({ id, remark: JSON.stringify(existing) }),
  })
  const json = await res.json()
  if (json.code !== 1) throw new Error(`Save failed for ${id}: ${JSON.stringify(json)}`)
}

for (const { id, name, skuImages } of PRODUCT_SKU_MAP) {
  process.stdout.write(`Saving ${name} (id=${id}) ${skuImages.length} images... `)
  await save(id, skuImages)
  console.log('OK')
}
console.log('Done')
