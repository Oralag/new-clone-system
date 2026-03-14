<template>
  <el-dialog
    v-model="visible"
    title="新建商品"
    width="800px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="fd" label-width="100px" style="max-height:65vh;overflow-y:auto;padding-right:8px">

      <!-- 基本信息 -->
      <div class="sec-title">基本信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="商品类型" prop="goods_type">
            <el-select v-model="fd.goods_type" style="width:100%">
              <el-option label="成品" :value="1" />
              <el-option label="半成品" :value="2" />
              <el-option label="原材料" :value="3" />
              <el-option label="辅料" :value="4" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品编码" prop="goods_sn">
            <div style="display:flex;gap:4px;width:100%">
              <el-input v-model="fd.goods_sn" placeholder="不填写自动生成" style="flex:1" />
              <el-button @click="fd.goods_sn = genGoodsSn()">自动生成</el-button>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品名称" prop="goods_name" :rules="[{ required: true, message: '请输入商品名称' }]">
            <el-input v-model="fd.goods_name" placeholder="请输入商品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="英文名称" prop="en_name">
            <el-input v-model="fd.en_name" placeholder="请输入英文名称（可选）" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品分类" prop="cate_id" :rules="[{ required: true, message: '请选择商品分类' }]">
            <div style="display:flex;gap:4px;width:100%">
              <el-select v-model="fd.cate_id" placeholder="请选择" clearable style="flex:1">
                <el-option v-for="c in cateOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <el-button :icon="Plus" @click="quickAddCate" />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品牌" prop="brand_id">
            <div style="display:flex;gap:4px;width:100%">
              <el-select v-model="fd.brand_id" placeholder="请选择（可选）" clearable style="flex:1">
                <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
              <el-button :icon="Plus" @click="quickAddBrand" />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品单位" prop="unit_id" :rules="[{ required: true, message: '请选择单位' }]">
            <div style="display:flex;gap:4px;width:100%">
              <el-select v-model="fd.unit_id" placeholder="请选择单位" style="flex:1" @change="onUnitChange">
                <el-option v-for="u in unitOptions" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
              <el-button :icon="Plus" @click="quickAddUnit" />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="条形码" prop="barcode">
            <div style="display:flex;gap:4px;width:100%">
              <el-input v-model="fd.barcode" placeholder="请输入或扫描条形码" style="flex:1" />
              <el-button :icon="Camera" title="摄像头扫码" @click="openScanner" />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 价格 -->
      <div class="sec-title" style="margin-top:12px">价格</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="采购/成本价" prop="cost_price">
            <el-input-number v-model="fd.cost_price" :min="0" :precision="2" controls-position="right" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="销售价" prop="sell_price">
            <el-input-number v-model="fd.sell_price" :min="0" :precision="2" controls-position="right" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 库存预警 -->
      <div class="sec-title" style="margin-top:12px">库存预警</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="安全库存下限">
            <el-input-number v-model="fd.safe_min" :min="0" controls-position="right" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="安全库存上限">
            <el-input-number v-model="fd.safe_max" :min="0" controls-position="right" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 权限设置 -->
      <div class="sec-title" style="margin-top:12px">权限设置</div>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="可销售">
            <el-switch v-model="fd.can_sale" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="可采购">
            <el-switch v-model="fd.can_buy" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="可自制">
            <el-switch v-model="fd.can_make" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="状态">
            <el-switch v-model="fd.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 备注 -->
      <el-form-item label="备注" style="margin-top:8px">
        <el-input v-model="fd.remark" type="textarea" :rows="2" placeholder="可选备注" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">确认新建</el-button>
    </template>
  </el-dialog>

  <!-- 扫码对话框 -->
  <el-dialog v-model="scannerVisible" title="扫描条形码" width="min(420px, 95vw)" append-to-body destroy-on-close :close-on-click-modal="false" @closed="stopScanner">
    <div style="text-align:center">
      <video ref="videoRef" style="width:100%;max-height:60vh;background:#000;border-radius:8px;display:block" autoplay muted playsinline />
      <div v-if="scanError" style="color:#f56c6c;margin-top:8px;font-size:13px">{{ scanError }}</div>
      <div v-else-if="!scanning" style="color:#909399;margin-top:8px;font-size:13px">正在启动摄像头...</div>
      <div v-else style="color:#409eff;margin-top:8px;font-size:13px">对准条形码，自动识别中...</div>
    </div>
    <template #footer>
      <el-button @click="scannerVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Camera } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { createGoods, getGoodsCateList, createGoodsCate, getBrandList, createBrand, getUnitList, createUnit } from '@/api/goods'

const emit = defineEmits<{
  (e: 'created', goods: any): void
}>()

const visible = ref(false)
const saving = ref(false)
const formRef = ref()

const cateOptions = ref<any[]>([])
const brandOptions = ref<any[]>([])
const unitOptions = ref<any[]>([])

async function loadOptions() {
  const [c, b, u] = await Promise.all([
    getGoodsCateList({ list_rows: 200 }),
    getBrandList({ list_rows: 200 }),
    getUnitList({ list_rows: 200 }),
  ])
  const rawCates = c.data?.rows ?? []
  cateOptions.value = rawCates.filter((c: any, i: number) => rawCates.findIndex((x: any) => x.name === c.name) === i)
  brandOptions.value = b.data?.rows ?? []
  unitOptions.value = u.data?.rows ?? []
}

