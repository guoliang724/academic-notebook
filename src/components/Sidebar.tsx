'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Article } from '@/lib/types';
import { TOPICS, CUSTOM_TOPIC, matchesTopic, type TopicFilter } from '@/lib/topics';

interface SidebarProps {
  articles: Article[];
  currentArticleId: string | null;
  onSwitchArticle: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  onOpenImport: () => void;
  onReorder: (fromId: string, toId: string) => void;
  canEdit: boolean;
}

type StatusFilter = 'all' | 'todo' | 'mastered';

function matchesSearch(article: Article, q: string): boolean {
  if (!q) return true;
  return article.title.toLowerCase().includes(q)
    || article.body.toLowerCase().includes(q)
    || article.vocab.some(v => v.word.toLowerCase().includes(q) || v.meaning.includes(q));
}

export default function Sidebar({ articles, currentArticleId, onSwitchArticle, onDeleteArticle, onOpenImport, onReorder, canEdit }: SidebarProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const navRef = useRef<HTMLElement>(null);

  const q = search.trim().toLowerCase();
  const visible = useMemo(() => articles.filter(a =>
    matchesTopic(a, topicFilter)
    && (statusFilter === 'all' || (statusFilter === 'mastered') === (a.status === 'mastered'))
    && matchesSearch(a, q)
  ), [articles, topicFilter, statusFilter, q]);

  // Drag-to-sort only makes sense on the complete, unfiltered list
  const canDrag = canEdit && topicFilter === 'all' && statusFilter === 'all' && !q;

  const mastered = articles.filter(a => a.status === 'mastered').length;
  const hasCustom = articles.some(a => a.unit === null);
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      const key = a.unit === null ? CUSTOM_TOPIC.id : a.topic;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [articles]);

  // Keep the active item visible when switching with the keyboard / prev-next buttons
  useEffect(() => {
    const el = navRef.current?.querySelector('.article-item.active');
    el?.scrollIntoView({ block: 'nearest' });
  }, [currentArticleId]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Capture the element ref before React nullifies the synthetic event
    const el = e.currentTarget as HTMLElement;
    // Add dragging class after a tick so the element doesn't disappear immediately
    requestAnimationFrame(() => {
      el.classList.add('dragging');
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
    // Remove dragging class from all items
    document.querySelectorAll('.article-item.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toId: string) => {
    e.preventDefault();
    if (dragId && dragId !== toId) {
      onReorder(dragId, toId);
    }
    setDragId(null);
    setDragOverId(null);
  }, [dragId, onReorder]);

  const chip = (id: TopicFilter, label: string, count: number) => (
    <button
      key={id}
      className={`filter-chip ${topicFilter === id ? 'active' : ''}`}
      onClick={() => setTopicFilter(id)}
    >
      {label}<span className="filter-chip-count">{count}</span>
    </button>
  );

  return (
    <aside className="sidebar w-64 shrink-0 flex flex-col gap-4">
      <div className="rounded-xl p-4" style={{ background: '#ece9e1', border: '1px solid #d9d3cb' }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6e6a63' }}>
            已汇整语料库
          </h3>
          {canEdit && <button
            onClick={onOpenImport}
            className="text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1"
            style={{
              background: 'rgba(5,150,105,0.1)',
              color: '#059669',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            ➕ 导入
          </button>}
        </div>

        {/* Progress */}
        {articles.length > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: '#6e6a63' }}>
              <span>学习进度</span>
              <span className="font-mono">{mastered} / {articles.length} 已掌握</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(mastered / articles.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Search & filters */}
        <input
          className="tpl-search-input w-full mb-2"
          placeholder="🔍 搜索标题、原文或单词…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-1 mb-2">
          {chip('all', '全部', articles.length)}
          {TOPICS.filter(t => topicCounts[t.id]).map(t => chip(t.id, `${t.icon} ${t.label}`, topicCounts[t.id]))}
          {hasCustom && chip('custom', `${CUSTOM_TOPIC.icon} ${CUSTOM_TOPIC.label}`, topicCounts[CUSTOM_TOPIC.id] || 0)}
        </div>
        <div className="flex gap-1 mb-3">
          {([['all', '全部状态'], ['todo', '待学习'], ['mastered', '已掌握']] as const).map(([id, label]) => (
            <button
              key={id}
              className={`filter-chip ${statusFilter === id ? 'active' : ''}`}
              onClick={() => setStatusFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <nav ref={navRef} className="sidebar-nav flex flex-col gap-1 overflow-y-auto">
          {visible.map((article, index) => (
            <div
              key={article.id}
              className={`article-item ${article.id === currentArticleId ? 'active' : ''} ${dragId === article.id ? 'dragging' : ''} ${dragOverId === article.id && dragId !== article.id ? 'drag-over' : ''}`}
              draggable={canDrag}
              onDragStart={(e) => handleDragStart(e, article.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => { e.preventDefault(); setDragOverId(article.id); }}
              onDrop={(e) => handleDrop(e, article.id)}
            >
              <span className={`article-index status-dot-${article.status}`}>
                {article.unit !== null ? article.unit : index + 1}
              </span>
              {canDrag && <span className="drag-handle" title="拖拽排序">⠿</span>}
              <button
                className="article-btn"
                title={article.title}
                onClick={() => onSwitchArticle(article.id)}
              >
                {article.unit !== null ? article.title.replace(/^UNIT \d+ · /, '') : article.title}
              </button>
              {canEdit && <button
                className="delete-btn"
                title="删除此语料"
                onClick={(e) => { e.stopPropagation(); onDeleteArticle(article.id); }}
              >
                🗑
              </button>}
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-xs italic text-center py-4" style={{ color: '#a09992' }}>没有匹配的语料</p>
          )}
        </nav>
      </div>
    </aside>
  );
}
