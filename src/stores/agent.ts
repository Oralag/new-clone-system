import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TrendingItem {
  title: string
  hot?: string | number
  url?: string
}

export interface FlowResult {
  platform: string
  platformName: string
  topic: string
  type: 'video_script' | 'poster' | 'copy'
  content: string
}

export interface CopywritingResult {
  platform: string
  topic: string
  content: string
  contentType: string
  tones: string[]
}

export interface VideoResult {
  topic: string
  model: string
  duration: string
  ratio: string
  style: string
  bgMusic: string
  content: string
}

export interface HistoryItem {
  id: string
  platform: string
  platformName: string
  type: 'copy' | 'image_text' | 'video_script' | 'topic'
  topic: string
  date: string
  preview: string
  content: string
}

const PLATFORMS = ['douyin', 'xiaohongshu', 'kuaishou', 'weibo', 'bilibili', 'zhihu']

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

// Mock trending data per platform
const MOCK_TRENDING: Record<string, TrendingItem[]> = {
  douyin: [
    { title: '2026年春节档电影票房破纪录', hot: 9823400 },
    { title: '国产新能源汽车出海热潮', hot: 8734200 },
    { title: '00后整顿职场新方式', hot: 7621800 },
    { title: '人工智能取代哪些工作', hot: 6543000 },
    { title: '养生茶饮新趋势', hot: 5432100 },
    { title: '极简生活方式流行', hot: 4321000 },
    { title: '国潮品牌崛起', hot: 3987600 },
    { title: '宠物经济持续增长', hot: 3456700 },
    { title: '远程办公新常态', hot: 2987300 },
    { title: '非遗文化数字化保护', hot: 2345600 },
  ],
  xiaohongshu: [
    { title: '春日穿搭显白配色', hot: 5621300 },
    { title: '护肤成分党必看', hot: 4893200 },
    { title: '家居改造小预算大效果', hot: 4231800 },
    { title: '健身增肌饮食计划', hot: 3876500 },
    { title: '一人食美食记录', hot: 3456200 },
    { title: '旅行避坑攻略', hot: 2987400 },
    { title: '读书笔记分享', hot: 2543100 },
    { title: '副业赚钱方法', hot: 2312900 },
    { title: '手作DIY教程', hot: 1987600 },
    { title: '咖啡新品测评', hot: 1654300 },
  ],
  kuaishou: [
    { title: '农村创业新故事', hot: 7823400 },
    { title: '手工艺人传承技艺', hot: 6734200 },
    { title: '乡村振兴新变化', hot: 5621800 },
    { title: '老铁带货新玩法', hot: 4543000 },
    { title: '地方美食探店', hot: 3832100 },
    { title: '家乡风景大赏', hot: 3321000 },
    { title: '打工人日常', hot: 2987600 },
    { title: '街头艺人才艺', hot: 2456700 },
    { title: '二手市场寻宝', hot: 1987300 },
    { title: '传统节日民俗', hot: 1645600 },
  ],
  weibo: [
    { title: '#明星热搜榜#', hot: 12345600 },
    { title: '#社会热点事件#', hot: 9876500 },
    { title: '#娱乐综艺新剧#', hot: 8765400 },
    { title: '#体育赛事结果#', hot: 7654300 },
    { title: '#财经市场动态#', hot: 6543200 },
    { title: '#科技数码新品#', hot: 5432100 },
    { title: '#健康医疗资讯#', hot: 4321000 },
    { title: '#教育考试话题#', hot: 3210900 },
    { title: '#房产市场分析#', hot: 2109800 },
    { title: '#旅游出行攻略#', hot: 1098700 },
  ],
  bilibili: [
    { title: '【技术宅】DIY改装分享', hot: 4567800 },
    { title: 'ACG文化圈年度盘点', hot: 3987600 },
    { title: '科普向视频爆款解析', hot: 3456500 },
    { title: '游戏实况新攻略', hot: 2987400 },
    { title: '学习打卡挑战', hot: 2543300 },
    { title: '二次元周边开箱', hot: 2109200 },
    { title: '历史文化深度解说', hot: 1876100 },
    { title: '音乐创作分享', hot: 1654000 },
    { title: '美食复刻动漫同款', hot: 1432900 },
    { title: 'Vlog大学生日常', hot: 1210800 },
  ],
  zhihu: [
    { title: '如何看待AI对就业的影响？', hot: 3234500 },
    { title: '年轻人为什么不愿意生孩子', hot: 2987400 },
    { title: '国内外教育体制对比分析', hot: 2543300 },
    { title: '房价未来走势判断', hot: 2109200 },
    { title: '投资理财入门指南', hot: 1876100 },
    { title: '职场新人应该注意什么', hot: 1654000 },
    { title: '如何提升个人竞争力', hot: 1432900 },
    { title: '创业失败经验总结', hot: 1210800 },
    { title: '中医与西医各有哪些优势', hot: 987600 },
    { title: '读书真的有用吗', hot: 765400 },
  ],
}

