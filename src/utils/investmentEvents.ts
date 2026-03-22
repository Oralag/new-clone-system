import type {
  BuildingRecord,
  InstitutionStateRecord,
  InvestmentEventRecord,
  InvestmentEventType,
  InvestmentInstitutionId,
  InvestmentToolId,
} from '@/types/investment'
import { investmentToolMap } from '@/config/investmentTools'

export function makeInvestmentId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
}

export function createInvestmentEvent(args: {
  type: InvestmentEventType
  title: string
  summary: string
  institutionId?: InvestmentInstitutionId
  toolId?: InvestmentToolId
  relatedIds?: string[]
  metadata?: Record<string, unknown>
}): InvestmentEventRecord {
  const tool = args.toolId ? investmentToolMap[args.toolId] : null

  return {
    id: makeInvestmentId('evt'),
    type: args.type,
    stage: tool?.stage || inferStageFromType(args.type),
    title: args.title,
    summary: args.summary,
    at: new Date().toISOString(),
    institutionId: args.institutionId || tool?.institutionId,
    toolId: args.toolId,
    relatedIds: args.relatedIds || [],
    metadata: args.metadata,
  }
}

export function inferStageFromType(type: InvestmentEventType) {
  if (type === 'market_signal_detected') return 'sense'
  if (type === 'research_started' || type === 'research_completed') return 'judge'
  if (
    type === 'recommendation_issued' ||
    type === 'recommendation_adopted' ||
    type === 'institution_unlocked' ||
    type === 'institution_state_changed' ||
    type === 'building_constructed' ||
    type === 'building_upgraded' ||
    type === 'building_relocated' ||
    type === 'dispute_created' ||
    type === 'dispute_resolved'
  ) {
    return 'act'
  }
  if (
    type === 'trade_result_recorded' ||
    type === 'ledger_entry_created' ||
    type === 'credit_changed'
  ) {
    return 'settle'
  }
  return 'archive'
}

export function updateInstitutionStateFromEvent(
  institution: InstitutionStateRecord,
  event: InvestmentEventRecord,
): InstitutionStateRecord {
  if (event.institutionId !== institution.institutionId) return institution

  const status =
    event.type === 'institution_unlocked'
      ? 'idle'
      : event.type === 'institution_state_changed'
        ? (event.metadata?.status as InstitutionStateRecord['status']) || institution.status
        : event.type === 'dispute_created'
          ? 'urgent'
          : 'active'

  return {
    ...institution,
    status,
    lastActivityAt: event.at,
    recentTrace: event.summary,
    linkedEventIds: [...institution.linkedEventIds, event.id],
  }
}

export function appendBuildingEvent(
  building: BuildingRecord,
  event: InvestmentEventRecord,
): BuildingRecord {
  if (!event.relatedIds?.includes(building.id)) return building

  return {
    ...building,
    linkedEventIds: [...building.linkedEventIds, event.id],
    status:
      event.type === 'building_upgraded'
        ? 'upgrading'
        : event.type === 'archive_recorded' && building.status === 'upgrading'
          ? 'active'
          : building.status,
  }
}

export function buildTaskProjection(events: InvestmentEventRecord[]) {
  return events
    .filter((event) => ['sense', 'judge', 'act', 'settle'].includes(event.stage))
    .slice(-12)
    .map((event) => ({
      id: event.id,
      title: event.title,
      summary: event.summary,
      stage: event.stage,
      institutionId: event.institutionId,
      toolId: event.toolId,
      at: event.at,
    }))
}
