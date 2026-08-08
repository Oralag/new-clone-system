<template>
  <div class="page-container" v-loading="loading">
    <div class="toolbar no-print">
      <el-button :icon="ArrowLeft" @click="router.back()">{{ t('common.back') }}</el-button>
      <el-tag v-if="row" :type="(STATEMENT_STATUS_TYPE[Number(row.status)] as any) || 'info'">
        {{ statusText(row.status) }}
      </el-tag>
      <div style="margin-left:auto">
        <el-button type="primary" :icon="Printer" @click="handlePrint">{{ t('finance.statement.print') }}</el-button>
      </div>
    </div>

    <div v-if="row" ref="sheetRef" class="sheet">
      <h1 class="sheet-title">{{ t('finance.statement.printTitle') }}</h1>

      <div class="sheet-meta">
        <div><label>{{ t('finance.statement.printPartner') }}：</label><b>{{ row.customer_name }}</b>
          <el-tag v-if="row.partner_type === 'both'" size="small" type="warning" class="no-print" style="margin-left:6px">
            {{ t('finance.statement.typeBoth') }}
          </el-tag>
        </div>
        <div><label>{{ t('finance.statement.statementNo') }}：</label><b>{{ row.statement_no }}</b></div>
        <div><label>{{ t('finance.statement.printPeriod') }}：</label><b>{{ dateOnly(row.start_date) }} ~ {{ dateOnly(row.end_date) }}</b></div>
      </div>

      <!-- 三段式汇总 -->
      <table class="sum-table">
        <thead>
          <tr>
            <th></th>
            <th>{{ t('finance.statement.openingBalance') }}</th>
            <th>{{ t('finance.statement.recvAmount') }} / {{ t('finance.statement.payAmount') }}</th>
            <th>{{ t('finance.statement.collectedAmount') }} / {{ t('finance.statement.paidAmount') }}</th>
            <th>{{ t('finance.statement.printClosing') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="side-label recv">{{ t('finance.statement.printRecvSide') }}</td>
            <td>{{ money(row.opening_recv) }}</td>
            <td>{{ money(row.recv_amount) }}</td>
            <td>{{ money(row.collected_amount) }}</td>
            <td><b>{{ money(row.closing_recv) }}</b></td>
          </tr>
          <tr v-if="row.partner_type === 'both'">
            <td class="side-label pay">{{ t('finance.statement.printPaySide') }}</td>
            <td>{{ money(row.opening_pay) }}</td>
            <td>{{ money(row.pay_amount) }}</td>
            <td>{{ money(row.paid_amount) }}</td>
            <td><b>{{ money(row.closing_pay) }}</b></td>
          </tr>
          <tr v-if="row.partner_type === 'both'" class="net-row">
            <td colspan="4">{{ t('finance.statement.netAmount') }}（{{ t('finance.statement.closingRecv') }} − {{ t('finance.statement.closingPay') }}）</td>
            <td><b :class="Number(row.net_amount) >= 0 ? 'net-pos' : 'net-neg'">{{ money(row.net_amount) }}</b></td>
          </tr>
        </tbody>
      </table>
      <p v-if="row.partner_type === 'both'" class="settle-tip">{{ t('finance.statement.printFullSettleTip') }}</p>

      <!-- 明细 -->
      <table class="detail-table">
        <thead>
          <tr>
            <th style="width:92px">{{ t('finance.statement.date') }}</th>
            <th style="width:84px">{{ t('finance.statement.docType') }}</th>
            <th style="width:130px">{{ t('finance.statement.docNo') }}</th>
            <th>{{ t('finance.statement.summary') }}</th>
            <th style="width:88px" class="num">{{ t('finance.statement.debit') }}</th>
            <th style="width:88px" class="num">{{ t('finance.statement.credit') }}</th>
            <th style="width:78px" class="num">{{ t('finance.statement.offset') }}</th>
            <th style="width:78px" class="num">{{ t('finance.statement.collected') }}</th>
            <th style="width:78px" class="num">{{ t('finance.statement.paid') }}</th>
            <th style="width:92px" class="num">{{ t('finance.statement.balance') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="opening-row">
            <td colspan="9">{{ t('finance.statement.openingBalance') }}</td>
            <td class="num">{{ money(row.opening_balance) }}</td>
          </tr>
          <tr v-for="(l, i) in linesWithBalance" :key="i">
            <td>{{ l.date }}</td>
            <td><span :class="['dot', l.side]"></span>{{ l.type }}</td>
            <td>{{ l.order_sn }}</td>
            <td>{{ l.summary }}</td>
            <td class="num">{{ l.debit ? money(l.debit) : '' }}</td>
            <td class="num">{{ l.credit ? money(l.credit) : '' }}</td>
            <td class="num">{{ l.offset ? money(l.offset) : '' }}</td>
            <td class="num">{{ l.collected ? money(l.collected) : '' }}</td>
            <td class="num">{{ l.paid ? money(l.paid) : '' }}</td>
            <td class="num">{{ money(l.balance) }}</td>
          </tr>
          <tr v-if="!linesWithBalance.length">
            <td colspan="10" class="empty">{{ t('finance.statement.noDetail') }}</td>
          </tr>
          <tr class="total-row">
            <td colspan="4">{{ t('finance.statement.printSubtotal') }}</td>
            <td class="num">{{ money(totals.debit) }}</td>
            <td class="num">{{ money(totals.credit) }}</td>
            <td class="num">{{ money(totals.offset) }}</td>
            <td class="num">{{ money(totals.collected) }}</td>
            <td class="num">{{ money(totals.paid) }}</td>
            <td class="num"><b>{{ money(row.net_amount) }}</b></td>
          </tr>
        </tbody>
      </table>

      <div v-if="row.remark" class="sheet-remark">
        <label>{{ t('finance.statement.remark') }}：</label>{{ row.remark }}
      </div>
      <div v-if="row.confirm_remark" class="sheet-remark">
        <label>{{ t('finance.statement.confirmRemark') }}：</label>{{ row.confirm_remark }}
      </div>

      <div class="sign-area">
        <div class="sign-box">
          <div class="sign-label">{{ t('finance.statement.printSignSelf') }}</div>
          <div class="sign-line"></div>
          <div class="sign-date">{{ t('finance.statement.printSignDate') }}</div>
        </div>
        <div class="sign-box">
          <div class="sign-label">{{ t('finance.statement.printSignPartner') }}</div>
          <div class="sign-line"></div>
          <div class="sign-date">{{ t('finance.statement.printSignDate') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Printer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fmtDt } from '@/utils/date'
import { getStatementDetail } from '@/api/finance'
import {
  withRunningBalance, STATEMENT_STATUS_TYPE, statementStatusKey, type StatementLine,
} from '@/utils/statementCalc'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const row = ref<any>(null)
const sheetRef = ref<HTMLElement>()

const lines = computed<StatementLine[]>(() => {
  const d = row.value?.detail
  if (!d) return []
  try {
    const parsed = typeof d === 'string' ? JSON.parse(d || '[]') : d
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
})

const linesWithBalance = computed(() =>
  withRunningBalance(lines.value, Number(row.value?.opening_recv || 0), Number(row.value?.opening_pay || 0)))

const totals = computed(() => {
  const acc = { debit: 0, credit: 0, offset: 0, collected: 0, paid: 0 }
  for (const l of lines.value) {
    acc.debit += Number(l.debit || 0)
    acc.credit += Number(l.credit || 0)
    acc.offset += Number(l.offset || 0)
    acc.collected += Number(l.collected || 0)
    acc.paid += Number(l.paid || 0)
  }
  return acc
})

function money(v: any) {
  return Number(v || 0).toFixed(2)
}

/** 状态文案（走 i18n，中英文界面都正确） */
function statusText(status: any) {
  const key = statementStatusKey(status)
  return key ? t(key) : '-'
}

/** 只取日期部分：DATE 字段按 UTC 零点存，fmtDt 转本地时区会多出 08:00 */
function dateOnly(v: any) {
  return fmtDt(v).slice(0, 10)
}

// 与项目既有做法一致（Contract.vue）：另开窗口打印，避免 AdminLayout 侧边栏混进纸面
function handlePrint() {
  const html = sheetRef.value?.outerHTML
  if (!html) return
  const w = window.open('', '_blank', 'width=1100,height=800')
  if (!w) return ElMessage.warning(t('finance.statement.opFailed'))
  w.document.write(`<!doctype html><html><head><meta charset="utf-8">
  <title>${row.value?.statement_no || ''}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;padding:16px 20px;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#000}
    .no-print{display:none!important}
    .sheet-title{text-align:center;font-size:22px;font-weight:700;letter-spacing:4px;margin:0 0 18px}
    .sheet-meta{display:flex;flex-wrap:wrap;gap:6px 32px;font-size:13px;margin-bottom:14px}
    .sheet-meta label{color:#666}
    table{width:100%;border-collapse:collapse;font-size:12.5px}
    .sum-table{margin-bottom:10px}
    .sum-table th,.sum-table td,.detail-table th,.detail-table td{border:1px solid #d0d0d0;padding:6px 8px;text-align:right}
    .sum-table th{background:#f5f7fa;text-align:center;font-weight:600}
    .sum-table .side-label{text-align:left;font-weight:600}
    .sum-table .side-label.recv{color:#0a7d3e}
    .sum-table .side-label.pay{color:#b7791f}
    .sum-table .net-row td:first-child{text-align:right;background:#fafafa}
    .settle-tip{font-size:12px;color:#888;margin:0 0 14px}
    .detail-table th{background:#f5f7fa;text-align:left;font-weight:600}
    .detail-table th.num,.detail-table td.num{text-align:right;font-variant-numeric:tabular-nums}
    .detail-table td{text-align:left}
    .detail-table .opening-row td,.detail-table .total-row td{background:#fafafa;font-weight:600}
    .detail-table .empty{text-align:center;color:#999;padding:20px}
    .dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;vertical-align:middle}
    .dot.recv{background:#0a7d3e}
    .dot.pay{background:#b7791f}
    .net-pos{color:#0a7d3e}
    .net-neg{color:#c0392b}
    .sheet-remark{font-size:12.5px;margin-top:10px}
    .sheet-remark label{color:#666}
    .sign-area{display:flex;gap:60px;margin-top:48px}
    .sign-box{flex:1;font-size:13px}
    .sign-label{color:#666;margin-bottom:34px}
    .sign-line{border-bottom:1px solid #333;margin-bottom:8px}
    .sign-date{color:#666}
    @page{margin:10mm;size:A4 landscape}
    @media print{
      .detail-table tr{page-break-inside:avoid}
      .sign-area{page-break-inside:avoid}
    }
  </style></head><body>${html}</body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}

async function load() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const res = await getStatementDetail(id)
    row.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.message || t('finance.statement.opFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }

.sheet {
  background: #fff;
  color: #000;
  padding: 28px 32px;
  border-radius: 8px;
  max-width: 1100px;
  margin: 0 auto;
}
.sheet-title { text-align: center; font-size: 22px; font-weight: 700; letter-spacing: 4px; margin: 0 0 18px; }
.sheet-meta { display: flex; flex-wrap: wrap; gap: 6px 32px; font-size: 13px; margin-bottom: 14px; }
.sheet-meta label { color: #666; }

table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.sum-table { margin-bottom: 10px; }
.sum-table th, .sum-table td, .detail-table th, .detail-table td {
  border: 1px solid #d0d0d0; padding: 6px 8px; text-align: right;
}
.sum-table th { background: #f5f7fa; text-align: center; font-weight: 600; }
.sum-table .side-label { text-align: left; font-weight: 600; }
.sum-table .side-label.recv { color: #0a7d3e; }
.sum-table .side-label.pay { color: #b7791f; }
.sum-table .net-row td:first-child { text-align: right; background: #fafafa; }

.settle-tip { font-size: 12px; color: #888; margin: 0 0 14px; }

.detail-table th { background: #f5f7fa; text-align: left; font-weight: 600; }
.detail-table th.num, .detail-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
.detail-table td { text-align: left; }
.detail-table .opening-row td, .detail-table .total-row td { background: #fafafa; font-weight: 600; }
.detail-table .empty { text-align: center; color: #999; padding: 20px; }

.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.dot.recv { background: #0a7d3e; }
.dot.pay { background: #b7791f; }

.net-pos { color: #0a7d3e; }
.net-neg { color: #c0392b; }

.sheet-remark { font-size: 12.5px; margin-top: 10px; }
.sheet-remark label { color: #666; }

.sign-area { display: flex; gap: 60px; margin-top: 48px; }
.sign-box { flex: 1; font-size: 13px; }
.sign-label { color: #666; margin-bottom: 34px; }
.sign-line { border-bottom: 1px solid #333; margin-bottom: 8px; }
.sign-date { color: #666; }

@media print {
  .no-print { display: none !important; }
  .sheet { max-width: none; padding: 0; border-radius: 0; }
  .detail-table { page-break-inside: auto; }
  .detail-table tr { page-break-inside: avoid; }
  .sign-area { page-break-inside: avoid; }
}
</style>
