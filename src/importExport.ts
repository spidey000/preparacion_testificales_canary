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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEnum<T extends string>(value: unknown, allowed: T[], message: string): asserts value is T {
  assert(isString(value) && allowed.includes(value as T), message);
}

function assertUniqueId(idSet: Set<string>, id: string, message: string) {
  assert(!idSet.has(id), message);
  idSet.add(id);
}

function validateNodeData(node: Record<string, unknown>, index: number) {
  const data = node.data;
  assert(isRecord(data), `El nodo ${index + 1} debe incluir un objeto data.`);
  assertEnum(node.type, NODE_KINDS, `El nodo ${index + 1} tiene un tipo invalido.`);
  assert(data.type === node.type, `El nodo ${index + 1} debe tener data.type igual a type.`);
  assert(isString(data.label), `El nodo ${index + 1} debe incluir data.label.`);

  if (data.questionStyle !== undefined) {
    assertEnum(data.questionStyle, QUESTION_STYLES, `El nodo ${index + 1} tiene questionStyle invalido.`);
  }

  if (data.riskLevel !== undefined) {
    assertEnum(data.riskLevel, RISK_LEVELS, `El nodo ${index + 1} tiene riskLevel invalido.`);
  }

  if (data.priority !== undefined) {
    assertEnum(data.priority, PRIORITIES, `El nodo ${index + 1} tiene priority invalido.`);
  }

  if (data.severity !== undefined) {
    assertEnum(data.severity, RISK_LEVELS, `El nodo ${index + 1} tiene severity invalido.`);
  }

  if (data.coberturaNode !== undefined) {
    assertEnum(data.coberturaNode, COVERAGE_VALUES, `El nodo ${index + 1} tiene coberturaNode invalido.`);
  }

  if (data.documentPart !== undefined) {
    assertEnum(data.documentPart, DOCUMENT_PARTS, `El nodo ${index + 1} tiene documentPart invalido.`);
  }

  if (data.witnessId !== undefined) {
    assert(isString(data.witnessId), `El nodo ${index + 1} tiene witnessId invalido.`);
  }

  if (data.factId !== undefined) {
    assert(isString(data.factId), `El nodo ${index + 1} tiene factId invalido.`);
  }

  if (data.documentId !== undefined) {
    assert(isString(data.documentId), `El nodo ${index + 1} tiene documentId invalido.`);
  }
}

