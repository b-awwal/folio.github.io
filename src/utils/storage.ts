import { Course, StudyProgress } from '../types/course';

const COURSES_KEY = 'folio_courses_v1';
const PROGRESS_KEY = 'folio_study_progress_v1';
const ACTIVE_COURSE_KEY = 'folio_active_course_v1';

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loadCourses(): Course[] {
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCourses(courses: Course[]): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        'Browser storage limit reached. Export older courses to PDF or Markdown and remove unused courses.',
    };
  }
}

export function loadActiveCourseId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_COURSE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveCourseId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_COURSE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_COURSE_KEY);
    }
  } catch {
    // Ignore storage errors for active selection
  }
}

export function loadStudyProgress(): StudyProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return {
        quizSelections: {},
        flashcardMastery: {},
        completedModuleIds: [],
      };
    }
    const parsed = JSON.parse(raw);
    return {
      quizSelections: parsed?.quizSelections || {},
      flashcardMastery: parsed?.flashcardMastery || {},
      completedModuleIds: Array.isArray(parsed?.completedModuleIds)
        ? parsed.completedModuleIds
        : [],
    };
  } catch {
    return {
      quizSelections: {},
      flashcardMastery: {},
      completedModuleIds: [],
    };
  }
}

export function saveStudyProgress(progress: StudyProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Non-fatal
  }
}
