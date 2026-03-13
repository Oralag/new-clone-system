<template>
  <div class="captcha-wrap" @click="refresh">
    <canvas ref="canvasRef" :width="width" :height="height" class="captcha-canvas" />
    <span class="captcha-refresh" title="点击刷新">↻</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ width?: number; height?: number }>()
const emit = defineEmits<{ (e: 'update:code', val: string): void }>()

const canvasRef = ref<HTMLCanvasElement>()
const width = props.width ?? 110
const height = props.height ?? 36

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

function randColor(min = 50, max = 160) {
  return `rgb(${rand(min,max)},${rand(min,max)},${rand(min,max)})`
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#f7f8fa'
  ctx.fillRect(0, 0, width, height)

  // Noise lines
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = randColor(150, 220)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(rand(0, width), rand(0, height))
    ctx.lineTo(rand(0, width), rand(0, height))
    ctx.stroke()
  }

  // Noise dots
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = randColor(150, 220)
    ctx.beginPath()
    ctx.arc(rand(0, width), rand(0, height), 1, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Characters
  let code = ''
  const charCount = 4
  const charWidth = (width - 16) / charCount
  for (let i = 0; i < charCount; i++) {
    const ch = CHARS[rand(0, CHARS.length)]
    code += ch
    ctx.font = `bold ${rand(18, 22)}px 'Arial'`
    ctx.fillStyle = randColor(20, 120)
    ctx.save()
    const x = 8 + i * charWidth + charWidth / 2
    const y = height / 2 + rand(-2, 4)
    ctx.translate(x, y)
    ctx.rotate((rand(-20, 20) * Math.PI) / 180)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  }

  emit('update:code', code)
}

function refresh() { draw() }

onMounted(draw)
defineExpose({ refresh })
</script>

<style scoped>
.captcha-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.captcha-canvas {
  border-radius: 6px;
  border: 1px solid #e8eaed;
  display: block;
}
.captcha-refresh {
  font-size: 16px;
  color: #86909c;
  transition: color 0.15s;
}
.captcha-wrap:hover .captcha-refresh { color: #3a8ee6; }
</style>
