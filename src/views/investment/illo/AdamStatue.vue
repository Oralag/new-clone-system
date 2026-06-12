<template>
  <div class="adam-statue">
    <svg viewBox="-130 -210 260 260" width="312" height="312" xmlns="http://www.w3.org/2000/svg">
      <!-- ── 环形广场 ── -->
      <ellipse cx="0" cy="0" rx="122" ry="58" fill="#e9e0c6" stroke="#4f4839" stroke-width="1.4"/>
      <ellipse cx="0" cy="0" rx="104" ry="49" fill="none" stroke="#c9bc9a" stroke-width="1.2"/>
      <!-- 放射铺装 -->
      <g stroke="#c9bc9a" stroke-width="1">
        <line x1="-118" y1="0" x2="-64" y2="0"/>
        <line x1="64" y1="0" x2="118" y2="0"/>
        <line x1="-86" y1="-38" x2="-46" y2="-21"/>
        <line x1="46" y1="-21" x2="86" y2="-38"/>
        <line x1="-86" y1="38" x2="-46" y2="21"/>
        <line x1="46" y1="21" x2="86" y2="38"/>
        <line x1="0" y1="-55" x2="0" y2="-31"/>
        <line x1="0" y1="31" x2="0" y2="55"/>
      </g>
      <!-- 草环 -->
      <ellipse cx="0" cy="0" rx="62" ry="29" fill="#c0c8a2" stroke="#4f4839" stroke-width="1.3"/>
      <ellipse cx="0" cy="0" rx="44" ry="20.5" fill="#e9e0c6" stroke="#4f4839" stroke-width="1.2"/>
      <!-- 四丛灌木 -->
      <g v-for="(b, i) in bushes" :key="i" :transform="`translate(${b[0]},${b[1]})`">
        <ellipse cx="0" cy="0" rx="9" ry="5" :fill="i % 2 ? '#9aa87a' : '#a7b489'" stroke="#4f4839" stroke-width="1.1"/>
        <ellipse cx="-3" cy="-2" rx="4" ry="2.4" fill="#bfc9a2" stroke="none"/>
      </g>

      <!-- ── 三层基座 ── -->
      <g stroke="#4f4839" stroke-width="1.3">
        <path d="M-34,-4 a34,16 0 0 1 68,0 l0,7 a34,16 0 0 1 -68,0 z" fill="#d8cba8"/>
        <ellipse cx="0" cy="-4" rx="34" ry="16" fill="#ece2c8"/>
        <path d="M-25,-13 a25,12 0 0 1 50,0 l0,7 a25,12 0 0 1 -50,0 z" fill="#cfc1a0"/>
        <ellipse cx="0" cy="-13" rx="25" ry="12" fill="#e5dabe"/>
        <path d="M-16,-34 l32,0 0,22 a16,7.5 0 0 1 -32,0 z" fill="#c5b694"/>
        <rect x="-16" y="-34" width="32" height="22" fill="#d8cba8"/>
        <ellipse cx="0" cy="-34" rx="16" ry="7.5" fill="#ece2c8"/>
      </g>
      <!-- 铭牌 -->
      <rect x="-12" y="-26" width="24" height="10" rx="1.5" fill="#a8997a" stroke="#4f4839" stroke-width="1"/>
      <text x="0" y="-18.6" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#f6f0dc" font-family="monospace" letter-spacing="1.5">ADAM</text>

      <!-- ── 亚当雕像（银灰金属）── -->
      <g stroke="#4f4839" stroke-width="1.3" stroke-linejoin="round">
        <!-- 光环 -->
        <ellipse class="statue-halo" cx="0" cy="-92" rx="46" ry="58" fill="#e8b54a" opacity="0.0"/>
        <!-- 腿 -->
        <path d="M-12,-72 l8,0 -1,30 2,4 -10,0 1,-6 z" fill="#a8b0b6"/>
        <path d="M4,-72 l8,0 1,28 2,6 -10,0 -1,-6 z" fill="#98a0a8"/>
        <ellipse cx="-8" cy="-37" rx="7" ry="3.4" fill="#8a929a"/>
        <ellipse cx="9" cy="-36" rx="7" ry="3.4" fill="#8a929a"/>
        <!-- 髋 -->
        <path d="M-13,-78 l26,0 -2,8 -22,0 z" fill="#8a929a"/>
        <!-- 躯干（倒梯形胸甲） -->
        <path d="M-17,-108 q17,-6 34,0 l-4,30 q-13,4 -26,0 z" fill="#b9c0c6"/>
        <path d="M-10,-102 q10,-3 20,0 l-2,12 q-8,2 -16,0 z" fill="#cdd3d8" stroke-width="1"/>
        <circle class="statue-core" cx="0" cy="-95" r="3.2" fill="#e8b54a" stroke-width="1"/>
        <!-- 肩 + 手臂 -->
        <circle cx="-19" cy="-104" r="6" fill="#a8b0b6"/>
        <circle cx="19" cy="-104" r="6" fill="#98a0a8"/>
        <path d="M-22,-100 l-3,24 4,8 5,-2 -2,-28 z" fill="#a8b0b6"/>
        <path d="M22,-100 l4,22 -2,9 -5,-1 -1,-28 z" fill="#98a0a8"/>
        <!-- 颈 -->
        <rect x="-3.5" y="-114" width="7" height="7" fill="#8a929a"/>
        <!-- 头 -->
        <path d="M-10,-134 q10,-5 20,0 l-1.5,16 q-8.5,4 -17,0 z" fill="#b9c0c6"/>
        <!-- 面甲 -->
        <path d="M-7,-128 l14,0 -1,7 q-6,2.5 -12,0 z" fill="#5a6068"/>
        <rect class="statue-eye" x="-5" y="-126" width="10" height="2.6" rx="1.3" fill="#e8d49a"/>
        <!-- 头顶饰 -->
        <path d="M-2,-139 l4,0 1,5 -6,0 z" fill="#8a929a"/>
      </g>
    </svg>
    <div class="statue-caption">
      <span class="sc-title">亚当 · ADAM</span>
      <span class="sc-sub">园区唯一机器人</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const bushes: Array<[number, number]> = [
  [-88, -22], [88, -22], [-88, 24], [88, 24],
]
</script>

<style scoped>
.adam-statue {
  position: relative;
  display: inline-block;
  pointer-events: none;
}
.statue-core { animation: statueCore 3s ease-in-out infinite; }
@keyframes statueCore {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.statue-eye { animation: statueEye 5s ease-in-out infinite; }
@keyframes statueEye {
  0%, 88%, 100% { opacity: 1; }
  93% { opacity: 0.2; }
}
.statue-halo { animation: statueHalo 4.5s ease-in-out infinite; }
@keyframes statueHalo {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.10; }
}
.statue-caption {
  position: absolute;
  left: 50%;
  top: calc(100% - 38px);
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  background: #f6f0dc;
  border: 1.5px solid #4f4839;
  border-radius: 5px;
  padding: 3px 10px;
  box-shadow: 2px 2px 0 rgba(79, 72, 57, 0.25);
  white-space: nowrap;
}
.sc-title { font-size: 11px; font-weight: 800; color: #4f4839; letter-spacing: 1px; }
.sc-sub { font-size: 8px; color: #8a8068; letter-spacing: 1px; }
</style>
