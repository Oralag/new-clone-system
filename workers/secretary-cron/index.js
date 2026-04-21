export default {
  async scheduled(event, env, ctx) {
    const res = await fetch('https://nomaderp.pages.dev/adminapi/work/followup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': env.CRON_SECRET || 'nomad-cron-2026',
      },
    })
    const data = await res.json()
    console.log('[Secretary Cron]', JSON.stringify(data))
  },

  // 也支持手动触发（GET /）
  async fetch(request, env, ctx) {
    if (request.method === 'GET') {
      const res = await fetch('https://nomaderp.pages.dev/adminapi/work/followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': env.CRON_SECRET || 'nomad-cron-2026',
        },
      })
      return res
    }
    return new Response('Secretary Cron Worker', { status: 200 })
  }
}
