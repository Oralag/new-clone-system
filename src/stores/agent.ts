import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TrendingItem {
  title: string
  heat?: string | number
  hot?: string | number
  category?: string
  url?: string
}

export interface FlowResult {
  platform: string
  platformName: string
  topic: string
  type: 'video_script' | 'poster' | 'copy'
  content: string
  videoRequestId?: string
  videoStatus?: 'processing' | 'failed' | 'done' | 'idle' | 'generating'
  imageUrl?: string
  imageStatus?: 'processing' | 'failed' | 'done' | 'idle' | 'generating'
}

export interface CopywritingResult {
  platform: string
  topic: string
  content: string
  contentType?: string
  tones?: string[]
}

export interface VideoResult {
  topic: string
  model?: string
  duration?: string
  ratio?: string
  style?: string
  bgMusic?: string
  content: string
}

export interface HistoryItem {
  id?: string
  title?: string
  platform?: string
  platformName?: string
  platforms?: string[]
  type?: 'copy' | 'image_text' | 'video_script' | 'topic'
  topic?: string
  topics?: string[]
  date?: string
  time?: string
  preview?: string
  content?: string
  results?: FlowResult[]
  contentTypes?: string[]
  count?: number
  status?: string
}

const MOCK_TRENDING: Record<string, TrendingItem[]> = {
  douyin: [
    { title: 'AI换脸技术被滥用', heat: '1248万', category: '科技' },
    { title: '国产大模型超越GPT4', heat: '986万', category: '科技' },
    { title: '00后整顿职场新方式', heat: '876万', category: '职场' },
    { title: '北京暴雪预警', heat: '823万', category: '天气' },
    { title: '年轻人为什么不想结婚', heat: '756万', category: '社会' },
    { title: '新能源车冬天续航真相', heat: '698万', category: '汽车' },
    { title: '在家工作vs坐班哪个更累', heat: '645万', category: '职场' },
    { title: '羽毛球亚锦赛中国队包揽金牌', heat: '612万', category: '体育' },
    { title: '减肥最快的方式是什么', heat: '587万', category: '健康' },
    { title: 'ChatGPT月活突破5亿', heat: '534万', category: '科技' },
    { title: '春节假期旅游攻略', heat: '512万', category: '旅游' },
    { title: '奶茶品牌又在玩联名', heat: '498万', category: '美食' },
    { title: '小学生攀岩世界冠军', heat: '476万', category: '体育' },
    { title: '手机电池越用越不耐用怎么办', heat: '453万', category: '科技' },
    { title: '短视频算法是怎么推荐内容的', heat: '432万', category: '科技' },
  ],
  xiaohongshu: [
    { title: '2025春季穿搭趋势', heat: '热门', category: '穿搭' },
    { title: '一人食好看好吃食谱', heat: '热门', category: '美食' },
    { title: '租房如何把家布置得很好看', heat: '热门', category: '家居' },
    { title: '考研上岸经验分享', heat: '热门', category: '学习' },
    { title: '平价好用护肤清单', heat: '热门', category: '美妆' },
    { title: '独居女生安全指南', heat: '热门', category: '生活' },
    { title: '健身三个月前后对比', heat: '热门', category: '健身' },
    { title: '毕业去哪个城市好', heat: '热门', category: '职场' },
    { title: '攒钱理财新手入门', heat: '热门', category: '理财' },
    { title: '旅游必备App推荐', heat: '热门', category: '旅游' },
    { title: '大学宿舍改造大赏', heat: '热门', category: '家居' },
    { title: '月薪5千如何存到一万', heat: '热门', category: '理财' },
    { title: '夏天素颜好看技巧', heat: '热门', category: '美妆' },
    { title: '咖啡入门指南', heat: '热门', category: '美食' },
    { title: '运动后饮食注意事项', heat: '热门', category: '健康' },
  ],
  kuaishou: [
    { title: '农村大叔学网络用语', heat: '2134万', category: '搞笑' },
    { title: '老妈做的饭香死了', heat: '1876万', category: '美食' },
    { title: '县城创业第一年实录', heat: '1654万', category: '创业' },
    { title: '工厂打工人的一天', heat: '1543万', category: '生活' },
    { title: '东北方言大全有多好笑', heat: '1432万', category: '搞笑' },
    { title: '农村婚礼习俗大不同', heat: '1321万', category: '文化' },
    { title: '摩托车骑行318纪实', heat: '1234万', category: '旅游' },
    { title: '三线城市月薪4000能存多少', heat: '1187万', category: '生活' },
    { title: '孩子第一次看烟花反应', heat: '1087万', category: '亲子' },
    { title: '手艺人的绝活', heat: '987万', category: '技能' },
    { title: '自驾游西藏准备清单', heat: '932万', category: '旅游' },
    { title: '打工人下班解压方式', heat: '876万', category: '生活' },
    { title: '夜市摆摊一个月收入', heat: '823万', category: '创业' },
    { title: '农村老人自制食品', heat: '798万', category: '美食' },
    { title: '儿时的零食现在找到了', heat: '765万', category: '怀旧' },
  ],
  weibo: [
    { title: '乳制品安全新标准发布', heat: '892万', category: '食品' },
    { title: '国产奶粉品质媲美进口', heat: '756万', category: '母婴' },
    { title: '草原牧场直播带货爆火', heat: '634万', category: '电商' },
    { title: '儿童食品添加剂争议', heat: '598万', category: '健康' },
    { title: '超市乳制品价格上涨', heat: '543万', category: '民生' },
    { title: '酸奶品牌测评大PK', heat: '487万', category: '消费' },
    { title: '内蒙古旅游带动乳业', heat: '432万', category: '旅游' },
    { title: '宝宝辅食选什么奶', heat: '398万', category: '母婴' },
    { title: '低温奶vs常温奶哪个好', heat: '376万', category: '科普' },
    { title: '网红奶茶原料溯源', heat: '354万', category: '食品' },
  ],
  bilibili: [
    { title: '一头奶牛一天产多少奶', heat: '播放量523万', category: '科普' },
    { title: '草原牧场Vlog太治愈', heat: '播放量478万', category: '生活' },
    { title: '自制希腊酸奶教程', heat: '播放量412万', category: '美食' },
    { title: '乳糖不耐受怎么喝奶', heat: '播放量387万', category: '健康' },
    { title: '牧场工作是什么体验', heat: '播放量354万', category: '职业' },
    { title: '测评10款市售牛奶', heat: '播放量321万', category: '测评' },
    { title: '奶酪制作全过程', heat: '播放量298万', category: '美食' },
    { title: '营养师讲奶制品知识', heat: '播放量276万', category: '科普' },
    { title: '内蒙古牧民日常', heat: '播放量254万', category: '纪录' },
    { title: '儿童补钙最佳方式', heat: '播放量232万', category: '育儿' },
  ],
  zhihu: [
    { title: '如何判断牛奶新鲜度？', heat: '热榜', category: '科普' },
    { title: '乳制品行业未来趋势是什么？', heat: '热榜', category: '行业' },
    { title: '国产奶粉和进口奶粉有什么区别？', heat: '热榜', category: '母婴' },
    { title: '每天喝牛奶真的健康吗？', heat: '热榜', category: '健康' },
    { title: '酸奶里的益生菌真的有用吗？', heat: '热榜', category: '科普' },
    { title: '做乳制品创业需要哪些资质？', heat: '热榜', category: '创业' },
    { title: '牛奶过期一天还能喝吗？', heat: '热榜', category: '生活' },
    { title: '植物奶能替代牛奶吗？', heat: '热榜', category: '营养' },
    { title: '如何选购高品质酸奶？', heat: '热榜', category: '消费' },
    { title: '乳制品冷链物流怎么做？', heat: '热榜', category: '物流' },
  ],
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function emptyTrending() {
  return {
    douyin: [] as TrendingItem[],
    xiaohongshu: [] as TrendingItem[],
    kuaishou: [] as TrendingItem[],
    weibo: [] as TrendingItem[],
    bilibili: [] as TrendingItem[],
    zhihu: [] as TrendingItem[],
  }
}

export const useTrendingStore = defineStore('agent-trending', () => {
  const trending = ref<Record<string, TrendingItem[]>>(emptyTrending())
  const trendingData = trending
  const loading = ref(false)
  const selectedPlatforms = ref<string[]>(['douyin'])
  const selectedTopics = ref<string[]>([])
  const copywritingResults = ref<CopywritingResult[]>([])
  const videoScript = ref<{ topic: string; content: string; platform: string } | null>(null)
  const videoResults = ref<VideoResult[]>([])
  const publishContent = ref<{ script: string; topic: string; type: string } | null>(null)
  const flowResults = ref<FlowResult[]>(loadFromStorage('agent_flow_results', []))
  const history = ref<HistoryItem[]>(loadFromStorage('agent_history', []))

  async function fetchTrending(platform?: string) {
    const key = platform || 'douyin'
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 1200))
    trending.value[key] = MOCK_TRENDING[key] || []
    loading.value = false
  }

  function setSelectedTopics(topics: string[]) {
    selectedTopics.value = [...new Set((topics || []).filter(Boolean))]
  }

  function setCopywritingResults(results: CopywritingResult[]) {
    copywritingResults.value = results || []
  }

  function setVideoScript(payload: { topic: string; content: string; platform: string } | null) {
    videoScript.value = payload
  }

  function setVideoResults(results: VideoResult[]) {
    videoResults.value = results || []
  }

  function setPublishContent(payload: { script: string; topic: string; type: string } | null) {
    publishContent.value = payload
  }

  function setFlowResults(results: FlowResult[]) {
    flowResults.value = results || []
    localStorage.setItem('agent_flow_results', JSON.stringify(flowResults.value))
  }

  function addHistoryItem(item: HistoryItem) {
    history.value.unshift(item)
    localStorage.setItem('agent_history', JSON.stringify(history.value))
  }

  function removeHistoryItem(target: number | string) {
    if (typeof target === 'number') {
      history.value.splice(target, 1)
    } else {
      history.value = history.value.filter(item => item.id !== target)
    }
    localStorage.setItem('agent_history', JSON.stringify(history.value))
  }

  function clearHistory() {
    history.value = []
    localStorage.removeItem('agent_history')
  }

  function getTrendingData() {
    const labels: Record<string, string> = {
      douyin: '抖音',
      xiaohongshu: '小红书',
      kuaishou: '快手',
      weibo: '微博',
      bilibili: 'B站',
      zhihu: '知乎',
    }
    return Object.entries(trending.value).flatMap(([platform, items]) =>
      items.map(item => ({ platform, platformLabel: labels[platform] || platform, item })),
    )
  }

  return {
    trending,
    trendingData,
    loading,
    selectedPlatforms,
    selectedTopics,
    copywritingResults,
    videoScript,
    videoResults,
    publishContent,
    flowResults,
    history,
    fetchTrending,
    setSelectedTopics,
    setCopywritingResults,
    setVideoScript,
    setVideoResults,
    setPublishContent,
    setFlowResults,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
    getTrendingData,
  }
})
