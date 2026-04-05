const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      console.log('CONSOLE ERROR:', text);
    }
  });

  try {
    // ====== STEP 1: Login ======
    console.log('=== STEP 1: Navigate and Login ===');
    await page.goto('https://nomaderp.pages.dev', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Page title:', await page.title());

    await page.waitForSelector('input', { timeout: 15000 });
    const inputs = await page.$$('input');
    await inputs[0].fill('17747344571');
    await inputs[1].fill('Oral6421');

    const loginBtn = await page.$('button[type="submit"], button:has-text("登录"), .login-btn');
    if (loginBtn) await loginBtn.click();
    else await page.click('button');

    await page.waitForTimeout(4000);
    console.log('After login URL:', page.url());

    const token = await page.evaluate(() => localStorage.getItem('erp_token'));
    console.log('Token obtained:', token ? `${token.substring(0, 20)}...` : 'NULL - PROBLEM!');
    if (!token) throw new Error('Login failed - no token in localStorage');

    // ====== STEP 2: Navigate to procurement orders ======
    console.log('\n=== STEP 2: Navigate to /procure/order ===');
    await page.goto('https://nomaderp.pages.dev/#/procure/order', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('.el-table__body tr.el-table__row, tbody tr', { timeout: 25000 })
      .catch(() => console.log('Table rows wait timed out, continuing...'));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/ra-step2-procure-list.png' });
    console.log('Screenshot: /tmp/ra-step2-procure-list.png');

    // ====== STEP 3/4: Find 已审核 order — known to be id=502, CG202603318815 ======
    console.log('\n=== STEP 3/4: Locate order 502 (CG202603318815, 已审核) ===');

    // The order is on a later page — filter by status=1 (已审核)
    // Use the status filter dropdown (third .el-select on the page)
    const allSelects = await page.$$('.el-select');
    console.log(`Total .el-select elements: ${allSelects.length}`);

    // Click the status dropdown (it's labeled 状态)
    let statusFilterClicked = false;
    for (let si = 0; si < allSelects.length; si++) {
      const innerText = await allSelects[si].innerText();
      const inputPlaceholder = await allSelects[si].$eval('input', el => el.placeholder || '').catch(() => '');
      console.log(`  Select[${si}]: text="${innerText.trim().substring(0, 30)}" placeholder="${inputPlaceholder}"`);
      if (inputPlaceholder.includes('状态') || innerText.includes('状态')) {
        await allSelects[si].click();
        statusFilterClicked = true;
        console.log(`Clicked status dropdown (Select[${si}])`);
        await page.waitForTimeout(800);
        break;
      }
    }

    if (!statusFilterClicked) {
      // Try the input with placeholder 状态
      const statusInput = await page.$('input[placeholder="状态"], input[placeholder*="状态"]');
      if (statusInput) {
        await statusInput.click();
        statusFilterClicked = true;
        await page.waitForTimeout(800);
      }
    }

    if (statusFilterClicked) {
      await page.screenshot({ path: '/tmp/ra-status-dropdown-open.png' });
      const opts = await page.$$('.el-select-dropdown__item');
      console.log(`Dropdown options visible: ${opts.length}`);
      let selectedYiShenHe = false;
      for (const opt of opts) {
        const t = await opt.innerText();
        console.log(`  Option: "${t.trim()}"`);
        if (t.trim() === '已审核' || t.includes('已审核')) {
          await opt.click();
          selectedYiShenHe = true;
          console.log('Selected 已审核 option');
          await page.waitForTimeout(500);
          break;
        }
      }

      if (!selectedYiShenHe) {
        console.log('Could not find 已审核 option in dropdown');
        await page.keyboard.press('Escape');
      }
    } else {
      console.log('Could not click status dropdown');
    }

    // Click the 查询 button
    const queryBtn = await page.$('button:has-text("查询"), .el-button:has-text("查询")');
    if (queryBtn) {
      await queryBtn.click();
      console.log('Clicked 查询 button');
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: '/tmp/ra-after-filter.png' });
    console.log('Screenshot after filter: /tmp/ra-after-filter.png');

    // Now look for rows
    await page.waitForTimeout(1000);
    let rows = await page.$$('tr.el-table__row, tbody tr');
    console.log(`Rows after filter: ${rows.length}`);
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const t = (await rows[i].innerText()).replace(/\s+/g, ' ').trim().substring(0, 200);
      console.log(`  Row[${i}]: ${t}`);
    }

    let targetRow = null;
    let orderNo = 'CG202603318815';
    let orderId = 502;

    for (let i = 0; i < rows.length; i++) {
      const rowText = await rows[i].innerText();
      if (rowText.includes('已审核') || rowText.includes('CG202603318815')) {
        targetRow = rows[i];
        console.log(`Found target row at index ${i}`);
        const cells = await rows[i].$$('td');
        console.log(`Row has ${cells.length} cells:`);
        for (let j = 0; j < cells.length; j++) {
          const ct = await cells[j].innerText();
          console.log(`  Cell[${j}]: "${ct.trim()}"`);
        }
        break;
      }
    }

    // If still not found, try going to order detail page or search by order number
    if (!targetRow) {
      console.log('Row not found after filter. Trying to search by order no CG202603318815...');
      const orderNoInput = await page.$('input[placeholder*="采购单号"], input[placeholder*="单号"]');
      if (orderNoInput) {
        await orderNoInput.fill('CG202603318815');
        const qBtn = await page.$('button:has-text("查询")');
        if (qBtn) { await qBtn.click(); await page.waitForTimeout(2000); }
      }
      await page.screenshot({ path: '/tmp/ra-order-search.png' });
      rows = await page.$$('tr.el-table__row, tbody tr');
      console.log(`Rows after order no search: ${rows.length}`);
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const t = (await rows[i].innerText()).replace(/\s+/g, ' ').trim().substring(0, 200);
        console.log(`  Row[${i}]: ${t}`);
        if (t.includes('CG202603318815') || t.includes('已审核')) {
          targetRow = rows[i];
          console.log('Found row!');
        }
      }
    }

    if (!targetRow) {
      console.log('WARNING: Could not find target row in UI. Printing page HTML...');
      const tableHtml = await page.$eval('.el-table', el => el.innerHTML).catch(() => 'no table');
      console.log('Table HTML:', tableHtml.substring(0, 1000));
    }

    // ====== STEP 5: Check stock BEFORE via API ======
    console.log('\n=== STEP 5: Check stock BEFORE 反审核 ===');
    const stockBefore = await page.evaluate(async (tok) => {
      const r = await fetch('https://nomaderp.pages.dev/adminapi/stock/StockAll/index?list_rows=200', {
        headers: { 'token': tok }
      });
      return await r.json();
    }, token);

    const stockDataBefore = (stockBefore.data && (stockBefore.data.rows || stockBefore.data.data)) || [];
    const nonZeroBefore = stockDataBefore.filter(item => parseFloat(item.qty || 0) !== 0);

    console.log(`Total stock records: ${stockDataBefore.length}, Non-zero: ${nonZeroBefore.length}`);
    console.log('Non-zero stock BEFORE 反审核:');
    nonZeroBefore.forEach(item => {
      console.log(`  id=${item.id} goods_id=${item.goods_id} "${item.goods_name}": qty=${item.qty}`);
    });

    const stockMapBefore = {};
    stockDataBefore.forEach(item => {
      stockMapBefore[item.id] = { goods_name: item.goods_name || '', goods_id: item.goods_id, qty: parseFloat(item.qty || 0) };
    });

    // ====== STEP 6: Check inhouse records BEFORE ======
    console.log('\n=== STEP 6: Check inhouse records BEFORE ===');

    // Fetch all inhouse records (total is 201, need multiple pages)
    const inhouseResp = await page.evaluate(async (tok) => {
      const r = await fetch('https://nomaderp.pages.dev/adminapi/procure/ProcureInhouse/index?list_rows=500', {
        headers: { 'token': tok }
      });
      return await r.json();
    }, token);

    const allInhouse = (inhouseResp.data && (inhouseResp.data.rows || inhouseResp.data.data)) || [];
    console.log(`Total inhouse records fetched: ${allInhouse.length} (API total: ${inhouseResp.data && inhouseResp.data.total})`);

    const targetInhouseBefore = allInhouse.filter(r => r.purchase_order_id === orderId);
    console.log(`Inhouse records for order id=${orderId}: ${targetInhouseBefore.length}`);

    if (targetInhouseBefore.length === 0) {
      console.log('No inhouse records linked to order 502. Showing all inhouse records (first 5):');
      allInhouse.slice(0, 5).forEach((r, i) => {
        console.log(`  [${i}] id=${r.id}, purchase_order_id=${r.purchase_order_id}, status=${r.status}, order_no=${r.order_no}`);
      });
    } else {
      targetInhouseBefore.forEach((r, i) => {
        const goods = (r.goods_info || []).map(g => `${g.goods_name}x${g.num}`).join(', ');
        console.log(`  [${i}] id=${r.id} status=${r.status} order_no=${r.order_no} goods: ${goods}`);
      });
    }

    const inhouseStatusBefore = {};
    targetInhouseBefore.forEach(r => { inhouseStatusBefore[r.id] = r.status; });

    // ====== STEP 7: Click 反审核 ======
    console.log('\n=== STEP 7: Click 反审核 ===');

    let reverseAuditBtn = null;

    if (targetRow) {
      // Look in the row
      const btnsInRow = await targetRow.$$('button, .el-button, a, span.el-button');
      console.log(`Buttons in target row: ${btnsInRow.length}`);
      for (const btn of btnsInRow) {
        const text = await btn.innerText();
        console.log(`  Btn: "${text.trim()}"`);
        if (text.trim().includes('反审核')) {
          reverseAuditBtn = btn;
          break;
        }
      }
    }

    if (!reverseAuditBtn) {
      // Page-wide search
      const allBtns = await page.$$('button, .el-button');
      console.log(`Page-wide buttons: ${allBtns.length}`);
      for (const btn of allBtns) {
        const text = await btn.innerText().catch(() => '');
        if (text.trim().includes('反审核')) {
          console.log(`Found 反审核 button: "${text.trim()}"`);
          reverseAuditBtn = btn;
          break;
        }
      }
    }

    if (!reverseAuditBtn) {
      console.log('No 反审核 button found. Checking for 批量反审核...');
      const batchReverseBtn = await page.$('button:has-text("批量反审核"), .el-button:has-text("批量反审核")');
      if (batchReverseBtn) {
        console.log('Found 批量反审核 button — need to select row first');
        // Select the target row checkbox
        if (targetRow) {
          const checkbox = await targetRow.$('.el-checkbox, input[type="checkbox"]');
          if (checkbox) {
            await checkbox.click();
            console.log('Checked target row checkbox');
            await page.waitForTimeout(500);
            reverseAuditBtn = batchReverseBtn;
          }
        }
      }
    }

    if (!reverseAuditBtn) {
      await page.screenshot({ path: '/tmp/ra-no-btn.png' });
      // Show what buttons exist
      const allBtnTexts = await page.$$eval('button, .el-button', els =>
        els.map(el => el.innerText.trim()).filter(t => t.length > 0)
      );
      console.log('All button texts:', [...new Set(allBtnTexts)]);
      throw new Error('Cannot find 反审核 button anywhere on the page');
    }

    await reverseAuditBtn.click();
    console.log('Clicked 反审核 button');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/ra-step7-after-click.png' });
    console.log('Screenshot: /tmp/ra-step7-after-click.png');

    // Handle confirmation dialog
    console.log('Checking for confirmation dialog...');
    let dialogFound = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const dialog = await page.$('.el-message-box, .el-dialog[aria-modal="true"], [role="dialog"]');
      if (dialog) {
        const dialogText = await dialog.innerText();
        console.log(`Dialog found (attempt ${attempt+1}): "${dialogText.substring(0, 200)}"`);
        dialogFound = true;

        // Find and click confirm button
        const btns = await page.$$('.el-button--primary');
        let clicked = false;
        for (const b of btns) {
          const vis = await b.isVisible();
          const text = await b.innerText();
          if (vis) {
            console.log(`  Visible primary btn: "${text.trim()}"`);
            if (text.includes('确') || text.includes('是') || text.trim() === 'OK') {
              await b.click();
              console.log(`Clicked confirm: "${text.trim()}"`);
              clicked = true;
              break;
            }
          }
        }
        if (!clicked) {
          // Try any visible confirm-style button
          const confirmBtn = await page.$('button:has-text("确定"), button:has-text("确认"), button:has-text("是")');
          if (confirmBtn) { await confirmBtn.click(); clicked = true; }
        }
        if (clicked) break;
      }
      await page.waitForTimeout(500);
    }

    if (!dialogFound) {
      console.log('No dialog appeared. Checking for toast...');
      await page.waitForTimeout(500);
      const toast = await page.$('.el-message, .el-notification');
      if (toast) console.log('Toast:', await toast.innerText());
      await page.screenshot({ path: '/tmp/ra-no-dialog.png' });
    }

    // ====== STEP 8: Wait 8 seconds ======
    console.log('\n=== STEP 8: Waiting 8 seconds for API calls to complete ===');
    await page.waitForTimeout(8000);
    console.log('8 second wait complete');
    await page.screenshot({ path: '/tmp/ra-step8-after-wait.png' });

    // Check for notifications
    const notifications = await page.$$('.el-message, .el-notification');
    for (const n of notifications) {
      const vis = await n.isVisible();
      if (vis) console.log('Notification:', (await n.innerText()).substring(0, 100));
    }

    // ====== STEP 9: Check stock AFTER ======
    console.log('\n=== STEP 9: Check stock AFTER 反审核 ===');
    const stockAfter = await page.evaluate(async (tok) => {
      const r = await fetch('https://nomaderp.pages.dev/adminapi/stock/StockAll/index?list_rows=200', {
        headers: { 'token': tok }
      });
      return await r.json();
    }, token);

    const stockDataAfter = (stockAfter.data && (stockAfter.data.rows || stockAfter.data.data)) || [];
    const nonZeroAfter = stockDataAfter.filter(item => parseFloat(item.qty || 0) !== 0);

    console.log(`Non-zero stock AFTER 反审核: ${nonZeroAfter.length}`);
    nonZeroAfter.forEach(item => {
      console.log(`  id=${item.id} goods_id=${item.goods_id} "${item.goods_name}": qty=${item.qty}`);
    });

    const stockMapAfter = {};
    stockDataAfter.forEach(item => {
      stockMapAfter[item.id] = { goods_name: item.goods_name || '', goods_id: item.goods_id, qty: parseFloat(item.qty || 0) };
    });

    // Compare
    console.log('\n--- STOCK COMPARISON ---');
    const stockChanges = [];
    const allIds = new Set([...Object.keys(stockMapBefore), ...Object.keys(stockMapAfter)]);
    for (const id of allIds) {
      const before = stockMapBefore[id];
      const after = stockMapAfter[id];
      if (!before && after && after.qty !== 0) {
        console.log(`NEW: id=${id} "${after.goods_name}" qty: 0 → ${after.qty}`);
        stockChanges.push({ id, type: 'new', goods_name: after.goods_name, before: 0, after: after.qty });
      } else if (before && after && before.qty !== after.qty) {
        const diff = after.qty - before.qty;
        console.log(`CHANGED: id=${id} "${before.goods_name}" qty: ${before.qty} → ${after.qty} (diff: ${diff > 0 ? '+' : ''}${diff})`);
        stockChanges.push({ id, type: 'changed', goods_name: before.goods_name, before: before.qty, after: after.qty, diff });
      } else if (before && !after && before.qty !== 0) {
        console.log(`REMOVED: id=${id} "${before.goods_name}" qty: ${before.qty} → (removed)`);
        stockChanges.push({ id, type: 'removed', goods_name: before.goods_name, before: before.qty, after: 0 });
      }
    }
    if (stockChanges.length === 0) console.log('NO STOCK CHANGES DETECTED');

    // ====== STEP 10: Check inhouse records AFTER ======
    console.log('\n=== STEP 10: Check inhouse records AFTER ===');
    const inhouseAfterResp = await page.evaluate(async (tok) => {
      const r = await fetch('https://nomaderp.pages.dev/adminapi/procure/ProcureInhouse/index?list_rows=500', {
        headers: { 'token': tok }
      });
      return await r.json();
    }, token);

    const allInhouseAfter = (inhouseAfterResp.data && (inhouseAfterResp.data.rows || inhouseAfterResp.data.data)) || [];
    const targetInhouseAfter = allInhouseAfter.filter(r => r.purchase_order_id === orderId);

    console.log(`Inhouse records for order ${orderId} AFTER: ${targetInhouseAfter.length}`);
    const inhouseStatusAfter = {};
    targetInhouseAfter.forEach(r => { inhouseStatusAfter[r.id] = r.status; });

    // Check order status after reverse audit
    console.log('\n--- ORDER STATUS AFTER ---');
    const orderAfterResp = await page.evaluate(async (tok) => {
      const r = await fetch('https://nomaderp.pages.dev/adminapi/stock/PurchaseOrder/index?list_rows=500', {
        headers: { 'token': tok }
      });
      return await r.json();
    }, token);

    const ordersAfter = (orderAfterResp.data && (orderAfterResp.data.rows || orderAfterResp.data.data)) || [];
    const orderAfter = ordersAfter.find(o => o.id === orderId);
    if (orderAfter) {
      const statusLabel = orderAfter.status === 0 ? '待审核(0)' : orderAfter.status === 1 ? '已审核(1)' : `status=${orderAfter.status}`;
      console.log(`Order ${orderId} status: ${statusLabel}`);
      console.log(`Order ${orderId} inhouse_qty after: ${orderAfter.inhouse_qty || 'N/A'}`);
    }

    // Reload UI and check table
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const rowsAfter = await page.$$('tr.el-table__row, tbody tr');
    console.log(`\nUI table rows after reload: ${rowsAfter.length}`);
    for (let i = 0; i < Math.min(rowsAfter.length, 5); i++) {
      const t = (await rowsAfter[i].innerText()).replace(/\s+/g, ' ').trim().substring(0, 200);
      console.log(`  Row[${i}]: ${t}`);
    }

    // ====== FINAL SUMMARY ======
    console.log('\n========== FINAL SUMMARY ==========');
    console.log(`Target Order: id=${orderId}, no=${orderNo}`);
    console.log(`Goods involved: ${(order502GoodsInfo || []).map(g => `${g.goods_name}x${g.num}`).join(', ')}`);
    console.log(`Order status after 反审核: ${orderAfter ? (orderAfter.status === 0 ? '待审核(0) — REVERTED' : `still ${orderAfter.status}`) : 'unknown'}`);
    console.log(`\nStock Changes (${stockChanges.length} total):`);
    if (stockChanges.length === 0) {
      console.log('  None — stock was NOT reduced by 反审核');
    } else {
      stockChanges.forEach(c => console.log(`  "${c.goods_name}": ${c.before} → ${c.after}`));
    }
    console.log(`\nInhouse Records for order ${orderId}:`);
    console.log(`  Before: ${Object.keys(inhouseStatusBefore).length} records`);
    if (Object.keys(inhouseStatusBefore).length > 0) {
      Object.entries(inhouseStatusBefore).forEach(([id, s]) => {
        const afterS = inhouseStatusAfter[id];
        console.log(`  id=${id}: status ${s} → ${afterS !== undefined ? afterS : 'MISSING'}`);
      });
    } else {
      console.log('  No inhouse records linked to this order (inhouse_qty may not be tracked here)');
    }
    console.log(`\nConsole errors: ${consoleErrors.length}`);
    consoleErrors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 120)}`));
    console.log('====================================');

  } catch (error) {
    console.error('\nFATAL ERROR:', error.message);
    await page.screenshot({ path: '/tmp/ra-fatal-error.png' });
    console.error('Screenshot: /tmp/ra-fatal-error.png');
  } finally {
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
  }
})();

// Reference data (filled from pre-run API check)
const order502GoodsInfo = [
  { goods_name: '专袋/奶条', goods_id: 1033, num: 51 },
  { goods_name: '专袋/奶条', goods_id: 1033, num: 84 },
  { goods_name: '专袋/奶条', goods_id: 1033, num: 2 },
  { goods_name: '专袋/奶条', goods_id: 1033, num: 48 }
];
