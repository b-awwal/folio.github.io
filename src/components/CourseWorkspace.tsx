import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  FileDown,
  Loader2,
  Pencil,
  Play,
  RefreshCw,
  Square,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  Course,
  FlashcardMastery,
  StudyProgress,
  SyllabusModule,
} from '../types/course';
import { MarkdownProse } from './MarkdownProse';
import { VisualMapView } from './VisualMapView';
import { StudyDeckView } from './StudyDeckView';
import { exportCourseToPdf } from '../utils/pdfExport';

export type ChapterTab =
  | 'prose'
  | 'examples'
  | 'diagrams'
  | 'study'
  | 'cheatsheet';

interface CourseWorkspaceProps {
  course: Course;
  activeModuleId: string;
  activeTab: ChapterTab;
  generatingModuleIds: string[];
  isBatchGenerating: boolean;
  moduleErrors: Record<string, string>;
  studyProgress: StudyProgress;
  onSelectModule: (moduleId: string) => void;
  onChangeTab: (tab: ChapterTab) => void;
  onGenerateModule: (moduleId: string) => Promise<void>;
  onGenerateAll: () => void;
  onStopBatch: () => void;
  onEditSyllabus: () => void;
  onToggleComplete: (moduleId: string) => void;
  onSelectQuizAnswer: (questionKey: string, optionIdx: number) => void;
  onResetQuiz: (chapterId: string) => void;
  onSetFlashcardMastery: (cardKey: string, mastery: FlashcardMastery) => void;
}

