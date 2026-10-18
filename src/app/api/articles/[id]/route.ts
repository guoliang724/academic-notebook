import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPool } from '@/db';
import { seedDatabase } from '@/db/seed';
import { rowToArticle, isArticleStatus } from '@/db/articles';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/articles/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await seedDatabase();
    const { id } = await params;
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: '语料未找到' }, { status: 404 });
    }
    return NextResponse.json(rowToArticle(rows[0]));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PUT /api/articles/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await seedDatabase();
    const { id } = await params;
    const pool = getPool();
    const body = await request.json();
    const now = Date.now();

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: '语料未找到' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
    if (body.genre !== undefined) { fields.push('genre = ?'); values.push(body.genre); }
    if (body.body !== undefined) { fields.push('body = ?'); values.push(body.body); }
    if (body.translation !== undefined) { fields.push('translation = ?'); values.push(body.translation); }
    if (body.insights !== undefined) { fields.push('insights = ?'); values.push(JSON.stringify(body.insights)); }
    if (body.grammar !== undefined) { fields.push('grammar = ?'); values.push(JSON.stringify(body.grammar)); }
    if (body.vocab !== undefined) { fields.push('vocab = ?'); values.push(JSON.stringify(body.vocab)); }
    if (body.specialHTML !== undefined) { fields.push('specialHTML = ?'); values.push(body.specialHTML); }
    // Content edits bump updatedAt (used to detect user edits before a built-in content sync);
    // a learning-status change on its own does not.
    const contentChanged = fields.length > 0;
    if (body.status !== undefined) {
      if (!isArticleStatus(body.status)) {
        return NextResponse.json({ error: '无效的学习状态' }, { status: 400 });
      }
      fields.push('status = ?'); values.push(body.status);
    }

    if (fields.length > 0) {
      if (contentChanged) {
        fields.push('updatedAt = ?');
        values.push(now);
      }
      values.push(id);
      await pool.execute(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles WHERE id = ?', [id]);
    return NextResponse.json(rowToArticle(updated[0]));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE /api/articles/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await seedDatabase();
    const { id } = await params;
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>('DELETE FROM articles WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '语料未找到' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
