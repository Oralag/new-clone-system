// Cloudflare Pages Function — Speech to text via SiliconFlow Whisper API

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() })
  }

  const apiKey = env.SILICONFLOW_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 SILICONFLOW_API_KEY' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const formData = await request.formData()
    const audioBlob = formData.get('audio')
    if (!audioBlob) {
      return new Response(JSON.stringify({ error: '未收到音频数据' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const sf = new FormData()
    sf.append('file', audioBlob, 'audio.webm')
    sf.append('model', 'FunAudioLLM/SenseVoiceSmall')

    const res = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: sf,
    })

    const result = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result?.message || '转写失败' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    return new Response(JSON.stringify({ text: result.text || '' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || '服务器错误' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
