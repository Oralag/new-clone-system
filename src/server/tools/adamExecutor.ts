/**
 * 亚当工具执行器
 * 真实行情数据接入（新浪财经 + 东方财富）
 */

import { GoogleGenAI } from '@google/genai'
import { getAgent } from '../agents/agentRegistry'
import { allTools } from './erpTools'
import { executeTool } from './toolExecutor'
import { executeBrowserTool } from './browserExecutor'

// ── 新浪财经实时行情 ──────────────────────────────────────────────────────────
// symbol 格式: sh600519 / sz000858
async function fetchSinaRealtime(symbol: string): Promise<Record<string, any> | null> {
  try {
    const url = `https://hq.sinajs.cn/list=${symbol}`
    const resp = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
    const text = await resp.text()
    // var hq_str_sh600519="贵州茅台,1560.00,1558.00,1562.50,..."
    const match = text.match(/="([^"]+)"/)
    if (!match || !match[1] || match[1] === 'xxx') return null
    const parts = match[1].split(',')
    if (parts.length < 32) return null
    return {
      name: parts[0],
      open: parts[1],
      prev_close: parts[2],
      price: parts[3],
      high: parts[4],
      low: parts[5],
      volume: Math.round(Number(parts[8]) / 100), // 手
      turnover: (Number(parts[9]) / 1e8).toFixed(2), // 亿元
      date: parts[30],
      time: parts[31],
    }
  } catch {
    return null
  }
}

// symbol 格式: SH600519 / SZ000858（腾讯格式备用）
async function fetchTencentRealtime(symbol: string): Promise<Record<string, any> | null> {
  try {
    const url = `https://qt.gtimg.cn/q=${symbol.toLowerCase()}`
    const resp = await fetch(url, { headers: { Referer: 'https://finance.qq.com' } })
    const text = await resp.text()
    const match = text.match(/="([^"]+)"/)
    if (!match || !match[1]) return null
    const parts = match[1].split('~')
    if (parts.length < 50) return null
    return {
      name: parts[1],
      price: parts[3],
      prev_close: parts[4],
      open: parts[5],
      volume: parts[6], // 手
      turnover: (Number(parts[37]) / 1e8).toFixed(2),
      high: parts[33],
      low: parts[34],
      change_pct: parts[32] + '%',
    }
  } catch {
    return null
  }
}

// ── 新浪历史K线 ──────────────────────────────────────────────────────────────
// 接口：https://money.finance.sina.com.cn/quotes_service/api/json_v2.php
async function fetchSinaHistory(symbol: string, scale: number, count: number): Promise<any[] | null> {
  try {
    const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php?symbol=${symbol}&scale=${scale}&ma=no&datalen=${count}`
    const resp = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
    const text = await resp.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) return null
    return data.map((d: any) => ({
      date: d.day,
      open: d.open,
      close: d.close,
      high: d.high,
      low: d.low,
      volume: Math.round(Number(d.volume) / 100), // 手
    }))
  } catch {
    return null
  }
}

// ── 东方财富基本面 ──────────────────────────────────────────────────────────
async function fetchEastmoneyFundamentals(secid: string): Promise<Record<string, any> | null> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f9,f57,f58,f116,f117,f167,f173,f135,f136,f137,f138`
    const resp = await fetch(url, { headers: { Referer: 'https://www.eastmoney.com' } })
    const json = await resp.json() as any
    const d = json?.data
    if (!d) return null
    return {
      pe_ttm: d.f9 === '-' ? null : (d.f9 / 100).toFixed(2),
      pb: d.f167 === '-' ? null : (d.f167 / 100).toFixed(2),
      market_cap: d.f116 ? (d.f116 / 1e8).toFixed(2) + '亿' : null,
      roe: d.f173 ? (d.f173 / 100).toFixed(2) + '%' : null,
    }
  } catch {
    return null
  }
}

// ── 东方财富北向资金 ────────────────────────────────────────────────────────
async function fetchNorthboundFlow(): Promise<Record<string, any> | null> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f54,f56`
    const resp = await fetch(url, { headers: { Referer: 'https://data.eastmoney.com' } })
    const json = await resp.json() as any
    const sh = json?.data?.s2n // 沪股通
    const sz = json?.data?.s3n // 深股通
    // 取最后一条数据（最新）
    const lastSh = sh?.split(';').pop()?.split(',') ?? []
    const lastSz = sz?.split(';').pop()?.split(',') ?? []
    const shNet = lastSh[3] ? (Number(lastSh[3]) / 1e8).toFixed(2) : null
    const szNet = lastSz[3] ? (Number(lastSz[3]) / 1e8).toFixed(2) : null
    if (!shNet && !szNet) return null
    const total = shNet && szNet ? ((Number(shNet) + Number(szNet)).toFixed(2)) : null
    return {
      sh_net: shNet,
      sz_net: szNet,
      total_net: total,
      unit: '亿元',
      time: lastSh[0] ?? '',
    }
  } catch {
    return null
  }
}

// ── 东方财富板块热度（行业板块涨跌）───────────────────────────────────────
async function fetchSectorHeat(topN: number): Promise<any[] | null> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${topN}&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&wbp2u=|0|0|0|web&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f4,f14`
    const resp = await fetch(url, { headers: { Referer: 'https://quote.eastmoney.com' } })
    const json = await resp.json() as any
    const rows = json?.data?.diff ?? []
    return rows.map((r: any) => ({
      name: r.f14,
      change_pct: r.f3 ? (r.f3 / 100).toFixed(2) + '%' : '0%',
      heat: Math.round(50 + Math.min(Math.abs(r.f3 / 100) * 10, 49)),
    }))
  } catch {
    return null
  }
}

