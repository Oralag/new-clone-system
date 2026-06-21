<template>
  <div class="market-page">
    <!-- ── Tab Bar ── -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-code">{{ tab.code }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════
         TAB 1: Stock Market
         ══════════════════════════════════════ -->
    <div v-show="activeTab === 'stocks'" class="tab-content">
      <!-- 指数行情 Ticker -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#F5A623">◈</span>
          <span class="panel-title">{{ t('investmentMarket.indicesTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.indicesDesc') }}</span>
          <span class="live-dot"></span>
          <span class="live-text">{{ t('investmentMarket.live') }}</span>
        </div>
        <div class="indices-row">
          <div
            v-for="idx in indices"
            :key="idx.code"
            class="index-card"
            :class="{ selected: klineTarget?.code === idx.code }"
            @click="selectKline(idx)"
          >
            <div class="index-name">{{ displayIndexName(idx) }}</div>
            <div class="index-code">{{ idx.code }}</div>
            <div class="index-price" :class="idx.change >= 0 ? 'up' : 'down'">{{ idx.price }}</div>
            <div class="index-change" :class="idx.change >= 0 ? 'up' : 'down'">
              {{ idx.change >= 0 ? '+' : '' }}{{ idx.change.toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- K线图 -->
      <div class="panel kline-panel" v-if="klineTarget">
        <div class="panel-head">
          <span class="panel-icon" style="color:#F5A623">▥</span>
          <span class="panel-title">{{ t('investmentMarket.klineTitle') }}</span>
          <span class="panel-desc">{{ displayIndexName(klineTarget) }} · {{ t('investmentMarket.dailyK') }}</span>
          <span class="kline-period-group" style="margin-left:auto">
            <button
              v-for="p in klinePeriods"
              :key="p.days"
              class="kline-period-btn"
              :class="{ active: klineDays === p.days }"
              @click="klineDays = p.days; loadKline()"
            >{{ p.label }}</button>
          </span>
        </div>
        <div class="kline-wrap">
          <div v-if="klineLoading" class="kline-loading">{{ t('common.loading') }}</div>
          <template v-else>
            <canvas ref="klineCanvas" class="kline-canvas"></canvas>
            <!-- OHLC tooltip -->
            <div v-if="klineTooltip" class="kline-tooltip">
              <span class="ktooltip-date">{{ klineTooltip.bar.date }}</span>
              <span class="ktooltip-item up">{{ t('investmentMarket.open') }} {{ klineTooltip.bar.open }}</span>
              <span class="ktooltip-item">{{ t('investmentMarket.close') }} <b :class="klineTooltip.bar.close >= klineTooltip.bar.open ? 'up' : 'down'">{{ klineTooltip.bar.close }}</b></span>
              <span class="ktooltip-item">{{ t('investmentMarket.high') }} {{ klineTooltip.bar.high }}</span>
              <span class="ktooltip-item">{{ t('investmentMarket.low') }} {{ klineTooltip.bar.low }}</span>
              <span class="ktooltip-item" :class="klineTooltip.bar.change >= 0 ? 'up' : 'down'">{{ klineTooltip.bar.change >= 0 ? '+' : '' }}{{ klineTooltip.bar.change.toFixed(2) }}%</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 涨跌榜 -->
      <div class="two-col">
        <!-- 涨幅榜 -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-icon" style="color:#FF4D4D">▲</span>
            <span class="panel-title">{{ t('investmentMarket.topGainersTitle') }}</span>
            <span class="panel-desc">{{ t('investmentMarket.gainersDesc') }}</span>
          </div>
          <table class="rank-table" v-if="topGainers.length">
            <thead>
              <tr><th>{{ t('investmentMarket.name') }}</th><th>{{ t('investmentMarket.code') }}</th><th>{{ t('investmentMarket.latestPrice') }}</th><th>{{ t('investmentMarket.change') }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in topGainers" :key="s.code">
                <td><span class="rank-no">{{ i + 1 }}</span> {{ s.name }}</td>
                <td class="code-cell">{{ s.code }}</td>
                <td class="price-cell">{{ s.price ?? '--' }}</td>
                <td class="up">+{{ s.change.toFixed(2) }}%</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="rank-empty">{{ t('investmentMarket.offHoursNoData') }}</div>
        </div>
        <!-- 跌幅榜 -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-icon" style="color:#4f79c7">▼</span>
            <span class="panel-title">{{ t('investmentMarket.topLosersTitle') }}</span>
            <span class="panel-desc">{{ t('investmentMarket.losersDesc') }}</span>
          </div>
          <table class="rank-table" v-if="topLosers.length">
            <thead>
              <tr><th>{{ t('investmentMarket.name') }}</th><th>{{ t('investmentMarket.code') }}</th><th>{{ t('investmentMarket.latestPrice') }}</th><th>{{ t('investmentMarket.change') }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in topLosers" :key="s.code">
                <td><span class="rank-no">{{ i + 1 }}</span> {{ s.name }}</td>
                <td class="code-cell">{{ s.code }}</td>
                <td class="price-cell">{{ s.price ?? '--' }}</td>
                <td class="down">{{ s.change.toFixed(2) }}%</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="rank-empty">{{ t('investmentMarket.offHoursNoData') }}</div>
        </div>
      </div>

      <!-- 成交额 / 板块概览 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#00D4FF">◉</span>
          <span class="panel-title">{{ t('investmentMarket.breadthTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.breadthDesc') }}</span>
        </div>
        <div class="breadth-grid">
          <div class="breadth-card">
            <span class="breadth-label">{{ t('investmentMarket.upCountLabel') }}</span>
            <span class="breadth-val up">{{ breadth.up }}</span>
            <span class="breadth-sub">{{ t('investmentMarket.upCountSub') }}</span>
          </div>
          <div class="breadth-card">
            <span class="breadth-label">{{ t('investmentMarket.flatCountLabel') }}</span>
            <span class="breadth-val flat">{{ breadth.flat }}</span>
            <span class="breadth-sub">{{ t('investmentMarket.flatCountSub') }}</span>
          </div>
          <div class="breadth-card">
            <span class="breadth-label">{{ t('investmentMarket.downCountLabel') }}</span>
            <span class="breadth-val down">{{ breadth.down }}</span>
            <span class="breadth-sub">{{ t('investmentMarket.downCountSub') }}</span>
          </div>
          <div class="breadth-card">
            <span class="breadth-label">{{ t('investmentMarket.totalVolLabel') }}</span>
            <span class="breadth-val" style="color:var(--dark)">{{ breadth.volume }}</span>
            <span class="breadth-sub">{{ t('investmentMarket.totalVolSub') }}</span>
          </div>
        </div>
      </div>

      <!-- 资讯快讯流 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#F5A623">⚡</span>
          <span class="panel-title">{{ t('investmentMarket.newsFeedTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.newsFeedDesc') }}</span>
          <span class="live-dot" style="margin-left:auto"></span>
          <span class="live-text">{{ t('investmentMarket.live') }}</span>
        </div>
        <div v-if="newsLoading && !newsItems.length" class="news-loading">{{ t('common.loading') }}</div>
        <div v-else-if="newsItems.length" class="news-list">
          <div v-for="(item, i) in newsItems" :key="i" class="news-item">
            <span class="news-time">{{ item.time }}</span>
            <span class="news-title">{{ item.title }}</span>
          </div>
        </div>
        <div v-else class="rank-empty">{{ t('investmentMarket.noNews') }}</div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         TAB 2: Intel
         ══════════════════════════════════════ -->
    <div v-show="activeTab === 'intel'" class="tab-content">
      <!-- 板块热度 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#F5A623">◈</span>
          <span class="panel-title">{{ t('investmentMarket.sectorHeatTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.sectorHeatDesc') }}</span>
        </div>
        <div class="sector-grid" v-if="sectorData.length">
          <div v-for="sector in sectorData" :key="sector.name" class="sector-card" :class="sector.level">
            <div class="sector-header">
              <span class="sector-name">{{ sector.name }}</span>
              <span class="sector-val" :class="sector.level">{{ sector.change_pct ?? sector.heat + '%' }}</span>
            </div>
            <div class="sector-bar">
              <div class="sector-fill" :style="{ width: sector.heat + '%' }"></div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">◇</div>
          <span class="empty-text">{{ t('investmentMarket.awaitingScan') }}</span>
          <span class="empty-sub">{{ t('investmentMarket.awaitingScanSub') }}</span>
        </div>
      </div>

      <!-- 北向资金 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#4f79c7">◉</span>
          <span class="panel-title">{{ t('investmentMarket.northboundTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.northboundDesc') }}</span>
        </div>
        <div class="flow-grid">
          <div class="flow-card main-flow">
            <span class="flow-label">TODAY_NET</span>
            <span class="flow-val" :class="{ positive: northboundNet > 0, negative: northboundNet < 0 }">
              {{ northboundNet > 0 ? '+' : '' }}{{ northboundNet.toFixed(2) }}
              <span class="flow-unit">{{ t('investmentMarket.yiUnit') }}</span>
            </span>
          </div>
          <div class="flow-card">
            <span class="flow-label">{{ t('investmentMarket.shConnect') }}</span>
            <span class="flow-val-sm" :class="{ positive: Number(northboundSh) > 0, negative: Number(northboundSh) < 0 }">
              {{ northboundSh }}{{ t('investmentMarket.yiUnit') }}
            </span>
          </div>
          <div class="flow-card">
            <span class="flow-label">{{ t('investmentMarket.szConnect') }}</span>
            <span class="flow-val-sm" :class="{ positive: Number(northboundSz) > 0, negative: Number(northboundSz) < 0 }">
              {{ northboundSz }}{{ t('investmentMarket.yiUnit') }}
            </span>
          </div>
          <div class="flow-card">
            <span class="flow-label">{{ t('investmentMarket.dataSourceLabel') }}</span>
            <span class="flow-source">{{ northboundSource }}</span>
          </div>
        </div>
      </div>

      <!-- 市场信号事件 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#00D4FF">⟐</span>
          <span class="panel-title">{{ t('investmentMarket.marketSignalsTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.marketSignalsDesc') }}</span>
          <span class="panel-count" v-if="marketSignals.length">{{ marketSignals.length }}</span>
        </div>
        <div class="signal-list">
          <div v-for="(signal, idx) in marketSignals" :key="signal.id" class="signal-item">
            <div class="signal-timeline">
              <span class="signal-dot"></span>
              <span v-if="idx < marketSignals.length - 1" class="signal-line"></span>
            </div>
            <div class="signal-meta">
              <span class="signal-time">{{ formatTime(signal.at) }}</span>
            </div>
            <div class="signal-body">
              <span class="signal-title">{{ signal.title }}</span>
              <span class="signal-summary">{{ signal.summary }}</span>
            </div>
          </div>
        <div v-if="marketSignals.length === 0" class="empty-state">
          <div class="empty-icon">○</div>
          <span class="empty-text">{{ t('investmentMarket.noSignals') }}</span>
          <span class="empty-sub">{{ t('investmentMarket.noSignalsSub') }}</span>
        </div>
      </div>
    </div>
    </div>

    <!-- ══════════════════════════════════════
         TAB 3: Adam Discovery
         ══════════════════════════════════════ -->
    <div v-show="activeTab === 'adam'" class="tab-content">
      <!-- 亚当发现的机会 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#F5A623">◈</span>
          <span class="panel-title">{{ t('investmentMarket.adamDiscoveriesTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.adamDiscoveriesDesc') }}</span>
          <span class="panel-count" v-if="adamDiscoveries.length">{{ adamDiscoveries.length }}</span>
        </div>
        <div class="discovery-list" v-if="adamDiscoveries.length">
          <div v-for="item in adamDiscoveries" :key="item.id" class="discovery-card">
            <div class="discovery-head">
              <span class="discovery-type-tag">{{ item.typeLabel }}</span>
              <span class="discovery-time">{{ formatTime(item.at) }}</span>
            </div>
            <div class="discovery-title">{{ item.title }}</div>
            <div class="discovery-summary">{{ item.summary }}</div>
            <div class="discovery-meta" v-if="item.symbol">
              <span class="discovery-symbol">{{ item.symbol }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state tall">
          <div class="empty-icon">◎</div>
          <span class="empty-text">{{ t('investmentMarket.awaitingExploration') }}</span>
          <span class="empty-sub">{{ t('investmentMarket.awaitingExplorationSub') }}</span>
        </div>
      </div>

      <!-- 推荐记录 -->
      <div class="panel" v-if="recommendations.length">
        <div class="panel-head">
          <span class="panel-icon" style="color:#00D4FF">⟐</span>
          <span class="panel-title">{{ t('investmentMarket.recommendationsTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.recommendationsDesc') }}</span>
          <span class="panel-count">{{ recommendations.length }}</span>
        </div>
        <div class="rec-list">
          <div v-for="rec in recommendations" :key="rec.id" class="rec-card">
            <div class="rec-head">
              <span class="rec-title">{{ rec.title }}</span>
              <span v-if="rec.symbol" class="rec-symbol">{{ rec.symbol }}</span>
              <span class="rec-status" :class="rec.status">{{ recStatusLabel(rec.status) }}</span>
            </div>
            <div class="rec-thesis">{{ rec.thesis }}</div>
            <div class="rec-footer">
              <span class="rec-time">{{ formatTime(rec.issuedAt) }}</span>
              <span v-if="rec.confidence" class="rec-confidence">{{ t('investmentMarket.confidence') }} {{ Math.round(rec.confidence * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         TAB 4: My Market
         ══════════════════════════════════════ -->
    <div v-show="activeTab === 'mine'" class="tab-content">
      <!-- HTX 自动交易 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#28C76F">◉</span>
          <span class="panel-title">{{ t('investmentMarket.htxAutoTradingTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.htxAutoTradingDesc') }}</span>
          <button class="add-btn" @click="loadTradingData">{{ t('investmentMarket.refresh') }}</button>
        </div>
        <div class="htx-grid">
          <!-- 余额 -->
          <div class="htx-card">
            <div class="htx-card-label">{{ t('investmentMarket.spotUsdt') }}</div>
            <div class="htx-card-value">{{ htxBalance?.spot_usdt ?? '—' }}</div>
            <div class="htx-card-sub">{{ t('investmentMarket.tradableBalance') }}</div>
          </div>
          <div class="htx-card">
            <div class="htx-card-label">{{ t('investmentMarket.savingsUsdt') }}</div>
            <div class="htx-card-value">{{ htxBalance?.savings_usdt ?? '—' }}</div>
            <div class="htx-card-sub">{{ t('investmentMarket.savingsHint') }}</div>
          </div>
          <div class="htx-card">
            <div class="htx-card-label">{{ t('investmentMarket.currentPosition') }}</div>
            <div class="htx-card-value" v-if="tradeStats?.current_position">
              {{ tradeStats.current_position.symbol.toUpperCase() }}
            </div>
            <div class="htx-card-value" v-else style="color:#999">{{ t('investmentMarket.emptyPosition') }}</div>
            <div class="htx-card-sub" v-if="tradeStats?.current_position">
              ${{ tradeStats.current_position.bought_at }} · {{ tradeStats.current_position.amount_usdt }} USDT
            </div>
          </div>
        </div>

        <div class="htx-stats-row">
          <div class="htx-stat">
            <span class="htx-stat-label">{{ t('investmentMarket.totalTrades') }}</span>
            <span class="htx-stat-value">{{ tradeStats?.summary?.total_trades ?? 0 }} {{ t('investmentMarket.tradeCountUnit') }}</span>
          </div>
          <div class="htx-stat">
            <span class="htx-stat-label">{{ t('investmentMarket.winRate') }}</span>
            <span class="htx-stat-value">{{ tradeStats?.summary?.win_rate ?? '0%' }}</span>
          </div>
          <div class="htx-stat">
            <span class="htx-stat-label">{{ t('investmentMarket.netPnl') }}</span>
            <span class="htx-stat-value" :style="{ color: pnlColor }">
              {{ pnlText }}
            </span>
          </div>
          <div class="htx-stat">
            <span class="htx-stat-label">{{ t('investmentMarket.feeExpense') }}</span>
            <span class="htx-stat-value">{{ tradeStats?.summary?.total_fees_paid ?? '0.0000' }}</span>
          </div>
        </div>

        <!-- 按信号胜率 -->
        <div v-if="tradeStats?.by_signal?.length" class="htx-signals">
          <div class="htx-trades-title">{{ t('investmentMarket.signalWinRateTitle') }}</div>
          <div class="htx-signal-grid">
            <div v-for="s in tradeStats.by_signal" :key="s.signal" class="htx-signal-card">
              <div class="signal-name">{{ s.signal }}</div>
              <div class="signal-stats">
                <span>{{ s.wins }}/{{ s.total }} = <b>{{ s.win_rate }}</b></span>
                <span :class="{ win: parseFloat(s.net_pnl) > 0, loss: parseFloat(s.net_pnl) < 0 }">
                  {{ parseFloat(s.net_pnl) > 0 ? '+' : '' }}{{ s.net_pnl }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tradeStats?.recent_trades?.length" class="htx-trades">
          <div class="htx-trades-title">{{ t('investmentMarket.recentTradesTitle') }}</div>
          <div v-for="(trade, i) in tradeStats.recent_trades.slice().reverse()" :key="i" class="htx-trade-row">
            <span class="trade-time">{{ formatTradeTime(trade.ts) }}</span>
            <span class="trade-side" :class="trade.side">{{ trade.side === 'buy' ? t('investmentMarket.buy') : t('investmentMarket.sell') }}</span>
            <span class="trade-symbol">{{ trade.symbol.toUpperCase() }}</span>
            <span class="trade-price">@{{ trade.price }}</span>
            <span class="trade-pnl" v-if="trade.pnl" :class="{ win: trade.pnl.startsWith('+'), loss: !trade.pnl.startsWith('+') }">{{ trade.pnl }} ({{ trade.pnl_pct }})</span>
            <span class="trade-reason">{{ trade.reason }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <span class="empty-text">{{ t('investmentMarket.noTrades') }}</span>
        </div>
      </div>

      <!-- 信用 + 分红/赔付结算 -->
      <div class="panel" v-if="settlement">
        <div class="panel-head">
          <span class="panel-icon" style="color:#F5A623">⬢</span>
          <span class="panel-title">{{ t('investmentMarket.creditSettlementTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.creditSettlementDesc') }}</span>
        </div>
        <div class="credit-grid">
          <div class="credit-card">
            <div class="credit-card-label">{{ t('investmentMarket.creditCurrentLevel') }}</div>
            <div class="credit-card-value" :class="'level-' + settlement.credit.level.replace('+','plus')">{{ settlement.credit.level }}</div>
            <div class="credit-card-sub">{{ t('investmentMarket.creditLimitSub', { limit: settlement.credit.max_trade_usdt, ratio: (settlement.credit.dividend_ratio*100).toFixed(0) }) }}</div>
          </div>
          <div class="credit-card">
            <div class="credit-card-label">{{ t('investmentMarket.creditDividend') }}</div>
            <div class="credit-card-value" style="color:#28C76F">+{{ settlement.settlement_summary.total_dividend_owed }}</div>
            <div class="credit-card-sub">{{ t('investmentMarket.creditDividendSub') }}</div>
          </div>
          <div class="credit-card">
            <div class="credit-card-label">{{ t('investmentMarket.creditCompensation') }}</div>
            <div class="credit-card-value" style="color:#FF6B6B">+{{ settlement.settlement_summary.total_compensation_owed }}</div>
            <div class="credit-card-sub">{{ t('investmentMarket.creditCompensationSub') }}</div>
          </div>
          <div class="credit-card">
            <div class="credit-card-label">{{ t('investmentMarket.creditTotalOwed') }}</div>
            <div class="credit-card-value" style="color:#F5A623">{{ settlement.settlement_summary.net_owed_to_user }}</div>
            <div class="credit-card-sub">{{ t('investmentMarket.creditTotalOwedSub') }}</div>
          </div>
        </div>
      </div>

      <!-- 档案馆反思日志 -->
      <div class="panel" v-if="reflections?.length">
        <div class="panel-head">
          <span class="panel-icon" style="color:#9B59B6">◐</span>
          <span class="panel-title">{{ t('investmentMarket.archiveReflectionsTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.archiveReflectionsDesc') }}</span>
        </div>
        <div class="refl-list">
          <div v-for="r in reflections" :key="r.id" class="refl-row">
            <div class="refl-head">
              <span class="refl-outcome" :class="r.outcome">{{ r.outcome === 'win' ? '✓' : '✗' }}</span>
              <span class="refl-summary">{{ r.summary }}</span>
              <span class="refl-time">{{ formatTradeTime(r.ts) }}</span>
            </div>
            <div class="refl-lesson">「{{ r.lesson }}」</div>
          </div>
        </div>
      </div>

      <!-- 添加按钮 -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-icon" style="color:#F5A623">◈</span>
          <span class="panel-title">{{ t('investmentMarket.watchlistTitle') }}</span>
          <span class="panel-desc">{{ t('investmentMarket.watchlistDesc') }}</span>
          <button class="add-btn" @click="showAddDialog = true">{{ t('investmentMarket.add') }}</button>
        </div>
        <div class="watchlist" v-if="watchlist.length">
          <div v-for="item in watchlist" :key="item.id" class="watch-card">
            <div class="watch-main">
              <div class="watch-info">
                <span class="watch-name">{{ item.name }}</span>
                <span class="watch-code" v-if="item.code">{{ item.code }}</span>
              </div>
              <div class="watch-type-tag">{{ marketTypeLabel(item.type) }}</div>
            </div>
            <div class="watch-note" v-if="item.note">{{ item.note }}</div>
            <div class="watch-actions">
              <span class="watch-time">{{ t('investmentMarket.addedAt') }} {{ formatDate(item.addedAt) }}</span>
              <button class="del-btn" @click="removeWatchItem(item.id)">{{ t('investmentMarket.remove') }}</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state tall">
          <div class="empty-icon">◇</div>
          <span class="empty-text">{{ t('investmentMarket.noWatchlist') }}</span>
          <span class="empty-sub">{{ t('investmentMarket.noWatchlistSub') }}</span>
        </div>
      </div>

      <!-- 添加弹窗 -->
      <div v-if="showAddDialog" class="modal-overlay" @click.self="showAddDialog = false">
        <div class="modal-box">
          <div class="modal-head">
            <span class="modal-title">{{ t('investmentMarket.addWatchTitle') }}</span>
            <button class="modal-close" @click="showAddDialog = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <label class="form-label">{{ t('investmentMarket.name') }} <span class="required">*</span></label>
              <input v-model="newItem.name" class="form-input" :placeholder="t('investmentMarket.namePlaceholder')" />
            </div>
            <div class="form-row">
              <label class="form-label">{{ t('investmentMarket.codeOptional') }}</label>
              <input v-model="newItem.code" class="form-input" :placeholder="t('investmentMarket.codePlaceholder')" />
            </div>
            <div class="form-row">
              <label class="form-label">{{ t('investmentMarket.type') }}</label>
              <div class="type-selector">
                <button
                  v-for="mt in marketTypes"
                  :key="mt.value"
                  class="type-btn"
                  :class="{ active: newItem.type === mt.value }"
                  @click="newItem.type = mt.value"
                >{{ mt.label }}</button>
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">{{ t('investmentMarket.noteOptional') }}</label>
              <input v-model="newItem.note" class="form-input" :placeholder="t('investmentMarket.notePlaceholder')" />
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn-cancel" @click="showAddDialog = false">{{ t('common.cancel') }}</button>
            <button class="btn-confirm" :disabled="!newItem.name.trim()" @click="addWatchItem">{{ t('investmentMarket.confirmAdd') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdamStore } from '@/stores/adam'

const adamStore = useAdamStore()
const { t, locale } = useI18n()

// ── Tab 配置 ──
const activeTab = ref<'stocks' | 'intel' | 'adam' | 'mine'>('stocks')

const tabs = computed(() => [
  { id: 'stocks' as const, code: '01', label: t('investmentMarket.tabStocks'), badge: null },
  { id: 'intel' as const, code: '02', label: t('investmentMarket.tabIntel'), badge: marketSignals.value.length || null },
  { id: 'adam' as const, code: '03', label: t('investmentMarket.tabAdam'), badge: adamDiscoveries.value.length || null },
  { id: 'mine' as const, code: '04', label: t('investmentMarket.tabMine'), badge: watchlist.value.length || null },
])

// ── Tab 1: 股票市场 ──
// 静态占位，由亚当工具填充
const indices = ref<Array<{ name: string; code: string; price: string; change: number }>>([
  { name: '上证指数', code: '000001.SH', price: '--', change: 0 },
  { name: '深证成指', code: '399001.SZ', price: '--', change: 0 },
  { name: '创业板指', code: '399006.SZ', price: '--', change: 0 },
  { name: '科创50', code: '000688.SH', price: '--', change: 0 },
  { name: '沪深300', code: '000300.SH', price: '--', change: 0 },
])
const topGainers = ref<Array<{ name: string; code: string; change: number; price?: string; volume?: string }>>([])
const topLosers = ref<Array<{ name: string; code: string; change: number; price?: string; volume?: string }>>([])
const breadth = ref({ up: '--', flat: '--', down: '--', volume: '--' })

// ── Tab 2: 情报 ──
const sectorData = ref<Array<{ name: string; heat: number; level: string; change_pct?: string }>>([])
const northboundNet = ref(0)
const northboundSh = ref('--')
const northboundSz = ref('--')
const northboundSource = computed(() => t('investmentMarket.eastMoneyRealtime'))
const newsItems = ref<Array<{ title: string; time: string; source: string }>>([])
const newsLoading = ref(false)

const marketSignals = computed(() =>
  adamStore.events
    .filter((e) => e.type === 'market_signal_detected')
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20),
)

const indexNameMap: Record<string, { zh: string; en: string }> = {
  '000001.SH': { zh: '上证指数', en: 'SSE Composite' },
  '399001.SZ': { zh: '深证成指', en: 'SZSE Component' },
  '399006.SZ': { zh: '创业板指', en: 'ChiNext Index' },
  '000688.SH': { zh: '科创50', en: 'STAR 50' },
  '000300.SH': { zh: '沪深300', en: 'CSI 300' },
}

function displayIndexName(idx: { name: string; code: string }) {
  const mapped = indexNameMap[idx.code]
  return mapped ? (locale.value.startsWith('en') ? mapped.en : mapped.zh) : idx.name
}

// ── Tab 3: 亚当探索 ──
const typeMap: Record<string, string> = {
  market_signal_detected: t('investmentMarket.marketSignalType'),
  recommendation_issued: t('investmentMarket.recommendationType'),
  research_completed: t('investmentMarket.researchCompletedType'),
  research_started: t('investmentMarket.researchStartedType'),
}

const adamDiscoveries = computed(() => {
  const explorationTypes = ['market_signal_detected', 'recommendation_issued', 'research_completed', 'research_started']
  return adamStore.events
    .filter((e) => explorationTypes.includes(e.type))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 30)
    .map((e) => ({
      id: e.id,
      title: e.title,
      summary: e.summary,
      at: e.at,
      typeLabel: typeMap[e.type] || e.type,
      symbol: (e.metadata as any)?.symbol as string | undefined,
    }))
})

const recommendations = computed(() => adamStore.recommendations.slice(0, 10))

function recStatusLabel(status: string) {
  const map: Record<string, string> = {
    drafted: t('investmentMarket.statusDrafted'),
    issued: t('investmentMarket.statusIssued'),
    adopted: t('investmentMarket.statusAdopted'),
    executed: t('investmentMarket.statusExecuted'),
    settled: t('investmentMarket.statusSettled'),
    disputed: t('investmentMarket.statusDisputed'),
    archived: t('investmentMarket.statusArchived'),
  }
  return map[status] || status
}

// ── HTX 自动交易数据 ──
const htxBalance = ref<any>(null)
const tradeStats = ref<any>(null)
const reflections = ref<any[]>([])
const settlement = ref<any>(null)

async function loadTradingData() {
  try {
    const [bRes, sRes, rRes, stRes] = await Promise.all([
      fetch('/api/adam/htx-balance').then(r => r.json()),
      fetch('/api/adam/trade-stats').then(r => r.json()),
      fetch('/api/adam/reflections').then(r => r.json()).catch(() => ({ reflections: [] })),
      fetch('/api/adam/settlement').then(r => r.json()).catch(() => null),
    ])
    htxBalance.value = bRes
    tradeStats.value = sRes
    reflections.value = rRes.reflections || []
    settlement.value = stRes
  } catch (e) { console.error('load trading data failed', e) }
}

const pnlColor = computed(() => {
  const v = parseFloat(tradeStats.value?.summary?.net_pnl_usdt || '0')
  if (v > 0) return '#28C76F'
  if (v < 0) return '#FF4D4F'
  return '#666'
})

const pnlText = computed(() => {
  const v = parseFloat(tradeStats.value?.summary?.net_pnl_usdt || '0')
  return (v > 0 ? '+' : '') + v.toFixed(4) + ' USDT'
})

function formatTradeTime(ts: string) {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${h}:${mi}`
}

// 进入 mine tab 时自动拉数据；每 60 秒刷新一次
watch(activeTab, (v) => { if (v === 'mine') loadTradingData() }, { immediate: true })
let _tradingTimer: any = null
onMounted(() => { _tradingTimer = setInterval(() => { if (activeTab.value === 'mine') loadTradingData() }, 60000) })
onUnmounted(() => { if (_tradingTimer) clearInterval(_tradingTimer) })

// ── Tab 4: 我的市场 ──
const WATCHLIST_KEY = 'adam_market_watchlist'

interface WatchItem {
  id: string
  name: string
  code: string
  type: string
  note: string
  addedAt: string
}

const watchlist = ref<WatchItem[]>(loadWatchlist())

function loadWatchlist(): WatchItem[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]')
  } catch {
    return []
  }
}

function saveWatchlist() {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist.value))
}

const showAddDialog = ref(false)
const newItem = reactive({ name: '', code: '', type: 'stock', note: '' })

const marketTypes = [
  { value: 'stock', label: t('investmentMarket.marketTypeStock') },
  { value: 'hk', label: t('investmentMarket.marketTypeHk') },
  { value: 'us', label: t('investmentMarket.marketTypeUs') },
  { value: 'crypto', label: t('investmentMarket.marketTypeCrypto') },
  { value: 'futures', label: t('investmentMarket.marketTypeFutures') },
  { value: 'fund', label: t('investmentMarket.marketTypeFund') },
  { value: 'other', label: t('investmentMarket.marketTypeOther') },
]

function marketTypeLabel(type: string) {
  return marketTypes.find((t) => t.value === type)?.label || type
}

function addWatchItem() {
  if (!newItem.name.trim()) return
  watchlist.value.unshift({
    id: Date.now().toString(),
    name: newItem.name.trim(),
    code: newItem.code.trim(),
    type: newItem.type,
    note: newItem.note.trim(),
    addedAt: new Date().toISOString(),
  })
  saveWatchlist()
  newItem.name = ''
  newItem.code = ''
  newItem.note = ''
  newItem.type = 'stock'
  showAddDialog.value = false
}

function removeWatchItem(id: string) {
  watchlist.value = watchlist.value.filter((i) => i.id !== id)
  saveWatchlist()
}

// ── 工具函数 ──
function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${min}`
  } catch {
    return '--/-- --:--'
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
  } catch {
    return '--'
  }
}

// ── K线图 ──────────────────────────────────────────────────────────────────

interface KBar { date: string; open: number; close: number; high: number; low: number; volume: number; change: number }

const indexKlineMap: Record<string, { code: string; market: string }> = {
  '000001.SH': { code: '000001', market: '1' },
  '399001.SZ': { code: '399001', market: '0' },
  '399006.SZ': { code: '399006', market: '0' },
  '000688.SH': { code: '000688', market: '1' },
  '000300.SH': { code: '000300', market: '1' },
}

const klineTarget = ref<{ name: string; code: string } | null>(null)
const klineDays = ref(60)
const klinePeriods = [{ days: 30, label: '1M' }, { days: 60, label: '3M' }, { days: 120, label: '6M' }, { days: 250, label: '1Y' }]
const klineCanvas = ref<HTMLCanvasElement | null>(null)
const klineLoading = ref(false)
const klineData = ref<KBar[]>([])
const klineTooltip = ref<{ bar: KBar; x: number; y: number } | null>(null)

// 视图状态：visStart=第一根可见bar的索引, visCount=可见bar数量
const klineVis = ref({ start: 0, count: 60 })

function selectKline(idx: { name: string; code: string }) {
  if (klineTarget.value?.code === idx.code) {
    klineTarget.value = null
    klineCleanupEvents()
    return
  }
  klineTarget.value = { name: idx.name, code: idx.code }
  loadKline()
}

async function loadKline() {
  if (!klineTarget.value) return
  klineLoading.value = true
  try {
    const map = indexKlineMap[klineTarget.value.code]
    if (!map) return
    const res = await fetch(`/api/market-data?type=kline&code=${map.code}&market=${map.market}&limit=${klineDays.value}`)
    const json = await res.json()
    if (json.ok && json.data?.length) {
      klineData.value = json.data
      // 初始视图：显示全部
      klineVis.value = { start: 0, count: json.data.length }
      await nextTick()
      klineRender()
      klineBindEvents()
    }
  } catch {}
  klineLoading.value = false
}

// ── 渲染 ─────────────────────────────────────────────────────────────────────
function klineRender(crossX?: number, crossY?: number) {
  const canvas = klineCanvas.value
  if (!canvas || !klineData.value.length) return
  const allBars = klineData.value
  const { start, count } = klineVis.value
  const bars = allBars.slice(start, start + count)
  if (!bars.length) return

  const dpr = window.devicePixelRatio || 1
  const W = canvas.offsetWidth || 640
  const H = canvas.offsetHeight || 300
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const upColor = '#ef6f5e'
  const downColor = '#4f79c7'
  const gridColor = 'rgba(42,52,65,0.08)'
  const textColor = 'rgba(23,32,39,0.42)'
  const crossColor = 'rgba(79,121,199,0.36)'

  ctx.clearRect(0, 0, W, H)

  // 主图 + 成交量子图
  const padL = 8, padR = 58, padT = 14, padB = 20
  const volH = 44  // 成交量子图高度
  const sepH = 6   // 间距
  const mainH = H - padT - padB - volH - sepH
  const chartW = W - padL - padR

  const highs = bars.map(b => b.high)
  const lows  = bars.map(b => b.low)
  const maxH  = Math.max(...highs)
  const minL  = Math.min(...lows)
  const range = maxH - minL || 1

  const toY = (v: number) => padT + mainH - ((v - minL) / range) * mainH
  const barSlot = chartW / bars.length
  const barW = Math.max(1, Math.floor(barSlot * 0.6))

  // ── 网格线 ──
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padT + (mainH / 4) * i
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke()
    const val = maxH - (range / 4) * i
    ctx.fillStyle = textColor
    ctx.font = `9px 'SF Mono', monospace`
    ctx.textAlign = 'left'
    ctx.fillText(val.toFixed(2), W - padR + 4, y + 3)
  }

  // ── K线蜡烛 ──
  bars.forEach((bar, i) => {
    const cx = padL + i * barSlot + barSlot / 2
    const color = bar.close >= bar.open ? upColor : downColor
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx, toY(bar.high))
    ctx.lineTo(cx, toY(bar.low))
    ctx.stroke()
    const yTop = toY(Math.max(bar.open, bar.close))
    const yBot = toY(Math.min(bar.open, bar.close))
    ctx.fillStyle = color
    ctx.fillRect(cx - barW / 2, yTop, barW, Math.max(1, yBot - yTop))
  })

  // ── 成交量子图 ──
  const volTop = padT + mainH + sepH
  const maxVol = Math.max(...bars.map(b => b.volume), 1)
  bars.forEach((bar, i) => {
    const cx = padL + i * barSlot + barSlot / 2
    const vh = (bar.volume / maxVol) * volH
    ctx.fillStyle = bar.close >= bar.open ? 'rgba(239,111,94,0.5)' : 'rgba(79,121,199,0.5)'
    ctx.fillRect(cx - barW / 2, volTop + volH - vh, barW, vh)
  })
  // 成交量分隔线
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padL, volTop)
  ctx.lineTo(W - padR, volTop)
  ctx.stroke()

  // ── X轴日期标签 ──
  ctx.fillStyle = textColor
  ctx.font = `9px 'SF Mono', monospace`
  ctx.textAlign = 'center'
  const labelCount = Math.min(6, bars.length)
  const step = Math.floor(bars.length / labelCount)
  for (let i = 0; i < bars.length; i += step) {
    const cx = padL + i * barSlot + barSlot / 2
    ctx.fillText(bars[i].date.slice(5), cx, H - 4)
  }

  // ── 十字线 ──
  if (crossX !== undefined && crossY !== undefined) {
    const barIdx = Math.floor((crossX - padL) / barSlot)
    if (barIdx >= 0 && barIdx < bars.length) {
      const bar = bars[barIdx]
      const cx = padL + barIdx * barSlot + barSlot / 2

      ctx.strokeStyle = crossColor
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      // 竖线
      ctx.beginPath(); ctx.moveTo(cx, padT); ctx.lineTo(cx, volTop + volH); ctx.stroke()
      // 横线
      ctx.beginPath(); ctx.moveTo(padL, crossY); ctx.lineTo(W - padR, crossY); ctx.stroke()
      ctx.setLineDash([])

      // 价格标签（右侧）
      const priceAtCross = minL + (1 - (crossY - padT) / mainH) * range
      ctx.fillStyle = 'rgba(79,121,199,0.92)'
      ctx.fillRect(W - padR, crossY - 8, padR - 2, 16)
      ctx.fillStyle = '#fff'
      ctx.font = `bold 9px 'SF Mono', monospace`
      ctx.textAlign = 'left'
      ctx.fillText(priceAtCross.toFixed(2), W - padR + 3, crossY + 3)

      // OHLC tooltip 浮动
      klineTooltip.value = { bar, x: cx, y: crossY }
    }
  } else {
    klineTooltip.value = null
  }
}

// ── 事件绑定 ──────────────────────────────────────────────────────────────────
let _dragStart = 0, _dragStartIdx = 0, _isDragging = false

function klineBindEvents() {
  const canvas = klineCanvas.value
  if (!canvas) return

  // 滚轮缩放
  canvas.addEventListener('wheel', onKlineWheel, { passive: false })
  // 鼠标拖拽
  canvas.addEventListener('mousedown', onKlineMouseDown)
  canvas.addEventListener('mousemove', onKlineMouseMove)
  canvas.addEventListener('mouseup', onKlineMouseUp)
  canvas.addEventListener('mouseleave', onKlineMouseLeave)
  // 触摸
  canvas.addEventListener('touchstart', onKlineTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onKlineTouchMove, { passive: false })
  canvas.addEventListener('touchend', onKlineTouchEnd)
}

function klineCleanupEvents() {
  const canvas = klineCanvas.value
  if (!canvas) return
  canvas.removeEventListener('wheel', onKlineWheel)
  canvas.removeEventListener('mousedown', onKlineMouseDown)
  canvas.removeEventListener('mousemove', onKlineMouseMove)
  canvas.removeEventListener('mouseup', onKlineMouseUp)
  canvas.removeEventListener('mouseleave', onKlineMouseLeave)
  canvas.removeEventListener('touchstart', onKlineTouchStart)
  canvas.removeEventListener('touchmove', onKlineTouchMove)
  canvas.removeEventListener('touchend', onKlineTouchEnd)
}

function onKlineWheel(e: WheelEvent) {
  e.preventDefault()
  const { start, count } = klineVis.value
  const total = klineData.value.length
  const delta = e.deltaY > 0 ? 1 : -1
  // 每次缩放约10%
  const step = Math.max(2, Math.round(count * 0.1))
  let newCount = Math.min(total, Math.max(10, count + delta * step))
  // 以鼠标位置为中心缩放
  const canvas = klineCanvas.value!
  const ratio = (e.offsetX - 8) / (canvas.offsetWidth - 8 - 58)
  let newStart = Math.round(start + (count - newCount) * ratio)
  newStart = Math.max(0, Math.min(total - newCount, newStart))
  klineVis.value = { start: newStart, count: newCount }
  klineRender()
}

function onKlineMouseDown(e: MouseEvent) {
  _isDragging = true
  _dragStart = e.offsetX
  _dragStartIdx = klineVis.value.start
}

function onKlineMouseMove(e: MouseEvent) {
  const canvas = klineCanvas.value!
  const { start, count } = klineVis.value
  const total = klineData.value.length
  if (_isDragging) {
    const barSlot = (canvas.offsetWidth - 8 - 58) / count
    const moved = Math.round((_dragStart - e.offsetX) / barSlot)
    const newStart = Math.max(0, Math.min(total - count, _dragStartIdx + moved))
    klineVis.value = { start: newStart, count }
    klineRender()
  } else {
    klineRender(e.offsetX, e.offsetY)
  }
}

function onKlineMouseUp() { _isDragging = false }
function onKlineMouseLeave() {
  _isDragging = false
  klineRender()
}

// 触摸支持
let _touchStartX = 0, _touchStartIdx = 0
let _pinchStartDist = 0, _pinchStartCount = 0

function onKlineTouchStart(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length === 1) {
    _touchStartX = e.touches[0].clientX
    _touchStartIdx = klineVis.value.start
  } else if (e.touches.length === 2) {
    _pinchStartDist = Math.abs(e.touches[0].clientX - e.touches[1].clientX)
    _pinchStartCount = klineVis.value.count
  }
}

function onKlineTouchMove(e: TouchEvent) {
  e.preventDefault()
  const canvas = klineCanvas.value!
  const total = klineData.value.length
  if (e.touches.length === 1) {
    const { count } = klineVis.value
    const barSlot = (canvas.offsetWidth - 66) / count
    const moved = Math.round((_touchStartX - e.touches[0].clientX) / barSlot)
    const newStart = Math.max(0, Math.min(total - count, _touchStartIdx + moved))
    klineVis.value = { start: newStart, count }
    klineRender()
  } else if (e.touches.length === 2) {
    const dist = Math.abs(e.touches[0].clientX - e.touches[1].clientX)
    const scale = _pinchStartDist / dist
    const newCount = Math.min(total, Math.max(10, Math.round(_pinchStartCount * scale)))
    const { start } = klineVis.value
    const newStart = Math.max(0, Math.min(total - newCount, start))
    klineVis.value = { start: newStart, count: newCount }
    klineRender()
  }
}

function onKlineTouchEnd() { /* no-op */ }

watch(klineCanvas, (el) => {
  if (el && klineData.value.length) {
    klineRender()
    klineBindEvents()
  }
})

onUnmounted(() => {
  klineCleanupEvents()
  if (refreshTimer) clearInterval(refreshTimer)
})

// ── 行情数据加载 ──────────────────────────────────────────────────────────────

async function fetchMarket(type: string) {
  try {
    const res = await fetch(`/api/market-data?type=${type}`)
    const json = await res.json()
    return json.ok ? json.data : null
  } catch {
    return null
  }
}

async function loadMarketData() {
  const [idxData, gainData, loseData, breadthData, sectorD, northD] = await Promise.all([
    fetchMarket('indices'),
    fetchMarket('gainers'),
    fetchMarket('losers'),
    fetchMarket('breadth'),
    fetchMarket('sectors'),
    fetchMarket('northbound'),
  ])
  if (idxData) indices.value = idxData
  if (gainData && gainData.length > 0) topGainers.value = gainData
  if (loseData && loseData.length > 0) topLosers.value = loseData
  if (breadthData) breadth.value = breadthData
  if (sectorD && sectorD.length > 0) sectorData.value = sectorD
  if (northD && (northD.sh_net || northD.sz_net)) {
    northboundSh.value = northD.sh_net ?? '--'
    northboundSz.value = northD.sz_net ?? '--'
    northboundNet.value = Number(northD.total_net ?? 0)
  }
}

async function loadNews() {
  newsLoading.value = true
  try {
    const resp = await fetch('https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=30&format=json')
    const json = await resp.json() as any
    const items: any[] = json?.result?.data?.feed?.list ?? []
    const financeKws = ['股', 'A股', '市场', '行情', '基金', '利率', '央行', '货币', '经济', '美联储', '涨', '跌', '板块', '资金', '关税', '贸易', '通胀', '降息', '加息']
    const filtered = items.filter(i => financeKws.some(k => (i.rich_text || '').includes(k)))
    newsItems.value = (filtered.length >= 5 ? filtered : items).slice(0, 15).map((i: any) => ({
      title: i.rich_text?.replace(/<[^>]+>/g, '').slice(0, 120) || '',
      time: i.create_time?.slice(11, 16) || '',
      source: t('investmentMarket.sinaFlash'),
    }))
  } catch {}
  newsLoading.value = false
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadMarketData()
  loadNews()
  refreshTimer = setInterval(loadMarketData, 60_000)
  setInterval(loadNews, 300_000)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   市场 — Market.vue
   Bloomberg Terminal-style multi-tab market view
   ═══════════════════════════════════════════════════ */

.market-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Tab Bar ── */
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}
.tab-bar::-webkit-scrollbar { display: none; }

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 9px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: var(--dim);
  white-space: nowrap;
  transition: all 0.15s;
  position: relative;
  bottom: -1px;
}
.tab-btn:hover { color: var(--dark); }
.tab-btn.active {
  color: var(--dark);
  border-bottom-color: #F5A623;
}
.tab-code {
  font-size: 8px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #F5A623;
  opacity: 0.5;
  letter-spacing: 0.05em;
}
.tab-btn.active .tab-code { opacity: 1; }
.tab-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.tab-badge {
  font-size: 9px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: rgba(245, 166, 35, 0.15);
  color: #F5A623;
  border-radius: 8px;
  padding: 1px 5px;
  line-height: 1.4;
}

/* ── Tab Content ── */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 共用面板 ── */
.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(245,166,35,0.02) 0%, transparent 100%);
}
.panel-icon {
  font-size: 10px;
  opacity: 0.7;
}
.panel-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.panel-desc {
  font-size: 10px;
  color: var(--dim);
  opacity: 0.4;
}
.panel-count {
  margin-left: auto;
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  background: var(--faint);
  padding: 1px 6px;
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4f79c7;
  box-shadow: 0 0 5px rgba(79,121,199,0.5);
  animation: livePulse 2s ease-in-out infinite;
  margin-left: auto;
}
.live-text {
  font-size: 8px;
  font-weight: 700;
  color: #4f79c7;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
}
@keyframes livePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── 指数行情 ── */
.indices-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: var(--border);
}
.index-card {
  padding: 14px 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 3px;
  cursor: pointer;
  transition: background 0.15s;
}
.index-card:hover { background: rgba(245,166,35,0.06); }
.index-card.selected { background: rgba(245,166,35,0.1); border-bottom: 2px solid #F5A623; }
.index-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--dark);
}
.index-code {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.5;
}
.index-price {
  font-size: 18px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--dark);
  letter-spacing: -0.02em;
  margin-top: 4px;
}
.index-change {
  font-size: 11px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* ── 涨跌颜色 ── */
.up { color: #FF4D4D; }
.down { color: #4f79c7; }
.flat { color: var(--dim); }

/* ── 涨跌榜 ── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.rank-list {
  padding: 8px 0;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-bottom: 1px solid var(--border);
}
.rank-item:last-child { border-bottom: none; }

/* ── K线图 ── */
.kline-panel {}
.kline-wrap {
  position: relative;
  height: 300px;
  background: var(--card-bg);
  cursor: crosshair;
}
.kline-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.kline-loading {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dim);
  font-size: 12px;
}
.kline-tooltip {
  position: absolute;
  top: 10px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  padding: 4px 10px;
  pointer-events: none;
  font-size: 11px;
  font-family: 'SF Mono', monospace;
}
.ktooltip-date {
  color: rgba(255,255,255,0.5);
  font-size: 10px;
}
.ktooltip-item { color: rgba(255,255,255,0.7); }
.ktooltip-item b { font-weight: 700; }
.kline-period-group {
  display: flex;
  gap: 4px;
}
.kline-period-btn {
  padding: 2px 8px;
  font-size: 10px;
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  background: none;
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--dim);
  cursor: pointer;
  transition: all 0.15s;
}
.kline-period-btn:hover { color: var(--dark); border-color: #F5A623; }
.kline-period-btn.active { background: rgba(245,166,35,0.15); color: #F5A623; border-color: #F5A623; }

/* 涨跌榜表格 */
.rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.rank-table thead th {
  padding: 6px 12px;
  text-align: left;
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
  opacity: 0.5;
}
.rank-table thead th:last-child { text-align: right; }
.rank-table tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.rank-table tbody tr:last-child { border-bottom: none; }
.rank-table tbody tr:hover { background: var(--faint); }
.rank-table td {
  padding: 8px 12px;
  color: var(--dark);
}
.rank-table td:last-child { text-align: right; font-weight: 700; }
.code-cell {
  font-size: 10px;
  color: var(--dim) !important;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.5;
}
.price-cell { font-weight: 600; }
.rank-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 11px;
  color: var(--dim);
  opacity: 0.5;
}

/* 资讯快讯 */
.news-loading {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: var(--dim);
  opacity: 0.5;
}
.news-list {
  padding: 4px 0;
}
.news-item {
  display: flex;
  gap: 10px;
  padding: 9px 16px;
  border-bottom: 1px solid var(--border);
  align-items: flex-start;
}
.news-item:last-child { border-bottom: none; }
.news-item:hover { background: var(--faint); }
.news-time {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.5;
  padding-top: 1px;
  min-width: 36px;
}
.news-title {
  font-size: 12px;
  line-height: 1.5;
  color: var(--dark);
}

/* 北向资金小值 */
.flow-val-sm {
  font-size: 14px;
  font-weight: 700;
}
.flow-val-sm.positive { color: #FF4D4D; }
.flow-val-sm.negative { color: #4f79c7; }
.rank-no {
  width: 16px;
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.4;
  flex-shrink: 0;
}
.rank-name {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--dark);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-code {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.4;
  flex-shrink: 0;
}
.rank-val {
  font-size: 11px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  flex-shrink: 0;
}
.rank-empty {
  padding: 24px 16px;
  font-size: 11px;
  color: var(--dim);
  opacity: 0.4;
  text-align: center;
}

/* ── 市场宽度 ── */
.breadth-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border);
}
.breadth-card {
  padding: 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.breadth-label {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.5;
}
.breadth-val {
  font-size: 22px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: -0.02em;
}
.breadth-sub {
  font-size: 10px;
  color: var(--dim);
  opacity: 0.4;
}

/* ── 板块热度（from original Market.vue） ── */
.sector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1px;
  padding: 1px;
  background: var(--border);
}
.sector-card {
  padding: 12px 14px;
  background: var(--card-bg);
}
.sector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.sector-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--dark);
}
.sector-val {
  font-size: 11px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
}
.sector-card.hot .sector-val { color: #FF4D4D; }
.sector-card.warm .sector-val { color: #F5A623; }
.sector-card.cool .sector-val { color: #00D4FF; }
.sector-bar {
  height: 3px;
  background: var(--faint);
  border-radius: 2px;
  overflow: hidden;
}
.sector-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #F5A623, #FF6B35);
  transition: width 0.5s ease;
}
.sector-card.hot .sector-fill { background: linear-gradient(90deg, #FF4D4D, #FF6B35); }
.sector-card.warm .sector-fill { background: linear-gradient(90deg, #F5A623, #FFD93D); }
.sector-card.cool .sector-fill { background: linear-gradient(90deg, #00D4FF, #4f79c7); }

/* ── 北向资金 ── */
.flow-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: var(--border);
}
.flow-card {
  padding: 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.flow-card.main-flow {
  position: relative;
}
.flow-card.main-flow::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: #F5A623;
  opacity: 0.3;
  border-radius: 1px;
}
.flow-label {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.6;
}
.flow-val {
  font-size: 24px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--dark);
  letter-spacing: -0.02em;
}
.flow-val.positive { color: #FF4D4D; }
.flow-val.negative { color: #4f79c7; }
.flow-unit {
  font-size: 12px;
  opacity: 0.5;
  margin-left: 2px;
}
.flow-source {
  font-size: 12px;
  color: var(--dim);
}
.flow-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.flow-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dim);
  opacity: 0.5;
}
.flow-status-dot.active {
  background: #4f79c7;
  box-shadow: 0 0 6px rgba(79,121,199,0.4);
  animation: livePulse 2s ease-in-out infinite;
}
.flow-status-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
}
.flow-status-dot.active + .flow-status-text { color: #4f79c7; }

/* ── 市场信号 ── */
.signal-list {
  padding: 12px 16px 14px;
  max-height: 480px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.signal-item {
  display: flex;
  gap: 10px;
  min-height: 36px;
}
.signal-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10px;
  flex-shrink: 0;
  padding-top: 5px;
}
.signal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00D4FF;
  box-shadow: 0 0 4px rgba(0,212,255,0.4);
  flex-shrink: 0;
}
.signal-line {
  width: 1px;
  flex: 1;
  min-height: 16px;
  background: var(--border);
}
.signal-meta {
  flex-shrink: 0;
  padding-top: 2px;
}
.signal-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 72px;
  display: block;
}
.signal-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  padding-bottom: 12px;
}
.signal-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--dark);
  line-height: 1.4;
}
.signal-summary {
  font-size: 11px;
  color: var(--dim);
  line-height: 1.5;
}

/* ── 亚当探索 ── */
.discovery-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
}
.discovery-card {
  padding: 14px 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.discovery-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.discovery-type-tag {
  font-size: 9px;
  font-weight: 700;
  color: #F5A623;
  background: rgba(245,166,35,0.12);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.discovery-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.4;
  margin-left: auto;
}
.discovery-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  line-height: 1.4;
}
.discovery-summary {
  font-size: 11px;
  color: var(--dim);
  line-height: 1.5;
}
.discovery-meta {
  display: flex;
  gap: 6px;
}
.discovery-symbol {
  font-size: 10px;
  font-weight: 700;
  color: #00D4FF;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: rgba(0,212,255,0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

/* ── 推荐列表 ── */
.rec-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
}
.rec-card {
  padding: 14px 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rec-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rec-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  flex: 1;
  min-width: 0;
}
.rec-symbol {
  font-size: 10px;
  font-weight: 700;
  color: #00D4FF;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: rgba(0,212,255,0.08);
  padding: 2px 6px;
  border-radius: 4px;
}
.rec-status {
  font-size: 9px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  padding: 2px 6px;
  border-radius: 4px;
}
.rec-status.issued { color: #4f79c7; background: rgba(79,121,199,0.1); }
.rec-status.adopted { color: #F5A623; background: rgba(245,166,35,0.1); }
.rec-status.settled { color: var(--dim); background: var(--faint); }
.rec-status.drafted { color: var(--dim); background: var(--faint); }
.rec-thesis {
  font-size: 11px;
  color: var(--dim);
  line-height: 1.5;
}
.rec-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rec-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.4;
}
.rec-confidence {
  font-size: 10px;
  font-weight: 600;
  color: #F5A623;
}

/* ── HTX 自动交易 ── */
.htx-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px 16px;
}
.htx-card {
  padding: 12px 14px;
  background: rgba(40, 199, 111, 0.06);
  border: 1px solid rgba(40, 199, 111, 0.18);
  border-radius: 6px;
}
.htx-card-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.htx-card-value {
  font-size: 22px;
  font-weight: 600;
  color: #28C76F;
  font-family: 'Monaco', monospace;
}
.htx-card-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}
.htx-stats-row {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.htx-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.htx-stat-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.htx-stat-value {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Monaco', monospace;
}
.htx-trades {
  padding: 12px 16px;
}
.htx-trades-title {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.htx-trade-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  font-family: 'Monaco', monospace;
}
.trade-time { color: #888; width: 90px; }
.trade-side { width: 24px; text-align: center; font-weight: 600; padding: 2px 4px; border-radius: 3px; }
.trade-side.buy { color: #28C76F; background: rgba(40,199,111,0.1); }
.trade-side.sell { color: #FF4D4F; background: rgba(255,77,79,0.1); }
.trade-symbol { color: #fff; width: 70px; font-weight: 600; }
.trade-price { color: #ccc; width: 90px; }
.trade-pnl { width: 130px; font-weight: 600; }
.trade-pnl.win { color: #28C76F; }
.trade-pnl.loss { color: #FF4D4F; }
.trade-reason { color: #888; flex: 1; }

.htx-signals {
  padding: 0 16px 12px;
}
.htx-signal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}
.htx-signal-card {
  padding: 10px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 4px;
}
.signal-name {
  font-family: 'Monaco', monospace;
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
}
.signal-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-family: 'Monaco', monospace;
}
.signal-stats .win { color: #28C76F; }
.signal-stats .loss { color: #FF4D4F; }

.credit-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 12px 16px;
}
.credit-card {
  padding: 12px 14px;
  background: rgba(245, 166, 35, 0.05);
  border: 1px solid rgba(245, 166, 35, 0.15);
  border-radius: 6px;
}
.credit-card-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.credit-card-value {
  font-size: 22px;
  font-weight: 700;
  font-family: 'Monaco', monospace;
  color: #F5A623;
}
.credit-card-value.level-C { color: #888; }
.credit-card-value.level-B { color: #4A90E2; }
.credit-card-value.level-Bplus { color: #28C76F; }
.credit-card-value.level-A { color: #F5A623; }
.credit-card-value.level-S { color: #9B59B6; }
.credit-card-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.refl-list { padding: 8px 16px 14px; }
.refl-row {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: rgba(155, 89, 182, 0.05);
  border-left: 2px solid rgba(155, 89, 182, 0.4);
  border-radius: 4px;
}
.refl-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 4px;
  font-family: 'Monaco', monospace;
}
.refl-outcome {
  width: 18px;
  text-align: center;
  font-weight: 700;
}
.refl-outcome.win { color: #28C76F; }
.refl-outcome.loss { color: #FF4D4F; }
.refl-summary { color: #ccc; flex: 1; }
.refl-time { color: #777; font-size: 11px; }
.refl-lesson {
  font-size: 12px;
  color: #aaa;
  font-style: italic;
  padding-left: 26px;
  line-height: 1.5;
}

/* ── 我的市场 ── */
.add-btn {
  margin-left: auto;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #F5A623;
  background: rgba(245,166,35,0.1);
  border: 1px solid rgba(245,166,35,0.25);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.add-btn:hover {
  background: rgba(245,166,35,0.2);
}
.watchlist {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
}
.watch-card {
  padding: 14px 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.watch-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.watch-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.watch-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
}
.watch-code {
  font-size: 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--dim);
  opacity: 0.5;
}
.watch-type-tag {
  font-size: 9px;
  font-weight: 700;
  color: #00D4FF;
  background: rgba(0,212,255,0.08);
  padding: 2px 7px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.watch-note {
  font-size: 11px;
  color: var(--dim);
  line-height: 1.5;
}
.watch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.watch-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.35;
  flex: 1;
}
.del-btn {
  font-size: 10px;
  color: var(--dim);
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.15s;
  padding: 2px 4px;
}
.del-btn:hover { opacity: 0.8; }

/* ── 弹窗 ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: 420px;
  max-width: 92vw;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.modal-head {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dark);
  flex: 1;
}
.modal-close {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--dim);
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.15s;
  padding: 2px 4px;
}
.modal-close:hover { opacity: 0.9; }
.modal-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--dim);
}
.required { color: #FF4D4D; }
.form-input {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--dark);
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.form-input:focus { border-color: #F5A623; }
.type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.type-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--dim);
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.type-btn:hover { color: var(--dark); }
.type-btn.active {
  color: #F5A623;
  background: rgba(245,166,35,0.1);
  border-color: rgba(245,166,35,0.4);
}
.modal-foot {
  padding: 14px 18px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-cancel {
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dim);
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { color: var(--dark); }
.btn-confirm {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 700;
  color: var(--card-bg);
  background: #F5A623;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-confirm:hover:not(:disabled) { opacity: 0.85; }
.btn-confirm:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── 空状态 ── */
.empty-state {
  padding: 36px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.empty-state.tall { padding: 60px 16px; }
.empty-icon {
  font-size: 18px;
  color: var(--dim);
  opacity: 0.25;
}
.empty-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
  opacity: 0.4;
}
.empty-sub {
  font-size: 11px;
  color: var(--dim);
  opacity: 0.35;
}

/* ── Frosted flat restyle ── */
.market-page {
  --mk-ink: #172027;
  --mk-soft: rgba(23, 32, 39, 0.64);
  --mk-muted: rgba(23, 32, 39, 0.42);
  --mk-line: rgba(42, 52, 65, 0.1);
  --mk-glass: rgba(255, 255, 255, 0.64);
  --mk-glass-strong: rgba(255, 255, 255, 0.76);
  --mk-blue: #4f79c7;
  --mk-blue-soft: rgba(79, 121, 199, 0.12);
  --mk-coral: #ef6f5e;
  --mk-sun: #f3b451;
  --mk-sky: #5d89d4;
  gap: 18px;
}

.market-page .tab-bar {
  gap: 6px;
  padding: 4px;
  margin-bottom: 18px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.46);
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}
.market-page .tab-btn {
  bottom: 0;
  padding: 9px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--mk-soft);
  background: transparent;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.market-page .tab-btn:hover {
  color: var(--mk-ink);
  background: rgba(255, 255, 255, 0.5);
}
.market-page .tab-btn.active {
  color: #fff;
  background: var(--mk-blue);
  border-bottom-color: transparent;
}
.market-page .tab-code {
  color: currentColor;
  opacity: 0.58;
  letter-spacing: 0.02em;
}
.market-page .tab-btn.active .tab-code { opacity: 0.82; }
.market-page .tab-badge {
  background: rgba(255, 255, 255, 0.22);
  color: currentColor;
  border-radius: 999px;
}

.market-page .panel,
.market-page .modal-box {
  background: var(--mk-glass);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
  box-shadow: inset 0 0 0 1px rgba(42, 52, 65, 0.04);
}
.market-page .panel-head,
.market-page .modal-head,
.market-page .modal-foot {
  border-color: var(--mk-line);
  background: rgba(255, 255, 255, 0.24);
}
.market-page .panel-icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  color: #fff !important;
  background: var(--mk-blue);
  opacity: 1;
}
.market-page .panel-title {
  color: rgba(23, 32, 39, 0.68);
  letter-spacing: 0.03em;
  font-family: inherit;
  font-size: 12px;
}
.market-page .panel-desc,
.market-page .panel-count,
.market-page .empty-text,
.market-page .empty-sub {
  color: var(--mk-muted);
  opacity: 1;
}
.market-page .live-dot,
.market-page .flow-status-dot.active {
  background: var(--mk-blue);
  box-shadow: 0 0 0 4px rgba(79, 121, 199, 0.12);
}
.market-page .live-text,
.market-page .flow-status-dot.active + .flow-status-text {
  color: var(--mk-blue);
}

.market-page .indices-row,
.market-page .breadth-grid,
.market-page .sector-grid,
.market-page .flow-grid,
.market-page .discovery-list,
.market-page .rec-list,
.market-page .watchlist {
  gap: 8px;
  padding: 12px;
  background: transparent;
}
.market-page .index-card,
.market-page .breadth-card,
.market-page .sector-card,
.market-page .flow-card,
.market-page .discovery-card,
.market-page .rec-card,
.market-page .watch-card {
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid var(--mk-line);
  border-radius: 14px;
}
.market-page .index-card:hover,
.market-page .rank-table tbody tr:hover,
.market-page .news-item:hover {
  background: rgba(79, 121, 199, 0.08);
}
.market-page .index-card.selected {
  background: var(--mk-blue-soft);
  border: 1px solid rgba(79, 121, 199, 0.24);
}
.market-page .index-name,
.market-page .sector-name,
.market-page .rank-name,
.market-page .news-title,
.market-page .rec-title,
.market-page .watch-name,
.market-page .modal-title {
  color: var(--mk-ink);
}
.market-page .index-code,
.market-page .breadth-label,
.market-page .flow-label,
.market-page .rank-code,
.market-page .code-cell,
.market-page .news-time,
.market-page .rec-time,
.market-page .watch-code,
.market-page .watch-time,
.market-page .form-label {
  color: var(--mk-muted) !important;
  opacity: 1;
}
.market-page .up,
.market-page .flow-val.positive,
.market-page .flow-val-sm.positive,
.market-page .sector-card.hot .sector-val {
  color: var(--mk-coral);
}
.market-page .down,
.market-page .flow-val.negative,
.market-page .flow-val-sm.negative {
  color: var(--mk-blue);
}
.market-page .sector-card.warm .sector-val,
.market-page .rec-confidence {
  color: #8a5b09;
}
.market-page .sector-card.cool .sector-val,
.market-page .rec-symbol,
.market-page .watch-type-tag,
.market-page .discovery-symbol {
  color: #325d9b;
  background: rgba(93, 137, 212, 0.12);
}
.market-page .sector-bar,
.market-page .form-input,
.market-page .type-btn,
.market-page .btn-cancel {
  background: rgba(255, 255, 255, 0.5);
  border-color: var(--mk-line);
}
.market-page .sector-fill,
.market-page .sector-card.hot .sector-fill,
.market-page .sector-card.warm .sector-fill,
.market-page .sector-card.cool .sector-fill {
  background: var(--mk-blue);
}
.market-page .flow-card.main-flow::before,
.market-page .signal-dot {
  background: var(--mk-blue);
  box-shadow: none;
}
.market-page .discovery-type-tag,
.market-page .rec-status.adopted,
.market-page .add-btn,
.market-page .type-btn.active {
  color: var(--mk-blue);
  background: var(--mk-blue-soft);
  border-color: rgba(79, 121, 199, 0.24);
}
.market-page .rec-status.issued {
  color: var(--mk-blue);
  background: var(--mk-blue-soft);
}
.market-page .form-input:focus {
  border-color: rgba(79, 121, 199, 0.28);
  box-shadow: 0 0 0 3px rgba(79, 121, 199, 0.08);
}
.market-page .required { color: var(--mk-coral); }
.market-page .btn-confirm {
  color: #fff;
  background: var(--mk-blue);
  border-radius: 999px;
}
.market-page .btn-cancel,
.market-page .add-btn,
.market-page .type-btn {
  border-radius: 999px;
}
.market-page .kline-wrap {
  background: rgba(255, 255, 255, 0.34);
}
.market-page .kline-tooltip {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(42, 52, 65, 0.1);
  border-radius: 12px;
}
.market-page .ktooltip-date,
.market-page .ktooltip-item {
  color: var(--mk-soft);
}
.market-page .kline-period-btn {
  border-radius: 999px;
  border-color: var(--mk-line);
  background: rgba(255, 255, 255, 0.44);
}
.market-page .kline-period-btn:hover,
.market-page .kline-period-btn.active {
  color: var(--mk-blue);
  border-color: rgba(79, 121, 199, 0.28);
  background: var(--mk-blue-soft);
}

/* ── 响应式 ── */
@media (max-width: 1023px) {
  .indices-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 767px) {
  .indices-row { grid-template-columns: 1fr 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .breadth-grid { grid-template-columns: 1fr 1fr; }
  .flow-grid { grid-template-columns: 1fr; }
  .sector-grid { grid-template-columns: 1fr; }
}
</style>
