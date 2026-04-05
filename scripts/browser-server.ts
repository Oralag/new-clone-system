/**
 * 本地浏览器服务
 * 用本机 Playwright + 手机热点 IP 操控浏览器
 * 通过 ngrok 暴露给 Cloudflare 调用
 */

import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import * as http from 'http'

const PORT = 3099
const AUTH = 'adam-browser-secret'
const COOKIE_DIR = join(process.cwd(), '.adam-credentials')

function loadCookies(site: string): any[] {
  const f = join(COOKIE_DIR, `${site}.json`)
  if (!existsSync(f)) return []
  try { return JSON.parse(readFileSync(f, 'utf-8')) } catch { return [] }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method !== 'POST') {
    res.writeHead(404); res.end(JSON.stringify({ ok: false, error: 'Not found' })); return
  }

  const token = req.headers['x-auth-token']
  if (token !== AUTH) {
    res.writeHead(401); res.end(JSON.stringify({ ok: false, error: 'Unauthorized' })); return
  }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', async () => {
    let browser: any = null
    try {
      const { action, params, cookies: extraCookies } = JSON.parse(body)

      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      })

      // 加载 Cookie
      const allCookies = [...(extraCookies || [])]
      if (params?.url?.includes('xiaohongshu')) allCookies.push(...loadCookies('xiaohongshu'))
      if (allCookies.length > 0) await context.addCookies(allCookies)

      const page = await context.newPage()
      let result: any = {}

      if (action === 'get_content') {
        await page.goto(params.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForTimeout(2000)
        const text = await page.evaluate(() => document.body.innerText)
        result = { url: page.url(), title: await page.title(), content: text.slice(0, 5000) }
      } else if (action === 'screenshot') {
        await page.goto(params.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForTimeout(2000)
        const buf = await page.screenshot({ type: 'jpeg', quality: 70 })
        result = { url: page.url(), title: await page.title(), screenshot_base64: buf.toString('base64') }
      }

      await browser.close()
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true, result }))
    } catch (e: any) {
      if (browser) await browser.close().catch(() => {})
      res.writeHead(500)
      res.end(JSON.stringify({ ok: false, error: e.message }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`✅ 本地浏览器服务已启动 → http://localhost:${PORT}`)
  console.log('现在运行: ngrok http 3099')
})
