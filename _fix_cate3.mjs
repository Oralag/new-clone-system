import XLSX from 'xlsx';

// 1. Excel映射
const wb = XLSX.readFile('/Users/oralagborjigin/Downloads/供应商列表-2026-03-22-195336.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const nameToCategory = {};
json.forEach(r => {
  const name = (r['供应商名称'] || '').trim();
  const cate = (r['分类名称'] || '').trim();
  if (name && cate && cate !== '默认') { nameToCategory[name] = cate; }
});
console.log('Excel非默认供应商数:', Object.keys(nameToCategory).length);

// 2. 获取后端token
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiYWNjb3VudCI6IjE3NzQ3MzQ0NTcxIiwiaWF0IjoxNzc0MTgxMTUwLCJleHAiOjE3NzY3NzMxNTB9.6l8jBgD9DXXSGsUkmdFundW0uNx612HijtEzFlOLaIg';
const BASE = 'https://erp-server-production-b1b6.up.railway.app/adminapi';

// 3. 获取全部供应商
const supResp = await fetch(`${BASE}/procure/supplier/index?list_rows=500`, {
  headers: { 'token': TOKEN },
});
const supData = await supResp.json();
const suppliers = supData?.data?.rows || [];
console.log('API供应商总数:', suppliers.length);

// 4. 建立分类
const cateNames = [...new Set(Object.values(nameToCategory))];
console.log('分类:', cateNames);

const now = Date.now();
const categories = cateNames.map((name, i) => ({
  id: now + i * 3,
  name: name,
}));
const cateName2Id = {};
categories.forEach(c => { cateName2Id[c.name] = c.id; });

// 5. 匹配
const cateMap = {};
let matched = 0;
const unmatched = [];

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

console.log('匹配成功:', matched, '/', suppliers.length);
console.log('未匹配(默认分类):', unmatched);

// 6. 输出浏览器控制台代码
console.log('\n====== 复制以下代码到 nomaderp.pages.dev 浏览器控制台运行 ======\n');

// 需要找到正确的 localStorage key（可能有scope前缀）
const script = `
// 修复供应商分类
(function() {
  var CATES = ${JSON.stringify(categories)};
  var MAP = ${JSON.stringify(cateMap)};

  // 查找所有可能的scope key
  var scopeKey = '';
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.endsWith('erp_supplier_cates')) {
      scopeKey = k.replace('erp_supplier_cates', '');
      break;
    }
  }

  var cateKey = scopeKey + 'erp_supplier_cates';
  var mapKey = scopeKey + 'erp_supplier_cate_map';

  console.log('使用key前缀:', JSON.stringify(scopeKey));

  var existingCates = JSON.parse(localStorage.getItem(cateKey) || '[]');
  var existingMap = JSON.parse(localStorage.getItem(mapKey) || '{}');

  // 合并分类（按名称去重）
  var allCates = existingCates.slice();
  CATES.forEach(function(c) {
    if (!allCates.find(function(x) { return x.name === c.name; })) {
      allCates.push(c);
    }
  });

  // 合并映射
  var allMap = Object.assign({}, existingMap, MAP);

  localStorage.setItem(cateKey, JSON.stringify(allCates));
  localStorage.setItem(mapKey, JSON.stringify(allMap));

  console.log('完成! 分类数:', allCates.length, '关联数:', Object.keys(allMap).length);
  alert('分类修复完成！共' + allCates.length + '个分类，' + Object.keys(allMap).length + '个关联。即将刷新页面。');
  location.reload();
})();
`;
console.log(script);
