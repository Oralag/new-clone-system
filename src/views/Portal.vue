<template>
  <div class="portal-page">
    <!-- Nav -->
    <nav class="glass-nav">
      <div class="nav-logo">
        <div class="nav-logo-icon">
          <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="url(#nbg1)"/>
            <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
            <circle cx="27" cy="8" r="4" fill="#F19D38"/>
            <defs>
              <linearGradient id="nbg1" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1C2B48"/>
                <stop offset="100%" stop-color="#1D3974"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="nav-logo-text">数字游牧</span>
        <span class="nav-platform-badge">
          <span class="nav-platform-dot"></span>
          <span>数字游牧 · 全球化业务管理平台</span>
        </span>
      </div>
      <div class="nav-links">
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <!-- 主题切换 -->
        <div class="nav-theme-btns">
          <button class="nav-theme-btn" :class="{ active: appStore.theme === 'light' }" title="亮色" @click="appStore.setTheme('light')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <button class="nav-theme-btn" :class="{ active: appStore.theme === 'dark' }" title="暗黑" @click="appStore.setTheme('dark')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button class="nav-theme-btn" :class="{ active: appStore.theme === 'eye' }" title="护眼" @click="appStore.setTheme('eye')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <button v-if="isTrial && !trialStarted" class="nav-trial-btn" @click="showTrialModal = true">🎁 领取15天体验</button>
        <button v-if="isTrial" class="nav-upgrade-btn" @click="upgradeDialog?.open()">升级付费版</button>
        <button class="nav-btn" @click="logout" title="退出登录">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:-2px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          退出
        </button>
      </div>
    </nav>

    <!-- Trial upgrade bar -->
    <div v-if="isTrial" class="upgrade-bar">
      <div class="upgrade-bar-inner">
        <div class="upgrade-bar-left">
          <span class="upgrade-bar-dot"></span>
          <template v-if="!trialStarted">
            <span>您正在使用<strong>免费体验版</strong> · 新增/编辑功能不可用</span>
          </template>
          <template v-else-if="!trialExpired">
            <span><strong>体验版进行中</strong> · 剩余 <strong style="color:#f5a623">{{ daysLeft }} 天</strong> · 到期后需升级付费版</span>
          </template>
          <template v-else>
            <span><strong>体验已到期</strong> · 升级付费版继续使用全部功能</span>
          </template>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button v-if="!trialStarted" class="upgrade-bar-trial-btn" @click="showTrialModal = true">🎁 领取 15 天体验</button>
          <button class="upgrade-bar-btn" @click="upgradeDialog?.open()">了解付费版，立即升级 →</button>
        </div>
      </div>
    </div>

    <!-- 主体区：模块卡片（全宽） -->
    <div class="main-layout">

      <!-- 模块卡片 -->
      <div class="cards-col">

        <!-- Captain 指挥官 -->
        <CaptainBar class="portal-captain" />

        <!-- 工作空间标题 -->
        <div class="workspace-header">
          <h2 class="workspace-title">选择您的<span class="hero-title-blue"> 工作空间</span></h2>
        </div>
        <!-- Module Cards — 2×2 grid -->
        <div class="cards-grid">

      <!-- ERP -->
      <div class="portal-card" :class="{ 'card-pressed': pressedCard === 'erp' }"
        @click="go('/dashboard')"
        @touchstart.passive="pressedCard = 'erp'"
        @touchend.passive="pressedCard = ''"
        @touchcancel.passive="pressedCard = ''">
        <div class="card-icon card-icon-dark">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.35"/>
          </svg>
        </div>
        <h2 class="card-title">游牧 ERP</h2>
        <p class="card-desc">全链路业务管理中枢。销售、采购、仓库、财务、人事，一套系统全覆盖。</p>
        <div class="card-tags">
          <span class="tag">销售</span>
          <span class="tag">采购</span>
          <span class="tag">仓库</span>
          <span class="tag">财务</span>
          <span class="tag">人事</span>
        </div>
        <div class="card-arrow">
          <span>进入管理中心</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- 智能体工作流 -->
      <div class="portal-card portal-card-ai" :class="{ 'card-pressed': pressedCard === 'agent' }"
        @click="go('/agent')"
        @touchstart.passive="pressedCard = 'agent'"
        @touchend.passive="pressedCard = ''"
        @touchcancel.passive="pressedCard = ''">
        <div class="card-ai-badge">由 Claude AI 驱动</div>
        <div class="card-icon card-icon-ai">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <h2 class="card-title card-title-ai">智能体工作流</h2>
        <p class="card-desc">多 Agent 协同作业，热搜抓取、文案生成、海报制作全自动流转。你只需设定目标，其余交给 AI。</p>
        <div class="card-tags">
          <span class="tag tag-ai">多Agent协作</span>
          <span class="tag tag-ai">自动流转</span>
          <span class="tag tag-ai">内容生产</span>
          <span class="tag tag-ai">一键发布</span>
        </div>
        <div class="card-arrow">
          <span>立即体验</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- 实验体 -->
      <div class="portal-card portal-card-gold" :class="{ 'card-pressed': pressedCard === 'investment' }"
        @click="go('/investment')"
        @touchstart.passive="pressedCard = 'investment'"
        @touchend.passive="pressedCard = ''"
        @touchcancel.passive="pressedCard = ''">
        <div class="card-icon card-icon-gold">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.5" opacity="0.6"/>
            <circle cx="12" cy="12" r="4" fill="white" opacity="0.9"/>
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          </svg>
        </div>
        <h2 class="card-title">实验体</h2>
        <p class="card-desc">AI 智能投资决策中枢。市场研判、交易指令、资产管理、生命体观测一体化。</p>
        <div class="card-tags">
          <span class="tag tag-gold">市场分析</span>
          <span class="tag tag-gold">智能决策</span>
          <span class="tag tag-gold">资产管理</span>
        </div>
        <div class="card-arrow">
          <span>进入实验体</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- 品牌主页 & 零售中心 -->
      <div class="portal-card portal-card-brand" :class="{ 'card-pressed': pressedCard === 'brand' }"
        @click="go('/brand')"
        @touchstart.passive="pressedCard = 'brand'"
        @touchend.passive="pressedCard = ''"
        @touchcancel.passive="pressedCard = ''">
        <div class="card-icon card-icon-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" stroke-width="1.8" stroke-linejoin="round" opacity="0.9"/>
            <line x1="3" y1="6" x2="21" y2="6" stroke="white" stroke-width="1.8" opacity="0.7"/>
            <path d="M16 10a4 4 0 01-8 0" stroke="white" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
          </svg>
        </div>
        <h2 class="card-title">品牌主页</h2>
        <p class="card-desc">面向零售客户与采购商的品牌展示平台。产品商城、批发采购、评价系统一体化。</p>
        <div class="card-tags">
          <span class="tag tag-brand">品牌展示</span>
          <span class="tag tag-brand">零售商城</span>
          <span class="tag tag-brand">批发采购</span>
          <span class="tag tag-brand">评价系统</span>
        </div>
        <div class="card-arrow">
          <span>进入品牌中心</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- 智能运营部门 -->
      <div class="portal-card portal-card-ops" :class="{ 'card-pressed': pressedCard === 'ecommerce' }"
        @click="go('/ecommerce')"
        @touchstart.passive="pressedCard = 'ecommerce'"
        @touchend.passive="pressedCard = ''"
        @touchcancel.passive="pressedCard = ''">
        <div class="card-icon card-icon-ops">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="white" stroke-width="1.8"/>
            <path d="M8 21h8M12 17v4" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M6 8l4 3-4 3V8z" fill="white" opacity="0.8"/>
          </svg>
        </div>
        <h2 class="card-title">运营驾驶舱</h2>
        <p class="card-desc">面向线上电商运营的统一入口。平台管理、订单中心、库存同步与运营专员放在一条主线上，客户与线下作为辅助。</p>
        <div class="card-tags">
          <span class="tag tag-ops">平台管理</span>
          <span class="tag tag-ops">订单中心</span>
          <span class="tag tag-ops">库存同步</span>
          <span class="tag tag-ops">客户运营</span>
          <span class="tag tag-ops">运营专员</span>
        </div>
        <div class="card-arrow">
          <span>进入运营中心</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      </div><!-- /cards-grid -->
      </div><!-- /cards-col -->

    </div><!-- /main-layout -->

    <!-- ── 功能全览 ── -->
    <section class="overview-section">
      <div class="overview-inner">

        <h2 class="section-title">全 AI 驱动的业务管理平台 —<span class="section-title-blue"> 从进销存到智能决策</span></h2>
        <p class="section-sub">AI Agent 自动处理内容运营、数据分析、经营预警；14 个业务模块全链路覆盖采购、仓库、销售、财务；每位用户独立数据库实例，数据物理隔离，全球节点部署，99.9% 可用率。</p>

        <!-- 核心卖点 -->
        <div class="feature-pills">
          <div class="feature-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L6 7h12l-2-4z" stroke-linejoin="round"/></svg>
            采购管理
          </div>
          <div class="feature-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 3v18M2 9h6M2 15h6" stroke-linecap="round"/></svg>
            仓库管理
          </div>
          <div class="feature-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="14" r="2"/></svg>
            销售管理
          </div>
          <div class="feature-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" stroke-linecap="round"/></svg>
            财务管理
          </div>
          <div class="feature-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><circle cx="9" cy="7" r="3"/><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round"/></svg>
            人事协同
          </div>
          <div class="feature-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17v-4M12 17V8M17 17v-6" stroke-linecap="round"/></svg>
            数据报表
          </div>
          <div class="feature-pill feature-pill-ai">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z" fill="#f59e0b"/></svg>
            AI 智能体
          </div>
          <div class="feature-pill feature-pill-safe">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M12 2l-8 4v6c0 4.4 3.4 8.5 8 9.9 4.6-1.4 8-5.5 8-9.9V6L12 2z" stroke-linejoin="round"/></svg>
            独立数据库
          </div>
        </div>

        <!-- 服务器特性 -->
        <div class="server-grid">
          <div class="server-card server-card-blue">
            <div class="server-card-icon-svg server-icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="10" rx="2" stroke="#0071e3" stroke-width="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#0071e3" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="#0071e3"/>
              </svg>
            </div>
            <div class="server-card-title">数据完全隔离</div>
            <div class="server-card-desc">专属数据库实例，物理隔离，订单、财务、客户数据只有您能访问。</div>
          </div>
          <div class="server-card server-card-green">
            <div class="server-card-icon-svg server-icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v5c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V7L12 2z" stroke="#059669" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M8 12l3 3 5-5" stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="server-card-title">永久备份不丢失</div>
            <div class="server-card-desc">每日自动备份，支持任意时间点恢复，业务数据零风险。</div>
          </div>
          <div class="server-card server-card-purple">
            <div class="server-card-icon-svg server-icon-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="server-card-title">性能独享</div>
            <div class="server-card-desc">独立计算资源，高峰期不受他人影响，支持百万级 SKU 稳定运行。</div>
          </div>
          <div class="server-card server-card-orange">
            <div class="server-card-icon-svg server-icon-orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#ea580c" stroke-width="1.5"/>
                <path d="M12 3a9 9 0 010 18M3 12h18" stroke="#ea580c" stroke-width="1.5"/>
                <path d="M12 3c-2.5 2.5-4 5.6-4 9s1.5 6.5 4 9" stroke="#ea580c" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="server-card-title">全球低延迟</div>
            <div class="server-card-desc">多地区节点，中国、东南亚、欧美团队均可极速访问。</div>
          </div>
          <div class="server-card server-card-red">
            <div class="server-card-icon-svg server-icon-red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l-8 4v6c0 4.4 3.4 8.5 8 9.9 4.6-1.4 8-5.5 8-9.9V6L12 2z" stroke="#dc2626" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="server-card-title">企业级安全</div>
            <div class="server-card-desc">DDoS 防护、HTTPS 加密、IP 白名单、操作日志审计全方位保障。</div>
          </div>
          <div class="server-card server-card-ai-feature">
            <div class="server-card-ai-badge">Claude AI 加持</div>
            <div class="server-card-icon-svg server-icon-ai">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#f59e0b"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="server-card-title">AI 智能分析</div>
            <div class="server-card-desc">内置 Claude AI 自动生成经营洞察与预警，让数据真正为您所用。</div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── 升级 CTA ── -->
    <section class="cta-section">
      <div class="cta-inner">
        <div class="cta-badge">限时优惠</div>
        <h2 class="cta-title">准备好了吗？<br/>升级专属付费版</h2>
        <p class="cta-sub">首月特惠 · 独立数据库 · 全功能解锁 · 专属技术支持<br/>付款后 2 小时内为您配置专属实例并激活账号</p>
        <div class="cta-plans">
          <div class="cta-plan" @click="upgradeDialog?.open()">
            <div class="cta-plan-name">月付版</div>
            <div class="cta-plan-price">¥<span>39</span>/月</div>
          </div>
          <div class="cta-plan cta-plan-popular" @click="upgradeDialog?.open()">
            <div class="cta-plan-tag">最受欢迎</div>
            <div class="cta-plan-name">年付版</div>
            <div class="cta-plan-price">¥<span>299</span>/年</div>
            <div class="cta-plan-note">相当于 ¥25/月，省 ¥169</div>
          </div>
          <div class="cta-plan" @click="upgradeDialog?.open()">
            <div class="cta-plan-name">买断版</div>
            <div class="cta-plan-price">¥<span>1599</span>/永久</div>
            <div class="cta-plan-note">一次付清，永久使用</div>
          </div>
        </div>
        <button class="cta-btn" @click="upgradeDialog?.open()">立即升级付费版 →</button>
        <p class="cta-hint">也可添加微信 <strong>nomad_erp</strong> 咨询，或先<span class="cta-trial-link" @click="showTrialModal = true">领取 15 天免费体验</span></p>
      </div>
    </section>

    <!-- 领取体验弹窗 -->
    <el-dialog v-model="showTrialModal" width="380px" append-to-body align-center class="write-block-dialog">
      <div class="wb-body">
        <button class="wb-close" @click="showTrialModal = false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="wb-icon">🎁</div>
        <div class="wb-title">领取 15 天免费体验</div>
        <div class="wb-desc">解锁全部功能，体验付费版完整能力<br/>到期后需升级才能继续使用</div>
        <button class="wb-upgrade-btn" @click="claimTrial">立即领取体验资格</button>
        <button class="wb-cancel" @click="showTrialModal = false">稍后再说</button>
      </div>
    </el-dialog>

    <!-- 领取成功弹窗 -->
    <el-dialog v-model="showClaimSuccess" width="340px" append-to-body align-center class="write-block-dialog">
      <div class="wb-body" style="text-align:center">
        <div style="font-size:44px;margin-bottom:14px">🎉</div>
        <div class="wb-title">体验已激活！</div>
        <div class="wb-desc">您已成功领取 <strong>15 天</strong>免费体验<br/>到期时间：{{ trialExpireDate }}</div>
        <button class="wb-upgrade-btn" @click="showClaimSuccess = false">开始体验</button>
      </div>
    </el-dialog>

    <UpgradeDialog ref="upgradeDialog" />

    <!-- Footer -->
    <footer class="portal-footer">
      <div class="footer-logo">
        <div class="nav-logo-icon">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="url(#nbg2)"/>
            <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
            <circle cx="27" cy="8" r="4" fill="#F19D38"/>
            <defs>
              <linearGradient id="nbg2" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1C2B48"/>
                <stop offset="100%" stop-color="#1D3974"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span>数字游牧</span>
      </div>
      <p class="footer-sub">DESIGNED BY NOMAD LABS · GLOBAL CITIZEN PLATFORM</p>
      <p class="footer-copy">© 2026 数字游牧. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import UpgradeDialog from '@/components/UpgradeDialog.vue'
