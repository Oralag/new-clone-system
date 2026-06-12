<template>
  <div class="brand-detail" v-if="product" :class="{ 'edit-mode-active': brandEdit.editMode }">
    <button class="bd-back" @click="$router.back()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      返回
    </button>

    <div class="bd-layout">
      <!-- 图片区 -->
      <div class="bd-images editable-block" style="position:relative">
        <div class="bd-main-img-wrap">
          <img :src="activeImg || product.image" :alt="product.name" class="bd-main-img" referrerpolicy="no-referrer" />
        </div>
        <div class="bd-thumbs" v-if="product.headerImages?.length">
          <img
            v-for="(img, i) in product.headerImages"
            :key="i"
            :src="img"
            :class="['bd-thumb', { active: activeImg === img }]"
            @click="activeImg = img"
            referrerpolicy="no-referrer"
          />
        </div>
        <button v-if="brandEdit.editMode" class="edit-trigger bd-edit-img-btn" @click="openEdit('images')" title="编辑图片">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          编辑图片
        </button>

        <!-- 桌面端评价（在左侧主图下方，移动端隐藏） -->
        <div class="bd-reviews-desktop" v-if="brandEdit.config.reviews?.length">
          <div class="bd-reviews-header">
            <span class="bd-reviews-title">用户评价</span>
            <button class="bd-reviews-more-btn" @click="$router.push('/brand/reviews')">
              全部评价
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div class="bd-review-card" v-for="r in brandEdit.config.reviews" :key="r.id">
            <div class="bd-review-top">
              <div class="bd-review-avatar">
                <img v-if="r.avatar" :src="r.avatar" :alt="r.userName" referrerpolicy="no-referrer" />
                <span v-else>{{ r.userName?.charAt(0) }}</span>
              </div>
              <div class="bd-review-meta">
                <span class="bd-review-name">{{ r.userName }}</span>
                <span class="bd-review-date">{{ r.date }}</span>
              </div>
              <div class="bd-review-stars">
                <svg v-for="i in 5" :key="i" width="12" height="12" viewBox="0 0 24 24"
                  :fill="i <= r.rating ? '#f59e0b' : 'none'" stroke="#f59e0b" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
            </div>
            <p class="bd-review-comment">{{ r.comment }}</p>
          </div>
        </div>
      </div>

      <!-- 信息区 -->
      <div class="bd-info">
        <div class="bd-badges">
          <span class="bd-badge blue">{{ product.category }}</span>
          <span v-if="shopStore.isWholesale" class="bd-badge amber">采购商模式</span>
        </div>
        <h1 class="bd-name">{{ product.name }}</h1>
        <p class="bd-desc editable-block" style="position:relative">
          {{ product.description }}
          <button v-if="brandEdit.editMode" class="edit-trigger bd-edit-inline-btn" @click="openEdit('info')" title="编辑信息">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            编辑
          </button>
        </p>

        <div class="bd-rating">
          <svg v-for="i in 5" :key="i" width="16" height="16" viewBox="0 0 24 24"
            :fill="i <= Math.round(product.rating) ? '#f59e0b' : 'none'"
            stroke="#f59e0b" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>{{ product.rating }}</span>
          <span class="bd-reviews">({{ product.reviewsCount }} 条评价)</span>
        </div>

        <div class="bd-price-block">
          <span class="bd-price">¥{{ displayPrice }}</span>
        </div>

        <!-- 规格选择：有 skuVariants 时显示文字+价格芯片，否则显示白底图缩略图 -->
        <div class="bd-sku-section" v-if="skuVariants.length || skuImageList.length">
          <div class="bd-field-label">规格</div>
          <!-- 文字规格芯片（优先） -->
          <div v-if="skuVariants.length" class="bd-sku-chips">
            <div
              v-for="(v, i) in skuVariants"
              :key="i"
              :class="['bd-sku-chip', { active: selectedSku === i }]"
              @click="selectedSku = i; if (skuImageList[i]) activeImg = skuImageList[i]"
            >
              <span class="bd-chip-label">{{ v.label }}</span>
              <span class="bd-chip-price">¥{{ v.price }}</span>
            </div>
          </div>
          <!-- 纯图片规格（无 skuVariants 时） -->
          <div v-else class="bd-sku-grid">
            <div
              v-for="(img, i) in skuImageList"
              :key="i"
              :class="['bd-sku-item', { active: selectedSku === i }]"
              @click="selectedSku = i; activeImg = img"
            >
              <img :src="img" :alt="product.name" referrerpolicy="no-referrer" />
            </div>
          </div>
        </div>

        <div class="bd-qty-row">
          <span class="bd-field-label">数量</span>
          <button class="bd-qty-btn" @click="qty = Math.max(shopStore.isWholesale ? product.minOrderQuantity : 1, qty - (shopStore.isWholesale ? product.minOrderQuantity : 1))">−</button>
          <span class="bd-qty-num">{{ qty }}</span>
          <button class="bd-qty-btn" @click="qty += shopStore.isWholesale ? product.minOrderQuantity : 1">+</button>
        </div>

        <button class="bd-add-btn" @click="addAndGo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
          加入购物车
        </button>

        <!-- 移动端评价预览（桌面隐藏） -->
        <div class="bd-reviews-mobile" v-if="brandEdit.config.reviews?.length">
          <div class="bd-reviews-mobile-header">
            <span class="bd-reviews-title">用户评价</span>
            <button class="bd-reviews-more-btn" @click="$router.push('/brand/reviews')">
              查看更多
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div class="bd-review-card" v-for="r in brandEdit.config.reviews.slice(0, 3)" :key="r.id">
            <div class="bd-review-top">
              <div class="bd-review-avatar">
                <img v-if="r.avatar" :src="r.avatar" :alt="r.userName" referrerpolicy="no-referrer" />
                <span v-else>{{ r.userName?.charAt(0) }}</span>
              </div>
              <div class="bd-review-meta">
                <span class="bd-review-name">{{ r.userName }}</span>
                <span class="bd-review-date">{{ r.date }}</span>
              </div>
              <div class="bd-review-stars">
                <svg v-for="i in 5" :key="i" width="12" height="12" viewBox="0 0 24 24"
                  :fill="i <= r.rating ? '#f59e0b' : 'none'" stroke="#f59e0b" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
            </div>
            <p class="bd-review-comment">{{ r.comment }}</p>
          </div>
        </div>

        <!-- 详情图：多张切片竖排拼成长图效果 -->
        <div class="bd-detail-img-wrap editable-block" style="position:relative"
          v-if="detailImageList.length > 0 || brandEdit.editMode">
          <template v-if="detailImageList.length > 0">
            <img
              v-for="(src, i) in detailImageList"
              :key="i"
              :src="src"
              :alt="product.name + ' 详情'"
              class="bd-detail-img"
              referrerpolicy="no-referrer"
            />
          </template>
          <div v-else-if="brandEdit.editMode" class="bd-detail-placeholder" @click="openEdit('detail')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(29,29,31,0.25)" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加详情长图</span>
          </div>
          <button v-if="brandEdit.editMode && detailImageList.length > 0" class="edit-trigger bd-edit-inline-btn" @click="openEdit('detail')" title="编辑详情图">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            编辑详情图
          </button>
        </div>

      </div>
    </div>


    <!-- 编辑弹窗 -->
    <div v-if="editVisible" class="brand-edit-overlay" @click.self="editVisible = false">
      <div class="brand-edit-dialog">
        <div class="bed-header">
          <span class="bed-title">{{ editTitle }}</span>
          <button class="bed-close" @click="editVisible = false">✕</button>
        </div>
        <div class="bed-body">
          <!-- 图片编辑 -->
          <template v-if="editType === 'images'">
            <label class="bed-label">主图</label>
            <div class="bed-input-row">
              <input v-model="editData.image" type="url" class="bed-input" placeholder="https://... 或点击上传" />
              <button class="bed-upload-btn" @click="upload(v => { editData.image = v; activeImg = v })">上传</button>
            </div>
            <img v-if="editData.image" :src="editData.image" class="bed-preview-img" referrerpolicy="no-referrer" />
            <label class="bed-label">轮播图（最多4张，可拖拽排序）</label>
            <div
              v-for="(img, i) in editData.headerImages"
              :key="i"
              class="bed-input-row bed-carousel-row"
              style="margin-bottom:6px"
              draggable="true"
              @dragstart="carouselDragStart(i)"
              @dragenter.prevent="carouselDragEnter(i)"
              @dragend="carouselDragEnd"
              @dragover.prevent
              :class="{ 'bed-drag-over': carouselDragOver === i }"
            >
              <span class="bed-drag-handle" title="拖拽排序">⠿</span>
              <input v-model="editData.headerImages[i]" type="url" class="bed-input" :placeholder="`第 ${i+1} 张`" />
              <button class="bed-upload-btn" @click="upload(v => editData.headerImages[i] = v)">上传</button>
            </div>
          </template>
          <!-- 信息编辑 -->
          <template v-else-if="editType === 'info'">
            <label class="bed-label">商品描述</label>
            <textarea v-model="editData.description" class="bed-textarea" rows="4"></textarea>
            <label class="bed-label">评分 (1-5)</label>
            <input v-model.number="editData.rating" type="number" min="1" max="5" step="0.1" class="bed-input" />
            <label class="bed-label">评价数</label>
            <input v-model.number="editData.reviewsCount" type="number" min="0" class="bed-input" />
            <label class="bed-label">零售价</label>
            <input v-model.number="editData.price" type="number" min="0" class="bed-input" />
            <label class="bed-label">批发价</label>
            <input v-model.number="editData.wholesalePrice" type="number" min="0" class="bed-input" />
            <label class="bed-label">最小批发量</label>
            <input v-model.number="editData.minOrderQuantity" type="number" min="1" class="bed-input" />
            <label class="bed-label">标签</label>
            <div class="bed-tags-row">
              <label v-for="tag in ['new','hot','sale']" :key="tag" class="bed-tag-check">
                <input type="checkbox" :value="tag" v-model="editData.tags" /> {{ tag }}
              </label>
            </div>
          </template>
          <!-- 详情图 -->
          <template v-else-if="editType === 'detail'">
            <label class="bed-label">详情长图</label>
            <div class="bed-input-row">
              <input v-model="editData.detailImage" type="url" class="bed-input" placeholder="https://... 或点击上传" />
              <button class="bed-upload-btn" @click="upload(v => editData.detailImage = v)">上传</button>
            </div>
            <img v-if="editData.detailImage" :src="editData.detailImage" class="bed-preview-img" style="max-height:200px" referrerpolicy="no-referrer" />
          </template>
        </div>
        <div class="bed-footer">
          <button class="bed-cancel" @click="editVisible = false">取消</button>
          <button class="bed-save" @click="saveEdit" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="bd-notfound">产品不存在</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShopStore } from '@/stores/shopStore'
