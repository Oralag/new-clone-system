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
          <span class="bd-price">¥{{ shopStore.isWholesale ? product.wholesalePrice : product.price }}</span>
          <span v-if="shopStore.isWholesale" class="bd-moq-info">批发起订量：{{ product.minOrderQuantity }} 件</span>
        </div>

        <div class="bd-qty-row">
          <button class="bd-qty-btn" @click="qty = Math.max(shopStore.isWholesale ? product.minOrderQuantity : 1, qty - (shopStore.isWholesale ? product.minOrderQuantity : 1))">−</button>
          <span class="bd-qty-num">{{ qty }}</span>
          <button class="bd-qty-btn" @click="qty += shopStore.isWholesale ? product.minOrderQuantity : 1">+</button>
        </div>

        <button class="bd-add-btn" @click="addAndGo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
          加入购物车
        </button>

        <div class="bd-detail-img-wrap editable-block" style="position:relative" v-if="product.detailImage || brandEdit.editMode">
          <img v-if="product.detailImage" :src="product.detailImage" :alt="product.name + ' 详情'" class="bd-detail-img" referrerpolicy="no-referrer" />
          <div v-else-if="brandEdit.editMode" class="bd-detail-placeholder" @click="openEdit('detail')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(29,29,31,0.25)" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加详情长图</span>
          </div>
          <button v-if="brandEdit.editMode && product.detailImage" class="edit-trigger bd-edit-inline-btn" @click="openEdit('detail')" title="编辑详情图">
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
            <label class="bed-label">轮播图（最多4张）</label>
            <div v-for="(img, i) in editData.headerImages" :key="i" class="bed-input-row" style="margin-bottom:6px">
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
.bd-main-img { width: 100%; height: 100%; object-fit: cover; }
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
.bd-qty-row { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
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
.bed-tags-row { display: flex; gap: 16px; }
.bed-tag-check { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
.bed-footer { padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 10px; justify-content: flex-end; }
.bed-cancel { padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.bed-save { padding: 10px 24px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
.bed-save:disabled { opacity: 0.6; cursor: not-allowed; }
.bed-save:not(:disabled):hover { background: #6d28d9; }

@media (max-width: 768px) {
  .brand-detail { padding: 20px; }
  .bd-layout { grid-template-columns: 1fr; gap: 32px; }
}
</style>
