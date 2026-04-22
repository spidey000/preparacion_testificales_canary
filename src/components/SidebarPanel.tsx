import { AlertTriangle, ChevronDown, ChevronRight, Download, FileQuestion, FileText, MessageSquare, Plus, Target, Trash2, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { buildRandomAccentColor, buildUniqueFactColor, getReadableTextColor } from '../colorUtils';
import ModalShell from './ModalShell';
import { getDocumentLabel, sortDocumentsByName } from '../documentUtils';
import { useStore } from '../store';
import type { Documento, Hecho, ParteDocumento, PreguntaBase, PreguntaRespuesta, Testigo } from '../types';

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

const EMPTY_TESTIGO_FORM = {
  nombre: '',
  cargo: '',
  rolProcesal: 'proponente' as 'proponente' | 'contrario',
  parteQuePropone: 'actora' as 'actora' | 'demandada' | 'tercero',
  color: '',
  credibilidadEstimada: '',
  puntosFuertes: '',
  puntosDebiles: '',
  contradiccionesConocidas: '',
  notasTacticas: '',
};

const EMPTY_HECHO_FORM = {
  titulo: '',
  descripcion: '',
  cobertura: 'debil' as 'no-cubierto' | 'debil' | 'cubierto' | 'muy-cubierto',
  priority: 'media' as 'baja' | 'media' | 'alta',
  color: '',
};

const EMPTY_DOCUMENTO_FORM = {
  nombre: '',
  descripcion: '',
  parte: '' as ParteDocumento | '',
  tipo: '',
  fecha: '',
  referencia: '',
  notas: '',
};

const EMPTY_PREGUNTA_FORM = {
  texto: '',
  witnessId: '',
  factId: '',
  topicLabel: '',
  respuestas: [{ id: crypto.randomUUID(), texto: '' }] as PreguntaRespuesta[],
  notas: '',
};

function parseQuestionsCsv(text: string): Array<Omit<PreguntaBase, 'id'>> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const splitCsvLine = (line: string) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\*/g, '').trim());
  const textoIndex = headers.indexOf('texto');
  const testigoIndex = headers.indexOf('testigo');
  const hechoIndex = headers.indexOf('hecho');
  const temaIndex = headers.findIndex((header) => header === 'tema' || header === 'topic' || header === 'topiclabel');
  const respuestaIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => header.startsWith('respuesta_'));

  if (textoIndex === -1) {
    throw new Error('El CSV debe incluir una columna "texto".');
  }

  return lines.slice(1).reduce<Array<Omit<PreguntaBase, 'id'>>>((acc, line) => {
    const cells = splitCsvLine(line);
    const texto = cells[textoIndex]?.trim() ?? '';
    if (!texto) return acc;

    acc.push({
      texto,
      witnessId: testigoIndex >= 0 ? cells[testigoIndex]?.trim() || undefined : undefined,
      factId: hechoIndex >= 0 ? cells[hechoIndex]?.trim() || undefined : undefined,
      topicLabel: temaIndex >= 0 ? cells[temaIndex]?.trim() || undefined : undefined,
      respuestas: respuestaIndexes
        .map(({ index }) => cells[index]?.trim() ?? '')
        .filter(Boolean)
        .map((respuesta) => ({ id: crypto.randomUUID(), texto: respuesta })),
      notas: undefined,
    });
    return acc;
  }, []);
}

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

function buildRandomWitnessColor() {
  return buildRandomAccentColor();
}

function buildRandomFactColor(hechos: Hecho[], currentFactId?: string) {
  return buildUniqueFactColor(
    hechos.filter((hecho) => hecho.id !== currentFactId).map((hecho) => hecho.color),
  );
}

function buildColorChipStyle(color: string) {
  return {
    backgroundColor: color,
    color: getReadableTextColor(color),
  };
}

function buildColorSelectStyle(color?: string): React.CSSProperties | undefined {
  if (!color) return undefined;

  return {
    backgroundColor: color,
    color: getReadableTextColor(color),
    borderColor: color,
  };
}

