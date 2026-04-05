import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  console.log('打开 Render dashboard...')
  await page.goto('https://dashboard.render.com', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // 找到 erp-server
  console.log('找 erp-server...')
  try {
    await page.getByText('erp-server', { exact: false }).first().click({ timeout: 10000 })
  } catch {
    await page.goto('https://dashboard.render.com/web', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    await page.getByText('erp-server', { exact: false }).first().click({ timeout: 10000 })
  }

  await page.waitForTimeout(2000)

  // 点 Environment
  console.log('打开 Environment...')
  await page.getByText('Environment', { exact: false }).first().click({ timeout: 10000 })
  await page.waitForTimeout(2000)

  console.log('当前URL:', page.url())
  console.log('页面内容片段:', (await page.evaluate(() => document.body.innerText)).slice(0, 500))

  // 添加第一个变量 BROWSERLESS_API_KEY
  console.log('添加 BROWSERLESS_API_KEY...')
  try {
    // 找到 Add Environment Variable 按钮
    const addBtn = page.getByText('Add Environment Variable', { exact: false }).first()
    await addBtn.click({ timeout: 10000 })
    await page.waitForTimeout(1000)

    // 填 key
    const inputs = await page.locator('input').all()
    console.log('找到输入框数量:', inputs.length)
    // 通常最后两个 input 是新增的 key/value
    if (inputs.length >= 2) {
      await inputs[inputs.length - 2].fill('BROWSERLESS_API_KEY')
      await inputs[inputs.length - 1].fill('2UH2uSuvqJf4yX9b4a49cff588c3dbb4febb96cb284d573fa')
    }
  } catch (e: any) {
    console.log('添加变量出错:', e.message)
  }

  await page.waitForTimeout(2000)
  console.log('截图保存中...')
  await page.screenshot({ path: '/tmp/render-env.png' })
  console.log('截图已保存到 /tmp/render-env.png')

  // 等待你确认
  await page.waitForTimeout(30000)
  await browser.close()
}

main().catch(e => console.error('❌', e.message))
