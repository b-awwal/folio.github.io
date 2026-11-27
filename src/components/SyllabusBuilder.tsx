import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { AcademicLevel, Course, SyllabusModule } from '../types/course';
import { createId } from '../utils/storage';

interface SyllabusBuilderProps {
  initialCourse: Course;
  onSaveCourse: (course: Course, autoGenerateFirst: boolean) => void;
  onCancel: () => void;
}

const LEVELS: AcademicLevel[] = [
  'Introductory Undergraduate',
  'Intermediate Undergraduate',
  'Advanced / Graduate',
  'Independent Study',
];

export const SyllabusBuilder: React.FC<SyllabusBuilderProps> = ({
  initialCourse,
  onSaveCourse,
  onCancel,
}) => {
  const [draft, setDraft] = useState<Course>(() => ({
    ...initialCourse,
    modules: initialCourse.modules.map((m) => ({
      ...m,
      objectives: [...m.objectives],
    })),
  }));

  const updateField = <K extends keyof Course>(key: K, value: Course[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateModule = (
    idx: number,
    patch: Partial<SyllabusModule>
  ) => {
    setDraft((prev) => {
      const next = [...prev.modules];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, modules: next };
    });
  };

  const moveModule = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= draft.modules.length) return;
    setDraft((prev) => {
      const next = [...prev.modules];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return {
        ...prev,
        modules: next.map((m, i) => ({ ...m, order: i + 1 })),
      };
    });
  };

  const removeModule = (idx: number) => {
    if (draft.modules.length <= 1) return;
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules
        .filter((_, i) => i !== idx)
        .map((m, i) => ({ ...m, order: i + 1 })),
    }));
  };

  const addModule = () => {
    const num = draft.modules.length + 1;
    const weekLabel = `Week ${String(num).padStart(2, '0')}`;
    setDraft((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          id: createId('mod'),
          order: num,
          weekLabel,
          title: 'New Lecture Topic',
          summary: 'Core themes and analytical frameworks for this lecture.',
          objectives: ['Explain the central principles of this topic'],
          estimatedReadMinutes: 16,
        },
      ],
    }));
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back</span>
          </button>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Review & Customize Course Syllabus
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Refine module titles, sequence, and learning objectives before
            generating textbook chapters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              onSaveCourse(
                { ...draft, updatedAt: new Date().toISOString() },
                false
              )
            }
            className="px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            Save & Open Reader
          </button>
          <button
            type="button"
            onClick={() =>
              onSaveCourse(
                { ...draft, updatedAt: new Date().toISOString() },
                true
              )
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Save & Generate Chapter 1</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Course Metadata Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Course Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label
              htmlFor="course-title"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Course Title
            </label>
            <input
              id="course-title"
              type="text"
              value={draft.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="course-code"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Course Code
            </label>
            <input
              id="course-code"
              type="text"
              value={draft.code}
              onChange={(e) => updateField('code', e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="course-discipline"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Discipline
            </label>
            <input
              id="course-discipline"
              type="text"
              value={draft.discipline}
              onChange={(e) => updateField('discipline', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="course-level"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Academic Level
            </label>
            <select
              id="course-level"
              value={draft.academicLevel}
              onChange={(e) =>
                updateField('academicLevel', e.target.value as AcademicLevel)
              }
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-8">
            <label
              htmlFor="course-desc"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Course Overview
            </label>
            <input
              id="course-desc"
              type="text"
              value={draft.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>
        </div>

        {draft.sources && draft.sources.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 mb-2">
              Imported Web Sources
            </div>
            <div className="flex flex-wrap gap-3">
              {draft.sources.map((src, i) => (
                <a
                  key={`${src.uri}-${i}`}
                  href={src.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline"
                >
                  <span>{src.title}</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Modules List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Lecture Modules ({draft.modules.length})
          </h2>
          <button
            type="button"
            onClick={addModule}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Lecture Module</span>
          </button>
        </div>

        <div className="space-y-4">
          {draft.modules.map((mod, idx) => (
            <div
              key={mod.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-[#1E3A8A] tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <input
                    type="text"
                    value={mod.weekLabel}
                    onChange={(e) =>
                      updateModule(idx, { weekLabel: e.target.value })
                    }
                    aria-label="Week or module label"
                    className="w-28 px-2.5 py-1 text-xs font-mono bg-[#FAF9F6] border border-slate-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  />
                  {mod.chapter && (
                    <span className="text-xs font-medium text-[#059669]">
                      Chapter generated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveModule(idx, -1)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    aria-label="Move module up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === draft.modules.length - 1}
                    onClick={() => moveModule(idx, 1)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    aria-label="Move module down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={draft.modules.length <= 1}
                    onClick={() => removeModule(idx)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                    aria-label="Remove module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) =>
                      updateModule(idx, { title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm font-medium bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div className="md:col-span-7">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Topic Summary
                  </label>
                  <input
                    type="text"
                    value={mod.summary}
                    onChange={(e) =>
                      updateModule(idx, { summary: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Learning Objectives (one per line)
                </label>
                <textarea
                  rows={2}
                  value={mod.objectives.join('\n')}
                  onChange={(e) =>
                    updateModule(idx, {
                      objectives: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
