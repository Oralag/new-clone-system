<template>
  <!-- 模式选择遮罩 -->
  <div v-if="shopStore.shopMode === null" class="brand-mode-overlay">
    <div class="brand-mode-grid">
      <div class="brand-mode-card brand-mode-retail" @click="router.push('/brand/retail')">
        <div class="brand-mode-icon retail">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        </div>
        <h2 class="brand-mode-title">零售终端</h2>
        <p class="brand-mode-desc">沉浸式个人购物体验，探索最新单品与品牌故事。</p>
        <div class="brand-mode-cta retail-cta">
          进入商城
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
      <div class="brand-mode-card brand-mode-wholesale" @click="router.push('/brand/wholesale')">
        <div class="brand-mode-icon wholesale">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h2 class="brand-mode-title">采购商主页</h2>
        <p class="brand-mode-desc">专属批发价格，大宗采购支持，产品资料一键下载。</p>
        <div class="brand-mode-cta wholesale-cta">
          进入批发中心
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  </div>

  <!-- 品牌主页内容 -->
  <div v-else class="brand-home">

    <!-- Hero -->
    <section class="brand-hero editable-block" style="margin-top:0">
      <img :src="cfg.heroImage" alt="Brand Hero" class="brand-hero-img" referrerpolicy="no-referrer" />
      <div class="brand-hero-overlay"></div>
      <div class="brand-hero-content">
        <div class="brand-hero-label">
          <span class="brand-hero-line"></span>
          <span>{{ shopStore.shopMode === 'wholesale' ? 'Wholesale Center' : cfg.heroSubtitle }}</span>
        </div>
        <h1 class="brand-hero-title">
          <template v-if="shopStore.shopMode === 'wholesale'">
            全球<span class="text-amber">采购</span><br>合作伙伴计划
          </template>
          <template v-else>{{ cfg.heroTitle }}</template>
        </h1>
        <p class="brand-hero-desc">{{ cfg.heroDesc }}</p>
        <div class="brand-hero-btns">
          <button class="brand-btn-primary" @click="$router.push('/brand/products')">立即选购</button>
          <button class="brand-btn-ghost" @click="$router.push('/brand/story')">了解更多</button>
        </div>
      </div>
      <button class="edit-trigger" @click="openEdit('hero')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </section>

    <!-- Philosophy -->
    <section class="brand-philosophy">
      <div class="brand-philosophy-img-wrap editable-block">
        <img :src="cfg.storyImage" alt="Brand Story" class="brand-philosophy-img" referrerpolicy="no-referrer" />
        <div class="brand-philosophy-badge">
          <p class="brand-badge-num">120+</p>
          <p class="brand-badge-label">全球配送国家</p>
        </div>
        <button class="edit-trigger" @click="openEdit('story')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
      <div class="brand-philosophy-text">
        <p class="brand-section-eyebrow">Our Philosophy</p>
        <h2 class="brand-section-title">我们相信，<br>工作不应受制于地点。</h2>
        <p class="brand-section-desc">{{ cfg.storyText }}</p>
        <div class="brand-feature-list">
          <div v-for="item in philosophy" :key="item.title" class="brand-feature-item">
            <div class="brand-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <h4 class="brand-feature-title">{{ item.title }}</h4>
              <p class="brand-feature-desc">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="brand-categories">
      <div class="brand-cat-header">
        <div>
          <p class="brand-section-eyebrow">Categories</p>
          <h2 class="brand-section-title">探索我们的系列</h2>
        </div>
        <button class="brand-cat-all" @click="$router.push('/brand/products')">
          查看全部
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div class="brand-cat-grid">
        <div v-for="(cat, i) in cfg.categories" :key="cat.name" class="brand-cat-card editable-block" @click="!brandEdit.editMode && $router.push('/brand/products')">
          <img :src="cat.img" :alt="cat.name" class="brand-cat-img" referrerpolicy="no-referrer" />
          <div class="brand-cat-overlay"></div>
          <div class="brand-cat-info">
            <h3>{{ cat.name }}</h3>
          </div>
          <button class="edit-trigger" @click.stop="openEdit('cat', i)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Hot products -->
    <section class="brand-hot">
      <div class="brand-hot-inner">
        <div class="brand-hot-header">
          <h2>本季热销</h2>
          <p>全球游民社区票选出的最受欢迎单品</p>
        </div>
        <div class="brand-product-grid">
          <div v-for="product in shopStore.products.slice(0,4)" :key="product.id" class="brand-product-card" @click="goDetail(product.id)">
            <div class="brand-product-img-wrap">
              <img :src="product.image || 'https://picsum.photos/seed/placeholder/800/600'" :alt="product.name" class="brand-product-img" referrerpolicy="no-referrer" />
            </div>
            <div class="brand-product-info">
              <h3 class="brand-product-name">{{ product.name }}</h3>
              <p class="brand-product-price">
                <template v-if="shopStore.shopMode === 'wholesale'">
                  ¥{{ product.wholesalePrice }}
                  <span class="brand-product-moq">起订 {{ product.minOrderQuantity }} 件</span>
                </template>
                <template v-else>¥{{ product.price }}</template>
              </p>
              <div class="brand-product-rating">
                <svg v-for="i in 5" :key="i" width="12" height="12" viewBox="0 0 24 24" :fill="i <= Math.round(product.rating) ? '#f59e0b' : 'none'" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>{{ product.rating }}</span>
              </div>
              <button class="brand-add-btn" @click.stop="addAndGo(product)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
                加入购物车
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter -->
    <section class="brand-newsletter">
      <div class="brand-newsletter-glow"></div>
      <div class="brand-newsletter-inner">
        <svg class="brand-newsletter-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <h2>加入游牧社区</h2>
        <p>订阅我们的周报，获取最新的游牧装备资讯、旅行攻略和独家折扣。</p>
        <div v-if="!newsletterDone" class="brand-newsletter-form">
          <input v-model="newsletterEmail" type="email" placeholder="您的邮箱地址" class="brand-newsletter-input" @keyup.enter="subscribeNewsletter" />
          <button class="brand-btn-primary" @click="subscribeNewsletter">立即订阅</button>
        </div>
        <p v-else class="brand-newsletter-thanks">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          感谢订阅！我们会发送精彩内容到您的邮箱。
        </p>
      </div>
    </section>
  </div>

  <!-- 编辑弹框 -->
  <div v-if="editVisible" class="bi-edit-overlay" @click.self="editVisible = false">
    <div class="bi-edit-dialog">
      <div class="bi-edit-header">
        <h3>{{ editTitle }}</h3>
        <button class="bi-edit-close" @click="editVisible = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="bi-edit-body">
        <!-- Hero 编辑 -->
        <template v-if="editType === 'hero'">
          <div class="bi-field"><label>Hero 大图 URL</label><div class="bi-input-row"><input v-model="editData.heroImage" class="bi-input" placeholder="https://... 或点击上传" /><button class="bi-upload-btn" @click="upload(v => editData.heroImage = v)">上传</button></div><img v-if="editData.heroImage" :src="editData.heroImage" class="bi-preview" referrerpolicy="no-referrer" /></div>
          <div class="bi-field"><label>副标题标签（英文）</label><input v-model="editData.heroSubtitle" class="bi-input" placeholder="Future of Work" /></div>
          <div class="bi-field"><label>主标题</label><textarea v-model="editData.heroTitle" class="bi-textarea" placeholder="重新定义数字游民生活" rows="2"></textarea></div>
          <div class="bi-field"><label>描述文字</label><textarea v-model="editData.heroDesc" class="bi-textarea"></textarea></div>
        </template>
        <!-- 故事图编辑 -->
        <template v-if="editType === 'story'">
          <div class="bi-field"><label>品牌故事图 URL</label><div class="bi-input-row"><input v-model="editData.storyImage" class="bi-input" placeholder="https://... 或点击上传" /><button class="bi-upload-btn" @click="upload(v => editData.storyImage = v)">上传</button></div><img v-if="editData.storyImage" :src="editData.storyImage" class="bi-preview" referrerpolicy="no-referrer" /></div>
          <div class="bi-field"><label>故事简介文字</label><textarea v-model="editData.storyText" class="bi-textarea"></textarea></div>
        </template>
        <!-- 分类卡片编辑 -->
        <template v-if="editType === 'cat'">
          <div class="bi-field"><label>分类名称</label><input v-model="editData.catName" class="bi-input" /></div>
          <div class="bi-field"><label>分类图片 URL</label><div class="bi-input-row"><input v-model="editData.catImg" class="bi-input" placeholder="https://... 或点击上传" /><button class="bi-upload-btn" @click="upload(v => editData.catImg = v)">上传</button></div><img v-if="editData.catImg" :src="editData.catImg" class="bi-preview" referrerpolicy="no-referrer" /></div>
        </template>
      </div>
      <div class="bi-edit-footer">
        <button class="bi-cancel" @click="editVisible = false">取消</button>
        <button class="bi-save" @click="saveEdit">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useShopStore } from '@/stores/shopStore'
