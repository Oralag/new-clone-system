import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

export interface BrandData {
  id: string
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

const STORAGE_KEY = 'brand_profiles_v2'
const ACTIVE_KEY = 'brand_active_id'

// 预置：数字游牧ERP完整品牌档案
const DEFAULT_ERP_BRAND: BrandData = {
  id: 'nomaderp_default',
  name: '数字游牧ERP',
  slogan: '让每个小微团队都用上AI级别的管理系统',
  intro: '数字游牧ERP是面向现代中小企业和数字游牧创业者的全AI驱动业务管理平台。内置14大业务模块（销售、采购、仓库、财务、人事、零售、生产、委外、商品、报表、办公、设置），130+功能菜单，覆盖企业全链路业务管理。核心亮点是AI智能体系统：会议室多Agent协同（Captain主持，情报/文案/设计/视频/发布专员协作）、热搜情报实时抓取、AI一键生成文案/海报/视频脚本、内容一键发布多平台。每个用户独立数据库实例，物理隔离，全球节点，99.9%可用率。定价：¥39/月、¥299/年、¥1599永久买断，含15天免费体验，比同类产品低50%以上。',
  foundYear: '2024',
  scale: '初创团队',
  region: '全球（数字游牧）',
  priceLevel: '亲民定价',
  industry: '企业服务/SaaS',
  subIndustry: 'ERP / AI办公',
  products: [
    '销售管理（销售订单、客户管理、应收账款）',
    '采购管理（采购订单、供应商管理、应付账款）',
    '仓库管理（入库/出库、库存盘点、多仓管理）',
    '财务管理（收支记录、资金账户、财务报表）',
    '人事管理（员工档案、考勤、工资核算）',
    '零售POS（收银、会员、零售报表）',
    '生产管理（生产工单、物料清单、进度跟踪）',
    'AI会议室（多Agent协同内容策划）',
    'AI文案生成（小红书/抖音/微博多平台适配）',
    'AI海报生成（视觉方案+AI生图提示词）',
    'AI视频脚本（30秒短视频脚本+分镜）',
    '热搜情报（实时抓取平台热点趋势）',
  ],
  sellingPoints: `比传统ERP更智能：内置Claude AI驱动的多Agent团队，真正的AI原生ERP
比AI工具更系统：有完整业务闭环，不只是生成内容，还能管理整个经营
价格极致亲民：¥39/月起，永久买断仅¥1599，同类产品普遍¥200-500/月
独立数据库：每用户物理隔离，数据安全，全球节点，99.9%可用率
15天免费体验：零风险上手，无需信用卡`,
  competitors: ['金蝶', '用友', '管家婆', '畅捷通', 'Notion+各类AI工具组合'],
  referenceAccounts: '少楠（产品沉思录）、即刻数字游牧相关博主',
  targetAge: ['25-35岁', '35-45岁'],
  targetGender: '不限',
  audienceDesc: '数字游牧创业者、跨境电商卖家、中小企业主、全球化小微团队负责人。有一定数字化意识，希望用更智能的工具管理业务，但预算有限，不想用过于复杂的传统ERP。',
  audiencePain: `多平台业务数据分散，每月对账要花几天
财务不透明，搞不清楚到底赚没赚钱
人工做表效率极低，Excel版本乱飞
内容运营没体系，不知道发什么、怎么发
传统ERP太贵太复杂，小团队用不起也学不会`,
  tones: ['专业', '亲切', '有温度', 'AI感', '效率'],
  taboos: '不要用过于官僚/企业感的语气，不要夸大承诺，不要用"颠覆""革命"等过度营销词汇',
  adForbiddenWords: ['第一', '最好', '最强', '唯一', '顶级', '无敌'],
  keywords: ['数字游牧', 'ERP', 'AI管理', '进销存', '小微企业', '效率工具'],
  trendingFilters: ['ERP', '进销存', '数字游牧', '创业工具', 'AI办公', '效率提升'],
  publishFreq: '每天1-2条',
  mainPlatforms: ['xiaohongshu', 'douyin', 'weibo'],
}

function loadProfiles(): BrandData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const list: BrandData[] = JSON.parse(raw)
      // 确保预置品牌始终存在
      if (!list.find(b => b.id === DEFAULT_ERP_BRAND.id)) {
        list.unshift(DEFAULT_ERP_BRAND)
      }
      return list
    }
  } catch { /* ignore */ }
  return [DEFAULT_ERP_BRAND]
}