import CaptainBar from '@/components/CaptainBar.vue'

const router = useRouter()
const auth = useAuthStore()
const appStore = useAppStore()

function go(path: string) { router.push(path) }
function logout() { auth.logout(); router.push('/login') }
const pressedCard = ref('')

// ── Portal 嵌入式 AI 对话框 ────────────────────────────────────────────────
const portalAiOpen = ref(false)
const portalAiQuery = ref('')
const portalAiLoading = ref(false)
const portalAiInputRef = ref<HTMLInputElement | null>(null)
const portalAiMessagesRef = ref<HTMLDivElement | null>(null)
const portalAiMessages = ref<{ role: 'user' | 'ai'; content: string }[]>([])

function openPortalAi() {
  portalAiOpen.value = true
  nextTick(() => portalAiInputRef.value?.focus())
}

function closePortalAi() {
  if (!portalAiQuery.value) portalAiOpen.value = false
}

async function sendPortalAi() {
  const q = portalAiQuery.value.trim()
  if (!q || portalAiLoading.value) return
  portalAiOpen.value = true
  portalAiMessages.value.push({ role: 'user', content: q })
  portalAiQuery.value = ''
  portalAiLoading.value = true
  await nextTick()
  scrollPortalAi()
  try {
    const token = auth.token || localStorage.getItem('erp_token') || ''
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ messages: portalAiMessages.value.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })) }),
    })
    const reader = res.body?.getReader()
    const dec = new TextDecoder()
    let aiText = ''
    portalAiMessages.value.push({ role: 'ai', content: '' })
    const idx = portalAiMessages.value.length - 1
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = dec.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const ev = JSON.parse(data)
          if (ev.type === 'text' && ev.text) {
            aiText += ev.text
            portalAiMessages.value[idx].content = aiText
            await nextTick(); scrollPortalAi()
          }
        } catch { /* ignore */ }
      }
    }
    if (!aiText) portalAiMessages.value[idx].content = '好的，请问还有什么需要帮助的？'
  } catch {
    portalAiMessages.value.push({ role: 'ai', content: '连接 AI 服务失败，请稍后重试。' })
  } finally {
    portalAiLoading.value = false
    await nextTick(); scrollPortalAi()
  }
}

