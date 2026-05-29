#!/usr/bin/env node
/**
 * 通过 Neon Serverless HTTP 驱动备份数据库（不依赖端口5432，走 HTTPS）
 * 替代 backup_neon.sh（pg_dump 被防火墙屏蔽）
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(REPO_DIR, 'backups', 'db');
const LOG_DIR = path.join(REPO_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'db-backup-http.log');

const NEON_URL = 'postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

mkdirSync(BACKUP_DIR, { recursive: true });
mkdirSync(LOG_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  writeFileSync(LOG_FILE, line + '\n', { flag: 'a' });
}

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const DATE = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

log('开始备份数据库（HTTP模式）...');

const sql = neon(NEON_URL);

// 获取所有用户表
const tables = await sql`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename
`;

log(`共 ${tables.length} 张表`);

const dump = [];

for (const { tablename } of tables) {
  const rows = await sql.query(`SELECT * FROM "${tablename}"`);
  dump.push({ table: tablename, rows: rows.rows ?? rows });
  log(`  ${tablename}: ${(rows.rows ?? rows).length} 行`);
}

const BACKUP_FILE = path.join(BACKUP_DIR, `neon_http_backup_${DATE}.json`);
writeFileSync(BACKUP_FILE, JSON.stringify(dump, null, 2), 'utf-8');

log(`备份完成: neon_http_backup_${DATE}.json`);

// 只保留最近 20 个 JSON 备份
try {
  const { execSync: exec } = await import('child_process');
  execSync(`ls -t ${BACKUP_DIR}/neon_http_backup_*.json 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true`, { shell: true });
} catch {}

// 提交到 Git
try {
  execSync(`cd "${REPO_DIR}" && git add backups/db/ && git commit -m "db backup ${DATE}" --no-verify`, { stdio: 'pipe' });
  execSync(`cd "${REPO_DIR}" && git push origin HEAD`, { stdio: 'pipe' });
  log('已推送到 GitHub');
} catch (e) {
  log(`Git 提交/推送失败（不影响本地备份）: ${e.message}`);
}

log('全部完成');
