#!/usr/bin/env python3
"""ERP 写入通道 —— 登录、查费用、建费用。

字段结构已对真实 API 核实（2026-08-05）：
  GET  /finance/Expense/index  -> {id, expense_no, name, amount, expense_date,
                                   fund_id, fund_name, remark, status, shop_id}
  POST /finance/Expense/add    <- {name, amount, expense_date, remark, order_sn}

铁律：默认 dry-run，不写库。要真写必须显式 --commit。
"""

import json
import os
import ssl
import urllib.request
import urllib.error
from pathlib import Path

# python.org 版 Python 不带系统 CA，直接用 certifi 的证书包，
# 免得每台机器都要手动跑 Install Certificates.command
try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

BASE = os.environ.get("ERP_BASE", "https://erp-server-xsji.onrender.com/adminapi")
ACCOUNT = os.environ.get("ERP_ACCOUNT", "17747344571")
PASSWORD = os.environ.get("ERP_PASSWORD", "")
TOKEN_CACHE = Path(__file__).parent / ".token"

# 资金账户（核实自 /finance/Fund/index）
FUNDS = {
    7: "公司支出账户",
    8: "孟根",
    9: "乌日力格",
    10: "乌日力格/额外支出",
    58: "公司收入账号",
    59: "零售收款账户",
}


def _req(path, method="GET", body=None, token=None, timeout=90):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("token", token)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"code": 0, "message": f"HTTP {e.code}: {e.read().decode()[:200]}"}


def login(force=False):
    """登录拿 token，缓存到 .token。Render 免费版冷启动约 50 秒，故 timeout 给足。"""
    if not force and TOKEN_CACHE.exists():
        tok = TOKEN_CACHE.read_text().strip()
        if tok and _req("/finance/Fund/index?page=1&limit=1", token=tok).get("code") == 1:
            return tok
    pwd = PASSWORD or input("ERP 密码: ").strip()
    res = _req("/login/account", "POST", {"account": ACCOUNT, "password": pwd}, timeout=120)
    if res.get("code") != 1:
        raise SystemExit(f"登录失败：{res.get('message')}")
    d = res.get("data", {})
    tok = d.get("userInfo", {}).get("token") or d.get("token")
    TOKEN_CACHE.write_text(tok)
    TOKEN_CACHE.chmod(0o600)
    return tok


def list_expenses(token, limit=200):
    res = _req(f"/finance/Expense/index?page=1&limit={limit}", token=token)
    return res.get("data", {}).get("rows", []) if res.get("code") == 1 else []


def existing_keys(token):
    """已入账的幂等键集合。键以 #KEY:xxx 形式嵌在 remark 里，避免重复记账。"""
    keys = set()
    for row in list_expenses(token, limit=500):
        remark = str(row.get("remark", ""))
        if "#KEY:" in remark:
            keys.add(remark.split("#KEY:")[1].split()[0])
    return keys


def create_expense(token, name, amount, date, remark, key, commit=False):
    """建一条费用单。key 是幂等键（如微信交易单号），写进 remark 供去重。"""
    payload = {
        "name": name,
        "amount": round(float(amount), 2),
        "expense_date": date,
        "remark": f"{remark} #KEY:{key}".strip(),
        "order_sn": "",
    }
    if not commit:
        return {"code": 1, "dry_run": True, "payload": payload}
    return _req("/finance/Expense/add", "POST", payload, token=token)


if __name__ == "__main__":
    t = login()
    print(f"✅ 登录成功  token={t[:30]}...")
    rows = list_expenses(t, limit=5)
    print(f"最近 {len(rows)} 条费用：")
    for r in rows:
        print(f"  {r['expense_date'][:10]}  {r['name']:<14} ¥{r['amount']:>10}  {r.get('remark','')[:30]}")
