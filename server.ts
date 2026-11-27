import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Do not retry auth or invalid argument errors
      if (
        msg.includes('API_KEY_INVALID') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('INVALID_ARGUMENT') ||
        msg.includes('400') ||
        msg.includes('403')
      ) {
        throw err;
      }
      if (attempt < retries) {
        const delayMs = 700 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : 'Unexpected server error';
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message:
        'Gemini API access failed. Please verify your API key in the Settings > Secrets panel.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message:
        'Rate limit or quota reached. Please wait a moment and try again, or check your quota in Settings > Secrets.',
    };
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return {
      status: 404,
      message: `Requested model (${MODEL_NAME}) was not found or is unavailable.`,
    };
  }
  return { status: 500, message: raw };
}

const syllabusResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Full academic course title.' },
    code: {
      type: Type.STRING,
      description: 'Course catalog code such as CS 229 or ECON 104.',
    },
    discipline: {
      type: Type.STRING,
      description: 'Academic discipline, e.g., Computer Science, Economics, Biology.',
    },
    academicLevel: {
      type: Type.STRING,
      description:
        'One of: Introductory Undergraduate, Intermediate Undergraduate, Advanced / Graduate, Independent Study.',
    },
    description: {
      type: Type.STRING,
      description: 'Concise 2-sentence overview of the course scope.',
    },
    modules: {
      type: Type.ARRAY,
      description: 'Ordered sequence of 4 to 10 weekly or thematic syllabus modules.',
      items: {
        type: Type.OBJECT,
        properties: {
          weekLabel: {
            type: Type.STRING,
            description: 'Module label like Week 01, Module 02, or Unit 03.',
          },
          title: {
            type: Type.STRING,
            description: 'Clear lecture or chapter title.',
          },
          summary: {
            type: Type.STRING,
            description: '1-2 sentence summary of the topics covered in this lecture.',
          },
          objectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 to 4 measurable learning objectives for this lecture.',
          },
          estimatedReadMinutes: {
            type: Type.INTEGER,
            description: 'Estimated reading time in minutes (between 12 and 25).',
          },
        },
        required: [
          'weekLabel',
          'title',
          'summary',
          'objectives',
          'estimatedReadMinutes',
        ],
      },
    },
  },
  required: [
    'title',
    'code',
    'discipline',
    'academicLevel',
    'description',
    'modules',
  ],
};

