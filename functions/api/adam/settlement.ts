// GET /api/adam/settlement — 分红/赔付账本汇总
import type { EventContext } from '@cloudflare/workers-types'
interface Env { AGENT_MEMORY: KVNamespace }

export async function onRequest(ctx: EventContext<Env, string, unknown>) {
  const env = ctx.env
  const tKey = 'erpeyJ0IjoiZXlKa'
  const ledger = (await env.AGENT_MEMORY.get(`adam:settlement_ledger:${tKey}`, 'json') as any[] | null) || []
  const adamState = await env.AGENT_MEMORY.get(`adam:core:${tKey}`, 'json') as any || {}

  // 汇总
  let totalDividendOwed = 0  // 亚当欠你（未结）— 等亏损时抵扣或主动结算
  let totalCompensationOwed = 0
  for (const e of ledger) {
    if (e.type === 'dividend' && e.side === 'user_owed') totalDividendOwed += e.user_share || 0
    if (e.type === 'compensation' && e.side === 'adam_owes') totalCompensationOwed += e.compensation || 0
  }
  const netOwedToUser = totalDividendOwed + totalCompensationOwed

  // 等级 → 限额映射（前端展示用）
  const limits: Record<string, { maxTradeUsdt: number; dividendRatio: number }> = {
    'C':  { maxTradeUsdt: 1,  dividendRatio: 0.10 },
    'B':  { maxTradeUsdt: 3,  dividendRatio: 0.20 },
    'B+': { maxTradeUsdt: 5,  dividendRatio: 0.30 },
    'A':  { maxTradeUsdt: 10, dividendRatio: 0.40 },
    'S':  { maxTradeUsdt: 20, dividendRatio: 0.50 },
  }
  const cur = adamState.creditLevel || 'C'

  return new Response(JSON.stringify({
    credit: {
      level: cur,
      max_trade_usdt: limits[cur]?.maxTradeUsdt || 1,
      dividend_ratio: limits[cur]?.dividendRatio || 0.1,
      all_levels: limits,
    },
    settlement_summary: {
      total_dividend_owed: totalDividendOwed.toFixed(6),
      total_compensation_owed: totalCompensationOwed.toFixed(6),
      net_owed_to_user: netOwedToUser.toFixed(6),
      entries_count: ledger.length,
    },
    recent_entries: ledger.slice(-15).reverse(),
  }, null, 2), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}
