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
  {
    id: 'bilibili', name: '哔哩哔哩', emoji: '📺', color: '#00a1d6', type: 'video',
    desc: 'Z世代长中视频阵地，专业内容社区',
    features: ['视频发布', '专栏发布', '弹幕互动'],
    connected: false,
  },
  {
    id: 'zhihu', name: '知乎', emoji: '💡', color: '#0084ff', type: 'social',
    desc: '专业问答与长内容，知识付费转化',
    features: ['文章发布', '问题回答', '想法发布'],
    connected: false,
  },
  // ── 国际平台 ──
  {
    id: 'tiktok', name: 'TikTok', emoji: '🎶', color: '#000000', type: 'video',
    desc: '国际版抖音，全球短视频流量池',
    features: ['视频发布', '数据分析', '跨境种草'],
    connected: false,
  },
  {
    id: 'youtube', name: 'YouTube', emoji: '📹', color: '#ff0000', type: 'video',
    desc: '全球最大视频平台，长视频 + Shorts',
    features: ['视频发布', 'Shorts发布', '直播推流'],
    connected: false,
  },
  {
    id: 'instagram', name: 'Instagram', emoji: '📷', color: '#e4405f', type: 'social',
    desc: 'Meta 旗下视觉社交，Reels/Stories/Feed',
    features: ['图文发布', 'Reels发布', 'Stories'],
    connected: false,
  },
  {
    id: 'facebook', name: 'Facebook', emoji: '👥', color: '#1877f2', type: 'social',
    desc: '全球最大社交网络，Page + Group 运营',
    features: ['帖子发布', '视频发布', '群组管理'],
    connected: false,
  },
  {
    id: 'threads', name: 'Threads', emoji: '🧵', color: '#000000', type: 'social',
    desc: 'Meta 的 Twitter 竞品，文字优先社交',
    features: ['文字发布', '图文发布', '话题参与'],
    connected: false,
  },
  {
    id: 'twitter', name: 'X (Twitter)', emoji: '𝕏', color: '#000000', type: 'social',
    desc: '短文实时社交，全球公关与新闻',
    features: ['推文发布', '话题营销', '实时互动'],
    connected: false,
  },
  {
    id: 'pinterest', name: 'Pinterest', emoji: '📌', color: '#e60023', type: 'social',
    desc: '视觉发现引擎，长效流量与灵感种草',
    features: ['图片发布', 'Board 管理', 'Pins 数据'],
    connected: false,
  },
  {
    id: 'linkedin', name: 'LinkedIn', emoji: '💼', color: '#0a66c2', type: 'social',
    desc: '全球职场社交，B2B 品牌与人才营销',
    features: ['文章发布', '动态发布', '公司页运营'],
    connected: false,
  },
])

export function useChannels() {
  return { channels }
}
