/**
 * 小红书一次性登录脚本
 * 弹出浏览器，等60秒让你登录，然后自动保存 Cookie
 *
 * 运行方式：npx tsx scripts/xhs-login.ts
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const COOKIE_DIR = join(process.cwd(), '.adam-credentials')
const COOKIE_FILE = join(COOKIE_DIR, 'xiaohongshu.json')

async function main() {
  console.log('启动浏览器...')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })

  const page = await context.newPage()
  await page.waitForTimeout(1000)

  try {
    await page.goto('https://www.xiaohongshu.com/explore', { waitUntil: 'load', timeout: 30000 })
  } catch {
    // 忽略导航错误，继续
  }

  console.log('')
  console.log('========================================')
  console.log('浏览器已打开！请在窗口里手动登录小红书')
  console.log('60秒后自动保存 Cookie...')
  console.log('========================================')

  // 倒计时显示
  for (let i = 60; i > 0; i--) {
    process.stdout.write(`\r等待中... ${i}秒 `)
    await new Promise(r => setTimeout(r, 1000))
  }
  console.log('\n正在保存 Cookie...')

  const cookies = await context.cookies()
  const xhsCookies = cookies.filter(c =>
    c.domain.includes('xiaohongshu.com') || c.domain.includes('xhscdn.com')
  )

  if (xhsCookies.length === 0) {
    console.log('⚠️  未找到小红书 Cookie，请确认已登录再试')
    await browser.close()
    return
  }

  mkdirSync(COOKIE_DIR, { recursive: true })
  writeFileSync(COOKIE_FILE, JSON.stringify(xhsCookies, null, 2))

  console.log(`✅ 已保存 ${xhsCookies.length} 条 Cookie`)
  console.log('亚当现在可以直接操作小红书了。')

  await browser.close()
}

main().catch(e => console.error('❌', e.message))