import { useBrandEditStore } from '@/stores/brandEdit'
import { useImageUpload } from '@/composables/useImageUpload'

const shopStore = useShopStore()
const brandEdit = useBrandEditStore()
const { triggerUpload } = useImageUpload()
function upload(setter: (v: string) => void) { triggerUpload(setter) }

const route = useRoute()
const router = useRouter()

const product = computed(() => shopStore.products.find(p => p.id === route.params.id))
const activeImg = ref('')
const qty = ref(1)
const selectedSku = ref(0)

// SKU 白底图列表
const skuImageList = computed(() => (product.value as any)?.skuImages ?? [])
// 规格变体列表
const skuVariants = computed(() => (product.value as any)?.skuVariants ?? [])
// 当前选中规格的价格（无规格时用商品零售价）
const displayPrice = computed(() => {
  const v = skuVariants.value[selectedSku.value]
  return v ? v.price : (product.value?.price ?? 0)
})

// 详情图列表：优先用 detailImages 数组，兼容旧的单张 detailImage
const detailImageList = computed(() => {
  const p = product.value
  if (!p) return []
  if ((p as any).detailImages?.length) return (p as any).detailImages as string[]
  if (p.detailImage) return [p.detailImage]
  return []
})

// 当产品数据加载完成后初始化
watch(product, (p) => {
  if (p && !activeImg.value) {
    activeImg.value = p.headerImages?.[0] || p.image || ''
    qty.value = shopStore.isWholesale ? (p.minOrderQuantity || 1) : 1
  }
}, { immediate: true })

