import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let tablesReady = false;

/**
 * Parse DATABASE_URL or use local defaults.
 * Production: DATABASE_URL=mysql://user:password@host:3306/academic
 * Local dev:  defaults to root@localhost:3306/academic (no password)
 */
function getConnectionConfig(): mysql.PoolOptions {
  const url = process.env.databaseUrl;
  if (url) {
    return { uri: url, waitForConnections: true, connectionLimit: 10 };
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

  tablesReady = true;
}
