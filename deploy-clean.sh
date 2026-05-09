#!/bin/bash
set -e
cd /Users/oralagborjigin/new-clone-system
rm -rf node_modules/.vite dist
npm run build 2>&1
echo "BUILD_DONE"
echo "=== deploying ==="
git add -A
git commit -m "deploy: clean build $(date '+%H:%M')" --allow-empty
git push origin main 2>&1
npx wrangler pages deploy dist --project-name digital-nomad --commit-dirty=true 2>&1
echo "DEPLOY_DONE"
