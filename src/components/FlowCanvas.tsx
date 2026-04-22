import { Background, Controls, MiniMap, ReactFlow, type EdgeTypes, type NodeTypes, Handle, Position, type Viewport, useUpdateNodeInternals } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo, useState } from 'react';
import { getReadableTextColor } from '../colorUtils';
import { getDocumentLabel } from '../documentUtils';
import { getFactCoverageByQuestionNodes } from '../factCoverage';
import LabeledEdge from './LabeledEdge';
import { useStore } from '../store';
import type { CustomEdge, CustomNode, Documento, Hecho, PreguntaRespuesta, Testigo } from '../types';

function toneForWitness(testigos: Testigo[], witnessId?: string) {
  return testigos.find((item) => item.id === witnessId)?.color ?? '#22c55e';
}

function toneForFact(hechos: Hecho[], factId?: string) {
  return hechos.find((item) => item.id === factId)?.color ?? '#3b82f6';
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] uppercase tracking-wide text-white/75">{children}</span>;
}

function ColorBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2 py-1 text-[10px] font-medium leading-none"
      style={{ backgroundColor: color, color: getReadableTextColor(color) }}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function NodeShell({ title, subtitle, accent, children }: { title: string; subtitle: string; accent: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-[260px] rounded-3xl border p-4 text-zinc-100 shadow-2xl backdrop-blur" style={{ borderColor: `${accent}99`, background: `linear-gradient(180deg, ${accent}22, rgba(24,24,27,0.96))` }}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-0 !bg-white" />
      <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-zinc-300">{subtitle}</div>
      <div className="text-base font-semibold leading-tight">{title}</div>
      {children}
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-0 !bg-white" />
    </div>
  );
}

