interface Env {
  CRON_SECRET: string
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      fetch('https://nomaderp.pages.dev/api/adam/cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cron-Secret': env.CRON_SECRET,
        },
      })
    )
  },
}
