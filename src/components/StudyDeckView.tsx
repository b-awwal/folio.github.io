import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Flashcard,
  FlashcardMastery,
  QuizQuestion,
} from '../types/course';

interface StudyDeckViewProps {
  chapterId: string;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  quizSelections: Record<string, number>;
  flashcardMastery: Record<string, FlashcardMastery>;
  onSelectQuizAnswer: (questionKey: string, optionIdx: number) => void;
  onResetQuiz: () => void;
  onSetFlashcardMastery: (cardKey: string, mastery: FlashcardMastery) => void;
}

export const StudyDeckView: React.FC<StudyDeckViewProps> = ({
  chapterId,
  quiz,
  flashcards,
  quizSelections,
  flashcardMastery,
  onSelectQuizAnswer,
  onResetQuiz,
  onSetFlashcardMastery,
}) => {
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const safeCardIdx = flashcards.length
    ? Math.min(cardIdx, flashcards.length - 1)
    : 0;
  const activeCard = flashcards[safeCardIdx];
  const activeCardKey = `${chapterId}_fc_${safeCardIdx}`;
  const currentMastery = flashcardMastery[activeCardKey] || 'unseen';

  const answeredCount = quiz.filter(
    (_, idx) => quizSelections[`${chapterId}_q_${idx}`] !== undefined
  ).length;
  const correctCount = quiz.filter(
    (q, idx) => quizSelections[`${chapterId}_q_${idx}`] === q.correctIndex
  ).length;

  const masteredTotal = flashcards.filter(
    (_, idx) => flashcardMastery[`${chapterId}_fc_${idx}`] === 'mastered'
  ).length;

  const moveCard = (delta: number) => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCardIdx((prev) => (prev + delta + flashcards.length) % flashcards.length);
  };

  return (
    <div className="space-y-12">
      {/* Active-Recall Flashcards */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Active-Recall Flashcards
            </h3>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              Card {flashcards.length ? safeCardIdx + 1 : 0} of {flashcards.length}{' '}
              · {masteredTotal} mastered
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveCard(-1)}
              disabled={flashcards.length <= 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              aria-label="Previous flashcard"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveCard(1)}
              disabled={flashcards.length <= 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              aria-label="Next flashcard"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeCard ? (
          <div className="mt-6 space-y-5">
            <div className="perspective-1000">
              <div
                onClick={() => setIsFlipped((f) => !f)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsFlipped((f) => !f);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Flip flashcard"
                className="relative w-full min-h-[230px] cursor-pointer transition-transform duration-300 transform-style-3d"
                style={{
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-[#FAF9F6] border border-slate-200 rounded-xl p-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Prompt · Click card to reveal answer</span>
                    <span className="font-medium text-slate-700">
                      {currentMastery === 'mastered'
                        ? 'Status: Mastered'
                        : currentMastery === 'review'
                        ? 'Status: Needs Review'
                        : 'Status: Unseen'}
                    </span>
                  </div>
                  <p className="font-display text-xl font-medium text-slate-900 leading-snug text-center my-4">
                    {activeCard.front}
                  </p>
                  <div className="text-center text-xs text-[#1E3A8A] font-medium">
                    Flip for explanation
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-8 flex flex-col justify-between">
                  <div className="text-xs font-medium text-[#1E3A8A]">
                    Answer · Click card to return
                  </div>
                  <p className="font-serif text-base leading-relaxed text-slate-900 text-center my-4">
                    {activeCard.back}
                  </p>
                  <div className="text-center text-xs text-slate-600">
                    Rate your recall below
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSetFlashcardMastery(activeCardKey, 'review');
                    moveCard(1);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Needs Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetFlashcardMastery(activeCardKey, 'mastered');
                    moveCard(1);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-[#059669] text-white hover:bg-[#047857] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Mark Mastered
                </button>
              </div>
            </div>

            {showHint && activeCard.hint && (
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                <span className="font-semibold text-slate-800">Hint: </span>
                {activeCard.hint}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No flashcards available for this chapter.
          </p>
        )}
      </section>

      {/* Concept Check Quiz */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Chapter Concept Quiz
            </h3>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {answeredCount} of {quiz.length} answered · Score: {correctCount}/
              {quiz.length}
            </p>
          </div>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={onResetQuiz}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Quiz</span>
            </button>
          )}
        </div>

        <div className="mt-6 space-y-8">
          {quiz.map((q, qIdx) => {
            const key = `${chapterId}_q_${qIdx}`;
            const selected = quizSelections[key];
            const isAnswered = selected !== undefined;
            const isCorrect = selected === q.correctIndex;

            return (
              <div
                key={key}
                className="pb-6 border-b border-slate-100 last:border-b-0 last:pb-0"
              >
                <p className="font-medium text-slate-900 mb-3">
                  <span className="font-mono text-xs text-[#1E3A8A] mr-2 tabular-nums">
                    Q{qIdx + 1}
                  </span>
                  {q.question}
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isThisSelected = selected === optIdx;
                    const isThisCorrect = q.correctIndex === optIdx;

                    let optionStyle =
                      'bg-[#FAF9F6] border-slate-200 text-slate-800 hover:border-slate-400';
                    if (isAnswered) {
                      if (isThisCorrect) {
                        optionStyle =
                          'bg-emerald-50 border-emerald-600 text-emerald-950';
                      } else if (isThisSelected && !isThisCorrect) {
                        optionStyle =
                          'bg-red-50 border-red-600 text-red-950';
                      } else {
                        optionStyle =
                          'bg-slate-50 border-slate-200 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => onSelectQuizAnswer(key, optIdx)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer flex items-start gap-3 ${optionStyle}`}
                      >
                        <span className="font-mono text-xs font-semibold mt-0.5 shrink-0">
                          {letter}.
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div
                    className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
                      isCorrect
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-red-50/70 border-red-200 text-red-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      {isCorrect ? (
                        <>
                          <CheckCircle2
                            className="w-4 h-4 text-[#059669]"
                            aria-hidden="true"
                          />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle
                            className="w-4 h-4 text-[#DC2626]"
                            aria-hidden="true"
                          />
                          <span>
                            Incorrect — Correct answer is{' '}
                            {String.fromCharCode(65 + q.correctIndex)}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
