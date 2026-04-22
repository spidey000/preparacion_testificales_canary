import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react';
import { create } from 'zustand';
import { buildRandomAccentColor, buildUniqueFactColor, normalizeColorValue } from './colorUtils';
import { getDocumentLabel } from './documentUtils';
import { decorateEdge, getEdgeKindLabel, inferEdgeKind } from './edgeRules';
import { deleteFlowById, getFlowById, getFlowSnapshot, listFlowSummariesByUpdatedAt, saveFlow, saveFlows } from './flowRepository';
import { cloneImportedFlowsAsNew } from './importExport';
import type { CustomEdge, CustomEdgeData, CustomNode, CustomNodeData, Documento, FlowSummary, Flujo, Hecho, NodeKind, PreguntaBase, PreguntaRespuesta, SessionMode, Testigo } from './types';

type SaveState = 'idle' | 'saving' | 'saved';

function normalizeWitnessColor(color: string | undefined, fallback = buildRandomAccentColor()) {
  return normalizeColorValue(color, fallback);
}

function normalizeFactColor(color: string | undefined, hechos: Hecho[], currentFactId?: string) {
  return buildUniqueFactColor(
    hechos.filter((hecho) => hecho.id !== currentFactId).map((hecho) => hecho.color),
    normalizeColorValue(color, buildRandomAccentColor()),
  );
}

function normalizeFacts(hechos: Hecho[] | undefined) {
  if (!hechos?.length) return [];

  const usedColors: string[] = [];
  return hechos.map((hecho) => {
    const color = buildUniqueFactColor(usedColors, hecho.color);
    usedColors.push(color);
    return { ...hecho, color };
  });
}

