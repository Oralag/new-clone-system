// Cloudflare Pages Function — /api/market-data
// 行情数据代理：新浪财经 + 东方财富，解决前端 CORS 问题

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const eastHeaders = {
  'Referer': 'https://quote.eastmoney.com',
  'User-Agent': CHROME_UA,
  'Accept': '*/*',
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)
  const type = url.searchParams.get('type') || ''
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

  try {
    // ── 指数行情（新浪，任何时间都有最新/最后收盘）──
    if (type === 'indices') {
      const symbols = ['sh000001', 'sz399001', 'sz399006', 'sh000688', 'sh000300']
      const resp = await fetch(`https://hq.sinajs.cn/list=${symbols.join(',')}`, {
        headers: { Referer: 'https://finance.sina.com.cn', 'User-Agent': CHROME_UA },
      })
      const text = await resp.text()
      const names = ['上证指数', '深证成指', '创业板指', '科创50', '沪深300']
      const codes = ['000001.SH', '399001.SZ', '399006.SZ', '000688.SH', '000300.SH']
      const result = text.trim().split('\n').map((line, i) => {
        const match = line.match(/="([^"]+)"/)
        if (!match || !match[1] || match[1] === 'xxx') {
          return { name: names[i], code: codes[i], price: '--', change: 0 }
        }
        const p = match[1].split(',')
        const prev = Number(p[2]), cur = Number(p[3])
        const change = prev > 0 ? ((cur - prev) / prev) * 100 : 0
        return { name: names[i], code: codes[i], price: p[3] || '--', change: Number(change.toFixed(2)) }
      })
      return new Response(JSON.stringify({ ok: true, data: result }), { headers: corsHeaders })
    }

    // ── 涨幅榜 / 跌幅榜（东方财富，带 Chrome UA）──
    if (type === 'gainers' || type === 'losers') {
      const po = type === 'gainers' ? '1' : '0'
      // 去掉 f:!2 过滤，改用宽泛的市场筛选，这样非交易时间也有最后收盘数据
      const url2 = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=${po}&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f2,f3,f12,f14`
      const resp = await fetch(url2, { headers: eastHeaders })
      const json = await resp.json() as any
      const rows = (json?.data?.diff ?? []).slice(0, 10)
      const data = rows.map((r: any) => ({
        name: r.f14,
        code: r.f12,
        price: r.f2 ? (r.f2 / 100).toFixed(2) : '--',
        change: r.f3 ? Number((r.f3 / 100).toFixed(2)) : 0,
      }))
      return new Response(JSON.stringify({ ok: true, data }), { headers: corsHeaders })
    }

    // ── 市场宽度（东方财富，带 Chrome UA，拉全市场涨跌分布）──
    if (type === 'breadth') {
      const url2 = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=5000&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f3,f6`
      const resp = await fetch(url2, { headers: eastHeaders })
      const json = await resp.json() as any
      const rows: any[] = json?.data?.diff ?? []
      let up = 0, flat = 0, down = 0, vol = 0
      for (const r of rows) {
        const chg = r.f3 ?? 0
        if (chg > 0) up++
        else if (chg < 0) down++
        else flat++
        vol += (r.f6 ?? 0)
      }
      return new Response(JSON.stringify({
        ok: true,
        data: { up: String(up), flat: String(flat), down: String(down), volume: (vol / 1e8).toFixed(0) },
      }), { headers: corsHeaders })
    }

    // ── 行业板块热度（东方财富）──
    if (type === 'sectors') {
      const url2 = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f3,f14`
      const resp = await fetch(url2, { headers: eastHeaders })
      const json = await resp.json() as any
      const rows: any[] = json?.data?.diff ?? []
      const data = rows.map((r: any) => ({
        name: r.f14,
        heat: Math.round(50 + Math.min(Math.abs((r.f3 ?? 0) / 100) * 10, 49)),
        level: (r.f3 ?? 0) >= 0 ? 'up' : 'down',
        change_pct: r.f3 != null ? (r.f3 / 100).toFixed(2) + '%' : '0%',
      }))
      return new Response(JSON.stringify({ ok: true, data }), { headers: corsHeaders })
    }

    // ── 北向资金（东方财富）──
    if (type === 'northbound') {
      const resp = await fetch(
        'https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f54,f56',
        { headers: { ...eastHeaders, Referer: 'https://data.eastmoney.com' } }
      )
      const json = await resp.json() as any
      const s2n = (json?.data?.s2n || '').split(';')
      const s3n = (json?.data?.s3n || '').split(';')
      const lastSh = (s2n[s2n.length - 1] || '').split(',')
      const lastSz = (s3n[s3n.length - 1] || '').split(',')
      const shNet = Number(lastSh[3] ?? 0) / 1e8
      const szNet = Number(lastSz[3] ?? 0) / 1e8
      return new Response(JSON.stringify({
        ok: true,
        data: { sh_net: shNet.toFixed(2), sz_net: szNet.toFixed(2), total_net: (shNet + szNet).toFixed(2) },
      }), { headers: corsHeaders })
    }

    // ── 日K线（东方财富 secid 格式：1.000001 沪 / 0.399001 深）──
    if (type === 'kline') {
      const code = url.searchParams.get('code') || '000001'
      const market = url.searchParams.get('market') || '1' // 1=沪 0=深
      const limit = url.searchParams.get('limit') || '90'
      const kurl = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${market}.${code}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&lmt=${limit}&end=20500101`
      const resp = await fetch(kurl, { headers: eastHeaders })
      const json = await resp.json() as any
      const klines: string[] = json?.data?.klines ?? []
      const data = klines.map((k: string) => {
        const p = k.split(',')
        return {
          date: p[0],       // 2024-01-02
          open: Number(p[1]),
          close: Number(p[2]),
          high: Number(p[3]),
          low: Number(p[4]),
          volume: Number(p[5]),
          change: Number(p[8]),  // 涨跌幅%
        }
      })
      return new Response(JSON.stringify({ ok: true, data }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: false, error: '未知 type 参数' }), { status: 400, headers: corsHeaders })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: corsHeaders })
  }
}
