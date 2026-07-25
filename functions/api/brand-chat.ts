// Cloudflare Pages Function — /api/brand-chat
// 品牌客服智能体 Nova，无 ERP 工具，只用品牌知识库

interface Env {
  AI_API_KEY?: string
  AI_BASE_URL?: string
  AI_MODEL?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  const { request, env } = context

  const apiKey = env.AI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 AI_API_KEY' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  const baseURL = (env.AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '')
  const model = env.AI_MODEL || 'llama-3.3-70b-versatile'

  let body: any
  try { body = await request.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders })
  }

  const { messages = [], brandContext = '' } = body

  const BRAND_KNOWLEDGE = `【品牌】牧区纯坊 NOMADIC DAIRY
【创始人】乌日力格
【一句话】草原儿女从小吃的营养零食（Nutritious snacks enjoyed by children from the grasslands since childhood）

【品牌简介】
牧区纯坊源自内蒙古草原，专注原生奶食的现代化重构。以奶豆腐、奶条为核心，在保留风味与简单配料的基础上，转化为更便携、更高频的健康零食。从草原日常到城市生活，让奶食进入通勤、办公与分享场景，从地方特产转变为可持续消费，构建具备规模化能力的品牌路径。

【品牌理念】
我们只是把一件熟悉的东西，认真做好。
从小吃到大的奶食，本来就简单，也很好。我们尽量不去改变它的味道，只是在怎么做、怎么带、怎么吃上，做一些调整。
让它不只留在草原，也能出现在更多人的日常里。

【品牌愿景】
让这件从草原走出来的食物，不再只是被偶尔带走的特产，而是通过更稳定的产品形态与渠道进入更多人的日常生活，被持续选择、反复购买。逐步建立标准化产品体系与品牌认知，让草原奶食从地方走向全国，成为一个具备规模化能力的日常消费品牌。

【品牌名含义】
- 牧区：内蒙古地区人们对牧民生活乡下的统称，是俗语
- 纯：产品的纯正、正宗
- 坊：已有规模的专业熬制，可放心之意
定位：源自"中国乳都"内蒙古的本土新崛起年轻人品牌。立足本土民族文化，顺应时代潮流，发展内蒙古传统乳制食品，以"文化+创意"的新面孔，为年轻人推出营养健康、个性、休闲的奶食。

【战略方向】重新定义奶食品消费方式——从"地域特产"到"全国日常零食"
- 品牌化（解决溢价）
- 快消化（解决规模）
- 年轻化（解决用户）
- 连锁化（解决扩张）

【我们看到的问题】传统奶食为什么做不大？
1. 长期被当作特产 / 伴手礼，消费频次低
2. 产品形态单一，缺乏现代消费习惯的形态
3. 缺乏日常消费场景（办公、通勤、运动、分享）
4. 依赖线下地方渠道，线上覆盖不足
5. 区域品牌多，缺少全国性品牌和标准化背书

【核心品类】奶豆腐、奶条（其他传统奶食按实际在售商品列表回答）`

  const systemPrompt = `你是"牧区纯坊 NOMADIC DAIRY"的专属客服助手 Nova。

# 你是谁
你代表牧区纯坊说话，不是通用助手。回答里带着牧区纯坊的立场、语气和思路。

# 你熟悉的品牌
${BRAND_KNOWLEDGE}

# 语气与风格
- 温暖、简洁、真诚，像一个懂产品的自家人在说话，不端着不夸张
- 中英文流畅沟通，用户用什么语言就用什么语言回
- 别堆形容词，别喊口号，别用"亲""宝宝"这类电商话术
- 回复通常控制在 3 段以内；能一句说清就一句
- 涉及品牌理念时，可以引用品牌自己的说法："我们只是把一件熟悉的东西，认真做好"

# 能力范围
优先回答与牧区纯坊相关的问题：
- 产品与规格：奶豆腐、奶条等在售商品，从下方【在售商品】列表里准确引用价格/规格，不要编造
- 品牌与理念：品牌故事、创始人（乌日力格）、品牌名含义、愿景与战略方向
- 购买与物流、批发采购、售后退换
- 订单查询 → 引导去订单查询页输入手机号/订单号
- 批发询价 → 引导填写采购商申请表

# 硬性规则
- 不透露你是 AI，也不提任何底层技术、模型、供应商
- 不评价竞争对手
- 不承诺无法兑现的事（时效、赠品、绝对健康功效等）
- 不主动提及具体地名（如锡林郭勒等）除非用户先问到产地
- 不确定的信息 → 说"这个我帮您确认一下，可以留个联系方式"而不是编

# 商品动态信息
${brandContext || '（当前无实时商品数据，遇到具体价格/规格问题，请引导用户去商店页面查看最新信息）'}
`

  // SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
            ],
          }),
        })

        if (!response.ok) {
          send({ type: 'error', error: `API 错误: ${response.status}` })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }

        const data = await response.json() as any
        const text = data.choices?.[0]?.message?.content || ''
        if (text) send({ type: 'text', text })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (e: any) {
        send({ type: 'error', error: e.message })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders,
    }
  })
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