import { useBrandEditStore } from '@/stores/brandEdit'
import { useRouter } from 'vue-router'
import { useImageUpload } from '@/composables/useImageUpload'

const shopStore = useShopStore()
const brandEdit = useBrandEditStore()
const router = useRouter()
const cfg = computed(() => brandEdit.config)
const { triggerUpload } = useImageUpload()

function upload(setter: (v: string) => void) {
  triggerUpload(setter)
}

const philosophy = [
  { title: '可持续材料', desc: '我们 80% 的产品使用可回收铝材和海洋塑料。' },
  { title: '极简主义设计', desc: '去除一切冗余，只保留最核心的功能。' },
  { title: '社区驱动', desc: '每一个新产品的迭代都来自真实用户的反馈。' },
]

// 编辑弹框
const editVisible = ref(false)
const editType = ref('')
const editCatIdx = ref(0)
const editTitle = ref('')
const editData = reactive({
  heroImage: '', heroSubtitle: '', heroTitle: '', heroDesc: '',
  storyImage: '', storyText: '',
  catName: '', catImg: '',
})

function openEdit(type: string, idx?: number) {
  if (!brandEdit.editMode) return
  editType.value = type
  if (type === 'hero') {
    editTitle.value = '编辑 Hero 区域'
    editData.heroImage = cfg.value.heroImage
    editData.heroSubtitle = cfg.value.heroSubtitle
    editData.heroTitle = cfg.value.heroTitle
    editData.heroDesc = cfg.value.heroDesc
  } else if (type === 'story') {
    editTitle.value = '编辑品牌故事图'
    editData.storyImage = cfg.value.storyImage
    editData.storyText = cfg.value.storyText
  } else if (type === 'cat' && idx !== undefined) {
    editCatIdx.value = idx
    editTitle.value = `编辑分类 ${idx + 1}`
    editData.catName = cfg.value.categories[idx].name
    editData.catImg = cfg.value.categories[idx].img
  }
  editVisible.value = true
}

