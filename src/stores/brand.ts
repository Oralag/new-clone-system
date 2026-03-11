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
  // 先读新 key，再兼容旧 key
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('erp_brand_data')
  if (raw) {
    try { return { ...defaultBrand(), ...JSON.parse(raw) } } catch {}
  }
  return defaultBrand()
}

function defaultBrand(): BrandData {
  return {
    name: '', slogan: '', intro: '', foundYear: '', scale: '', region: '', priceLevel: '',
    industry: '', subIndustry: '',
    products: [], sellingPoints: '',
    competitors: [], referenceAccounts: '',
    targetAge: [], targetGender: '',
    audienceDesc: '', audiencePain: '',
    tones: [], taboos: '',
    adForbiddenWords: [], keywords: [], trendingFilters: [],
    publishFreq: '', mainPlatforms: [],
  }
}

export const useBrandStore = defineStore('brand', () => {
  const brand = reactive<BrandData>(loadBrand())

  const isConfigured = computed(() => !!(brand.name && brand.industry && brand.subIndustry))

  const systemPrompt = computed(() => {
    const p: string[] = []
    if (brand.name) p.push(`品牌：${brand.name}`)
    if (brand.slogan) p.push(`口号：${brand.slogan}`)
    if (brand.industry) p.push(`行业：${brand.industry}${brand.subIndustry ? ' / ' + brand.subIndustry : ''}`)
    if (brand.products.length) p.push(`核心产品：${brand.products.join('、')}`)
    if (brand.sellingPoints) p.push(`卖点：${brand.sellingPoints.split('\n').filter(Boolean).join('；')}`)
    if (brand.targetAge.length) p.push(`目标用户：${brand.targetAge.join('/')} ${brand.targetGender}`)
    if (brand.tones.length) p.push(`品牌调性：${brand.tones.join('、')}`)
    if (brand.keywords.length) p.push(`必含关键词：${brand.keywords.join('、')}`)
    if (brand.taboos) p.push(`禁忌：${brand.taboos}`)
    if (brand.adForbiddenWords.length) p.push(`广告违禁词：${brand.adForbiddenWords.join('、')}`)
    return p.length ? `你是品牌「${brand.name}」的AI内容助手。\n${p.join('\n')}\n\n请严格按照以上品牌信息生成内容，避免广告违禁词。` : ''
  })

  function saveBrand() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brand))
  }

  return { brand, isConfigured, systemPrompt, saveBrand }
})
