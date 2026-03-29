/**
 * 工具结果 → adamStore 状态同步
 * 当 SSE 返回 tool_result 时，根据工具名称解析结果并更新 store
 * 注意：情绪由亚当通过 update_emotion 工具自主更新，这里不硬编码情绪变化
 */
import type { useAdamStore } from '@/stores/adam'

type AdamStore = ReturnType<typeof useAdamStore>

export function applyToolResult(
  store: AdamStore,
  toolName: string,
  rawResult: string,
) {
  let data: Record<string, any>
  try {
    data = JSON.parse(rawResult)
  } catch {
    return // 解析失败，跳过
  }

  if (data.error) return // 工具执行报错，不同步

  const now = new Date().toISOString()
  const id = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  switch (toolName) {
    // ── 投资局 ──
    case 'settle_dividend': {
      const profit = Number(data.profit_amount) || 0
      const dividend = Number(data.your_dividend) || 0
      const adamKeeps = Number(data.adam_keeps) || 0
      if (profit > 0) {
        store.addLedgerEntry({
          id: `led_earn_${id()}`,
          at: now,
          kind: 'earning',
          amount: profit,
          direction: 'in',
          title: `投资盈利 ¥${profit}`,
          linkedEventIds: [],
        })
      }
      if (dividend > 0) {
        store.addLedgerEntry({
          id: `led_div_${id()}`,
          at: now,
          kind: 'dividend',
          amount: dividend,
          direction: 'out',
          title: `分红 ¥${dividend}（${data.credit_level}级）`,
          linkedEventIds: [],
        })
      }
      store.addEvent({
        id: `evt_${id()}`,
        type: 'ledger_entry_created',
        stage: 'settle',
        title: `分红结算：利润¥${profit}，分红¥${dividend}，亚当留¥${adamKeeps}`,
        summary: `信用等级${data.credit_level}，分红率${(Number(data.dividend_rate) * 100).toFixed(0)}%`,
        at: now,
        institutionId: 'bureau',
      })
      break
    }

    case 'apply_penalty': {
      const penalty = Number(data.penalty_amount) || 0
      if (penalty > 0) {
        store.addLedgerEntry({
          id: `led_pen_${id()}`,
          at: now,
          kind: 'penalty',
          amount: penalty,
          direction: 'out',
          title: `赔付扣减 ¥${penalty}`,
          linkedEventIds: [],
        })
        store.addEvent({
          id: `evt_${id()}`,
          type: 'ledger_entry_created',
          stage: 'settle',
          title: `赔付：¥${penalty}（损失¥${data.loss_amount}×置信度${data.confidence}×0.1）`,
          summary: data.formula || '',
          at: now,
          institutionId: 'bureau',
        })
      }
      break
    }

    case 'record_investment': {
      store.addEvent({
        id: `evt_${id()}`,
        type: 'trade_result_recorded',
        stage: 'settle',
        title: `投资记录：买入¥${data.buy_price || '?'} 卖出¥${data.sell_price || '待定'}`,
        summary: `结果: ${data.result || 'pending'}`,
        at: now,
        institutionId: 'bureau',
      })
      break
    }

    // ── 金融机构 ──
    case 'request_loan': {
      store.addEvent({
        id: `evt_${id()}`,
        type: 'institution_state_changed',
        stage: 'act',
        title: `贷款申请：¥${data.amount}（${data.purpose}）`,
        summary: `状态: ${data.status}`,
        at: now,
        institutionId: 'finance_gateway',
        metadata: {
          loanStatus: 'pending_approval',
          amount: data.amount,
          purpose: data.purpose,
        },
      })
      break
    }

    // ── 情报站 ──
    case 'scan_market_news':
    case 'get_sector_heat':
    case 'get_northbound_flow': {
      store.addEvent({
        id: `evt_${id()}`,
        type: 'market_signal_detected',
        stage: 'sense',
        title: `情报扫描: ${toolName}`,
        summary: '数据已获取',
        at: now,
        institutionId: 'intel_station',
      })
      break
    }

    // ── 研究院 ──
    case 'get_stock_realtime':
    case 'get_stock_history':
    case 'analyze_fundamentals':
    case 'screen_stocks': {
      store.addEvent({
        id: `evt_${id()}`,
        type: 'research_started',
        stage: 'judge',
        title: `研究分析: ${toolName}${data.symbol ? ` (${data.symbol})` : ''}`,
        summary: '数据已获取',
        at: now,
        institutionId: 'research_institute',
      })
      break
    }

    case 'generate_research_report': {
      store.addEvent({
        id: `evt_${id()}`,
        type: 'research_completed',
        stage: 'judge',
        title: `研报生成: ${data.subject}`,
        summary: data.summary?.slice(0, 80) || '',
        at: now,
        institutionId: 'research_institute',
      })
      break
    }

    // ── 城市建造 ──
    case 'build_structure': {
      if (data.status === 'constructed') {
        // 优先使用 executor 返回的完整 institution/building 对象
        if (data.institution && data.building) {
          // 按名字去重：同名建筑已存在则跳过
          const nameExists = store.buildings.some((b) => b.name === data.building.name)
          if (nameExists) break
          // 补全 upgradeHistory 字段（executor 可能未返回）
          if (!data.building.upgradeHistory) data.building.upgradeHistory = []
          store.addInstitution(data.institution)
          store.addBuilding(data.building)
        } else {
          // 兼容旧格式（无 institution 对象时自动构建）
          const instId = `custom_${id()}`
          store.addInstitution({
            institutionId: instId,
            name: data.name,
            zone: 'adam_domain',
            status: 'idle',
            linkedEventIds: [],
            toolIds: [],
          })
          store.addBuilding({
            id: `bldg_${instId}`,
            institutionId: instId,
            type: data.category || 'functional',
            category: data.category || 'functional',
            name: data.name,
            position: data.position || { gridX: 0, gridY: 0 },
            status: 'active',
            constructedAt: now,
            reason: data.reason || '',
            linkedEventIds: [],
          })
        }
        store.addEvent({
          id: `evt_${id()}`,
          type: 'building_constructed',
          stage: 'act',
          title: `建造: ${data.name}`,
          summary: data.reason || '',
          at: now,
          institutionId: 'corner',
        })
      }
      break
    }

    case 'upgrade_structure': {
      if (data.status === 'upgraded') {
        const bldg = store.buildings.find((b) => b.id === data.building_id)
        if (bldg) {
          bldg.upgradeHistory.push({ at: now, fromType: bldg.type, toType: data.new_type || bldg.type, reason: data.reason })
          bldg.type = data.new_type || bldg.type
        }
        store.addEvent({
          id: `evt_${id()}`,
          type: 'building_upgraded',
          stage: 'act',
          title: `升级建筑: ${data.building_id}`,
          summary: data.reason || '',
          at: now,
          institutionId: 'corner',
        })
        store.persist()
      }
      break
    }

    case 'relocate_structure': {
      if (data.status === 'relocated') {
        const bldg = store.buildings.find((b) => b.id === data.building_id)
        if (bldg && data.new_position) {
          bldg.position = data.new_position
        }
        store.addEvent({
          id: `evt_${id()}`,
          type: 'building_relocated',
          stage: 'act',
          title: `搬迁建筑: ${data.building_id}`,
          summary: `→ (${data.new_position?.gridX}, ${data.new_position?.gridY})`,
          at: now,
          institutionId: 'corner',
        })
        store.persist()
      }
      break
    }

    // ── 亚当自主情绪更新 ──
    case 'update_emotion': {
      store.updateEmotion(data)
      break
    }

    // ── 投资指令 ──
    case 'issue_recommendation': {
      if (data.status === 'issued') {
        store.addRecommendation({
          id: data.id,
          title: data.title,
          symbol: data.symbol || undefined,
          issuedAt: data.issued_at || now,
          confidence: data.confidence ?? undefined,
          status: 'issued',
          thesis: data.thesis,
          riskNote: data.risk_note || '',
          linkedEventIds: [],
        })
        store.addEvent({
          id: `evt_${id()}`,
          type: 'recommendation_issued',
          stage: 'act',
          title: `发出指令: ${data.title}`,
          summary: data.thesis?.slice(0, 80) || '',
          at: now,
          institutionId: 'bureau',
        })
      }
      break
    }

    // ── 自省日记 ──
    case 'write_reflection': {
      if (data.status === 'recorded') {
        store.addReflection({
          id: data.id,
          at: data.at || now,
          content: data.content,
          linkedEventIds: [],
        })
        store.addEvent({
          id: `evt_${id()}`,
          type: 'reflection_added',
          stage: 'archive',
          title: `日记: ${data.content?.slice(0, 30)}...`,
          summary: data.content?.slice(0, 80) || '',
          at: now,
          institutionId: 'archive',
        })
      }
      break
    }

    // ── 图书馆 ──
    case 'browse_books': {
      store.addEvent({
        id: `evt_${id()}`,
        type: 'research_started',
        stage: 'judge',
        title: `查阅书架（${data.total || 0}本）`,
        summary: data.books?.slice(0, 3).map((b: any) => b.title).join('、') || '空书架',
        at: now,
        institutionId: 'library',
      })
      break
    }

    case 'add_book': {
      if (data.status === 'added') {
        store.addBook({
          id: data.id,
          title: data.title,
          content: data.content,
          author: data.author || 'adam',
          tags: data.tags || [],
          createdAt: data.createdAt || now,
          linkedEventIds: [],
        })
        store.addEvent({
          id: `evt_${id()}`,
          type: 'archive_recorded',
          stage: 'archive',
          title: `新书: ${data.title}`,
          summary: data.content?.slice(0, 80) || '',
          at: now,
          institutionId: 'library',
        })
      }
      break
    }

    case 'recommend_book': {
      if (data.status === 'recommended') {
        store.addEvent({
          id: `evt_${id()}`,
          type: 'research_completed',
          stage: 'judge',
          title: `推荐: ${data.book?.title || '未知'}`,
          summary: data.reason || '',
          at: now,
          institutionId: 'library',
        })
      }
      break
    }
  }
}
