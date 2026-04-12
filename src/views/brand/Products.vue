<template>
  <div class="brand-products">
    <div class="bp-header">
      <div>
        <h2 class="bp-title">所有产品</h2>
        <p class="bp-sub">
          {{ shopStore.isWholesale ? '批发采购模式 · 选好产品后可批量下载资料' : '发现适合您的完美装备' }}
        </p>
      </div>
      <div class="bp-cats">
        <button
          v-for="cat in FIXED_CATS"
          :key="cat.tag"
          class="bp-cat-btn"
          :class="{ active: selectedTag === cat.tag }"
          @click="selectedTag = cat.tag"
        >{{ cat.label }}</button>
      </div>
      <!-- 编辑模式提示 -->
      <div v-if="brandEdit.editMode" class="bp-edit-hint">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        拖拽卡片排序 · 点击 ✏️ 编辑商品展示信息
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="shopStore.loading" class="bp-loading">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" class="spinning"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
      <span>加载产品中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!shopStore.loading && shopStore.products.length === 0" class="bp-empty">
      暂无产品
    </div>

    <!-- 筛选无结果 -->
    <div v-else-if="!shopStore.loading && filteredProducts.length === 0" class="bp-empty">
      没有找到符合条件的产品
    </div>

    <!-- 采购商：已选清单 + 批量下载 -->
    <div v-if="shopStore.isWholesale && selectedIds.length > 0" class="bp-bulk-bar">
      <span class="bp-bulk-info">已选 {{ selectedIds.length }} 件产品</span>
      <button class="bp-bulk-download" :disabled="downloading" @click="downloadSelected">
        <svg v-if="!downloading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="spinning"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        {{ downloading ? '打包中...' : '下载所选产品资料' }}
      </button>
      <button class="bp-bulk-clear" @click="selectedIds = []">清空选择</button>
    </div>

    <!-- 产品网格（编辑模式下支持拖拽） -->
    <div
      class="bp-grid"
      @dragover.prevent
      @drop="onDrop"
    >
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bp-card"
        :class="{
          'bp-card-selected': selectedIds.includes(product.id),
          'bp-card-dragging': dragId === product.id,
          'bp-card-dragover': dragOverId === product.id,
        }"
        :draggable="brandEdit.editMode"
        @dragstart="onDragStart(product.id)"
        @dragend="onDragEnd"
        @dragenter.prevent="onDragEnter(product.id)"
        @click="!brandEdit.editMode && goDetail(product.id)"
      >
        <div class="bp-card-img-wrap">
          <img :src="product.image || 'https://picsum.photos/seed/placeholder/800/600'" :alt="product.name" class="bp-card-img" referrerpolicy="no-referrer" />
          <!-- 拖拽手柄（编辑模式） -->
          <div v-if="brandEdit.editMode" class="bp-drag-handle" title="拖拽排序">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          <!-- 编辑按钮（编辑模式） -->
          <button v-if="brandEdit.editMode" class="bp-edit-btn" @click.stop="openEdit(product)" title="编辑商品展示信息">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <!-- 采购商模式：勾选框 -->
          <div v-if="shopStore.isWholesale && !brandEdit.editMode" class="bp-select-check" @click.stop="toggleSelect(product.id)">
            <svg v-if="selectedIds.includes(product.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <!-- 标签角标 -->
          <div v-if="product.tags?.length" class="bp-tag-badge" :class="tagBadgeClass(product.tags)">
            {{ tagBadgeLabel(product.tags) }}
          </div>
        </div>
        <div class="bp-card-body">
          <h3 class="bp-card-name">{{ product.name }}</h3>
          <p class="bp-card-desc">{{ product.description }}</p>
          <div class="bp-card-footer">
            <div class="bp-card-price">
              <span class="bp-price">¥{{ shopStore.isWholesale ? product.wholesalePrice : product.price }}</span>
              <span v-if="shopStore.isWholesale" class="bp-moq">起订 {{ product.minOrderQuantity }}</span>
            </div>
            <div class="bp-card-rating">
              <svg v-for="i in 5" :key="i" width="10" height="10" viewBox="0 0 24 24"
                :fill="i <= Math.round(product.rating) ? '#f59e0b' : 'none'"
                stroke="#f59e0b" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>{{ product.rating }}</span>
            </div>
          </div>
          <template v-if="!brandEdit.editMode">
            <div v-if="shopStore.isWholesale" class="bp-btn-row">
              <button class="bp-add-btn" @click.stop="addToCart(product)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
                加入采购单
              </button>
              <button class="bp-dl-btn" :disabled="downloading" @click.stop="downloadOne(product)" title="下载产品资料">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            </div>
            <button v-else class="bp-add-btn" @click.stop="addToCart(product)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
              加入购物车
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 编辑弹框 -->
    <div v-if="editDialogVisible" class="bp-edit-overlay" @click.self="editDialogVisible = false">
      <div class="bp-edit-dialog">
        <div class="bp-edit-dialog-header">
          <h3>编辑商品展示信息</h3>
          <button class="bp-edit-close" @click="editDialogVisible = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="bp-edit-dialog-body">
          <p class="bp-edit-goods-name">{{ editForm.name }}</p>

          <div class="bp-edit-field">
            <label>商品描述</label>
            <textarea v-model="editForm.description" class="bp-edit-textarea" placeholder="展示给客户看的商品描述"></textarea>
          </div>

          <div class="bp-edit-field">
            <label>主图 URL</label>
            <div class="bp-edit-input-row"><input v-model="editForm.image" class="bp-edit-input" placeholder="https://... 或点击上传" /><button class="bp-upload-btn" @click="upload(v => editForm.image = v)">上传</button></div>
            <img v-if="editForm.image" :src="editForm.image" class="bp-edit-preview" referrerpolicy="no-referrer" />
          </div>

          <div class="bp-edit-field">
            <label>轮播图（最多4张）</label>
            <div class="bp-edit-carousel">
              <div v-for="(_, i) in editForm.headerImages" :key="i" class="bp-edit-input-row">
                <input v-model="editForm.headerImages[i]" class="bp-edit-input" :placeholder="`轮播图 ${i+1} URL`" />
                <button class="bp-upload-btn" @click="upload(v => editForm.headerImages[i] = v)">上传</button>
              </div>
            </div>
          </div>

          <div class="bp-edit-field">
            <label>详情图 URL</label>
            <div class="bp-edit-input-row"><input v-model="editForm.detailImage" class="bp-edit-input" placeholder="https://... 长图详情" /><button class="bp-upload-btn" @click="upload(v => editForm.detailImage = v)">上传</button></div>
          </div>

          <div class="bp-edit-row">
            <div class="bp-edit-field">
              <label>批发价 (¥)</label>
              <input v-model.number="editForm.wholesalePrice" type="number" class="bp-edit-input" placeholder="0.00" />
            </div>
            <div class="bp-edit-field">
              <label>起订量 (件)</label>
              <input v-model.number="editForm.minOrderQuantity" type="number" class="bp-edit-input" placeholder="1" />
            </div>
          </div>

          <div class="bp-edit-field">
            <label>分类标签</label>
            <div class="bp-edit-tags">
              <label v-for="opt in TAG_OPTIONS" :key="opt.value" class="bp-edit-tag-check" :class="{ active: editForm.tags.includes(opt.value) }" @click="toggleTag(opt.value)">
                {{ opt.label }}
              </label>
            </div>
          </div>
        </div>
        <div class="bp-edit-dialog-footer">
          <button class="bp-edit-cancel" @click="editDialogVisible = false">取消</button>
          <button class="bp-edit-save" :disabled="saving" @click="saveEdit">
            {{ saving ? '保存中...' : '保存到ERP' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 保存成功提示 -->
  <div v-if="saveToast" class="bp-toast">✓ 已保存到ERP</div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useShopStore } from '@/stores/shopStore'
import { useBrandEditStore } from '@/stores/brandEdit'
import { useRouter } from 'vue-router'
import type { ShopProduct } from '@/stores/shopStore'
import { useImageUpload } from '@/composables/useImageUpload'
const { triggerUpload } = useImageUpload()
function upload(setter: (v: string) => void) { triggerUpload(setter) }

const shopStore = useShopStore()
const brandEdit = useBrandEditStore()
const router = useRouter()
const selectedTag = ref('all')
const selectedIds = ref<string[]>([])
const downloading = ref(false)

// 拖拽状态
const dragId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

// 编辑弹框
const editDialogVisible = ref(false)
const saving = ref(false)
const saveToast = ref(false)
const editingProduct = ref<ShopProduct | null>(null)
const editForm = reactive({
  name: '',
  description: '',
  image: '',
  headerImages: ['', '', '', ''],
  detailImage: '',
  wholesalePrice: 0,
  minOrderQuantity: 1,
  tags: [] as string[],
})

const FIXED_CATS = [
  { label: '全部', tag: 'all' },
  { label: '新品', tag: 'new' },
  { label: '热销', tag: 'hot' },
  { label: '特惠', tag: 'sale' },
]

const TAG_OPTIONS = [
  { value: 'new', label: '新品' },
  { value: 'hot', label: '热销' },
  { value: 'sale', label: '特惠' },
]

const filteredProducts = computed(() => {
  const keyword = router.currentRoute.value.query.q as string
  let list = selectedTag.value === 'all'
    ? shopStore.products
    : shopStore.products.filter(p => p.tags?.includes(selectedTag.value))
  if (keyword) {
    const q = keyword.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }
  return list
})

function tagBadgeLabel(tags: string[]) {
  if (tags.includes('hot')) return '热销'
  if (tags.includes('new')) return '新品'
  if (tags.includes('sale')) return '特惠'
  return ''
}

function tagBadgeClass(tags: string[]) {
  if (tags.includes('hot')) return 'badge-hot'
  if (tags.includes('new')) return 'badge-new'
  if (tags.includes('sale')) return 'badge-sale'
  return ''
}

function goDetail(id: string) {
  router.push(`/brand/product/${id}`)
}

function addToCart(product: ShopProduct) {
  shopStore.addToCart(product)
  router.push('/brand/cart')
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

// ── 拖拽排序 ────────────────────────────────────────────────────────────────
function onDragStart(id: string) { dragId.value = id }
function onDragEnd() {
  if (dragId.value && dragOverId.value && dragId.value !== dragOverId.value) {
    const products = [...shopStore.products]
    const fromIdx = products.findIndex(p => p.id === dragId.value)
    const toIdx = products.findIndex(p => p.id === dragOverId.value)
    const [moved] = products.splice(fromIdx, 1)
    products.splice(toIdx, 0, moved)
    // 重新赋值 sort
    const updates = products.map((p, i) => ({ erpId: p.erpId, sort: i + 1 }))
    shopStore.products.splice(0, shopStore.products.length, ...products)
    shopStore.saveSortOrder(updates)
  }
  dragId.value = null
  dragOverId.value = null
}
function onDragEnter(id: string) { dragOverId.value = id }
function onDrop() { /* handled in dragend */ }

// ── 编辑弹框 ─────────────────────────────────────────────────────────────────
function openEdit(product: ShopProduct) {
  editingProduct.value = product
  editForm.name = product.name
  editForm.description = product.description
  editForm.image = product.image
  editForm.headerImages = product.headerImages?.length
    ? [...product.headerImages, '', '', '', ''].slice(0, 4)
    : ['', '', '', '']
  editForm.detailImage = product.detailImage || ''
  editForm.wholesalePrice = product.wholesalePrice
  editForm.minOrderQuantity = product.minOrderQuantity
  editForm.tags = [...(product.tags || [])]
  editDialogVisible.value = true
}

function toggleTag(val: string) {
  const idx = editForm.tags.indexOf(val)
  if (idx >= 0) editForm.tags.splice(idx, 1)
  else editForm.tags.push(val)
}

async function saveEdit() {
  if (!editingProduct.value) return
  saving.value = true
  try {
    await shopStore.saveBrandFields(editingProduct.value.erpId, {
      description: editForm.description,
      image: editForm.image,
      headerImages: editForm.headerImages.filter(s => s),
      detailImage: editForm.detailImage,
      wholesalePrice: editForm.wholesalePrice,
      minOrderQuantity: editForm.minOrderQuantity,
      tags: editForm.tags,
    })
    editDialogVisible.value = false
    saveToast.value = true
    setTimeout(() => { saveToast.value = false }, 2500)
  } finally {
    saving.value = false
  }
}

// ── Download helpers ─────────────────────────────────────────────────────────
async function fetchImageBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch { return null }
}

function getImageExtension(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|webp|gif)/i)
  return match ? match[1].toLowerCase() : 'jpg'
}

