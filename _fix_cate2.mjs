import XLSX from 'xlsx';

// 1. 读取Excel映射
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

// 2. 登录获取token
const loginResp = await fetch('https://nomaderp.pages.dev/adminapi/login/account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ account: '17747344571', password: 'Oral6421' }),
});
const loginData = await loginResp.json();
if (loginData.code !== 1) {
  console.error('登录失败:', loginData.message);
  process.exit(1);
}
const token = loginData.data.token;
console.log('登录成功, token:', token.substring(0, 20) + '...');

// 3. 获取所有供应商
const supResp = await fetch('https://nomaderp.pages.dev/adminapi/procure/supplier/index?list_rows=500', {
  headers: { 'token': token },
});
const supData = await supResp.json();
const suppliers = supData?.data?.rows || supData?.data?.list || [];
console.log('API供应商总数:', suppliers.length);

if (suppliers.length === 0) {
  console.log('Raw response:', JSON.stringify(supData).substring(0, 500));
  process.exit(1);
}

// 4. 读取现有localStorage作用域的key前缀
// 分类存储用的是 readScopedJson，需要知道实际的key
// 从代码看: readScopedJson/writeScopedJson 使用 erp_supplier_cates 和 erp_supplier_cate_map
// 但是 scopedJson 可能给 key 加了前缀。我们看看代码...

// 5. 建立分类
const cateNames = [...new Set(Object.values(nameToCategory))];
console.log('分类列表:', cateNames);

const categories = cateNames.map((name, i) => ({
  id: Date.now() + i * 3,
  name: name,
}));

const cateName2Id = {};
categories.forEach(c => { cateName2Id[c.name] = c.id; });

// 6. 匹配供应商
const cateMap = {};
let matched = 0;
const unmatchedNames = [];

for (const sup of suppliers) {
  const supName = (sup.name || '').trim();
  if (nameToCategory[supName]) {
    const cateId = cateName2Id[nameToCategory[supName]];
    if (cateId) {
      cateMap[sup.id] = cateId;
      matched++;
    }
  } else {
    unmatchedNames.push(supName);
  }
}

console.log('匹配成功:', matched);
console.log('未匹配:', unmatchedNames.length, unmatchedNames.length > 0 ? unmatchedNames : '');

// 7. 输出JS代码，可以在浏览器控制台中运行
console.log('\n====== 以下代码复制到浏览器控制台运行 ======\n');
const script = `
// 自动建立供应商分类并关联
(function() {
  const CATES = ${JSON.stringify(categories)};
  const MAP = ${JSON.stringify(cateMap)};

  // 读取现有数据（合并而非覆盖）
  const scopeKey = localStorage.getItem('erp_storage_scope') || '';
  const cateKey = scopeKey ? scopeKey + ':erp_supplier_cates' : 'erp_supplier_cates';
  const mapKey = scopeKey ? scopeKey + ':erp_supplier_cate_map' : 'erp_supplier_cate_map';

  const existingCates = JSON.parse(localStorage.getItem(cateKey) || '[]');
  const existingMap = JSON.parse(localStorage.getItem(mapKey) || '{}');

  // 合并分类（按名称去重）
  const allCates = [...existingCates];
  for (const c of CATES) {
    if (!allCates.find(x => x.name === c.name)) allCates.push(c);
  }

  // 合并映射
  const allMap = { ...existingMap, ...MAP };

  localStorage.setItem(cateKey, JSON.stringify(allCates));
  localStorage.setItem(mapKey, JSON.stringify(allMap));

  console.log('Done! 分类:', allCates.length, '关联:', Object.keys(allMap).length);
  console.log('刷新页面即可看到效果');
  location.reload();
})();
`;
console.log(script);
