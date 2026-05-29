import { ref } from 'vue'

export type PlanStatus = 'idea' | 'draft' | 'scheduled' | 'published'

export interface ContentPlan {
  id: number
  title: string
  channel: string
  date: string
  status: PlanStatus
  tags: string[]
}

let nextId = 10

const plans = ref<ContentPlan[]>([
  { id: 1, title: '品牌故事系列 · 第一篇', channel: '公众号', date: '2026-05-12', status: 'draft', tags: ['品牌故事', '长文'] },
  { id: 2, title: '产品体验测评笔记', channel: '小红书', date: '2026-05-13', status: 'scheduled', tags: ['种草', '测评'] },
  { id: 3, title: '工厂溯源短视频', channel: '抖音号', date: '2026-05-14', status: 'scheduled', tags: ['工厂', '品质'] },
  { id: 4, title: '六一节促销海报文案', channel: '公众号', date: '2026-05-20', status: 'idea', tags: ['节日', '促销'] },
  { id: 5, title: '供应链探访 Vlog', channel: '视频号', date: '2026-05-10', status: 'published', tags: ['幕后', '真实'] },
])

export function useContentCalendar() {
  function addPlan(plan: Omit<ContentPlan, 'id'>) {
    plans.value.unshift({ ...plan, id: nextId++ })
  }

  function updateStatus(id: number, status: PlanStatus) {
    const p = plans.value.find(p => p.id === id)
    if (p) p.status = status
  }

  function upcomingPlans(limit = 3) {
    return plans.value
      .filter(p => p.status !== 'published')
      .slice(0, limit)
  }

  return { plans, addPlan, updateStatus, upcomingPlans }
}
