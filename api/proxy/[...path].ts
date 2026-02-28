import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'
import http from 'http'

const BACKEND = 'https://erp-backend-production-a349.up.railway.app'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const targetUrl = `${BACKEND}/adminapi/${(req.query.path as string[] || []).join('/')}`

  const options = {
    method: req.method,
    headers: {
      ...req.headers,
      host: 'erp-backend-production-a349.up.railway.app',
    } as any,
  }

  return new Promise<void>((resolve) => {
    const protocol = targetUrl.startsWith('https') ? https : http
    const proxyReq = protocol.request(targetUrl, options, (proxyRes) => {
      res.status(proxyRes.statusCode || 200)
      Object.entries(proxyRes.headers).forEach(([k, v]) => {
        if (v) res.setHeader(k, v as any)
      })
      proxyRes.pipe(res as any)
      proxyRes.on('end', resolve)
    })

    proxyReq.on('error', (e) => {
      res.status(500).json({ error: e.message })
      resolve()
    })

    if (req.body) {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      proxyReq.write(body)
    }
    proxyReq.end()
  })
}
