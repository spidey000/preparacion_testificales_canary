import type { Edge, Node } from '@xyflow/react';

export type NodeKind = 'pregunta' | 'riesgo' | 'documento' | 'hecho' | 'tema' | 'cierre';
export type Cobertura = 'no-cubierto' | 'debil' | 'cubierto' | 'muy-cubierto';
export type QuestionStyle = 'abierta' | 'cerrada' | 'fijacion' | 'impugnacion' | 'cierre';
export type RiskLevel = 'bajo' | 'medio' | 'alto';
export type Priority = 'baja' | 'media' | 'alta';
export type SessionMode = 'preparacion' | 'audiencia';
export type ParteDocumento = 'actora' | 'demandada' | 'ambas' | 'tercero';
export type EdgeKind =
  | 'sigue'
  | 'depende_de'
  | 'si_responde_si'
  | 'si_responde_no'
  | 'si_evita'
  | 'si_contradice'
  | 'refuerza'
  | 'contradice'
  | 'abre_alternativa'
  | 'conecta_documento'
  | 'conecta_hecho'
  | 'conecta_riesgo';

export interface Testigo {
  id: string;
  nombre: string;
  cargo?: string;
  rolProcesal: 'proponente' | 'contrario';
  parteQuePropone: 'actora' | 'demandada' | 'tercero';
  credibilidadEstimada?: string;
  puntosFuertes?: string;
  puntosDebiles?: string;
  contradiccionesConocidas?: string;
  notasTacticas?: string;
  color: string;
}

export interface Hecho {
  id: string;
  titulo: string;
  descripcion?: string;
  cobertura: Cobertura;
  priority: Priority;
  color: string;
}

export interface Documento {
  id: string;
  nombre?: string;
  descripcion?: string;
  parte?: ParteDocumento;
  tipo?: string;
  fecha?: string;
  referencia?: string;
  notas?: string;
}

export interface PreguntaRespuesta {
  id: string;
  texto: string;
}

export interface PreguntaBase {
  id: string;
  texto: string;
  witnessId?: string;
  factId?: string;
  topicLabel?: string;
  respuestas: PreguntaRespuesta[];
  notas?: string;
}

export type CustomNodeData = Record<string, unknown> & {
  type: NodeKind;
  label: string;
  witnessId?: string;
  factId?: string;
  sourceQuestionId?: string;
  topicLabel?: string;
  notes?: string;
  texto?: string;
  finalidad?: string;
  expectedAnswer?: string;
  dangerousAnswer?: string;
  followUpStrategy?: string;
  questionStyle?: QuestionStyle;
  riskLevel?: RiskLevel;
  priority?: Priority;
  severity?: RiskLevel;
  mitigation?: string;
  documentId?: string;
  description?: string;
  source?: string;
  documentPart?: ParteDocumento;
  documentType?: string;
  documentDate?: string;
  documentReference?: string;
  coberturaNode?: Cobertura;
  askedInHearing?: boolean;
  actualAnswer?: string;
  isSecondary?: boolean;
  answers?: PreguntaRespuesta[];
};

export type CustomNode = Node<CustomNodeData, NodeKind>;
export type EdgeLabelOffset = {
  x: number;
  y: number;
};

export type CustomEdgeData = Record<string, unknown> & {
  tipo: EdgeKind;
  customLabel?: string;
  priority?: Priority;
  sourceAnswerId?: string;
  sourceAnswerText?: string;
  labelOffset?: EdgeLabelOffset;
};

export type CustomEdge = Edge<CustomEdgeData>;

export interface Flujo {
  id: string;
  titulo: string;
  mode: SessionMode;
  nodes: CustomNode[];
  edges: CustomEdge[];
  testigos: Testigo[];
  hechos: Hecho[];
  documentos?: Documento[];
  preguntas?: PreguntaBase[];
  createdAt: string;
  updatedAt: string;
}

export interface FlowSummary {
  id: string;
  titulo: string;
  mode: SessionMode;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastSnapshotAt?: string;
}

export interface FlowSnapshotSummary {
  id: string;
  flowId: string;
  createdAt: string;
  snapshotVersion: number;
}