async function buildZipForProducts(products: ShopProduct[]): Promise<Blob> {
  const [{ default: JSZip }, { default: ExcelJS }] = await Promise.all([
    import('jszip'),
    import('exceljs'),
  ])
  const zip = new JSZip()
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('产品资料')
  sheet.columns = [
    { header: '产品名称', key: 'name', width: 24 },
    { header: '分类', key: 'category', width: 14 },
    { header: '零售价(¥)', key: 'price', width: 12 },
    { header: '批发价(¥)', key: 'wholesalePrice', width: 12 },
    { header: '起订量', key: 'minOrderQuantity', width: 10 },
    { header: '评分', key: 'rating', width: 8 },
    { header: '描述', key: 'description', width: 40 },
    { header: '缩略图', key: 'thumb', width: 16 },
  ]
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D1D1F' } }
  headerRow.height = 22
  headerRow.alignment = { vertical: 'middle' }

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const rowIndex = i + 2
    const row = sheet.addRow({ name: p.name, category: p.category, price: p.price, wholesalePrice: p.wholesalePrice, minOrderQuantity: p.minOrderQuantity, rating: p.rating, description: p.description })
    row.height = 60
    row.alignment = { vertical: 'middle', wrapText: true }
    const imgBuf = await fetchImageBuffer(p.image)
    if (imgBuf) {
      const ext = getImageExtension(p.image) as 'jpeg' | 'png' | 'gif'
      const safeExt = ['jpeg', 'png', 'gif'].includes(ext) ? ext : 'jpeg'
      const imageId = workbook.addImage({ buffer: imgBuf as Buffer, extension: safeExt })
      sheet.addImage(imageId, { tl: { col: 7, row: rowIndex - 1 }, br: { col: 8, row: rowIndex }, editAs: 'oneCell' })
    }
    const folderName = `images/${p.name}`
    const mainBuf = await fetchImageBuffer(p.image)
    if (mainBuf) zip.file(`${folderName}/主图.${getImageExtension(p.image)}`, mainBuf)
    if (p.headerImages?.length) {
      for (let j = 0; j < p.headerImages.length; j++) {
        const buf = await fetchImageBuffer(p.headerImages[j])
        if (buf) zip.file(`${folderName}/轮播图_${j+1}.${getImageExtension(p.headerImages[j])}`, buf)
      }
    }
    if (p.detailImage) {
      const buf = await fetchImageBuffer(p.detailImage)
      if (buf) zip.file(`${folderName}/详情图.${getImageExtension(p.detailImage)}`, buf)
    }
  }
  const excelBuffer = await workbook.xlsx.writeBuffer()
  zip.file('产品资料.xlsx', excelBuffer)
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