function saveEdit() {
  if (editType.value === 'hero') {
    brandEdit.updateConfig({
      heroImage: editData.heroImage,
      heroSubtitle: editData.heroSubtitle,
      heroTitle: editData.heroTitle,
      heroDesc: editData.heroDesc,
    })
  } else if (editType.value === 'story') {
    brandEdit.updateConfig({ storyImage: editData.storyImage, storyText: editData.storyText })
  } else if (editType.value === 'cat') {
    const cats = [...cfg.value.categories]
    cats[editCatIdx.value] = { name: editData.catName, img: editData.catImg }
    brandEdit.updateConfig({ categories: cats })
  }
  editVisible.value = false
}

const newsletterEmail = ref('')
const newsletterDone = ref(false)

function subscribeNewsletter() {
  if (!newsletterEmail.value.includes('@')) return
  // Save locally so we can prefill Settings page
  try {
    const stored = localStorage.getItem('brand_user_settings')
    const data = stored ? JSON.parse(stored) : { account: {}, prefs: {} }
    if (!data.account.email) data.account.email = newsletterEmail.value
    data.prefs.newsletter = true
    localStorage.setItem('brand_user_settings', JSON.stringify(data))
  } catch { /* ignore */ }
  newsletterDone.value = true
}

function goDetail(id: string) { router.push(`/brand/product/${id}`) }
function addAndGo(product: any) { shopStore.addToCart(product); router.push('/brand/cart') }
</script>

