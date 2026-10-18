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
  phonetic?: string;  // 音标 (IPA, without brackets)
}

export type ArticleStatus = 'new' | 'learning' | 'mastered';

// TOEFL topic categories (附录一 托福专题分类)
export type Topic = 'Arts' | 'Life Science' | 'Physical Science' | 'Social Science';

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
  unit: number | null;     // 《新托福 iBT 词汇分类突破》UNIT 编号；用户自行导入的语料为 null
  topic: string;           // Topic，或空字符串
  status: ArticleStatus;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

// Built-in article as stored in src/data/toefl-units.json
export interface BuiltinArticle {
  id: string;
  unit: number;
  title: string;
  genre: string;
  topic: Topic;
  body: string;
  translation: string;
  insights: string[];
  grammar: GrammarItem[];
  vocab: VocabItem[];
  specialHTML: string;
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
  status?: ArticleStatus;
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
export type EditPanel = 'translation' | 'insights' | 'grammar' | 'vocab' | 'specialHTML';
