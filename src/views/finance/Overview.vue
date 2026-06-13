<template>
  <div class="fin-overview">
    <!-- 快捷操作栏 -->
    <div class="quick-action-bar">
      <div class="quick-action-card collect" @click="openQuickCollect">
        <el-icon :size="20"><Plus /></el-icon>
        <span>快速收款</span>
      </div>
      <div class="quick-action-card pay" @click="openQuickPay">
        <el-icon :size="20"><Minus /></el-icon>
        <span>快速付款</span>
      </div>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="sum-cards-row">
      <div :class="['sum-card-col', card.key === 'fund' ? 'sum-card-col--wide' : 'sum-card-col--narrow']" v-for="card in summaryCards" :key="card.key">
        <el-card class="sum-card" shadow="hover" :class="card.route ? 'sum-card-link' : ''" @click="card.route && router.push(card.route)">
          <div class="sum-inner">
            <div class="sum-info">
              <div class="sum-label">{{ card.label }}</div>
              <div class="sum-value" :style="{ color: card.color }">{{ card.key === 'pay' ? '-' : '' }}¥{{ card.value }}</div>
              <div class="sum-sub">{{ card.sub }}</div>
            </div>
            <div class="sum-icon" :style="{ background: card.bg, color: card.color }">
              <el-icon :size="22"><component :is="card.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 第二行：账户余额 + 收支趋势图 -->
    <el-row :gutter="14">
      <el-col :span="10">
        <el-card shadow="hover" style="cursor:pointer" @click="router.push('/finance/fund')">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Wallet /></el-icon>
              <span>账户余额</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click.stop="router.push('/finance/fund')">管理</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="fundList.length">
            <div class="inline-item clickable" v-for="f in fundList" :key="f.id" @click.stop="openFundDetail(f)">
              <div class="inline-name">{{ f.name }}</div>
              <div class="inline-value" :class="Number(f.display_balance ?? f.balance ?? 0) < 0 ? 'red' : 'green'">¥{{ Number(f.display_balance ?? f.balance ?? 0).toFixed(2) }}</div>
              <div class="inline-sub">{{ { '1': '银行账户', '2': '现金', '3': '第三方' }[f.type] || '账户' }}</div>
            </div>
            <div class="inline-item total-item">
              <div class="inline-name">合计</div>
              <div class="inline-value" :class="Number(accountTotal) < 0 ? 'red' : 'green'">¥{{ accountTotal }}</div>
              <div class="inline-sub">{{ fundList.length }} 个账户</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无账户数据</div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card class="flow-trend-card" shadow="hover">
          <template #header>
            <div class="card-header trend-card-header">
              <el-icon :size="15"><TrendCharts /></el-icon>
              <span>收支趋势</span>
              <el-radio-group v-model="flowTrendRange" size="small" class="trend-range-tabs">
                <el-radio-button value="7d">7天</el-radio-button>
                <el-radio-button value="3m">3个月</el-radio-button>
                <el-radio-button value="all">全部</el-radio-button>
              </el-radio-group>
              <el-button link type="primary" size="small" class="trend-flow-link" @click="router.push('/finance/fund-flow')">查看流水</el-button>
            </div>
          </template>
          <div class="trend-chart">
            <div class="trend-kpis">
              <div class="trend-kpi trend-kpi--income">
                <span class="trend-kpi-label">收入合计</span>
                <span class="trend-kpi-value">¥{{ fmtTrendAmount(flowTrendSummary.income) }}</span>
              </div>
              <div class="trend-kpi trend-kpi--expense">
                <span class="trend-kpi-label">支出合计</span>
                <span class="trend-kpi-value">¥{{ fmtTrendAmount(flowTrendSummary.expense) }}</span>
              </div>
              <div :class="['trend-kpi', flowTrendSummary.net >= 0 ? 'trend-kpi--net-in' : 'trend-kpi--net-out']">
                <span class="trend-kpi-label">{{ flowTrendSummary.net >= 0 ? '净流入' : '净流出' }}</span>
                <span class="trend-kpi-value">¥{{ fmtTrendAmount(Math.abs(flowTrendSummary.net)) }}</span>
              </div>
            </div>

            <div class="trend-legend-row">
              <div v-for="s in flowTrendSeries" :key="s.name" class="trend-legend-item">
                <span class="trend-legend-swatch" :style="{ '--series-color': s.color }"></span>
                <span class="trend-legend-name">{{ s.name }}</span>
                <span class="trend-legend-value">¥{{ fmtTrendAmount(s.total) }}</span>
              </div>
            </div>

            <div class="trend-plot-wrap">
              <svg :viewBox="`0 0 ${trendChartW} ${trendChartH}`" width="100%" class="trend-svg" role="img" aria-label="收支趋势折线图">
                <defs>
                  <linearGradient id="flowTrendPlotFade" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#f8fafc" stop-opacity="0.92" />
                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <rect :x="trendPadLeft" :y="trendPadTop" :width="trendPlotW" :height="trendPlotH" rx="10" fill="url(#flowTrendPlotFade)" />
                <text v-for="yl in flowYAxisLabels" :key="'yl'+yl.y"
                  :x="trendPadLeft + trendPlotW + 10" :y="yl.y + 4" text-anchor="start"
                  font-size="10" class="chart-axis-label">{{ yl.label }}</text>
                <line v-for="yl in flowYAxisLabels" :key="'grid'+yl.y"
                  :x1="trendPadLeft" :y1="yl.y" :x2="trendPadLeft + trendPlotW" :y2="yl.y"
                  :class="['trend-grid-line', yl.value === 0 ? 'is-zero' : '']" />
                <template v-for="s in flowTrendSeries" :key="s.name">
                  <path v-if="s.linePath && s.total > 0" :d="s.linePath" fill="none" :stroke="s.color"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="trend-series-line"/>
                  <template v-for="p in s.points" :key="`${s.name}-${p.label}`">
                    <circle v-if="p.showMarker" :cx="p.x" :cy="p.y"
                      r="3.4" fill="#fff" :stroke="s.color" stroke-width="2" class="trend-series-point">
                      <title>{{ s.name }} {{ p.label }}：¥{{ Number(p.value || 0).toFixed(2) }}</title>
                    </circle>
                  </template>
                </template>
                <template v-for="(d,i) in flowTrendDays" :key="'fd'+i">
                  <text v-if="isFlowAxisLabelVisible(i, flowTrendDays.length)"
                    :x="trendX(i, flowTrendDays.length)" :y="trendAxisLabelY" text-anchor="middle"
                    font-size="10" class="chart-axis-label">{{ d }}</text>
                </template>
              </svg>
              <div v-if="flowTrendSummary.total === 0" class="trend-empty-overlay">暂无收支数据</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行：预收款 + 预付款 + 近期收款 + 近期付款 -->
    <el-row :gutter="14">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Money /></el-icon>
              <span>预收款</span>
              <span class="header-total green">¥{{ prepayTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/prepay')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="prepayList.filter(r=>r.pay_type==='customer').length">
            <div class="inline-item clickable" v-for="r in prepayList.filter(r=>r.pay_type==='customer').slice(0,4)" :key="r.id" @click="router.push('/finance/prepay')">
              <div class="inline-name">{{ r.customer_name || '—' }}</div>
              <div class="inline-value green">¥{{ Number(r.amount||0).toFixed(2) }}</div>
              <div class="inline-sub">客户预收</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无预收款</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Money /></el-icon>
              <span>预付款</span>
              <span class="header-total blue">¥{{ supplierPrepayTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/supplier-prepay')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="prepayList.filter(r=>r.pay_type==='supplier').length">
            <div class="inline-item clickable" v-for="r in prepayList.filter(r=>r.pay_type==='supplier').slice(0,4)" :key="r.id" @click="router.push('/finance/supplier-prepay')">
              <div class="inline-name">{{ r.supplier_name || '—' }}</div>
              <div class="inline-value blue">¥{{ Number(r.amount||0).toFixed(2) }}</div>
              <div class="inline-sub">供应商预付</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无预付款</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><TrendCharts /></el-icon>
              <span>近期收款</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click="router.push('/finance/fund-flow')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="recentCollectItems.length">
            <div class="inline-item clickable" v-for="r in recentCollectItems.slice(0,4)" :key="r._key" @click="router.push('/finance/fund-flow')">
              <div class="inline-name">{{ r.name }}</div>
              <div class="inline-value green">¥{{ Number(r.amount||0).toFixed(2) }}</div>
              <div class="inline-sub">
                {{ r.date }}
                <span v-if="Number(r.refund_allocated || 0) > 0"> · 已退款 ¥{{ Number(r.refund_allocated || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无收款记录</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Bottom /></el-icon>
              <span>近期付款</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click="router.push('/finance/pay-receipt')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="adjustedPayList.length">
            <div class="inline-item clickable" v-for="r in adjustedPayList.slice(0,4)" :key="r.id" @click="router.push('/finance/pay-receipt')">
              <div class="inline-name">{{ getPayReceiptSupplierLabel(r, purchasePayList, supplierList) }}</div>
              <div class="inline-value red">¥{{ Number(r.net_amount ?? r.amount ?? 0).toFixed(2) }}</div>
              <div class="inline-sub">
                {{ fmtDt(r.pay_date || r.created_at) }}
                <span v-if="Number(r.refund_allocated || 0) > 0"> · 已退款 ¥{{ Number(r.refund_allocated || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无付款记录</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第四行：应收 + 采购货款 -->
    <el-row :gutter="14">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><DocumentChecked /></el-icon>
              <span>应收账款</span>
              <span class="header-total blue">¥{{ receivableTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/receivable')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="receivableList.length">
            <div class="inline-item clickable" v-for="r in receivableList.slice(0,6)" :key="r.id" @click="router.push('/finance/receivable')">
              <div class="inline-name">{{ r.customer_name || '—' }}</div>
              <div class="inline-value blue">¥{{ Number(r.un_pay_amount ?? (Number(r.total_amount||r.amount||0) - Number(r.paid_amount||0))).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_sn || r.order_no || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无应收款</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Box /></el-icon>
              <span>采购货款</span>
              <span class="header-total red">¥{{ purchasePayTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/procure/order')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="purchasePayList.length">
            <div class="inline-item clickable" v-for="r in purchasePayList.slice(0,6)" :key="r.id" @click="router.push('/procure/order')">
              <div class="inline-name">{{ getPurchaseSupplierLabel(r) }}</div>
              <div class="inline-value red">¥{{ Number(r.total_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || r.order_sn || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无采购货款</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第五行：销售单款 + 零售单款 -->
    <el-row :gutter="14">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Document /></el-icon>
              <span>销售出库单</span>
              <span class="header-total blue">¥{{ saleOutTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/sale/out')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="saleOutList.length">
            <div class="inline-item clickable" v-for="r in saleOutList.slice(0,6)" :key="r.id" @click="router.push('/sale/out')">
              <div class="inline-name">{{ r.customer_name || '—' }}</div>
              <div class="inline-value blue">¥{{ ((r.after_discount != null && r.after_discount !== '') ? Number(r.after_discount) : Number(r.total_amount||0)).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_no || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无收款记录</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><Money /></el-icon>
              <span>零售单款</span>
              <span class="header-total green">¥{{ retailTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/retail/order')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="retailList.filter((r:any)=>r.status===1).length">
            <div class="inline-item clickable" v-for="r in retailList.filter((r:any)=>r.status===1).slice(0,6)" :key="r.id" @click="router.push('/retail/order')">
              <div class="inline-name">{{ r.member_name || r.customer_name || '散客' }}</div>
              <div class="inline-value green">¥{{ Number(r.pay_amount||r.total_amount||0).toFixed(2) }}</div>
              <div class="inline-sub">{{ r.order_sn || '' }}</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无零售单</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资金流水（折叠）— 数据来源与 FundFlow.vue 相同 -->
    <div class="flow-section">
      <div class="flow-toggle" @click="flowVisible = !flowVisible">
        <el-icon :size="13"><List /></el-icon>
        <span>资金流水明细（{{ allFlowItems.length }} 条收支记录）</span>
        <el-icon :size="12" style="margin-left:auto"><component :is="flowVisible ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
      </div>
      <div v-if="flowVisible">
        <el-table :data="allFlowItems.slice(0, 50)" size="small" border style="width:100%">
          <el-table-column prop="date" label="日期" width="110" />
          <el-table-column prop="source" label="来源" width="110">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.type === 'income' ? '#16a34a' : '#dc2626', fontWeight: '600' }">
                {{ row.type === 'income' ? '+' : '-' }}¥{{ Number(row.amount||0).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
        <div style="text-align:center;padding:8px">
          <el-button link type="primary" @click="router.push('/finance/fund-flow')">查看完整流水</el-button>
        </div>
      </div>
    </div>

  </div>

  <!-- 快速收款弹窗 -->
  <el-dialog v-model="collectDialogVisible" title="快速收款" width="460px" :close-on-click-modal="false">
    <!-- 一键识别 -->
    <div class="ocr-bar">
      <el-input
        v-model="collectOcrText"
        placeholder="粘贴付款截图文字 / 转账记录，一键识别金额和备注"
        clearable
        @keydown.enter="parseCollectOcr"
      >
        <template #append>
          <el-button @click="parseCollectOcr">识别</el-button>
        </template>
      </el-input>
    </div>
    <el-form :model="collectForm" label-width="80px" style="margin-top:12px">
      <el-form-item label="类型">
        <el-radio-group v-model="collectForm.category" @change="onCollectCategoryChange">
          <el-radio-button value="receipt">收款单（客户）</el-radio-button>
          <el-radio-button value="other">其他收入</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="collectForm.category === 'receipt'" label="收款对象">
        <div class="contact-row">
          <el-select
            v-model="collectForm.contact_id"
            filterable clearable placeholder="选择客户"
            style="flex:1"
            @change="onCollectContactChange"
          >
            <el-option v-for="c in clientList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item v-if="collectForm.category === 'other'" label="收入说明">
        <el-input v-model="collectForm.contact_name" placeholder="如：利息收入、赔偿金" />
      </el-form-item>
      <el-form-item label="收款账户">
        <div class="contact-row">
          <el-select v-model="collectForm.fund_id" filterable clearable placeholder="选择账户" style="flex:1" @change="onCollectFundChange">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
          <el-button class="other-btn" :type="collectForm.fund_id === -1 ? 'primary' : 'default'" @click="toggleCollectFundOther">其他</el-button>
        </div>
        <el-input v-if="collectForm.fund_id === -1" v-model="collectForm.fund_name" placeholder="手动输入账户名称" style="margin-top:6px" />
      </el-form-item>
      <el-form-item label="收款金额">
        <el-input-number v-model="collectForm.amount" :min="0" :precision="2" style="width:100%" />
      </el-form-item>
      <el-form-item label="收款日期">
        <el-date-picker v-model="collectForm.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="collectForm.remark" placeholder="备注说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="collectDialogVisible = false">取消</el-button>
      <el-button type="success" :loading="collectSaving" @click="saveCollect">确认收款</el-button>
    </template>
  </el-dialog>

  <!-- 快速付款弹窗 -->
  <el-dialog v-model="payDialogVisible" title="快速付款" width="460px" :close-on-click-modal="false">
    <!-- 一键识别 -->
    <div class="ocr-bar">
      <el-input
        v-model="payOcrText"
        placeholder="粘贴付款截图文字 / 转账记录，一键识别金额和备注"
        clearable
        @keydown.enter="parsePayOcr"
      >
        <template #append>
          <el-button @click="parsePayOcr">识别</el-button>
        </template>
      </el-input>
    </div>
    <el-form :model="payForm" label-width="80px" style="margin-top:12px">
      <el-form-item label="类型">
        <el-radio-group v-model="payForm.category" @change="onPayCategoryChange">
          <el-radio-button value="receipt">付款单（供应商）</el-radio-button>
          <el-radio-button value="other">其他支出</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="payForm.category === 'receipt'" label="付款对象">
        <div class="contact-row">
          <el-select
            v-model="payForm.contact_id"
            filterable clearable placeholder="选择供应商"
            style="flex:1"
            @change="onPayContactChange"
          >
            <el-option v-for="s in supplierList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item v-if="payForm.category === 'other'" label="支出说明">
        <el-input v-model="payForm.contact_name" placeholder="如：办公用品、快递费" />
      </el-form-item>
      <el-form-item label="付款账户">
        <div class="contact-row">
          <el-select v-model="payForm.fund_id" filterable clearable placeholder="选择账户" style="flex:1" @change="onPayFundChange">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
          <el-button class="other-btn" :type="payForm.fund_id === -1 ? 'primary' : 'default'" @click="togglePayFundOther">其他支出账户</el-button>
        </div>
        <el-input v-if="payForm.fund_id === -1" v-model="payForm.fund_name" placeholder="手动输入账户名称" style="margin-top:6px" />
      </el-form-item>
      <el-form-item label="付款金额">
        <el-input-number v-model="payForm.amount" :min="0" :precision="2" style="width:100%" />
      </el-form-item>
      <el-form-item label="付款日期">
        <el-date-picker v-model="payForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="payForm.remark" placeholder="备注说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="payDialogVisible = false">取消</el-button>
      <el-button type="danger" :loading="paySaving" @click="savePay">确认付款</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { Wallet, TrendCharts, Bottom, DocumentChecked, Document, Money, List, ArrowUp, ArrowDown, ArrowRight, Box, Plus, Minus, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'
import { getFundList, getCollectReceiptList, getPayReceiptList, getExpenseList, createCollectReceipt } from '@/api/finance'
import { getContractList } from '@/api/sale'
import { applyProcureReturnsToFundRows, applyProcureReturnsToPayReceiptRows, applyProcureReturnsToPayableRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { getPayReceiptSupplierLabel } from '@/utils/supplierLabel'
import { applySaleReturnsToCollectReceiptRows, applySaleReturnsToReceivableRows, buildSaleReturnSettlementRows, normalizeSaleReturnFinanceRows } from '@/utils/saleReturnFinance'
import { buildExpensePayableRows } from '@/utils/expensePayable'
import { buildProcureFeePaidByOrder, getProcureFeeNeedPayAmount, isProcureExtraFeePayment } from '@/utils/procureFeeFinance'
import { fmtDt } from '@/utils/date'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'

const router = useRouter()

const fundList = ref<any[]>([])
const clientList = ref<any[]>([])
const supplierList = ref<any[]>([])
const prepayList = ref<any[]>([])
const collectList = ref<any[]>([])   // 收款单 /finance/CollectReceipt/index
const adjustedCollectList = ref<any[]>([])
const payList = ref<any[]>([])       // 付款单 /finance/PayReceipt/index
const expenseList = ref<any[]>([])   // 费用单 /finance/Expense/index
const rechargeList = ref<any[]>([])  // 会员充值 /retail/recharge/index
const retailList = ref<any[]>([])    // 零售单 /retail/order/index
const receivableList = ref<any[]>([])
const payableList = ref<any[]>([])
const procureReturnFinanceList = ref<any[]>([])
const saleReturnFinanceList = ref<any[]>([])
const purchasePayList = ref<any[]>([])
const saleOutList = ref<any[]>([])
const flowVisible = ref(false)
const trendChartW = 620
const trendChartH = 170
const trendPadLeft = 14
const trendPadRight = 66
const trendPadTop = 14
const trendPadBottom = 34
const trendPlotW = trendChartW - trendPadLeft - trendPadRight
const trendPlotH = trendChartH - trendPadTop - trendPadBottom
const trendAxisLabelY = trendPadTop + trendPlotH + 24

const flowTrendRange = ref<'7d' | '3m' | 'all'>('7d')

const flowTrendBuckets = computed(() => {
  const now = Date.now()
  const buckets: { key: string; label: string }[] = []
  if (flowTrendRange.value === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      buckets.push({ key: d.toISOString().slice(0, 10), label: `${d.getMonth()+1}/${d.getDate()}` })
    }
  } else if (flowTrendRange.value === '3m') {
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now - i * 7 * 86400000)
      buckets.push({ key: d.toISOString().slice(0, 10), label: `${d.getMonth()+1}/${d.getDate()}` })
    }
  } else {
    // 全部：按月分桶，从最早有数据的月份到现在
    const allDates = [
      ...collectList.value.map((r: any) => (r.receipt_date || r.create_time || '').slice(0, 7)),
      ...retailList.value.map((r: any) => (r.order_date || r.create_time || '').slice(0, 7)),
      ...payList.value.map((r: any) => (r.pay_date || r.create_time || '').slice(0, 7)),
      ...expenseList.value.map((r: any) => (r.expense_date || r.create_time || '').slice(0, 7)),
    ].filter(Boolean)
    const earliest = allDates.length ? allDates.reduce((a, b) => a < b ? a : b) : new Date(now).toISOString().slice(0, 7)
    const nowD = new Date(now)
    const cur = new Date(earliest + '-01')
    while (cur.toISOString().slice(0, 7) <= nowD.toISOString().slice(0, 7)) {
      const key = cur.toISOString().slice(0, 7)
      buckets.push({ key, label: `${cur.getMonth()+1}月` })
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return buckets
})

const flowTrendDays = computed(() => flowTrendBuckets.value.map(b => b.label))

function trendX(index: number, total: number): number {
  if (total <= 1) return trendPadLeft + trendPlotW / 2
  return trendPadLeft + index * (trendPlotW / (total - 1))
}

function trendY(norm: number): number {
  return trendPadTop + trendPlotH - Math.max(0, Math.min(1, norm)) * trendPlotH
}

function niceTrendMax(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const normalized = max / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function isFlowAxisLabelVisible(index: number, total: number): boolean {
  if (total <= 8) return true
  const step = Math.ceil(total / 7)
  return index === 0 || index === total - 1 || index % step === 0
}

function makeSmoothPath(vals: number[], n: number, w: number, yFn: (v: number) => number): string {
  if (vals.length < 2 || n < 2) return ''
  const pts = vals.map((v, i) => ({ x: trendX(i, n), y: yFn(v) }))
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 2)], p1 = pts[i - 1], p2 = pts[i], p3 = pts[Math.min(pts.length - 1, i + 1)]
    const c1x = (p1.x + (p2.x - p0.x) / 6).toFixed(1), c1y = (p1.y + (p2.y - p0.y) / 6).toFixed(1)
    const c2x = (p2.x - (p3.x - p1.x) / 6).toFixed(1), c2y = (p2.y - (p3.y - p1.y) / 6).toFixed(1)
    d += ` C${c1x},${c1y},${c2x},${c2y},${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

const flowTrendSeries = computed(() => {
  const buckets = flowTrendBuckets.value
  const n = buckets.length
  if (n === 0) return []
  const getIdx = (dateStr: string): number => {
    const d = (dateStr || '').slice(0, 10)
    if (!d) return -1
    if (flowTrendRange.value === '7d') return buckets.findIndex(b => b.key === d)
    if (flowTrendRange.value === '3m') { let idx = -1; for (let i = 0; i < buckets.length; i++) { if (d >= buckets[i].key) idx = i; else break }; return idx }
    return buckets.findIndex(b => b.key === d.slice(0, 7))
  }
  const defs = [
    { name: '销售收款', color: '#0071e3', vals: new Array(n).fill(0) },
    { name: '零售收入', color: '#16a34a', vals: new Array(n).fill(0) },
    { name: '采购支出', color: '#ea580c', vals: new Array(n).fill(0) },
    { name: '其他支出', color: '#8b5cf6', vals: new Array(n).fill(0) },
  ]
  for (const r of collectList.value) { const i=getIdx(r.receipt_date||r.create_time||''); if(i>=0) defs[0].vals[i]+=Number(r.amount||0) }
  for (const r of retailList.value) { if(r.status!==1)continue; const i=getIdx(r.order_date||r.create_time||''); if(i>=0) defs[1].vals[i]+=Number(r.pay_amount||r.total_amount||0) }
  for (const r of payList.value) {
    const i=getIdx(r.pay_date||r.create_time||''); if(i<0) continue
    if (String(r.contact_type||'') === 'supplier') defs[2].vals[i]+=Number(r.amount||0)
    else defs[3].vals[i]+=Number(r.amount||0)
  }
  for (const r of expenseList.value) { if(r.payment_status==='pending')continue; const i=getIdx(r.expense_date||r.create_time||''); if(i>=0) defs[3].vals[i]+=Number(r.amount||0) }
  const rawMax = Math.max(...defs.flatMap(s => s.vals), 0)
  const gMax = niceTrendMax(rawMax)
  return defs.map(s => ({
    name: s.name, color: s.color, vals: s.vals,
    norm: s.vals.map(v => v / gMax),
    points: s.vals.map((value, i) => ({
      label: buckets[i]?.label || '',
      value,
      x: trendX(i, n),
      y: trendY(value / gMax),
      showMarker: value > 0,
    })),
    total: s.vals.reduce((sum, value) => sum + value, 0),
    linePath: makeSmoothPath(s.vals.map(v => v / gMax), n, trendPlotW, trendY),
    gMax,
  }))
})

const flowTrendGlobalMax = computed(() => flowTrendSeries.value[0]?.gMax ?? 1)

const flowTrendSummary = computed(() => {
  const sales = flowTrendSeries.value.find(s => s.name === '销售收款')?.total || 0
  const retail = flowTrendSeries.value.find(s => s.name === '零售收入')?.total || 0
  const procure = flowTrendSeries.value.find(s => s.name === '采购支出')?.total || 0
  const other = flowTrendSeries.value.find(s => s.name === '其他支出')?.total || 0
  const income = sales + retail
  const expense = procure + other
  return { income, expense, net: income - expense, total: income + expense }
})

function fmtYVal(v: number): string {
  if (v <= 0) return '¥0'
  if (v < 10) return `¥${Number(v.toFixed(1))}`
  if (v >= 10000) return `¥${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}万`
  if (v >= 1000) return `¥${(v / 1000).toFixed(1)}k`
  return `¥${Math.round(v)}`
}

function fmtTrendAmount(v: number): string {
  const value = Math.abs(Number(v || 0))
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return Math.round(value).toLocaleString('zh-CN')
}

const flowYAxisLabels = computed(() => {
  const gMax = flowTrendGlobalMax.value
  return [1, 0.5, 0].map(ratio => {
    const value = gMax * ratio
    return { y: trendY(ratio), value, label: fmtYVal(value) }
  })
})

function isCustomerPrepayLike(row: any) {
  const rawSource = String(
    row?.source_name ||
    row?.source_type ||
    row?.biz_type ||
    row?.module_name ||
    row?.trade_type ||
    row?.scene ||
    row?.contact_type ||
    row?.pay_type ||
    ''
  ).toLowerCase()
  const remark = String(row?.remark || '')
  return (
    rawSource.includes('prepay') ||
    rawSource.includes('预付') ||
    rawSource.includes('预收') ||
    remark.includes('预付款充值') ||
    remark.includes('预收款') ||
    remark.includes('预收')
  )
}

// ============================================================
// 收入/支出计算 — 与 FundFlow.vue 完全相同的6个来源组装逻辑
// 字段名全部来自真实API返回（2026-03-14验证）
// ============================================================
const allFlowItems = computed(() => {
  const items: any[] = []
  // 1. 收款单（income）— 真实字段: customer_name, amount, receipt_date, pay_type(非contact_type)
  for (const r of collectList.value) {
    if (Number(r.amount || 0) <= 0) continue
    const src = isCustomerPrepayLike(r) ? '预收款' : '收款单'
    items.push({ type: 'income', source: src, name: r.customer_name || r.contact_name || '—', amount: Number(r.amount || 0), date: fmtDt(r.receipt_date || r.create_time), order_no: r.receipt_no || r.order_sn || '' })
  }
  // 2. 零售单（income）— 真实字段: member_name, pay_amount, order_sn, order_date
  for (const r of retailList.value) {
    if (r.status !== 1) continue
    const amt = Number(r.pay_amount || r.total_amount || 0)
    if (amt <= 0) continue
    items.push({ type: 'income', source: '零售单', name: r.member_name || r.customer_name || '散客', amount: amt, date: fmtDt(r.order_date || r.create_time), order_no: r.order_sn || '' })
  }
  // 3. 会员充值（income）— 真实字段: member_name, amount, recharge_date
  for (const r of rechargeList.value) {
    if (Number(r.amount || 0) <= 0) continue
    items.push({ type: 'income', source: '会员充值', name: r.member_name || '—', amount: Number(r.amount || 0), date: fmtDt(r.recharge_date || r.create_time), order_no: '' })
  }
  // 4. 付款单（expense）— 真实字段: contact_name, supplier_name, contact_type, amount, pay_date
  for (const r of payList.value) {
    if (Number(r.amount || 0) <= 0) continue
    const paySourceMap: Record<string, string> = { supplier: '采购付款', customer: '客户退款', staff: '员工费用', other: '其他支出' }
    items.push({ type: 'expense', source: paySourceMap[r.contact_type] || '付款', name: getPayReceiptSupplierLabel(r, purchasePayList.value, supplierList.value), amount: Number(r.amount || 0), date: fmtDt(r.pay_date || r.create_time), order_no: r.order_sn || '' })
  }
  // 5. 费用单（expense）— 真实字段: name(非type_name), amount, expense_date, order_sn
  // 注意：「单据支出」类型的费用已在 pay_receipt 中以「付款」口径计入，此处跳过避免重复
  for (const r of expenseList.value) {
    if (r.payment_status === 'pending') continue
    if (Number(r.amount || 0) <= 0) continue
    // 如果是「单据支出」产生的费用记录，已在 pay_receipt 中展示，此处跳过
    if (/采购单据支出\s*#\d+/.test(r.remark || '')) continue
    items.push({ type: 'expense', source: r.payment_status === 'paid' ? '费用(已付)' : '费用', name: r.name || '—', amount: Number(r.amount || 0), date: fmtDt(r.expense_date || r.create_time), order_no: r.order_sn || '' })
  }
  // 6. 预收款/预付款 — 客户预收款是收入，供应商预付款是支出
  for (const r of prepayList.value) {
    if (Number(r.amount || 0) <= 0) continue
    const isCustomer = r.pay_type === 'customer'
    items.push({ type: isCustomer ? 'income' : 'expense', source: isCustomer ? '客户预收款' : '供应商预付款', name: isCustomer ? (r.customer_name || '—') : (r.supplier_name || '—'), amount: Number(r.amount || 0), date: fmtDt(r.create_time), order_no: r.prepay_no || '' })
  }
  // 7. 采购退货退款（income）
  for (const r of procureReturnFinanceList.value) {
    if (Number(r.refund_amount || 0) <= 0) continue
    items.push({ type: 'income', source: '采购退货退款', name: r.supplier_name || '—', amount: Number(r.refund_amount || 0), date: r.date || '', order_no: r.order_no || '' })
  }
  // 8. 销售退货退款（expense）
  for (const r of saleReturnFinanceList.value) {
    if (Number(r.refund_amount || 0) <= 0) continue
    items.push({ type: 'expense', source: '销售退货退款', name: r.customer_name || '—', amount: Number(r.refund_amount || 0), date: r.date || '', order_no: r.order_no || '' })
  }
  return items.sort((a, b) => b.date.localeCompare(a.date))
})

// 收入/支出汇总 — 与 FundFlow.vue summary 计算完全一致
const collectTotal = computed(() =>
  allFlowItems.value.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0).toFixed(2)
)
const payTotal = computed(() =>
  allFlowItems.value.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0).toFixed(2)
)
const fundTotal = computed(() =>
  (Number(collectTotal.value) - Number(payTotal.value)).toFixed(2)
)
const accountTotal = computed(() =>
  fundList.value.reduce((s, r) => s + Number(r.display_balance ?? r.balance ?? 0), 0).toFixed(2)
)
const prepayTotal = computed(() =>
  prepayList.value.filter((r: any) => r.pay_type === 'customer').reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)
)
const supplierPrepayTotal = computed(() =>
  prepayList.value.filter((r: any) => r.pay_type === 'supplier').reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)
)
const adjustedPayList = computed(() =>
  applyProcureReturnsToPayReceiptRows(payList.value, procureReturnFinanceList.value)
)

// 近期收款 = 收款单 + 预收款，按日期倒序
const recentCollectItems = computed(() => {
  const items: any[] = []
  for (const r of adjustedCollectList.value) {
    if (Number(r.net_amount ?? r.amount ?? 0) <= 0) continue
    items.push({
      _key: 'c_' + r.id,
      name: r.customer_name || r.contact_name || '—',
      amount: Number(r.net_amount ?? r.amount ?? 0),
      date: fmtDt(r.receipt_date || r.create_time),
      refund_allocated: Number(r.refund_allocated || 0),
    })
  }
  for (const r of prepayList.value) {
    if (Number(r.amount || 0) <= 0) continue
    const isCustomer = r.pay_type === 'customer'
    items.push({ _key: 'p_' + r.id, name: isCustomer ? (r.customer_name || '—') : (r.supplier_name || '—'), amount: Number(r.amount || 0), date: fmtDt(r.create_time) })
  }
  return items.sort((a, b) => b.date.localeCompare(a.date))
})
const receivableTotal = computed(() =>
  receivableList.value.reduce((s, r) => s + Number(r.un_pay_amount ?? (Number(r.total_amount || r.amount || 0) - Number(r.paid_amount || 0))), 0).toFixed(2)
)
function getPurchaseSupplierLabel(row: any): string {
  try {
    const items = typeof row.goods_info === 'string' ? JSON.parse(row.goods_info) : (row.goods_info || [])
    const ids = [...new Set(items.map((i: any) => Number(i.supplier_id)).filter(Boolean))]
    if (ids.length > 1) return '多供应商'
    if (ids.length === 1) {
      const s = supplierList.value.find((x: any) => x.id === ids[0])
      return s?.name || row.supplier_name || '—'
    }
  } catch {}
  return row.supplier_name || supplierList.value.find((s: any) => s.id === row.supplier_id)?.name || '—'
}

function getPayableUnpaidAmount(r: any): number {
  if (r?.un_pay_amount !== undefined && r?.un_pay_amount !== null && r?.un_pay_amount !== '') {
    return Number(r.un_pay_amount || 0)
  }
  const orderAmount = Number(r?.order_amount || 0)
  const paidAmount = Number(r?.paid_amount || 0)
  return orderAmount - paidAmount
}

function openFundDetail(fund: any) {
  router.push({ path: '/finance/fund', query: { fund_id: String(fund.id) } })
}
const payableTotal = computed(() =>
  payableList.value.reduce((s, r) => s + getPayableUnpaidAmount(r), 0).toFixed(2)
)
const purchasePayTotal = computed(() =>
  purchasePayList.value.reduce((s, r) => s + Number(r.total_amount || 0), 0).toFixed(2)
)

const saleOutTotal = computed(() =>
  saleOutList.value.reduce((s, r) => {
    const amt = (r.after_discount != null && r.after_discount !== '') ? Number(r.after_discount) : Number(r.total_amount || 0)
    return s + amt
  }, 0).toFixed(2)
)

const retailTotal = computed(() =>
  retailList.value.filter((r: any) => r.status === 1).reduce((s, r) => s + Number(r.pay_amount || r.total_amount || 0), 0).toFixed(2)
)

const summaryCards = computed(() => {
  const income = Number(collectTotal.value)
  const expense = Number(payTotal.value)
  const balance = fundTotal.value
  return [
  { key: 'fund', label: '资金余额', value: balance, sub: `= 收入 ¥${income.toFixed(2)} − 支出 ¥${expense.toFixed(2)}`, color: Number(balance) < 0 ? '#dc2626' : '#16a34a', bg: Number(balance) < 0 ? '#fff0f0' : '#e6f7f0', icon: 'Wallet', route: '/finance/fund-flow' },
  { key: 'collect', label: '总资金收入', value: collectTotal.value, sub: `${allFlowItems.value.filter(i => i.type === 'income').length} 笔收入`, color: '#16a34a', bg: '#e6f7f0', icon: 'TrendCharts', route: '/finance/fund-flow?type=income' },
  { key: 'pay', label: '总资金支出', value: payTotal.value, sub: `${allFlowItems.value.filter(i => i.type === 'expense').length} 笔支出`, color: '#dc2626', bg: '#fff0f0', icon: 'Bottom', route: '/finance/fund-flow?type=expense' },
  { key: 'payable', label: '应付总额', value: payableTotal.value, sub: `${payableList.value.filter((r) => getPayableUnpaidAmount(r) > 0).length} 笔欠款`, color: '#ff4d4f', bg: '#fff1f0', icon: 'DocumentChecked', route: '/finance/payable' },
  { key: 'receivable', label: '应收总额', value: receivableTotal.value, sub: `${receivableList.value.length} 笔待收`, color: '#16a34a', bg: '#e6f7f0', icon: 'DocumentChecked', route: '/finance/receivable' },
  ]
})

// 快速收款
const collectDialogVisible = ref(false)
const collectSaving = ref(false)
const collectOcrText = ref('')
const collectForm = ref<any>({ category: 'receipt', contact_id: null, contact_name: '', contact_type: 'customer', fund_id: null, fund_name: '', amount: 0, receipt_date: new Date().toISOString().slice(0, 10), remark: '' })

function openQuickCollect() {
  collectOcrText.value = ''
  collectForm.value = { category: 'receipt', contact_id: null, contact_name: '', contact_type: 'customer', fund_id: null, fund_name: '', amount: 0, receipt_date: new Date().toISOString().slice(0, 10), remark: '' }
  collectDialogVisible.value = true
}
function onCollectCategoryChange(val: string) {
  collectForm.value.contact_id = null
  collectForm.value.contact_name = ''
  collectForm.value.contact_type = val === 'other' ? 'other' : 'customer'
}
function toggleCollectOther() {
  collectForm.value.category = 'other'
  collectForm.value.contact_id = null
  collectForm.value.contact_name = ''
  collectForm.value.contact_type = 'other'
}
function onCollectContactChange(id: number) {
  const c = clientList.value.find((x: any) => x.id === id)
  collectForm.value.contact_name = c?.name || ''
  collectForm.value.contact_type = 'customer'
}
function toggleCollectFundOther() {
  collectForm.value.fund_id = collectForm.value.fund_id === -1 ? null : -1
  collectForm.value.fund_name = ''
}
function onCollectFundChange(id: number) {
  const f = fundList.value.find((x: any) => x.id === id)
  collectForm.value.fund_name = f?.name || ''
}
// 通用自然语言解析：支持 "跑腿费5元" "水电费50" "¥123.45" "收到张三500块" 等格式
function parseNaturalText(text: string): { amount: number; remark: string; date: string; isExpense: boolean } {
  // 1. 金额识别：优先匹配"XX费/XX款/XX钱 + 数字"，其次 ¥数字，其次独立数字
  let amount = 0
  // 自然语言：文字+数字+单位，如 "跑腿费5元" "水费50" "工资3000块"
  const nlMatch = text.match(/[\u4e00-\u9fa5a-zA-Z]+\s*[：:＝=]?\s*[¥￥]?\s*(\d+(?:[.,]\d+)?)\s*(?:元|块|¥|￥)?/)
  // 标准金额格式：¥123.45 / 金额：123.45
  const formalMatch = text.match(/(?:金额|共计|合计|支付|收到|转账)[：:＝=\s]*[¥￥]?\s*(\d+(?:[.,]\d+)?)/)
  // 纯货币符号：¥123
  const symbolMatch = text.match(/[¥￥]\s*(\d+(?:[.,]\d+)?)/)
  // 结尾数字+单位
  const trailMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:元|块|円)/)

  const candidates = [formalMatch, symbolMatch, nlMatch, trailMatch].filter(Boolean)
  if (candidates.length > 0) {
    // 取最大值（通常是最主要的金额）
    const amounts = candidates.map(m => parseFloat(m![1].replace(',', '.')))
    amount = Math.max(...amounts)
  }

  // 2. 备注识别：优先显式备注字段，否则提取文字部分（去掉数字和货币符号）
  let remark = ''
  const remarkMatch = text.match(/(?:备注|摘要|说明|用途|事由)[：:]\s*(.+)/)
  if (remarkMatch) {
    remark = remarkMatch[1].trim()
  } else {
    // 自然语言：去掉数字、货币符号、空白，剩余文字作为备注
    remark = text
      .replace(/[¥￥]\s*\d+(?:[.,]\d+)?/g, '')
      .replace(/\d+(?:[.,]\d+)?\s*(?:元|块|円)?/g, '')
      .replace(/(?:金额|共计|合计|支付|收到|转账|备注|摘要|说明|用途)[：:＝=\s]*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // 3. 日期识别
  let date = new Date().toISOString().slice(0, 10)
  const dateMatch = text.match(/(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})/)
  const shortDateMatch = text.match(/(\d{1,2})[./月](\d{1,2})[日号]?/)
  if (dateMatch) {
    date = `${dateMatch[1]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[3].padStart(2,'0')}`
  } else if (shortDateMatch) {
    const y = new Date().getFullYear()
    date = `${y}-${shortDateMatch[1].padStart(2,'0')}-${shortDateMatch[2].padStart(2,'0')}`
  }

  // 4. 判断是否为日常费用类（提示应走费用管理）
  const expenseKeywords = /跑腿|快递|运费|水费|电费|燃气|网费|电话|话费|房租|租金|物业|餐费|饭费|打车|交通|停车|办公|文具|耗材|广告|维修|保险|税|罚款|利息|手续费|服务费|工资|薪资|奖金|提成|社保|公积金|福利/
  const isExpense = expenseKeywords.test(text)

  return { amount, remark, date, isExpense }
}

function parseCollectOcr() {
  const text = collectOcrText.value.trim()
  if (!text) return
  const { amount, remark, date, isExpense } = parseNaturalText(text)
  if (amount > 0) collectForm.value.amount = amount
  if (remark) collectForm.value.remark = remark
  collectForm.value.receipt_date = date
  // 非客户相关的收入关键词 → 自动切到"其他收入"
  const otherIncomeKeywords = /利息|退税|赔偿|补贴|奖励|返利|分红|佣金|违约金|赔付|其他收入/
  if (otherIncomeKeywords.test(text)) {
    collectForm.value.category = 'other'
    collectForm.value.contact_type = 'other'
    collectForm.value.contact_id = null
    collectForm.value.contact_name = remark || ''
  }
  if (amount > 0) {
    ElMessage.success(`识别完成：金额 ¥${amount}，请确认收款信息`)
  } else {
    ElMessage.warning('未能识别到金额，请手动填写')
  }
}

async function saveCollect() {
  if (!collectForm.value.amount) { ElMessage.warning('请输入收款金额'); return }
  const isOther = collectForm.value.category === 'other'
  const name = isOther
    ? collectForm.value.contact_name
    : (clientList.value.find((x: any) => x.id === collectForm.value.contact_id)?.name || collectForm.value.contact_name || '')
  if (isOther && !name) { ElMessage.warning('请输入收入说明'); return }
  const fundName = collectForm.value.fund_id === -1 ? collectForm.value.fund_name : (fundList.value.find((x: any) => x.id === collectForm.value.fund_id)?.name || '')
  collectSaving.value = true
  try {
    await createCollectReceipt(isOther ? {
      contact_name: name,
      contact_type: 'other',
      fund_id: collectForm.value.fund_id === -1 ? null : collectForm.value.fund_id,
      fund_name: fundName,
      amount: collectForm.value.amount,
      receipt_date: collectForm.value.receipt_date,
      remark: collectForm.value.remark,
    } : {
      customer_id: collectForm.value.contact_id || 0,
      customer_name: name,
      contact_type: 'customer',
      fund_id: collectForm.value.fund_id === -1 ? null : collectForm.value.fund_id,
      fund_name: fundName,
      amount: collectForm.value.amount,
      receipt_date: collectForm.value.receipt_date,
      remark: collectForm.value.remark,
    })
    ElMessage.success(isOther ? '其他收入已保存' : '收款记录已保存')
    collectDialogVisible.value = false
    loadAllData()
  } catch { ElMessage.error('保存失败') } finally { collectSaving.value = false }
}

// 快速付款
const payDialogVisible = ref(false)
const paySaving = ref(false)
const payOcrText = ref('')
const payForm = ref<any>({ category: 'receipt', contact_id: null, contact_name: '', contact_type: 'supplier', fund_id: null, fund_name: '', amount: 0, pay_date: new Date().toISOString().slice(0, 10), remark: '' })

function openQuickPay() {
  payOcrText.value = ''
  payForm.value = { category: 'receipt', contact_id: null, contact_name: '', contact_type: 'supplier', fund_id: null, fund_name: '', amount: 0, pay_date: new Date().toISOString().slice(0, 10), remark: '' }
  payDialogVisible.value = true
}
function onPayCategoryChange(val: string) {
  payForm.value.contact_id = null
  payForm.value.contact_name = ''
  payForm.value.contact_type = val === 'other' ? 'other' : 'supplier'
}
function togglePayOther() {
  payForm.value.category = 'other'
  payForm.value.contact_id = null
  payForm.value.contact_name = ''
  payForm.value.contact_type = 'other'
}
function onPayContactChange(id: number) {
  const s = supplierList.value.find((x: any) => x.id === id)
  payForm.value.contact_name = s?.name || ''
  payForm.value.contact_type = 'supplier'
}
function togglePayFundOther() {
  payForm.value.fund_id = payForm.value.fund_id === -1 ? null : -1
  payForm.value.fund_name = ''
}
function onPayFundChange(id: number) {
  const f = fundList.value.find((x: any) => x.id === id)
  payForm.value.fund_name = f?.name || ''
}
function parsePayOcr() {
  const text = payOcrText.value.trim()
  if (!text) return
  const { amount, remark, date, isExpense } = parseNaturalText(text)
  if (amount > 0) payForm.value.amount = amount
  if (remark) payForm.value.remark = remark
  payForm.value.pay_date = date
  // 费用类自动切到"其他支出"分类
  if (isExpense) {
    payForm.value.category = 'other'
    payForm.value.contact_type = 'other'
    payForm.value.contact_id = null
    payForm.value.contact_name = remark || ''
  }
  if (amount > 0) {
    const hint = isExpense ? `识别完成：¥${amount}（日常费用，已设为其他支出）` : `识别完成：金额 ¥${amount}，请确认付款信息`
    ElMessage.success(hint)
  } else {
    ElMessage.warning('未能识别到金额，请手动填写')
  }
}

async function savePay() {
  if (!payForm.value.amount) { ElMessage.warning('请输入付款金额'); return }
  const isOther = payForm.value.category === 'other'
  const name = isOther
    ? payForm.value.contact_name
    : (supplierList.value.find((x: any) => x.id === payForm.value.contact_id)?.name || payForm.value.contact_name || '')
  if (isOther && !name) { ElMessage.warning('请输入支出说明'); return }
  const fundName = payForm.value.fund_id === -1 ? payForm.value.fund_name : (fundList.value.find((x: any) => x.id === payForm.value.fund_id)?.name || '')
  paySaving.value = true
  try {
    await http.post('/finance/PayReceipt/add', {
      contact_name: name,
      contact_type: isOther ? 'other' : 'supplier',
      fund_id: payForm.value.fund_id === -1 ? null : payForm.value.fund_id,
      fund_name: fundName,
      amount: payForm.value.amount,
      pay_date: payForm.value.pay_date,
      remark: payForm.value.remark,
    })
    ElMessage.success(isOther ? '其他支出已保存' : '付款记录已保存')
    payDialogVisible.value = false
    loadAllData()
  } catch { ElMessage.error('保存失败') } finally { paySaving.value = false }
}

async function loadAllData() {
  try {
    const settled = await Promise.allSettled([
      getFundList({ list_rows: 100 }),
      http.get('/finance/Prepay/index', { params: { list_rows: 200 } }),
      getCollectReceiptList({ list_rows: 1000 }),
      getPayReceiptList({ list_rows: 1000 }),
      http.get('/stock/PurchaseOrder/index', { params: { list_rows: 2000, status: 1 } }),
      http.get('/stock/SaleOutOrder/index', { params: { list_rows: 2000 } }),
      http.get('/retail/order/index', { params: { list_rows: 2000 } }),
      getExpenseList({ list_rows: 1000 }),
      http.get('/retail/recharge/index', { params: { list_rows: 1000 } }),
      http.get('/shop/ShopCustomer/index', { params: { list_rows: 500 } }),
      http.get('/procure/supplier/index', { params: { list_rows: 500 } }),
      http.get('/procure/ProcureReturn/index', { params: { status: 1, list_rows: 1000 } }),
      http.get('/stock/SaleReturnOrder/index', { params: { status: 1, list_rows: 1000 } }),
      getContractList({ list_rows: 1000 }),
    ])
    const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
    const [fundRes, prepayRes, collectRes, payRes, purchaseRes, saleOutRes, retailRes, expenseRes, rechargeRes, clientRes, supplierRes, returnRes, saleReturnRes, contractRes] = settled.map((_,i) => ok(i))
    const rawFundList = fundRes.data?.rows ?? fundRes.data?.list ?? []
    const fundNameMap = new Map<number, string>(rawFundList.map((row: any) => [Number(row.id), String(row.name || '')]))
    prepayList.value = prepayRes.data?.rows ?? prepayRes.data?.list ?? []
    const rawCollectList = collectRes.data?.rows ?? collectRes.data?.list ?? []
    const rawPayList = payRes.data?.rows ?? payRes.data?.list ?? []
    collectList.value = rawCollectList
    payList.value = rawPayList
    // 应收账款：与 Receivable.vue 完全相同的 order_sn 匹配逻辑
    const auditedContractsForRec = (contractRes.data?.rows ?? contractRes.data?.list ?? [])
      .filter(isEffectiveSaleContract)
    const snToIdRec = new Map<string, number>()
    for (const c of auditedContractsForRec) {
      if (c.order_sn) snToIdRec.set(String(c.order_sn), c.id)
      if (c.order_no)  snToIdRec.set(String(c.order_no),  c.id)
    }
    const contractDirectPaidRec = new Map<number, number>()
    const custUnmatchedPaidRec = new Map<number, number>()
    for (const r of rawCollectList) {
      if (String(r.remark || '').startsWith('[other]')) continue
      const amount = Number(r.amount || 0)
      const rSn = String(r.order_sn || '').trim()
      const custId = Number(r.customer_id || 0)
      if (rSn && snToIdRec.has(rSn)) {
        const cid = snToIdRec.get(rSn)!
        contractDirectPaidRec.set(cid, (contractDirectPaidRec.get(cid) ?? 0) + amount)
      } else if (custId > 0) {
        custUnmatchedPaidRec.set(custId, (custUnmatchedPaidRec.get(custId) ?? 0) + amount)
      }
    }
    const byCustomerRec = new Map<number, any[]>()
    for (const r of auditedContractsForRec) {
      const custId = Number(r.customer_id || 0)
      if (custId > 0 && custUnmatchedPaidRec.has(custId)) {
        if (!byCustomerRec.has(custId)) byCustomerRec.set(custId, [])
        byCustomerRec.get(custId)!.push(r)
      }
    }
    for (const contracts of byCustomerRec.values()) {
      contracts.sort((a: any, b: any) =>
        new Date(a.order_date || a.created_at).getTime() - new Date(b.order_date || b.created_at).getTime()
      )
    }
    // 与 Contract.vue calcContractAmount 保持一致：after_discount + 运费（按承担方）- 收入调整
    // after_discount > total_amount 说明是编辑后未同步的过期数据，此时用 total_amount
    const calcAmtRec = (c: any): number => {
      const total = Number(c.total_amount || 0)
      const afterDisc = Number(c.after_discount)
      const base = Number.isFinite(afterDisc) && afterDisc > 0 && afterDisc <= total ? afterDisc : total
      const freight = Number(c.freight_amount || 0)
      const bearer = String(c.freight_bearer || 'seller')
      const fc = bearer === 'buyer' ? freight : bearer === 'half' ? freight / 2 : 0
      return Math.max(0, base + fc - Number(c.income_amount || 0))
    }
    const contractFifoPaidRec = new Map<number, number>()
    for (const [custId, contracts] of byCustomerRec) {
      let remaining = custUnmatchedPaidRec.get(custId) ?? 0
      for (const c of contracts) {
        const total = calcAmtRec(c)
        const directPaid = contractDirectPaidRec.get(c.id) ?? 0
        const leftover = Math.max(0, total - directPaid)
        const applied = Math.min(remaining, leftover)
        if (applied > 0) contractFifoPaidRec.set(c.id, applied)
        remaining = Math.max(0, remaining - applied)
        if (remaining <= 0) break
      }
    }
    const contractPaidRec = new Map<number, number>()
    for (const id of new Set([...contractDirectPaidRec.keys(), ...contractFifoPaidRec.keys()])) {
      contractPaidRec.set(id, (contractDirectPaidRec.get(id) ?? 0) + (contractFifoPaidRec.get(id) ?? 0))
    }
    const rawReceivableList = auditedContractsForRec.map((r: any) => {
      const receiptPaidRec = contractPaidRec.get(r.id)
      // 与 Contract.vue getReceivedAmount 一致：收款单有记录优先，否则用合同自身的 receive_amount
      const paid = receiptPaidRec !== undefined ? receiptPaidRec : Number(r.receive_amount || 0)
      const total = calcAmtRec(r)
      return {
        ...r,
        total_amount: total,
        paid_amount: paid,
        un_pay_amount: Math.max(0, total - paid),
        order_sn: r.order_sn || r.order_no || '',
        out_date: r.order_date || r.created_at,
      }
    }).filter((r: any) => r.un_pay_amount > 0)
    procureReturnFinanceList.value = normalizeProcureReturnFinanceRows(returnRes.data?.rows ?? [], fundNameMap)
    const normalizedSaleReturns = normalizeSaleReturnFinanceRows(saleReturnRes.data?.rows ?? [])

    // 按 fund_id 动态计算各账户余额：收款单收入 - 付款单支出（不依赖balance字段）
    const fundIncomeById = new Map<number, number>()
    const fundIncomeByName = new Map<string, number>()
    for (const r of rawCollectList) {
      const amt = Number(r.amount || 0)
      if (amt <= 0) continue
      const fid = Number(r.fund_id || 0)
      const fname = String(r.fund_name || '').trim()
      if (fid > 0) fundIncomeById.set(fid, (fundIncomeById.get(fid) || 0) + amt)
      else if (fname) fundIncomeByName.set(fname, (fundIncomeByName.get(fname) || 0) + amt)
    }
    // 零售单收入归到「零售收款账户」
    const rawRetailRows: any[] = retailRes.data?.rows ?? retailRes.data?.list ?? []
    const retailFundName = rawFundList.find((f: any) => String(f.name || '').includes('零售收款'))?.name || '零售收款账户'
    const retailFundId = Number(rawFundList.find((f: any) => String(f.name || '').includes('零售收款'))?.id || 0)
    for (const r of rawRetailRows) {
      if (Number(r.status) !== 1) continue
      const amt = Number(r.pay_amount ?? r.total_amount ?? 0)
      if (amt <= 0) continue
      if (retailFundId > 0) fundIncomeById.set(retailFundId, (fundIncomeById.get(retailFundId) || 0) + amt)
      else fundIncomeByName.set(retailFundName, (fundIncomeByName.get(retailFundName) || 0) + amt)
    }
    const fundExpenseById = new Map<number, number>()
    const fundExpenseByName = new Map<string, number>()
    for (const r of rawPayList) {
      const amt = Number(r.amount || 0)
      if (amt <= 0) continue
      const fid = Number(r.fund_id || 0)
      const fname = String(r.fund_name || '').trim()
      if (fid > 0) fundExpenseById.set(fid, (fundExpenseById.get(fid) || 0) + amt)
      else if (fname) fundExpenseByName.set(fname, (fundExpenseByName.get(fname) || 0) + amt)
    }
    const fundListWithDynamic = rawFundList.map((row: any) => {
      const fid = Number(row.id || 0)
      const fname = String(row.name || '').trim()
      const income = (fundIncomeById.get(fid) || 0) + (fundIncomeByName.get(fname) || 0)
      const expense = (fundExpenseById.get(fid) || 0) + (fundExpenseByName.get(fname) || 0)
      let dynamicBalance = Math.round((income - expense) * 100) / 100
      // 零售收款账户：动态计算无法涵盖零售单，用 DB 维护的 balance 字段
      if (fname.includes('零售收款') && dynamicBalance === 0) {
        dynamicBalance = Math.round(Number(row.balance ?? 0) * 100) / 100
      }
      return { ...row, raw_balance: dynamicBalance, balance: dynamicBalance, display_balance: dynamicBalance }
    })
    fundList.value = applyProcureReturnsToFundRows(fundListWithDynamic, procureReturnFinanceList.value)
    saleReturnFinanceList.value = buildSaleReturnSettlementRows(rawReceivableList, normalizedSaleReturns)
    // 按供应商聚合采购订单计算应付（只算已审核 status===1 的单子）
    // 已付金额从付款单里匹配（3种匹配方式）
    const procurePaidById: Record<number, number> = {}
    const procurePaidByKey: Record<string, number> = {}
    const procurePaidBySn: Record<string, number> = {}
    const procurePaidBySup: Record<string, number> = {}
    const procureFeePaidById = buildProcureFeePaidByOrder(rawPayList)
    for (const r of rawPayList) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      if (isProcureExtraFeePayment(r)) continue
      // 审核自动生成的付款单是系统预付记录，不计入应付欠款（与 Payable.vue 逻辑一致）
      if (/审核自动生成/.test(String(r.remark || ''))) continue
      const orderSn = String(r.order_sn || '').trim()
      const supplierName = String(r.supplier_name || r.contact_name || '').trim()
      let matched = false
      // 方式1：order_id 直接匹配
      if (Number(r.order_id)) {
        const id = Number(r.order_id); procurePaidById[id] = (procurePaidById[id] || 0) + amt; matched = true
      }
      // 方式2：备注 "采购单付款 #ID"（单ID直接匹配单据，多ID按供应商维度存储）
      const m1all = [...String(r.remark || '').matchAll(/采购单(?:自动)?付款\s+#(\d+)/g)]
      if (m1all.length === 1) {
        const id = Number(m1all[0][1]); procurePaidById[id] = (procurePaidById[id] || 0) + amt; matched = true
      } else if (m1all.length > 1) {
        if (supplierName) procurePaidBySup[supplierName] = (procurePaidBySup[supplierName] || 0) + amt
        matched = true
      }
      // 方式3：order_sn@@supplier_name 精确匹配（兜底）
      if (!matched && orderSn && supplierName) {
        const k = `${orderSn}@@${supplierName}`
        procurePaidByKey[k] = (procurePaidByKey[k] || 0) + amt
        matched = true
      }
    }
    const supplierPayMap = new Map<string, any>()
    for (const o of (purchaseRes.data?.rows ?? purchaseRes.data?.list ?? [])) {
      if (Number(o.status) !== 1) continue
      const key = o.supplier_id ? `id:${o.supplier_id}` : `name:${String(o.supplier_name || '').trim()}`
      if (!supplierPayMap.has(key)) {
        supplierPayMap.set(key, { supplier_id: o.supplier_id || 0, supplier_name: o.supplier_name || '—', order_amount: 0, paid_amount: 0, un_pay_amount: 0 })
      }
      const s = supplierPayMap.get(key)!
      const orderAmt = Number(o.after_discount ?? o.total_amount ?? 0)
      const oSn = String(o.order_sn || '').trim()
      const oNo = String(o.order_no || '').trim()
      const supName = String(o.supplier_name || '').trim()
      const paidAmt = Number(o.pay_amount || 0)
      const feeNeedPay = getProcureFeeNeedPayAmount(o)
      const feePaid = procureFeePaidById[o.id] || 0
      const feeUnpaid = Math.max(0, feeNeedPay - feePaid)
      const unpaid = orderAmt - paidAmt
      if (unpaid <= 0 && feeUnpaid <= 0) continue
      s.order_amount += orderAmt + feeNeedPay
      s.paid_amount += paidAmt + feePaid
      s.un_pay_amount += unpaid + feeUnpaid
    }
    // 聚合合同附加费用（对方承担、有收款方的）按 supplier_name，计算已付/未付
    const auditedContracts: any[] = contractRes.data?.rows ?? contractRes.data?.list ?? []
    const saleFeePaidMap: Record<string, number> = {}
    for (const r of rawPayList) {
      const m = String(r.remark || '').match(/销售订单附加费用\s*#(\d+):(.+?)(?:\s|\[|$)/)
      if (m) {
        const key = `${Number(m[1])}:${m[2].trim()}`
        saleFeePaidMap[key] = (saleFeePaidMap[key] || 0) + Number(r.amount || 0)
      }
    }
    const feeMap = new Map<string, { order_amount: number; paid_amount: number; orders: any[] }>()
    for (const c of auditedContracts) {
      let feeItems: any[] = []
      try {
        const raw = c.fee_items
        if (typeof raw === 'string' && raw && raw !== '[]') feeItems = JSON.parse(raw)
        else if (Array.isArray(raw)) feeItems = raw
      } catch { feeItems = [] }
      if (!feeItems.length) {
        try {
          const fiMatch = String(c.remark || '').match(/\[FI:([^\]]+)\]/)
          if (fiMatch) feeItems = JSON.parse(decodeURIComponent(atob(fiMatch[1])))
        } catch { /* ignore */ }
      }
      for (const f of feeItems) {
        if (f.bearer === 'buyer') continue
        const amt = Number(f.amount || 0)
        if (!amt) continue
        const feeName = String(f.name || '费用').trim()
        const paid = saleFeePaidMap[`${c.id}:${feeName}`] || 0
        const unpaid = amt - paid
        if (unpaid <= 0.001) continue
        const supplierName = String(f.supplier_name || '').trim() || `合同附加-${feeName}`
        if (!feeMap.has(supplierName)) feeMap.set(supplierName, { order_amount: 0, paid_amount: 0, orders: [] })
        const entry = feeMap.get(supplierName)!
        entry.order_amount += amt
        entry.paid_amount += paid
        entry.orders.push({
          order_id: c.id,
          order_no: c.order_sn || c.order_no || '',
          order_amount: amt,
          paid_amount: paid,
          un_pay_amount: unpaid,
          due_date: fmtDt(c.sign_date || c.order_date || c.created_at),
          source_name: `合同附加-${feeName}`,
        })
      }
    }
    const contractFeeRows = Array.from(feeMap.entries())
      .map(([supplierName, entry]) => ({
        supplier_id: 0,
        supplier_name: supplierName,
        contact_name: '',
        contact_mobile: '',
        order_amount: entry.order_amount,
        paid_amount: entry.paid_amount,
        un_pay_amount: entry.order_amount - entry.paid_amount,
        prepay: 0,
        orders: entry.orders,
        __payable_source: 'contract_fee',
        source_name: '合同附加费',
      }))
      .filter((r) => r.un_pay_amount > 0.001)

    payableList.value = [
      ...applyProcureReturnsToPayableRows(Array.from(supplierPayMap.values()), procureReturnFinanceList.value),
      ...buildExpensePayableRows(expenseRes.data?.rows ?? expenseRes.data?.list ?? []),
      ...contractFeeRows,
    ]
    receivableList.value = rawReceivableList
    adjustedCollectList.value = applySaleReturnsToCollectReceiptRows(collectList.value, normalizedSaleReturns, rawReceivableList)
    purchasePayList.value = (purchaseRes.data?.rows ?? purchaseRes.data?.list ?? []).filter((r: any) => Number(r.status) === 1)
    const auditedContractSns = new Set<string>()
    for (const c of contractRes.data?.rows ?? contractRes.data?.list ?? []) {
      if (Number(c.status) === 1) {
        if (c.order_sn) auditedContractSns.add(String(c.order_sn))
        if (c.order_no) auditedContractSns.add(String(c.order_no))
      }
    }
    saleOutList.value = (saleOutRes.data?.rows ?? saleOutRes.data?.list ?? []).filter((r: any) => {
      if (Number(r.status) !== 1) return false
      const m = String(r.remark || '').match(/(HT[0-9]+|XS[0-9]+)/)
      if (!m) return false
      return auditedContractSns.has(m[1])
    })
    retailList.value = retailRes.data?.rows ?? retailRes.data?.list ?? []
    expenseList.value = expenseRes.data?.rows ?? expenseRes.data?.list ?? []
    rechargeList.value = rechargeRes.data?.rows ?? rechargeRes.data?.list ?? []
    clientList.value = clientRes.data?.rows ?? clientRes.data?.list ?? []
    supplierList.value = supplierRes.data?.rows ?? supplierRes.data?.list ?? []

    // 过滤预付款：排除已删除的客户/供应商的记录
    const clientIds = new Set(clientList.value.map((c: any) => c.id))
    const supplierIds = new Set(supplierList.value.map((s: any) => s.id))
    prepayList.value = prepayList.value.filter((r: any) => {
      // 只过滤掉有 id 但 id 不在列表里的记录（已删除的客户/供应商）
      // 没有绑定 id 的手动录入记录保留
      if (r.pay_type === 'customer') return !r.customer_id || clientIds.has(r.customer_id)
      if (r.pay_type === 'supplier') return !r.supplier_id || supplierIds.has(r.supplier_id)
      return true
    })
  } catch {}
}

onMounted(() => loadAllData())
onActivated(() => loadAllData())
</script>

<style scoped>
/* 一键识别栏 */
.ocr-bar {
  margin-bottom: 4px;
  background: var(--gray, #f5f5f7);
  border-radius: 12px;
  padding: 10px 12px;
}
.ocr-bar :deep(.el-input-group__append) {
  background: #0071e3;
  color: #fff;
  border: none;
  font-weight: 600;
  cursor: pointer;
  border-radius: 0 8px 8px 0;
  transition: background 0.15s;
}
.ocr-bar :deep(.el-input-group__append:hover) { background: #005bbf; }

/* 对象选择行 */
.contact-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.other-btn {
  flex-shrink: 0;
  border-radius: 8px !important;
  font-size: 12px !important;
  padding: 0 10px !important;
}

.quick-action-bar {
  display: flex;
  gap: 12px;
}
.quick-action-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  user-select: none;
}
.quick-action-card:hover { opacity: 0.85; transform: translateY(-1px); }
.quick-action-card.collect { background: #e6f7f0; color: #16a34a; border: 1px solid #bbf7d0; }
.quick-action-card.pay { background: #fff0f0; color: #dc2626; border: 1px solid #fecaca; }
.fin-overview {
  display: flex;

  flex-direction: column;
  gap: 14px;
}
.sum-cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.sum-card-col {
  min-width: 160px;
}
.sum-card-col--wide {
  flex: 2 1 280px;
  min-width: 220px;
}
.sum-card-col--narrow {
  flex: 1 1 140px;
  min-width: 130px;
}
.sum-card { border-radius: 14px; }
.sum-card-link { cursor: pointer; transition: box-shadow 0.15s, transform 0.1s; }
.sum-card-link:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; transform: translateY(-1px); }
.sum-card :deep(.el-card__body) { padding: 12px 14px; }
.sum-inner { display: flex; align-items: center; justify-content: space-between; }
.sum-info { flex: 1; min-width: 0; }
.sum-label { font-size: 11px; color: var(--dim); margin-bottom: 4px; }
.sum-value { font-size: 18px; font-weight: 700; line-height: 1.2; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sum-sub { font-size: 11px; color: var(--faint); }
.sum-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-left: 8px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
}
.header-total { margin-left: auto; font-size: 14px; font-weight: 700; }
.header-total.green { color: #16a34a; }
.header-total.red { color: #dc2626; }
.header-total.orange { color: #ea580c; }
.header-total.blue { color: #0071e3; }

/* 内联列表（横向排列） */
.inline-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
}
.inline-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 16px 6px 0;
  border-right: 1px solid var(--border);
  margin-right: 16px;
  min-width: 100px;
}
.inline-item:last-child { border-right: none; }
.inline-item.clickable { cursor: pointer; border-radius: 10px; transition: background 0.15s; }
.inline-item.clickable:hover { background: var(--blue-light); }
.total-item { border-left: 2px solid var(--border); padding-left: 16px; margin-left: 4px; }
.inline-name { font-size: 12px; color: var(--mid); margin-bottom: 2px; white-space: nowrap; }
.inline-value { font-size: 15px; font-weight: 700; line-height: 1.2; margin-bottom: 2px; }
.inline-value.blue { color: #0071e3; }
.inline-value.green { color: #16a34a; }
.inline-value.red { color: #dc2626; }
.inline-value.orange { color: #ea580c; }
.inline-sub { font-size: 11px; color: var(--faint); }

/* 趋势图 */
.flow-trend-card :deep(.el-card__body) {
  padding: 12px 16px 14px;
}
.trend-card-header {
  min-width: 0;
  flex-wrap: wrap;
}
.trend-range-tabs {
  margin-left: 12px;
}
.trend-flow-link {
  margin-left: auto;
}
.trend-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.trend-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.trend-kpi {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 10px;
  background: #fbfbfd;
}
.trend-kpi-label {
  flex-shrink: 0;
  font-size: 11px;
  color: rgba(29, 29, 31, 0.46);
}
.trend-kpi-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 750;
  color: #1d1d1f;
}
.trend-kpi--income {
  background: linear-gradient(180deg, rgba(22, 163, 74, 0.08), rgba(22, 163, 74, 0.025));
}
.trend-kpi--expense {
  background: linear-gradient(180deg, rgba(234, 88, 12, 0.08), rgba(234, 88, 12, 0.025));
}
.trend-kpi--net-in {
  background: linear-gradient(180deg, rgba(0, 113, 227, 0.08), rgba(0, 113, 227, 0.025));
}
.trend-kpi--net-out {
  background: linear-gradient(180deg, rgba(220, 38, 38, 0.08), rgba(220, 38, 38, 0.025));
}
.trend-legend-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.trend-legend-item {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  padding: 2px 0;
  color: rgba(29, 29, 31, 0.52);
}
.trend-legend-swatch {
  position: relative;
  width: 22px;
  height: 10px;
  flex-shrink: 0;
}
.trend-legend-swatch::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 4px;
  height: 2px;
  border-radius: 2px;
  background: var(--series-color);
}
.trend-legend-swatch::after {
  content: "";
  position: absolute;
  left: 9px;
  top: 1px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--series-color);
}
.trend-legend-name {
  flex-shrink: 0;
  font-size: 11px;
}
.trend-legend-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 650;
  color: rgba(29, 29, 31, 0.72);
}
.trend-plot-wrap {
  position: relative;
  min-width: 0;
}
.trend-svg {
  display: block;
  overflow: visible;
}
.trend-grid-line {
  stroke: rgba(29, 29, 31, 0.08);
  stroke-width: 1;
  stroke-dasharray: 4 5;
}
.trend-grid-line.is-zero {
  stroke: rgba(29, 29, 31, 0.14);
  stroke-dasharray: none;
}
.trend-series-line {
  filter: drop-shadow(0 4px 6px rgba(15, 23, 42, 0.08));
}
.trend-series-point {
  transition: r 0.15s ease, stroke-width 0.15s ease;
}
.trend-series-point:hover {
  r: 4.6px;
  stroke-width: 2.4;
}
.trend-empty-overlay {
  position: absolute;
  inset: 36% 66px auto 14px;
  text-align: center;
  font-size: 12px;
  color: rgba(29, 29, 31, 0.38);
  pointer-events: none;
}

.empty-tip { font-size: 13px; color: var(--dim); padding: 8px 0; }

/* 资金流水折叠区 */
.flow-section {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow: hidden;
}
.flow-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  color: var(--dim);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.flow-toggle:hover { background: var(--gray); }
.chart-grid-line { stroke: var(--border); }
.chart-axis-label { fill: rgba(29, 29, 31, 0.38); }

/* 利润分析入口大卡片 */
.profit-entry {
  display: flex; align-items: center; gap: 20px;
  padding: 20px 24px; border-radius: 16px; cursor: pointer;
  background: linear-gradient(135deg, #f0f7ff 0%, #f8f0ff 50%, #f0fff4 100%);
  border: 1px solid #e0e8f0;
  transition: box-shadow 0.2s, transform 0.15s;
}
.profit-entry:hover { box-shadow: 0 6px 24px rgba(0,113,227,0.12); transform: translateY(-2px); }
.profit-entry-left { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.profit-entry-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: linear-gradient(135deg, #0071e3, #7c3aed);
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.profit-entry-info { display: flex; flex-direction: column; gap: 4px; }
.profit-entry-title { font-size: 17px; font-weight: 700; color: #1d1d1f; }
.profit-entry-desc { font-size: 12px; color: rgba(29,29,31,0.45); }
.profit-entry-nums {
  display: flex; gap: 20px; flex: 1; justify-content: flex-end; align-items: center; flex-wrap: wrap;
}
.profit-entry-item { display: flex; flex-direction: column; gap: 2px; align-items: flex-end; }
.profit-entry-item--big { }
.profit-entry-label { font-size: 11px; color: rgba(29,29,31,0.4); }
.profit-entry-val { font-size: 16px; font-weight: 700; }
.profit-entry-rate { font-size: 11px; color: rgba(29,29,31,0.4); }
.profit-entry-divider { width: 1px; height: 36px; background: #d8dde4; }
.profit-entry-arrow { color: rgba(29,29,31,0.3); flex-shrink: 0; }

/* ── 手机端适配 ── */
@media (max-width: 767px) {
  /* el-col 全部变全宽 */
  .fin-overview :deep(.el-col) {
    width: 100% !important;
    flex: 0 0 100% !important;
    max-width: 100% !important;
    margin-bottom: 10px;
  }
  .fin-overview :deep(.el-row) {
    flex-direction: column;
  }

  /* 顶部统计卡片：2列grid */
  .sum-cards-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .sum-card-col--wide,
  .sum-card-col--narrow {
    width: auto !important;
  }

  /* 利润分析入口：纵向排列 */
  .profit-entry {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .profit-entry-nums {
    justify-content: flex-start;
    gap: 12px;
  }

  /* 快捷操作按钮 */
  .quick-action-bar {
    gap: 10px;
  }
  .quick-action-card {
    flex: 1;
  }

  .trend-card-header {
    gap: 8px;
  }
  .trend-range-tabs {
    order: 3;
    width: 100%;
    margin-left: 0;
  }
  .trend-flow-link {
    margin-left: auto;
  }
  .trend-kpis {
    grid-template-columns: 1fr;
  }
  .trend-legend-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .trend-legend-item {
    gap: 5px;
  }
  .trend-legend-value {
    display: none;
  }
}
</style>
// cache-bust: 1776093932
