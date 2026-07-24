'use client';

import { useState } from 'react';
import type { Article, EditPanel } from '@/lib/types';

interface TranslationTabProps {
  article: Article;
  editingPanels: Set<EditPanel>;
  onEnterEdit: (panel: EditPanel) => void;
  onCancelEdit: (panel: EditPanel) => void;
  onSave: (id: string, data: Partial<Article>) => Promise<void>;
}

export default function TranslationTab({ article, editingPanels, onEnterEdit, onCancelEdit, onSave }: TranslationTabProps) {
  const [editTranslation, setEditTranslation] = useState('');
  const [editInsights, setEditInsights] = useState<string[]>([]);

  const isEditingTranslation = editingPanels.has('translation');
  const isEditingInsights = editingPanels.has('insights');

  const enterTranslationEdit = () => {
    setEditTranslation(article.translation || '');
    onEnterEdit('translation');
  };

  const saveTranslation = async () => {
    await onSave(article.id, { translation: editTranslation.trim() });
    onCancelEdit('translation');
  };

  const enterInsightsEdit = () => {
    setEditInsights(article.insights.length > 0 ? [...article.insights] : ['']);
    onEnterEdit('insights');
  };

  const saveInsights = async () => {
    const filtered = editInsights.map(s => s.trim()).filter(Boolean);
    await onSave(article.id, { insights: filtered });
    onCancelEdit('insights');
  };

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* ── Translation View/Edit ── */}
      {!isEditingTranslation ? (
        <div className="rounded-xl p-6 editable-card" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: '#059669' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              精雕学术译文
            </h4>
            <button className="btn-edit" onClick={enterTranslationEdit}>✏️ 编辑</button>
          </div>
          <p className="leading-relaxed text-sm" style={{ color: '#47433e' }}>
            {article.translation || <span className="italic" style={{ color: '#a09992' }}>暂无译文</span>}
          </p>
        </div>
      ) : (
        <div className="rounded-xl p-6 edit-card fade-in" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: '#4338ca' }}>✏️ 编辑译文</h4>
            <div className="flex gap-2">
              <button className="btn-cancel" onClick={() => onCancelEdit('translation')}>取消</button>
              <button className="btn-save" onClick={saveTranslation}>💾 保存</button>
            </div>
          </div>
          <textarea
            className="edit-textarea"
            rows={6}
            placeholder="输入中文译文..."
            value={editTranslation}
            onChange={e => setEditTranslation(e.target.value)}
          />
        </div>
      )}

      {/* ── Insights View/Edit ── */}
      {!isEditingInsights ? (
        <div className="rounded-xl p-6 editable-card" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-sm font-bold" style={{ color: '#47433e' }}>💡 翻译心法拆解</h4>
            <button className="btn-edit" onClick={enterInsightsEdit}>✏️ 编辑</button>
          </div>
          <ul className="space-y-2.5 text-sm list-none" style={{ color: '#6e6a63' }}>
            {article.insights.length > 0 ? article.insights.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 shrink-0" style={{ color: '#059669' }}>•</span>
                <span>{item}</span>
              </li>
            )) : (
              <li className="italic" style={{ color: '#a09992' }}>暂无翻译技巧剖析</li>
            )}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl p-6 edit-card fade-in" style={{ background: '#fff', border: '1px solid #d9d3cb' }}>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold" style={{ color: '#4338ca' }}>✏️ 编辑翻译心法</h4>
            <div className="flex gap-2">
              <button className="btn-cancel" onClick={() => onCancelEdit('insights')}>取消</button>
              <button className="btn-save" onClick={saveInsights}>💾 保存</button>
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            {editInsights.map((text, i) => (
              <div key={i} className="insight-edit-row">
                <textarea
                  className="edit-textarea"
                  rows={2}
                  placeholder="输入一条翻译技巧..."
                  value={text}
                  onChange={e => {
                    const next = [...editInsights];
                    next[i] = e.target.value;
                    setEditInsights(next);
                  }}
                />
                <button className="remove-btn" onClick={() => setEditInsights(editInsights.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setEditInsights([...editInsights, ''])}
            className="text-[10px] px-3 py-1.5 rounded transition-all"
            style={{ color: '#059669', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            ➕ 添加一条技巧
          </button>
        </div>
      )}
    </div>
  );
}