function genGoodsSn(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `SP${y}${m}${d}${rand}`
}

const defaultFd = () => ({
  goods_sn: '', goods_name: '', en_name: '', goods_memo: '',
  goods_type: 2,  // 默认半成品
  cate_id: null as any, cate_name: '',
  brand_id: null as any, brand_name: '',
  unit_id: null as any, unit_name: '',
  barcode: '',
  sell_price: 0, cost_price: 0,
  safe_min: 0, safe_max: 0,
  sort: 0, make_time: 0,
  can_sale: 0, can_buy: 1, can_make: 1, can_outsource: 0,
  status: 1, remark: '',
})

const fd = reactive(defaultFd())

function open(initialType?: number) {
  Object.assign(fd, defaultFd())
  if (initialType) fd.goods_type = initialType
  visible.value = true
}

function onUnitChange(id: any) {
  const u = unitOptions.value.find(x => x.id === id)
  fd.unit_name = u?.name ?? ''
}

async function quickAddCate() {
  const name = prompt('请输入新分类名称')
  if (!name?.trim()) return
  try {
    await createGoodsCate({ name: name.trim() })
    const res = await getGoodsCateList({ list_rows: 200 })
    const rc = res.data?.rows ?? []; cateOptions.value = rc.filter((c: any, i: number) => rc.findIndex((x: any) => x.name === c.name) === i)
    const newOne = cateOptions.value.find(c => c.name === name.trim())
    if (newOne) fd.cate_id = newOne.id
    ElMessage.success('分类创建成功')
  } catch (e: any) { ElMessage.error(e?.message ?? '创建失败') }
}

async function quickAddBrand() {
  const name = prompt('请输入品牌名称')
  if (!name?.trim()) return
  try {
    await createBrand({ name: name.trim() })
    const res = await getBrandList({ list_rows: 200 })
    brandOptions.value = res.data?.rows ?? []
    const newOne = brandOptions.value.find(b => b.name === name.trim())
    if (newOne) fd.brand_id = newOne.id
    ElMessage.success('品牌创建成功')
  } catch (e: any) { ElMessage.error(e?.message ?? '创建失败') }
}

async function quickAddUnit() {
  const name = prompt('请输入单位名称（如：个、斤、克）')
  if (!name?.trim()) return
  try {
    await createUnit({ name: name.trim() })
    const res = await getUnitList({ list_rows: 200 })
    unitOptions.value = res.data?.rows ?? []
    const newOne = unitOptions.value.find(u => u.name === name.trim())
    if (newOne) { fd.unit_id = newOne.id; fd.unit_name = newOne.name }
    ElMessage.success('单位创建成功')
  } catch (e: any) { ElMessage.error(e?.message ?? '创建失败') }
}

async function handleSave() {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning('请填写必填项（商品名称、商品分类、商品单位）'); return
  }
  saving.value = true
  try {
    const res = await createGoods({ ...fd })
    const newId = res.data?.id ?? 0
    // Also persist goods_type locally for list display
    if (newId && fd.goods_type) {
      const GOODS_TYPE_KEY = 'erp_goods_type_map'
      const typeMap = (() => { try { return JSON.parse(localStorage.getItem(GOODS_TYPE_KEY) || '{}') } catch { return {} } })()
      typeMap[newId] = fd.goods_type
      localStorage.setItem(GOODS_TYPE_KEY, JSON.stringify(typeMap))
    }
    ElMessage.success('商品创建成功，已同步到商品库')
    visible.value = false
    emit('created', { ...fd, id: newId })
  } catch (e: any) {
    ElMessage.error(e?.message ?? '创建失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadOptions)

// ── 扫码填条形码 ──────────────────────────────────────────────────────────────
const scannerVisible = ref(false)
const scanning = ref(false)
const scanError = ref('')
const videoRef = ref<HTMLVideoElement>()
let codeReader: BrowserMultiFormatReader | null = null
let scanStream: MediaStream | null = null

async function openScanner() {
  scanError.value = ''
  scanning.value = false
  scannerVisible.value = true
  setTimeout(startScanner, 300)
}

async function startScanner() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    scanStream = stream
    if (videoRef.value) videoRef.value.srcObject = stream
    scanning.value = true
    codeReader = new BrowserMultiFormatReader()
    codeReader.decodeFromStream(stream, videoRef.value!, (result) => {
      if (!result) return
      fd.barcode = result.getText()
      ElMessage.success(`扫码成功：${fd.barcode}`)
      stopScanner()
      scannerVisible.value = false
    })
  } catch (e: any) {
    scanError.value = e?.message ?? '摄像头启动失败，请检查浏览器权限'
    scanning.value = false
  }
}

function stopScanner() {
  try { codeReader?.reset() } catch {}
  codeReader = null
  scanning.value = false
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null }
  if (videoRef.value) videoRef.value.srcObject = null
}

defineExpose({ open })
</script>

<style scoped>
.sec-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  padding: 6px 0 10px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 12px;
}
</style>
