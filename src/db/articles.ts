import type { RowDataPacket } from 'mysql2';
import type { Pool, PoolConnection } from 'mysql2/promise';
import type { Article, ArticleStatus } from '@/lib/types';

const STATUSES: ArticleStatus[] = ['new', 'learning', 'mastered'];

export function rowToArticle(row: RowDataPacket): Article {
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
    unit: row.unit === null || row.unit === undefined ? null : Number(row.unit),
    topic: (row.topic as string) || '',
    status: STATUSES.includes(row.status) ? row.status : 'new',
    sortOrder: Number(row.sortOrder) || 0,
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

export function isArticleStatus(value: unknown): value is ArticleStatus {
  return typeof value === 'string' && (STATUSES as string[]).includes(value);
}

/** Next free sortOrder slot at the end of the list (steps of 10 leave room for manual inserts). */
export async function nextSortOrder(db: Pool | PoolConnection): Promise<number> {
  const [rows] = await db.execute<RowDataPacket[]>('SELECT COALESCE(MAX(sortOrder), 0) AS m FROM articles');
  return Number(rows[0].m) + 10;
}
