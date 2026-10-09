<template>
  <div class="page-container">
    <!-- 状态分类 + 搜索 -->
    <el-card class="order-hub-card" shadow="never">
      <div class="order-status-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.countKey"
          type="button"
          class="order-status-tab"
          :class="{ active: query.status === tab.value }"
          @click="switchStatus(tab.value)"
        >
          <span class="status-tab-label">{{ t(tab.labelKey) }}</span>
          <span class="status-tab-count">{{ statusCount(tab.countKey) }}</span>
        </button>
      </div>
      <div class="order-search-row">
        <span class="search-label">{{ t('sale.miniOrders.searchLabel') }}</span>
        <el-input
          v-model="query.keyword"
          :placeholder="t('sale.miniOrders.searchPlaceholder')"
          class="order-search-input"
          clearable
          @clear="searchOrders"
          @keyup.enter="searchOrders"
        />
        <el-button type="primary" @click="searchOrders">{{ t('sale.miniOrders.queryBtn') }}</el-button>
        <el-badge :value="leadsUnhandled" :hidden="!leadsUnhandled" class="leads-badge">
          <el-button @click="leadsOpen = true">官网留言</el-button>
        </el-badge>
      </div>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="list" v-loading="loading" border stripe height="calc(100vh - 270px)">
        <el-table-column :label="t('sale.miniOrders.colOrderNo')" width="164" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-if="row.source === 'web'" size="small" type="warning" class="src-tag">官网</el-tag>{{ row.order_no }}
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colUserPhone')" width="112" show-overflow-tooltip>
          <template #default="{ row }">{{ row.user_phone || (row.source === 'web' ? '未注册' : '') }}</template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colDelivery')" width="84" align="center">
          <template #default="{ row }">
            <el-tag :type="deliveryTagType(row.delivery_type)" size="small">{{ deliveryLabel(row.delivery_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colAddress')" min-width="220">
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
        <el-table-column :label="t('sale.miniOrders.colGoods')" min-width="150">
          <template #default="{ row }">
            <div v-for="item in row.items" :key="item.id" class="item-line">
              {{ item.goods_name }}×{{ item.qty }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colAmount')" width="90" align="right">
          <template #default="{ row }">
            <div v-if="row.price_adjusted_from" class="original-price">¥{{ row.price_adjusted_from }}</div>
            <b>¥{{ row.total_amount }}</b>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colStatus')" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status, row.delivery_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colExpress')" width="130">
          <template #default="{ row }">
            <span v-if="row.tracking_no" class="tracking">{{ row.express_company }} {{ row.tracking_no }}</span>
            <el-button v-if="row.tracking_no" type="primary" link size="small" @click="viewTracking(row)">查看物流</el-button>
            <span v-else-if="row.delivery_type === 1 && row.status >= 2" class="tracking-alt">{{ t('sale.miniOrders.statusDeliveredByErrand') }}</span>
            <span v-else-if="row.delivery_type === 2 && row.status >= 2" class="tracking-alt">{{ t('sale.miniOrders.statusPickupReady') }}</span>
            <span v-else class="no-tracking">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colCreatedAt')" width="135">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column :label="t('sale.miniOrders.colAction')" width="290" fixed="right">
          <template #default="{ row }">
            <div class="mini-order-actions">
              <el-button type="success" plain size="small" @click="openPrivateMessage(row)">私信</el-button>
              <template v-if="row.status === 0">
                <el-button v-if="row.price_change_requested" type="warning" size="small" @click="openAdjustPrice(row)">改价</el-button>
                <el-button type="primary" plain size="small" @click="remindPayment(row)">催付款</el-button>
                <el-button type="success" plain size="small" @click="openGrantCoupon(row)">发优惠券</el-button>
                <el-button size="small" @click="viewDetail(row)">{{ t('sale.miniOrders.detailBtn') }}</el-button>
              </template>
              <el-button v-else-if="row.status === 1" type="primary" size="small" @click="openShip(row)">{{ shipBtnText(row.delivery_type) }}</el-button>
              <el-button v-else-if="row.status === 2 && row.delivery_type === 2" type="success" size="small" @click="openPickup(row)">{{ t('sale.miniOrders.pickupVerifyBtn') }}</el-button>
              <el-button v-else size="small" @click="viewDetail(row)">{{ t('sale.miniOrders.detailBtn') }}</el-button>
              <el-button v-if="canRefund(row)" type="danger" plain size="small" @click="openRefund(row)">退款</el-button>
            </div>
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

    <!-- 发放优惠券 -->
    <el-dialog v-model="couponDialog" title="给客户发优惠券" width="440px" :close-on-click-modal="false">
      <el-alert
        type="warning"
        :closable="false"
        title="优惠券供客户后续下单使用，不会自动抵扣当前已生成订单"
        style="margin-bottom:16px;"
      />
      <el-form label-width="90px">
        <el-form-item label="客户">
          <span>{{ current?.user_phone || '—' }}</span>
        </el-form-item>
        <el-form-item label="选择优惠券" required>
          <el-select v-model="selectedCouponId" filterable placeholder="请选择有效优惠券" style="width:100%;">
            <el-option
              v-for="coupon in availableCoupons"
              :key="coupon.id"
              :label="`${coupon.name}（满${coupon.min_order}减${coupon.discount_value}）`"
              :value="coupon.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="couponDialog = false">取消</el-button>
        <el-button type="primary" :loading="grantingCoupon" @click="grantCoupon">确认发放</el-button>
      </template>
    </el-dialog>

    <!-- 待付款订单改价 -->
    <!-- 商家主动退款（全额/部分），钱原路退回客户微信 -->
    <el-dialog v-model="refundDialog" title="给客户退款" width="480px" :close-on-click-modal="false">
      <el-alert type="warning" :closable="false" show-icon title="钱会原路退回客户的微信，提交后无法撤销" style="margin-bottom:16px;" />
      <el-form label-width="96px">
        <el-form-item label="订单编号"><span>{{ current?.order_no }}</span></el-form-item>
        <el-form-item label="实付金额">
          <span>¥{{ Number(current?.total_amount || 0).toFixed(2) }}</span>
          <span v-if="refundedOf(current) > 0" class="refund-hint">（已退 ¥{{ refundedOf(current).toFixed(2) }}）</span>
        </el-form-item>
        <el-form-item label="退款金额" required>
          <el-input-number v-model="refundForm.amount" :min="0.01" :max="refundMax" :precision="2" :step="1" controls-position="right" style="width:100%;" />
          <div class="refund-hint">
            {{ refundIsFull ? '全额退款：订单改为已退款，退回客户的积分和优惠券' : '部分退款：只退这部分钱，订单照常发货/完成' }}
          </div>
        </el-form-item>
        <el-form-item label="退款原因" required>
          <el-input v-model="refundForm.reason" maxlength="100" show-word-limit placeholder="如：商品破损补偿、缺货退款" />
        </el-form-item>
        <el-form-item v-if="refundIsFull" label="库存">
          <template v-if="Number(current?.status) === 1">
            <span class="refund-hint">还没发货，退款后库存自动加回</span>
          </template>
          <el-checkbox v-else v-model="refundForm.restock">货已退回，把库存加回来</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialog = false">取消</el-button>
        <el-button type="danger" :loading="refunding" @click="submitRefund">确认退款 ¥{{ Number(refundForm.amount || 0).toFixed(2) }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustDialog" title="修改待付款金额" width="440px" :close-on-click-modal="false">
      <el-alert
        type="info"
        :closable="false"
        title="客户付款时将按修改后的金额发起微信支付"
        style="margin-bottom:16px;"
      />
      <el-form label-width="90px">
        <el-form-item label="订单编号">
          <span>{{ current?.order_no }}</span>
        </el-form-item>
        <el-form-item label="当前金额">
          <span>¥{{ current?.total_amount }}</span>
        </el-form-item>
        <el-form-item label="优惠后金额" required>
          <el-input-number
            v-model="adjustForm.amount"
            :min="0.01"
            :max="Number(current?.price_adjusted_from || current?.total_amount || 0)"
            :precision="2"
            :step="1"
            controls-position="right"
            style="width:100%;"
          />
        </el-form-item>
        <el-form-item label="改价说明">
          <el-input v-model="adjustForm.note" maxlength="255" show-word-limit placeholder="如：老客户优惠、批量采购优惠" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialog = false">取消</el-button>
        <el-button type="primary" :loading="adjusting" @click="submitAdjustPrice">确认改价</el-button>
      </template>
    </el-dialog>

    <!-- 给小程序客户发送私信 -->
    <el-dialog v-model="privateMessageDialog" title="发送客户私信" width="500px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="客户">
          <span>{{ current?.user_phone || '—' }}</span>
        </el-form-item>
        <el-form-item label="关联订单">
          <span>{{ current?.order_no }} · ¥{{ current?.total_amount }}</span>
        </el-form-item>
        <el-form-item label="快捷话术">
          <el-button size="small" @click="setPaymentMessage">催付款</el-button>
        </el-form-item>
        <el-form-item label="私信内容" required>
          <el-input
            v-model="privateMessageText"
            type="textarea"
            :rows="5"
            maxlength="4000"
            show-word-limit
            placeholder="输入要发送给客户的内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="privateMessageDialog = false">取消</el-button>
        <el-button type="primary" :loading="sendingPrivateMessage" @click="sendPrivateMessage">发送私信</el-button>
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
          <el-descriptions-item v-if="current.express_company" :label="t('sale.miniOrders.detailExpressCompany')">{{ current.express_company }}</el-descriptions-item>
          <el-descriptions-item v-if="current.tracking_no" :label="t('sale.miniOrders.detailTrackingNo')">
            <span class="tracking-no" title="可复制快递单号">{{ current.tracking_no }}</span>
          </el-descriptions-item>
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

    <el-dialog v-model="trackingDialog" title="物流轨迹" width="560px">
      <div v-loading="trackingLoading">
        <template v-if="trackingDetail">
          <div class="tracking-summary">
            <b>{{ trackingDetail.carrier || current?.express_company || '快递' }}</b>
            <span>{{ trackingDetail.number || current?.tracking_no }}</span>
            <el-tag size="small" type="primary">{{ trackingDetail.status }}</el-tag>
          </div>
          <el-timeline v-if="trackingDetail.events?.length">
            <el-timeline-item v-for="event in trackingDetail.events" :key="`${event.time}-${event.description}`" :timestamp="fmtTime(event.time)">
              <div>{{ event.description || event.stage }}</div>
              <div v-if="event.location" class="tracking-location">{{ event.location }}</div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="物流信息正在同步，稍后刷新即可查看轨迹" :image-size="80" />
        </template>
      </div>
      <template #footer><el-button @click="viewTracking(current)">刷新物流</el-button></template>
    </el-dialog>
    <WebLeadsDrawer v-model="leadsOpen" @changed="leadsUnhandled = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'
import WebLeadsDrawer from './components/WebLeadsDrawer.vue'

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
const statusCounts = ref<Record<string, number>>({ all: 0, 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
const loading = ref(false)
const shipDialog = ref(false)
const detailDialog = ref(false)
const trackingDialog = ref(false)
const trackingLoading = ref(false)
const trackingDetail = ref<any>(null)
const adjustDialog = ref(false)
const couponDialog = ref(false)
const privateMessageDialog = ref(false)
const shipping = ref(false)
const adjusting = ref(false)
const grantingCoupon = ref(false)
const sendingPrivateMessage = ref(false)
const current = ref<any>(null)
const privateMessageText = ref('')
const shipForm = reactive({ express_company: DEFAULT_EXPRESS_COMPANY, tracking_no: '' })
const adjustForm = reactive({ amount: 0, note: '' })
const refundDialog = ref(false)
const refunding = ref(false)
const refundForm = reactive({ amount: 0, reason: '', restock: false })
const refundedOf = (row: any) => Number(row?.refunded_amount || 0)
const refundMax = computed(() => Math.max(0.01, Math.round((Number(current.value?.total_amount || 0) - refundedOf(current.value)) * 100) / 100))
const refundIsFull = computed(() => Number(refundForm.amount || 0) >= refundMax.value - 0.001)
// 已付款（待发货/已发货/已完成）且还有没退完的钱才能退
function canRefund(row: any) {
  return [1, 2, 3].includes(Number(row.status)) && Number(row.total_amount || 0) - refundedOf(row) > 0.001
}
function openRefund(row: any) {
  current.value = row
  refundForm.amount = Math.round((Number(row.total_amount || 0) - refundedOf(row)) * 100) / 100
  refundForm.reason = ''
  refundForm.restock = false
  refundDialog.value = true
}
async function submitRefund() {
  const reason = refundForm.reason.trim()
  if (!reason) { ElMessage.warning('请填写退款原因'); return }
  const amount = Math.round(Number(refundForm.amount || 0) * 100) / 100
  if (!(amount > 0)) { ElMessage.warning('退款金额必须大于 0'); return }
  await ElMessageBox.confirm(
    `确认把 ¥${amount.toFixed(2)} 原路退回给客户？${refundIsFull.value ? '订单将改为已退款。' : ''}提交后无法撤销。`,
    '确认退款', { type: 'warning', confirmButtonText: '确认退款', cancelButtonText: '再想想' },
  )
  refunding.value = true
  try {
    const res: any = await http.post('/mini/order/refund', {
      order_id: current.value.id, amount, reason,
      restock: Number(current.value.status) === 1 ? true : refundForm.restock,
    })
    ElMessage.success(res?.data?.message || res?.message || '退款成功')
    refundDialog.value = false
    load()
  } catch (e: any) {
    ElMessage.error(e?.message || '退款失败')
  } finally {
    refunding.value = false
  }
}
const availableCoupons = ref<any[]>([])
const selectedCouponId = ref<number | null>(null)

const query = reactive({ page: 1, list_rows: 20, status: '' as number | '', keyword: '' })

const statusTabs: Array<{ value: number | ''; labelKey: string; countKey: string }> = [
  { value: '', labelKey: 'sale.miniOrders.statusAll', countKey: 'all' },
  { value: 0, labelKey: 'sale.miniOrders.statusPending', countKey: '0' },
  { value: 1, labelKey: 'sale.miniOrders.statusWaitShip', countKey: '1' },
  { value: 2, labelKey: 'sale.miniOrders.statusShipped', countKey: '2' },
  { value: 3, labelKey: 'sale.miniOrders.statusDone', countKey: '3' },
  { value: 4, labelKey: 'sale.miniOrders.statusCancelled', countKey: '4' },
  { value: 5, labelKey: 'sale.miniOrders.statusRefunding', countKey: '5' },
]

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
    statusCounts.value = { all: 0, 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...(res.data?.status_counts || {}) }
  } finally {
    loading.value = false
  }
}

function statusCount(key: string) {
  return Number(statusCounts.value?.[key] || 0)
}

function switchStatus(status: number | '') {
  if (query.status === status) return
  query.status = status
  query.page = 1
  void load()
}

function searchOrders() {
  query.page = 1
  void load()
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

async function viewTracking(row: any) {
  if (!row?.tracking_no) return
  current.value = row
  trackingDialog.value = true
  trackingLoading.value = true
  trackingDetail.value = null
  try {
    const res = await http.get(`/mini/order/tracking/${row.id}`)
    trackingDetail.value = res.data || res
  } catch (e: any) {
    ElMessage.error(e.message || '物流查询失败')
  } finally {
    trackingLoading.value = false
  }
}

function openAdjustPrice(row: any) {
  current.value = row
  adjustForm.amount = Number(row.total_amount || 0)
  adjustForm.note = row.price_adjustment_note || ''
  adjustDialog.value = true
}

async function submitAdjustPrice() {
  if (!current.value || !adjustForm.amount) return
  adjusting.value = true
  try {
    await http.post('/mini/order/adjust-price', {
      order_id: current.value.id,
      amount: adjustForm.amount,
      note: adjustForm.note.trim(),
    })
    ElMessage.success('订单金额已修改，客户可按新金额付款')
    adjustDialog.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e.message || '改价失败')
  } finally {
    adjusting.value = false
  }
}

async function remindPayment(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认向客户 ${row.user_phone || ''} 发送微信待付款订阅提醒？客户需事先同意接收此类通知。私信可通过旁边的“私信”按钮单独发送。`,
      '催付款',
      { confirmButtonText: '发送提醒', cancelButtonText: '取消', type: 'warning' }
    )
    await http.post('/mini/order/remind-payment', { order_id: row.id })
    ElMessage.success('微信待付款提醒已提交发送；如客户未授权，微信可能无法送达')
    load()
  } catch (e: any) {
    if (e === 'cancel' || e?.message === 'cancel') return
    ElMessage.error(e.message || '催付款提醒发送失败')
  }
}

function setPaymentMessage() {
  const orderNo = current.value?.order_no || ''
  const amount = Number(current.value?.total_amount || 0).toFixed(2)
  privateMessageText.value = `您好，您的订单 ${orderNo}（金额 ¥${amount}）目前还未付款，请方便时完成支付。如有疑问可以直接回复我们。`
}

function openPrivateMessage(row: any, withPaymentTemplate = false) {
  current.value = row
  privateMessageText.value = ''
  privateMessageDialog.value = true
  if (withPaymentTemplate) setPaymentMessage()
}

async function sendPrivateMessage() {
  const content = privateMessageText.value.trim()
  if (!current.value || !content || sendingPrivateMessage.value) return
  sendingPrivateMessage.value = true
  try {
    await http.post('/mini/order/private-message', { order_id: current.value.id, content })
    ElMessage.success('私信已发送到客户的小程序客服会话')
    privateMessageDialog.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '私信发送失败')
  } finally {
    sendingPrivateMessage.value = false
  }
}

async function openGrantCoupon(row: any) {
  current.value = row
  selectedCouponId.value = null
  try {
    const res = await http.get('/mini/coupons', { params: { page: 1, list_rows: 200 } })
    availableCoupons.value = (res.data?.rows || []).filter((coupon: any) =>
      Number(coupon.status) === 1 &&
      (!coupon.end_at || new Date(coupon.end_at).getTime() > Date.now())
    )
    couponDialog.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '优惠券加载失败')
  }
}

async function grantCoupon() {
  if (!current.value || !selectedCouponId.value) return ElMessage.warning('请选择优惠券')
  grantingCoupon.value = true
  try {
    const res = await http.post('/mini/order/grant-coupon', {
      order_id: current.value.id,
      coupon_id: selectedCouponId.value,
    })
    ElMessage.success(`已发放：${res.data?.coupon_name || '优惠券'}`)
    couponDialog.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '优惠券发放失败')
  } finally {
    grantingCoupon.value = false
  }
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

const leadsOpen = ref(false)
const leadsUnhandled = ref(0)
async function loadLeadsCount() {
  try {
    const res: any = await http.get('/mini/orders/web-leads', { params: { handled: 0, list_rows: 1, _t: Date.now() }, silent: true } as any)
    leadsUnhandled.value = Number(res.data?.unhandled || 0)
  } catch { /* 后端没升级时静默，不影响订单列表 */ }
}

const onMiniOrderArrived = () => { void load() }
onMounted(() => {
  void load()
  void loadLeadsCount()
  window.addEventListener('mini-order-arrived', onMiniOrderArrived)
})
onUnmounted(() => window.removeEventListener('mini-order-arrived', onMiniOrderArrived))
</script>

<style scoped>
.mini-order-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
.mini-order-actions :deep(.el-button + .el-button) { margin-left: 0; }
.page-container { padding: 16px; }
.leads-badge { margin-left: 8px; }
.src-tag { margin-right: 4px; }
.order-hub-card { margin-bottom: 0; border-radius: 16px; }
.order-hub-card :deep(.el-card__body) { padding: 18px 20px; }
.order-status-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.order-status-tab {
  display: inline-flex;
  align-items: baseline;
  justify-content: space-between;
  min-width: 122px;
  padding: 12px 14px;
  border: 1px solid #edf0f5;
  border-radius: 14px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  transition: all .18s ease;
}
.order-status-tab:hover {
  color: #1677ff;
  border-color: #b7d7ff;
  background: #f7fbff;
}
.order-status-tab.active {
  color: #1677ff;
  border-color: #409eff;
  background: linear-gradient(180deg, #f2f8ff 0%, #ffffff 100%);
  box-shadow: 0 8px 18px rgba(64, 158, 255, .14);
}
.status-tab-label { font-size: 14px; font-weight: 600; }
.status-tab-count { margin-left: 10px; font-size: 20px; font-weight: 800; line-height: 1; }
.order-search-row { display: flex; align-items: center; gap: 12px; }
.search-label { color: #909399; font-size: 14px; font-weight: 600; }
.order-search-input { width: 320px; max-width: 42vw; }
.table-card { margin-top: 12px; }
.table-card :deep(.el-card__body) { padding: 12px 14px; }
.table-card :deep(.el-table) { font-size: 13px; }
.table-card :deep(.el-table__cell) { padding: 8px 0; }
.table-card :deep(.el-table .cell) { padding: 0 10px; line-height: 1.45; }
.table-card :deep(.el-button--small) { padding: 5px 9px; }
.item-line { font-size: 12px; color: #555; line-height: 1.55; word-break: break-word; }
.tracking { display: block; font-size: 12px; color: #409eff; line-height: 1.45; word-break: break-all; }
.tracking-summary { display:flex; align-items:center; gap:12px; margin-bottom:18px; padding:12px; background:#f5f7fa; border-radius:6px; }
.tracking-location { color:#909399; font-size:12px; margin-top:3px; }
.tracking-no { color: #409eff; font-weight: 600; letter-spacing: .3px; user-select: all; }
.tracking-alt { font-size: 12px; color: #67c23a; }
.no-tracking { color: #ccc; }
.original-price { color:#999; font-size:12px; text-decoration:line-through; }
.addr-block { background: #f8f9fa; padding: 12px 16px; border-radius: 4px; font-size: 14px; line-height: 1.8; }
.addr-title { font-weight: 600; margin-bottom: 4px; }
.remark { color: #e6a23c; margin-top: 4px; }
.refund-hint { font-size: 12px; color: #86868b; margin-left: 6px; line-height: 1.6; }
</style>