function saveProfiles(list: BrandData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch { /* ignore */ }
}

function emptyBrand(): BrandData {
  return {
    id: Date.now().toString(36),
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
    mainPlatforms: ['douyin', 'xiaohongshu'],
  }
}

export const useBrandStore = defineStore('brand', () => {
  const profiles = ref<BrandData[]>(loadProfiles())
  const activeId = ref<string>(localStorage.getItem(ACTIVE_KEY) || DEFAULT_ERP_BRAND.id)
  const savedAt = ref('')

  // 当前激活的品牌
  const activeBrand = computed<BrandData>(() =>
    profiles.value.find(b => b.id === activeId.value) || profiles.value[0]
  )

  // 兼容旧代码：brand / isConfigured / systemPrompt
  const brand = computed(() => activeBrand.value)
  const isConfigured = computed(() => !!activeBrand.value?.name && !!activeBrand.value?.industry)

  const systemPrompt = computed(() => {
    const b = activeBrand.value
    if (!b) return ''
    const lines: string[] = []
    if (b.name) lines.push(`你正在为品牌「${b.name}」生成内容。`)
    if (b.slogan) lines.push(`品牌口号：${b.slogan}`)
    if (b.intro) lines.push(`品牌介绍：${b.intro}`)
    if (b.subIndustry || b.industry) lines.push(`行业：${b.subIndustry || b.industry}`)
    if (b.products.length) lines.push(`核心产品/功能：\n${b.products.map(p => '- ' + p).join('\n')}`)
    if (b.sellingPoints) lines.push(`核心卖点：\n${b.sellingPoints}`)
    if (b.priceLevel) lines.push(`定价定位：${b.priceLevel}`)
    if (b.region) lines.push(`主要市场：${b.region}`)
    if (b.competitors.length) lines.push(`主要竞品：${b.competitors.join('、')}`)
    if (b.targetAge.length || b.targetGender !== '不限') {
      lines.push(`目标受众年龄：${b.targetAge.join('/')} ${b.targetGender !== '不限' ? b.targetGender : ''}`.trim())
    }
    if (b.audienceDesc) lines.push(`用户画像：${b.audienceDesc}`)
    if (b.audiencePain) lines.push(`用户痛点：\n${b.audiencePain}`)
    if (b.tones.length) lines.push(`品牌调性：${b.tones.join('、')}`)
    if (b.keywords.length) lines.push(`必须包含关键词：${b.keywords.join('、')}`)
    if (b.taboos) lines.push(`内容禁忌：${b.taboos}`)
    if (b.adForbiddenWords.length) lines.push(`广告违禁词（绝对不能使用）：${b.adForbiddenWords.join('、')}`)
    lines.push('请根据以上品牌信息生成符合品牌调性的内容。')
    return lines.join('\n')
  })

  function setActive(id: string) {
    activeId.value = id
    localStorage.setItem(ACTIVE_KEY, id)
  }

  function saveBrand(data: BrandData) {
    const idx = profiles.value.findIndex(b => b.id === data.id)
    if (idx >= 0) {
      profiles.value[idx] = { ...data }
    } else {
      profiles.value.push({ ...data })
    }
    saveProfiles(profiles.value)
    savedAt.value = new Date().toLocaleString('zh-CN')
  }

  function deleteBrand(id: string) {
    if (id === DEFAULT_ERP_BRAND.id) return // 预置品牌不可删除
    profiles.value = profiles.value.filter(b => b.id !== id)
    saveProfiles(profiles.value)
    if (activeId.value === id) {
      setActive(profiles.value[0]?.id || DEFAULT_ERP_BRAND.id)
    }
  }

  function createBrand(): BrandData {
    return emptyBrand()
  }

  // 兼容旧代码
  function resetBrand() {
    const idx = profiles.value.findIndex(b => b.id === activeId.value)
    if (idx >= 0 && activeId.value !== DEFAULT_ERP_BRAND.id) {
      profiles.value[idx] = emptyBrand()
      saveProfiles(profiles.value)
    }
  }

  return {
    profiles,
    activeId,
    activeBrand,
    brand,
    savedAt,
    isConfigured,
    systemPrompt,
    setActive,
    saveBrand,
    deleteBrand,
    createBrand,
    resetBrand,
  }
})
