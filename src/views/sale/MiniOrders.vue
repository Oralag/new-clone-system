<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form inline>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:130px" @change="load">
            <el-option label="待支付" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="query.keyword" placeholder="订单号/手机号/地址" style="width:220px" clearable @keyup.enter="load" />
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
        <el-table-column label="客户手机" prop="user_phone" width="130" />
        <el-table-column label="收货人" width="120">
          <template #default="{ row }">
            {{ row.address?.name }} {{ row.address?.phone }}
          </template>
        </el-table-column>
        <el-table-column label="收货地址" min-width="200">
          <template #default="{ row }">
            {{ row.address?.province }}{{ row.address?.city }}{{ row.address?.district }}{{ row.address?.detail }}
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div v-for="item in row.items" :key="item.id" class="item-line">
              {{ item.goods_name }}×{{ item.qty }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="实付金额" width="100" align="right">
          <template #default="{ row }">
            <b>¥{{ row.total_amount }}</b>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="快递信息" width="160">
          <template #default="{ row }">
            <span v-if="row.tracking_no" class="tracking">{{ row.express_company }} {{ row.tracking_no }}</span>
            <span v-else class="no-tracking">—</span>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" type="primary" size="small" @click="openShip(row)">发货</el-button>
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

    <!-- 发货弹窗 -->
    <el-dialog v-model="shipDialog" title="填写快递信息" width="460px" :close-on-click-modal="false">
      <div class="addr-block" v-if="current">
        <div class="addr-title">收货地址</div>
        <div>{{ current.address?.name }}  {{ current.address?.phone }}</div>
        <div>{{ current.address?.province }}{{ current.address?.city }}{{ current.address?.district }}</div>
        <div>{{ current.address?.detail }}</div>
        <div v-if="current.remark" class="remark">备注：{{ current.remark }}</div>
      </div>
      <el-form :model="shipForm" label-width="90px" style="margin-top:16px;">
        <el-form-item label="快递公司">
          <el-select v-model="shipForm.express_company" placeholder="选择快递" style="width:100%">
            <el-option v-for="c in EXPRESS_LIST" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" required>
          <el-input v-model="shipForm.tracking_no" placeholder="请输入快递单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialog = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="doShip">确认发货</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialog" title="订单详情" width="560px">
      <template v-if="current">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号" :span="2">{{ current.order_no }}</el-descriptions-item>
          <el-descriptions-item label="客户手机">{{ current.user_phone }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusType(current.status)" size="small">{{ statusLabel(current.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="收货人">{{ current.address?.name }} {{ current.address?.phone }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ fmtTime(current.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ current.address?.province }}{{ current.address?.city }}{{ current.address?.district }}{{ current.address?.detail }}</el-descriptions-item>
          <el-descriptions-item label="快递公司" v-if="current.tracking_no">{{ current.express_company }}</el-descriptions-item>
          <el-descriptions-item label="快递单号" v-if="current.tracking_no">{{ current.tracking_no }}</el-descriptions-item>
          <el-descriptions-item label="发货时间" v-if="current.shipped_at" :span="2">{{ fmtTime(current.shipped_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" v-if="current.remark" :span="2">{{ current.remark }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px;">
          <div style="font-weight:600;margin-bottom:8px;">商品明细</div>
          <el-table :data="current.items" border size="small">
            <el-table-column label="商品名称" prop="goods_name" />
            <el-table-column label="规格" prop="spec" width="80" />
            <el-table-column label="单价" prop="price" width="80" align="right" />
            <el-table-column label="数量" prop="qty" width="60" align="center" />
            <el-table-column label="小计" width="90" align="right">
              <template #default="{ row }">¥{{ (row.price * row.qty).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:8px;font-size:15px;">
            实付合计：<b style="font-size:18px;color:#e6a23c;">¥{{ current.total_amount }}</b>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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
  if (!shipForm.tracking_no.trim()) return ElMessage.warning('请填写快递单号')
  shipping.value = true
  try {
    await http.post('/adminapi/mini/order/ship', {
      order_id: current.value.id,
      express_company: shipForm.express_company,
      tracking_no: shipForm.tracking_no.trim(),
    })
    ElMessage.success('发货成功')
    shipDialog.value = false
    load()
  } catch (e: any) {
    ElMessage.error(e.message || '发货失败')
  } finally {
    shipping.value = false
  }
}

function statusLabel(s: number) {
  return ['待支付', '待发货', '已发货', '已完成', '已取消'][s] ?? '未知'
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
.no-tracking { color: #ccc; }
.addr-block { background: #f8f9fa; padding: 12px 16px; border-radius: 4px; font-size: 14px; line-height: 1.8; }
.addr-title { font-weight: 600; margin-bottom: 4px; }
.remark { color: #e6a23c; margin-top: 4px; }
</style>
