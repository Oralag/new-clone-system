// Cloudflare Pages Function — /api/book-search
// Search for a book by name and generate a structured summary using AI

interface Env {
  ANTHROPIC_API_KEY: string
  ANTHROPIC_BASE_URL?: string
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 API KEY' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  const { title } = await request.json() as { title: string }
  if (!title?.trim()) {
    return new Response(JSON.stringify({ error: '请输入书名' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }

  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'

  try {
    const res = await fetch(`${baseURL}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: `你是一个专业的书籍摘要助手。用户会给你一本书的书名，你需要：
1. 识别这本书的作者、出版信息
2. 提取该书的核心框架、关键理论、重要概念
3. 用结构化的方式输出摘要（用标题、分点列举）
4. 内容要专业、准确、有深度，像一份高质量的读书笔记
5. 如果是经典著作，要覆盖所有核心章节和理论

输出格式：
作者：xxx

【核心内容】

一、xxx
- 要点1
- 要点2

二、xxx
...

注意：直接输出内容，不要加"以下是摘要"之类的前缀。全程中文。`,
        messages: [{ role: 'user', content: `请为这本书生成详细的知识摘要：《${title.trim()}》` }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return new Response(JSON.stringify({ error: `AI 请求失败: ${res.status}` }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    const data: any = await res.json()
    const content = data.content?.[0]?.text || ''

    // 尝试从内容中提取标签
    const tagKeywords = ['营销', '管理', '投资', '心理学', '经济', '战略', '品牌', '定位', '创新', '领导力', '金融', '商业', '设计', '技术', '哲学', '历史', '传记', '小说', '科学', '数学']
    const tags = tagKeywords.filter(kw => title.includes(kw) || content.includes(kw)).slice(0, 5)

    return new Response(JSON.stringify({ content, tags }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}
