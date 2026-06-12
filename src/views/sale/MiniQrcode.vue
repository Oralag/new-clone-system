<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2 class="page-title">包装二维码</h2>
      <p class="page-sub">为每批包装生成专属小程序码，扫码直达抽奖页，并追踪扫描数据</p>
    </div>

    <el-row :gutter="24">
      <!-- 左：生成面板 -->
      <el-col :span="10">
        <div class="card">
          <div class="card-title">生成小程序码</div>
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="批次编号 (scene)">
              <el-input v-model="form.scene" placeholder="如 pkg-2026-06、box-A001" clearable />
              <div class="field-hint">印在哪批包装上就用哪个编号，方便区分扫码来源</div>
            </el-form-item>
            <el-form-item label="落地页面">
              <el-select v-model="form.page" style="width:100%">
                <el-option label="每日抽奖页" value="pages/lottery/index" />
                <el-option label="商城首页" value="pages/index/index" />
              </el-select>
            </el-form-item>
            <el-form-item label="二维码尺寸">
              <el-select v-model="form.width" style="width:100%">
                <el-option label="430px（推荐印刷用）" :value="430" />
                <el-option label="280px（预览用）" :value="280" />
                <el-option label="1280px（高清大图）" :value="1280" />
              </el-select>
            </el-form-item>
            <el-button type="primary" :loading="loading" style="width:100%" @click="generate">
              生成小程序码
            </el-button>
          </el-form>

          <!-- 生成结果 -->
          <div v-if="qrBase64" class="qr-result">
            <img :src="qrBase64" class="qr-img" :alt="form.scene" />
            <div class="qr-scene">批次：{{ generatedScene }}</div>
            <div class="qr-actions">
              <el-button type="primary" @click="downloadQr">下载图片</el-button>
              <el-button @click="copyBase64">复制Base64</el-button>
            </div>
            <div class="qr-tip">提示：下载后发给设计师/印刷厂，直接嵌入包装版式</div>
          </div>
        </div>
      </el-col>

      <!-- 右：扫码统计 -->
      <el-col :span="14">
        <div class="card">
          <div class="card-title-row">
            <span class="card-title">扫码统计</span>
            <el-button size="small" @click="loadStats">刷新</el-button>
          </div>
          <el-table :data="stats" stripe size="small" style="width:100%">
            <el-table-column prop="scene" label="批次编号" min-width="140" />
            <el-table-column prop="total" label="总扫码次数" width="110" align="center" />
            <el-table-column prop="unique_users" label="独立用户" width="90" align="center" />
            <el-table-column label="最近扫码" min-width="130">
              <template #default="{ row }">
                {{ row.last_scan ? new Date(row.last_scan).toLocaleDateString('zh-CN') : '-' }}
              </template>
            </el-table-column>
          </el-table>
          <div v-if="stats.length === 0" class="empty-tip">暂无数据，生成二维码并投放后这里会有统计</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const form = ref({ scene: '', page: 'pages/lottery/index', width: 430 })
const loading = ref(false)
const qrBase64 = ref('')
const generatedScene = ref('')
const stats = ref<any[]>([])

onMounted(() => loadStats())

async function generate() {
  if (!form.value.scene.trim()) return ElMessage.warning('请填写批次编号')
  loading.value = true
  try {
    const res = await http.post('/adminapi/mini/qrcode', {
      scene: form.value.scene.trim(),
      page: form.value.page,
      width: form.value.width,
    })
    qrBase64.value = res.data.data.base64
    generatedScene.value = res.data.data.scene
    ElMessage.success('生成成功')
    loadStats()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '生成失败，请检查微信配置')
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
  ElMessage.success('已复制到剪贴板')
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
