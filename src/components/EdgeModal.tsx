import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import { EDGE_KIND_LABELS, getAllowedEdgeKinds } from '../edgeRules';
import { useStore } from '../store';
import type { CustomEdgeData, Priority } from '../types';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-2 block text-xs uppercase tracking-wide text-zinc-400">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-zinc-500 ${props.className ?? ''}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-zinc-500 ${props.className ?? ''}`} />;
}

export default function EdgeModal() {
  const { selectedEdgeId, edges, nodes, updateEdge, eliminarEdge, setSelectedEdge } = useStore();
  const edge = edges.find((item) => item.id === selectedEdgeId);
  const sourceNode = nodes.find((node) => node.id === edge?.source);
  const targetNode = nodes.find((node) => node.id === edge?.target);
  const allowedKinds = useMemo(() => getAllowedEdgeKinds(sourceNode?.type, targetNode?.type), [sourceNode?.type, targetNode?.type]);
  const [formData, setFormData] = useState<Partial<CustomEdgeData>>(edge?.data ?? {});

  useEffect(() => {
    setFormData(edge?.data ?? {});
  }, [edge]);

  if (!edge || !formData) return null;

  return (
    <ModalShell isOpen onClose={() => setSelectedEdge(null)} zIndexClassName="z-[110]" panelClassName="max-w-xl border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Conexion</div>
            <h2 className="text-xl font-semibold text-zinc-100">{sourceNode?.data.label ?? sourceNode?.type ?? 'Origen'} {'->'} {targetNode?.data.label ?? targetNode?.type ?? 'Destino'}</h2>
          </div>
          <button onClick={() => setSelectedEdge(null)} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
            Opciones disponibles para una conexion {sourceNode?.type ?? 'origen'} {'->'} {targetNode?.type ?? 'destino'}.
            {typeof edge.data?.sourceAnswerText === 'string' && edge.data.sourceAnswerText.trim()
              ? ` Esta conexion sale de la respuesta: "${edge.data.sourceAnswerText}".`
              : ''}
          </div>

          <div>
            <FieldLabel>Tipo de conexion</FieldLabel>
            <Select
              value={typeof formData.tipo === 'string' ? formData.tipo : allowedKinds[0]}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as CustomEdgeData['tipo'] })}
            >
              {allowedKinds.map((kind) => (
                <option key={kind} value={kind}>{EDGE_KIND_LABELS[kind]}</option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel>Etiqueta personalizada</FieldLabel>
            <Input
              placeholder={EDGE_KIND_LABELS[(typeof formData.tipo === 'string' ? formData.tipo : allowedKinds[0]) as keyof typeof EDGE_KIND_LABELS]}
              value={typeof formData.customLabel === 'string' ? formData.customLabel : ''}
              onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
            />
            <p className="mt-2 text-xs text-zinc-500">Si lo dejas vacio, se usara la etiqueta automatica. En conexiones que salen de una respuesta se mostrara primero el tipo de conexion y debajo la respuesta.</p>
          </div>

          <div>
            <FieldLabel>Prioridad</FieldLabel>
            <Select
              value={typeof formData.priority === 'string' ? formData.priority : 'media'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </Select>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-800 bg-zinc-900 px-6 py-5">
          <button
            onClick={() => {
              const confirmed = window.confirm('Se eliminara esta conexion del flujo. Esta accion no se puede deshacer.');
              if (!confirmed) return;
              eliminarEdge(edge.id);
              setSelectedEdge(null);
            }}
            className="mr-auto rounded-2xl bg-red-950 px-5 py-3 text-red-300 transition hover:bg-red-900/70 hover:text-red-200"
          >
            Eliminar conexion
          </button>
          <button onClick={() => setSelectedEdge(null)} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Cancelar</button>
          <button
            onClick={() => {
              updateEdge(edge.id, {
                ...formData,
                tipo: (typeof formData.tipo === 'string' ? formData.tipo : allowedKinds[0]) as CustomEdgeData['tipo'],
              });
              setSelectedEdge(null);
            }}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            Guardar conexion
          </button>
        </div>
    </ModalShell>
  );
}
