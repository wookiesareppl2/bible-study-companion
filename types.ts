import { BookName, ChapterIdentifier } from './constants.ts';
export type { BookName, ChapterIdentifier };

export interface Book {
  name: BookName;
  chapters: number;
  testament: 'Old' | 'New';
}

export const AVAILABLE_TRANSLATIONS = {
  web: 'World English Bible',
  kjv: 'King James Version',
} as const;

export type TranslationKey = keyof typeof AVAILABLE_TRANSLATIONS;

export enum StudyMode {
  RANDOM = 'Random Chapter',
  BOOK = 'Book Study',
  READ_THROUGH = 'Read Through',
  BOOKMARKS = 'Bookmarks',
  SCRIPTURE_READER = 'Scripture Reader',
}

export interface Verse {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface Passage {
    reference: string;
    verses: Verse[];
    text: string;
    translation_id: string;
    translation_name: string;
    translation_note: string;
}

export interface CachedChapterContent {
    verses: Verse[];
    deepDiveData: DeepDiveData | null;
    allEnrichmentData: AllEnrichmentData;
}

export interface UserData {
  id: string; // Changed from uid to id to match Supabase
  username: string;
  studyMode: StudyMode;
  readThroughIndex: number;
  userSelectedChapter: ChapterIdentifier | null;
  completedChapters: string[];
  bookmarks: string[];
  notes: Record<string, string>;
  cachedContent: Record<string, CachedChapterContent>;
  translation: TranslationKey;
  updated_at?: string;
}

export interface CrossReference {
  reference: string;
  explanation: string;
  verse?: number;
}

export interface WordStudy {
  originalWord: string;
  transliteration: string;
  strongsNumber: string;
  meaning: string;
  contextualUse: string;
  verse?: number;
}

export interface HistoricalContext {
  geography: string;
  customs: string;
  politicalClimate: string;
}

export interface LiteraryAnalysis {
  structure: string;
  themes: string[];
}

export interface Interpretation {
  viewpoint: string;
  summary: string;
  verse?: number;
}

export interface DeepDiveData {
  summaryAndThemes: string;
  historicalContext: string;
  keyVerses: {
    verse: string;
    analysis: string;
  }[];
  reflectionQuestions: string[];
}


export interface AllEnrichmentData {
  crossReferences?: CrossReference[];
  wordStudies?: WordStudy[];
  historicalContext?: HistoricalContext;
  literaryAnalysis?: LiteraryAnalysis;
  interpretations?: Interpretation[];
}

export enum EnrichmentType {
  CrossReferences = 'Cross-references',
  WordStudies = 'Word Studies',
  HistoricalContext = 'Historical/Geographical Context',
  LiteraryAnalysis = 'Literary Analysis',
  Interpretations = 'Interpretive Contrasts',
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}