function ColorChip({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full px-2 py-1 text-[11px] font-medium" style={buildColorChipStyle(color)}>
      <span className="truncate">{label}</span>
    </span>
  );
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
    <article className="group relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start justify-between gap-2 px-0.5 py-1 text-left"
      >
        <div className="min-w-0 flex-1">
          <ColorChip label={testigo.nombre} color={testigo.color} />
          <div className="mt-0.5 pl-1 text-[11px] text-zinc-500">
            {testigo.rolProcesal} · {nodesCount} nodo{nodesCount !== 1 ? 's' : ''}
          </div>
        </div>
        <ChevronDown size={14} className={`mt-1 shrink-0 text-zinc-600 transition ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-3 pl-3">
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
                style={buildColorSelectStyle(testigo.color)}
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
                style={buildColorSelectStyle(testigo.color)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </DocumentSelect>
            </div>
          </div>

          <div>
            <FieldLabel>Color automatico de sus preguntas</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl border border-zinc-700" style={{ backgroundColor: testigo.color }} />
              <DocumentInput
                value={testigo.color}
                onChange={(e) => updateTestigo(testigo.id, { color: e.target.value })}
                placeholder="hsl(200 70% 58%) o #3b82f6"
                style={buildColorSelectStyle(testigo.color)}
              />
              <button
                type="button"
                onClick={() => updateTestigo(testigo.id, { color: buildRandomWitnessColor() })}
                className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
              >
                Aleatorio
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Las preguntas vinculadas a este testigo usan este color en el canvas.</p>
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

          <button
            onClick={() => onDelete(testigo.id, testigo.nombre)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 py-2 text-sm text-red-400 transition hover:bg-red-900/20"
            aria-label="Eliminar testigo"
          >
            <Trash2 size={14} /> Eliminar testigo
          </button>
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
  const { updateHecho, hechos } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="group relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start justify-between gap-2 px-0.5 py-1 text-left"
      >
        <div className="min-w-0 flex-1">
          <ColorChip label={hecho.titulo} color={hecho.color} />
          <div className="mt-0.5 pl-1 text-[11px] text-zinc-500">
            {hecho.cobertura} · {nodesCount} nodo{nodesCount !== 1 ? 's' : ''}
          </div>
        </div>
        <ChevronDown size={14} className={`mt-1 shrink-0 text-zinc-600 transition ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-3 pl-3">
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
                style={buildColorSelectStyle(hecho.color)}
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
                style={buildColorSelectStyle(hecho.color)}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </DocumentSelect>
            </div>
          </div>

          <div>
            <FieldLabel>Color del hecho</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl border border-zinc-700" style={{ backgroundColor: hecho.color }} />
              <DocumentInput
                value={hecho.color}
                onChange={(e) => updateHecho(hecho.id, { color: e.target.value })}
                placeholder="hsl(220 70% 58%) o #3b82f6"
                style={buildColorSelectStyle(hecho.color)}
              />
              <button
                type="button"
                onClick={() => updateHecho(hecho.id, { color: buildRandomFactColor(hechos, hecho.id) })}
                className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
              >
                Aleatorio
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Si el color coincide con otro hecho, se ajusta al mas cercano disponible.</p>
          </div>

          <div className="text-center text-xs text-zinc-500">
            {nodesCount} nodo{nodesCount !== 1 ? 's' : ''} asociado{nodesCount !== 1 ? 's' : ''}
          </div>

          <button
            onClick={() => onDelete(hecho.id, hecho.titulo)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 py-2 text-sm text-red-400 transition hover:bg-red-900/20"
            aria-label="Eliminar hecho"
          >
            <Trash2 size={14} /> Eliminar hecho
          </button>
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
  const [formData, setFormData] = useState(EMPTY_TESTIGO_FORM);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.nombre.trim()) return;
    agregarTestigo(formData);
    setFormData(EMPTY_TESTIGO_FORM);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} zIndexClassName="z-[100]" panelClassName="max-w-lg border-zinc-800">
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
            <FieldLabel>Color automatico de sus preguntas</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl border border-zinc-700" style={{ backgroundColor: formData.color || '#22c55e' }} />
              <DocumentInput
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Vacío = color aleatorio"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, color: buildRandomWitnessColor() })}
                className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
              >
                Aleatorio
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Este color se aplicara automaticamente a sus nodos de pregunta.</p>
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
    </ModalShell>
  );
}

function HechoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { agregarHecho, hechos } = useStore();
  const [formData, setFormData] = useState(EMPTY_HECHO_FORM);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.titulo.trim()) return;
    agregarHecho(formData);
    setFormData(EMPTY_HECHO_FORM);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} zIndexClassName="z-[100]" panelClassName="max-w-lg border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Nuevo hecho</div>
            <h2 className="text-xl font-semibold text-zinc-100">Agregar hecho</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6">
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <DocumentInput
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Incumplimiento del plazo de entrega"
              autoFocus
            />
          </div>

          <div>
            <FieldLabel>Descripcion</FieldLabel>
            <DocumentTextarea
              rows={4}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Resume el hecho concreto y por que importa probarlo"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Cobertura</FieldLabel>
              <DocumentSelect
                value={formData.cobertura}
                onChange={(e) => setFormData({ ...formData, cobertura: e.target.value as 'no-cubierto' | 'debil' | 'cubierto' | 'muy-cubierto' })}
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
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'baja' | 'media' | 'alta' })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </DocumentSelect>
            </div>
          </div>

          <div>
            <FieldLabel>Color del hecho</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl border border-zinc-700" style={{ backgroundColor: formData.color || '#3b82f6' }} />
              <DocumentInput
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Vacío = color aleatorio"
                style={buildColorSelectStyle(formData.color || undefined)}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, color: buildRandomFactColor(hechos) })}
                className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
              >
                Aleatorio
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Cada hecho tiene un color propio y no comparte color con otro hecho.</p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-800 bg-zinc-900 px-6 py-5">
          <button onClick={onClose} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Cancelar</button>
          <button
            onClick={handleSubmit}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            Agregar hecho
          </button>
        </div>
    </ModalShell>
  );
}

function DocumentoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { agregarDocumento } = useStore();
  const [formData, setFormData] = useState(EMPTY_DOCUMENTO_FORM);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.nombre.trim()) return;

    agregarDocumento({
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      parte: formData.parte || undefined,
      tipo: formData.tipo,
      fecha: formData.fecha,
      referencia: formData.referencia,
      notas: formData.notas,
    });

    setFormData(EMPTY_DOCUMENTO_FORM);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} zIndexClassName="z-[100]" panelClassName="max-w-2xl border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Nuevo documento</div>
            <h2 className="text-xl font-semibold text-zinc-100">Agregar documento</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel>Nombre</FieldLabel>
            <DocumentInput
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Contrato marco 2024"
              autoFocus
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel>Descripcion</FieldLabel>
            <DocumentTextarea
              rows={4}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Resumen del contenido util para la estrategia"
            />
          </div>

          <div>
            <FieldLabel>Parte</FieldLabel>
            <DocumentSelect
              value={formData.parte}
              onChange={(e) => setFormData({ ...formData, parte: e.target.value as ParteDocumento | '' })}
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
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              placeholder="Contrato, email..."
            />
          </div>

          <div>
            <FieldLabel>Fecha</FieldLabel>
            <DocumentInput
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              placeholder="2026-04-21"
            />
          </div>

          <div>
            <FieldLabel>Referencia</FieldLabel>
            <DocumentInput
              value={formData.referencia}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              placeholder="Folio, anexo..."
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel>Notas</FieldLabel>
            <DocumentTextarea
              rows={4}
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Uso tactico, observaciones..."
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-800 bg-zinc-900 px-6 py-5">
          <button onClick={onClose} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Cancelar</button>
          <button
            onClick={handleSubmit}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            Agregar documento
          </button>
        </div>
    </ModalShell>
  );
}

