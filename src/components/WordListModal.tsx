'use client';

import { useMemo, useState } from 'react';
import type { Article } from '@/lib/types';
import { speak } from '@/lib/speech';
import { TOPICS, matchesTopic, type TopicFilter } from '@/lib/topics';

interface WordListModalProps {
  articles: Article[];
  onClose: () => void;
  onJump: (articleId: string) => void;
}

interface WordEntry {
  key: string;
  word: string;
  phonetic: string;
  type: string;
  meaning: string;
  root: string;
  stars: number;
  sources: { id: string; label: string }[];
}

const PAGE = 150;

export default function WordListModal({ articles, onClose, onJump }: WordListModalProps) {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState<TopicFilter>('all');
  const [coreOnly, setCoreOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'alpha' | 'stars' | 'unit'>('unit');
  const [limit, setLimit] = useState(PAGE);

  // Merge the same word appearing in several articles into one entry
  const entries = useMemo<WordEntry[]>(() => {
    const map = new Map<string, WordEntry>();
    for (const a of articles) {
      if (!matchesTopic(a, topic)) continue;
      const label = a.unit !== null ? `U${String(a.unit).padStart(3, '0')}` : a.title.slice(0, 8);
      for (const v of a.vocab) {
        const key = v.word.trim().toLowerCase();
        if (!key) continue;
        const stars = (v.rating.match(/⭐/g) || []).length;
        const existing = map.get(key);
        if (existing) {
          if (!existing.sources.some(s => s.id === a.id)) existing.sources.push({ id: a.id, label });
          if (stars > existing.stars) existing.stars = stars;
          if (!existing.root && v.root) existing.root = v.root;
          if (!existing.phonetic && v.phonetic) existing.phonetic = v.phonetic;
        } else {
          map.set(key, {
            key, word: v.word, phonetic: v.phonetic || '', type: v.type, meaning: v.meaning,
            root: v.root || '', stars, sources: [{ id: a.id, label }],
          });
        }
      }
    }
    return [...map.values()];
  }, [articles, topic]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = entries.filter(e =>
      (!coreOnly || e.stars >= 4)
      && (!q || e.key.includes(q) || e.meaning.includes(q))
    );
    if (sortBy === 'alpha') list.sort((a, b) => a.key.localeCompare(b.key));
    else if (sortBy === 'stars') list.sort((a, b) => b.stars - a.stars || a.key.localeCompare(b.key));
    return list;
  }, [entries, search, coreOnly, sortBy]);

  const shown = filtered.slice(0, limit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl fade-in" style={{ background: '#f8f6f1', border: '1px solid #d9d3cb' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid #d9d3cb' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: '#1c1814' }}>📖 词汇总表 · Word List</h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#6e6a63' }}>
              共 {entries.length} 个词条 · 当前显示 {filtered.length} 个 · 点击单词发音，点击 UNIT 跳转原文
            </p>
          </div>
          <button className="btn-cancel" onClick={onClose}>关闭</button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 flex flex-col gap-2" style={{ borderBottom: '1px solid #e2ddd7' }}>
          <input
            autoFocus
            className="tpl-search-input"
            placeholder="🔍 搜索英文单词或中文释义…"
            value={search}
            onChange={e => { setSearch(e.target.value); setLimit(PAGE); }}
          />
          <div className="flex flex-wrap items-center gap-1">
            <button className={`filter-chip ${topic === 'all' ? 'active' : ''}`} onClick={() => setTopic('all')}>全部领域</button>
            {TOPICS.map(t => (
              <button key={t.id} className={`filter-chip ${topic === t.id ? 'active' : ''}`} onClick={() => { setTopic(t.id); setLimit(PAGE); }}>
                {t.icon} {t.label}
              </button>
            ))}
            <span className="flex-1" />
            <button className={`filter-chip ${coreOnly ? 'active' : ''}`} onClick={() => setCoreOnly(c => !c)}>⭐ 仅 4 星以上</button>
            <select className="tpl-select" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
              <option value="unit">按 UNIT 顺序</option>
              <option value="alpha">按字母顺序</option>
              <option value="stars">按推荐度</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {shown.length > 0 ? (
            <table className="w-full text-left text-xs">
              <tbody>
                {shown.map(e => (
                  <tr key={e.key} className="wordlist-row" style={{ borderBottom: '1px solid rgba(217,211,203,0.7)' }}>
                    <td className="py-2 pr-3 align-top whitespace-nowrap">
                      <button className="wordlist-word" onClick={() => speak(e.word)} title="发音">{e.word}</button>
                      {e.phonetic && <div className="font-mono text-[10px]" style={{ color: '#a09992' }}>[{e.phonetic}]</div>}
                    </td>
                    <td className="py-2 pr-3 align-top" style={{ color: '#47433e' }}>
                      <span className="font-mono mr-1.5 text-[10px]" style={{ color: '#a09992' }}>[{e.type}]</span>
                      {e.meaning}
                      {e.root && <div className="text-[10px] mt-0.5" style={{ color: '#6e6a63' }}>🌱 {e.root}</div>}
                    </td>
                    <td className="py-2 pr-3 align-top whitespace-nowrap" style={{ color: '#b45309' }}>{'⭐'.repeat(e.stars)}</td>
                    <td className="py-2 align-top">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {e.sources.map(s => (
                          <button key={s.id} className="unit-link" onClick={() => onJump(s.id)}>{s.label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center italic text-xs py-10" style={{ color: '#a09992' }}>没有匹配的词条</p>
          )}
          {filtered.length > limit && (
            <div className="text-center py-3">
              <button className="btn-edit" onClick={() => setLimit(l => l + PAGE)}>
                显示更多（还有 {filtered.length - limit} 个）
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
