import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'fs'

const outDir = '/Users/oralagborjigin/new-clone-system/tmp/mqcf-xhs-real'
mkdirSync(outDir, { recursive: true })

const img = (p, type = 'jpeg') => `data:image/${type};base64,${readFileSync(p).toString('base64')}`

const assets = {
  milkBarHero: img('/Users/oralagborjigin/new-clone-system/tmp/mqcf-xhs-real/src-milkbar-hero.jpg'),
  milkBarProduct: img('/Users/oralagborjigin/new-clone-system/tmp/mqcf-xhs-real/src-milkbar-product.jpg'),
  milkBarPack: img('/Users/oralagborjigin/Downloads/奶条单品.jpg'),
  riceHero: img('/Users/oralagborjigin/new-clone-system/tmp/mqcf-xhs-real/src-rice-hero.jpg'),
  ricePack: img('/Users/oralagborjigin/new-clone-system/tmp/mqcf-xhs-real/src-rice-pack.jpg'),
  riceProduct: img('/Users/oralagborjigin/Downloads/冻炒米效果图.jpg'),
}

const slides = [
  {
    file: '01-cover.png',
    bg: assets.milkBarHero,
    theme: 'dark',
    pos: 'center bottom',
    badge: '牧区纯坊',
    title: '来自草原的\n第一口奶香',
    body: '内蒙古传统奶食\n奶条 · 冻炒米 · 青砖奶茶',
  },
  {
    file: '02-brand.png',
    bg: assets.riceHero,
    theme: 'light',
    pos: 'center center',
    badge: '品牌亮相',
    title: '把草原儿女\n从小吃到大的奶食',
    body: '做成年轻人也能随手带、慢慢吃、送朋友也体面的日常零食。',
  },
  {
    file: '03-milk-bar.png',
    bg: assets.milkBarProduct,
    theme: 'dark',
    pos: 'center bottom',
    badge: '奶条',
    title: '扎实奶香\n越嚼越香',
    body: '办公室、路上、露营，都能带一袋。不是轻飘飘的甜，是草原奶食的厚实味道。',
  },
  {
    file: '04-rice.png',
    bg: assets.ricePack,
    theme: 'light',
    pos: 'center bottom',
    fit: 'contain',
    badge: '冻炒米',
    title: '脆脆香香\n奶香和谷物香',
    body: '早上搭奶茶，下午当小零食。传统吃法，也可以很日常。',
  },
  {
    file: '05-scene.png',
    bg: assets.milkBarPack,
    theme: 'light',
    pos: 'center center',
    fit: 'contain',
    badge: '日常场景',
    title: '不是猎奇特产\n是日常草原风味',
    body: '办公室零食 / 露营分享 / 旅行伴手礼 / 家里常备',
  },
  {
    file: '06-ending.png',
    bg: assets.riceProduct,
    theme: 'dark',
    pos: 'center center',
    fit: 'contain',
    badge: '牧区纯坊',
    title: '从这一口奶香开始\n认识牧区纯坊',
    body: '#内蒙古特产 #草原奶食 #奶条 #冻炒米 #内蒙伴手礼',
  },
]

function html(slide, index) {
  const isDark = slide.theme === 'dark'
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #111; }
    .card {
      width: 1080px;
      height: 1440px;
      position: relative;
      overflow: hidden;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #17212b;
      background: #f3f7f5;
    }
    .photo-wrap {
      position: absolute;
      left: 34px;
      top: 34px;
      right: 34px;
      height: 842px;
      border-radius: 34px;
      overflow: hidden;
      background: #dfeeed;
      box-shadow: 0 24px 70px rgba(36, 54, 55, .18);
    }
    .photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: ${slide.fit || 'cover'};
      object-position: ${slide.pos || 'center center'};
      display: block;
      transform: scale(1.01);
    }
    .photo-shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.18));
    }
    .grain {
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 20% 15%, rgba(255,255,255,.22), transparent 28%),
        radial-gradient(circle at 80% 78%, rgba(42,123,135,.12), transparent 34%);
      mix-blend-mode: multiply;
      opacity: .42;
    }
    .content {
      position: absolute;
      left: 74px;
      right: 74px;
      bottom: 74px;
      padding: 0;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      height: 48px;
      padding: 0 22px;
      border-radius: 999px;
      background: rgba(255,255,255,.72);
      border: 1px solid rgba(23,33,43,.14);
      backdrop-filter: blur(14px);
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0;
    }
    h1 {
      margin: 28px 0 24px;
      font-size: 88px;
      line-height: 1.06;
      letter-spacing: 0;
      font-weight: 900;
      white-space: pre-line;
    }
    .body {
      max-width: 840px;
      font-size: 34px;
      line-height: 1.48;
      font-weight: 600;
      letter-spacing: 0;
      white-space: pre-line;
    }
    .brand {
      position: absolute;
      top: 56px;
      left: 64px;
      height: 54px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      border-radius: 10px;
      color: #17212b;
      background: rgba(255,255,255,.74);
      border: 1px solid rgba(23,33,43,.12);
      backdrop-filter: blur(12px);
      font-size: 25px;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="photo-wrap">
      <img src="${slide.bg}" />
      <div class="photo-shade"></div>
    </div>
    <div class="grain"></div>
    <div class="brand">牧区纯坊</div>
    <div class="content">
      <div class="badge">${slide.badge}</div>
      <h1>${slide.title}</h1>
      <div class="body">${slide.body}</div>
    </div>
  </div>
</body>
</html>`
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 })

for (const [i, slide] of slides.entries()) {
  await page.setContent(html(slide, i), { waitUntil: 'networkidle' })
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0))
  await page.screenshot({ path: `${outDir}/${slide.file}`, type: 'png' })
}

await browser.close()
console.log(slides.map(s => `${outDir}/${s.file}`).join('\n'))
