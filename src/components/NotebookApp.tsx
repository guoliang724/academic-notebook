'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Article, Template, TabId, EditPanel } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import SourceCard from '@/components/SourceCard';
import TabBar from '@/components/TabBar';
import TranslationTab from '@/components/TranslationTab';
import GrammarTab from '@/components/GrammarTab';
import VocabTab from '@/components/VocabTab';
import ImportModal from '@/components/ImportModal';
import TemplateModal from '@/components/TemplateModal';

export default function NotebookApp() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabId>('translation');
  const [editingPanels, setEditingPanels] = useState<Set<EditPanel>>(new Set());
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const toastRef = useRef<HTMLDivElement>(null);

  const currentArticle = articles.find(a => a.id === currentArticleId) || null;

  // ── Fetch data ──
  const fetchArticles = useCallback(async () => {
    const res = await fetch('/api/articles');
    if (res.ok) {
      const data = await res.json();
      setArticles(data);
      return data as Article[];
    }
    return [];
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch('/api/templates');
    if (res.ok) setTemplates(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([fetchArticles(), fetchTemplates()]).then(([arts]) => {
      if (arts.length > 0 && !currentArticleId) {
        setCurrentArticleId(arts[arts.length - 1].id);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Article CRUD ──
  const switchArticle = useCallback((id: string) => {
    setEditingPanels(new Set());
    setCurrentArticleId(id);
    setCurrentTab('translation');
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!confirm(`确定要删除「${article?.title || '此语料'}」吗？`)) return;

    const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const remaining = articles.filter(a => a.id !== id);
      setArticles(remaining);
      if (currentArticleId === id) {
        setCurrentArticleId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
      }
    }
  }, [articles, currentArticleId]);

  const importArticles = useCallback(async (jsonText: string): Promise<string | null> => {
    try {
      let cleanText = jsonText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanText);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      if (items.length === 0) return 'JSON 数组为空';

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });

      if (!res.ok) {
        const err = await res.json();
        return err.error || '导入失败';
      }

      const newArticles = await res.json() as Article[];
      setArticles(prev => [...prev, ...newArticles]);
      if (newArticles.length > 0) {
        setCurrentArticleId(newArticles[newArticles.length - 1].id);
        setCurrentTab('translation');
      }
      return null;
    } catch (e) {
      return 'JSON 解析失败：' + (e as Error).message;
    }
  }, []);

  const updateArticle = useCallback(async (id: string, data: Partial<Article>) => {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updated = await res.json() as Article;
      setArticles(prev => prev.map(a => a.id === id ? updated : a));
    }
  }, []);

  // ── Edit mode ──
  const enterEditMode = useCallback((panel: EditPanel) => {
    setEditingPanels(prev => new Set(prev).add(panel));
  }, []);

  const cancelEditMode = useCallback((panel: EditPanel) => {
    setEditingPanels(prev => {
      const next = new Set(prev);
      next.delete(panel);
      return next;
    });
  }, []);

  // ── Template CRUD ──
  const createTemplate = useCallback(async (data: { name: string; category: string; content: string }) => {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json() as Template;
      setTemplates(prev => [...prev, created]);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, data: Partial<Template>) => {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json() as Template;
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!confirm(`确定要删除「${template?.name || '此模板'}」吗？`)) return;

    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  }, [templates]);

  const showCopyToast = useCallback(() => {
    const toast = toastRef.current;
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f2ec' }}>
        <div className="text-center">
          <span className="text-4xl block mb-4">📚</span>
          <p className="text-sm" style={{ color: '#6e6a63' }}>正在加载知识库...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f2ec' }}>
      {/* ── Header ── */}
      <header className="px-6 py-4" style={{ borderBottom: '1px solid #d9d3cb' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight" style={{ color: '#1c1814' }}>
              📚 学术英语 & 法律写作终极笔记本
            </h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(29,78,216,0.08)', color: '#1d4ed8', border: '1px solid rgba(29,78,216,0.15)' }}>
              V9.0 Next.js
            </span>
          </div>
          <button
            onClick={() => setTemplateModalOpen(true)}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
            style={{
              background: 'rgba(79,70,229,0.08)',
              color: '#4338ca',
              border: '1px solid rgba(79,70,229,0.2)',
            }}
          >
            📚 全局模板库
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6" style={{ minHeight: 'calc(100vh - 65px)' }}>

        {/* Sidebar */}
        <Sidebar
          articles={articles}
          currentArticleId={currentArticleId}
          onSwitchArticle={switchArticle}
          onDeleteArticle={deleteArticle}
          onOpenImport={() => setImportModalOpen(true)}
        />

        {/* Main Content */}
        {currentArticle ? (
          <main className="flex-1 min-w-0 flex flex-col gap-5">
            <SourceCard article={currentArticle} />

            <TabBar currentTab={currentTab} onSwitchTab={setCurrentTab} />

            {currentTab === 'translation' && (
              <TranslationTab
                article={currentArticle}
                editingPanels={editingPanels}
                onEnterEdit={enterEditMode}
                onCancelEdit={cancelEditMode}
                onSave={updateArticle}
              />
            )}

            {currentTab === 'grammar' && (
              <GrammarTab
                article={currentArticle}
                editingPanels={editingPanels}
                onEnterEdit={enterEditMode}
                onCancelEdit={cancelEditMode}
                onSave={updateArticle}
              />
            )}

            {currentTab === 'vocabulary' && (
              <VocabTab
                article={currentArticle}
                editingPanels={editingPanels}
                onEnterEdit={enterEditMode}
                onCancelEdit={cancelEditMode}
                onSave={updateArticle}
              />
            )}
          </main>
        ) : (
          <main className="flex-1 flex items-center justify-center rounded-2xl"
            style={{ border: '2px dashed #d9d3cb' }}>
            <div className="text-center p-8">
              <span className="text-4xl block mb-4">📚</span>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#1c1814' }}>你的专属学术知识库</h2>
              <p className="text-sm mb-6 max-w-md" style={{ color: '#6e6a63' }}>
                当前题库中还没有文章。请点击左侧的&quot;导入&quot;按钮，将 AI 为你生成的专属 JSON 代码粘贴进去即可开始学习。
              </p>
              <button
                onClick={() => setImportModalOpen(true)}
                className="font-semibold px-6 py-2.5 rounded-lg transition-all text-white text-sm"
                style={{ background: '#059669' }}
              >
                立即导入第一篇语料
              </button>
            </div>
          </main>
        )}
      </div>

      {/* ── Modals ── */}
      {importModalOpen && (
        <ImportModal
          onClose={() => setImportModalOpen(false)}
          onImport={importArticles}
        />
      )}

      {templateModalOpen && (
        <TemplateModal
          templates={templates}
          onClose={() => setTemplateModalOpen(false)}
          onCreate={createTemplate}
          onUpdate={updateTemplate}
          onDelete={deleteTemplate}
          onCopyToast={showCopyToast}
        />
      )}

      {/* Copy Toast */}
      <div ref={toastRef} className="copy-toast">✅ 已复制到剪贴板！</div>
    </div>
  );
}
