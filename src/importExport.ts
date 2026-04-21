import type { Flujo, Cobertura, EdgeKind, NodeKind, ParteDocumento, Priority, QuestionStyle, RiskLevel, SessionMode } from './types';

export const DB_FILE_EXTENSION = '.json';
export const DB_APP_ID = 'testificales';
export const DB_SCHEMA_VERSION = 2;

const NODE_KINDS: NodeKind[] = ['pregunta', 'riesgo', 'documento', 'hecho', 'tema', 'cierre'];
const COVERAGE_VALUES: Cobertura[] = ['no-cubierto', 'debil', 'cubierto', 'muy-cubierto'];
const QUESTION_STYLES: QuestionStyle[] = ['abierta', 'cerrada', 'fijacion', 'impugnacion', 'cierre'];
const RISK_LEVELS: RiskLevel[] = ['bajo', 'medio', 'alto'];
const PRIORITIES: Priority[] = ['baja', 'media', 'alta'];
const SESSION_MODES: SessionMode[] = ['preparacion', 'audiencia'];
const DOCUMENT_PARTS: ParteDocumento[] = ['actora', 'demandada', 'ambas', 'tercero'];
const EDGE_KINDS: EdgeKind[] = [
  'sigue',
  'depende_de',
  'si_responde_si',
  'si_responde_no',
  'si_evita',
  'si_contradice',
  'refuerza',
  'contradice',
  'abre_alternativa',
  'conecta_documento',
  'conecta_hecho',
  'conecta_riesgo',
];

export interface DbExportFile {
  app: typeof DB_APP_ID;
  schemaVersion: typeof DB_SCHEMA_VERSION;
  exportedAt: string;
  flujos: Flujo[];
}

export interface ImportAdjustment {
  field: string;
  path: string;
  previousValue: string;
  appliedValue: string;
  reason: string;
}

export interface GroupedImportAdjustment {
  field: string;
  reason: string;
  appliedValue: string;
  occurrences: number;
  samplePaths: string[];
  samplePreviousValues: string[];
}

export interface ParseImportedDbResult {
  flujos: Flujo[];
  adjustments: ImportAdjustment[];
  groupedAdjustments: GroupedImportAdjustment[];
}

interface ImportNodeTypeCounts {
  pregunta: number;
  riesgo: number;
  documento: number;
  hecho: number;
  tema: number;
  cierre: number;
}

export interface ImportFlowDebugSummary {
  id: string;
  titulo: string;
  mode: SessionMode;
  testigos: number;
  hechos: number;
  documentos: number;
  nodes: number;
  edges: number;
  nodeTypes: ImportNodeTypeCounts;
}

