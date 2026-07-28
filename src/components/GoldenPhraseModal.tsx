'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Article } from '@/lib/types';

interface GoldenPhrase {
  articleId: string;
  articleTitle: string;
  genre: string;
  type: 'specialHTML' | 'insight';
  html?: string;       // from specialHTML
  text?: string;       // from insights
}

interface GoldenPhraseModalProps {
  articles: Article[];
  onClose: () => void;
  onCopyToast: () => void;
}

const GENRE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '法律英语 / 合同文本': { bg: 'rgba(245,158,11,0.13)', text: '#b45309', border: 'rgba(245,158,11,0.3)' },
  '建筑史学 / 说明文': { bg: 'rgba(59,130,246,0.13)', text: '#1d4ed8', border: 'rgba(59,130,246,0.3)' },
  '室内设计 / 说明文': { bg: 'rgba(139,92,246,0.13)', text: '#6d28d9', border: 'rgba(139,92,246,0.3)' },
  '社会地理学': { bg: 'rgba(16,185,129,0.13)', text: '#059669', border: 'rgba(16,185,129,0.3)' },
  '公共卫生学': { bg: 'rgba(236,72,153,0.13)', text: '#db2777', border: 'rgba(236,72,153,0.3)' },
};

const DEFAULT_GENRE_COLOR = { bg: 'rgba(100,116,139,0.12)', text: '#6e6a63', border: 'rgba(100,116,139,0.3)' };

/**
 * Extract golden phrases from an article's specialHTML.
 * Looks for the ✍️ 黄金句式仿写模板 section specifically.
 */
function extractGoldenFromSpecialHTML(html: string): string | null {
  if (!html || !html.trim()) return null;

  // Try to extract just the 黄金句式 section
  const goldenRegex = /<h5>[^<]*黄金句式[^<]*<\/h5>\s*<p>[\s\S]*?<\/p>/gi;
  const matches = html.match(goldenRegex);
  if (matches && matches.length > 0) {
    return matches[0];
  }

  // Fallback: if the whole specialHTML contains 黄金句式, use the whole thing
  if (html.includes('黄金句式')) {
    return html;
  }

  return null;
}

/**
 * Extract golden phrases from insights (those starting with 📌 句型模板：)
 */
function extractGoldenFromInsights(insights: string[]): string[] {
  return insights
    .filter(s => s.startsWith('📌 句型模板：'))
    .map(s => s.replace(/^📌 句型模板：/, '').trim());
}

export default function GoldenPhraseModal({ articles, onClose, onCopyToast }: GoldenPhraseModalProps) {
  const [search, setSearch] = useState('');

  // Build the list of all golden phrases from articles
  const allPhrases = useMemo<GoldenPhrase[]>(() => {
    const result: GoldenPhrase[] = [];
    for (const article of articles) {
      // From specialHTML
      const goldenHTML = extractGoldenFromSpecialHTML(article.specialHTML);
      if (goldenHTML) {
        result.push({
          articleId: article.id,
          articleTitle: article.title,
          genre: article.genre,
          type: 'specialHTML',
          html: goldenHTML,
        });
      }
      // From insights
      const goldenInsights = extractGoldenFromInsights(article.insights);
      for (const text of goldenInsights) {
        result.push({
          articleId: article.id,
          articleTitle: article.title,
          genre: article.genre,
          type: 'insight',
          text,
        });
      }
    }
    return result;
  }, [articles]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allPhrases;
    const q = search.toLowerCase();
    return allPhrases.filter(p => {
      const content = p.type === 'specialHTML'
        ? (p.html || '').replace(/<[^>]*>/g, '').toLowerCase()
        : (p.text || '').toLowerCase();
      return content.includes(q) || p.articleTitle.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q);
    });
  }, [allPhrases, search]);

  const copyText = useCallback((content: string) => {
    // Strip HTML tags for copy
    const plain = content.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(plain).then(onCopyToast).catch(() => {
        const el = document.createElement('textarea');
        el.value = plain;
        el.style.cssText = 'position:fixed;top:-999px;opacity:0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        el.remove();
        onCopyToast();
      });
    }
  }, [onCopyToast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl relative" style={{ background: '#f4f2ec', border: '1px solid #d9d3cb' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #d9d3cb' }}>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1c1814' }}>✍️ 黄金句式汇总</h2>
            <p className="text-xs mt-0.5" style={{ color: '#a09992' }}>
              自动汇总所有语料中的黄金句式仿写模板（共 {allPhrases.length} 条）
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-all ml-1"
            style={{ color: '#6e6a63' }}
          >✕</button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(217,211,203,0.5)' }}>
          <input
            type="text"
            className="tpl-search-input"
            placeholder="🔍  搜索句式内容或来源文章..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Phrase Cards */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filtered.map((phrase, i) => {
                const col = GENRE_COLORS[phrase.genre] || DEFAULT_GENRE_COLOR;
                return (
                  <div key={`${phrase.articleId}-${phrase.type}-${i}`} className="golden-phrase-card">
                    {/* Header: source article + copy */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="golden-phrase-index">{i + 1}</span>
                        <span className="category-badge" style={{ background: col.bg, color: col.text, borderColor: col.border }}>
                          {phrase.genre}
                        </span>
                        <span className="text-xs font-medium truncate" style={{ color: '#6e6a63' }}>
                          来自：{phrase.articleTitle}
                        </span>
                      </div>
                      <button
                        className="tpl-copy-btn shrink-0"
                        onClick={() => copyText(phrase.type === 'specialHTML' ? (phrase.html || '') : (phrase.text || ''))}
                      >
                        📋 复制
                      </button>
                    </div>

                    {/* Content */}
                    {phrase.type === 'specialHTML' ? (
                      <div
                        className="golden-phrase-content"
                        dangerouslySetInnerHTML={{ __html: phrase.html || '' }}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: '#47433e' }}>
                        📌 {phrase.text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-center">
              <div>
                <span className="text-4xl block mb-4">📭</span>
                <p className="text-sm" style={{ color: '#a09992' }}>
                  {search ? '没有匹配的黄金句式' : '当前语料库中暂无黄金句式模板'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
