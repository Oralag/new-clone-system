import XLSX from 'xlsx';
const wb = XLSX.readFile('/Users/oralagborjigin/Downloads/供应商列表-2026-03-22-195336.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const map = {};
json.forEach(r => {
  const name = (r['供应商名称'] || '').trim();
  const cate = (r['分类名称'] || '').trim();
  if (name && cate && cate !== '默认') { map[name] = cate; }
});
console.log(JSON.stringify(map));
