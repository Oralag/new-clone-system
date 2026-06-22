<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('miniprogramDistributor.title') }}</h2>
      <div class="tab-bar">
        <el-radio-group v-model="activeTab" @change="loadList">
          <el-radio-button label="">{{ t('miniprogramDistributor.all') }}</el-radio-button>
          <el-radio-button label="0">{{ t('miniprogramDistributor.pending') }}</el-radio-button>
          <el-radio-button label="1">{{ t('miniprogramDistributor.approved') }}</el-radio-button>
          <el-radio-button label="2">{{ t('miniprogramDistributor.rejected') }}</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border style="width:100%">
      <el-table-column :label="t('miniprogramDistributor.applicant')" prop="name" width="120" />
      <el-table-column :label="t('miniprogramDistributor.phone')" prop="phone" width="130" />
      <el-table-column :label="t('miniprogramDistributor.reason')" prop="apply_reason" min-width="160" show-overflow-tooltip />
      <el-table-column :label="t('miniprogramDistributor.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('miniprogramDistributor.code')" prop="code" width="100">
        <template #default="{ row }">
          <span style="font-family:monospace;font-weight:600">{{ row.code || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('miniprogramDistributor.rate')" width="100">
        <template #default="{ row }">
          <span v-if="row.status === 1">{{ row.commission_rate }}%</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('miniprogramDistributor.orders')" width="90" align="center">
        <template #default="{ row }">{{ row.order_count || 0 }}</template>
      </el-table-column>
      <el-table-column :label="t('miniprogramDistributor.total')" width="110" align="right">
        <template #default="{ row }">
          <span v-if="row.status === 1" style="color:#c44b0a;font-weight:600">
            ¥{{ Number(row.total_commission || 0).toFixed(2) }}
          </span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('miniprogramDistributor.createdAt')" width="120">
        <template #default="{ row }">{{ row.created_at?.slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column :label="t('miniprogramDistributor.actions')" width="300" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button size="small" type="success" @click="openApprove(row)">{{ t('miniprogramDistributor.approve') }}</el-button>
            <el-button size="small" type="danger" @click="handleReject(row)">{{ t('miniprogramDistributor.reject') }}</el-button>
          </template>
          <template v-else-if="row.status === 1">
            <el-button size="small" @click="openEditRate(row)">{{ t('miniprogramDistributor.editRate') }}</el-button>
            <el-button size="small" @click="openGoodsDialog(row)">商品池</el-button>
            <el-button size="small" @click="openMaterialDialog(row)">素材库</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="20"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadList"
      />
    </div>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" :title="t('miniprogramDistributor.approveTitle')" width="360px">
      <el-form label-width="80px">
        <el-form-item :label="t('miniprogramDistributor.applicant')">{{ approveRow?.name }}</el-form-item>
        <el-form-item :label="t('miniprogramDistributor.rate')">
          <span style="color:#666;font-size:13px">{{ t('miniprogramDistributor.rateHint') }}</span>
        </el-form-item>
        <el-form-item :label="t('miniprogramDistributor.remark')">
          <el-input v-model="approveNote" :placeholder="t('miniprogramDistributor.optional')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">{{ t('miniprogramDistributor.cancel') }}</el-button>
        <el-button type="primary" :loading="acting" @click="handleApprove">{{ t('miniprogramDistributor.confirmApprove') }}</el-button>
      </template>
    </el-dialog>

    <!-- 改佣金弹窗 -->
    <el-dialog v-model="editRateVisible" :title="t('miniprogramDistributor.editRateTitle')" width="320px">
      <el-form label-width="80px">
        <el-form-item :label="t('miniprogramDistributor.distributor')">{{ editRow?.name }}（{{ editRow?.code }}）</el-form-item>
        <el-form-item :label="t('miniprogramDistributor.rate')">
          <el-input-number v-model="editRate" :min="1" :max="50" :precision="1" controls-position="right" />
          <span style="margin-left:8px">%</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editRateVisible = false">{{ t('miniprogramDistributor.cancel') }}</el-button>
        <el-button type="primary" :loading="acting" @click="handleEditRate">{{ t('miniprogramDistributor.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 商品池弹窗 -->
    <el-dialog v-model="goodsVisible" :title="`配置商品池 - ${goodsRow?.name || ''}`" width="720px">
      <div class="dialog-tip">不选择商品时，该分销商默认可售全店商品；选择后，小程序只展示并允许下单所选商品。</div>
      <el-select
        v-model="selectedGoodsIds"
        multiple
        filterable
        clearable
        collapse-tags
        collapse-tags-tooltip
        placeholder="选择该分销商可售商品"
        style="width:100%"
      >
        <el-option
          v-for="g in goodsOptions"
          :key="g.id"
          :label="goodsLabel(g)"
          :value="g.id"
        >
          <div class="goods-option">
            <span>{{ g.goods_name }}</span>
            <span>¥{{ Number(g.sell_price || 0).toFixed(2) }}</span>
          </div>
        </el-option>
      </el-select>
      <template #footer>
        <el-button @click="goodsVisible = false">{{ t('miniprogramDistributor.cancel') }}</el-button>
        <el-button type="primary" :loading="acting" @click="saveGoodsPool">保存商品池</el-button>
      </template>
    </el-dialog>

    <!-- 素材库弹窗 -->
    <el-dialog v-model="materialVisible" :title="`素材库 - ${materialRow?.name || '全部'}`" width="860px">
      <div class="material-toolbar">
        <el-button type="primary" @click="openMaterialForm()">新增素材</el-button>
      </div>
      <el-table :data="materials" border height="360px">
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="scope" label="范围" width="90">
          <template #default="{ row }">{{ row.scope === 'public' ? '公共' : '专属' }}</template>
        </el-table-column>
        <el-table-column prop="goods_name" label="关联商品" min-width="120" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="openMaterialForm(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteMaterial(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="materialFormVisible" :title="materialForm.id ? '编辑素材' : '新增素材'" width="560px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="materialForm.title" placeholder="如：牛肉干朋友圈文案" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="materialForm.type" style="width:100%">
            <el-option label="文案" value="text" />
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="海报" value="poster" />
          </el-select>
        </el-form-item>
        <el-form-item label="范围">
          <el-radio-group v-model="materialForm.scope">
            <el-radio-button label="public">公共</el-radio-button>
            <el-radio-button label="distributor">当前分销商</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联商品">
          <el-select v-model="materialForm.goods_id" filterable clearable style="width:100%">
            <el-option v-for="g in goodsOptions" :key="g.id" :label="g.goods_name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件链接">
          <el-input v-model="materialForm.file_url" placeholder="图片/视频/海报 URL" />
        </el-form-item>
        <el-form-item label="文案内容">
          <el-input v-model="materialForm.content" type="textarea" :rows="5" placeholder="可复制给分销商使用的推广文案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="materialFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="saveMaterial">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'

const { t } = useI18n()

function statusText(status: number) {
  if (status === 1) return t('miniprogramDistributor.statusApproved')
  if (status === 2) return t('miniprogramDistributor.statusRejected')
  return t('miniprogramDistributor.statusPending')
}

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const activeTab = ref('')

const approveVisible = ref(false)
const approveRow = ref<any>(null)
const approveRate = ref(10)
const approveNote = ref('')
const acting = ref(false)

const editRateVisible = ref(false)
const editRow = ref<any>(null)
const editRate = ref(10)

const goodsVisible = ref(false)
const goodsRow = ref<any>(null)
const goodsOptions = ref<any[]>([])
const selectedGoodsIds = ref<number[]>([])

const materialVisible = ref(false)
const materialRow = ref<any>(null)
const materials = ref<any[]>([])
const materialFormVisible = ref(false)
const materialForm = ref<any>({ id: 0, title: '', type: 'text', content: '', file_url: '', goods_id: null, scope: 'public' })

async function loadList() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: 20 }
    if (activeTab.value !== '') params.status = activeTab.value
    const res = await http.get('/distributor/list', { params })
    list.value = res.data?.rows ?? []
    total.value = res.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function openApprove(row: any) {
  approveRow.value = row
  approveRate.value = 10
  approveNote.value = ''
  approveVisible.value = true
}

async function handleApprove() {
  acting.value = true
  try {
    const res = await http.post('/distributor/approve', {
      id: approveRow.value.id,
      note: approveNote.value,
    })
    ElMessage.success(t('miniprogramDistributor.approvedWithCode', { code: res.data?.code }))
    approveVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('miniprogramDistributor.operationFailed'))
  } finally {
    acting.value = false
  }
}

async function handleReject(row: any) {
  try {
    await ElMessageBox.prompt(t('miniprogramDistributor.rejectReasonPrompt'), t('miniprogramDistributor.rejectConfirmTitle'), { confirmButtonText: t('miniprogramDistributor.rejectConfirmButton'), cancelButtonText: t('miniprogramDistributor.cancel'), inputPlaceholder: t('miniprogramDistributor.rejectReasonInput') })
  } catch { return }
  try {
    await http.post('/distributor/reject', { id: row.id })
    ElMessage.success(t('miniprogramDistributor.rejected'))
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('miniprogramDistributor.operationFailed'))
  }
}

function openEditRate(row: any) {
  editRow.value = row
  editRate.value = Number(row.commission_rate)
  editRateVisible.value = true
}

async function handleEditRate() {
  acting.value = true
  try {
    await http.post('/distributor/edit', { id: editRow.value.id, commission_rate: editRate.value })
    ElMessage.success(t('miniprogramDistributor.updated'))
    editRateVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('miniprogramDistributor.operationFailed'))
  } finally {
    acting.value = false
  }
}

function goodsLabel(g: any) {
  return `${g.goods_name || ''}${g.goods_sn ? ` (${g.goods_sn})` : ''}`
}

async function loadGoodsOptions() {
  if (goodsOptions.value.length) return
  const res = await http.get('/goods/ShopGoods/index', { params: { page: 1, list_rows: 500 } })
  goodsOptions.value = res.data?.rows ?? []
}

async function openGoodsDialog(row: any) {
  goodsRow.value = row
  selectedGoodsIds.value = []
  goodsVisible.value = true
  await loadGoodsOptions()
  const res = await http.get('/distributor/goods', { params: { distributor_id: row.id } })
  selectedGoodsIds.value = (res.data ?? []).map((g: any) => Number(g.goods_id))
}

async function saveGoodsPool() {
  acting.value = true
  try {
    await http.post('/distributor/goods/save', { distributor_id: goodsRow.value.id, goods_ids: selectedGoodsIds.value })
    ElMessage.success('商品池已保存')
    goodsVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('miniprogramDistributor.operationFailed'))
  } finally {
    acting.value = false
  }
}

