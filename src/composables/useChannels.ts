import { ref } from 'vue'

export interface Channel {
  id: string
  name: string
  emoji: string
  color: string
  desc: string
  type: 'social' | 'video' | 'ecom' | 'local'
  features: string[]
  connected: boolean
  accountName?: string
}

const channels = ref<Channel[]>([
  {
    id: 'wechat_mp', name: '微信公众号', emoji: '📗', color: '#07c160', type: 'social',
    desc: '图文内容发布 + 粉丝运营，品牌私域核心阵地',
    features: ['图文发布', '粉丝管理', '数据统计', '自动回复'],
    connected: false,
  },
  {
    id: 'wechat_video', name: '视频号', emoji: '📹', color: '#07c160', type: 'video',
    desc: '微信生态短视频，与公众号/小店联动',
    features: ['视频发布', '直播推流', '带货联动'],
    connected: false,
  },
  {
    id: 'douyin', name: '抖音号', emoji: '🎵', color: '#161823', type: 'video',
    desc: '抖音短视频主账号，内容分发与涨粉',
    features: ['视频发布', '数据分析', '粉丝互动'],
    connected: false,
  },
  {
    id: 'xhs', name: '小红书', emoji: '📕', color: '#fe2c55', type: 'social',
    desc: '种草笔记 + 店铺联动，女性用户主阵地',
    features: ['笔记发布', '数据分析', '带货链接'],
    connected: false,
  },
  {
    id: 'kuaishou', name: '快手号', emoji: '📱', color: '#ff6600', type: 'video',
    desc: '快手短视频主账号，下沉市场覆盖',
    features: ['视频发布', '直播推流', '粉丝互动'],
    connected: false,
  },
  {
    id: 'weibo', name: '微博', emoji: '🌐', color: '#e6162d', type: 'social',
    desc: '品牌官方微博，热点营销与公关',
    features: ['微博发布', '话题营销', '数据分析'],
    connected: false,
  },
])

export function useChannels() {
  return { channels }
}
