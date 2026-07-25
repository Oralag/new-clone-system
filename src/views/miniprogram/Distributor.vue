<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('miniprogramDistributor.title') }}</h2>
      <el-button type="primary" @click="openProductReviews">自营商品审核</el-button>
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
            <el-button size="small" @click="openSettlement(row)">结算配置</el-button>
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

    <el-dialog v-model="productReviewVisible" title="分销商自营商品审核" width="980px">
      <div class="dialog-tip">分销商自营商品由分销商供货、发货和售后；审核通过前不会进入销售流程。平台服务费可按单品覆盖分销商协议比例。</div>
      <el-radio-group v-model="productReviewStatus" size="small" @change="loadProductReviews" style="margin-bottom:16px">
        <el-radio-button label="">全部</el-radio-button><el-radio-button label="pending">待审核</el-radio-button>
        <el-radio-button label="approved">已通过</el-radio-button><el-radio-button label="rejected">已驳回</el-radio-button>
      </el-radio-group>
      <el-table :data="productReviews" border height="460">
        <el-table-column label="商品" min-width="220"><template #default="{row}"><div class="material-cell"><img v-if="firstImage(row)" :src="firstImage(row)" class="material-thumb"/><div><strong>{{row.title}}</strong><div>¥{{Number(row.suggested_price||0).toFixed(2)}} · 库存 {{row.stock_qty||0}}</div></div></div></template></el-table-column>
        <el-table-column prop="distributor_name" label="分销商" width="130"/>
        <el-table-column prop="category" label="分类" width="100"/>
        <el-table-column label="平台费" width="100"><template #default="{row}">{{row.platform_fee_rate ?? row.distributor_platform_fee_rate}}%</template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.review_status==='approved'?'success':row.review_status==='rejected'?'danger':'warning'">{{reviewLabel(row.review_status)}}</el-tag></template></el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip/>
        <el-table-column label="操作" width="150" fixed="right"><template #default="{row}"><el-button v-if="row.review_status!=='approved'" link type="success" @click="reviewProduct(row,'approved')">通过</el-button><el-button v-if="row.review_status!=='rejected'" link type="danger" @click="reviewProduct(row,'rejected')">驳回</el-button></template></el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="settlementVisible" title="分销商结算与协议" width="560px">
      <el-form label-width="130px">
        <el-form-item label="官方商品佣金"><el-input-number v-model="settlementForm.commission_rate" :min="0" :max="50" :precision="1"/> %</el-form-item>
        <el-form-item label="自营商品平台费"><el-input-number v-model="settlementForm.platform_fee_rate" :min="0" :max="50" :precision="1"/> %</el-form-item>
        <el-form-item label="售后结算周期"><el-input-number v-model="settlementForm.settlement_cycle_days" :min="0" :max="60"/> 天</el-form-item>
        <el-form-item label="协议类型"><el-radio-group v-model="settlementForm.agreement_type"><el-radio label="offline">线下协议</el-radio><el-radio label="online">线上协议</el-radio></el-radio-group></el-form-item>
        <el-form-item label="协议编号"><el-input v-model="settlementForm.agreement_no"/></el-form-item>
        <el-form-item label="二级商户号"><el-input v-model="settlementForm.sub_mchid" placeholder="平台收付通开通后填写"/></el-form-item>
        <el-form-item label="结算方式"><el-select v-model="settlementForm.settlement_mode"><el-option label="人工结算" value="manual"/><el-option label="微信自动分账（预留）" value="wechat_profit_sharing"/></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="settlementVisible=false">取消</el-button><el-button type="primary" :loading="acting" @click="saveSettlement">保存</el-button></template>
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
      <div class="dialog-tip">默认勾选当前已在小程序展示的商品；也可继续选择其他可售商品。保存后，该分销商的小程序只展示并允许下单所选商品。</div>
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
        <el-option-group label="当前小程序商品">
          <el-option
            v-for="g in currentMiniGoods"
            :key="g.id"
            :label="goodsLabel(g)"
            :value="g.id"
          >
            <div class="goods-option">
              <span>{{ g.goods_name }}</span>
              <span>¥{{ Number(g.sell_price || 0).toFixed(2) }}</span>
            </div>
          </el-option>
        </el-option-group>
        <el-option-group label="其他可售商品">
          <el-option
            v-for="g in otherSaleGoods"
            :key="g.id"
            :label="goodsLabel(g)"
            :value="g.id"
          >
            <div class="goods-option">
              <span>{{ g.goods_name }}</span>
              <span>¥{{ Number(g.sell_price || 0).toFixed(2) }}</span>
            </div>
          </el-option>
        </el-option-group>
      </el-select>
      <template #footer>
        <el-button @click="goodsVisible = false">{{ t('miniprogramDistributor.cancel') }}</el-button>
        <el-button type="primary" :loading="acting" @click="saveGoodsPool">保存商品池</el-button>
      </template>
    </el-dialog>

    <!-- 素材库弹窗 -->
    <el-dialog v-model="materialVisible" :title="`素材库 - ${materialRow?.name || '全部'}`" width="860px">
      <div class="material-toolbar">
        <el-radio-group v-model="materialCategory" size="small">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button v-for="item in materialCategories" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="openMaterialForm()">新增素材</el-button>
      </div>
      <el-table :data="filteredMaterials" border height="360px">
        <el-table-column label="素材" min-width="210">
          <template #default="{ row }">
            <div class="material-cell">
              <img v-if="materialPreview(row)" :src="materialPreview(row)" class="material-thumb" />
              <div v-else class="material-thumb material-thumb-empty">{{ typeIcon(row.type) }}</div>
              <div class="material-cell-copy">
                <strong>{{ row.title }}</strong>
                <span>{{ typeLabel(row.type) }} · {{ materialFileCount(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" width="90">
          <template #default="{ row }">{{ row.scope === 'public' ? '公共' : '专属' }}</template>
        </el-table-column>
        <el-table-column label="分类" width="100">
          <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
        </el-table-column>
        <el-table-column label="来源" width="110">
          <template #default="{ row }">
            <el-tag :type="row.source === 'sync' ? 'success' : 'info'" size="small">
              {{ row.source === 'sync' ? '已同步' : '手动上传' }}
            </el-tag>
          </template>
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

    <el-dialog v-model="materialFormVisible" :title="materialForm.id ? '编辑素材' : '新增素材'" width="720px" append-to-body>
      <el-form label-width="88px" class="material-form">
        <el-form-item label="标题" required>
          <el-input v-model="materialForm.title" placeholder="如：草原奶制品朋友圈素材" />
        </el-form-item>
        <el-form-item label="素材类型">
          <el-radio-group v-model="materialForm.type" @change="onMaterialTypeChange">
            <el-radio-button label="article">图文</el-radio-button>
            <el-radio-button label="video">视频</el-radio-button>
            <el-radio-button label="poster">海报/单图</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="素材分类" required>
          <el-select v-model="materialForm.category" style="width:100%">
            <el-option v-for="item in materialCategories" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-form-item label="素材来源">
          <el-radio-group v-model="materialForm.source">
            <el-radio-button label="upload">本地上传</el-radio-button>
            <el-radio-button label="sync">同步素材</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="materialForm.source === 'sync'" label="同步地址" required>
          <div class="sync-field">
            <el-input v-model="materialForm.sync_url" placeholder="粘贴品牌素材库或已发布素材的链接" />
            <span>保存后记录同步来源与同步时间，后续可重新同步。</span>
          </div>
        </el-form-item>
        <el-form-item v-else label="上传素材">
          <div class="asset-workbench">
            <template v-if="materialForm.type === 'article'">
              <div class="asset-grid">
                <div v-for="(url, index) in materialForm.file_urls" :key="url + index" class="asset-card">
                  <img :src="url" />
                  <div class="asset-card-actions">
                    <button type="button" :disabled="index === 0" @click="moveMaterialImage(index, -1)">←</button>
                    <button type="button" :disabled="index === materialForm.file_urls.length - 1" @click="moveMaterialImage(index, 1)">→</button>
                    <button type="button" class="danger" @click="removeMaterialImage(index)">删除</button>
                  </div>
                  <span class="asset-order">{{ index + 1 }}</span>
                </div>
                <button v-if="materialForm.file_urls.length < 9" type="button" class="upload-tile" @click="imageInput?.click()">
                  <span class="upload-plus">＋</span>
                  <strong>上传图片</strong>
                  <small>{{ materialForm.file_urls.length }}/9 · 单张≤5MB</small>
                </button>
              </div>
            </template>
            <template v-else-if="materialForm.type === 'video'">
              <div class="video-upload-row">
                <button type="button" class="upload-panel" @click="videoInput?.click()">
                  <span>{{ materialForm.file_url ? '✓' : '▶' }}</span>
                  <strong>{{ materialForm.file_url ? '视频已上传' : '选择视频' }}</strong>
                  <small>MP4 等常用格式 · ≤25MB</small>
                </button>
                <button type="button" class="upload-panel cover-panel" @click="coverInput?.click()">
                  <img v-if="materialForm.cover_url" :src="materialForm.cover_url" />
                  <span v-else>▧</span>
                  <strong>{{ materialForm.cover_url ? '更换封面' : '上传封面' }}</strong>
                  <small>建议 16:9 · ≤5MB</small>
                </button>
              </div>
            </template>
            <template v-else>
              <div class="poster-upload">
                <img v-if="materialForm.file_urls[0]" :src="materialForm.file_urls[0]" />
                <button type="button" class="upload-panel" @click="imageInput?.click()">
                  <span>{{ materialForm.file_urls[0] ? '↻' : '＋' }}</span>
                  <strong>{{ materialForm.file_urls[0] ? '更换图片' : '上传海报或单图' }}</strong>
                  <small>JPG / PNG / WebP · ≤5MB</small>
                </button>
              </div>
            </template>
            <el-progress v-if="materialUploading" :percentage="materialUploadProgress" :stroke-width="6" />
            <input ref="imageInput" hidden type="file" accept="image/*" :multiple="materialForm.type === 'article'" @change="onMaterialImagesSelected" />
            <input ref="videoInput" hidden type="file" accept="video/*" @change="onMaterialVideoSelected" />
            <input ref="coverInput" hidden type="file" accept="image/*" @change="onMaterialCoverSelected" />
          </div>
        </el-form-item>
        <el-form-item label="文案内容">
          <el-input v-model="materialForm.content" type="textarea" :rows="5" maxlength="2000" show-word-limit placeholder="填写可复制给分销商使用的标题、卖点和推广文案" />
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
import { computed, ref, onMounted } from 'vue'
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
const currentMiniGoods = computed(() => goodsOptions.value.filter(g => isMiniProgramGoods(g)))
const otherSaleGoods = computed(() => goodsOptions.value.filter(g => !isMiniProgramGoods(g)))

const materialVisible = ref(false)
const materialRow = ref<any>(null)
const materials = ref<any[]>([])
const materialCategory = ref('')
const materialCategories = [
  { value: 'product', label: '商品推广' },
  { value: 'moments', label: '朋友圈' },
  { value: 'short_video', label: '短视频' },
  { value: 'campaign', label: '活动海报' },
  { value: 'brand', label: '品牌资料' },
]
const filteredMaterials = computed(() => materialCategory.value
  ? materials.value.filter(item => (item.category || 'product') === materialCategory.value)
  : materials.value
)
const materialFormVisible = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const materialUploading = ref(false)
const materialUploadProgress = ref(0)
const materialForm = ref<any>(newMaterialForm())

function newMaterialForm() {
  return {
    id: 0,
    title: '',
    type: 'article',
    content: '',
    file_url: '',
    file_urls: [] as string[],
    cover_url: '',
    source: 'upload',
    sync_url: '',
    category: 'product',
    goods_id: null,
    scope: 'public',
  }
}

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

function isMiniProgramGoods(goods: any) {
  try {
    const remark = typeof goods.remark === 'string' ? JSON.parse(goods.remark || '{}') : (goods.remark || {})
    return remark?.__brand__?.show === true
  } catch {
    return false
  }
}

async function loadGoodsOptions() {
  if (goodsOptions.value.length) return
  const res = await http.get('/goods/ShopGoods/index', { params: { page: 1, list_rows: 500 } })
  goodsOptions.value = (res.data?.rows ?? []).filter((g: any) =>
    Number(g.status ?? 1) === 1 && Number(g.can_sale ?? 1) === 1
  )
}

async function openGoodsDialog(row: any) {
  goodsRow.value = row
  selectedGoodsIds.value = []
  goodsVisible.value = true
  await loadGoodsOptions()
  const res = await http.get('/distributor/goods', { params: { distributor_id: row.id } })
  const savedIds = (res.data ?? []).map((g: any) => Number(g.goods_id))
  selectedGoodsIds.value = savedIds.length
    ? savedIds
    : currentMiniGoods.value.map((g: any) => Number(g.id))
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

function parseMaterialFiles(value: any): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function normalizedMaterialType(type: string) {
  if (type === 'video' || type === 'poster') return type
  return 'article'
}

function typeLabel(type: string) {
  return normalizedMaterialType(type) === 'video' ? '视频' : normalizedMaterialType(type) === 'poster' ? '海报/单图' : '图文'
}

function typeIcon(type: string) {
  return normalizedMaterialType(type) === 'video' ? '▶' : normalizedMaterialType(type) === 'poster' ? '▧' : '文'
}

function categoryLabel(category: string) {
  return materialCategories.find(item => item.value === (category || 'product'))?.label || '商品推广'
}

function materialPreview(row: any) {
  const files = parseMaterialFiles(row.file_urls)
  if (normalizedMaterialType(row.type) === 'video') return row.cover_url || ''
  return files[0] || (row.source === 'sync' ? row.sync_url : '') || row.file_url || ''
}

function materialFileCount(row: any) {
  if (row.source === 'sync') return '同步素材'
  if (normalizedMaterialType(row.type) === 'video') return row.file_url ? '1 个视频' : '暂无文件'
  const count = parseMaterialFiles(row.file_urls).length
  return count ? `${count} 张图片` : '纯文案'
}

function openMaterialForm(row?: any) {
  materialForm.value = row
    ? {
        ...newMaterialForm(),
        ...row,
        type: normalizedMaterialType(row.type),
        source: row.source || 'upload',
        file_urls: parseMaterialFiles(row.file_urls),
      }
    : newMaterialForm()
  materialUploadProgress.value = 0
  materialFormVisible.value = true
}

function onMaterialTypeChange() {
  materialUploadProgress.value = 0
}

async function uploadMaterialFile(file: File, type: 'video' | 'cover'): Promise<string> {
  const limitMb = type === 'video' ? 25 : 5
  if (file.size > limitMb * 1024 * 1024) throw new Error(`文件不能超过 ${limitMb}MB`)
  const token = localStorage.getItem('erp_token') || ''
  const data = new FormData()
  data.append('file', file)
  data.append('type', type)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) materialUploadProgress.value = Math.round(event.loaded / event.total * 100)
    }
    xhr.open('POST', '/api/admin-upload')
    xhr.setRequestHeader('token', token)
    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText)
        if (response.code === 1 && response.data?.url) resolve(response.data.url)
        else reject(new Error(response.message || '上传失败'))
      } catch {
        reject(new Error('上传响应解析失败'))
      }
    }
    xhr.onerror = () => reject(new Error('上传网络异常'))
    xhr.send(data)
  })
}

