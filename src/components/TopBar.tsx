import React from 'react';
import { Download } from 'lucide-react';

export type AppView = 'library' | 'intake' | 'builder' | 'reader' | 'study';

interface TopBarProps {
  activeView: AppView;
  hasActiveCourse: boolean;
  onNavigate: (view: AppView) => void;
  onOpenExport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  hasActiveCourse,
  onNavigate,
  onOpenExport,
}) => {
  const navItems: Array<{ id: AppView; label: string; disabled?: boolean }> = [
    { id: 'library', label: 'Library' },
    { id: 'intake', label: 'New Syllabus' },
    { id: 'reader', label: 'Reader', disabled: !hasActiveCourse },
    { id: 'study', label: 'Study Deck', disabled: !hasActiveCourse },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className="font-display text-2xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A]"
        >
          Folio
        </button>

        {/* Zone 2: 4 concise single-line text links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive =
              activeView === item.id ||
              (activeView === 'builder' && item.id === 'intake');
            return (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A] ${
                  isActive
                    ? 'border-[#1E3A8A] text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={!hasActiveCourse}
            onClick={onOpenExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172E6E] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export Notes</span>
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto"
      >
        {navItems.map((item) => {
          const isActive =
            activeView === item.id ||
            (activeView === 'builder' && item.id === 'intake');
          return (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-40 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
