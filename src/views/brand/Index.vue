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
    <!-- 手机端同步小程序首页 -->
    <div class="brand-mini-home">
      <section class="mini-hero editable-block">
        <div class="mini-hero-bg-wrap" @click="openEdit('hero')">
          <img :src="heroImagesList[0] || cfg.heroImage" alt="Brand Hero" class="mini-hero-bg" referrerpolicy="no-referrer" />
        </div>
        <div class="mini-hero-mask"></div>
        <div class="mini-shelf">
          <div class="mini-shelf-scroll">
            <div class="mini-shelf-row">
              <div
                v-for="product in shopStore.products.slice(0, 8)"
                :key="product.id"
                class="mini-shelf-card"
                @click="goDetail(product.id)"
              >
                <img :src="product.image || 'https://picsum.photos/seed/placeholder/400/400'" :alt="product.name" class="mini-shelf-thumb" referrerpolicy="no-referrer" />
                <div class="mini-shelf-body">
                  <div class="mini-shelf-name">{{ product.name }}</div>
                  <div class="mini-shelf-price">¥{{ shopStore.shopMode === 'wholesale' ? product.wholesalePrice : product.price }}</div>
                </div>
                <span class="mini-shelf-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
        <button class="edit-trigger" @click.stop="openEdit('hero')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </section>

      <button class="mini-explore-bar" @click="$router.push('/brand/products')">
        <span>浏览全部商品</span>
        <span>→</span>
      </button>

      <section class="mini-stats-row">
        <div v-for="item in cfg.stats" :key="item.label" class="mini-stat">
          <div class="mini-stat-num">{{ item.num }}</div>
          <div class="mini-stat-label">{{ item.label }}</div>
        </div>
      </section>

      <section v-if="cfg.homeStoryImages?.filter(Boolean).length" class="mini-story-section editable-block" @click="openEdit('story')">
        <img
          v-for="(img, i) in cfg.homeStoryImages.filter(Boolean)"
          :key="i"
          :src="img"
          class="mini-story-img"
          alt="Brand Story"
          referrerpolicy="no-referrer"
        />
        <button class="edit-trigger" @click.stop="openEdit('story')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </section>
    </div>

    <!-- Hero -->
    <section class="brand-hero editable-block" style="margin-top:0">
      <el-carousel
        v-if="heroImagesList.length > 1"
        :interval="5000"
        arrow="hover"
        indicator-position="inside"
        height="100%"
        class="brand-hero-carousel"
      >
        <el-carousel-item v-for="(img, i) in heroImagesList" :key="i">
          <img :src="img" alt="Brand Hero" class="brand-hero-img" referrerpolicy="no-referrer" />
        </el-carousel-item>
      </el-carousel>
      <img v-else :src="heroImagesList[0] || cfg.heroImage" alt="Brand Hero" class="brand-hero-img" referrerpolicy="no-referrer" />
      <div class="brand-hero-overlay"></div>
      <div class="brand-hero-content">
        <span class="hero-badge">{{ shopStore.shopMode === 'wholesale' ? '批发中心' : '数字游牧 ERP' }}</span>
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
          <button v-if="shopStore.shopMode !== 'wholesale'" class="brand-btn-partner" @click="partnerVisible = true">成为合作商 →</button>
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
          <span class="section-badge">热销精选</span>
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

    <!-- 主题色彩编辑入口（仅编辑模式显示） -->
    <div v-if="brandEdit.editMode" class="theme-edit-bar">
      <button class="theme-edit-btn" @click="openEdit('theme')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="13.5" cy="6.5" r="3.5"/><path d="M7 17c0-2.2 1.6-4 3.5-4h5c1.9 0 3.5 1.8 3.5 4"/><path d="M2 20h20"/></svg>
        编辑主题色彩
      </button>
    </div>

    <!-- Newsletter -->
    <section class="brand-newsletter">
      <div class="brand-newsletter-glow"></div>
      <div class="brand-newsletter-inner">
        <svg class="brand-newsletter-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A1E32" stroke-width="1.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span class="section-badge">加入社区</span>
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

  <!-- 合作商弹窗 -->
  <div v-if="partnerVisible" class="bi-edit-overlay" @click.self="partnerVisible = false">
    <div class="bi-edit-dialog">
      <div class="bi-edit-header">
        <h3>成为合作伙伴</h3>
        <button class="bi-edit-close" @click="partnerVisible = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="bi-edit-body" v-if="!partnerDone">
        <p style="font-size:13px;color:rgba(26,30,50,0.5);margin-bottom:8px;">留下联系方式，我们会尽快与您对接批发合作详情。</p>
        <div class="bi-field"><label>姓名 *</label><input v-model="partnerForm.name" class="bi-input" placeholder="您的姓名" /></div>
        <p style="font-size:12px;color:rgba(26,30,50,0.4);margin:-4px 0 4px;">微信号或手机号填一个即可</p>
        <div class="bi-field"><label>微信号</label><input v-model="partnerForm.wechat" class="bi-input" placeholder="您的微信号" /></div>
        <div class="bi-field"><label>手机号</label><input v-model="partnerForm.mobile" class="bi-input" type="tel" placeholder="11位手机号" /></div>
      </div>
      <div v-else class="bi-edit-body" style="text-align:center;padding:32px 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round" style="margin:0 auto 12px;display:block"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p style="font-size:15px;font-weight:700;color:#1A1E32;margin-bottom:6px;">已收到！</p>
        <p style="font-size:13px;color:rgba(26,30,50,0.5);">我们会尽快联系您。</p>
      </div>
      <div class="bi-edit-footer" v-if="!partnerDone">
        <button class="bi-cancel" @click="partnerVisible = false">取消</button>
        <button class="bi-save" :disabled="partnerSubmitting" @click="submitPartner">
          {{ partnerSubmitting ? '提交中…' : '提交' }}
        </button>
      </div>
    </div>
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
          <div class="bi-field">
            <label>Hero 轮播图（5秒自动切换，比例 16:9 推荐）</label>
            <div v-for="(_img, i) in editData.heroImages" :key="i" class="bi-hero-img-row">
              <div class="bi-input-row" style="flex:1">
                <input v-model="editData.heroImages[i]" class="bi-input" placeholder="https://... 或点击上传" />
                <button class="bi-upload-btn" @click="upload(v => editData.heroImages[i] = v)">上传</button>
              </div>
              <button class="bi-img-action" :disabled="i === 0" @click="moveHeroImage(i, -1)" title="上移">↑</button>
              <button class="bi-img-action" :disabled="i === editData.heroImages.length - 1" @click="moveHeroImage(i, 1)" title="下移">↓</button>
              <button class="bi-img-action danger" @click="removeHeroImage(i)" title="删除">×</button>
            </div>
            <div class="bi-hero-img-thumbs">
              <img v-for="(img, i) in editData.heroImages.filter(Boolean)" :key="i" :src="img" class="bi-preview-thumb" referrerpolicy="no-referrer" />
            </div>
            <button class="bi-add-img" :disabled="editData.heroImages.length >= 5" @click="editData.heroImages.push('')">{{ editData.heroImages.length >= 5 ? '最多 5 张' : '+ 添加图片' }}</button>
          </div>
          <div class="bi-field"><label>副标题标签（英文）</label><input v-model="editData.heroSubtitle" class="bi-input" placeholder="Future of Work" /></div>
          <div class="bi-field"><label>主标题</label><textarea v-model="editData.heroTitle" class="bi-textarea" placeholder="重新定义数字游民生活" rows="2"></textarea></div>
          <div class="bi-field"><label>描述文字</label><textarea v-model="editData.heroDesc" class="bi-textarea"></textarea></div>
        </template>
        <!-- 故事图编辑 -->
        <template v-if="editType === 'story'">
          <div class="bi-field"><label>品牌故事图 URL</label><div class="bi-input-row"><input v-model="editData.storyImage" class="bi-input" placeholder="https://... 或点击上传" /><button class="bi-upload-btn" @click="upload(v => editData.storyImage = v)">上传</button></div><img v-if="editData.storyImage" :src="editData.storyImage" class="bi-preview" referrerpolicy="no-referrer" /></div>
          <div class="bi-field"><label>故事简介文字</label><textarea v-model="editData.storyText" class="bi-textarea"></textarea></div>
          <div class="bi-field">
            <label>小程序首页下方长图（按顺序显示）</label>
            <div v-for="(_img, i) in editData.homeStoryImages" :key="i" class="bi-hero-img-row">
              <div class="bi-input-row" style="flex:1">
                <input v-model="editData.homeStoryImages[i]" class="bi-input" placeholder="https://... 或点击上传" />
                <button class="bi-upload-btn" @click="upload(v => editData.homeStoryImages[i] = v, 0)">上传</button>
              </div>
              <button class="bi-img-action" :disabled="i === 0" @click="moveHomeStoryImage(i, -1)" title="上移">↑</button>
              <button class="bi-img-action" :disabled="i === editData.homeStoryImages.length - 1" @click="moveHomeStoryImage(i, 1)" title="下移">↓</button>
              <button class="bi-img-action danger" @click="removeHomeStoryImage(i)" title="删除">×</button>
            </div>
            <div class="bi-hero-img-thumbs">
              <img v-for="(img, i) in editData.homeStoryImages.filter(Boolean)" :key="i" :src="img" class="bi-preview-thumb story" referrerpolicy="no-referrer" />
            </div>
            <button class="bi-add-img" :disabled="editData.homeStoryImages.length >= 12" @click="editData.homeStoryImages.push('')">{{ editData.homeStoryImages.length >= 12 ? '最多 12 张' : '+ 添加图片' }}</button>
          </div>
        </template>
        <!-- 分类卡片编辑 -->
        <template v-if="editType === 'cat'">
          <div class="bi-field"><label>分类名称</label><input v-model="editData.catName" class="bi-input" /></div>
          <div class="bi-field"><label>分类图片 URL</label><div class="bi-input-row"><input v-model="editData.catImg" class="bi-input" placeholder="https://... 或点击上传" /><button class="bi-upload-btn" @click="upload(v => editData.catImg = v)">上传</button></div><img v-if="editData.catImg" :src="editData.catImg" class="bi-preview" referrerpolicy="no-referrer" /></div>
        </template>
        <!-- 主题色彩编辑 -->
        <template v-if="editType === 'theme'">
          <div class="theme-editor">
            <div class="theme-editor-title">主题色彩</div>
            <div class="theme-row">
              <span class="theme-label">底色</span>
              <input type="color" :value="editData.themeCream" @input="(e: Event) => editData.themeCream = (e.target as HTMLInputElement).value" class="theme-color-input" />
              <span class="theme-hex">{{ editData.themeCream }}</span>
            </div>
            <div class="theme-row">
              <span class="theme-label">主色</span>
              <input type="color" :value="editData.themeNavy" @input="(e: Event) => editData.themeNavy = (e.target as HTMLInputElement).value" class="theme-color-input" />
              <span class="theme-hex">{{ editData.themeNavy }}</span>
            </div>
            <div class="theme-row">
              <span class="theme-label">强调色</span>
              <input type="color" :value="editData.themeOrange" @input="(e: Event) => editData.themeOrange = (e.target as HTMLInputElement).value" class="theme-color-input" />
              <span class="theme-hex">{{ editData.themeOrange }}</span>
            </div>
            <div class="theme-row">
              <span class="theme-label">点缀色</span>
              <input type="color" :value="editData.themeBlue" @input="(e: Event) => editData.themeBlue = (e.target as HTMLInputElement).value" class="theme-color-input" />
              <span class="theme-hex">{{ editData.themeBlue }}</span>
            </div>
          </div>
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
const heroImagesList = computed(() => {
  const arr = cfg.value.heroImages
  if (Array.isArray(arr) && arr.length) return arr.filter(Boolean)
  return cfg.value.heroImage ? [cfg.value.heroImage] : []
})
const { triggerUpload } = useImageUpload()

