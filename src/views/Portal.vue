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
      </div>
      <div class="nav-links">
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button v-if="isTrial && !trialStarted" class="nav-trial-btn" @click="showTrialModal = true">🎁 领取15天体验</button>
        <button v-if="isTrial" class="nav-upgrade-btn" @click="upgradeDialog?.open()">升级付费版</button>
        <button class="nav-btn" @click="logout">退出登录</button>
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

    <!-- Hero — 精简为一行标题 -->
    <div class="hero-compact">
      <span class="hero-badge">
        <span class="hero-badge-dot"></span>
        <span>数字游牧 · 全球化业务管理平台</span>
      </span>
      <span class="hero-compact-title">选择您的<span class="hero-title-blue"> 工作空间</span></span>
    </div>

    <!-- 主体区：左边模块卡片 + 右边 Captain -->
    <div class="main-layout">

      <!-- 左：模块卡片 -->
      <div class="cards-col">
        <!-- Module Cards — 2 main + 1 coming -->
        <div class="cards-grid">

      <!-- ERP -->
      <div class="portal-card" @click="go('/dashboard')">
        <div class="card-bg-icon">
          <svg width="400" height="400" viewBox="0 0 48 48" fill="none" opacity="1">
            <rect x="4" y="4" width="18" height="18" rx="3" fill="currentColor"/>
            <rect x="26" y="4" width="18" height="18" rx="3" fill="currentColor"/>
            <rect x="4" y="26" width="18" height="18" rx="3" fill="currentColor"/>
            <rect x="26" y="26" width="18" height="18" rx="3" fill="currentColor"/>
          </svg>
        </div>
        <div class="card-icon card-icon-dark">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="18" height="18" rx="3" fill="white" opacity="0.9"/>
            <rect x="26" y="4" width="18" height="18" rx="3" fill="white" opacity="0.6"/>
            <rect x="4" y="26" width="18" height="18" rx="3" fill="white" opacity="0.6"/>
            <rect x="26" y="26" width="18" height="18" rx="3" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <h2 class="card-title">游牧 ERP 系统</h2>
        <p class="card-desc">全球化业务管理中枢。实时监控库存、销售与财务，掌控全局。</p>
        <div class="card-tags">
          <span class="tag">销售</span>
          <span class="tag">采购</span>
          <span class="tag">仓库</span>
          <span class="tag">财务</span>
          <span class="tag">人事</span>
        </div>
        <div class="card-arrow">
          <span>管理中心</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- 智能体工作流 -->
      <div class="portal-card portal-card-blue" @click="go('/agent')">
        <div class="card-bg-icon card-bg-blue">
          <svg width="400" height="400" viewBox="0 0 24 24" fill="none" opacity="1">
            <circle cx="12" cy="8" r="5" fill="currentColor"/>
            <path d="M3 21c0-5 4-9 9-9s9 4 9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="card-icon card-icon-blue">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="18" r="10" fill="white" opacity="0.9"/>
            <path d="M10 42c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
            <circle cx="36" cy="36" r="6" fill="white" opacity="0.8"/>
            <path d="M33 36h6M36 33v6" stroke="#0071e3" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="card-title">智能体工作流</h2>
        <p class="card-desc">AI 驱动的内容自动化系统。热搜抓取、文案生成、海报制作到多平台一键发布。</p>
        <div class="card-tags">
          <span class="tag tag-blue">热搜抓取</span>
          <span class="tag tag-blue">文案生成</span>
          <span class="tag tag-blue">自动发布</span>
        </div>
        <div class="card-arrow">
          <span>立即进入</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- Coming soon -->
      <div class="portal-card portal-card-dim">
        <div class="card-icon card-icon-dim">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="3" opacity="0.4"/>
            <path d="M24 16v8l5 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
          </svg>
        </div>
        <h2 class="card-title" style="opacity:0.3">即将推出</h2>
        <p class="card-desc" style="opacity:0.2">更多功能模块敬请期待，BI数据大屏、供应链协同门户正在开发中。</p>
        <div class="card-arrow" style="opacity:0.15">
          <span>敬请期待</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
      </div><!-- /cards-grid -->
      </div><!-- /cards-col -->

      <!-- 右：Captain 总控台 -->
      <div class="captain-wrap">

        <!-- 了解 Captain 弹窗 -->
        <div v-if="captainAboutOpen" class="about-overlay" @click.self="captainAboutOpen = false">
          <div class="about-modal">
            <button class="about-close" @click="captainAboutOpen = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div class="about-icon">🎯</div>
            <h3 class="about-title">关于 Captain</h3>
            <p class="about-lead">Captain 是数字游牧 Agency 的智能指挥官，它不只是一个聊天机器人。</p>
            <div class="about-list">
              <div class="about-item" v-for="item in aboutItems" :key="item.title">
                <div class="about-item-icon" :style="{ background: item.color + '15', color: item.color }">{{ item.emoji }}</div>
                <div>
                  <div class="about-item-title">{{ item.title }}</div>
                  <div class="about-item-desc">{{ item.desc }}</div>
                </div>
              </div>
            </div>
            <div class="about-agents">
              <div class="about-agents-label">旗下 Agent 团队</div>
              <div class="about-agents-grid">
                <div v-for="a in agentList" :key="a.id" class="about-agent-chip" :style="{ background: a.color + '12', borderColor: a.color + '30' }">
                  <span>{{ a.emoji }}</span>
                  <span :style="{ color: a.color }">{{ a.name }}</span>
                  <span class="about-agent-specialty">{{ a.specialty }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主体：左右布局 -->
        <div class="captain-main">

          <!-- 左：身份信息栏 -->
          <div class="captain-sidebar">
            <div class="captain-glyph">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div class="captain-label">
              CAPTAIN
              <span class="captain-live"><span class="captain-live-dot"></span>LIVE</span>
            </div>
            <div class="captain-tagline">调度整个 Agency 完成你的目标</div>
            <div class="captain-team-pills">
              <div v-for="a in agentList" :key="a.id" class="team-pill" :style="{ '--c': a.color }" :title="a.name + ' · ' + a.specialty">
                <span>{{ a.emoji }}</span>
              </div>
            </div>
            <button class="about-btn" @click="captainAboutOpen = true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              了解 Captain
            </button>
          </div>

          <!-- 右：对话区 -->
          <div class="captain-chat">
            <!-- 消息区 -->
            <div ref="chatScrollRef" class="captain-feed">
              <!-- 空状态 -->
              <div v-if="captainMessages.length === 0" class="feed-empty">
                <div class="feed-empty-grid">
                  <button v-for="p in quickPrompts" :key="p" class="feed-prompt" @click="sendCaptain(p)">
                    <span class="feed-prompt-text">{{ p }}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>

              <template v-for="(msg, idx) in captainMessages" :key="idx">
                <div v-if="msg.role === 'user'" class="feed-row feed-user">
                  <div class="feed-bubble-user">{{ msg.content }}</div>
                </div>
                <div v-else class="feed-row feed-agency">
                  <div class="feed-agency-inner">
                    <template v-for="(step, si) in msg.steps" :key="si">
                      <div v-if="step.type === 'captain_text'" class="feed-captain-text" v-html="renderMd(step.text)"></div>
                      <div v-else-if="step.type === 'agent_start'" class="feed-agent-card">
                        <div class="feed-agent-header" :style="{ background: getAgentColor(step.agentId) + '10' }">
                          <span class="feed-agent-emoji">{{ step.emoji }}</span>
                          <span class="feed-agent-name">{{ step.agentName }}</span>
                          <div class="feed-agent-tag" :class="step.status">
                            <span v-if="step.status === 'running'" class="spin-dot"></span>
                            <span>{{ step.status === 'running' ? '执行中' : '完成' }}</span>
                          </div>
                        </div>
                        <div class="feed-agent-task">{{ step.task }}</div>
                        <div v-if="step.output" class="feed-agent-output">{{ step.output }}</div>
                      </div>
                      <div v-else-if="step.type === 'tool'" class="feed-tool">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                        {{ step.label }}
                        <span class="feed-tool-dot" :class="step.status"></span>
                      </div>
                    </template>
                  </div>
                </div>
              </template>

              <div v-if="captainLoading" class="feed-thinking">
                <span class="feed-thinking-label">🎯 Captain</span>
                <div class="feed-dots"><span></span><span></span><span></span></div>
              </div>
            </div>

            <!-- 输入区 -->
            <div class="captain-compose">
              <input
                ref="captainInputRef"
                v-model="captainInput"
                class="captain-compose-input"
                placeholder="输入目标，Captain 自动调度 Agency..."
                @keydown.enter.prevent="sendCaptain()"
                :disabled="captainLoading"
              />
              <div class="captain-compose-actions">
                <button v-if="captainMessages.length > 0" class="compose-clear" @click="captainMessages = []" title="清空对话">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                </button>
                <button class="compose-send" :disabled="captainLoading || !captainInput.trim()" @click="sendCaptain()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div><!-- /captain-wrap -->

    </div><!-- /main-layout -->

    <!-- Platform Description (moved from hero) -->
    <section class="platform-desc">
      <div class="platform-desc-inner">
        <div class="hero-badge" style="justify-content:center;margin-bottom:20px">
          <span class="hero-badge-dot"></span>
          <span>下一代数字资产自动化引擎</span>
        </div>
        <p class="hero-subtitle" style="text-align:center;max-width:700px;margin:0 auto">
          融合 AI 智能体与全球化 ERP 架构，让您的业务在云端自由流动。从自动化的库存预测到智能化的广告创意生成，每一个决策都由最先进的神经网络驱动。
        </p>
      </div>
    </section>

    <!-- Neural Section -->
    <section class="neural-section">
      <div class="neural-glow"></div>
      <div class="neural-content">
        <div class="neural-left">
          <div class="neural-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/>
            </svg>
            <span>AI Neural Engine v2.0</span>
          </div>
          <h2 class="neural-title">由 Claude AI<br />驱动的神经中枢</h2>
          <p class="neural-desc">融合 AI 智能体与全球化 ERP 架构，从自动化的库存预测到智能化的广告创意生成，每一个决策都由最先进的神经网络驱动。</p>
          <div class="neural-stats">
            <div class="stat"><div class="stat-num">99.9%</div><div class="stat-label">UPTIME</div></div>
            <div class="stat"><div class="stat-num">12ms</div><div class="stat-label">LATENCY</div></div>
            <div class="stat"><div class="stat-num">24/7</div><div class="stat-label">AI SUPPORT</div></div>
          </div>
        </div>
        <div class="neural-grid">
          <div class="neural-card"><div class="neural-card-icon">🌐</div><div class="neural-card-title">全球同步</div><div class="neural-card-desc">实时数据同步</div></div>
          <div class="neural-card"><div class="neural-card-icon">⚡</div><div class="neural-card-title">极速响应</div><div class="neural-card-desc">毫秒级执行</div></div>
          <div class="neural-card"><div class="neural-card-icon">🔒</div><div class="neural-card-title">端到端加密</div><div class="neural-card-desc">最高安全等级</div></div>
          <div class="neural-card"><div class="neural-card-icon">📊</div><div class="neural-card-title">实时监控</div><div class="neural-card-desc">业务全景视图</div></div>
        </div>
      </div>
    </section>

    <!-- ── 独立服务器优势 ── -->
    <section class="server-section">
      <div class="server-inner">
        <div class="section-eyebrow">DEDICATED INFRASTRUCTURE</div>
        <h2 class="section-title">专属独立服务器<br/>您的数据，只属于您</h2>
        <p class="section-sub">付费版为每位客户配置完全隔离的独立数据库实例，告别共享环境的安全隐患</p>
        <div class="server-grid">
          <div class="server-card">
            <div class="server-card-icon">🔒</div>
            <div class="server-card-title">数据完全隔离</div>
            <div class="server-card-desc">专属数据库实例，与其他用户物理隔离，杜绝数据泄露风险。您的订单、财务、客户数据只有您能访问。</div>
          </div>
          <div class="server-card">
            <div class="server-card-icon">⚡</div>
            <div class="server-card-title">性能独享不共享</div>
            <div class="server-card-desc">独立计算资源，高峰期不受其他用户影响。支持百万级 SKU 和千万级订单，稳定流畅无卡顿。</div>
          </div>
          <div class="server-card">
            <div class="server-card-icon">💾</div>
            <div class="server-card-title">自动备份永久保存</div>
            <div class="server-card-desc">每日自动备份，数据永久保存，支持任意时间点恢复。业务数据是您最宝贵的资产，我们帮您守护。</div>
          </div>
          <div class="server-card">
            <div class="server-card-icon">🌍</div>
            <div class="server-card-title">全球节点低延迟</div>
            <div class="server-card-desc">部署于全球多地区节点，无论您的团队在中国、东南亚还是欧美，都能享受极速访问体验。</div>
          </div>
          <div class="server-card">
            <div class="server-card-icon">🛡️</div>
            <div class="server-card-title">企业级安全防护</div>
            <div class="server-card-desc">DDoS 防护、HTTPS 加密、IP 白名单、操作日志审计，符合企业信息安全管理要求。</div>
          </div>
          <div class="server-card">
            <div class="server-card-icon">🔧</div>
            <div class="server-card-title">专属技术支持</div>
            <div class="server-card-desc">付费用户享有优先响应通道，专属客服 2 小时内响应。数据迁移、功能定制、使用培训全程陪伴。</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── ERP 完整工作流 ── -->
    <section class="workflow-section">
      <div class="workflow-inner">
        <div class="section-eyebrow">COMPLETE ERP WORKFLOW</div>
        <h2 class="section-title">一套系统，贯穿全链路</h2>
        <p class="section-sub">从供应商询价到客户收款，从原材料入库到成品出口，数字游牧 ERP 覆盖跨境业务每一个关键节点</p>

        <div class="workflow-flow">
          <div class="flow-step">
            <div class="flow-step-num">01</div>
            <div class="flow-step-icon">📦</div>
            <div class="flow-step-title">采购管理</div>
            <div class="flow-step-desc">供应商管理、询报价、采购订单、到货验收、货款结算</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="flow-step-num">02</div>
            <div class="flow-step-icon">🏭</div>
            <div class="flow-step-title">仓库管理</div>
            <div class="flow-step-desc">多仓库管理、入库出库、库存盘点、调拨转仓、报废处理</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="flow-step-num">03</div>
            <div class="flow-step-icon">💼</div>
            <div class="flow-step-title">销售管理</div>
            <div class="flow-step-desc">客户管理、销售订单、发货跟踪、退换货处理、业绩统计</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="flow-step-num">04</div>
            <div class="flow-step-icon">💰</div>
            <div class="flow-step-title">财务管理</div>
            <div class="flow-step-desc">应收应付、收款付款、资金账户、财务报表、成本核算</div>
          </div>
        </div>

        <div class="workflow-extra">
          <div class="extra-card">
            <span class="extra-icon">🤖</span>
            <div>
              <div class="extra-title">AI 智能体工作流</div>
              <div class="extra-desc">热搜抓取 · 文案生成 · 海报制作 · 多平台自动发布</div>
            </div>
          </div>
          <div class="extra-card">
            <span class="extra-icon">👥</span>
            <div>
              <div class="extra-title">人事 & 协同</div>
              <div class="extra-desc">员工档案 · 考勤管理 · 权限分配 · 多角色协作</div>
            </div>
          </div>
          <div class="extra-card">
            <span class="extra-icon">📊</span>
            <div>
              <div class="extra-title">数据报表</div>
              <div class="extra-desc">销售分析 · 库存预警 · 财务汇总 · 经营大盘</div>
            </div>
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
          <div class="cta-plan">
            <div class="cta-plan-name">月付版</div>
            <div class="cta-plan-price">¥<span>99</span>/月</div>
          </div>
          <div class="cta-plan cta-plan-popular">
            <div class="cta-plan-tag">最受欢迎</div>
            <div class="cta-plan-name">年付版</div>
            <div class="cta-plan-price">¥<span>799</span>/年</div>
            <div class="cta-plan-note">相当于 ¥66/月，省 ¥389</div>
          </div>
          <div class="cta-plan">
            <div class="cta-plan-name">买断版</div>
            <div class="cta-plan-price">¥<span>1999</span>/永久</div>
            <div class="cta-plan-note">一次付清，含 3 年支持</div>
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
import UpgradeDialog from '@/components/UpgradeDialog.vue'

const router = useRouter()
const auth = useAuthStore()

function go(path: string) { router.push(path) }
function logout() { auth.logout(); router.push('/login') }

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

// ── Captain 对话状态 ────────────────────────────────────────────────────────
interface Step {
  type: 'agent_start' | 'captain_text' | 'tool'
  agentId?: string; agentName?: string; emoji?: string
  task?: string; output?: string; status?: string
  text?: string; label?: string
}
interface CaptainMsg { role: 'user' | 'agency'; content: string; steps: Step[] }

const captainMessages = ref<CaptainMsg[]>([])
const captainInput = ref('')
const captainLoading = ref(false)
const captainOpen = ref(false)
const captainAboutOpen = ref(false)
const chatScrollRef = ref<HTMLDivElement>()
const captainInputRef = ref<HTMLInputElement>()

function getAgentColor(agentId?: string): string {
  const found = agentList.find(a => a.id === agentId)
  return found?.color ?? '#6366f1'
}

const quickPrompts = [
  '分析本月销售数据，生成小红书推广文案',
  '帮我规划一个新品上市的内容发布计划',
  '追踪当前热点，给出3个选题方向',
]

function renderMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

async function scrollBottom() {
  await nextTick()
  if (chatScrollRef.value) chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
}

async function sendCaptain(text?: string) {
  const content = (text ?? captainInput.value).trim()
  if (!content || captainLoading.value) return
  captainInput.value = ''
  captainLoading.value = true

  captainMessages.value.push({ role: 'user', content, steps: [] })
  const agencyMsg: CaptainMsg = { role: 'agency', content: '', steps: [] }
  captainMessages.value.push(agencyMsg)
  await scrollBottom()

  // 跟踪每个agent步骤
  const agentSteps: Record<string, number> = {}
  const toolSteps: Record<string, number> = {}

  try {
    const history = captainMessages.value
      .filter(m => m.role === 'user')
      .map(m => ({ role: 'user', content: m.content }))

    const resp = await fetch('/api/captain-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': localStorage.getItem('erp_token') || '' },
      body: JSON.stringify({ messages: history }),
    })
    if (!resp.body) throw new Error('No response body')
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const evt = JSON.parse(raw)
          if (evt.type === 'agent_thinking') {
            if (evt.agentId === 'captain') {
              // Captain 思考文本 — 找或创建 captain_text step
              const last = agencyMsg.steps[agencyMsg.steps.length - 1]
              if (last?.type === 'captain_text') {
                last.text = (last.text ?? '') + evt.text
              } else if (evt.text) {
                agencyMsg.steps.push({ type: 'captain_text', text: evt.text })
              }
            } else {
              // 专项agent思考 — 追加到对应 agent_start 的 output
              const idx = agentSteps[evt.agentId]
              if (idx !== undefined) {
                const step = agencyMsg.steps[idx]
                step.output = (step.output ?? '') + evt.text
              }
            }
          } else if (evt.type === 'agent_start') {
            const idx = agencyMsg.steps.length
            agentSteps[evt.agentId] = idx
            agencyMsg.steps.push({ type: 'agent_start', agentId: evt.agentId, agentName: evt.agentName, emoji: evt.emoji, task: evt.task, output: '', status: 'running' })
          } else if (evt.type === 'agent_done') {
            const idx = agentSteps[evt.agentId]
            if (idx !== undefined) agencyMsg.steps[idx].status = 'done'
          } else if (evt.type === 'tool_start') {
            const idx = agencyMsg.steps.length
            toolSteps[evt.id] = idx
            agencyMsg.steps.push({ type: 'tool', label: TOOL_LABELS[evt.name] ?? evt.name, status: 'running' })
          } else if (evt.type === 'tool_result') {
            const idx = toolSteps[evt.id]
            if (idx !== undefined) agencyMsg.steps[idx].status = 'done'
          }
          // 强制响应式更新
          captainMessages.value = [...captainMessages.value]
          await scrollBottom()
        } catch {}
      }
    }
  } catch (e: any) {
    agencyMsg.steps.push({ type: 'captain_text', text: `❌ 出错：${e.message}` })
  } finally {
    captainLoading.value = false
    captainMessages.value = [...captainMessages.value]
    await scrollBottom()
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.portal-page {
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1d1d1f;
  overflow-x: hidden;
}

/* ── Nav ── */
.glass-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
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

.nav-logo-text { font-size: 18px; font-weight: 800; letter-spacing: -0.04em; color: #1d1d1f; }

.nav-links { display: flex; gap: 40px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(29,29,31,0.3); }
.nav-links span { cursor: pointer; transition: color 0.2s; }
.nav-links span:hover { color: #0071e3; }

.nav-btn {
  padding: 10px 24px;
  background: #0071e3;
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: 0 6px 20px rgba(0,113,227,0.25);
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
}
.nav-btn:hover { background: rgba(0,113,227,0.88); transform: scale(0.97); }

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

/* ── Main two-column layout ── */
.main-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  max-width: 1400px;
  margin: 0 auto 40px;
  padding: 0 32px;
}

.cards-col {
  flex: 1;
  min-width: 0;
}

/* ── Cards ── */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin: 0 0 0;
  padding: 0;
}

.portal-card {
  position: relative;
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 28px;
  padding: 36px 32px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 1s cubic-bezier(0.23,1,0.32,1), box-shadow 1s cubic-bezier(0.23,1,0.32,1);
  display: flex;
  flex-direction: column;
}

.portal-card:hover {
  transform: translateY(-14px) scale(1.02);
  box-shadow: 0 60px 100px rgba(0,0,0,0.09);
}

.portal-card-blue { background: #ffffff; }

.portal-card-dim { cursor: default; }
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
  width: 84px;
  height: 84px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 36px;
  transition: transform 0.6s cubic-bezier(0.23,1,0.32,1);
  flex-shrink: 0;
}
.portal-card:hover .card-icon { transform: rotate(-6deg) scale(1.08); }

.card-icon-dark { background: #1d1d1f; box-shadow: 0 16px 40px rgba(0,0,0,0.22); }
.card-icon-blue  { background: #0071e3; box-shadow: 0 16px 40px rgba(0,113,227,0.3); }
.card-icon-dim   { background: rgba(29,29,31,0.06); color: rgba(29,29,31,0.25); }

.card-title {
  font-size: clamp(24px, 2.8vw, 34px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #1d1d1f;
  margin: 0 0 16px;
  line-height: 1.05;
}

.card-desc {
  font-size: 15px;
  color: rgba(29,29,31,0.42);
  line-height: 1.7;
  margin: 0 0 24px;
  font-weight: 500;
  flex: 1;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 32px;
}

.tag {
  padding: 5px 13px;
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(29,29,31,0.45);
  letter-spacing: 0.02em;
}

.tag-blue {
  background: rgba(0,113,227,0.08);
  color: #0071e3;
}

.card-arrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(29,29,31,0.3);
  transition: gap 0.4s cubic-bezier(0.23,1,0.32,1), color 0.3s;
  letter-spacing: -0.01em;
}
.portal-card-blue .card-arrow { color: #1d1d1f; }
.portal-card:hover:not(.portal-card-dim) .card-arrow { gap: 18px; color: #1d1d1f; }
.portal-card-blue:hover .card-arrow { color: #0071e3; }

/* ── Platform Description ── */
.platform-desc {
  padding: 56px 48px;
  text-align: center;
  background: #f5f5f7;
  border-top: 1px solid rgba(0,0,0,0.04);
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
  border-top: 1px solid rgba(0,0,0,0.06);
  background: #f5f5f7;
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
  .portal-card-dim { grid-column: span 2; }
}

@media (max-width: 768px) {
  .glass-nav { padding: 0 14px; height: 52px; }
  .nav-logo-text { font-size: 15px; }
  .nav-logo-icon svg { width: 26px; height: 26px; }
  .nav-links { display: none; }
  .nav-trial-btn, .nav-upgrade-btn { display: none; }
  .nav-btn { padding: 6px 14px; font-size: 12px; }
  .hero { padding: 36px 20px 28px; }
  .hero-title { font-size: 38px; line-height: 0.95; }
  .hero-sub { font-size: 14px; margin-top: 12px; }
  .upgrade-bar { font-size: 12px; }
  .upgrade-bar-inner { padding: 8px 16px; flex-direction: column; gap: 6px; align-items: flex-start; }
  .main-layout { padding: 0 16px; }
  .cards-grid { grid-template-columns: 1fr; gap: 12px; }
  .portal-card { padding: 28px 22px; border-radius: 24px; }
  .portal-card-dim { grid-column: auto; }
  .card-icon { width: 52px; height: 52px; border-radius: 16px; }
  .card-icon svg { width: 30px; height: 30px; }
  .card-title { font-size: 20px; margin-top: 14px; }
  .card-desc { font-size: 13px; margin-top: 8px; }
  .captain-wrap { margin-bottom: 24px; }
  .captain-main { flex-direction: column; }
  .captain-sidebar { width: 100%; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 10px; padding: 16px 18px; border-right: none; border-bottom: 1px solid #f0f0f5; }
  .captain-team-pills { margin-top: 0; }
  .about-btn { margin-top: 0; }
  .neural-content { grid-template-columns: 1fr; gap: 40px; }
  .neural-section { padding: 48px 20px; }
  .portal-footer { padding: 36px 20px; }
  .hide-sm { display: none; }
}

/* ── Captain 总控台 ── */
.captain-wrap {
  width: 460px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
}
.captain-main {
  display: flex;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  min-height: 340px;
}

/* ── 左侧身份栏 ── */
.captain-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f5;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  background: linear-gradient(160deg, #fafaff 0%, #f4f5ff 100%);
}
.captain-glyph {
  width: 42px; height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.captain-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #1d2129;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}
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
.captain-tagline {
  font-size: 13px;
  color: #86909c;
  font-weight: 400;
}
.captain-head-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.captain-team-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.team-pill {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--c) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 25%, transparent);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  cursor: default;
  transition: transform 0.15s;
}
.team-pill:hover { transform: scale(1.15); }
.about-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #e4e7ed;
  background: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 11px;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  margin-top: 4px;
}
.about-btn:hover { border-color: #6366f1; color: #6366f1; background: #f0f0ff; }

/* ── 右侧对话区 ── */
.captain-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.captain-feed {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scroll-behavior: smooth;
  min-height: 260px;
}
.captain-feed::-webkit-scrollbar { width: 4px; }
.captain-feed::-webkit-scrollbar-thumb { background: #e4e7ed; border-radius: 2px; }

/* 空状态 */
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
  background: #f7f8fa;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 12px;
  color: #4e5969;
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
  color: #1d2129;
  line-height: 1.7;
  padding: 0 2px;
}

/* Agent 执行卡 */
.feed-agent-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
}
.feed-agent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
}
.feed-agent-emoji { font-size: 15px; }
.feed-agent-name { font-size: 13px; font-weight: 600; color: #1d2129; flex: 1; }
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
  color: #86909c;
  border-bottom: 1px solid #f0f0f5;
}
.feed-agent-output {
  padding: 10px 14px;
  font-size: 13px;
  color: #4e5969;
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
  color: #86909c;
  background: #f7f8fa;
  border: 1px solid #e4e7ed;
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
  border-top: 1px solid #f0f0f5;
  background: #fafbfc;
}
.captain-compose-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1d2129;
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
  background: #fff;
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
  border: 1px solid #e4e7ed;
  background: #f7f8fa;
  color: #86909c;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.about-close:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }
.about-icon { font-size: 40px; margin-bottom: 12px; }
.about-title { font-size: 22px; font-weight: 700; color: #1d2129; margin: 0 0 8px; }
.about-lead { font-size: 14px; color: #4e5969; line-height: 1.6; margin: 0 0 24px; }
.about-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
.about-item { display: flex; gap: 12px; align-items: flex-start; }
.about-item-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.about-item-title { font-size: 13px; font-weight: 600; color: #1d2129; margin-bottom: 2px; }
.about-item-desc { font-size: 12px; color: #86909c; line-height: 1.5; }
.about-agents-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #86909c; text-transform: uppercase; margin-bottom: 10px; }
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
  width: 52px; height: 52px; background: #f5f5f7; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px; color: #1d1d1f; font-size: 26px;
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
  font-size: 36px; font-weight: 800; letter-spacing: -0.03em;
  color: #1d1d1f; line-height: 1.15; margin: 0 0 14px;
}
.section-sub {
  font-size: 15px; color: rgba(29,29,31,0.5); line-height: 1.6;
  max-width: 600px; margin: 0 0 48px;
}

/* ── 独立服务器区 ── */
.server-section {
  background: #f5f5f7;
  padding: 80px 24px;
}
.server-inner {
  max-width: 1100px; margin: 0 auto;
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
  transition: box-shadow 0.2s, transform 0.2s;
}
.server-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }
.server-card-icon { font-size: 28px; margin-bottom: 14px; }
.server-card-title { font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 8px; }
.server-card-desc { font-size: 13px; color: rgba(29,29,31,0.5); line-height: 1.6; }

/* ── ERP 工作流区 ── */
.workflow-section {
  background: #fff;
  padding: 80px 24px;
}
.workflow-inner { max-width: 1100px; margin: 0 auto; }
.workflow-flow {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin-bottom: 40px;
  overflow-x: auto;
}
.flow-step {
  flex: 1; min-width: 180px;
  background: #f5f5f7;
  border-radius: 16px;
  padding: 24px 20px;
  text-align: center;
}
.flow-step-num {
  font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
  color: #0071e3; margin-bottom: 10px;
}
.flow-step-icon { font-size: 28px; margin-bottom: 10px; }
.flow-step-title { font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 8px; }
.flow-step-desc { font-size: 11.5px; color: rgba(29,29,31,0.45); line-height: 1.6; }
.flow-arrow {
  flex-shrink: 0;
  font-size: 20px; color: rgba(29,29,31,0.2);
  align-self: center;
  padding: 0 10px;
}
.workflow-extra {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.extra-card {
  display: flex; align-items: flex-start; gap: 14px;
  background: #f5f5f7; border-radius: 14px; padding: 20px;
}
.extra-icon { font-size: 24px; flex-shrink: 0; }
.extra-title { font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 4px; }
.extra-desc { font-size: 12px; color: rgba(29,29,31,0.45); line-height: 1.5; }

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
