export type InvestmentStage = 'sense' | 'judge' | 'act' | 'settle' | 'archive'

export type InvestmentEventType =
  | 'market_signal_detected'
  | 'research_started'
  | 'research_completed'
  | 'recommendation_issued'
  | 'recommendation_adopted'
  | 'trade_result_recorded'
  | 'ledger_entry_created'
  | 'credit_changed'
  | 'institution_unlocked'
  | 'institution_state_changed'
  | 'building_constructed'
  | 'building_upgraded'
  | 'building_relocated'
  | 'reflection_added'
  | 'archive_recorded'
  | 'dispute_created'
  | 'dispute_resolved'

export type InvestmentInstitutionId =
  | 'bureau'
  | 'finance_gateway'
  | 'reactor'
  | 'intel_station'
  | 'research_institute'
  | 'adam_academy'
  | 'data_center'
  | 'risk_lab'
  | 'arbitration_hall'
  | 'ad_company'
  | 'archive'
  | 'corner'
  | 'marketing_consultancy'
  | 'library'
  | (string & {})

export type InvestmentInstitutionStatus =
  | 'locked'
  | 'idle'
  | 'active'
  | 'cooldown'
  | 'disabled'
  | 'urgent'

export type InvestmentToolId =
  | 'scan_market_news'
  | 'get_stock_realtime'
  | 'get_stock_history'
  | 'analyze_fundamentals'
  | 'screen_stocks'
  | 'get_northbound_flow'
  | 'get_sector_heat'
  | 'generate_research_report'
  | 'record_investment'
  | 'settle_dividend'
  | 'apply_penalty'
  | 'request_loan'
  | 'manage_vault'
  | 'build_structure'
  | 'relocate_structure'
  | 'upgrade_structure'
  | 'request_erp_access'
  | 'issue_recommendation'
  | 'write_reflection'
  | 'consult_marketing_expert'
  | 'browse_books'
  | 'add_book'
  | 'recommend_book'

export interface InvestmentEventRecord {
  id: string
  type: InvestmentEventType
  stage: InvestmentStage
  title: string
  summary: string
  at: string
  relatedIds?: string[]
  institutionId?: InvestmentInstitutionId
  toolId?: InvestmentToolId
  metadata?: Record<string, unknown>
}

export interface RecommendationRecord {
  id: string
  title: string
  symbol?: string
  issuedAt: string
  confidence?: number
  status:
    | 'drafted'
    | 'issued'
    | 'adopted'
    | 'executed'
    | 'settled'
    | 'disputed'
    | 'archived'
  thesis: string
  riskNote: string
  linkedEventIds: string[]
}

export interface LedgerEntryRecord {
  id: string
  at: string
  kind:
    | 'earning'
    | 'cost'
    | 'penalty'
    | 'dividend'
    | 'loan'
    | 'repayment'
    | 'vault_deposit'
    | 'vault_release'
  amount: number
  direction: 'in' | 'out'
  title: string
  linkedEventIds: string[]
  recommendationId?: string
}

export interface InstitutionStateRecord {
  institutionId: InvestmentInstitutionId
  name: string
  zone: 'command_center' | 'intelligence' | 'commerce' | 'adam_domain'
  status: InvestmentInstitutionStatus
  lastActivityAt?: string
  recentTrace?: string
  linkedEventIds: string[]
  toolIds: InvestmentToolId[]
}

export interface BuildingRecord {
  id: string
  institutionId?: InvestmentInstitutionId
  type: string
  category: 'institutional' | 'functional' | 'trace'
  name: string
  position: { gridX: number; gridY: number }
  status: 'planned' | 'active' | 'upgrading' | 'disabled' | 'memorial'
  constructedAt: string
  reason: string
  linkedEventIds: string[]
  upgradeHistory: Array<{
    at: string
    fromType: string
    toType: string
    reason?: string
  }>
}

export interface ReflectionRecord {
  id: string
  at: string
  content: string
  linkedEventIds: string[]
}

export interface BookRecord {
  id: string
  title: string
  content: string
  author: 'adam' | 'user' | string
  tags?: string[]
  createdAt: string
  linkedEventIds: string[]
}