function upload(setter: (v: string) => void, ratio?: number) {
  triggerUpload(setter, ratio)
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
  heroImage: '', heroImages: [] as string[], heroSubtitle: '', heroTitle: '', heroDesc: '',
  storyImage: '', homeStoryImages: [] as string[], storyText: '',
  catName: '', catImg: '',
  themeCream: '#EDE6D5', themeNavy: '#1A1E32', themeOrange: '#D14B0A', themeBlue: '#8BBDD6',
})

function moveHeroImage(idx: number, dir: number) {
  const arr = editData.heroImages
  const target = idx + dir
  if (target < 0 || target >= arr.length) return
  const tmp = arr[idx]
  arr[idx] = arr[target]
  arr[target] = tmp
}

function removeHeroImage(idx: number) {
  editData.heroImages.splice(idx, 1)
  if (editData.heroImages.length === 0) editData.heroImages.push('')
}

function moveHomeStoryImage(idx: number, dir: number) {
  const arr = editData.homeStoryImages
  const target = idx + dir
  if (target < 0 || target >= arr.length) return
  const tmp = arr[idx]
  arr[idx] = arr[target]
  arr[target] = tmp
}

function removeHomeStoryImage(idx: number) {
  editData.homeStoryImages.splice(idx, 1)
  if (editData.homeStoryImages.length === 0) editData.homeStoryImages.push('')
}

