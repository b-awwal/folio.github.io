import React, { useMemo, useState } from 'react';
import { ConceptDiagram, ConceptNode, TimelineData } from '../types/course';
import { ArrowRight, GitBranch, Clock } from 'lucide-react';

interface VisualMapViewProps {
  diagram: ConceptDiagram;
  timeline: TimelineData;
  chapterNumber: number;
}

const CATEGORY_STYLES: Record<
  ConceptNode['category'],
  { border: string; bg: string; text: string }
> = {
  'Core Principle': {
    border: '#1E3A8A',
    bg: '#EFF6FF',
    text: '#1E3A8A',
  },
  Mechanism: {
    border: '#0284C7',
    bg: '#F0F9FF',
    text: '#0369A1',
  },
  Application: {
    border: '#059669',
    bg: '#ECFDF5',
    text: '#047857',
  },
  Evidence: {
    border: '#475569',
    bg: '#F8FAFC',
    text: '#334155',
  },
};

export const VisualMapView: React.FC<VisualMapViewProps> = ({
  diagram,
  timeline,
  chapterNumber,
}) => {
  const nodes = useMemo(() => (diagram?.nodes || []).slice(0, 8), [diagram]);
  const edges = useMemo(() => diagram?.edges || [], [diagram]);
  const events = useMemo(() => timeline?.events || [], [timeline]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    nodes[0]?.id || null
  );
  const [selectedEventIdx, setSelectedEventIdx] = useState<number>(0);

  const layout = useMemo(() => {
    const svgW = 880;
    const cols = Math.min(3, Math.max(2, Math.ceil(nodes.length / 3)));
    const rows = Math.max(1, Math.ceil(nodes.length / cols));
    const svgH = Math.max(360, rows * 165 + 40);

    const cellW = (svgW - 80) / cols;
    const cellH = (svgH - 40) / rows;
    const posMap = new Map<string, { x: number; y: number }>();

    nodes.forEach((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const staggerX = row % 2 === 1 && cols > 2 ? 18 : 0;
      posMap.set(n.id, {
        x: 40 + col * cellW + cellW / 2 + staggerX,
        y: 20 + row * cellH + cellH / 2,
      });
    });

    return { svgW, svgH, posMap };
  }, [nodes]);

  const activeNode =
    nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;

  const connectedRelations = useMemo(() => {
    if (!activeNode) return [];
    return edges
      .filter((e) => e.from === activeNode.id || e.to === activeNode.id)
      .map((e) => {
        const isOutgoing = e.from === activeNode.id;
        const otherId = isOutgoing ? e.to : e.from;
        const other = nodes.find((n) => n.id === otherId);
        return {
          direction: isOutgoing ? 'outgoing' : 'incoming',
          relation: e.relation,
          otherLabel: other?.label || otherId,
          otherId,
        };
      });
  }, [activeNode, edges, nodes]);

  return (
    <div className="space-y-10">
      {/* Interactive Concept Diagram */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <GitBranch className="w-3.5 h-3.5 text-[#1E3A8A]" aria-hidden="true" />
              <span>Fig. {chapterNumber}.1 · Interactive Concept Map</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-slate-900">
              {diagram?.title || 'Conceptual Architecture'}
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Select any node to inspect its definition and links
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#FAF9F6] border border-slate-200 rounded-lg overflow-hidden">
            <svg
              viewBox={`0 0 ${layout.svgW} ${layout.svgH}`}
              className="w-full h-auto block"
              role="img"
              aria-label={diagram?.title || 'Concept Diagram'}
            >
              <defs>
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
                </marker>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#1E3A8A" />
                </marker>
              </defs>

              {/* Edges */}
              {edges.map((edge, idx) => {
                const from = layout.posMap.get(edge.from);
                const to = layout.posMap.get(edge.to);
                if (!from || !to) return null;

                const isHighlighted =
                  activeNode &&
                  (edge.from === activeNode.id || edge.to === activeNode.id);

                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const dist = Math.hypot(dx, dy) || 1;
                const ux = dx / dist;
                const uy = dy / dist;

                const sx = from.x + ux * 68;
                const sy = from.y + uy * 30;
                const ex = to.x - ux * 74;
                const ey = to.y - uy * 34;

                const mx = (sx + ex) / 2;
                const my = (sy + ey) / 2;

                return (
                  <g key={`${edge.from}-${edge.to}-${idx}`}>
                    <line
                      x1={sx}
                      y1={sy}
                      x2={ex}
                      y2={ey}
                      stroke={isHighlighted ? '#1E3A8A' : '#CBD5E1'}
                      strokeWidth={isHighlighted ? 2.2 : 1.5}
                      markerEnd={
                        isHighlighted ? 'url(#arrow-active)' : 'url(#arrow-default)'
                      }
                    />
                    {edge.relation && (
                      <g transform={`translate(${mx}, ${my})`}>
                        <rect
                          x={-48}
                          y={-11}
                          width={96}
                          height={22}
                          rx={4}
                          fill="#FFFFFF"
                          stroke={isHighlighted ? '#BFDBFE' : '#E2E8F0'}
                          strokeWidth={1}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="11"
                          fontWeight={isHighlighted ? '600' : '500'}
                          fill={isHighlighted ? '#1E3A8A' : '#475569'}
                        >
                          {edge.relation.slice(0, 16)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const pos = layout.posMap.get(node.id);
                if (!pos) return null;
                const isSelected = activeNode?.id === node.id;
                const style =
                  CATEGORY_STYLES[node.category] ||
                  CATEGORY_STYLES['Core Principle'];

                const boxW = 190;
                const boxH = 68;
                const x = pos.x - boxW / 2;
                const y = pos.y - boxH / 2;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedNodeId(node.id);
                      }
                    }}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={boxW}
                      height={boxH}
                      rx={8}
                      fill={isSelected ? style.bg : '#FFFFFF'}
                      stroke={isSelected ? style.border : '#CBD5E1'}
                      strokeWidth={isSelected ? 2.5 : 1.25}
                    />
                    <text
                      x={pos.x}
                      y={y + 22}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="600"
                      fill={style.text}
                    >
                      {node.category}
                    </text>
                    <text
                      x={pos.x}
                      y={y + 45}
                      textAnchor="middle"
                      fontSize="13.5"
                      fontWeight="600"
                      fill="#0F172A"
                    >
                      {node.label.length > 22
                        ? `${node.label.slice(0, 20)}...`
                        : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Inspector Panel */}
          <div className="lg:col-span-4 bg-[#FAF9F6] border border-slate-200 rounded-lg p-5">
            {activeNode ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-[#1E3A8A] mb-1">
                    {activeNode.category}
                  </div>
                  <h4 className="font-display text-lg font-semibold text-slate-900">
                    {activeNode.label}
                  </h4>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  {activeNode.summary}
                </p>

                {connectedRelations.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      Connected Concepts
                    </div>
                    <ul className="space-y-2">
                      {connectedRelations.map((rel, idx) => (
                        <li key={`${rel.otherId}-${idx}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedNodeId(rel.otherId)}
                            className="w-full text-left text-xs px-3 py-2 rounded-md bg-white border border-slate-200 hover:border-[#1E3A8A] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="text-slate-600">
                              {rel.direction === 'outgoing' ? (
                                <>
                                  <span className="font-medium text-[#1E3A8A]">
                                    {rel.relation}
                                  </span>{' '}
                                  <span className="text-slate-900 font-medium">
                                    {rel.otherLabel}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-900 font-medium">
                                    {rel.otherLabel}
                                  </span>{' '}
                                  <span className="font-medium text-[#1E3A8A]">
                                    {rel.relation}
                                  </span>{' '}
                                  this
                                </>
                              )}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No concept nodes available for this chapter.
              </p>
            )}
          </div>
        </div>

        {diagram?.caption && (
          <p className="mt-4 text-xs font-serif italic text-slate-500">
            Fig. {chapterNumber}.1 — {diagram.caption}
          </p>
        )}
      </section>

      {/* Interactive Timeline */}
      {events.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" aria-hidden="true" />
              <span>Fig. {chapterNumber}.2 · Chronological & Process Timeline</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-slate-900">
              {timeline.title}
            </h3>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-2">
              {events.map((ev, idx) => {
                const isSelected = idx === selectedEventIdx;
                return (
                  <button
                    key={`${ev.dateLabel}-${idx}`}
                    type="button"
                    onClick={() => setSelectedEventIdx(idx)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors cursor-pointer flex items-baseline gap-3 ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-[#1E3A8A] text-slate-900'
                        : 'bg-[#FAF9F6] border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-mono text-xs font-medium text-[#1E3A8A] tabular-nums shrink-0 w-20">
                      {ev.dateLabel}
                    </span>
                    <span className="text-sm font-medium leading-snug">
                      {ev.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 bg-[#FAF9F6] border border-slate-200 rounded-lg p-6 flex flex-col justify-center">
              {events[selectedEventIdx] && (
                <div>
                  <div className="font-mono text-xs font-medium text-[#1E3A8A] tabular-nums mb-2">
                    {events[selectedEventIdx].dateLabel} · Milestone{' '}
                    {selectedEventIdx + 1} of {events.length}
                  </div>
                  <h4 className="font-display text-xl font-semibold text-slate-900 mb-3">
                    {events[selectedEventIdx].title}
                  </h4>
                  <p className="font-serif text-base leading-relaxed text-slate-700">
                    {events[selectedEventIdx].significance}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
