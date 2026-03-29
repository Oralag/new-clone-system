/**
 * 亚当工具执行器
 * 真实行情数据接入（新浪财经 + 东方财富）
 */

import { GoogleGenAI } from '@google/genai'
import { getAgent } from '../agents/agentRegistry'
import { allTools } from './erpTools'
import { executeTool } from './toolExecutor'

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

      default:
        return JSON.stringify({ error: `未知工具：${name}` })
    }
  } catch (e: any) {
    return JSON.stringify({ error: `工具执行出错：${e.message}` })
  }
}
