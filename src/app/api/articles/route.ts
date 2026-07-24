import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { seedDatabase } from '@/db/seed';
import { normalizeArticle } from '@/lib/normalize';
import type { Article } from '@/lib/types';

function rowToArticle(row: Record<string, unknown>): Article {
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
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number,
  };
}

// GET /api/articles — list all articles
export async function GET() {
  try {
    seedDatabase();
    const db = getDb();
    const rows = db.prepare('SELECT * FROM articles ORDER BY createdAt ASC').all();
    const articles = rows.map(r => rowToArticle(r as Record<string, unknown>));
    return NextResponse.json(articles);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/articles — import one or many articles
export async function POST(request: Request) {
  try {
    seedDatabase();
    const db = getDb();
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: 'JSON 数组为空' }, { status: 400 });
    }

    const now = Date.now();
    const inserted: Article[] = [];

    const insert = db.prepare(`
      INSERT INTO articles (id, title, genre, body, translation, insights, grammar, vocab, specialHTML, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      for (let i = 0; i < items.length; i++) {
        const raw = items[i];
        if (!raw.title || !raw.body) {
          throw new Error(`第 ${i + 1} 条语料缺少 'title' 或 'body' 字段。`);
        }
        const normalized = normalizeArticle(raw);
        const id = 'a_' + (now + i);
        insert.run(
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
          now + i
        );
        inserted.push({
          id,
          ...normalized,
          createdAt: now + i,
          updatedAt: now + i,
        });
      }
    });

    tx();
    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
