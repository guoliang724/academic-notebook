'use client';

import { useState, useRef, useCallback } from 'react';
import type { Article } from '@/lib/types';

interface SidebarProps {
  articles: Article[];
  currentArticleId: string | null;
  onSwitchArticle: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  onOpenImport: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function Sidebar({ articles, currentArticleId, onSwitchArticle, onDeleteArticle, onOpenImport, onReorder }: SidebarProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounterRef = useRef(0);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Capture the element ref before React nullifies the synthetic event
    const el = e.currentTarget as HTMLElement;
    // Add dragging class after a tick so the element doesn't disappear immediately
    requestAnimationFrame(() => {
      el.classList.add('dragging');
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
    // Remove dragging class from all items
    document.querySelectorAll('.article-item.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    // We don't reset dragOverIndex here to avoid flickering
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  }, [dragIndex, onReorder]);

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
          {articles.map((article, index) => (
            <div
              key={article.id}
              className={`article-item ${article.id === currentArticleId ? 'active' : ''} ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index && dragIndex !== index ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <span className="article-index">{index + 1}</span>
              <span className="drag-handle" title="拖拽排序">⠿</span>
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
