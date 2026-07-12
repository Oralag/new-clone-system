<template>
  <div class="ws-page">

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-left">
          <p class="eyebrow">批发合作</p>
          <h1 class="hero-title">合作伙伴<br>价格手册</h1>
          <p class="hero-sub">{{ brandName }}</p>
        </div>
      </div>
    </section>

    <!-- Products -->
    <section class="products">
      <div class="products-inner">
        <div class="section-header">
          <h2>产品目录</h2>
          <p>全线产品均为自有品牌，原产蒙古草原</p>
        </div>
        <div v-if="shopStore.loading" class="loading-hint">加载中…</div>
        <div v-else-if="!wholesaleProducts.length" class="loading-hint">暂无批发商品</div>
        <div v-else class="grid">
          <article v-for="p in wholesaleProducts" :key="p.id" class="card">
            <!-- Image -->
            <div class="card-img clickable" @click="goDetail(p)">
              <img v-if="p.image" :src="p.image" :alt="p.name" referrerpolicy="no-referrer" />
              <div v-else class="img-ph">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div class="img-hover-label">查看详情</div>
            </div>

            <!-- Body -->
            <div class="card-body">
              <div class="card-head">
                <h3>{{ p.name }}</h3>
                <span class="spec">{{ p.skuVariants?.[0]?.label || '' }}</span>
              </div>
              <div v-if="p.wholesalePrice > 0" class="pricing">
                <div class="price-item featured">
                  <span class="price-label">批发价</span>
                  <span class="price-val">¥{{ p.wholesalePrice }}</span>
                </div>
                <div class="price-item muted">
                  <span class="price-label">零售价</span>
                  <span class="price-val striked">¥{{ p.price }}</span>
                </div>
              </div>
              <div v-if="p.wholesalePrice > 0 && p.price" class="card-foot">
                <span class="margin-tag">毛利 {{ margin(p.wholesalePrice, p.price) }}%</span>
                <span class="shelf-tag">最少 {{ p.minOrderQuantity }} 件起订</span>
              </div>
              <!-- Download button -->
              <button
                class="dl-all-btn"
                :disabled="downloading === p.id"
                @click="downloadProduct(p)"
              >
                <svg v-if="downloading !== p.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="spinner" v-else></span>
                {{ downloading === p.id ? '打包中…' : `打包下载（头图+详情图+SKU图）` }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <h2>开始合作</h2>
      <p>扫码联系我们，获取完整合作协议与物流方案</p>
    </section>

  </div>

</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useShopStore, type ShopProduct } from '@/stores/shopStore'
import { useBrandEditStore } from '@/stores/brandEdit'

const router = useRouter()
const shopStore = useShopStore()
const brandEdit = useBrandEditStore()

const brandName = computed(() => brandEdit.config.brandName || '')

const wholesaleProducts = computed(() => shopStore.products)

const margin = (wholesale: number, retail: number) =>
  retail > 0 ? Math.round((retail - wholesale) / retail * 100) : 0

if (!shopStore.products.length) {
  shopStore.fetchProducts()
}

function goDetail(p: ShopProduct) {
  router.push(`/brand/product/${p.erpId}`)
}

// ── Download ──────────────────────────────────────────────────────────────
const downloading = ref<string | null>(null)

function ext(url: string) {
  return (url.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] ?? 'jpg').toLowerCase()
}
async function fetchBuf(url: string): Promise<ArrayBuffer | null> {
  try { return await (await fetch(url)).arrayBuffer() } catch { return null }
}

