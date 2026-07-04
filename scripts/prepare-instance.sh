#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# 新客户实例 · 净化导出脚本
# 用法: bash scripts/prepare-instance.sh <客户名>
#
# 只读源仓库，产出 ../erp-instance-<客户名>/（全新 git，无历史）。
# 对现有生产数据（Neon/KV/Render/本仓库）零写入。
# ════════════════════════════════════════════════════════════════
set -euo pipefail

CUSTOMER="${1:?用法: bash scripts/prepare-instance.sh <客户名>}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$(dirname "$SRC")/erp-instance-${CUSTOMER}"

if [ -e "$DEST" ]; then
  echo "✗ 目标已存在: $DEST（请先移走，脚本不做删除）" >&2
  exit 1
fi

echo "→ 导出净化副本: $DEST"
mkdir -p "$DEST"

# 白名单式复制：排除历史、备份、密钥、本地产物
rsync -a \
  --exclude='.git' \
  --exclude='backups' \
  --exclude='dist' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.claude' \
  --exclude='.wrangler' \
  --exclude='*.sql' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='retail_repair_commands.txt' \
  --exclude='.DS_Store' \
  "$SRC/" "$DEST/"

# 保留 .env.example 作为配置模板（如果有）
[ -f "$SRC/.env.example" ] && cp "$SRC/.env.example" "$DEST/.env.example"

# 敏感串扫描：出现即中止，绝不带病交付
echo "→ 敏感串扫描..."
LEAKS=$(grep -rInE "ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|HTX_SECRET|postgres(ql)?://[^ ]+@" "$DEST" \
  --exclude-dir=node_modules 2>/dev/null | grep -v '.env.example' || true)
if [ -n "$LEAKS" ]; then
  echo "✗ 发现疑似密钥，已中止（副本保留供检查）：" >&2
  echo "$LEAKS" | head -10 >&2
  exit 2
fi

# 生产痕迹提示（不阻断，人工确认后替换）
echo "→ 生产痕迹检查（需人工替换为客户配置）:"
grep -rIn "erp-server-xsji\|erp-trial\|nomaderp" "$DEST" \
  --exclude-dir=node_modules -l 2>/dev/null | sed 's/^/   · /' || echo "   (无)"

# 全新 git 历史
cd "$DEST"
git init -q
git add -A
git -c user.name="deploy" -c user.email="deploy@local" commit -qm "init: ${CUSTOMER} instance ($(date +%F))"

echo ""
echo "✓ 完成: $DEST"
echo "  下一步照 docs/saas-instance-playbook.md §2-§6 执行"
echo "  重点: 改 functions/adminapi/[[path]].js 的 DEFAULT_BACKEND → 客户后端"