export interface ImportDebugSummary {
  flujos: number;
  testigos: number;
  hechos: number;
  documentos: number;
  nodes: number;
  edges: number;
  nodeTypes: ImportNodeTypeCounts;
  flows: ImportFlowDebugSummary[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const DEFAULT_FLOW_MODE: SessionMode = 'preparacion';
const DEFAULT_QUESTION_STYLE: QuestionStyle = 'abierta';
const DEFAULT_RISK_LEVEL: RiskLevel = 'medio';
const DEFAULT_PRIORITY: Priority = 'media';
const DEFAULT_COVERAGE: Cobertura = 'debil';
const DEFAULT_TESTIGO_PARTE: 'actora' | 'demandada' | 'tercero' = 'actora';
const DEFAULT_TESTIGO_ROL: 'proponente' | 'contrario' = 'proponente';
const DEFAULT_TESTIGO_CREDIBILIDAD = 'Media';
const DEFAULT_TESTIGO_COLOR = 'hsl(200 70% 58%)';

const NODE_LABEL_BY_KIND: Record<NodeKind, string> = {
  pregunta: 'Nueva pregunta',
  riesgo: 'Nuevo riesgo',
  documento: 'Nuevo documento',
  hecho: 'Nuevo hecho',
  tema: 'Nuevo tema',
  cierre: 'Nuevo cierre',
};

function createEmptyNodeTypeCounts(): ImportNodeTypeCounts {
  return {
    pregunta: 0,
    riesgo: 0,
    documento: 0,
    hecho: 0,
    tema: 0,
    cierre: 0,
  };
}

function countNodesByType(nodes: Flujo['nodes']): ImportNodeTypeCounts {
  return nodes.reduce<ImportNodeTypeCounts>((counts, node) => {
    counts[node.type] += 1;
    return counts;
  }, createEmptyNodeTypeCounts());
}

export function buildImportDebugSummary(flujos: Flujo[]): ImportDebugSummary {
  const totals = {
    flujos: flujos.length,
    testigos: 0,
    hechos: 0,
    documentos: 0,
    nodes: 0,
    edges: 0,
    nodeTypes: createEmptyNodeTypeCounts(),
    flows: [] as ImportFlowDebugSummary[],
  };

  for (const flujo of flujos) {
    const nodeTypes = countNodesByType(flujo.nodes);
    totals.testigos += flujo.testigos.length;
    totals.hechos += flujo.hechos.length;
    totals.documentos += flujo.documentos?.length ?? 0;
    totals.nodes += flujo.nodes.length;
    totals.edges += flujo.edges.length;

    (Object.keys(nodeTypes) as NodeKind[]).forEach((kind) => {
      totals.nodeTypes[kind] += nodeTypes[kind];
    });

    totals.flows.push({
      id: flujo.id,
      titulo: flujo.titulo,
      mode: flujo.mode,
      testigos: flujo.testigos.length,
      hechos: flujo.hechos.length,
      documentos: flujo.documentos?.length ?? 0,
      nodes: flujo.nodes.length,
      edges: flujo.edges.length,
      nodeTypes,
    });
  }

  return totals;
}

function logFlowNormalizationSummary(flowPath: string, flow: Flujo, adjustments: ImportAdjustment[], adjustmentStartIndex: number) {
  const flowAdjustments = adjustments.slice(adjustmentStartIndex);
  const nodeTypes = countNodesByType(flow.nodes);

  console.groupCollapsed(`[import-json] ${flowPath} normalizado`);
  console.table([{
    id: flow.id,
    titulo: flow.titulo,
    mode: flow.mode,
    testigos: flow.testigos.length,
    hechos: flow.hechos.length,
    documentos: flow.documentos?.length ?? 0,
    nodes: flow.nodes.length,
    edges: flow.edges.length,
    preguntas: nodeTypes.pregunta,
    riesgos: nodeTypes.riesgo,
    nodosDocumento: nodeTypes.documento,
    nodosHecho: nodeTypes.hecho,
    temas: nodeTypes.tema,
    cierres: nodeTypes.cierre,
    ajustes: flowAdjustments.length,
  }]);

  if (flowAdjustments.length > 0) {
    console.table(flowAdjustments.map((adjustment) => ({
      field: adjustment.field,
      path: adjustment.path,
      previousValue: adjustment.previousValue,
      appliedValue: adjustment.appliedValue,
      reason: adjustment.reason,
    })));
  }

  console.groupEnd();
}

function summarizeValue(value: unknown): string {
  if (value === undefined) return '(sin valor)';
  if (value === null) return 'null';
  if (typeof value === 'string') return value.trim().length > 0 ? value : '(cadena vacia)';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    const serialized = JSON.stringify(value);
    if (!serialized) return String(value);
    return serialized.length > 100 ? `${serialized.slice(0, 97)}...` : serialized;
  } catch {
    return String(value);
  }
}

function recordAdjustment(
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
  previousValue: unknown,
  appliedValue: unknown,
  reason: string,
) {
  adjustments.push({
    field,
    path,
    previousValue: summarizeValue(previousValue),
    appliedValue: summarizeValue(appliedValue),
    reason,
  });
}

function ensureRequiredString(
  value: unknown,
  fallback: string,
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
  reason: string,
) {
  if (!isString(value) || value.trim().length === 0) {
    recordAdjustment(adjustments, field, path, value, fallback, reason);
    return fallback;
  }
  return value;
}

function ensureOptionalString(
  value: unknown,
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
  fallback?: string,
) {
  if (value === undefined) return fallback;
  if (!isString(value)) {
    recordAdjustment(adjustments, field, path, value, fallback, 'Se reemplazo por un valor por defecto.');
    return fallback;
  }
  return value;
}

function ensureOptionalStringOrNull(
  value: unknown,
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
  fallback?: string | null,
) {
  if (value === undefined || value === null) return value ?? fallback;
  if (!isString(value)) {
    recordAdjustment(adjustments, field, path, value, fallback, 'Se reemplazo por un valor por defecto.');
    return fallback;
  }
  return value;
}

function ensureOptionalBoolean(
  value: unknown,
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
  fallback?: boolean,
) {
  if (value === undefined) return fallback;
  if (!isBoolean(value)) {
    recordAdjustment(adjustments, field, path, value, fallback, 'Se reemplazo por un valor por defecto.');
    return fallback;
  }
  return value;
}

function ensureEnum<T extends string>(
  value: unknown,
  allowed: T[],
  fallback: T,
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
) {
  if (!isString(value) || !allowed.includes(value as T)) {
    recordAdjustment(adjustments, field, path, value, fallback, 'Se reemplazo por un valor permitido por defecto.');
    return fallback;
  }
  return value as T;
}

function ensureOptionalEnum<T extends string>(
  value: unknown,
  allowed: T[],
  fallback: T | undefined,
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
) {
  if (value === undefined) return fallback;
  if (!isString(value) || !allowed.includes(value as T)) {
    recordAdjustment(adjustments, field, path, value, fallback, 'Se reemplazo por un valor permitido por defecto.');
    return fallback;
  }
  return value as T;
}

function ensureArray(
  value: unknown,
  fallback: unknown[],
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
) {
  if (!Array.isArray(value)) {
    recordAdjustment(adjustments, field, path, value, fallback, 'Se reemplazo por un array vacio.');
    return fallback;
  }
  return value;
}

function ensureUniqueId(
  value: unknown,
  usedIds: Set<string>,
  adjustments: ImportAdjustment[],
  field: string,
  path: string,
  fallbackLabel: string,
) {
  const fallback = crypto.randomUUID();
  let id = ensureRequiredString(value, fallback, adjustments, field, path, `${fallbackLabel}: se genero un id nuevo.`);
  if (usedIds.has(id)) {
    const replacement = crypto.randomUUID();
    recordAdjustment(adjustments, field, path, value, replacement, `${fallbackLabel}: el id estaba repetido y se genero uno nuevo.`);
    id = replacement;
  }
  usedIds.add(id);
  return id;
}

function normalizePosition(value: unknown, nodeIndex: number, adjustments: ImportAdjustment[], path: string) {
  const fallback = {
    x: 160 + (nodeIndex % 4) * 300,
    y: 120 + Math.floor(nodeIndex / 4) * 180,
  };

  if (!isRecord(value) || !isNumber(value.x) || !isNumber(value.y)) {
    recordAdjustment(adjustments, 'nodes.position', `${path}.position`, value, fallback, 'Se reemplazo por una posicion valida por defecto.');
    return fallback;
  }

  return {
    x: value.x,
    y: value.y,
  };
}

function groupByFrequency(items: string[]) {
  const unique = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (unique.has(item)) continue;
    unique.add(item);
    out.push(item);
    if (out.length >= 3) break;
  }
  return out;
}

export function groupImportAdjustments(adjustments: ImportAdjustment[]): GroupedImportAdjustment[] {
  const grouped = new Map<string, GroupedImportAdjustment>();

  for (const adjustment of adjustments) {
    const key = `${adjustment.field}|${adjustment.reason}|${adjustment.appliedValue}`;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        field: adjustment.field,
        reason: adjustment.reason,
        appliedValue: adjustment.appliedValue,
        occurrences: 1,
        samplePaths: [adjustment.path],
        samplePreviousValues: [adjustment.previousValue],
      });
      continue;
    }

    current.occurrences += 1;
    current.samplePaths = groupByFrequency([...current.samplePaths, adjustment.path]);
    current.samplePreviousValues = groupByFrequency([...current.samplePreviousValues, adjustment.previousValue]);
  }

  return [...grouped.values()].sort((a, b) => b.occurrences - a.occurrences);
}

