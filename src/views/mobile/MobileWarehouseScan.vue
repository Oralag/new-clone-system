<template>
  <div class="scan-page">
    <!-- 顶部导航 -->
    <div class="scan-nav">
      <button class="scan-nav-back" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <div class="scan-nav-title">扫码查库存</div>
      <div style="width:40px" />
    </div>

    <!-- 扫码模式 -->
    <div v-if="mode === 'camera'" class="scan-camera-area">
      <div v-if="scanError" class="scan-error">
        <div class="scan-err-icon">⚠️</div>
        <div class="scan-err-msg">{{ scanError }}</div>
        <button class="scan-action-btn" @click="initCamera">重试</button>
      </div>
      <div v-else class="scan-viewfinder">
        <div v-if="!cameraReady" class="scan-loading">
          <div class="scan-spinner" />
          <div>正在启动摄像头...</div>
        </div>
        <video ref="videoEl" class="scan-video" :class="{ ready: cameraReady }" autoplay playsinline muted />
        <!-- 扫描框 -->
        <div class="scan-frame">
          <div class="scan-corner tl" />
          <div class="scan-corner tr" />
          <div class="scan-corner bl" />
          <div class="scan-corner br" />
        </div>
        <div class="scan-hint">将条形码对准扫描框</div>
      </div>
      <div class="scan-camera-footer">
        <button class="scan-switch-btn" @click="mode = 'manual'">手动输入</button>
      </div>
    </div>

    <!-- 手动输入模式 -->
    <div v-else class="scan-manual-area">
      <div class="scan-input-group">
        <input
          v-model="manualBarcode"
          class="scan-input"
          placeholder="请输入商品条码"
          @keydown.enter="doSearch"
        />
        <button class="scan-search-btn" @click="doSearch">查询</button>
      </div>
      <div class="scan-mode-tip">没有条码？试试手动搜索</div>
      <div class="scan-camera-tip">
        <button class="scan-switch-link" @click="mode = 'camera'; initCamera()">
          📷 打开摄像头扫描
        </button>
      </div>
    </div>

    <!-- 查询结果 -->
    <div v-if="result" class="scan-result">
      <div class="scan-result-header">
        <div class="scan-result-icon">📦</div>
        <div class="scan-result-name">{{ result.goods_name || result.name || result.goods?.name || '未知商品' }}</div>
        <div v-if="result.barcode" class="scan-result-barcode">条码: {{ result.barcode }}</div>
      </div>

      <!-- 规格列表 -->
      <div v-if="result.skus && result.skus.length > 0" class="scan-sku-list">
        <div v-for="sku in result.skus" :key="sku.id" class="scan-sku-row">
          <div class="scan-sku-info">
            <div class="scan-sku-name">{{ sku.name || result.goods_name }}</div>
            <div class="scan-sku-spec">{{ sku.spec || sku.sku || '默认规格' }}</div>
          </div>
          <div class="scan-sku-stock" :class="{ low: Number(sku.stock_num || 0) <= 0 }">
            <div class="scan-stock-num">{{ sku.stock_num ?? sku.stock ?? 0 }}</div>
            <div class="scan-stock-label">库存</div>
          </div>
        </div>
      </div>

      <!-- 无规格单品 -->
      <div v-else class="scan-single-stock">
        <div class="scan-stock-big" :class="{ zero: Number(result.stock_num || result.stock || 0) <= 0 }">
          <div class="scan-stock-val">{{ result.stock_num ?? result.stock ?? 0 }}</div>
          <div class="scan-stock-unit">当前库存</div>
        </div>
      </div>

      <div class="scan-result-actions">
        <button class="scan-action-btn" @click="mode = 'camera'; initCamera()">继续扫码</button>
      </div>
    </div>

    <!-- 无结果 -->
    <div v-else-if="searched && !result" class="scan-empty">
      <div class="scan-empty-icon">🔍</div>
      <div class="scan-empty-msg">未找到该条码对应的商品</div>
      <button class="scan-action-btn" @click="mode = 'camera'; initCamera()">重新扫码</button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="scan-loading-overlay">
      <div class="scan-spinner large" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { scanGoodsStock } from '@/api/mobile'
import { ElMessage } from 'element-plus'

const router = useRouter()
const mode = ref<'camera' | 'manual'>('manual')  // 默认手动，避免移动端权限弹窗
const manualBarcode = ref('')
const loading = ref(false)
const searched = ref(false)
const result = ref<any>(null)
const cameraReady = ref(false)
const scanError = ref('')
const videoEl = ref<HTMLVideoElement>()

let codeReader: any = null
let scanStream: MediaStream | null = null
let scanFrameCount = 0
let scanAnimationId: number | null = null
const SCAN_MAX_FRAMES = 300 // 约5分钟(300帧/60fps)

async function initCamera() {
  scanError.value = ''
  cameraReady.value = false
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    if (videoEl.value) {
      videoEl.value.srcObject = scanStream
      cameraReady.value = true
    }
    codeReader = new BrowserMultiFormatReader()
    // 持续扫描
    scanLoop()
  } catch (e: any) {
    if (e.name === 'NotAllowedError') {
      scanError.value = '请允许摄像头权限'
    } else if (e.name === 'NotFoundError') {
      scanError.value = '未找到摄像头设备'
    } else {
      scanError.value = e.message || '摄像头启动失败'
    }
    mode.value = 'manual'
  }
}