function openEdit(type: string, idx?: number) {
  if (!brandEdit.isLoggedIn) return
  if (!brandEdit.editMode) brandEdit.toggleEditMode()
  editType.value = type
  if (type === 'hero') {
    editTitle.value = '编辑 Hero 区域'
    editData.heroImage = cfg.value.heroImage
    const imgs = Array.isArray(cfg.value.heroImages) ? [...cfg.value.heroImages] : []
    editData.heroImages = imgs.length ? imgs : (cfg.value.heroImage ? [cfg.value.heroImage] : [''])
    editData.heroSubtitle = cfg.value.heroSubtitle
    editData.heroTitle = cfg.value.heroTitle
    editData.heroDesc = cfg.value.heroDesc
  } else if (type === 'story') {
    editTitle.value = '编辑品牌故事图'
    editData.storyImage = cfg.value.storyImage
    const imgs = Array.isArray(cfg.value.homeStoryImages) ? [...cfg.value.homeStoryImages] : []
    editData.homeStoryImages = imgs.length ? imgs : ['']
    editData.storyText = cfg.value.storyText
  } else if (type === 'cat' && idx !== undefined) {
    editCatIdx.value = idx
    editTitle.value = `编辑分类 ${idx + 1}`
    editData.catName = cfg.value.categories[idx].name
    editData.catImg = cfg.value.categories[idx].img
  } else if (type === 'theme') {
    editTitle.value = '编辑主题色彩'
    editData.themeCream = cfg.value.theme?.cream || '#EDE6D5'
    editData.themeNavy = cfg.value.theme?.navy || '#1A1E32'
    editData.themeOrange = cfg.value.theme?.orange || '#D14B0A'
    editData.themeBlue = cfg.value.theme?.blue || '#8BBDD6'
  }
  editVisible.value = true
}

