import { useUserMemoryStore } from '@/stores/userMemory'
import type { UserMemory } from '@/stores/userMemory'

interface SimpleMessage {
  role: string
  content: string
}

export async function extractAndMerge(messages: SimpleMessage[]) {
  if (messages.length < 4) return // 对话太短，不提取

  const recent = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
  const summary = recent.map(m => `${m.role === 'user' ? '用户' : '管家'}：${m.content.slice(0, 200)}`).join('\n')

  try {
    const res = await fetch('/api/ai-extract-memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationSummary: summary }),
    })
    if (!res.ok) return
    const data = await res.json()
    if (data.preferences && typeof data.preferences === 'object') {
      const store = useUserMemoryStore()
      store.mergeExtracted(data.preferences as Partial<UserMemory>)
    }
  } catch {
    // 提取失败不阻塞用户
  }
}