function normalizeFlow(flujoValue: unknown, index: number, adjustments: ImportAdjustment[]): Flujo {
  const flowPath = `flujos[${index}]`;
  const adjustmentStartIndex = adjustments.length;
  const source = isRecord(flujoValue) ? flujoValue : {};
  if (!isRecord(flujoValue)) {
    recordAdjustment(adjustments, 'flujo', flowPath, flujoValue, '{}', 'El flujo no era un objeto y se reemplazo por valores por defecto.');
  }

  const now = new Date().toISOString();
  const witnessIds = new Set<string>();
  const factIds = new Set<string>();
  const documentIds = new Set<string>();
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  const testigosSource = ensureArray(source.testigos, [], adjustments, 'testigos', `${flowPath}.testigos`);
  const hechosSource = ensureArray(source.hechos, [], adjustments, 'hechos', `${flowPath}.hechos`);
  const documentosSource = source.documentos === undefined
    ? []
    : ensureArray(source.documentos, [], adjustments, 'documentos', `${flowPath}.documentos`);
  const nodesSource = ensureArray(source.nodes, [], adjustments, 'nodes', `${flowPath}.nodes`);
  const edgesSource = ensureArray(source.edges, [], adjustments, 'edges', `${flowPath}.edges`);

  const testigos = testigosSource.map((item, witnessIndex) => {
    const witnessPath = `${flowPath}.testigos[${witnessIndex}]`;
    const witness = isRecord(item) ? item : {};
    if (!isRecord(item)) {
      recordAdjustment(adjustments, 'testigo', witnessPath, item, '{}', 'El testigo no era un objeto y se reemplazo por valores por defecto.');
    }

    return {
      id: ensureUniqueId(witness.id, witnessIds, adjustments, 'testigo.id', `${witnessPath}.id`, 'Testigo invalido'),
      nombre: ensureRequiredString(witness.nombre, `Testigo ${witnessIndex + 1}`, adjustments, 'testigo.nombre', `${witnessPath}.nombre`, 'Se reemplazo por un nombre por defecto.'),
      parteQuePropone: ensureEnum(witness.parteQuePropone, ['actora', 'demandada', 'tercero'], DEFAULT_TESTIGO_PARTE, adjustments, 'testigo.parteQuePropone', `${witnessPath}.parteQuePropone`),
      rolProcesal: ensureEnum(witness.rolProcesal, ['proponente', 'contrario'], DEFAULT_TESTIGO_ROL, adjustments, 'testigo.rolProcesal', `${witnessPath}.rolProcesal`),
      credibilidadEstimada: ensureRequiredString(witness.credibilidadEstimada, DEFAULT_TESTIGO_CREDIBILIDAD, adjustments, 'testigo.credibilidadEstimada', `${witnessPath}.credibilidadEstimada`, 'Se reemplazo por una credibilidad estimada por defecto.'),
      color: ensureRequiredString(witness.color, DEFAULT_TESTIGO_COLOR, adjustments, 'testigo.color', `${witnessPath}.color`, 'Se reemplazo por un color por defecto.'),
      cargo: ensureOptionalString(witness.cargo, adjustments, 'testigo.cargo', `${witnessPath}.cargo`),
      puntosFuertes: ensureOptionalString(witness.puntosFuertes, adjustments, 'testigo.puntosFuertes', `${witnessPath}.puntosFuertes`),
      puntosDebiles: ensureOptionalString(witness.puntosDebiles, adjustments, 'testigo.puntosDebiles', `${witnessPath}.puntosDebiles`),
      contradiccionesConocidas: ensureOptionalString(witness.contradiccionesConocidas, adjustments, 'testigo.contradiccionesConocidas', `${witnessPath}.contradiccionesConocidas`),
      notasTacticas: ensureOptionalString(witness.notasTacticas, adjustments, 'testigo.notasTacticas', `${witnessPath}.notasTacticas`),
    };
  });

  const hechos = hechosSource.map((item, factIndex) => {
    const factPath = `${flowPath}.hechos[${factIndex}]`;
    const fact = isRecord(item) ? item : {};
    if (!isRecord(item)) {
      recordAdjustment(adjustments, 'hecho', factPath, item, '{}', 'El hecho no era un objeto y se reemplazo por valores por defecto.');
    }

    return {
      id: ensureUniqueId(fact.id, factIds, adjustments, 'hecho.id', `${factPath}.id`, 'Hecho invalido'),
      titulo: ensureRequiredString(fact.titulo, `Hecho ${factIndex + 1}`, adjustments, 'hecho.titulo', `${factPath}.titulo`, 'Se reemplazo por un titulo por defecto.'),
      cobertura: ensureEnum(fact.cobertura, COVERAGE_VALUES, DEFAULT_COVERAGE, adjustments, 'hecho.cobertura', `${factPath}.cobertura`),
      priority: ensureEnum(fact.priority, PRIORITIES, DEFAULT_PRIORITY, adjustments, 'hecho.priority', `${factPath}.priority`),
      descripcion: ensureOptionalString(fact.descripcion, adjustments, 'hecho.descripcion', `${factPath}.descripcion`),
    };
  });

  const documentos = documentosSource.map((item, documentIndex) => {
    const documentPath = `${flowPath}.documentos[${documentIndex}]`;
    const documento = isRecord(item) ? item : {};
    if (!isRecord(item)) {
      recordAdjustment(adjustments, 'documento', documentPath, item, '{}', 'El documento no era un objeto y se reemplazo por valores por defecto.');
    }

    return {
      id: ensureUniqueId(documento.id, documentIds, adjustments, 'documento.id', `${documentPath}.id`, 'Documento invalido'),
      nombre: ensureOptionalString(documento.nombre, adjustments, 'documento.nombre', `${documentPath}.nombre`),
      descripcion: ensureOptionalString(documento.descripcion, adjustments, 'documento.descripcion', `${documentPath}.descripcion`),
      parte: ensureOptionalEnum(documento.parte, DOCUMENT_PARTS, undefined, adjustments, 'documento.parte', `${documentPath}.parte`),
      tipo: ensureOptionalString(documento.tipo, adjustments, 'documento.tipo', `${documentPath}.tipo`),
      fecha: ensureOptionalString(documento.fecha, adjustments, 'documento.fecha', `${documentPath}.fecha`),
      referencia: ensureOptionalString(documento.referencia, adjustments, 'documento.referencia', `${documentPath}.referencia`),
      notas: ensureOptionalString(documento.notas, adjustments, 'documento.notas', `${documentPath}.notas`),
    };
  });

  const nodes = nodesSource.map((item, nodeIndex) => {
    const nodePath = `${flowPath}.nodes[${nodeIndex}]`;
    const node = isRecord(item) ? item : {};
    if (!isRecord(item)) {
      recordAdjustment(adjustments, 'node', nodePath, item, '{}', 'El nodo no era un objeto y se reemplazo por valores por defecto.');
    }

    const type = ensureEnum(node.type, NODE_KINDS, 'pregunta', adjustments, 'node.type', `${nodePath}.type`);
    const dataSource = isRecord(node.data) ? node.data : {};
    if (!isRecord(node.data)) {
      recordAdjustment(adjustments, 'node.data', `${nodePath}.data`, node.data, '{}', 'El data del nodo no era un objeto y se reemplazo por valores por defecto.');
    }
    if (dataSource.type !== type) {
      recordAdjustment(adjustments, 'node.data.type', `${nodePath}.data.type`, dataSource.type, type, 'Se ajusto para coincidir con el tipo real del nodo.');
    }

    const witnessId = ensureOptionalString(dataSource.witnessId, adjustments, 'node.data.witnessId', `${nodePath}.data.witnessId`);
    const factId = ensureOptionalString(dataSource.factId, adjustments, 'node.data.factId', `${nodePath}.data.factId`);
    const documentId = ensureOptionalString(dataSource.documentId, adjustments, 'node.data.documentId', `${nodePath}.data.documentId`);

    const safeWitnessId = witnessId && witnessIds.has(witnessId)
      ? witnessId
      : witnessId
        ? (recordAdjustment(adjustments, 'node.data.witnessId', `${nodePath}.data.witnessId`, witnessId, undefined, 'La referencia de testigo no existia y se elimino.'), undefined)
        : undefined;

    const safeFactId = factId && factIds.has(factId)
      ? factId
      : factId
        ? (recordAdjustment(adjustments, 'node.data.factId', `${nodePath}.data.factId`, factId, undefined, 'La referencia de hecho no existia y se elimino.'), undefined)
        : undefined;

    const safeDocumentId = documentId && documentIds.has(documentId)
      ? documentId
      : documentId
        ? (recordAdjustment(adjustments, 'node.data.documentId', `${nodePath}.data.documentId`, documentId, undefined, 'La referencia de documento no existia y se elimino.'), undefined)
        : undefined;

    return {
      id: ensureUniqueId(node.id, nodeIds, adjustments, 'node.id', `${nodePath}.id`, 'Nodo invalido'),
      type,
      position: normalizePosition(node.position, nodeIndex, adjustments, nodePath),
      data: {
        type,
        label: ensureRequiredString(dataSource.label, NODE_LABEL_BY_KIND[type], adjustments, 'node.data.label', `${nodePath}.data.label`, 'Se reemplazo por una etiqueta por defecto.'),
        witnessId: safeWitnessId,
        factId: safeFactId,
        documentId: safeDocumentId,
        notes: ensureOptionalString(dataSource.notes, adjustments, 'node.data.notes', `${nodePath}.data.notes`),
        texto: ensureOptionalString(dataSource.texto, adjustments, 'node.data.texto', `${nodePath}.data.texto`),
        finalidad: ensureOptionalString(dataSource.finalidad, adjustments, 'node.data.finalidad', `${nodePath}.data.finalidad`),
        expectedAnswer: ensureOptionalString(dataSource.expectedAnswer, adjustments, 'node.data.expectedAnswer', `${nodePath}.data.expectedAnswer`),
        dangerousAnswer: ensureOptionalString(dataSource.dangerousAnswer, adjustments, 'node.data.dangerousAnswer', `${nodePath}.data.dangerousAnswer`),
        followUpStrategy: ensureOptionalString(dataSource.followUpStrategy, adjustments, 'node.data.followUpStrategy', `${nodePath}.data.followUpStrategy`),
        questionStyle: ensureOptionalEnum(dataSource.questionStyle, QUESTION_STYLES, DEFAULT_QUESTION_STYLE, adjustments, 'node.data.questionStyle', `${nodePath}.data.questionStyle`),
        riskLevel: ensureOptionalEnum(dataSource.riskLevel, RISK_LEVELS, DEFAULT_RISK_LEVEL, adjustments, 'node.data.riskLevel', `${nodePath}.data.riskLevel`),
        priority: ensureOptionalEnum(dataSource.priority, PRIORITIES, DEFAULT_PRIORITY, adjustments, 'node.data.priority', `${nodePath}.data.priority`),
        severity: ensureOptionalEnum(dataSource.severity, RISK_LEVELS, DEFAULT_RISK_LEVEL, adjustments, 'node.data.severity', `${nodePath}.data.severity`),
        mitigation: ensureOptionalString(dataSource.mitigation, adjustments, 'node.data.mitigation', `${nodePath}.data.mitigation`),
        description: ensureOptionalString(dataSource.description, adjustments, 'node.data.description', `${nodePath}.data.description`),
        source: ensureOptionalString(dataSource.source, adjustments, 'node.data.source', `${nodePath}.data.source`),
        documentPart: ensureOptionalEnum(dataSource.documentPart, DOCUMENT_PARTS, undefined, adjustments, 'node.data.documentPart', `${nodePath}.data.documentPart`),
        documentType: ensureOptionalString(dataSource.documentType, adjustments, 'node.data.documentType', `${nodePath}.data.documentType`),
        documentDate: ensureOptionalString(dataSource.documentDate, adjustments, 'node.data.documentDate', `${nodePath}.data.documentDate`),
        documentReference: ensureOptionalString(dataSource.documentReference, adjustments, 'node.data.documentReference', `${nodePath}.data.documentReference`),
        coberturaNode: ensureOptionalEnum(dataSource.coberturaNode, COVERAGE_VALUES, DEFAULT_COVERAGE, adjustments, 'node.data.coberturaNode', `${nodePath}.data.coberturaNode`),
        askedInHearing: ensureOptionalBoolean(dataSource.askedInHearing, adjustments, 'node.data.askedInHearing', `${nodePath}.data.askedInHearing`),
        actualAnswer: ensureOptionalString(dataSource.actualAnswer, adjustments, 'node.data.actualAnswer', `${nodePath}.data.actualAnswer`),
        isSecondary: type === 'pregunta'
          ? ensureOptionalBoolean(dataSource.isSecondary, adjustments, 'node.data.isSecondary', `${nodePath}.data.isSecondary`, false)
          : ensureOptionalBoolean(dataSource.isSecondary, adjustments, 'node.data.isSecondary', `${nodePath}.data.isSecondary`),
      },
    };
  });

  const edges: Flujo['edges'] = [];

  edgesSource.forEach((item, edgeIndex) => {
      const edgePath = `${flowPath}.edges[${edgeIndex}]`;
      const edge = isRecord(item) ? item : {};
      if (!isRecord(item)) {
        recordAdjustment(adjustments, 'edge', edgePath, item, '{}', 'La conexion no era un objeto y se descarto.');
        return;
      }

      const sourceId = isString(edge.source) ? edge.source : undefined;
      const targetId = isString(edge.target) ? edge.target : undefined;
      if (!sourceId || !targetId || !nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
        recordAdjustment(
          adjustments,
          'edge.source-target',
          `${edgePath}.source|target`,
          { source: edge.source, target: edge.target },
          '(conexion descartada)',
          'La conexion apuntaba a nodos inexistentes y se elimino.',
        );
        return;
      }

      const data = isRecord(edge.data) ? edge.data : {};
      if (!isRecord(edge.data)) {
        recordAdjustment(adjustments, 'edge.data', `${edgePath}.data`, edge.data, '{}', 'El data de la conexion no era un objeto y se reemplazo por valores por defecto.');
      }

      edges.push({
        id: ensureUniqueId(edge.id, edgeIds, adjustments, 'edge.id', `${edgePath}.id`, 'Conexion invalida'),
        source: sourceId,
        target: targetId,
        sourceHandle: ensureOptionalStringOrNull(edge.sourceHandle, adjustments, 'edge.sourceHandle', `${edgePath}.sourceHandle`),
        targetHandle: ensureOptionalStringOrNull(edge.targetHandle, adjustments, 'edge.targetHandle', `${edgePath}.targetHandle`),
        data: {
          tipo: ensureEnum(data.tipo, EDGE_KINDS, 'sigue', adjustments, 'edge.data.tipo', `${edgePath}.data.tipo`),
          customLabel: ensureOptionalString(data.customLabel, adjustments, 'edge.data.customLabel', `${edgePath}.data.customLabel`),
          priority: ensureOptionalEnum(data.priority, PRIORITIES, DEFAULT_PRIORITY, adjustments, 'edge.data.priority', `${edgePath}.data.priority`),
        },
      });
    });

  const normalizedFlow = {
    id: ensureRequiredString(source.id, crypto.randomUUID(), adjustments, 'flujo.id', `${flowPath}.id`, 'Se reemplazo por un id de flujo por defecto.'),
    titulo: ensureRequiredString(source.titulo, `Flujo importado ${index + 1}`, adjustments, 'flujo.titulo', `${flowPath}.titulo`, 'Se reemplazo por un titulo de flujo por defecto.'),
    mode: ensureEnum(source.mode, SESSION_MODES, DEFAULT_FLOW_MODE, adjustments, 'flujo.mode', `${flowPath}.mode`),
    nodes,
    edges,
    testigos,
    hechos,
    documentos,
    createdAt: ensureRequiredString(source.createdAt, now, adjustments, 'flujo.createdAt', `${flowPath}.createdAt`, 'Se reemplazo por la fecha actual.'),
    updatedAt: ensureRequiredString(source.updatedAt, now, adjustments, 'flujo.updatedAt', `${flowPath}.updatedAt`, 'Se reemplazo por la fecha actual.'),
  };

  logFlowNormalizationSummary(flowPath, normalizedFlow, adjustments, adjustmentStartIndex);

  return normalizedFlow;
}