function scrollPortalAi() {
  if (portalAiMessagesRef.value) {
    portalAiMessagesRef.value.scrollTop = portalAiMessagesRef.value.scrollHeight
  }
}

// ── Trial 状态 ────────────────────────────────────────────────────────────
const upgradeDialog = ref<InstanceType<typeof UpgradeDialog> | null>(null)
const showTrialModal = ref(false)
const showClaimSuccess = ref(false)

const isTrial = computed(() => {
  const token = auth.token
  if (!token?.startsWith('erp_')) return false
  try {
    const raw = token.slice(4)
    const pad = raw + '='.repeat((4 - raw.length % 4) % 4)
    const json = decodeURIComponent(escape(atob(pad)))
    return !!JSON.parse(json).trial
  } catch { return false }
})

const storageKey = computed(() => `trial_start_${auth.userInfo?.account || 'default'}`)

const trialStartTs = computed(() => {
  const v = localStorage.getItem(storageKey.value)
  return v ? parseInt(v) : null
})

const TRIAL_DAYS = 15
const MS_PER_DAY = 86400000

const trialStarted = computed(() => !!trialStartTs.value)

const daysLeft = computed(() => {
  if (!trialStartTs.value) return 0
  const elapsed = Date.now() - trialStartTs.value
  const left = TRIAL_DAYS - Math.floor(elapsed / MS_PER_DAY)
  return Math.max(0, left)
})

const trialExpired = computed(() => trialStarted.value && daysLeft.value === 0)

const trialExpireDate = computed(() => {
  if (!trialStartTs.value) return ''
  const d = new Date(trialStartTs.value + TRIAL_DAYS * MS_PER_DAY)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
})

function claimTrial() {
  const now = Date.now()
  localStorage.setItem(storageKey.value, String(now))
  fetch('/api/claim-trial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: auth.token || '' },
  }).catch(() => {})
  showTrialModal.value = false
  showClaimSuccess.value = true
}

// 页面加载时同步 KV 状态：如果本地有记录但 KV 没有，清除本地；如果 KV 有记录但本地没有，写入本地
onMounted(async () => {
  // Captain 触发升级弹窗
  window.addEventListener('captain:open-upgrade', () => {
    upgradeDialog.value?.open()
  })

  if (!isTrial.value) return
  try {
    const res = await fetch('/api/trial-status', {
      headers: { token: auth.token || '' },
    })
    const data = await res.json()
    if (data.code === 1) {
      if (data.data?.trial_start_ts) {
        // KV 有记录，以 KV 为准写入本地
        localStorage.setItem(storageKey.value, String(data.data.trial_start_ts))
      } else {
        // KV 没有记录，清除本地
        localStorage.removeItem(storageKey.value)
      }
    }
  } catch {}
})

// ── Agent 团队定义（前端展示用）─────────────────────────────────────────────
const agentList = [
  { id: 'copywriter', name: '文案Agent', emoji: '✍️', color: '#f59e0b', specialty: '内容创作' },
  { id: 'poster',     name: '海报Agent', emoji: '🎨', color: '#ec4899', specialty: '视觉设计' },
  { id: 'video',      name: '视频Agent', emoji: '🎬', color: '#ef4444', specialty: '视频脚本' },
  { id: 'brand',      name: '品牌Agent', emoji: '💎', color: '#8b5cf6', specialty: '品牌策略' },
  { id: 'publisher',  name: '发布Agent', emoji: '🚀', color: '#10b981', specialty: '多平台发布' },
  { id: 'trend',      name: '趋势Agent', emoji: '📈', color: '#06b6d4', specialty: '热点追踪' },
]

