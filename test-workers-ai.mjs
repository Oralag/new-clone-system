// 本地测试 Workers AI 调用格式（模拟 env.AI.run）

const testPrompt = "你是数字游牧广告公司的Captain总指挥，回复简洁专业。"
const userMessage = "你好，帮我看看今天的任务"

console.log("测试 Workers AI 调用格式:")
console.log({
  messages: [
    { role: 'system', content: testPrompt },
    { role: 'user', content: userMessage },
  ],
  max_tokens: 800,
})

console.log("\n预期返回格式:")
console.log('{ response: "AI回复文本..." } 或直接返回字符串')