export function buildDbExport(flujos: Flujo[]): DbExportFile {
  return {
    app: DB_APP_ID,
    schemaVersion: DB_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    flujos,
  };
}

export function buildDbFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `testificales-${date}${DB_FILE_EXTENSION}`;
}

export function serializeDbExport(flujos: Flujo[]) {
  return JSON.stringify(buildDbExport(flujos), null, 2);
}

export function parseImportedDbFile(text: string): ParseImportedDbResult {
  let parsed: unknown;

  console.group('[import-json] parseImportedDbFile');

  try {
    parsed = JSON.parse(text);
  } catch {
    console.error('[import-json] JSON invalido: no se pudo parsear el texto.');
    console.groupEnd();
    throw new Error('El archivo JSON no es valido.');
  }

  try {
    assert(isRecord(parsed), 'El archivo JSON debe ser un objeto.');
    console.table([{
      app: summarizeValue(parsed.app),
      schemaVersion: summarizeValue(parsed.schemaVersion),
      exportedAt: summarizeValue(parsed.exportedAt),
      flujos: Array.isArray(parsed.flujos) ? parsed.flujos.length : '(no es array)',
    }]);

    assert(parsed.app === DB_APP_ID, 'El archivo JSON no pertenece a Testificales.');
    assert(parsed.schemaVersion === DB_SCHEMA_VERSION, 'La version del archivo JSON no es compatible.');
    assert(Array.isArray(parsed.flujos), 'El archivo JSON debe incluir un array flujos.');

    const adjustments: ImportAdjustment[] = [];
    const flujos = parsed.flujos.map((flujo, index) => normalizeFlow(flujo, index, adjustments));
    const groupedAdjustments = groupImportAdjustments(adjustments);
    const summary = buildImportDebugSummary(flujos);

    console.group('[import-json] resumen global');
    console.table([{
      flujos: summary.flujos,
      testigos: summary.testigos,
      hechos: summary.hechos,
      documentos: summary.documentos,
      nodes: summary.nodes,
      edges: summary.edges,
      preguntas: summary.nodeTypes.pregunta,
      riesgos: summary.nodeTypes.riesgo,
      nodosDocumento: summary.nodeTypes.documento,
      nodosHecho: summary.nodeTypes.hecho,
      temas: summary.nodeTypes.tema,
      cierres: summary.nodeTypes.cierre,
      ajustes: adjustments.length,
      gruposAjustes: groupedAdjustments.length,
    }]);

    if (groupedAdjustments.length > 0) {
      console.table(groupedAdjustments.map((group) => ({
        field: group.field,
        occurrences: group.occurrences,
        appliedValue: group.appliedValue,
        reason: group.reason,
        samplePaths: group.samplePaths.join(' | '),
      })));
    }

    console.groupEnd();
    console.groupEnd();

    return {
      flujos,
      adjustments,
      groupedAdjustments,
    };
  } catch (error) {
    console.error('[import-json] error durante parseo/normalizacion', error);
    console.groupEnd();
    throw error;
  }
}

