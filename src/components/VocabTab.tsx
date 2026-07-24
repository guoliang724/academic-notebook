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

export default function VocabTab({ article, editingPanels, onEnterEdit, onCancelEdit, onSave }: VocabTabProps) {
  const [editItems, setEditItems] = useState<VocabItem[]>([]);
  const isEditing = editingPanels.has('vocab');
  const specialBoxRef = useRef<HTMLDivElement>(null);

  // Re-typeset MathJax when specialHTML changes
  useEffect(() => {
    if (article.specialHTML && specialBoxRef.current) {
      const w = window as unknown as { MathJax?: { typesetPromise?: (el: HTMLElement[]) => Promise<void> } };
      if (w.MathJax?.typesetPromise) {
        w.MathJax.typesetPromise([specialBoxRef.current]).catch(() => {});
      }
    }
  }, [article.specialHTML, article.id]);

  const enterEdit = () => {
    setEditItems(
      article.vocab.length > 0
        ? article.vocab.map(v => ({ ...v }))
        : [{ word: '', type: '', meaning: '', rating: '⭐⭐⭐', root: '' }]
    );
    onEnterEdit('vocab');
  };

  const save = async () => {
    const filtered = editItems.filter(v => v.word.trim());
    await onSave(article.id, { vocab: filtered });
    onCancelEdit('vocab');
  };

  const updateItem = (index: number, field: keyof VocabItem, value: string) => {
    const next = [...editItems];
    next[index] = { ...next[index], [field]: value };
    setEditItems(next);
  };

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* ── Vocab View/Edit ── */}
      {!isEditing ? (
        <div className="rounded-xl p-6 editable-card" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-sm font-bold" style={{ color: '#47433e' }}>💡 核心学术 / 法律词汇</h4>
            <button className="btn-edit" onClick={enterEdit}>✏️ 编辑</button>
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
              <button className="btn-save" onClick={save}>💾 保存</button>
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
                  <input className="edit-input font-mono" placeholder="词汇" value={v.word} onChange={e => updateItem(i, 'word', e.target.value)} />
                  <input className="edit-input" placeholder="词性" value={v.type} onChange={e => updateItem(i, 'type', e.target.value)} />
                  <input className="edit-input" placeholder="释义" value={v.meaning} onChange={e => updateItem(i, 'meaning', e.target.value)} />
                  <input className="edit-input" placeholder="⭐⭐⭐" value={v.rating} onChange={e => updateItem(i, 'rating', e.target.value)} />
                </div>
                <div className="mt-1.5">
                  <input
                    className="edit-input vocab-root-input"
                    placeholder="词根解释（如：co- (共同) + incide (落入) → 共同落入同一时间 → 巧合）"
                    value={v.root || ''}
                    onChange={e => updateItem(i, 'root', e.target.value)}
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

      {/* ── Special HTML Box ── */}
      {article.specialHTML && article.specialHTML.trim() && (
        <div
          id="vocab-special-box"
          ref={specialBoxRef}
          className="rounded-xl p-6"
          style={{ background: '#fff', border: '1px solid #d9d3cb' }}
          dangerouslySetInnerHTML={{ __html: article.specialHTML }}
        />
      )}
    </div>
  );
}
