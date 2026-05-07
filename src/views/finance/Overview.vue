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
              <div class="sum-value" :style="{ color: card.color }">¥{{ card.value }}</div>
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
            <div class="inline-item clickable" v-for="f in fundList" :key="f.id" @click="openFundDetail(f)">
              <div class="inline-name">{{ f.name }}</div>
              <div class="inline-value blue">¥{{ Number(f.display_balance ?? f.balance ?? 0).toFixed(2) }}</div>
              <div class="inline-sub">{{ { '1': '银行账户', '2': '现金', '3': '第三方' }[f.type] || '账户' }}</div>
            </div>
            <div class="inline-item total-item">
              <div class="inline-name">合计</div>
              <div class="inline-value red">¥{{ accountTotal }}</div>
              <div class="inline-sub">{{ fundList.length }} 个账户</div>
            </div>
          </div>
          <div v-else class="empty-tip">暂无账户数据</div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><TrendCharts /></el-icon>
              <span>近期利润趋势</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click="router.push('/report/profit')">查看明细</el-button>
            </div>
          </template>
          <div class="trend-chart">
            <svg :width="chartW" height="120" style="overflow:visible">
              <!-- Y轴参考线 -->
              <line v-for="i in 4" :key="i" :x1="0" :y1="(i-1)*30" :x2="chartW" :y2="(i-1)*30"
                class="chart-grid-line" stroke-width="1" />
              <!-- 收入折线 -->
              <polyline v-if="trendRevenue.length > 1"
                :points="trendRevenue.map((v,i) => `${i*(chartW/(trendDays.length-1))},${90 - v * 80}`).join(' ')"
                fill="none" stroke="#0071e3" stroke-width="2" stroke-linejoin="round" />
              <!-- 成本折线 -->
              <polyline v-if="trendCost.length > 1"
                :points="trendCost.map((v,i) => `${i*(chartW/(trendDays.length-1))},${90 - v * 80}`).join(' ')"
                fill="none" stroke="#7c3aed" stroke-width="2" stroke-linejoin="round" />
              <!-- 利润折线 -->
              <polyline v-if="trendProfit.length > 1"
                :points="trendProfit.map((v,i) => `${i*(chartW/(trendDays.length-1))},${55 - v * 45}`).join(' ')"
                fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="6 3" />
              <!-- 收入点 -->
              <circle v-for="(v,i) in trendRevenue" :key="'rv'+i"
                :cx="i*(chartW/(trendDays.length-1||1))" :cy="90 - v * 80" r="3" fill="#0071e3" />
              <!-- 成本点 -->
              <circle v-for="(v,i) in trendCost" :key="'ct'+i"
                :cx="i*(chartW/(trendDays.length-1||1))" :cy="90 - v * 80" r="3" fill="#7c3aed" />
              <!-- 利润点 -->
              <circle v-for="(v,i) in trendProfit" :key="'pf'+i"
                :cx="i*(chartW/(trendDays.length-1||1))" :cy="55 - v * 45" r="3" fill="#16a34a" />
              <!-- X轴标签 -->
              <text v-for="(d,i) in trendDays" :key="'d'+i"
                :x="i*(chartW/(trendDays.length-1||1))" y="110" text-anchor="middle"
                font-size="10" class="chart-axis-label">{{ d }}</text>
            </svg>
            <!-- 图例 -->
            <div class="trend-legend">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#0071e3;margin-right:4px"></span><span>收入</span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#7c3aed;margin:0 4px 0 12px"></span><span>成本</span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;margin:0 4px 0 12px"></span><span>利润</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ═══════════ 利润分析入口 ═══════════ -->
    <div class="profit-entry" @click="router.push('/reports/finance')">
      <div class="profit-entry-left">
        <div class="profit-entry-icon">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
        <div class="profit-entry-info">
          <div class="profit-entry-title">利润分析</div>
          <div class="profit-entry-desc">按单品 · 按单据 · 按月份 · 按客户 多维度利润报表</div>
        </div>
      </div>
      <div class="profit-entry-nums">
        <div class="profit-entry-item">
          <span class="profit-entry-label">营业收入</span>
          <span class="profit-entry-val blue">¥{{ profitFmt(profitSummary.revenue) }}</span>
        </div>
        <div class="profit-entry-item">
          <span class="profit-entry-label">销售成本</span>
          <span class="profit-entry-val purple">¥{{ profitFmt(profitSummary.cost) }}</span>
        </div>
        <div class="profit-entry-item">
          <span class="profit-entry-label">毛利润</span>
          <span class="profit-entry-val" :style="{ color: profitSummary.grossProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ profitSummary.grossProfit >= 0 ? '+' : '' }}¥{{ profitFmt(profitSummary.grossProfit) }}
          </span>
        </div>
        <div class="profit-entry-divider"></div>
        <div class="profit-entry-item profit-entry-item--big">
          <span class="profit-entry-label" style="font-weight:700">净利润</span>
          <span class="profit-entry-val" :style="{ color: profitSummary.netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize:'20px' }">
            {{ profitSummary.netProfit >= 0 ? '+' : '' }}¥{{ profitFmt(profitSummary.netProfit) }}
          </span>
          <span class="profit-entry-rate">净利率 {{ profitSummary.netRate.toFixed(1) }}%</span>
        </div>
      </div>
      <div class="profit-entry-arrow">
        <el-icon :size="20"><ArrowRight /></el-icon>
      </div>
    </div>

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
              <span class="header-total orange">¥{{ supplierPrepayTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/supplier-prepay')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="prepayList.filter(r=>r.pay_type==='supplier').length">
            <div class="inline-item clickable" v-for="r in prepayList.filter(r=>r.pay_type==='supplier').slice(0,4)" :key="r.id" @click="router.push('/finance/supplier-prepay')">
              <div class="inline-name">{{ r.supplier_name || '—' }}</div>
              <div class="inline-value orange">¥{{ Number(r.amount||0).toFixed(2) }}</div>
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
              <span class="header-total orange">¥{{ receivableTotal }}</span>
              <el-button link type="primary" size="small" style="margin-left:8px" @click="router.push('/finance/receivable')">更多</el-button>
            </div>
          </template>
          <div class="inline-list" v-if="receivableList.length">
            <div class="inline-item clickable" v-for="r in receivableList.slice(0,6)" :key="r.id" @click="router.push('/finance/receivable')">
              <div class="inline-name">{{ r.customer_name || '—' }}</div>
              <div class="inline-value orange">¥{{ Number(r.un_pay_amount ?? (Number(r.total_amount||r.amount||0) - Number(r.paid_amount||0))).toFixed(2) }}</div>
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
              <div class="inline-value blue">¥{{ Number(r.total_amount||0).toFixed(2) }}</div>
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
import { getGoodsList, getBomList } from '@/api/goods'
import { applyProcureReturnsToFundRows, applyProcureReturnsToPayReceiptRows, applyProcureReturnsToPayableRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { getPayReceiptSupplierLabel } from '@/utils/supplierLabel'
import { applySaleReturnsToCollectReceiptRows, applySaleReturnsToReceivableRows, buildSaleReturnSettlementRows, normalizeSaleReturnFinanceRows } from '@/utils/saleReturnFinance'
import { buildExpensePayableRows } from '@/utils/expensePayable'
import { buildProcureFeePaidByOrder, getProcureFeeNeedPayAmount, isProcureExtraFeePayment } from '@/utils/procureFeeFinance'
import { fmtDt } from '@/utils/date'
import { findNaiDoufuGoods } from '@/utils/goodsAlias'
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
const contractList = ref<any[]>([])
const profitGoodsList = ref<any[]>([])
const profitInhouseList = ref<any[]>([])
const profitBomList = ref<any[]>([])
const flowVisible = ref(false)
const profitViewMode = ref<'goods' | 'order' | 'month'>('goods')
const chartW = 480

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
    items.push({ type: 'income', source: src, name: r.customer_name || r.contact_name || '—', amount: Number(r.amount || 0), date: fmtDt(r.receipt_date || r.created_at), order_no: r.receipt_no || r.order_sn || '' })
  }
  // 2. 零售单（income）— 真实字段: member_name, pay_amount, order_sn, order_date
  for (const r of retailList.value) {
    if (r.status !== 1) continue
    const amt = Number(r.pay_amount || r.total_amount || 0)
    if (amt <= 0) continue
    items.push({ type: 'income', source: '零售单', name: r.member_name || r.customer_name || '散客', amount: amt, date: fmtDt(r.order_date || r.created_at), order_no: r.order_sn || '' })
  }
  // 3. 会员充值（income）— 真实字段: member_name, amount, recharge_date
  for (const r of rechargeList.value) {
    if (Number(r.amount || 0) <= 0) continue
    items.push({ type: 'income', source: '会员充值', name: r.member_name || '—', amount: Number(r.amount || 0), date: fmtDt(r.recharge_date || r.created_at), order_no: '' })
  }
  // 4. 付款单（expense）— 真实字段: contact_name, supplier_name, contact_type, amount, pay_date
  for (const r of payList.value) {
    if (Number(r.amount || 0) <= 0) continue
    const paySourceMap: Record<string, string> = { supplier: '采购付款', customer: '客户退款', staff: '员工费用', other: '其他支出' }
    items.push({ type: 'expense', source: paySourceMap[r.contact_type] || '付款', name: getPayReceiptSupplierLabel(r, purchasePayList.value, supplierList.value), amount: Number(r.amount || 0), date: fmtDt(r.pay_date || r.created_at), order_no: r.order_sn || '' })
  }
  // 5. 费用单（expense）— 真实字段: name(非type_name), amount, expense_date, order_sn
  // 注意：「单据支出」类型的费用已在 pay_receipt 中以「付款」口径计入，此处跳过避免重复
  for (const r of expenseList.value) {
    if (r.payment_status === 'pending') continue
    if (Number(r.amount || 0) <= 0) continue
    // 如果是「单据支出」产生的费用记录，已在 pay_receipt 中展示，此处跳过
    if (/采购单据支出\s*#\d+/.test(r.remark || '')) continue
    items.push({ type: 'expense', source: r.payment_status === 'paid' ? '费用(已付)' : '费用', name: r.name || '—', amount: Number(r.amount || 0), date: fmtDt(r.expense_date || r.created_at), order_no: r.order_sn || '' })
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
    return Math.max(0, Number(r.un_pay_amount || 0))
  }
  const orderAmount = Number(r?.order_amount || 0)
  const paidAmount = Number(r?.paid_amount || 0)
  return Math.max(0, orderAmount - paidAmount)
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
  saleOutList.value.reduce((s, r) => s + Number(r.total_amount || 0), 0).toFixed(2)
)

const retailTotal = computed(() =>
  retailList.value.filter((r: any) => r.status === 1).reduce((s, r) => s + Number(r.pay_amount || r.total_amount || 0), 0).toFixed(2)
)

// 近7天趋势数据 — 来自 allFlowItems，与 FundFlow.vue 一致
// ── 利润趋势图：按天计算收入/成本/利润 ───────────────────────────────
function profitNum(...values: any[]): number {
  for (const v of values) {
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

function profitText(...values: any[]): string {
  for (const v of values) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

function parseProfitItems(info: any): any[] {
  if (!info) return []
  if (Array.isArray(info)) return info
  if (typeof info === 'object') {
    if (Array.isArray(info.goods_info)) return info.goods_info
    if (Array.isArray(info.items)) return info.items
    return []
  }
  try {
    const parsed = JSON.parse(info)
    return typeof parsed === 'string' ? parseProfitItems(parsed) : parseProfitItems(parsed)
  } catch {
    return []
  }
}

function profitItemQty(item: any): number {
  return profitNum(item?.num, item?.qty, item?.quantity, item?.goods_num, item?.number, item?.count)
}

function profitItemPrice(item: any): number {
  return profitNum(item?.price, item?.sell_price, item?.sale_price, item?.unit_price, item?.retail_price, item?.amount_price)
}

function profitItemCost(item: any): number {
  return profitNum(item?.cost_price, item?.cost, item?.costPrice, item?.purchase_price, item?.in_price, item?.avg_price)
}

function profitItemName(item: any): string {
  return profitText(item?.goods_name, item?.name, item?.product_name, item?.title)
}

function profitItemSn(item: any): string {
  return profitText(item?.goods_sn, item?.sn, item?.goods_code, item?.code, item?.barcode)
}

const profitCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of profitGoodsList.value) m[g.id] = profitNum(g.cost_price, g.purchase_price, g.avg_price, g.in_price)
  const snTC: Record<string, number> = {}, snTQ: Record<string, number> = {}
  for (const ih of profitInhouseList.value) {
    if (Number(ih.status) !== 1) continue
    try { for (const item of parseProfitItems(ih.goods_info)) {
      const sn = profitItemSn(item); if (!sn) continue
      const q = profitItemQty(item), p = profitNum(item.price, item.price_no_tax, item.cost_price, item.in_price, item.avg_price)
      if (q>0&&p>0) { snTC[sn]=(snTC[sn]||0)+q*p; snTQ[sn]=(snTQ[sn]||0)+q }
    }} catch {}
  }
  const snAvg: Record<string,number> = {}
  for (const sn in snTQ) if (snTQ[sn]>0) snAvg[sn]=snTC[sn]/snTQ[sn]
  const bomMap: Record<number,{sn:string;num:number}[]> = {}
  for (const b of profitBomList.value) { const gid=Number(b.goods_id||0); if(!gid)continue; if(!bomMap[gid])bomMap[gid]=[]; bomMap[gid].push({sn:profitText(b.material_sn,b.material_goods_sn,b.goods_sn,b.sn),num:profitItemQty(b)}) }
  for (const gid in bomMap) { const g=profitGoodsList.value.find(x=>x.id===Number(gid)); if(!g?.goods_sn)continue; let bc=0; for(const mt of bomMap[Number(gid)])bc+=mt.num*(snAvg[mt.sn]||0); if(bc>0){snTC[g.goods_sn]=bc;snTQ[g.goods_sn]=1} }
  for (const g of profitGoodsList.value) { const sn=g.goods_sn; if(sn&&snTQ[sn]>0)m[g.id]=snTC[sn]/snTQ[sn] }
  return m
})

const profitHasBomSet = computed(() => {
  const s = new Set<number>()
  for (const b of profitBomList.value) {
    if (b.goods_id) s.add(Number(b.goods_id))
  }
  return s
})

function getDateKey(dateStr: string) { return (dateStr || '').slice(0, 10) }

function myProfitFreight(row: any): number {
  const f = Number(row.freight_amount || 0)
  if (!f) return 0
  if (row.freight_bearer === 'seller') return f
  if (row.freight_bearer === 'half') return f / 2
  return 0
}

const trendDays = computed(() => {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(`${d.getMonth()+1}/${d.getDate()}`)
  }
  return days
})

const profitTrendData = computed(() => {
  const revenueMap: Record<string,number> = {}
  const costMap: Record<string,number> = {}
  for (let i = 6; i >= 0; i--) {
    const k = new Date(Date.now() - i*86400000).toISOString().slice(0,10)
    revenueMap[k] = 0; costMap[k] = 0
  }
  for (const c of contractList.value) {
    const k = getDateKey(c.contract_date || c.create_time || '')
    if (revenueMap[k] === undefined) continue
    revenueMap[k] += Number(c.after_discount || c.total_amount || 0)
    for (const g of parseProfitItems(c.goods_info)) costMap[k] += profitItemQty(g) * getItemUnitCostFromMap(g).unitCost
    costMap[k] += myProfitFreight(c)
  }
  for (const r of retailList.value) {
    if (r.status !== 1) continue
    const k = getDateKey(r.order_date || r.create_time || '')
    if (revenueMap[k] === undefined) continue
    let itemRevenue = 0
    try { for (const g of parseProfitItems(r.goods_info)) {
      const q = profitItemQty(g)
      itemRevenue += q * profitItemPrice(g)
      costMap[k] += q * getItemUnitCostFromMap(g).unitCost
    }} catch {}
    revenueMap[k] += itemRevenue > 0 ? itemRevenue : Number(r.pay_amount ?? r.total_amount ?? r.after_discount ?? 0)
  }
  for (const e of expenseList.value) {
    const k = getDateKey(e.expense_date || e.create_time || '')
    if (costMap[k] !== undefined) costMap[k] += Number(e.amount || 0)
  }
  const revVals = Object.values(revenueMap)
  const costVals = Object.values(costMap)
  const profitVals = revVals.map((r, i) => r - costVals[i])
  return { revVals, costVals, profitVals }
})

const trendRevenue = computed(() => {
  const { revVals, costVals } = profitTrendData.value
  const max = Math.max(...revVals, ...costVals, 1)
  return revVals.map(v => v / max)
})
const trendCost = computed(() => {
  const { revVals, costVals } = profitTrendData.value
  const max = Math.max(...revVals, ...costVals, 1)
  return costVals.map(v => v / max)
})
const trendProfit = computed(() => {
  const { profitVals } = profitTrendData.value
  const absMax = Math.max(...profitVals.map(Math.abs), 1)
  return profitVals.map(v => v / absMax)
})

// ═══════════ 利润分析 computed ═══════════
function profitFmt(v: number): string {
  return isNaN(v) ? '0.00' : v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getUnitCostFromMap(goodsId: number): { unitCost: number; costSource: string } {
  const c = profitCostMap.value[goodsId] || 0
  const hasBom = profitHasBomSet.value.has(goodsId)
  return {
    unitCost: c,
    costSource: c > 0 ? `成本 ¥${c.toFixed(2)}${hasBom ? '（含BOM）' : ''}` : '未设置成本价',
  }
}

function resolveProfitGoodsId(item: any): number {
  const id = Number(item?.goods_id || item?.id || item?.product_id || item?.shop_goods_id || 0)
  const canonical = findNaiDoufuGoods(item, profitGoodsList.value)
  if (canonical?.id) return Number(canonical.id)
  if (id > 0) return id
  const sn = profitItemSn(item)
  const name = profitItemName(item)
  const matched = profitGoodsList.value.find(g =>
    (sn && String(g.goods_sn || '').trim() === sn) ||
    (sn && String(g.barcode || '').trim() === sn) ||
    (name && String(g.goods_name || '').trim() === name)
  )
  return Number(matched?.id || 0)
}

function getItemUnitCostFromMap(item: any): { unitCost: number; costSource: string } {
  const goodsId = resolveProfitGoodsId(item)
  const byId = getUnitCostFromMap(goodsId)
  if (profitHasBomSet.value.has(goodsId) && byId.unitCost > 0) return byId
  const direct = profitItemCost(item)
  if (direct > 0) return { unitCost: direct, costSource: `单据成本 ¥${direct.toFixed(2)}` }
  if (byId.unitCost > 0) return byId
  return byId
}

// 按单品
const profitByGoods = computed(() => {
  const map: Record<string, any> = {}
  const add = (goodsInfo: any, source: string, discountRatio = 1, fallbackAmount = 0) => {
    if (!goodsInfo) return
    const items = parseProfitItems(goodsInfo)
    if (!items.length) return
    const rawTotal = items.reduce((s, g) => s + profitItemQty(g) * profitItemPrice(g), 0)
    const totalQty = items.reduce((s, g) => s + profitItemQty(g), 0)
    try {
      for (const g of items) {
        const goodsId = resolveProfitGoodsId(g)
        const goodsName = profitGoodsList.value.find(x => x.id === goodsId)?.goods_name || profitItemName(g) || '-'
        const key = `${goodsId || profitItemSn(g) || goodsName}_${source}`
        const { unitCost, costSource } = getItemUnitCostFromMap(g)
        if (!map[key]) map[key] = { goods_name: goodsName, goods_id: goodsId, num: 0, sale_amount: 0, unit_cost: unitCost, cost_source: costSource, source }
        const qty = profitItemQty(g)
        const price = rawTotal > 0 ? profitItemPrice(g) * discountRatio : (totalQty > 0 ? fallbackAmount / totalQty : 0)
        map[key].num += qty
        map[key].sale_amount += qty * price
      }
    } catch {}
  }
  for (const c of contractList.value) {
    const actualAmount = Number(c.after_discount || c.total_amount || 0)
    let rawTotal = 0
    for (const g of parseProfitItems(c.goods_info)) rawTotal += profitItemQty(g) * profitItemPrice(g)
    add(c.goods_info, '合同', rawTotal > 0 ? actualAmount / rawTotal : 1, actualAmount)
  }
  for (const r of retailList.value) { if (r.status !== 1) continue; add(r.goods_info, '零售', 1, Number(r.pay_amount ?? r.total_amount ?? r.after_discount ?? 0)) }
  return Object.values(map).map((r: any) => ({
    ...r,
    cost_amount: r.num * r.unit_cost,
    profit: r.sale_amount - r.num * r.unit_cost,
    profit_rate: r.sale_amount > 0 ? ((r.sale_amount - r.num * r.unit_cost) / r.sale_amount * 100) : 0,
  })).sort((a: any, b: any) => b.profit - a.profit)
})

// 按单据
const profitByOrder = computed(() => {
  const result: any[] = []
  for (const c of contractList.value) {
    let cost_amount = 0
    for (const g of parseProfitItems(c.goods_info)) cost_amount += profitItemQty(g) * getItemUnitCostFromMap(g).unitCost
    const sale_amount = Number(c.after_discount || c.total_amount || 0)
    const freight = myProfitFreight(c)
    const profit = sale_amount - cost_amount
    const net_profit = profit - freight
    result.push({
      source: '合同',
      order_no: ((c.remark || '').match(/^\[NO:([^\]]+)\]/) || [])[1] || c.order_sn || c.contract_no || `HT${String(c.id).padStart(4, '0')}`,
      customer_name: c.customer_name || '—',
      order_date: fmtDt(c.contract_date || c.create_time),
      sale_amount, cost_amount, profit, freight, net_profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (net_profit / sale_amount * 100) : 0,
    })
  }
  for (const r of retailList.value) {
    if (r.status !== 1) continue
    let sale_amount = 0, cost_amount = 0
    for (const g of parseProfitItems(r.goods_info)) {
      const q = profitItemQty(g)
      sale_amount += q * profitItemPrice(g)
      cost_amount += q * getItemUnitCostFromMap(g).unitCost
    }
    if (sale_amount <= 0) {
      sale_amount = Number(r.pay_amount ?? r.total_amount ?? r.after_discount ?? 0)
    }
    const profit = sale_amount - cost_amount
    result.push({
      source: '零售', order_no: r.order_sn || r.order_no || r.id,
      customer_name: r.customer_name || r.member_name || '散客',
      order_date: fmtDt(r.order_date || r.create_time),
      sale_amount, cost_amount, profit, freight: 0, net_profit: profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
    })
  }
  return result.sort((a, b) => b.profit - a.profit)
})

// 按月份
const profitByMonth = computed(() => {
  const map: Record<string, { month: string; revenue: number; cost: number; expense: number; freight: number }> = {}
  const ensure = (m: string) => { if (!map[m]) map[m] = { month: m, revenue: 0, cost: 0, expense: 0, freight: 0 } }
  for (const c of contractList.value) {
    const m = (c.contract_date || c.create_time || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].revenue += Number(c.after_discount || c.total_amount || 0)
    for (const g of parseProfitItems(c.goods_info)) map[m].cost += profitItemQty(g) * getItemUnitCostFromMap(g).unitCost
    map[m].freight += myProfitFreight(c)
  }
  for (const r of retailList.value) {
    if (r.status !== 1) continue
    const m = (r.order_date || r.create_time || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    let itemRevenue = 0
    for (const g of parseProfitItems(r.goods_info)) {
      const q = profitItemQty(g)
      itemRevenue += q * profitItemPrice(g)
      map[m].cost += q * getItemUnitCostFromMap(g).unitCost
    }
    map[m].revenue += itemRevenue > 0 ? itemRevenue : Number(r.pay_amount ?? r.total_amount ?? r.after_discount ?? 0)
  }
  for (const e of expenseList.value) {
    const m = (e.expense_date || e.create_time || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].expense += Number(e.amount || 0)
  }
  return Object.values(map).map(r => {
    const grossProfit = r.revenue - r.cost
    const grossRate = r.revenue > 0 ? (grossProfit / r.revenue * 100) : 0
    const netProfit = grossProfit - r.expense - r.freight
    const netRate = r.revenue > 0 ? (netProfit / r.revenue * 100) : 0
    return { ...r, grossProfit, grossRate, netProfit, netRate }
  }).sort((a, b) => b.month.localeCompare(a.month))
})

// 汇总
const profitSummary = computed(() => {
  const revenue = profitByMonth.value.reduce((s, r) => s + r.revenue, 0)
  const cost = profitByMonth.value.reduce((s, r) => s + r.cost, 0)
  const expense = profitByMonth.value.reduce((s, r) => s + r.expense, 0)
  const freight = profitByMonth.value.reduce((s, r) => s + r.freight, 0)
  const grossProfit = revenue - cost
  const netProfit = grossProfit - expense - freight
  return {
    revenue, cost, expense, freight, grossProfit, netProfit,
    grossRate: revenue > 0 ? (grossProfit / revenue * 100) : 0,
    netRate: revenue > 0 ? (netProfit / revenue * 100) : 0,
  }
})

function getMonthSummary() {
  const t = profitSummary.value
  return ['合计', `¥${profitFmt(t.revenue)}`, `¥${profitFmt(t.cost)}`,
    `${t.grossProfit >= 0 ? '+' : ''}¥${profitFmt(t.grossProfit)}`, `${t.grossRate.toFixed(1)}%`,
    `¥${profitFmt(t.expense)}`, `¥${profitFmt(t.freight)}`,
    `${t.netProfit >= 0 ? '+' : ''}¥${profitFmt(t.netProfit)}`, `${t.netRate.toFixed(1)}%`]
}

const summaryCards = computed(() => {
  const income = Number(collectTotal.value)
  const expense = Number(payTotal.value)
  const balance = fundTotal.value
  return [
  { key: 'fund', label: '资金余额', value: balance, sub: `= 收入 ¥${income.toFixed(2)} − 支出 ¥${expense.toFixed(2)}`, color: '#0071e3', bg: 'rgba(0,113,227,0.08)', icon: 'Wallet', route: '/finance/fund-flow' },
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
      http.get('/stock/SaleOutOrder/index', { params: { list_rows: 50 } }),
      http.get('/retail/order/index', { params: { list_rows: 200 } }),
      getExpenseList({ list_rows: 1000 }),
      http.get('/retail/recharge/index', { params: { list_rows: 1000 } }),
      http.get('/shop/ShopCustomer/index', { params: { list_rows: 500 } }),
      http.get('/procure/supplier/index', { params: { list_rows: 500 } }),
      http.get('/procure/ProcureReturn/index', { params: { status: 1, list_rows: 1000 } }),
      http.get('/stock/SaleReturnOrder/index', { params: { status: 1, list_rows: 1000 } }),
      getContractList({ list_rows: 1000 }),
      getGoodsList({ list_rows: 3000 }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
      getBomList({ list_rows: 500 }),
    ])
    const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
    const [fundRes, prepayRes, collectRes, payRes, purchaseRes, saleOutRes, retailRes, expenseRes, rechargeRes, clientRes, supplierRes, returnRes, saleReturnRes, contractRes, pGoodsRes, pInhouseRes, pBomRes] = settled.map((_,i) => ok(i))
    const rawFundList = fundRes.data?.rows ?? fundRes.data?.list ?? []
    const fundNameMap = new Map<number, string>(rawFundList.map((row: any) => [Number(row.id), String(row.name || '')]))
    prepayList.value = prepayRes.data?.rows ?? prepayRes.data?.list ?? []
    const rawCollectList = collectRes.data?.rows ?? collectRes.data?.list ?? []
    const rawPayList = payRes.data?.rows ?? payRes.data?.list ?? []
    collectList.value = rawCollectList
    payList.value = rawPayList
    const rawReceivableList = (contractRes.data?.rows ?? contractRes.data?.list ?? [])
      .filter(isEffectiveSaleContract)
      .map((r: any) => ({
        ...r,
        un_pay_amount: Math.max(0, Number(r.total_amount || 0) - Number(r.pay_amount || 0)),
        order_sn: r.order_sn || r.order_no || '',
        out_date: r.order_date || r.created_at,
      }))
      .filter((r: any) => r.un_pay_amount > 0)
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
      const dynamicBalance = Math.round((income - expense) * 100) / 100
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
      const orderSn = String(r.order_sn || '').trim()
      const supplierName = String(r.supplier_name || r.contact_name || '').trim()
      let matched = false
      // 方式2：order_id 直接匹配
      if (Number(r.order_id)) {
        const id = Number(r.order_id); procurePaidById[id] = (procurePaidById[id] || 0) + amt; matched = true
      }
      // 方式3：备注 "采购单付款 #ID"（单ID直接匹配单据，多ID按供应商维度存储）
      const m1all = [...String(r.remark || '').matchAll(/采购单(?:自动)?付款\s+#(\d+)/g)]
      if (m1all.length === 1) {
        const id = Number(m1all[0][1]); procurePaidById[id] = (procurePaidById[id] || 0) + amt; matched = true
      } else if (m1all.length > 1) {
        if (supplierName) procurePaidBySup[supplierName] = (procurePaidBySup[supplierName] || 0) + amt
        matched = true
      }
      // 方式4：备注 "采购单XXXXX审核自动生成" 提取单号
      const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
      if (m2) { const sn = m2[1].trim(); procurePaidBySn[sn] = (procurePaidBySn[sn] || 0) + amt; matched = true }
      // 方式1：order_sn@@supplier_name 精确匹配（兜底，付款单的 order_sn 可能对应采购单的 order_no）
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
      const paidAmt = (procurePaidById[o.id] || 0)
        + (procurePaidBySn[oSn] || procurePaidBySn[oNo] || 0)
        + (procurePaidByKey[`${oSn}@@${supName}`] || procurePaidByKey[`${oNo}@@${supName}`] || 0)
      const feeNeedPay = getProcureFeeNeedPayAmount(o)
      const feePaid = procureFeePaidById[o.id] || 0
      const feeUnpaid = Math.max(0, feeNeedPay - feePaid)
      s.order_amount += orderAmt + feeNeedPay
      s.paid_amount += paidAmt + feePaid
      s.un_pay_amount += Math.max(0, orderAmt - paidAmt) + feeUnpaid
    }
    // 多ID付款：按供应商维度补充已付金额
    for (const s of supplierPayMap.values()) {
      const extra = procurePaidBySup[String(s.supplier_name || '').trim()] || 0
      if (extra > 0) {
        s.paid_amount += extra
        s.un_pay_amount = Math.max(0, s.un_pay_amount - extra)
      }
    }
    payableList.value = [
      ...applyProcureReturnsToPayableRows(Array.from(supplierPayMap.values()), procureReturnFinanceList.value),
      ...buildExpensePayableRows(expenseRes.data?.rows ?? expenseRes.data?.list ?? []),
    ]
    receivableList.value = rawReceivableList
    adjustedCollectList.value = applySaleReturnsToCollectReceiptRows(collectList.value, normalizedSaleReturns, rawReceivableList)
    purchasePayList.value = (purchaseRes.data?.rows ?? purchaseRes.data?.list ?? []).filter((r: any) => Number(r.status) === 1)
    saleOutList.value = (saleOutRes.data?.rows ?? saleOutRes.data?.list ?? []).filter((r: any) => Number(r.status) === 1)
    retailList.value = retailRes.data?.rows ?? retailRes.data?.list ?? []
    expenseList.value = expenseRes.data?.rows ?? expenseRes.data?.list ?? []
    rechargeList.value = rechargeRes.data?.rows ?? rechargeRes.data?.list ?? []
    clientList.value = clientRes.data?.rows ?? clientRes.data?.list ?? []
    supplierList.value = supplierRes.data?.rows ?? supplierRes.data?.list ?? []
    contractList.value = contractRes.data?.rows ?? contractRes.data?.list ?? []
    profitGoodsList.value = pGoodsRes.data?.rows ?? pGoodsRes.data?.list ?? []
    profitInhouseList.value = (pInhouseRes.data?.rows ?? pInhouseRes.data?.list ?? []).filter((r: any) => r.status === 1)
    profitBomList.value = pBomRes.data?.rows ?? pBomRes.data?.list ?? []

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
.trend-chart { padding: 4px 0 0; }
.trend-legend { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 12px; color: var(--dim); }
.legend-dot { width: 10px; height: 3px; border-radius: 2px; display: inline-block; }
.legend-dot.income { background: #16a34a; }
.legend-dot.expense { background: #dc2626; }

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
.chart-axis-label { fill: var(--dim); }

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
}
</style>
// cache-bust: 1776093932
