import React, { useState } from 'react';
import { X, FileDown, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Course, ExportOptions, SyllabusModule } from '../types/course';
import {
  compileCourseMarkdown,
  downloadMarkdownFile,
} from '../utils/markdownExport';
import { exportCourseToPdf } from '../utils/pdfExport';

interface ExportModalProps {
  course: Course;
  currentModule: SyllabusModule | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  course,
  currentModule,
  onClose,
}) => {
  const readyModules = course.modules.filter((m) => Boolean(m.chapter));
  const currentHasChapter = Boolean(currentModule?.chapter);

  const [options, setOptions] = useState<ExportOptions>({
    scope: currentHasChapter ? 'current' : 'all',
    includeProse: true,
    includeDefinitions: true,
    includeExamples: true,
    includeDiagrams: true,
    includeQuiz: true,
    includeCheatSheet: true,
    includeFurtherReading: true,
  });

  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const targetModules =
    options.scope === 'current' && currentModule?.chapter
      ? [currentModule]
      : readyModules;

  const toggleOption = (key: keyof Omit<ExportOptions, 'scope'>) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadPdf = () => {
    setFeedback(null);
    if (targetModules.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Generate at least one chapter before downloading a PDF.',
      });
      return;
    }
    setIsCompilingPdf(true);
    try {
      exportCourseToPdf(course, targetModules, options);
      setFeedback({
        type: 'success',
        message: `PDF downloaded (${targetModules.length} ${
          targetModules.length === 1 ? 'chapter' : 'chapters'
        } compiled).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to compile PDF file.',
      });
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    setFeedback(null);
    if (targetModules.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Generate at least one chapter before downloading Markdown.',
      });
      return;
    }
    const md = compileCourseMarkdown(course, targetModules, options);
    const filename =
      options.scope === 'current' && currentModule
        ? `${course.code || course.title}_${currentModule.weekLabel}`
        : `${course.code || ''}_${course.title}_Lecture_Notes`;
    downloadMarkdownFile(filename, md);
    setFeedback({
      type: 'success',
      message: `Markdown file downloaded (${targetModules.length} ${
        targetModules.length === 1 ? 'chapter' : 'chapters'
      }).`,
    });
  };

  const sectionCheckboxes: Array<{
    key: keyof Omit<ExportOptions, 'scope'>;
    label: string;
  }> = [
    { key: 'includeProse', label: 'Textbook Narrative Prose & Key Takeaways' },
    { key: 'includeDefinitions', label: 'Key Definitions & Glossary' },
    { key: 'includeExamples', label: 'Worked Examples & Step-by-Step Solutions' },
    { key: 'includeDiagrams', label: 'Visual Concept Maps & Timelines' },
    { key: 'includeCheatSheet', label: 'Summary Cheat Sheet' },
    { key: 'includeQuiz', label: 'Practice Quiz & Answer Key' },
    { key: 'includeFurtherReading', label: 'Further Reading Citations' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2
              id="export-modal-title"
              className="font-display text-xl font-semibold text-slate-900"
            >
              Export & Download Textbook
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {readyModules.length} of {course.modules.length} chapters ready for export
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Close export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Scope Selector */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700">
              Export Scope
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                disabled={!currentHasChapter}
                onClick={() => setOptions((p) => ({ ...p, scope: 'current' }))}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  options.scope === 'current'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Current Chapter
              </button>
              <button
                type="button"
                onClick={() => setOptions((p) => ({ ...p, scope: 'all' }))}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  options.scope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entire Course ({readyModules.length})
              </button>
            </div>
          </div>

          {/* Section Toggles */}
          <div className="space-y-2.5">
            <span className="block text-xs font-semibold text-slate-700">
              Included Sections
            </span>
            <div className="space-y-2 bg-[#FAF9F6] border border-slate-200 rounded-lg p-4">
              {sectionCheckboxes.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={options[item.key]}
                    onChange={() => toggleOption(item.key)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1E3A8A]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {feedback && (
            <div
              className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2
                  className="w-4 h-4 text-[#059669] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Download Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isCompilingPdf || targetModules.length === 0}
              onClick={handleDownloadPdf}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" />
              <span>
                {isCompilingPdf ? 'Compiling PDF...' : 'Download PDF (.pdf)'}
              </span>
            </button>
            <button
              type="button"
              disabled={targetModules.length === 0}
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>Download Markdown (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