async function onMaterialImagesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files || [])
  if (!picked.length) return
  const available = materialForm.value.type === 'article'
    ? Math.max(0, 9 - materialForm.value.file_urls.length)
    : 1
  const files = picked.slice(0, available)
  if (!files.length) {
    ElMessage.warning('图文素材最多上传 9 张图片')
    input.value = ''
    return
  }
  materialUploading.value = true
  materialUploadProgress.value = 0
  try {
    const urls: string[] = []
    for (const file of files) urls.push(await uploadMaterialFile(file, 'cover'))
    materialForm.value.file_urls = materialForm.value.type === 'article'
      ? [...materialForm.value.file_urls, ...urls]
      : urls.slice(0, 1)
    ElMessage.success(`已上传 ${urls.length} 张图片`)
  } catch (error: any) {
    ElMessage.error(error?.message || '图片上传失败')
  } finally {
    materialUploading.value = false
    input.value = ''
  }
}

async function onMaterialVideoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  materialUploading.value = true
  materialUploadProgress.value = 0
  try {
    materialForm.value.file_url = await uploadMaterialFile(file, 'video')
    ElMessage.success('视频上传成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '视频上传失败')
  } finally {
    materialUploading.value = false
    input.value = ''
  }
}

async function onMaterialCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  materialUploading.value = true
  materialUploadProgress.value = 0
  try {
    materialForm.value.cover_url = await uploadMaterialFile(file, 'cover')
    ElMessage.success('封面上传成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '封面上传失败')
  } finally {
    materialUploading.value = false
    input.value = ''
  }
}