const createBaseFlow = (titulo: string): Flujo => ({
  id: crypto.randomUUID(),
  titulo,
  mode: 'preparacion',
  nodes: [],
  edges: [],
  testigos: [],
  hechos: [],
  documentos: [],
  preguntas: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function buildQuestionNodeLabel(texto: string) {
  const trimmed = texto.trim();
  if (!trimmed) return 'Nueva pregunta';
  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
}

function getAnswerHandleId(answerId: string) {
  return `answer:${answerId}`;
}

function parseAnswerHandleId(handleId?: string | null) {
  if (!handleId?.startsWith('answer:')) return undefined;
  const answerId = handleId.slice('answer:'.length).trim();
  return answerId || undefined;
}

function sanitizeAnswers(answers: PreguntaRespuesta[] | undefined): PreguntaRespuesta[] {
  if (!answers?.length) return [];

  return answers
    .map((answer) => ({
      id: answer.id || crypto.randomUUID(),
      texto: answer.texto ?? '',
    }))
    .filter((answer) => answer.texto.trim().length > 0);
}

function syncQuestionNodeEdges(nodeId: string, nextAnswers: PreguntaRespuesta[], edges: CustomEdge[]) {
  const answersById = new Map(nextAnswers.map((answer) => [answer.id, answer]));

  return edges.reduce<CustomEdge[]>((acc, edge) => {
    if (edge.source !== nodeId || !edge.data?.sourceAnswerId) {
      acc.push(edge);
      return acc;
    }

    const answer = answersById.get(edge.data.sourceAnswerId);
    if (!answer) return acc;

    acc.push(decorateEdge({
      ...edge,
      sourceHandle: getAnswerHandleId(answer.id),
      data: {
        ...edge.data,
        sourceAnswerId: answer.id,
        sourceAnswerText: answer.texto,
        customLabel: edge.data.customLabel,
      },
    }));
    return acc;
  }, []);
}

const defaultNodeData = (type: NodeKind): CustomNodeData => {
  switch (type) {
    case 'pregunta':
      return {
        type,
        label: 'Nueva pregunta',
        texto: '',
        finalidad: '',
        expectedAnswer: '',
        dangerousAnswer: '',
        followUpStrategy: '',
        questionStyle: 'abierta',
        riskLevel: 'medio',
        priority: 'media',
        topicLabel: '',
        isSecondary: false,
        answers: [],
      };
    case 'riesgo':
      return { type, label: 'Nuevo riesgo', severity: 'medio', mitigation: '' };
    case 'documento':
      return {
        type,
        label: 'Nuevo documento',
        description: '',
        source: '',
        documentType: '',
        documentDate: '',
        documentReference: '',
      };
    case 'hecho':
      return { type, label: 'Nuevo hecho', coberturaNode: 'debil', priority: 'media' };
    case 'tema':
      return { type, label: 'Nuevo tema', notes: '' };
    case 'cierre':
      return { type, label: 'Nuevo cierre', notes: '' };
  }
};

interface Store {
  flujos: FlowSummary[];
  flujoActualId: string | null;
  nodes: CustomNode[];
  edges: CustomEdge[];
  testigos: Testigo[];
  hechos: Hecho[];
  documentos: Documento[];
  preguntas: PreguntaBase[];
  viewportCenter: { x: number; y: number };
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  saveState: SaveState;
  loadFlujos: () => Promise<void>;
  crearFlujo: (titulo?: string) => Promise<void>;
  eliminarFlujo: (id: string) => Promise<void>;
  seleccionarFlujo: (id: string) => Promise<void>;
  renombrarFlujo: (titulo: string) => Promise<void>;
  guardarFlujo: () => Promise<void>;
  marcarGuardado: () => void;
  setViewportCenter: (center: { x: number; y: number }) => void;
  applyNodesChanges: (changes: NodeChange<CustomNode>[]) => void;
  applyEdgesChanges: (changes: EdgeChange<CustomEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  crearNodo: (type: NodeKind) => void;
  updateNode: (id: string, data: Partial<CustomNodeData>) => void;
  eliminarNodo: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  updateEdge: (id: string, data: Partial<CustomEdgeData>) => void;
  eliminarEdge: (id: string) => void;
  agregarTestigo: (payload: Omit<Testigo, 'id' | 'color'> & { color?: string }) => void;
  updateTestigo: (id: string, data: Partial<Testigo>) => void;
  eliminarTestigo: (id: string) => void;
  agregarHecho: (payload: Omit<Hecho, 'id'>) => void;
  updateHecho: (id: string, data: Partial<Hecho>) => void;
  eliminarHecho: (id: string) => void;
  agregarDocumento: (payload?: Partial<Documento>) => void;
  updateDocumento: (id: string, data: Partial<Documento>) => void;
  eliminarDocumento: (id: string) => void;
  agregarPregunta: (payload: Omit<PreguntaBase, 'id'>) => void;
  updatePregunta: (id: string, data: Partial<Omit<PreguntaBase, 'id'>>) => void;
  eliminarPregunta: (id: string) => void;
  importarPreguntas: (preguntas: Omit<PreguntaBase, 'id'>[]) => { imported: number; unresolvedWitnesses: number; unresolvedFacts: number };
  crearNodoPreguntaDesdeBanco: (preguntaId: string) => void;
  deleteConfirm: { type: 'testigo' | 'hecho' | 'documento' | 'pregunta'; id: string; label: string } | null;
  setDeleteConfirm: (value: { type: 'testigo' | 'hecho' | 'documento' | 'pregunta'; id: string; label: string } | null) => void;
  setMode: (mode: SessionMode) => Promise<void>;
  importarFlujos: (flujos: Flujo[]) => Promise<number>;
  restaurarSnapshot: (snapshotId: string) => Promise<boolean>;
}

function normalizeEdges(edges: CustomEdge[] | undefined, nodes: CustomNode[]): CustomEdge[] {
  if (!edges?.length) return [];

  return edges.map((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);
    const tipo = edge.data?.tipo ?? inferEdgeKind(sourceNode?.type, targetNode?.type);
    const defaultLabel = getEdgeKindLabel(tipo);
    const legacyLabel = typeof edge.data?.label === 'string' ? edge.data.label.trim() : '';
    const customLabel = typeof edge.data?.customLabel === 'string'
      ? edge.data.customLabel.trim()
      : legacyLabel && legacyLabel !== defaultLabel
        ? legacyLabel
        : undefined;

    return decorateEdge({
      ...edge,
      data: {
        ...edge.data,
        tipo,
        customLabel,
        priority: edge.data?.priority,
      },
    });
  });
}

export const useStore = create<Store>((set, get) => ({
  flujos: [],
  flujoActualId: null,
  nodes: [],
  edges: [],
  testigos: [],
  hechos: [],
  documentos: [],
  preguntas: [],
  viewportCenter: { x: 0, y: 0 },
  selectedNodeId: null,
  selectedEdgeId: null,
  saveState: 'idle',
  deleteConfirm: null,

  loadFlujos: async () => {
    const flujos = await listFlowSummariesByUpdatedAt();
    const actual = flujos[0] ? await getFlowById(flujos[0].id) : null;
    set({
      flujos,
      flujoActualId: actual?.id ?? null,
      nodes: actual?.nodes ?? [],
      edges: normalizeEdges(actual?.edges, actual?.nodes ?? []),
      testigos: actual?.testigos ?? [],
      hechos: normalizeFacts(actual?.hechos),
      documentos: actual?.documentos ?? [],
      preguntas: actual?.preguntas ?? [],
      selectedEdgeId: null,
      saveState: actual ? 'saved' : 'idle',
    });
  },

    crearFlujo: async (titulo = 'Nuevo flujo') => {
      const flow = createBaseFlow(titulo);
      await saveFlow(flow);
      const flujos = await listFlowSummariesByUpdatedAt();
      set({
        flujos,
        flujoActualId: flow.id,
      nodes: [],
      edges: [],
      testigos: [],
      hechos: [],
      documentos: [],
      preguntas: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      saveState: 'saved',
    });
  },

  eliminarFlujo: async (id) => {
    await deleteFlowById(id);
    const flujos = await listFlowSummariesByUpdatedAt();
    const actual = flujos[0] ? await getFlowById(flujos[0].id) : null;
    set({
      flujos,
      flujoActualId: actual?.id ?? null,
      nodes: actual?.nodes ?? [],
      edges: normalizeEdges(actual?.edges, actual?.nodes ?? []),
      testigos: actual?.testigos ?? [],
      hechos: normalizeFacts(actual?.hechos),
      documentos: actual?.documentos ?? [],
      preguntas: actual?.preguntas ?? [],
      selectedNodeId: null,
      selectedEdgeId: null,
      saveState: actual ? 'saved' : 'idle',
    });
  },

  seleccionarFlujo: async (id) => {
    const flujo = await getFlowById(id);
    if (!flujo) return;
    set({
      flujoActualId: flujo.id,
      nodes: flujo.nodes,
      edges: normalizeEdges(flujo.edges, flujo.nodes),
      testigos: flujo.testigos,
      hechos: normalizeFacts(flujo.hechos),
      documentos: flujo.documentos ?? [],
      preguntas: flujo.preguntas ?? [],
      selectedNodeId: null,
      selectedEdgeId: null,
      saveState: 'saved',
    });
  },

  renombrarFlujo: async (titulo) => {
    const { flujoActualId } = get();
    if (!flujoActualId) return;
    const flujo = await getFlowById(flujoActualId);
    if (!flujo) return;
    const updated = { ...flujo, titulo, updatedAt: new Date().toISOString() };
    await saveFlow(updated);
    const flujos = await listFlowSummariesByUpdatedAt();
    set({ flujos, saveState: 'saved' });
  },

  guardarFlujo: async () => {
    const { flujoActualId, nodes, edges, testigos, hechos, documentos, preguntas } = get();
    if (!flujoActualId) return;
    const current = await getFlowById(flujoActualId);
    if (!current) return;
    set({ saveState: 'saving' });
    const updated: Flujo = {
      ...current,
      nodes,
      edges,
      testigos,
      hechos,
      documentos,
      preguntas,
      updatedAt: new Date().toISOString(),
    };
    await saveFlow(updated);
    const nextFlows = await listFlowSummariesByUpdatedAt();
    set({ flujos: nextFlows, saveState: 'saved' });
  },

  marcarGuardado: () => set({ saveState: 'idle' }),

  setViewportCenter: (center) => set({ viewportCenter: center }),

  applyNodesChanges: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges<CustomNode>(changes, state.nodes),
      saveState: 'idle',
    }));
  },

  applyEdgesChanges: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges<CustomEdge>(changes, state.edges),
      selectedEdgeId: changes.some((change) => change.type === 'remove' && change.id === state.selectedEdgeId) ? null : state.selectedEdgeId,
      saveState: 'idle',
    }));
  },

  onConnect: (connection) => {
    set((state) => {
      const sourceNode = state.nodes.find((node) => node.id === connection.source);
      const targetNode = state.nodes.find((node) => node.id === connection.target);
      const tipo = inferEdgeKind(sourceNode?.type, targetNode?.type);
      const sourceAnswerId = parseAnswerHandleId(connection.sourceHandle);
      const sourceAnswer = sourceAnswerId
        ? sourceNode?.data.answers?.find((answer) => answer.id === sourceAnswerId)
        : undefined;
      const newEdge = decorateEdge({
        id: crypto.randomUUID(),
        source: connection.source ?? '',
        target: connection.target ?? '',
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        data: {
          tipo,
          sourceAnswerId,
          sourceAnswerText: sourceAnswer?.texto,
        },
      });

      return {
        edges: addEdge<CustomEdge>(newEdge, state.edges),
        selectedEdgeId: newEdge.id,
        selectedNodeId: null,
        saveState: 'idle',
      };
    });
  },

  crearNodo: (type) => {
    set((state) => {
      const data = defaultNodeData(type);
      if (type === 'pregunta') {
        data.answers = sanitizeAnswers(data.answers);
      }

      const newNode: CustomNode = {
        id: crypto.randomUUID(),
        type,
        position: state.viewportCenter,
        data,
      };

      return {
        nodes: [...state.nodes, newNode],
        selectedNodeId: newNode.id,
        selectedEdgeId: null,
        saveState: 'idle',
      };
    });
  },

  updateNode: (id, data) => {
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id !== id) return node;

        const nextData: CustomNodeData = {
          ...node.data,
          ...data,
        };

        if (node.type === 'pregunta') {
          const nextText = typeof nextData.texto === 'string' ? nextData.texto : '';
          nextData.texto = nextText;
          nextData.label = typeof data.label === 'string' ? data.label : buildQuestionNodeLabel(nextText);
          nextData.answers = sanitizeAnswers(nextData.answers);
        }

        return { ...node, data: nextData };
      });

      const updatedNode = nodes.find((node) => node.id === id);
      const edges = updatedNode?.type === 'pregunta'
        ? syncQuestionNodeEdges(updatedNode.id, updatedNode.data.answers ?? [], state.edges)
        : state.edges;

      return {
        nodes,
        edges,
        saveState: 'idle',
      };
    });
  },

  eliminarNodo: (id) => {
    set((state) => {
      const remainingEdges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);

      return {
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: remainingEdges,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        selectedEdgeId: remainingEdges.some((edge) => edge.id === state.selectedEdgeId) ? state.selectedEdgeId : null,
        saveState: 'idle',
      };
    });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),

  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  updateEdge: (id, data) => {
    set((state) => ({
      edges: state.edges.map((edge) => {
        if (edge.id !== id) return edge;

        const currentData: CustomEdgeData = edge.data ?? { tipo: 'sigue', priority: 'media' };

        return decorateEdge({
          ...edge,
          data: {
            ...currentData,
            ...data,
            tipo: data.tipo ?? currentData.tipo,
          },
        });
      }),
      saveState: 'idle',
    }));
  },

  eliminarEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      saveState: 'idle',
    }));
  },

  agregarTestigo: (payload) => {
    set((state) => ({
      testigos: [
        ...state.testigos,
        {
          id: crypto.randomUUID(),
          ...payload,
          color: normalizeWitnessColor(payload.color),
        },
      ],
      saveState: 'idle',
    }));
  },

  updateTestigo: (id, data) => {
    set((state) => ({
      testigos: state.testigos.map((testigo) => (testigo.id === id
        ? {
            ...testigo,
            ...data,
            color: data.color !== undefined ? normalizeWitnessColor(data.color, testigo.color) : testigo.color,
          }
        : testigo)),
      saveState: 'idle',
    }));
  },

  eliminarTestigo: (id) => {
    set((state) => ({
      testigos: state.testigos.filter((testigo) => testigo.id !== id),
      nodes: state.nodes.map((node) => {
        if (node.data.witnessId !== id) return node;
        return { ...node, data: { ...node.data, witnessId: undefined } };
      }),
      preguntas: state.preguntas.map((pregunta) => (pregunta.witnessId === id ? { ...pregunta, witnessId: undefined } : pregunta)),
      saveState: 'idle',
    }));
  },

  agregarHecho: (payload) => {
    set((state) => ({
      hechos: [...state.hechos, { id: crypto.randomUUID(), ...payload, color: normalizeFactColor(payload.color, state.hechos) }],
      saveState: 'idle',
    }));
  },

  updateHecho: (id, data) => {
    set((state) => ({
      hechos: state.hechos.map((hecho) => (hecho.id === id
        ? {
            ...hecho,
            ...data,
            color: data.color !== undefined ? normalizeFactColor(data.color, state.hechos, id) : hecho.color,
          }
        : hecho)),
      saveState: 'idle',
    }));
  },

  eliminarHecho: (id) => {
    set((state) => ({
      hechos: state.hechos.filter((hecho) => hecho.id !== id),
      nodes: state.nodes.map((node) => {
        if (node.data.factId !== id) return node;
        return { ...node, data: { ...node.data, factId: undefined } };
      }),
      preguntas: state.preguntas.map((pregunta) => (pregunta.factId === id ? { ...pregunta, factId: undefined } : pregunta)),
      saveState: 'idle',
    }));
  },

  agregarDocumento: (payload) => {
    set((state) => ({
      documentos: [
        ...state.documentos,
        {
          id: crypto.randomUUID(),
          ...payload,
        },
      ],
      saveState: 'idle',
    }));
  },

  updateDocumento: (id, data) => {
    set((state) => {
      const documentos = state.documentos.map((documento) => (documento.id === id ? { ...documento, ...data } : documento));
      const documentoActualizado = documentos.find((documento) => documento.id === id);

      return {
        documentos,
        nodes: state.nodes.map((node) => {
          if (node.type !== 'documento' || node.data.documentId !== id || !documentoActualizado) return node;

          return {
            ...node,
            data: {
              ...node.data,
              label: getDocumentLabel(documentoActualizado),
              description: documentoActualizado.descripcion ?? '',
              source: documentoActualizado.referencia ?? '',
              notes: documentoActualizado.notas ?? '',
              documentPart: documentoActualizado.parte,
              documentType: documentoActualizado.tipo ?? '',
              documentDate: documentoActualizado.fecha ?? '',
              documentReference: documentoActualizado.referencia ?? '',
            },
          };
        }),
        saveState: 'idle',
      };
    });
  },

  eliminarDocumento: (id) => {
    set((state) => ({
      documentos: state.documentos.filter((documento) => documento.id !== id),
      nodes: state.nodes.map((node) => {
        if (node.data.documentId !== id) return node;

        return {
          ...node,
          data: {
            ...node.data,
            documentId: undefined,
          },
        };
      }),
      saveState: 'idle',
    }));
  },

  agregarPregunta: (payload) => {
    set((state) => ({
      preguntas: [
        ...state.preguntas,
        {
          id: crypto.randomUUID(),
          ...payload,
          topicLabel: payload.topicLabel?.trim() || undefined,
          respuestas: sanitizeAnswers(payload.respuestas),
        },
      ],
      saveState: 'idle',
    }));
  },

  updatePregunta: (id, data) => {
    set((state) => ({
      preguntas: state.preguntas.map((pregunta) => {
        if (pregunta.id !== id) return pregunta;

        return {
          ...pregunta,
          ...data,
          topicLabel: data.topicLabel !== undefined ? data.topicLabel.trim() || undefined : pregunta.topicLabel,
          respuestas: data.respuestas ? sanitizeAnswers(data.respuestas) : pregunta.respuestas,
        };
      }),
      saveState: 'idle',
    }));
  },

  eliminarPregunta: (id) => {
    set((state) => ({
      preguntas: state.preguntas.filter((pregunta) => pregunta.id !== id),
      saveState: 'idle',
    }));
  },

  importarPreguntas: (preguntasImportadas) => {
    const state = get();
    const witnessNames = new Map(state.testigos.map((testigo) => [testigo.nombre.trim().toLowerCase(), testigo.id]));
    const factTitles = new Map(state.hechos.map((hecho) => [hecho.titulo.trim().toLowerCase(), hecho.id]));
    let unresolvedWitnesses = 0;
    let unresolvedFacts = 0;

    const nuevasPreguntas = preguntasImportadas.map((pregunta) => {
      const witnessKey = pregunta.witnessId?.trim().toLowerCase();
      const factKey = pregunta.factId?.trim().toLowerCase();
      const witnessId = witnessKey ? witnessNames.get(witnessKey) : undefined;
      const factId = factKey ? factTitles.get(factKey) : undefined;

      if (witnessKey && !witnessId) unresolvedWitnesses += 1;
      if (factKey && !factId) unresolvedFacts += 1;

      return {
        id: crypto.randomUUID(),
        texto: pregunta.texto,
        witnessId,
        factId,
        topicLabel: pregunta.topicLabel?.trim() || undefined,
        respuestas: sanitizeAnswers(pregunta.respuestas),
        notas: pregunta.notas,
      } satisfies PreguntaBase;
    });

    set((current) => ({
      preguntas: [...current.preguntas, ...nuevasPreguntas],
      saveState: 'idle',
    }));

    return {
      imported: nuevasPreguntas.length,
      unresolvedWitnesses,
      unresolvedFacts,
    };
  },

  crearNodoPreguntaDesdeBanco: (preguntaId) => {
    set((state) => {
      const pregunta = state.preguntas.find((item) => item.id === preguntaId);
      if (!pregunta) return state;

      const answers = sanitizeAnswers(pregunta.respuestas);
      const texto = pregunta.texto.trim();
      const newNode: CustomNode = {
        id: crypto.randomUUID(),
        type: 'pregunta',
        position: state.viewportCenter,
        data: {
          ...defaultNodeData('pregunta'),
          label: buildQuestionNodeLabel(texto),
          texto,
          witnessId: pregunta.witnessId,
          factId: pregunta.factId,
          sourceQuestionId: pregunta.id,
          topicLabel: pregunta.topicLabel,
          notes: pregunta.notas,
          answers,
        },
      };

      return {
        nodes: [...state.nodes, newNode],
        selectedNodeId: newNode.id,
        selectedEdgeId: null,
        saveState: 'idle',
      };
    });
  },

  setMode: async (mode) => {
    const { flujoActualId } = get();
    if (!flujoActualId) return;
    const current = await getFlowById(flujoActualId);
    if (!current) return;
    const updated = { ...current, mode, updatedAt: new Date().toISOString() };
    await saveFlow(updated);
    const nextFlows = await listFlowSummariesByUpdatedAt();
    set({ flujos: nextFlows, saveState: 'saved' });
  },

  setDeleteConfirm: (value) => set({ deleteConfirm: value }),

  importarFlujos: async (flujos) => {
    console.group('[import-json] store.importarFlujos');
    console.table(flujos.map((flujo, index) => ({
      index,
      id: flujo.id,
      titulo: flujo.titulo,
      mode: flujo.mode,
      testigos: flujo.testigos.length,
      hechos: flujo.hechos.length,
      documentos: flujo.documentos?.length ?? 0,
      preguntas: flujo.preguntas?.length ?? 0,
      nodes: flujo.nodes.length,
      edges: flujo.edges.length,
    })));

    const imported = cloneImportedFlowsAsNew(flujos);
    console.table(imported.map((flujo, index) => ({
      index,
      id: flujo.id,
      titulo: flujo.titulo,
      mode: flujo.mode,
      testigos: flujo.testigos.length,
      hechos: flujo.hechos.length,
      documentos: flujo.documentos?.length ?? 0,
      preguntas: flujo.preguntas?.length ?? 0,
      nodes: flujo.nodes.length,
      edges: flujo.edges.length,
    })));

    if (imported.length === 0) {
      console.warn('[import-json] no hay flujos para persistir');
      console.groupEnd();
      return 0;
    }

    console.info('[import-json] guardando flujos clonados en IndexedDB');
    await saveFlows(imported);

    const { flujoActualId, selectedNodeId, selectedEdgeId, saveState } = get();
    const nextFlows = await listFlowSummariesByUpdatedAt();
    const current = flujoActualId ? await getFlowById(flujoActualId) : null;

    set((state) => ({
      flujos: nextFlows,
      flujoActualId: current?.id ?? state.flujoActualId,
      nodes: current?.nodes ?? state.nodes,
      edges: current ? normalizeEdges(current.edges, current.nodes) : state.edges,
      testigos: current?.testigos ?? state.testigos,
      hechos: current ? normalizeFacts(current.hechos) : state.hechos,
      documentos: current?.documentos ?? state.documentos,
      preguntas: current?.preguntas ?? state.preguntas,
      selectedNodeId,
      selectedEdgeId,
      saveState,
    }));

    console.table([{
      requestedImports: flujos.length,
      clonedImports: imported.length,
      totalFlowsAfterSave: nextFlows.length,
      activeFlowId: current?.id ?? '(sin cambio)',
      activeFlowTitle: current?.titulo ?? '(sin cambio)',
      selectedNodeId: selectedNodeId ?? '(ninguno)',
      selectedEdgeId: selectedEdgeId ?? '(ninguno)',
    }]);
    console.groupEnd();

    return imported.length;
  },

  restaurarSnapshot: async (snapshotId) => {
    const snapshot = await getFlowSnapshot(snapshotId);
    if (!snapshot) return false;

    const restored: Flujo = {
      ...snapshot,
      updatedAt: new Date().toISOString(),
    };

    await saveFlow(restored);
    const nextFlows = await listFlowSummariesByUpdatedAt();

    set({
      flujos: nextFlows,
      flujoActualId: restored.id,
      nodes: restored.nodes,
      edges: normalizeEdges(restored.edges, restored.nodes),
      testigos: restored.testigos,
      hechos: normalizeFacts(restored.hechos),
      documentos: restored.documentos ?? [],
      preguntas: restored.preguntas ?? [],
      selectedNodeId: null,
      selectedEdgeId: null,
      saveState: 'saved',
    });

    return true;
  },
}));