export const CourseWorkspace: React.FC<CourseWorkspaceProps> = ({
  course,
  activeModuleId,
  activeTab,
  generatingModuleIds,
  isBatchGenerating,
  moduleErrors,
  studyProgress,
  onSelectModule,
  onChangeTab,
  onGenerateModule,
  onGenerateAll,
  onStopBatch,
  onEditSyllabus,
  onToggleComplete,
  onSelectQuizAnswer,
  onResetQuiz,
  onSetFlashcardMastery,
}) => {
  const activeIdx = Math.max(
    0,
    course.modules.findIndex((m) => m.id === activeModuleId)
  );
  const currentModule: SyllabusModule | undefined = course.modules[activeIdx];
  const nextModule: SyllabusModule | undefined = course.modules[activeIdx + 1];

  const [revealedSteps, setRevealedSteps] = useState<Record<string, number>>({});
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  useEffect(() => {
    setPdfNotice(null);
  }, [activeModuleId]);

  if (!currentModule) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-slate-600">No modules found in this course.</p>
      </main>
    );
  }

  const isGenerating = generatingModuleIds.includes(currentModule.id);
  const errorMsg = moduleErrors[currentModule.id];
  const chapter = currentModule.chapter;
  const isCompleted = studyProgress.completedModuleIds.includes(currentModule.id);
  const ungeneratedCount = course.modules.filter((m) => !m.chapter).length;

  const tabs: Array<{ id: ChapterTab; label: string }> = [
    { id: 'prose', label: 'Chapter Text' },
    { id: 'examples', label: 'Examples & Definitions' },
    { id: 'diagrams', label: 'Concept Map & Timeline' },
    { id: 'study', label: 'Quiz & Flashcards' },
    { id: 'cheatsheet', label: 'Cheat Sheet' },
  ];

  const handleQuickChapterPdf = () => {
    if (!chapter) return;
    exportCourseToPdf(course, [currentModule], {
      scope: 'current',
      includeProse: true,
      includeDefinitions: true,
      includeExamples: true,
      includeDiagrams: true,
      includeQuiz: true,
      includeCheatSheet: true,
      includeFurtherReading: true,
    });
    setPdfNotice(`Downloaded ${currentModule.weekLabel} PDF`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Chapter Index */}
        <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                <span className="font-mono font-medium text-[#1E3A8A]">
                  {course.code || course.discipline}
                </span>
                <button
                  type="button"
                  onClick={onEditSyllabus}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" aria-hidden="true" />
                  <span>Edit Outline</span>
                </button>
              </div>
              <h2 className="font-display text-lg font-semibold text-slate-900 leading-snug">
                {course.title}
              </h2>
            </div>

            {ungeneratedCount > 0 && (
              <div className="pt-2 border-t border-slate-100">
                {isBatchGenerating ? (
                  <button
                    type="button"
                    onClick={onStopBatch}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Stop Full-Course Build</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onGenerateAll}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      Generate Remaining ({ungeneratedCount})
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          <nav
            aria-label="Course chapters"
            className="bg-white border border-slate-200 rounded-xl p-3 space-y-1"
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-500">
              Syllabus Chapters
            </div>
            {course.modules.map((mod, idx) => {
              const isSelected = mod.id === currentModule.id;
              const modGenerating = generatingModuleIds.includes(mod.id);
              const modDone = studyProgress.completedModuleIds.includes(mod.id);

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-[#EFF6FF] text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono text-xs font-medium text-[#1E3A8A] tabular-nums mt-0.5 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm leading-snug ${
                        isSelected ? 'font-semibold text-slate-900' : 'font-medium'
                      }`}
                    >
                      {mod.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                      <span>{mod.weekLabel}</span>
                      <span aria-hidden="true">·</span>
                      {modGenerating ? (
                        <span className="text-[#1E3A8A] font-medium">
                          Generating...
                        </span>
                      ) : mod.chapter ? (
                        <span className="text-[#059669] font-medium">
                          {modDone ? 'Completed' : 'Ready'}
                        </span>
                      ) : (
                        <span>Not generated</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Center Main Reading Column */}
        <main
          className={
            chapter && activeTab === 'prose'
              ? 'lg:col-span-9 xl:col-span-6 space-y-6'
              : 'lg:col-span-9 space-y-6'
          }
        >
          {/* Module not generated yet */}
          {!chapter && (
            <section className="bg-white border border-slate-200 rounded-xl p-8 md:p-10 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                  <span>{currentModule.weekLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>Chapter {activeIdx + 1}</span>
                  <span aria-hidden="true">·</span>
                  <span>~{currentModule.estimatedReadMinutes} min read</span>
                </div>
                <h1 className="font-display text-3xl font-semibold text-slate-900">
                  {currentModule.title}
                </h1>
                <p className="font-serif text-base text-slate-600 leading-relaxed pt-1">
                  {currentModule.summary}
                </p>
              </div>

              {currentModule.objectives.length > 0 && (
                <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-5">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2.5">
                    Planned Learning Objectives
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                    {currentModule.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900"
                >
                  <AlertCircle
                    className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{errorMsg}</span>
                </div>
              )}

              {isGenerating ? (
                <div className="py-8 border-t border-slate-100 flex flex-col items-center text-center gap-3">
                  <Loader2
                    className="w-7 h-7 text-[#1E3A8A] animate-spin"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      Writing textbook chapter & study aids...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Composing narrative sections, worked examples, concept
                      diagram, timeline, quiz, flashcards, and cheat sheet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onGenerateModule(currentModule.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    <span>Generate Textbook Chapter</span>
                  </button>
                  <button
                    type="button"
                    onClick={onEditSyllabus}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Edit Objectives First
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Generated Chapter View */}
          {chapter && (
            <>
              {/* Chapter Header & Tab Bar */}
              <header className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span className="font-mono font-medium text-[#1E3A8A]">
                        {currentModule.weekLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Chapter {activeIdx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentModule.estimatedReadMinutes} min read</span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
                      {currentModule.title}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleQuickChapterPdf}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-[#FAF9F6] border border-slate-300 rounded-lg hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Download Chapter PDF</span>
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => onGenerateModule(currentModule.id)}
                      className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      title="Regenerate this chapter"
                      aria-label="Regenerate chapter"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {pdfNotice && (
                  <div className="text-xs font-medium text-[#059669]">
                    {pdfNotice}
                  </div>
                )}

                {errorMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900"
                  >
                    <AlertCircle
                      className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Segmented Chapter Study Tabs */}
                <div
                  role="tablist"
                  aria-label="Chapter study views"
                  className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto"
                >
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => onChangeTab(tab.id)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </header>

              {/* Tab 1: Narrative Textbook Prose */}
              {activeTab === 'prose' && (
                <article className="bg-white border border-slate-200 rounded-xl p-6 md:p-10 space-y-8">
                  {currentModule.objectives.length > 0 && (
                    <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-5">
                      <h2 className="text-xs font-semibold text-[#1E3A8A] mb-2.5">
                        Learning Objectives
                      </h2>
                      <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                        {currentModule.objectives.map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {chapter.chapterIntro && (
                    <div className="max-w-[72ch]">
                      <MarkdownProse content={chapter.chapterIntro} />
                    </div>
                  )}

                  {chapter.sections.map((sec, idx) => (
                    <section
                      key={sec.id || idx}
                      id={`section-${idx}`}
                      className="pt-6 border-t border-slate-200 max-w-[72ch]"
                    >
                      <div className="font-mono text-xs font-medium text-slate-400 tabular-nums mb-1">
                        Section {activeIdx + 1}.{idx + 1}
                      </div>
                      <h2 className="font-display text-2xl font-semibold text-slate-900 mb-4">
                        {sec.heading}
                      </h2>

                      <MarkdownProse content={sec.contentMarkdown} />

                      {sec.keyTakeaway && (
                        <div className="mt-6 py-4 px-5 bg-[#FAF9F6] border-y border-slate-200">
                          <div className="text-xs font-semibold text-[#1E3A8A] mb-1">
                            Key Takeaway
                          </div>
                          <p className="font-serif text-sm italic text-slate-700 leading-relaxed">
                            {sec.keyTakeaway}
                          </p>
                        </div>
                      )}
                    </section>
                  ))}

                  {/* Chapter Footer Controls */}
                  <footer className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(currentModule.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {isCompleted
                          ? 'Chapter Completed'
                          : 'Mark Chapter Completed'}
                      </span>
                    </button>

                    {nextModule && (
                      <button
                        type="button"
                        onClick={() => onSelectModule(nextModule.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors cursor-pointer"
                      >
                        <span>
                          Next: {nextModule.weekLabel}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </footer>
                </article>
              )}

              {/* Tab 2: Worked Examples & Definitions */}
              {activeTab === 'examples' && (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold text-slate-900">
                      Step-by-Step Worked Examples
                    </h2>
                    {chapter.workedExamples.map((ex, idx) => {
                      const exKey = `${currentModule.id}_ex_${idx}`;
                      const visibleCount = revealedSteps[exKey] ?? 1;
                      const allVisible = visibleCount >= ex.steps.length;

                      return (
                        <article
                          key={exKey}
                          className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-5"
                        >
                          <div>
                            <div className="font-mono text-xs font-medium text-[#1E3A8A] mb-1 tabular-nums">
                              Example {activeIdx + 1}.{idx + 1}
                            </div>
                            <h3 className="font-display text-xl font-semibold text-slate-900">
                              {ex.title}
                            </h3>
                          </div>

                          <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-slate-500 mb-1.5">
                              Problem Statement
                            </div>
                            <MarkdownProse content={ex.problemStatement} />
                          </div>

                          <div className="space-y-3">
                            {ex.steps.slice(0, visibleCount).map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-4 rounded-lg border border-slate-200 bg-white flex items-start gap-3"
                              >
                                <span className="font-mono text-xs font-semibold text-[#1E3A8A] mt-1 shrink-0 tabular-nums">
                                  Step {sIdx + 1}
                                </span>
                                <div className="flex-1 text-sm text-slate-800">
                                  <MarkdownProse content={step} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {allVisible && (
                            <div className="py-3.5 px-4 rounded-lg bg-emerald-50/70 border border-emerald-200 text-sm text-emerald-950">
                              <span className="font-semibold">
                                Final Conclusion:{' '}
                              </span>
                              {ex.solutionSummary}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {!allVisible ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedSteps((prev) => ({
                                      ...prev,
                                      [exKey]: Math.min(
                                        ex.steps.length,
                                        visibleCount + 1
                                      ),
                                    }))
                                  }
                                  className="px-4 py-2 text-xs font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] cursor-pointer"
                                >
                                  Show Next Step ({visibleCount}/{ex.steps.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedSteps((prev) => ({
                                      ...prev,
                                      [exKey]: ex.steps.length,
                                    }))
                                  }
                                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                                >
                                  Reveal Full Solution
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedSteps((prev) => ({
                                    ...prev,
                                    [exKey]: 1,
                                  }))
                                }
                                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                              >
                                Collapse to Step 1
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </section>

                  <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-5">
                    <h2 className="font-display text-2xl font-semibold text-slate-900">
                      Chapter Key Definitions
                    </h2>
                    <dl className="divide-y divide-slate-200">
                      {chapter.definitions.map((def, idx) => (
                        <div key={idx} className="py-4 first:pt-0 last:pb-0">
                          <dt className="font-display text-base font-semibold text-slate-900">
                            {def.term}
                          </dt>
                          <dd className="font-serif text-base text-slate-700 mt-1 leading-relaxed">
                            {def.definition}
                          </dd>
                          {def.contextNote && (
                            <dd className="text-xs text-slate-500 mt-1.5">
                              Context: {def.contextNote}
                            </dd>
                          )}
                        </div>
                      ))}
                    </dl>
                  </section>
                </div>
              )}

              {/* Tab 3: Concept Map & Timeline */}
              {activeTab === 'diagrams' && (
                <VisualMapView
                  diagram={chapter.conceptDiagram}
                  timeline={chapter.timeline}
                  chapterNumber={activeIdx + 1}
                />
              )}

              {/* Tab 4: Quiz & Flashcards */}
              {activeTab === 'study' && (
                <StudyDeckView
                  chapterId={currentModule.id}
                  quiz={chapter.quiz}
                  flashcards={chapter.flashcards}
                  quizSelections={studyProgress.quizSelections[currentModule.id] || {}}
                  flashcardMastery={
                    studyProgress.flashcardMastery[currentModule.id] || {}
                  }
                  onSelectQuizAnswer={onSelectQuizAnswer}
                  onResetQuiz={() => onResetQuiz(currentModule.id)}
                  onSetFlashcardMastery={onSetFlashcardMastery}
                />
              )}

              {/* Tab 5: Cheat Sheet & Further Reading */}
              {activeTab === 'cheatsheet' && (
                <div className="space-y-8">
                  <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6">
                    <div className="pb-4 border-b border-slate-200">
                      <h2 className="font-display text-2xl font-semibold text-slate-900">
                        High-Yield Summary Cheat Sheet
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Condensed review sheet for exam preparation and rapid
                        revision
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-5 space-y-3">
                        <h3 className="text-xs font-semibold text-[#1E3A8A]">
                          Core Principles & Formulas
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-800 list-disc pl-5">
                          {chapter.cheatSheet.coreFormulasOrPrinciples.map(
                            (item, i) => (
                              <li key={i}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-5 space-y-3">
                        <h3 className="text-xs font-semibold text-[#DC2626]">
                          Common Pitfalls & Misconceptions
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-800 list-disc pl-5">
                          {chapter.cheatSheet.commonPitfalls.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      <h3 className="text-xs font-semibold text-slate-700">
                        Quick Revision Checklist
                      </h3>
                      <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                        {chapter.cheatSheet.quickSummaryBullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-4">
                    <h2 className="font-display text-xl font-semibold text-slate-900">
                      Further Reading & Primary Sources
                    </h2>
                    <ul className="divide-y divide-slate-200">
                      {chapter.furtherReading.map((ref, i) => (
                        <li key={i} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="font-medium text-slate-900 text-sm">
                            {ref.title}
                          </div>
                          <div className="text-xs text-[#1E3A8A] mt-0.5">
                            {ref.authorOrSource}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {ref.note}
                          </p>
                        </li>
                      ))}
                    </ul>

                    {course.sources && course.sources.length > 0 && (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="text-xs font-semibold text-slate-500 mb-2">
                          Course Grounding Links
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {course.sources.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Margin Companion Rail (Prose view on XL viewports) */}
        {chapter && activeTab === 'prose' && (
          <aside className="hidden xl:block xl:col-span-3 space-y-6 sticky top-24">
            {/* Section Navigation */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500">
                In This Chapter
              </h3>
              <ul className="space-y-2 text-xs">
                {chapter.sections.map((sec, idx) => (
                  <li key={sec.id || idx}>
                    <a
                      href={`#section-${idx}`}
                      className="text-slate-700 hover:text-[#1E3A8A] transition-colors flex items-baseline gap-2 leading-snug"
                    >
                      <span className="font-mono text-slate-400 tabular-nums shrink-0">
                        {activeIdx + 1}.{idx + 1}
                      </span>
                      <span>{sec.heading}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Margin Key Definitions */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500">
                  Margin Glossary
                </h3>
                <button
                  type="button"
                  onClick={() => onChangeTab('examples')}
                  className="text-xs text-[#1E3A8A] hover:underline cursor-pointer"
                >
                  Full list
                </button>
              </div>
              <dl className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
                {chapter.definitions.map((def, idx) => (
                  <div
                    key={idx}
                    className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-xs font-semibold text-slate-900">
                      {def.term}
                    </dt>
                    <dd className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {def.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