export function cloneImportedFlowsAsNew(flujos: Flujo[]): Flujo[] {
  const importedAt = new Date().toISOString();

  return flujos.map((flujo) => ({
    ...flujo,
    id: crypto.randomUUID(),
    titulo: `${flujo.titulo} (importado)`,
    createdAt: importedAt,
    updatedAt: importedAt,
  }));
}

export function buildReferencePrompt() {
  return [
    '<ta rol="sistema">',
    'Convierte el texto plano que te voy a pasar en un JSON valido e importable por la aplicacion Testificales.',
    '</ta>',
    '',
    '<ta rol="objetivo">',
    'Tu unica tarea es devolver un JSON que pase la importacion de Testificales.',
    'Prioriza validez, consistencia interna y compatibilidad por encima de completar todos los detalles.',
    '</ta>',
    '',
    '<ta rol="salida-obligatoria">',
    'Devuelve solo JSON valido.',
    'No uses markdown.',
    'No escribas explicaciones antes ni despues.',
    'No anadas comentarios.',
    '</ta>',
    '',
    '<ta rol="estructura-raiz">',
    `La raiz debe ser exactamente un objeto con estas claves: "app", "schemaVersion", "exportedAt", "flujos".`,
    `"app" debe ser exactamente "${DB_APP_ID}".`,
    `"schemaVersion" debe ser exactamente ${DB_SCHEMA_VERSION}.`,
    '"flujos" debe ser un array.',
    '</ta>',
    '',
    '<ta rol="flujo-minimo">',
    'Cada elemento de "flujos" debe ser un objeto con estas claves como minimo:',
    '"id", "titulo", "mode", "nodes", "edges", "testigos", "hechos", "createdAt", "updatedAt".',
    'Puedes incluir "documentos" y es recomendable incluirlo como array aunque este vacio.',
    `"mode" solo puede ser: ${SESSION_MODES.join(' | ')}.`,
    '</ta>',
    '',
    '<ta rol="testigos">',
    'Cada testigo debe incluir como minimo:',
    '"id", "nombre", "parteQuePropone", "rolProcesal", "credibilidadEstimada", "color".',
    'Valores validos:',
    '- parteQuePropone: actora | demandada | tercero',
    '- rolProcesal: proponente | contrario',
    '</ta>',
    '',
    '<ta rol="hechos">',
    'Cada hecho debe incluir como minimo:',
    '"id", "titulo", "cobertura", "priority".',
    `"cobertura" solo puede ser: ${COVERAGE_VALUES.join(' | ')}.`,
    `"priority" solo puede ser: ${PRIORITIES.join(' | ')}.`,
    '</ta>',
    '',
    '<ta rol="nodos">',
    'Cada nodo debe incluir como minimo:',
    '"id", "type", "position", "data".',
    `"type" solo puede ser: ${NODE_KINDS.join(' | ')}.`,
    '"position" debe ser un objeto con "x" e "y" numericos.',
    '"data.type" debe existir y ser exactamente igual que "type".',
    '"data.label" debe existir y ser string.',
    '</ta>',
    '',
    '<ta rol="edges">',
    'Cada conexion debe incluir como minimo:',
    '"id", "source", "target", "data".',
    '"data.tipo" es obligatorio.',
    `"data.tipo" solo puede ser: ${EDGE_KINDS.join(' | ')}.`,
    'Si no hay relaciones claras, usa "edges": [].',
    '</ta>',
    '',
    '<ta rol="referencias">',
    'Si usas "witnessId" en un nodo, debe apuntar a un testigo existente del mismo flujo.',
    'Si usas "factId" en un nodo, debe apuntar a un hecho existente del mismo flujo.',
    'Si usas "documentId" en un nodo, debe apuntar a un documento existente del mismo flujo.',
    'Cada "source" y "target" de "edges" debe apuntar a nodos existentes del mismo flujo.',
    'No repitas ids dentro de nodos, edges, testigos, hechos o documentos del mismo flujo.',
    '</ta>',
    '',
    '<ta rol="campos-opcionales-seguros">',
    'Solo añade campos opcionales si ayudan y puedes inferirlos con suficiente claridad.',
    'Campos opcionales seguros:',
    '- flujo: documentos',
    '- testigo: cargo, puntosFuertes, puntosDebiles, contradiccionesConocidas, notasTacticas',
    '- hecho: descripcion',
    '- documento: nombre, descripcion, parte, tipo, fecha, referencia, notas',
    '- edge.data: customLabel, priority',
    '- nodo pregunta: texto, finalidad, expectedAnswer, dangerousAnswer, followUpStrategy, questionStyle, riskLevel, priority, witnessId, factId, notes, isSecondary',
    '- nodo riesgo: severity, mitigation',
    '- nodo documento: documentId, description, source, documentPart, documentType, documentDate, documentReference, notes',
    '- nodo hecho: coberturaNode, priority',
    '- nodo tema o cierre: notes',
    '</ta>',
    '',
    '<ta rol="defaults">',
    'Si faltan datos, usa estos valores por defecto para mantener el JSON importable:',
    '- flujo.mode: preparacion',
    '- testigo.parteQuePropone: actora',
    '- testigo.rolProcesal: proponente',
    '- testigo.credibilidadEstimada: Media',
    '- testigo.color: hsl(200 70% 58%)',
    '- hecho.cobertura: debil',
    '- hecho.priority: media',
    '- pregunta.questionStyle: abierta',
    '- pregunta.riskLevel: medio',
    '- pregunta.priority: media',
    '- riesgo.severity: medio',
    '- edge.data.priority: media',
    '- documentos: []',
    '- nodes: []',
    '- edges: []',
    '- testigos: []',
    '- hechos: []',
    '</ta>',
    '',
    '<ta rol="reglas-transformacion">',
    'Extrae testigos si el texto los identifica con claridad.',
    'Extrae hechos si el texto describe hechos a probar con claridad.',
    'Crea nodos de pregunta cuando haya preguntas utilizables.',
    'Crea nodos de tema, documento o riesgo solo cuando el texto lo soporte de forma clara.',
    'Si algo no esta claro, es mejor omitirlo que inventarlo.',
    'Si no puedes inferir relaciones fiables, deja "edges" vacio.',
    '</ta>',
    '',
    '<ta rol="posiciones">',
    'Todos los nodos deben tener posiciones numericas.',
    'Usa enteros.',
    'Evita que dos nodos tengan exactamente la misma posicion.',
    'Si hay varios nodos, separalos de forma razonable en una cuadricula simple.',
    '</ta>',
    '',
    '<ta rol="json-base">',
    '{',
    `  "app": "${DB_APP_ID}",`,
    `  "schemaVersion": ${DB_SCHEMA_VERSION},`,
    '  "exportedAt": "2026-04-21T12:00:00.000Z",',
    '  "flujos": [',
    '    {',
    '      "id": "uuid",',
    '      "titulo": "Titulo del flujo",',
    '      "mode": "preparacion",',
    '      "nodes": [],',
    '      "edges": [],',
    '      "testigos": [],',
    '      "hechos": [],',
    '      "documentos": [],',
    '      "createdAt": "2026-04-21T12:00:00.000Z",',
    '      "updatedAt": "2026-04-21T12:00:00.000Z"',
    '    }',
    '  ]',
    '}',
    '</ta>',
    '',
    '<ta rol="autoverificacion">',
    'Antes de responder, verifica mentalmente:',
    `1. app = "${DB_APP_ID}"`,
    `2. schemaVersion = ${DB_SCHEMA_VERSION}`,
    '3. flujos es un array',
    '4. cada flujo tiene los campos minimos',
    '5. todos los enums usan solo valores permitidos',
    '6. toda referencia witnessId, factId, documentId, source y target apunta a ids existentes',
    '7. la respuesta final es solo JSON parseable',
    '</ta>',
    '',
    '<ta rol="instruccion-final">',
    'Espera mi texto plano y devuelvelo transformado directamente al JSON final importable.',
    '</ta>',
  ].join('\n');
}

