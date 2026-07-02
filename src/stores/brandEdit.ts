import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'brand_page_config_v1'
// 内容版本号：每次需要强制更新文案时递增
const CONTENT_VERSION = 2
const VERSION_KEY = 'brand_content_version'

export interface BrandPageConfig {
  // 首页
  heroImage: string
  heroImages: string[]
  heroTitle: string
  heroSubtitle: string
  heroDesc: string
  storyImage: string
  storyText: string
  categories: { name: string; img: string }[]
  // 品牌故事页
  storyHeroImage: string
  chapters: { title: string; text: string }[]
  stats: { num: string; label: string }[]
  values: { title: string; desc: string; color: string }[]
  // 评价页
  totalRating: number
  totalReviews: number
  recommendRate: number
  ratingDist: number[]
  reviews: { id: string; userName: string; rating: number; comment: string; date: string; avatar: string }[]
  // 物流页
  carriers: { name: string; time: string; type: string }[]
  policies: { title: string; desc: string }[]
  // 支持页
  channels: { title: string; desc: string; tag: string }[]
  faqs: { q: string; a: string }[]
  // 品牌基本
  brandName: string
  brandSlogan: string
  // 主题色彩
  theme?: {
    cream: string
    navy: string
    orange: string
    blue: string
  }
}

