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
  insightIndex?: number; // index within the article's insights array
}

interface GoldenPhraseModalProps {
  articles: Article[];
  onClose: () => void;
  onCopyToast: () => void;
  onUpdateArticle: (id: string, data: Partial<Article>) => Promise<void>;
}

interface SpecialBlock {
  title: string;
  isGolden: boolean;
  pattern: string;
  template: string;
  example: string;
  content: string;
}

const GENRE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '法律英语 / 合同文本': { bg: 'rgba(245,158,11,0.13)', text: '#b45309', border: 'rgba(245,158,11,0.3)' },
  '建筑史学 / 说明文': { bg: 'rgba(59,130,246,0.13)', text: '#1d4ed8', border: 'rgba(59,130,246,0.3)' },
  '室内设计 / 说明文': { bg: 'rgba(139,92,246,0.13)', text: '#6d28d9', border: 'rgba(139,92,246,0.3)' },
  '社会地理学': { bg: 'rgba(16,185,129,0.13)', text: '#059669', border: 'rgba(16,185,129,0.3)' },
  '公共卫生学': { bg: 'rgba(236,72,153,0.13)', text: '#db2777', border: 'rgba(236,72,153,0.3)' },
};

const DEFAULT_GENRE_COLOR = { bg: 'rgba(100,116,139,0.12)', text: '#6e6a63', border: 'rgba(100,116,139,0.3)' };

