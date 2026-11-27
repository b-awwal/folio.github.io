import { useState, useEffect, useRef } from 'react';
import {
  AcademicLevel,
  Course,
  FlashcardMastery,
  GeneratedChapter,
  GroundingSource,
  StudyProgress,
  SyllabusModule,
} from './types/course';
import { SyllabusTemplate } from './data/syllabusTemplates';
import {
  createId,
  loadActiveCourseId,
  loadCourses,
  loadStudyProgress,
  saveActiveCourseId,
  saveCourses,
  saveStudyProgress,
} from './utils/storage';
import { TopBar, AppView } from './components/TopBar';
import { IntakeStudio } from './components/IntakeStudio';
import { SyllabusBuilder } from './components/SyllabusBuilder';
import { CourseWorkspace, ChapterTab } from './components/CourseWorkspace';
import { ExportModal } from './components/ExportModal';

interface RawImportedSyllabus {
  title: string;
  code: string;
  discipline: string;
  academicLevel: string;
  description: string;
  modules: Array<{
    weekLabel: string;
    title: string;
    summary: string;
    objectives: string[];
    estimatedReadMinutes: number;
  }>;
}

function normalizeAcademicLevel(val?: string): AcademicLevel {
  const allowed: AcademicLevel[] = [
    'Introductory Undergraduate',
    'Intermediate Undergraduate',
    'Advanced / Graduate',
    'Independent Study',
  ];
  const found = allowed.find(
    (a) => a.toLowerCase() === (val || '').toLowerCase()
  );
  return found || 'Intermediate Undergraduate';
}

