// Cloudflare Pages Function — /api/admin-console
// Super admin API: list/update/delete/provision KV users

import { hashPassword } from '../utils/password.js'

const SUPER_ADMIN = '17747344571'
const TRIAL_BACKEND = 'https://erp-trial.onrender.com'

// Render provisioning
const RENDER_API = 'https://api.render.com/v1'
const RENDER_API_KEY = 'rnd_pziPoNOatsRL10AD3Q8kPnFWcHgS'
const RENDER_OWNER_ID = 'tea-d73qc0fpm1nc738jp830'
const RENDER_REPO = 'https://github.com/Oralag/erp-tenant-server'

// Env vars cloned to every new tenant service
const TENANT_ENV_VARS = [
  { key: 'SERVER_JIANG_KEY', value: 'SCT362437TV0QWjBaAXIqc3NdAHni1MEMB' },
  { key: 'MINI_JWT_SECRET', value: 'mini_secret_2024' },
  { key: 'JWT_SECRET', value: 'erp_secret_2024' },
  { key: 'WX_MCH_PUBLIC_KEY_ID', value: '1F91B9059068C618AEE35CD1102071EBD633CB5C' },
  { key: 'WX_API_V3_KEY', value: 'NomadPay2025abcd1234567890ABCD32' },
  { key: 'WX_MCH_CERT_SERIAL', value: '1F91B9059068C618AEE35CD1102071EBD633CB5C' },
  { key: 'WX_MCH_PRIVATE_KEY', value: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDN5AnfpVCRYuUm\n3+aMlFgOhr0Dik0dSSusCjx7m21+2gNbGVgHFEVsl6RpD/7FqggDwH9zMms1yErr\ncptZ+2PT9aiNDJr958paY9L9N6Cc3KMx6tcCW6e6AWrrTnOUxyT6577IUI+3aJX2\nwE8EvvfkpyjGebcsZdk8s6bMiOl6r9CCwvHeQSYm47TOu3HbpAPV6tlAJ2X3XTdW\nJz6bRT2AGW086qneyD/Sc50ZwaJjjfkhYgRPbRjl2c9NKB4N58EOwuq9+oDtMEug\nyRONK+gCEOgZElBDmzmknNQ5gw39Qr7Vd7TyZsi5Zo0/+hL0yp1IeiQYE8PFfV1i\nOOE9y1M3AgMBAAECggEAFq6st8rKmXm/rQy1pX8iRFdrs1wlKrjI6uclyqhQ48y4\n2exs2jrNey0pm7l7Y+Nbhq5KXDKNxRsPxeiWXM9pLAzASOm+mYJTtKmSsPrT4vQb\ntoAct9HJJKDLWqkF6roVxN6LEh5t9tK60rhU/Dzdqn8P6u211FpUGG/iTF44+p75\nT215L1LOQEn4eqxXAAObULyBU0/mT2DQz6yC1SkrFiDC6DgFOhFCMNZOsinN6gjB\nK8FM19aIZEn2l7dNsLoP+qWO0FLGcjE2k1pXB/xtJPWpt++LdMtH73KqrTK3X0VN\nCugQrlmH9JC19fe+dW8NRIWqpJZrfDmyoNg8+xKmQQKBgQDnVzdOeywYI/D7zIq1\n6pjpXZos6uY12P5kjwheKpomQr4Gnh7DlM6sC1s0NYDvNfNRT8v7a557DSFGzQx1\n606KH4kPeG5IJa+bwE95yaeJDeZ/pe1wRE708W1Bc9PZ5+7hyEOv/AjjgHJ747/7\nD9bKfa+SJ5/CxltEdhQTqK4QjwKBgQDj1lmNF3z1geBmTMNTQoCPm6MAleKH75kb\nqQGSO8QvhGsbaqRHObfm0JSGqKrI4jLdjbRdYRBGYVwZ0JlomFMgW8/b6gMeFM+o\ne1GpkOdTs0Ank9yQa2pzsK63y07hwKHboD1lCUsXo5Wplr3WL6RyFJRr2XB0ono2\nncC/2X0W2QKBgCN2LRYsr1+r8r7GZeTo5zOuk3mbMFrEvoovmrrEkQiYZoShLFoS\nr3OT8hEYuoDwpjGqp7wMjSiTpKwztltFDK8DkoD6lv0cOcUIP6aNkM7jgJfEmZcC\nAZBuia7k0G6wrN+TUTzix4IIKIRxLvaPQP+dMJKY3FaBDXB7ISy6SKRlAoGALLim\nW0uA+6/CnFH1BSLImWezVyoUjRo6s3M5G7sfhzQ20erc1B5AOs42WThCTawYz+RA\nwxOKXkY+DdMkSaOcrX1YD5KfiggLusZ6AQ6wWX2V2i7r3G05N/w2T11Y3ncxTirl\n4i8wzjMN7XvpR2GSpdHkUEceC8bYtl/Atee65gECgYA+55Cx07+Ac0osAM7N4Itp\nFSl6DVpnEsN+iff40rpNeAW5B6/ouwb7tQf9jKJ6U8qk884hAKjYjQ+AQ6Yx/aBv\nKVx25M2HTHlpcEO/xBBbxdEohc0RRJUR0kFjkDzAttUUZ1mgjtlJqsY/NbD+4Ux+\nI7UtjtI0H9rdN15IcOqS1w==\n-----END PRIVATE KEY-----' },
  { key: 'WX_MCH_KEY', value: 'NomadErp2024abcd1234567890ABCD12' },
  { key: 'WX_MCH_ID', value: '1113256251' },
  { key: 'WX_SECRET', value: '1b45e9d6b2c53290dfa187bd9b3dcc60' },
  { key: 'WX_APPID', value: 'wxdbe895428fd5c21a' },
  { key: 'DATABASE_URL', value: 'postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' },
  { key: 'TMPL_SHIP', value: 'VRGjj2gRUbSCsqnotvELCxTmnjdEKlwDGZTl5uQKpbY' },
  { key: 'TMPL_ORDER_SUCCESS', value: 'bnI7jhWQ9yyp3L13iNYFDDwbWX6mCZhehnIrnrLYBMA' },
  { key: 'TMPL_REFUND', value: 'idWtbUy1jgmG7iaA_Cp610LKjqCGkHETsuUIkbmv4hY' },
]

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function decodeToken(wrapped) {
  try {
    if (!wrapped || !wrapped.startsWith('erp_')) return null
    const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
    return JSON.parse(json)
  } catch { return null }
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const token = request.headers.get('x-admin-token') || ''
  const payload = decodeToken(token)
  if (!payload || payload.a !== SUPER_ADMIN) {
    return jsonRes({ code: 0, message: '无权限' }, 403)
  }

  const kv = env.USERS_KV
  if (!kv) return jsonRes({ code: 0, message: 'KV未配置' }, 500)

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'list'

  // ── LIST ──────────────────────────────────────────────────────────────────
  if (request.method === 'GET' && action === 'list') {
    const TRIAL_DAYS = 15
    const list = await kv.list({ prefix: 'user:' })
    const users = []
    for (const key of list.keys) {
      const raw = await kv.get(key.name)
      if (raw) {
        const user = JSON.parse(raw)
        let trialDaysLeft = null
        if (user.trial_start_at) {
          const elapsed = Date.now() - new Date(user.trial_start_at).getTime()
          trialDaysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed / 86400000))
        }
        users.push({
          mobile: user.mobile,
          company_name: user.company_name,
          backend_url: user.backend_url || null,
          status: user.status || 'active',
          created_at: user.created_at,
          is_paid: !!user.backend_url,
          trial_start_at: user.trial_start_at || null,
          trial_expire_at: user.trial_expire_at || null,
          trial_days_left: trialDaysLeft,
          plan_label: user.plan_label || null,
          paid_until: user.paid_until || null,
          provisioning: user.provisioning || null,
        })
      }
    }
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return jsonRes({ code: 1, data: users })
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  if (request.method === 'POST' && action === 'update') {
    const body = await request.json()
    const { mobile, backend_url, status, password, plan_label, paid_until } = body
    if (!mobile) return jsonRes({ code: 0, message: '缺少mobile' })

    const raw = await kv.get(`user:${mobile}`)
    if (!raw) return jsonRes({ code: 0, message: '用户不存在' })

    const user = JSON.parse(raw)

    // Upgrading to paid with no custom backend → use shared tier
    if (paid_until && !backend_url && !user.backend_url) {
      user.backend_url = TRIAL_BACKEND
      fetch(`${TRIAL_BACKEND}/adminapi/login/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: user.company_name, account: mobile, password: user.password }),
      }).catch(() => {})
    } else if (backend_url !== undefined) {
      user.backend_url = backend_url || null
    }

    if (status !== undefined) user.status = status
    if (password) user.password = await hashPassword(password)
    if (plan_label !== undefined) user.plan_label = plan_label
    if (paid_until !== undefined) user.paid_until = paid_until
    user.updated_at = new Date().toISOString()

    await kv.put(`user:${mobile}`, JSON.stringify(user))
    return jsonRes({ code: 1, message: '更新成功' })
  }

  // ── PROVISION — create dedicated free Render service ──────────────────────
  if (request.method === 'POST' && action === 'provision') {
    const body = await request.json()
    const { mobile, plan_label, paid_until } = body
    if (!mobile) return jsonRes({ code: 0, message: '缺少mobile' })

    const raw = await kv.get(`user:${mobile}`)
    if (!raw) return jsonRes({ code: 0, message: '用户不存在' })
    const user = JSON.parse(raw)

    const serviceName = `erp-tenant-${mobile}`

    const renderRes = await fetch(`${RENDER_API}/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        type: 'web_service',
        name: serviceName,
        ownerId: RENDER_OWNER_ID,
        repo: RENDER_REPO,
        branch: 'main',
        serviceDetails: {
          env: 'docker',
          plan: 'free',
          region: 'singapore',
          healthCheckPath: '/health',
          pullRequestPreviewsEnabled: 'no',
          previews: { generation: 'off' },
          envSpecificDetails: {
            dockerfilePath: './Dockerfile',
            dockerContext: '.',
            dockerCommand: '',
          },
        },
        envVars: TENANT_ENV_VARS,
      }),
    })

    const renderData = await renderRes.json()
    const service = renderData.service || renderData
    if (!service?.id) {
      return jsonRes({ code: 0, message: `Render创建失败: ${renderData.message || JSON.stringify(renderData).slice(0, 200)}` })
    }

    // Save provisioning state to KV
    user.provisioning = {
      service_id: service.id,
      service_name: serviceName,
      status: 'deploying',
      started_at: new Date().toISOString(),
    }
    if (plan_label) user.plan_label = plan_label
    if (paid_until) user.paid_until = paid_until
    user.updated_at = new Date().toISOString()
    await kv.put(`user:${mobile}`, JSON.stringify(user))

    return jsonRes({ code: 1, message: '独立服务器创建中，约3分钟完成', data: { service_id: service.id, status: 'deploying' } })
  }

  // ── PROVISION-STATUS — poll Render deploy, complete setup when live ────────
  if (request.method === 'GET' && action === 'provision-status') {
    const mobile = url.searchParams.get('mobile')
    if (!mobile) return jsonRes({ code: 0, message: '缺少mobile' })

    const raw = await kv.get(`user:${mobile}`)
    if (!raw) return jsonRes({ code: 0, message: '用户不存在' })
    const user = JSON.parse(raw)

    // Already live
    if (user.backend_url && !user.provisioning) {
      return jsonRes({ code: 1, data: { status: 'live', url: user.backend_url } })
    }

    if (!user.provisioning?.service_id) {
      return jsonRes({ code: 0, message: '没有待完成的部署' })
    }

    const { service_id } = user.provisioning

    // Get latest deploy status
    const deploysRes = await fetch(`${RENDER_API}/services/${service_id}/deploys?limit=1`, {
      headers: { 'Authorization': `Bearer ${RENDER_API_KEY}` },
    })
    const deploysData = await deploysRes.json()
    const latestDeploy = deploysData[0]?.deploy

    if (!latestDeploy) {
      return jsonRes({ code: 1, data: { status: 'deploying', message: '正在初始化服务...' } })
    }

    const deployStatus = latestDeploy.status

    if (deployStatus === 'build_failed' || deployStatus === 'canceled') {
      return jsonRes({ code: 0, message: `部署失败 (${deployStatus})，请重试` })
    }

    if (deployStatus === 'live') {
      // Get the service URL
      const serviceRes = await fetch(`${RENDER_API}/services/${service_id}`, {
        headers: { 'Authorization': `Bearer ${RENDER_API_KEY}` },
      })
      const serviceData = await serviceRes.json()
      const svc = serviceData.service || serviceData
      const serviceUrl = svc.serviceDetails?.url

      if (!serviceUrl) {
        return jsonRes({ code: 1, data: { status: 'deploying', message: '等待服务地址...' } })
      }

      // Complete setup: update KV
      user.backend_url = serviceUrl
      user.provisioning = null
      user.updated_at = new Date().toISOString()
      await kv.put(`user:${mobile}`, JSON.stringify(user))

      return jsonRes({ code: 1, data: { status: 'live', url: serviceUrl } })
    }

    // In progress
    const statusLabel = {
      created: '排队中...',
      build_in_progress: '构建中...',
      update_in_progress: '更新中...',
    }[deployStatus] || `部署中 (${deployStatus})...`

    return jsonRes({ code: 1, data: { status: 'deploying', message: statusLabel } })
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (request.method === 'DELETE' && action === 'delete') {
    const body = await request.json()
    const { mobile } = body
    if (!mobile) return jsonRes({ code: 0, message: '缺少mobile' })
    await kv.delete(`user:${mobile}`)
    return jsonRes({ code: 1, message: '已删除' })
  }

  return jsonRes({ code: 0, message: '未知操作' }, 400)
}
