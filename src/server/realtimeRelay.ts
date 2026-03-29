/**
 * OpenAI Realtime API WebSocket 中继服务器
 * 浏览器 ↔ 本中继 ↔ OpenAI Realtime API
 * - 保护 API Key
 * - 拦截 tool call，调用 ERP API 后返回结果
 */
import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { realtimeTools } from './realtimeTools'
import { executeTool } from './tools/toolExecutor'
import { getSystemPrompt } from './agents/orchestrator'

const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17'
const MAX_CALL_DURATION_MS = 5 * 60 * 1000 // 5 分钟通话限制

let wss: WebSocketServer | null = null

function getVoiceSystemPrompt(): string {
  const base = getSystemPrompt('general')
  return base + `\n\n【语音模式补充规则】
- 你正在通过语音与用户实时对话，请用简洁口语化的中文回复
- 不要使用 markdown 格式、表格、代码块等文字排版
- 数字和金额直接说出来，如"三千五百元"而不是"3,500元"
- 列表内容用"第一、第二"等口语化方式表达
- 回复尽量简短，一两句话说清楚要点`
}

function ensureWss(): WebSocketServer {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true })
  }
  return wss
}

export function handleRealtimeUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
    socket.destroy()
    return
  }

  const server = ensureWss()

  // 从 query string 提取 ERP token
  const url = new URL(req.url || '', 'http://localhost')
  const erpToken = url.searchParams.get('token') || ''

  server.handleUpgrade(req, socket, head, (clientWs) => {
    server.emit('connection', clientWs, req)

    let openaiWs: WebSocket | null = null
    let callTimer: ReturnType<typeof setTimeout> | null = null

    // 连接 OpenAI Realtime API
    openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    })

    openaiWs.on('open', () => {
      // 配置 session
      const sessionUpdate = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: getVoiceSystemPrompt(),
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          tools: realtimeTools,
          tool_choice: 'auto',
        },
      }
      openaiWs!.send(JSON.stringify(sessionUpdate))

      // 通话时长限制
      callTimer = setTimeout(() => {
        const msg = { type: 'erp.call_timeout', message: '通话已达5分钟限制' }
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(msg))
          clientWs.close()
        }
      }, MAX_CALL_DURATION_MS)
    })

    // OpenAI → 客户端：转发事件 + 拦截 tool call
    openaiWs.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString())
        const { type } = msg

        // 拦截 function_call：服务端执行 ERP 工具
        if (type === 'response.output_item.done' && msg.item?.type === 'function_call') {
          const { call_id, name, arguments: argsStr } = msg.item
          const args = JSON.parse(argsStr || '{}')

          // 通知客户端工具开始
          sendToClient(clientWs, { type: 'erp.tool_start', name, input: args })

          try {
            const result = await executeTool(name, args, erpToken)
            // 发送工具结果给 OpenAI
            openaiWs!.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id,
                output: result,
              },
            }))
            // 触发 OpenAI 继续回复
            openaiWs!.send(JSON.stringify({ type: 'response.create' }))
            // 通知客户端工具完成
            sendToClient(clientWs, { type: 'erp.tool_result', name, result, status: 'success' })
          } catch (err: any) {
            const errMsg = err.message || '工具执行失败'
            openaiWs!.send(JSON.stringify({
              type: 'conversation.item.create',
              item: { type: 'function_call_output', call_id, output: `错误: ${errMsg}` },
            }))
            openaiWs!.send(JSON.stringify({ type: 'response.create' }))
            sendToClient(clientWs, { type: 'erp.tool_result', name, result: errMsg, status: 'error' })
          }
          return // 不转发原始 function_call 给客户端
        }

        // 转发其他事件给客户端
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data.toString())
        }
      } catch {
        // 非 JSON 消息直接转发
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data.toString())
        }
      }
    })

    // 客户端 → OpenAI：转发音频帧和其他事件
    clientWs.on('message', (data) => {
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(data.toString())
      }
    })

    // 清理
    const cleanup = () => {
      if (callTimer) clearTimeout(callTimer)
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) openaiWs.close()
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close()
    }

    clientWs.on('close', cleanup)
    clientWs.on('error', cleanup)
    openaiWs.on('close', () => {
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close()
    })
    openaiWs.on('error', (err) => {
      sendToClient(clientWs, { type: 'erp.error', message: `OpenAI 连接错误: ${err.message}` })
      cleanup()
    })
  })
}

function sendToClient(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