function validateFlowRecord(flujo: unknown, index: number): asserts flujo is Flujo {
  assert(isRecord(flujo), `El flujo ${index + 1} debe ser un objeto.`);
  assert(isString(flujo.id), `El flujo ${index + 1} debe incluir id.`);
  assert(isString(flujo.titulo), `El flujo ${index + 1} debe incluir titulo.`);
  assertEnum(flujo.mode, SESSION_MODES, `El flujo ${index + 1} tiene mode invalido.`);
  assert(Array.isArray(flujo.nodes), `El flujo ${index + 1} debe incluir nodes.`);
  assert(Array.isArray(flujo.edges), `El flujo ${index + 1} debe incluir edges.`);
  assert(Array.isArray(flujo.testigos), `El flujo ${index + 1} debe incluir testigos.`);
  assert(Array.isArray(flujo.hechos), `El flujo ${index + 1} debe incluir hechos.`);
  if (flujo.documentos !== undefined) {
    assert(Array.isArray(flujo.documentos), `El flujo ${index + 1} debe incluir documentos como array.`);
  }
  assert(isString(flujo.createdAt), `El flujo ${index + 1} debe incluir createdAt.`);
  assert(isString(flujo.updatedAt), `El flujo ${index + 1} debe incluir updatedAt.`);

  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const witnessIds = new Set<string>();
  const factIds = new Set<string>();
  const documentIds = new Set<string>();

  flujo.nodes.forEach((node, nodeIndex) => {
    assert(isRecord(node), `El nodo ${nodeIndex + 1} del flujo ${index + 1} debe ser un objeto.`);
    assert(isString(node.id), `El nodo ${nodeIndex + 1} del flujo ${index + 1} debe incluir id.`);
    assertUniqueId(nodeIds, node.id, `El nodo ${nodeIndex + 1} del flujo ${index + 1} repite un id.`);
    assert(isRecord(node.position), `El nodo ${nodeIndex + 1} del flujo ${index + 1} debe incluir position.`);
    assert(typeof node.position.x === 'number' && typeof node.position.y === 'number', `El nodo ${nodeIndex + 1} del flujo ${index + 1} debe incluir position.x e position.y numericos.`);
    validateNodeData(node, nodeIndex);
  });

  flujo.edges.forEach((edge, edgeIndex) => {
    assert(isRecord(edge), `La conexion ${edgeIndex + 1} del flujo ${index + 1} debe ser un objeto.`);
    assert(isString(edge.id), `La conexion ${edgeIndex + 1} del flujo ${index + 1} debe incluir id.`);
    assertUniqueId(edgeIds, edge.id, `La conexion ${edgeIndex + 1} del flujo ${index + 1} repite un id.`);
    assert(isString(edge.source), `La conexion ${edgeIndex + 1} del flujo ${index + 1} debe incluir source.`);
    assert(isString(edge.target), `La conexion ${edgeIndex + 1} del flujo ${index + 1} debe incluir target.`);
    assert(nodeIds.has(edge.source), `La conexion ${edgeIndex + 1} del flujo ${index + 1} apunta a source inexistente.`);
    assert(nodeIds.has(edge.target), `La conexion ${edgeIndex + 1} del flujo ${index + 1} apunta a target inexistente.`);
    assert(isRecord(edge.data), `La conexion ${edgeIndex + 1} del flujo ${index + 1} debe incluir data.`);
    assertEnum(edge.data.tipo, EDGE_KINDS, `La conexion ${edgeIndex + 1} del flujo ${index + 1} tiene tipo invalido.`);
    if (edge.data.priority !== undefined) {
      assertEnum(edge.data.priority, PRIORITIES, `La conexion ${edgeIndex + 1} del flujo ${index + 1} tiene priority invalido.`);
    }
  });

  flujo.testigos.forEach((testigo, witnessIndex) => {
    assert(isRecord(testigo), `El testigo ${witnessIndex + 1} del flujo ${index + 1} debe ser un objeto.`);
    assert(isString(testigo.id), `El testigo ${witnessIndex + 1} del flujo ${index + 1} debe incluir id.`);
    assertUniqueId(witnessIds, testigo.id, `El testigo ${witnessIndex + 1} del flujo ${index + 1} repite un id.`);
    assert(isString(testigo.nombre), `El testigo ${witnessIndex + 1} del flujo ${index + 1} debe incluir nombre.`);
    assertEnum(testigo.parteQuePropone, ['actora', 'demandada', 'tercero'], `El testigo ${witnessIndex + 1} del flujo ${index + 1} tiene parteQuePropone invalida.`);
    assert(isString(testigo.color), `El testigo ${witnessIndex + 1} del flujo ${index + 1} debe incluir color.`);
    assert(isString(testigo.credibilidadEstimada), `El testigo ${witnessIndex + 1} del flujo ${index + 1} debe incluir credibilidadEstimada.`);
    assertEnum(testigo.rolProcesal, ['proponente', 'contrario'], `El testigo ${witnessIndex + 1} del flujo ${index + 1} tiene rolProcesal invalido.`);
  });

  flujo.hechos.forEach((hecho, factIndex) => {
    assert(isRecord(hecho), `El hecho ${factIndex + 1} del flujo ${index + 1} debe ser un objeto.`);
    assert(isString(hecho.id), `El hecho ${factIndex + 1} del flujo ${index + 1} debe incluir id.`);
    assertUniqueId(factIds, hecho.id, `El hecho ${factIndex + 1} del flujo ${index + 1} repite un id.`);
    assert(isString(hecho.titulo), `El hecho ${factIndex + 1} del flujo ${index + 1} debe incluir titulo.`);
    assertEnum(hecho.cobertura, COVERAGE_VALUES, `El hecho ${factIndex + 1} del flujo ${index + 1} tiene cobertura invalida.`);
    assertEnum(hecho.priority, PRIORITIES, `El hecho ${factIndex + 1} del flujo ${index + 1} tiene priority invalida.`);
  });

  flujo.documentos?.forEach((documento, documentIndex) => {
    assert(isRecord(documento), `El documento ${documentIndex + 1} del flujo ${index + 1} debe ser un objeto.`);
    assert(isString(documento.id), `El documento ${documentIndex + 1} del flujo ${index + 1} debe incluir id.`);
    assertUniqueId(documentIds, documento.id, `El documento ${documentIndex + 1} del flujo ${index + 1} repite un id.`);
    if (documento.parte !== undefined) {
      assertEnum(documento.parte, DOCUMENT_PARTS, `El documento ${documentIndex + 1} del flujo ${index + 1} tiene parte invalida.`);
    }
  });

  flujo.nodes.forEach((node, nodeIndex) => {
    if (!isRecord(node.data)) return;

    if (node.data.witnessId !== undefined) {
      assert(witnessIds.has(node.data.witnessId as string), `El nodo ${nodeIndex + 1} del flujo ${index + 1} usa witnessId inexistente.`);
    }

    if (node.data.factId !== undefined) {
      assert(factIds.has(node.data.factId as string), `El nodo ${nodeIndex + 1} del flujo ${index + 1} usa factId inexistente.`);
    }

    if (node.data.documentId !== undefined) {
      assert(documentIds.has(node.data.documentId as string), `El nodo ${nodeIndex + 1} del flujo ${index + 1} usa documentId inexistente.`);
    }
  });
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

export function parseImportedDbFile(text: string): Flujo[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo JSON no es valido.');
  }

  assert(isRecord(parsed), 'El archivo JSON debe ser un objeto.');
  assert(parsed.app === DB_APP_ID, 'El archivo JSON no pertenece a Testificales.');
  assert(parsed.schemaVersion === DB_SCHEMA_VERSION, 'La version del archivo JSON no es compatible.');
  assert(Array.isArray(parsed.flujos), 'El archivo JSON debe incluir un array flujos.');

  const flujos = [...parsed.flujos] as Array<Record<string, unknown>>;
  flujos.forEach((flujo, index) => {
    validateFlowRecord(flujo as never, index);
  });

  return flujos as never;
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
    'Convierte el texto plano que te voy a pasar en un archivo JSON valido para la aplicacion Testificales.',
    '',
    'Objetivo:',
    'Transformar notas o texto libre que contengan testigos, hechos, preguntas, temas, riesgos, documentos y estrategia en una base de datos importable por la app.',
    '',
    'Entrada esperada:',
    '- texto plano sin estructura fija',
    '- puede incluir bloques de testigos, hechos a probar, preguntas, documentos, riesgos y notas estrategicas',
    '- puede incluir preguntas agrupadas por testigo o por hecho',
    '',
    'Instrucciones de transformacion:',
    '- extrae todos los testigos identificables y crea entradas en testigos',
    '- extrae todos los hechos a probar identificables y crea entradas en hechos',
    '- convierte cada pregunta util en un nodo de tipo pregunta',
    '- crea nodos de tipo tema cuando existan bloques narrativos o temas de examen',
    '- crea nodos de tipo documento cuando se mencionen contratos, correos, informes u otras evidencias',
    '- crea nodos de tipo riesgo cuando aparezcan objeciones, evasivas, contradicciones o riesgos tacticos',
    '- vincula cada pregunta con witnessId cuando se pueda inferir el testigo',
    '- vincula cada pregunta con factId cuando se pueda inferir el hecho a probar',
    '- usa conexiones logicas entre tema y pregunta, hecho y pregunta, documento y pregunta, o riesgo y pregunta cuando proceda',
    '- si una pregunta depende claramente de otra, conecta ambas con sigue o depende_de segun corresponda',
    '- si aparece una posible respuesta evasiva, contradiccion o peligro, crea un nodo riesgo y conectalo con conecta_riesgo',
    '- si aparece un documento que respalda una pregunta o un hecho, crea un nodo documento y conectalo con conecta_documento o conecta_hecho',
    '- si faltan datos, completa solo lo minimo necesario para que el archivo sea valido, sin inventar estrategia compleja no respaldada por el texto',
    '- distribuye los nodos con posiciones x e y numericas razonables para que no se superpongan por completo',
    '- si el texto permite varias agrupaciones, prioriza esta jerarquia: tema -> pregunta -> riesgo o documento',
    '',
    'Salida obligatoria:',
    '- devuelve solo JSON valido',
    '- no uses markdown',
    '- no incluyas comentarios',
    '- no anadas explicaciones antes ni despues del JSON',
    '',
    `Estructura raiz exacta: { "app": "${DB_APP_ID}", "schemaVersion": ${DB_SCHEMA_VERSION}, "exportedAt": "fecha ISO", "flujos": [ ... ] }`,
    '',
    'Esqueleto minimo exacto que debes respetar:',
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
    '',
    'Cada flujo debe incluir obligatoriamente:',
    '- id',
    '- titulo',
    '- mode',
    '- nodes',
    '- edges',
    '- testigos',
    '- hechos',
    '- documentos',
    '- createdAt',
    '- updatedAt',
    '',
    'Cada testigo debe incluir obligatoriamente:',
    '- id',
    '- nombre',
    '- parteQuePropone',
    '- rolProcesal',
    '- credibilidadEstimada',
    '- color',
    '',
    'Cada hecho debe incluir obligatoriamente:',
    '- id',
    '- titulo',
    '- cobertura',
    '- priority',
    '',
    'Cada documento de base debe incluir obligatoriamente:',
    '- id',
    '',
    'Cada nodo debe incluir obligatoriamente:',
    '- id',
    '- type',
    '- position con x e y numericos',
    '- data',
    '- data.type igual que type',
    '- data.label',
    '',
    'Cada conexion debe incluir obligatoriamente:',
    '- id',
    '- source',
    '- target',
    '- data.tipo',
    '',
    'Campos recomendados por tipo de nodo:',
    '- pregunta: data.texto, data.finalidad, data.expectedAnswer, data.dangerousAnswer, data.followUpStrategy, data.questionStyle, data.riskLevel, data.priority, data.witnessId, data.factId',
    '- tema: data.notes',
    '- documento: data.documentId, data.description, data.source, data.documentPart, data.documentType, data.documentDate, data.documentReference',
    '- riesgo: data.severity, data.mitigation',
    '- hecho: data.coberturaNode, data.priority',
    '- cierre: data.notes',
    '',
    'Enums validos:',
    `- mode: ${SESSION_MODES.join(' | ')}`,
    `- NodeKind: ${NODE_KINDS.join(' | ')}`,
    `- EdgeKind: ${EDGE_KINDS.join(' | ')}`,
    `- Cobertura: ${COVERAGE_VALUES.join(' | ')}`,
    `- QuestionStyle: ${QUESTION_STYLES.join(' | ')}`,
    `- RiskLevel: ${RISK_LEVELS.join(' | ')}`,
    `- Priority: ${PRIORITIES.join(' | ')}`,
    `- ParteDocumento: ${DOCUMENT_PARTS.join(' | ')}`,
    '',
    'Valores por defecto cuando no se puedan inferir del texto:',
    '- flujo.mode: preparacion',
    '- testigo.parteQuePropone: actora',
    '- testigo.rolProcesal: proponente',
    '- testigo.credibilidadEstimada: "Media"',
    '- testigo.color: usa una cadena tipo hsl(200 70% 58%)',
    '- hecho.cobertura: debil',
    '- hecho.priority: media',
    '- pregunta.questionStyle: abierta',
    '- pregunta.riskLevel: medio',
    '- pregunta.priority: media',
    '- riesgo.severity: medio',
    '- edge.data.priority: media',
    '',
    'Reglas de ids y consistencia:',
    '- usa UUIDs unicos en todos los ids',
    '- witnessId debe apuntar a un testigo existente del mismo flujo cuando exista',
    '- factId debe apuntar a un hecho existente del mismo flujo cuando exista',
    '- documentId debe apuntar a un documento existente del mismo flujo cuando exista',
    '- source y target de cada conexion deben apuntar a nodos existentes del mismo flujo',
    '- data.label debe ser un resumen corto legible del nodo',
    '- data.texto puede ser mas largo que data.label en nodos de pregunta',
    '- no repitas ids entre testigos, hechos, nodos ni conexiones',
    '- si no hay informacion suficiente para crear edges, devuelve edges vacio antes que inventar relaciones falsas',
    '',
    'Reglas de posicionamiento sugeridas para los nodos:',
    '- usa numeros enteros',
    '- separa nodos horizontalmente en columnas de 260 a 320 pixeles',
    '- separa nodos verticalmente en filas de 140 a 220 pixeles',
    '- evita colocar dos nodos exactamente en la misma posicion',
    '',
    'Como inferir el titulo del flujo:',
    '- si el texto menciona un testigo principal, usa un titulo como "Interrogatorio de [Nombre]" o "Contrainterrogatorio de [Nombre]"',
    '- si el texto trata varios testigos o varios hechos, usa un titulo global breve y descriptivo',
    '',
    'Comprobacion final antes de responder:',
    '- verifica que el JSON sea parseable',
    '- verifica que app sea testificales',
    `- verifica que schemaVersion sea ${DB_SCHEMA_VERSION}`,
    '- verifica que flujos sea un array',
    '- verifica que todos los enums usen exactamente los valores permitidos',
    '',
    'Ahora espera mi texto plano y transformalo directamente al JSON final.',
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