export default function App() {
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [activeCourseId, setActiveCourseId] = useState<string | null>(() => {
    const saved = loadActiveCourseId();
    const initialCourses = loadCourses();
    if (saved && initialCourses.some((c) => c.id === saved)) return saved;
    return initialCourses[0]?.id || null;
  });

  const [activeView, setActiveView] = useState<AppView>(() => {
    const initialCourses = loadCourses();
    return initialCourses.length > 0 ? 'library' : 'intake';
  });

  const [builderDraft, setBuilderDraft] = useState<Course | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ChapterTab>('prose');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const [generatingModuleIds, setGeneratingModuleIds] = useState<string[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const batchCancelRef = useRef(false);
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});

  const [studyProgress, setStudyProgress] = useState<StudyProgress>(() =>
    loadStudyProgress()
  );

  const activeCourse =
    courses.find((c) => c.id === activeCourseId) || null;

  useEffect(() => {
    const result = saveCourses(courses);
    if (!result.ok && result.error) {
      setStorageWarning(result.error);
    } else {
      setStorageWarning(null);
    }
  }, [courses]);

  useEffect(() => {
    saveActiveCourseId(activeCourseId);
  }, [activeCourseId]);

  useEffect(() => {
    saveStudyProgress(studyProgress);
  }, [studyProgress]);

  useEffect(() => {
    if (activeCourse && activeCourse.modules.length > 0) {
      const exists = activeCourse.modules.some((m) => m.id === activeModuleId);
      if (!exists) {
        setActiveModuleId(activeCourse.modules[0].id);
      }
    }
  }, [activeCourse, activeModuleId]);

  const buildCourseFromPayload = (
    raw: RawImportedSyllabus,
    sourceUrl?: string,
    sources?: GroundingSource[]
  ): Course => {
    const now = new Date().toISOString();
    return {
      id: createId('course'),
      title: raw.title || 'Untitled Course',
      code: raw.code || '',
      discipline: raw.discipline || 'General Studies',
      academicLevel: normalizeAcademicLevel(raw.academicLevel),
      description: raw.description || '',
      sourceUrl,
      sources,
      createdAt: now,
      updatedAt: now,
      modules: (raw.modules || []).map((m, idx) => ({
        id: createId('mod'),
        order: idx + 1,
        weekLabel: m.weekLabel || `Week ${String(idx + 1).padStart(2, '0')}`,
        title: m.title,
        summary: m.summary,
        objectives: Array.isArray(m.objectives) ? m.objectives : [],
        estimatedReadMinutes: m.estimatedReadMinutes || 18,
      })),
    };
  };

  const handleImportUrl = async (url: string) => {
    const res = await fetch('/api/syllabus/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'url', url }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to import syllabus from URL.');
    }
    const draft = buildCourseFromPayload(data.course, url, data.sources || []);
    setBuilderDraft(draft);
    setActiveView('builder');
  };

  const handleImportText = async (text: string) => {
    const res = await fetch('/api/syllabus/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'text', text }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to structure syllabus text.');
    }
    const draft = buildCourseFromPayload(data.course);
    setBuilderDraft(draft);
    setActiveView('builder');
  };

  const handleSelectTemplate = (tpl: SyllabusTemplate) => {
    const now = new Date().toISOString();
    const draft: Course = {
      id: createId('course'),
      title: tpl.title,
      code: tpl.code,
      discipline: tpl.discipline,
      academicLevel: tpl.academicLevel,
      description: tpl.description,
      createdAt: now,
      updatedAt: now,
      modules: tpl.modules.map((m, idx) => ({
        id: createId('mod'),
        order: idx + 1,
        weekLabel: m.weekLabel,
        title: m.title,
        summary: m.summary,
        objectives: [...m.objectives],
        estimatedReadMinutes: m.estimatedReadMinutes,
      })),
    };
    setBuilderDraft(draft);
    setActiveView('builder');
  };

  const handleSaveCourseFromBuilder = (
    savedCourse: Course,
    autoGenerateFirst: boolean
  ) => {
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === savedCourse.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCourse.id ? savedCourse : c));
      }
      return [savedCourse, ...prev];
    });
    setActiveCourseId(savedCourse.id);
    const firstModId = savedCourse.modules[0]?.id || '';
    setActiveModuleId(firstModId);
    setActiveTab('prose');
    setBuilderDraft(null);
    setActiveView('reader');

    if (autoGenerateFirst && firstModId && !savedCourse.modules[0]?.chapter) {
      void generateChapterForModule(savedCourse, firstModId);
    }
  };

  const generateChapterForModule = async (
    courseSnapshot: Course,
    moduleId: string
  ): Promise<boolean> => {
    const targetMod = courseSnapshot.modules.find((m) => m.id === moduleId);
    if (!targetMod) return false;

    setModuleErrors((prev) => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
    setGeneratingModuleIds((prev) =>
      prev.includes(moduleId) ? prev : [...prev, moduleId]
    );

    try {
      const res = await fetch('/api/lectures/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: courseSnapshot.title,
          courseCode: courseSnapshot.code,
          discipline: courseSnapshot.discipline,
          academicLevel: courseSnapshot.academicLevel,
          module: {
            weekLabel: targetMod.weekLabel,
            title: targetMod.title,
            summary: targetMod.summary,
            objectives: targetMod.objectives,
          },
          allModuleTitles: courseSnapshot.modules.map(
            (m) => `${m.weekLabel}: ${m.title}`
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate textbook chapter.');
      }

      const generatedChapter = data.chapter as GeneratedChapter;
      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseSnapshot.id) return c;
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            modules: c.modules.map((m) =>
              m.id === moduleId ? { ...m, chapter: generatedChapter } : m
            ),
          };
        })
      );
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to generate chapter.';
      setModuleErrors((prev) => ({ ...prev, [moduleId]: msg }));
      return false;
    } finally {
      setGeneratingModuleIds((prev) => prev.filter((id) => id !== moduleId));
    }
  };

  const handleGenerateAll = async () => {
    if (!activeCourse || isBatchGenerating) return;
    batchCancelRef.current = false;
    setIsBatchGenerating(true);

    const pending = activeCourse.modules.filter((m) => !m.chapter);
    for (const mod of pending) {
      if (batchCancelRef.current) break;
      setActiveModuleId(mod.id);
      await generateChapterForModule(activeCourse, mod.id);
    }

    setIsBatchGenerating(false);
  };

  const handleStopBatch = () => {
    batchCancelRef.current = true;
    setIsBatchGenerating(false);
  };

  const handleNavigate = (view: AppView) => {
    if (view === 'study') {
      setActiveView('reader');
      setActiveTab('study');
      return;
    }
    if (view === 'reader') {
      setActiveView('reader');
      if (activeTab === 'study') setActiveTab('prose');
      return;
    }
    setActiveView(view);
  };

  const handleSelectQuizAnswer = (questionKey: string, optionIdx: number) => {
    if (!activeModuleId) return;
    setStudyProgress((prev) => ({
      ...prev,
      quizSelections: {
        ...prev.quizSelections,
        [activeModuleId]: {
          ...(prev.quizSelections[activeModuleId] || {}),
          [questionKey]: optionIdx,
        },
      },
    }));
  };

  const handleResetQuiz = (chapterId: string) => {
    setStudyProgress((prev) => {
      const next = { ...prev.quizSelections };
      delete next[chapterId];
      return { ...prev, quizSelections: next };
    });
  };

  const handleSetFlashcardMastery = (
    cardKey: string,
    mastery: FlashcardMastery
  ) => {
    if (!activeModuleId) return;
    setStudyProgress((prev) => ({
      ...prev,
      flashcardMastery: {
        ...prev.flashcardMastery,
        [activeModuleId]: {
          ...(prev.flashcardMastery[activeModuleId] || {}),
          [cardKey]: mastery,
        },
      },
    }));
  };

  const handleToggleComplete = (moduleId: string) => {
    setStudyProgress((prev) => {
      const exists = prev.completedModuleIds.includes(moduleId);
      return {
        ...prev,
        completedModuleIds: exists
          ? prev.completedModuleIds.filter((id) => id !== moduleId)
          : [...prev.completedModuleIds, moduleId],
      };
    });
  };

  const currentModule: SyllabusModule | null =
    activeCourse?.modules.find((m) => m.id === activeModuleId) || null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col">
      <TopBar
        activeView={
          activeView === 'reader' && activeTab === 'study'
            ? 'study'
            : activeView
        }
        hasActiveCourse={Boolean(activeCourse)}
        onNavigate={handleNavigate}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {storageWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-950 text-center">
          {storageWarning}
        </div>
      )}

      <div className="flex-1">
        {(activeView === 'library' || activeView === 'intake') && (
          <IntakeStudio
            courses={courses}
            mode={activeView === 'library' ? 'library' : 'intake'}
            onImportUrl={handleImportUrl}
            onImportText={handleImportText}
            onSelectTemplate={handleSelectTemplate}
            onOpenCourse={(id) => {
              setActiveCourseId(id);
              const found = courses.find((c) => c.id === id);
              setActiveModuleId(found?.modules[0]?.id || '');
              setActiveTab('prose');
              setActiveView('reader');
            }}
            onEditCourseOutline={(id) => {
              const found = courses.find((c) => c.id === id);
              if (found) {
                setBuilderDraft(found);
                setActiveView('builder');
              }
            }}
            onDeleteCourse={(id) => {
              setCourses((prev) => {
                const next = prev.filter((c) => c.id !== id);
                if (activeCourseId === id) {
                  setActiveCourseId(next[0]?.id || null);
                }
                if (next.length === 0) {
                  setActiveView('intake');
                }
                return next;
              });
            }}
            onSwitchToIntake={() => setActiveView('intake')}
          />
        )}

        {activeView === 'builder' && builderDraft && (
          <SyllabusBuilder
            initialCourse={builderDraft}
            onSaveCourse={handleSaveCourseFromBuilder}
            onCancel={() => {
              setBuilderDraft(null);
              setActiveView(courses.length > 0 ? 'library' : 'intake');
            }}
          />
        )}

        {activeView === 'reader' && activeCourse && (
          <CourseWorkspace
            course={activeCourse}
            activeModuleId={activeModuleId}
            activeTab={activeTab}
            generatingModuleIds={generatingModuleIds}
            isBatchGenerating={isBatchGenerating}
            moduleErrors={moduleErrors}
            studyProgress={studyProgress}
            onSelectModule={(id) => setActiveModuleId(id)}
            onChangeTab={setActiveTab}
            onGenerateModule={(id) =>
              generateChapterForModule(activeCourse, id).then(() => undefined)
            }
            onGenerateAll={handleGenerateAll}
            onStopBatch={handleStopBatch}
            onEditSyllabus={() => {
              setBuilderDraft(activeCourse);
              setActiveView('builder');
            }}
            onToggleComplete={handleToggleComplete}
            onSelectQuizAnswer={handleSelectQuizAnswer}
            onResetQuiz={handleResetQuiz}
            onSetFlashcardMastery={handleSetFlashcardMastery}
          />
        )}
      </div>

      {isExportOpen && activeCourse && (
        <ExportModal
          course={activeCourse}
          currentModule={currentModule}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
}
