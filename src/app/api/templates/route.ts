import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { seedDatabase } from '@/db/seed';
import type { Template } from '@/lib/types';

function rowToTemplate(row: Record<string, unknown>): Template {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) || '未分类',
    content: row.content as string,
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number,
  };
}

// GET /api/templates
export async function GET() {
  try {
    seedDatabase();
    const db = getDb();
    const rows = db.prepare('SELECT * FROM templates ORDER BY createdAt ASC').all();
    return NextResponse.json(rows.map(r => rowToTemplate(r as Record<string, unknown>)));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/templates
export async function POST(request: Request) {
  try {
    seedDatabase();
    const db = getDb();
    const body = await request.json();
    if (!body.name || !body.content) {
      return NextResponse.json({ error: '请填写模板名称和内容' }, { status: 400 });
    }
    const now = Date.now();
    const id = 't_' + now;
    db.prepare(
      'INSERT INTO templates (id, name, category, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, body.name, body.category || '未分类', body.content, now, now);
    return NextResponse.json(rowToTemplate({
      id, name: body.name, category: body.category || '未分类',
      content: body.content, createdAt: now, updatedAt: now,
    }), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