const aboutItems = [
  { emoji: '🧠', title: '自主任务拆解', desc: '理解你的目标，自动拆解成子任务分配给专项 Agent', color: '#6366f1' },
  { emoji: '⚡', title: '并行调度执行', desc: '同时调动多个 Agent 协作，效率最大化', color: '#f59e0b' },
  { emoji: '🔗', title: '跨系统数据联动', desc: '直接调取 ERP 业务数据，驱动内容创作决策', color: '#10b981' },
  { emoji: '🎯', title: '综合汇报产出', desc: '汇总所有 Agent 结果，给出清晰的最终方案', color: '#ec4899' },
]

const TOOL_LABELS: Record<string, string> = {
  query_customers: '查询客户', query_suppliers: '查询供应商', query_goods: '查询商品',
  query_inventory: '查询库存', query_sales: '查询销售', query_purchases: '查询采购',
  query_finance: '查询财务', query_staff: '查询员工', query_warehouses: '查询仓库',
  navigate_to: '页面导航',
}
</script>

<style scoped>
* { box-sizing: border-box; }

.portal-page {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background: var(--card-bg, #ffffff);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--dark, #1d1d1f);
  padding-top: 0;
}

/* ── Nav ── */
.glass-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
}

.nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }

.nav-logo-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.23,1,0.32,1);
}
.nav-logo-icon:hover { transform: scale(1.12) rotate(3deg); }

.nav-logo-text { font-size: 18px; font-weight: 800; letter-spacing: -0.04em; color: var(--dark); }

.nav-platform-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 4px;
  padding: 4px 10px 4px 8px;
  background: var(--gray);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--mid);
}
.nav-platform-dot {
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(34,197,94,0.5);
  flex-shrink: 0;
}

.nav-links { display: flex; gap: 40px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(29,29,31,0.3); }
.nav-links span { cursor: pointer; transition: color 0.2s; }
.nav-links span:hover { color: #0071e3; }

.nav-btn {
  padding: 7px 14px;
  background: transparent;
  color: rgba(29,29,31,0.5);
  border: 1px solid rgba(29,29,31,0.15);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  transition: all 0.18s;
}
.nav-btn:hover { background: rgba(239,68,68,0.07); color: #ef4444; border-color: rgba(239,68,68,0.25); }

.nav-theme-btns {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--gray);
  border-radius: 999px;
  padding: 4px 6px;
  border: 1px solid var(--border);
}
.nav-theme-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mid);
  transition: background 0.15s, color 0.15s;
}
.nav-theme-btn:hover { background: var(--gray-2); color: var(--dark); }
.nav-theme-btn.active { background: var(--card-bg); color: var(--blue); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

/* ── Hero Compact ── */
.hero-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 28px 48px 20px;
  flex-wrap: wrap;
}

