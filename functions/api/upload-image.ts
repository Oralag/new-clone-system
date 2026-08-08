// POST /api/upload-image
// body: { data: "data:image/jpeg;base64,..." }
// 存到 AGENT_MEMORY KV，返回 { url: "/api/image/{key}" }

import { verifyErpToken } from '../utils/verifyErpToken'

interface Env {
  AGENT_MEMORY: KVNamespace
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
  }
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: cors() })

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await verifyErpToken(request, env))) {
    return new Response(JSON.stringify({ code: 0, message: '未授权' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...cors() },
    })
  }

  const { data } = await request.json() as { data: string }
  if (!data?.startsWith('data:image/')) {
    return new Response(JSON.stringify({ code: 0, message: '无效图片' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...cors() },
    })
  }

  // base64 → ArrayBuffer
  const base64 = data.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  // 这个接口是品牌页/首页 hero 的正式图床，不是临时素材，绝不能设短 TTL。
  // 原来是 30 天：2026-07-04 传的 3 张首页 hero 图在 08-03 被 KV 自动删除，
  // 小程序首页轮播直接 404，原图无法找回。
  // 对齐 admin-upload.js 的 5 年，等同于永久保存。
  await env.AGENT_MEMORY.put(key, bytes.buffer, { expirationTtl: 60 * 60 * 24 * 365 * 5 })

  return new Response(JSON.stringify({ code: 1, url: `/api/image/${key}` }), {
    headers: { 'Content-Type': 'application/json', ...cors() },
  })
}
