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

// PUT /api/templates/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    seedDatabase();
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const now = Date.now();

    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: '模板未找到' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
    if (body.category !== undefined) { fields.push('category = ?'); values.push(body.category); }
    if (body.content !== undefined) { fields.push('content = ?'); values.push(body.content); }

    if (fields.length > 0) {
      fields.push('updatedAt = ?');
      values.push(now);
      values.push(id);
      db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    return NextResponse.json(rowToTemplate(updated as Record<string, unknown>));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE /api/templates/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    seedDatabase();
    const { id } = await params;
    const db = getDb();
    const result = db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    if (result.changes === 0) {
      return NextResponse.json({ error: '模板未找到' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
