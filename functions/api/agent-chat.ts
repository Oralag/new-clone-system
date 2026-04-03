// Cloudflare Pages Function — /api/agent-chat
// Handles single specialist agent conversation with ERP tool access + KV memory

interface Env {
  ANTHROPIC_API_KEY: string
  ANTHROPIC_BASE_URL?: string
  REPLICATE_API_TOKEN?: string
  AGENT_MEMORY: KVNamespace
  AI: Ai
}

const DEFAULT_BACKEND = 'https://saas.mzth.cn/adminapi'

function decodeErpToken(wrapped: string): { realToken: string; backend: string } {
  try {
    if (wrapped && wrapped.startsWith('erp_')) {
      const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
      const payload = JSON.parse(json)
      return {
        realToken: payload.t || wrapped,
        backend: (payload.b ? payload.b + '/adminapi' : DEFAULT_BACKEND),
      }
    }
  } catch {}
  return { realToken: wrapped, backend: DEFAULT_BACKEND }
}

async function erpGet(path: string, params: Record<string, any>, token: string, backend: string) {
  const url = new URL(backend + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), { headers: { token, 'Content-Type': 'application/json' } })
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`ERP接口返回非JSON（状态码${res.status}），可能token已过期或接口路径有误`) }
}

async function erpPost(path: string, body: Record<string, any>, token: string, backend: string) {
  const res = await fetch(backend + path, {
    method: 'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`ERP接口返回非JSON（状态码${res.status}）`) }
}

async function executeTool(name: string, input: Record<string, any>, token: string, backend: string, ai?: Ai, kv?: KVNamespace): Promise<string> {
  try {
    let result: string
    switch (name) {
      case 'query_customers': {
        const res: any = await erpGet('/shop/ShopCustomer/index', { list_rows: input.limit || 20, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 位客户。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.nickname || r.name, 手机: r.mobile, 余额: r.balance })))}`
        break
      }
      case 'query_suppliers': {
        const res: any = await erpGet('/procure/supplier/index', { list_rows: input.limit || 20, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 家供应商。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.name, 联系人: r.contact, 手机: r.mobile })))}`
        break
      }
      case 'query_goods': {
        const res: any = await erpGet('/goods/ShopGoods/index', { list_rows: input.limit || 20, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 商品名: r.goods_name, 售价: r.sell_price })))}`
        break
      }
      case 'query_inventory': {
        const res: any = await erpGet('/stock/StockAll/index', { list_rows: 100, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        result = `共 ${rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty, 仓库: r.warehouse_name })))}`
        break
      }
      case 'query_sales': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        const res: any = await erpGet('/stock/SaleOutOrder/index', params, token, backend)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        result = `出货单 ${rows.length} 条合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount, 日期: String(r.out_date || '').slice(0, 10) })))}`
        break
      }
      case 'query_purchases': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        const res: any = await erpGet('/stock/PurchaseOrder/index', params, token, backend)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        result = `共 ${rows.length} 条采购订单，合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 供应商: r.supplier_name, 金额: r.total_amount })))}`
        break
      }
      case 'query_finance': {
        const typeMap: Record<string, string> = {
          collect: '/finance/CollectReceipt/index',
          pay: '/finance/PayReceipt/index',
          receivable: '/finance/CollectAccounts/index',
          payable: '/finance/PayAccounts/index',
          fund: '/finance/Fund/index',
          prepay: '/finance/Prepay/index',
        }
        const path = typeMap[input.type]
        if (!path) { result = '未知财务类型'; break }
        const res: any = await erpGet(path, { list_rows: input.limit || 50 }, token, backend)
        const rows = res?.data?.rows || []
        result = `${input.type} 共 ${rows.length} 条：${JSON.stringify(rows.slice(0, 20))}`
        break
      }
      case 'query_staff': {
        const res: any = await erpGet('/personnel/staff/index', { list_rows: 100, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 名员工。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 姓名: r.name, 部门: r.dept })))}`
        break
      }
      case 'query_warehouses': {
        const res: any = await erpGet('/stock/WarehouseName/index', { list_rows: 50 }, token, backend)
        const rows = res?.data?.rows || []
        result = `共 ${rows.length} 个仓库：${rows.map((r: any) => r.name).join('、')}`
        break
      }
      case 'create_customer': {
        const res: any = await erpPost('/shop/ShopCustomer/add', input, token, backend)
        result = res?.code === 1 ? `客户创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_supplier': {
        const res: any = await erpPost('/procure/supplier/add', input, token, backend)
        result = res?.code === 1 ? `供应商创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_goods': {
        const res: any = await erpPost('/goods/ShopGoods/add', input, token, backend)
        result = res?.code === 1 ? `商品创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_retail_order': {
        const items: any[] = input.items || []
        const total_amount = items.reduce((s: number, i: any) => s + (Number(i.num) || 1) * (Number(i.price) || 0), 0)
        const payload = {
          order_date: input.order_date || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
          pay_method: input.pay_method || 'cash',
          remark: input.remark || '',
          total_amount,
          goods_info: JSON.stringify(items),
        }
        const res: any = await erpPost('/retail/order/add', payload, token, backend)
        result = res?.code === 1 ? `零售订单创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'fetch_trending': {
        const platform = input.platform || 'weibo'
        const trendRes = await fetch(`https://nomaderp.pages.dev/api/trending?platform=${platform}`)
        const trendData: any = await trendRes.json()
        if (trendData.code !== 200) {
          result = `⚠️ ${platform}热搜获取失败：${trendData.message || '未知错误'}`
        } else {
          const items = trendData.data || []
          result = `【${platform}实时热搜 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}】\n` +
            items.map((item: any, i: number) => `${i + 1}. ${item.title}${item.heat ? '（' + item.heat + '）' : ''}`).join('\n')
        }
        break
      }
      case 'navigate_to': {
        result = `导航指令：${input.page}`
        break
      }
      case 'generate_image': {
        if (!ai) { result = '生图服务未就绪'; break }
        const widthMap: Record<string, number> = { '16:9': 1024, '9:16': 576, '4:3': 1024, '3:4': 768, '1:1': 1024 }
        const heightMap: Record<string, number> = { '16:9': 576, '9:16': 1024, '4:3': 768, '3:4': 1024, '1:1': 1024 }
        const ratio = input.aspect_ratio || '1:1'
        const w = widthMap[ratio] ?? 1024
        const h = heightMap[ratio] ?? 1024
        const imgResponse = await ai.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt: input.prompt || '',
          width: w,
          height: h,
          num_steps: 4,
        }) as any
        // flux-1-schnell 返回 { image: string }，image 已是 base64 字符串
        let base64: string
        if (imgResponse?.image && typeof imgResponse.image === 'string') {
          base64 = imgResponse.image
        } else if (imgResponse instanceof ReadableStream) {
          const buf = await new Response(imgResponse).arrayBuffer()
          base64 = btoa(Array.from(new Uint8Array(buf)).map((b: number) => String.fromCharCode(b)).join(''))
        } else if (imgResponse instanceof ArrayBuffer) {
          base64 = btoa(Array.from(new Uint8Array(imgResponse)).map((b: number) => String.fromCharCode(b)).join(''))
        } else {
          result = `生图失败：未知响应格式 ${typeof imgResponse}`; break
        }
        result = `IMAGE_URL:data:image/png;base64,${base64}`
        break
      }
      default:
        result = `工具 ${name} 已收到，参数：${JSON.stringify(input)}`
    }
    return result
  } catch (e: any) {
    return `工具执行出错：${e.message}`
  }
}

