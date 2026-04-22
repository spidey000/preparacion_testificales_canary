import { MarkerType } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { CustomEdge, EdgeKind, NodeKind, Priority } from './types';

export const EDGE_KIND_LABELS: Record<EdgeKind, string> = {
  sigue: 'Sigue',
  depende_de: 'Depende de',
  si_responde_si: 'Si responde si',
  si_responde_no: 'Si responde no',
  si_evita: 'Si evita',
  si_contradice: 'Si contradice',
  refuerza: 'Refuerza',
  contradice: 'Contradice',
  abre_alternativa: 'Abre alternativa',
  conecta_documento: 'Conecta documento',
  conecta_hecho: 'Conecta hecho',
  conecta_riesgo: 'Conecta riesgo',
};

const EDGE_KIND_STYLES: Record<EdgeKind, { stroke: string; dash?: boolean; animated?: boolean }> = {
  sigue: { stroke: '#71717a' },
  depende_de: { stroke: '#a1a1aa', dash: true },
  si_responde_si: { stroke: '#22c55e', animated: true },
  si_responde_no: { stroke: '#f97316', animated: true },
  si_evita: { stroke: '#f59e0b', dash: true },
  si_contradice: { stroke: '#ef4444', animated: true },
  refuerza: { stroke: '#3b82f6' },
  contradice: { stroke: '#dc2626' },
  abre_alternativa: { stroke: '#8b5cf6', dash: true },
  conecta_documento: { stroke: '#f59e0b' },
  conecta_hecho: { stroke: '#38bdf8' },
  conecta_riesgo: { stroke: '#fb7185' },
};

export function getAllowedEdgeKinds(sourceType?: NodeKind, targetType?: NodeKind): EdgeKind[] {
  if (!sourceType || !targetType) return ['sigue'];

  if (targetType === 'documento') return ['conecta_documento', 'refuerza', 'contradice'];
  if (targetType === 'hecho') return ['conecta_hecho', 'refuerza', 'contradice'];
  if (targetType === 'riesgo') return ['conecta_riesgo', 'depende_de'];

  if (sourceType === 'pregunta' && targetType === 'pregunta') {
    return ['sigue', 'depende_de', 'si_responde_si', 'si_responde_no', 'si_evita', 'si_contradice', 'abre_alternativa'];
  }

  if (sourceType === 'documento' && targetType === 'pregunta') return ['refuerza', 'contradice', 'depende_de'];
  if (sourceType === 'hecho' && targetType === 'pregunta') return ['depende_de', 'refuerza', 'contradice'];
  if (sourceType === 'riesgo' && targetType === 'pregunta') return ['depende_de', 'abre_alternativa'];

  if (sourceType === 'tema') return ['sigue', 'depende_de', 'abre_alternativa'];
  if (sourceType === 'cierre') return ['sigue'];

  return ['sigue', 'depende_de', 'abre_alternativa'];
}

export function inferEdgeKind(sourceType?: NodeKind, targetType?: NodeKind): EdgeKind {
  return getAllowedEdgeKinds(sourceType, targetType)[0];
}

export function getEdgeKindLabel(kind: EdgeKind) {
  return EDGE_KIND_LABELS[kind];
}

export function decorateEdge(edge: CustomEdge): CustomEdge {
  const tipo = edge.data?.tipo ?? 'sigue';
  const customLabel = typeof edge.data?.customLabel === 'string' ? edge.data.customLabel.trim() : '';
  const sourceAnswerText = typeof edge.data?.sourceAnswerText === 'string' ? edge.data.sourceAnswerText.trim() : '';
  const autoAnswerLabel = sourceAnswerText ? `${getEdgeKindLabel(tipo)}\nRespuesta: ${sourceAnswerText}` : '';
  const label = customLabel.length > 0 ? customLabel : autoAnswerLabel || getEdgeKindLabel(tipo);
  const visual = EDGE_KIND_STYLES[tipo];
  const style: CSSProperties = {
    stroke: visual.stroke,
    strokeWidth: 2.2,
    ...(visual.dash ? { strokeDasharray: '6 4' } : {}),
  };

  return {
    ...edge,
    type: 'labeled',
    label,
    animated: visual.animated ?? false,
    style,
    labelStyle: {
      fill: autoAnswerLabel ? '#facc15' : '#d4d4d8',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'pre-line',
      textAlign: 'center',
    },
    labelBgStyle: { fill: '#18181b', opacity: 0.92 },
    labelBgPadding: [8, 4],
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: visual.stroke,
      width: 18,
      height: 18,
    },
    data: {
      ...edge.data,
      tipo,
      customLabel: customLabel || undefined,
      priority: (edge.data?.priority as Priority | undefined) ?? 'media',
      sourceAnswerId: typeof edge.data?.sourceAnswerId === 'string' ? edge.data.sourceAnswerId : undefined,
      sourceAnswerText: sourceAnswerText || undefined,
    },
  };
}