// 编辑状态
const editVisible = ref(false)
const editType = ref('')
const editData = ref<any>({})
const saving = ref(false)

// 轮播图拖拽排序
const carouselDragIdx = ref<number | null>(null)
const carouselDragOver = ref<number | null>(null)

function carouselDragStart(i: number) { carouselDragIdx.value = i }
function carouselDragEnter(i: number) { carouselDragOver.value = i }
function carouselDragEnd() {
  const from = carouselDragIdx.value
  const to = carouselDragOver.value
  if (from !== null && to !== null && from !== to) {
    const arr = [...editData.value.headerImages]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    editData.value.headerImages = arr
  }
  carouselDragIdx.value = null
  carouselDragOver.value = null
}

const editTitle = computed(() => {
  const map: Record<string, string> = { images: '编辑商品图片', info: '编辑商品信息', detail: '编辑详情长图' }
  return map[editType.value] || '编辑'
})

function openEdit(type: string) {
  if (!brandEdit.editMode || !product.value) return
  editType.value = type
  if (type === 'images') {
    editData.value = {
      image: product.value.image,
      headerImages: product.value.headerImages?.length
        ? [...product.value.headerImages]
        : ['', '', '', ''],
    }
  } else if (type === 'info') {
    editData.value = {
      description: product.value.description,
      rating: product.value.rating,
      reviewsCount: product.value.reviewsCount,
      price: product.value.price,
      wholesalePrice: product.value.wholesalePrice,
      minOrderQuantity: product.value.minOrderQuantity,
      tags: [...(product.value.tags || [])],
    }
  } else if (type === 'detail') {
    editData.value = { detailImage: product.value.detailImage || '' }
  }
  editVisible.value = true
}

