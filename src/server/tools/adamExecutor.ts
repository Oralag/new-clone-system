/**
 * 亚当工具执行器
 * Phase 1: 大部分返回模拟数据，真实 API 接入在 Phase 2
 */

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
        return JSON.stringify({
          source: '情报站 · 模拟数据',
          keyword: kw,
          items: [
            { title: `${kw}板块今日异动，多只个股涨停`, time: '10:15', sentiment: 'positive' },
            { title: `央行发布最新货币政策报告，流动性维持宽松`, time: '09:30', sentiment: 'neutral' },
            { title: `外资连续3日净买入，关注北向资金动向`, time: '09:05', sentiment: 'positive' },
          ],
          note: 'Phase 1 模拟数据，真实接口待接入',
        })
      }

      case 'get_sector_heat': {
        const n = input.top_n || 10
        const sectors = [
          { name: '新能源', heat: 87, change: '+5.2%' },
          { name: '半导体', heat: 82, change: '+3.8%' },
          { name: '人工智能', heat: 79, change: '+4.1%' },
          { name: '医药生物', heat: 65, change: '+1.2%' },
          { name: '消费', heat: 58, change: '-0.5%' },
          { name: '金融', heat: 52, change: '+0.8%' },
          { name: '地产', heat: 41, change: '-1.3%' },
          { name: '军工', heat: 73, change: '+2.9%' },
          { name: '基建', heat: 45, change: '+0.3%' },
          { name: '农业', heat: 38, change: '-0.2%' },
        ]
        return JSON.stringify({
          source: '情报站 · 模拟数据',
          sectors: sectors.slice(0, n),
        })
      }

      case 'get_northbound_flow': {
        return JSON.stringify({
          source: '情报站 · 模拟数据',
          today_net: 23.45,
          unit: '亿元',
          trend_5d: [12.3, -5.6, 18.9, 8.2, 23.45],
          top_buy: ['600519 贵州茅台', '000858 五粮液', '300750 宁德时代'],
          top_sell: ['601318 中国平安', '000001 平安银行'],
        })
      }

      // ── 研究院 ──
      case 'get_stock_realtime': {
        const symbol = input.symbol || '000000'
        return JSON.stringify({
          source: '研究院 · 模拟数据',
          symbol,
          name: symbol === '600519' ? '贵州茅台' : `股票${symbol}`,
          price: (1500 + Math.random() * 200).toFixed(2),
          change_pct: (Math.random() * 6 - 3).toFixed(2) + '%',
          volume: Math.floor(Math.random() * 50000) + '手',
          turnover: (Math.random() * 30).toFixed(1) + '亿',
        })
      }

      case 'get_stock_history': {
        const symbol = input.symbol || '000000'
        const count = input.count || 30
        const bars = []
        let price = 1500
        for (let i = 0; i < Math.min(count, 30); i++) {
          price += (Math.random() - 0.48) * 20
          bars.push({
            date: `2026-03-${(22 - i).toString().padStart(2, '0')}`,
            open: price.toFixed(2),
            close: (price + (Math.random() - 0.5) * 10).toFixed(2),
            high: (price + Math.random() * 15).toFixed(2),
            low: (price - Math.random() * 15).toFixed(2),
          })
        }
        return JSON.stringify({
          source: '研究院 · 模拟数据',
          symbol,
          period: input.period || 'daily',
          bars: bars.reverse(),
        })
      }

      case 'analyze_fundamentals': {
        return JSON.stringify({
          source: '研究院 · 模拟数据',
          symbol: input.symbol,
          pe_ttm: (15 + Math.random() * 30).toFixed(1),
          pb: (1 + Math.random() * 5).toFixed(2),
          roe: (8 + Math.random() * 20).toFixed(1) + '%',
          revenue_growth: (Math.random() * 30 - 5).toFixed(1) + '%',
          net_profit_growth: (Math.random() * 40 - 10).toFixed(1) + '%',
          dividend_yield: (Math.random() * 3).toFixed(2) + '%',
        })
      }

      case 'screen_stocks': {
        return JSON.stringify({
          source: '研究院 · 模拟数据',
          criteria: input,
          results: [
            { symbol: '600519', name: '贵州茅台', pe: 28.5, pb: 9.8, roe: '30.2%' },
            { symbol: '000858', name: '五粮液', pe: 22.1, pb: 6.5, roe: '25.8%' },
            { symbol: '300750', name: '宁德时代', pe: 35.2, pb: 7.1, roe: '18.5%' },
          ],
          total: 3,
        })
      }

      case 'generate_research_report': {
        return JSON.stringify({
          source: '研究院 · 模拟数据',
          subject: input.subject,
          focus: input.focus || '综合',
          summary: `关于${input.subject}的深度分析报告已生成。基本面稳健，技术面处于上升趋势中。建议持续关注北向资金动向和板块轮动节奏。`,
          rating: '★★★☆☆',
          estimated_value: '¥15',
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
        const rate = 0.1 // C级 10%
        const dividend = profit * rate
        return JSON.stringify({
          status: 'settled',
          profit_amount: profit,
          credit_level: 'C',
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
        return JSON.stringify({
          status: 'constructed',
          name: input.name,
          category: input.category,
          position: { gridX: input.grid_x || 0, gridY: input.grid_y || 0 },
          reason: input.reason,
          note: '新建筑已出现在城市中',
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

      default:
        return JSON.stringify({ error: `未知工具：${name}` })
    }
  } catch (e: any) {
    return JSON.stringify({ error: `工具执行出错：${e.message}` })
  }
}
