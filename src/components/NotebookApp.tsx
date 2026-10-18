'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Article, ArticleStatus, TabId, EditPanel } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import SourceCard from '@/components/SourceCard';
import TabBar from '@/components/TabBar';
import TranslationTab from '@/components/TranslationTab';
import GrammarTab from '@/components/GrammarTab';
import VocabTab from '@/components/VocabTab';
import ImportModal from '@/components/ImportModal';
import GoldenPhraseModal from '@/components/GoldenPhraseModal';
import WordListModal from '@/components/WordListModal';

const PROGRESS_KEY = 'toefl-progress-v1';

export default function NotebookApp() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabId>('translation');
  const [editingPanels, setEditingPanels] = useState<Set<EditPanel>>(new Set());
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [goldenPhraseModalOpen, setGoldenPhraseModalOpen] = useState(false);
  const [wordListOpen, setWordListOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Visitors can't write to the database, so their learning progress lives in this browser
  const [localStatus, setLocalStatus] = useState<Record<string, ArticleStatus>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    } catch {
      return {}; // storage unavailable: progress just isn't remembered
    }
  });
  const [loading, setLoading] = useState(true);
  const toastRef = useRef<HTMLDivElement>(null);

  const viewArticles = isAdmin ? articles : articles.map(a => ({ ...a, status: localStatus[a.id] || 'new' }));
  const currentIndex = viewArticles.findIndex(a => a.id === currentArticleId);
  const currentArticle = currentIndex >= 0 ? viewArticles[currentIndex] : null;

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

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setIsAdmin(Boolean(d.admin))).catch(() => {});
    fetchArticles().then((arts) => {
      if (arts.length > 0 && !currentArticleId) {
        setCurrentArticleId(arts[0].id);
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

  const setArticleStatus = useCallback((id: string, status: ArticleStatus) => {
    if (!isAdmin) {
      setLocalStatus(prev => {
        const next = { ...prev, [id]: status };
        try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
      return;
    }
    // Optimistic: the status pill and progress bar update immediately
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    updateArticle(id, { status });
  }, [updateArticle, isAdmin]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdmin(false);
    setEditingPanels(new Set());
  }, []);

  // ── Reorder articles (drag-and-drop), persisted via PATCH /api/articles ──
  const reorderArticles = useCallback((fromId: string, toId: string) => {
    setArticles(prev => {
      const fromIndex = prev.findIndex(a => a.id === fromId);
      const toIndex = prev.findIndex(a => a.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      fetch('/api/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: next.map(a => a.id) }),
      });
      return next.map((a, i) => ({ ...a, sortOrder: (i + 1) * 10 }));
    });
  }, []);

  // ── Previous / next article (buttons and ← → keys) ──
  const goRelative = useCallback((delta: number) => {
    const target = viewArticles[currentIndex + delta];
    if (target) switchArticle(target.id);
  }, [viewArticles, currentIndex, switchArticle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (editingPanels.size > 0 || importModalOpen || goldenPhraseModalOpen || wordListOpen) return;
      if (e.key === 'ArrowLeft') goRelative(-1);
      else if (e.key === 'ArrowRight') goRelative(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goRelative, editingPanels, importModalOpen, goldenPhraseModalOpen, wordListOpen]);

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
              V10.0 · TOEFL 词汇分类突破
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <button onClick={logout} className="text-[11px] px-2" style={{ color: '#6e6a63' }} title="退出管理员登录">
                🔓 管理员 · 退出
              </button>
            ) : (
              <Link href="/login" className="text-[11px] px-2" style={{ color: '#a09992' }}>🔐 管理员登录</Link>
            )}
            <button
              onClick={() => setWordListOpen(true)}
              className="header-btn"
              style={{
                background: 'rgba(5,150,105,0.08)',
                color: '#047857',
                border: '1px solid rgba(5,150,105,0.2)',
              }}
            >
              📖 词汇总表
            </button>
            <button
              onClick={() => setGoldenPhraseModalOpen(true)}
              className="header-btn"
              style={{
                background: 'rgba(79,70,229,0.08)',
                color: '#4338ca',
                border: '1px solid rgba(79,70,229,0.2)',
              }}
            >
              ✍️ 黄金句式汇总
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="main-layout max-w-7xl mx-auto px-6 py-6 flex gap-6" style={{ minHeight: 'calc(100vh - 65px)' }}>

        {/* Sidebar */}
        <Sidebar
          articles={viewArticles}
          canEdit={isAdmin}
          currentArticleId={currentArticleId}
          onSwitchArticle={switchArticle}
          onDeleteArticle={deleteArticle}
          onOpenImport={() => setImportModalOpen(true)}
          onReorder={reorderArticles}
        />

        {/* Main Content */}
        {currentArticle ? (
          <main className="flex-1 min-w-0 flex flex-col gap-5">
            <SourceCard
              article={currentArticle}
              onSetStatus={(status) => setArticleStatus(currentArticle.id, status)}
              onPrev={currentIndex > 0 ? () => goRelative(-1) : undefined}
              onNext={currentIndex < articles.length - 1 ? () => goRelative(1) : undefined}
            />

            <TabBar currentTab={currentTab} onSwitchTab={setCurrentTab} />

            {currentTab === 'translation' && (
              <TranslationTab
                article={currentArticle}
                editingPanels={editingPanels}
                onEnterEdit={enterEditMode}
                onCancelEdit={cancelEditMode}
                onSave={updateArticle}
                canEdit={isAdmin}
              />
            )}

            {currentTab === 'grammar' && (
              <GrammarTab
                article={currentArticle}
                editingPanels={editingPanels}
                onEnterEdit={enterEditMode}
                onCancelEdit={cancelEditMode}
                onSave={updateArticle}
                canEdit={isAdmin}
              />
            )}

            {currentTab === 'vocabulary' && (
              <VocabTab
                article={currentArticle}
                editingPanels={editingPanels}
                onEnterEdit={enterEditMode}
                onCancelEdit={cancelEditMode}
                onSave={updateArticle}
                canEdit={isAdmin}
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
{isAdmin && (
              <button
                onClick={() => setImportModalOpen(true)}
                className="font-semibold px-6 py-2.5 rounded-lg transition-all text-white text-sm"
                style={{ background: '#059669' }}
              >
                立即导入第一篇语料
              </button>
              )}
            </div>
          </main>
        )}
      </div>

      {/* ── Modals ── */}
      {importModalOpen && isAdmin && (
        <ImportModal
          onClose={() => setImportModalOpen(false)}
          onImport={importArticles}
        />
      )}

      {goldenPhraseModalOpen && (
        <GoldenPhraseModal
          articles={articles}
          onClose={() => setGoldenPhraseModalOpen(false)}
          onCopyToast={showCopyToast}
          onUpdateArticle={updateArticle}
          canEdit={isAdmin}
        />
      )}

      {wordListOpen && (
        <WordListModal
          articles={viewArticles}
          onClose={() => setWordListOpen(false)}
          onJump={(id) => { setWordListOpen(false); switchArticle(id); }}
        />
      )}

      {/* Copy Toast */}
      <div ref={toastRef} className="copy-toast">✅ 已复制到剪贴板！</div>
    </div>
  );
}