.hero-compact-title {
  font-size: 24px;
  font-weight: 800;
  color: #1d1d1f;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

/* ── Portal Captain Bar ── */
.portal-captain {
  margin-bottom: 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* ── Workspace header (above cards) ── */
.workspace-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.workspace-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1d1d1f;
  margin: 0;
}

/* ── Portal AI Bar ── */
.portal-ai-bar {
  margin-bottom: 20px;
  background: var(--gray, #f5f5f7);
  border-radius: 14px;
  border: 1.5px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.portal-ai-bar--open {
  border-color: rgba(91,79,232,0.2);
  box-shadow: 0 4px 20px rgba(91,79,232,0.08);
}
.portal-ai-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  cursor: text;
}
.portal-ai-icon {
  color: #86868b;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.portal-ai-bar--open .portal-ai-icon {
  color: #5B4FE8;
}
.portal-ai-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--dark, #1d1d1f);
  outline: none;
  font-family: inherit;
  cursor: text;
}
.portal-ai-input::placeholder {
  color: #86868b;
  font-weight: 400;
}
.portal-ai-send {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #5B4FE8;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.portal-ai-send:hover { background: #4a3fd4; }
.portal-ai-messages {
  max-height: 780px;
  overflow-y: auto;
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.portal-ai-msg {
  font-size: 13.5px;
  line-height: 1.55;
  padding: 8px 12px;
  border-radius: 10px;
  max-width: 92%;
  word-break: break-word;
  white-space: pre-wrap;
}
.portal-ai-msg--user {
  align-self: flex-end;
  background: #5B4FE8;
  color: white;
}
.portal-ai-msg--ai {
  align-self: flex-start;
  background: var(--gray, #f5f5f7);
  color: var(--dark, #1d1d1f);
  border: 1px solid var(--border, rgba(0,0,0,0.07));
}
.portal-ai-msg--loading {
  padding: 10px 14px;
}
.portal-ai-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}
.portal-ai-dots span {
  width: 6px;
  height: 6px;
  background: #86868b;
  border-radius: 50%;
  animation: portal-ai-blink 1.2s ease-in-out infinite;
}
.portal-ai-dots span:nth-child(2) { animation-delay: 0.2s; }
.portal-ai-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes portal-ai-blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }

/* ── Hero ── */
.hero {
  padding: 100px 48px 72px;
  text-align: center;
  max-width: 1000px;
  margin: 0 auto;
  animation: fade-up-in 1.2s cubic-bezier(0.23,1,0.32,1) both;
}

@keyframes fade-up-in {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 18px;
  background: #f5f5f7;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.06);
  margin-bottom: 40px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(29,29,31,0.5);
}

.hero-badge-dot {
  width: 6px;
  height: 6px;
  background: #0071e3;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

.hero-title {
  font-size: clamp(56px, 10vw, 108px);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.88;
  margin: 0 0 36px;
  color: #1d1d1f;
}

.hero-title-blue { color: #0071e3; }

.hero-subtitle {
  font-size: clamp(17px, 2vw, 22px);
  color: rgba(29,29,31,0.42);
  font-weight: 500;
  line-height: 1.7;
  margin: 0;
  letter-spacing: -0.01em;
}

/* ── Main layout (now single column) ── */
.main-layout {
  max-width: 900px;
  margin: 0 auto 40px;
  padding: 16px 32px 0;
}

.cards-col {
  width: 100%;
}

/* ── Cards ── */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 0;
  padding: 0;
}

.portal-card {
  position: relative;
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 24px;
  padding: 26px 24px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.6s cubic-bezier(0.23,1,0.32,1), box-shadow 0.6s cubic-bezier(0.23,1,0.32,1), background 0.5s cubic-bezier(0.23,1,0.32,1), border-color 0.5s;
  display: flex;
  flex-direction: column;
}

.portal-card:hover,
.portal-card.card-pressed {
  transform: translateY(-14px) scale(1.02);
  box-shadow: 0 60px 100px rgba(0,0,0,0.09);
}

@media (hover: none) {
  .portal-card:hover {
    transform: none;
    box-shadow: none;
  }
}

/* ERP 卡默认深灰色，hover 变蓝 */
.portal-card:not(.portal-card-ai):not(.portal-card-dim) {
  background: linear-gradient(135deg, #1d1d1f 0%, #2d2d2f 100%);
  border-color: rgba(255,255,255,0.08);
}
.portal-card:not(.portal-card-ai):not(.portal-card-dim) .card-title { color: #fff; }
.portal-card:not(.portal-card-ai):not(.portal-card-dim) .card-desc  { color: rgba(255,255,255,0.5); }
.portal-card:not(.portal-card-ai):not(.portal-card-dim) .card-arrow { color: rgba(255,255,255,0.35); }
.portal-card:not(.portal-card-ai):not(.portal-card-dim) .tag { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border-color: transparent; }

.portal-card:not(.portal-card-ai):not(.portal-card-dim):hover,
.portal-card:not(.portal-card-ai):not(.portal-card-dim).card-pressed {
  background: linear-gradient(135deg, #0071e3 0%, #005acd 100%);
  border-color: rgba(0,113,227,0.3);
  box-shadow: 0 40px 80px rgba(0,113,227,0.25);
}
.portal-card:not(.portal-card-ai):not(.portal-card-dim):hover .card-arrow,
.portal-card:not(.portal-card-ai):not(.portal-card-dim).card-pressed .card-arrow { color: rgba(255,255,255,0.7); gap: 12px; }
.portal-card:not(.portal-card-ai):not(.portal-card-dim):hover .card-icon-dark,
.portal-card:not(.portal-card-ai):not(.portal-card-dim).card-pressed .card-icon-dark { background: rgba(255,255,255,0.15); }

@media (hover: none) {
  .portal-card:not(.portal-card-ai):not(.portal-card-dim):hover {
    background: linear-gradient(135deg, #1d1d1f 0%, #2d2d2f 100%);
    border-color: rgba(255,255,255,0.08);
    box-shadow: none;
  }
}

.portal-card-ai {
  background: linear-gradient(135deg, #0071e3 0%, #0057b8 60%, #004499 100%);
  border-color: rgba(0,113,227,0.3);
  transition: transform 0.6s cubic-bezier(0.23,1,0.32,1), box-shadow 0.6s cubic-bezier(0.23,1,0.32,1), background 0.5s cubic-bezier(0.23,1,0.32,1);
}
.portal-card-ai .card-title { color: #fff; }
.portal-card-ai .card-desc  { color: rgba(255,255,255,0.55); }
.portal-card-ai .card-arrow { color: rgba(255,255,255,0.4); }
.portal-card-ai:hover,
.portal-card-ai.card-pressed {
  background: linear-gradient(135deg, #1d1d1f 0%, #2d2d2f 100%);
  border-color: rgba(255,255,255,0.1);
  box-shadow: 0 40px 80px rgba(0,0,0,0.3);
}
.portal-card-ai:hover .card-arrow,
.portal-card-ai.card-pressed .card-arrow { color: #fff; gap: 12px; }

@media (hover: none) {
  .portal-card-ai:hover {
    background: linear-gradient(135deg, #0071e3 0%, #0057b8 60%, #004499 100%);
    border-color: rgba(0,113,227,0.3);
    box-shadow: none;
  }
}
.card-ai-badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  color: #f59e0b;
  background: rgba(245,158,11,0.12);
  border: 1px solid rgba(245,158,11,0.2);
  padding: 3px 9px; border-radius: 999px;
  margin-bottom: 16px; align-self: flex-start;
}
.card-title-ai { font-size: clamp(20px, 2.5vw, 26px); line-height: 1.2; }
.tag-ai { background: rgba(245,158,11,0.12); color: #f59e0b; }
.card-icon-ai { background: rgba(245,158,11,0.15); box-shadow: none; }
.portal-card-purple { background: #faf5ff; border-color: rgba(124,58,237,0.08); }
.portal-card-green  { background: #f0fdf9; border-color: rgba(5,150,105,0.08); }
.portal-card-gold   { background: linear-gradient(135deg, #fffbf0, #fff8e8); border-color: rgba(245,166,35,0.12); }
.card-icon-gold     { background: linear-gradient(135deg, #b8860b, #d4a574); }
.tag-gold           { background: rgba(212,165,116,0.15); color: #8b6914; }
.portal-card-brand   { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%); border-color: rgba(124,58,237,0.3); }
.card-icon-brand     { background: rgba(255,255,255,0.18); box-shadow: none; }
.tag-brand           { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85); }
.portal-card-brand .card-title { color: #fff; }
.portal-card-brand .card-desc  { color: rgba(255,255,255,0.5); }
.portal-card-brand .card-arrow { color: rgba(255,255,255,0.35); }
.portal-card-brand:hover,
.portal-card-brand.card-pressed {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  border-color: rgba(168,85,247,0.4);
  box-shadow: 0 40px 80px rgba(124,58,237,0.3);
}
.portal-card-brand:hover .card-arrow,
.portal-card-brand.card-pressed .card-arrow { color: #fff; gap: 12px; }
@media (hover: none) {
  .portal-card-brand:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
    border-color: rgba(124,58,237,0.3);
    box-shadow: none;
  }
}

.portal-card-ops {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%);
  border-color: rgba(8,145,178,0.3);
}
.portal-card-ops .card-title { color: #fff; }
.portal-card-ops .card-desc  { color: rgba(255,255,255,0.55); }
.portal-card-ops .card-arrow { color: rgba(255,255,255,0.35); }
.card-icon-ops { background: rgba(255,255,255,0.15); }
.tag-ops { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8); }
.portal-card-ops:hover,
.portal-card-ops.card-pressed {
  background: linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%);
  border-color: rgba(6,182,212,0.4);
  box-shadow: 0 40px 80px rgba(8,145,178,0.3);
}
.portal-card-ops:hover .card-arrow,
.portal-card-ops.card-pressed .card-arrow { color: #fff; gap: 12px; }
@media (hover: none) {
  .portal-card-ops:hover {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%);
    border-color: rgba(8,145,178,0.3);
    box-shadow: none;
  }
}

.portal-card-dim {
  cursor: not-allowed;
  filter: grayscale(1);
  opacity: 0.45;
  pointer-events: none;
}
.portal-card-dim:hover { transform: none; box-shadow: none; }

.card-bg-icon {
  position: absolute;
  top: -80px;
  right: -80px;
  color: #1d1d1f;
  opacity: 0.02;
  pointer-events: none;
  transition: opacity 1s cubic-bezier(0.23,1,0.32,1);
}
.card-bg-blue { color: #0071e3; }
.portal-card:hover .card-bg-icon { opacity: 0.06; }

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: transform 0.6s cubic-bezier(0.23,1,0.32,1);
  flex-shrink: 0;
}
.portal-card:hover .card-icon { transform: rotate(-6deg) scale(1.08); }

.card-icon-dark   { background: rgba(255,255,255,0.12); box-shadow: none; }
.card-icon-blue   { background: #0071e3; box-shadow: 0 12px 32px rgba(0,113,227,0.3); }
.card-icon-purple { background: linear-gradient(135deg,#7c3aed,#a855f7); box-shadow: 0 12px 32px rgba(124,58,237,0.25); }
.card-icon-green  { background: linear-gradient(135deg,#059669,#10b981); box-shadow: 0 12px 32px rgba(5,150,105,0.25); }
.card-icon-dim    { background: rgba(29,29,31,0.06); color: rgba(29,29,31,0.25); }

.card-body { flex: 1; min-width: 0; }

.card-title {
  font-size: clamp(17px, 2vw, 22px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1d1d1f;
  margin: 0 0 10px;
  line-height: 1.15;
}

.card-desc {
  font-size: 13px;
  color: rgba(29,29,31,0.42);
  line-height: 1.6;
  margin: 0 0 16px;
  font-weight: 500;
  flex: 1;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 20px;
}

.tag {
  padding: 4px 10px;
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(29,29,31,0.45);
  letter-spacing: 0.02em;
}

.tag-blue   { background: rgba(0,113,227,0.08); color: #0071e3; }
.tag-purple { background: rgba(124,58,237,0.08); color: #7c3aed; }
.tag-green  { background: rgba(5,150,105,0.08);  color: #059669; }

.card-arrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(29,29,31,0.25);
  transition: gap 0.4s cubic-bezier(0.23,1,0.32,1), color 0.3s;
  letter-spacing: -0.01em;
}
.portal-card-blue .card-arrow { color: #1d1d1f; }
.portal-card:hover:not(.portal-card-dim) .card-arrow { gap: 12px; color: #1d1d1f; }
.portal-card-blue:hover .card-arrow { color: #0071e3; }

/* ── Platform Description ── */
.platform-desc {
  padding: 56px 48px;
  text-align: center;
  background: var(--gray, #f5f5f7);
  border-top: 1px solid var(--border, rgba(0,0,0,0.04));
}
.platform-desc-inner {
  max-width: 800px;
  margin: 0 auto;
}

/* ── Neural ── */
.neural-section {
  background: #1d1d1f;
  color: white;
  padding: 120px 48px;
  position: relative;
  overflow: hidden;
}

.neural-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  height: 900px;
  background: radial-gradient(circle, rgba(0,113,227,0.14) 0%, transparent 70%);
  pointer-events: none;
}

.neural-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 100px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.neural-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(255,255,255,0.35);
  margin-bottom: 32px;
}

.neural-title {
  font-size: clamp(40px, 5.5vw, 68px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.0;
  margin: 0 0 28px;
}

.neural-desc {
  font-size: 17px;
  color: rgba(255,255,255,0.35);
  line-height: 1.8;
  font-weight: 500;
  margin: 0 0 56px;
  max-width: 480px;
}

.neural-stats { display: flex; gap: 56px; }
.stat-num { font-size: 40px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 6px; }
.stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.18); }

.neural-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.neural-card { padding: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; transition: background 0.3s, transform 0.3s cubic-bezier(0.23,1,0.32,1); cursor: default; }
.neural-card:hover { background: rgba(255,255,255,0.09); transform: translateY(-4px); }
.neural-card-icon { font-size: 26px; margin-bottom: 16px; }
.neural-card-title { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
.neural-card-desc { font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 500; }

/* ── Footer ── */
.portal-footer {
  padding: 72px 48px;
  text-align: center;
  border-top: 1px solid var(--border, rgba(0,0,0,0.06));
  background: var(--gray, #f5f5f7);
}

.footer-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.footer-sub { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(29,29,31,0.16); margin: 0 0 8px; }
.footer-copy { font-size: 11px; color: rgba(29,29,31,0.1); margin: 0; }

/* ── Responsive ── */
.hide-sm { display: inline; }

@media (max-width: 1100px) {
  .main-layout { flex-direction: column; }
  .captain-wrap { width: 100%; position: static; }
  .cards-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .glass-nav { padding: 0 14px; height: 52px; }
  .nav-logo-text { font-size: 15px; }
  .nav-logo-icon svg { width: 26px; height: 26px; }
  .nav-links { display: none; }
  .nav-trial-btn, .nav-upgrade-btn { display: none; }
  .nav-btn { padding: 5px 10px; font-size: 11px; }
  .hero { padding: 36px 20px 28px; }
  .hero-title { font-size: 38px; line-height: 0.95; }
  .hero-sub { font-size: 14px; margin-top: 12px; }
  .upgrade-bar { font-size: 12px; }
  .upgrade-bar-inner { padding: 8px 16px; flex-direction: column; gap: 6px; align-items: flex-start; }
  .main-layout { padding: 0 16px; }
  .cards-grid { grid-template-columns: 1fr; gap: 12px; }
  .portal-card { padding: 28px 22px; border-radius: 24px; }
  .card-icon { width: 52px; height: 52px; border-radius: 16px; }
  .card-icon svg { width: 30px; height: 30px; }
  .card-title { font-size: 20px; margin-top: 14px; }
  .card-desc { font-size: 13px; margin-top: 8px; }
  .captain-strip-input { width: 130px; }
  .neural-content { grid-template-columns: 1fr; gap: 40px; }
  .neural-section { padding: 48px 20px; }
  .portal-footer { padding: 36px 20px; }
  .hide-sm { display: none; }
}

/* ── Captain live dot (reused in drop header) ── */
.captain-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 700;
  color: #16a34a;
  letter-spacing: 0.08em;
}
.captain-live-dot {
  width: 5px; height: 5px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* ── Feed empty state & prompts (shared) ── */
.feed-empty { padding: 4px 0; }
.feed-empty-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (max-width: 640px) { .feed-empty-grid { grid-template-columns: 1fr; } }
.feed-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--gray, #f7f8fa);
  border: 1px solid var(--border, #e4e7ed);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--mid, #4e5969);
  cursor: pointer;
  text-align: left;
  line-height: 1.4;
  transition: all 0.15s;
}
.feed-prompt:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }
.feed-prompt svg { color: #c9cdd4; flex-shrink: 0; transition: color 0.15s; }
.feed-prompt:hover svg { color: #6366f1; }
.feed-prompt-text { flex: 1; }

/* 消息行 */
.feed-row { display: flex; }
.feed-user { justify-content: flex-end; }
.feed-bubble-user {
  background: #6366f1;
  color: #fff;
  border-radius: 14px 14px 2px 14px;
  padding: 10px 16px;
  font-size: 14px;
  max-width: 60%;
  line-height: 1.55;
}
.feed-agency { flex-direction: column; }
.feed-agency-inner { display: flex; flex-direction: column; gap: 8px; }

/* Captain 思考文本 */
.feed-captain-text {
  font-size: 14px;
  color: var(--dark, #1d2129);
  line-height: 1.7;
  padding: 0 2px;
}

/* Agent 执行卡 */
.feed-agent-card {
  border: 1px solid var(--border, #e4e7ed);
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg, #fff);
}
.feed-agent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--card-bg, #fff);
}
.feed-agent-emoji { font-size: 15px; }
.feed-agent-name { font-size: 13px; font-weight: 600; color: var(--dark, #1d2129); flex: 1; }
.feed-agent-tag {
  font-size: 11px;
  border-radius: 6px;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.feed-agent-tag.running { background: #eef2ff; color: #6366f1; }
.feed-agent-tag.done { background: #f0fdf4; color: #16a34a; }
.spin-dot {
  width: 7px; height: 7px;
  border: 1.5px solid #6366f1;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.feed-agent-task {
  padding: 0 14px 8px;
  font-size: 11px;
  color: var(--dim, #86909c);
  border-bottom: 1px solid var(--border, #f0f0f5);
}
.feed-agent-output {
  padding: 10px 14px;
  font-size: 13px;
  color: var(--mid, #4e5969);
  line-height: 1.6;
  max-height: 180px;
  overflow-y: auto;
  white-space: pre-wrap;
}

/* 工具调用 */
.feed-tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--mid, #86909c);
  background: var(--gray, #f7f8fa);
  border: 1px solid var(--border, #e4e7ed);
  border-radius: 6px;
  padding: 3px 10px;
  width: fit-content;
}
.feed-tool-dot { width: 5px; height: 5px; border-radius: 50%; }
.feed-tool-dot.done { background: #22c55e; }
.feed-tool-dot.running { background: #6366f1; animation: pulse 1s infinite; }

/* 加载 */
.feed-thinking {
  display: flex;
  align-items: center;
  gap: 10px;
}
.feed-thinking-label { font-size: 11px; color: #86909c; }
.feed-dots { display: flex; gap: 3px; }
.feed-dots span {
  width: 5px; height: 5px;
  background: #c7c9ff;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.feed-dots span:nth-child(2) { animation-delay: 0.18s; }
.feed-dots span:nth-child(3) { animation-delay: 0.36s; }

/* 输入区 */
.captain-compose {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #f0f0f5);
  background: var(--gray, #fafbfc);
  flex-shrink: 0;
}
.captain-compose-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--dark, #1d2129);
  background: transparent;
  padding: 4px 0;
}
.captain-compose-input::placeholder { color: #c9cdd4; }
.captain-compose-input:disabled { opacity: 0.5; }
.captain-compose-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.compose-hint { font-size: 11px; color: #c9cdd4; }
.compose-clear {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: transparent;
  color: #86909c;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.compose-clear:hover { border-color: #fca5a5; color: #ef4444; background: #fff5f5; }
.compose-send {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: #6366f1;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.compose-send:hover:not(:disabled) { background: #4f46e5; }
.compose-send:disabled { opacity: 0.35; cursor: not-allowed; }

/* 关于弹窗 */
.about-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.about-modal {
  background: var(--card-bg, #fff);
  border-radius: 20px;
  padding: 32px;
  max-width: 520px;
  width: 100%;
  position: relative;
  box-shadow: 0 24px 64px rgba(0,0,0,0.16);
  max-height: 85vh;
  overflow-y: auto;
}
.about-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border, #e4e7ed);
  background: var(--gray, #f7f8fa);
  color: var(--mid, #86909c);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.about-close:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }
.about-icon { font-size: 40px; margin-bottom: 12px; }
.about-title { font-size: 22px; font-weight: 700; color: var(--dark, #1d2129); margin: 0 0 8px; }
.about-lead { font-size: 14px; color: var(--mid, #4e5969); line-height: 1.6; margin: 0 0 24px; }
.about-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
.about-item { display: flex; gap: 12px; align-items: flex-start; }
.about-item-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.about-item-title { font-size: 13px; font-weight: 600; color: var(--dark, #1d2129); margin-bottom: 2px; }
.about-item-desc { font-size: 12px; color: var(--dim, #86909c); line-height: 1.5; }
.about-agents-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: var(--dim, #86909c); text-transform: uppercase; margin-bottom: 10px; }
.about-agents-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.about-agent-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
}
.about-agent-specialty { color: #c9cdd4; font-size: 11px; }

@keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 领取体验弹窗 wb-* ── */
.wb-body {
  position: relative; padding: 32px 28px 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.wb-close {
  position: absolute; top: 14px; right: 14px;
  width: 28px; height: 28px; background: rgba(0,0,0,0.05);
  border: none; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(29,29,31,0.4); transition: background 0.15s;
}
.wb-close:hover { background: rgba(0,0,0,0.1); }
.wb-icon {
  width: 52px; height: 52px; background: var(--gray, #f5f5f7); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px; color: var(--dark, #1d1d1f); font-size: 26px;
}
.wb-title { font-size: 17px; font-weight: 800; color: #1d1d1f; margin-bottom: 6px; text-align: center; }
.wb-desc { font-size: 13px; color: rgba(29,29,31,0.45); margin-bottom: 16px; line-height: 1.5; text-align: center; }
.wb-upgrade-btn {
  display: block; width: 100%; background: #1d1d1f; color: #fff;
  border: none; cursor: pointer; font-size: 14px; font-weight: 700;
  padding: 13px; border-radius: 12px; margin-bottom: 8px; transition: background 0.15s;
}
.wb-upgrade-btn:hover { background: #3a3a3a; }
.wb-cancel {
  display: block; width: 100%; background: none; color: rgba(29,29,31,0.4);
  border: 1px solid rgba(0,0,0,0.09); cursor: pointer; font-size: 13px;
  padding: 11px; border-radius: 12px; transition: background 0.15s;
}
.wb-cancel:hover { background: rgba(0,0,0,0.03); }

/* ── Upgrade Bar (Portal 顶部体验横幅) ── */
.upgrade-bar {
  background: #1d1d1f;
  padding: 10px 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}
.upgrade-bar-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 1200px;
  margin: 0 auto;
}
.upgrade-bar-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.4;
  font-weight: 500;
}
.upgrade-bar-left strong { color: #fff; font-weight: 700; }
.upgrade-bar-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #f5a623; flex-shrink: 0;
  animation: upgradePulse 2s ease-in-out infinite;
}
@keyframes upgradePulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
.upgrade-bar-trial-btn {
  background: rgba(255,255,255,0.12);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer;
  font-size: 11px; font-weight: 700;
  padding: 6px 14px; border-radius: 999px;
  white-space: nowrap; flex-shrink: 0;
  transition: background 0.15s;
}
.upgrade-bar-trial-btn:hover { background: rgba(255,255,255,0.2); }
.upgrade-bar-btn {
  background: #fff; color: #1d1d1f;
  border: none; cursor: pointer;
  font-size: 11px; font-weight: 700;
  padding: 6px 14px; border-radius: 999px;
  white-space: nowrap; flex-shrink: 0;
  transition: background 0.15s;
}
.upgrade-bar-btn:hover { background: rgba(255,255,255,0.88); }

/* ── Nav trial/upgrade buttons ── */
.nav-trial-btn {
  background: rgba(245,166,35,0.15);
  color: #f5a623;
  border: 1px solid rgba(245,166,35,0.3);
  cursor: pointer;
  font-size: 12px; font-weight: 600;
  padding: 7px 14px; border-radius: 999px;
  white-space: nowrap;
  transition: background 0.15s;
}
.nav-trial-btn:hover { background: rgba(245,166,35,0.25); }
.nav-upgrade-btn {
  background: #fff; color: #1d1d1f;
  border: none; cursor: pointer;
  font-size: 12px; font-weight: 700;
  padding: 7px 16px; border-radius: 999px;
  white-space: nowrap;
  transition: background 0.15s;
}
.nav-upgrade-btn:hover { background: rgba(255,255,255,0.88); }

/* ── 通用 section 标题 ── */
.section-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
  color: #0071e3; text-transform: uppercase; margin-bottom: 12px;
}
.section-title {
  font-size: clamp(22px, 3vw, 36px); font-weight: 800; letter-spacing: -0.03em;
  color: #1d1d1f; line-height: 1.2; margin: 0 0 16px; text-align: center;
}
.section-title-blue { color: #0071e3; }
.section-sub {
  font-size: 15px; color: rgba(29,29,31,0.5); line-height: 1.7;
  max-width: 680px; margin: 0 auto 40px; text-align: center;
}

/* ── Feature Pills ── */
.feature-pills {
  display: flex; flex-wrap: wrap; gap: 10px;
  justify-content: center; margin-bottom: 52px;
}
.feature-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 999px;
  background: #fff; border: 1px solid rgba(0,113,227,0.15);
  font-size: 12px; font-weight: 600; color: #1d1d1f;
  transition: background 0.2s, border-color 0.2s;
}
.feature-pill:hover { background: rgba(0,113,227,0.06); border-color: rgba(0,113,227,0.3); }
.feature-pill-ai { border-color: rgba(245,158,11,0.25); color: #92400e; }
.feature-pill-ai:hover { background: rgba(245,158,11,0.08); }
.feature-pill-safe { border-color: rgba(5,150,105,0.25); color: #065f46; }
.feature-pill-safe:hover { background: rgba(5,150,105,0.08); }

/* ── 功能全览区 ── */
.overview-section {
  background: #f5f5f7;
  padding: 80px 24px;
}
.overview-inner {
  max-width: 1100px; margin: 0 auto;
}
.overview-divider {
  display: flex; align-items: center; gap: 16px;
  margin: 48px 0;
}
.overview-divider::before, .overview-divider::after {
  content: ''; flex: 1;
  height: 1px; background: rgba(0,0,0,0.1);
}
.overview-divider span {
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: rgba(29,29,31,0.35);
  white-space: nowrap;
}

/* ── 服务器卡片 ── */
/* ── Server Section Header ── */
.server-section-header {
  text-align: center;
  margin-bottom: 40px;
}
.server-section-title {
  font-size: clamp(20px, 2.8vw, 30px); font-weight: 800;
  letter-spacing: -0.03em; line-height: 1.25; color: #1d1d1f; margin: 0 0 14px;
}
.server-section-highlight { color: #0071e3; }
.server-section-sub {
  font-size: 15px; color: rgba(29,29,31,0.55); max-width: 620px;
  margin: 0 auto; line-height: 1.7;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.server-card {
  background: #fff;
  border-radius: 18px;
  padding: 28px 24px;
  border: 1px solid rgba(0,0,0,0.06);
  transition: box-shadow 0.3s, transform 0.3s;
  position: relative;
  overflow: hidden;
}
.server-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.1); transform: translateY(-4px); }

/* 卡片颜色变体 */
.server-card-blue  { border-color: rgba(0,113,227,0.12); }
.server-card-green { border-color: rgba(5,150,105,0.12); }
.server-card-purple{ border-color: rgba(124,58,237,0.12); }
.server-card-orange{ border-color: rgba(234,88,12,0.12); }
.server-card-red   { border-color: rgba(220,38,38,0.12); }
.server-card-ai-feature {
  background: linear-gradient(135deg, #0c1445 0%, #1a2580 100%);
  border-color: rgba(0,113,227,0.3);
}
.server-card-ai-feature .server-card-title { color: #fff; }
.server-card-ai-feature .server-card-desc  { color: rgba(255,255,255,0.6); }
.server-card-ai-badge {
  display: inline-flex; font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #f59e0b;
  background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.25);
  padding: 2px 8px; border-radius: 999px; margin-bottom: 14px;
}

.server-card-icon-svg {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px; flex-shrink: 0;
  transition: transform 0.3s;
}
.server-card:hover .server-card-icon-svg { transform: scale(1.1) rotate(-4deg); }
.server-icon-blue   { background: rgba(0,113,227,0.08); }
.server-icon-green  { background: rgba(5,150,105,0.08); }
.server-icon-purple { background: rgba(124,58,237,0.08); }
.server-icon-orange { background: rgba(234,88,12,0.08); }
.server-icon-red    { background: rgba(220,38,38,0.08); }
.server-icon-ai     { background: rgba(245,158,11,0.12); }

.server-card-title { font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 8px; }
.server-card-desc { font-size: 13px; color: rgba(29,29,31,0.5); line-height: 1.6; }
.extra-icon-svg {
  width: 36px; height: 36px; flex-shrink: 0;
  background: #f5f5f7; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

/* ── 升级 CTA 区 ── */
.cta-section {
  background: #1d1d1f;
  padding: 80px 24px;
  text-align: center;
}
.cta-inner { max-width: 780px; margin: 0 auto; }
.cta-badge {
  display: inline-block;
  background: rgba(245,166,35,0.15); color: #f5a623;
  border: 1px solid rgba(245,166,35,0.3);
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  padding: 4px 12px; border-radius: 999px; margin-bottom: 20px;
}
.cta-title {
  font-size: 40px; font-weight: 800; letter-spacing: -0.03em;
  color: #fff; line-height: 1.15; margin: 0 0 16px;
}
.cta-sub {
  font-size: 15px; color: rgba(255,255,255,0.45); line-height: 1.7;
  margin: 0 0 40px;
}
.cta-plans {
  display: flex; gap: 16px; justify-content: center;
  margin-bottom: 36px; flex-wrap: wrap;
}
.cta-plan {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 20px 28px;
  min-width: 160px; position: relative;
  transition: background 0.2s;
  cursor: pointer;
}
.cta-plan:hover { background: rgba(255,255,255,0.1); }
.cta-plan-popular {
  background: rgba(0,113,227,0.15);
  border-color: rgba(0,113,227,0.4);
}
.cta-plan-tag {
  position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
  background: #0071e3; color: #fff;
  font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
  padding: 3px 10px; border-radius: 999px; white-space: nowrap;
}
.cta-plan-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
.cta-plan-price { font-size: 14px; font-weight: 700; color: #fff; }
.cta-plan-price span { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
.cta-plan-note { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 6px; }
.cta-btn {
  display: inline-block;
  background: #fff; color: #1d1d1f;
  border: none; cursor: pointer;
  font-size: 15px; font-weight: 700;
  padding: 16px 40px; border-radius: 999px;
  transition: background 0.15s, transform 0.15s;
  margin-bottom: 20px;
}
.cta-btn:hover { background: rgba(255,255,255,0.88); transform: scale(0.98); }
.cta-hint {
  font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.6;
}
.cta-hint strong { color: rgba(255,255,255,0.55); }
.cta-trial-link {
  color: #f5a623; cursor: pointer; text-decoration: underline;
  text-underline-offset: 2px;
}
.cta-trial-link:hover { color: #ffba42; }

@media (max-width: 768px) {
  .server-grid { grid-template-columns: 1fr; }
  .workflow-flow { flex-direction: column; gap: 12px; }
  .flow-arrow { transform: rotate(90deg); align-self: center; padding: 4px 0; }
  .workflow-extra { grid-template-columns: 1fr; }
  .cta-plans { flex-direction: column; align-items: center; }
  .section-title { font-size: 26px; }
  .cta-title { font-size: 28px; }
}
</style>

<style>
.portal-page .write-block-dialog .el-dialog { border-radius: 20px !important; overflow: hidden; padding: 0 !important; }
.portal-page .write-block-dialog .el-dialog__header { display: none !important; }
.portal-page .write-block-dialog .el-dialog__body { padding: 0 !important; }
</style>
