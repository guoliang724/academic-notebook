'use client';

import { useState } from 'react';
import type { Article, EditPanel, GrammarItem } from '@/lib/types';

interface GrammarTabProps {
  article: Article;
  editingPanels: Set<EditPanel>;
  onEnterEdit: (panel: EditPanel) => void;
  onCancelEdit: (panel: EditPanel) => void;
  onSave: (id: string, data: Partial<Article>) => Promise<void>;
}

export default function GrammarTab({ article, editingPanels, onEnterEdit, onCancelEdit, onSave }: GrammarTabProps) {
  const [editItems, setEditItems] = useState<GrammarItem[]>([]);
  const isEditing = editingPanels.has('grammar');

  const enterEdit = () => {
    setEditItems(
      article.grammar.length > 0
        ? article.grammar.map(g => ({ ...g }))
        : [{ title: '', skeleton: '', notes: '' }]
    );
    onEnterEdit('grammar');
  };

  const save = async () => {
    const filtered = editItems.filter(g => g.title || g.skeleton || g.notes);
    await onSave(article.id, { grammar: filtered });
    onCancelEdit('grammar');
  };

  const updateItem = (index: number, field: keyof GrammarItem, value: string) => {
    const next = [...editItems];
    next[index] = { ...next[index], [field]: value };
    setEditItems(next);
  };

  return (
    <div className="flex flex-col gap-5 fade-in">
      {!isEditing ? (
        <div className="rounded-xl p-6 editable-card" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-sm font-bold" style={{ color: '#47433e' }}>🔍 核心句型骨架拆解</h4>
            <button className="btn-edit" onClick={enterEdit}>✏️ 编辑</button>
          </div>
          <div className="space-y-3">
            {article.grammar.length > 0 ? article.grammar.map((item, i) => (
              <div key={i} className="grammar-view-card">
                <p className="font-semibold text-sm mb-1.5" style={{ color: '#2e2b27' }}>{item.title}</p>
                <p className="text-xs font-mono mb-2 leading-relaxed" style={{ color: '#1d4ed8' }}>{item.skeleton}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6e6a63' }}>{item.notes}</p>
              </div>
            )) : (
              <div className="grammar-view-card italic text-xs" style={{ color: '#a09992' }}>暂无核心句型骨架拆解</div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-6 edit-card fade-in" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold" style={{ color: '#4338ca' }}>✏️ 编辑语法句式</h4>
            <div className="flex gap-2">
              <button className="btn-cancel" onClick={() => onCancelEdit('grammar')}>取消</button>
              <button className="btn-save" onClick={save}>💾 保存</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-3">
            {editItems.map((g, i) => (
              <div key={i} className="grammar-edit-block">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#a09992' }}>
                    条目 {i + 1}
                  </span>
                  <button className="remove-btn" onClick={() => setEditItems(editItems.filter((_, j) => j !== i))}>✕</button>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    className="edit-input"
                    placeholder="语法现象名称（title）"
                    value={g.title}
                    onChange={e => updateItem(i, 'title', e.target.value)}
                  />
                  <input
                    className="edit-input font-mono"
                    placeholder="句型骨架（skeleton）"
                    value={g.skeleton}
                    onChange={e => updateItem(i, 'skeleton', e.target.value)}
                  />
                  <textarea
                    className="edit-textarea"
                    rows={2}
                    placeholder="详细说明（notes）"
                    value={g.notes}
                    onChange={e => updateItem(i, 'notes', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setEditItems([...editItems, { title: '', skeleton: '', notes: '' }])}
            className="text-[10px] px-3 py-1.5 rounded transition-all"
            style={{ color: '#059669', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            ➕ 添加语法条目
          </button>
        </div>
      )}
    </div>
  );
}
