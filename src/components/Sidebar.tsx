'use client';

import type { Article } from '@/lib/types';

interface SidebarProps {
  articles: Article[];
  currentArticleId: string | null;
  onSwitchArticle: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  onOpenImport: () => void;
}

export default function Sidebar({ articles, currentArticleId, onSwitchArticle, onDeleteArticle, onOpenImport }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 flex flex-col gap-4">
      <div className="rounded-xl p-4" style={{ background: '#ece9e1', border: '1px solid #d9d3cb' }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6e6a63' }}>
            已汇整语料库
          </h3>
          <button
            onClick={onOpenImport}
            className="text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1"
            style={{
              background: 'rgba(5,150,105,0.1)',
              color: '#059669',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            ➕ 导入
          </button>
        </div>
        <nav className="flex flex-col gap-1 max-h-[500px] overflow-y-auto">
          {articles.map(article => (
            <div
              key={article.id}
              className={`article-item ${article.id === currentArticleId ? 'active' : ''}`}
            >
              <button
                className="article-btn"
                title={article.title}
                onClick={() => onSwitchArticle(article.id)}
              >
                {article.title}
              </button>
              <button
                className="delete-btn"
                title="删除此语料"
                onClick={(e) => { e.stopPropagation(); onDeleteArticle(article.id); }}
              >
                🗑
              </button>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