const initialTrending: Record<string, TrendingItem[]> = {}
PLATFORMS.forEach(p => { initialTrending[p] = [] })

export const useTrendingStore = defineStore('agent', () => {
  const trendingData = ref<Record<string, TrendingItem[]>>(initialTrending)
  const loading = ref(false)
  const selectedPlatforms = ref<string[]>(['douyin'])
  const selectedTopics = ref<string[]>([])
  const flowResults = ref<FlowResult[]>(loadFromStorage('agent_flow_results', []))
  const copywritingResults = ref<CopywritingResult[]>([])
  const videoResults = ref<VideoResult[]>([])
  const history = ref<HistoryItem[]>(loadFromStorage('agent_history', []))
  const videoScript = ref<{ topic: string; content: string; platform: string } | null>(null)
  const publishContent = ref<{ script: string; topic: string; type: string } | null>(null)

  // Backward compat alias
  const trending = trendingData

  function getTrendingData() {
    const result: Array<{ platform: string; platformLabel: string; item: TrendingItem }> = []
    const labels: Record<string, string> = {
      douyin: '抖音', xiaohongshu: '小红书', kuaishou: '快手',
      weibo: '微博', bilibili: 'B站', zhihu: '知乎',
    }
    for (const [key, list] of Object.entries(trendingData.value)) {
      for (const item of list) {
        result.push({ platform: key, platformLabel: labels[key] || key, item })
      }
    }
    return result
  }

  function fetchTrending(platform: string): Promise<void> {
    return new Promise((resolve) => {
      loading.value = true
      setTimeout(() => {
        const mockData = MOCK_TRENDING[platform] || []
        // Shuffle slightly to simulate freshness
        trendingData.value[platform] = [...mockData].sort(() => Math.random() * 0.4 - 0.2)
        loading.value = false
        resolve()
      }, 1200)
    })
  }

  function setSelectedTopics(topics: string[]) {
    selectedTopics.value = topics
  }

  function setFlowResults(results: FlowResult[]) {
    flowResults.value = results
    saveToStorage('agent_flow_results', results)
  }

  function setCopywritingResults(results: CopywritingResult[]) {
    copywritingResults.value = results
  }

  function setVideoResults(results: VideoResult[]) {
    videoResults.value = results
  }

  function addHistoryItem(item: Omit<HistoryItem, 'id' | 'date'>) {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      date: new Date().toLocaleDateString('zh-CN'),
    }
    history.value.unshift(newItem)
    saveToStorage('agent_history', history.value)
  }

  function removeHistoryItem(id: string) {
    history.value = history.value.filter(h => h.id !== id)
    saveToStorage('agent_history', history.value)
  }

  function clearHistory() {
    history.value = []
    localStorage.removeItem('agent_history')
  }

  function setVideoScript(data: { topic: string; content: string; platform: string }) {
    videoScript.value = data
  }

  function setPublishContent(data: { script: string; topic: string; type: string }) {
    publishContent.value = data
  }

  return {
    trendingData,
    trending,
    loading,
    selectedPlatforms,
    selectedTopics,
    flowResults,
    copywritingResults,
    videoResults,
    history,
    videoScript,
    publishContent,
    fetchTrending,
    setSelectedTopics,
    setFlowResults,
    setCopywritingResults,
    setVideoResults,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
    setVideoScript,
    setPublishContent,
    getTrendingData,
  }
})
