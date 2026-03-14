// Cloudflare Pages Function — /api/trending
// 真实抓取各平台热搜榜单
//
// ⚠️ 平台封锁风险提示：
// - 微博：需要 Referer + UA，若返回 Forbidden 说明被封，需要加 Cookie → 通知开发者
// - 百度：解析 HTML，若页面改版会失效 → 通知开发者
// - 抖音：官方接口（目前稳定）
// - 小红书：需登录 cookie，暂不支持
// - 知乎：需登录 cookie，暂不支持

interface Env {}

const UA_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'

interface HotItem {
  title: string
  heat: string
  category?: string
}

// ── 微博热搜 ──────────────────────────────────────────────────────────────────
async function fetchWeibo(): Promise<HotItem[]> {
  const res = await fetch('https://weibo.com/ajax/side/hotSearch', {
    headers: {
      'User-Agent': UA_DESKTOP,
      'Accept': 'application/json',
      'Referer': 'https://weibo.com/',
    },
  })
  if (!res.ok) throw new Error(`微博接口返回 ${res.status}，可能需要 Cookie`)
  const data: any = await res.json()
  if (data?.error) throw new Error(`微博接口: ${data.error}`)
  const items: any[] = data?.data?.realtime || []
  return items.slice(0, 20).map((item: any) => ({
    title: item.word || '',
    heat: item.num ? `${Math.round(Number(item.num) / 10000)}万` : '热门',
    category: item.category || '',
  })).filter(i => i.title)
}

// ── 百度热搜（解析 HTML） ─────────────────────────────────────────────────────
async function fetchBaidu(): Promise<HotItem[]> {
  const res = await fetch('https://top.baidu.com/board?tab=realtime', {
    headers: {
      'User-Agent': UA_MOBILE,
      'Referer': 'https://www.baidu.com',
      'Accept': 'text/html,*/*',
    },
  })
  if (!res.ok) throw new Error(`百度接口返回 ${res.status}`)
  const html = await res.text()
  const words: string[] = []
  const hots: string[] = []
  for (const m of html.matchAll(/"word":"([^"]+)"/g)) words.push(m[1])
  for (const m of html.matchAll(/"hotScore":"?(\d+)"?/g)) hots.push(m[1])
  if (words.length === 0) throw new Error('百度页面结构已变更，需要更新解析逻辑')
  return words.slice(0, 20).map((title, i) => ({
    title,
    heat: hots[i] ? `${Math.round(Number(hots[i]) / 10000)}万` : '热门',
  })).filter(i => i.title)
}

// ── 抖音热搜（官方接口） ──────────────────────────────────────────────────────
async function fetchDouyin(): Promise<HotItem[]> {
  const res = await fetch('https://www.douyin.com/aweme/v1/hot/search/list/', {
    headers: {
      'User-Agent': UA_MOBILE,
      'Accept': 'application/json',
      'Referer': 'https://www.douyin.com/',
    },
  })
  if (!res.ok) throw new Error(`抖音接口返回 ${res.status}`)
  const data: any = await res.json()
  const items: any[] = data?.data?.word_list || []
  if (items.length === 0) throw new Error('抖音接口结构变更或被封锁')
  return items.slice(0, 20).map((item: any) => ({
    title: item.word || '',
    heat: item.hot_value ? `${Math.round(Number(item.hot_value) / 10000)}万` : '热门',
  })).filter(i => i.title)
}

// ── 小红书 / 知乎：暂不支持（需登录 cookie） ─────────────────────────────────
async function fetchUnsupported(platform: string): Promise<HotItem[]> {
  throw new Error(`${platform} 需要登录 Cookie 才能抓取，暂不支持`)
}

const fetchers: Record<string, () => Promise<HotItem[]>> = {
  weibo: fetchWeibo,
  baidu: fetchBaidu,
  douyin: fetchDouyin,
  xiaohongshu: () => fetchUnsupported('小红书'),
  zhihu: () => fetchUnsupported('知乎'),
}

export const onRequestOptions: PagesFunction = async () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
})

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url)
  const platform = url.searchParams.get('platform') || 'weibo'

  const fetcher = fetchers[platform]
  if (!fetcher) {
    return new Response(JSON.stringify({ error: `不支持的平台: ${platform}`, items: [] }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const items = await fetcher()
    return new Response(JSON.stringify({ platform, items, fetchedAt: new Date().toISOString() }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({
      platform,
      items: [],
      error: e.message,
      warning: '⚠️ 该平台热搜接口失效，请通知开发者更新',
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