async function saveEdit() {
  if (!product.value) return
  saving.value = true
  try {
    const patch: any = {}
    if (editType.value === 'images') {
      patch.image = editData.value.image
      patch.headerImages = editData.value.headerImages.filter((s: string) => s.trim())
      activeImg.value = patch.image || activeImg.value
    } else if (editType.value === 'info') {
      Object.assign(patch, editData.value)
    } else if (editType.value === 'detail') {
      patch.detailImage = editData.value.detailImage
    }
    await shopStore.saveBrandFields(product.value.erpId, patch)
    editVisible.value = false
  } finally {
    saving.value = false
  }
}

function addAndGo() {
  if (!product.value) return
  const ws = shopStore.isWholesale
  const existing = shopStore.cart.find(i => i.id === product.value!.id && i.isWholesale === ws)
  if (existing) {
    existing.quantity += qty.value
  } else {
    shopStore.cart.push({ ...product.value, quantity: qty.value, isWholesale: ws })
  }
  router.push('/brand/cart')
}
</script>

<style scoped>
.brand-detail { padding: 24px 48px 80px; max-width: 1200px; }
.bd-back {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: rgba(29,29,31,0.5);
  background: none; border: none; cursor: pointer; margin-bottom: 32px;
  transition: color 0.2s;
}
.bd-back:hover { color: #0071e3; }
.bd-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
.bd-main-img-wrap { border-radius: 28px; overflow: hidden; aspect-ratio: 1; background: #f5f5f7; }
.bd-main-img { width: 100%; height: 100%; object-fit: contain; }
.bd-thumbs { display: flex; gap: 10px; margin-top: 12px; }
.bd-thumb { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
.bd-thumb.active { border-color: #0071e3; }
.bd-badges { display: flex; gap: 8px; margin-bottom: 16px; }
.bd-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 999px; }
.bd-badge.blue { background: rgba(0,113,227,0.1); color: #0071e3; }
.bd-badge.amber { background: rgba(245,158,11,0.1); color: #d97706; }
.bd-name { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 12px; }
.bd-desc { font-size: 16px; color: rgba(29,29,31,0.55); line-height: 1.7; margin-bottom: 20px; }
.bd-rating { display: flex; align-items: center; gap: 5px; margin-bottom: 24px; }
.bd-rating span { font-size: 13px; font-weight: 700; }
.bd-reviews { color: rgba(29,29,31,0.4) !important; font-weight: 400 !important; }
.bd-price-block { margin-bottom: 24px; }
.bd-price { font-size: 40px; font-weight: 800; color: #0071e3; }
.bd-moq-info { display: block; font-size: 12px; color: #d97706; font-weight: 600; margin-top: 6px; }
.bd-qty-row { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.bd-qty-btn { width: 40px; height: 40px; border-radius: 12px; background: #f5f5f7; border: none; cursor: pointer; font-size: 20px; font-weight: 700; transition: background 0.2s; }
.bd-qty-btn:hover { background: #e8e8ed; }
.bd-qty-num { font-size: 20px; font-weight: 800; min-width: 32px; text-align: center; }
.bd-add-btn {
  width: 100%; padding: 16px; border-radius: 16px;
  background: #1d1d1f; color: #fff; font-size: 16px; font-weight: 700;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: background 0.2s; margin-bottom: 32px;
}
.bd-add-btn:hover { background: #0071e3; }
.bd-detail-img-wrap { border-radius: 24px; overflow: hidden; margin-top: 20px; }
.bd-detail-img { width: 100%; display: block; }
.bd-detail-placeholder {
  border: 2px dashed rgba(124,58,237,0.25); border-radius: 24px; padding: 40px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; cursor: pointer; color: rgba(29,29,31,0.35); font-size: 14px; font-weight: 600;
  min-height: 120px; transition: border-color 0.2s;
}
.bd-detail-placeholder:hover { border-color: #7c3aed; color: #7c3aed; }
.bd-notfound { padding: 80px; text-align: center; color: rgba(29,29,31,0.4); font-size: 18px; }

/* 编辑触发按钮 */
.bd-edit-img-btn {
  position: absolute; bottom: 12px; right: 12px;
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; background: rgba(0,0,0,0.65); color: #fff;
  border: none; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer;
  backdrop-filter: blur(8px); transition: background 0.2s;
}
.bd-edit-img-btn:hover { background: #7c3aed; }
.bd-edit-inline-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; background: rgba(124,58,237,0.1); color: #7c3aed;
  border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;
  margin-left: 8px; vertical-align: middle; transition: background 0.2s;
}
.bd-edit-inline-btn:hover { background: rgba(124,58,237,0.2); }

/* 编辑弹窗 */
.brand-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.brand-edit-dialog { background: #fff; border-radius: 20px; width: 480px; max-width: 95vw; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bed-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bed-title { font-size: 16px; font-weight: 700; }
.bed-close { background: none; border: none; cursor: pointer; font-size: 18px; color: rgba(29,29,31,0.4); }
.bed-body { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.bed-label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.5); text-transform: uppercase; letter-spacing: 0.05em; }
.bed-input { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; flex: 1; }
.bed-input:focus { border-color: #7c3aed; }
.bed-input-row { display: flex; gap: 8px; align-items: center; }
.bed-upload-btn { padding: 10px 14px; background: #f5f5f7; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.bed-upload-btn:hover { background: #e8e8ed; }
.bed-textarea { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; resize: vertical; font-family: inherit; }
.bed-textarea:focus { border-color: #7c3aed; }
.bed-preview-img { width: 100%; height: 120px; object-fit: cover; border-radius: 10px; }
.bed-carousel-row { cursor: default; border-radius: 8px; transition: background 0.15s; }
.bed-carousel-row.bed-drag-over { background: rgba(124,58,237,0.08); outline: 2px dashed rgba(124,58,237,0.4); }
.bed-drag-handle { font-size: 16px; color: rgba(29,29,31,0.3); cursor: grab; padding: 0 4px; flex-shrink: 0; user-select: none; }
.bed-drag-handle:active { cursor: grabbing; }
.bed-tags-row { display: flex; gap: 16px; }
.bed-tag-check { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
.bed-footer { padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 10px; justify-content: flex-end; }
.bed-cancel { padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.bed-save { padding: 10px 24px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
.bed-save:disabled { opacity: 0.6; cursor: not-allowed; }
.bed-save:not(:disabled):hover { background: #6d28d9; }

/* 规格/数量标签 */
.bd-field-label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.45); letter-spacing: 0.04em; margin-bottom: 10px; display: block; }
.bd-qty-row .bd-field-label { margin-bottom: 0; margin-right: 4px; flex-shrink: 0; }

/* SKU 规格选择 */
.bd-sku-section { margin-bottom: 20px; }
.bd-sku-grid { display: flex; gap: 10px; flex-wrap: wrap; }
.bd-sku-item {
  width: 72px; height: 72px; border-radius: 14px; overflow: hidden;
  border: 2px solid transparent; cursor: pointer; background: #f5f5f7;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.bd-sku-item img { width: 100%; height: 100%; object-fit: contain; }
.bd-sku-item:hover { border-color: rgba(0,113,227,0.4); }
.bd-sku-item.active { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0,113,227,0.15); }
/* 文字规格芯片 */
.bd-sku-chips { display: flex; gap: 10px; flex-wrap: wrap; }
.bd-sku-chip {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 10px 18px; border-radius: 14px; border: 2px solid rgba(0,0,0,0.1);
  cursor: pointer; background: #f5f5f7; gap: 3px;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; min-width: 72px;
}
.bd-sku-chip:hover { border-color: rgba(0,113,227,0.4); background: #f0f6ff; }
.bd-sku-chip.active { border-color: #0071e3; background: rgba(0,113,227,0.07); box-shadow: 0 0 0 3px rgba(0,113,227,0.15); }
.bd-chip-label { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.bd-chip-price { font-size: 12px; font-weight: 600; color: #0071e3; }

/* 移动端评价预览（默认隐藏，768px以下显示） */
.bd-reviews-mobile { display: none; margin-bottom: 32px; }
.bd-reviews-mobile-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }

/* 桌面端左列评价（主图下方，移动端隐藏） */
.bd-reviews-desktop { margin-top: 28px; }
.bd-reviews-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.bd-reviews-title { font-size: 14px; font-weight: 800; letter-spacing: -0.01em; }
.bd-reviews-more-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: #0071e3;
  background: none; border: none; cursor: pointer; padding: 0;
}
.bd-review-card { padding: 13px 0; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bd-review-card:last-child { border-bottom: none; }
.bd-review-top { display: flex; align-items: center; gap: 9px; margin-bottom: 7px; }
.bd-review-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #0071e3);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; overflow: hidden;
}
.bd-review-avatar img { width: 100%; height: 100%; object-fit: cover; }
.bd-review-meta { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.bd-review-name { font-size: 12px; font-weight: 700; }
.bd-review-date { font-size: 10px; color: rgba(29,29,31,0.4); }
.bd-review-stars { display: flex; gap: 2px; }
.bd-review-comment { font-size: 12px; color: rgba(29,29,31,0.6); line-height: 1.6; }

@media (max-width: 768px) {
  .brand-detail { padding: 20px; }
  .bd-layout { grid-template-columns: 1fr; gap: 32px; }
  .bd-reviews-mobile { display: block; }
  .bd-reviews-desktop { display: none; }
}
</style>