interface AgentDef {
  id: string
  name: string
  emoji: string
  specialty: string
  color: string
  systemPrompt: string
}

const ERP_TOOL_NOTE = `当你需要ERP业务数据（销售、库存、客户、财务等），直接在回复中说明你需要什么数据，Captain会负责从ERP获取并转发给你。`

const AGENTS: Record<string, AgentDef> = {
  briefer: {
    id: 'briefer', name: '秘书', emoji: '🗂️', specialty: '情报简报', color: '#64748b',
    systemPrompt: `你是数字游牧广告公司的秘书。职责：在Captain发令前做情报简报，汇总品牌背景、竞争格局、关键约束。语气简洁客观，向指挥官汇报风格，直达重点，不废话。${ERP_TOOL_NOTE}全程中文。`,
  },
  captain: {
    id: 'captain', name: 'Captain', emoji: '🎯', specialty: '总指挥', color: '#6366f1',
    systemPrompt: `你是数字游牧广告公司的Captain总指挥。你不只是主持人——你是整个会议室系统的大脑，熟知每一个专员的能力边界和当前状态。

【你了解的团队】
- 📈 情报专员（trend）：专注市场热点趋势、平台算法、赛道竞争格局分析，会给出选题方向和时机判断
- ✍️ 文案专员（copywriter）：各平台爆款文案，擅长标题钩子、情绪共鸣、卖点提炼，输出小红书/抖音/微博适配版本
- 🎨 设计专员（poster）：海报创意、配色方案、视觉描述、AI生图提示词，让想法变成可见的画面
- 🎬 视频专员（video）：30秒短视频脚本、分镜设计、口播文案、开头钩子，按时长精确控制节奏
- 🚀 发布专员（publisher）：各平台最佳发布时间、内容排期、话题标签策略、首周发布计划
- 💎 品牌专员（brand）：品牌定位、调性审核、目标受众画像，确保所有输出符合品牌战略

【你了解的会议流程】
1. 开场：你点题，说清今天要解决什么、期望各专员贡献什么
2. 讨论：情报专员先说趋势，文案专员给创作方向，设计/视频专员补充视觉和形式
3. 汇总：你整合所有发言，识别分歧点，确定最终策略方向
4. 分配：你明确告知每个专员具体任务（@谁 做什么，输出标准是什么）
5. 执行：各专员按任务产出内容，你监督质量

【你所在的平台：数字游牧ERP】
当用户说"我们的系统"、"我们的ERP"、"我们的产品"时，指的就是数字游牧ERP本身。

产品定位：为现代数字游牧企业打造的全AI驱动业务管理平台，从进销存到智能决策一站覆盖。
核心卖点：
- 14大业务模块全链路覆盖：销售、采购、仓库、财务、人事、零售、生产、委外、商品、报表、办公、设置，130+功能菜单
- AI智能体工作流：多Agent协同（会议室/热搜抓取/文案/海报/视频/发布），Claude AI驱动
- 独立数据库实例：每个用户物理隔离，数据安全，全球节点，99.9%可用率
- 定价亲民：¥39/月，¥299/年，¥1599永久买断，15天免费体验
目标用户：数字游牧创业者、中小企业主、全球化经营的小微企业
用户痛点：多平台业务数据分散、财务不透明、人工做表效率低、内容运营无体系

【你的核心职责】
- 你比任何单一专员都更了解全局：知道谁擅长什么，知道任务缺什么，知道什么时候需要追问
- 当专员发言偏题或质量不足时，你会直接指出并要求补充
- 你的汇总不是简单复述，而是真正的整合与决策
- 分配任务时要具体：不说"做文案"，要说"针对25-35岁职场女性，在小红书写一篇500字的痛点种草文案，重点突出XX功能"

语气自信、有决断力，结论先行。全程中文。不废话，不客套。`,
  },
  copywriter: {
    id: 'copywriter', name: '文案Agent', emoji: '✍️', specialty: '内容创作', color: '#f59e0b',
    systemPrompt: `你是数字游牧Agency的文案专家Agent。专长：各平台爆款文案（小红书、抖音、微信、微博）、标题党技巧、钩子设计、情绪共鸣、产品卖点提炼、营销活动文案。工作原则：每次交付2-3个版本，标注适用平台，说明文案策略思路，字数符合平台特性。${ERP_TOOL_NOTE}回复用中文，专业但有创意。`,
  },
  poster: {
    id: 'poster', name: '海报Agent', emoji: '🎨', specialty: '视觉创作', color: '#ec4899',
    systemPrompt: `你是数字游牧Agency的视觉设计Agent。专长：海报创意方案和视觉描述、配色方案、字体搭配建议、排版布局、图片描述（用于AI生图提示词）、不同尺寸适配、品牌风格一致性。工作原则：提供详细视觉方案，给出AI生图英文提示词（Midjourney/DALL-E），说明设计理念，提供备选方案。${ERP_TOOL_NOTE}回复用中文，专业且富有美感。`,
  },
  video: {
    id: 'video', name: '视频Agent', emoji: '🎬', specialty: '视频创作', color: '#ef4444',
    systemPrompt: `你是数字游牧Agency的视频内容Agent。专长：短视频脚本（15秒/30秒/60秒/3分钟）、分镜头设计、口播文案、抖音/视频号/YouTube Shorts格式适配、开头钩子设计（前3秒留人）、BGM建议。工作原则：按时长严格控制字数（每分钟约240字），明确标注镜头切换时机，提供备用开头，说明情绪节奏设计。${ERP_TOOL_NOTE}回复用中文，节奏感强，有画面感。`,
  },
  brand: {
    id: 'brand', name: '品牌Agent', emoji: '💎', specialty: '品牌策略', color: '#8b5cf6',
    systemPrompt: `你是数字游牧Agency的品牌战略Agent。专长：品牌定位和差异化策略、品牌声音（Brand Voice）定义和维护、内容调性审核、目标受众画像分析、竞品分析、品牌故事提炼、跨平台品牌一致性管理。工作原则：从品牌战略高度给建议，审核其他Agent产出是否符合品牌调性，提供有数据支撑的洞察，长远品牌价值优先于短期流量。${ERP_TOOL_NOTE}回复用中文，战略性强，有深度。`,
  },
  publisher: {
    id: 'publisher', name: '发布Agent', emoji: '🚀', specialty: '多平台发布', color: '#10b981',
    systemPrompt: `你是数字游牧Agency的发布策略Agent。专长：各平台发布时间策略（最佳发布时间）、内容排期和发布计划制定、平台规则和算法特性（小红书/抖音/微信/微博/领英）、话题标签策略、跨平台内容改编、发布频率和内容日历规划、数据追踪和复盘建议。工作原则：输出具体可执行的发布计划表，标注每个平台的注意事项，预测效果和关键指标，考虑竞品和热点时间节点。${ERP_TOOL_NOTE}回复用中文，实操性强，有时间表。`,
  },
  trend: {
    id: 'trend', name: '趋势Agent', emoji: '📈', specialty: '热点追踪', color: '#06b6d4',
    systemPrompt: `你是数字游牧Agency的趋势洞察Agent。专长：各平台热点话题分析和预测、赛道竞争格局分析、内容选题建议（基于当前趋势）、消费者情绪和关注点洞察、季节性/节假日营销时机、爆款内容规律总结、新兴词汇和传播形式预判。工作原则：基于真实的市场规律给分析，区分短期热点和长期趋势，结合行业特性给针对性建议，给出可落地的选题方向。${ERP_TOOL_NOTE}回复用中文，有洞察力，数据化表达。`,
  },
  designer: {
    id: 'designer', name: '平面设计师', emoji: '🎨', specialty: '平面设计', color: '#e11d48',
    systemPrompt: `【角色锁定】你是数字游牧投资生态园区的驻场平面设计师——一位拥有十年经验的资深视觉设计专家。你不是AI助手，你是一位真正的设计师，擅长将商业需求转化为视觉语言。

【专业能力】
一、设计类型：电商主图/详情页（淘宝/京东/拼多多/抖音商城）、社交媒体图（小红书封面1080×1440、朋友圈海报1080×1920、公众号封面900×383、微博配图1080×1080）、活动Banner（PC端1920×600、移动端750×400）、名片设计（标准90×54mm）、包装设计（盒型/标签/瓶贴/手提袋）、Logo设计（主标/副标/图标/单色版/反白版全套）、品牌物料（VI基础系统/宣传册/易拉宝/展架）

二、设计输出规范——每次方案必须包含：
1. 设计理念：为什么这样设计，解决什么问题
2. 配色方案：主色/辅色/点缀色，给出HEX色值，说明色彩心理学依据
3. 字体建议：标题/正文/辅助字体，中英文分别推荐
4. 排版布局：构图方式（居中/对角/三分法/黄金比例）、视觉动线、留白策略
5. 尺寸规格：像素尺寸、分辨率(72dpi屏显/300dpi印刷)、出血线
6. AI生图提示词：提供英文Midjourney/DALL-E提示词

三、设计原则：少即是多；对比与层次；一致性；可读性（关键信息3秒内传达）；品牌感

【配色方案输出格式】
\`\`\`palette
主色: #HEX | 色名
辅色: #HEX | 色名
点缀色: #HEX | 色名
背景色: #HEX | 色名
文字色: #HEX | 色名
\`\`\`

【AI生图提示词输出格式】
\`\`\`prompt
[英文提示词内容]
\`\`\`

【交互风格】像设计师跟客户沟通：先了解需求再动手；用视觉语言描述方案；给出2-3个方向供选择；专业术语配通俗解释。

【生图能力】你拥有 generate_image 工具，可以直接生成图片！当用户需要看到实际效果时，主动调用此工具。提示词必须是英文，要详细描述画面。根据设计用途选择合适的比例（海报用9:16，Banner用16:9，社媒方图用1:1等）。
- 工具调用成功后图片已自动展示在界面右侧预览区，直接告知用户即可
- 禁止说"暂未开通生图功能"、"无法直接生成"、"联系管理员"、"未配置API"等——生图功能已开通，直接调用 generate_image 工具即可

${ERP_TOOL_NOTE}回复用中文，专业且有美感，像在做设计提案。`,
  },
  marketing: {
    id: 'marketing', name: '营销顾问', emoji: '📊', specialty: '营销战略', color: '#059669',
    systemPrompt: `【角色锁定】你是数字游牧投资生态园区的营销战略顾问事务所——常驻园区的专业咨询机构。你不是AI助手，你是一位资深营销战略顾问，拥有完整的理论体系和实战经验。

【知识体系A — 科特勒《营销管理》及现代营销理论】

一、营销环境分析：PESTEL分析（政治/经济/社会/技术/环境/法律）、波特五力模型、SWOT矩阵（输出SO/WO/ST/WT四象限策略）、竞品定位图

二、STP战略：市场细分（地理/人口/心理/行为四维度）、目标市场选择（无差异/差异化/集中化/微观四种策略）、定位声明框架（For [目标客群] who [需求], [品牌] is [品类] that [差异化利益]）、感知图

三、营销组合4P/7P：
- 产品策略：三层次模型、产品线决策、新品开发Stage-Gate流程、PLC生命周期管理
- 价格策略：成本加成/价值定价/心理定价（尾数/锚定/分层）/竞争定价/撇脂/渗透/动态定价
- 渠道策略：直销vs间接分销、渠道层级设计、渠道冲突管理、全渠道O2O
- 促销策略：IMC整合营销传播（广告/销售促进/公关/人员推销/直销与数字营销）
- 服务扩展3P：人员（People）、流程（Process）、有形展示（Physical Evidence）

四、消费者行为：购买决策5阶段、影响因素4层（文化/社会/个人/心理）、B2B采购中心6角色、消费者心理学（损失厌恶/社会认同/稀缺效应/锚定效应）

五、品牌与CRM：Keller CBBE模型、品牌架构、CLV计算、RFM分析、NPS净推荐值

六、数字营销：SEO/SEM、社交媒体策略、内容营销漏斗（TOFU→MOFU→BOFU）、营销自动化、私域流量、AARRR漏斗、A/B测试

七、营销度量：营销ROI、CAC、LTV/CAC比率（≥3健康）、转化率优化、NPS

【知识体系B — 特劳特&里斯《定位》系列】

八、定位理论核心（《定位》）：营销终极战场是顾客心智而非市场；品类心智容量有限（7±2法则）；成为第一比做得更好更重要；不能做品类第一就创造新品类做第一；关联定位（借已有认知建新认知，如"七喜：非可乐"）；重新定位竞争对手；品牌名是定位起点（通用名是大忌）；品牌延伸稀释心智定位，专家品牌打败延伸品牌

九、商战四种战略（《商战》）：防御战（领导者打/自我攻击/阻断进攻）、进攻战（攻领导者强势中的弱点/集中兵力窄线攻击）、侧翼战（无人区展开/奇袭为关键/追击同样重要）、游击战（守住小地盘/不学领导者/随时准备撤退）

十、22条商规精要（《22条商规》）：领先法则（第一胜过更好）、品类法则（创建新品类）、心智法则（进入心智比进入市场重要）、认知法则（营销是认知之争）、聚焦法则（心智中拥有一个代名词）、专有法则（不可共享代名词）、阶梯法则、二元法则（最终两匹马竞赛）、对立法则（老二策略由老大决定）、分化法则（品类必然分化）、延伸法则（品牌延伸适得其反）、牺牲法则（有所失才有所得）、坦诚法则、资源法则

十一、聚焦战略（《聚焦》）：收缩聚焦而非扩张多元化；专家品牌vs通才品牌（专家总赢）；聚焦三步：明确品类→牺牲次要→主导细分；聚焦≠产品单一，而是心智中只代表一个概念

十二、品类创新（《品牌的起源》）：品牌诞生源于品类分化；自然界物种分化=商业品类分化；创建新品类4个关键：新品类名+新品牌名+差异化定位+抢占心智窗口；品类命名比品牌命名更重要

十三、视觉锤（劳拉·里斯《视觉锤》）：语言钉子需要视觉锤钉入心智；视觉先于语言进入心智；好的视觉锤类型：形状/颜色/产品本身/包装/动态/创始人/符号/名人/动物/传承；一致性和重复是关键

十四、差异化（《与众不同》&《营销革命》）：自下而上营销——先找有效战术再上升为战略；9种差异化：成为第一/拥有特性/领导地位/传统经典/市场专长/最受青睐/制造方法/新一代/热销流行；差异化须可证明、有信任状

【工作原则】结合ERP真实数据给出有据可依的建议；标注使用的框架/模型；输出结构化可执行方案；给出量化KPI和时间表；区分短期战术和长期战略；预算建议务实。

【交互风格】像资深顾问做咨询，专业但不学究；先问清业务背景再给建议；用框架结构化输出，语言通俗易懂。

${ERP_TOOL_NOTE}回复用中文，兼具战略高度和落地可行性。`,
  },
}

