import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react';
import { create } from 'zustand';
import { db } from './db';
import { getDocumentLabel } from './documentUtils';
import { decorateEdge, getEdgeKindLabel, inferEdgeKind } from './edgeRules';
import { cloneImportedFlowsAsNew } from './importExport';
import type { CustomEdge, CustomEdgeData, CustomNode, CustomNodeData, Documento, Flujo, Hecho, NodeKind, SessionMode, Testigo } from './types';

type SaveState = 'idle' | 'saving' | 'saved';

const randomColor = () => `hsl(${Math.floor(Math.random() * 360)} 70% 58%)`;

const createBaseFlow = (titulo: string): Flujo => ({
  id: crypto.randomUUID(),
  titulo,
  mode: 'preparacion',
  nodes: [],
  edges: [],
  testigos: [],
  hechos: [],
  documentos: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

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
        isSecondary: false,
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
  flujos: Flujo[];
  flujoActualId: string | null;
  nodes: CustomNode[];
  edges: CustomEdge[];
  testigos: Testigo[];
  hechos: Hecho[];
  documentos: Documento[];
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
  deleteConfirm: { type: 'testigo' | 'hecho' | 'documento'; id: string; label: string } | null;
  setDeleteConfirm: (value: { type: 'testigo' | 'hecho' | 'documento'; id: string; label: string } | null) => void;
  setMode: (mode: SessionMode) => Promise<void>;
  importarFlujos: (flujos: Flujo[]) => Promise<number>;
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
  viewportCenter: { x: 0, y: 0 },
  selectedNodeId: null,
  selectedEdgeId: null,
  saveState: 'idle',
  deleteConfirm: null,

  loadFlujos: async () => {
    const flujos = await db.flujos.orderBy('updatedAt').reverse().toArray();
    const actual = flujos[0] ?? null;
    set({
      flujos,
      flujoActualId: actual?.id ?? null,
      nodes: actual?.nodes ?? [],
      edges: normalizeEdges(actual?.edges, actual?.nodes ?? []),
      testigos: actual?.testigos ?? [],
      hechos: actual?.hechos ?? [],
      documentos: actual?.documentos ?? [],
      selectedEdgeId: null,
      saveState: actual ? 'saved' : 'idle',
    });
  },

  crearFlujo: async (titulo = 'Nuevo flujo') => {
    const flow = createBaseFlow(titulo);
    await db.flujos.add(flow);
    const flujos = await db.flujos.orderBy('updatedAt').reverse().toArray();
    set({
      flujos,
      flujoActualId: flow.id,
      nodes: [],
      edges: [],
      testigos: [],
      hechos: [],
      documentos: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      saveState: 'saved',
    });
  },

  eliminarFlujo: async (id) => {
    await db.flujos.delete(id);
    const flujos = await db.flujos.orderBy('updatedAt').reverse().toArray();
    const actual = flujos[0] ?? null;
    set({
      flujos,
      flujoActualId: actual?.id ?? null,
      nodes: actual?.nodes ?? [],
      edges: normalizeEdges(actual?.edges, actual?.nodes ?? []),
      testigos: actual?.testigos ?? [],
      hechos: actual?.hechos ?? [],
      documentos: actual?.documentos ?? [],
      selectedNodeId: null,
      selectedEdgeId: null,
      saveState: actual ? 'saved' : 'idle',
    });
  },

  seleccionarFlujo: async (id) => {
    const flujo = await db.flujos.get(id);
    if (!flujo) return;
    set({
      flujoActualId: flujo.id,
      nodes: flujo.nodes,
      edges: normalizeEdges(flujo.edges, flujo.nodes),
      testigos: flujo.testigos,
      hechos: flujo.hechos,
      documentos: flujo.documentos ?? [],
      selectedNodeId: null,
      selectedEdgeId: null,
      saveState: 'saved',
    });
  },

  renombrarFlujo: async (titulo) => {
    const { flujoActualId } = get();
    if (!flujoActualId) return;
    const flujo = await db.flujos.get(flujoActualId);
    if (!flujo) return;
    const updated = { ...flujo, titulo, updatedAt: new Date().toISOString() };
    await db.flujos.put(updated);
    const flujos = await db.flujos.orderBy('updatedAt').reverse().toArray();
    set({ flujos, saveState: 'saved' });
  },

  guardarFlujo: async () => {
    const { flujoActualId, nodes, edges, testigos, hechos, documentos, flujos } = get();
    if (!flujoActualId) return;
    const current = flujos.find((item) => item.id === flujoActualId) ?? (await db.flujos.get(flujoActualId));
    if (!current) return;
    set({ saveState: 'saving' });
    const updated: Flujo = {
      ...current,
      nodes,
      edges,
      testigos,
      hechos,
      documentos,
      updatedAt: new Date().toISOString(),
    };
    await db.flujos.put(updated);
    const nextFlows = await db.flujos.orderBy('updatedAt').reverse().toArray();
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
      const newEdge = decorateEdge({
        id: crypto.randomUUID(),
        source: connection.source ?? '',
        target: connection.target ?? '',
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        data: {
          tipo,
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
      const newNode: CustomNode = {
        id: crypto.randomUUID(),
        type,
        position: state.viewportCenter,
        data: defaultNodeData(type),
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
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...data } } : node)),
      saveState: 'idle',
    }));
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
          color: payload.color ?? randomColor(),
          ...payload,
        },
      ],
      saveState: 'idle',
    }));
  },

  updateTestigo: (id, data) => {
    set((state) => ({
      testigos: state.testigos.map((testigo) => (testigo.id === id ? { ...testigo, ...data } : testigo)),
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
      saveState: 'idle',
    }));
  },

  agregarHecho: (payload) => {
    set((state) => ({
      hechos: [...state.hechos, { id: crypto.randomUUID(), ...payload }],
      saveState: 'idle',
    }));
  },

  updateHecho: (id, data) => {
    set((state) => ({
      hechos: state.hechos.map((hecho) => (hecho.id === id ? { ...hecho, ...data } : hecho)),
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

  setMode: async (mode) => {
    const { flujoActualId, flujos } = get();
    if (!flujoActualId) return;
    const current = flujos.find((item) => item.id === flujoActualId) ?? (await db.flujos.get(flujoActualId));
    if (!current) return;
    const updated = { ...current, mode, updatedAt: new Date().toISOString() };
    await db.flujos.put(updated);
    const nextFlows = await db.flujos.orderBy('updatedAt').reverse().toArray();
    set({ flujos: nextFlows, saveState: 'saved' });
  },

  setDeleteConfirm: (value) => set({ deleteConfirm: value }),

  importarFlujos: async (flujos) => {
    const imported = cloneImportedFlowsAsNew(flujos);
    if (imported.length === 0) return 0;

    await db.flujos.bulkPut(imported);

    const { flujoActualId, selectedNodeId, selectedEdgeId, saveState } = get();
    const nextFlows = await db.flujos.orderBy('updatedAt').reverse().toArray();
    const current = flujoActualId ? nextFlows.find((item) => item.id === flujoActualId) ?? null : null;

    set((state) => ({
      flujos: nextFlows,
      flujoActualId: current?.id ?? state.flujoActualId,
      nodes: current?.nodes ?? state.nodes,
      edges: current ? normalizeEdges(current.edges, current.nodes) : state.edges,
      testigos: current?.testigos ?? state.testigos,
      hechos: current?.hechos ?? state.hechos,
      documentos: current?.documentos ?? state.documentos,
      selectedNodeId,
      selectedEdgeId,
      saveState,
    }));

    return imported.length;
  },
}));
