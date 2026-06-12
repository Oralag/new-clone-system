<template>
  <div class="illo-bldg" :class="{ locked, selected }">
    <svg viewBox="-120 -195 240 202" :width="240 * scaleK" :height="202 * scaleK" xmlns="http://www.w3.org/2000/svg">
      <!-- 地面阴影 -->
      <ellipse :cx="0" :cy="-2" :rx="shadowR" :ry="shadowR * 0.42" fill="#4f4839" opacity="0.12" />

      <!-- 几何体（背→前顺序） -->
      <polygon
        v-for="(p, i) in parts"
        :key="i"
        :points="p.pts"
        :fill="p.fill"
        :stroke="p.stroke === false ? 'none' : INK"
        :stroke-width="p.thin ? 0.7 : 1.3"
        stroke-linejoin="round"
        :opacity="p.opacity ?? 1"
      />

      <!-- ── 楼顶/立面装饰（扁平插画图标）── -->
      <!-- 研究院：大显微镜 -->
      <g v-if="type === 'research_institute'" :transform="anchor(30, 18, 42)">
        <path d="M-2,-34 q14,-4 16,12 l-3,1 q-2,-13 -12,-10 z" fill="#8e8878" :stroke="INK" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="-6" y="-36" width="9" height="5" rx="1" fill="#b8b2a0" :stroke="INK" stroke-width="1.2"/>
        <rect x="-3" y="-31" width="4" height="14" fill="#a8a290" :stroke="INK" stroke-width="1.2"/>
        <rect x="-5" y="-17" width="8" height="4" fill="#8e8878" :stroke="INK" stroke-width="1.2"/>
        <rect x="-12" y="-4" width="26" height="4" rx="1.5" fill="#9a9484" :stroke="INK" stroke-width="1.2"/>
        <rect x="-4" y="-13" width="10" height="2.5" fill="#cfdee4" :stroke="INK" stroke-width="1"/>
        <path d="M11,-23 l3,0 0,19 -3,0" fill="#8e8878" :stroke="INK" stroke-width="1.2"/>
      </g>

      <!-- 风险实验室：大烧瓶 -->
      <g v-if="type === 'risk_lab'" :transform="anchor(15, 12, 18)">
        <path d="M-4,-30 l8,0 0,10 8,16 q1,3 -2,3 l-20,0 q-3,0 -2,-3 l8,-16 z" fill="#eef0ea" :stroke="INK" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M-9,-7 l18,0 3,5 q1,2 -2,2 l-20,0 q-3,0 -2,-2 z" fill="#a8c87e" :stroke="INK" stroke-width="1.1"/>
        <rect x="-5.5" y="-32" width="11" height="3" rx="1" fill="#d6c9a8" :stroke="INK" stroke-width="1.1"/>
        <circle cx="3" cy="-12" r="1.6" fill="#cde2a8" :stroke="INK" stroke-width="0.7"/>
        <circle cx="-2" cy="-16" r="1.1" fill="#cde2a8" :stroke="INK" stroke-width="0.7"/>
      </g>

      <!-- 情报站：雷达碟×2 -->
      <g v-if="type === 'intel_station'" :transform="anchor(14, 12, 48)">
        <g transform="translate(-14,-6) rotate(-18)">
          <ellipse cx="0" cy="0" rx="13" ry="5.5" fill="#e9e0c6" :stroke="INK" stroke-width="1.2"/>
          <ellipse cx="0" cy="-1" rx="9" ry="3.6" fill="#f4eeda" :stroke="INK" stroke-width="0.8"/>
          <line x1="0" y1="0" x2="0" y2="-10" :stroke="INK" stroke-width="1.2"/>
          <circle cx="0" cy="-10" r="1.5" fill="#c98d6b" :stroke="INK" stroke-width="0.8"/>
        </g>
        <g transform="translate(13,-12) rotate(22)">
          <ellipse cx="0" cy="0" rx="10" ry="4.4" fill="#e9e0c6" :stroke="INK" stroke-width="1.2"/>
          <line x1="0" y1="0" x2="0" y2="-8" :stroke="INK" stroke-width="1.1"/>
          <circle cx="0" cy="-8" r="1.2" fill="#c98d6b" :stroke="INK" stroke-width="0.8"/>
        </g>
        <line x1="0" y1="2" x2="0" y2="-22" :stroke="INK" stroke-width="1.4"/>
        <circle class="illo-blink" cx="0" cy="-23" r="2" fill="#d06848"/>
      </g>

      <!-- 反应堆：闪电标志 -->
      <g v-if="type === 'reactor'" :transform="anchor(20, 6, 30)">
        <path d="M-10,-12 l7,0 -4,8 8,0 -12,16 3,-11 -6,0 z" fill="#e8b54a" :stroke="INK" stroke-width="1.1" stroke-linejoin="round"/>
        <path transform="translate(15,0)" d="M-10,-12 l7,0 -4,8 8,0 -12,16 3,-11 -6,0 z" fill="#e8b54a" :stroke="INK" stroke-width="1.1" stroke-linejoin="round"/>
      </g>

      <!-- 数据仓库：软盘标志 -->
      <g v-if="type === 'data_center'" :transform="anchor(17, 4, 36)">
        <path d="M-9,-9 l15,0 3,3 0,15 -18,0 z" fill="#6f8fb8" :stroke="INK" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="-5" y="-9" width="8" height="6" fill="#e9e0c6" :stroke="INK" stroke-width="0.9"/>
        <rect x="-6" y="1" width="11" height="7" rx="1" fill="#f4eeda" :stroke="INK" stroke-width="0.9"/>
      </g>

      <!-- 仲裁所：天平 -->
      <g v-if="type === 'arbitration_hall'" :transform="anchor(17, 4, 30)">
        <line x1="0" y1="-14" x2="0" y2="-2" :stroke="INK" stroke-width="1.3"/>
        <line x1="-9" y1="-12" x2="9" y2="-12" :stroke="INK" stroke-width="1.3"/>
        <path d="M-9,-12 l-3.5,6 a4.5,2.5 0 0 0 7,0 z" fill="#e8b54a" :stroke="INK" stroke-width="1"/>
        <path d="M9,-12 l-3.5,6 a4.5,2.5 0 0 0 7,0 z" fill="#e8b54a" :stroke="INK" stroke-width="1"/>
        <rect x="-4" y="-2" width="8" height="2.5" fill="#9a9484" :stroke="INK" stroke-width="0.9"/>
      </g>

      <!-- 营销顾问所：屋顶图表牌 -->
      <g v-if="type === 'marketing_consultancy'" :transform="anchor(17, 6, 22)">
        <rect x="-16" y="-24" width="32" height="20" rx="2" fill="#f4eeda" :stroke="INK" stroke-width="1.3"/>
        <polyline points="-11,-9 -5,-14 0,-11 6,-19 11,-16" fill="none" stroke="#c05a48" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
        <rect x="-11" y="-8" width="4" height="3" fill="#a8bf86" :stroke="INK" stroke-width="0.7"/>
        <rect x="-4" y="-10" width="4" height="5" fill="#a8bf86" :stroke="INK" stroke-width="0.7"/>
        <rect x="3" y="-12" width="4" height="7" fill="#a8bf86" :stroke="INK" stroke-width="0.7"/>
        <line x1="-12" y1="-4" x2="-12" y2="0" :stroke="INK" stroke-width="1.2"/>
        <line x1="12" y1="-4" x2="12" y2="0" :stroke="INK" stroke-width="1.2"/>
      </g>

      <!-- 广告公司：霓虹板 -->
      <g v-if="type === 'ad_company'" :transform="anchor(13, 4, 34)">
        <rect x="-13" y="-18" width="26" height="14" rx="2" fill="#3c3830" :stroke="INK" stroke-width="1.3"/>
        <text x="0" y="-7.5" text-anchor="middle" font-size="9" font-weight="bold" fill="#e08aa8" font-family="monospace">AD</text>
        <line x1="-8" y1="-4" x2="-8" y2="0" :stroke="INK" stroke-width="1.1"/>
        <line x1="8" y1="-4" x2="8" y2="0" :stroke="INK" stroke-width="1.1"/>
      </g>

      <!-- 图书馆：门口书本 -->
      <g v-if="type === 'library'" :transform="anchor(17, -1, 0)">
        <path d="M-7,-5 q7,-3 7,0 q0,-3 7,0 l0,6 q-7,-3 -7,0 q0,-3 -7,0 z" fill="#f4eeda" :stroke="INK" stroke-width="1" stroke-linejoin="round"/>
      </g>

      <!-- 亚当的角落：信箱 -->
      <g v-if="type === 'corner'" :transform="anchor(24, -2, 0)">
        <rect x="-3" y="-12" width="6" height="5" rx="2" fill="#c98d6b" :stroke="INK" stroke-width="1"/>
        <line x1="0" y1="-7" x2="0" y2="0" :stroke="INK" stroke-width="1.2"/>
      </g>

      <!-- 学院：旗帜 -->
      <g v-if="type === 'adam_academy'" :transform="anchor(18, 13, 44)">
        <line x1="0" y1="2" x2="0" y2="-16" :stroke="INK" stroke-width="1.3"/>
        <path class="illo-flag" d="M0,-16 l12,3 -12,3 z" fill="#c05a48" :stroke="INK" stroke-width="1"/>
      </g>

      <!-- 锁定：围挡+LOCKED -->
      <g v-if="locked">
        <rect x="-58" y="-26" width="116" height="18" rx="2" fill="#f4eeda" :stroke="INK" stroke-width="1.3" opacity="0.96"/>
        <line x1="-58" y1="-26" x2="-40" y2="-8" :stroke="'#e8b54a'" stroke-width="4"/>
        <line x1="-30" y1="-26" x2="-12" y2="-8" :stroke="'#e8b54a'" stroke-width="4"/>
        <line x1="-2" y1="-26" x2="16" y2="-8" :stroke="'#e8b54a'" stroke-width="4"/>
        <line x1="26" y1="-26" x2="44" y2="-8" :stroke="'#e8b54a'" stroke-width="4"/>
        <rect x="-58" y="-26" width="116" height="18" rx="2" fill="none" :stroke="INK" stroke-width="1.3"/>
        <text x="0" y="-13" text-anchor="middle" font-size="9" font-weight="bold" :fill="INK" font-family="monospace" letter-spacing="2">UNDER&#160;CONSTRUCTION</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: string
  locked?: boolean
  selected?: boolean
}>()