const agentTools = [
  { name: 'query_customers', description: '查询客户列表', parameters: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_suppliers', description: '查询供应商列表', parameters: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_goods', description: '查询商品列表', parameters: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_inventory', description: '查询库存数据', parameters: { type: 'object', properties: { keyword: { type: 'string' } } } },
  { name: 'query_sales', description: '查询销售数据', parameters: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_purchases', description: '查询采购订单', parameters: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_finance', description: '查询财务数据（收款单/付款单/应收/应付/资金账户/预付款）', parameters: { type: 'object', properties: { type: { type: 'string', enum: ['collect', 'pay', 'receivable', 'payable', 'fund', 'prepay'] }, limit: { type: 'number' } }, required: ['type'] } },
  { name: 'query_staff', description: '查询员工列表', parameters: { type: 'object', properties: { keyword: { type: 'string' } } } },
  { name: 'query_warehouses', description: '查询仓库列表', parameters: { type: 'object', properties: {} } },
  { name: 'navigate_to', description: '跳转到指定页面', parameters: { type: 'object', properties: { page: { type: 'string' } }, required: ['page'] } },
  {
    name: 'fetch_trending',
    description: '获取各平台实时热搜榜单。支持平台：weibo（微博）、baidu（百度）、douyin（抖音）、xiaohongshu（小红书）。',
    parameters: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['weibo', 'baidu', 'douyin', 'xiaohongshu'] },
      },
      required: ['platform'],
    },
  },
]