async function openMaterialDialog(row: any) {
  materialRow.value = row
  materialVisible.value = true
  await loadGoodsOptions()
  await loadMaterials()
}

async function loadMaterials() {
  const params: any = {}
  if (materialRow.value?.id) params.distributor_id = materialRow.value.id
  const res = await http.get('/distributor/materials', { params })
  materials.value = res.data ?? []
}

function openMaterialForm(row?: any) {
  materialForm.value = row
    ? { ...row }
    : { id: 0, title: '', type: 'text', content: '', file_url: '', goods_id: null, scope: 'public' }
  materialFormVisible.value = true
}

async function saveMaterial() {
  acting.value = true
  try {
    const payload = {
      ...materialForm.value,
      goods_id: materialForm.value.goods_id || 0,
      distributor_id: materialForm.value.scope === 'distributor' ? (materialRow.value?.id || 0) : 0,
    }
    await http.post('/distributor/materials/save', payload)
    ElMessage.success('素材已保存')
    materialFormVisible.value = false
    await loadMaterials()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('miniprogramDistributor.operationFailed'))
  } finally {
    acting.value = false
  }
}

async function deleteMaterial(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该素材吗？', '提示', { type: 'warning' })
  } catch { return }
  await http.post('/distributor/materials/del', { id: row.id })
  ElMessage.success('已删除')
  loadMaterials()
}

onMounted(loadList)
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.dialog-tip { font-size: 13px; color: #666; margin-bottom: 12px; line-height: 1.6; }
.goods-option { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.material-toolbar { display: flex; justify-content: flex-end; margin-bottom: 12px; }
</style>