const createNodeTypes = (testigos: Testigo[], hechos: Hecho[], documentos: Documento[], nodes: CustomNode[], edges: CustomEdge[]): NodeTypes => ({
  pregunta: ({ id, data }) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const [hoveredAnswerId, setHoveredAnswerId] = useState<string | null>(null);
    const accent = toneForWitness(testigos, data.witnessId);
    const witnessLabel = testigos.find((item) => item.id === data.witnessId)?.nombre;
    const factLabel = hechos.find((item) => item.id === data.factId)?.titulo;
    const factColor = toneForFact(hechos, data.factId);
    const answers = (data.answers ?? []) as PreguntaRespuesta[];

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals, answers.map((answer) => answer.id).join('|')]);

    return (
      <div className="relative w-[240px] rounded-[28px] border px-4 py-4 text-zinc-100 shadow-2xl backdrop-blur" style={{ borderColor: accent, background: `linear-gradient(180deg, ${accent}18, rgba(24,24,27,0.96))` }}>
        <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-0 !bg-white" />
        <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-zinc-300">Pregunta</div>
        <div className="text-sm font-semibold leading-5 text-zinc-50 whitespace-pre-wrap break-words">{data.texto || data.label || 'Pregunta'}</div>
        <div className="mt-3 space-y-1 text-[11px] text-zinc-300">
          <div className="rounded-xl bg-black/20 px-2 py-1">
            {witnessLabel ? <ColorBadge color={accent}>{witnessLabel}</ColorBadge> : <span>Testigo: no asociado</span>}
          </div>
          <div className="rounded-xl bg-black/20 px-2 py-1">
            {factLabel ? <ColorBadge color={factColor}>{factLabel}</ColorBadge> : <span>Hecho: no asociado</span>}
          </div>
          {data.topicLabel ? <div className="rounded-xl bg-black/20 px-2 py-1">Tema: {data.topicLabel}</div> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.questionStyle ? <Badge>{data.questionStyle}</Badge> : null}
          {data.priority ? <Badge>{data.priority}</Badge> : null}
        </div>
        {answers.map((answer: PreguntaRespuesta, index: number) => {
          const top = `${Math.round(((index + 1) / (answers.length + 1)) * 100)}%`;
          const isConnected = edges.some((edge) => edge.source === id && edge.data?.sourceAnswerId === answer.id);
          const showTooltip = !isConnected && hoveredAnswerId === answer.id && answer.texto.trim().length > 0;

          return (
            <div key={answer.id} className="absolute right-[-10px] z-10 h-6 w-6 -translate-y-1/2" style={{ top }}>
              {showTooltip ? (
                <div className="pointer-events-none absolute right-5 top-1/2 z-20 max-w-[18ch] -translate-y-1/2 rounded-lg border border-yellow-400/50 bg-zinc-950/95 px-2 py-1 text-[11px] font-medium leading-4 text-yellow-100 shadow-xl">
                  {answer.texto}
                </div>
              ) : null}
              <Handle
                id={`answer:${answer.id}`}
                type="source"
                position={Position.Right}
                style={{ top: '50%' }}
                className="!h-3 !w-3 !border-0 !bg-yellow-300"
                onMouseEnter={() => {
                  if (!isConnected) setHoveredAnswerId(answer.id);
                }}
                onMouseLeave={() => {
                  if (hoveredAnswerId === answer.id) setHoveredAnswerId(null);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  },
  riesgo: ({ data }) => (
    <NodeShell title={data.label || 'Riesgo'} subtitle="Riesgo / Objecion" accent="#ef4444">
      <div className="mt-3 flex gap-2">{data.severity ? <Badge>{data.severity}</Badge> : null}</div>
      {data.mitigation ? <p className="mt-3 text-sm text-zinc-200">{data.mitigation}</p> : null}
    </NodeShell>
  ),
  documento: ({ data }) => {
    const documento = documentos.find((item) => item.id === data.documentId);
    const title = documento ? getDocumentLabel(documento) : data.label || 'Documento';
    const description = documento?.descripcion ?? data.description;
    const reference = documento?.referencia ?? data.source;
    const docType = documento?.tipo ?? data.documentType;
    const docDate = documento?.fecha ?? data.documentDate;
    const docPart = documento?.parte ?? data.documentPart;

    return (
      <NodeShell title={title} subtitle="Documento" accent="#f59e0b">
        <div className="mt-3 flex flex-wrap gap-2">
          {docType ? <Badge>{docType}</Badge> : null}
          {docPart ? <Badge>{docPart}</Badge> : null}
          {docDate ? <Badge>{docDate}</Badge> : null}
        </div>
        {description ? <p className="mt-3 text-sm text-zinc-200">{description}</p> : null}
        {reference ? <div className="mt-3"><Badge>{reference}</Badge></div> : null}
      </NodeShell>
    );
  },
  hecho: ({ data }) => {
    const accent = toneForFact(hechos, data.factId);
    const factLabel = (hechos.find((item) => item.id === data.factId)?.titulo ?? data.label) || 'Hecho';
    const questionNodeCount = data.factId ? nodes.filter((node) => node.type === 'pregunta' && node.data.factId === data.factId).length : 0;
    const coverage = getFactCoverageByQuestionNodes(questionNodeCount);
    return (
      <NodeShell title="Hecho" subtitle="Hecho a probar" accent={accent}>
        <div className="mt-3">
          <span
            className="inline-flex max-w-full rounded-2xl px-3 py-2 text-sm font-semibold leading-tight"
            style={{ backgroundColor: accent, color: getReadableTextColor(accent) }}
          >
            <span className="truncate">{factLabel}</span>
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{coverage}</Badge>
          <Badge>{questionNodeCount} pregunta{questionNodeCount === 1 ? '' : 's'}</Badge>
        </div>
      </NodeShell>
    );
  },
  tema: ({ data }) => (
    <NodeShell title={data.label || 'Tema'} subtitle="Tema" accent="#8b5cf6">
      {data.notes ? <p className="mt-3 text-sm text-zinc-200">{data.notes}</p> : null}
    </NodeShell>
  ),
  cierre: ({ data }) => (
    <NodeShell title={data.label || 'Cierre'} subtitle="Cierre" accent="#14b8a6">
      {data.notes ? <p className="mt-3 text-sm text-zinc-200">{data.notes}</p> : null}
    </NodeShell>
  ),
});

export default function FlowCanvas() {
  const { nodes, edges, applyNodesChanges, applyEdgesChanges, onConnect, setSelectedNode, setSelectedEdge, testigos, hechos, documentos, setViewportCenter } = useStore();
  const nodeTypes = useMemo(() => createNodeTypes(testigos, hechos, documentos, nodes, edges), [testigos, hechos, documentos, nodes, edges]);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ labeled: LabeledEdge }), []);

  const handleMoveEnd = useMemo(() => {
    return (_: unknown, viewport: Viewport) => {
      const width = window.innerWidth - 300;
      const height = window.innerHeight;
      const centerX = (-viewport.x + width / 2) / viewport.zoom;
      const centerY = (-viewport.y + height / 2) / viewport.zoom;
      setViewportCenter({ x: centerX, y: centerY });
    };
  }, [setViewportCenter]);

  return (
    <div className="h-full w-full">
      <ReactFlow<CustomNode, CustomEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={applyNodesChanges}
        onEdgesChange={applyEdgesChanges}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onNodeDoubleClick={(_, node) => setSelectedNode(node.id)}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
        onEdgeDoubleClick={(_, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        deleteKeyCode={null}
        fitView
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        className="bg-zinc-950"
        onMoveEnd={handleMoveEnd}
      >
        <Background color="#27272a" gap={20} />
        <MiniMap className="!bg-zinc-900" nodeColor="#71717a" pannable zoomable />
        <Controls className="!border-zinc-800 !bg-zinc-900 !text-zinc-100" />
      </ReactFlow>
    </div>
  );
}
