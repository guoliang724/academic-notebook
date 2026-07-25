import { NextResponse } from 'next/server';
import { getPool } from '@/db';
import { seedDatabase } from '@/db/seed';
import type { Template } from '@/lib/types';
import type { RowDataPacket } from 'mysql2';

function rowToTemplate(row: RowDataPacket): Template {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) || '未分类',
    content: row.content as string,
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

// GET /api/templates
export async function GET() {
  try {
    await seedDatabase();
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM templates ORDER BY createdAt ASC');
    return NextResponse.json(rows.map(r => rowToTemplate(r)));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/templates
export async function POST(request: Request) {
  try {
    await seedDatabase();
    const pool = getPool();
    const body = await request.json();
    if (!body.name || !body.content) {
      return NextResponse.json({ error: '请填写模板名称和内容' }, { status: 400 });
    }
    const now = Date.now();
    const id = 't_' + now;
    await pool.execute(
      'INSERT INTO templates (id, name, category, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, body.name, body.category || '未分类', body.content, now, now]
    );
    return NextResponse.json(rowToTemplate({
      id, name: body.name, category: body.category || '未分类',
      content: body.content, createdAt: now, updatedAt: now,
    } as unknown as RowDataPacket), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