function saveEdit() {
  if (editType.value === 'hero') {
    const cleaned = editData.heroImages.filter(Boolean).slice(0, 5)
    brandEdit.updateConfig({
      heroImage: cleaned[0] || editData.heroImage,
      heroImages: cleaned,
      heroSubtitle: editData.heroSubtitle,
      heroTitle: editData.heroTitle,
      heroDesc: editData.heroDesc,
    })
  } else if (editType.value === 'story') {
    brandEdit.updateConfig({
      storyImage: editData.storyImage,
      homeStoryImages: editData.homeStoryImages.filter(Boolean).slice(0, 12),
      storyText: editData.storyText,
    })
  } else if (editType.value === 'cat') {
    const cats = [...cfg.value.categories]
    cats[editCatIdx.value] = { name: editData.catName, img: editData.catImg }
    brandEdit.updateConfig({ categories: cats })
  } else if (editType.value === 'theme') {
    brandEdit.updateConfig({
      theme: {
        cream: editData.themeCream,
        navy: editData.themeNavy,
        orange: editData.themeOrange,
        blue: editData.themeBlue,
      },
    })
  }
  editVisible.value = false
}

// 合作商弹窗
const partnerVisible = ref(false)
const partnerDone = ref(false)
const partnerSubmitting = ref(false)
const partnerForm = reactive({ name: '', wechat: '', mobile: '' })

async function submitPartner() {
  if (!partnerForm.name || (!partnerForm.wechat && !partnerForm.mobile)) {
    alert('请填写姓名，以及微信号或手机号至少一项'); return
  }
  partnerSubmitting.value = true
  try {
    await fetch('https://erp-server-xsji.onrender.com/miniapi/wholesale/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: partnerForm.name, wechat: partnerForm.wechat, mobile: partnerForm.mobile }),
    })
    partnerDone.value = true
    setTimeout(() => { partnerVisible.value = false; partnerDone.value = false; partnerForm.name = ''; partnerForm.wechat = ''; partnerForm.mobile = '' }, 2500)
  } catch { alert('提交失败，请稍后重试') }
  finally { partnerSubmitting.value = false }
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
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&display=swap');

/* ── 设计变量（Two Leaves 同款配色）── */
:root {
  --blue:   #8BBDD6;
  --cream:  #EDE6D5;
  --orange: #D14B0A;
  --navy:   #1A1E32;
  --yellow: #EDBA3A;
  --serif:  'Noto Serif SC', 'SimSun', serif;
}