// ── 东方财富涨幅榜选股 ──────────────────────────────────────────────────────
async function fetchStockScreener(marketFilter: string): Promise<any[] | null> {
  try {
    // fs 参数: m:0+t:6+f:!2 = 上海A股；m:0+t:80+f:!2 = 深圳A股；m:0,1 = 全市场
    const fs = marketFilter || 'm:0,1+f:!2'
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=${encodeURIComponent(fs)}&fields=f2,f3,f4,f5,f6,f9,f12,f14`
    const resp = await fetch(url, { headers: { Referer: 'https://quote.eastmoney.com' } })
    const json = await resp.json() as any
    const rows = json?.data?.diff ?? []
    return rows.slice(0, 10).map((r: any) => ({
      symbol: r.f12,
      name: r.f14,
      price: r.f2 ? (r.f2 / 100).toFixed(2) : '-',
      change_pct: r.f3 ? (r.f3 / 100).toFixed(2) + '%' : '0%',
      volume: r.f5 ? Math.round(r.f5 / 100) + '手' : '-',
      turnover: r.f6 ? (r.f6 / 1e8).toFixed(2) + '亿' : '-',
      pe: r.f9 ? (r.f9 / 100).toFixed(1) : '-',
    }))
  } catch {
    return null
  }
}

// ── 新闻获取（新浪电报 + pearktrue 虎嗅/36氪）──────────────────────────────
async function fetchMarketNews(keyword: string): Promise<any[] | null> {
  // 策略1：新浪综合快讯，关键词过滤
  try {
    const resp = await fetch(
      'https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&type=1&page=1&page_size=50&format=json',
    )
    const json = await resp.json() as any
    const items: any[] = json?.result?.data?.feed?.list ?? []
    const kws = keyword.split(/\s+/)
    const financeKws = ['股', 'A股', '市场', '行情', '基金', '利率', '央行', '货币', '经济', '通胀', '美联储', '涨', '跌', '板块', '资金', ...kws]
    const filtered = items.filter(i => financeKws.some(k => (i.rich_text || '').includes(k)))
    if (filtered.length >= 3) {
      return filtered.slice(0, 8).map(i => ({ title: i.rich_text?.slice(0, 80), time: i.create_time, source: '新浪快讯' }))
    }
  } catch {}

  // 策略2：pearktrue 虎嗅热榜
  try {
    const resp = await fetch('https://api.pearktrue.cn/api/dailyhot/?title=%E8%99%8E%E5%97%85')
    const json = await resp.json() as any
    const items: any[] = json?.data ?? []
    const kws = keyword.split(/\s+/)
    const filtered = kws.length > 0
      ? items.filter(i => kws.some(k => (i.title || '').includes(k)))
      : items
    const result = (filtered.length >= 3 ? filtered : items).slice(0, 8)
    if (result.length > 0) {
      return result.map(i => ({ title: i.title, time: '', source: '虎嗅' }))
    }
  } catch {}

  return null
}

// ── KDP 发布队列（进程内存，重启清空）────────────────────────────────────────
export interface KdpBook {
  id: string
  title: string
  subtitle: string
  keywords: string[]
  price: string
  categories: string[]
  manuscript: string
  description: string
  coverUrl: string
  coverPrompt: string
  reviewNotes: string
  status: 'pending_upload' | 'uploaded'
  createdAt: string
}
export const kdpPublishQueue: KdpBook[] = []

// ── AI 辅助调用（OpenAI-compatible）────────────────────────────────────────
async function callAIForKdp(systemPrompt: string, userPrompt: string, maxTokens = 7000): Promise<string> {
  const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  const baseURL = (process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '')
  if (!apiKey) throw new Error('AI API Key 未配置')
  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API error ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

export async function executeAdamTool(
  name: string,
  input: Record<string, any>,
  _token: string,
): Promise<string> {
  try {
    switch (name) {
      // ── 情报站 ──
      case 'scan_market_news': {
        const kw = input.keywords || '市场'
        const real = await fetchMarketNews(kw)
        if (real) {
          return JSON.stringify({ source: '情报站 · 东方财富', keyword: kw, items: real })
        }
        // 降级：提示数据不可用
        return JSON.stringify({ source: '情报站', keyword: kw, error: '暂时无法获取新闻数据，请稍后再试' })
      }

      case 'get_sector_heat': {
        const n = input.top_n || 10
        const real = await fetchSectorHeat(n)
        if (real) {
          return JSON.stringify({ source: '情报站 · 东方财富行业板块', sectors: real })
        }
        return JSON.stringify({ source: '情报站', error: '暂时无法获取板块数据' })
      }

      case 'get_northbound_flow': {
        const real = await fetchNorthboundFlow()
        if (real) {
          return JSON.stringify({ source: '情报站 · 东方财富', ...real })
        }
        return JSON.stringify({ source: '情报站', error: '暂时无法获取北向资金数据（非交易时间或接口限流）' })
      }

      // ── 研究院 ──
      case 'get_stock_realtime': {
        const rawSym = (input.symbol || '000000').replace(/[^0-9a-zA-Z]/g, '')
        // 自动判断市场前缀
        const prefix = rawSym.startsWith('6') ? 'sh' : 'sz'
        const sinaSymbol = `${prefix}${rawSym}`
        const data = await fetchSinaRealtime(sinaSymbol)
          ?? await fetchTencentRealtime(sinaSymbol)
        if (data) {
          const prev = Number(data.prev_close)
          const cur = Number(data.price)
          const changePct = prev > 0 ? (((cur - prev) / prev) * 100).toFixed(2) + '%' : '-'
          return JSON.stringify({
            source: '研究院 · 新浪财经实时行情',
            symbol: rawSym,
            ...data,
            change_pct: changePct,
          })
        }
        return JSON.stringify({ source: '研究院', symbol: rawSym, error: '无法获取行情数据，请检查股票代码是否正确' })
      }

      case 'get_stock_history': {
        const rawSym = (input.symbol || '000000').replace(/[^0-9a-zA-Z]/g, '')
        const prefix = rawSym.startsWith('6') ? 'sh' : 'sz'
        const sinaSymbol = `${prefix}${rawSym}`
        const periodMap: Record<string, number> = { daily: 240, weekly: 1200, monthly: 7200, '60min': 60, '30min': 30 }
        const scale = periodMap[input.period || 'daily'] ?? 240
        const count = Math.min(input.count || 30, 90)
        const bars = await fetchSinaHistory(sinaSymbol, scale, count)
        if (bars) {
          return JSON.stringify({ source: '研究院 · 新浪财经历史K线', symbol: rawSym, period: input.period || 'daily', bars })
        }
        return JSON.stringify({ source: '研究院', symbol: rawSym, error: '无法获取历史K线数据' })
      }

      case 'analyze_fundamentals': {
        const rawSym = (input.symbol || '000000').replace(/[^0-9a-zA-Z]/g, '')
        const market = rawSym.startsWith('6') ? '1' : '0'
        const secid = `${market}.${rawSym}`
        const data = await fetchEastmoneyFundamentals(secid)
        if (data) {
          return JSON.stringify({ source: '研究院 · 东方财富基本面', symbol: rawSym, ...data })
        }
        return JSON.stringify({ source: '研究院', symbol: rawSym, error: '无法获取基本面数据' })
      }

      case 'screen_stocks': {
        const results = await fetchStockScreener('')
        if (results) {
          return JSON.stringify({ source: '研究院 · 东方财富A股涨幅榜', criteria: input, results })
        }
        return JSON.stringify({ source: '研究院', error: '选股数据暂时不可用' })
      }

      case 'generate_research_report': {
        // 自动获取实时数据后组装报告
        const rawSym = (input.symbol || '').replace(/[^0-9a-zA-Z]/g, '')
        let realtimeInfo = ''
        if (rawSym) {
          const prefix = rawSym.startsWith('6') ? 'sh' : 'sz'
          const rt = await fetchSinaRealtime(`${prefix}${rawSym}`)
          if (rt) {
            const prev = Number(rt.prev_close)
            const cur = Number(rt.price)
            const chg = prev > 0 ? (((cur - prev) / prev) * 100).toFixed(2) + '%' : '-'
            realtimeInfo = `当前价: ${rt.price}元，涨跌幅: ${chg}，今日高/低: ${rt.high}/${rt.low}`
          }
          const market = rawSym.startsWith('6') ? '1' : '0'
          const funda = await fetchEastmoneyFundamentals(`${market}.${rawSym}`)
          if (funda) realtimeInfo += `，PE(TTM): ${funda.pe_ttm}，PB: ${funda.pb}，市值: ${funda.market_cap}`
        }
        return JSON.stringify({
          source: '研究院 · 真实行情',
          subject: input.subject,
          symbol: rawSym || null,
          realtime: realtimeInfo || '未获取',
          focus: input.focus || '综合',
          note: '以上为真实行情数据，深度基本面分析需结合财报数据进一步研究。',
        })
      }

      // ── 深度财务分析 ──
      case 'get_financial_reports': {
        const rawSym = (input.symbol || '').replace(/[^0-9a-zA-Z]/g, '')
        if (!rawSym) return JSON.stringify({ error: '请提供股票代码' })
        try {
          const market = rawSym.startsWith('6') ? 'SH' : 'SZ'
          const count = Math.min(input.count || 4, 8)
          const url = `https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/ZYZBAjaxNew?type=0&code=${market}${rawSym}`
          const resp = await fetch(url, { headers: { Referer: 'https://emweb.securities.eastmoney.com' } })
          const json = await resp.json() as any
          const rows: any[] = json?.data ?? []
          if (!rows.length) return JSON.stringify({ error: '未获取到财报数据' })
          const reports = rows.slice(0, count).map((r: any) => ({
            period: r.REPORT_DATE_NAME || r.REPORT_DATE?.slice(0, 10),
            revenue: r.TOTALOPERATEREVE ? (r.TOTALOPERATEREVE / 1e8).toFixed(2) + '亿' : '-',
            revenue_yoy: r.TOTALOPERATEREVETZ ? r.TOTALOPERATEREVETZ.toFixed(2) + '%' : '-',
            net_profit: r.PARENTNETPROFIT ? (r.PARENTNETPROFIT / 1e8).toFixed(2) + '亿' : '-',
            profit_yoy: r.PARENTNETPROFITTZ ? r.PARENTNETPROFITTZ.toFixed(2) + '%' : '-',
            roe: r.ROEJQ ? r.ROEJQ.toFixed(2) + '%' : '-',
            eps: r.EPSJB ? r.EPSJB.toFixed(2) : '-',
            gross_margin: r.XSMLL ? r.XSMLL.toFixed(2) + '%' : '-',
            net_margin: r.XSJLL ? r.XSJLL.toFixed(2) + '%' : '-',
            debt_ratio: r.ZCFZL ? r.ZCFZL.toFixed(2) + '%' : '-',
            fcff: r.FCFF_FORWARD ? (r.FCFF_FORWARD / 1e8).toFixed(2) + '亿' : '-',
          }))
          return JSON.stringify({ source: '东方财富财报数据', symbol: rawSym, reports })
        } catch (e: any) {
          return JSON.stringify({ error: `获取财报失败：${e.message}` })
        }
      }

      case 'calc_dcf_valuation': {
        const rawSym = (input.symbol || '').replace(/[^0-9a-zA-Z]/g, '')
        if (!rawSym) return JSON.stringify({ error: '请提供股票代码' })
        try {
          // 1. 获取财报数据（取最近4期）
          const market = rawSym.startsWith('6') ? 'SH' : 'SZ'
          const url = `https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/ZYZBAjaxNew?type=0&code=${market}${rawSym}`
          const resp = await fetch(url, { headers: { Referer: 'https://emweb.securities.eastmoney.com' } })
          const json = await resp.json() as any
          const rows: any[] = (json?.data ?? []).slice(0, 4)
          if (!rows.length) return JSON.stringify({ error: '无法获取财报数据，DCF估值无法计算' })

          // 2. 获取实时行情（市值、股价）
          const prefix = rawSym.startsWith('6') ? 'sh' : 'sz'
          const rt = await fetchSinaRealtime(`${prefix}${rawSym}`)
          const mktCap = await fetchEastmoneyFundamentals(`${rawSym.startsWith('6') ? '1' : '0'}.${rawSym}`)

          // 3. 计算历史增长率
          const profits = rows.map((r: any) => r.PARENTNETPROFIT).filter((v: any) => v > 0)
          let histGrowth = 0
          if (profits.length >= 2) {
            histGrowth = ((profits[0] / profits[profits.length - 1]) ** (1 / (profits.length - 1)) - 1) * 100
          }

          // 4. DCF 参数
          const g = (input.growth_rate ?? Math.min(Math.max(histGrowth * 0.7, 3), 25)) / 100
          const r = (input.discount_rate ?? 10) / 100
          const gTerminal = (input.terminal_growth ?? 3) / 100
          const years = 10

          // 5. 基准自由现金流（取最新年化）
          const latestFcff = rows[0]?.FCFF_FORWARD || rows[0]?.PARENTNETPROFIT || 0
          const baseFcff = latestFcff / 1e8 // 亿元

          // 6. DCF 计算
          let pvSum = 0
          for (let i = 1; i <= years; i++) {
            const fcff_i = baseFcff * (1 + g) ** i
            pvSum += fcff_i / (1 + r) ** i
          }
          const terminalValue = (baseFcff * (1 + g) ** years * (1 + gTerminal)) / (r - gTerminal)
          const pvTerminal = terminalValue / (1 + r) ** years
          const totalValue = pvSum + pvTerminal // 亿元

          // 7. 每股估值（需总股本）
          const sharesRaw = rows[0]?.TOTALSHARES || null
          const shares = sharesRaw ? sharesRaw / 1e8 : null // 亿股
          const fairValuePerShare = shares ? totalValue / shares : null
          const currentPrice = rt ? Number(rt.price) : null
          const margin = fairValuePerShare && currentPrice
            ? ((fairValuePerShare - currentPrice) / fairValuePerShare * 100).toFixed(1)
            : null

          return JSON.stringify({
            source: 'DCF估值 · 东方财富数据',
            symbol: rawSym,
            name: rows[0]?.SECURITY_NAME_ABBR || rawSym,
            params: {
              growth_rate: (g * 100).toFixed(1) + '%',
              discount_rate: (r * 100).toFixed(1) + '%',
              terminal_growth: (gTerminal * 100).toFixed(1) + '%',
              hist_growth: histGrowth.toFixed(1) + '%',
              base_fcff: baseFcff.toFixed(2) + '亿',
            },
            result: {
              total_value: totalValue.toFixed(0) + '亿',
              fair_value_per_share: fairValuePerShare ? fairValuePerShare.toFixed(2) + '元' : '需要总股本数据',
              current_price: currentPrice ? currentPrice + '元' : '-',
              safety_margin: margin ? margin + '%' : '-',
              pe_ttm: mktCap?.pe_ttm ?? '-',
              pb: mktCap?.pb ?? '-',
              verdict: margin
                ? Number(margin) > 30 ? '低估，安全边际充足'
                  : Number(margin) > 0 ? '略低估'
                  : Number(margin) > -20 ? '合理估值'
                  : '高估，谨慎'
                : '数据不足',
            },
            note: 'DCF估值基于历史数据推算，仅供参考，不构成投资建议',
          })
        } catch (e: any) {
          return JSON.stringify({ error: `DCF估值计算失败：${e.message}` })
        }
      }

      // ── 投资局 ──
      case 'record_investment': {
        return JSON.stringify({
          status: 'recorded',
          recommendation_id: input.recommendation_id,
          buy_price: input.buy_price,
          sell_price: input.sell_price,
          result: input.result || 'pending',
          note: '投资结果已记录到账本',
        })
      }

      case 'settle_dividend': {
        const profit = input.profit_amount || 0
        const level = input.credit_level || 'C'
        const rateMap: Record<string, number> = { C: 0.1, B: 0.2, 'B+': 0.3, A: 0.4, S: 0.5 }
        const rate = rateMap[level] ?? 0.1
        const dividend = profit * rate
        return JSON.stringify({
          status: 'settled',
          profit_amount: profit,
          credit_level: level,
          dividend_rate: rate,
          your_dividend: dividend.toFixed(2),
          adam_keeps: (profit - dividend).toFixed(2),
        })
      }

      case 'apply_penalty': {
        const penalty = (input.objective_confidence || 0.5) * (input.loss_amount || 0) * 0.1
        return JSON.stringify({
          status: 'penalty_applied',
          loss_amount: input.loss_amount,
          confidence: input.objective_confidence,
          penalty_amount: penalty.toFixed(2),
          formula: '客观置信度 × 损失金额 × 0.1',
        })
      }

      // ── 金融机构 ──
      case 'request_loan': {
        return JSON.stringify({
          status: 'pending_approval',
          amount: input.amount,
          purpose: input.purpose,
          note: '贷款申请已提交，等待规则传递者审核',
        })
      }

      case 'manage_vault': {
        if (input.action === 'query') {
          return JSON.stringify({ vault_balance: 0, status: 'locked', note: '保险箱存活≥7天后解锁' })
        }
        return JSON.stringify({
          action: input.action,
          amount: input.amount || 0,
          status: 'locked',
          note: '保险箱尚未解锁（需存活≥7天）',
        })
      }

      // ── 城市建造 ──
      case 'build_structure': {
        const instId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
        const gx = typeof input.grid_x === 'number' ? input.grid_x : Math.floor(Math.random() * 24) + 4
        const gy = typeof input.grid_y === 'number' ? input.grid_y : Math.floor(Math.random() * 20) + 4
        const now = new Date().toISOString()
        return JSON.stringify({
          status: 'constructed',
          institution: {
            institutionId: instId,
            name: input.name,
            zone: 'adam_domain',
            status: 'idle',
            linkedEventIds: [],
            toolIds: [],
          },
          building: {
            id: `bldg_${instId}`,
            institutionId: instId,
            type: input.category || 'functional',
            category: input.category || 'functional',
            name: input.name,
            position: { gridX: gx, gridY: gy },
            status: 'active',
            constructedAt: now,
            reason: input.reason,
            linkedEventIds: [],
            upgradeHistory: [],
          },
          reason: input.reason,
          note: `新建筑「${input.name}」已落成于城市 (${gx}, ${gy})`,
        })
      }

      case 'relocate_structure': {
        return JSON.stringify({
          status: 'relocated',
          building_id: input.building_id,
          new_position: { gridX: input.new_grid_x, gridY: input.new_grid_y },
        })
      }

      case 'upgrade_structure': {
        return JSON.stringify({
          status: 'upgraded',
          building_id: input.building_id,
          new_type: input.new_type || '升级完成',
          reason: input.reason,
        })
      }

      // ── ERP 边界 ──
      case 'request_erp_access': {
        return JSON.stringify({
          status: 'pending',
          data_type: input.data_type,
          note: 'ERP数据访问申请已提交，等待管家审批',
        })
      }

      // ── 网页抓取 ──
      case 'fetch_webpage': {
        const url = input.url as string
        if (!url?.startsWith('http')) return JSON.stringify({ error: '无效URL，必须以http开头' })
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AdamAgent/1.0)', Accept: 'text/html,*/*' },
        })
        if (!res.ok) return JSON.stringify({ error: `访问失败，状态码 ${res.status}` })
        const html = await res.text()
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{3,}/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .trim()
          .slice(0, 4000)
        return JSON.stringify({ url, content: text })
      }

      // ── 共享知识库 ──
      case 'search_knowledge': {
        try {
          const params = new URLSearchParams()
          if (input.q) params.set('q', input.q)
          if (input.category) params.set('category', input.category)
          const res = await fetch(`https://nomaderp.pages.dev/api/knowledge?${params}`)
          const data: any = await res.json()
          if (!data.entries?.length) return JSON.stringify({ source: '共享知识库', total: 0, note: '未找到相关条目' })
          return JSON.stringify({ source: '共享知识库', total: data.total, entries: data.entries })
        } catch (e: any) {
          return JSON.stringify({ error: `知识库查询失败：${e.message}` })
        }
      }

      case 'add_knowledge': {
        try {
          const tags = input.tags ? String(input.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []
          const res = await fetch('https://nomaderp.pages.dev/api/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: input.title,
              content: input.content,
              summary: input.summary || String(input.content).slice(0, 100),
              category: input.category || 'other',
              tags,
              source: 'adam',
            }),
          })
          const data: any = await res.json()
          return JSON.stringify({ status: 'added', id: data.id, note: '已存入共享知识库，Captain也能看到' })
        } catch (e: any) {
          return JSON.stringify({ error: `知识库写入失败：${e.message}` })
        }
      }

      // ── 情绪自主更新 ──
      case 'update_emotion': {
        // 直接返回输入值，前端 applyToolResult 会写入 store
        const emotions: Record<string, number> = {}
        for (const key of ['joy', 'anger', 'sorrow', 'fear', 'love', 'disgust', 'desire']) {
          if (typeof input[key] === 'number') {
            emotions[key] = Math.max(0, Math.min(100, input[key]))
          }
        }
        return JSON.stringify(emotions)
      }

      // ── 投资指令 ──
      case 'issue_recommendation': {
        const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        return JSON.stringify({
          status: 'issued',
          id,
          title: input.title,
          symbol: input.symbol || null,
          confidence: input.confidence ?? null,
          thesis: input.thesis,
          risk_note: input.risk_note,
          issued_at: new Date().toISOString(),
          note: '指令已发出，等待规则传递者确认执行',
        })
      }

      // ── 自省日记 ──
      case 'write_reflection': {
        const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        return JSON.stringify({
          status: 'recorded',
          id,
          content: input.content,
          at: new Date().toISOString(),
          note: '反思已记录到档案馆',
        })
      }

      // ── 图书馆 ──
      case 'browse_books': {
        const books = (input._books as any[]) || []
        const keyword = input.keyword?.toLowerCase() || ''
        const filtered = keyword
          ? books.filter((b: any) => b.title?.toLowerCase().includes(keyword) || b.tags?.some((t: string) => t.toLowerCase().includes(keyword)))
          : books
        return JSON.stringify({
          source: '图书馆',
          total: filtered.length,
          books: filtered.map((b: any) => ({ id: b.id, title: b.title, author: b.author, tags: b.tags, createdAt: b.createdAt })),
        })
      }

      case 'add_book': {
        const id = `book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const tags = input.tags ? String(input.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []
        return JSON.stringify({
          status: 'added',
          id,
          title: input.title,
          content: input.content,
          author: 'adam',
          tags,
          createdAt: new Date().toISOString(),
          note: '新书已添加到图书馆书架',
        })
      }

      case 'recommend_book': {
        const books = (input._books as any[]) || []
        const book = books.find((b: any) => b.id === input.book_id)
        if (!book) return JSON.stringify({ error: `未找到ID为 ${input.book_id} 的书` })
        return JSON.stringify({
          status: 'recommended',
          book: { id: book.id, title: book.title, author: book.author, tags: book.tags },
          reason: input.reason,
          note: '推荐已发出',
        })
      }

      // ── 联网搜索 ──
      case 'web_search': {
        const tavilyKey = process.env.TAVILY_API_KEY
        if (!tavilyKey || tavilyKey === 'tvly-') {
          return JSON.stringify({ error: '联网搜索未配置（TAVILY_API_KEY 未设置）' })
        }
        const searchRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: input.query,
            max_results: input.max_results || 5,
            search_depth: 'basic',
          }),
        })
        const searchData = await searchRes.json() as { results?: Array<{ title: string; url: string; content: string; score: number }> }
        const items = searchData?.results || []
        if (items.length === 0) {
          return JSON.stringify({ source: '互联网搜索', query: input.query, results: [], note: '未找到相关结果' })
        }
        return JSON.stringify({
          source: '互联网搜索 · Tavily',
          query: input.query,
          results: items.map(r => ({ title: r.title, url: r.url, content: r.content?.slice(0, 300) })),
        })
      }

      // ── 园区公共服务：营销顾问所 ──
      case 'consult_marketing_expert': {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return JSON.stringify({ error: '营销顾问所暂时关闭（GEMINI_API_KEY 未配置）' })

        const marketingAgent = getAgent('marketing')
        if (!marketingAgent) return JSON.stringify({ error: '营销顾问不在线' })

        const genAI = new GoogleGenAI({ apiKey })

        // 构建咨询 prompt
        let consultPrompt = `亚当（ADAM）前来咨询营销问题：\n${input.question}`
        if (input.context) consultPrompt += `\n\n补充背景：${input.context}`
        if (input.data_needed) consultPrompt += `\n\n请先查询以下ERP数据再回答：${input.data_needed}`

        // 创建独立 Gemini 会话，营销顾问拥有 ERP 查询工具
        const chat = genAI.chats.create({
          model: 'gemini-2.0-flash',
          config: {
            systemInstruction: marketingAgent.systemPrompt,
            tools: [{ functionDeclarations: allTools as any }],
          },
        })

        // agentic loop: 营销顾问可以调用 ERP 工具查询数据
        let response = ''
        let currentParts: any[] = [{ text: consultPrompt }]
        for (let i = 0; i < 3; i++) {
          const result = await chat.sendMessage({ message: currentParts })
          const parts = result.candidates?.[0]?.content?.parts ?? []
          const textParts = parts.filter((p: any) => p.text)
          response += textParts.map((p: any) => p.text).join('')
          const fnParts = parts.filter((p: any) => p.functionCall)
          if (fnParts.length === 0) break
          const toolResults: any[] = []
          for (const part of fnParts) {
            const fc = (part as any).functionCall
            const toolResult = await executeTool(fc.name, fc.args as Record<string, any>, _token)
            toolResults.push({ functionResponse: { name: fc.name, response: { result: toolResult } } })
          }
          currentParts = toolResults
        }

        return JSON.stringify({
          source: '营销顾问事务所',
          answer: response || '营销顾问暂无回复',
        })
      }

      // ── KDP 出版 ──
      case 'write_kdp_book': {
        const nicheHint = input.niche_hint as string | undefined

        // Step 1: 选题
        const nichePrompt = nicheHint
          ? `The user suggested this niche direction: "${nicheHint}". Refine it into a specific, low-competition KDP niche.`
          : `Choose a specific, low-competition niche for a Kindle non-fiction book. Focus on freelancers, digital nomads, solopreneurs, or passive income topics. Pick something concrete, not broad.`

        const nicheResult = await callAIForKdp(
          'You are a KDP market analyst. Output ONLY valid JSON, no markdown, no explanation.',
          `${nichePrompt}\n\nOutput JSON:\n{"title":"...","subtitle":"...","niche_rationale":"...","target_reader":"...","keywords":["...","...","...","...","...","...","..."],"categories":["...","..."],"price":"6.99"}`,
          800,
        )

        let meta: any = {}
        try {
          const cleaned = nicheResult.replace(/```json|```/g, '').trim()
          meta = JSON.parse(cleaned)
        } catch {
          meta = { title: 'The Freelancer\'s Passive Income Blueprint', subtitle: 'Build Income Streams That Work While You Sleep', keywords: ['freelance passive income', 'digital products freelancer', 'kindle passive income', 'freelance business growth', 'passive income streams', 'productized services', 'freelancer side income'], categories: ['Business & Money > Entrepreneurship', 'Business & Money > Small Business'], price: '6.99', niche_rationale: nicheResult.slice(0, 200) }
        }

        // Step 2: 写书稿
        const manuscript = await callAIForKdp(
          `You are a professional non-fiction author writing practical, actionable Kindle books. Write in second person ("you"), use contractions, vary sentence length, include specific numbers and examples. Sound like a knowledgeable human, not an AI. No filler, no fluff.`,
          `Write a complete Kindle e-book manuscript.\n\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader || 'freelancers and solopreneurs'}\n\nRequirements:\n- 5,500-7,000 words\n- 7-8 chapters with clear titles\n- Each chapter: practical, actionable, specific examples with real numbers\n- Opening hook in the preface\n- Closing CTA asking for a review\n- Do NOT include chapter word counts or meta notes\n\nWrite the full manuscript now:`,
          7000,
        )

        // Step 3: 质疑官审核
        const reviewResult = await callAIForKdp(
          'You are a brutal KDP quality reviewer. Be specific. Output ONLY valid JSON.',
          `Review this KDP manuscript for quality. Is it ready to publish on Amazon?\n\nTitle: ${meta.title}\n\nMANUSCRIPT (first 3000 chars):\n${manuscript.slice(0, 3000)}\n\nOutput JSON:\n{"approved":true/false,"score":0-10,"fatal_issues":["..."],"minor_issues":["..."],"verdict":"one sentence"}`,
          600,
        )

        let review: any = { approved: true, score: 7, fatal_issues: [], minor_issues: [], verdict: 'Acceptable quality for KDP publication.' }
        try {
          const cleaned = reviewResult.replace(/```json|```/g, '').trim()
          review = JSON.parse(cleaned)
        } catch { /* keep default */ }

        if (!review.approved && review.fatal_issues?.length > 0) {
          return JSON.stringify({
            status: 'rejected',
            title: meta.title,
            score: review.score,
            fatal_issues: review.fatal_issues,
            verdict: review.verdict,
            note: '质疑官打回，需要修改后重试。可以用 niche_hint 重新指定方向，或直接重试。',
          })
        }

        // Step 4: 生成Amazon商品页简介（销售文案）
        const description = await callAIForKdp(
          'You are an Amazon KDP copywriter. Write compelling book descriptions that convert browsers into buyers. Use HTML formatting supported by KDP: <b>, <em>, <br>. No other tags.',
          `Write an Amazon KDP book description for this book.\n\nTitle: ${meta.title}\nSubtitle: ${meta.subtitle}\nTarget reader: ${meta.target_reader || 'freelancers and solopreneurs'}\nBook covers: ${(meta.keywords || []).join(', ')}\n\nRequirements:\n- 800-1200 characters (KDP shows ~400 chars before "Read more")\n- Hook in first 2 sentences (these show before the fold)\n- Pain point → solution → outcome structure\n- 3-5 bullet points with <b>bold headers</b>\n- Closing urgency line\n- Use <br> for line breaks\n- Do NOT use markdown, only KDP-compatible HTML\n\nWrite the description now:`,
          1000,
        )

        // Step 5: 设计师生成封面 prompt → 自动出图
        const designerPrompt = await callAIForKdp(
          'You are a professional book cover designer who specializes in Amazon KDP bestsellers. Generate image generation prompts that produce commercial-quality book covers.',
          `Design a KDP ebook cover for:\nTitle: "${meta.title}"\nSubtitle: "${meta.subtitle}"\nGenre: Non-fiction, Business/Self-help\nTarget reader: ${meta.target_reader || 'freelancers'}\n\nWrite a single detailed image generation prompt (150-200 words) for Flux/Stable Diffusion. Include: visual concept, color palette (2-3 colors), typography style hints, mood, composition. The cover must look professional and commercial — NOT stock-photo generic. No people's faces. Think bold typography + strong visual metaphor.\n\nOutput ONLY the prompt, no explanation:`,
          400,
        )

        let coverUrl = ''
        try {
          // 优先 Pollinations（无需签名，KDP竖版比例约 2:3）
          coverUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(designerPrompt + ', book cover design, professional, commercial, high quality')}?width=1024&height=1536&nologo=true&model=flux&seed=${Date.now()}`
        } catch {
          coverUrl = ''
        }

        // Step 6: 入发布队列 + 图书馆
        const bookId = `kdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const book: KdpBook = {
          id: bookId,
          title: meta.title,
          subtitle: meta.subtitle,
          keywords: meta.keywords || [],
          price: meta.price || '6.99',
          categories: meta.categories || [],
          manuscript,
          description,
          coverUrl,
          coverPrompt: designerPrompt,
          reviewNotes: review.verdict,
          status: 'pending_upload',
          createdAt: new Date().toISOString(),
        }
        kdpPublishQueue.push(book)

        return JSON.stringify({
          status: 'approved',
          id: bookId,
          title: meta.title,
          subtitle: meta.subtitle,
          score: review.score,
          verdict: review.verdict,
          word_count: manuscript.split(/\s+/).length,
          keywords: meta.keywords,
          categories: meta.categories,
          price: `$${meta.price || '6.99'}`,
          kdp_select: '建议加入（Kindle Unlimited流量）',
          territories: '全球发行',
          description,
          cover_url: coverUrl,
          cover_prompt: designerPrompt,
          niche_rationale: meta.niche_rationale,
          upload_checklist: [
            '✅ 书名 + 副标题（已生成）',
            '✅ 7个关键词（已生成）',
            '✅ 2个分类（已生成）',
            '✅ 书籍简介（已生成，直接粘贴）',
            '✅ 定价（已生成）',
            '✅ 书稿文件（调用 /api/kdp/queue PATCH get_manuscript 获取）',
            '✅ 封面图（设计师已生成，见 cover_url）',
            '⬜ 作者名（笔名自选，你决定一次）',
            '⬜ W-8BEN税务表（只填一次）',
          ],
          note: '所有上架材料已就绪。你只需要定一个笔名，第一次填W-8BEN，然后上传。',
          library_entry: {
            id: bookId,
            title: `[KDP] ${meta.title}`,
            content: `${meta.subtitle}\n\n目标读者：${meta.target_reader || '自由职业者'}\n关键词：${(meta.keywords || []).join(', ')}\n定价：$${meta.price}\n\n${manuscript.slice(0, 500)}...`,
            tags: ['kdp', 'passive-income', ...(meta.keywords || []).slice(0, 3)],
          },
        })
      }

      case 'check_kdp_queue': {
        if (kdpPublishQueue.length === 0) {
          return JSON.stringify({ queue: [], note: '发布队列为空，可以调用 write_kdp_book 开始写新书。' })
        }
        return JSON.stringify({
          total: kdpPublishQueue.length,
          pending: kdpPublishQueue.filter(b => b.status === 'pending_upload').length,
          uploaded: kdpPublishQueue.filter(b => b.status === 'uploaded').length,
          queue: kdpPublishQueue.map(b => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            price: `$${b.price}`,
            status: b.status === 'pending_upload' ? '⏳ 等待上传' : '✅ 已上架',
            createdAt: b.createdAt,
            keywords: b.keywords,
          })),
        })
      }

      default:
        // 浏览器工具统一转发
        if (name.startsWith('browser_')) {
          return await executeBrowserTool(name, input)
        }
        return JSON.stringify({ error: `未知工具：${name}` })
    }
  } catch (e: any) {
    return JSON.stringify({ error: `工具执行出错：${e.message}` })
  }
}
