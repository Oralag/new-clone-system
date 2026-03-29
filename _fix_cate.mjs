import XLSX from 'xlsx';
import https from 'https';
import http from 'http';

// 1. 读取Excel，建立 供应商名称 -> 分类名称 映射
const wb = XLSX.readFile('/Users/oralagborjigin/Downloads/供应商列表-2026-03-22-195336.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const nameToCategory = {};
json.forEach(r => {
  const name = (r['供应商名称'] || '').trim();
  const cate = (r['分类名称'] || '').trim();
  if (name && cate && cate !== '默认') {
    nameToCategory[name] = cate;
  }
});

console.log('Excel中非默认分类的供应商数:', Object.keys(nameToCategory).length);

// 统计分类
const cateSet = new Set(Object.values(nameToCategory));
console.log('需要建立的分类:', [...cateSet]);

// 2. 从ERP API获取已导入的供应商列表
const TOKEN = '81dc3ea0-0344-11f0-9e32-6d5cc265db94';
const BASE = 'https://nomaderp.pages.dev/adminapi';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    https.get(url, { headers: { 'token': TOKEN } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// 获取所有供应商
const supRes = await apiGet('/procure/supplier/index?list_rows=500');
const suppliers = supRes?.data?.rows || supRes?.data?.list || [];
console.log('API中供应商总数:', suppliers.length);

// 3. 建立分类和映射
const categories = [...cateSet].map((name, i) => ({
  id: Date.now() + i,
  name: name
}));

// 等一下确保id不重复
await new Promise(r => setTimeout(r, 10));

const cateName2Id = {};
categories.forEach(c => { cateName2Id[c.name] = c.id; });

console.log('\n建立的分类:');
categories.forEach(c => console.log(`  ${c.id} -> ${c.name}`));

// 4. 建立供应商ID -> 分类ID的映射
const cateMap = {};
let matched = 0;
let unmatched = [];

for (const sup of suppliers) {
  const supName = (sup.name || '').trim();
  if (nameToCategory[supName]) {
    const cateId = cateName2Id[nameToCategory[supName]];
    if (cateId) {
      cateMap[sup.id] = cateId;
      matched++;
    }
  } else {
    unmatched.push(supName);
  }
}

console.log('\n匹配成功:', matched);
console.log('未匹配(默认/不在Excel中):', unmatched.length);
if (unmatched.length > 0) {
  console.log('未匹配的供应商:', unmatched.slice(0, 10).join(', '), unmatched.length > 10 ? '...' : '');
}

// 5. 输出需要写入localStorage的数据
console.log('\n=== 写入数据 ===');
console.log('CATES:', JSON.stringify(categories));
console.log('CATEMAP:', JSON.stringify(cateMap));
