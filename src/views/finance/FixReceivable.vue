<template>
  <div style="max-width: 800px; margin: 40px auto; padding: 24px;">
    <h2>{{ t('finance.fixReceivable.pageTitle') }}</h2>
    <p style="color: #909399; font-size: 14px; line-height: 1.8;">
      {{ t('finance.fixReceivable.pageDesc') }}
    </p>
    <div style="margin-top: 16px; display: flex; gap: 12px;">
      <el-button type="primary" :loading="running" @click="run">{{ t('finance.fixReceivable.startFix') }}</el-button>
      <el-button @click="logs = []">{{ t('finance.fixReceivable.clearLogs') }}</el-button>
    </div>

    <div v-if="summary" style="margin-top: 16px; padding: 12px 16px; background: #f0f9eb; border-radius: 10px; font-size: 13px;">
      {{ t('finance.fixReceivable.summaryText') }} <b>{{ summary.total }}</b> {{ t('finance.fixReceivable.summaryScanned') }} <b>{{ summary.need }}</b> {{ t('finance.fixReceivable.summaryNeed') }}
      {{ t('finance.fixReceivable.summarySuccess') }} <span style="color: #67c23a">{{ summary.ok }}</span>，
      {{ t('finance.fixReceivable.summaryFail') }} <span style="color: #f56c6c">{{ summary.fail }}</span>
    </div>

    <div style="margin-top: 20px; background: #1a1a2e; border-radius: 12px; padding: 16px; max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 12px;">
      <div v-if="logs.length === 0" style="color: #666;">{{ t('finance.fixReceivable.noLogs') }}</div>
      <div v-for="(log, i) in logs" :key="i" style="margin-bottom: 4px;">
        <span style="color: #555;">{{ log.time }}</span>
        <span :style="{ color: log.type === 'success' ? '#67c23a' : log.type === 'error' ? '#f56c6c' : '#aaa' }">
          &nbsp;{{ log.msg }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/api/http'

const { t } = useI18n()
const running = ref(false)
const logs = ref<{ type: string; msg: string; time: string }[]>([])
const summary = ref<{ total: number; need: number; ok: number; fail: number } | null>(null)

function log(type: string, msg: string) {
  logs.value.unshift({ type, msg, time: new Date().toLocaleTimeString() })
}

async function run() {
  running.value = true
  summary.value = null
  logs.value = []
  let total = 0, need = 0, ok = 0, fail = 0
  try {
    log('info', '正在拉取已审核销售出库单...')
    const saleRes = await axios.get('/stock/SaleOutOrder/index', { params: { status: 1, list_rows: 2000, page: 1 } })
    const saleList = saleRes.data?.rows ?? []
    total = saleList.length
    log('info', `共找到 ${total} 条已审核出库单，筛选 receive_amount > 0 ...`)

    const filtered = saleList.filter((r: any) => Number(r.receive_amount) > 0)
    log('info', `其中 receive_amount > 0 的有 ${filtered.length} 条`)

    if (filtered.length === 0) {
      log('success', '无需修复')
      summary.value = { total, need: 0, ok: 0, fail: 0 }
      return
    }

    log('info', '正在拉取现有收款单...')
    const receiptRes = await axios.get('/finance/CollectReceipt/index', { params: { list_rows: 5000, page: 1 } })
    const receipts = receiptRes.data?.rows ?? []
    const existSet = new Set(receipts.map((r: any) => r.order_sn).filter(Boolean))
    log('info', `已有收款单 ${receipts.length} 条`)

    const fundRes = await axios.get('/finance/Fund/index', { params: { list_rows: 500 } })
    const funds: any[] = fundRes.data?.rows ?? []

    for (const row of filtered) {
      const orderSn = row.order_no ?? ''
      if (existSet.has(orderSn)) {
        log('info', `跳过 ${orderSn}（已存在收款单）`)
        continue
      }
      need++
      try {
        const fundId = Number(row.receive_fund_id ?? 0)
        await axios.post('/finance/CollectReceipt/add', {
          customer_id: row.customer_id ?? 0,
          customer_name: row.customer_name ?? '',
          amount: Number(row.receive_amount),
          fund_id: fundId,
          fund_name: row.receive_account ?? '',
          receipt_date: row.out_date ?? new Date().toISOString().slice(0, 10),
          order_sn: orderSn,
          remark: `[补录] 销售出库单 ${orderSn} 本次收款`,
        })
        if (fundId > 0) {
          const fund = funds.find((f: any) => f.id === fundId)
          if (fund) {
            const newBalance = Number(fund.balance || 0) + Number(row.receive_amount)
            await axios.post('/finance/Fund/edit', { id: fund.id, balance: newBalance })
            fund.balance = newBalance
          }
        }
        ok++
        log('success', `✓ ${orderSn}  客户：${row.customer_name}  金额：${row.receive_amount}`)
      } catch (e: any) {
        fail++
        log('error', `✗ ${row.order_no}  失败：${e?.message ?? '未知错误'}`)
      }
    }
    summary.value = { total, need, ok, fail }
  } catch (e: any) {
    log('error', `执行中断：${e?.message}`)
  } finally {
    running.value = false
  }
}
</script>
