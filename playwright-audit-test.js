const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console and network for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });

  try {
    // Step 1: Navigate to login page
    console.log('=== STEP 1: Navigate to app ===');
    await page.goto('https://nomaderp.pages.dev', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());

    // Step 2: Login
    console.log('\n=== STEP 2: Login ===');
    await page.waitForSelector('input', { timeout: 15000 });

    // Find phone and password inputs
    const inputs = await page.$$('input');
    console.log('Number of inputs found:', inputs.length);

    // Try to find by placeholder or type
    const phoneInput = await page.$('input[placeholder*="手机"], input[placeholder*="账号"], input[type="text"], input[placeholder*="phone"]');
    const passwordInput = await page.$('input[type="password"], input[placeholder*="密码"]');

    if (phoneInput) {
      await phoneInput.fill('17747344571');
      console.log('Phone entered');
    } else {
      // Try first input
      await inputs[0].fill('17747344571');
      console.log('Phone entered (first input)');
    }

    if (passwordInput) {
      await passwordInput.fill('Oral6421');
      console.log('Password entered');
    } else if (inputs.length > 1) {
      await inputs[1].fill('Oral6421');
      console.log('Password entered (second input)');
    }

    // Click login button
    const loginBtn = await page.$('button[type="submit"], button:has-text("登录"), .login-btn');
    if (loginBtn) {
      await loginBtn.click();
      console.log('Login button clicked');
    } else {
      // Try clicking any button
      await page.click('button');
      console.log('Clicked first button');
    }

    await page.waitForNavigation({ timeout: 15000 }).catch(() => console.log('No navigation after login click'));
    await page.waitForTimeout(3000);
    console.log('After login URL:', page.url());

    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('erp_token'));
    console.log('Token obtained:', token ? `${token.substring(0, 20)}...` : 'NULL');

    // Step 3: Navigate to procurement orders
    console.log('\n=== STEP 3: Navigate to /procure/order ===');
    await page.goto('https://nomaderp.pages.dev/#/procure/order', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('Current URL:', page.url());

    // Step 4: Find first row with status 待审核
    console.log('\n=== STEP 4: Find row with 待审核 status ===');
    await page.waitForSelector('table, .el-table', { timeout: 15000 }).catch(() => console.log('No table found yet'));
    await page.waitForTimeout(2000);

    // Take screenshot to see current state
    await page.screenshot({ path: '/tmp/step4-procurement-list.png' });
    console.log('Screenshot saved to /tmp/step4-procurement-list.png');

    // Find rows with 待审核 status
    const pageContent = await page.content();
    const hasDaiShenHe = pageContent.includes('待审核');
    console.log('Page contains 待审核:', hasDaiShenHe);

    // Get all table rows
    const rows = await page.$$('tr.el-table__row, tbody tr');
    console.log('Number of rows found:', rows.length);

    let targetRow = null;
    let orderNo = '';
    let orderQty = '';
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const rowText = await rows[i].innerText();
      if (rowText.includes('待审核')) {
        targetRow = rows[i];
        rowIndex = i;
        console.log(`Found 待审核 at row ${i}: ${rowText.substring(0, 200)}`);

        // Extract cells
        const cells = await rows[i].$$('td');
        console.log(`Row ${i} has ${cells.length} cells`);
        for (let j = 0; j < cells.length; j++) {
          const cellText = await cells[j].innerText();
          console.log(`  Cell[${j}]: ${cellText}`);
        }
        break;
      }
    }

    if (!targetRow) {
      console.log('No 待审核 row found! Let me check what statuses exist...');
      const allStatuses = await page.$$eval('td', cells =>
        cells.map(c => c.innerText.trim()).filter(t => t.length > 0 && t.length < 20)
      );
      console.log('All cell texts (short):', [...new Set(allStatuses)].slice(0, 30));

      await page.screenshot({ path: '/tmp/step4-no-pending.png' });
      throw new Error('No 待审核 row found');
    }

    // Step 5: Get token and check stock BEFORE audit
    console.log('\n=== STEP 5: Check stock BEFORE audit ===');
    const currentToken = await page.evaluate(() => localStorage.getItem('erp_token'));
    console.log('Token for API calls:', currentToken ? 'obtained' : 'missing');

    const stockBefore = await page.evaluate(async (token) => {
      const response = await fetch('https://nomaderp.pages.dev/adminapi/stock/StockAll/index?list_rows=200', {
        headers: { 'token': token }
      });
      const data = await response.json();
      return data;
    }, currentToken);

    console.log('Stock API response status:', stockBefore.code || stockBefore.status || 'unknown');
    if (stockBefore.data && stockBefore.data.data) {
      console.log('Stock records count:', stockBefore.data.data.length);
      console.log('First few stock records:');
      stockBefore.data.data.slice(0, 5).forEach((item, idx) => {
        console.log(`  [${idx}] goods_name: ${item.goods_name || item.name}, qty: ${item.qty || item.stock_qty || item.quantity}, id: ${item.id}`);
      });
    } else {
      console.log('Raw stock response:', JSON.stringify(stockBefore).substring(0, 500));
    }

    // Store all stock data for comparison
    const stockDataBefore = stockBefore.data && stockBefore.data.data ? stockBefore.data.data : [];
    const stockSummaryBefore = {};
    stockDataBefore.forEach(item => {
      stockSummaryBefore[item.id] = {
        goods_name: item.goods_name || item.name,
        qty: item.qty || item.stock_qty || item.quantity || 0,
        goods_id: item.goods_id
      };
    });

    // Step 6: Find and click 审核 button
    console.log('\n=== STEP 6: Click 审核 button ===');

    // Look for audit button in the target row
    const auditBtn = await targetRow.$('button:has-text("审核"), .audit-btn, [data-action="audit"]');
    if (auditBtn) {
      const btnText = await auditBtn.innerText();
      console.log('Found audit button with text:', btnText);

      // Get order info from the row before clicking
      const rowText = await targetRow.innerText();
      console.log('Full row text:', rowText);

      await auditBtn.click();
      console.log('Audit button clicked');
    } else {
      // Try looking for any button in the row with 审核 text
      const allBtnsInRow = await targetRow.$$('button, .el-button');
      console.log('Buttons in row:', allBtnsInRow.length);

      let clicked = false;
      for (const btn of allBtnsInRow) {
        const btnText = await btn.innerText();
        console.log('Button text:', btnText);
        if (btnText.includes('审核')) {
          await btn.click();
          console.log('Clicked audit button:', btnText);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        // Try page-wide search for 审核 buttons
        const allAuditBtns = await page.$$('button:has-text("审核")');
        console.log('Page-wide 审核 buttons:', allAuditBtns.length);
        if (allAuditBtns.length > 0) {
          await allAuditBtns[0].click();
          console.log('Clicked first page-wide 审核 button');
        } else {
          throw new Error('Cannot find 审核 button');
        }
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/step6-after-audit-click.png' });
    console.log('Screenshot after audit click saved');

    // Step 7: Handle confirmation dialog
    console.log('\n=== STEP 7: Handle confirmation dialog ===');

    // Check for Element Plus dialog/message box
    const dialog = await page.$('.el-message-box, .el-dialog, [role="dialog"]');
    if (dialog) {
      const dialogText = await dialog.innerText();
      console.log('Dialog found with text:', dialogText.substring(0, 200));

      // Click confirm button
      const confirmBtn = await page.$('.el-message-box__btns .el-button--primary, .el-dialog__footer .el-button--primary, button:has-text("确定"), button:has-text("确认")');
      if (confirmBtn) {
        await confirmBtn.click();
        console.log('Confirmation button clicked');
      } else {
        // Try any primary button
        const primaryBtns = await page.$$('.el-button--primary, button[type="button"]');
        console.log('Primary buttons found:', primaryBtns.length);
        for (const btn of primaryBtns) {
          const btnText = await btn.innerText();
          console.log('Primary button text:', btnText);
          if (btnText.includes('确') || btnText.includes('OK') || btnText.includes('确定')) {
            await btn.click();
            console.log('Clicked confirm:', btnText);
            break;
          }
        }
      }
    } else {
      console.log('No dialog found, checking for toast/notification...');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/step7-no-dialog.png' });
    }

    // Step 8: Wait 8 seconds for all API calls
    console.log('\n=== STEP 8: Waiting 8 seconds for API calls ===');
    await page.waitForTimeout(8000);
    console.log('8 second wait complete');

    await page.screenshot({ path: '/tmp/step8-after-wait.png' });

    // Step 9: Check row status after audit
    console.log('\n=== STEP 9: Check row status after audit ===');

    // Refresh or check current state
    const updatedRows = await page.$$('tr.el-table__row, tbody tr');
    console.log('Updated rows count:', updatedRows.length);

    // Look for the row that was audited (by order number if we have it)
    // Also look for 已审核 status
    let foundYiShenHe = false;
    for (let i = 0; i < Math.min(updatedRows.length, 20); i++) {
      const rowText = await updatedRows[i].innerText();
      if (rowText.includes('已审核') || rowText.includes('已入库') || rowText.includes('待入库')) {
        console.log(`Row ${i} shows post-audit status: ${rowText.substring(0, 200)}`);
        foundYiShenHe = true;

        const cells = await updatedRows[i].$$('td');
        for (let j = 0; j < cells.length; j++) {
          const cellText = await cells[j].innerText();
          console.log(`  Cell[${j}]: ${cellText}`);
        }
      }
    }

    if (!foundYiShenHe) {
      console.log('No 已审核 rows found yet, printing all row contents...');
      for (let i = 0; i < Math.min(updatedRows.length, 10); i++) {
        const rowText = await updatedRows[i].innerText();
        console.log(`Row ${i}: ${rowText.substring(0, 150)}`);
      }
    }

    // Step 10: Check stock AFTER audit
    console.log('\n=== STEP 10: Check stock AFTER audit ===');

    const stockAfter = await page.evaluate(async (token) => {
      const response = await fetch('https://nomaderp.pages.dev/adminapi/stock/StockAll/index?list_rows=200', {
        headers: { 'token': token }
      });
      const data = await response.json();
      return data;
    }, currentToken);

    console.log('Stock API response (after) status:', stockAfter.code || stockAfter.status || 'unknown');

    const stockDataAfter = stockAfter.data && stockAfter.data.data ? stockAfter.data.data : [];
    const stockSummaryAfter = {};
    stockDataAfter.forEach(item => {
      stockSummaryAfter[item.id] = {
        goods_name: item.goods_name || item.name,
        qty: item.qty || item.stock_qty || item.quantity || 0,
        goods_id: item.goods_id
      };
    });

    // Compare before vs after
    console.log('\n=== STOCK COMPARISON ===');
    let changesFound = false;

    // Check all items that might have changed
    const allIds = new Set([...Object.keys(stockSummaryBefore), ...Object.keys(stockSummaryAfter)]);
    for (const id of allIds) {
      const before = stockSummaryBefore[id];
      const after = stockSummaryAfter[id];

      if (!before && after) {
        console.log(`NEW ITEM [${id}]: ${after.goods_name}, qty: ${after.qty}`);
        changesFound = true;
      } else if (before && !after) {
        console.log(`REMOVED ITEM [${id}]: ${before.goods_name}, was qty: ${before.qty}`);
        changesFound = true;
      } else if (before && after && before.qty !== after.qty) {
        console.log(`CHANGED [${id}]: ${before.goods_name}, qty: ${before.qty} → ${after.qty} (diff: ${after.qty - before.qty})`);
        changesFound = true;
      }
    }

    if (!changesFound) {
      console.log('NO STOCK CHANGES DETECTED');
      console.log('Before count:', Object.keys(stockSummaryBefore).length);
      console.log('After count:', Object.keys(stockSummaryAfter).length);

      // Print first few items from both
      console.log('\nFirst 5 stock items BEFORE:');
      stockDataBefore.slice(0, 5).forEach(item => {
        console.log(`  id:${item.id} ${item.goods_name}: qty=${item.qty || item.stock_qty || item.quantity}`);
      });
      console.log('\nFirst 5 stock items AFTER:');
      stockDataAfter.slice(0, 5).forEach(item => {
        console.log(`  id:${item.id} ${item.goods_name}: qty=${item.qty || item.stock_qty || item.quantity}`);
      });
    }

    // Also check the procurement order API for inhouse qty
    console.log('\n=== CHECK PROCUREMENT ORDER API ===');
    const procureOrders = await page.evaluate(async (token) => {
      const response = await fetch('https://nomaderp.pages.dev/adminapi/stock/PurchaseOrder/index?list_rows=20', {
        headers: { 'token': token }
      });
      const data = await response.json();
      return data;
    }, currentToken);

    if (procureOrders.data && procureOrders.data.data) {
      console.log('Procurement orders count:', procureOrders.data.data.length);
      procureOrders.data.data.slice(0, 10).forEach((order, idx) => {
        console.log(`Order[${idx}]: id=${order.id}, no=${order.order_no || order.no}, status=${order.status}, qty=${order.order_qty || order.qty}, inhouse_qty=${order.inhouse_qty || order.in_qty}, fields: ${Object.keys(order).join(',')}`);
      });
    } else {
      console.log('Procurement orders raw:', JSON.stringify(procureOrders).substring(0, 500));
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
  }
})();
