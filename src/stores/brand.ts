import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'

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

function loadBrand(): BrandData {
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('erp_brand_data')
  if (raw) {
    try {
      return { ...defaultBrand(), ...JSON.parse(raw) }
    } catch {
      // ignore invalid brand cache
    }
  }
  return defaultBrand()
}

function defaultBrand(): BrandData {
  return {
    name: '', slogan: '', intro: '', foundYear: '', scale: '', region: '', priceLevel: '',
    industry: '', subIndustry: '',
    products: [], sellingPoints: '',
    competitors: [], referenceAccounts: '',
    targetAge: [], targetGender: '不限',
    audienceDesc: '', audiencePain: '',
    tones: [], taboos: '',
    adForbiddenWords: [], keywords: [], trendingFilters: [],
    publishFreq: '每天1条', mainPlatforms: ['douyin', 'xiaohongshu', 'kuaishou'],
  }
}

export const useBrandStore = defineStore('brand', () => {
  const brand = reactive<BrandData>(loadBrand())
  const savedAt = reactive({ value: localStorage.getItem(`${STORAGE_KEY}_savedAt`) || '' })

  const isConfigured = computed(() => !!(brand.name && brand.industry))

  const systemPrompt = computed(() => {
    const p: string[] = []
    if (brand.name) p.push(`你正在为品牌「${brand.name}」生成内容。`)
    if (brand.slogan) p.push(`口号：${brand.slogan}`)
    if (brand.subIndustry || brand.industry) p.push(`行业：${brand.subIndustry || brand.industry}`)
    if (brand.products.length) p.push(`核心产品：${brand.products.join('、')}`)
    if (brand.sellingPoints) p.push(`产品卖点：${brand.sellingPoints.split('\n').filter(Boolean).join('；')}`)
    if (brand.priceLevel) p.push(`品牌定位：${brand.priceLevel}`)
    if (brand.region) p.push(`主要市场：${brand.region}`)
    if (brand.targetAge.length || brand.targetGender !== '不限') {
      p.push(`目标受众：${brand.targetAge.join('/')} ${brand.targetGender !== '不限' ? brand.targetGender : ''}`.trim())
    }
    if (brand.audienceDesc) p.push(`用户画像：${brand.audienceDesc}`)
    if (brand.audiencePain) p.push(`用户痛点：${brand.audiencePain}`)
    if (brand.tones.length) p.push(`品牌调性：${brand.tones.join('、')}`)
    if (brand.keywords.length) p.push(`必须包含关键词：${brand.keywords.join('、')}`)
    if (brand.taboos) p.push(`内容禁忌：${brand.taboos}`)
    if (brand.adForbiddenWords.length) p.push(`广告违禁词（绝对不能使用）：${brand.adForbiddenWords.join('、')}`)
    if (p.length) p.push('请根据以上品牌信息生成符合品牌调性的内容。')
    return p.join('\n')
  })

  function saveBrand() {
    savedAt.value = new Date().toLocaleString('zh-CN')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brand))
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