async function scanLoop() {
  if (!codeReader || !videoEl.value) return
  // 超时停止，避免无限循环
  if (scanFrameCount >= SCAN_MAX_FRAMES) {
    scanError.value = '扫描超时，请重试'
    stopCamera()
    mode.value = 'manual'
    return
  }
  scanFrameCount++
  try {
    const result = await codeReader.decodeFromVideoElement(videoEl.value)
    if (result) {
      const barcode = result.getText()
      stopCamera()
      await doSearchByBarcode(barcode)
    } else {
      scanAnimationId = requestAnimationFrame(scanLoop)
    }
  } catch {
    scanAnimationId = requestAnimationFrame(scanLoop)
  }
}

function stopCamera() {
  if (scanStream) {
    scanStream.getTracks().forEach(t => t.stop())
    scanStream = null
  }
  cameraReady.value = false
  scanFrameCount = 0
  if (scanAnimationId) {
    cancelAnimationFrame(scanAnimationId)
    scanAnimationId = null
  }
}

async function doSearch() {
  if (!manualBarcode.value.trim()) {
    ElMessage.warning('请输入条码')
    return
  }
  await doSearchByBarcode(manualBarcode.value.trim())
}

async function doSearchByBarcode(barcode: string) {
  loading.value = true
  searched.value = true
  result.value = null
  try {
    const res = await scanGoodsStock(barcode)
    result.value = res?.data ?? res ?? null
  } catch (e: any) {
    ElMessage.error(e?.message || '查询失败')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.scan-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: #f5f5f7;
  display: flex;
  flex-direction: column;
}

/* ── 导航栏 ── */
.scan-nav {
  background: #fff;
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 8px;
  border-bottom: 1px solid #e5e6eb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.scan-nav-back {
  width: 40px; height: 40px;
  border: none; background: transparent;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #4e5969;
}
.scan-nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
}

/* ── 摄像头区域 ── */
.scan-camera-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #000;
}
.scan-viewfinder {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
.scan-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s;
}
.scan-video.ready { opacity: 1; }
.scan-loading {
  text-align: center;
  color: #fff;
  font-size: 14px;
  position: absolute;
}
.scan-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
.scan-spinner.large { width: 48px; height: 48px; border-width: 4px; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 扫描框 */
.scan-frame {
  position: absolute;
  width: 260px; height: 160px;
  border: 2px solid rgba(0,113,227,0.6);
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.4);
}
.scan-corner {
  position: absolute;
  width: 24px; height: 24px;
  border-color: #0071e3;
  border-style: solid;
}
.scan-corner.tl { top: -2px; left: -2px; border-width: 4px 0 0 4px; border-radius: 12px 0 0 0; }
.scan-corner.tr { top: -2px; right: -2px; border-width: 4px 4px 0 0; border-radius: 0 12px 0 0; }
.scan-corner.bl { bottom: -2px; left: -2px; border-width: 0 0 4px 4px; border-radius: 0 0 0 12px; }
.scan-corner.br { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; border-radius: 0 0 12px 0; }
.scan-hint {
  position: absolute;
  bottom: 40px;
  color: #fff;
  font-size: 14px;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
.scan-camera-footer {
  padding: 16px;
  text-align: center;
}
.scan-switch-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

/* ── 手动输入 ── */
.scan-manual-area {
  padding: 24px 16px;
  background: #fff;
  flex: 1;
}
.scan-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.scan-input {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  background: #f5f5f7;
}
.scan-input:focus { border-color: #0071e3; background: #fff; }
.scan-search-btn {
  width: 64px; height: 48px;
  background: #0071e3;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.scan-mode-tip { font-size: 13px; color: #86909c; margin-bottom: 24px; }
.scan-camera-tip { text-align: center; }
.scan-switch-link {
  background: none; border: none;
  color: #0071e3;
  font-size: 15px;
  cursor: pointer;
  padding: 8px;
}

/* ── 结果 ── */
.scan-result {
  margin: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.scan-result-header {
  text-align: center;
  margin-bottom: 20px;
}
.scan-result-icon { font-size: 40px; margin-bottom: 8px; }
.scan-result-name { font-size: 17px; font-weight: 700; color: #1d2129; margin-bottom: 4px; }
.scan-result-barcode { font-size: 12px; color: #86909c; }
.scan-sku-list { display: flex; flex-direction: column; gap: 12px; }
.scan-sku-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f7;
  border-radius: 10px;
}
.scan-sku-info { flex: 1; }
.scan-sku-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.scan-sku-spec { font-size: 12px; color: #86909c; margin-top: 2px; }
.scan-sku-stock { text-align: center; min-width: 60px; }
.scan-sku-stock.low .scan-stock-num { color: #f53f3f; }
.scan-stock-num { font-size: 20px; font-weight: 700; color: #00b42a; }
.scan-stock-label { font-size: 11px; color: #86909c; }
.scan-single-stock { text-align: center; padding: 24px 0; }
.scan-stock-big { }
.scan-stock-val { font-size: 48px; font-weight: 700; color: #00b42a; line-height: 1; }
.scan-stock-big.zero .scan-stock-val { color: #f53f3f; }
.scan-stock-unit { font-size: 14px; color: #86909c; margin-top: 8px; }
.scan-result-actions { margin-top: 20px; text-align: center; }
.scan-action-btn {
  background: #0071e3;
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

/* ── 空状态 ── */
.scan-empty {
  text-align: center;
  padding: 48px 24px;
}
.scan-empty-icon { font-size: 56px; margin-bottom: 16px; }
.scan-empty-msg { font-size: 15px; color: #86909c; margin-bottom: 24px; }

/* ── 加载遮罩 ── */
.scan-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

/* ── 错误 ── */
.scan-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #fff;
  text-align: center;
}
.scan-err-icon { font-size: 48px; margin-bottom: 16px; }
.scan-err-msg { font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 24px; }
</style>
