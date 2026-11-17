import assert from 'node:assert/strict'
import test from 'node:test'
import {
  allocateMultiSupplierPayments,
  collectPurchaseGoodsPayments,
  fundNamesForOrder,
  paidAmountForOrder,
} from '../src/utils/purchasePayment.ts'

const orders = [
  { id: 686, order_no: 'PO2026111713160528087', order_sn: 'PO2026111713160528087', supplier_name: '科尔沁奶食品', status: 1, total_amount: 44, after_discount: 44, pay_amount: 0, fund_name: '' },
  { id: 687, order_no: 'PO2026111713220627966', order_sn: 'PO2026111713220627966', supplier_name: '科尔沁奶食品', status: 1, total_amount: 12, after_discount: 12, pay_amount: 0, fund_name: '' },
  { id: 688, order_no: 'PO2026111713245438867', order_sn: 'PO2026111713245438867', supplier_name: '科尔沁奶食品', status: 1, total_amount: 12, after_discount: 12, pay_amount: 0, fund_name: '' },
]

function view(receipts: any[], order: any, extraOrders: any[] = orders) {
  const collected = collectPurchaseGoodsPayments(receipts)
  allocateMultiSupplierPayments(collected.state, extraOrders, collected.multiReceipts)
  return {
    paid: paidAmountForOrder(collected.state, order),
    funds: fundNamesForOrder(collected.state, order).join('、'),
  }
}

test('列表付款后详情与列表看到同一笔 44 元和公司支出账户，不读采购单 pay_amount', () => {
  const first = view([
    { id: 917, order_sn: 'PO2026111713160528087', contact_name: '科尔沁奶食品', amount: '44.00', fund_name: '公司支出账户', remark: 'Purchase Order Payment #686' },
    { id: 918, order_sn: 'PO2026111713220627966', contact_name: '科尔沁奶食品', amount: '12.00', fund_name: '公司支出账户', remark: 'Purchase Order Payment #687' },
    { id: 919, order_sn: 'PO2026111713245438867', contact_name: '科尔沁奶食品', amount: '12.00', fund_name: '公司支出账户', remark: 'Purchase Order Payment #688' },
  ], orders[0])
  assert.equal(first.paid, 44)
  assert.equal(first.funds, '公司支出账户')
  assert.equal(view([], orders[1]).paid, 0)
  assert.equal(view([
    { amount: 12, fund_name: '公司支出账户', remark: 'Purchase Order Payment #687', order_sn: orders[1].order_sn },
  ], orders[1]).paid, 12)
})

test('未付款时已付为 0、账户为空，即使采购单上填过账户也不当成已付款', () => {
  const shown = view([], { ...orders[0], pay_amount: 44, fund_name: '公司支出账户', pay_account: '公司支出账户' })
  assert.equal(shown.paid, 0)
  assert.equal(shown.funds, '')
})

test('审核时付款和之后追加付款都计入，同一账户只显示一次', () => {
  const shown = view([
    { amount: 20, fund_name: '公司支出账户', remark: '采购单付款 #686', order_sn: orders[0].order_sn },
    { amount: 24, fund_name: '公司支出账户', remark: 'Purchase Order Payment #686', order_sn: orders[0].order_sn },
  ], orders[0])
  assert.equal(shown.paid, 44)
  assert.equal(shown.funds, '公司支出账户')
})

test('分次付款且资金账户不同时，金额相加、账户都保留', () => {
  const shown = view([
    { amount: 20, fund_name: '公司支出账户', remark: 'Purchase Order Payment #686' },
    { amount: 10, fund_name: '现金', remark: '采购单付款 #686' },
  ], orders[0])
  assert.equal(shown.paid, 30)
  assert.equal(shown.funds, '公司支出账户、现金')
})

test('同一张付款单即使备注、order_id、单号都能对上，也只累计一次', () => {
  const receipt = {
    amount: 44,
    order_id: 686,
    order_sn: 'PO2026111713160528087',
    contact_name: '科尔沁奶食品',
    fund_name: '公司支出账户',
    remark: 'Purchase Order Payment #686 采购单PO2026111713160528087审核自动生成',
  }
  const shown = view([receipt], orders[0])
  assert.equal(shown.paid, 44)
  assert.equal(shown.funds, '公司支出账户')
})

test('审核自动生成的付款按单号计入，不再因为单号兜底加第二次', () => {
  const shown = view([{
    amount: 44,
    order_sn: 'PO2026111713160528087',
    contact_name: '科尔沁奶食品',
    fund_name: '公司支出账户',
    remark: '采购单PO2026111713160528087审核自动生成',
  }], orders[0])
  assert.equal(shown.paid, 44)
})

test('单据支出、运费、附加费不计入货款', () => {
  const shown = view([
    { amount: 9, fund_name: '公司支出账户', remark: '采购单据支出 #686' },
    { amount: 3, fund_name: '现金', remark: '采购运费 #686' },
    { amount: 2, fund_name: '现金', remark: '采购附加费用 #686:freight' },
    { amount: 1, fund_name: '现金', remark: 'Purchase Addon Fee #686' },
  ], orders[0])
  assert.equal(shown.paid, 0)
  assert.equal(shown.funds, '')
})

test('一条付款备注点名多张单时，按未付拆开且不重复整笔计入', () => {
  const shownFirst = view([{
    amount: 56,
    contact_name: '科尔沁奶食品',
    fund_name: '公司支出账户',
    remark: 'Purchase Order Payment #686 Purchase Order Payment #687',
  }], orders[0])
  const shownSecond = view([{
    amount: 56,
    contact_name: '科尔沁奶食品',
    fund_name: '公司支出账户',
    remark: 'Purchase Order Payment #686 Purchase Order Payment #687',
  }], orders[1])
  assert.equal(shownFirst.paid, 44)
  assert.equal(shownSecond.paid, 12)
  assert.equal(shownFirst.funds, '公司支出账户')
})
