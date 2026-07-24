'use client';

import { useState, useMemo } from 'react';
import type { Template } from '@/lib/types';

interface TemplateModalProps {
  templates: Template[];
  onClose: () => void;
  onCreate: (data: { name: string; category: string; content: string }) => Promise<void>;
  onUpdate: (id: string, data: Partial<Template>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCopyToast: () => void;
}

const TPL_CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '法律/商业': { bg: 'rgba(245,158,11,0.13)', text: '#b45309', border: 'rgba(245,158,11,0.3)' },
  '学术论证': { bg: 'rgba(59,130,246,0.13)', text: '#1d4ed8', border: 'rgba(59,130,246,0.3)' },
  '社会分析': { bg: 'rgba(139,92,246,0.13)', text: '#6d28d9', border: 'rgba(139,92,246,0.3)' },
  '学术定义': { bg: 'rgba(16,185,129,0.13)', text: '#059669', border: 'rgba(16,185,129,0.3)' },
};

const DEFAULT_CAT_COLOR = { bg: 'rgba(100,116,139,0.12)', text: '#6e6a63', border: 'rgba(100,116,139,0.3)' };

function escHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlightPlaceholders(text: string) {
  return escHtml(text).replace(/\[([^\]]+)\]/g, (_, inner) =>
    `<span class="template-placeholder">[${inner}]</span>`
  );
}

export default function TemplateModal({ templates, onClose, onCreate, onUpdate, onDelete, onCopyToast }: TemplateModalProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formContent, setFormContent] = useState('');

  const categories = useMemo(() => {
    return [...new Set(templates.map(t => t.category).filter(Boolean))].sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter(t => {
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      const matchC = !catFilter || t.category === catFilter;
      return matchQ && matchC;
    });
  }, [templates, search, catFilter]);

  const openAddForm = () => {
    setEditingId(null);
    setFormName(''); setFormCategory(''); setFormContent('');
    setShowForm(true);
  };

  const openEditForm = (t: Template) => {
    setEditingId(t.id);
    setFormName(t.name); setFormCategory(t.category); setFormContent(t.content);
    setShowForm(true);
  };

  const saveForm = async () => {
    if (!formName.trim() || !formContent.trim()) {
      alert('请填写模板名称和内容！');
      return;
    }
    if (editingId) {
      await onUpdate(editingId, { name: formName.trim(), category: formCategory.trim() || '未分类', content: formContent.trim() });
    } else {
      await onCreate({ name: formName.trim(), category: formCategory.trim() || '未分类', content: formContent.trim() });
    }
    setShowForm(false);
  };

  const copyTemplate = (content: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(onCopyToast).catch(() => {
        // fallback
        const el = document.createElement('textarea');
        el.value = content;
        el.style.cssText = 'position:fixed;top:-999px;opacity:0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        el.remove();
        onCopyToast();
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl relative" style={{ background: '#f4f2ec', border: '1px solid #d9d3cb' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #d9d3cb' }}>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1c1814' }}>📚 全局模板库</h2>
            <p className="text-xs mt-0.5" style={{ color: '#a09992' }}>管理句型模板，点击「复制」一键使用</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddForm}
              className="text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 text-white"
              style={{ background: '#4338ca' }}
            >
              ➕ 新增模板
            </button>
            <button
              onClick={onClose}
              className="text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-all ml-1"
              style={{ color: '#6e6a63' }}
            >✕</button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="px-6 py-3 flex gap-3 shrink-0 items-center" style={{ borderBottom: '1px solid rgba(217,211,203,0.5)' }}>
          <input
            type="text"
            className="tpl-search-input"
            placeholder="🔍  搜索模板名称或内容..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="tpl-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">全部分类</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="px-6 pt-4 pb-0 shrink-0">
            <div className="tpl-add-form mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold" style={{ color: '#4338ca' }}>
                  {editingId ? '✏️ 编辑模板' : '✏️ 新增模板'}
                </h3>
                <div className="flex gap-2">
                  <button className="btn-cancel" onClick={() => setShowForm(false)}>取消</button>
                  <button className="btn-save" onClick={saveForm}>💾 保存</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <input className="edit-input" placeholder="模板名称" value={formName} onChange={e => setFormName(e.target.value)} />
                <input className="edit-input" placeholder="分类（如：学术论证）" value={formCategory} onChange={e => setFormCategory(e.target.value)} />
                <textarea className="edit-textarea" rows={3} placeholder="模板内容，用 [Placeholder] 标记占位符..." value={formContent} onChange={e => setFormContent(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Template Cards */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(t => {
                const col = TPL_CAT_COLORS[t.category] || DEFAULT_CAT_COLOR;
                return (
                  <div key={t.id} className="template-card">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className="category-badge" style={{ background: col.bg, color: col.text, borderColor: col.border }}>
                        {t.category || '未分类'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button className="tpl-copy-btn" onClick={() => copyTemplate(t.content)}>📋 复制</button>
                        <button className="tpl-icon-btn" onClick={() => openEditForm(t)} title="编辑">✏️</button>
                        <button className="tpl-icon-btn danger" onClick={() => onDelete(t.id)} title="删除">🗑</button>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold mb-2.5" style={{ color: '#2e2b27' }}>{t.name}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#47433e' }}
                      dangerouslySetInnerHTML={{ __html: highlightPlaceholders(t.content) }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-center">
              <div>
                <span className="text-4xl block mb-4">📭</span>
                <p className="text-sm" style={{ color: '#a09992' }}>
                  {search || catFilter ? '没有匹配的模板' : '模板库为空，点击「新增模板」开始创建'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
