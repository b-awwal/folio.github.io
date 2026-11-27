export type AcademicLevel =
  | 'Introductory Undergraduate'
  | 'Intermediate Undergraduate'
  | 'Advanced / Graduate'
  | 'Independent Study';

export interface ChapterSection {
  id: string;
  heading: string;
  contentMarkdown: string;
  keyTakeaway: string;
}

export interface KeyDefinition {
  id: string;
  term: string;
  definition: string;
  contextNote: string;
}

export interface WorkedExample {
  id: string;
  title: string;
  problemStatement: string;
  steps: string[];
  solutionSummary: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  category: 'Core Principle' | 'Mechanism' | 'Application' | 'Evidence';
  summary: string;
}

export interface ConceptEdge {
  from: string;
  to: string;
  relation: string;
}

export interface ConceptDiagram {
  title: string;
  caption: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface TimelineEvent {
  id: string;
  dateLabel: string;
  title: string;
  significance: string;
}

export interface TimelineData {
  title: string;
  events: TimelineEvent[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint: string;
}

export interface CheatSheet {
  coreFormulasOrPrinciples: string[];
  commonPitfalls: string[];
  quickSummaryBullets: string[];
}

export interface FurtherReadingItem {
  title: string;
  authorOrSource: string;
  note: string;
}

export interface GeneratedChapter {
  generatedAt: string;
  chapterIntro: string;
  sections: ChapterSection[];
  definitions: KeyDefinition[];
  workedExamples: WorkedExample[];
  conceptDiagram: ConceptDiagram;
  timeline: TimelineData;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  cheatSheet: CheatSheet;
  furtherReading: FurtherReadingItem[];
}

export interface SyllabusModule {
  id: string;
  order: number;
  weekLabel: string;
  title: string;
  summary: string;
  objectives: string[];
  estimatedReadMinutes: number;
  chapter?: GeneratedChapter;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  discipline: string;
  academicLevel: AcademicLevel;
  description: string;
  sourceUrl?: string;
  sources?: GroundingSource[];
  createdAt: string;
  updatedAt: string;
  modules: SyllabusModule[];
}

export type FlashcardMastery = 'unseen' | 'review' | 'mastered';

export interface StudyProgress {
  quizSelections: Record<string, Record<string, number>>; // chapterId -> questionId -> selectedIndex
  flashcardMastery: Record<string, Record<string, FlashcardMastery>>; // chapterId -> cardId -> mastery
  completedModuleIds: string[];
}

export interface ExportOptions {
  scope: 'current' | 'all';
  includeProse: boolean;
  includeDefinitions: boolean;
  includeExamples: boolean;
  includeDiagrams: boolean;
  includeQuiz: boolean;
  includeCheatSheet: boolean;
  includeFurtherReading: boolean;
}
