import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import { getDocumentLabel, sortDocumentsByName } from '../documentUtils';
import { useStore } from '../store';
import type { Cobertura, Priority, QuestionStyle, RiskLevel } from '../types';

const PART_LABELS: Record<string, string> = {
  actora: 'Actora',
  demandada: 'Demandada',
  ambas: 'Ambas',
  tercero: 'Tercero',
};

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

function sanitizeAnswers(answers: Array<{ id: string; texto: string }> | undefined) {
  return (answers ?? []).filter((answer) => answer.texto.trim().length > 0);
}

export default function NodeModal() {
  const { selectedNodeId, nodes, updateNode, eliminarNodo, setSelectedNode, testigos, hechos, documentos, setDeleteConfirm } = useStore();
  const node = nodes.find((item) => item.id === selectedNodeId);
  const [formData, setFormData] = useState(node?.data);
  const documentosOrdenados = sortDocumentsByName(documentos);

  useEffect(() => {
    setFormData(node?.data);
  }, [node]);

  if (!node || !formData) return null;

  return (
    <ModalShell isOpen onClose={() => setSelectedNode(null)} zIndexClassName="z-[100]" panelClassName="max-w-3xl border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Editor de nodo</div>
            <h2 className="text-xl font-semibold text-zinc-100">{node.data.type}</h2>
          </div>
          <button onClick={() => setSelectedNode(null)} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
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
                <FieldLabel>Tema</FieldLabel>
                <Input value={formData.topicLabel ?? ''} onChange={(e) => setFormData({ ...formData, topicLabel: e.target.value })} />
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
              <div className="md:col-span-2">
                <FieldLabel>Respuestas y salidas</FieldLabel>
                <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
                  {(formData.answers ?? []).map((answer, index) => (
                    <div key={answer.id} className="flex items-center gap-2">
                      <Input
                        value={answer.texto}
                        onChange={(e) => setFormData({
                          ...formData,
                          answers: (formData.answers ?? []).map((item) => (item.id === answer.id ? { ...item, texto: e.target.value } : item)),
                        })}
                        placeholder={`Respuesta ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          answers: (formData.answers ?? []).filter((item) => item.id !== answer.id),
                        })}
                        className="rounded-2xl border border-zinc-700 px-3 py-3 text-zinc-300 transition hover:bg-zinc-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      answers: [...(formData.answers ?? []), { id: crypto.randomUUID(), texto: '' }],
                    })}
                    className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800"
                  >
                    + Anadir respuesta
                  </button>
                </div>
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
                <FieldLabel>Documento de referencia</FieldLabel>
                <Select
                  value={formData.documentId ?? ''}
                  onChange={(e) => {
                    const documentId = e.target.value || undefined;
                    const documento = documentos.find((item) => item.id === documentId);

                    if (!documento) {
                      setFormData({
                        ...formData,
                        documentId: undefined,
                      });
                      return;
                    }

                    setFormData({
                      ...formData,
                      documentId: documento.id,
                      label: getDocumentLabel(documento),
                      description: documento.descripcion ?? '',
                      source: documento.referencia ?? '',
                      notes: documento.notas ?? '',
                      documentPart: documento.parte,
                      documentType: documento.tipo ?? '',
                      documentDate: documento.fecha ?? '',
                      documentReference: documento.referencia ?? '',
                    });
                  }}
                >
                  <option value="">Sin vincular</option>
                  {documentosOrdenados.map((documento) => (
                    <option key={documento.id} value={documento.id}>{getDocumentLabel(documento)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Referencia</FieldLabel>
                <Input value={formData.source ?? ''} onChange={(e) => setFormData({ ...formData, source: e.target.value, documentReference: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Parte</FieldLabel>
                <Input value={formData.documentPart ? PART_LABELS[formData.documentPart] ?? formData.documentPart : ''} readOnly />
              </div>
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <Input value={formData.documentType ?? ''} onChange={(e) => setFormData({ ...formData, documentType: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Fecha</FieldLabel>
                <Input value={formData.documentDate ?? ''} onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })} />
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

        <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-800 bg-zinc-900 px-6 py-5">
          <button
            onClick={() => {
              if (window.confirm('Se eliminara el nodo y todas sus conexiones asociadas. Esta accion no se puede deshacer.')) {
                eliminarNodo(node.id);
                setSelectedNode(null);
              }
            }}
            className="mr-auto rounded-2xl bg-red-950 px-5 py-3 text-red-300 transition hover:bg-red-900/70 hover:text-red-200"
          >
            Eliminar nodo
          </button>
          <button onClick={() => setSelectedNode(null)} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Cancelar</button>
          <button
            onClick={() => {
              updateNode(node.id, {
                ...formData,
                answers: sanitizeAnswers(formData.answers as Array<{ id: string; texto: string }> | undefined),
              });
              setSelectedNode(null);
            }}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            Guardar cambios
          </button>
        </div>
    </ModalShell>
  );
}
