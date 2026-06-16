// Cloudflare Pages Function — /api/trending
// 使用 pearktrue API 获取各平台热搜（Cloudflare Functions 无法用 dailyhot-api npm 包）

interface Env {}

interface HotItem {
  title: string
  heat: string
  url?: string
}

// pearktrue API 平台名映射
const PEARKTRUE_NAMES: Record<string, string> = {
  douyin: '抖音',
  weibo: '微博',
  bilibili: '哔哩哔哩',
  zhihu: '知乎',
  xiaohongshu: '今日头条',  // 小红书无公开API，用头条替代
  kuaishou: '今日头条',      // 快手不稳定，用头条替代
}

const PLATFORM_SOURCE: Record<string, string> = {
  xiaohongshu: '今日头条',
  kuaishou: '今日头条',
}

// 平台名到 imsyy hot API 的 type 映射
const IMSYY_TYPES: Record<string, string> = {
  '微博': 'weibo',
  '抖音': 'douyin',
  '哔哩哔哩': 'bilibili',
  '知乎': 'zhihu',
  '今日头条': 'toutiao',
}

async function fetchFromPearktrue(platformTitle: string): Promise<HotItem[]> {
  const res = await fetch(
    `https://api.pearktrue.cn/api/dailyhot/?title=${encodeURIComponent(platformTitle)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) throw new Error(`pearktrue 返回 ${res.status}`)
  const json: any = await res.json()
  if (json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error(json.msg || '数据格式异常')
  }
  return json.data.map((item: any) => ({
    title: item.title || '',
    heat: typeof item.hot === 'number'
      ? (item.hot >= 10000 ? `${Math.round(item.hot / 10000)}万` : String(item.hot))
      : item.hot || '热门',
    url: item.url || item.mobileUrl || '',
  })).filter((i: HotItem) => i.title)
}

async function fetchFromImsyy(platformTitle: string): Promise<HotItem[]> {
  const type = IMSYY_TYPES[platformTitle]
  if (!type) throw new Error('imsyy 不支持该平台')
  const res = await fetch(
    `https://hot.imsyy.top/${type}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) throw new Error(`imsyy 返回 ${res.status}`)
  const json: any = await res.json()
  const rows: any[] = json.data || []
  return rows.slice(0, 30).map((item: any) => ({
    title: item.title || item.word || '',
    heat: item.hot || item.num || '热门',
    url: item.url || '',
  })).filter((i: HotItem) => i.title)
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
  const platform = url.searchParams.get('platform') || 'douyin'
  const platformTitle = PEARKTRUE_NAMES[platform]

  if (!platformTitle) {
    return Response.json(
      { code: 400, data: [], message: `不支持的平台: ${platform}` },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
    )
  }

  try {
    let items: HotItem[] = []
    try {
      items = await fetchFromPearktrue(platformTitle)
    } catch {
      items = await fetchFromImsyy(platformTitle)
    }
    return Response.json(
      {
        code: 200,
        data: items,
        source: PLATFORM_SOURCE[platform] || platform,
        total: items.length,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
        },
      },
    )
  } catch (e: any) {
    return Response.json(
      { code: 500, data: [], message: e.message },
      { headers: { 'Access-Control-Allow-Origin': '*' } },
    )
  }
}
