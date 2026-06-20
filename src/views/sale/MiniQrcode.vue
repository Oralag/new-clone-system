<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2 class="page-title">{{ $t('sale.miniQrcode.pageTitle') }}</h2>
      <p class="page-sub">{{ $t('sale.miniQrcode.pageSub') }}</p>
    </div>

    <el-row :gutter="24">
      <!-- 左：生成面板 -->
      <el-col :span="10">
        <div class="card">
          <div class="card-title">{{ $t('sale.miniQrcode.genCardTitle') }}</div>
          <el-form label-position="top" @submit.prevent>
            <el-form-item :label="$t('sale.miniQrcode.sceneLabel')">
              <el-input v-model="form.scene" :placeholder="$t('sale.miniQrcode.scenePlaceholder')" clearable />
              <div class="field-hint">{{ $t('sale.miniQrcode.sceneHint') }}</div>
            </el-form-item>
            <el-form-item :label="$t('sale.miniQrcode.pageLabel')">
              <el-select v-model="form.page" style="width:100%">
                <el-option :label="$t('sale.miniQrcode.pageLottery')" value="pages/lottery/index" />
                <el-option :label="$t('sale.miniQrcode.pageMall')" value="pages/index/index" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('sale.miniQrcode.sizeLabel')">
              <el-select v-model="form.width" style="width:100%">
                <el-option :label="$t('sale.miniQrcode.size430')" :value="430" />
                <el-option :label="$t('sale.miniQrcode.size280')" :value="280" />
                <el-option :label="$t('sale.miniQrcode.size1280')" :value="1280" />
              </el-select>
            </el-form-item>
            <el-button type="primary" :loading="loading" style="width:100%" @click="generate">
              {{ $t('sale.miniQrcode.generateBtn') }}
            </el-button>
          </el-form>

          <!-- 生成结果 -->
          <div v-if="qrBase64" class="qr-result">
            <img :src="qrBase64" class="qr-img" :alt="form.scene" />
            <div class="qr-scene">{{ $t('sale.miniQrcode.batchLabel') }}{{ generatedScene }}</div>
            <div class="qr-actions">
              <el-button type="primary" @click="downloadQr">{{ $t('sale.miniQrcode.downloadBtn') }}</el-button>
              <el-button @click="copyBase64">{{ $t('sale.miniQrcode.copyBase64Btn') }}</el-button>
            </div>
            <div class="qr-tip">{{ $t('sale.miniQrcode.qrTip') }}</div>
          </div>
        </div>
      </el-col>

      <!-- 右：扫码统计 -->
      <el-col :span="14">
        <div class="card">
          <div class="card-title-row">
            <span class="card-title">{{ $t('sale.miniQrcode.statsCardTitle') }}</span>
            <el-button size="small" @click="loadStats">{{ $t('sale.miniQrcode.refreshBtn') }}</el-button>
          </div>
          <el-table :data="stats" stripe size="small" style="width:100%">
            <el-table-column prop="scene" :label="$t('sale.miniQrcode.colScene')" min-width="140" />
            <el-table-column prop="total" :label="$t('sale.miniQrcode.colTotal')" width="110" align="center" />
            <el-table-column prop="unique_users" :label="$t('sale.miniQrcode.colUniqueUsers')" width="90" align="center" />
            <el-table-column :label="$t('sale.miniQrcode.colLastScan')" min-width="130">
              <template #default="{ row }">
                {{ row.last_scan ? new Date(row.last_scan).toLocaleDateString('zh-CN') : '-' }}
              </template>
            </el-table-column>
          </el-table>
          <div v-if="stats.length === 0" class="empty-tip">{{ $t('sale.miniQrcode.emptyStats') }}</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const { t } = useI18n()

const form = ref({ scene: '', page: 'pages/lottery/index', width: 430 })
const loading = ref(false)
const qrBase64 = ref('')
const generatedScene = ref('')
const stats = ref<any[]>([])

onMounted(() => loadStats())

async function generate() {
  if (!form.value.scene.trim()) return ElMessage.warning(t('sale.miniQrcode.warnScene'))
  loading.value = true
  try {
    const res = await http.post('/adminapi/mini/qrcode', {
      scene: form.value.scene.trim(),
      page: form.value.page,
      width: form.value.width,
    })
    qrBase64.value = res.data.data.base64
    generatedScene.value = res.data.data.scene
    ElMessage.success(t('sale.miniQrcode.successGenerate'))
    loadStats()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || t('sale.miniQrcode.errorGenerate'))
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await http.get('/adminapi/mini/qrcode/stats')
    stats.value = res.data.data || []
  } catch {}
}

function downloadQr() {
  const a = document.createElement('a')
  a.href = qrBase64.value
  a.download = `qrcode-${generatedScene.value}.png`
  a.click()
}

function copyBase64() {
  navigator.clipboard.writeText(qrBase64.value)
  ElMessage.success(t('sale.miniQrcode.successCopy'))
}
</script>

<style scoped>
.page-wrap { padding: 24px; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 600; margin: 0 0 6px; }
.page-sub { color: #888; font-size: 13px; margin: 0; }

.card {
  background: #fff; border-radius: 8px;
  padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 24px;
}
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 20px; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }

.field-hint { font-size: 12px; color: #aaa; margin-top: 4px; line-height: 1.5; }

.qr-result { margin-top: 24px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 24px; }
.qr-img { width: 200px; height: 200px; border: 1px solid #eee; border-radius: 8px; }
.qr-scene { font-size: 13px; color: #666; margin: 10px 0 14px; }
.qr-actions { display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; }
.qr-tip { font-size: 12px; color: #aaa; }

.empty-tip { text-align: center; color: #ccc; padding: 40px 0; font-size: 13px; }
</style>
