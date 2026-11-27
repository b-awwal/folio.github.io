import { jsPDF } from 'jspdf';
import {
  ConceptDiagram,
  Course,
  ExportOptions,
  SyllabusModule,
  TimelineData,
} from '../types/course';
import { sanitizeFilename } from './markdownExport';

const PAGE_W = 210; // A4 width in mm
const PAGE_H = 297; // A4 height in mm
const MARGIN_X = 20;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 22;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const COLORS = {
  ink: [15, 23, 42] as [number, number, number],
  body: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  lapis: [30, 58, 138] as [number, number, number],
  surface: [241, 245, 249] as [number, number, number],
  paperTint: [248, 250, 252] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  emerald: [5, 150, 105] as [number, number, number],
};

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
}

function renderConceptDiagramToPng(diagram: ConceptDiagram): string | null {
  if (typeof document === 'undefined' || !diagram?.nodes?.length) return null;

  const width = 1200;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Clean background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Subtle dot grid
  ctx.fillStyle = '#E2E8F0';
  for (let gx = 40; gx < width; gx += 40) {
    for (let gy = 40; gy < height; gy += 40) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const nodes = diagram.nodes.slice(0, 8);
  const cols = Math.min(3, Math.max(2, Math.ceil(nodes.length / 3)));
  const rows = Math.ceil(nodes.length / cols);

  const cellW = (width - 140) / cols;
  const cellH = (height - 120) / rows;
  const boxW = 240;
  const boxH = 74;

  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const offsetX = row % 2 === 1 && cols > 2 ? 32 : 0;
    const cx = 70 + col * cellW + cellW / 2 + offsetX;
    const cy = 60 + row * cellH + cellH / 2;
    positions.set(node.id, { x: cx, y: cy });
  });

  // Draw edges first
  ctx.font = '500 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const edge of diagram.edges) {
    const fromPos = positions.get(edge.from);
    const toPos = positions.get(edge.to);
    if (!fromPos || !toPos) continue;

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    const startX = fromPos.x + ux * 55;
    const startY = fromPos.y + uy * 32;
    const endX = toPos.x - ux * 65;
    const endY = toPos.y - uy * 38;

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLen = 11;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLen * Math.cos(angle - Math.PI / 6),
      endY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLen * Math.cos(angle + Math.PI / 6),
      endY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // Relation pill
    if (edge.relation) {
      const mx = (startX + endX) / 2;
      const my = (startY + endY) / 2;
      const labelW = ctx.measureText(edge.relation).width + 18;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(mx - labelW / 2, my - 12, labelW, 24);
      ctx.fillStyle = '#475569';
      ctx.fillText(edge.relation, mx, my);
    }
  }

  // Draw node boxes
  const categoryStroke: Record<string, string> = {
    'Core Principle': '#1E3A8A',
    Mechanism: '#0284C7',
    Application: '#059669',
    Evidence: '#475569',
  };

  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const x = pos.x - boxW / 2;
    const y = pos.y - boxH / 2;

    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = categoryStroke[node.category] || '#1E3A8A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(node.category, pos.x, y + 21);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 18px sans-serif';
    const labelText =
      node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label;
    ctx.fillText(labelText, pos.x, y + 48);
  }

  return canvas.toDataURL('image/png');
}

