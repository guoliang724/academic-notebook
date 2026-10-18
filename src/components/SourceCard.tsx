'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Article, ArticleStatus } from '@/lib/types';
import { segmentByVocab } from '@/lib/highlight';
import { speak, stopSpeaking } from '@/lib/speech';
import { topicMeta } from '@/lib/topics';

interface SourceCardProps {
  article: Article;
  onSetStatus: (status: ArticleStatus) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const STATUS_LABEL: Record<ArticleStatus, string> = {
  new: '未学习',
  learning: '学习中',
  mastered: '已掌握',
};

export default function SourceCard({ article, onSetStatus, onPrev, onNext }: SourceCardProps) {
  const [highlight, setHighlight] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const paragraphs = useMemo(
    () => article.body.split(/\n{2,}/).map(p => segmentByVocab(p, highlight ? article.vocab : [])),
    [article.body, article.vocab, highlight]
  );

  // Stop reading aloud when leaving this article
  useEffect(() => {
    return () => stopSpeaking();
  }, [article.id]);

  const toggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else if (speak(article.body, { rate: 0.9, onEnd: () => setSpeaking(false) })) {
      setSpeaking(true);
    }
  };

  const topic = article.unit !== null ? topicMeta(article.topic) : null;
  const nextStatus: ArticleStatus = article.status === 'mastered' ? 'learning' : 'mastered';

  return (
    <section className="source-card rounded-2xl p-6 editable-card" style={{ border: '1px solid #d9d3cb' }}>
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6e6a63' }}>
            分析语料 · Source Text
          </span>
          {topic && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: topic.bg, color: topic.color }}>
              {topic.icon} {topic.label}
            </span>
          )}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded"
            style={{ background: '#ece9e1', color: '#47433e', border: '1px solid #c8c2ba' }}
          >
            {article.genre}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onPrev && <button className="source-tool-btn" onClick={onPrev} title="上一篇 (←)">‹</button>}
          {onNext && <button className="source-tool-btn" onClick={onNext} title="下一篇 (→)">›</button>}
        </div>
      </div>
      <p className="text-[11px] mb-3 font-medium tracking-wide" style={{ color: '#6e6a63' }}>
        {article.title}
      </p>

      <div className="flex flex-col gap-3">
        {paragraphs.map((segments, pi) => (
          <p key={pi} className="text-base md:text-lg leading-relaxed font-medium italic" style={{ color: '#2e2b27' }}>
            {segments.map((seg, si) => seg.vocab ? (
              <mark
                key={si}
                className="vocab-hl"
                data-tip={`${seg.vocab.phonetic ? `[${seg.vocab.phonetic}] ` : ''}${seg.vocab.type} ${seg.vocab.meaning}`}
                onClick={() => speak(seg.vocab!.word)}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={si}>{seg.text}</span>
            ))}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px dashed #e2ddd7' }}>
        <button className={`source-tool-btn ${speaking ? 'active' : ''}`} onClick={toggleSpeak}>
          {speaking ? '⏹ 停止朗读' : '🔊 朗读原文'}
        </button>
        {article.vocab.length > 0 && (
          <button className={`source-tool-btn ${highlight ? 'active' : ''}`} onClick={() => setHighlight(h => !h)}>
            🖍 词汇高亮{highlight ? '：开' : '：关'}
          </button>
        )}
        <span className="flex-1" />
        <span className={`status-pill status-${article.status}`}>{STATUS_LABEL[article.status]}</span>
        <button className="source-tool-btn" onClick={() => onSetStatus(nextStatus)}>
          {article.status === 'mastered' ? '↺ 标记为学习中' : '✓ 标记为已掌握'}
        </button>
      </div>
    </section>
  );
}
