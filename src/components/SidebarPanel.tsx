import { AlertTriangle, ChevronDown, ChevronRight, FileQuestion, FileText, Plus, Target, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getDocumentLabel, sortDocumentsByName } from '../documentUtils';
import { useStore } from '../store';
import type { Documento, Hecho, ParteDocumento, Testigo } from '../types';

const PARTES: Array<{ value: ParteDocumento; label: string }> = [
  { value: 'actora', label: 'Actora' },
  { value: 'demandada', label: 'Demandada' },
  { value: 'ambas', label: 'Ambas' },
  { value: 'tercero', label: 'Tercero' },
];

const ROLES: Array<{ value: 'proponente' | 'contrario'; label: string }> = [
  { value: 'proponente', label: 'Proponente' },
  { value: 'contrario', label: 'Contrario' },
];

const PARTES_TESTIGO: Array<{ value: 'actora' | 'demandada' | 'tercero'; label: string }> = [
  { value: 'actora', label: 'Actora' },
  { value: 'demandada', label: 'Demandada' },
  { value: 'tercero', label: 'Tercero' },
];

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">{children}</label>;
}

function DocumentInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 ${props.className ?? ''}`} />;
}

function DocumentTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 ${props.className ?? ''}`} />;
}

function DocumentSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 ${props.className ?? ''}`} />;
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof FileText;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-zinc-800/50">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-1 py-3 text-left hover:bg-zinc-800/30">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-zinc-500" />
          <span className="font-medium text-zinc-200">{title}</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{count}</span>
        </div>
        {isOpen ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </section>
  );
}

function TestigoCard({
  testigo,
  nodesCount,
  onDelete,
}: {
  testigo: Testigo;
  nodesCount: number;
  onDelete: (id: string, nombre: string) => void;
}) {
  const { updateTestigo } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="group relative rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center gap-2 text-left"
        >
          <div className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: testigo.color }} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-zinc-100">{testigo.nombre}</div>
            <div className="text-xs text-zinc-500">{testigo.rolProcesal} · {nodesCount} nodos</div>
          </div>
          <ChevronDown size={14} className={`text-zinc-600 transition ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-zinc-800/50 p-3">
          <button
            onClick={() => onDelete(testigo.id, testigo.nombre)}
            className="absolute right-2 top-2 rounded-full p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-red-400"
            aria-label="Eliminar testigo"
          >
            <X size={14} />
          </button>
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <DocumentInput
              value={testigo.nombre ?? ''}
              onChange={(e) => updateTestigo(testigo.id, { nombre: e.target.value })}
            />
          </div>

          <div>
            <FieldLabel>Cargo / Rol</FieldLabel>
            <DocumentInput
              value={testigo.cargo ?? ''}
              onChange={(e) => updateTestigo(testigo.id, { cargo: e.target.value })}
              placeholder="Directora financiera"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Parte que lo propone</FieldLabel>
              <DocumentSelect
                value={testigo.parteQuePropone ?? 'actora'}
                onChange={(e) => updateTestigo(testigo.id, { parteQuePropone: e.target.value as 'actora' | 'demandada' | 'tercero' })}
              >
                {PARTES_TESTIGO.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </DocumentSelect>
            </div>
            <div>
              <FieldLabel>Rol procesal</FieldLabel>
              <DocumentSelect
                value={testigo.rolProcesal ?? 'proponente'}
                onChange={(e) => updateTestigo(testigo.id, { rolProcesal: e.target.value as 'proponente' | 'contrario' })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </DocumentSelect>
            </div>
          </div>

          <div>
            <FieldLabel>Credibilidad estimada</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={testigo.credibilidadEstimada ?? ''}
              onChange={(e) => updateTestigo(testigo.id, { credibilidadEstimada: e.target.value })}
              placeholder="Alta si se mantiene en hechos propios"
            />
          </div>

          <div>
            <FieldLabel>Puntos fuertes</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={testigo.puntosFuertes ?? ''}
              onChange={(e) => updateTestigo(testigo.id, { puntosFuertes: e.target.value })}
              placeholder="Participacion directa y conocimiento de la reunion"
            />
          </div>

          <div>
            <FieldLabel>Puntos debiles</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={testigo.puntosDebiles ?? ''}
              onChange={(e) => updateTestigo(testigo.id, { puntosDebiles: e.target.value })}
              placeholder="Tiende a contestar con contexto innecesario"
            />
          </div>

          <div>
            <FieldLabel>Contradicciones conocidas</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={testigo.contradiccionesConocidas ?? ''}
              onChange={(e) => updateTestigo(testigo.id, { contradiccionesConocidas: e.target.value })}
              placeholder="Niega haber aprobado, pero valido el correo posterior"
            />
          </div>

          <div>
            <FieldLabel>Notas tacticas</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={testigo.notasTacticas ?? ''}
              onChange={(e) => updateTestigo(testigo.id, { notasTacticas: e.target.value })}
              placeholder="Entrar por hechos observados y solo despues por valoraciones"
            />
          </div>

          <div className="text-center text-xs text-zinc-500">
            {nodesCount} nodo{nodesCount !== 1 ? 's' : ''} asociado{nodesCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </article>
  );
}

function HechoCard({
  hecho,
  nodesCount,
  onDelete,
}: {
  hecho: Hecho;
  nodesCount: number;
  onDelete: (id: string, titulo: string) => void;
}) {
  const { updateHecho } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="group relative rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center gap-2 text-left"
        >
          <Target size={14} className="text-blue-400" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-zinc-100">{hecho.titulo}</div>
            <div className="text-xs text-zinc-500">{hecho.cobertura} · {nodesCount} nodos</div>
          </div>
          <ChevronDown size={14} className={`text-zinc-600 transition ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-zinc-800/50 p-3">
          <button
            onClick={() => onDelete(hecho.id, hecho.titulo)}
            className="absolute right-2 top-2 rounded-full p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-red-400"
            aria-label="Eliminar hecho"
          >
            <X size={14} />
          </button>
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <DocumentInput
              value={hecho.titulo ?? ''}
              onChange={(e) => updateHecho(hecho.id, { titulo: e.target.value })}
            />
          </div>

          <div>
            <FieldLabel>Descripcion</FieldLabel>
            <DocumentTextarea
              rows={3}
              value={hecho.descripcion ?? ''}
              onChange={(e) => updateHecho(hecho.id, { descripcion: e.target.value })}
              placeholder="Descripcion del hecho a probar"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Cobertura</FieldLabel>
              <DocumentSelect
                value={hecho.cobertura ?? 'debil'}
                onChange={(e) => updateHecho(hecho.id, { cobertura: e.target.value as 'no-cubierto' | 'debil' | 'cubierto' | 'muy-cubierto' })}
              >
                <option value="no-cubierto">No cubierto</option>
                <option value="debil">Debil</option>
                <option value="cubierto">Cubierto</option>
                <option value="muy-cubierto">Muy cubierto</option>
              </DocumentSelect>
            </div>
            <div>
              <FieldLabel>Prioridad</FieldLabel>
              <DocumentSelect
                value={hecho.priority ?? 'media'}
                onChange={(e) => updateHecho(hecho.id, { priority: e.target.value as 'baja' | 'media' | 'alta' })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </DocumentSelect>
            </div>
          </div>

          <div className="text-center text-xs text-zinc-500">
            {nodesCount} nodo{nodesCount !== 1 ? 's' : ''} asociado{nodesCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </article>
  );
}

function DocumentCard({
  documento,
  onDelete,
  deleteType,
  isCollapsed,
  setCollapsed,
}: {
  documento: Documento;
  onDelete: (type: string, id: string, label: string) => void;
  deleteType: 'testigo' | 'hecho' | 'documento';
  isCollapsed: boolean;
  setCollapsed: (c: boolean) => void;
}) {
  const { updateDocumento } = useStore();

  if (isCollapsed) {
    return (
      <article className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
        <button
          onClick={() => onDelete(deleteType, documento.id, getDocumentLabel(documento))}
          className="absolute right-2 top-2 rounded-full p-1.5 text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"
          aria-label="Eliminar documento"
        >
          <X size={14} />
        </button>
        <button onClick={() => setCollapsed(false)} className="flex w-full items-center gap-2 text-left">
          <FileText size={14} className="text-amber-400" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-zinc-100">{getDocumentLabel(documento)}</div>
            {documento.parte && <div className="text-xs text-zinc-500">{documento.parte}</div>}
          </div>
          <ChevronDown size={14} className="text-zinc-600" />
        </button>
      </article>
    );
  }

  return (
    <article className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <button
        onClick={() => setCollapsed(true)}
        className="absolute right-2 top-2 rounded-full p-1.5 text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100"
        aria-label="Colapsar"
      >
        <ChevronDown size={14} />
      </button>

      <div className="space-y-3">
        <div>
          <FieldLabel>Nombre</FieldLabel>
          <DocumentInput
            value={documento.nombre ?? ''}
            onChange={(e) => updateDocumento(documento.id, { nombre: e.target.value })}
            placeholder="Documento 1"
          />
        </div>

        <div>
          <FieldLabel>Descripcion</FieldLabel>
          <DocumentTextarea
            rows={2}
            value={documento.descripcion ?? ''}
            onChange={(e) => updateDocumento(documento.id, { descripcion: e.target.value })}
            placeholder="Resumen del documento"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Parte</FieldLabel>
            <DocumentSelect
              value={documento.parte ?? ''}
              onChange={(e) => updateDocumento(documento.id, { parte: (e.target.value || undefined) as ParteDocumento | undefined })}
            >
              <option value="">Sin indicar</option>
              {PARTES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </DocumentSelect>
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <DocumentInput
              value={documento.tipo ?? ''}
              onChange={(e) => updateDocumento(documento.id, { tipo: e.target.value })}
              placeholder="Contrato, email..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Fecha</FieldLabel>
            <DocumentInput
              value={documento.fecha ?? ''}
              onChange={(e) => updateDocumento(documento.id, { fecha: e.target.value })}
              placeholder="2026-04-21"
            />
          </div>
          <div>
            <FieldLabel>Referencia</FieldLabel>
            <DocumentInput
              value={documento.referencia ?? ''}
              onChange={(e) => updateDocumento(documento.id, { referencia: e.target.value })}
              placeholder="Folio, anexo..."
            />
          </div>
        </div>

        <div>
          <FieldLabel>Notas</FieldLabel>
          <DocumentTextarea
            rows={2}
            value={documento.notas ?? ''}
            onChange={(e) => updateDocumento(documento.id, { notas: e.target.value })}
            placeholder="Uso tactico, observaciones..."
          />
        </div>

        <button
          onClick={() => onDelete(deleteType, documento.id, getDocumentLabel(documento))}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 py-2 text-sm text-red-400 transition hover:bg-red-900/20"
          aria-label="Eliminar documento"
        >
          <Trash2 size={14} /> Eliminar documento
        </button>
      </div>
    </article>
  );
}

function TestigoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { agregarTestigo } = useStore();
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    rolProcesal: 'proponente' as 'proponente' | 'contrario',
    parteQuePropone: 'actora' as 'actora' | 'demandada' | 'tercero',
    credibilidadEstimada: '',
    puntosFuertes: '',
    puntosDebiles: '',
    contradiccionesConocidas: '',
    notasTacticas: '',
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.nombre.trim()) return;
    agregarTestigo(formData);
    setFormData({
      nombre: '',
      cargo: '',
      rolProcesal: 'proponente',
      parteQuePropone: 'actora',
      credibilidadEstimada: '',
      puntosFuertes: '',
      puntosDebiles: '',
      contradiccionesConocidas: '',
      notasTacticas: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Nuevo testigo</div>
            <h2 className="text-xl font-semibold text-zinc-100">Agregar testigo</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6">
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <DocumentInput
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Marta Ruiz"
              autoFocus
            />
          </div>

          <div>
            <FieldLabel>Cargo / Rol</FieldLabel>
            <DocumentInput
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              placeholder="Directora financiera"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Parte que lo propone</FieldLabel>
              <DocumentSelect
                value={formData.parteQuePropone}
                onChange={(e) => setFormData({ ...formData, parteQuePropone: e.target.value as 'actora' | 'demandada' | 'tercero' })}
              >
                {PARTES_TESTIGO.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </DocumentSelect>
            </div>
            <div>
              <FieldLabel>Rol procesal</FieldLabel>
              <DocumentSelect
                value={formData.rolProcesal}
                onChange={(e) => setFormData({ ...formData, rolProcesal: e.target.value as 'proponente' | 'contrario' })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </DocumentSelect>
            </div>
          </div>

          <div>
            <FieldLabel>Credibilidad estimada</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={formData.credibilidadEstimada}
              onChange={(e) => setFormData({ ...formData, credibilidadEstimada: e.target.value })}
              placeholder="Alta si se mantiene en hechos propios"
            />
          </div>

          <div>
            <FieldLabel>Puntos fuertes</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={formData.puntosFuertes}
              onChange={(e) => setFormData({ ...formData, puntosFuertes: e.target.value })}
              placeholder="Participacion directa y conocimiento de la reunion"
            />
          </div>

          <div>
            <FieldLabel>Puntos debiles</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={formData.puntosDebiles}
              onChange={(e) => setFormData({ ...formData, puntosDebiles: e.target.value })}
              placeholder="Tiende a contestar con contexto innecesario"
            />
          </div>

          <div>
            <FieldLabel>Contradicciones conocidas</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={formData.contradiccionesConocidas}
              onChange={(e) => setFormData({ ...formData, contradiccionesConocidas: e.target.value })}
              placeholder="Niega haber aprobado, pero valido el correo posterior"
            />
          </div>

          <div>
            <FieldLabel>Notas tacticas</FieldLabel>
            <DocumentTextarea
              rows={2}
              value={formData.notasTacticas}
              onChange={(e) => setFormData({ ...formData, notasTacticas: e.target.value })}
              placeholder="Entrar por hechos observados y solo despues por valoraciones"
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-800 bg-zinc-900 px-6 py-5">
          <button onClick={onClose} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Cancelar</button>
          <button
            onClick={handleSubmit}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            Agregar testigo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SidebarPanel() {
  const { testigos, hechos, documentos, nodes, agregarTestigo, agregarHecho, agregarDocumento, setDeleteConfirm } = useStore();

  const [testigosOpen, setTestigosOpen] = useState(true);
  const [hechosOpen, setHechosOpen] = useState(true);
  const [documentosOpen, setDocumentosOpen] = useState(true);
  const [documentoCollapsed, setDocumentoCollapsed] = useState<Record<string, boolean>>({});
  const [testigoModalOpen, setTestigoModalOpen] = useState(false);

  const stats = useMemo(() => {
    return {
      preguntas: nodes.filter((node) => node.type === 'pregunta').length,
      riesgos: nodes.filter((node) => node.type === 'riesgo').length,
      documentos: nodes.filter((node) => node.type === 'documento').length,
    };
  }, [nodes]);

  const documentosOrdenados = useMemo(() => sortDocumentsByName(documentos), [documentos]);

  const handleEliminar = (type: string, id: string, label: string) => {
    setDeleteConfirm({ type: type as 'testigo' | 'hecho' | 'documento', id, label });
  };

  return (
    <aside className="flex h-full w-[300px] flex-col border-r border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Resumen</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-zinc-950 px-2 py-2">
            <div className="font-semibold">{stats.preguntas}</div>
            <div className="text-zinc-500">?</div>
          </div>
          <div className="rounded-xl bg-zinc-950 px-2 py-2">
            <div className="font-semibold">{stats.riesgos}</div>
            <div className="text-zinc-500">!</div>
          </div>
          <div className="rounded-xl bg-zinc-950 px-2 py-2">
            <div className="font-semibold">{stats.documentos}</div>
            <div className="text-zinc-500">DOC</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection title="Testigos" icon={FileQuestion} count={testigos.length} isOpen={testigosOpen} onToggle={() => setTestigosOpen(!testigosOpen)}>
          <div className="px-1">
            <button
              onClick={() => setTestigoModalOpen(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600/20 py-2 text-sm text-emerald-400 transition hover:bg-emerald-600/30"
            >
              <Plus size={14} /> Nuevo testigo
            </button>
            <div className="space-y-2">
              {testigos.map((testigo) => (
                <TestigoCard
                  key={testigo.id}
                  testigo={testigo}
                  nodesCount={nodes.filter((node) => node.data.witnessId === testigo.id).length}
                  onDelete={(id, nombre) => handleEliminar('testigo', id, nombre)}
                />
              ))}
            </div>
            {testigos.length === 0 && <p className="text-xs text-zinc-500">No hay testigos.</p>}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Hechos" icon={Target} count={hechos.length} isOpen={hechosOpen} onToggle={() => setHechosOpen(!hechosOpen)}>
          <div className="px-1">
            <button
              onClick={() => {
                const titulo = window.prompt('Hecho a probar');
                if (!titulo) return;
                agregarHecho({ titulo, descripcion: '', cobertura: 'debil', priority: 'media' });
              }}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600/20 py-2 text-sm text-blue-400 transition hover:bg-blue-600/30"
            >
              <Plus size={14} /> Nuevo hecho
            </button>
            <div className="space-y-2">
              {hechos.map((hecho) => (
                <HechoCard
                  key={hecho.id}
                  hecho={hecho}
                  nodesCount={nodes.filter((node) => node.data.factId === hecho.id).length}
                  onDelete={(id, titulo) => handleEliminar('hecho', id, titulo)}
                />
              ))}
            </div>
            {hechos.length === 0 && <p className="text-xs text-zinc-500">No hay hechos.</p>}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Documentos" icon={FileText} count={documentos.length} isOpen={documentosOpen} onToggle={() => setDocumentosOpen(!documentosOpen)}>
          <div className="px-1">
            <button
              onClick={() => {
                agregarDocumento({ nombre: `Documento ${documentos.length + 1}` });
              }}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600/20 py-2 text-sm text-amber-400 transition hover:bg-amber-600/30"
            >
              <Plus size={14} /> Nuevo documento
            </button>
            <div className="space-y-2">
              {documentosOrdenados.map((documento) => (
                <DocumentCard
                  key={documento.id}
                  documento={documento}
                  isCollapsed={documentoCollapsed[documento.id] ?? true}
                  setCollapsed={(c) => setDocumentoCollapsed((prev) => ({ ...prev, [documento.id]: c }))}
                  onDelete={handleEliminar}
                  deleteType="documento"
                />
              ))}
            </div>
            {documentos.length === 0 && <p className="text-xs text-zinc-500">No hay documentos.</p>}
          </div>
        </CollapsibleSection>
      </div>

      <TestigoModal isOpen={testigoModalOpen} onClose={() => setTestigoModalOpen(false)} />
    </aside>
  );
}