const lectureChapterSchema = {
  type: Type.OBJECT,
  properties: {
    chapterIntro: {
      type: Type.STRING,
      description:
        'Compelling 2-paragraph textbook chapter introduction situating the topic within the broader course.',
    },
    sections: {
      type: Type.ARRAY,
      description:
        '4 to 5 deep-dive textbook narrative sections with rigorous explanations, Markdown formatting, LaTeX math ($...$ or $$...$$) where relevant, and concrete analysis.',
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          contentMarkdown: {
            type: Type.STRING,
            description:
              'Comprehensive multi-paragraph textbook prose in Markdown (400-650 words per section). Include subheadings (####), bullet lists, comparison tables, code blocks, or LaTeX math where appropriate.',
          },
          keyTakeaway: {
            type: Type.STRING,
            description: 'Single sharp conceptual synthesis sentence summarizing the section.',
          },
        },
        required: ['heading', 'contentMarkdown', 'keyTakeaway'],
      },
    },
    definitions: {
      type: Type.ARRAY,
      description: '5 to 7 essential glossary definitions introduced in this chapter.',
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING },
          contextNote: {
            type: Type.STRING,
            description: 'Short note on why this term matters or how it connects to prior ideas.',
          },
        },
        required: ['term', 'definition', 'contextNote'],
      },
    },
    workedExamples: {
      type: Type.ARRAY,
      description: '2 to 3 complete step-by-step worked examples, derivations, or case analyses.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          problemStatement: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 5 clear sequential reasoning or calculation steps.',
          },
          solutionSummary: { type: Type.STRING },
        },
        required: ['title', 'problemStatement', 'steps', 'solutionSummary'],
      },
    },
    conceptDiagram: {
      type: Type.OBJECT,
      description: 'Structured concept map showing causal or structural relationships.',
      properties: {
        title: { type: Type.STRING },
        caption: { type: Type.STRING },
        nodes: {
          type: Type.ARRAY,
          description: '6 to 8 distinct concept nodes with unique short ids (e.g., n1, n2).',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: {
                type: Type.STRING,
                description: 'Concise node label (2 to 4 words max).',
              },
              category: {
                type: Type.STRING,
                description: 'One of: Core Principle, Mechanism, Application, Evidence.',
              },
              summary: {
                type: Type.STRING,
                description: '2-sentence explanation displayed when a learner inspects the node.',
              },
            },
            required: ['id', 'label', 'category', 'summary'],
          },
        },
        edges: {
          type: Type.ARRAY,
          description: '6 to 10 directed links connecting node ids.',
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              relation: {
                type: Type.STRING,
                description: 'Short verb phrase (1 to 3 words), e.g., drives, constrains, produces.',
              },
            },
            required: ['from', 'to', 'relation'],
          },
        },
      },
      required: ['title', 'caption', 'nodes', 'edges'],
    },
    timeline: {
      type: Type.OBJECT,
      description:
        'Chronological historical development or sequential process timeline of 4 to 6 milestones.',
      properties: {
        title: { type: Type.STRING },
        events: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dateLabel: {
                type: Type.STRING,
                description: 'Year, era, or stage label (e.g., 1936, Phase I, 1787).',
              },
              title: { type: Type.STRING },
              significance: { type: Type.STRING },
            },
            required: ['dateLabel', 'title', 'significance'],
          },
        },
      },
      required: ['title', 'events'],
    },
    quiz: {
      type: Type.ARRAY,
      description: '4 to 5 conceptual multiple-choice questions.',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 4 plausible answer choices.',
          },
          correctIndex: {
            type: Type.INTEGER,
            description: '0-based index (0 to 3) of the correct option.',
          },
          explanation: {
            type: Type.STRING,
            description: 'Clear rationale explaining why the correct answer holds and why distractors fail.',
          },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
      },
    },
    flashcards: {
      type: Type.ARRAY,
      description: '6 to 8 active-recall study flashcards.',
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING },
          back: { type: Type.STRING },
          hint: { type: Type.STRING },
        },
        required: ['front', 'back', 'hint'],
      },
    },
    cheatSheet: {
      type: Type.OBJECT,
      properties: {
        coreFormulasOrPrinciples: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '4 to 6 high-yield formulas, theorems, or core rules.',
        },
        commonPitfalls: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 to 5 common student misconceptions or exam traps.',
        },
        quickSummaryBullets: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '4 to 6 concise revision bullets.',
        },
      },
      required: [
        'coreFormulasOrPrinciples',
        'commonPitfalls',
        'quickSummaryBullets',
      ],
    },
    furtherReading: {
      type: Type.ARRAY,
      description: '3 to 4 authoritative textbooks, seminal papers, or reference readings.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          authorOrSource: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ['title', 'authorOrSource', 'note'],
      },
    },
  },
  required: [
    'chapterIntro',
    'sections',
    'definitions',
    'workedExamples',
    'conceptDiagram',
    'timeline',
    'quiz',
    'flashcards',
    'cheatSheet',
    'furtherReading',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/syllabus/import', async (req: Request, res: Response) => {
    try {
      const { mode, url, text } = req.body as {
        mode?: 'url' | 'text';
        url?: string;
        text?: string;
      };

      const ai = createAiClient();

      if (mode === 'url') {
        const cleanUrl = (url || '').trim();
        if (!cleanUrl) {
          res.status(400).json({ error: 'Please provide a valid course or syllabus URL.' });
          return;
        }
        try {
          new URL(cleanUrl);
        } catch {
          res.status(400).json({
            error: 'That does not look like a valid URL. Include https:// at the beginning.',
          });
          return;
        }

        // Step 1: Retrieve syllabus details via URL Context + Search Grounding
        const researchResponse = await withRetry(() =>
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Inspect the course syllabus or course outline at this URL: ${cleanUrl}

Extract the complete course title, course code, academic discipline, level, course description, and every lecture/week/module topic and learning objective covered in the course. If the exact syllabus page has minimal detail, use search grounding to locate the public syllabus outline for that exact course title/code. Be faithful to the actual course topics.`,
            config: {
              tools: [{ urlContext: {} }, { googleSearch: {} }],
              systemInstruction:
                'You are an academic curriculum researcher. Extract accurate, structured syllabus topics and objectives from course web pages without inventing unrelated modules. If the URL cannot be accessed due to a paywall or login gate, state clearly that the page could not be retrieved.',
            },
          })
        );

        const rawExtracted = (researchResponse.text || '').trim();
        if (!rawExtracted || rawExtracted.length < 40) {
          res.status(422).json({
            error:
              'Could not extract enough syllabus details from that link (it may require campus login). Try pasting the syllabus text directly or starting from a template.',
          });
          return;
        }

        const chunks =
          researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = chunks
          .map((c) => {
            const web = c.web;
            if (web?.uri) {
              return { title: web.title || web.uri, uri: web.uri };
            }
            return null;
          })
          .filter((item): item is { title: string; uri: string } => item !== null)
          .slice(0, 6);

        // Step 2: Normalize into clean structured Course JSON
        const structuredResponse = await withRetry(() =>
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Convert the following extracted course syllabus information into a clean, well-ordered academic syllabus structure (4 to 10 modules):\n\n${rawExtracted}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: syllabusResponseSchema,
              systemInstruction:
                'Normalize the extracted syllabus into clean modules. Keep titles crisp, summaries concise, and provide 2-4 concrete learning objectives per module.',
            },
          })
        );

        const parsed = JSON.parse((structuredResponse.text || '{}').trim());
        res.json({ course: parsed, sources });
        return;
      }

      // Raw text / topic outline import
      const cleanText = (text || '').trim();
      if (cleanText.length < 15) {
        res.status(400).json({
          error: 'Please enter at least a brief syllabus outline or list of topics.',
        });
        return;
      }

      const structuredResponse = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Organize the following syllabus text or course topic list into a structured multi-week academic syllabus (4 to 10 modules):\n\n${cleanText}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: syllabusResponseSchema,
            systemInstruction:
              'You are a university curriculum designer. Turn the provided syllabus text or topic outline into a structured course with clean weekly/module boundaries, crisp titles, 1-2 sentence summaries, and 2-4 measurable learning objectives per module.',
          },
        })
      );

      const parsed = JSON.parse((structuredResponse.text || '{}').trim());
      res.json({ course: parsed, sources: [] });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/lectures/generate', async (req: Request, res: Response) => {
    try {
      const {
        courseTitle,
        courseCode,
        discipline,
        academicLevel,
        module,
        allModuleTitles,
      } = req.body as {
        courseTitle?: string;
        courseCode?: string;
        discipline?: string;
        academicLevel?: string;
        module?: {
          weekLabel: string;
          title: string;
          summary: string;
          objectives: string[];
        };
        allModuleTitles?: string[];
      };

      if (!courseTitle || !module?.title) {
        res.status(400).json({ error: 'Course title and module details are required.' });
        return;
      }

      const ai = createAiClient();
      const syllabusContext = Array.isArray(allModuleTitles)
        ? allModuleTitles.map((t, idx) => `${idx + 1}. ${t}`).join('\n')
        : '';

      const prompt = `Write a comprehensive, university-press textbook chapter for the following lecture module.

Course: ${courseCode ? `${courseCode} — ` : ''}${courseTitle}
Discipline: ${discipline || 'General Academic'}
Level: ${academicLevel || 'Intermediate Undergraduate'}

Current Module: ${module.weekLabel} — ${module.title}
Module Summary: ${module.summary}
Learning Objectives:
${(module.objectives || []).map((o) => `- ${o}`).join('\n')}

Full Course Context (for continuity):
${syllabusContext}

Requirements:
1. Write at textbook depth: 4 to 5 substantial narrative sections with rigorous explanations, clear intuition, formal notation (LaTeX $...$ / $$...$$ where applicable), concrete comparisons, or annotated code/derivations when fitting the discipline.
2. Provide 5 to 7 crisp glossary definitions with context notes.
3. Include 2 to 3 complete worked examples or case analyses with numbered step-by-step reasoning.
4. Build a structured concept diagram (6 to 8 nodes using short IDs like "n1".."n8" and 6 to 10 directed edges referencing those exact IDs) plus a chronological/procedural timeline (4 to 6 milestones).
5. Create 4 to 5 conceptual multiple-choice quiz questions (4 options each, 0-based correctIndex, detailed explanation), 6 to 8 active-recall flashcards, a high-yield cheat sheet, and 3 to 4 authoritative further reading references.`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: lectureChapterSchema,
            systemInstruction:
              'You are an eminent textbook author and university lecturer. Write authoritative, crystal-clear, pedagogically structured lecture chapters with deep analytical prose, accurate technical examples, and cohesive study aids. Never include placeholder text or vague filler.',
          },
        })
      );

      const rawJson = (response.text || '{}').trim();
      const chapterData = JSON.parse(rawJson);

      res.json({
        chapter: {
          ...chapterData,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Folio server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Folio server:', err);
  process.exit(1);
});
