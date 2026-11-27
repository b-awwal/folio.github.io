import { Course, ExportOptions, SyllabusModule } from '../types/course';

export function sanitizeFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64) || 'lecture_notes'
  );
}

export function compileCourseMarkdown(
  course: Course,
  targetModules: SyllabusModule[],
  options: ExportOptions
): string {
  const lines: string[] = [];

  lines.push(`# ${course.code ? `${course.code}: ` : ''}${course.title}`);
  lines.push('');
  lines.push(
    `**Discipline:** ${course.discipline} | **Level:** ${course.academicLevel}`
  );
  if (course.description) {
    lines.push('');
    lines.push(`> ${course.description}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const mod of targetModules) {
    if (!mod.chapter) continue;
    const ch = mod.chapter;

    lines.push(`## ${mod.weekLabel}: ${mod.title}`);
    lines.push('');

    if (mod.objectives.length > 0) {
      lines.push('### Learning Objectives');
      for (const obj of mod.objectives) {
        lines.push(`- ${obj}`);
      }
      lines.push('');
    }

    if (options.includeProse) {
      if (ch.chapterIntro) {
        lines.push(ch.chapterIntro);
        lines.push('');
      }
      for (const sec of ch.sections) {
        lines.push(`### ${sec.heading}`);
        lines.push('');
        lines.push(sec.contentMarkdown);
        lines.push('');
        lines.push(`> **Key Takeaway:** ${sec.keyTakeaway}`);
        lines.push('');
      }
    }

    if (options.includeDefinitions && ch.definitions.length > 0) {
      lines.push('### Key Definitions');
      lines.push('');
      for (const def of ch.definitions) {
        lines.push(`- **${def.term}**: ${def.definition}`);
        if (def.contextNote) {
          lines.push(`  *Context:* ${def.contextNote}`);
        }
      }
      lines.push('');
    }

    if (options.includeExamples && ch.workedExamples.length > 0) {
      lines.push('### Worked Examples');
      lines.push('');
      ch.workedExamples.forEach((ex, idx) => {
        lines.push(`#### Example ${idx + 1}: ${ex.title}`);
        lines.push('');
        lines.push(`**Problem:** ${ex.problemStatement}`);
        lines.push('');
        ex.steps.forEach((step, stepIdx) => {
          lines.push(`${stepIdx + 1}. ${step}`);
        });
        lines.push('');
        lines.push(`**Conclusion:** ${ex.solutionSummary}`);
        lines.push('');
      });
    }

    if (options.includeDiagrams) {
      if (ch.conceptDiagram?.nodes?.length) {
        lines.push(`### Concept Map: ${ch.conceptDiagram.title}`);
        lines.push('');
        lines.push(`*${ch.conceptDiagram.caption}*`);
        lines.push('');
        lines.push('```mermaid');
        lines.push('graph LR');
        for (const node of ch.conceptDiagram.nodes) {
          const safeLabel = node.label.replace(/"/g, "'");
          lines.push(`  ${node.id}["${safeLabel}"]`);
        }
        for (const edge of ch.conceptDiagram.edges) {
          const safeRel = edge.relation.replace(/"/g, "'");
          lines.push(`  ${edge.from} -->|${safeRel}| ${edge.to}`);
        }
        lines.push('```');
        lines.push('');
      }

      if (ch.timeline?.events?.length) {
        lines.push(`### Timeline: ${ch.timeline.title}`);
        lines.push('');
        for (const ev of ch.timeline.events) {
          lines.push(`- **${ev.dateLabel} — ${ev.title}:** ${ev.significance}`);
        }
        lines.push('');
      }
    }

    if (options.includeCheatSheet && ch.cheatSheet) {
      lines.push('### Summary Cheat Sheet');
      lines.push('');
      if (ch.cheatSheet.coreFormulasOrPrinciples.length > 0) {
        lines.push('**Core Principles & Formulas**');
        for (const item of ch.cheatSheet.coreFormulasOrPrinciples) {
          lines.push(`- ${item}`);
        }
        lines.push('');
      }
      if (ch.cheatSheet.commonPitfalls.length > 0) {
        lines.push('**Common Pitfalls**');
        for (const pitfall of ch.cheatSheet.commonPitfalls) {
          lines.push(`- ${pitfall}`);
        }
        lines.push('');
      }
      if (ch.cheatSheet.quickSummaryBullets.length > 0) {
        lines.push('**Quick Review**');
        for (const b of ch.cheatSheet.quickSummaryBullets) {
          lines.push(`- ${b}`);
        }
        lines.push('');
      }
    }

    if (options.includeQuiz && ch.quiz.length > 0) {
      lines.push('### Practice Quiz');
      lines.push('');
      ch.quiz.forEach((q, qIdx) => {
        lines.push(`${qIdx + 1}. ${q.question}`);
        q.options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          lines.push(`   - ${letter}) ${opt}`);
        });
        lines.push('');
      });

      lines.push('**Answer Key**');
      ch.quiz.forEach((q, qIdx) => {
        const letter = String.fromCharCode(65 + q.correctIndex);
        lines.push(`- Q${qIdx + 1}: **${letter}** — ${q.explanation}`);
      });
      lines.push('');
    }

    if (options.includeFurtherReading && ch.furtherReading.length > 0) {
      lines.push('### Further Reading');
      lines.push('');
      for (const ref of ch.furtherReading) {
        lines.push(`- *${ref.title}* — ${ref.authorOrSource}. ${ref.note}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(filename)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
