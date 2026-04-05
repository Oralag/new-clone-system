<template>
  <div class="dashboard">

    <!-- ══ 手机端首页 ══ -->
    <template v-if="isMobile">

      <!-- 顶部欢迎 Banner -->
      <div class="mh-banner">
        <div class="mh-banner-left">
          <div class="mh-greet">你好，{{ authStore.userName || '用户' }}</div>
          <div class="mh-date">{{ mobileToday }}</div>
        </div>
        <button class="mh-refresh" @click="loadDashboardData(true)" :class="{ spinning: dashboardLoading }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.02-8.36"/></svg>
        </button>
      </div>

      <!-- 今日核心指标卡片 -->
      <div class="mh-kpi-row">
        <div class="mh-kpi-card mh-kpi-main" @click="router.push('/dashboard/today-sales')">
          <div class="mh-kpi-label">今日销售额</div>
          <div class="mh-kpi-value">{{ stats[0].value }}</div>
          <div class="mh-kpi-sub">含销售 + 零售</div>
          <svg class="mh-kpi-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </div>
        <!-- 收银台按钮 -->
        <div class="mh-cashregister-btn" @click="router.push('/cashregister')">
          <div class="mh-crb-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="2" y="5" width="20" height="14" rx="3"/>
              <path d="M2 10h20M6 15h2M10 15h4"/>
            </svg>
          </div>
          <div class="mh-crb-label">零售收银台</div>
          <div class="mh-crb-desc">快速开单 · 扫码结账</div>
          <svg class="mh-crb-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- 三个小指标 -->
      <div class="mh-kpi-mini-row">
        <div class="mh-kpi-small" @click="router.push('/dashboard/today-sales')">
          <div class="mh-kpi-small-label">今日订单</div>
          <div class="mh-kpi-small-value">{{ stats[1].value }}</div>
        </div>
        <div class="mh-kpi-small" :class="{ warn: Number(stats[3].value) > 0 }" @click="router.push('/warehouse/stock')">
          <div class="mh-kpi-small-label">库存预警</div>
          <div class="mh-kpi-small-value" :style="{ color: Number(stats[3].value) > 0 ? '#f53f3f' : '' }">{{ stats[3].value }}</div>
        </div>
        <div class="mh-kpi-small" @click="router.push('/sale/client')">
          <div class="mh-kpi-small-label">客户总数</div>
          <div class="mh-kpi-small-value">{{ stats[2].value }}</div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="mh-section-card">
        <div class="mh-section-header">
          <span class="mh-section-title">快捷操作</span>
          <span class="mh-section-more" @click="router.push('/cashregister')">
            去收银台
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </span>
        </div>
        <div class="mh-quick-grid">
          <div v-for="item in mobileQuickActions" :key="item.path" class="mh-quick-item" @click="router.push(item.path)">
            <div class="mh-quick-icon" :style="{ background: item.bg }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="1.8" v-html="item.svg" />
            </div>
            <span class="mh-quick-label">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 常用应用 -->
      <div class="mh-section-card">
        <div class="mh-section-header">
          <span class="mh-section-title">常用应用</span>
          <span class="mh-section-more" @click="editMode ? saveCustom() : (editMode = true)">
            {{ editMode ? '完成' : '自定义' }}
          </span>
        </div>

        <!-- 编辑模式 -->
        <template v-if="editMode">
          <div class="m-edit-hint">勾选要展示的应用（最多8个）</div>
          <div v-for="section in allAppSections" :key="section.key" class="m-edit-section">
            <div class="m-edit-section-title">{{ section.title }}</div>
            <div class="m-edit-grid">
              <div v-for="item in section.children" :key="item.key"
                class="m-edit-item"
                :class="{ selected: editSelected.includes(item.key) }"
                @click="toggleEditItem(item)">
                <div class="m-edit-check">
                  <svg v-if="editSelected.includes(item.key)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="m-edit-icon" :style="{ background: getSectionColor(section.key) }">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" v-html="getAppIcon(item.key)" />
                </div>
                <span class="m-edit-label">{{ item.title }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 正常模式 -->
        <template v-else>
          <div class="mh-app-grid">
            <div v-for="item in currentQuickItems" :key="item.path" class="mh-app-item" @click="router.push(item.path)">
              <div class="mh-app-icon" :style="{ background: item.bg }">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="1.8" v-html="item.svg" />
              </div>
              <span class="mh-app-label">{{ item.label }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- AI 智能洞察 -->
      <div class="mh-insight-card">
        <div class="mh-insight-header">
          <div class="mh-insight-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/></svg>
          </div>
          <span class="mh-insight-title">AI 智能洞察</span>
          <span class="mh-insight-badge">实时分析</span>
        </div>
        <div class="mh-insight-list">
          <div v-for="item in insightItems" :key="item.tag" class="mh-insight-item">
            <span class="mh-insight-tag">{{ item.tag }}</span>
            <span class="mh-insight-text">{{ item.text }}</span>
          </div>
        </div>
      </div>

      <!-- 底部占位 -->
      <div style="height: 20px" />

    </template>

    <!-- ══ 桌面端内容（手机不显示） ══ -->
    <template v-if="!isMobile">

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/></svg>
          <span>Global Operations Center</span>
        </div>
        <h1 class="page-title" style="display:none">数字游牧概览</h1>
      </div>
    </div>

    <!-- Cash Register + Quick Entries -->
    <div class="action-hub">
      <!-- 收银台主按钮 -->
      <div class="cashregister-btn" @click="openNewWindow()">
        <div class="crb-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="2" y="5" width="20" height="14" rx="3"/>
            <path d="M2 10h20M6 15h2M10 15h4"/>
          </svg>
        </div>
        <div class="crb-info">
          <div class="crb-label">零售收银台</div>
          <div class="crb-desc">快速开单 · 扫码结账</div>
        </div>
        <svg class="crb-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-grid" data-guide-id="guide-dashboard-quick-grid">
        <div
          v-for="(item, index) in quickItems" :key="item.path"
          class="quick-item"
          @click="router.push(item.path)"
        >
          <div
            class="quick-item-anchor"
            :data-guide-id="index === 0 ? 'guide-dashboard-quick-first' : undefined"
          >
            <div class="quick-icon-wrap" :style="{ background: item.bg }">
              <svg :width="item.sw||20" :height="item.sh||20" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="1.8" v-html="item.svg" />
            </div>
            <span class="quick-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div
        v-for="(stat, idx) in stats" :key="stat.key"
        class="metric-card"
        @click="router.push(stat.link)"
      >
        <div class="metric-bg-icon">
          <el-icon :size="120"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="metric-top">
          <div class="metric-icon-wrap">
            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="metric-trend" :class="idx === 3 && stat.value !== '--' && Number(stat.value) > 0 ? 'trend-warn' : 'trend-up'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <span>实时</span>
          </div>
        </div>
        <div class="metric-label">{{ stat.label }}</div>
        <div class="metric-value">{{ stat.value }}</div>
        <div class="metric-sub">{{ stat.sub }}</div>
      </div>
    </div>

    <!-- Charts + Guide -->
    <div class="charts-row">
      <div class="left-col">
      <!-- Sales trend -->
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <div class="card-micro">Performance Metrics</div>
            <h3 class="card-title">近{{ trendDays }}天销售趋势</h3>
          </div>
          <div class="chart-tabs">
            <button :class="['chart-tab', trendDays === 7 ? 'active' : '']" @click="setTrendDays(7)">7天</button>
            <button :class="['chart-tab', trendDays === 30 ? 'active' : '']" @click="setTrendDays(30)">30天</button>
          </div>
        </div>
        <div ref="saleTrendRef" class="chart-area" />
      </div>

      <!-- Goods Ranking -->
      <div class="rank-card">
        <div class="card-header-row">
          <div>
            <div class="card-micro">Top Products</div>
            <h3 class="card-title">商品销售排行</h3>
          </div>
          <div class="chart-tabs">
            <button :class="['chart-tab', rankMode === 'qty' ? 'active' : '']" @click="rankMode = 'qty'">销售数量</button>
            <button :class="['chart-tab', rankMode === 'amt' ? 'active' : '']" @click="rankMode = 'amt'">销售金额</button>
          </div>
        </div>
        <div v-if="rankList.length === 0" class="rank-empty">暂无销售数据</div>
        <div v-else class="rank-list">
          <div v-for="(item, idx) in rankList" :key="item.name" class="rank-row">
            <div class="rank-no" :class="idx < 3 ? `rank-top${idx+1}` : ''">{{ idx + 1 }}</div>
            <div class="rank-name">
              <span>{{ item.name }}</span>
              <span v-if="item.spec" class="rank-spec">{{ item.spec }}</span>
            </div>
            <div class="rank-bar-wrap">
              <div class="rank-bar" :style="{ width: (item.value / rankList[0].value * 100).toFixed(1) + '%' }" />
            </div>
            <div class="rank-val">
              {{ rankMode === 'qty' ? (Number.isInteger(item.value) ? item.value : parseFloat(item.value.toFixed(4))) + (item.unit ? ' ' + item.unit : '') : '¥' + item.value.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- 右侧：智能洞察 + 销售统计 -->
      <div class="right-col">

        <!-- 新手向导卡片 -->
        <div v-if="!guideHidden" class="guide-side-card" :class="{ 'guide-pulse': isFirstVisit }">
          <div class="guide-side-header">
            <div class="guide-side-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              新手向导
              <a v-if="!guideStore.isFinished" class="guide-skip-all" @click="guideStore.skipAll()">全部跳过</a>
            </div>
            <div class="guide-side-actions">
              <div class="gmp-bar-wrap">
                <div class="gmp-bar" :style="{ width: guideStore.progressPercent + '%' }" />
              </div>
              <span class="gmp-label">{{ guideStore.handledCount }}/{{ guideStore.steps.length }} 已处理</span>
              <span class="gmp-time">约 15 分钟</span>
              <button class="guide-hide-btn" @click="hideGuide" title="收起向导">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="guide-capsules">
            <div
              v-for="(step, i) in guideStore.steps"
              :key="step.id"
              class="guide-capsule"
              :class="{
                active: guideStore.currentStep === i,
                done: guideStore.isStepCompleted(i),
                skipped: guideStore.isStepSkipped(i),
                locked: !guideStore.canOpenStep(i) && i > guideStore.currentStep,
              }"
              @click="guideStore.openStep(i)"
            >
              <span class="guide-capsule-num">{{ i + 1 }}</span>
              <span class="guide-capsule-name">{{ step.short }}</span>
            </div>
          </div>

          <div class="guide-step-num">
            Step {{ guideStore.currentStep + 1 }}
            <span v-if="guideStore.isStepCompleted(guideStore.currentStep)" class="guide-tag guide-tag--done">✓ 已完成</span>
            <span v-else-if="guideStore.isStepSkipped(guideStore.currentStep)" class="guide-tag guide-tag--skipped">已跳过</span>
            <span v-else class="guide-tag guide-tag--active">进行中</span>
            <span class="guide-tag guide-tag--action">操作 {{ guideStore.currentAction + 1 }}/{{ guideStore.currentActionCount }}</span>
          </div>
          <div class="guide-step-name">{{ currentGuideStep.title }}</div>
          <p class="guide-step-desc">{{ currentGuideStep.desc }}</p>

          <div v-if="guideStore.isFinished" class="guide-banner guide-banner--done">
            <div class="guide-celebrate-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <strong class="guide-celebrate-title">恭喜完成全部链路!</strong>
              <div>可以随时重新开始演示。</div>
            </div>
          </div>
          <div v-else class="guide-banner guide-banner--info">
            当前步骤会自动跳转页面并弹出指引弹窗，只有"完成此步"或"跳过此步"后才会进入下一步。
          </div>

          <div class="guide-action-list">
            <div v-for="(action, index) in guideStore.currentActions" :key="`${currentGuideStep.id}-${index}`" class="guide-action-row">
              <div class="gar-num">{{ index + 1 }}</div>
              <div class="gar-text">{{ action.text }}</div>
            </div>
          </div>

          <div class="guide-tip-inline" style="margin-bottom:12px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <div>
              <strong style="display:block;color:#0f172a;margin-bottom:4px">完成标准</strong>
              {{ currentGuideStep.result }}
              <template v-if="currentGuideStep.tip">
                <br />
                {{ currentGuideStep.tip }}
              </template>
            </div>
          </div>

          <button class="guide-goto-btn" @click="guideStore.startGuide(guideStore.currentStep)">
            {{ guideStore.active ? '继续当前步骤' : `前往 ${currentGuideStep.title}` }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          <div class="guide-nav-btns">
            <button class="gnb-prev" :disabled="guideStore.currentStep <= 0" @click="guideStore.setCurrentStep(guideStore.currentStep - 1)">← 上一步</button>
            <button v-if="!guideStore.isFinished" class="gnb-skip" @click="guideStore.skipCurrentAndNext()">跳过此步</button>
            <button v-else class="gnb-finish" @click="guideStore.restartGuide()">重新开始</button>
          </div>
        </div>
        <!-- 收起后的小入口 -->
        <div v-else class="guide-collapsed" @click="showGuide">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span>新手向导</span>
          <span class="guide-collapsed-progress">{{ guideStore.handledCount }}/{{ guideStore.steps.length }}</span>
        </div>

        <!-- 智能洞察（置顶） -->
        <div class="insights-card">
          <div class="insights-bg">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.5" opacity="0.08">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="insights-header">
            <div class="insights-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/></svg>
            </div>
            <div>
              <div class="insights-title">智能洞察</div>
              <div class="insights-sub">AI 数据引擎</div>
            </div>
          </div>
          <div class="insights-list">
            <div class="insight-item" v-for="item in insightItems" :key="item.tag">
              <div class="insight-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                {{ item.tag }}
              </div>
              <p class="insight-text">"{{ item.text }}"</p>
            </div>
          </div>
          <button class="insights-btn" @click="router.push('/finance/overview')">查看财务总览 →</button>
        </div>

        <!-- 销售统计总览 -->
        <div class="sale-stat-card">
          <div class="ssc-header">
            <div>
              <div class="card-micro">Sales Overview</div>
              <h3 class="card-title">销售统计</h3>
            </div>
            <div class="ssc-tabs">
              <button :class="['ssc-tab', statPeriod === 'today' ? 'active' : '']" @click="statPeriod = 'today'">今天</button>
              <button :class="['ssc-tab', statPeriod === '7d' ? 'active' : '']" @click="statPeriod = '7d'">近7天</button>
              <button :class="['ssc-tab', statPeriod === '30d' ? 'active' : '']" @click="statPeriod = '30d'">近30天</button>
              <button :class="['ssc-tab', statPeriod === '3m' ? 'active' : '']" @click="statPeriod = '3m'">近3月</button>
            </div>
          </div>

          <!-- 主指标 -->
          <div class="ssc-main-row">
            <div class="ssc-main-item">
              <div class="ssc-main-label">销售总额</div>
              <div class="ssc-main-value">¥{{ salesStats.totalAmt }}</div>
            </div>
            <div class="ssc-main-item">
              <div class="ssc-main-label">订单数</div>
              <div class="ssc-main-value">{{ salesStats.orderCount }}</div>
            </div>
          </div>

          <!-- 次级指标 -->
          <div class="ssc-sub-grid">
            <div class="ssc-sub-item">
              <div class="ssc-sub-label">销售出库</div>
              <div class="ssc-sub-value">¥{{ salesStats.saleAmt }}</div>
            </div>
            <div class="ssc-sub-item">
              <div class="ssc-sub-label">零售收款</div>
              <div class="ssc-sub-value">¥{{ salesStats.retailAmt }}</div>
            </div>
            <div class="ssc-sub-item">
              <div class="ssc-sub-label">均单金额</div>
              <div class="ssc-sub-value">¥{{ salesStats.avgAmt }}</div>
            </div>
            <div class="ssc-sub-item">
              <div class="ssc-sub-label">销售单数</div>
              <div class="ssc-sub-value">{{ salesStats.saleCount }}</div>
            </div>
            <div class="ssc-sub-item">
              <div class="ssc-sub-label">零售单数</div>
              <div class="ssc-sub-value">{{ salesStats.retailCount }}</div>
            </div>
            <div class="ssc-sub-item">
              <div class="ssc-sub-label">涉及客户</div>
              <div class="ssc-sub-value">{{ salesStats.customerCount }}</div>
            </div>
          </div>

          <!-- 迷你柱状趋势（按天，最近 periodDays 天） -->
          <div v-if="salesStats.sparkData.length > 1" class="ssc-spark">
            <div class="ssc-spark-label">趋势</div>
            <div class="ssc-spark-bars">
              <div
                v-for="(bar, i) in salesStats.sparkData"
                :key="i"
                class="ssc-spark-bar-wrap"
                :title="`${bar.date}: ¥${bar.amt.toFixed(2)}`"
              >
                <div
                  class="ssc-spark-bar"
                  :style="{ height: salesStats.sparkMax > 0 ? Math.max(4, (bar.amt / salesStats.sparkMax) * 48) + 'px' : '4px' }"
                  :class="{ today: bar.isToday }"
                />
              </div>
            </div>
          </div>

          <button class="ssc-link-btn" @click="router.push('/reports/sale-rate')">查看销售报表 →</button>
        </div>

      </div>
    </div>

    <!-- Fund Flow -->
    <div v-if="flowVisible" class="flow-card">
      <div class="card-header-row">
        <div>
          <div class="card-micro">Finance</div>
          <h3 class="card-title">资金流水明细</h3>
        </div>
        <button class="btn-close-sm" @click="flowVisible = false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <el-table :data="fundFlowList" size="small" style="width:100%">
        <el-table-column prop="fund_name" label="账户" width="120" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <span class="flow-tag" :class="row.flow_type === 'income' ? 'tag-green' : row.flow_type === 'refund' ? 'tag-blue' : 'tag-red'">
              {{ row.flow_type === 'income' ? '收入' : row.flow_type === 'refund' ? '冲红' : '支出' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ fontWeight: 600, color: row.flow_type === 'income' ? '#16a34a' : '#dc2626' }">
              {{ row.flow_type === 'income' ? '+' : '-' }}¥{{ Number(row.amount||0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="摘要" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="160" />
      </el-table>
    </div>

    </template><!-- end desktop -->

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onDeactivated, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { useGuideStore } from '@/stores/guide'
import { useAuthStore } from '@/stores/auth'
import { menuData } from '@/layouts/components/menuData'

const router = useRouter()
const guideStore = useGuideStore()
const authStore = useAuthStore()
const currentGuideStep = computed(() => guideStore.currentStepData)
const isFirstVisit = ref(false)

const isMobile = ref(window.innerWidth < 768)
const onResize = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => {
  window.addEventListener('resize', onResize)
  // 首次访问检测：无 onboarding state → 脉冲动画
  if (!localStorage.getItem('erp_onboarding_state_v3')) {
    isFirstVisit.value = true
    setTimeout(() => { isFirstVisit.value = false }, 3000)
  }
})
onUnmounted(() => window.removeEventListener('resize', onResize))

// 手机端今日日期显示
const mobileToday = computed(() => {
  const d = new Date()
  const week = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
  return `${d.getMonth()+1}月${d.getDate()}日 ${week}`
})

// 手机端快捷操作（4+4=8个，比常用应用更高频）
const mobileQuickActions = [
  { label: '销售出库', path: '/sale/out',      bg: 'rgba(0,113,227,0.1)',  color: '#0071e3', svg: '<path d="M5 12h14M12 5l7 7-7 7"/>' },
  { label: '采购入库', path: '/procure/inhouse', bg: 'rgba(8,145,178,0.1)', color: '#0891b2', svg: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>' },
  { label: '收款单',  path: '/finance/collect-receipt', bg: 'rgba(5,150,105,0.1)',  color: '#059669', svg: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
  { label: '库存总览', path: '/warehouse/stock', bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', svg: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>' },
  { label: '销售合同', path: '/sale/contract',  bg: 'rgba(0,113,227,0.08)', color: '#0071e3', svg: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { label: '应收账款', path: '/finance/receivable', bg: 'rgba(5,150,105,0.08)', color: '#059669', svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  { label: '报销申请', path: '/office/expense', bg: 'rgba(220,38,38,0.08)',  color: '#dc2626', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
  { label: '零售收银', path: '/cashregister',   bg: 'rgba(249,115,22,0.1)', color: '#f97316', svg: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h2M10 15h4"/>' },
]

const stats = ref([
  { key: 'sale',     label: '今日销售额', value: '--', sub: '含销售+零售',   icon: 'Money',         link: '/dashboard/today-sales' },
  { key: 'order',    label: '今日订单',   value: '--', sub: '销售+零售单数', icon: 'ShoppingCart',  link: '/dashboard/today-sales' },
  { key: 'customer', label: '客户总数',   value: '--', sub: '全部客户',      icon: 'User',          link: '/sale/client' },
  { key: 'stock',    label: '库存预警',   value: '--', sub: '负库存+零库存', icon: 'WarningFilled', link: '/warehouse/stock' },
])

const insightItems = ref([
  { tag: 'Loading...', text: 'AI 正在分析您的业务数据...' },
])

// ── 销售统计 ──
const statPeriod = ref<'today' | '7d' | '30d' | '3m'>('today')

const salesStats = computed(() => {
  const today = getToday()
  const now = new Date()
  const cutoff = (days: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (days - 1))
    d.setHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 10)
  }

  let fromDate: string
  let periodDays: number
  if (statPeriod.value === 'today') { fromDate = today; periodDays = 1 }
  else if (statPeriod.value === '7d') { fromDate = cutoff(7); periodDays = 7 }
  else if (statPeriod.value === '30d') { fromDate = cutoff(30); periodDays = 30 }
  else { fromDate = cutoff(90); periodDays = 90 }

  const filteredSale = _saleRows.value.filter((r: any) => {
    const d = (r.out_date || '').slice(0, 10)
    return d >= fromDate && d <= today
  })
  const filteredRetail = _retailRows.value.filter((r: any) => {
    const d = (r.order_date || '').slice(0, 10)
    return d >= fromDate && d <= today
  })

  const saleAmt = filteredSale.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
  const retailAmt = filteredRetail.reduce((s: number, r: any) => s + Number(r.pay_amount || r.total_amount || 0), 0)
  const totalAmt = saleAmt + retailAmt
  const orderCount = filteredSale.length + filteredRetail.length
  const avgAmt = orderCount > 0 ? totalAmt / orderCount : 0

  // unique customers
  const custSet = new Set<string>()
  filteredSale.forEach((r: any) => { if (r.customer_id) custSet.add(String(r.customer_id)) })
  filteredRetail.forEach((r: any) => { if (r.customer_id) custSet.add(String(r.customer_id)) })

  // spark data (by day)
  const days: string[] = []
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const pad = (x: number) => String(x).padStart(2, '0')
    days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }
  const dayMap: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
  filteredSale.forEach((r: any) => { const d = (r.out_date || '').slice(0, 10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.total_amount || 0) })
  filteredRetail.forEach((r: any) => { const d = (r.order_date || '').slice(0, 10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.pay_amount || r.total_amount || 0) })
  const sparkData = days.map(d => ({ date: d.slice(5), amt: dayMap[d], isToday: d === today }))
  const sparkMax = Math.max(...sparkData.map(b => b.amt), 1)

  const fmt = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : n.toFixed(2)

  return {
    totalAmt: fmt(totalAmt),
    saleAmt: fmt(saleAmt),
    retailAmt: fmt(retailAmt),
    orderCount,
    saleCount: filteredSale.length,
    retailCount: filteredRetail.length,
    avgAmt: fmt(avgAmt),
    customerCount: custSet.size,
    sparkData,
    sparkMax,
  }
})

function buildInsights(data: {
  todaySale: number, stockWarn: number, customerCount: number,
  todayOrders: number, pendingReceivable: number
}) {
  const items = []
  if (data.todaySale > 0) {
    items.push({ tag: '今日销售', text: `今日已完成销售 ¥${data.todaySale.toFixed(2)}，共 ${data.todayOrders} 笔订单。` })
  } else {
    items.push({ tag: '营业提醒', text: '今日暂无销售记录，可前往收银台或新建销售合同开始营业。' })
  }
  if (data.stockWarn > 0) {
    items.push({ tag: '⚠️ 库存预警', text: `当前有 ${data.stockWarn} 种商品库存不足或为零，建议及时采购补货。` })
  } else {
    items.push({ tag: '库存正常', text: '库存状态良好，暂无缺货或预警商品。' })
  }
  if (data.pendingReceivable > 0) {
    items.push({ tag: '应收提醒', text: `当前待收款金额 ¥${data.pendingReceivable.toFixed(2)}，请及时跟进客户回款。` })
  } else if (data.customerCount > 0) {
    items.push({ tag: '客户概览', text: `系统共有 ${data.customerCount} 位客户，当前应收款状态良好。` })
  }
  insightItems.value = items
}

const quickItems = [
  {
    label: '客户管理', path: '/sale/client',
    bg: 'rgba(52,211,153,0.12)', color: '#16a34a',
    svg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  {
    label: '销售报价', path: '/sale/offer',
    bg: 'rgba(249,115,22,0.1)', color: '#ea580c',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  },
  {
    label: '采购订单', path: '/procure/order',
    bg: 'rgba(139,92,246,0.1)', color: '#7c3aed',
    svg: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  },
  {
    label: '库存总览', path: '/warehouse/stock',
    bg: 'rgba(236,72,153,0.1)', color: '#db2777',
    svg: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  },
  {
    label: '应收账款', path: '/finance/receivable',
    bg: 'rgba(0,113,227,0.08)', color: '#0071e3',
    svg: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M6 15h2M12 15h4"/>',
  },
  {
    label: '商品管理', path: '/goods/info',
    bg: 'rgba(234,179,8,0.1)', color: '#ca8a04',
    svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  },
  {
    label: '员工档案', path: '/personnel/staff',
    bg: 'rgba(20,184,166,0.1)', color: '#0d9488',
    svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  {
    label: '销售统计', path: '/reports/sale-rate',
    bg: 'rgba(71,85,105,0.1)', color: '#475569',
    svg: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  },
]

function openNewWindow() { window.open('/#/cashregister', '_blank') }

// ── 自定义快捷应用 ────────────────────────────────────────────────
const CUSTOM_KEY = 'erp_mobile_quick_items'
const editMode = ref(false)

// 全部可选应用（从 menuData，去掉 dashboard）
const allAppSections = menuData.filter(s => s.key !== 'dashboard')

// 颜色映射（复用 MobileApps 同样的配色）
const sectionColorMap: Record<string, string> = {
  customer: '#16a34a', sale: '#0071e3', retail: '#ea580c',
  procure: '#7c3aed', warehouse: '#0891b2', production: '#db2777',
  outsource: '#ca8a04', finance: '#0071e3', goods: '#dc2626',
  reports: '#475569', office: '#16a34a', setting: '#475569', personnel: '#0d9488',
}
function getSectionColor(key: string) { return sectionColorMap[key] || '#0071e3' }

// 图标映射（同 MobileApps）
const appIconMap: Record<string, string> = {
  'sale-client':   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  'sale-offer':    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  'sale-contract': '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  'sale-out':      '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'sale-return':   '<path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 0 1 0 8h-1"/>',
  'retail-store':  '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'retail-order':  '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>',
  'procure-order': '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  'procure-supplier': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'procure-inhouse':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'warehouse-stock':'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'warehouse-check':'<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  'warehouse-warning':'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/>',
  'finance-overview':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'finance-receivable':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'finance-fund':  '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  'goods-info':    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  'reports-overview':'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  'personnel-staff':'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  'personnel-salary':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'reports-sale-rate':'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
}
const defaultAppIcon = '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>'
function getAppIcon(key: string) { return appIconMap[key] || defaultAppIcon }

// 默认8个快捷应用的 key（对应 menuData 中的 item.key）
const DEFAULT_CUSTOM_KEYS = [
  'sale-client', 'sale-offer', 'procure-order', 'warehouse-stock',
  'finance-receivable', 'goods-info', 'personnel-staff', 'reports-sale-rate',
]

// 读取已保存的自定义配置
function loadCustomKeys(): string[] {
  try {
    const r = localStorage.getItem(CUSTOM_KEY)
    if (r) return JSON.parse(r)
  } catch {}
  return DEFAULT_CUSTOM_KEYS
}

const editSelected = ref<string[]>(loadCustomKeys())

function toggleEditItem(item: { key: string; title: string; path?: string }) {
  const idx = editSelected.value.indexOf(item.key)
  if (idx >= 0) {
    editSelected.value.splice(idx, 1)
  } else {
    editSelected.value.push(item.key)
  }
}

function saveCustom() {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(editSelected.value))
  editMode.value = false
}

// 把选中的 key 转换为 quickItem 格式
const currentQuickItems = computed(() => {
  const keys = loadCustomKeys()
  const result: { label: string; path: string; bg: string; color: string; svg: string }[] = []
  for (const key of keys) {
    for (const section of allAppSections) {
      const item = section.children.find((c: any) => c.key === key)
      if (item && item.path) {
        const baseColor = getSectionColor(section.key)
        result.push({
          label: item.title,
          path: item.path,
          bg: baseColor + '18',
          color: baseColor,
          svg: getAppIcon(key),
        })
        break
      }
    }
  }
  return result
})

// ── 新手向导 ──
const guideHidden = ref(localStorage.getItem('erp_guide_hidden') === '1')
function hideGuide() { guideHidden.value = true; localStorage.setItem('erp_guide_hidden', '1') }
function showGuide() { guideHidden.value = false; localStorage.removeItem('erp_guide_hidden') }

const saleTrendRef = ref<HTMLDivElement>()
const fundFlowList = ref<any[]>([])
const flowVisible = ref(false)
const trendDays = ref(30)
const rankMode = ref<'qty' | 'amt'>('qty')

// 缓存原始数据，供切换天数时重绘
const _saleRows = ref<any[]>([])
const _retailRows = ref<any[]>([])
const _rankSaleRows = ref<any[]>([])
const _rankRetailRows = ref<any[]>([])

// 商品排行（按全系统销售订单 + 零售订单聚合，避免只统计当前页/部分单据）
const rankList = computed(() => {
  const saleRankRows = _rankSaleRows.value.length ? _rankSaleRows.value : _saleRows.value
  const retailRankRows = _rankRetailRows.value.length ? _rankRetailRows.value : _retailRows.value
  const map: Record<string, { name: string; spec: string; unit: string; qty: number; amt: number }> = {}
  const parseGoods = (r: any) => {
    const items: any[] = parseGoodsInfo(r.goods_info)
    items.forEach(i => {
      const baseName = i.goods_name || i.name || `商品${i.goods_id}`
      const spec = i.spec || ''
      const key = spec ? `${baseName}||${spec}` : baseName
      if (!map[key]) map[key] = { name: baseName, spec, unit: i.unit_name || '', qty: 0, amt: 0 }
      const qty = Number(i.num || 0)
      const price = Number(i.price || i.sale_price || 0)
      map[key].qty += qty
      map[key].amt += qty * price
    })
  }
  saleRankRows.forEach(r => parseGoods(r))
  retailRankRows.forEach(r => parseGoods(r))
  const sorted = Object.values(map).sort((a, b) =>
    rankMode.value === 'qty' ? b.qty - a.qty : b.amt - a.amt
  ).slice(0, 10)
  return sorted.map(i => ({
    name: i.name,
    spec: i.spec,
    unit: i.unit,
    value: rankMode.value === 'qty' ? parseFloat(i.qty.toFixed(4)) : parseFloat(i.amt.toFixed(2)),
  }))
})

const dashboardLoading = ref(false)
let lastRefreshAt = 0
let refreshListenersBound = false
let rankLoadToken = 0

function getToday() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseGoodsInfo(goodsInfo: any) {
  if (Array.isArray(goodsInfo)) return goodsInfo
  if (typeof goodsInfo !== 'string' || !goodsInfo) return []
  try {
    return JSON.parse(goodsInfo)
  } catch {
    return []
  }
}

function extractRows(payload: any) {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

function extractTotal(payload: any) {
  const data = payload?.data ?? payload
  const total = Number(
    data?.total ??
    data?.count ??
    data?.total_count ??
    data?.totalCount ??
    data?.data_count
  )
  return Number.isFinite(total) && total > 0 ? total : undefined
}

function dedupeRows(rows: any[]) {
  const seen = new Set<string>()
  return rows.filter((row, idx) => {
    const key = row?.id != null
      ? `id:${row.id}`
      : row?.order_no
        ? `order:${row.order_no}`
        : `idx:${idx}:${JSON.stringify(row)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchAllRows(path: string, params: Record<string, any> = {}, pageSize = 500, maxPages = 40) {
  const all: any[] = []
  let page = 1
  let total: number | undefined

  while (page <= maxPages) {
    const res = await http.get(path, { params: { ...params, page, list_rows: pageSize } })
    const rows = extractRows(res)
    if (!rows.length) break

    all.push(...rows)
    total = extractTotal(res) ?? total

    if (total && all.length >= total) break
    if (rows.length < pageSize) break
    page += 1
  }

  return dedupeRows(all)
}

async function loadRankData(fallbackSaleRows: any[], fallbackRetailRows: any[]) {
  const token = ++rankLoadToken

  _rankSaleRows.value = fallbackSaleRows.filter((row: any) => Number(row.status) === 1)
  _rankRetailRows.value = fallbackRetailRows.filter((row: any) => Number(row.status) === 1)

  const [contractRes, retailRes] = await Promise.allSettled([
    fetchAllRows('/shop/ContractOrder/index', { status: 1 }),
    fetchAllRows('/retail/order/index', { status: 1 }),
  ])

  if (token !== rankLoadToken) return

  if (contractRes.status === 'fulfilled' && contractRes.value.length) {
    _rankSaleRows.value = contractRes.value
  }
  if (retailRes.status === 'fulfilled') {
    const filtered = retailRes.value.filter((r: any) => Number(r.status) === 1)
    if (filtered.length) _rankRetailRows.value = filtered
  }
}

async function loadDashboardData(force = false) {
  const now = Date.now()
  if (dashboardLoading.value) return
  if (!force && now - lastRefreshAt < 3000) return

  dashboardLoading.value = true
  try {
    const today = getToday()
    const [saleRes, retailRes, customerRes, procureRes, goodsRes, fundFlowRes] = await Promise.allSettled([
      http.get('/stock/SaleOutOrder/index',     { params: { list_rows: 2000 } }),
      http.get('/retail/order/index',           { params: { list_rows: 2000 } }),
      http.get('/shop/ShopCustomer/index',      { params: { list_rows: 1 } }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 200 } }),
      http.get('/goods/ShopGoods/index',        { params: { list_rows: 500, status: 1 } }),
      http.get('/finance/fundFlow/index',       { params: { list_rows: 100 } }),
    ])

    const rows = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? (r.value?.data?.rows ?? r.value?.rows ?? []) : []

    const saleRows: any[]   = rows(saleRes).filter((r: any) => Number(r.status) === 1)
    const retailRows: any[] = rows(retailRes).filter((r: any) => Number(r.status) === 1)

    const todaySale   = saleRows.filter((r: any) => (r.out_date   || '').slice(0, 10) === today)
    const todayRetail = retailRows.filter((r: any) => (r.order_date || '').slice(0, 10) === today)
    const saleAmt   = todaySale.reduce((s: number, r: any) => {
      const amt = (r.after_discount != null && r.after_discount !== '') ? Number(r.after_discount) : Number(r.total_amount || 0)
      return s + amt
    }, 0)
    const retailAmt = todayRetail.reduce((s: number, r: any) => s + Number(r.pay_amount || r.total_amount || 0), 0)
    stats.value[0].value = '¥' + (saleAmt + retailAmt).toFixed(2)
    stats.value[1].value = String(todaySale.length + todayRetail.length)

    const custData = customerRes.status === 'fulfilled' ? (customerRes.value?.data ?? customerRes.value) : {}
    stats.value[2].value = String(custData?.total ?? 0)

    const stockMap: Record<number, number> = {}
    rows(procureRes).forEach((r: any) => {
      if (Number(r.status) !== 1) return
      const items = parseGoodsInfo(r.goods_info)
      items.forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num || 0) })
    })
    ;[...saleRows, ...retailRows].forEach((r: any) => {
      if (r.out_date !== undefined && Number(r.status) !== 1) return
      const items = parseGoodsInfo(r.goods_info)
      items.forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num || 0) })
    })
    const goodsList: any[] = rows(goodsRes)
    const stockWarnCount = goodsList.filter(g => (stockMap[g.id] ?? 0) <= 0).length
    stats.value[3].value = String(stockWarnCount)

    if (fundFlowRes.status === 'fulfilled') {
      fundFlowList.value = fundFlowRes.value?.data?.rows ?? fundFlowRes.value?.rows ?? []
    }

    _saleRows.value = saleRows
    _retailRows.value = retailRows
    void loadRankData(saleRows, retailRows)
    drawTrendChart(trendDays.value)

    // Build AI insights from real data (skip extra API call on mobile)
    buildInsights({
      todaySale: saleAmt + retailAmt,
      stockWarn: stockWarnCount,
      customerCount: Number(stats.value[2].value) || 0,
      todayOrders: todaySale.length + todayRetail.length,
      pendingReceivable: 0,
    })
    lastRefreshAt = Date.now()
  } finally {
    dashboardLoading.value = false
  }
}

function handleWindowResume() {
  if (document.visibilityState === 'hidden') return
  loadDashboardData()
}

function bindRefreshListeners() {
  if (refreshListenersBound) return
  window.addEventListener('focus', handleWindowResume)
  document.addEventListener('visibilitychange', handleWindowResume)
  refreshListenersBound = true
}

function unbindRefreshListeners() {
  if (!refreshListenersBound) return
  window.removeEventListener('focus', handleWindowResume)
  document.removeEventListener('visibilitychange', handleWindowResume)
  refreshListenersBound = false
}

onActivated(() => {
  bindRefreshListeners()
  loadDashboardData(true)
})

onDeactivated(() => {
  unbindRefreshListeners()
})

onUnmounted(() => {
  unbindRefreshListeners()
})

function setTrendDays(n: number) {
  trendDays.value = n
  drawTrendChart(n)
}

function drawTrendChart(n: number) {
  if (!saleTrendRef.value) return
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const pad = (x: number) => String(x).padStart(2, '0')
    days.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`)
  }
  const dayMap: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
  _saleRows.value.forEach((r: any) => { const d = (r.out_date || '').slice(0, 10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.total_amount || 0) })
  _retailRows.value.forEach((r: any) => { const d = (r.order_date || '').slice(0, 10); if (dayMap[d] !== undefined) dayMap[d] += Number(r.pay_amount || r.total_amount || 0) })
  const values = days.map(d => dayMap[d])
  const maxVal = Math.max(...values, 1)

  if (values.every(v => v === 0)) {
    saleTrendRef.value.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:rgba(29,29,31,0.25);font-size:13px;font-weight:500;letter-spacing:-0.01em">近${n}天暂无销售数据</div>`
    return
  }

  const W = 500, H = 200, pL = 10, pR = 10, pT = 20, pB = 36
  const smooth = (pts: string[]) => {
    let d = `M${pts[0]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i-1].split(',').map(Number)
      const [x1, y1] = pts[i].split(',').map(Number)
      const cx = (x0 + x1) / 2
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
    }
    return d
  }
  const pts = values.map((v, i) => {
    const x = (pL + (i / (days.length - 1)) * (W - pL - pR)).toFixed(1)
    const y = (pT + (1 - v / maxVal) * (H - pT - pB)).toFixed(1)
    return `${x},${y}`
  })
  const linePath = smooth(pts)
  const lastPt = pts[pts.length-1].split(',')
  const firstPt = pts[0].split(',')
  const areaPath = `${linePath} L${lastPt[0]},${H - pB} L${firstPt[0]},${H - pB} Z`
  const step = n <= 7 ? 1 : Math.ceil(n / 6)
  const labels = days.filter((_, i) => i % step === 0 || i === n - 1).map(d => {
    const i = days.indexOf(d)
    const x = (pL + (i / (n - 1)) * (W - pL - pR)).toFixed(1)
    return `<text x="${x}" y="${H - 8}" text-anchor="middle" font-size="10" font-weight="600" fill="rgba(29,29,31,0.3)" font-family="Inter,-apple-system,sans-serif">${d.slice(5)}</text>`
  }).join('')
  const grids = [0.25, 0.5, 0.75, 1].map(p => {
    const y = (pT + (1 - p) * (H - pT - pB)).toFixed(1)
    const val = (maxVal * p / 1000).toFixed(1)
    return `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>
            <text x="${pL}" y="${Number(y) - 4}" font-size="9" font-weight="600" fill="rgba(29,29,31,0.25)" font-family="Inter,-apple-system,sans-serif">${val}k</text>`
  }).join('')
  saleTrendRef.value.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stop-color="#0071e3" stop-opacity="0.15"/>
          <stop offset="95%" stop-color="#0071e3" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grids}
      <path d="${areaPath}" fill="url(#areaGrad)"/>
      <path d="${linePath}" fill="none" stroke="#0071e3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${labels}
    </svg>`
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  padding: 8px 0 40px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Mobile: remove outer padding so cards go edge-to-edge */
@media (max-width: 767px) {
  .dashboard { gap: 0; padding: 0; background: #f5f5f7; max-width: 100%; }
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 8px;
  animation: dash-fade-up 0.8s cubic-bezier(0.23,1,0.32,1) both;
}

@keyframes dash-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--dim);
  margin-bottom: 12px;
}

.page-title {
  font-size: clamp(40px, 5.5vw, 72px);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.95;
  color: var(--dark);
  margin: 0;
}

.header-actions { display: flex; gap: 10px; align-items: center; }

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: var(--gray);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
}
.btn-secondary:hover { background: var(--gray-2); transform: scale(0.98); }

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #0071e3;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,113,227,0.25);
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
}
.btn-primary:hover { background: rgba(0,113,227,0.88); transform: scale(0.97); }

.btn-agent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(139,92,246,0.18));
  border: 1px solid rgba(124,58,237,0.25);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #7c3aed;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
}
.btn-agent:hover { background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(139,92,246,0.28)); transform: scale(0.97); border-color: rgba(124,58,237,0.45); }

/* ── Metrics ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  background: var(--gray);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 36px 32px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.8s cubic-bezier(0.23,1,0.32,1), box-shadow 0.8s cubic-bezier(0.23,1,0.32,1);
}

.metric-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 40px 80px rgba(0,0,0,0.09);
}

.metric-bg-icon {
  position: absolute;
  right: -16px;
  bottom: -16px;
  color: var(--dark);
  opacity: 0.025;
  pointer-events: none;
  transition: opacity 0.8s;
}
.metric-card:hover .metric-bg-icon { opacity: 0.07; }

.metric-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.metric-icon-wrap {
  width: 60px;
  height: 60px;
  background: var(--card-bg);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0071e3;
  box-shadow: 0 8px 24px rgba(0,0,0,0.07);
  transition: transform 0.5s cubic-bezier(0.23,1,0.32,1);
}
.metric-card:hover .metric-icon-wrap { transform: scale(1.12) rotate(3deg); }

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
.trend-up   { background: rgba(52,211,153,0.1);  color: #16a34a; }
.trend-warn { background: rgba(239,68,68,0.1);   color: #dc2626; }

.metric-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--dim);
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.metric-value {
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: var(--dark);
  line-height: 1;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.metric-sub {
  font-size: 11px;
  color: var(--dim);
  font-weight: 500;
  position: relative;
  z-index: 1;
}

/* ── Charts Row ── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: start;
}
.left-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 新手向导小卡片 */
.guide-side-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 16px 18px;
}
.guide-side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.guide-side-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--dark);
}
.guide-side-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.guide-hide-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--gray);
  color: var(--dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.guide-hide-btn:hover { background: var(--gray-2); color: var(--dark); }

/* 步骤胶囊条 */
.guide-capsules {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.guide-capsules::-webkit-scrollbar { display: none; }
.guide-capsule {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--gray);
  font-size: 11px;
  font-weight: 600;
  color: var(--mid);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.guide-capsule-num {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--faint);
  color: var(--mid);
  font-size: 10px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.guide-capsule.active { background: #dbeafe; color: #1d4ed8; }
.guide-capsule.active .guide-capsule-num { background: #2563eb; color: #fff; }
.guide-capsule.done { background: #dcfce7; color: #16a34a; }
.guide-capsule.done .guide-capsule-num { background: #16a34a; color: #fff; }
.guide-capsule.skipped { background: #fef3c7; color: #b45309; }
.guide-capsule.skipped .guide-capsule-num { background: #f59e0b; color: #fff; }
.guide-capsule.locked { opacity: 0.35; cursor: not-allowed; }

/* 状态标签 */
.guide-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.guide-tag--done { color: #16a34a; background: #dcfce7; }
.guide-tag--skipped { color: #b45309; background: #fef3c7; }
.guide-tag--active { color: #2563eb; background: #dbeafe; }
.guide-tag--action { color: #1d4ed8; background: #eff6ff; }

/* 提示条 */
.guide-banner {
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.6;
}
.guide-banner--done {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  background-size: 200% 200%;
  animation: guide-shimmer 3s ease infinite;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}
.guide-celebrate-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.guide-celebrate-title {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #15803d;
  margin-bottom: 2px;
}
.guide-banner--info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}
@keyframes guide-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 收起后的小入口 */
.guide-collapsed {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-left: 3px solid #2563eb;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--mid);
  cursor: pointer;
  transition: all 0.15s;
}
.guide-collapsed-progress {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 10px;
}
.guide-collapsed:hover { background: var(--blue-light); color: #0071e3; border-color: rgba(0,113,227,0.15); }
.guide-collapsed svg { color: #0071e3; flex-shrink: 0; }

/* 首次访问脉冲动画 */
.guide-pulse {
  animation: guide-card-pulse 0.6s ease 2;
}
@keyframes guide-card-pulse {
  0%, 100% { border-color: var(--border); box-shadow: 0 0 0 0 rgba(37,99,235,0); }
  50% { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.15); }
}

/* "全部跳过"链接 */
.guide-skip-all {
  font-size: 11px;
  font-weight: 500;
  color: var(--dim);
  cursor: pointer;
  margin-left: 8px;
}
.guide-skip-all:hover { color: #c2410c; text-decoration: underline; }

/* 预估时间 */
.gmp-time {
  font-size: 10px;
  color: var(--dim);
  white-space: nowrap;
}


.chart-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 36px 36px 28px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.card-micro {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--dim);
  margin-bottom: 6px;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--dark);
  margin: 0;
}

.chart-tabs {
  display: flex;
  background: var(--gray);
  border-radius: 12px;
  padding: 4px;
  gap: 2px;
}

.chart-tab {
  padding: 7px 16px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.chart-tab.active { background: #0071e3; color: white; box-shadow: 0 4px 12px rgba(0,113,227,0.25); }

.chart-area { height: 280px; width: 100%; }

/* ── Insights ── */
.insights-card {
  background: var(--dark);
  border-radius: 24px;
  padding: 24px 22px;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.insights-bg {
  position: absolute;
  top: 0;
  right: 0;
  padding: 20px;
  pointer-events: none;
}

.insights-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.insights-icon {
  width: 48px;
  height: 48px;
  background: #0071e3;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(0,113,227,0.3);
  flex-shrink: 0;
}

.insights-title { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; }
.insights-sub { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,0.18); margin-top: 3px; }

.insights-list { display: flex; flex-direction: column; gap: 14px; flex: 1; position: relative; z-index: 1; }

.insight-item {
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  transition: background 0.3s, transform 0.3s cubic-bezier(0.23,1,0.32,1);
  cursor: pointer;
}
.insight-item:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

.insight-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #0071e3;
  margin-bottom: 8px;
}

.insight-text {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255,255,255,0.65);
  font-weight: 500;
  margin: 0;
  font-style: italic;
}

.insights-btn {
  width: 100%;
  padding: 15px;
  background: var(--card-bg);
  color: var(--dark);
  border: none;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
  letter-spacing: -0.01em;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.insights-btn:hover { background: var(--gray); transform: scale(0.99); }

/* ── Sale Stat Card ── */
.sale-stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 22px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ssc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.ssc-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ssc-tab {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--dim);
  transition: all 0.15s;
  letter-spacing: -0.01em;
}
.ssc-tab:hover { background: var(--gray); color: var(--dark); }
.ssc-tab.active { background: #0071e3; color: #fff; border-color: #0071e3; }

.ssc-main-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ssc-main-item {
  background: var(--gray);
  border-radius: 16px;
  padding: 14px 14px 12px;
}

.ssc-main-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--dim);
  margin-bottom: 6px;
}

.ssc-main-value {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--dark);
  line-height: 1;
}

.ssc-sub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.ssc-sub-item {
  background: rgba(0,113,227,0.04);
  border-radius: 12px;
  padding: 10px 10px 8px;
}

.ssc-sub-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--dim);
  margin-bottom: 4px;
}

.ssc-sub-value {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--dark);
}

.ssc-spark {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.ssc-spark-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--dim);
  flex-shrink: 0;
  padding-bottom: 2px;
}

.ssc-spark-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  flex: 1;
  height: 52px;
}

.ssc-spark-bar-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;
}

.ssc-spark-bar {
  width: 100%;
  min-height: 4px;
  border-radius: 3px 3px 0 0;
  background: rgba(0,113,227,0.25);
  transition: height 0.4s cubic-bezier(0.23,1,0.32,1);
}
.ssc-spark-bar.today {
  background: #0071e3;
}

.ssc-link-btn {
  width: 100%;
  padding: 11px;
  background: transparent;
  color: #0071e3;
  border: 1px solid rgba(0,113,227,0.2);
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: -0.01em;
}
.ssc-link-btn:hover { background: rgba(0,113,227,0.06); }

/* ── Action Hub (收银台 + 快捷入口) ── */
.action-hub {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 收银台主按钮 */
.cashregister-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #0071e3, #0055b3);
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
  width: 200px;
  transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
  box-shadow: 0 6px 20px rgba(0,113,227,0.28);
  position: relative;
  overflow: hidden;
}
.cashregister-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
  pointer-events: none;
}
.cashregister-btn:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 12px 32px rgba(0,113,227,0.38);
}
.crb-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.18);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.crb-info { flex: 1; min-width: 0; }
.crb-label { font-size: 14px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.crb-desc { font-size: 10px; color: rgba(255,255,255,0.65); font-weight: 500; margin-top: 2px; }
.crb-arrow { color: rgba(255,255,255,0.6); flex-shrink: 0; transition: transform 0.2s; }
.cashregister-btn:hover .crb-arrow { transform: translateX(3px); }

/* 分割线 */
.action-hub::after {
  content: '';
  display: block;
  width: 1px;
  height: 52px;
  background: var(--border);
  flex-shrink: 0;
}

/* 快捷入口 grid */
.quick-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.quick-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 4px 10px;
  border-radius: 16px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
}
.quick-item-anchor {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 18px;
}
.quick-item:hover {
  background: var(--gray);
  border-color: var(--border);
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.06);
}

.quick-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.23,1,0.32,1);
}
.quick-item:hover .quick-icon-wrap { transform: scale(1.1) rotate(-5deg); }

.quick-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--mid);
  letter-spacing: -0.01em;
  text-align: center;
  white-space: nowrap;
}
.quick-item:hover .quick-label { color: var(--dark); }

