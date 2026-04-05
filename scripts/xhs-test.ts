import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const cookies = JSON.parse(readFileSync(join(process.cwd(), '.adam-credentials/xiaohongshu.json'), 'utf-8'))
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext()
  await ctx.addCookies(cookies)
  const page = await ctx.newPage()
  await page.goto('https://www.xiaohongshu.com/explore', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(3000)
  const title = await page.title()
  const url = page.url()
  console.log('页面标题:', title)
  console.log('当前URL:', url)
  // 检查是否已登录（有没有用户头像）
  const loggedIn = await page.$('[class*="user-avatar"], .user-info, [data-type="user"]') !== null
  console.log('登录状态:', loggedIn ? '✅ 已登录' : '⚠️ 未登录（Cookie可能已过期）')
  await page.waitForTimeout(2000)
  await browser.close()
}

main().catch(e => console.error('❌', e.message))
