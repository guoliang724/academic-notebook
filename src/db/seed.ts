import type { RowDataPacket } from 'mysql2';
import type { Pool } from 'mysql2/promise';
import { getPool, ensureTables } from './index';
import type { BuiltinArticle } from '@/lib/types';
import toeflUnits from '@/data/toefl-units.json';

/**
 * Bump this whenever src/data/toefl-units.json changes. On the next request the
 * built-in units are upserted into the database. Rows the user has edited
 * (updatedAt > createdAt) are snapshotted into article_backups before being overwritten.
 */
export const TOEFL_CONTENT_VERSION = 1;
const CONTENT_VERSION_KEY = 'toefl_content_version';

const BUILTIN_ARTICLES = toeflUnits as BuiltinArticle[];

const DEFAULT_TEMPLATES = [
  { id: 't_1784264734001', name: '合同定义句式', category: '法律/商业', content: 'X is a contract by which A grants [权利] to B.' },
  { id: 't_1784264734002', name: '因果论证句式', category: '学术论证', content: 'X is caused by Y, which leads to Z.' },
  { id: 't_1784264734003', name: '时代趋势句式', category: '社会分析', content: 'X coincided with Y, which was given the challenge to Z.' },
  { id: 't_1784264734004', name: '过程定义句式', category: '学术定义', content: 'X is a process of [doing] Y to/from Z.' },
  { id: 't_1784264734005', name: '列举穷尽句式', category: '说明文', content: 'Choices have to be made for every element, from A to B, and even C.' },
];

let seeding: Promise<void> | null = null;

/**
 * Idempotent: creates tables, inserts default templates into an empty table,
 * and syncs the built-in TOEFL units. Runs once per server process.
 */
export function seedDatabase(): Promise<void> {
  if (!seeding) {
    seeding = runSeed().catch(err => {
      seeding = null; // allow a retry on the next request
      throw err;
    });
  }
  return seeding;
}

async function runSeed() {
  await ensureTables();
  const pool = getPool();
  await seedTemplates(pool);
  await syncBuiltinArticles(pool);
}

async function seedTemplates(pool: Pool) {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS count FROM templates');
  if (Number(rows[0].count) > 0) return;
  const now = Date.now();
  for (const t of DEFAULT_TEMPLATES) {
    await pool.execute(
      'INSERT INTO templates (id, name, category, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [t.id, t.name, t.category, t.content, now, now]
    );
  }
}

async function syncBuiltinArticles(pool: Pool) {
  const [metaRows] = await pool.execute<RowDataPacket[]>('SELECT v FROM meta WHERE k = ?', [CONTENT_VERSION_KEY]);
  const installed = metaRows.length > 0 ? Number(metaRows[0].v) : 0;
  if (installed >= TOEFL_CONTENT_VERSION) return;

  const now = Date.now();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existingRows] = await conn.execute<RowDataPacket[]>('SELECT * FROM articles');
    const existing = new Map(existingRows.map(r => [r.id as string, r]));
    let inserted = 0, updated = 0, backedUp = 0;

    for (const a of BUILTIN_ARTICLES) {
      const row = existing.get(a.id);
      const content = [
        a.title, a.genre, a.body, a.translation,
        JSON.stringify(a.insights), JSON.stringify(a.grammar), JSON.stringify(a.vocab),
        a.specialHTML, a.unit, a.topic,
      ];

      if (!row) {
        await conn.execute(
          `INSERT INTO articles (title, genre, body, translation, insights, grammar, vocab, specialHTML, unit, topic,
             id, status, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
          [...content, a.id, a.unit * 10, now, now]
        );
        inserted++;
        continue;
      }

      if (Number(row.updatedAt) > Number(row.createdAt)) {
        await conn.execute(
          'INSERT INTO article_backups (articleId, snapshot, reason, createdAt) VALUES (?, ?, ?, ?)',
          [a.id, JSON.stringify(row), `toefl content v${TOEFL_CONTENT_VERSION}`, now]
        );
        backedUp++;
      }
      // Keep the learner's status and any manual ordering; refresh the content.
      await conn.execute(
        `UPDATE articles SET title = ?, genre = ?, body = ?, translation = ?, insights = ?, grammar = ?, vocab = ?,
           specialHTML = ?, unit = ?, topic = ?, sortOrder = IF(sortOrder = 0, ?, sortOrder), createdAt = ?, updatedAt = ?
         WHERE id = ?`,
        [...content, a.unit * 10, now, now, a.id]
      );
      updated++;
    }

    // Articles imported before V10 have no sortOrder yet: keep their original order after the built-ins.
    const builtinIds = new Set(BUILTIN_ARTICLES.map(a => a.id));
    const legacy = existingRows
      .filter(r => !builtinIds.has(r.id as string) && Number(r.sortOrder) === 0)
      .sort((x, y) => Number(x.createdAt) - Number(y.createdAt));
    let order = (BUILTIN_ARTICLES.length + 1) * 10;
    for (const r of legacy) {
      await conn.execute('UPDATE articles SET sortOrder = ? WHERE id = ?', [order, r.id]);
      order += 10;
    }

    await conn.execute(
      'INSERT INTO meta (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      [CONTENT_VERSION_KEY, String(TOEFL_CONTENT_VERSION)]
    );
    await conn.commit();
    console.log(`[Seed] TOEFL content v${TOEFL_CONTENT_VERSION}: ${inserted} inserted, ${updated} updated, ${backedUp} edited rows backed up.`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