async function downloadOne(product: ShopProduct) {
  if (downloading.value) return
  downloading.value = true
  try {
    const blob = await buildZipForProducts([product])
    triggerDownloadBlob(blob, `${product.name}-产品资料.zip`)
  } finally { downloading.value = false }
}

async function downloadSelected() {
  if (downloading.value) return
  downloading.value = true
  try {
    const products = shopStore.products.filter(p => selectedIds.value.includes(p.id))
    const blob = await buildZipForProducts(products)
    triggerDownloadBlob(blob, `采购清单-${products.length}款产品.zip`)
  } finally { downloading.value = false }
}
</script>

<style scoped>
.brand-products { padding: 32px 48px 80px; max-width: 1400px; }
.bp-header { display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.bp-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
.bp-sub { font-size: 13px; color: rgba(29,29,31,0.45); margin-top: 4px; }
.bp-cats { display: flex; gap: 8px; flex-wrap: wrap; }
.bp-cat-btn { padding: 7px 15px; border-radius: 999px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; background: #f5f5f7; color: rgba(29,29,31,0.5); transition: all 0.2s; }
.bp-cat-btn.active, .bp-cat-btn:hover { background: #1d1d1f; color: #fff; }
.bp-edit-hint { width: 100%; padding: 8px 16px; background: rgba(124,58,237,0.06); border: 1px dashed rgba(124,58,237,0.3); border-radius: 10px; font-size: 12px; color: #7c3aed; font-weight: 600; display: flex; align-items: center; gap: 6px; }

.bp-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 80px 0; color: rgba(29,29,31,0.4); font-size: 14px; }
.bp-empty { text-align: center; padding: 80px 0; color: rgba(29,29,31,0.3); font-size: 15px; }

.bp-bulk-bar { display: flex; align-items: center; gap: 12px; background: #fffbf0; border: 1px solid rgba(245,158,11,0.2); border-radius: 14px; padding: 12px 20px; margin-bottom: 20px; }
.bp-bulk-info { font-size: 13px; font-weight: 700; color: #d97706; flex: 1; }
.bp-bulk-download { display: flex; align-items: center; gap: 7px; padding: 8px 16px; background: #f59e0b; color: #1d1d1f; border-radius: 10px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: transform 0.2s; }
.bp-bulk-download:hover:not(:disabled) { transform: scale(1.02); }
.bp-bulk-download:disabled { opacity: 0.6; cursor: not-allowed; }
.bp-bulk-clear { padding: 8px 14px; background: transparent; color: rgba(29,29,31,0.4); border-radius: 10px; font-size: 12px; font-weight: 600; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
.bp-bulk-clear:hover { background: #f5f5f7; color: #1d1d1f; }

.bp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.bp-card { background: #fff; border-radius: 24px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: all 0.4s cubic-bezier(0.23,1,0.32,1); }
.bp-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.09); }
.bp-card-selected { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.bp-card-dragging { opacity: 0.4; transform: scale(0.97); }
.bp-card-dragover { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.2); transform: translateY(-4px); }

.bp-card-img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; background: #f5f5f7; }
.bp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease; }
.bp-card:hover .bp-card-img { transform: scale(1.07); }

.bp-drag-handle { position: absolute; top: 10px; left: 10px; z-index: 3; width: 28px; height: 28px; border-radius: 8px; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; color: #fff; cursor: grab; }
.bp-drag-handle:active { cursor: grabbing; }
.bp-edit-btn { position: absolute; top: 10px; right: 10px; z-index: 3; width: 28px; height: 28px; border-radius: 8px; background: #7c3aed; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,0.4); transition: transform 0.2s; }
.bp-edit-btn:hover { transform: scale(1.1); }

.bp-select-check { position: absolute; top: 10px; left: 10px; z-index: 2; width: 24px; height: 24px; border-radius: 7px; border: 2px solid rgba(255,255,255,0.8); background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(4px); }
.bp-card-selected .bp-select-check { background: #7c3aed; border-color: #7c3aed; }

.bp-tag-badge { position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
.badge-hot { background: #f59e0b; color: #1d1d1f; }
.badge-new { background: #0071e3; color: #fff; }
.badge-sale { background: #ef4444; color: #fff; }

.bp-card-body { padding: 16px; }
.bp-card-name { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
.bp-card-desc { font-size: 12px; color: rgba(29,29,31,0.45); line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.bp-card-footer { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bp-card-price { display: flex; align-items: center; gap: 6px; }
.bp-price { font-size: 17px; font-weight: 800; color: #0071e3; }
.bp-moq { font-size: 10px; font-weight: 600; color: #d97706; background: rgba(245,158,11,0.1); padding: 2px 7px; border-radius: 999px; }
.bp-card-rating { display: flex; align-items: center; gap: 3px; }
.bp-card-rating span { font-size: 10px; color: rgba(29,29,31,0.4); font-weight: 600; }
.bp-btn-row { display: flex; gap: 8px; }
.bp-add-btn { flex: 1; padding: 9px; border-radius: 12px; background: #1d1d1f; color: #fff; font-size: 12px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; }
.bp-add-btn:hover { background: #0071e3; }
.bp-dl-btn { width: 36px; border-radius: 12px; background: #f5f5f7; color: rgba(29,29,31,0.5); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; flex-shrink: 0; }
.bp-dl-btn:hover:not(:disabled) { background: #f59e0b; color: #1d1d1f; }
.bp-dl-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* 编辑弹框 */
.bp-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.bp-edit-dialog { background: #fff; border-radius: 24px; width: 100%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bp-edit-dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bp-edit-dialog-header h3 { font-size: 16px; font-weight: 800; }
.bp-edit-close { width: 32px; height: 32px; border-radius: 8px; background: #f5f5f7; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(29,29,31,0.5); transition: background 0.2s; }
.bp-edit-close:hover { background: #e8e8ed; color: #1d1d1f; }
.bp-edit-dialog-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.bp-edit-goods-name { font-size: 13px; font-weight: 700; color: #7c3aed; background: rgba(124,58,237,0.07); padding: 6px 12px; border-radius: 8px; }
.bp-edit-field { display: flex; flex-direction: column; gap: 6px; }
.bp-edit-field label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.6); }
.bp-edit-input { padding: 9px 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; transition: border-color 0.2s; flex: 1; }
.bp-edit-input-row { display: flex; gap: 8px; align-items: center; }
.bp-upload-btn { padding: 9px 12px; background: #f5f5f7; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
.bp-upload-btn:hover { background: #e8e8ed; }
.bp-edit-input:focus { border-color: #7c3aed; }
.bp-edit-textarea { padding: 9px 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; min-height: 72px; resize: vertical; transition: border-color 0.2s; }
.bp-edit-textarea:focus { border-color: #7c3aed; }
.bp-edit-preview { width: 100%; max-height: 120px; object-fit: cover; border-radius: 10px; margin-top: 4px; }
.bp-edit-carousel { display: flex; flex-direction: column; gap: 6px; }
.bp-edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bp-edit-tags { display: flex; gap: 8px; }
.bp-edit-tag-check { padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #f5f5f7; color: rgba(29,29,31,0.5); cursor: pointer; transition: all 0.2s; user-select: none; }
.bp-edit-tag-check.active { background: #7c3aed; color: #fff; }
.bp-edit-dialog-footer { display: flex; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid rgba(0,0,0,0.06); }
.bp-edit-cancel { flex: 1; padding: 12px; border-radius: 12px; background: #f5f5f7; color: rgba(29,29,31,0.6); font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; }
.bp-edit-cancel:hover { background: #e8e8ed; }
.bp-edit-save { flex: 2; padding: 12px; border-radius: 12px; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; }
.bp-edit-save:hover:not(:disabled) { background: #6d28d9; }
.bp-edit-save:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

@media (max-width: 768px) {
  .brand-products { padding: 20px; }
  .bp-grid { grid-template-columns: 1fr 1fr; }
}

.bp-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1d1d1f; color: #fff; padding: 12px 24px; border-radius: 12px;
  font-size: 14px; font-weight: 600; z-index: 9999;
  animation: bp-toast-in 0.3s ease;
}
@keyframes bp-toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
