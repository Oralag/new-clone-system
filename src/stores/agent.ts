import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'

export interface TrendingItem {
  title: string
  hot?: string | number
  url?: string
}

export interface FlowResult {
  platform: string
  platformName: string
  topic: string
  type: 'video_script' | 'poster' | 'copy'
  content: string
}

export const useTrendingStore = defineStore('agent', () => {
  const trending = ref<Record<string, TrendingItem[]>>({
    douyin: [], xiaohongshu: [], kuaishou: [],
  })
  const loading = ref(false)
  const selectedTopics = ref<string[]>([])
  const flowResults = ref<FlowResult[]>([])
  const videoScript = ref<{ topic: string; content: string; platform: string } | null>(null)
  const publishContent = ref<{ script: string; topic: string; type: string } | null>(null)

  async function fetchTrending(platform: string) {
    loading.value = true
    try {
      const platformMap: Record<string, string> = {
        douyin: 'douyin', xiaohongshu: 'xiaohongshu', kuaishou: 'kuaishou',
      }
      const res = await http.get('/agent/Trending/getTrending', {
        params: { platform: platformMap[platform] || platform },
      })
      const list = res.data?.data?.list || res.data?.list || []
      trending.value[platform] = list
    } catch (e) {
      console.error('fetchTrending error', e)
      trending.value[platform] = []
    } finally {
      loading.value = false
    }
  }

  function setSelectedTopics(topics: string[]) {
    selectedTopics.value = topics
  }

  function setFlowResults(results: FlowResult[]) {
    flowResults.value = results
  }

  function setVideoScript(data: { topic: string; content: string; platform: string }) {
    videoScript.value = data
  }

  function setPublishContent(data: { script: string; topic: string; type: string }) {
    publishContent.value = data
  }

  return {
    trending, loading, selectedTopics, flowResults, videoScript, publishContent,
    fetchTrending, setSelectedTopics, setFlowResults, setVideoScript, setPublishContent,
  }
})