const DEFAULT_CONFIG: BrandPageConfig = {
  heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=2070',
  heroImages: [],
  heroTitle: '重新定义数字游民生活',
  heroSubtitle: 'Live & Work Anywhere',
  heroDesc: '专为数字游民打造的一站式生活方式品牌，让自由工作变得更美好。',
  storyImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800',
  storyText: '我们相信工作不应该被地点束缚。数字游牧精选全球最适合远程工作的目的地与生活方式产品，让每一次移动都成为一次探索。',
  categories: [
    { name: '工作装备', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600' },
    { name: '旅行配件', img: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&q=80&w=600' },
    { name: '生活方式', img: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&q=80&w=600' },
  ],
  storyHeroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=2070',
  chapters: [
    { title: '起点：一张机票与一台笔记本', text: '2019年，创始人卖掉了北京的公寓，带着一台MacBook开始了游牧生活。三年走过23个国家，他发现数字游民市场几乎是空白的——没有真正懂游民需求的品牌。' },
    { title: '洞察：真正的痛点在哪里', text: '调研了500+数字游民之后，我们发现他们最需要的不是"又一款旅行箱"，而是一个完整的生活方式解决方案：好用的装备、可靠的社区、真实的目的地信息。' },
    { title: '构建：从产品到社区', text: '我们从精选工作装备开始，逐步建立起一个覆盖全球30+目的地的游民社区。每件产品都经过至少6个月的实际使用测试，社区里每一条评价都来自真实游民。' },
    { title: '今天：让更多人敢于出发', text: '数字游牧现在服务着来自40+国家的游民社群。我们不只卖产品，我们帮助更多人迈出成为数字游民的第一步——因为我们走过那条路，知道什么最重要。' },
  ],
  stats: [
    { num: '40+', label: '覆盖国家' },
    { num: '12,000+', label: '游民社区成员' },
    { num: '4.9/5', label: '产品评分' },
    { num: '5年', label: '品牌历程' },
  ],
  values: [
    { title: '自由', desc: '工作与生活不必二选一，地点自由是我们存在的意义。', color: '#0071e3' },
    { title: '真实', desc: '每件产品都经过真实游民测试，每条评价都来自真实用户。', color: '#34c759' },
    { title: '社区', desc: '我们不只是品牌，更是连接全球游民的桥梁与港湾。', color: '#f59e0b' },
    { title: '可持续', desc: '轻装上阵、减少冗余，游民生活方式天然是可持续的。', color: '#9333ea' },
  ],
  totalRating: 4.9,
  totalReviews: 2847,
  recommendRate: 98,
  ratingDist: [82, 14, 3, 1, 0],
  reviews: [
    { id: 'r1', userName: 'Alex Chen', rating: 5, comment: '在巴厘岛用了3个月，这款背包真的是目前用过最合理的游民装备。防水、轻便，笔记本分区设计太贴心了，每次过安检都不用掏电脑。', date: '2026-03-20', avatar: 'https://picsum.photos/seed/user1/100/100' },
    { id: 'r2', userName: '林芷晴', rating: 5, comment: '作为独立设计师在各地工作，对装备的要求很高。数字游牧的产品让我觉得终于有品牌真的懂我们。客服也超专业，问了很多奇葩问题都耐心解答。', date: '2026-03-15', avatar: 'https://picsum.photos/seed/user2/100/100' },
    { id: 'r3', userName: 'Marcus J.', rating: 5, comment: 'Been a digital nomad for 4 years, tried dozens of gear brands. This is the first one that actually feels designed by nomads for nomads. The quality is outstanding.', date: '2026-03-10', avatar: 'https://picsum.photos/seed/user3/100/100' },
    { id: 'r4', userName: '王子墨', rating: 4, comment: '充电宝容量大，多口设计很实用。在葡萄牙两个月每天用，没出过任何问题。唯一建议是能再轻一点点就完美了。', date: '2026-03-05', avatar: 'https://picsum.photos/seed/user4/100/100' },
    { id: 'r5', userName: 'Priya S.', rating: 5, comment: 'The laptop stand is a game changer for cafe working. Packed it all across Southeast Asia for 6 months. Highly recommend the whole travel kit bundle.', date: '2026-02-28', avatar: 'https://picsum.photos/seed/user5/100/100' },
    { id: 'r6', userName: '陈晓东', rating: 5, comment: '社区推荐来的，买了整套装备。质量和设计都超出预期，特别是旅行颈枕，长途飞机救了我。已经给3个朋友安利了。', date: '2026-02-20', avatar: 'https://picsum.photos/seed/user6/100/100' },
  ],
  carriers: [
    { name: '顺丰速运', time: '1-3 工作日', type: '国内标准' },
    { name: 'DHL 国际', time: '5-10 工作日', type: '国际配送' },
    { name: '京东物流', time: '1-2 工作日', type: '次日达' },
    { name: '海外仓直发', time: '3-7 工作日', type: '欧美澳' },
  ],
  policies: [
    { title: '30天无忧退换', desc: '收到商品30天内如有质量问题，支持无理由退换，运费由我们承担。' },
    { title: '满额包邮', desc: '国内订单满 ¥299 全国包邮；国际订单满 $80 免运费。' },
    { title: '质保两年', desc: '所有硬件产品享有两年质量保证，人为损坏以外均免费维修或更换。' },
  ],
  channels: [
    { title: '在线客服', desc: '右下角 Nova 智能客服，7×24小时即时响应，订单与产品问题优先处理', tag: '推荐' },
    { title: '微信社群', desc: '扫码加入数字游牧社区，与全球游民交流目的地经验和装备心得', tag: '社群' },
    { title: '邮件支持', desc: 'hello@nomadic.co，工作日24小时内回复，企业采购和合作优先通道', tag: '邮件' },
  ],
  faqs: [
    { q: '商品支持国际配送吗？', a: '支持。国际订单通过DHL或当地海外仓发货，覆盖全球80+国家。结账时可选择配送方式，国际运费根据目的地和重量自动计算。' },
    { q: '产品质量怎么保证？', a: '所有产品上架前须经过至少6个月的实际使用测试，由真实数字游民团队评估。我们拒绝只看参数表的纸面测试。' },
    { q: '可以企业采购/团队批量购买吗？', a: '可以。10件以上享批量折扣，支持公司开票，提供企业专属客户经理。请发邮件至 biz@nomadic.co 或点击"企业采购"联系我们。' },
    { q: '退换货流程是怎样的？', a: '购买后30天内，登录账号提交退换申请，说明原因并上传照片。审核通过后我们发送上门取件标签，收到退货后3个工作日内完成退款。' },
    { q: '社区会员有什么权益？', a: '免费注册即可加入，享受专属折扣、优先发货、目的地攻略解锁、每月游民故事等权益。年费会员还可参与新品内测和线下城市聚会。' },
    { q: '如何追踪我的订单？', a: '下单后会收到含物流单号的邮件，可在对应快递官网查询进度。也可登录账号在"我的订单"实时查看，国际件支持全程轨迹追踪。' },
  ],
  brandName: 'NOMADIC',
  brandSlogan: '专为数字游民而生',
  theme: {
    cream: '#EDE6D5',
    navy: '#1A1E32',
    orange: '#D14B0A',
    blue: '#8BBDD6',
  },
}

// 老数据只有 heroImage 字符串；如果没有 heroImages 数组，自动迁移为 [heroImage]
function migrateHeroImages(cfg: BrandPageConfig): BrandPageConfig {
  if (!Array.isArray(cfg.heroImages) || cfg.heroImages.length === 0) {
    cfg.heroImages = cfg.heroImage ? [cfg.heroImage] : []
  }
  return cfg
}

function loadConfig(): BrandPageConfig {
  // 版本号变化时强制重置为最新文案
  const savedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0')
  if (savedVersion < CONTENT_VERSION) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(VERSION_KEY, String(CONTENT_VERSION))
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrateHeroImages({ ...DEFAULT_CONFIG, ...JSON.parse(raw) })
  } catch { /* ignore */ }

  // 首次加载或版本重置后写入内蒙古奶食品文案
  const INITIAL_CONTENT: Partial<BrandPageConfig> = {
    heroImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=2070',
    heroImages: [
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=2070',
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=2070',
      'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=2070',
    ],
    heroTitle: '来自草原深处的纯粹味道',
    heroSubtitle: 'Pure from the Steppe',
    heroDesc: '内蒙古千里草原，世代牧民的匠心传承。每一口奶食，都是对这片土地最真实的致敬。',
    storyImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=800',
    storyText: '扎根内蒙古锡林郭勒草原，坚守传统奶食制作工艺，用最纯净的牧场鲜奶，做最地道的草原味道。',
    categories: [
      { name: '奶皮 · 奶酪', img: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=600' },
      { name: '奶酒 · 奶茶', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600' },
      { name: '风干牛肉', img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=600' },
    ],
    storyHeroImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=2070',
    chapters: [
      { title: '起点：祖母的奶桶', text: '品牌创始人从小在锡林郭勒盟长大，看着祖母每天清晨架锅熬奶皮。那股奶香混着草原晨风，是他最深的记忆。2018年，他决定把这份味道带给更多人。' },
      { title: '坚守：不妥协的原料', text: '我们只与锡林郭勒盟核心牧区的牧民合作，每批鲜奶都经过严格检测。拒绝还原奶，拒绝添加剂，这是我们唯一不可动摇的底线。' },
      { title: '传承：濒临失传的手艺', text: '传统奶皮要在铁锅上文火慢熬至少4小时，稍有不慎就会焦糊。我们聘请了三位有50年以上经验的老牧民驻场传授，守住这门手艺。' },
      { title: '今天：草原走向全国', text: '从最初的小作坊到现在服务全国 30+ 省市的消费者，我们没有改变配方，只是让更多人尝到了真正的草原味道。' },
    ],
    stats: [
      { num: '30+', label: '覆盖省市' },
      { num: '50,000+', label: '忠实客户' },
      { num: '4.9/5', label: '用户评分' },
      { num: '6年', label: '品牌历程' },
    ],
    values: [
      { title: '纯粹', desc: '只用锡林郭勒盟鲜奶，无添加，无还原，成分表极简。', color: '#0071e3' },
      { title: '传承', desc: '坚守蒙古族传统奶食工艺，每道工序都有老牧民把关。', color: '#34c759' },
      { title: '溯源', desc: '每批产品可追溯到具体牧场和牧民，让您吃得放心。', color: '#f59e0b' },
      { title: '共生', desc: '我们的利润30%直接回馈合作牧民，守护草原生态。', color: '#9333ea' },
    ],
    totalRating: 4.9,
    totalReviews: 3861,
    recommendRate: 99,
    ratingDist: [85, 12, 2, 1, 0],
    reviews: [
      { id: 'r1', userName: '草原奶茶控🍵', rating: 5, comment: '奶皮子真的是我吃过最正宗的，软糯香甜，完全是小时候去内蒙古旅游时吃到的那个味道。一次买了10盒，已经回购三次了！', date: '2026-03-20', avatar: 'https://picsum.photos/seed/nmry1/100/100' },
      { id: 'r2', userName: '买买买不停手', rating: 5, comment: '送给父母的礼物，老人家吃了说从来没吃过这么香的奶豆腐。包装也很精致，当礼品送特别有面子。', date: '2026-03-15', avatar: 'https://picsum.photos/seed/nmry2/100/100' },
      { id: 'r3', userName: '内蒙格桑花🌸', rating: 5, comment: '作为内蒙古人，在外地很难买到正宗的家乡奶食。这家的奶皮和风干牛肉都很地道，终于解了馋。', date: '2026-03-10', avatar: 'https://picsum.photos/seed/nmry3/100/100' },
      { id: 'r4', userName: '吃货小分队', rating: 4, comment: '马奶酒浓度适中，不太烈，女生也能喝。配上奶酪，周末在家就有了草原感觉。物流也很快，保鲜做得好。', date: '2026-03-05', avatar: 'https://picsum.photos/seed/nmry4/100/100' },
      { id: 'r5', userName: 'li**hua', rating: 5, comment: '批发价格实惠，产品质量稳定，我们超市已经合作两年了。每次到货顾客都抢着买，复购率超高。', date: '2026-02-28', avatar: 'https://picsum.photos/seed/nmry5/100/100' },
      { id: 'r6', userName: '年货采购达人', rating: 5, comment: '给公司采购的年货礼盒，同事们都说比普通礼盒有特色，草原特产这个定位很讨喜，明年还会继续选你们。', date: '2026-02-20', avatar: 'https://picsum.photos/seed/nmry6/100/100' },
    ],
    carriers: [
      { name: '顺丰冷链', time: '1-3 工作日', type: '全程冷藏' },
      { name: '京东物流', time: '1-2 工作日', type: '次日达城市' },
      { name: '中通快递', time: '3-5 工作日', type: '常温产品' },
      { name: '到付自提', time: '内蒙古地区', type: '牧场直提' },
    ],
    policies: [
      { title: '7天无忧退换', desc: '收到商品7天内如有质量问题，支持无理由退换，运费由我们承担。' },
      { title: '满额包邮', desc: '满 ¥199 全国包邮（西藏、新疆除外），冷链产品单独计费。' },
      { title: '破损必赔', desc: '冷链运输途中破损或融化，拍照联系客服，24小时内重新补发。' },
    ],
    channels: [
      { title: '微信客服', desc: '扫码添加微信，工作日 9:00-20:00 在线，牧场问题直接对接', tag: '推荐' },
      { title: '电话客服', desc: '400-XXX-XXXX，工作日 9:00-18:00，大宗采购优先接待', tag: '电话' },
      { title: '在线客服', desc: '右下角智能客服，7×24小时即时回答产品和订单问题', tag: '即时' },
    ],
    faqs: [
      { q: '奶食品怎么保存？保质期多久？', a: '奶皮、奶豆腐等鲜制品需冷藏（0-4°C）保存，保质期15-21天；风干牛肉常温密封保存，保质期180天。收到后请尽快冷藏。' },
      { q: '产品有没有添加剂？', a: '所有奶食品均无防腐剂、无香精、无色素，只有鲜奶和传统辅料（如盐）。配料表就是成分表，没有看不懂的化学名词。' },
      { q: '如何申请批发采购？', a: '点击"采购商申请"填写公司信息，我们将在1-3个工作日内联系您，提供专属批发报价和样品寄送。' },
      { q: '批发起订量是多少？', a: '各品类起订量不同，奶皮起订20盒、风干牛肉起订10斤、礼盒套装起订5套。具体以商务报价单为准。' },
      { q: '可以定制企业礼盒吗？', a: '可以，支持定制包装、企业LOGO印刷、产品组合搭配。起订50套，15个工作日内完成。请联系商务客服咨询。' },
      { q: '奶源来自哪里？怎么保证质量？', a: '奶源100%来自锡林郭勒盟苏尼特右旗的签约牧场，每批鲜奶经第三方检测（菌落总数、蛋白质含量等），检测报告可扫码查询。' },
    ],
    brandName: 'NOMADIC DAIRY',
    brandSlogan: '草原纯粹 · 匠心奶食',
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONTENT))
  } catch { /* ignore */ }
  return migrateHeroImages({ ...DEFAULT_CONFIG, ...INITIAL_CONTENT })
}

export const useBrandEditStore = defineStore('brandEdit', () => {
  const editMode = ref(false)
  const config = ref<BrandPageConfig>(loadConfig())

  const isLoggedIn = computed(() => !!localStorage.getItem('erp_token'))

  function toggleEditMode() {
    if (!isLoggedIn.value) return
    editMode.value = !editMode.value
  }

  function exitEditMode() {
    editMode.value = false
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    } catch { /* ignore */ }
    // 同步到云端（仅登录用户，fire-and-forget）
    const token = localStorage.getItem('erp_token')
    if (token) {
      fetch('/api/brand-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
        body: JSON.stringify({ ...config.value, __version__: CONTENT_VERSION }),
      }).catch(() => { /* ignore */ })
    }
  }

  // 从云端拉取最新配置（登录用户或首次访问时同步）
  async function syncFromCloud() {
    try {
      const token = localStorage.getItem('erp_token')
      const headers: Record<string, string> = {}
      if (token) headers['x-erp-token'] = token
      // For public (non-logged-in) brand pages, pass shop code from URL
      const shopCode = !token
        ? (new URLSearchParams(window.location.hash.split('?')[1] || '').get('shop')
          || localStorage.getItem('brand_shop_code') || '')
        : ''
      const configUrl = shopCode ? `/api/brand-config?shop=${encodeURIComponent(shopCode)}` : '/api/brand-config'
      const res = await fetch(configUrl, { headers })
      const json = await res.json()
      if (json.code === 1 && json.data) {
        // 云端数据版本过旧时忽略，用本地最新版本
        const cloudVersion = json.data.__version__ || 0
        if (cloudVersion < CONTENT_VERSION) {
          // 把本地最新版本推到云端
          const token = localStorage.getItem('erp_token')
          if (token) {
            const payload = { ...config.value, __version__: CONTENT_VERSION }
            fetch('/api/brand-config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
              body: JSON.stringify(payload),
            }).catch(() => {})
          }
          return
        }
        const merged = migrateHeroImages({ ...DEFAULT_CONFIG, ...json.data })
        config.value = merged
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }

  function updateConfig(patch: Partial<BrandPageConfig>) {
    Object.assign(config.value, patch)
    saveConfig()
  }

  return {
    editMode, config, isLoggedIn,
    toggleEditMode, exitEditMode, updateConfig, saveConfig, syncFromCloud,
  }
})