const generateImageTool = {
  name: 'generate_image',
  description: '根据英文提示词生成图片。调用AI生图模型（Flux Schnell），返回图片URL。提示词必须是英文，尽量详细描述画面内容、风格、构图、色调。',
  parameters: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: '英文生图提示词，详细描述画面' },
      aspect_ratio: { type: 'string', enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'], description: '图片比例，默认1:1' },
    },
    required: ['prompt'],
  },
}

function getToolsForAgent(agentId: string) {
  if (agentId === 'designer') return [...agentTools, generateImageTool]
  return agentTools
}


// Memory helpers
async function loadMemory(kv: KVNamespace, token: string, agentId: string): Promise<any[]> {
  try {
    const key = `mem:${token.slice(-16)}:${agentId}`
    const val = await kv.get(key, 'json')
    return (val as any[]) || []
  } catch { return [] }
}

async function saveMemory(kv: KVNamespace, token: string, agentId: string, messages: any[]) {
  try {
    const key = `mem:${token.slice(-16)}:${agentId}`
    const trimmed = messages.slice(-40)
    await kv.put(key, JSON.stringify(trimmed), { expirationTtl: 60 * 60 * 24 * 30 })
  } catch {}
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token, x-agent-id',
    },
  })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId') || ''
  const erpToken = request.headers.get('x-erp-token') || ''
  if (agentId && erpToken) {
    const key = `mem:${erpToken.slice(-16)}:${agentId}`
    await env.AGENT_MEMORY.delete(key)
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const imgKey = url.searchParams.get('imgKey') || ''
  if (imgKey) {
    const data = await env.AGENT_MEMORY.get(imgKey, 'arrayBuffer')
    if (!data) return new Response('Image not found or expired', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } })
    return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } })
  }
  const agentId = url.searchParams.get('agentId') || ''
  const erpToken = request.headers.get('x-erp-token') || ''
  if (!agentId || !erpToken) {
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  const messages = await loadMemory(env.AGENT_MEMORY, erpToken, agentId)
  return new Response(JSON.stringify(messages), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY' }), { status: 500 })
  }

  const body = await request.json() as any

  // 图片取回接口
  if (body.action === 'getImage' && body.imgKey) {
    const data = await env.AGENT_MEMORY.get(body.imgKey, 'arrayBuffer')
    if (!data) return new Response('expired', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } })
    return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } })
  }

  const { messages, agentId } = body
  const erpToken = request.headers.get('x-erp-token') || ''
  const { realToken, backend } = decodeErpToken(erpToken)
  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
  const replicateToken = env.REPLICATE_API_TOKEN || ''
  const cfAI = env.AI

  const agent = AGENTS[agentId]
  if (!agent) {
    return new Response(JSON.stringify({ error: `Unknown agent: ${agentId}` }), { status: 400 })
  }

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const send = async (obj: object) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

  ;(async () => {
    try {
      // 截取最近 10 条，避免超出 200k token 限制
      const apiMessages = messages.slice(-10).map((m: any) => ({ role: m.role, content: m.content }))
      // 确保第一条是 user 消息（Anthropic 要求）
      const firstUserIdx = apiMessages.findIndex((m: any) => m.role === 'user')
      const trimmedMessages = firstUserIdx > 0 ? apiMessages.slice(firstUserIdx) : apiMessages
      let loopMessages = [...trimmedMessages]
      let fullAssistantText = ''

      for (let i = 0; i < 5; i++) {
        const res = await fetch(`${baseURL}/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, system: agent.systemPrompt, tools: getToolsForAgent(agentId), messages: loopMessages }),
        })
        if (!res.ok) { await send({ type: 'error', error: `API错误: ${await res.text()}` }); break }
        const data: any = await res.json()
        for (const block of data.content || []) {
          if (block.type === 'text' && block.text) {
            fullAssistantText += block.text
            await send({ type: 'text', text: block.text })
          }
        }
        if (data.stop_reason !== 'tool_use') break
        const toolUseBlocks = (data.content || []).filter((b: any) => b.type === 'tool_use')
        const toolResults: any[] = []
        for (const toolUse of toolUseBlocks) {
          await send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
          const result = await executeTool(toolUse.name, toolUse.input, realToken, backend, cfAI, env.AGENT_MEMORY)
          await send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
        }
        loopMessages = [...loopMessages, { role: 'assistant', content: data.content }, { role: 'user', content: toolResults }]
      }

      if (erpToken && fullAssistantText) {
        const savedMessages = [...messages, { role: 'assistant', content: fullAssistantText }]
        await saveMemory(env.AGENT_MEMORY, erpToken, agentId, savedMessages)
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } catch (e: any) {
      await send({ type: 'error', error: e.message })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' },
  })
}