/* ── 模式选择遮罩 ── */
.brand-mode-overlay {
  position: fixed; inset: 60px 0 0 0; z-index: 200;
  background: var(--cream);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px; box-sizing: border-box;
  overflow-y: auto; -webkit-overflow-scrolling: touch;
}
@media (max-width: 768px) {
  .brand-mode-overlay { inset: calc(44px + env(safe-area-inset-top,0px)) 0 calc(50px + env(safe-area-inset-bottom,0px)) 0; }
}
.brand-mode-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 20px; max-width: 760px; width: 100%;
}
.brand-mode-card {
  padding: 48px 40px; border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer; transition: border-color 0.2s, transform 0.2s;
  display: flex; flex-direction: column; align-items: flex-start; text-align: left;
}
.brand-mode-retail   { background: var(--blue); }
.brand-mode-wholesale{ background: var(--navy); }
.brand-mode-card:hover { transform: translateY(-3px); }
.brand-mode-retail:hover   { border-color: var(--orange); }
.brand-mode-wholesale:hover{ border-color: var(--yellow); }
.brand-mode-icon {
  width: 56px; height: 56px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
}
.retail   { background: var(--navy); }
.wholesale{ background: var(--orange); }
.brand-mode-title { font-size: 26px; font-weight: 700; margin-bottom: 10px; color: var(--navy); letter-spacing: -0.02em; }
.brand-mode-wholesale .brand-mode-title { color: #fff; }
.brand-mode-desc { font-size: 14px; color: rgba(26,30,50,0.6); line-height: 1.65; margin-bottom: 28px; }
.brand-mode-wholesale .brand-mode-desc { color: rgba(255,255,255,0.55); }
.brand-mode-cta { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; }
.retail-cta    { color: var(--orange); }
.wholesale-cta { color: var(--yellow); }

@media (max-width: 600px) { .brand-mode-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .brand-mode-overlay { padding: 16px; }
  .brand-mode-grid { gap: 12px; }
  .brand-mode-card { padding: 28px 24px; }
  .brand-mode-icon { width: 44px; height: 44px; margin-bottom: 14px; }
  .brand-mode-icon svg { width: 24px; height: 24px; }
  .brand-mode-title { font-size: 18px; margin-bottom: 6px; }
  .brand-mode-desc  { font-size: 12px; margin-bottom: 16px; }
}

/* ── 品牌主页 ── */
.brand-home { background: var(--cream); }
.brand-mini-home { display: none; }

/* Hero */
.brand-hero {
  position: relative; height: 600px;
  overflow: hidden; margin: 0;
  border-radius: 0;
}
.brand-hero-img { width: 100%; height: 100%; object-fit: cover; transition: transform 3s ease-out; }
.brand-hero:hover .brand-hero-img { transform: scale(1.04); }
.brand-hero-carousel { position: absolute; inset: 0; }
.brand-hero-carousel :deep(.el-carousel__container) { height: 100% !important; }
.brand-hero-carousel :deep(.el-carousel__item) { width: 100%; height: 100%; }
.brand-hero-carousel :deep(.el-carousel__item img) { width: 100%; height: 100%; object-fit: cover; }
.brand-hero-carousel :deep(.el-carousel__indicators) { z-index: 4; }
.brand-hero-carousel :deep(.el-carousel__arrow) { z-index: 4; }
.brand-hero-overlay { z-index: 2; pointer-events: none; }
.brand-hero-content { z-index: 5; pointer-events: none; }
.brand-hero-content button, .brand-hero-content a { pointer-events: auto; }
.brand-hero-overlay {
  position: absolute; inset: 0;
  /* 蓝色调遮罩，保留照片质感，去掉黑色压暗感 */
  background: linear-gradient(
    135deg,
    rgba(139,189,214,0.82) 0%,
    rgba(139,189,214,0.55) 50%,
    rgba(139,189,214,0.3) 100%
  );
}
.brand-hero-content {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center;
  padding: 72px 80px;
}
/* 原来的 hero-label 用 badge 替代，保留 label 结构避免删除 */
.brand-hero-label { display: none; }
.brand-hero-label + .brand-hero-title,
.brand-hero-title { margin-top: 0; }

/* 徽章 stamp */
.hero-badge, .section-badge {
  display: inline-block;
  background: var(--orange); color: #fff;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 10px; border-radius: 2px;
  margin-bottom: 16px; align-self: flex-start;
}
.section-badge { display: block; width: fit-content; margin-bottom: 12px; }

.brand-hero-title {
  font-family: var(--serif);
  font-size: clamp(52px, 7vw, 88px);   /* 大 + 更 editorial */
  font-weight: 900; color: #1A1E32;    /* 深色字，因为底色改成蓝色调了 */
  line-height: 1.0; letter-spacing: -0.03em;
  margin-bottom: 20px; white-space: pre-line;
}
.text-amber { color: #D14B0A; }        /* 橙色强调 */
.text-blue  { color: #1A1E32; }
.brand-hero-desc {
  font-size: 17px; color: rgba(26,30,50,0.72);
  max-width: 480px; line-height: 1.75; margin-bottom: 36px;
  border-left: 3px solid #D14B0A; padding-left: 18px;
}
.brand-hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }
.brand-btn-primary {
  padding: 14px 32px; background: #1A1E32; color: #fff;
  border-radius: 3px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em;
  border: none; cursor: pointer; transition: background 0.2s;
}
.brand-btn-primary:hover { background: #2e3456; }
.brand-btn-ghost {
  padding: 14px 32px; background: transparent; color: #1A1E32;
  border-radius: 3px; font-size: 14px; font-weight: 700;
  border: 2px solid rgba(26,30,50,0.4); cursor: pointer; transition: border-color 0.2s;
}
.brand-btn-ghost:hover { border-color: #1A1E32; }
.brand-btn-partner {
  padding: 14px 24px; background: transparent; color: rgba(26,30,50,0.55);
  border-radius: 3px; font-size: 13px; font-weight: 600;
  border: none; cursor: pointer; letter-spacing: 0.02em;
  transition: color 0.2s;
}
.brand-btn-partner:hover { color: #1A1E32; }

/* Philosophy */
.brand-philosophy {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 60px; align-items: center;
  padding: 80px 56px; background: var(--cream);
}
.brand-philosophy-img-wrap {
  position: relative; border-radius: 4px; overflow: hidden; aspect-ratio: 1;
}
.brand-philosophy-img { width: 100%; height: 100%; object-fit: cover; }
.brand-philosophy-badge {
  position: absolute; top: 20px; left: 20px;
  background: var(--orange); padding: 10px 16px; border-radius: 2px;
}
.brand-badge-num   { font-size: 28px; font-weight: 900; color: #fff; line-height: 1; font-family: var(--serif); }
.brand-badge-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.75); margin-top: 3px; }

.brand-section-eyebrow {
  display: inline-block;
  background: var(--orange); color: #fff;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 10px; border-radius: 2px; margin-bottom: 16px;
}
.brand-section-title {
  font-family: var(--serif);
  font-size: clamp(26px, 3vw, 42px);
  font-weight: 900; line-height: 1.15; margin-bottom: 18px;
  letter-spacing: -0.01em; color: var(--navy);
}
.brand-section-desc { font-size: 15px; color: rgba(26,30,50,0.55); line-height: 1.75; margin-bottom: 28px; }
.brand-feature-list  { display: flex; flex-direction: column; gap: 0; }
.brand-feature-item  {
  display: flex; gap: 16px; align-items: flex-start;
  padding: 16px 0; border-bottom: 1px solid rgba(26,30,50,0.1);
}
.brand-feature-item:last-child { border-bottom: none; }
/* 隐藏原来的 SVG 图标盒子，用 CSS 点替代 */
.brand-feature-icon  {
  width: 8px; height: 8px; border-radius: 50%;
  background: #D14B0A; flex-shrink: 0; margin-top: 7px;
  /* 隐藏内部 SVG */
  overflow: hidden; font-size: 0;
}
.brand-feature-icon svg { display: none; }
.brand-feature-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; color: #1A1E32; }
.brand-feature-desc  { font-size: 14px; color: rgba(26,30,50,0.52); line-height: 1.6; }

/* Categories */
.brand-categories { padding: 72px 56px; background: var(--blue); }
.brand-cat-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.brand-cat-header .brand-section-eyebrow { background: var(--navy); }
.brand-cat-header .brand-section-title { margin-bottom: 0; color: var(--navy); }
.brand-cat-all {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: var(--navy);
  background: none; border: none; cursor: pointer; opacity: 0.55; transition: opacity 0.2s;
}
.brand-cat-all:hover { opacity: 1; }
.brand-cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
.brand-cat-card {
  position: relative; height: 340px;
  border-radius: 4px; overflow: hidden; cursor: pointer;
}
.brand-cat-img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s ease; }
.brand-cat-card:hover .brand-cat-img { transform: scale(1.07); }
.brand-cat-overlay { position: absolute; inset: 0; background: rgba(26,30,50,0.18); transition: background 0.3s; }
.brand-cat-card:hover .brand-cat-overlay { background: rgba(26,30,50,0.38); }
.brand-cat-info { position: absolute; bottom: 20px; left: 20px; color: #fff; }
.brand-cat-info h3 { font-size: 18px; font-weight: 700; }

/* Hot products */
.brand-hot { background: var(--cream); padding: 72px 0; }
.brand-hot-inner { max-width: 1200px; margin: 0 auto; padding: 0 56px; }
.brand-hot-header { margin-bottom: 40px; }
.brand-hot-header h2 {
  font-family: var(--serif);
  font-size: 36px; font-weight: 900;
  letter-spacing: -0.02em; margin-bottom: 6px;
  margin-top: 0; color: var(--navy);
}
.brand-hot-header p { font-size: 14px; color: rgba(26,30,50,0.5); }
.brand-product-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
.brand-product-card {
  background: var(--blue); border-radius: 4px;
  overflow: hidden; cursor: pointer;
  transition: transform 0.2s; border: none;
}
.brand-product-card:hover { transform: translateY(-4px); }
.brand-product-img-wrap { aspect-ratio: 1; overflow: hidden; background: rgba(255,255,255,0.3); }
.brand-product-img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.6s ease; }
.brand-product-card:hover .brand-product-img { transform: scale(1.06); }
.brand-product-info { padding: 14px 16px 16px; background: var(--cream); }
.brand-product-name { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--navy); }
.brand-product-price {
  font-size: 16px; font-weight: 800; color: var(--orange);
  margin-bottom: 6px; display: flex; align-items: center; gap: 8px;
}
.brand-product-moq {
  font-size: 10px; font-weight: 600; color: var(--navy);
  background: var(--yellow); padding: 2px 7px; border-radius: 2px;
}
.brand-product-rating { display: flex; align-items: center; gap: 4px; margin-bottom: 10px; }
.brand-product-rating span { font-size: 11px; font-weight: 600; color: rgba(26,30,50,0.4); }
.brand-add-btn {
  width: 100%; padding: 10px; border-radius: 3px;
  background: var(--navy); color: #fff;
  font-size: 12px; font-weight: 700; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: background 0.2s;
}
.brand-add-btn:hover { background: var(--orange); }

/* Newsletter */
.brand-newsletter {
  background: var(--blue); padding: 80px 56px;
  text-align: center; position: relative; overflow: hidden;
  margin: 0; border-radius: 0;
}
.brand-newsletter-glow { display: none; }
.brand-newsletter-inner { position: relative; z-index: 1; max-width: 540px; margin: 0 auto; }
.brand-newsletter-icon { margin: 0 auto 20px; display: block; }
.brand-newsletter-icon svg { stroke: var(--navy) !important; }
.brand-newsletter-inner h2 {
  font-family: var(--serif);
  font-size: 34px; font-weight: 900; color: var(--navy);
  letter-spacing: -0.02em; margin-bottom: 10px;
}
.brand-newsletter-inner > p:not(.brand-newsletter-thanks) {
  font-size: 15px; color: rgba(26,30,50,0.6); line-height: 1.7; margin-bottom: 28px;
}
.brand-newsletter-form { display: flex; gap: 10px; }
.brand-newsletter-input {
  flex: 1; padding: 13px 18px;
  background: rgba(255,255,255,0.55);
  border: 1.5px solid rgba(26,30,50,0.2);
  border-radius: 3px; color: var(--navy);
  font-size: 14px; outline: none;
}
.brand-newsletter-input::placeholder { color: rgba(26,30,50,0.4); }
.brand-newsletter-input:focus { border-color: var(--orange); }
.brand-newsletter-inner .brand-btn-primary { flex-shrink: 0; }
.brand-newsletter-thanks {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; font-size: 15px; font-weight: 600; color: var(--navy); margin-top: 8px;
}

/* 编辑弹框（逻辑不变，视觉微调）*/
.bi-edit-overlay { position: fixed; inset: 0; background: rgba(26,30,50,0.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.bi-edit-dialog { background: var(--cream); border-radius: 6px; width: 100%; max-width: 500px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(26,30,50,0.2); }
.bi-edit-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid rgba(26,30,50,0.1); }
.bi-edit-header h3 { font-size: 16px; font-weight: 700; color: var(--navy); }
.bi-edit-close { width: 32px; height: 32px; border-radius: 4px; background: rgba(26,30,50,0.08); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--navy); }
.bi-edit-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.bi-field { display: flex; flex-direction: column; gap: 6px; }
.bi-field label { font-size: 12px; font-weight: 700; color: rgba(26,30,50,0.55); }
.bi-input { padding: 9px 12px; border: 1.5px solid rgba(26,30,50,0.15); border-radius: 4px; font-size: 13px; outline: none; transition: border-color 0.2s; flex: 1; background: #fff; }
.bi-input:focus { border-color: var(--orange); }
.bi-input-row { display: flex; gap: 8px; align-items: center; }
.bi-upload-btn { padding: 9px 14px; background: rgba(26,30,50,0.07); border: 1.5px solid rgba(26,30,50,0.15); border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
.bi-upload-btn:hover { background: rgba(26,30,50,0.12); }
.bi-textarea { padding: 9px 12px; border: 1.5px solid rgba(26,30,50,0.15); border-radius: 4px; font-size: 13px; outline: none; min-height: 80px; resize: vertical; background: #fff; }
.bi-textarea:focus { border-color: var(--orange); }
.bi-preview { width: 100%; max-height: 120px; object-fit: cover; border-radius: 4px; margin-top: 4px; }
.bi-hero-img-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.bi-img-action { width: 30px; height: 32px; border-radius: 4px; background: rgba(26,30,50,0.07); border: 1.5px solid rgba(26,30,50,0.15); font-size: 14px; cursor: pointer; }
.bi-img-action:disabled { opacity: 0.35; cursor: not-allowed; }
.bi-img-action.danger { color: #d14b0a; }
.bi-img-action.danger:hover { background: rgba(209,75,10,0.1); }
.bi-hero-img-thumbs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.bi-preview-thumb { width: 80px; height: 48px; object-fit: cover; border-radius: 3px; border: 1px solid rgba(26,30,50,0.15); }
.bi-preview-thumb.story { width: 62px; height: 86px; }
.bi-add-img { margin-top: 8px; padding: 8px 14px; background: rgba(209,75,10,0.08); border: 1.5px dashed rgba(209,75,10,0.4); color: #d14b0a; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; align-self: flex-start; }
.bi-add-img:hover:not(:disabled) { background: rgba(209,75,10,0.15); }
.bi-add-img:disabled { opacity: 0.5; cursor: not-allowed; }
.bi-edit-footer { display: flex; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid rgba(26,30,50,0.1); }
.bi-cancel { flex: 1; padding: 12px; border-radius: 4px; background: rgba(26,30,50,0.08); color: var(--navy); font-size: 14px; font-weight: 700; border: none; cursor: pointer; }
.bi-save { flex: 2; padding: 12px; border-radius: 4px; background: var(--orange); color: #fff; font-size: 14px; font-weight: 700; border: none; cursor: pointer; }
.bi-save:hover { background: #b83e08; }

/* 编辑触发按钮 */
.edit-trigger {
  position: absolute; top: 12px; right: 12px;
  width: 30px; height: 30px; border-radius: 3px;
  background: rgba(26,30,50,0.55); border: none;
  display: flex; align-items: center; justify-content: center;
  color: #fff; cursor: pointer; z-index: 10;
  opacity: 0; transition: opacity 0.2s;
}
.editable-block:hover .edit-trigger { opacity: 1; }
:global(.edit-mode-active) .edit-trigger { opacity: 1; }

/* 响应式 */
@media (max-width: 900px) {
  .brand-philosophy { grid-template-columns: 1fr; padding: 48px 28px; }
  .brand-cat-grid { grid-template-columns: 1fr 1fr; }
  .brand-product-grid { grid-template-columns: 1fr 1fr; }
  .brand-categories { padding: 48px 28px; }
  .brand-hot-inner { padding: 0 28px; }
  .brand-hero { height: 480px; }
}

@media (max-width: 768px) {
  .brand-mini-home {
    display: block;
    background: var(--cream);
    min-height: 100svh;
  }
  .brand-home > .brand-hero,
  .brand-philosophy,
  .brand-categories,
  .brand-hot,
  .brand-newsletter {
    display: none;
  }
  .mini-hero {
    position: relative;
    height: calc(100svh - 108px);
    min-height: 620px;
    overflow: hidden;
    background: #1a1814;
  }
  .mini-hero-bg-wrap {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
  .mini-hero-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .mini-hero-mask {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 180px;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(to bottom, rgba(17,17,17,0) 0%, rgba(17,17,17,0.55) 58%, rgba(17,17,17,0.82) 100%);
  }
  .mini-shelf {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }
  .mini-shelf-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .mini-shelf-scroll::-webkit-scrollbar { display: none; }
  .mini-shelf-row {
    display: flex;
    gap: 8px;
    padding: 0 20px;
  }
  .mini-shelf-card {
    width: 280px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    background: rgba(255,255,255,0.25);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    cursor: pointer;
  }
  .mini-shelf-thumb {
    width: 55px;
    height: 55px;
    flex: 0 0 auto;
    object-fit: cover;
    background: var(--cream);
  }
  .mini-shelf-body { flex: 1; min-width: 0; }
  .mini-shelf-name {
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mini-shelf-price {
    margin-top: 4px;
    color: #fff;
    font-family: var(--serif);
    font-size: 18px;
    font-weight: 900;
  }
  .mini-shelf-arrow {
    color: rgba(255,255,255,0.45);
    font-size: 15px;
    flex: 0 0 auto;
  }
  .mini-explore-bar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    background: var(--cream);
    border: 0;
    border-bottom: 1px solid rgba(17,17,17,0.08);
    color: #111;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.03em;
    cursor: pointer;
  }
  .mini-explore-bar span:last-child {
    color: rgba(17,17,17,0.35);
    font-size: 16px;
  }
  .mini-stats-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    padding: 28px 12px;
    background: var(--cream);
  }
  .mini-stat {
    min-width: 0;
    text-align: center;
  }
  .mini-stat-num {
    color: #111;
    font-family: var(--serif);
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
  }
  .mini-stat-label {
    margin-top: 7px;
    color: rgba(17,17,17,0.42);
    font-size: 10px;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }
  .mini-story-section {
    position: relative;
    background: #F3EDE6;
  }
  .mini-story-img {
    display: block;
    width: 100%;
    height: auto;
    background: #F3EDE6;
  }
  :global(.edit-mode-active) .brand-mini-home .edit-trigger {
    opacity: 1;
  }
  /* 手机端 Hero 改为竖版封面：按 1041:2000 竖向比例（接近 iPhone 屏幕比） */
  .brand-hero { height: auto; aspect-ratio: 1041 / 2000; min-height: 0; max-height: 100svh; }
  .brand-hero-content { padding: 0 24px 44px; justify-content: flex-end; }
  .brand-hero-title { font-size: 32px; line-height: 1.15; }
  .brand-hero-desc { font-size: 14px; }
  .brand-hero-btns { flex-direction: column; gap: 10px; }
  /* 手机端 Hero 遮罩改为底部渐变，突出图片主体、保证底部文字对比度 */
  .brand-hero-overlay {
    background: linear-gradient(
      to top,
      rgba(26,30,50,0.75) 0%,
      rgba(26,30,50,0.35) 45%,
      rgba(26,30,50,0.05) 75%,
      rgba(26,30,50,0) 100%
    );
  }
  .brand-cat-grid { grid-template-columns: 1fr; }
  .brand-product-grid { grid-template-columns: 1fr 1fr; }
  .brand-categories { padding: 40px 20px; }
  .brand-hot-inner { padding: 0 20px; }
  .brand-hot { padding: 48px 0; }
  .brand-newsletter { padding: 56px 24px; }
  .brand-newsletter-form { flex-direction: column; }
}

@media (max-width: 480px) {
  .brand-hero-title { font-size: 24px; }
  .brand-section-title { font-size: 22px; }
  .brand-hot-header h2 { font-size: 26px; }
}

/* 主题色彩编辑 */
.theme-edit-bar {
  display: flex; justify-content: center;
  padding: 12px 56px; background: var(--cream);
  border-top: 1px solid rgba(26,30,50,0.08);
}
.theme-edit-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 4px;
  background: rgba(26,30,50,0.07); border: 1.5px solid rgba(26,30,50,0.15);
  font-size: 12px; font-weight: 700; color: var(--navy);
  cursor: pointer; transition: background 0.2s;
}
.theme-edit-btn:hover { background: rgba(26,30,50,0.12); }

.theme-editor {
  background: var(--cream, #EDE6D5);
  border: 1px solid rgba(26,30,50,0.1);
  border-radius: 8px; padding: 20px;
}
.theme-editor-title {
  font-size: 12px; font-weight: 700; color: var(--navy, #1A1E32);
  margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em;
}
.theme-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.theme-row:last-child { margin-bottom: 0; }
.theme-label { font-size: 13px; color: rgba(26,30,50,0.6); width: 60px; flex-shrink: 0; }
.theme-color-input { width: 40px; height: 32px; border: none; border-radius: 4px; cursor: pointer; padding: 2px; }
.theme-hex { font-size: 12px; font-family: monospace; color: rgba(26,30,50,0.5); }
</style>
