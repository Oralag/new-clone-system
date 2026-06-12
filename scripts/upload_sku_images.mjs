/**
 * Upload SKU white background images to Cloudflare KV
 * Then save image URLs to each product's remark.__brand__.skuImages
 */

import fs from 'fs'
import path from 'path'

const CF_API_TOKEN = 'rdRZlf7zm66MaFQfjUAj08ihpoY10kbOOa9lhw5T'
const CF_ACCOUNT_ID = '7e2ebca0f9d673283d15f2faff3d2b21'
const KV_NAMESPACE_ID = '34551c1704904c3ab22463a73fc56f5c'
const ERP_BASE = 'https://erp-server-xsji.onrender.com'
const ERP_TOKEN = process.env.ERP_TOKEN

const SKU_BASE = '/Users/oralagborjigin/Desktop/new work /电商/SKU 白底图'

// Map: folder name → { productId, prefix }
const PRODUCT_MAP = [
  { folder: '传统奶豆腐SKU',  productId: 988,  prefix: 'sku/naidoufu' },
  { folder: '冻炒米SKU图',    productId: 994,  prefix: 'sku/dongchami' },
  { folder: '奶条SKU',        productId: 1008, prefix: 'sku/naotiao' },
  { folder: '奶果子SKU图',    productId: null, prefix: 'sku/naiguozi' }, // no matching brand product
]

// Root-level images: uploaded but not auto-assigned
const ROOT_FILES = [
  'DSC_6306 拷贝.jpg',
  'DSC_6309 拷贝.jpg',
  'DSC_6310 拷贝.jpg',
  '白底图.jpg',
]

async function uploadToKV(key, buffer, contentType) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/media_${key}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`KV upload failed for ${key}: ${res.status} ${txt}`)
  }
}

function contentTypeForFile(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

async function getExistingRemark(productId) {
  const res = await fetch(`${ERP_BASE}/adminapi/goods/ShopGoods/index?id=${productId}`, {
    headers: { token: ERP_TOKEN }
  })
  const json = await res.json()
  const current = json.data?.rows?.[0]
  try { return JSON.parse(current?.remark || '{}') } catch { return {} }
}

async function saveSkuImages(productId, skuImages) {
  const existing = await getExistingRemark(productId)
  existing.__brand__ = { ...existing.__brand__, skuImages }
  const res = await fetch(`${ERP_BASE}/adminapi/goods/ShopGoods/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: ERP_TOKEN },
    body: JSON.stringify({ id: productId, remark: JSON.stringify(existing) }),
  })
  const json = await res.json()
  if (json.code !== 1) throw new Error(`Save remark failed for ${productId}: ${JSON.stringify(json)}`)
}

async function main() {
  if (!ERP_TOKEN) {
    console.error('ERP_TOKEN env required')
    process.exit(1)
  }

  const allUploaded = {}

  // Upload subfolders
  for (const { folder, productId, prefix } of PRODUCT_MAP) {
    const dir = path.join(SKU_BASE, folder)
    if (!fs.existsSync(dir)) { console.log(`Skip missing: ${folder}`); continue }

    const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    const productUrls = []

    for (const file of files) {
      const kvKey = `${prefix}/${file}`
      const filePath = path.join(dir, file)
      const buffer = fs.readFileSync(filePath)
      const ct = contentTypeForFile(file)

      process.stdout.write(`  Uploading ${kvKey} ... `)
      await uploadToKV(kvKey, buffer, ct)
      const url = `https://nomaderp.pages.dev/media/${kvKey}`
      productUrls.push(url)
      console.log('OK')
    }

    if (productId && productUrls.length > 0) {
      allUploaded[productId] = productUrls
    }
    if (!productId) {
      console.log(`  [${folder}] uploaded ${productUrls.length} images (no product assigned)`)
      productUrls.forEach(u => console.log('   ', u))
    }
  }

  // Upload root-level files
  console.log('\nRoot-level images (not auto-assigned):')
  for (const file of ROOT_FILES) {
    const filePath = path.join(SKU_BASE, file)
    if (!fs.existsSync(filePath)) continue
    const kvKey = `sku/root/${file}`
    const buffer = fs.readFileSync(filePath)
    process.stdout.write(`  Uploading ${kvKey} ... `)
    await uploadToKV(kvKey, buffer, contentTypeForFile(file))
    console.log(`OK → https://nomaderp.pages.dev/media/${kvKey}`)
  }

  // Save skuImages to ERP
  console.log('\nSaving skuImages to ERP products...')
  for (const [productId, urls] of Object.entries(allUploaded)) {
    process.stdout.write(`  Product ${productId}: ${urls.length} images ... `)
    await saveSkuImages(Number(productId), urls)
    console.log('saved')
  }

  console.log('\nDone!')
}

main().catch(err => { console.error(err); process.exit(1) })