function removeMaterialImage(index: number) {
  materialForm.value.file_urls.splice(index, 1)
}

function moveMaterialImage(index: number, offset: number) {
  const next = index + offset
  if (next < 0 || next >= materialForm.value.file_urls.length) return
  const files = [...materialForm.value.file_urls]
  ;[files[index], files[next]] = [files[next], files[index]]
  materialForm.value.file_urls = files
}

async function saveMaterial() {
  if (!materialForm.value.title.trim()) return ElMessage.warning('请填写素材标题')
  if (!materialForm.value.category) return ElMessage.warning('请选择素材分类')
  if (materialForm.value.source === 'sync' && !materialForm.value.sync_url.trim()) {
    return ElMessage.warning('请填写同步素材地址')
  }
  if (materialForm.value.source === 'upload' && materialForm.value.type === 'video' && !materialForm.value.file_url) {
    return ElMessage.warning('请先上传视频')
  }
  if (materialForm.value.source === 'upload' && materialForm.value.type === 'poster' && !materialForm.value.file_urls[0]) {
    return ElMessage.warning('请先上传海报或图片')
  }
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

const productReviewVisible = ref(false)
const productReviewStatus = ref('pending')
const productReviews = ref<any[]>([])
const settlementVisible = ref(false)
const settlementForm = ref<any>({})

function firstImage(row: any) {
  const value = row.images
  if (Array.isArray(value)) return value[0] || ''
  try { return JSON.parse(value || '[]')[0] || '' } catch { return '' }
}
function reviewLabel(status: string) { return status === 'approved' ? '已通过' : status === 'rejected' ? '已驳回' : '待审核' }
async function openProductReviews() { productReviewVisible.value = true; await loadProductReviews() }
async function loadProductReviews() {
  const res = await http.get('/distributor/product-submissions', { params: { status: productReviewStatus.value || undefined } })
  productReviews.value = res.data || []
}
async function reviewProduct(row: any, review_status: string) {
  let note = ''
  if (review_status === 'rejected') {
    try { note = await ElMessageBox.prompt('请填写驳回原因', '驳回商品').then((r:any) => r.value) } catch { return }
  }
  const rate = row.platform_fee_rate ?? row.distributor_platform_fee_rate ?? 10
  await http.post('/distributor/product-submissions/review', { id: row.id, review_status, review_note: note, platform_fee_rate: rate })
  ElMessage.success(review_status === 'approved' ? '审核已通过' : '已驳回')
  loadProductReviews()
}
function openSettlement(row: any) {
  settlementForm.value = {
    id: row.id, commission_rate: Number(row.commission_rate || 10),
    platform_fee_rate: Number(row.platform_fee_rate || 10),
    settlement_cycle_days: Number(row.settlement_cycle_days || 7),
    agreement_type: row.agreement_type || 'offline', agreement_no: row.agreement_no || '',
    agreement_url: row.agreement_url || '', sub_mchid: row.sub_mchid || '',
    merchant_onboarding_status: row.merchant_onboarding_status || 'not_started',
    settlement_mode: row.settlement_mode || 'manual',
  }
  settlementVisible.value = true
}
async function saveSettlement() {
  acting.value = true
  try {
    await http.post('/distributor/rate', { id: settlementForm.value.id, commission_rate: settlementForm.value.commission_rate })
    await http.post('/distributor/settlement-config', settlementForm.value)
    ElMessage.success('结算配置已保存'); settlementVisible.value = false; loadList()
  } finally { acting.value = false }
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
.material-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.material-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
.material-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #f4f6f8; flex: 0 0 auto; }
.material-thumb-empty { display: grid; place-items: center; color: #64748b; font-weight: 700; border: 1px solid rgba(15, 23, 42, 0.08); }
.material-cell-copy { display: flex; flex-direction: column; min-width: 0; }
.material-cell-copy strong { color: #172033; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.material-cell-copy span { color: #9097a3; font-size: 12px; margin-top: 3px; }
.material-form :deep(.el-form-item) { margin-bottom: 18px; }
.sync-field { width: 100%; display: flex; flex-direction: column; gap: 6px; }
.sync-field span { color: #9097a3; font-size: 12px; line-height: 1.5; }
.asset-workbench { width: 100%; padding: 14px; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 10px; background: #f8fafc; }
.asset-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.asset-card { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 9px; background: #e9edf2; border: 1px solid rgba(15, 23, 42, 0.08); }
.asset-card img { width: 100%; height: 100%; object-fit: cover; }
.asset-card-actions { position: absolute; inset: auto 5px 5px; display: flex; gap: 3px; opacity: 0; transition: opacity .16s ease; }
.asset-card:hover .asset-card-actions { opacity: 1; }
.asset-card-actions button { flex: 1; min-width: 0; padding: 4px; border: 0; border-radius: 5px; color: #172033; background: rgba(255, 255, 255, 0.92); cursor: pointer; font-size: 11px; }
.asset-card-actions button:disabled { opacity: .4; cursor: not-allowed; }
.asset-card-actions .danger { color: #c2413b; }
.asset-order { position: absolute; top: 6px; left: 6px; min-width: 20px; height: 20px; padding: 0 5px; display: grid; place-items: center; border-radius: 10px; color: #fff; background: rgba(15, 23, 42, .72); font-size: 11px; }
.upload-tile, .upload-panel { border: 1px dashed rgba(37, 99, 235, .34); border-radius: 9px; background: #fff; color: #2563eb; cursor: pointer; transition: border-color .16s ease, background .16s ease; }
.upload-tile:hover, .upload-panel:hover { border-color: #2563eb; background: #f7faff; }
.upload-tile { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.upload-plus { font-size: 24px; line-height: 1; font-weight: 300; }
.upload-tile strong, .upload-panel strong { font-size: 13px; font-weight: 600; }
.upload-tile small, .upload-panel small { color: #9097a3; font-size: 11px; }
.video-upload-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.upload-panel { min-height: 126px; padding: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
.upload-panel > span { font-size: 22px; }
.cover-panel img { width: 92px; height: 52px; border-radius: 6px; object-fit: cover; }
.poster-upload { display: flex; gap: 12px; align-items: stretch; }
.poster-upload > img { width: 126px; height: 126px; border-radius: 9px; object-fit: cover; border: 1px solid rgba(15, 23, 42, 0.08); }
.poster-upload .upload-panel { flex: 1; }
.asset-workbench :deep(.el-progress) { margin-top: 12px; }
@media (max-width: 760px) {
  .asset-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .video-upload-row { grid-template-columns: 1fr; }
}
</style>