export function getReferenceEnums() {
  return {
    modes: SESSION_MODES,
    nodeKinds: NODE_KINDS,
    edgeKinds: EDGE_KINDS,
    coverageValues: COVERAGE_VALUES,
    questionStyles: QUESTION_STYLES,
    riskLevels: RISK_LEVELS,
    priorities: PRIORITIES,
  };
}

export function getReferenceNotes() {
  return [
    'El archivo importable es JSON propio de la app.',
    'Al importar, cada flujo se clona como un flujo nuevo para no tocar el flujo actual.',
    'Los nodos deben conservar referencias validas en edges.source y edges.target.',
    'witnessId y factId deben apuntar a ids existentes dentro del mismo flujo cuando se usen.',
    'documentId debe apuntar a ids existentes dentro del mismo flujo cuando se use.',
    'Si un campo opcional no aporta valor, puede omitirse.',
  ];
}

export function getReferenceOptionalFields() {
  return {
    flujo: ['documentos'],
    testigo: ['cargo', 'puntosFuertes', 'puntosDebiles', 'contradiccionesConocidas', 'notasTacticas'],
    hecho: ['descripcion'],
    documento: ['nombre', 'descripcion', 'parte', 'tipo', 'fecha', 'referencia', 'notas'],
    edge: ['sourceHandle', 'targetHandle', 'data.customLabel', 'data.priority'],
    nodeData: [
      'witnessId',
      'factId',
      'documentId',
      'notes',
      'texto',
      'finalidad',
      'expectedAnswer',
      'dangerousAnswer',
      'followUpStrategy',
      'questionStyle',
      'riskLevel',
      'priority',
      'severity',
      'mitigation',
      'description',
      'source',
      'documentPart',
      'documentType',
      'documentDate',
      'documentReference',
      'coberturaNode',
      'askedInHearing',
      'actualAnswer',
      'isSecondary',
    ],
  };
}

