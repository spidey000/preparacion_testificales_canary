import Dexie, { type EntityTable } from 'dexie';
import type { CustomEdge, CustomNode, Documento, Flujo, Hecho, PreguntaBase, Testigo } from './types';

interface LegacyFlowRecord extends Flujo {}

interface RecordMeta {
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface FlowRecord extends RecordMeta {
  id: string;
  titulo: string;
  mode: Flujo['mode'];
  lastSnapshotAt?: string;
}

export interface NodeRecord extends Omit<CustomNode, 'id'>, RecordMeta {
  id: string;
  flowId: string;
  order: number;
}

export interface EdgeRecord extends Omit<CustomEdge, 'id'>, RecordMeta {
  id: string;
  flowId: string;
  order: number;
}

export interface WitnessRecord extends Omit<Testigo, 'id'>, RecordMeta {
  id: string;
  flowId: string;
  order: number;
}

export interface FactRecord extends Omit<Hecho, 'id'>, RecordMeta {
  id: string;
  flowId: string;
  order: number;
}

export interface DocumentRecord extends Omit<Documento, 'id'>, RecordMeta {
  id: string;
  flowId: string;
  order: number;
}

export interface QuestionRecord extends Omit<PreguntaBase, 'id'>, RecordMeta {
  id: string;
  flowId: string;
  order: number;
}

export interface FlowSnapshotRecord {
  id: string;
  flowId: string;
  createdAt: string;
  snapshotVersion: number;
  data: Flujo;
}

export const db = new (class TestificalesDB extends Dexie {
  flujos!: EntityTable<LegacyFlowRecord, 'id'>;
  flows!: EntityTable<FlowRecord, 'id'>;
  nodes!: EntityTable<NodeRecord, 'id'>;
  edges!: EntityTable<EdgeRecord, 'id'>;
  witnesses!: EntityTable<WitnessRecord, 'id'>;
  facts!: EntityTable<FactRecord, 'id'>;
  documents!: EntityTable<DocumentRecord, 'id'>;
  questions!: EntityTable<QuestionRecord, 'id'>;
  flowSnapshots!: EntityTable<FlowSnapshotRecord, 'id'>;

  constructor() {
    super('TestificalesDB');

    this.version(1).stores({
      flujos: 'id, titulo, createdAt, updatedAt',
    });

    this.version(2)
      .stores({
        flujos: 'id, titulo, createdAt, updatedAt',
        flows: 'id, titulo, mode, createdAt, updatedAt',
        nodes: '[flowId+id], flowId, id, type',
        edges: '[flowId+id], flowId, id, source, target',
        witnesses: '[flowId+id], flowId, id, nombre, rolProcesal',
        facts: '[flowId+id], flowId, id, cobertura, priority',
        documents: '[flowId+id], flowId, id, parte, tipo, fecha',
      })
      .upgrade(async (transaction) => {
        const legacyFlows = (await transaction.table('flujos').toArray()) as LegacyFlowRecord[];
        if (legacyFlows.length === 0) return;

        const flowRecords: FlowRecord[] = [];
        const nodeRecords: NodeRecord[] = [];
        const edgeRecords: EdgeRecord[] = [];
        const witnessRecords: WitnessRecord[] = [];
        const factRecords: FactRecord[] = [];
        const documentRecords: DocumentRecord[] = [];

        legacyFlows.forEach((flow) => {
          flowRecords.push({
            id: flow.id,
            titulo: flow.titulo,
            mode: flow.mode ?? 'preparacion',
            createdAt: flow.createdAt,
            updatedAt: flow.updatedAt,
            version: 1,
          });

          flow.nodes.forEach((node, nodeIndex) => {
            nodeRecords.push({
              ...node,
              flowId: flow.id,
              order: nodeIndex,
              createdAt: flow.createdAt,
              updatedAt: flow.updatedAt,
              version: 1,
            });
          });

          flow.edges.forEach((edge, edgeIndex) => {
            edgeRecords.push({
              ...edge,
              flowId: flow.id,
              order: edgeIndex,
              createdAt: flow.createdAt,
              updatedAt: flow.updatedAt,
              version: 1,
            });
          });

          flow.testigos.forEach((witness, witnessIndex) => {
            witnessRecords.push({
              ...witness,
              flowId: flow.id,
              order: witnessIndex,
              createdAt: flow.createdAt,
              updatedAt: flow.updatedAt,
              version: 1,
            });
          });

          flow.hechos.forEach((fact, factIndex) => {
            factRecords.push({
              ...fact,
              flowId: flow.id,
              order: factIndex,
              createdAt: flow.createdAt,
              updatedAt: flow.updatedAt,
              version: 1,
            });
          });

          (flow.documentos ?? []).forEach((documento, documentIndex) => {
            documentRecords.push({
              ...documento,
              flowId: flow.id,
              order: documentIndex,
              createdAt: flow.createdAt,
              updatedAt: flow.updatedAt,
              version: 1,
            });
          });
        });

        await transaction.table('flows').bulkPut(flowRecords);
        await transaction.table('nodes').bulkPut(nodeRecords);
        await transaction.table('edges').bulkPut(edgeRecords);
        await transaction.table('witnesses').bulkPut(witnessRecords);
        await transaction.table('facts').bulkPut(factRecords);
        await transaction.table('documents').bulkPut(documentRecords);
        await transaction.table('flujos').clear();
      });

    this.version(3)
      .stores({
        flujos: 'id, titulo, createdAt, updatedAt',
        flows: 'id, titulo, mode, createdAt, updatedAt, version, lastSnapshotAt',
        nodes: '[flowId+id], flowId, id, type, updatedAt, [flowId+type], [flowId+updatedAt]',
        edges: '[flowId+id], flowId, id, source, target, updatedAt, [flowId+source], [flowId+target]',
        witnesses: '[flowId+id], flowId, id, nombre, rolProcesal, updatedAt, [flowId+nombre]',
        facts: '[flowId+id], flowId, id, cobertura, priority, updatedAt, [flowId+priority], [flowId+cobertura]',
        documents: '[flowId+id], flowId, id, parte, tipo, fecha, updatedAt, [flowId+tipo], [flowId+fecha]',
        flowSnapshots: 'id, flowId, createdAt, snapshotVersion, [flowId+createdAt]',
      })
      .upgrade(async (transaction) => {
        const flowsTable = transaction.table('flows');
        const nodesTable = transaction.table('nodes');
        const edgesTable = transaction.table('edges');
        const witnessesTable = transaction.table('witnesses');
        const factsTable = transaction.table('facts');
        const documentsTable = transaction.table('documents');

        const flows = (await flowsTable.toArray()) as Array<FlowRecord & Partial<RecordMeta>>;
        const flowMetaById = new Map(
          flows.map((flow) => [flow.id, {
            createdAt: flow.createdAt,
            updatedAt: flow.updatedAt,
            version: flow.version ?? 1,
          }]),
        );

        await flowsTable.bulkPut(flows.map((flow) => ({
          ...flow,
          version: flow.version ?? 1,
          lastSnapshotAt: flow.lastSnapshotAt,
        })));

        const applyMeta = <T extends { flowId: string; createdAt?: string; updatedAt?: string; version?: number }>(rows: T[]) => (
          rows.map((row) => {
            const flowMeta = flowMetaById.get(row.flowId);
            const createdAt = row.createdAt ?? flowMeta?.createdAt ?? new Date().toISOString();
            const updatedAt = row.updatedAt ?? flowMeta?.updatedAt ?? createdAt;
            return {
              ...row,
              createdAt,
              updatedAt,
              version: row.version ?? 1,
            };
          })
        );

        await nodesTable.bulkPut(applyMeta((await nodesTable.toArray()) as Array<NodeRecord & Partial<RecordMeta>>));
        await edgesTable.bulkPut(applyMeta((await edgesTable.toArray()) as Array<EdgeRecord & Partial<RecordMeta>>));
        await witnessesTable.bulkPut(applyMeta((await witnessesTable.toArray()) as Array<WitnessRecord & Partial<RecordMeta>>));
        await factsTable.bulkPut(applyMeta((await factsTable.toArray()) as Array<FactRecord & Partial<RecordMeta>>));
        await documentsTable.bulkPut(applyMeta((await documentsTable.toArray()) as Array<DocumentRecord & Partial<RecordMeta>>));
      });

    this.version(4)
      .stores({
        flujos: 'id, titulo, createdAt, updatedAt',
        flows: 'id, titulo, mode, createdAt, updatedAt, version, lastSnapshotAt',
        nodes: '[flowId+id], flowId, id, type, updatedAt, [flowId+type], [flowId+updatedAt]',
        edges: '[flowId+id], flowId, id, source, target, updatedAt, [flowId+source], [flowId+target]',
        witnesses: '[flowId+id], flowId, id, nombre, rolProcesal, updatedAt, [flowId+nombre]',
        facts: '[flowId+id], flowId, id, cobertura, priority, updatedAt, [flowId+priority], [flowId+cobertura]',
        documents: '[flowId+id], flowId, id, parte, tipo, fecha, updatedAt, [flowId+tipo], [flowId+fecha]',
        questions: '[flowId+id], flowId, id, updatedAt, [flowId+updatedAt], [flowId+witnessId], [flowId+factId]',
        flowSnapshots: 'id, flowId, createdAt, snapshotVersion, [flowId+createdAt]',
      });
  }
})();
