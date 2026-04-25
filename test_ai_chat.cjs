const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const networkLogs = [];

  // Intercept /api/ai-chat responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/ai-chat')) {
      let body = '';
      try {
        body = await response.text();
      } catch(e) {
        body = '[could not read body: ' + e.message + ']';
      }
      networkLogs.push({
        url: url,
        status: response.status(),
        body: body.substring(0, 5000)
      });
    }
  });

  console.log('Navigating to site...');
  await page.goto('https://nomaderp.pages.dev', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page loaded: ' + page.url());

  // Login
  console.log('Filling login form...');
  try {
    await page.fill('input[type="text"]', '17747344571');
    await page.fill('input[type="password"]', 'Oral6421');
    await page.click('button[type="submit"]');
  } catch(e) {
    console.log('Login form error: ' + e.message);
    const inputs = await page.$$('input');
    console.log('Inputs found: ' + inputs.length);
    for (const inp of inputs) {
      const type = await inp.getAttribute('type');
      const placeholder = await inp.getAttribute('placeholder');
      console.log('  input type=' + type + ' placeholder=' + placeholder);
    }
  }
  
  await page.waitForTimeout(4000);
  console.log('After login URL: ' + page.url());
  await page.screenshot({ path: '/tmp/after_login.png' });

  // Get page texts
  const pageText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text.length > 0 && text.length < 50) texts.push(text);
    }
    return texts.slice(0, 80);
  });
  console.log('Page texts: ' + JSON.stringify(pageText));

  // Try clicking ERP管家
  let clicked = false;
  try {
    await page.click('text=ERP管家', { timeout: 3000 });
    clicked = true;
    console.log('Clicked ERP管家 text');
  } catch(e) {
    console.log('ERP管家 text not found');
  }

  if (!clicked) {
    const floatingEls = await page.$$('[class*="float"], [class*="ai-"], [class*="chat-btn"], [class*="assistant"], [class*="bubble"]');
    console.log('Floating elements: ' + floatingEls.length);
    for (const el of floatingEls) {
      const cls = await el.getAttribute('class');
      const text = await el.textContent();
      console.log('  el class=' + cls + ' text=' + text.substring(0, 30));
    }
    if (floatingEls.length > 0) {
      await floatingEls[0].click();
      clicked = true;
    }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/after_click_ai.png' });

  // Find chat input
  console.log('Looking for chat input...');
  const allInputs = await page.$$('input, textarea');
  for (const inp of allInputs) {
    const placeholder = await inp.getAttribute('placeholder');
    const visible = await inp.isVisible();
    console.log('  input placeholder=' + placeholder + ' visible=' + visible);
  }

  let sentMessage = false;
  try {
    const chatInput = await page.$('textarea');
    if (chatInput) {
      const visible = await chatInput.isVisible();
      console.log('Textarea visible: ' + visible);
      if (visible) {
        await chatInput.fill('你好');
        await chatInput.press('Enter');
        sentMessage = true;
        console.log('Sent 你好 via textarea');
      }
    }
  } catch(e) {
    console.log('Textarea error: ' + e.message);
  }

  if (!sentMessage) {
    try {
      await page.fill('input[placeholder*="输入"]', '你好');
      await page.press('input[placeholder*="输入"]', 'Enter');
      sentMessage = true;
      console.log('Sent via 输入 placeholder');
    } catch(e) {
      console.log('输入 placeholder error: ' + e.message.substring(0, 100));
    }
  }

  console.log('Waiting 20 seconds for AI response...');
  await page.waitForTimeout(20000);
  
  await page.screenshot({ path: '/tmp/after_response.png' });

  // Get all text content from chat area
  const chatContent = await page.evaluate(() => {
    const selectors = [
      '[class*="message"]',
      '[class*="chat"]',
      '[class*="bubble"]', 
      '[class*="dialog"]',
      '[class*="panel"]',
      '[class*="ai"]',
      '.msg',
      '.response'
    ];
    
    const results = {};
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        results[sel] = Array.from(els).map(el => ({
          class: el.className,
          text: el.textContent.trim().substring(0, 500)
        }));
      }
    }
    return results;
  });
  
  console.log('CHAT_CONTENT: ' + JSON.stringify(chatContent, null, 2));
  console.log('NETWORK_LOGS: ' + JSON.stringify(networkLogs, null, 2));

  await browser.close();
})();
