import React, { useState } from 'react';
import {
  Link2,
  BookOpen,
  FileText,
  ArrowRight,
  Loader2,
  Trash2,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { Course } from '../types/course';
import { SYLLABUS_TEMPLATES, SyllabusTemplate } from '../data/syllabusTemplates';

interface IntakeStudioProps {
  courses: Course[];
  mode: 'library' | 'intake';
  onImportUrl: (url: string) => Promise<void>;
  onImportText: (text: string) => Promise<void>;
  onSelectTemplate: (template: SyllabusTemplate) => void;
  onOpenCourse: (courseId: string) => void;
  onEditCourseOutline: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onSwitchToIntake: () => void;
}

const SAMPLE_COURSE_LINKS = [
  {
    label: 'MIT OCW · Linear Algebra (18.06)',
    url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/pages/syllabus/',
  },
  {
    label: 'Stanford · CS229 Machine Learning',
    url: 'https://cs229.stanford.edu/syllabus-autumn2018.html',
  },
];

export const IntakeStudio: React.FC<IntakeStudioProps> = ({
  courses,
  mode,
  onImportUrl,
  onImportText,
  onSelectTemplate,
  onOpenCourse,
  onEditCourseOutline,
  onDeleteCourse,
  onSwitchToIntake,
}) => {
  const [intakeTab, setIntakeTab] = useState<'url' | 'templates' | 'text'>(
    'url'
  );
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!urlInput.trim()) {
      setErrorMsg('Enter a public course or syllabus URL to import.');
      return;
    }
    setIsLoading(true);
    try {
      await onImportUrl(urlInput.trim());
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to import syllabus URL.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (textInput.trim().length < 15) {
      setErrorMsg('Paste a syllabus outline or list of topics (at least 15 characters).');
      return;
    }
    setIsLoading(true);
    try {
      await onImportText(textInput.trim());
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to parse syllabus outline.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Library view when user already has courses and clicked "Library"
  if (mode === 'library' && courses.length > 0) {
    return (
      <main className="max-w-[1440px] mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Personal Academic Shelf
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
              Your Lecture Textbooks
            </h1>
          </div>
          <button
            type="button"
            onClick={onSwitchToIntake}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>New Syllabus</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const readyCount = course.modules.filter((m) => Boolean(m.chapter)).length;
            const updatedDate = new Date(course.updatedAt).toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric', year: 'numeric' }
            );
            return (
              <article
                key={course.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                    {course.code && (
                      <>
                        <span className="font-mono font-medium text-[#1E3A8A]">
                          {course.code}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{course.discipline}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {readyCount}/{course.modules.length} chapters ready
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-semibold text-slate-900 leading-snug">
                    {course.title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Updated {updatedDate}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditCourseOutline(course.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label={`Edit ${course.title} outline`}
                      title="Edit outline"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCourse(course.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      aria-label={`Delete ${course.title}`}
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCourse(course.id)}
                      className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Open Reader
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-10 space-y-12">
      {/* 2-Column Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-8">
          <div className="space-y-4">
            <p className="text-xs font-medium text-[#1E3A8A]">
              Syllabus-to-Textbook Lecture Studio
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
              Turn any course syllabus into comprehensive textbook chapters.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              Import a public course link, choose a curated academic outline, or
              paste your syllabus topics. Folio structures every lecture with
              narrative prose, worked examples, interactive concept maps,
              quizzes, and ready-to-download PDFs.
            </p>

            {/* Segmented Mode Control */}
            <div className="pt-3">
              <div
                role="tablist"
                aria-label="Syllabus input method"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={intakeTab === 'url'}
                  onClick={() => {
                    setIntakeTab('url');
                    setErrorMsg(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    intakeTab === 'url'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Course Link</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={intakeTab === 'templates'}
                  onClick={() => {
                    setIntakeTab('templates');
                    setErrorMsg(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    intakeTab === 'templates'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Outline Templates</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={intakeTab === 'text'}
                  onClick={() => {
                    setIntakeTab('text');
                    setErrorMsg(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    intakeTab === 'text'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Paste Syllabus</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            {errorMsg && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900"
              >
                <AlertCircle
                  className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{errorMsg}</span>
              </div>
            )}

            {intakeTab === 'url' && (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="course-url-input"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Course Webpage or Public Syllabus URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      id="course-url-input"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://ocw.mit.edu/courses/..."
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2
                            className="w-4 h-4 animate-spin"
                            aria-hidden="true"
                          />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <span>Import Syllabus</span>
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span>Try a public syllabus:</span>
                  {SAMPLE_COURSE_LINKS.map((sample) => (
                    <button
                      key={sample.url}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setUrlInput(sample.url)}
                      className="text-[#1E3A8A] hover:underline cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </form>
            )}

            {intakeTab === 'templates' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Select a curated multi-week course template below to customize
                  its outline or begin generating chapters immediately.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SYLLABUS_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onSelectTemplate(tpl)}
                      className="text-left p-4 rounded-lg bg-[#FAF9F6] border border-slate-200 hover:border-[#1E3A8A] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 tabular-nums">
                        <span className="font-mono font-medium text-[#1E3A8A]">
                          {tpl.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{tpl.discipline}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tpl.modules.length} chapters</span>
                      </div>
                      <div className="font-display text-sm font-semibold text-slate-900 group-hover:text-[#1E3A8A] transition-colors">
                        {tpl.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {intakeTab === 'text' && (
              <form onSubmit={handleTextSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="course-text-input"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Paste Course Outline, Week-by-Week Topics, or Reading List
                  </label>
                  <textarea
                    id="course-text-input"
                    rows={5}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isLoading}
                    placeholder="Week 1: Foundations of Thermodynamics & State Variables&#10;Week 2: First Law, Enthalpy, and Heat Capacities&#10;Week 3: Entropy, Carnot Cycles, and the Second Law..."
                    className="w-full px-4 py-3 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          className="w-4 h-4 animate-spin"
                          aria-hidden="true"
                        />
                        <span>Structuring...</span>
                      </>
                    ) : (
                      <>
                        <span>Structure Syllabus</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Hero Editorial Visual */}
        <div className="lg:col-span-5 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden min-h-[280px]">
          {!imgFailed ? (
            <img
              src="/src/assets/images/hero_folio_monograph_1795772263568.jpg"
              alt="Open hardcover academic textbook beside study notes and a fountain pen on a pale limestone desk"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full lg:h-full object-cover block"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-slate-200">
              <BookOpen
                className="w-10 h-10 text-[#1E3A8A] mb-3"
                aria-hidden="true"
              />
              <p className="font-display text-lg font-semibold text-slate-800">
                Folio Monograph Workspace
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Structured chapters, worked examples, diagrams, and PDF volumes
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Curated Outline Templates Shelf (Always accessible below on intake view) */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Curated Course Outline Templates
          </h2>
          <span className="text-xs text-slate-500">
            Click any syllabus to customize and generate chapters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SYLLABUS_TEMPLATES.map((tpl) => (
            <article
              key={tpl.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                  <span className="font-mono font-medium text-[#1E3A8A]">
                    {tpl.code}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{tpl.discipline}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tpl.modules.length} chapters</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900 leading-snug">
                  {tpl.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectTemplate(tpl)}
                className="w-full py-2 px-4 text-xs font-medium text-slate-900 bg-[#FAF9F6] border border-slate-300 rounded-lg hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-colors cursor-pointer"
              >
                Use Outline Template
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
