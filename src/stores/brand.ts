import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

export interface BrandData {
  name: string
  slogan: string
  intro: string
  foundYear: string
  scale: string
  region: string
  priceLevel: string
  industry: string
  subIndustry: string
  products: string[]
  sellingPoints: string
  competitors: string[]
  referenceAccounts: string
  targetAge: string[]
  targetGender: string
  audienceDesc: string
  audiencePain: string
  tones: string[]
  taboos: string
  adForbiddenWords: string[]
  keywords: string[]
  trendingFilters: string[]
  publishFreq: string
  mainPlatforms: string[]
}

const STORAGE_KEY = 'brand_profile'

function defaultBrand(): BrandData {
  return {
    name: '',
    slogan: '',
    intro: '',
    foundYear: '',
    scale: '',
    region: '',
    priceLevel: '',
    industry: '',
    subIndustry: '',
    products: [],
    sellingPoints: '',
    competitors: [],
    referenceAccounts: '',
    targetAge: [],
    targetGender: '不限',
    audienceDesc: '',
    audiencePain: '',
    tones: [],
    taboos: '',
    adForbiddenWords: [],
    keywords: [],
    trendingFilters: [],
    publishFreq: '每天1条',
    mainPlatforms: ['douyin', 'xiaohongshu', 'kuaishou'],
  }
}

function loadBrand(): BrandData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('erp_brand_data')
    if (raw) return { ...defaultBrand(), ...JSON.parse(raw) }
  } catch {
    // ignore broken local storage payloads
  }
  return defaultBrand()
}

export const useBrandStore = defineStore('brand', () => {
  const brand = reactive<BrandData>(loadBrand())
  const savedAt = ref(localStorage.getItem(`${STORAGE_KEY}_savedAt`) || '')

  const isConfigured = computed(() => !!brand.name && !!brand.industry)

  const systemPrompt = computed(() => {
    const lines: string[] = []
    if (brand.name) lines.push(`你正在为品牌「${brand.name}」生成内容。`)
    if (brand.slogan) lines.push(`品牌口号：${brand.slogan}`)
    if (brand.subIndustry || brand.industry) lines.push(`行业：${brand.subIndustry || brand.industry}`)
    if (brand.products.length) lines.push(`核心产品：${brand.products.join('、')}`)
    if (brand.sellingPoints) lines.push(`产品卖点：${brand.sellingPoints.split('\n').filter(Boolean).join('；')}`)
    if (brand.priceLevel) lines.push(`品牌定位：${brand.priceLevel}`)
    if (brand.region) lines.push(`主要市场：${brand.region}`)
    if (brand.targetAge.length || brand.targetGender !== '不限') {
      lines.push(`目标受众：${brand.targetAge.join('/')} ${brand.targetGender !== '不限' ? brand.targetGender : ''}`.trim())
    }
    if (brand.audienceDesc) lines.push(`用户画像：${brand.audienceDesc}`)
    if (brand.audiencePain) lines.push(`用户痛点：${brand.audiencePain}`)
    if (brand.tones.length) lines.push(`品牌调性：${brand.tones.join('、')}`)
    if (brand.keywords.length) lines.push(`必须包含关键词：${brand.keywords.join('、')}`)
    if (brand.taboos) lines.push(`内容禁忌：${brand.taboos}`)
    if (brand.adForbiddenWords.length) lines.push(`广告违禁词（绝对不能使用）：${brand.adForbiddenWords.join('、')}`)
    lines.push('请根据以上品牌信息生成符合品牌调性的内容。')
    return lines.join('\n')
  })

  function saveBrand() {
    savedAt.value = new Date().toLocaleString('zh-CN')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...brand }))
    localStorage.setItem(`${STORAGE_KEY}_savedAt`, savedAt.value)
  }

  function resetBrand() {
    Object.assign(brand, defaultBrand())
    savedAt.value = ''
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(`${STORAGE_KEY}_savedAt`)
  }

  return { brand, savedAt, isConfigured, systemPrompt, saveBrand, resetBrand }
})
