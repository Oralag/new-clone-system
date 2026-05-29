import { ref } from 'vue'

export interface Platform {
  id: string
  name: string
  emoji: string
  color: string
  desc: string
  features: string[]
  connected: boolean
  shopName?: string
}

// Module-level ref — shared across all components that import this
const platforms = ref<Platform[]>([
  {
    id: 'taobao', name: '淘宝天猫', emoji: '🛍', color: '#ff5000',
    desc: '淘宝 + 天猫旗舰店统一接入',
    features: ['订单同步', '库存推送', '退款处理', '物流查询'],
    connected: false,
  },
  {
    id: 'jd', name: '京东', emoji: '🏪', color: '#e2231a',
    desc: '京东自营 / POP 店铺',
    features: ['订单同步', '库存推送', '售后处理'],
    connected: false,
  },
  {
    id: 'pdd', name: '拼多多', emoji: '🛒', color: '#e02020',
    desc: '拼多多店铺，支持商城和直播',
    features: ['订单同步', '库存推送', '退款处理'],
    connected: false,
  },
  {
    id: 'douyin', name: '抖音小店', emoji: '🎵', color: '#161823',
    desc: '抖音小店 + 直播带货订单',
    features: ['订单同步', '库存推送', '直播订单'],
    connected: false,
  },
  {
    id: 'kuaishou', name: '快手小店', emoji: '📱', color: '#ff6600',
    desc: '快手小店 + 快手直播带货',
    features: ['订单同步', '库存推送', '直播订单'],
    connected: false,
  },
  {
    id: 'wxd', name: '微信小店', emoji: '💬', color: '#07c160',
    desc: '微信小店 + 视频号带货',
    features: ['订单同步', '库存推送', '视频号带货'],
    connected: false,
  },
  {
    id: 'meituan', name: '美团外卖', emoji: '🍱', color: '#ffb800',
    desc: '美团外卖 + 美团团购',
    features: ['订单同步', '菜单管理', '评价监控'],
    connected: false,
  },
  {
    id: 'eleme', name: '饿了么', emoji: '🥡', color: '#0099ff',
    desc: '饿了么 + 口碑平台',
    features: ['订单同步', '菜单管理', '评价监控'],
    connected: false,
  },
  {
    id: 'xhs', name: '小红书', emoji: '📕', color: '#fe2c55',
    desc: '小红书店铺 + 笔记带货',
    features: ['订单同步', '库存推送', '笔记带货'],
    connected: false,
  },
  {
    id: 'alibaba_intl', name: '阿里巴巴国际站', emoji: '🌐', color: '#ff6a00',
    desc: 'Alibaba.com — B2B 跨境贸易平台',
    features: ['订单同步', '询盘管理', '库存推送', '跨境物流'],
    connected: false,
  },
])

export function usePlatforms() {
  return { platforms }
}