export function getReferenceExampleAsLines() {
  return JSON.stringify(buildDbExport([]), null, 2);
}

export function isJsonPromptSafeLines(value: unknown) {
  return isString(value) || isStringArray(value);
}

export function buildTemplateDbExport() {
  return buildDbExport([
    {
      id: crypto.randomUUID(),
      titulo: 'Plantilla de importacion',
      mode: 'preparacion',
      nodes: [],
      edges: [],
      testigos: [],
      hechos: [],
      documentos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
}

export function buildExampleDbExport() {
  return buildDbExport([
    {
      id: '2df8b0c2-2b74-4db0-931a-2be2f3b3b8e4',
      titulo: 'Contrainterrogatorio del testigo principal',
      mode: 'preparacion',
      createdAt: '2026-04-21T12:00:00.000Z',
      updatedAt: '2026-04-21T12:00:00.000Z',
      testigos: [
        {
          id: '7e3fa4bd-1c01-4a74-b863-8208c1e76d5f',
          nombre: 'Juan Perez',
          cargo: 'Jefe de obra',
          rolProcesal: 'contrario',
          parteQuePropone: 'demandada',
          credibilidadEstimada: 'Media - conocimiento directo de las obras',
          puntosFuertes: 'Conocimiento directo de los hechos',
          puntosDebiles: ' Puede tener interes en proteger a la empresa',
          contradiccionesConocidas: '',
          notasTacticas: 'Pedir cronologia precisa de autorizaciones',
          color: 'hsl(12 70% 58%)',
        },
        {
          id: '9fd7dff3-a351-4812-b535-5ab5474f6d5e',
          nombre: 'Marta Lopez',
          cargo: 'Administrativa',
          rolProcesal: 'proponente',
          parteQuePropone: 'actora',
          credibilidadEstimada: 'Alta - maneja documentacion',
          puntosFuertes: ' Acceso a registros y correos',
          puntosDebiles: '',
          contradiccionesConocidas: '',
          notasTacticas: 'Confirmar fechas de recepcion de documentos',
          color: 'hsl(210 70% 58%)',
        },
      ],
      hechos: [
        {
          id: 'f7c09035-4b30-40aa-85e3-b980cbc32fd2',
          titulo: 'La entrega se realizo fuera de plazo',
          descripcion: 'Debe acreditarse el retraso y su conocimiento previo.',
          cobertura: 'debil',
          priority: 'alta',
        },
        {
          id: '0678692b-9c0a-43ff-b8c3-4dba8e0bce33',
          titulo: 'La parte contraria conocia el incumplimiento',
          descripcion: 'Se apoya en correos previos a la fecha limite.',
          cobertura: 'cubierto',
          priority: 'alta',
        },
      ],
      documentos: [
        {
          id: '14ea4c51-334e-49b4-b779-3f5b1555e0f4',
          nombre: 'Contrato firmado',
          descripcion: 'Clausula de plazo de entrega.',
          parte: 'actora',
          tipo: 'contrato',
          fecha: '2025-01-10',
          referencia: 'Contrato de obra de 10/01/2025',
          notas: 'Usar para fijar la fecha comprometida.',
        },
      ],
      nodes: [
        {
          id: '59ae24ef-fc13-4f19-9dd8-eb8e14e2c9b2',
          type: 'tema',
          position: { x: 160, y: 80 },
          data: {
            type: 'tema',
            label: 'Cronologia del retraso',
            notes: 'Abrir con contexto y despues fijar fechas.',
          },
        },
        {
          id: '0c026f87-4a0f-456f-af5e-196b5417ece3',
          type: 'pregunta',
          position: { x: 160, y: 250 },
          data: {
            type: 'pregunta',
            label: 'Fecha de entrega prevista',
            witnessId: '7e3fa4bd-1c01-4a74-b863-8208c1e76d5f',
            factId: 'f7c09035-4b30-40aa-85e3-b980cbc32fd2',
            texto: 'La fecha prevista de entrega era el 15 de marzo, verdad?',
            finalidad: 'Fijar la fecha comprometida.',
            expectedAnswer: 'Si, esa era la fecha prevista.',
            dangerousAnswer: 'No lo recuerdo con exactitud.',
            followUpStrategy: 'Mostrar contrato o correo de confirmacion.',
            questionStyle: 'cerrada',
            riskLevel: 'medio',
            priority: 'alta',
            notes: 'No dejar espacio a explicaciones largas.',
            isSecondary: false,
          },
        },
        {
          id: '5515a9d6-c37b-4f54-886e-89afe7d66db7',
          type: 'documento',
          position: { x: 470, y: 250 },
          data: {
            type: 'documento',
            documentId: '14ea4c51-334e-49b4-b779-3f5b1555e0f4',
            label: 'Contrato firmado',
            description: 'Clausula de plazo de entrega.',
            source: 'Contrato de obra de 10/01/2025',
            notes: 'Usar para fijar la fecha comprometida.',
            documentPart: 'actora',
            documentType: 'contrato',
            documentDate: '2025-01-10',
            documentReference: 'Contrato de obra de 10/01/2025',
          },
        },
        {
          id: '7345cf06-c92c-45e4-8864-72d3625e7e89',
          type: 'pregunta',
          position: { x: 160, y: 430 },
          data: {
            type: 'pregunta',
            label: 'Correos de aviso',
            witnessId: '9fd7dff3-a351-4812-b535-5ab5474f6d5e',
            factId: '0678692b-9c0a-43ff-b8c3-4dba8e0bce33',
            texto: 'Recibio usted los correos en los que se advertia del retraso?',
            finalidad: 'Acreditar conocimiento del incumplimiento.',
            expectedAnswer: 'Si, se recibieron antes del vencimiento.',
            dangerousAnswer: 'No me consta personalmente.',
            followUpStrategy: 'Exhibir correo con acuse de recibo.',
            questionStyle: 'cerrada',
            riskLevel: 'medio',
            priority: 'alta',
          },
        },
        {
          id: '2910e62e-228f-4a11-b6d4-6db1f12d8ee3',
          type: 'riesgo',
          position: { x: 470, y: 430 },
          data: {
            type: 'riesgo',
            label: 'Alega falta de memoria',
            severity: 'medio',
            mitigation: 'Cerrar la pregunta y usar documentos de apoyo.',
          },
        },
      ],
      edges: [
        {
          id: 'ec048768-a186-4163-a1bb-417f5eddd062',
          source: '59ae24ef-fc13-4f19-9dd8-eb8e14e2c9b2',
          target: '0c026f87-4a0f-456f-af5e-196b5417ece3',
          data: {
            tipo: 'sigue',
            priority: 'media',
          },
        },
        {
          id: '7be30c8e-fec3-490d-89e5-f9df35ef38ca',
          source: '5515a9d6-c37b-4f54-886e-89afe7d66db7',
          target: '0c026f87-4a0f-456f-af5e-196b5417ece3',
          data: {
            tipo: 'conecta_documento',
            customLabel: 'Sostiene la pregunta',
            priority: 'alta',
          },
        },
        {
          id: 'cfe5076d-d4d0-4974-9e4e-74e17bc0f277',
          source: '59ae24ef-fc13-4f19-9dd8-eb8e14e2c9b2',
          target: '7345cf06-c92c-45e4-8864-72d3625e7e89',
          data: {
            tipo: 'sigue',
            priority: 'media',
          },
        },
        {
          id: '9f1538e0-a396-4b1f-a741-8eeb2625f4bb',
          source: '2910e62e-228f-4a11-b6d4-6db1f12d8ee3',
          target: '7345cf06-c92c-45e4-8864-72d3625e7e89',
          data: {
            tipo: 'conecta_riesgo',
            priority: 'media',
          },
        },
      ],
    },
  ]);
}
