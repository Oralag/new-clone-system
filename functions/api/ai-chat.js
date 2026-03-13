const DEFAULT_SYSTEM = '你是数字游牧ERP系统的AI助手，帮助用户查询数据、录入单据、解答业务问题。回答简洁专业，用中文回复。'

export async function onRequest(context) {
  const { request, env } = context

  const apiKey = env.GEMINI_API_KEY || 'AIzaSyBmUXoTHWzIZHDIJu38vsLlaazJb2AiTeE'

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const { messages, systemPrompt, images } = await request.json()
  const sysPrompt = systemPrompt || DEFAULT_SYSTEM

  // Build processed messages with image support
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
            source: { type: 'base64', media_type: img.mediaType, data: img.data },
          })),
          { type: 'text', text: textContent || '请识别这张单据图片，提取所有关键信息，然后告知我识别结果并帮我录入系统。' },
        ],
      }
    }
  }

  // Convert to Gemini format
  const geminiContents = processedMessages.map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user'
    if (typeof m.content === 'string') {
      return { role, parts: [{ text: m.content }] }
    }
    const parts = m.content.map(block => {
      if (block.type === 'text') return { text: block.text }
      if (block.type === 'image') return {
        inline_data: { mime_type: block.source.media_type, data: block.source.data }
      }
      return { text: '' }
    })
    return { role, parts }
  })

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sysPrompt }] },
        contents: geminiContents,
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  )

  const result = await geminiRes.json()
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return new Response(JSON.stringify({
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
  }), {
    status: 200,
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
