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
        system: `你是一个专业的书籍知识提炼师。用户给你一本书的书名，你要提炼出这本书真正有价值的知识内容。

要求：
- 输出这本书的核心思想、关键方法论、重要概念和实用框架
- 内容要有深度，像一位真正读过这本书的专家在讲解
- 覆盖书中最重要的3-5个核心主题，每个主题展开详细说明
- 包含书中的具体案例、数据、论点（如有）
- 语言简洁直接，不废话

格式要求（严格遵守）：
- 第一行：作者：xxx（出版年份）
- 空一行后直接进入内容
- 用「一、二、三」等中文序号分隔主题
- 每个主题下用「•」符号列举要点
- 禁止使用 Markdown 语法（不用#、**、\`\`\`等符号）
- 禁止写目录、章节列表、前言总结
- 全程中文，直接输出内容，不加任何前缀`,
        messages: [{ role: 'user', content: `请提炼这本书的核心知识：《${title.trim()}》` }],
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
