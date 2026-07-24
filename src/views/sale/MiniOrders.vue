<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form inline>
        <el-form-item :label="t('sale.miniOrders.statusLabel')">
          <el-select v-model="query.status" :placeholder="t('sale.miniOrders.statusAll')" clearable style="width:130px" @change="load">
            <el-option :label="t('sale.miniOrders.statusPending')" :value="0" />
            <el-option :label="t('sale.miniOrders.statusWaitShip')" :value="1" />
            <el-option :label="t('sale.miniOrders.statusShipped')" :value="2" />
            <el-option :label="t('sale.miniOrders.statusDone')" :value="3" />
            <el-option :label="t('sale.miniOrders.statusCancelled')" :value="4" />
            <el-option :label="t('sale.miniOrders.statusRefunding')" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('sale.miniOrders.searchLabel')">
          <el-input v-model="query.keyword" :placeholder="t('sale.miniOrders.searchPlaceholder')" style="width:220px" clearable @keyup.enter="load" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">{{ t('sale.miniOrders.queryBtn') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never" style="margin-top:12px;">
      <el-table :data="list" v-loading="loading" border stripe height="calc(100vh - 240px)">
        <el-table-column :label="t('sale.miniOrders.colOrderNo')" prop="order_no" width="180" />
        <el-table-column :label="t('sale.miniOrders.colUserPhone')" prop="user_phone" width="130" />
        <el-table-column :label="t('sale.miniOrders.colDelivery')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="deliveryTagType(row.delivery_type)" size="small">{{ deliveryLabel(row.delivery_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colAddress')" min-width="180">
          <template #default="{ row }">
            <template v-if="row.delivery_type === 2">
              <div class="item-line" style="font-weight:600;">{{ row.store_name || t('sale.miniOrders.pickupSelf') }}</div>
              <div class="item-line">{{ row.store_address }}</div>
            </template>
            <template v-else>
              <div class="item-line">{{ row.address?.name }} {{ row.address?.phone }}</div>
              <div class="item-line">{{ row.address?.province }}{{ row.address?.city }}{{ row.address?.detail }}</div>
            </template>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colGoods')" min-width="180">
          <template #default="{ row }">
            <div v-for="item in row.items" :key="item.id" class="item-line">
              {{ item.goods_name }}×{{ item.qty }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colAmount')" width="100" align="right">
          <template #default="{ row }">
            <b>¥{{ row.total_amount }}</b>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colStatus')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status, row.delivery_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colExpress')" width="160">
          <template #default="{ row }">
            <span v-if="row.tracking_no" class="tracking">{{ row.express_company }} {{ row.tracking_no }}</span>
            <span v-else-if="row.delivery_type === 1 && row.status >= 2" class="tracking-alt">{{ t('sale.miniOrders.statusDeliveredByErrand') }}</span>
            <span v-else-if="row.delivery_type === 2 && row.status >= 2" class="tracking-alt">{{ t('sale.miniOrders.statusPickupReady') }}</span>
            <span v-else class="no-tracking">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colCreatedAt')" width="160">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colAction')" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" type="primary" size="small" @click="openShip(row)">{{ shipBtnText(row.delivery_type) }}</el-button>
            <el-button v-else-if="row.status === 2 && row.delivery_type === 2" type="success" size="small" @click="openPickup(row)">{{ t('sale.miniOrders.pickupVerifyBtn') }}</el-button>
            <el-button v-else size="small" @click="viewDetail(row)">{{ t('sale.miniOrders.detailBtn') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.list_rows"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top:12px;"
        @size-change="load"
        @current-change="load"
      />
    </el-card>

    <!-- 发货/确认弹窗 -->
    <el-dialog v-model="shipDialog" :title="shipDialogTitle" width="460px" :close-on-click-modal="false">
      <div class="addr-block" v-if="current">
        <!-- 物流/跑腿：显示收货地址 -->
        <template v-if="current.delivery_type !== 2">
          <div class="addr-title">{{ t('sale.miniOrders.shippingAddress') }}</div>
          <div>{{ current.address?.name }}  {{ current.address?.phone }}</div>
          <div>{{ current.address?.province }}{{ current.address?.city }}{{ current.address?.district }}</div>
          <div>{{ current.address?.detail }}</div>
        </template>
        <!-- 自提：显示门店信息 -->
        <template v-else>
          <div class="addr-title">{{ t('sale.miniOrders.pickupStore') }}</div>
          <div>{{ current.store_name }}</div>
          <div>{{ current.store_address }}</div>
        </template>
        <div v-if="current.remark" class="remark">{{ t('sale.miniOrders.remarkLabel') }}{{ current.remark }}</div>
      </div>

      <!-- 物流发货：填快递信息 -->
      <el-form v-if="current?.delivery_type === 0" :model="shipForm" label-width="90px" style="margin-top:16px;">
        <el-form-item :label="t('sale.miniOrders.expressCompany')">
          <el-select v-model="shipForm.express_company" :placeholder="t('sale.miniOrders.expressPicker')" style="width:100%">
            <el-option v-for="c in EXPRESS_LIST" :key="c.value" :label="t(c.labelKey)" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('sale.miniOrders.trackingNo')" required>
          <el-input v-model="shipForm.tracking_no" :placeholder="t('sale.miniOrders.trackingRequired')" />
        </el-form-item>
      </el-form>

      <!-- 跑腿/自提：提示文字 -->
      <div v-else style="margin-top:16px;padding:16px;background:#f8f9fa;border-radius:4px;color:#555;font-size:14px;line-height:1.8;">
        <template v-if="current?.delivery_type === 1">
          {{ t('sale.miniOrders.shipErrandHint') }}
        </template>
        <template v-else>
          {{ t('sale.miniOrders.pickupStoreHint') }}
        </template>
      </div>

      <template #footer>
        <el-button @click="shipDialog = false">{{ t('sale.miniOrders.cancelBtn') }}</el-button>
        <el-button type="primary" :loading="shipping" @click="doShip">{{ shipDialogConfirmText }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialog" :title="t('sale.miniOrders.detailDialogTitle')" width="560px">
      <template v-if="current">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item :label="t('sale.miniOrders.detailOrderNo')" :span="2">{{ current.order_no }}</el-descriptions-item>
          <el-descriptions-item :label="t('sale.miniOrders.detailUserPhone')">{{ current.user_phone }}</el-descriptions-item>
          <el-descriptions-item :label="t('sale.miniOrders.detailStatus')"><el-tag :type="statusType(current.status)" size="small">{{ statusLabel(current.status, current.delivery_type) }}</el-tag></el-descriptions-item>
          <el-descriptions-item :label="t('sale.miniOrders.detailDelivery')" :span="2"><el-tag :type="deliveryTagType(current.delivery_type)" size="small">{{ deliveryLabel(current.delivery_type) }}</el-tag></el-descriptions-item>
          <template v-if="current.delivery_type === 2">
            <el-descriptions-item :label="t('sale.miniOrders.detailPickupStore')" :span="2">{{ current.store_name }}</el-descriptions-item>
            <el-descriptions-item :label="t('sale.miniOrders.detailStoreAddress')" :span="2">{{ current.store_address }}</el-descriptions-item>
          </template>
          <template v-else>
            <el-descriptions-item :label="t('sale.miniOrders.detailReceiver')">{{ current.address?.name }} {{ current.address?.phone }}</el-descriptions-item>
            <el-descriptions-item :label="t('sale.miniOrders.detailCreatedAt')">{{ fmtTime(current.created_at) }}</el-descriptions-item>
            <el-descriptions-item :label="t('sale.miniOrders.detailAddress')" :span="2">{{ current.address?.province }}{{ current.address?.city }}{{ current.address?.district }}{{ current.address?.detail }}</el-descriptions-item>
          </template>
          <el-descriptions-item v-if="current.tracking_no" :label="t('sale.miniOrders.detailExpressCompany')">{{ current.express_company }}</el-descriptions-item>
          <el-descriptions-item v-if="current.tracking_no" :label="t('sale.miniOrders.detailTrackingNo')">{{ current.tracking_no }}</el-descriptions-item>
          <el-descriptions-item v-if="current.shipped_at" :label="t('sale.miniOrders.detailShippedAt')" :span="2">{{ fmtTime(current.shipped_at) }}</el-descriptions-item>
          <el-descriptions-item v-if="current.remark" :label="t('sale.miniOrders.detailRemark')" :span="2">{{ current.remark }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px;">
          <div style="font-weight:600;margin-bottom:8px;">{{ t('sale.miniOrders.goodsDetail') }}</div>
          <el-table :data="current.items" border size="small">
            <el-table-column :label="t('sale.miniOrders.colGoodsName')" prop="goods_name" />
            <el-table-column :label="t('sale.miniOrders.colSpec')" prop="spec" width="80" />
            <el-table-column :label="t('sale.miniOrders.colPrice')" prop="price" width="80" align="right" />
            <el-table-column :label="t('sale.miniOrders.colQty')" prop="qty" width="60" align="center" />
            <el-table-column :label="t('sale.miniOrders.colSubtotal')" width="90" align="right">
              <template #default="{ row }">¥{{ (row.price * row.qty).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:8px;font-size:15px;">
            {{ t('sale.miniOrders.totalPaid') }} <b style="font-size:18px;color:#e6a23c;">¥{{ current.total_amount }}</b>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'

const { t, locale } = useI18n()

const EXPRESS_LIST = [
  { value: '顺丰速运', labelKey: 'sale.miniOrders.expressSf' },
  { value: '京东物流', labelKey: 'sale.miniOrders.expressJd' },
  { value: '中通快递', labelKey: 'sale.miniOrders.expressZt' },
  { value: '圆通速递', labelKey: 'sale.miniOrders.expressYt' },
  { value: '申通快递', labelKey: 'sale.miniOrders.expressSt' },
  { value: '韵达快递', labelKey: 'sale.miniOrders.expressYd' },
  { value: '极兔速递', labelKey: 'sale.miniOrders.expressJt' },
  { value: '邮政EMS', labelKey: 'sale.miniOrders.expressEms' },
]
const DEFAULT_EXPRESS_COMPANY = EXPRESS_LIST[0].value

const list = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const shipDialog = ref(false)
const detailDialog = ref(false)
const shipping = ref(false)
const current = ref<any>(null)
const shipForm = reactive({ express_company: DEFAULT_EXPRESS_COMPANY, tracking_no: '' })

const query = reactive({ page: 1, list_rows: 20, status: '' as number | '', keyword: '' })

const shipDialogTitle = computed(() => {
  if (!current.value) return t('sale.miniOrders.processOrder')
  const deliveryType = current.value.delivery_type
  if (deliveryType === 1) return t('sale.miniOrders.confirmErrandShip')
  if (deliveryType === 2) return t('sale.miniOrders.confirmPickupStock')
  return t('sale.miniOrders.fillShippingInfo')
})

const shipDialogConfirmText = computed(() => {
  if (!current.value) return t('common.confirm')
  const deliveryType = current.value.delivery_type
  if (deliveryType === 1) return t('sale.miniOrders.confirmDispatched')
  if (deliveryType === 2) return t('sale.miniOrders.confirmPrepared')
  return t('sale.miniOrders.confirmShip')
})

async function load() {
  loading.value = true
  try {
    const params: any = { page: query.page, list_rows: query.list_rows }
    if (query.status !== '') params.status = query.status
    if (query.keyword) params.keyword = query.keyword
    const res = await http.get('/mini/orders', { params })
    list.value = res.data?.rows || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function openShip(row: any) {
  current.value = row
  shipForm.express_company = DEFAULT_EXPRESS_COMPANY
  shipForm.tracking_no = ''
  shipDialog.value = true
}

function viewDetail(row: any) {
  current.value = row
  detailDialog.value = true
}

async function openPickup(row: any) {
  try {
    await ElMessageBox.confirm(
      t('sale.miniOrders.pickupConfirmMessage', {
        orderNo: row.order_no,
        name: row.address?.name || '—',
        phone: row.address?.phone || '—',
        store: row.store_name || '—',
      }),
      t('sale.miniOrders.pickupVerifyTitle'),
      { confirmButtonText: t('sale.miniOrders.pickupDoneBtn'), cancelButtonText: t('sale.miniOrders.cancelBtn'), type: 'warning' }
    )
    await http.post('/mini/order/pickup-confirm', { order_id: row.id })
    ElMessage.success(t('sale.miniOrders.successShip'))
    load()
  } catch (e: any) {
    if (e === 'cancel' || e?.message === 'cancel') return
    ElMessage.error(e.message || t('sale.miniOrders.errorShip'))
  }
}

async function doShip() {
  const deliveryType = current.value?.delivery_type ?? 0
  if (deliveryType === 0 && !shipForm.tracking_no.trim()) {
    return ElMessage.warning(t('sale.miniOrders.warnTrackingNo'))
  }
  shipping.value = true
  try {
    await http.post('/mini/order/ship', {
      order_id: current.value.id,
      express_company: deliveryType === 0 ? shipForm.express_company : '',
      tracking_no: deliveryType === 0 ? shipForm.tracking_no.trim() : '',
    })
    ElMessage.success(t('common.success'))
    shipDialog.value = false
    load()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  } finally {
    shipping.value = false
  }
}

function deliveryLabel(deliveryType: number) {
  if (deliveryType === 1) return t('sale.miniOrders.deliveryErrand')
  if (deliveryType === 2) return t('sale.miniOrders.deliveryPickup')
  return t('sale.miniOrders.deliveryLogistics')
}

function deliveryTagType(deliveryType: number) {
  if (deliveryType === 1) return 'warning'
  if (deliveryType === 2) return 'success'
  return 'primary'
}

function shipBtnText(deliveryType: number) {
  if (deliveryType === 1) return t('sale.miniOrders.shipBtnErrand')
  if (deliveryType === 2) return t('sale.miniOrders.shipBtnPickup')
  return t('sale.miniOrders.shipBtn')
}

function statusLabel(s: number, deliveryType?: number) {
  const labels: Record<number, string> = {
    0: t('sale.miniOrders.statusPending'),
    1: t('sale.miniOrders.statusWaitShip'),
    2: deliveryType === 2 ? t('sale.miniOrders.statusPrepared') : t('sale.miniOrders.statusShipped'),
    3: deliveryType === 2 ? t('sale.miniOrders.statusPickedUp') : t('sale.miniOrders.statusDone'),
    4: t('sale.miniOrders.statusCancelled'),
    5: t('sale.miniOrders.statusRefunding'),
  }
  return labels[s] ?? t('sale.miniOrders.statusUnknown')
}

function statusType(s: number) {
  return ['info', 'warning', 'primary', 'success', 'danger', 'warning'][s] ?? ''
}

function fmtTime(value: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale.value === 'en-US' ? 'en-US' : 'zh-CN', { hour12: false }).replace(/\//g, '-')
}

onMounted(load)
</script>

<style scoped>
.page-container { padding: 16px; }
.search-card { margin-bottom: 0; }
.item-line { font-size: 12px; color: #555; line-height: 1.6; }
.tracking { font-size: 12px; color: #409eff; }
.tracking-alt { font-size: 12px; color: #67c23a; }
.no-tracking { color: #ccc; }
.addr-block { background: #f8f9fa; padding: 12px 16px; border-radius: 4px; font-size: 14px; line-height: 1.8; }
.addr-title { font-weight: 600; margin-bottom: 4px; }
.remark { color: #e6a23c; margin-top: 4px; }
</style>