/* flow-card */
.flow-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 32px 36px;
}

.card-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

/* ── Goods Ranking ── */
.rank-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 32px 36px;
}

.rank-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: var(--dim);
  font-weight: 500;
}

.rank-list { display: flex; flex-direction: column; gap: 10px; }

.rank-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rank-no {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--gray);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: var(--dim);
  flex-shrink: 0;
}
.rank-top1 { background: #FFD700; color: #7a5c00; }
.rank-top2 { background: #C0C0C0; color: #4a4a4a; }
.rank-top3 { background: #CD7F32; color: #fff; }

.rank-name {
  width: 160px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rank-name > span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-spec {
  font-size: 10px;
  font-weight: 600;
  color: var(--dim);
  background: var(--faint);
  border-radius: 4px;
  padding: 1px 6px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-bar-wrap {
  flex: 1;
  height: 8px;
  background: var(--gray);
  border-radius: 999px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  background: linear-gradient(90deg, #0071e3, #34d399);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.23,1,0.32,1);
}

.rank-val {
  width: 110px;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  color: #0071e3;
  flex-shrink: 0;
}

/* ── Flow ── */
.btn-close-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gray);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mid);
  transition: background 0.15s;
}
.btn-close-sm:hover { background: var(--gray-2); color: var(--dark); }

.flow-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.tag-green { background: rgba(52,211,153,0.1); color: #16a34a; }
.tag-red   { background: rgba(239,68,68,0.1);  color: #dc2626; }
.tag-blue  { background: rgba(0,113,227,0.08); color: #0071e3; }

:deep(.el-table) { border-radius: 16px; overflow: hidden; }
:deep(.el-table th) { background: var(--gray) !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mid); }
:deep(.el-table td) { font-size: 13px; font-weight: 500; }

@media (max-width: 1200px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .quick-grid { grid-template-columns: repeat(4, 1fr); }
  .action-hub { flex-wrap: wrap; }
  .cashregister-btn { width: 100%; }
}

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .quick-grid { grid-template-columns: repeat(4, 1fr); }
  .page-title { font-size: 36px; }
  .header-actions { display: none; }
  .metric-value { font-size: 40px; }

}


/* ── Guide Module (inline card) ── */
.guide-module {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 32px 36px;
}
.guide-module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.guide-module-progress { display: flex; align-items: center; gap: 12px; }
.gmp-bar-wrap { width: 120px; height: 4px; background: var(--faint); border-radius: 999px; overflow: hidden; }
.gmp-bar { height: 100%; background: #0071e3; border-radius: 999px; transition: width 0.5s cubic-bezier(0.23,1,0.32,1); }
.gmp-label { font-size: 11px; font-weight: 700; color: var(--dim); white-space: nowrap; }

.guide-steps-row {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.guide-step-pill { display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
.gsp-no {
  width: 28px; height: 28px; border-radius: 9px;
  background: var(--faint); color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0; transition: all 0.2s;
}
.guide-step-pill.active .gsp-no { background: #0071e3; color: white; box-shadow: 0 4px 12px rgba(0,113,227,0.3); }
.guide-step-pill.done .gsp-no { background: #16a34a; color: white; }
.gsp-title { font-size: 12px; font-weight: 600; color: var(--dim); white-space: nowrap; transition: color 0.2s; }
.guide-step-pill.active .gsp-title { color: #0071e3; font-weight: 700; }
.guide-step-pill.done .gsp-title { color: #16a34a; }
.gsp-connector { width: 32px; height: 2px; background: var(--faint); margin: 0 8px; border-radius: 999px; flex-shrink: 0; transition: background 0.3s; }
.gsp-connector.done { background: #16a34a; }

.guide-detail {
  display: grid; grid-template-columns: 1fr 200px; gap: 32px;
  padding-top: 20px; border-top: 1px solid var(--border);
}
.guide-step-num {
  font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em;
  color: #0071e3; background: rgba(0,113,227,0.08);
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px; margin-bottom: 10px;
}
.guide-step-name { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; color: var(--dark); margin-bottom: 6px; }
.guide-step-desc { font-size: 12px; line-height: 1.6; color: var(--mid); margin: 0 0 12px; }
.guide-action-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.guide-action-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--gray); border-radius: 12px; }
.gar-num {
  width: 20px; height: 20px; border-radius: 6px; background: #0071e3; color: white;
  font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.gar-text { font-size: 13px; font-weight: 500; color: var(--dark); line-height: 1.5; }
.guide-tip-inline {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: var(--mid); line-height: 1.6;
  padding: 10px 14px; background: rgba(0,113,227,0.06);
  border-radius: 12px; border: 1px solid rgba(0,113,227,0.15);
}
.guide-tip-inline svg { flex-shrink: 0; margin-top: 1px; color: #0071e3; }
.guide-detail-right { display: flex; flex-direction: column; gap: 10px; justify-content: flex-start; padding-top: 4px; }
.guide-goto-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px; background: #0071e3; color: white; border: none;
  border-radius: 16px; font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1); box-shadow: 0 6px 20px rgba(0,113,227,0.25);
}
.guide-goto-btn:hover { background: rgba(0,113,227,0.88); transform: scale(0.98); }
.guide-nav-btns { display: flex; gap: 8px; }
.gnb-prev {
  flex: 1; padding: 10px 8px; background: var(--gray); border: none; border-radius: 12px;
  font-size: 12px; font-weight: 600; color: var(--mid); cursor: pointer; transition: all 0.2s;
}
.gnb-prev:hover:not(:disabled) { background: var(--gray-2); color: var(--dark); }
.gnb-prev:disabled { opacity: 0.3; cursor: not-allowed; }
.gnb-skip {
  flex: 2; padding: 10px 8px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px;
  font-size: 12px; font-weight: 700; color: #c2410c; cursor: pointer; transition: all 0.2s;
}
.gnb-skip:hover { background: #fed7aa; }
.gnb-finish { flex: 2; padding: 10px 8px; background: #16a34a; border: none; border-radius: 12px; font-size: 12px; font-weight: 700; color: white; cursor: pointer; }

@media (max-width: 900px) {
  .guide-detail { grid-template-columns: 1fr; }
  .gsp-connector { width: 18px; margin: 0 4px; }
}

/* ── 大模块卡片 ── */
.m-module-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px 12px 0;
}
.m-module-card {
  border-radius: 16px;
  padding: 18px 16px 14px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}
.m-module-card:active { opacity: 0.85; }
.m-module-dark { background: #1d2129; }
.m-module-blue { background: #0071e3; }
.m-module-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  color: #fff; margin-bottom: 8px; flex-shrink: 0;
}
.m-module-label { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
.m-module-desc { font-size: 11px; color: rgba(255,255,255,0.55); }
.m-module-arrow {
  position: absolute; right: 14px; bottom: 14px;
  color: rgba(255,255,255,0.45);
}

/* ── 自定义编辑模式 ── */
.m-edit-hint {
  font-size: 12px; color: #86909c; margin-bottom: 12px;
  padding: 6px 8px; background: #f5f5f7; border-radius: 8px;
}
.m-edit-section { margin-bottom: 14px; }
.m-edit-section-title {
  font-size: 11px; font-weight: 700; color: #86909c;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.m-edit-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 4px;
}
.m-edit-item {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  cursor: pointer; padding: 6px 2px; border-radius: 10px;
  position: relative; -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.m-edit-item:active { background: #f5f5f7; }
.m-edit-item.disabled { opacity: 0.35; pointer-events: none; }
.m-edit-check {
  position: absolute; top: 2px; right: 8px;
  width: 16px; height: 16px; border-radius: 50%;
  border: 1.5px solid #c2c8d5;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.m-edit-item.selected .m-edit-check { background: #0071e3; border-color: #0071e3; }
.m-edit-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.m-edit-label {
  font-size: 11px; color: #4e5969; text-align: center;
  font-weight: 500; line-height: 1.3;
}

/* ── 手机端首页样式 ─────────────────────────────────────── */

/* 顶部欢迎Banner */
.mh-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  background: #fff;
}
.mh-greet {
  font-size: 20px;
  font-weight: 800;
  color: #1d2129;
  letter-spacing: -0.02em;
}
.mh-date {
  font-size: 12px;
  color: #86909c;
  margin-top: 2px;
  font-weight: 500;
}
.mh-refresh {
  width: 36px; height: 36px;
  background: #f5f5f7;
  border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #4e5969;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.mh-refresh:active { background: #e8e8e8; }
.mh-refresh.spinning svg { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* KPI卡片行 */
.mh-kpi-row {
  display: flex;
  gap: 10px;
  padding: 0 12px;
  margin-bottom: 10px;
}
.mh-kpi-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding: 16px 14px 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.mh-kpi-main {
  flex: 1.4;
  background: linear-gradient(135deg, #0071e3, #0055aa);
  color: #fff;
}
.mh-kpi-main:active { opacity: 0.9; }
.mh-kpi-label { font-size: 11px; font-weight: 600; opacity: 0.7; margin-bottom: 6px; }
.mh-kpi-value { font-size: 26px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 4px; }
.mh-kpi-sub { font-size: 10px; opacity: 0.55; }
.mh-kpi-arrow {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
}
.mh-kpi-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mh-kpi-mini-row {
  display: flex;
  gap: 8px;
  padding: 0 12px;
  margin-bottom: 10px;
}
.mh-kpi-mini-row .mh-kpi-small { flex: 1; }
/* 移动端收银台按钮 */
.mh-cashregister-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  padding: 14px 14px;
  background: linear-gradient(135deg, #0071e3, #0055b3);
  border-radius: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0,113,227,0.28);
  -webkit-tap-highlight-color: transparent;
}
.mh-cashregister-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
  pointer-events: none;
}
.mh-cashregister-btn:active { transform: scale(0.97); }
.mh-crb-icon { color: rgba(255,255,255,0.9); margin-bottom: 4px; }
.mh-crb-label { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.mh-crb-desc { font-size: 10px; color: rgba(255,255,255,0.65); font-weight: 500; }
.mh-crb-arrow { position: absolute; right: 12px; bottom: 12px; }
.mh-kpi-small {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  -webkit-tap-highlight-color: transparent;
}
.mh-kpi-small:active { background: #f0f5ff; }
.mh-kpi-small-label { font-size: 10px; color: #86909c; font-weight: 600; margin-bottom: 3px; }
.mh-kpi-small-value { font-size: 17px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; }

/* Section 卡片通用 */
.mh-section-card {
  background: #fff;
  border-radius: 16px;
  margin: 0 12px 10px;
  padding: 16px 16px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.mh-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.mh-section-title { font-size: 15px; font-weight: 700; color: #1d2129; letter-spacing: -0.01em; }
.mh-section-more {
  display: flex; align-items: center; gap: 2px;
  font-size: 12px; color: #0071e3;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}

/* 快捷操作网格 4列 */
.mh-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 4px;
}
.mh-quick-item {
  display: flex; flex-direction: column;
  align-items: center; gap: 6px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.mh-quick-item:active { opacity: 0.7; }
.mh-quick-icon {
  width: 48px; height: 48px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
}
.mh-quick-label { font-size: 10px; color: #4e5969; font-weight: 500; text-align: center; }

/* 常用应用网格 4列 */
.mh-app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 4px;
}
.mh-app-item {
  display: flex; flex-direction: column;
  align-items: center; gap: 7px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.mh-app-item:active { opacity: 0.7; }
.mh-app-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.mh-app-label { font-size: 10px; color: #4e5969; font-weight: 500; text-align: center; word-break: keep-all; }

/* AI 洞察卡片 */
.mh-insight-card {
  background: #1d1d1f;
  border-radius: 16px;
  margin: 0 12px 10px;
  padding: 16px;
}
.mh-insight-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
}
.mh-insight-icon {
  width: 28px; height: 28px;
  background: #0071e3;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mh-insight-title { font-size: 14px; font-weight: 700; color: #fff; }
.mh-insight-badge {
  margin-left: auto;
  font-size: 10px; font-weight: 700;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.mh-insight-list { display: flex; flex-direction: column; gap: 8px; }
.mh-insight-item {
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.mh-insight-tag { font-size: 10px; font-weight: 700; color: #0071e3; text-transform: uppercase; letter-spacing: 0.08em; }
.mh-insight-text { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5; }

/* 旧版兼容（编辑模式） */
.m-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 12px;
  background: #fff;
}
.m-header-left { flex: 1; }
.m-header-greet {
  font-size: 20px;
  font-weight: 800;
  color: #1d2129;
  letter-spacing: -0.02em;
}
.m-header-sub {
  font-size: 12px;
  color: #86909c;
  font-weight: 500;
  margin-top: 2px;
}
.m-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.m-header-refresh {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f7;
  color: #4e5969;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.m-header-refresh:active { background: #e8e8e8; }
.m-header-refresh.spinning svg { animation: spin 0.8s linear infinite; }

.m-header-cashier {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #0071e3;
  color: #fff;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.m-header-cashier:active { opacity: 0.85; }

/* 快捷应用卡片 */
.m-quick-card {
  background: #fff;
  border-radius: 16px;
  margin: 10px 12px 0;
  padding: 16px 16px 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.m-quick-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.m-quick-title { font-size: 15px; font-weight: 700; color: #1d2129; }
.m-quick-more { font-size: 13px; color: #0071e3; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.m-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 0;
  margin-bottom: 12px;
}
.m-quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-quick-item:active { opacity: 0.7; }
.m-quick-icon {
  width: 50px; height: 50px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.m-quick-label {
  font-size: 11px; color: #4e5969; text-align: center;
  font-weight: 500; line-height: 1.3;
}

/* 指标卡片 */
/* ── Mobile Insights ── */
.m-insights-card {
  background: #1d1d1f;
  border-radius: 16px;
  margin: 10px 12px 0;
  padding: 16px;
  color: white;
}
.m-insights-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.m-insights-icon {
  width: 30px; height: 30px;
  background: #0071e3;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-insights-title { font-size: 15px; font-weight: 700; letter-spacing: -0.02em; }
.m-insights-sub { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-left: auto; }
.m-insights-list { display: flex; flex-direction: column; gap: 8px; }
.m-insight-item {
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 10px 12px;
}
.m-insight-tag { font-size: 10px; font-weight: 700; color: #0071e3; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
.m-insight-text { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5; }

/* ── Mobile Sale Stat ── */
.m-sale-stat-card {
  background: #fff;
  border-radius: 16px;
  margin: 10px 12px 0;
  padding: 16px 16px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.m-ssc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.m-ssc-title { font-size: 15px; font-weight: 700; color: #1d2129; }
.m-ssc-tabs { display: flex; gap: 4px; }
.m-ssc-tab {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #e5e6eb;
  background: transparent;
  color: #86909c;
  -webkit-tap-highlight-color: transparent;
}
.m-ssc-tab.active { background: #0071e3; color: #fff; border-color: #0071e3; }
.m-ssc-main-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}
.m-ssc-main-item {
  background: #f5f5f7;
  border-radius: 10px;
  padding: 10px 10px 8px;
}
.m-ssc-main-label { font-size: 10px; font-weight: 600; color: #86909c; margin-bottom: 4px; }
.m-ssc-main-value { font-size: 15px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; }
.m-ssc-sub-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}
.m-ssc-sub-item { text-align: center; }
.m-ssc-sub-label { font-size: 10px; color: #86909c; margin-bottom: 3px; }
.m-ssc-sub-val { font-size: 13px; font-weight: 700; color: #1d2129; letter-spacing: -0.02em; }
.m-ssc-spark {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 40px;
  margin-bottom: 12px;
}
.m-ssc-spark-bar {
  flex: 1;
  min-height: 4px;
  border-radius: 2px 2px 0 0;
  background: rgba(0,113,227,0.2);
  transition: height 0.3s;
}
.m-ssc-spark-bar.today { background: #0071e3; }
.m-ssc-link {
  font-size: 12px;
  font-weight: 700;
  color: #0071e3;
  text-align: center;
  padding: 8px;
  border: 1px solid rgba(0,113,227,0.2);
  border-radius: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-ssc-link:active { background: rgba(0,113,227,0.06); }

.m-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px 12px 0;
  background: #f5f5f7;
}
.m-stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px 14px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.m-stat-label { font-size: 11px; color: #86909c; font-weight: 600; margin-bottom: 6px; }
.m-stat-value { font-size: 22px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; margin-bottom: 4px; }
.m-stat-sub { font-size: 11px; color: #c2c8d5; }

</style>