function QuestionAnswersEditor({
  answers,
  onChange,
}: {
  answers: PreguntaRespuesta[];
  onChange: (next: PreguntaRespuesta[]) => void;
}) {
  return (
    <div className="space-y-2">
      {answers.map((answer, index) => (
        <div key={answer.id} className="flex items-center gap-2">
          <DocumentInput
            value={answer.texto}
            onChange={(e) => onChange(answers.map((item) => (item.id === answer.id ? { ...item, texto: e.target.value } : item)))}
            placeholder={`Respuesta ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(answers.length === 1 ? [{ id: crypto.randomUUID(), texto: '' }] : answers.filter((item) => item.id !== answer.id))}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...answers, { id: crypto.randomUUID(), texto: '' }])}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
      >
        <Plus size={14} /> Anadir respuesta
      </button>
    </div>
  );
}

function PreguntaCard({
  pregunta,
  testigos,
  hechos,
  onDelete,
  onAddToCanvas,
}: {
  pregunta: PreguntaBase;
  testigos: Testigo[];
  hechos: Hecho[];
  onDelete: (id: string, label: string) => void;
  onAddToCanvas: (id: string) => void;
}) {
  const { updatePregunta } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedWitness = testigos.find((item) => item.id === pregunta.witnessId);
  const selectedFact = hechos.find((item) => item.id === pregunta.factId);

  return (
    <article className="group relative rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-start gap-2 p-3">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex w-full items-start gap-2 text-left">
          <MessageSquare size={14} className="mt-0.5 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-zinc-100 line-clamp-2">{pregunta.texto}</div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              {selectedWitness ? <ColorChip label={selectedWitness.nombre} color={selectedWitness.color} /> : <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">Sin testigo</span>}
              {selectedFact ? <ColorChip label={selectedFact.titulo} color={selectedFact.color} /> : <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">Sin hecho</span>}
              {pregunta.topicLabel ? <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-300">{pregunta.topicLabel}</span> : null}
            </div>
          </div>
          <ChevronDown size={14} className={`text-zinc-600 transition ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-zinc-800/50 p-3">
          <div>
            <FieldLabel>Texto</FieldLabel>
            <DocumentTextarea rows={3} value={pregunta.texto} onChange={(e) => updatePregunta(pregunta.id, { texto: e.target.value })} />
          </div>

          <div>
            <FieldLabel>Tema</FieldLabel>
            <DocumentInput value={pregunta.topicLabel ?? ''} onChange={(e) => updatePregunta(pregunta.id, { topicLabel: e.target.value })} placeholder="Tema de contratacion" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Testigo</FieldLabel>
              <DocumentSelect value={pregunta.witnessId ?? ''} onChange={(e) => updatePregunta(pregunta.id, { witnessId: e.target.value || undefined })} style={buildColorSelectStyle(selectedWitness?.color)}>
                <option value="">Sin vincular</option>
                {testigos.map((testigo) => <option key={testigo.id} value={testigo.id}>{testigo.nombre}</option>)}
              </DocumentSelect>
            </div>
            <div>
              <FieldLabel>Hecho</FieldLabel>
              <DocumentSelect value={pregunta.factId ?? ''} onChange={(e) => updatePregunta(pregunta.id, { factId: e.target.value || undefined })} style={buildColorSelectStyle(selectedFact?.color)}>
                <option value="">Sin vincular</option>
                {hechos.map((hecho) => <option key={hecho.id} value={hecho.id}>{hecho.titulo}</option>)}
              </DocumentSelect>
            </div>
          </div>

          <div>
            <FieldLabel>Respuestas base</FieldLabel>
            <QuestionAnswersEditor answers={pregunta.respuestas} onChange={(respuestas) => updatePregunta(pregunta.id, { respuestas })} />
          </div>

          <div>
            <FieldLabel>Notas</FieldLabel>
            <DocumentTextarea rows={2} value={pregunta.notas ?? ''} onChange={(e) => updatePregunta(pregunta.id, { notas: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAddToCanvas(pregunta.id)}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 py-2 text-sm text-emerald-400 transition hover:bg-emerald-600/30"
            >
              <Plus size={14} /> Anadir al canvas
            </button>
            <button
              onClick={() => onDelete(pregunta.id, pregunta.texto)}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-900/50 py-2 text-sm text-red-400 transition hover:bg-red-900/20"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function PreguntaModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { agregarPregunta, testigos, hechos } = useStore();
  const [formData, setFormData] = useState(EMPTY_PREGUNTA_FORM);
  const selectedWitness = testigos.find((item) => item.id === formData.witnessId);
  const selectedFact = hechos.find((item) => item.id === formData.factId);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.texto.trim()) return;

    agregarPregunta({
      texto: formData.texto.trim(),
      witnessId: formData.witnessId || undefined,
      factId: formData.factId || undefined,
      topicLabel: formData.topicLabel.trim() || undefined,
      respuestas: formData.respuestas,
      notas: formData.notas.trim() || undefined,
    });
    setFormData({ ...EMPTY_PREGUNTA_FORM, respuestas: [{ id: crypto.randomUUID(), texto: '' }] });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} zIndexClassName="z-[100]" panelClassName="max-w-2xl border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Nueva pregunta</div>
          <h2 className="text-xl font-semibold text-zinc-100">Agregar pregunta</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
          <X size={20} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6">
        <div>
          <FieldLabel>Texto</FieldLabel>
          <DocumentTextarea rows={4} value={formData.texto} onChange={(e) => setFormData({ ...formData, texto: e.target.value })} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Testigo</FieldLabel>
            <DocumentSelect value={formData.witnessId} onChange={(e) => setFormData({ ...formData, witnessId: e.target.value })} style={buildColorSelectStyle(selectedWitness?.color)}>
              <option value="">Sin vincular</option>
              {testigos.map((testigo) => <option key={testigo.id} value={testigo.id}>{testigo.nombre}</option>)}
            </DocumentSelect>
          </div>
          <div>
            <FieldLabel>Hecho</FieldLabel>
            <DocumentSelect value={formData.factId} onChange={(e) => setFormData({ ...formData, factId: e.target.value })} style={buildColorSelectStyle(selectedFact?.color)}>
              <option value="">Sin vincular</option>
              {hechos.map((hecho) => <option key={hecho.id} value={hecho.id}>{hecho.titulo}</option>)}
            </DocumentSelect>
          </div>
        </div>
        <div>
          <FieldLabel>Tema</FieldLabel>
          <DocumentInput value={formData.topicLabel} onChange={(e) => setFormData({ ...formData, topicLabel: e.target.value })} placeholder="Tema opcional" />
        </div>
        <div>
          <FieldLabel>Respuestas base</FieldLabel>
          <QuestionAnswersEditor answers={formData.respuestas} onChange={(respuestas) => setFormData({ ...formData, respuestas })} />
        </div>
        <div>
          <FieldLabel>Notas</FieldLabel>
          <DocumentTextarea rows={3} value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-800 bg-zinc-900 px-6 py-5">
        <button onClick={onClose} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Cancelar</button>
        <button onClick={handleSubmit} className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200">Agregar pregunta</button>
      </div>
    </ModalShell>
  );
}

export default function SidebarPanel({
  width,
  onResizeStart,
}: {
  width: number;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const { testigos, hechos, documentos, preguntas, nodes, setDeleteConfirm, importarPreguntas, crearNodoPreguntaDesdeBanco } = useStore();

  const [testigosOpen, setTestigosOpen] = useState(true);
  const [hechosOpen, setHechosOpen] = useState(true);
  const [documentosOpen, setDocumentosOpen] = useState(true);
  const [preguntasOpen, setPreguntasOpen] = useState(true);
  const [documentoCollapsed, setDocumentoCollapsed] = useState<Record<string, boolean>>({});
  const [testigoModalOpen, setTestigoModalOpen] = useState(false);
  const [hechoModalOpen, setHechoModalOpen] = useState(false);
  const [documentoModalOpen, setDocumentoModalOpen] = useState(false);
  const [preguntaModalOpen, setPreguntaModalOpen] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    return {
      preguntas: nodes.filter((node) => node.type === 'pregunta').length,
      riesgos: nodes.filter((node) => node.type === 'riesgo').length,
      documentos: nodes.filter((node) => node.type === 'documento').length,
    };
  }, [nodes]);

  const documentosOrdenados = useMemo(() => sortDocumentsByName(documentos), [documentos]);
  const preguntasOrdenadas = useMemo(() => [...preguntas].sort((a, b) => a.texto.localeCompare(b.texto, 'es')), [preguntas]);

  const handleEliminar = (type: string, id: string, label: string) => {
    setDeleteConfirm({ type: type as 'testigo' | 'hecho' | 'documento' | 'pregunta', id, label });
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseQuestionsCsv(text);
      const result = importarPreguntas(parsed);
      window.alert(`Importadas ${result.imported} pregunta(s). Testigos no resueltos: ${result.unresolvedWitnesses}. Hechos no resueltos: ${result.unresolvedFacts}.`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo importar el CSV.');
    }
  };

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/80 backdrop-blur"
      style={{ width, minWidth: width, maxWidth: width }}
    >
      <button
        type="button"
        aria-label="Redimensionar sidebar"
        onPointerDown={onResizeStart}
        className="absolute inset-y-0 right-0 z-20 w-3 translate-x-1/2 cursor-col-resize bg-transparent"
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-700 transition hover:bg-zinc-500" />
      </button>

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
            <div className="space-y-1">
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
              onClick={() => setHechoModalOpen(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600/20 py-2 text-sm text-blue-400 transition hover:bg-blue-600/30"
            >
              <Plus size={14} /> Nuevo hecho
            </button>
            <div className="space-y-1">
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
              onClick={() => setDocumentoModalOpen(true)}
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

        <CollapsibleSection title="Preguntas" icon={MessageSquare} count={preguntas.length} isOpen={preguntasOpen} onToggle={() => setPreguntasOpen(!preguntasOpen)}>
          <div className="px-1">
            <div className="mb-3 grid grid-cols-1 gap-2">
              <button
                onClick={() => setPreguntaModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600/20 py-2 text-sm text-emerald-400 transition hover:bg-emerald-600/30"
              >
                <Plus size={14} /> Nueva pregunta
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => csvInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700"
                >
                  <Upload size={14} /> Importar CSV
                </button>
                <a
                  href="/templates/preguntas-template.csv"
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                >
                  <Download size={14} /> Plantilla CSV
                </a>
              </div>
            </div>
            <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={(event) => void handleImportCsv(event)} className="hidden" />
            <div className="space-y-2">
              {preguntasOrdenadas.map((pregunta) => {
                return (
                  <PreguntaCard
                    key={pregunta.id}
                    pregunta={pregunta}
                    testigos={testigos}
                    hechos={hechos}
                    onDelete={(id, label) => handleEliminar('pregunta', id, label)}
                    onAddToCanvas={crearNodoPreguntaDesdeBanco}
                  />
                );
              })}
            </div>
            {preguntas.length === 0 && <p className="text-xs text-zinc-500">No hay preguntas.</p>}
          </div>
        </CollapsibleSection>
      </div>

      <TestigoModal isOpen={testigoModalOpen} onClose={() => setTestigoModalOpen(false)} />
      <HechoModal isOpen={hechoModalOpen} onClose={() => setHechoModalOpen(false)} />
      <DocumentoModal isOpen={documentoModalOpen} onClose={() => setDocumentoModalOpen(false)} />
      <PreguntaModal isOpen={preguntaModalOpen} onClose={() => setPreguntaModalOpen(false)} />
    </aside>
  );
}