<style scoped>
.brand-mode-overlay { position: fixed; inset: 60px 0 0 0; z-index: 200; background: #fff; display: flex; flex-direction: column; padding: 24px; padding-bottom: calc(24px + env(safe-area-inset-bottom)); box-sizing: border-box; overflow-y: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 768px) {
  .brand-mode-overlay { inset: calc(44px + env(safe-area-inset-top, 0px)) 0 calc(50px + env(safe-area-inset-bottom, 0px)) 0; }
}
.brand-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 800px; width: 100%; overflow: hidden; border-radius: 20px; align-self: stretch; }
.brand-mode-card { padding: 48px; border-radius: 32px; border: 2px solid transparent; cursor: pointer; transition: all 0.4s cubic-bezier(0.23,1,0.32,1); display: flex; flex-direction: column; align-items: center; text-align: center; }
.brand-mode-retail { background: #f5f5f7; }
.brand-mode-wholesale { background: #fffbf0; }
.brand-mode-card:hover { transform: translateY(-8px); box-shadow: 0 40px 80px rgba(0,0,0,0.1); }
.brand-mode-retail:hover { border-color: #0071e3; }
.brand-mode-wholesale:hover { border-color: #f59e0b; }
.brand-mode-icon { width: 96px; height: 96px; border-radius: 28px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; transition: transform 0.4s; }
.brand-mode-card:hover .brand-mode-icon { transform: rotate(6deg); }
.retail { background: #0071e3; box-shadow: 0 20px 40px rgba(0,113,227,0.3); }
.wholesale { background: #f59e0b; box-shadow: 0 20px 40px rgba(245,158,11,0.3); }
.brand-mode-title { font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.02em; }
.brand-mode-desc { font-size: 15px; color: rgba(29,29,31,0.5); line-height: 1.6; margin-bottom: 32px; }
.brand-mode-cta { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
.retail-cta { color: #0071e3; }
.wholesale-cta { color: #d97706; }
@media (max-width: 600px) { .brand-mode-grid { grid-template-columns: 1fr !important; grid-template-rows: auto auto; flex: 1; min-height: 0; width: 100%; } }
@media (max-width: 768px) {
  .brand-mode-overlay { inset: calc(44px + env(safe-area-inset-top, 0px)) 0 calc(50px + env(safe-area-inset-bottom, 0px)) 0; padding: 12px; overflow: hidden; display: flex; flex-direction: column; }
  .brand-mode-grid { grid-template-columns: 1fr !important; gap: 10px; border-radius: 14px; max-width: none; flex: 1; min-height: 0; width: 100%; align-content: center; }
  .brand-mode-card { aspect-ratio: 1; width: 100%; }
  .brand-mode-card { padding: 16px; border-radius: 14px; flex: 1; min-height: 0; overflow-y: visible; align-items: center; }
  .brand-mode-card:first-child { border-radius: 14px; }
  .brand-mode-card:last-child { border-radius: 14px; }
  .brand-mode-icon { width: 56px; height: 56px; border-radius: 16px; margin-bottom: 10px; }
  .brand-mode-icon svg { width: 28px; height: 28px; }
  .brand-mode-title { font-size: 15px; margin-bottom: 4px; }
  .brand-mode-desc { font-size: 11px; margin-bottom: 10px; }
}

.brand-home { background: #fff; }
.brand-hero { position: relative; height: 620px; border-radius: 32px; overflow: hidden; margin: 24px; box-shadow: 0 40px 80px rgba(0,0,0,0.15); }
.brand-hero-img { width: 100%; height: 100%; object-fit: cover; transition: transform 3s ease-out; }
.brand-hero:hover .brand-hero-img { transform: scale(1.05); }
.brand-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,113,227,0.1) 60%, transparent 100%); }
.brand-hero-content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 60px; }
.brand-hero-label { display: flex; align-items: center; gap: 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.25em; color: #0071e3; text-transform: uppercase; margin-bottom: 20px; }
.brand-hero-line { width: 40px; height: 1px; background: rgba(0,113,227,0.6); }
.brand-hero-title { font-size: clamp(36px, 5vw, 60px); font-weight: 800; color: #fff; line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 20px; white-space: pre-line; }
.text-amber { color: #f59e0b; }
.text-blue { color: #60a5fa; }
.brand-hero-desc { font-size: 16px; color: rgba(255,255,255,0.75); max-width: 480px; line-height: 1.7; margin-bottom: 32px; border-left: 2px solid rgba(0,113,227,0.5); padding-left: 20px; }
.brand-hero-btns { display: flex; gap: 16px; flex-wrap: wrap; }
.brand-btn-primary { padding: 14px 32px; background: #0071e3; color: #fff; border-radius: 999px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 30px rgba(0,113,227,0.3); }
.brand-btn-primary:hover { background: rgba(0,113,227,0.85); transform: scale(1.02); }
.brand-btn-ghost { padding: 14px 32px; background: rgba(255,255,255,0.12); color: #fff; border-radius: 999px; font-size: 14px; font-weight: 700; border: 1px solid rgba(255,255,255,0.25); cursor: pointer; transition: all 0.3s; backdrop-filter: blur(8px); }
.brand-btn-ghost:hover { background: rgba(255,255,255,0.2); }

.brand-philosophy { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; padding: 80px 48px; max-width: 1200px; margin: 0 auto; }
.brand-philosophy-img-wrap { position: relative; border-radius: 36px; overflow: hidden; aspect-ratio: 1; }
.brand-philosophy-img { width: 100%; height: 100%; object-fit: cover; }
.brand-philosophy-badge { position: absolute; top: 24px; left: 24px; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); padding: 16px 20px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.brand-badge-num { font-size: 32px; font-weight: 800; color: #0071e3; line-height: 1; }
.brand-badge-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(29,29,31,0.4); margin-top: 4px; }
.brand-section-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #0071e3; margin-bottom: 16px; }
.brand-section-title { font-size: clamp(28px,3.5vw,48px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 20px; }
.brand-section-desc { font-size: 16px; color: rgba(29,29,31,0.45); line-height: 1.7; margin-bottom: 28px; }
.brand-feature-list { display: flex; flex-direction: column; gap: 20px; }
.brand-feature-item { display: flex; gap: 16px; align-items: flex-start; }
.brand-feature-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(0,113,227,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.brand-feature-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.brand-feature-desc { font-size: 13px; color: rgba(29,29,31,0.45); line-height: 1.5; }

.brand-categories { padding: 60px 48px; max-width: 1200px; margin: 0 auto; }
.brand-cat-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.brand-cat-all { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: rgba(29,29,31,0.4); background: none; border: none; cursor: pointer; transition: color 0.2s; }
.brand-cat-all:hover { color: #0071e3; }
.brand-cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.brand-cat-card { position: relative; height: 360px; border-radius: 28px; overflow: hidden; cursor: pointer; }
.brand-cat-img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s ease; }
.brand-cat-card:hover .brand-cat-img { transform: scale(1.1); }
.brand-cat-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.2); transition: background 0.3s; }
.brand-cat-card:hover .brand-cat-overlay { background: rgba(0,0,0,0.4); }
.brand-cat-info { position: absolute; bottom: 24px; left: 24px; color: #fff; }
.brand-cat-info h3 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }

.brand-hot { background: #f5f5f7; padding: 80px 0; }
.brand-hot-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
.brand-hot-header { text-align: center; margin-bottom: 48px; }
.brand-hot-header h2 { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
.brand-hot-header p { font-size: 15px; color: rgba(29,29,31,0.45); }
.brand-product-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
.brand-product-card { background: #fff; border-radius: 24px; overflow: hidden; cursor: pointer; transition: all 0.4s cubic-bezier(0.23,1,0.32,1); border: 1px solid rgba(0,0,0,0.05); }
.brand-product-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
.brand-product-img-wrap { aspect-ratio: 4/3; overflow: hidden; }
.brand-product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease; }
.brand-product-card:hover .brand-product-img { transform: scale(1.08); }
.brand-product-info { padding: 16px; }
.brand-product-name { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
.brand-product-price { font-size: 16px; font-weight: 800; color: #0071e3; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
.brand-product-moq { font-size: 10px; font-weight: 600; color: #d97706; background: rgba(245,158,11,0.1); padding: 2px 7px; border-radius: 999px; }
.brand-product-rating { display: flex; align-items: center; gap: 4px; margin-bottom: 10px; }
.brand-product-rating span { font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.4); }
.brand-add-btn { width: 100%; padding: 10px; border-radius: 12px; background: #1d1d1f; color: #fff; font-size: 12px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; }
.brand-add-btn:hover { background: #0071e3; }

.brand-newsletter { background: #1d1d1f; padding: 80px 48px; text-align: center; position: relative; overflow: hidden; margin: 40px 48px; border-radius: 40px; }
.brand-newsletter-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; height: 500px; background: #0071e3; border-radius: 50%; opacity: 0.08; filter: blur(80px); pointer-events: none; }
.brand-newsletter-inner { position: relative; z-index: 1; max-width: 560px; margin: 0 auto; }
.brand-newsletter-icon { margin: 0 auto 24px; display: block; }
.brand-newsletter-inner h2 { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 12px; }
.brand-newsletter-inner p { font-size: 15px; color: rgba(255,255,255,0.4); line-height: 1.7; margin-bottom: 32px; }
.brand-newsletter-form { display: flex; gap: 12px; }
.brand-newsletter-input { flex: 1; padding: 14px 20px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 999px; color: #fff; font-size: 14px; outline: none; }
.brand-newsletter-input::placeholder { color: rgba(255,255,255,0.35); }
.brand-newsletter-input:focus { border-color: #0071e3; }
.brand-newsletter-thanks { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.9); margin-top: 8px; }

/* 编辑弹框 */
.bi-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.bi-edit-dialog { background: #fff; border-radius: 24px; width: 100%; max-width: 500px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bi-edit-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bi-edit-header h3 { font-size: 16px; font-weight: 800; }
.bi-edit-close { width: 32px; height: 32px; border-radius: 8px; background: #f5f5f7; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(29,29,31,0.5); }
.bi-edit-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.bi-field { display: flex; flex-direction: column; gap: 6px; }
.bi-field label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.6); }
.bi-input { padding: 9px 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; transition: border-color 0.2s; flex: 1; }
.bi-input:focus { border-color: #7c3aed; }
.bi-input-row { display: flex; gap: 8px; align-items: center; }
.bi-upload-btn { padding: 9px 14px; background: #f5f5f7; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
.bi-upload-btn:hover { background: #e8e8ed; }
.bi-textarea { padding: 9px 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; min-height: 80px; resize: vertical; }
.bi-textarea:focus { border-color: #7c3aed; }
.bi-preview { width: 100%; max-height: 120px; object-fit: cover; border-radius: 10px; margin-top: 4px; }
.bi-edit-footer { display: flex; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid rgba(0,0,0,0.06); }
.bi-cancel { flex: 1; padding: 12px; border-radius: 12px; background: #f5f5f7; color: rgba(29,29,31,0.6); font-size: 14px; font-weight: 700; border: none; cursor: pointer; }
.bi-save { flex: 2; padding: 12px; border-radius: 12px; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 700; border: none; cursor: pointer; }
.bi-save:hover { background: #6d28d9; }

@media (max-width: 900px) {
  .brand-philosophy { grid-template-columns: 1fr; padding: 48px 24px; }
  .brand-cat-grid { grid-template-columns: 1fr 1fr; }
  .brand-product-grid { grid-template-columns: 1fr 1fr; }
  .brand-categories, .brand-hot-inner { padding: 40px 24px; }
  .brand-hero { margin: 12px; height: 480px; }
  .brand-newsletter { margin: 24px; padding: 48px 24px; }
}

@media (max-width: 768px) {
  .brand-hero { height: auto; min-height: 400px; padding: 40px 20px; }
  .brand-hero-inner { padding: 0; }
  .brand-hero-title { font-size: 28px; }
  .brand-hero-subtitle { font-size: 15px; }
  .brand-hero-desc { font-size: 14px; }
  .brand-hero-actions { flex-direction: column; gap: 10px; }
  .brand-hero-btn { width: 100%; justify-content: center; }
  
  .brand-cat-grid { grid-template-columns: 1fr; }
  .brand-product-grid { grid-template-columns: 1fr 1fr; }
  .brand-mode-grid { grid-template-columns: 1fr !important; flex: 1; min-height: 0; width: 100%; align-content: center; }
  
  .brand-philosophy { padding: 32px 16px; }
  .bp-card { padding: 24px; }
  .bp-title { font-size: 20px; }
  
  .brand-categories, .brand-hot-inner { padding: 32px 16px; }
  .bc-header { flex-direction: column; gap: 12px; }
  .bc-title { font-size: 22px; }
  
  .brand-newsletter { margin: 16px; padding: 32px 20px; }
  .bn-title { font-size: 22px; }
  .bn-form { flex-direction: column; }
  .bn-input { border-radius: 12px; }
  .bn-btn { border-radius: 12px; padding: 14px; }
}

@media (max-width: 480px) {
  .brand-hero-title { font-size: 24px; }
  .brand-hero-subtitle { font-size: 14px; }
  .bc-title, .bp-title, .bn-title { font-size: 20px; }
}
</style>
