// 广告部门定时任务执行器 — 每30分钟检查一次到期任务
// 部署：cd workers/ad-dept-cron && npx wrangler deploy
export default {
  async scheduled(event, env, ctx) {
    const res = await fetch('https://nomaderp.pages.dev/api/scheduled-run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': env.CRON_SECRET || 'nomad-cron-2026',
      },
    })
    const data = await res.json()
    console.log('[Ad Dept Cron]', JSON.stringify(data))
  },

  // 手动触发（GET /）方便测试
  async fetch(request, env, ctx) {
    if (request.method === 'GET') {
      const res = await fetch('https://nomaderp.pages.dev/api/scheduled-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': env.CRON_SECRET || 'nomad-cron-2026',
        },
      })
      return res
    }
    return new Response('Ad Dept Cron Worker', { status: 200 })
  },
}
