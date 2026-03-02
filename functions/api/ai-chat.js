export async function onRequest(context) {
  const { request, env } = context

  const apiKey = env.ANTHROPIC_API_KEY || 'sk-ant-oat01-CVZ7MGdekrYYzidbMRuUETnDAIKhgeKN'
  const baseUrl = env.ANTHROPIC_BASE_URL || 'https://chat.nuoda.vip/claudecode'

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const { messages, systemPrompt, images } = await request.json()

  // If images were uploaded, attach them as vision content to the last user message
  let processedMessages = messages.map(m => ({ ...m }))
  if (images && images.length > 0) {
    const lastUserIdx = [...processedMessages].map((m, i) => [m, i]).reverse().find(([m]) => m.role === 'user')?.[1]
    if (lastUserIdx !== undefined) {
      const lastMsg = processedMessages[lastUserIdx]
      const textContent = typeof lastMsg.content === 'string' ? lastMsg.content : ''
      processedMessages[lastUserIdx] = {
        role: 'user',
        content: [
          ...images.map(img => ({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mediaType,
              data: img.data,
            },
          })),
          {
            type: 'text',
            text: textContent || '请识别这张单据图片，提取所有关键信息（单据类型、单号、日期、客户/供应商、商品明细、金额等），然后告知我识别结果并帮我录入系统。',
          },
        ],
      }
    }
  }

  // Build messages: prepend system prompt as first user+assistant turn
  const fullMessages = [
    {
      role: 'user',
      content: `[系统初始化指令]\n${systemPrompt}\n\n请回复"明白"以确认你已理解上述规则。`,
    },
    {
      role: 'assistant',
      content: '明白，我是数字游牧ERP系统的内置AI助手，我可以直接操作系统API录入数据，不会添加任何免责声明或推脱性语句。',
    },
    ...processedMessages,
  ]

  const anthropicRes = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      stream: false,
      system: systemPrompt,
      messages: fullMessages,
    }),
  })

  const result = await anthropicRes.json()
  return new Response(JSON.stringify(result), {
    status: anthropicRes.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}
