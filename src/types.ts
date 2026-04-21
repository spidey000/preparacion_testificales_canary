import type { Edge, Node } from '@xyflow/react';

export type NodeKind = 'pregunta' | 'riesgo' | 'documento' | 'hecho' | 'tema' | 'cierre';
export type Cobertura = 'no-cubierto' | 'debil' | 'cubierto' | 'muy-cubierto';
export type QuestionStyle = 'abierta' | 'cerrada' | 'fijacion' | 'impugnacion' | 'cierre';
export type RiskLevel = 'bajo' | 'medio' | 'alto';
export type Priority = 'baja' | 'media' | 'alta';
export type SessionMode = 'preparacion' | 'audiencia';
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
  notas?: string;
  rolProcesal: 'proponente' | 'contrario';
  credibilidad: number;
  color: string;
}

export interface Hecho {
  id: string;
  titulo: string;
  descripcion?: string;
  cobertura: Cobertura;
  priority: Priority;
}

export type CustomNodeData = Record<string, unknown> & {
  type: NodeKind;
  label: string;
  witnessId?: string;
  factId?: string;
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
  description?: string;
  source?: string;
  coberturaNode?: Cobertura;
  askedInHearing?: boolean;
  actualAnswer?: string;
  isSecondary?: boolean;
};

export type CustomNode = Node<CustomNodeData, NodeKind>;
export type CustomEdgeData = Record<string, unknown> & {
  tipo: EdgeKind;
  customLabel?: string;
  priority?: Priority;
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
  createdAt: string;
  updatedAt: string;
}