const INK = '#4f4839'

// ── 调色板 ──
const C = {
  stoneT: '#f6f0dc', stoneL: '#ece2c8', stoneR: '#d8cba8',
  creamT: '#f3ecd6', creamL: '#e7dcc0', creamR: '#d2c39e',
  whiteT: '#f6f4ec', whiteL: '#eeeada', whiteR: '#dcd6c2',
  glassL: '#cfdfe6', glassR: '#b4c9d2', glassT: '#dfe9ec',
  roofT: '#9b968a', roofL: '#8b8678', roofR: '#787262',
  slateT: '#7e7a6e', slateL: '#6e6a5e', slateR: '#5c584c',
  brickL: '#d9b08c', brickR: '#c29472', brickT: '#e5c4a4',
  darkL: '#56524a', darkR: '#46423a', darkT: '#67635a',
  terraT: '#d49b76', terraS: '#c98d6b', terraD: '#b07a55',
  win: '#bcd2da', winD: '#9db8c2',
  door: '#6e5a42',
  concT: '#ddd6c0', concL: '#cdc4aa', concR: '#b8ae92',
}

interface Part { pts: string; fill: string; stroke?: boolean; thin?: boolean; opacity?: number }

interface BCfg { k: number; shadow: number }
const CFGS: Record<string, BCfg> = {
  bureau:                { k: 1.45, shadow: 78 },
  finance_gateway:       { k: 1.35, shadow: 52 },
  reactor:               { k: 1.4,  shadow: 66 },
  intel_station:         { k: 1.35, shadow: 44 },
  research_institute:    { k: 1.4,  shadow: 70 },
  data_center:           { k: 1.35, shadow: 56 },
  risk_lab:              { k: 1.3,  shadow: 50 },
  marketing_consultancy: { k: 1.3,  shadow: 56 },
  ad_company:            { k: 1.3,  shadow: 42 },
  arbitration_hall:      { k: 1.35, shadow: 62 },
  adam_academy:          { k: 1.35, shadow: 58 },
  archive:               { k: 1.3,  shadow: 52 },
  corner:                { k: 1.25, shadow: 44 },
  library:               { k: 1.3,  shadow: 60 },
}
const DEF_CFG: BCfg = { k: 1.25, shadow: 46 }
const cfg = computed(() => CFGS[props.type] || DEF_CFG)
const scaleK = computed(() => cfg.value.k * 0.62)
const shadowR = computed(() => cfg.value.shadow)

