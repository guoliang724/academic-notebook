'use client';

import { useState, useEffect, useRef } from 'react';
import type { Article, EditPanel, VocabItem } from '@/lib/types';

interface VocabTabProps {
  article: Article;
  editingPanels: Set<EditPanel>;
  onEnterEdit: (panel: EditPanel) => void;
  onCancelEdit: (panel: EditPanel) => void;
  onSave: (id: string, data: Partial<Article>) => Promise<void>;
}

interface SpecialBlock {
  title: string;
  isGolden: boolean;
  pattern: string;   // 句型/用途说明
  template: string;  // 模板 (Template)
  example: string;   // 例句 (Example)
  content: string;   // 通用 HTML/文本内容 (if !isGolden)
}

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

/**
 * Parse specialHTML into structured blocks.
 * Splits on <h5>...</h5> headers and extracts golden phrase fields if present.
 */
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

    if (rawTitle.includes('黄金句式') || rawContent.includes('模板：') || rawContent.includes('例句：')) {
      const pMatches = rawContent.match(/<p[\s\S]*?<\/p>/gi);
      const paragraphs = (pMatches && pMatches.length > 0) ? pMatches : [rawContent];

      for (const pStr of paragraphs) {
        if (!pStr.trim()) continue;
        let pattern = '';
        let template = '';
        let example = '';

        const patternMatch = pStr.match(/句型：([\s\S]*?)(?=<br\s*\/?>|模板：|例句：|<\/p>|$)/i);
        if (patternMatch) pattern = cleanHTMLText(patternMatch[1]);

        const templateMatch = pStr.match(/模板：([\s\S]*?)(?=<br\s*\/?>|例句：|<\/p>|$)/i);
        if (templateMatch) template = cleanHTMLText(templateMatch[1]);

        const exampleMatch = pStr.match(/例句：([\s\S]*?)(?=<br\s*\/?>|<\/p>|$)/i);
        if (exampleMatch) example = cleanHTMLText(exampleMatch[1]);

        if (pattern || template || example || rawTitle.includes('黄金句式')) {
          blocks.push({
            title: '✍️ 黄金句式仿写模板',
            isGolden: true,
            pattern,
            template,
            example,
            content: pStr,
          });
        } else {
          blocks.push({
            title: rawTitle,
            isGolden: false,
            pattern: '',
            template: '',
            example: '',
            content: pStr,
          });
        }
      }
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

/**
 * Serialize structured blocks back into specialHTML.
 * Ensures golden phrase blocks are ALWAYS grouped first under a SINGLE <h5>✍️ 黄金句式仿写模板</h5> header.
 */
function serializeSpecialBlocks(blocks: SpecialBlock[]): string {
  const goldenBlocks = blocks.filter(b => b.isGolden && (b.pattern.trim() || b.template.trim() || b.example.trim()));
  const otherBlocks = blocks.filter(b => !b.isGolden && (b.title.trim() || b.content.trim()));

  let goldenHTML = '';
  if (goldenBlocks.length > 0) {
    const paragraphs = goldenBlocks.map(b => {
      const patternPart = b.pattern.trim() ? `<strong>句型：${b.pattern.trim()}</strong><br/>` : '';
      const templatePart = b.template.trim() ? `模板：${b.template.trim()}<br/>` : '';
      const examplePart = b.example.trim() ? `例句：${b.example.trim()}` : '';
      return `<p>${patternPart}${templatePart}${examplePart}</p>`;
    }).join('');

    goldenHTML = `<h5>✍️ 黄金句式仿写模板</h5>${paragraphs}`;
  }

  const otherHTML = otherBlocks.map(b => {
    const titleStr = b.title.trim() ? `<h5>${b.title.trim()}</h5>` : '';
    return `${titleStr}${b.content.trim()}`;
  }).join('');

  return `${goldenHTML}${otherHTML}`;
}

export default function VocabTab({ article, editingPanels, onEnterEdit, onCancelEdit, onSave }: VocabTabProps) {
  const [editItems, setEditItems] = useState<VocabItem[]>([]);
  const [editSpecialBlocks, setEditSpecialBlocks] = useState<SpecialBlock[]>([]);
  const [editSpecialRaw, setEditSpecialRaw] = useState('');
  const [editMode, setEditMode] = useState<'blocks' | 'raw'>('blocks');

  const isEditingVocab = editingPanels.has('vocab');
  const isEditingSpecial = editingPanels.has('specialHTML');

  const specialBoxRef = useRef<HTMLDivElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  // Compute combined HTML for preview
  const currentPreviewHTML = editMode === 'blocks'
    ? serializeSpecialBlocks(editSpecialBlocks)
    : editSpecialRaw;

  // Re-typeset MathJax when specialHTML changes in view mode
  useEffect(() => {
    if (article.specialHTML && specialBoxRef.current) {
      const w = window as unknown as { MathJax?: { typesetPromise?: (el: HTMLElement[]) => Promise<void> } };
      if (w.MathJax?.typesetPromise) {
        w.MathJax.typesetPromise([specialBoxRef.current]).catch(() => {});
      }
    }
  }, [article.specialHTML, article.id]);

  // Re-typeset MathJax in live preview mode
  useEffect(() => {
    if (isEditingSpecial && currentPreviewHTML && previewBoxRef.current) {
      const w = window as unknown as { MathJax?: { typesetPromise?: (el: HTMLElement[]) => Promise<void> } };
      if (w.MathJax?.typesetPromise) {
        w.MathJax.typesetPromise([previewBoxRef.current]).catch(() => {});
      }
    }
  }, [currentPreviewHTML, isEditingSpecial]);

  // ── Vocab Edit Handlers ──
  const enterVocabEdit = () => {
    setEditItems(
      article.vocab.length > 0
        ? article.vocab.map(v => ({ ...v }))
        : [{ word: '', type: '', meaning: '', rating: '⭐⭐⭐', root: '' }]
    );
    onEnterEdit('vocab');
  };

  const saveVocab = async () => {
    const filtered = editItems.filter(v => v.word.trim());
    await onSave(article.id, { vocab: filtered });
    onCancelEdit('vocab');
  };

  const updateVocabItem = (index: number, field: keyof VocabItem, value: string) => {
    const next = [...editItems];
    next[index] = { ...next[index], [field]: value };
    setEditItems(next);
  };

  // ── Special HTML Edit Handlers ──
  const enterSpecialEdit = () => {
    const parsed = parseSpecialHTML(article.specialHTML || '');
    setEditSpecialBlocks(parsed);
    setEditSpecialRaw(article.specialHTML || '');
    setEditMode('blocks');
    onEnterEdit('specialHTML');
  };

  const saveSpecial = async () => {
    const finalHTML = editMode === 'blocks'
      ? serializeSpecialBlocks(editSpecialBlocks)
      : editSpecialRaw.trim();
    await onSave(article.id, { specialHTML: finalHTML });
    onCancelEdit('specialHTML');
  };

  const updateBlock = (index: number, field: keyof SpecialBlock, value: unknown) => {
    const next = [...editSpecialBlocks];
    next[index] = { ...next[index], [field]: value };
    setEditSpecialBlocks(next);
  };

  const toggleEditMode = (mode: 'blocks' | 'raw') => {
    if (mode === 'raw' && editMode === 'blocks') {
      setEditSpecialRaw(serializeSpecialBlocks(editSpecialBlocks));
    } else if (mode === 'blocks' && editMode === 'raw') {
      setEditSpecialBlocks(parseSpecialHTML(editSpecialRaw));
    }
    setEditMode(mode);
  };

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* ── Vocab View/Edit ── */}
      {!isEditingVocab ? (
        <div className="rounded-xl p-6 editable-card" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-sm font-bold" style={{ color: '#47433e' }}>💡 核心学术 / 法律词汇</h4>
            <button className="btn-edit" onClick={enterVocabEdit}>✏️ 编辑</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #d9d3cb' }}>
                  <th className="py-2.5 pr-4 font-semibold uppercase tracking-wider text-[10px]" style={{ color: '#a09992' }}>词汇</th>
                  <th className="py-2.5 pr-4 font-semibold uppercase tracking-wider text-[10px]" style={{ color: '#a09992' }}>词性 / 释义</th>
                  <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px]" style={{ color: '#a09992' }}>推荐度</th>
                </tr>
              </thead>
              <tbody>
                {article.vocab.length > 0 ? article.vocab.map((item, i) => (
                  <tr key={i} className="group" style={{ borderBottom: item.root ? 'none' : '1px solid rgba(217,211,203,0.7)' }}>
                    <td className="py-2.5 pr-4 font-medium font-mono" style={{ color: '#1d4ed8' }}>{item.word}</td>
                    <td className="py-2.5 pr-4" style={{ color: '#47433e' }}>
                      <span className="font-mono mr-1.5 text-[10px]" style={{ color: '#a09992' }}>[{item.type}]</span>
                      {item.meaning}
                    </td>
                    <td className="py-2.5" style={{ color: '#b45309' }}>{item.rating}</td>
                  </tr>
                )).reduce<React.ReactNode[]>((acc, row, i) => {
                  acc.push(row);
                  // Insert root explanation row if present
                  const item = article.vocab[i];
                  if (item.root && item.root.trim()) {
                    acc.push(
                      <tr key={`root-${i}`} style={{ borderBottom: '1px solid rgba(217,211,203,0.7)' }}>
                        <td colSpan={3} className="pb-2.5 pt-0">
                          <div className="vocab-root-row">
                            <span className="vocab-root-label">词根</span>
                            <span className="vocab-root-text">{item.root}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return acc;
                }, []) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center italic" style={{ color: '#a09992' }}>暂无核心词汇记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-6 edit-card fade-in" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold" style={{ color: '#4338ca' }}>✏️ 编辑词汇列表</h4>
            <div className="flex gap-2">
              <button className="btn-cancel" onClick={() => onCancelEdit('vocab')}>取消</button>
              <button className="btn-save" onClick={saveVocab}>💾 保存</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-3">
            {editItems.map((v, i) => (
              <div key={i} className="vocab-edit-block">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#a09992' }}>
                    词汇 {i + 1}
                  </span>
                  <button className="remove-btn" onClick={() => setEditItems(editItems.filter((_, j) => j !== i))}>✕</button>
                </div>
                <div className="vocab-edit-row">
                  <input className="edit-input font-mono" placeholder="词汇" value={v.word} onChange={e => updateVocabItem(i, 'word', e.target.value)} />
                  <input className="edit-input" placeholder="词性" value={v.type} onChange={e => updateVocabItem(i, 'type', e.target.value)} />
                  <input className="edit-input" placeholder="释义" value={v.meaning} onChange={e => updateVocabItem(i, 'meaning', e.target.value)} />
                  <input className="edit-input" placeholder="⭐⭐⭐" value={v.rating} onChange={e => updateVocabItem(i, 'rating', e.target.value)} />
                </div>
                <div className="mt-1.5">
                  <input
                    className="edit-input vocab-root-input"
                    placeholder="词根解释（如：co- (共同) + incide (落入) → 巧合）"
                    value={v.root || ''}
                    onChange={e => updateVocabItem(i, 'root', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setEditItems([...editItems, { word: '', type: '', meaning: '', rating: '⭐⭐⭐', root: '' }])}
            className="text-[10px] px-3 py-1.5 rounded transition-all"
            style={{ color: '#059669', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            ➕ 添加词汇
          </button>
        </div>
      )}

      {/* ── Special HTML Box (黄金句式仿写模版 & 深度拓展) ── */}
      {!isEditingSpecial ? (
        <div className="rounded-xl p-6 editable-card relative" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <button
            className="btn-edit absolute top-6 right-6 z-10"
            onClick={enterSpecialEdit}
          >
            ✏️ 编辑
          </button>

          {article.specialHTML && article.specialHTML.trim() ? (
            <div
              id="vocab-special-box"
              ref={specialBoxRef}
              dangerouslySetInnerHTML={{ __html: article.specialHTML }}
            />
          ) : (
            <div className="italic text-xs py-3 text-center" style={{ color: '#a09992' }}>
              暂无黄金句式仿写模板与拓展内容，点击右上角“编辑”添加
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl p-6 edit-card fade-in" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: '#4338ca' }}>
              ✏️ 编辑句式与拓展
            </h4>
            <div className="flex gap-2">
              <button className="btn-cancel" onClick={() => onCancelEdit('specialHTML')}>取消</button>
              <button className="btn-save" onClick={saveSpecial}>💾 保存</button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid #e2ddd7' }}>
            <span className="text-xs" style={{ color: '#6e6a63' }}>选择编辑模式：</span>
            <div className="flex gap-1 bg-[#ece9e1] p-1 rounded-lg">
              <button
                className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${
                  editMode === 'blocks' ? 'bg-white shadow-xs text-[#4338ca]' : 'text-[#6e6a63]'
                }`}
                onClick={() => toggleEditMode('blocks')}
              >
                📑 分段编辑
              </button>
              <button
                className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${
                  editMode === 'raw' ? 'bg-white shadow-xs text-[#4338ca]' : 'text-[#6e6a63]'
                }`}
                onClick={() => toggleEditMode('raw')}
              >
                💻 HTML 源码模式
              </button>
            </div>
          </div>

          {/* Mode 1: Segmented Blocks Editing */}
          {editMode === 'blocks' ? (
            <div className="flex flex-col gap-4 mb-3">
              {editSpecialBlocks.map((block, i) => (
                <div key={i} className="grammar-edit-block">
                  {/* Block Header */}
                  <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid rgba(217,211,203,0.5)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#a09992' }}>
                        {block.isGolden ? `✍️ 黄金句式条目 ${i + 1}` : `📄 自由拓展模块 ${i + 1}`}
                      </span>
                      {/* Toggle block type */}
                      <button
                        className="text-[10px] font-medium px-2 py-0.5 rounded transition-all cursor-pointer"
                        style={{
                          background: block.isGolden ? 'rgba(79,70,229,0.08)' : 'rgba(100,116,139,0.08)',
                          color: block.isGolden ? '#4338ca' : '#64748b',
                          border: block.isGolden ? '1px solid rgba(79,70,229,0.2)' : '1px solid rgba(100,116,139,0.2)',
                        }}
                        onClick={() => updateBlock(i, 'isGolden', !block.isGolden)}
                        title="点击切换：黄金句式模板 / 自由拓展模块"
                      >
                        {block.isGolden ? '切换为自由拓展' : '切换为黄金句式'}
                      </button>
                    </div>
                    <button className="remove-btn" onClick={() => setEditSpecialBlocks(editSpecialBlocks.filter((_, j) => j !== i))}>✕</button>
                  </div>

                  {/* Block Fields */}
                  {block.isGolden ? (
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label className="text-[10px] font-semibold text-[#4338ca] block mb-1">📌 句型 / 用途说明</label>
                        <input
                          className="edit-input"
                          placeholder="例如：描述人物/组织的职业发展与某个时代浪潮完美契合"
                          value={block.pattern}
                          onChange={e => updateBlock(i, 'pattern', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[#1d4ed8] block mb-1">📝 仿写模板 (Template)</label>
                        <textarea
                          className="edit-textarea font-mono"
                          rows={2}
                          placeholder="例如：The career of [person/organization], coincided with [historical movement]..."
                          value={block.template}
                          onChange={e => updateBlock(i, 'template', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[#059669] block mb-1">💡 应用例句 (Example)</label>
                        <textarea
                          className="edit-textarea"
                          rows={2}
                          placeholder="例如：The career of the pioneering software engineer coincided with..."
                          value={block.example}
                          onChange={e => updateBlock(i, 'example', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-[#6e6a63] block mb-1">分段标题</label>
                        <input
                          className="edit-input font-bold"
                          placeholder="例如：🏗️ 建筑结构学的核心革命"
                          value={block.title}
                          onChange={e => updateBlock(i, 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[#6e6a63] block mb-1">内容 (支持 HTML / 文字)</label>
                        <textarea
                          className="edit-textarea"
                          rows={4}
                          placeholder="分段内容（支持文字及 HTML 段落标签）"
                          value={block.content}
                          onChange={e => updateBlock(i, 'content', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditSpecialBlocks([
                    ...editSpecialBlocks,
                    { title: '✍️ 黄金句式仿写模板', isGolden: true, pattern: '', template: '', example: '', content: '' }
                  ])}
                  className="text-[10px] px-3 py-1.5 rounded transition-all font-semibold cursor-pointer"
                  style={{ color: '#4338ca', border: '1px solid rgba(67,56,202,0.3)', background: 'rgba(67,56,202,0.05)' }}
                >
                  ➕ 添加句式模板
                </button>
                <button
                  onClick={() => setEditSpecialBlocks([
                    ...editSpecialBlocks,
                    { title: '🚿 深度拓展', isGolden: false, pattern: '', template: '', example: '', content: '' }
                  ])}
                  className="text-[10px] px-3 py-1.5 rounded transition-all font-semibold cursor-pointer"
                  style={{ color: '#059669', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}
                >
                  ➕ 添加通用拓展
                </button>
              </div>
            </div>
          ) : (
            /* Mode 2: Raw HTML Mode */
            <div className="flex flex-col gap-2 mb-3">
              <label className="block text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#a09992' }}>
                HTML 完整源码（支持 &lt;h5&gt; 标题、&lt;p&gt; 段落及 &lt;strong&gt; 粗体）
              </label>
              <textarea
                className="edit-textarea font-mono"
                rows={10}
                placeholder="输入 HTML 内容..."
                value={editSpecialRaw}
                onChange={e => setEditSpecialRaw(e.target.value)}
              />
            </div>
          )}

          {/* Live Preview */}
          {currentPreviewHTML.trim() && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px dashed #d9d3cb' }}>
              <span className="text-[10px] uppercase tracking-wider font-semibold block mb-2" style={{ color: '#a09992' }}>
                🔍 实时渲染预览
              </span>
              <div
                id="vocab-special-box"
                ref={previewBoxRef}
                className="p-4 rounded-lg"
                style={{ background: '#f8f6f1', border: '1px solid #e2ddd7' }}
                dangerouslySetInnerHTML={{ __html: currentPreviewHTML }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
