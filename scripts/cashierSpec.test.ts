import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSpecCartLine, withHostSpecOption } from '../src/utils/cashierSpec.ts'

const naipiHost = {
  id: 969,
  goods_name: '小/奶皮',
  goods_sn: 'SP0000065',
  unit_name: '张',
  sell_price: '15.00',
  cost_price: '10.00',
  member_price: '12.00',
}

const naipiSpec = {
  attrs: [{ name: '大', values: ['大奶皮'] }],
  skus: {
    大奶皮: { sku_sn: '', barcode: '', goods_id: 968, sell_price: 20, cost_price: 13 },
  },
}

test('小/奶皮补上本商品规格，并保留大奶皮的价格', () => {
  const model = withHostSpecOption(naipiHost, naipiSpec)
  assert.equal(model.bindLinkedGoods, true)
  assert.deepEqual(model.attrs, [{ name: '规格', values: ['小奶皮', '大奶皮'] }])
  assert.equal(model.skus['小奶皮'].sell_price, 15)
  assert.equal(model.skus['小奶皮'].cost_price, 10)
  assert.equal(model.skus['小奶皮'].goods_id, 969)
  assert.equal(model.skus['大奶皮'].sell_price, 20)
  assert.equal(model.skus['大奶皮'].goods_id, 968)
})

test('选小奶皮按本商品 ¥15 入车，选大奶皮按对应商品 ¥20 入车', () => {
  const model = withHostSpecOption(naipiHost, naipiSpec)
  const small = resolveSpecCartLine({
    host: naipiHost,
    specLabel: '小奶皮',
    sku: model.skus['小奶皮'],
    memberSelected: false,
    useLinkedIdentity: true,
  })
  assert.deepEqual(small, {
    goods_id: 969,
    goods_name: '小/奶皮',
    goods_sn: 'SP0000065',
    unit_name: '张',
    price: 15,
    cost_price: 10,
  })

  const large = resolveSpecCartLine({
    host: naipiHost,
    specLabel: '大奶皮',
    sku: model.skus['大奶皮'],
    linkedGoods: {
      id: 968,
      goods_name: '大/奶皮',
      goods_sn: 'SP0000066',
      unit_name: '张',
      sell_price: 20,
      cost_price: 13,
    },
    useLinkedIdentity: true,
  })
  assert.equal(large.goods_id, 968)
  assert.equal(large.goods_name, '大/奶皮')
  assert.equal(large.goods_sn, 'SP0000066')
  assert.equal(large.price, 20)
  assert.equal(large.cost_price, 13)
})

test('会员价只作用在补上的本商品规格', () => {
  const model = withHostSpecOption(naipiHost, naipiSpec)
  const small = resolveSpecCartLine({
    host: naipiHost,
    specLabel: '小奶皮',
    sku: model.skus['小奶皮'],
    memberSelected: true,
    useLinkedIdentity: true,
  })
  assert.equal(small.price, 12)
})

test('已经包含本商品的规格不再追加', () => {
  const friedRice = withHostSpecOption(
    { id: 923, goods_name: '海丰炒米/散装/硬口/', sell_price: 7.5, cost_price: 4.8 },
    {
      attrs: [{ name: '规格', values: ['散装（称重）', '袋装500克'] }],
      skus: {
        '散装（称重）': { goods_id: 923, sell_price: 7.5, cost_price: 4.8 },
        '袋装500克': { goods_id: 932, sell_price: 7.5, cost_price: 5.5 },
      },
    },
  )
  assert.equal(friedRice.bindLinkedGoods, false)
  assert.deepEqual(friedRice.attrs[0].values, ['散装（称重）', '袋装500克'])

  const mooncake = withHostSpecOption(
    { id: 3213, goods_name: '阿润月饼', sell_price: 6, cost_price: 5 },
    {
      attrs: [{ name: '规格', values: ['阿润月饼/单颗装', '4颗/350克'] }],
      skus: {
        '阿润月饼/单颗装': { goods_id: 0, sell_price: 6, cost_price: 5 },
        '4颗/350克': { goods_id: 883, sell_price: 15, cost_price: 10 },
      },
    },
  )
  assert.equal(mooncake.bindLinkedGoods, false)
  assert.deepEqual(mooncake.attrs[0].values, ['阿润月饼/单颗装', '4颗/350克'])
  assert.equal(mooncake.skus['4颗/350克'].sell_price, 15)

  const flavors = withHostSpecOption(
    { id: 3121, goods_name: '科尔沁奶豆腐/条/片/原/甜', sell_price: 80, cost_price: 38 },
    {
      attrs: [{ name: '口味', values: ['甜味', '原味'] }],
      skus: {
        甜味: { goods_id: 0, sell_price: 80, cost_price: 38 },
        原味: { goods_id: 0, sell_price: 80, cost_price: 38 },
      },
    },
  )
  assert.equal(flavors.bindLinkedGoods, false)
  assert.deepEqual(flavors.attrs[0].values, ['甜味', '原味'])
})

test('未挂其他商品的规格保持原样，加购仍走本商品', () => {
  const model = withHostSpecOption(
    { id: 3094, goods_name: '科尔沁糖（酸奶/嚼口/乌日末', sell_price: 25, cost_price: 14.76, goods_sn: 'SN3094', unit_name: '斤' },
    {
      attrs: [{ name: '口味', values: ['混合', '酸奶炒米糖'] }],
      skus: {
        混合: { goods_id: 3094, sell_price: 25, cost_price: 12.43 },
        酸奶炒米糖: { goods_id: 3094, sell_price: 20, cost_price: 10 },
      },
    },
  )
  assert.equal(model.bindLinkedGoods, false)
  const line = resolveSpecCartLine({
    host: { id: 3094, goods_name: '科尔沁糖（酸奶/嚼口/乌日末', goods_sn: 'SN3094', unit_name: '斤', sell_price: 25 },
    specLabel: '酸奶炒米糖',
    sku: model.skus['酸奶炒米糖'],
    useLinkedIdentity: false,
  })
  assert.equal(line.goods_id, 3094)
  assert.equal(line.goods_name, '科尔沁糖（酸奶/嚼口/乌日末 · 酸奶炒米糖')
  assert.equal(line.price, 20)
  assert.equal(line.goods_sn, 'SN3094')
})

test('多维规格不注入本商品', () => {
  const model = withHostSpecOption(
    { id: 2, goods_name: '礼盒', sell_price: 30 },
    {
      attrs: [
        { name: '尺寸', values: ['大'] },
        { name: '口味', values: ['原味'] },
      ],
      skus: { '大|原味': { goods_id: 9, sell_price: 30 } },
    },
  )
  assert.equal(model.bindLinkedGoods, false)
  assert.equal(model.attrs.length, 2)
  assert.equal(model.skus['礼盒'], undefined)
})

test('规格值里的斜杠保持原样，不拆成多个选项', () => {
  const model = withHostSpecOption(
    { id: 3213, goods_name: '阿润月饼', sell_price: 6 },
    {
      attrs: [{ name: '规格', values: ['4颗/350克', '4颗/350克2'] }],
      skus: {
        '4颗/350克': { goods_id: 0, sell_price: 15 },
        '4颗/350克2': { goods_id: 882, sell_price: 15 },
      },
    },
  )
  assert.deepEqual(model.attrs[0].values, ['4颗/350克', '4颗/350克2'])
})
