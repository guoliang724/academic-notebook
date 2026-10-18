import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let tablesReady = false;

/**
 * Parse DATABASE_URL or use local defaults.
 * Production: DATABASE_URL=mysql://user:password@host:3306/academic
 * Local dev:  defaults to root@localhost:3306/academic (no password)
 */
function parseConnectionString(str: string): mysql.PoolOptions {
  const trimmed = str.trim();
  // Standard mysql:// URI format
  if (trimmed.startsWith('mysql://') || trimmed.startsWith('mysqls://')) {
    return { uri: trimmed, waitForConnections: true, connectionLimit: 10 };
  }

  // Key=Value format (e.g. Server=...;Port=...;Database=...;Uid=...;Pwd=...;)
  const opts: mysql.PoolOptions = {
    waitForConnections: true,
    connectionLimit: 10,
  };

  const pairs = trimmed.split(';').map(p => p.trim()).filter(Boolean);
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim().toLowerCase();
    const val = pair.slice(eqIdx + 1).trim();

    if (key === 'server' || key === 'host') {
      opts.host = val;
    } else if (key === 'port') {
      opts.port = Number(val) || 3306;
    } else if (key === 'database' || key === 'db') {
      opts.database = val;
    } else if (key === 'uid' || key === 'user' || key === 'username' || key === 'user id') {
      opts.user = val;
    } else if (key === 'pwd' || key === 'password') {
      opts.password = val;
    }
  }

  return opts;
}

function getConnectionConfig(): mysql.PoolOptions {
  const url = process.env.databaseUrl || process.env.DATABASE_URL;
  if (url) {
    return parseConnectionString(url);
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'academic',
    waitForConnections: true,
    connectionLimit: 10,
  };
}

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(getConnectionConfig());
  }
  return pool;
}

/**
 * Create tables if they don't exist (idempotent).
 * Must be called before any query in each API handler.
 */
export async function ensureTables(): Promise<void> {
  if (tablesReady) return;

  const p = getPool();

  await p.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id VARCHAR(64) PRIMARY KEY,
      title TEXT NOT NULL,
      genre VARCHAR(255) DEFAULT '未分类',
      body LONGTEXT NOT NULL,
      translation LONGTEXT,
      insights LONGTEXT,
      grammar LONGTEXT,
      vocab LONGTEXT,
      specialHTML LONGTEXT,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS templates (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(500) NOT NULL,
      category VARCHAR(255) DEFAULT '未分类',
      content LONGTEXT NOT NULL,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // Key/value store for content versions and other app-level flags
  await p.execute(`
    CREATE TABLE IF NOT EXISTS meta (
      k VARCHAR(64) PRIMARY KEY,
      v TEXT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // Snapshot of a user-edited article taken before built-in content overwrites it
  await p.execute(`
    CREATE TABLE IF NOT EXISTS article_backups (
      backupId INT AUTO_INCREMENT PRIMARY KEY,
      articleId VARCHAR(64) NOT NULL,
      snapshot LONGTEXT NOT NULL,
      reason VARCHAR(255),
      createdAt BIGINT NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // Columns added in V10 (MySQL has no ADD COLUMN IF NOT EXISTS)
  await addColumnIfMissing(p, 'articles', 'unit', 'INT NULL');
  await addColumnIfMissing(p, 'articles', 'topic', "VARCHAR(64) DEFAULT ''");
  await addColumnIfMissing(p, 'articles', 'status', "VARCHAR(16) DEFAULT 'new'");
  await addColumnIfMissing(p, 'articles', 'sortOrder', 'INT NOT NULL DEFAULT 0');

  tablesReady = true;
}

async function addColumnIfMissing(p: mysql.Pool, table: string, column: string, definition: string): Promise<void> {
  const [rows] = await p.execute(
    'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  if (Number((rows as Array<{ c: number }>)[0].c) === 0) {
    await p.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
