/**
 * 把 public/brand-images/ 里的图片路径写入 ERP 对应产品的 remark.__brand__ 字段
 * 运行：node scripts/upload-brand-images.mjs
 */
import fs from 'fs'
import path from 'path'

const API_BASE = 'https://nomaderp.pages.dev/adminapi'

// 每个产品：erpId、文件夹名、排序值
// 头图：头图2.jpg 作为主图（实拍），头图1/2/3/4 全部作为轮播
// 详情图：所有 详情XX.jpg 按序排列
const PRODUCTS = [
  { erpId: 996,  name: '青砖奶茶成品',          folder: '茶',    sort: 1 },
  { erpId: 994,  name: '冻炒米成品盒',           folder: '冻炒米', sort: 2 },
  { erpId: 992,  name: '奶果子/盒装/成品',        folder: '奶果子', sort: 3 },
  { erpId: 989,  name: '蒙古黄油/瓶装成品',       folder: '黄油',  sort: 4 },
  { erpId: 988,  name: '原味传统奶豆腐/成品袋装',  folder: '奶豆腐', sort: 5 },
  { erpId: 1008, name: '甜味奶条成品',            folder: '奶条',  sort: 6 },
  { erpId: 1007, name: '原味奶条成品',            folder: '奶条',  sort: 7 },
]

const PUBLIC_DIR = new URL('../public/brand-images', import.meta.url).pathname

function getImages(folder) {
  const dir = path.join(PUBLIC_DIR, folder)
  if (!fs.existsSync(dir)) return { headerImages: [], detailImages: [] }

  const files = fs.readdirSync(dir).sort()
  const headerImages = files
    .filter(f => f.startsWith('头图') && f.endsWith('.jpg'))
    .map(f => `/brand-images/${folder}/${f}`)

  const detailImages = files
    .filter(f => f.startsWith('详情') && f.endsWith('.jpg'))
    .sort()
    .map(f => `/brand-images/${folder}/${f}`)

  return { headerImages, detailImages }
}

async function login() {
  const res = await fetch(`${API_BASE}/login/account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: '17747344571', password: 'Oral6421', terminal: 1 }),
  })
  const json = await res.json()
  if (json.code !== 1) throw new Error('登录失败: ' + JSON.stringify(json))
  return json.data.token
}

async function getProductRemark(erpId, token) {
  const res = await fetch(`${API_BASE}/goods/ShopGoods/index?id=${erpId}`, {
    headers: { token },
  })
  const json = await res.json()
  const item = json.data?.rows?.[0]
  if (!item) throw new Error(`找不到产品 ${erpId}`)
  let remark = {}
  try { remark = JSON.parse(item.remark || '{}') } catch {}
  return remark
}

async function saveProduct(erpId, token, brandData, sort) {
  const remark = await getProductRemark(erpId, token)
  remark.__brand__ = { ...(remark.__brand__ || {}), ...brandData }

  await fetch(`${API_BASE}/goods/ShopGoods/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({ id: erpId, remark: JSON.stringify(remark), sort }),
  })
}

async function main() {
  console.log('登录中...')
  const token = await login()
  console.log('登录成功\n')

  for (const product of PRODUCTS) {
    try {
      const { headerImages, detailImages } = getImages(product.folder)

      // 主图用第2张头图（实拍产品图），若不存在则用第1张
      const image = headerImages[1] || headerImages[0] || ''

      const brandData = {
        show: true,
        image,
        headerImages,
        detailImage: detailImages[0] || '',
        detailImages,
      }

      await saveProduct(product.erpId, token, brandData, product.sort)
      console.log(`✓ ${product.name} (id:${product.erpId}) sort=${product.sort} — 头图${headerImages.length}张，详情${detailImages.length}张`)
    } catch (e) {
      console.error(`✗ ${product.name} (id:${product.erpId}) — ${e.message}`)
    }
  }

  console.log('\n完成！')
}

main().catch(console.error)