function cleanHTMLText(htmlStr: string): string {
  return htmlStr
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

function parseSpecialHTML(html: string): SpecialBlock[] {
  if (!html || !html.trim()) {
    return [{
      title: '✍️ 黄金句式仿写模板',
      isGolden: true,
      pattern: '',
      template: '',
      example: '',
      content: '',
    }];
  }

  const regex = /<h5>([\s\S]*?)<\/h5>([\s\S]*?)(?=(?:<h5>|$))/gi;
  const blocks: SpecialBlock[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const rawTitle = match[1].trim();
    const rawContent = match[2].trim();

    if (rawContent.includes('模板：') || rawContent.includes('例句：') || rawTitle.includes('黄金句式')) {
      let pattern = '';
      let template = '';
      let example = '';

      const patternMatch = rawContent.match(/句型：([\s\S]*?)(?=<br\s*\/?>|模板：|例句：|<\/p>|$)/i);
      if (patternMatch) pattern = cleanHTMLText(patternMatch[1]);

      const templateMatch = rawContent.match(/模板：([\s\S]*?)(?=<br\s*\/?>|例句：|<\/p>|$)/i);
      if (templateMatch) template = cleanHTMLText(templateMatch[1]);

      const exampleMatch = rawContent.match(/例句：([\s\S]*?)(?=<br\s*\/?>|<\/p>|$)/i);
      if (exampleMatch) example = cleanHTMLText(exampleMatch[1]);

      blocks.push({
        title: rawTitle,
        isGolden: true,
        pattern,
        template,
        example,
        content: rawContent,
      });
    } else {
      blocks.push({
        title: rawTitle,
        isGolden: false,
        pattern: '',
        template: '',
        example: '',
        content: rawContent,
      });
    }
  }

  if (blocks.length === 0 && html.trim()) {
    blocks.push({
      title: '✍️ 拓展模块',
      isGolden: false,
      pattern: '',
      template: '',
      example: '',
      content: html.trim(),
    });
  }

  return blocks;
}

function serializeSpecialBlocks(blocks: SpecialBlock[]): string {
  return blocks
    .filter(b => {
      if (b.isGolden) return b.pattern.trim() || b.template.trim() || b.example.trim() || b.title.trim();
      return b.title.trim() || b.content.trim();
    })
    .map(b => {
      const titleStr = b.title.trim() ? `<h5>${b.title.trim()}</h5>` : '<h5>✍️ 黄金句式仿写模板</h5>';
      if (b.isGolden) {
        const patternPart = b.pattern.trim() ? `<strong>句型：${b.pattern.trim()}</strong><br/>` : '';
        const templatePart = b.template.trim() ? `模板：${b.template.trim()}<br/>` : '';
        const examplePart = b.example.trim() ? `例句：${b.example.trim()}` : '';
        return `${titleStr}<p>${patternPart}${templatePart}${examplePart}</p>`;
      } else {
        const h5Str = b.title.trim() ? `<h5>${b.title.trim()}</h5>` : '';
        return `${h5Str}${b.content.trim()}`;
      }
    })
    .join('');
}

/**
 * Extract golden phrases from an article's specialHTML.
 * Looks for the ✍️ 黄金句式仿写模板 section specifically.
 */
function extractGoldenFromSpecialHTML(html: string): string | null {
  if (!html || !html.trim()) return null;

  const goldenRegex = /<h5>[^<]*黄金句式[^<]*<\/h5>\s*<p>[\s\S]*?<\/p>/gi;
  const matches = html.match(goldenRegex);
  if (matches && matches.length > 0) {
    return matches[0];
  }

  if (html.includes('黄金句式')) {
    return html;
  }

  return null;
}

/**
 * Extract golden phrases from insights (those starting with 📌 句型模板：)
 */
function extractGoldenFromInsights(insights: string[]): { text: string; index: number }[] {
  return insights
    .map((s, index) => ({ text: s, index }))
    .filter(item => item.text.startsWith('📌 句型模板：'))
    .map(item => ({ text: item.text.replace(/^📌 句型模板：/, '').trim(), index: item.index }));
}

export default function GoldenPhraseModal({ articles, onClose, onCopyToast, onUpdateArticle }: GoldenPhraseModalProps) {
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Edit states for 句型说明, 模板, 例句
  const [editPattern, setEditPattern] = useState('');
  const [editTemplate, setEditTemplate] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editRawHTML, setEditRawHTML] = useState('');
  const [editMode, setEditMode] = useState<'fields' | 'raw'>('fields');
  const [saving, setSaving] = useState(false);

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
      for (const item of goldenInsights) {
        result.push({
          articleId: article.id,
          articleTitle: article.title,
          genre: article.genre,
          type: 'insight',
          text: item.text,
          insightIndex: item.index,
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

  const getCardKey = (phrase: GoldenPhrase, index: number) =>
    `${phrase.articleId}-${phrase.type}-${index}`;

  const startEdit = (phrase: GoldenPhrase, index: number) => {
    const key = getCardKey(phrase, index);
    if (phrase.type === 'specialHTML') {
      const article = articles.find(a => a.id === phrase.articleId);
      const blocks = parseSpecialHTML(article?.specialHTML || '');
      const goldenBlock = blocks.find(b => b.isGolden) || blocks[0];
      setEditPattern(goldenBlock.pattern || '');
      setEditTemplate(goldenBlock.template || '');
      setEditExample(goldenBlock.example || '');
      setEditRawHTML(article?.specialHTML || '');
    } else {
      const text = phrase.text || '';
      let pattern = '';
      let template = text;
      let example = '';

      const pMatch = text.match(/句型：([\s\S]*?)(?=模板：|例句：|$)/);
      if (pMatch) pattern = pMatch[1].trim();

      const tMatch = text.match(/模板：([\s\S]*?)(?=例句：|$)/);
      if (tMatch) template = tMatch[1].trim();

      const eMatch = text.match(/例句：([\s\S]*?)$/);
      if (eMatch) example = eMatch[1].trim();

      setEditPattern(pattern);
      setEditTemplate(template);
      setEditExample(example);
    }
    setEditMode('fields');
    setEditingKey(key);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditPattern('');
    setEditTemplate('');
    setEditExample('');
    setEditRawHTML('');
  };

  const saveEdit = async (phrase: GoldenPhrase) => {
    setSaving(true);
    try {
      if (phrase.type === 'specialHTML') {
        const article = articles.find(a => a.id === phrase.articleId);
        if (article) {
          if (editMode === 'raw') {
            await onUpdateArticle(phrase.articleId, { specialHTML: editRawHTML.trim() });
          } else {
            const blocks = parseSpecialHTML(article.specialHTML || '');
            const goldenIndex = blocks.findIndex(b => b.isGolden);
            if (goldenIndex !== -1) {
              blocks[goldenIndex].pattern = editPattern;
              blocks[goldenIndex].template = editTemplate;
              blocks[goldenIndex].example = editExample;
            } else {
              blocks.unshift({
                title: '✍️ 黄金句式仿写模板',
                isGolden: true,
                pattern: editPattern,
                template: editTemplate,
                example: editExample,
                content: '',
              });
            }
            const updatedHTML = serializeSpecialBlocks(blocks);
            await onUpdateArticle(phrase.articleId, { specialHTML: updatedHTML });
          }
        }
      } else {
        const article = articles.find(a => a.id === phrase.articleId);
        if (article && phrase.insightIndex !== undefined) {
          const newInsights = [...article.insights];
          let formatted = '';
          if (editPattern.trim()) formatted += `句型：${editPattern.trim()} `;
          if (editTemplate.trim()) formatted += `模板：${editTemplate.trim()} `;
          if (editExample.trim()) formatted += `例句：${editExample.trim()}`;
          newInsights[phrase.insightIndex] = '📌 句型模板：' + formatted.trim();
          await onUpdateArticle(phrase.articleId, { insights: newInsights });
        }
      }
      setEditingKey(null);
    } catch {
      // handled silently
    } finally {
      setSaving(false);
    }
  };

  // Preview HTML for specialHTML editing
  const previewHTML = useMemo(() => {
    if (editMode === 'raw') return editRawHTML;
    const patternPart = editPattern.trim() ? `<strong>句型：${editPattern.trim()}</strong><br/>` : '';
    const templatePart = editTemplate.trim() ? `模板：${editTemplate.trim()}<br/>` : '';
    const examplePart = editExample.trim() ? `例句：${editExample.trim()}` : '';
    return `<h5>✍️ 黄金句式仿写模板</h5><p>${patternPart}${templatePart}${examplePart}</p>`;
  }, [editMode, editPattern, editTemplate, editExample, editRawHTML]);

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
                const cardKey = getCardKey(phrase, i);
                const isEditing = editingKey === cardKey;

                return (
                  <div key={cardKey} className={`golden-phrase-card ${isEditing ? 'golden-phrase-card--editing' : ''}`}>
                    {/* Header: source article + actions */}
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isEditing ? (
                          <>
                            <button
                              className="golden-edit-btn"
                              onClick={() => startEdit(phrase, i)}
                              title="编辑此句式"
                            >
                              ✏️ 编辑
                            </button>
                            <button
                              className="tpl-copy-btn"
                              onClick={() => copyText(phrase.type === 'specialHTML' ? (phrase.html || '') : (phrase.text || ''))}
                            >
                              📋 复制
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-cancel" onClick={cancelEdit} disabled={saving}>
                              取消
                            </button>
                            <button className="btn-save" onClick={() => saveEdit(phrase)} disabled={saving}>
                              {saving ? '⏳ 保存中...' : '💾 保存'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content: view or edit mode */}
                    {!isEditing ? (
                      phrase.type === 'specialHTML' ? (
                        <div
                          className="golden-phrase-content"
                          dangerouslySetInnerHTML={{ __html: phrase.html || '' }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed" style={{ color: '#47433e' }}>
                          📌 {phrase.text}
                        </p>
                      )
                    ) : (
                      <div className="golden-phrase-edit-area fade-in flex flex-col gap-3">
                        {phrase.type === 'specialHTML' && (
                          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #e2ddd7' }}>
                            <span className="text-xs" style={{ color: '#6e6a63' }}>选择编辑模式：</span>
                            <div className="flex gap-1 bg-[#ece9e1] p-1 rounded-lg">
                              <button
                                className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${
                                  editMode === 'fields' ? 'bg-white shadow-xs text-[#4338ca]' : 'text-[#6e6a63]'
                                }`}
                                onClick={() => setEditMode('fields')}
                              >
                                📑 分项编辑
                              </button>
                              <button
                                className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${
                                  editMode === 'raw' ? 'bg-white shadow-xs text-[#4338ca]' : 'text-[#6e6a63]'
                                }`}
                                onClick={() => setEditMode('raw')}
                              >
                                💻 HTML 源码模式
                              </button>
                            </div>
                          </div>
                        )}

                        {editMode === 'fields' ? (
                          <div className="flex flex-col gap-2.5">
                            <div>
                              <label className="text-[10px] font-semibold text-[#4338ca] block mb-1">📌 句型 / 用途说明</label>
                              <input
                                className="edit-input"
                                placeholder="例如：表达“在诸多繁杂要素中皆需做出考量/选择”"
                                value={editPattern}
                                onChange={e => setEditPattern(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#1d4ed8] block mb-1">📝 仿写模板 (Template)</label>
                              <textarea
                                className="edit-textarea font-mono"
                                rows={2}
                                placeholder="例如：Choices have to be made for almost every element, from [Item A] to [Item B], and even [Item C]."
                                value={editTemplate}
                                onChange={e => setEditTemplate(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#059669] block mb-1">💡 应用例句 (Example)</label>
                              <textarea
                                className="edit-textarea"
                                rows={2}
                                placeholder="例如：In digital marketing, choices have to be made for almost every element..."
                                value={editExample}
                                onChange={e => setEditExample(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#a09992' }}>
                              编辑 Special HTML 完整源码
                            </label>
                            <textarea
                              className="edit-textarea font-mono"
                              rows={8}
                              value={editRawHTML}
                              onChange={e => setEditRawHTML(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Live Preview */}
                        {previewHTML && (
                          <div className="golden-phrase-preview">
                            <span className="text-[10px] uppercase tracking-wider font-semibold block mb-2" style={{ color: '#a09992' }}>
                              🔍 实时渲染预览
                            </span>
                            <div
                              className="golden-phrase-content"
                              dangerouslySetInnerHTML={{ __html: previewHTML }}
                            />
                          </div>
                        )}
                      </div>
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
