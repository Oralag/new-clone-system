<template>
  <div class="scan-page">
    <div class="wx-nav-bar">
      <div class="wx-nav-left">
        <button class="nav-icon-btn" @click="router.back()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>
      <div class="wx-nav-title">扫码查库存</div>
      <div class="wx-nav-right" />
    </div>
    <div class="scan-body">
      <div class="scan-placeholder">
        <div class="scan-icon">📷</div>
        <div class="scan-tip">正在调用摄像头...</div>
        <div class="scan-sub">扫码功能开发中</div>
        <button class="scan-btn" @click="router.back()">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.scan-page { min-height: 100vh; background: #f5f5f5; }
.wx-nav-bar { background: #fff; display: flex; align-items: center; height: 44px; padding: 0 4px; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 20; }
.wx-nav-left { flex: 1; display: flex; align-items: center; }
.wx-nav-title { flex: 0 0 auto; font-size: 17px; font-weight: 700; color: #1d2129; text-align: center; padding: 0 8px; }
.wx-nav-right { flex: 1; }
.nav-icon-btn { width: 40px; height: 40px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 6px; }
.scan-body { padding: 40px 20px; }
.scan-placeholder { text-align: center; }
.scan-icon { font-size: 64px; margin-bottom: 16px; }
.scan-tip { font-size: 16px; color: #333; margin-bottom: 8px; }
.scan-sub { font-size: 14px; color: #999; margin-bottom: 24px; }
.scan-btn { background: #2E6BE6; color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; cursor: pointer; }
</style>
