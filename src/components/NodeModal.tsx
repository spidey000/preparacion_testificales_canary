import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { Cobertura, Priority, QuestionStyle, RiskLevel } from '../types';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-2 block text-xs uppercase tracking-wide text-zinc-400">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-zinc-500 ${props.className ?? ''}`} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-zinc-500 ${props.className ?? ''}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-zinc-500 ${props.className ?? ''}`} />;
}

export default function NodeModal() {
  const { selectedNodeId, nodes, updateNode, eliminarNodo, setSelectedNode, testigos, hechos } = useStore();
  const node = nodes.find((item) => item.id === selectedNodeId);
  const [formData, setFormData] = useState(node?.data);

  useEffect(() => {
    setFormData(node?.data);
  }, [node]);

  if (!node || !formData) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Editor de nodo</div>
            <h2 className="text-xl font-semibold text-zinc-100">{node.data.type}</h2>
          </div>
          <button onClick={() => setSelectedNode(null)} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid max-h-[calc(85vh-88px)] gap-6 overflow-auto p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel>Etiqueta</FieldLabel>
            <Input value={formData.label ?? ''} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
          </div>

          <div>
            <FieldLabel>Testigo</FieldLabel>
            <Select value={formData.witnessId ?? ''} onChange={(e) => setFormData({ ...formData, witnessId: e.target.value || undefined })}>
              <option value="">Sin vincular</option>
              {testigos.map((testigo) => (
                <option key={testigo.id} value={testigo.id}>{testigo.nombre}</option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel>Hecho</FieldLabel>
            <Select value={formData.factId ?? ''} onChange={(e) => setFormData({ ...formData, factId: e.target.value || undefined })}>
              <option value="">Sin vincular</option>
              {hechos.map((hecho) => (
                <option key={hecho.id} value={hecho.id}>{hecho.titulo}</option>
              ))}
            </Select>
          </div>

          {node.data.type === 'pregunta' ? (
            <>
              <div className="md:col-span-2">
                <FieldLabel>Texto de la pregunta</FieldLabel>
                <Textarea rows={4} value={formData.texto ?? ''} onChange={(e) => setFormData({ ...formData, texto: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Finalidad</FieldLabel>
                <Input value={formData.finalidad ?? ''} onChange={(e) => setFormData({ ...formData, finalidad: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Repregunta sugerida</FieldLabel>
                <Input value={formData.followUpStrategy ?? ''} onChange={(e) => setFormData({ ...formData, followUpStrategy: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Estilo</FieldLabel>
                <Select value={formData.questionStyle ?? 'abierta'} onChange={(e) => setFormData({ ...formData, questionStyle: e.target.value as QuestionStyle })}>
                  <option value="abierta">Abierta</option>
                  <option value="cerrada">Cerrada</option>
                  <option value="fijacion">Fijacion</option>
                  <option value="impugnacion">Impugnacion</option>
                  <option value="cierre">Cierre</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Prioridad</FieldLabel>
                <Select value={formData.priority ?? 'media'} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Riesgo</FieldLabel>
                <Select value={formData.riskLevel ?? 'medio'} onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as RiskLevel })}>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Respuesta esperada</FieldLabel>
                <Textarea rows={3} value={formData.expectedAnswer ?? ''} onChange={(e) => setFormData({ ...formData, expectedAnswer: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Respuesta peligrosa</FieldLabel>
                <Textarea rows={3} value={formData.dangerousAnswer ?? ''} onChange={(e) => setFormData({ ...formData, dangerousAnswer: e.target.value })} />
              </div>
            </>
          ) : null}

          {node.data.type === 'riesgo' ? (
            <>
              <div>
                <FieldLabel>Severidad</FieldLabel>
                <Select value={formData.severity ?? 'medio'} onChange={(e) => setFormData({ ...formData, severity: e.target.value as RiskLevel })}>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Mitigacion</FieldLabel>
                <Textarea rows={4} value={formData.mitigation ?? ''} onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })} />
              </div>
            </>
          ) : null}

          {node.data.type === 'documento' ? (
            <>
              <div>
                <FieldLabel>Fuente</FieldLabel>
                <Input value={formData.source ?? ''} onChange={(e) => setFormData({ ...formData, source: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Descripcion</FieldLabel>
                <Textarea rows={4} value={formData.description ?? ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </>
          ) : null}

          {node.data.type === 'hecho' ? (
            <div>
              <FieldLabel>Cobertura</FieldLabel>
              <Select value={formData.coberturaNode ?? 'debil'} onChange={(e) => setFormData({ ...formData, coberturaNode: e.target.value as Cobertura })}>
                <option value="no-cubierto">No cubierto</option>
                <option value="debil">Debil</option>
                <option value="cubierto">Cubierto</option>
                <option value="muy-cubierto">Muy cubierto</option>
              </Select>
            </div>
          ) : null}

          <div className="md:col-span-2">
            <FieldLabel>Notas</FieldLabel>
            <Textarea rows={4} value={formData.notes ?? ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-5">
          <button
            onClick={() => {
              const confirmed = window.confirm('Se eliminara el nodo y todas sus conexiones asociadas. Esta accion no se puede deshacer.');
              if (!confirmed) return;
              eliminarNodo(node.id);
              setSelectedNode(null);
            }}
            className="mr-auto rounded-2xl bg-red-950 px-5 py-3 text-red-300 transition hover:bg-red-900/70 hover:text-red-200"
          >
            Eliminar nodo
          </button>
          <button onClick={() => setSelectedNode(null)} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Cancelar</button>
          <button
            onClick={() => {
              updateNode(node.id, formData);
              setSelectedNode(null);
            }}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
