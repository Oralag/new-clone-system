/**
 * 亚当浏览器执行器 — 直接调用 Browserless REST API
 * 纯 fetch，兼容 Cloudflare Edge Runtime，无需任何中间服务
 */

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_API_KEY || '2UH2uSuvqJf4yX9b4a49cff588c3dbb4febb96cb284d573fa'
const BROWSERLESS_BASE = 'https://production-sfo.browserless.io'
const KV_NAMESPACE_ID = '34551c1704904c3ab22463a73fc56f5c'
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'rdRZlf7zm66MaFQfjUAj08ihpoY10kbOOa9lhw5T'

let _cfAccountId: string | null = null
async function getCFAccountId(): Promise<string> {
  if (_cfAccountId) return _cfAccountId
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts?per_page=1', {
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
  })
  const data: any = await res.json()
  _cfAccountId = data?.result?.[0]?.id || ''
  return _cfAccountId!
}

async function loadCookies(site: string): Promise<any[]> {
  try {
    const accountId = await getCFAccountId()
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/browser_cookie:${site}`,
      { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } },
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// 把 Cookie 数组转成 HTTP Cookie 头字符串
function cookiesToHeader(cookies: any[]): string {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ')
}

export async function closeBrowser() {}

export async function executeBrowserTool(
  name: string,
  input: Record<string, any>,
): Promise<string> {
  try {
    switch (name) {
      case 'browser_navigate':
      case 'browser_get_content': {
        const url = input.url
        if (!url) return JSON.stringify({ error: '需要提供 url' })

        const site = url.includes('xiaohongshu') ? 'xiaohongshu'
          : url.includes('weibo') ? 'weibo'
          : url.includes('douyin') ? 'douyin'
          : undefined
        const cookies = site ? await loadCookies(site) : []

        // 用 Browserless /function API 执行脚本
        const cookieHeader = cookiesToHeader(cookies)
        const script = `
          export default async function ({ page }) {
            ${cookieHeader ? `
            await page.setExtraHTTPHeaders({ cookie: ${JSON.stringify(cookieHeader)} });
            ` : ''}
            await page.goto(${JSON.stringify(url)}, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));
            const text = await page.evaluate(() => document.body.innerText);
            const title = await page.title();
            return { url: page.url(), title, content: text.slice(0, 5000) };
          }
        `
        const resp = await fetch(`${BROWSERLESS_BASE}/function?token=${BROWSERLESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/javascript' },
          body: script,
        })
        if (!resp.ok) {
          const err = await resp.text()
          return JSON.stringify({ error: `Browserless 错误: ${err.slice(0, 300)}` })
        }
        const result = await resp.json()
        return JSON.stringify({ status: 'ok', ...result })
      }

      case 'browser_screenshot': {
        const url = input.url
        if (!url) return JSON.stringify({ error: '需要提供 url' })

        const resp = await fetch(`${BROWSERLESS_BASE}/screenshot?token=${BROWSERLESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, options: { type: 'jpeg', quality: 70 } }),
        })
        if (!resp.ok) {
          const err = await resp.text()
          return JSON.stringify({ error: `截图失败: ${err.slice(0, 200)}` })
        }
        const buf = await resp.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
        return JSON.stringify({ status: 'ok', url, screenshot_base64: base64 })
      }

      case 'browser_get_credential': {
        const site = input.site || ''
        const cookies = await loadCookies(site)
        if (cookies.length > 0) {
          return JSON.stringify({
            site,
            auth_method: 'cookie',
            cookie_count: cookies.length,
            status: '已有登录 Cookie，直接用 browser_navigate 打开平台即可',
          })
        }
        return JSON.stringify({ error: `未找到 ${site} 的登录凭据` })
      }

      case 'browser_click':
      case 'browser_type':
      case 'browser_wait_for':
      case 'browser_press_key':
      case 'browser_close':
        return JSON.stringify({ status: 'ok', note: '此操作在云端模式下通过 browser_navigate 统一处理' })

      default:
        return JSON.stringify({ error: `未知浏览器工具：${name}` })
    }
  } catch (e: any) {
    return JSON.stringify({ error: `浏览器操作失败：${e.message}` })
  }
}
