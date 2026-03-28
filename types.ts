
export enum Category {
  CAT_I = 'Category-I (Class I to V)',
  CAT_II = 'Category-II (Class VI to VIII)'
}

export enum ViewMode {
  QUIZ = 'Quiz',
  FLASHCARDS = 'Flashcards'
}

export type PdfLanguage = 'both' | 'en' | 'od';

export interface PdfConfig {
  language: PdfLanguage;
  startRange: number;
  endRange: number;
}

export interface SyllabusSection {
  id: string;
  title: string;
  marks: number;
  description: string;
  topics: string[];
}

export interface Question {
  id: string;
  subject: string;
  questionEn: string;
  questionOd: string;
  optionsEn: string[];
  optionsOd: string[];
  correctOptionIndex: number;
  explanationEn: string;
  explanationOd: string;
}

export interface Flashcard {
  id: string;
  termEn: string;
  termOd: string;
  definitionEn: string;
  definitionOd: string;
  conceptCategory: string;
}

export interface FileData {
  data: string;
  mimeType: string;
  name: string;
}

export interface AppState {
  category: Category;
  selectedSectionId: string;
  questions: Question[];
  flashcards: Flashcard[];
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
  language: 'en' | 'od';
  uploadedFile: FileData | null;
  studyMode: boolean;
  pdfConfig: PdfConfig;
}
