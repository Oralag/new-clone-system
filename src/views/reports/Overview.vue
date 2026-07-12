<template>
  <div class="ro-page">
    <!-- Header -->
    <div class="ro-header">
      <div>
        <div class="ro-badge">{{ $t('reports.overview.badge') }}</div>
        <h2 class="ro-title">{{ $t('reports.overview.title') }}</h2>
        <p class="ro-sub">{{ $t('reports.overview.subtitle') }}</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          :range-separator="$t('reports.overview.rangeSeparator')"
          :start-placeholder="$t('reports.overview.startDate')"
          :end-placeholder="$t('reports.overview.endDate')"
          value-format="YYYY-MM-DD"
          style="width:240px"
          @change="loadAll"
        />
        <el-button :icon="Refresh" :loading="loading" @click="loadAll">{{ $t('reports.overview.refresh') }}</el-button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="ro-kpi-grid">
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/sale/contract')">
        <div class="ro-kpi-icon" style="background:rgba(22,163,74,0.08)">
          <el-icon :size="22" color="#16a34a"><Money /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">{{ $t('reports.overview.kpiSaleIncome') }}</div>
          <div class="ro-kpi-value" style="color:#16a34a">¥{{ fmt(saleTotal) }}</div>
          <div class="ro-kpi-sub">{{ $t('reports.overview.kpiSaleSub', { n: saleContracts.length }) }}</div>
        </div>
      </div>
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/retail/order')">
        <div class="ro-kpi-icon" style="background:rgba(22,163,74,0.08)">
          <el-icon :size="22" color="#16a34a"><Shop /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">{{ $t('reports.overview.kpiRetailIncome') }}</div>
          <div class="ro-kpi-value" style="color:#16a34a">¥{{ fmt(retailTotal) }}</div>
          <div class="ro-kpi-sub">{{ $t('reports.overview.kpiRetailSub', { n: retailOrders.length }) }}</div>
        </div>
      </div>
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/procure/order')">
        <div class="ro-kpi-icon" style="background:rgba(220,38,38,0.08)">
          <el-icon :size="22" color="#dc2626"><ShoppingCart /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">{{ $t('reports.overview.kpiProcureExpense') }}</div>
          <div class="ro-kpi-value" style="color:#dc2626">¥{{ fmt(procureTotal) }}</div>
          <div class="ro-kpi-sub">{{ $t('reports.overview.kpiProcureSub', { n: procureOrders.length }) }}</div>
        </div>
      </div>
      <div class="ro-kpi-card ro-kpi-clickable" @click="$router.push('/reports/profit')">
        <div class="ro-kpi-icon" :style="{ background: netProfit >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)' }">
          <el-icon :size="22" :color="netProfit >= 0 ? '#16a34a' : '#dc2626'"><TrendCharts /></el-icon>
        </div>
        <div>
          <div class="ro-kpi-label">{{ $t('reports.overview.kpiNetProfit') }}</div>
          <div class="ro-kpi-value" :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ netProfit >= 0 ? '' : '-' }}¥{{ fmt(Math.abs(netProfit)) }}
          </div>
          <div class="ro-kpi-sub">{{ $t('reports.overview.kpiMargin', { gross: grossMargin.toFixed(1), net: netMargin.toFixed(1) }) }}</div>
        </div>
      </div>
    </div>

    <!-- 收支趋势 + 利润分析 -->
    <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
      <div class="ro-chart-card" style="flex:2;min-width:260px">
        <div class="ro-card-header">
          <div class="ro-card-title">
            <el-icon :size="14" style="vertical-align:middle;margin-right:4px"><TrendCharts /></el-icon>
            {{ $t('reports.overview.trendTitle') }}
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <el-radio-group v-model="reportTrendRange" size="small">
              <el-radio-button value="7d">{{ $t('reports.overview.trend7d') }}</el-radio-button>
              <el-radio-button value="3m">{{ $t('reports.overview.trend3m') }}</el-radio-button>
              <el-radio-button value="all">{{ $t('reports.overview.trendAll') }}</el-radio-button>
            </el-radio-group>
            <router-link to="/reports/profit" class="ro-link">{{ $t('reports.overview.fullReport') }} →</router-link>
          </div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          <div style="display:flex;flex-direction:column;gap:14px;flex-shrink:0;padding-top:6px;min-width:68px">
            <div v-for="s in reportTrendSeries" :key="s.name" style="display:flex;align-items:center;gap:7px">
              <svg width="18" height="10" style="flex-shrink:0;overflow:visible">
                <line x1="0" y1="5" x2="18" y2="5" :stroke="s.color" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="9" cy="5" r="2" fill="#fff" :stroke="s.color" stroke-width="1.5"/>
              </svg>
              <span style="font-size:11px;color:rgba(29,29,31,0.45);white-space:nowrap">{{ s.name }}</span>
            </div>
          </div>
          <div style="flex:1;min-width:0">
            <svg :viewBox="`0 0 ${reportChartW + 60} 128`" width="100%" style="display:block;overflow:visible">
              <line v-for="gi in 4" :key="gi" :x1="0" :y1="(gi-1)*30" :x2="reportChartW" :y2="(gi-1)*30" stroke="#f0f0f5" stroke-width="1" />
              <text v-for="yl in reportYAxisLabels" :key="'yl'+yl.y" :x="reportChartW + 6" :y="yl.y + 3" text-anchor="start" font-size="9" fill="rgba(29,29,31,0.3)">{{ yl.label }}</text>
              <template v-for="s in reportTrendSeries" :key="s.name">
                <path v-if="s.linePath" :d="s.linePath" fill="none" :stroke="s.color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle v-for="(v,ci) in s.norm" :key="ci" :cx="ci*(reportChartW/(reportTrendDays.length-1||1))" :cy="90 - v * 80" r="2" fill="#fff" :stroke="s.color" stroke-width="1.5"/>
              </template>
              <text v-for="(d,i) in reportTrendDays" :key="'fd'+i" :x="i*(reportChartW/(reportTrendDays.length-1||1))" y="114" text-anchor="middle" font-size="10" fill="rgba(29,29,31,0.35)">{{ d }}</text>
            </svg>
          </div>
        </div>
      </div>
      <div class="ro-chart-card" style="flex:1;min-width:200px;cursor:pointer" @click="$router.push('/reports/profit')">
        <div class="ro-card-header" style="margin-bottom:12px">
          <div class="ro-card-title">{{ $t('reports.overview.profitAnalysis') }}</div>
          <span class="ro-link">{{ $t('reports.overview.profitDetail') }} →</span>
        </div>
        <div style="font-size:11px;color:rgba(29,29,31,0.35);margin-bottom:16px">{{ $t('reports.overview.cogsSub') }}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:rgba(29,29,31,0.5)">{{ $t('reports.overview.totalRevenue') }}</span>
            <span style="font-size:14px;font-weight:600;color:#16a34a">¥{{ fmt(saleTotal + retailTotal) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:rgba(29,29,31,0.5)">{{ $t('reports.overview.cogsLabel') }}</span>
            <span style="font-size:13px;font-weight:600;color:#dc2626">−¥{{ fmt(saleTotal + retailTotal - grossProfit) }}</span>
          </div>
          <div style="border-top:1px solid #f0f0f5;padding-top:8px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:rgba(29,29,31,0.5)">{{ $t('reports.overview.grossProfit') }}</span>
            <span style="font-size:14px;font-weight:700" :style="{color: grossProfit >= 0 ? '#16a34a' : '#dc2626'}">
              {{ grossProfit >= 0 ? '+' : '−' }}¥{{ fmt(Math.abs(grossProfit)) }}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-left:8px">
            <span style="font-size:11px;color:rgba(29,29,31,0.4)">{{ $t('reports.overview.freightBearing') }}</span>
            <span style="font-size:12px;color:#dc2626">−¥{{ fmt(freightTotal) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-left:8px">
            <span style="font-size:11px;color:rgba(29,29,31,0.4)">{{ $t('reports.overview.expenseOut') }}</span>
            <span style="font-size:12px;color:#dc2626">−¥{{ fmt(expenseTotal) }}</span>
          </div>
          <div style="border-top:2px solid #f0f0f5;padding-top:10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:700;color:#1d1d1f">{{ $t('reports.overview.netProfitLabel') }}</span>
            <span style="font-size:18px;font-weight:800" :style="{color: netProfit >= 0 ? '#16a34a' : '#dc2626'}">
              {{ netProfit >= 0 ? '+' : '−' }}¥{{ fmt(Math.abs(netProfit)) }}
            </span>
          </div>
          <div style="font-size:11px;color:rgba(29,29,31,0.35);text-align:right">{{ $t('reports.overview.marginLine', { gross: grossMargin.toFixed(1), net: netMargin.toFixed(1) }) }}</div>
        </div>
      </div>
    </div>

    <!-- 利润核算表 -->
    <div class="ro-chart-card">
      <div class="ro-card-header">
        <div class="ro-card-title">
          {{ $t('reports.overview.accountingTitle') }}
          <span class="ro-card-hint">{{ $t('reports.overview.accountingHint') }}</span>
        </div>
        <router-link to="/reports/profit" class="ro-link">{{ $t('reports.overview.viewFullProfit') }} →</router-link>
      </div>

      <div class="ro-profit-body">
        <!-- 收入 -->
        <div class="ro-profit-col">
          <div class="ro-col-header green-header">
            <span>{{ $t('reports.overview.incomeSource') }}</span>
            <span>¥{{ fmt(saleTotal + retailTotal) }}</span>
          </div>
          <div class="ro-section-label">{{ $t('reports.overview.saleSection', { n: saleContracts.length }) }}</div>
          <div v-if="saleContracts.length === 0 && !loading" class="ro-empty-sm">{{ $t('reports.overview.noAuditedContract') }}</div>
          <div v-for="row in saleContracts.slice(0, 6)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.customer_name || row.order_sn || '-' }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.sign_date || row.created_at) }}</span>
            <span class="ro-dr-amt green">+¥{{ fmt(row.total_amount || 0) }}</span>
          </div>
          <div v-if="saleContracts.length > 6" class="ro-more">{{ $t('reports.overview.moreContracts', { n: saleContracts.length - 6 }) }}</div>

          <div class="ro-section-label" style="margin-top:12px">{{ $t('reports.overview.retailSection', { n: retailOrders.length }) }}</div>
          <div v-if="retailOrders.length === 0 && !loading" class="ro-empty-sm">{{ $t('reports.overview.noRetailOrder') }}</div>
          <div v-for="row in retailOrders.slice(0, 6)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.member_name || row.customer_name || t('reports.overview.walkInCustomer') }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.order_date || row.created_at) }}</span>
            <span class="ro-dr-amt green">+¥{{ fmt(row.pay_amount || row.total_amount || 0) }}</span>
          </div>
          <div v-if="retailOrders.length > 6" class="ro-more">{{ $t('reports.overview.moreOrders', { n: retailOrders.length - 6 }) }}</div>
        </div>

        <!-- 支出 -->
        <div class="ro-profit-col">
          <div class="ro-col-header red-header">
            <span>{{ $t('reports.overview.expenseDetail') }}</span>
            <span>¥{{ fmt(procureTotal + freightTotal + expenseTotal) }}</span>
          </div>
          <div class="ro-section-label">{{ $t('reports.overview.procureSection', { n: procureOrders.length }) }}</div>
          <div v-if="procureOrders.length === 0 && !loading" class="ro-empty-sm">{{ $t('reports.overview.noProcureOrder') }}</div>
          <div v-for="row in procureOrders.slice(0, 8)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ getProcureSupplierLabel(row) || row.order_sn || '-' }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.order_date || row.created_at) }}</span>
            <span class="ro-dr-amt red">−¥{{ fmt(row.total_amount || 0) }}</span>
          </div>
          <div v-if="procureOrders.length > 8" class="ro-more">{{ $t('reports.overview.moreProcure', { n: procureOrders.length - 8 }) }}</div>

          <div class="ro-section-label" style="margin-top:12px">{{ $t('reports.overview.freightSection') }}</div>
          <div v-if="freightTotal === 0 && !loading" class="ro-empty-sm">{{ $t('reports.overview.noFreight') }}</div>
          <div v-for="row in freightRows" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.customer_name || '-' }}（{{ freightLabel(row) }}）</span>
            <span class="ro-dr-date">{{ fmtDt(row.sign_date || row.created_at) }}</span>
            <span class="ro-dr-amt red">−¥{{ fmt(myFreight(row)) }}</span>
          </div>

          <div class="ro-section-label" style="margin-top:12px">{{ $t('reports.overview.expenseSection', { n: expenseList.length }) }}</div>
          <div v-if="expenseList.length === 0 && !loading" class="ro-empty-sm">{{ $t('reports.overview.noExpense') }}</div>
          <div v-for="row in expenseList.slice(0, 6)" :key="row.id" class="ro-detail-row">
            <span class="ro-dr-name">{{ row.title || row.expense_type || '-' }}</span>
            <span class="ro-dr-date">{{ fmtDt(row.expense_date || row.created_at) }}</span>
            <span class="ro-dr-amt red">−¥{{ fmt(row.amount || 0) }}</span>
          </div>
          <div v-if="expenseList.length > 6" class="ro-more">{{ $t('reports.overview.moreExpense', { n: expenseList.length - 6 }) }}</div>
        </div>

        <!-- 汇总 -->
        <div class="ro-summary-col">
          <div class="ro-col-header ro-col-header-summary">
            <span>{{ $t('reports.overview.summaryTitle') }}</span>
          </div>
          <div class="ro-sum-block">
            <div class="ro-sum-row">
              <span class="ro-sum-label">{{ $t('reports.overview.contractIncome') }}</span>
              <span style="color:#16a34a;font-weight:600">¥{{ fmt(saleTotal) }}</span>
            </div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">{{ $t('reports.overview.retailIncome') }}</span>
              <span style="color:#16a34a;font-weight:600">¥{{ fmt(retailTotal) }}</span>
            </div>
            <div class="ro-sum-row ro-sum-total">
              <span class="ro-sum-label">{{ $t('reports.overview.totalIncome') }}</span>
              <span style="color:#16a34a;font-size:17px;font-weight:800">¥{{ fmt(saleTotal + retailTotal) }}</span>
            </div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">{{ $t('reports.overview.procureExpense') }}</span>
              <span style="color:#dc2626;font-weight:600">−¥{{ fmt(procureTotal) }}</span>
            </div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row ro-sum-total">
              <span class="ro-sum-label">{{ $t('reports.overview.grossProfitLabel') }}</span>
              <span :style="{ color: grossProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'18px', fontWeight:800 }">
                {{ grossProfit >= 0 ? '+' : '-' }}¥{{ fmt(Math.abs(grossProfit)) }}
              </span>
            </div>
            <div class="ro-sum-row ro-sum-hint">{{ $t('reports.overview.grossMargin') }} {{ grossMargin.toFixed(1) }}%</div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">{{ $t('reports.overview.myFreight') }}</span>
              <span style="color:#dc2626;font-weight:600">−¥{{ fmt(freightTotal) }}</span>
            </div>
            <div class="ro-sum-row">
              <span class="ro-sum-label">{{ $t('reports.overview.expenses') }}</span>
              <span style="color:#dc2626;font-weight:600">−¥{{ fmt(expenseTotal) }}</span>
            </div>
            <div class="ro-sum-divider"></div>
            <div class="ro-sum-row ro-sum-total">
              <span class="ro-sum-label" style="font-weight:700">{{ $t('reports.overview.netProfitSummary') }}</span>
              <span :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'20px', fontWeight:800 }">
                {{ netProfit >= 0 ? '+' : '-' }}¥{{ fmt(Math.abs(netProfit)) }}
              </span>
            </div>
            <div class="ro-sum-row ro-sum-hint">{{ $t('reports.overview.netMargin') }} {{ netMargin.toFixed(1) }}%</div>
          </div>

          <!-- 客户预收款余额（单独展示，不计入利润） -->
          <div class="ro-sum-block ro-prepay-block" style="margin-top:16px">
            <div class="ro-sum-row" style="cursor:pointer" @click="$router.push('/finance/prepay')">
              <span class="ro-sum-label" style="color:#92400e;font-weight:600">{{ $t('reports.overview.prepayTitle') }}</span>
              <span style="color:#d97706;font-size:15px;font-weight:800">¥{{ fmt(prepayTotalAmount) }}</span>
            </div>
            <div class="ro-sum-row">
              <span class="ro-sum-label" style="color:#a16207">{{ $t('reports.overview.prepayVerified') }}</span>
              <span style="color:#d97706;font-weight:600">−¥{{ fmt(prepayUsedAmount) }}</span>
            </div>
            <div class="ro-sum-divider" style="background:#fde68a"></div>
            <div class="ro-sum-row">
              <span class="ro-sum-label" style="color:#92400e;font-weight:700">{{ $t('reports.overview.prepayBalance') }}</span>
              <span style="color:#d97706;font-size:17px;font-weight:800">¥{{ fmt(prepayBalance) }}</span>
            </div>
            <!-- 核销明细：按客户展示已核销合同 -->
            <div v-if="prepayVerifyRows.length > 0" style="margin-top:10px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a16207;margin-bottom:6px">
                {{ $t('reports.overview.verifyDetail') }}
              </div>
              <div v-for="item in prepayVerifyRows" :key="item.customer_id" class="ro-prepay-verify-row">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:12px;font-weight:600;color:#92400e">{{ item.customer_name }}</span>
                  <span style="font-size:12px;color:#d97706;font-weight:600">−¥{{ fmt(item.used_amount) }}</span>
                </div>
                <div v-for="c in item.contracts" :key="c.id"
                     class="ro-prepay-contract-row"
                     @click="$router.push('/sale/contract')">
                  <span style="font-size:11px;color:#1d1d1f;flex:1">{{ c.order_sn || c.customer_name || '-' }}</span>
                  <span style="font-size:11px;color:rgba(29,29,31,0.4)">{{ fmtDt(c.sign_date || c.created_at) }}</span>
                  <span style="font-size:11px;color:#0071e3;font-weight:600">¥{{ fmt(c.total_amount||0) }}</span>
                </div>
                <div v-if="item.contracts.length === 0" style="font-size:11px;color:rgba(29,29,31,0.35);padding:2px 0">
                  {{ $t('reports.overview.noLinkedContract') }}
                </div>
              </div>
            </div>
            <div style="font-size:11px;color:#a16207;margin-top:8px;display:flex;align-items:center;gap:4px;cursor:pointer"
                 @click="$router.push('/finance/prepay')">
              <span>{{ $t('reports.overview.prepayFooter', { n: prepayList.length }) }}</span>
            </div>
          </div>

          <!-- 库存总值 -->
          <div class="ro-sum-block" style="margin-top:16px">
            <div class="ro-sum-row ro-kpi-clickable" style="cursor:pointer" @click="$router.push('/warehouse/stock')">
              <span class="ro-sum-label">{{ $t('reports.overview.stockTotal') }}</span>
              <span style="color:#ca8a04;font-weight:700">¥{{ fmt(stockTotal) }}</span>
            </div>
            <div class="ro-sum-row ro-kpi-clickable" style="cursor:pointer" @click="$router.push('/warehouse/stock')">
              <span class="ro-sum-label">{{ $t('reports.overview.stockSku') }}</span>
              <span style="color:#ca8a04;font-weight:600">{{ stockRows.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品利润明细（从合同+零售明细中解析） -->
    <div class="ro-chart-card">
      <div class="ro-card-header">
        <div class="ro-card-title">{{ $t('reports.overview.goodsProfitTitle') }} <span class="ro-card-hint">{{ $t('reports.overview.goodsProfitHint') }}</span></div>
        <router-link to="/reports/profit" class="ro-link">{{ $t('reports.overview.fullReport') }} →</router-link>
      </div>
      <div v-if="goodsProfitRows.length === 0 && !loading" class="ro-empty">{{ $t('reports.overview.noGoodsData') }}</div>
      <el-table v-else :data="goodsProfitRows" size="small" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column prop="goods_name" :label="$t('reports.overview.colGoods')" min-width="130" show-overflow-tooltip />
        <el-table-column :label="$t('reports.overview.colSaleQty')" align="right" width="80">
          <template #default="{ row }">{{ row.num }}</template>
        </el-table-column>
        <el-table-column :label="$t('reports.overview.colSaleAmount')" align="right" width="100">
          <template #default="{ row }">
            <span style="color:#16a34a">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.overview.colCost')" align="right" width="110">
          <template #default="{ row }">
            <el-tooltip :content="row.has_bom ? $t('reports.overview.bomCost') : $t('reports.overview.purchaseCost')" placement="top">
              <span style="color:#dc2626">¥{{ fmt(row.cost_amount) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.overview.colGrossProfit')" align="right" width="100" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.overview.colGrossRate')" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 底部: 零售/销售/采购供应商 -->
    <div class="ro-charts-row">
      <div class="ro-chart-card" style="flex:1;min-width:0;overflow:hidden">
        <div class="ro-card-header">
          <div class="ro-card-title">{{ $t('reports.overview.retailRanking') }}</div>
          <router-link to="/retail/order" class="ro-link">{{ $t('reports.overview.viewRetail') }} →</router-link>
        </div>
        <div v-if="retailCustomerRows.length === 0 && !loading" class="ro-empty">{{ $t('reports.overview.noRetailData') }}</div>
        <div v-else class="ro-sale-list">
          <div v-for="row in retailCustomerRows.slice(0, 8)" :key="row.customer_name" class="ro-sale-row">
            <span class="ro-sale-name">{{ row.customer_name || t('reports.overview.walkInCustomer') }}</span>
            <div class="ro-sale-bar-wrap">
              <div class="ro-sale-bar" style="background:linear-gradient(to right,#16a34a,#4ade80)"
                   :style="{ width: getBarWidth(retailCustomerRows, row.amount, 'amount') }" />
            </div>
            <span class="ro-sale-amt" style="color:#16a34a">¥{{ fmt(row.amount) }}</span>
          </div>
        </div>
      </div>

      <div class="ro-chart-card" style="flex:1;min-width:0;overflow:hidden">
        <div class="ro-card-header">
          <div class="ro-card-title">{{ $t('reports.overview.saleRanking') }}</div>
          <router-link to="/sale/contract" class="ro-link">{{ $t('reports.overview.viewSale') }} →</router-link>
        </div>
        <div v-if="saleCustomerRows.length === 0 && !loading" class="ro-empty">{{ $t('reports.overview.noSaleData') }}</div>
        <div v-else class="ro-sale-list">
          <div v-for="row in saleCustomerRows.slice(0, 8)" :key="row.customer_name" class="ro-sale-row">
            <span class="ro-sale-name">{{ row.customer_name || '—' }}</span>
            <div class="ro-sale-bar-wrap">
              <div class="ro-sale-bar" style="background:linear-gradient(to right,#16a34a,#4ade80)"
                   :style="{ width: getBarWidth(saleCustomerRows, row.amount, 'amount') }" />
            </div>
            <span class="ro-sale-amt" style="color:#16a34a">¥{{ fmt(row.amount) }}</span>
          </div>
        </div>
      </div>

      <div class="ro-chart-card" style="flex:1;min-width:0;overflow:hidden">
        <div class="ro-card-header">
          <div class="ro-card-title">{{ $t('reports.overview.supplierRanking') }}</div>
          <router-link to="/procure/order" class="ro-link">{{ $t('reports.overview.viewProcure') }} →</router-link>
        </div>
        <div v-if="supplierRows.length === 0 && !loading" class="ro-empty">{{ $t('reports.overview.noProcureData') }}</div>
        <div v-else class="ro-sale-list">
          <div v-for="row in supplierRows.slice(0, 8)" :key="row.supplier_name" class="ro-sale-row">
            <span class="ro-sale-name">{{ row.supplier_name || $t('reports.overview.noSupplier') }}</span>
            <div class="ro-sale-bar-wrap">
              <div class="ro-sale-bar" style="background:linear-gradient(to right,#dc2626,#f87171)"
                   :style="{ width: getBarWidth(supplierRows, row.amount, 'amount') }" />
            </div>
            <span class="ro-sale-amt" style="color:#dc2626">¥{{ fmt(row.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
import { Refresh, Money, ShoppingCart, TrendCharts, Shop } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { useStockRefreshStore } from '@/stores/stockRefresh'
const stockRefreshStore = useStockRefreshStore()
watch(() => stockRefreshStore.version, () => loadAll())
import { getStockReportList } from '@/api/reports'
import { getContractList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getProcureOrderList } from '@/api/procure'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'
import { buildCustomerPrepayBreakdown } from '@/utils/prepay'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'
import { findNaiDoufuGoods } from '@/utils/goodsAlias'
import {
  createProfitCostContext, loadUnitConvertRows, loadBomItems,
  calcContractSaleAmount, calcRetailSaleAmount, myFreightShare,
  filterProfitExpenses, aggregateGoodsProfit, calcOrderCost,
  type ProfitCostContext, type BomItemFlat,
} from '@/utils/profitCalc'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)

const saleContracts = ref<any[]>([])
const retailOrders = ref<any[]>([])
const procureOrders = ref<any[]>([])
const stockRows = ref<any[]>([])
const goodsList = ref<any[]>([])
const bomList = ref<any[]>([])
const procureInhouseList = ref<any[]>([])
const bomItemList = ref<BomItemFlat[]>([])
const unitConvertList = ref<any[]>([])
const expenseList = ref<any[]>([])
const prepayList = ref<any[]>([])
const collectReceipts = ref<any[]>([])
const supplierList = ref<any[]>([])

// --- Totals from raw orders ---
const saleTotal = computed(() =>
  saleContracts.value.reduce((s, r) => s + calcContractSaleAmount(r), 0)
)
const retailTotal = computed(() =>
  retailOrders.value.reduce((s, r) => s + calcRetailSaleAmount(r), 0)
)
const procureTotal = computed(() =>
  procureOrders.value.reduce((s, r) => s + Number(r.total_amount || 0), 0)
)
const stockTotal = computed(() =>
  stockRows.value.reduce((s, r) => s + Number(r.qty || 0) * Number(r.avg_price || 0), 0)
)

// 成本上下文 — 算法统一在 @/utils/profitCalc（移动均价+多单位换算+BOM物料均价）
const costCtx = computed<ProfitCostContext>(() => createProfitCostContext({
  goodsList: goodsList.value,
  inhouseList: procureInhouseList.value,
  bomHeaders: bomList.value,
  bomItems: bomItemList.value,
  unitConvertRows: unitConvertList.value,
}))

// --- Freight: our share from contracts ---
// freight_bearer: 'buyer'(客户全付) | 'seller'(我们全付) | 'half'(各半) | 'free'(免运费)
const myFreight = myFreightShare
const freightRows = computed(() => saleContracts.value.filter(r => myFreight(r) > 0))
const freightTotal = computed(() => saleContracts.value.reduce((s, r) => s + myFreight(r), 0))
function freightLabel(row: any): string {
  const b = row.freight_bearer
  if (b === 'seller') return '我方全付'
  if (b === 'half') return '各承担一半'
  return ''
}

// --- Expense total ---（利润口径：排除未付与采购单据支出，防双重扣减）
const expenseTotal = computed(() =>
  filterProfitExpenses(expenseList.value).reduce((s, r) => s + Number(r.amount || 0), 0)
)
// 单据附加费（采购单/合同 expense_amount，不在商品成本里）
const docExpenseTotal = computed(() =>
  procureOrders.value.reduce((s, o) => s + Number(o.expense_amount || 0), 0) +
  saleContracts.value.reduce((s, c) => s + Number(c.expense_amount || 0), 0)
)

// --- Net profit = gross - freight - expense - docExpense ---
const netProfit = computed(() => grossProfit.value - freightTotal.value - expenseTotal.value - docExpenseTotal.value)
const netMargin = computed(() => {
  const income = saleTotal.value + retailTotal.value
  return income > 0 ? (netProfit.value / income * 100) : 0
})

const prepayBreakdown = computed(() => buildCustomerPrepayBreakdown(prepayList.value, collectReceipts.value))
const prepayCustomerStats = computed(() => prepayBreakdown.value.customerStats)
const prepayTotalAmount = computed(() =>
  prepayCustomerStats.value.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
)
const prepayUsedAmount = computed(() =>
  prepayCustomerStats.value.reduce((sum, item) => sum + Number(item.used_amount || 0), 0)
)
const prepayBalance = computed(() =>
  prepayCustomerStats.value.reduce((sum, item) => sum + Number(item.balance || 0), 0)
)

function normalizeName(value: any): string {
  return String(value ?? '').trim().toLowerCase()
}

// Build verify rows: per-customer view of which contracts were paid via prepay (核销)
// CollectReceipt records with "预付款核销" in remark → keyed by customer_id
const prepayVerifyRows = computed(() => {
  return prepayCustomerStats.value
    .filter(item => Number(item.used_amount || 0) > 0)
    .map(item => {
      const contracts = saleContracts.value.filter(c => {
        if (item.customer_id) return Number(c.customer_id) === Number(item.customer_id)
        return normalizeName(c.customer_name) === normalizeName(item.customer_name)
      })
      return {
        customer_id: item.customer_id || 0,
        customer_name: item.customer_name,
        used_amount: Number(item.used_amount || 0),
        contracts,
      }
    })
    .sort((a, b) => b.used_amount - a.used_amount)
})

// grossProfit now uses BOM/cost_price based unit cost
const grossProfit = computed(() => {
  let cogs = 0
  for (const c of saleContracts.value) cogs += calcOrderCost(c.goods_info, costCtx.value, findNaiDoufuGoods)
  for (const r of retailOrders.value) cogs += calcOrderCost(r.goods_info, costCtx.value, findNaiDoufuGoods)
  return saleTotal.value + retailTotal.value - cogs
})
const grossMargin = computed(() => {
  const income = saleTotal.value + retailTotal.value
  return income > 0 ? (grossProfit.value / income * 100) : 0
})

// --- Supplier aggregation from raw purchase orders ---
function getProcureSupplierLabel(row: any): string {
  try {
    const items = typeof row.goods_info === 'string' ? JSON.parse(row.goods_info) : (row.goods_info || [])
    const ids = [...new Set(items.map((i: any) => Number(i.supplier_id)).filter(Boolean))]
    if (ids.length > 1) return '多供应商'
    if (ids.length === 1) {
      const item = items.find((i: any) => i.supplier_id)
      return item?.supplier_name || supplierList.value.find((s: any) => s.id === ids[0])?.name || row.supplier_name || '—'
    }
  } catch {}
  return row.supplier_name || supplierList.value.find((s: any) => s.id === row.supplier_id)?.name || '—'
}

const supplierRows = computed(() => {
  const map: Record<string, number> = {}
  for (const o of procureOrders.value) {
    const k = getProcureSupplierLabel(o)
    map[k] = (map[k] || 0) + Number(o.total_amount || 0)
  }
  return Object.entries(map)
    .map(([supplier_name, amount]) => ({ supplier_name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

const retailCustomerRows = computed(() => {
  const map: Record<string, number> = {}
  for (const o of retailOrders.value) {
    const k = o.customer_name || '散客'
    map[k] = (map[k] || 0) + Number(o.pay_amount || o.total_amount || 0)
  }
  return Object.entries(map)
    .map(([customer_name, amount]) => ({ customer_name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

const saleCustomerRows = computed(() => {
  const map: Record<string, number> = {}
  for (const o of saleContracts.value) {
    const k = o.customer_name || '—'
    map[k] = (map[k] || 0) + Number(o.total_amount || 0)
  }
  return Object.entries(map)
    .map(([customer_name, amount]) => ({ customer_name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

// --- Goods profit using BOM/cost_price ---
const goodsProfitRows = computed(() => {
  const docs = [
    ...saleContracts.value.map(c => ({ goodsInfo: c.goods_info, source: '合同', saleAmount: calcContractSaleAmount(c) })),
    ...retailOrders.value.map(r => ({ goodsInfo: r.goods_info, source: '零售', saleAmount: calcRetailSaleAmount(r) })),
  ]
  return aggregateGoodsProfit(docs, costCtx.value, { aliasResolver: findNaiDoufuGoods })
})

function fmt(v: number | string): string {
  const n = Number(v)
  if (isNaN(n)) return '0.00'
  return n.toLocaleString(locale.value === 'en-US' ? 'en-US' : 'zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const reportChartW = 480
const reportTrendRange = ref<'7d' | '3m' | 'all'>('7d')

const reportTrendBuckets = computed(() => {
  const now = Date.now()
  const buckets: { key: string; label: string }[] = []
  if (reportTrendRange.value === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      buckets.push({ key: d.toISOString().slice(0, 10), label: `${d.getMonth()+1}/${d.getDate()}` })
    }
  } else if (reportTrendRange.value === '3m') {
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now - i * 7 * 86400000)
      buckets.push({ key: d.toISOString().slice(0, 10), label: `${d.getMonth()+1}/${d.getDate()}` })
    }
  } else {
    const allDates = [
      ...saleContracts.value.map((c: any) => (c.sign_date||c.order_date||c.created_at||'').slice(0,7)),
      ...retailOrders.value.map((r: any) => (r.order_date||r.created_at||'').slice(0,7)),
      ...procureOrders.value.map((o: any) => (o.order_date||o.created_at||'').slice(0,7)),
      ...expenseList.value.map((e: any) => (e.expense_date||e.created_at||'').slice(0,7)),
    ].filter(Boolean)
    const earliest = allDates.length ? allDates.reduce((a,b) => a<b?a:b) : new Date(now).toISOString().slice(0,7)
    const nowD = new Date(now)
    const cur = new Date(earliest + '-01')
    while (cur.toISOString().slice(0,7) <= nowD.toISOString().slice(0,7)) {
      const key = cur.toISOString().slice(0,7)
      buckets.push({ key, label: `${cur.getMonth()+1}月` })
      cur.setMonth(cur.getMonth()+1)
    }
  }
  return buckets
})

const reportTrendDays = computed(() => reportTrendBuckets.value.map(b => b.label))

function rptSmoothPath(vals: number[], n: number, w: number, yFn: (v: number) => number): string {
  if (vals.length < 2 || n < 2) return ''
  const pts = vals.map((v,i) => ({ x: i*(w/(n-1)), y: yFn(v) }))
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p0=pts[Math.max(0,i-2)],p1=pts[i-1],p2=pts[i],p3=pts[Math.min(pts.length-1,i+1)]
    d += ` C${(p1.x+(p2.x-p0.x)/6).toFixed(1)},${(p1.y+(p2.y-p0.y)/6).toFixed(1)},${(p2.x-(p3.x-p1.x)/6).toFixed(1)},${(p2.y-(p3.y-p1.y)/6).toFixed(1)},${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

const reportTrendSeries = computed(() => {
  const buckets = reportTrendBuckets.value
  const n = buckets.length
  if (n === 0) return []
  const getIdx = (dateStr: string): number => {
    const d = (dateStr||'').slice(0,10); if(!d) return -1
    if (reportTrendRange.value === '7d') return buckets.findIndex(b => b.key === d)
    if (reportTrendRange.value === '3m') { let idx=-1; for(let i=0;i<buckets.length;i++){if(d>=buckets[i].key)idx=i;else break}; return idx }
    return buckets.findIndex(b => b.key === d.slice(0,7))
  }
  const revenue = new Array(n).fill(0)
  const expense = new Array(n).fill(0)
  for (const c of saleContracts.value) { const i=getIdx(c.sign_date||c.order_date||c.created_at||''); if(i>=0) revenue[i]+=calcContractSaleAmount(c) }
  for (const r of retailOrders.value) { const i=getIdx(r.order_date||r.created_at||''); if(i>=0) revenue[i]+=calcRetailSaleAmount(r) }
  for (const o of procureOrders.value) { const i=getIdx(o.order_date||o.created_at||''); if(i>=0) expense[i]+=Number(o.total_amount||0) }
  for (const e of expenseList.value) { const i=getIdx(e.expense_date||e.created_at||''); if(i>=0) expense[i]+=Number(e.amount||0) }
  const profit = revenue.map((v, i) => v - expense[i])
  const defs = [
    { name: t('reports.overview.contractIncome'), color: '#16a34a', vals: revenue },
    { name: t('reports.overview.procureExpense'), color: '#ea580c', vals: expense },
    { name: t('reports.overview.netProfitLabel'), color: '#0071e3', vals: profit },
  ]
  const allVals = defs.flatMap(s => s.vals)
  const gMax = Math.max(...allVals, 1)
  const gMin = Math.min(...allVals, 0)
  const range = gMax - gMin || 1
  return defs.map(s => ({
    name: s.name, color: s.color, vals: s.vals,
    norm: s.vals.map(v => (v - gMin) / range),
    linePath: rptSmoothPath(s.vals.map(v => (v - gMin) / range), n, reportChartW, v => 90-v*80),
    gMax, gMin,
  }))
})

const reportTrendGlobalMax = computed(() => reportTrendSeries.value[0]?.gMax ?? 1)
const reportTrendGlobalMin = computed(() => reportTrendSeries.value[0]?.gMin ?? 0)

function fmtRptYVal(v: number): string {
  if (v >= 10000) return `¥${(v/10000).toFixed(v >= 100000 ? 0 : 1)}万`
  if (v >= 1000) return `¥${(v/1000).toFixed(1)}k`
  if (v <= -10000) return `-¥${(Math.abs(v)/10000).toFixed(1)}万`
  if (v <= -1000) return `-¥${(Math.abs(v)/1000).toFixed(1)}k`
  return `¥${Math.round(v)}`
}

const reportYAxisLabels = computed(() => {
  const gMax = reportTrendGlobalMax.value
  const gMin = reportTrendGlobalMin.value
  const range = gMax - gMin || 1
  return [30, 60, 90].map(y => ({ y, label: fmtRptYVal(Math.round((90-y)/80 * range + gMin)) }))
})

function getBarWidth(list: any[], val: number, _field: string): string {
  const max = Math.max(...list.map(r => r.amount), 1)
  return Math.max(4, val / max * 100).toFixed(1) + '%'
}

async function loadAll() {
  loading.value = true
  const params: any = { list_rows: 2000 }
  if (dateRange.value) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }
  try {
    const receiptParams: any = { list_rows: 2000 }
    if (dateRange.value) {
      receiptParams.start_date = dateRange.value[0]
      receiptParams.end_date = dateRange.value[1]
    }

    const prepayParams: any = { list_rows: 500, pay_type: 'customer' }
    if (dateRange.value) {
      prepayParams.start_date = dateRange.value[0]
      prepayParams.end_date = dateRange.value[1]
    }

    const [contracts, retail, procure, stock, goods, bom, expense, prepay, receipts, inhouse] = await Promise.allSettled([
      getContractList(params),
      getRetailOrderList(params),
      getProcureOrderList(params),
      getStockReportList({ list_rows: 500 }),
      getGoodsList({ list_rows: 3000 }),
      getBomList({ list_rows: 500 }),
      getExpenseList({ ...params }),
      http.get('/finance/Prepay/index', { params: prepayParams }),
      http.get('/finance/CollectReceipt/index', { params: receiptParams }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
    ])
    saleContracts.value = contracts.status === 'fulfilled'
      ? (contracts.value?.data?.rows ?? contracts.value?.data?.data ?? []).filter(isEffectiveSaleContract) : []
    retailOrders.value = retail.status === 'fulfilled'
      ? (retail.value?.data?.rows ?? retail.value?.data?.data ?? []).filter((r: any) => Number(r.status) === 1) : []
    procureOrders.value = procure.status === 'fulfilled'
      ? (procure.value?.data?.rows ?? procure.value?.data?.data ?? []).filter((r: any) => Number(r.status) === 1) : []
    stockRows.value = stock.status === 'fulfilled'
      ? (stock.value?.data?.rows ?? []) : []
    goodsList.value = goods.status === 'fulfilled'
      ? (goods.value?.data?.rows ?? []) : []
    bomList.value = bom.status === 'fulfilled'
      ? (bom.value?.data?.list ?? bom.value?.data?.rows ?? []) : []
    expenseList.value = expense.status === 'fulfilled'
      ? (expense.value?.data?.rows ?? []) : []
    prepayList.value = prepay.status === 'fulfilled'
      ? (prepay.value?.data?.rows ?? []) : []
    collectReceipts.value = receipts.status === 'fulfilled'
      ? (receipts.value?.data?.rows ?? []) : []
    procureInhouseList.value = inhouse.status === 'fulfilled'
      ? ((inhouse.value as any)?.data?.rows ?? []).filter((r: any) => Number(r.status) === 1) : []
    const sup = await http.get('/procure/supplier/index', { params: { list_rows: 500 } }).catch(() => null)
    supplierList.value = sup?.data?.rows ?? []
    // 多单位换算 + BOM 物料明细（只读接口）
    const [ucRows, bomItems] = await Promise.all([
      loadUnitConvertRows(http, goodsList.value),
      loadBomItems(http, bomList.value),
    ])
    unitConvertList.value = ucRows
    bomItemList.value = bomItems
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
onActivated(loadAll)
</script>

<style scoped>
.ro-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  background: #f5f6fa;
  overflow-x: hidden;
  box-sizing: border-box;
}
.ro-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.ro-badge {
  font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em;
  color:#0071e3; background:rgba(0,113,227,0.08); padding:3px 10px; border-radius:20px;
  display:inline-block; margin-bottom:6px;
}
.ro-title { font-size:22px; font-weight:700; color:#1d1d1f; margin:0 0 4px; }
.ro-sub { font-size:13px; color:rgba(29,29,31,0.4); margin:0; }

.ro-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.ro-kpi-card {
  background:#fff; border-radius:16px; padding:20px; display:flex; align-items:center;
  gap:16px; border:1px solid #e8eaf0; box-shadow:0 2px 8px rgba(0,0,0,0.04);
}
.ro-kpi-clickable { cursor:pointer; transition:box-shadow 0.2s, transform 0.2s; }
.ro-kpi-clickable:hover { box-shadow:0 6px 24px rgba(0,0,0,0.10); transform:translateY(-2px); }
.ro-kpi-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ro-kpi-label { font-size:12px; color:rgba(29,29,31,0.4); margin-bottom:4px; }
.ro-kpi-value { font-size:20px; font-weight:700; letter-spacing:-0.03em; }
.ro-kpi-sub { font-size:11px; color:rgba(29,29,31,0.3); margin-top:2px; }

.ro-charts-row { display:flex; gap:16px; flex-wrap:wrap; }
.ro-chart-card {
  background:#fff; border-radius:16px; padding:20px; border:1px solid #e8eaf0;
  box-shadow:0 2px 8px rgba(0,0,0,0.04);
}
.ro-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.ro-card-title { font-size:14px; font-weight:600; color:#1d1d1f; }
.ro-card-hint { font-size:12px; color:rgba(29,29,31,0.35); font-weight:400; margin-left:6px; }
.ro-link { font-size:12px; color:#0071e3; text-decoration:none; }
.ro-link:hover { text-decoration:underline; }
.ro-empty { text-align:center; color:#cbd5e1; padding:30px 0; font-size:13px; }
.ro-empty-sm { color:#cbd5e1; font-size:12px; padding:4px 0; }
.ro-more { font-size:11px; color:rgba(29,29,31,0.3); padding:3px 0; }

/* 利润核算 */
.ro-profit-body { display:flex; gap:0; align-items:flex-start; overflow:hidden; }
.ro-profit-col { flex:1; min-width:0; padding-right:20px; border-right:1px solid #f0f0f5; margin-right:20px; overflow:hidden; }
.ro-profit-col:last-child { border-right:none; margin-right:0; }
.ro-summary-col { width:230px; flex-shrink:0; }

.ro-col-header {
  display:flex; justify-content:space-between; align-items:center;
  padding:8px 12px; border-radius:8px; margin-bottom:12px; font-size:13px; font-weight:700;
}
.ro-col-header.blue { background:rgba(0,113,227,0.06); color:#0071e3; }
.ro-col-header.green-header { background:rgba(22,163,74,0.06); color:#16a34a; }
.ro-col-header.red-header { background:rgba(220,38,38,0.06); color:#dc2626; }

.ro-section-label {
  font-size:11px; font-weight:600; color:rgba(29,29,31,0.4); text-transform:uppercase;
  letter-spacing:0.08em; margin-bottom:6px;
}
.ro-detail-row { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid #fafafa; }
.ro-dr-name { font-size:12px; color:#1d1d1f; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ro-dr-date { font-size:11px; color:rgba(29,29,31,0.3); flex-shrink:0; }
.ro-dr-amt { font-size:12px; font-weight:600; flex-shrink:0; }
.blue { color:#0071e3; }
.green { color:#16a34a; }
.red { color:#dc2626; }

.ro-sum-block { background:#f8fafc; border-radius:12px; padding:16px; }
.ro-prepay-block { background:#fffbeb !important; border:1px solid #fde68a; }
.ro-sum-row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; }
.ro-sum-total { border-top:1px solid #e8eaf0; padding-top:10px; margin-top:4px; }
.ro-sum-label { font-size:13px; color:rgba(29,29,31,0.5); }
.ro-sum-divider { height:1px; background:#e8eaf0; margin:4px 0; }

.ro-sale-list { display:flex; flex-direction:column; gap:10px; }
.ro-sale-row { display:flex; align-items:center; gap:10px; }
.ro-sale-name { font-size:12px; color:#1d1d1f; width:90px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ro-sale-bar-wrap { flex:1; background:#f5f5f7; border-radius:4px; height:6px; }
.ro-sale-bar { height:6px; border-radius:4px; background:linear-gradient(to right,#0071e3,#60a5fa); min-width:4px; transition:width 0.5s cubic-bezier(0.23,1,0.32,1); }
.ro-sale-amt { font-size:12px; font-weight:600; color:#0071e3; width:80px; text-align:right; flex-shrink:0; }

.ro-prepay-verify-row {
  background: rgba(254,243,199,0.5);
  border-radius: 8px;
  padding: 6px 8px;
  margin-bottom: 6px;
}
.ro-prepay-contract-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0 3px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.ro-prepay-contract-row:hover { background: rgba(0,113,227,0.06); }

.ro-sum-hint { font-size:11px; color:rgba(29,29,31,0.4); }
.ro-col-header-summary { background:#f8fafc; color:#1d1d1f; }

@media (max-width:1200px) {
  .ro-kpi-grid { grid-template-columns:repeat(2,1fr); }
  .ro-profit-body { flex-direction:column; gap:16px; }
  .ro-profit-col { padding-right:0; border-right:none; margin-right:0; border-bottom:1px solid #f0f0f5; padding-bottom:16px; }
  .ro-summary-col { width:100%; }
}
</style>
