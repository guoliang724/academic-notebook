import { NextResponse } from 'next/server';
import { getPool } from '@/db';
import { seedDatabase } from '@/db/seed';
import { normalizeArticle } from '@/lib/normalize';
import type { Article } from '@/lib/types';
import type { RowDataPacket } from 'mysql2';

function rowToArticle(row: RowDataPacket): Article {
  return {
    id: row.id as string,
    title: row.title as string,
    genre: row.genre as string,
    body: row.body as string,
    translation: row.translation as string,
    insights: JSON.parse((row.insights as string) || '[]'),
    grammar: JSON.parse((row.grammar as string) || '[]'),
    vocab: JSON.parse((row.vocab as string) || '[]'),
    specialHTML: (row.specialHTML as string) || '',
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

// GET /api/articles — list all articles
export async function GET() {
  try {
    await seedDatabase();
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles ORDER BY createdAt ASC');
    const articles = rows.map(r => rowToArticle(r));
    return NextResponse.json(articles);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/articles — import one or many articles
export async function POST(request: Request) {
  try {
    await seedDatabase();
    const pool = getPool();
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: 'JSON 数组为空' }, { status: 400 });
    }

    const now = Date.now();
    const inserted: Article[] = [];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < items.length; i++) {
        const raw = items[i];
        if (!raw.title || !raw.body) {
          throw new Error(`第 ${i + 1} 条语料缺少 'title' 或 'body' 字段。`);
        }
        const normalized = normalizeArticle(raw);
        const id = 'a_' + (now + i);
        await conn.execute(
          'INSERT INTO articles (id, title, genre, body, translation, insights, grammar, vocab, specialHTML, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            normalized.title,
            normalized.genre,
            normalized.body,
            normalized.translation,
            JSON.stringify(normalized.insights),
            JSON.stringify(normalized.grammar),
            JSON.stringify(normalized.vocab),
            normalized.specialHTML,
            now + i,
            now + i,
          ]
        );
        inserted.push({
          id,
          ...normalized,
          createdAt: now + i,
          updatedAt: now + i,
        });

        // Auto-create a global template if takeaway is present
        if (normalized.takeaway) {
          const tplId = 't_' + (now + i);
          const titleClean = normalized.title.replace(/^\d+\.\s*/, '');
          const tplName = `来自「${titleClean}」的句式`;
          const tplCategory = normalized.genre || '未分类';
          await conn.execute(
            'INSERT INTO templates (id, name, category, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [tplId, tplName, tplCategory, normalized.takeaway, now + i, now + i]
          );
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
