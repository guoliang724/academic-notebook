import type { ArticleCreateInput } from './types';

/**
 * Normalize an article object from any supported schema into the internal format.
 * Handles AI-generated field aliases: translation_tips, tips, takeaway, grammar string.
 */
export function normalizeArticle(obj: ArticleCreateInput): {
  title: string;
  genre: string;
  body: string;
  translation: string;
  insights: string[];
  grammar: { title: string; skeleton: string; notes: string }[];
  vocab: { word: string; type: string; meaning: string; rating: string }[];
  specialHTML: string;
} {
  // ── insights: accept translation_tips / insights / tips ──
  let insights: string[];
  if (obj.insights && Array.isArray(obj.insights)) {
    insights = obj.insights;
  } else if (typeof obj.insights === 'string') {
    insights = (obj.insights as string).split('\n').map(s => s.trim()).filter(Boolean);
  } else {
    const raw = obj.translation_tips || obj.tips || null;
    if (raw) {
      insights = raw.split('\n').map(s => s.trim()).filter(Boolean);
    } else {
      insights = [];
    }
  }

  // Append takeaway as a bonus insight item
  if (obj.takeaway) {
    insights.push('📌 句型模板：' + obj.takeaway.trim());
  }

  // ── grammar: accept string or array ──
  let grammar: { title: string; skeleton: string; notes: string }[];
  if (typeof obj.grammar === 'string' && (obj.grammar as string).trim()) {
    const lines = (obj.grammar as string).split(/\n+/).map(s => s.trim()).filter(Boolean);
    grammar = [{
      title: '语法句式剖析',
      skeleton: lines[0] || '',
      notes: lines.slice(1).join('  ') || lines[0] || ''
    }];
  } else if (Array.isArray(obj.grammar)) {
    grammar = obj.grammar;
  } else {
    grammar = [];
  }

  // ── vocab: ensure array ──
  const vocab = Array.isArray(obj.vocab) ? obj.vocab : [];

  // ── genre fallback ──
  const genre = obj.genre || '未分类';

  return {
    title: obj.title,
    genre,
    body: obj.body,
    translation: obj.translation || '',
    insights,
    grammar,
    vocab,
    specialHTML: obj.specialHTML || ''
  };
}
