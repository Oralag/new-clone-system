// 粘贴一整段收货信息，拆成 姓名 / 手机 / 省市区 / 详细地址 / 邮编。
// 纯本地规则，不调任何接口。覆盖常见格式：
//   张三 13800000000 内蒙古呼和浩特市赛罕区大学东街1号
//   收货人：张三，手机号码：138-0000-0000，所在地区：广东省 深圳市 南山区，详细地址：科技园xx栋
//   内蒙古自治区包头市昆都仑区钢铁大街2号 李四 15000000000 014000

export interface ParsedAddress {
  name: string
  mobile: string
  region: string
  address: string
  postcode: string
}

const PROVINCES = [
  '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽',
  '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西',
  '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门',
]
const PROVINCE_SUFFIX = '(?:省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区)?'
const PROVINCE_RE = new RegExp(`^(${PROVINCES.join('|')})${PROVINCE_SUFFIX}`)
const ADDRESS_HINT = /[省市区县旗镇乡村路街道巷弄号栋楼室单元小区大厦广场]/
const LABELS = /(收货人|收件人|联系人|姓名|手机号码|手机号|手机|联系电话|电话|所在地区|所在地|地区|详细地址|收货地址|地址|邮政编码|邮编)\s*[:：]?/g

export function parseAddress(raw: string): ParsedAddress {
  const out: ParsedAddress = { name: '', mobile: '', region: '', address: '', postcode: '' }
  let text = String(raw || '').replace(LABELS, ' ').replace(/[【】\[\]()（）]/g, ' ')

  // 手机号：允许中间有空格/横杠，前面可带 +86
  const phone = text.match(/(?:\+?86[\s-]?)?(1[3-9]\d)[\s-]?(\d{4})[\s-]?(\d{4})(?!\d)/)
  if (phone) {
    out.mobile = phone[1] + phone[2] + phone[3]
    text = text.replace(phone[0], ' ')
  }
  // 邮编：独立的 6 位数字
  const post = text.match(/(?:^|[^\d])(\d{6})(?!\d)/)
  if (post) {
    out.postcode = post[1]
    text = text.replace(post[1], ' ')
  }

  const tokens = text.split(/[\s,，;；、|\n\r]+/).map(t => t.trim()).filter(Boolean)
  const addrParts: string[] = []
  for (const t of tokens) {
    const looksLikeName = !out.name && t.length >= 2 && t.length <= 6 && !/\d/.test(t) && !ADDRESS_HINT.test(t) && !PROVINCE_RE.test(t)
    if (looksLikeName) out.name = t
    else addrParts.push(t)
  }
  // 姓名夹在地址里没被空格隔开的情况就留空，让顾客自己填，不乱猜
  let full = addrParts.join('')

  const m = full.match(PROVINCE_RE)
  if (m) {
    const parts = [m[0]]
    full = full.slice(m[0].length)
    const isMunicipality = ['北京', '天津', '上海', '重庆'].includes(m[1])
    if (!isMunicipality) {
      const city = full.match(/^(.{1,10}?(?:自治州|地区|盟|市))/)
      if (city) { parts.push(city[1]); full = full.slice(city[1].length) }
    }
    const district = full.match(/^(.{1,8}?(?:区|县|旗|市))/)
    if (district && full.length > district[1].length) { parts.push(district[1]); full = full.slice(district[1].length) }
    out.region = parts.join(' ')
    out.address = full
  } else {
    out.address = full
  }
  return out
}
