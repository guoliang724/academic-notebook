// ── Core data types matching the original database schema ──

export interface GrammarItem {
  title: string;
  skeleton: string;
  notes: string;
}

export interface VocabItem {
  word: string;
  type: string;
  meaning: string;
  rating: string;
  root?: string;  // 词根解释 (etymology / word root breakdown)
}

export interface Article {
  id: string;
  title: string;
  genre: string;
  body: string;
  translation: string;
  insights: string[];
  grammar: GrammarItem[];
  vocab: VocabItem[];
  specialHTML: string;
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// ── API request/response types ──

export interface ArticleCreateInput {
  title: string;
  genre?: string;
  body: string;
  translation?: string;
  insights?: string[];
  grammar?: GrammarItem[];
  vocab?: VocabItem[];
  specialHTML?: string;
  // Alias fields for AI-generated JSON
  translation_tips?: string;
  tips?: string;
  takeaway?: string;
}

export interface ArticleUpdateInput {
  title?: string;
  genre?: string;
  body?: string;
  translation?: string;
  insights?: string[];
  grammar?: GrammarItem[];
  vocab?: VocabItem[];
  specialHTML?: string;
}

export interface TemplateCreateInput {
  name: string;
  category?: string;
  content: string;
}

export interface TemplateUpdateInput {
  name?: string;
  category?: string;
  content?: string;
}

export type TabId = 'translation' | 'grammar' | 'vocabulary';
export type EditPanel = 'translation' | 'insights' | 'grammar' | 'vocab';
