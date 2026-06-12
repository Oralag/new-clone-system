#!/bin/bash
set -e

export CLOUDFLARE_API_TOKEN=rdRZlf7zm66MaFQfjUAj08ihpoY10kbOOa9lhw5T
NS_ID="34551c1704904c3ab22463a73fc56f5c"
SKU_BASE="/Users/oralagborjigin/Desktop/new work /电商/SKU 白底图"
BASE_URL="https://nomaderp.pages.dev/media"

upload_file() {
  local local_path="$1"
  local kv_key="media_$2"
  local content_type="$3"
  echo -n "  Uploading $2 ... "
  CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN npx wrangler kv key put \
    --namespace-id="$NS_ID" \
    --remote \
    "$kv_key" \
    --path="$local_path" \
    --metadata="{\"contentType\":\"$content_type\"}" 2>/dev/null
  echo "OK"
}

ext_content_type() {
  case "${1##*.}" in
    png|PNG) echo "image/png" ;;
    jpg|jpeg|JPG|JPEG) echo "image/jpeg" ;;
    webp) echo "image/webp" ;;
    *) echo "image/jpeg" ;;
  esac
}

echo "=== Uploading 传统奶豆腐SKU ==="
for f in "$SKU_BASE/传统奶豆腐SKU"/*.{jpg,jpeg,png,JPG,PNG}; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  ct=$(ext_content_type "$fname")
  upload_file "$f" "sku/naidoufu/$fname" "$ct"
done

echo ""
echo "=== Uploading 冻炒米SKU图 ==="
for f in "$SKU_BASE/冻炒米SKU图"/*.{jpg,jpeg,png,JPG,PNG}; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  ct=$(ext_content_type "$fname")
  upload_file "$f" "sku/dongchami/$fname" "$ct"
done

echo ""
echo "=== Uploading 奶条SKU ==="
for f in "$SKU_BASE/奶条SKU"/*.{jpg,jpeg,png,JPG,PNG}; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  ct=$(ext_content_type "$fname")
  upload_file "$f" "sku/naotiao/$fname" "$ct"
done

echo ""
echo "=== Uploading 奶果子SKU图 ==="
for f in "$SKU_BASE/奶果子SKU图"/*.{jpg,jpeg,png,JPG,PNG}; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  ct=$(ext_content_type "$fname")
  upload_file "$f" "sku/naiguozi/$fname" "$ct"
done

echo ""
echo "=== Uploading root images ==="
for f in "DSC_6306 拷贝.jpg" "DSC_6309 拷贝.jpg" "DSC_6310 拷贝.jpg" "白底图.jpg"; do
  full="$SKU_BASE/$f"
  [ -f "$full" ] || continue
  ct=$(ext_content_type "$f")
  upload_file "$full" "sku/root/$f" "$ct"
done

echo ""
echo "=== All uploads complete ==="
echo ""
echo "URLs:"
echo "  传统奶豆腐: $BASE_URL/sku/naidoufu/"
echo "  冻炒米:     $BASE_URL/sku/dongchami/"
echo "  奶条:       $BASE_URL/sku/naotiao/"
echo "  奶果子:     $BASE_URL/sku/naiguozi/"
echo "  root:       $BASE_URL/sku/root/"
