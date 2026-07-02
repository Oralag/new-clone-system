// Cloudflare Pages Function — /api/brand-chat
// 品牌客服智能体 Nova，无 ERP 工具，只用品牌知识库

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  const { request, env } = context

  const apiKey = env.AI_API_KEY
  const baseURL = (env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 AI_API_KEY' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  let body: any
  try { body = await request.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders })
  }

  const { messages = [], brandContext = '' } = body

  const systemPrompt = `你是 NOMADIC DAIRY 的专属客服助手 Nova。

【性格】温暖、专业、简洁。中英文都能流畅沟通，根据用户语言自动切换。
【禁止】绝对不透露你是 AI 或任何底层技术、不讨论竞争对手、不承诺无法实现的功能。
【能力范围】只回答和 NOMADIC DAIRY 品牌相关的问题：
- 产品信息、规格、使用场景
- 批发采购流程、起订量、价格咨询
- 物流时效、配送政策、退换货
- 订单状态查询引导（告知用户去订单查询页面）
- 品牌故事、品牌理念
- 支持渠道、联系方式

【当前品牌信息】
${brandContext || 'NOMADIC DAIRY — 专为数字游民设计的装备品牌，覆盖 120+ 国家。'}

【回复风格】
- 简洁，不超过3段
- 产品价格/库存 → 引导去商店页面查看
- 批发询价 → 引导填写采购商申请表
- 订单问题 → 引导去订单查询页面输入手机号或订单号`

  // SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        const response = await fetch(`${baseURL}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: (env as any).AI_MODEL || 'deepseek-chat',
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