function renderTimelineToPng(timeline: TimelineData): string | null {
  if (typeof document === 'undefined' || !timeline?.events?.length) return null;

  const events = timeline.events.slice(0, 6);
  const width = 1200;
  const height = 110 + events.length * 88;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  const spineX = 210;
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(spineX, 46);
  ctx.lineTo(spineX, height - 46);
  ctx.stroke();

  events.forEach((ev, idx) => {
    const y = 66 + idx * 88;

    // Date label on left
    ctx.fillStyle = '#1E3A8A';
    ctx.font = '700 18px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(ev.dateLabel.slice(0, 16), spineX - 24, y);

    // Node dot
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.arc(spineX, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(spineX, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Title & significance on right
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 20px sans-serif';
    ctx.fillText(ev.title.slice(0, 68), spineX + 26, y - 12);

    ctx.fillStyle = '#475569';
    ctx.font = '400 16px sans-serif';
    const sig =
      ev.significance.length > 96
        ? `${ev.significance.slice(0, 94)}...`
        : ev.significance;
    ctx.fillText(sig, spineX + 26, y + 16);
  });

  return canvas.toDataURL('image/png');
}

class TextbookPdfBuilder {
  private doc: jsPDF;
  private y = MARGIN_TOP;
  private currentHeader = '';

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  private ensureSpace(neededMm: number): void {
    if (this.y + neededMm > PAGE_H - MARGIN_BOTTOM) {
      this.doc.addPage();
      this.y = MARGIN_TOP;
      this.drawRunningHeader();
    }
  }

  private drawRunningHeader(): void {
    if (!this.currentHeader) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(this.currentHeader, MARGIN_X, 13);
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN_X, 16, PAGE_W - MARGIN_X, 16);
  }

  public addCoverPage(course: Course, modules: SyllabusModule[]): void {
    this.currentHeader = '';

    // Subtle top rule
    this.doc.setDrawColor(...COLORS.lapis);
    this.doc.setLineWidth(1.2);
    this.doc.line(MARGIN_X, 34, MARGIN_X + 36, 34);

    // Kicker
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.lapis);
    const kicker = `${course.discipline}  ·  ${course.academicLevel}${
      course.code ? `  ·  ${course.code}` : ''
    }`;
    this.doc.text(kicker, MARGIN_X, 46);

    // Course Title
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(28);
    this.doc.setTextColor(...COLORS.ink);
    const titleLines = this.doc.splitTextToSize(course.title, CONTENT_W);
    this.doc.text(titleLines, MARGIN_X, 62);

    let cursorY = 62 + titleLines.length * 11 + 8;

    // Subtitle / Description
    if (course.description) {
      this.doc.setFont('times', 'normal');
      this.doc.setFontSize(13);
      this.doc.setTextColor(...COLORS.body);
      const descLines = this.doc.splitTextToSize(course.description, CONTENT_W);
      this.doc.text(descLines, MARGIN_X, cursorY);
      cursorY += descLines.length * 6.5 + 14;
    }

    // Divider
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN_X, cursorY, PAGE_W - MARGIN_X, cursorY);
    cursorY += 12;

    // Table of Contents Preview on Cover
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text('Contents Included in This Volume', MARGIN_X, cursorY);
    cursorY += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    for (const mod of modules) {
      if (cursorY > PAGE_H - 42) break;
      this.doc.setTextColor(...COLORS.lapis);
      this.doc.text(mod.weekLabel, MARGIN_X, cursorY);
      this.doc.setTextColor(...COLORS.ink);
      const line = this.doc.splitTextToSize(mod.title, CONTENT_W - 28);
      this.doc.text(line, MARGIN_X + 26, cursorY);
      cursorY += Math.max(7, line.length * 5.2 + 2);
    }

    // Footer imprint
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.muted);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.doc.text(`Compiled with Folio Lecture Notes · ${dateStr}`, MARGIN_X, PAGE_H - 22);
  }

  public addChapter(
    course: Course,
    mod: SyllabusModule,
    chapterIndex: number,
    options: ExportOptions
  ): void {
    if (!mod.chapter) return;
    const ch = mod.chapter;

    this.doc.addPage();
    this.y = MARGIN_TOP;
    this.currentHeader = `${course.code ? `${course.code} · ` : ''}${mod.weekLabel}: ${mod.title}`;
    this.drawRunningHeader();

    // Chapter Kicker
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...COLORS.lapis);
    this.doc.text(`${mod.weekLabel}  ·  Chapter ${chapterIndex + 1}`, MARGIN_X, this.y);
    this.y += 8;

    // Chapter Heading
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(21);
    this.doc.setTextColor(...COLORS.ink);
    const chTitleLines = this.doc.splitTextToSize(mod.title, CONTENT_W);
    this.doc.text(chTitleLines, MARGIN_X, this.y);
    this.y += chTitleLines.length * 8.5 + 4;

    // Learning Objectives Box
    if (mod.objectives.length > 0) {
      const objTexts = mod.objectives.map((o) => `• ${o}`);
      const wrapped = objTexts.flatMap((t) =>
        this.doc.splitTextToSize(t, CONTENT_W - 12)
      );
      const boxH = 12 + wrapped.length * 5;
      this.ensureSpace(boxH + 4);
      this.doc.setFillColor(...COLORS.surface);
      this.doc.setDrawColor(...COLORS.border);
      this.doc.roundedRect(MARGIN_X, this.y, CONTENT_W, boxH, 2, 2, 'FD');

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9);
      this.doc.setTextColor(...COLORS.lapis);
      this.doc.text('Learning Objectives', MARGIN_X + 6, this.y + 7);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(...COLORS.body);
      this.doc.text(wrapped, MARGIN_X + 6, this.y + 13);
      this.y += boxH + 8;
    }

    // Narrative Prose
    if (options.includeProse) {
      if (ch.chapterIntro) {
        this.addParagraph(stripInlineMarkdown(ch.chapterIntro), 'times', 11);
      }

      for (const sec of ch.sections) {
        this.addSectionHeading(sec.heading);
        this.addMarkdownBlock(sec.contentMarkdown);
        this.addCalloutBox('Key Takeaway', stripInlineMarkdown(sec.keyTakeaway));
      }
    }

    // Key Definitions
    if (options.includeDefinitions && ch.definitions.length > 0) {
      this.addSectionHeading('Key Definitions & Glossary');
      for (const def of ch.definitions) {
        const defText = stripInlineMarkdown(`${def.definition} ${def.contextNote ? `(${def.contextNote})` : ''}`);
        const lines = this.doc.splitTextToSize(defText, CONTENT_W - 4);
        this.ensureSpace(10 + lines.length * 5);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10.5);
        this.doc.setTextColor(...COLORS.ink);
        this.doc.text(def.term, MARGIN_X, this.y);
        this.y += 5;

        this.doc.setFont('times', 'normal');
        this.doc.setFontSize(10.5);
        this.doc.setTextColor(...COLORS.body);
        this.doc.text(lines, MARGIN_X + 2, this.y);
        this.y += lines.length * 5 + 4;
      }
    }

    // Worked Examples
    if (options.includeExamples && ch.workedExamples.length > 0) {
      this.addSectionHeading('Worked Examples');
      ch.workedExamples.forEach((ex, idx) => {
        this.ensureSpace(22);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(11);
        this.doc.setTextColor(...COLORS.lapis);
        this.doc.text(`Example ${idx + 1}: ${ex.title}`, MARGIN_X, this.y);
        this.y += 6;

        this.addParagraph(
          `Problem: ${stripInlineMarkdown(ex.problemStatement)}`,
          'helvetica',
          10
        );

        ex.steps.forEach((step, sIdx) => {
          const stepLines = this.doc.splitTextToSize(
            `${sIdx + 1}. ${stripInlineMarkdown(step)}`,
            CONTENT_W - 6
          );
          this.ensureSpace(stepLines.length * 5 + 3);
          this.doc.setFont('times', 'normal');
          this.doc.setFontSize(10.5);
          this.doc.setTextColor(...COLORS.body);
          this.doc.text(stepLines, MARGIN_X + 4, this.y);
          this.y += stepLines.length * 5 + 2;
        });

        this.addCalloutBox(
          'Solution Summary',
          stripInlineMarkdown(ex.solutionSummary)
        );
      });
    }

    // Concept Diagrams & Timeline
    if (options.includeDiagrams) {
      if (ch.conceptDiagram?.nodes?.length) {
        this.addSectionHeading(`Visual Concept Map: ${ch.conceptDiagram.title}`);
        const png = renderConceptDiagramToPng(ch.conceptDiagram);
        if (png) {
          const imgH = 90;
          this.ensureSpace(imgH + 14);
          this.doc.addImage(png, 'PNG', MARGIN_X, this.y, CONTENT_W, imgH);
          this.y += imgH + 5;
        }
        this.doc.setFont('times', 'italic');
        this.doc.setFontSize(9.5);
        this.doc.setTextColor(...COLORS.muted);
        const capLines = this.doc.splitTextToSize(
          `Fig. ${chapterIndex + 1}.1 — ${ch.conceptDiagram.caption}`,
          CONTENT_W
        );
        this.doc.text(capLines, MARGIN_X, this.y);
        this.y += capLines.length * 4.5 + 6;
      }

      if (ch.timeline?.events?.length) {
        this.addSectionHeading(`Timeline: ${ch.timeline.title}`);
        const timelinePng = renderTimelineToPng(ch.timeline);
        if (timelinePng) {
          const count = Math.min(6, ch.timeline.events.length);
          const imgH = Math.min(115, 22 + count * 14);
          this.ensureSpace(imgH + 10);
          this.doc.addImage(timelinePng, 'PNG', MARGIN_X, this.y, CONTENT_W, imgH);
          this.y += imgH + 8;
        }
      }
    }

    // Cheat Sheet
    if (options.includeCheatSheet && ch.cheatSheet) {
      this.addSectionHeading('Summary Cheat Sheet');
      if (ch.cheatSheet.coreFormulasOrPrinciples.length > 0) {
        this.addSubLabel('Core Principles & Formulas');
        for (const item of ch.cheatSheet.coreFormulasOrPrinciples) {
          this.addBullet(stripInlineMarkdown(item));
        }
      }
      if (ch.cheatSheet.commonPitfalls.length > 0) {
        this.addSubLabel('Common Pitfalls');
        for (const item of ch.cheatSheet.commonPitfalls) {
          this.addBullet(stripInlineMarkdown(item));
        }
      }
      if (ch.cheatSheet.quickSummaryBullets.length > 0) {
        this.addSubLabel('Quick Review');
        for (const item of ch.cheatSheet.quickSummaryBullets) {
          this.addBullet(stripInlineMarkdown(item));
        }
      }
    }

    // Quiz & Answer Key
    if (options.includeQuiz && ch.quiz.length > 0) {
      this.addSectionHeading('Practice Quiz');
      ch.quiz.forEach((q, qIdx) => {
        const qLines = this.doc.splitTextToSize(
          `${qIdx + 1}. ${stripInlineMarkdown(q.question)}`,
          CONTENT_W
        );
        this.ensureSpace(qLines.length * 5 + q.options.length * 5.5 + 6);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10);
        this.doc.setTextColor(...COLORS.ink);
        this.doc.text(qLines, MARGIN_X, this.y);
        this.y += qLines.length * 5 + 2;

        q.options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          const optLines = this.doc.splitTextToSize(
            `${letter}) ${stripInlineMarkdown(opt)}`,
            CONTENT_W - 8
          );
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(9.5);
          this.doc.setTextColor(...COLORS.body);
          this.doc.text(optLines, MARGIN_X + 5, this.y);
          this.y += optLines.length * 4.8 + 1;
        });
        this.y += 3;
      });

      this.addSubLabel('Answer Key & Explanations');
      ch.quiz.forEach((q, qIdx) => {
        const letter = String.fromCharCode(65 + q.correctIndex);
        this.addBullet(
          `Q${qIdx + 1} (${letter}): ${stripInlineMarkdown(q.explanation)}`
        );
      });
    }

    // Further Reading
    if (options.includeFurtherReading && ch.furtherReading.length > 0) {
      this.addSectionHeading('Further Reading');
      for (const ref of ch.furtherReading) {
        this.addBullet(`${ref.title} — ${ref.authorOrSource}. ${ref.note}`);
      }
    }
  }

  private addSectionHeading(heading: string): void {
    const lines = this.doc.splitTextToSize(heading, CONTENT_W);
    this.ensureSpace(14 + lines.length * 6);
    this.y += 3;
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(...COLORS.ink);
    this.doc.text(lines, MARGIN_X, this.y);
    this.y += lines.length * 6 + 3;
  }

  private addSubLabel(label: string): void {
    this.ensureSpace(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.lapis);
    this.doc.text(label, MARGIN_X, this.y);
    this.y += 5.5;
  }

  private addParagraph(
    text: string,
    font: 'times' | 'helvetica' = 'times',
    fontSize = 10.8
  ): void {
    const clean = text.trim();
    if (!clean) return;
    const paragraphs = clean.split(/\n{2,}/);
    for (const para of paragraphs) {
      const lines = this.doc.splitTextToSize(para.replace(/\n/g, ' '), CONTENT_W);
      this.ensureSpace(lines.length * 5.2 + 4);
      this.doc.setFont(font, 'normal');
      this.doc.setFontSize(fontSize);
      this.doc.setTextColor(...COLORS.body);
      this.doc.text(lines, MARGIN_X, this.y);
      this.y += lines.length * 5.2 + 3.5;
    }
  }

  private addBullet(text: string): void {
    const lines = this.doc.splitTextToSize(`• ${text}`, CONTENT_W - 4);
    this.ensureSpace(lines.length * 5 + 3);
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(10.2);
    this.doc.setTextColor(...COLORS.body);
    this.doc.text(lines, MARGIN_X + 2, this.y);
    this.y += lines.length * 5 + 2;
  }

  private addMarkdownBlock(md: string): void {
    const blocks = md.split(/\n{2,}/);
    for (const rawBlock of blocks) {
      const block = rawBlock.trim();
      if (!block) continue;

      if (block.startsWith('#### ') || block.startsWith('### ')) {
        this.addSubLabel(stripInlineMarkdown(block.replace(/^#{3,4}\s+/, '')));
        continue;
      }

      if (block.startsWith('```')) {
        const codeContent = block
          .replace(/^```[^\n]*\n?/, '')
          .replace(/```$/, '')
          .trim();
        const codeLines = this.doc.splitTextToSize(codeContent, CONTENT_W - 10);
        const boxH = 8 + codeLines.length * 4.5;
        this.ensureSpace(boxH + 4);
        this.doc.setFillColor(...COLORS.surface);
        this.doc.setDrawColor(...COLORS.border);
        this.doc.roundedRect(MARGIN_X, this.y, CONTENT_W, boxH, 1.5, 1.5, 'FD');
        this.doc.setFont('courier', 'normal');
        this.doc.setFontSize(8.8);
        this.doc.setTextColor(...COLORS.ink);
        this.doc.text(codeLines, MARGIN_X + 5, this.y + 6);
        this.y += boxH + 5;
        continue;
      }

      const lines = block.split('\n');
      const isList = lines.every(
        (l) => /^[-*]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim())
      );
      if (isList) {
        for (const item of lines) {
          this.addBullet(
            stripInlineMarkdown(item.trim().replace(/^([-*]|\d+\.)\s+/, ''))
          );
        }
        this.y += 2;
        continue;
      }

      this.addParagraph(stripInlineMarkdown(block), 'times', 10.8);
    }
  }

  private addCalloutBox(title: string, body: string): void {
    const lines = this.doc.splitTextToSize(body, CONTENT_W - 12);
    const boxH = 12 + lines.length * 4.8;
    this.ensureSpace(boxH + 5);

    this.doc.setFillColor(...COLORS.paperTint);
    this.doc.setDrawColor(...COLORS.border);
    this.doc.roundedRect(MARGIN_X, this.y, CONTENT_W, boxH, 2, 2, 'FD');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.lapis);
    this.doc.text(title, MARGIN_X + 6, this.y + 6.5);

    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.body);
    this.doc.text(lines, MARGIN_X + 6, this.y + 12);
    this.y += boxH + 6;
  }

  public finalizeAndSave(filename: string): void {
    const totalPages = this.doc.getNumberOfPages();
    for (let p = 2; p <= totalPages; p++) {
      this.doc.setPage(p);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...COLORS.muted);
      this.doc.text(
        `Page ${p} of ${totalPages}`,
        PAGE_W - MARGIN_X,
        PAGE_H - 12,
        { align: 'right' }
      );
    }
    this.doc.save(`${sanitizeFilename(filename)}.pdf`);
  }
}

export function exportCourseToPdf(
  course: Course,
  targetModules: SyllabusModule[],
  options: ExportOptions
): void {
  const readyModules = targetModules.filter((m) => Boolean(m.chapter));
  if (readyModules.length === 0) {
    throw new Error('Generate at least one chapter before exporting a PDF.');
  }

  const builder = new TextbookPdfBuilder();
  builder.addCoverPage(course, readyModules);

  readyModules.forEach((mod, idx) => {
    builder.addChapter(course, mod, idx, options);
  });

  const name =
    options.scope === 'current' && readyModules.length === 1
      ? `${course.code || course.title}_${readyModules[0].weekLabel}`
      : `${course.code || ''}_${course.title}_Lecture_Notes`;

  builder.finalizeAndSave(name);
}
