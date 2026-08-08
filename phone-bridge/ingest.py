#!/usr/bin/env python3
"""账单解析 —— 微信支付 / 支付宝 / 银行流水 CSV → 统一支出记录。

三家的 CSV 都是「若干行说明 + 真正的表头 + 数据」，且编码不一（微信 UTF-8-sig，
支付宝常见 GBK）。所以表头行是动态探测的，不写死行号。

用法：
    python3 ingest.py 账单.csv              # 只解析预览
    python3 ingest.py 账单.csv --to-erp     # 解析 + 写 ERP（dry-run）
    python3 ingest.py 账单.csv --to-erp --commit   # 真正写入
"""

import csv
import io
import re
import sys
from pathlib import Path

# 商家关键词 → ERP 费用科目。按需扩充。
CATEGORY_RULES = [
    (r"顺丰|圆通|中通|申通|韵达|京东物流|极兔|快递|物流", "物流运费"),
    (r"滴滴|高德|出租|地铁|公交|加油|中国石化|中国石油|停车", "交通费"),
    (r"美团|饿了么|餐饮|饭店|酒楼|咖啡|星巴克|瑞幸", "餐饮费"),
    (r"移动|联通|电信|话费|宽带", "通讯费"),
    (r"电费|水费|燃气|物业", "水电物业"),
    (r"淘宝|天猫|京东|拼多多|1688|阿里巴巴", "采购支出"),
    (r"广告|推广|投流|巨量|千川|抖音来客", "推广费"),
    (r"房租|租金", "房租"),
    (r"工资|薪资|劳务", "人工成本"),
    (r"包装|纸箱|标签|印刷", "包装材料"),
]

DEFAULT_CATEGORY = "其他支出"


def categorize(counterparty, product):
    text = f"{counterparty} {product}"
    for pattern, cat in CATEGORY_RULES:
        if re.search(pattern, text):
            return cat
    return DEFAULT_CATEGORY


def _read_text(path):
    raw = Path(path).read_bytes()
    for enc in ("utf-8-sig", "gbk", "gb18030", "utf-8"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def _find_header(lines):
    """找到真正的表头行号 —— 含「交易时间」或「交易创建时间」且含「金额」的那行。"""
    for i, line in enumerate(lines):
        if ("交易时间" in line or "交易创建时间" in line or "交易日期" in line) and "金额" in line:
            return i
    return 0


def _pick(row, *names):
    """按候选列名取值，容忍列名里的空格和全角括号差异。"""
    norm = {re.sub(r"[\s　]", "", k or ""): (v or "").strip() for k, v in row.items()}
    for n in names:
        key = re.sub(r"[\s　]", "", n)
        for k, v in norm.items():
            if k.startswith(key):
                return v
    return ""


def parse(path):
    """返回统一格式的支出列表：{date, amount, counterparty, product, key, source, category}"""
    text = _read_text(path)
    lines = text.splitlines()
    start = _find_header(lines)
    reader = csv.DictReader(io.StringIO("\n".join(lines[start:])))

    out = []
    for row in reader:
        if not row or all(not (v or "").strip() for v in row.values()):
            continue

        direction = _pick(row, "收/支", "收支类型", "资金状态")
        # 只要支出；退款/收入/不计收支一律跳过
        if direction and not re.search(r"支出|支付", direction):
            continue

        amt_raw = _pick(row, "金额(元)", "金额（元）", "金额", "发生额")
        amt = re.sub(r"[^\d.\-]", "", amt_raw)
        if not amt:
            continue
        try:
            amount = abs(float(amt))
        except ValueError:
            continue
        if amount == 0:
            continue

        status = _pick(row, "当前状态", "交易状态")
        if re.search(r"已全额退款|交易关闭|已关闭|失败", status):
            continue

        dt = _pick(row, "交易时间", "交易创建时间", "交易日期", "付款时间")
        date = re.sub(r"[/年月]", "-", dt.strip())[:10].replace("日", "")
        if not re.match(r"\d{4}-\d{2}-\d{2}", date):
            continue

        counterparty = _pick(row, "交易对方", "对方账户", "商户名称")
        product = _pick(row, "商品", "商品名称", "商品说明", "摘要")
        key = _pick(row, "交易单号", "交易号", "流水号") or f"{date}-{amount}-{counterparty[:8]}"
        key = key.strip().lstrip("\t")

        out.append({
            "date": date,
            "amount": amount,
            "counterparty": counterparty,
            "product": product,
            "key": key,
            "source": _pick(row, "支付方式", "交易来源地") or Path(path).stem,
            "category": categorize(counterparty, product),
        })
    return out


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return
    path = args[0]
    to_erp = "--to-erp" in args
    commit = "--commit" in args

    records = parse(path)
    if not records:
        print("⚠️  没解析出任何支出记录 —— 检查文件是不是账单 CSV，或表头格式变了")
        return

    total = sum(r["amount"] for r in records)
    print(f"\n解析到 {len(records)} 笔支出，合计 ¥{total:,.2f}\n")

    by_cat = {}
    for r in records:
        by_cat.setdefault(r["category"], []).append(r["amount"])
    print("按科目汇总：")
    for cat, amts in sorted(by_cat.items(), key=lambda x: -sum(x[1])):
        print(f"  {cat:<10} {len(amts):>3} 笔   ¥{sum(amts):>10,.2f}")

    print("\n明细（前 15 条）：")
    for r in records[:15]:
        print(f"  {r['date']}  ¥{r['amount']:>9,.2f}  [{r['category']}]  {r['counterparty'][:18]} {r['product'][:20]}")

    if not to_erp:
        print("\n加 --to-erp 可推送到 ERP（默认 dry-run，不写库）")
        return

    import erp
    token = erp.login()
    done = erp.existing_keys(token)
    print(f"\nERP 已有 {len(done)} 条带幂等键的记录，开始比对…\n")

    new, skipped = 0, 0
    for r in records:
        if r["key"] in done:
            skipped += 1
            continue
        remark = f"{r['counterparty']} {r['product']}".strip() or r["source"]
        res = erp.create_expense(
            token, r["category"], r["amount"], r["date"], remark, r["key"], commit=commit
        )
        ok = res.get("code") == 1
        tag = "写入" if commit else "待写"
        print(f"  {'✅' if ok else '❌'} {tag}  {r['date']}  ¥{r['amount']:>9,.2f}  {r['category']:<8} {remark[:24]}"
              + ("" if ok else f"  ← {res.get('message')}"))
        new += 1

    print(f"\n新增 {new} 笔，跳过重复 {skipped} 笔")
    if not commit:
        print("⚠️  这是 dry-run，ERP 未写入。确认无误后加 --commit 真正入账。")


if __name__ == "__main__":
    main()
