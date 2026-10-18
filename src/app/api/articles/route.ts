import { NextResponse } from 'next/server';
import { getPool } from '@/db';
import { seedDatabase } from '@/db/seed';
import { rowToArticle, nextSortOrder } from '@/db/articles';
import { normalizeArticle } from '@/lib/normalize';
import type { Article } from '@/lib/types';
import type { RowDataPacket } from 'mysql2';

// GET /api/articles — list all articles
export async function GET() {
  try {
    await seedDatabase();
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles ORDER BY sortOrder ASC, createdAt ASC');
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
      const firstOrder = await nextSortOrder(conn);

      for (let i = 0; i < items.length; i++) {
        const raw = items[i];
        if (!raw.title || !raw.body) {
          throw new Error(`第 ${i + 1} 条语料缺少 'title' 或 'body' 字段。`);
        }
        const normalized = normalizeArticle(raw);
        const id = 'a_' + (now + i);
        const sortOrder = firstOrder + i * 10;
        await conn.execute(
          'INSERT INTO articles (id, title, genre, body, translation, insights, grammar, vocab, specialHTML, unit, topic, status, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, \'\', \'new\', ?, ?, ?)',
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
            sortOrder,
            now + i,
            now + i,
          ]
        );
        inserted.push({
          id,
          ...normalized,
          unit: null,
          topic: '',
          status: 'new',
          sortOrder,
          createdAt: now + i,
          updatedAt: now + i,
        });
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

// PATCH /api/articles — persist the sidebar order: { order: string[] } (article ids, top to bottom)
export async function PATCH(request: Request) {
  try {
    await seedDatabase();
    const body = await request.json();
    const order = body?.order;
    if (!Array.isArray(order) || !order.every(id => typeof id === 'string')) {
      return NextResponse.json({ error: "需要 { order: string[] }" }, { status: 400 });
    }

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (let i = 0; i < order.length; i++) {
        // sortOrder is display metadata: leave updatedAt alone so content-sync edit detection stays accurate
        await conn.execute('UPDATE articles SET sortOrder = ? WHERE id = ?', [(i + 1) * 10, order[i]]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
