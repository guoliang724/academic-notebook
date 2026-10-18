import type { Article } from './types';

// 附录一 托福专题分类（TOEFL Topic Categories）
export const TOPICS = [
  { id: 'Arts', label: '艺术', icon: '🎨', color: '#6d28d9', bg: 'rgba(139,92,246,0.1)' },
  { id: 'Life Science', label: '生命科学', icon: '🧬', color: '#059669', bg: 'rgba(16,185,129,0.1)' },
  { id: 'Physical Science', label: '自然科学', icon: '🔭', color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)' },
  { id: 'Social Science', label: '社会科学', icon: '🏛️', color: '#b45309', bg: 'rgba(245,158,11,0.12)' },
] as const;

export const CUSTOM_TOPIC = { id: 'custom', label: '我的导入', icon: '📥', color: '#6e6a63', bg: 'rgba(100,116,139,0.1)' } as const;

export type TopicFilter = 'all' | typeof TOPICS[number]['id'] | 'custom';

export function topicMeta(topic: string) {
  return TOPICS.find(t => t.id === topic) || CUSTOM_TOPIC;
}

export function matchesTopic(article: Article, filter: TopicFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'custom') return article.unit === null;
  return article.topic === filter;
}