async function downloadProduct(p: ShopProduct) {
  if (downloading.value) return
  downloading.value = p.id
  try {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    const tasks: Promise<void>[] = []

    const headerImgs = p.headerImages || []
    const detailImgs = p.detailImages || (p.detailImage ? [p.detailImage] : [])
    const skuImgs = p.skuImages || []

    headerImgs.forEach((url, i) => {
      tasks.push(fetchBuf(url).then(buf => { if (buf) zip.file(`头图/头图_${i + 1}.${ext(url)}`, buf) }))
    })
    detailImgs.forEach((url, i) => {
      tasks.push(fetchBuf(url).then(buf => { if (buf) zip.file(`详情图/详情图_${i + 1}.${ext(url)}`, buf) }))
    })
    const skuList = skuImgs.length ? skuImgs : (p.image ? [p.image] : [])
    skuList.forEach((url: string, i: number) => {
      tasks.push(fetchBuf(url).then(buf => { if (buf) zip.file(`SKU图/SKU_${i + 1}.${ext(url)}`, buf) }))
    })

    await Promise.all(tasks)
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${p.name}_素材包.zip`
    a.click()
    URL.revokeObjectURL(a.href)
  } finally {
    downloading.value = null
  }
}
</script>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ws-page {
  background: #F5F0E8;
  min-height: 100vh;
}

/* ── Hero ─────────────────────────────── */
.hero { background: #1A1E32; padding: 72px 56px 64px; }
.hero-inner {
  max-width: 1100px; margin: 0 auto;
  display: flex; align-items: flex-start; gap: 64px;
}
.hero-left { flex: 1; min-width: 0; }
.eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
  text-transform: uppercase; color: #D14B0A; margin-bottom: 20px;
}
.hero-title {
  font-size: clamp(38px, 5vw, 68px); font-weight: 900;
  color: #fff; line-height: 1.0; letter-spacing: -0.03em; margin-bottom: 18px;
}
.hero-sub { font-size: 12px; color: rgba(255,255,255,0.35); letter-spacing: 0.1em; text-transform: uppercase; }
.loading-hint { text-align: center; padding: 48px; color: rgba(26,30,50,0.4); font-size: 14px; }

/* ── Products ─────────────────────────── */
.products { padding: 64px 56px; }
.products-inner { max-width: 1100px; margin: 0 auto; }
.section-header { margin-bottom: 36px; }
.section-header h2 { font-size: 22px; font-weight: 900; color: #1A1E32; letter-spacing: -0.02em; margin-bottom: 5px; }
.section-header p { font-size: 13px; color: rgba(26,30,50,0.4); }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

/* ── Card ─────────────────────────────── */
.card {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(26,30,50,0.07), 0 4px 16px rgba(26,30,50,0.04);
  display: flex; flex-direction: column;
  transition: box-shadow 0.25s, transform 0.25s;
}
.card:hover {
  box-shadow: 0 6px 20px rgba(26,30,50,0.12), 0 16px 40px rgba(26,30,50,0.07);
  transform: translateY(-3px);
}

.card-img {
  position: relative; aspect-ratio: 1;
  overflow: hidden; background: #f7f4ef;
}
.card-img.clickable { cursor: pointer; }
.card-img img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.4s ease; }
.card:hover .card-img img { transform: scale(1.05); }

.img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(26,30,50,0.13); }
.img-ph svg { width: 40px; height: 40px; }

.img-hover-label {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(26,30,50,0.35); color: #fff;
  font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
  opacity: 0; transition: opacity 0.22s;
}
.card-img:hover .img-hover-label { opacity: 1; }

.img-count-row {
  position: absolute; bottom: 10px; left: 10px;
  display: flex; gap: 6px;
}
.img-count-badge {
  font-size: 10px; font-weight: 700;
  padding: 3px 8px; border-radius: 4px;
  background: rgba(26,30,50,0.6); color: rgba(255,255,255,0.9);
  backdrop-filter: blur(6px);
}

.card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.card-head { margin-bottom: 16px; }
.card-head h3 { font-size: 15px; font-weight: 800; color: #1A1E32; margin-bottom: 3px; letter-spacing: -0.01em; }
.spec { font-size: 12px; color: rgba(26,30,50,0.38); }

.pricing {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 1px; background: rgba(26,30,50,0.07);
  border-radius: 8px; overflow: hidden; margin-bottom: 14px;
}
.price-item { background: #fff; padding: 11px 0; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.price-item.featured { background: #fff7f4; }
.price-label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(26,30,50,0.38); }
.price-item.featured .price-label { color: #D14B0A; }
.price-val { font-size: 17px; font-weight: 900; color: #1A1E32; }
.price-item.featured .price-val { color: #D14B0A; }
.price-item.muted .price-val { font-size: 13px; font-weight: 600; color: rgba(26,30,50,0.28); text-decoration: line-through; }

.card-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 14px; border-bottom: 1px solid rgba(26,30,50,0.05);
  margin-bottom: 12px;
}
.shelf-tag { font-size: 11px; color: rgba(26,30,50,0.35); }
.margin-tag { font-size: 11px; font-weight: 700; color: #15803D; background: #f0fdf4; padding: 3px 9px; border-radius: 20px; }

.dl-all-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; padding: 10px 0; border-radius: 8px;
  background: #1A1E32; color: #fff;
  font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
  border: none; cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.dl-all-btn:hover:not(:disabled) { background: #D14B0A; }
.dl-all-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── CTA ──────────────────────────────── */
.cta { text-align: center; padding: 80px 56px; border-top: 1px solid rgba(26,30,50,0.07); }
.cta h2 { font-size: 30px; font-weight: 900; color: #1A1E32; letter-spacing: -0.02em; margin-bottom: 10px; }
.cta p { font-size: 14px; color: rgba(26,30,50,0.4); }

/* spinner */
.spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner.sm { width: 11px; height: 11px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ───────────────────────── */
@media (max-width: 960px) {
  .hero { padding: 56px 32px 48px; }
  .products { padding: 48px 32px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .hero { padding: 40px 20px 36px; }
  .products { padding: 36px 16px; }
  .grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .card-body { padding: 14px; }
  .cta { padding: 56px 20px; }
}
</style>
