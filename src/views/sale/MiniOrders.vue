<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form inline>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:130px" @change="load">
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="query.keyword" placeholder="订单号/姓名/快递单号" style="width:220px" clearable @keyup.enter="load" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never" style="margin-top:12px;">
      <el-table :data="list" v-loading="loading" border stripe height="calc(100vh - 240px)">
        <el-table-column label="订单号" prop="order_no" width="180" />
        <el-table-column label="用户手机" prop="user_phone" width="130" />
        <el-table-column label="配送方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="deliveryTagType(row.delivery_type)" size="small">{{ deliveryLabel(row.delivery_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收货/门店" min-width="180">
          <template #default="{ row }">
            <template v-if="row.delivery_type === 2">
              <div class="item-line" style="font-weight:600;">{{ row.store_name || '自提' }}</div>
              <div class="item-line">{{ row.store_address }}</div>
            </template>
            <template v-else>
              <div class="item-line">{{ row.address?.name }} {{ row.address?.phone }}</div>
              <div class="item-line">{{ row.address?.province }}{{ row.address?.city }}{{ row.address?.detail }}</div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">
            <div v-for="item in row.items" :key="item.id" class="item-line">
              {{ item.goods_name }}×{{ item.qty }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }">
            <b>¥{{ row.total_amount }}</b>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status, row.delivery_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="物流/备注" width="160">
          <template #default="{ row }">
            <span v-if="row.tracking_no" class="tracking">{{ row.express_company }} {{ row.tracking_no }}</span>
            <span v-else-if="row.delivery_type === 1 && row.status >= 2" class="tracking-alt">跑腿已派出</span>
            <span v-else-if="row.delivery_type === 2 && row.status >= 2" class="tracking-alt">已备货可取</span>
            <span v-else class="no-tracking">—</span>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" type="primary" size="small" @click="openShip(row)">{{ shipBtnText(row.delivery_type) }}</el-button>
            <el-button v-else size="small" @click="viewDetail(row)">详情</el-button>
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
          <div class="addr-title">收货地址</div>
          <div>{{ current.address?.name }}  {{ current.address?.phone }}</div>
          <div>{{ current.address?.province }}{{ current.address?.city }}{{ current.address?.district }}</div>
          <div>{{ current.address?.detail }}</div>
        </template>
        <!-- 自提：显示门店信息 -->
        <template v-else>
          <div class="addr-title">自提门店</div>
          <div>{{ current.store_name }}</div>
          <div>{{ current.store_address }}</div>
        </template>
        <div v-if="current.remark" class="remark">备注：{{ current.remark }}</div>
      </div>

      <!-- 物流发货：填快递信息 -->
      <el-form v-if="current?.delivery_type === 0" :model="shipForm" label-width="90px" style="margin-top:16px;">
        <el-form-item label="快递公司">
          <el-select v-model="shipForm.express_company" placeholder="选择快递公司" style="width:100%">
            <el-option v-for="c in EXPRESS_LIST" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" required>
          <el-input v-model="shipForm.tracking_no" placeholder="请填写快递单号" />
        </el-form-item>
      </el-form>

      <!-- 跑腿/自提：提示文字 -->
      <div v-else style="margin-top:16px;padding:16px;background:#f8f9fa;border-radius:4px;color:#555;font-size:14px;line-height:1.8;">
        <template v-if="current?.delivery_type === 1">
          点击确认后，订单状态将更新为"已发货"，客户将收到跑腿配送通知。
        </template>
        <template v-else>
          点击确认后，订单状态将更新为"已备货"，客户可凭订单号前往门店取货。
        </template>
      </div>

      <template #footer>
        <el-button @click="shipDialog = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="doShip">{{ shipDialogConfirmText }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialog" title="订单详情" width="560px">
      <template v-if="current">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号" :span="2">{{ current.order_no }}</el-descriptions-item>
          <el-descriptions-item label="用户手机">{{ current.user_phone }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusType(current.status)" size="small">{{ statusLabel(current.status, current.delivery_type) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="配送方式" :span="2"><el-tag :type="deliveryTagType(current.delivery_type)" size="small">{{ deliveryLabel(current.delivery_type) }}</el-tag></el-descriptions-item>
          <template v-if="current.delivery_type === 2">
            <el-descriptions-item label="自提门店" :span="2">{{ current.store_name }}</el-descriptions-item>
            <el-descriptions-item label="门店地址" :span="2">{{ current.store_address }}</el-descriptions-item>
          </template>
          <template v-else>
            <el-descriptions-item label="收货人">{{ current.address?.name }} {{ current.address?.phone }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ fmtTime(current.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">{{ current.address?.province }}{{ current.address?.city }}{{ current.address?.district }}{{ current.address?.detail }}</el-descriptions-item>
          </template>
          <el-descriptions-item v-if="current.tracking_no" label="快递公司">{{ current.express_company }}</el-descriptions-item>
          <el-descriptions-item v-if="current.tracking_no" label="快递单号">{{ current.tracking_no }}</el-descriptions-item>
          <el-descriptions-item v-if="current.shipped_at" label="发货时间" :span="2">{{ fmtTime(current.shipped_at) }}</el-descriptions-item>
          <el-descriptions-item v-if="current.remark" label="备注" :span="2">{{ current.remark }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px;">
          <div style="font-weight:600;margin-bottom:8px;">商品明细</div>
          <el-table :data="current.items" border size="small">
            <el-table-column label="商品名" prop="goods_name" />
            <el-table-column label="规格" prop="spec" width="80" />
            <el-table-column label="单价" prop="price" width="80" align="right" />
            <el-table-column label="数量" prop="qty" width="60" align="center" />
            <el-table-column label="小计" width="90" align="right">
              <template #default="{ row }">¥{{ (row.price * row.qty).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:8px;font-size:15px;">
            实付款 <b style="font-size:18px;color:#e6a23c;">¥{{ current.total_amount }}</b>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const EXPRESS_LIST = ['顺丰速运', '京东物流', '中通快递', '圆通速递', '申通快递', '韵达快递', '极兔速递', '邮政EMS']

const list = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const shipDialog = ref(false)
const detailDialog = ref(false)
const shipping = ref(false)
const current = ref<any>(null)
const shipForm = reactive({ express_company: '顺丰速运', tracking_no: '' })

const query = reactive({ page: 1, list_rows: 20, status: '' as number | '', keyword: '' })

const shipDialogTitle = computed(() => {
  if (!current.value) return '处理订单'
  const t = current.value.delivery_type
  if (t === 1) return '确认跑腿配送'
  if (t === 2) return '确认门店备货'
  return '填写物流信息'
})

const shipDialogConfirmText = computed(() => {
  if (!current.value) return '确认'
  const t = current.value.delivery_type
  if (t === 1) return '确认已派出'
  if (t === 2) return '确认已备货'
  return '确认发货'
})

async function load() {
  loading.value = true
  try {
    const params: any = { page: query.page, list_rows: query.list_rows }
    if (query.status !== '') params.status = query.status
    if (query.keyword) params.keyword = query.keyword
    const res = await http.get('/adminapi/mini/orders', { params })
    list.value = res.data?.rows || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function openShip(row: any) {
  current.value = row
  shipForm.express_company = '顺丰速运'
  shipForm.tracking_no = ''
  shipDialog.value = true
}

function viewDetail(row: any) {
  current.value = row
  detailDialog.value = true
}

async function doShip() {
  const deliveryType = current.value?.delivery_type ?? 0
  if (deliveryType === 0 && !shipForm.tracking_no.trim()) {
    return ElMessage.warning('请填写快递单号')
  }
  shipping.value = true
  try {
    await http.post('/adminapi/mini/order/ship', {
      order_id: current.value.id,
      express_company: deliveryType === 0 ? shipForm.express_company : '',
      tracking_no: deliveryType === 0 ? shipForm.tracking_no.trim() : '',
    })
    ElMessage.success('操作成功')
    shipDialog.value = false
    load()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    shipping.value = false
  }
}

function deliveryLabel(t: number) {
  if (t === 1) return '跑腿送货'
  if (t === 2) return '到店自提'
  return '物流发货'
}

function deliveryTagType(t: number) {
  if (t === 1) return 'warning'
  if (t === 2) return 'success'
  return 'primary'
}

function shipBtnText(t: number) {
  if (t === 1) return '确认配送'
  if (t === 2) return '确认备货'
  return '发货'
}

function statusLabel(s: number, deliveryType?: number) {
  const labels: Record<number, string> = {
    0: '待付款',
    1: '待发货',
    2: deliveryType === 2 ? '已备货' : '已发货',
    3: deliveryType === 2 ? '已取货' : '已完成',
    4: '已取消',
  }
  return labels[s] ?? '未知'
}

function statusType(s: number) {
  return ['info', 'warning', 'primary', 'success', 'danger'][s] ?? ''
}

function fmtTime(t: string) {
  if (!t) return '—'
  return new Date(t).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
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