// ── 等轴测投影：x→右上，y→左上，z→上 ──
function PT(x: number, y: number, z: number): [number, number] {
  return [(x - y) * 2.2, -((x + y) * 1.1 + z * 2.2)]
}
/** 模板用：把网格点转成 transform 字符串 */
function anchor(x: number, y: number, z: number): string {
  const [px, py] = PT(x, y, z)
  return `translate(${px},${py})`
}

function makeParts(type: string): Part[] {
  const parts: Part[] = []
  const q = (a: [number, number, number], b: [number, number, number], c: [number, number, number], d: [number, number, number], fill: string, extra?: Partial<Part>) => {
    parts.push({ pts: [PT(...a), PT(...b), PT(...c), PT(...d)].map(p => p.join(',')).join(' '), fill, ...extra })
  }
  const t = (a: [number, number, number], b: [number, number, number], c: [number, number, number], fill: string, extra?: Partial<Part>) => {
    parts.push({ pts: [PT(...a), PT(...b), PT(...c)].map(p => p.join(',')).join(' '), fill, ...extra })
  }
  /** 长方体：左面、右面、顶面 */
  const box = (x: number, y: number, z: number, w: number, d: number, h: number, cl: string, cr: string, ct: string) => {
    q([x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h], cl)
    q([x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h], cr)
    q([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h], ct)
  }
  /** 人字屋顶（屋脊沿 x 轴） */
  const gable = (x: number, y: number, z: number, w: number, d: number, rh: number, cFront: string, cSide: string, ov = 1.5) => {
    // 背坡（基本被挡住，先画）
    q([x - ov, y + d + ov, z], [x + w + ov, y + d + ov, z], [x + w + ov, y + d / 2, z + rh], [x - ov, y + d / 2, z + rh], cSide)
    // 左侧山墙三角
    t([x - ov, y - ov, z], [x - ov, y + d + ov, z], [x - ov, y + d / 2, z + rh], cSide)
    // 前坡
    q([x - ov, y - ov, z], [x + w + ov, y - ov, z], [x + w + ov, y + d / 2, z + rh], [x - ov, y + d / 2, z + rh], cFront)
  }
  /** 右面窗（y 平面） */
  const winR = (x: number, y: number, z: number, w: number, h: number, fill = C.win) => {
    q([x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h], fill, { thin: true })
  }
  /** 左面窗（x 平面） */
  const winL = (x: number, y: number, z: number, d: number, h: number, fill = C.winD) => {
    q([x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h], fill, { thin: true })
  }

  switch (type) {
    // ── 投资局：古典政厅（台基+柱廊+山花）──
    case 'bureau': {
      box(-2, -2, 0, 48, 40, 3, C.concL, C.concR, C.concT)
      box(0, 0, 3, 44, 36, 3, C.stoneL, C.stoneR, C.stoneT)
      // 主体（后退）
      box(4, 8, 6, 36, 26, 22, C.creamL, C.creamR, C.creamT)
      winL(4, 12, 12, 6, 10)
      winL(4, 24, 12, 6, 10)
      // 前柱廊 ×5
      for (let i = 0; i < 5; i++) {
        box(5 + i * 8, 2, 6, 3, 3, 20, C.whiteL, C.whiteR, C.whiteT)
      }
      // 柱顶过梁
      box(2, 0, 26, 42, 36, 4, C.stoneL, C.stoneR, C.stoneT)
      // 山形屋顶
      gable(2, 0, 30, 42, 36, 13, C.roofL, C.roofR)
      // 大门
      winR(19, 8, 6, 8, 14, C.door)
      break
    }
    // ── 金融机构：玻璃高塔 ──
    case 'finance_gateway': {
      box(0, 0, 0, 32, 28, 7, C.stoneL, C.stoneR, C.stoneT)
      box(3, 3, 7, 26, 22, 54, C.glassL, C.glassR, C.glassT)
      // 楼层横线（右面/左面）
      for (let f = 1; f <= 8; f++) {
        winR(4, 3, 7 + f * 6, 24, 1.4, '#9db8c2')
        winL(3, 4, 7 + f * 6, 20, 1.4, '#8aa6b2')
      }
      // 竖向幕墙分缝
      for (let v = 1; v <= 3; v++) winR(3 + v * 6.5, 3, 8, 1, 52, '#a9c2cc')
      // 顶部设备层
      box(8, 8, 61, 16, 12, 5, C.darkL, C.darkR, C.darkT)
      // 入口雨棚
      box(10, -1, 7, 12, 4, 1.5, C.whiteL, C.whiteR, C.whiteT)
      winR(12, 0, 0, 8, 7, C.door)
      break
    }
    // ── 反应堆：工业厂房+烟囱 ──
    case 'reactor': {
      box(0, 0, 0, 42, 30, 20, C.concL, C.concR, C.concT)
      // 大门（卷帘）
      winR(5, 0, 0, 12, 12, '#9a9484')
      winR(6, 0, 0, 10, 1.2, '#7d7768')
      winR(6, 0, 3, 10, 1.2, '#7d7768')
      winR(6, 0, 6, 10, 1.2, '#7d7768')
      // 上层机房
      box(8, 6, 20, 26, 18, 16, C.stoneL, C.stoneR, C.stoneT)
      // 烟囱×2
      box(36, 20, 20, 5, 5, 18, C.slateL, C.slateR, C.slateT)
      box(36, 12, 20, 5, 5, 13, C.slateL, C.slateR, C.slateT)
      // 管道
      box(0, 8, 14, 42, 2.5, 2.5, C.roofL, C.roofR, C.roofT)
      break
    }
    // ── 情报站：观测塔 ──
    case 'intel_station': {
      box(2, 2, 0, 24, 20, 6, C.concL, C.concR, C.concT)
      // 塔身（略收分）
      box(6, 5, 6, 16, 14, 24, C.creamL, C.creamR, C.creamT)
      box(8, 7, 30, 12, 10, 14, C.whiteL, C.whiteR, C.whiteT)
      // 观察窗带
      winR(9, 7, 38, 10, 4)
      winL(8, 8, 38, 8, 4)
      winR(8, 5, 16, 12, 3)
      // 平台
      box(5, 4, 44, 18, 16, 4, C.stoneL, C.stoneR, C.stoneT)
      winR(10, 5, 6, 6, 10, C.door)
      break
    }
    // ── 研究院：白色实验楼（楼顶显微镜）──
    case 'research_institute': {
      // 低层翼楼
      box(0, 0, 0, 44, 32, 16, C.whiteL, C.whiteR, C.whiteT)
      // 窗带
      winR(3, 0, 6, 38, 6)
      winL(0, 4, 6, 26, 6)
      // 高层体块
      box(24, 6, 16, 18, 22, 16, C.creamL, C.creamR, C.creamT)
      winR(26, 6, 20, 14, 5)
      winL(24, 8, 20, 18, 5)
      // 屋顶设备
      box(6, 8, 16, 8, 6, 5, C.concL, C.concR, C.concT)
      winR(18, 0, 0, 8, 12, C.door)
      break
    }
    // ── 数据仓库：深色立方 ──
    case 'data_center': {
      box(0, 0, 0, 34, 30, 32, C.slateL, C.slateR, C.slateT)
      // 通风格栅
      for (let f = 0; f < 4; f++) {
        winR(3, 0, 5 + f * 7, 28, 2.5, '#8b8678')
        winL(0, 3, 5 + f * 7, 24, 2.5, '#7d7768')
      }
      box(6, 8, 32, 7, 6, 4, C.darkL, C.darkR, C.darkT)
      box(20, 16, 32, 7, 6, 4, C.darkL, C.darkR, C.darkT)
      winR(13, 0, 0, 8, 10, C.door)
      break
    }
    // ── 风险实验室：白色小楼（楼顶烧瓶）──
    case 'risk_lab': {
      box(0, 0, 0, 30, 24, 16, C.whiteL, C.whiteR, C.whiteT)
      winR(3, 0, 6, 7, 7)
      winR(20, 0, 6, 7, 7)
      winL(0, 4, 6, 16, 7)
      box(-1, -1, 16, 32, 26, 2, C.stoneL, C.stoneR, C.stoneT)
      winR(12, 0, 0, 7, 11, C.door)
      break
    }
    // ── 营销顾问所：商务办公楼（楼顶图表牌）──
    case 'marketing_consultancy': {
      box(0, 0, 0, 34, 26, 20, C.creamL, C.creamR, C.creamT)
      for (let f = 0; f < 2; f++) {
        winR(3, 0, 4 + f * 8, 8, 5)
        winR(14, 0, 4 + f * 8, 8, 5)
        winL(0, 4, 4 + f * 8, 18, 5)
      }
      box(-1, -1, 20, 36, 28, 2, C.roofL, C.roofR, C.roofT)
      winR(25, 0, 0, 7, 11, C.door)
      break
    }
    // ── 广告公司：深色窄塔 ──
    case 'ad_company': {
      box(0, 0, 0, 24, 22, 38, C.darkL, C.darkR, C.darkT)
      for (let f = 0; f < 5; f++) {
        winR(3, 0, 4 + f * 7, 18, 3.5, '#8a8478')
        winL(0, 3, 4 + f * 7, 16, 3.5, '#787264')
      }
      winR(8, 0, 0, 8, 9, '#3a362e')
      break
    }
    // ── 仲裁所：小古典法院 ──
    case 'arbitration_hall': {
      box(-1, -1, 0, 38, 30, 3, C.concL, C.concR, C.concT)
      box(2, 6, 3, 32, 20, 18, C.creamL, C.creamR, C.creamT)
      for (let i = 0; i < 4; i++) box(4 + i * 8.5, 2, 3, 2.6, 2.6, 16, C.whiteL, C.whiteR, C.whiteT)
      box(1, 0, 19, 34, 28, 3.5, C.stoneL, C.stoneR, C.stoneT)
      gable(1, 0, 22.5, 34, 28, 10, C.roofL, C.roofR)
      winR(14, 6, 3, 7, 12, C.door)
      break
    }
    // ── 亚当学院：红砖学堂+钟楼 ──
    case 'adam_academy': {
      box(0, 0, 0, 38, 26, 18, C.brickL, C.brickR, C.brickT)
      for (let i = 0; i < 3; i++) winR(4 + i * 11, 0, 6, 6, 8, '#f0ead6')
      winL(0, 5, 6, 16, 8, '#e6dcc4')
      gable(0, 0, 18, 38, 26, 10, C.roofL, C.roofR)
      // 钟楼
      box(15, 10, 24, 8, 8, 16, C.creamL, C.creamR, C.creamT)
      gable(15, 10, 40, 8, 8, 5, C.terraS, C.terraD)
      winR(17, 10, 30, 4, 5, '#f4eeda')
      winR(15, 0, 0, 8, 10, C.door)
      break
    }
    // ── 档案馆：砖楼 ──
    case 'archive': {
      box(0, 0, 0, 30, 26, 26, C.brickL, C.brickR, C.brickT)
      for (let f = 0; f < 3; f++) {
        winR(4, 0, 5 + f * 7.5, 5, 5, '#f0ead6')
        winR(13, 0, 5 + f * 7.5, 5, 5, '#f0ead6')
        winR(22, 0, 5 + f * 7.5, 5, 5, '#f0ead6')
        winL(0, 5, 5 + f * 7.5, 7, 5, '#e6dcc4')
        winL(0, 15, 5 + f * 7.5, 7, 5, '#e6dcc4')
      }
      box(-1.5, -1.5, 26, 33, 29, 2.5, C.stoneL, C.stoneR, C.stoneT)
      winR(11, 0, 0, 8, 4.5, C.door)
      break
    }
    // ── 亚当的角落：小屋+院墙 ──
    case 'corner': {
      // 院墙
      box(-10, 0, 0, 8, 1.8, 4, C.stoneL, C.stoneR, C.stoneT)
      box(-10, 0, 0, 1.8, 18, 4, C.stoneL, C.stoneR, C.stoneT)
      // 主屋
      box(0, 0, 0, 22, 17, 12, C.creamL, C.creamR, C.creamT)
      winR(3, 0, 4, 6, 5)
      winL(0, 3, 4, 6, 5)
      gable(0, 0, 12, 22, 17, 9, C.terraS, C.terraD)
      // 烟囱
      box(16, 11, 17, 3.5, 3.5, 8, C.brickL, C.brickR, C.brickT)
      winR(12, 0, 0, 6, 9, C.door)
      break
    }
    // ── 图书馆：双坡庄园 ──
    case 'library': {
      box(0, 0, 0, 30, 22, 16, C.creamL, C.creamR, C.creamT)
      // 拱窗 ×3
      for (let i = 0; i < 3; i++) winR(3.5 + i * 8.5, 0, 5, 5.5, 8)
      winL(0, 4, 5, 14, 8)
      gable(0, 0, 16, 30, 22, 10, C.roofL, C.roofR)
      // 侧翼
      box(24, 14, 0, 16, 14, 11, C.creamL, C.creamR, C.creamT)
      gable(24, 14, 11, 16, 14, 7, C.terraS, C.terraD)
      winR(27, 14, 3, 5, 5)
      winR(11, 0, 0, 7, 11, C.door)
      break
    }
    // ── 默认：小工坊 ──
    default: {
      box(0, 0, 0, 24, 20, 14, C.creamL, C.creamR, C.creamT)
      winR(4, 0, 5, 6, 5)
      winL(0, 4, 5, 6, 5)
      gable(0, 0, 14, 24, 20, 8, C.roofL, C.roofR)
      winR(14, 0, 0, 6, 9, C.door)
    }
  }
  return parts
}

const parts = computed(() => makeParts(props.type))
</script>

<style scoped>
.illo-bldg {
  position: relative;
  display: inline-block;
  transition: transform 0.18s ease;
}
.illo-bldg.selected svg {
  filter: drop-shadow(0 0 10px rgba(232, 181, 74, 0.85));
}
.illo-bldg.locked svg {
  filter: saturate(0.45) opacity(0.88);
}

.illo-blink { animation: illoBlink 1.8s ease-in-out infinite; }
@keyframes illoBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
.illo-flag { animation: illoFlag 2.6s ease-in-out infinite; transform-origin: left center; }
@keyframes illoFlag {
  0%, 100% { transform: skewY(0deg); }
  50% { transform: skewY(4deg); }
}
</style>
