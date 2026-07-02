// GET /api/adam/trade-stats — 查看亚当交易统计
import type { EventContext } from '@cloudflare/workers-types'

interface Env { AGENT_MEMORY: KVNamespace }

export async function onRequest(ctx: EventContext<Env, string, unknown>) {
  const env = ctx.env
  const tKey = 'erpeyJ0IjoiZXlKa'  // 当前唯一用户

  const stats = await env.AGENT_MEMORY.get(`adam:trade_stats:${tKey}`, 'json') as any || {
    total: 0, wins: 0, losses: 0, totalPnl: 0, totalFees: 0
  }
  const trades = await env.AGENT_MEMORY.get(`adam:htx_trades:${tKey}`, 'json') as any[] || []
  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : '0'

  // 当前持仓
  const lastBuy = await env.AGENT_MEMORY.get(`adam:last_auto_buy:${tKey}`, 'json') as any

  // 按信号分类胜率
  const bySignal = stats.bySignal || {}
  const signalStats = Object.entries(bySignal).map(([sig, s]: [string, any]) => ({
    signal: sig,
    total: s.total,
    wins: s.wins,
    win_rate: s.total > 0 ? `${((s.wins / s.total) * 100).toFixed(1)}%` : '0%',
    net_pnl: s.totalPnl.toFixed(4),
  }))

  return new Response(JSON.stringify({
    summary: {
      total_trades: stats.total,
      wins: stats.wins,
      losses: stats.losses,
      win_rate: `${winRate}%`,
      net_pnl_usdt: stats.totalPnl.toFixed(4),
      total_fees_paid: stats.totalFees.toFixed(4),
      last_update: stats.lastUpdate || null,
    },
    by_signal: signalStats,
    current_position: lastBuy ? {
      symbol: lastBuy.symbol,
      bought_at: lastBuy.price,
      amount_usdt: lastBuy.amount_usdt,
      bought_at_ts: new Date(lastBuy.ts).toISOString(),
    } : null,
    recent_trades: trades.slice(-10).map(t => ({
      ts: t.ts,
      side: t.side,
      symbol: t.symbol,
      price: t.price,
      amount_usdt: t.amount_usdt || t.sell_value,
      pnl: t.pnl !== undefined ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(4)}` : null,
      pnl_pct: t.pnl_pct !== undefined ? `${t.pnl_pct.toFixed(2)}%` : null,
      reason: t.reason,
      auto: t.auto,
    })),
  }, null, 2), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}
