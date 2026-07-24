'use client';

import type { Article } from '@/lib/types';

interface SourceCardProps {
  article: Article;
}

export default function SourceCard({ article }: SourceCardProps) {
  return (
    <section className="source-card rounded-2xl p-6 editable-card" style={{ border: '1px solid #d9d3cb' }}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6e6a63' }}>
            分析语料 · Source Text
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded"
            style={{ background: '#ece9e1', color: '#47433e', border: '1px solid #c8c2ba' }}
          >
            {article.genre}
          </span>
        </div>
      </div>
      <p className="text-[11px] mb-3 font-medium tracking-wide" style={{ color: '#6e6a63' }}>
        {article.title}
      </p>
      <p className="text-base md:text-lg leading-relaxed font-medium italic" style={{ color: '#2e2b27' }}>
        {article.body}
      </p>
    </section>
  );
}
