import { Background, Controls, MiniMap, ReactFlow, type NodeTypes, Handle, Position, type Viewport } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';
import { getDocumentLabel } from '../documentUtils';
import { useStore } from '../store';
import type { CustomEdge, CustomNode, Documento, Testigo } from '../types';

function toneForWitness(testigos: Testigo[], witnessId?: string) {
  return testigos.find((item) => item.id === witnessId)?.color ?? '#22c55e';
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] uppercase tracking-wide text-white/75">{children}</span>;
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

const createNodeTypes = (testigos: Testigo[], documentos: Documento[]): NodeTypes => ({
  pregunta: ({ data }) => {
    const accent = toneForWitness(testigos, data.witnessId);
    return (
      <NodeShell title={data.label || data.texto || 'Pregunta'} subtitle="Pregunta" accent={accent}>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.questionStyle ? <Badge>{data.questionStyle}</Badge> : null}
          {data.priority ? <Badge>{data.priority}</Badge> : null}
          {data.riskLevel ? <Badge>riesgo {data.riskLevel}</Badge> : null}
        </div>
        {data.texto ? <p className="mt-3 text-sm text-zinc-200">{data.texto}</p> : null}
      </NodeShell>
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
  hecho: ({ data }) => (
    <NodeShell title={data.label || 'Hecho'} subtitle="Hecho a probar" accent="#3b82f6">
      {data.coberturaNode ? <div className="mt-3"><Badge>{data.coberturaNode}</Badge></div> : null}
    </NodeShell>
  ),
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
  const { nodes, edges, applyNodesChanges, applyEdgesChanges, onConnect, setSelectedNode, setSelectedEdge, testigos, documentos, setViewportCenter } = useStore();
  const nodeTypes = useMemo(() => createNodeTypes(testigos, documentos), [testigos, documentos]);

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