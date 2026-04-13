import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from './_lib/kv'

function uid(req: VercelRequest): number | null {
  const t = (req.headers['x-user-id'] as string) || ''
  if (t) return parseInt(t)
  const tok = ((req.headers['token'] || '') as string)
  if (tok.startsWith('local_')) {
    try { const p = JSON.parse(Buffer.from(tok.slice(6), 'base64').toString()); return p.admin_id || p.id } catch { return null }
  }
  try {
    const parts = tok.split('.')
    if (parts.length === 3) {
      const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const pad = raw + '='.repeat((4 - raw.length % 4) % 4)
      const p = JSON.parse(Buffer.from(pad, 'base64').toString())
      return p.admin_id || p.user_id || p.id || null
    }
  } catch {}
  return null
}

function rjson(res: VercelResponse, data: unknown, code = 1, message = '') { res.json({ code, data, message }) }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,token,Authorization,x-user-id')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  const userId = uid(req)
  const path = ((req.query.path as string[]) || []).join('/')

  // POST /api/ai/parse
  if (path === 'parse' && req.method === 'POST') {
    const { message } = req.body || {}
    if (!message?.trim()) { rjson(res, null, 0, '消息内容为空'); return }
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) { rjson(res, { type: 'chat', response: 'AI 服务未配置，请联系管理员', confidence: 1 }); return }

    const systemPrompt = `你是企业ERP业务助手。用户用自然语言描述业务操作，解析为JSON格式回复。

回复格式（仅JSON，无其他内容）：
{"type":"sale","confidence":0.92,"parsed":{"type":"sale","params":{"customer_name":"客户名","goods_name":"商品名","quantity":5,"unit":"箱","amount":200}}}

type可选：sale-销售出库, procure-采购入库, warehouse_in-其他入库, warehouse_out-其他出库, stock_query-库存查询, task-任务, chat-闲聊

闲聊回复：
{"type":"chat","confidence":1,"response":"好的，请问有什么需要帮忙的？"}
`
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-20250514', max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: message }] }),
      })
      const data = await aiRes.json()
      const text = data?.content?.[0]?.text || ''
      const m = text.match(/\{[\s\S]*\}/)
      if (m) {
        try { const parsed = JSON.parse(m[0]); rjson(res, parsed); return } catch {}
      }
      rjson(res, { type: 'chat', response: text || '收到消息', confidence: 1 }); return
    } catch (e: any) { rjson(res, { type: 'chat', response: `AI 解析失败：${e.message}`, confidence: 0 }); return }
  }

  // POST /api/ai/confirm-order
  if (path === 'confirm-order' && req.method === 'POST') {
    if (!userId) { rjson(res, null, 0, '请先登录'); return }
    const { parsed, source = 'ai_bot', group_id } = req.body || {}
    if (!parsed) { rjson(res, null, 0, '缺少解析数据'); return }
    const typeLabels: Record<string, string> = { sale: '销售出库', procure: '采购入库', stock_query: '库存查询', task: '任务' }
    const label = typeLabels[parsed.type] || 'AI录入'
    const logs: any[] = (await kv.get('operation_logs')) || []
    logs.push({ id: Date.now(), user_id: userId, action_type: 'ai_input', action_name: `AI录入${label}（待审核）`, detail: { source: 'ai', parsed_type: parsed.type, params: parsed.params || {}, status: 'pending_review' }, created_at: new Date().toISOString() })
    if (logs.length > 5000) logs.splice(0, logs.length - 5000)
    await kv.set('operation_logs', logs)
    if (group_id) {
      const msgs: any[] = (await kv.get('chat_messages')) || []
      msgs.push({ id: Date.now() + 1, group_id, sender_id: 0, sender_name: 'AI管家', type: 'ai_reply', content: `✅ 已录入系统，等待管理员审核后生效。\n\n📋 ${label}\n商品：${parsed.params?.goods_name || '-'}\n数量：${parsed.params?.quantity || '-'} ${parsed.params?.unit || '箱'}\n${parsed.params?.amount ? `金额：¥${parsed.params.amount}` : ''}`, metadata: { parsed, confirmed: true }, created_at: new Date().toISOString() })
      await kv.set('chat_messages', msgs)
    }
    rjson(res, { success: true, message: '已录入，等待审核' }); return
  }

  rjson(res, null, 0, '接口不存在')
}
