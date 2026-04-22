import { db, type DocumentRecord, type EdgeRecord, type FactRecord, type FlowRecord, type NodeRecord, type QuestionRecord, type WitnessRecord } from './db';
import type { FlowSnapshotSummary, FlowSummary, Flujo } from './types';

const FLOW_SNAPSHOT_LIMIT = 20;

function toFlowRecord(flow: Flujo): FlowRecord {
  return {
    id: flow.id,
    titulo: flow.titulo,
    mode: flow.mode,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
    version: 1,
  };
}

function toFlowSummary(flow: FlowRecord): FlowSummary {
  return {
    id: flow.id,
    titulo: flow.titulo,
    mode: flow.mode,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
    version: flow.version,
    lastSnapshotAt: flow.lastSnapshotAt,
  };
}

function buildRecordMeta<T extends { id: string }, R>(
  items: T[],
  currentRecords: Array<{ id: string; createdAt: string; version: number }>,
  build: (item: T, index: number, meta: { createdAt: string; updatedAt: string; version: number }) => R,
): R[] {
  const existingById = new Map(currentRecords.map((record) => [record.id, record]));
  const now = new Date().toISOString();

  return items.map((item, index) => {
    const existing = existingById.get(item.id);
    return build(item, index, {
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      version: (existing?.version ?? 0) + 1,
    });
  });
}

function toNodeRecords(flow: Flujo, currentRecords: NodeRecord[]): NodeRecord[] {
  return buildRecordMeta(flow.nodes, currentRecords, (node, index, meta) => ({ ...node, flowId: flow.id, order: index, ...meta }));
}

function toEdgeRecords(flow: Flujo, currentRecords: EdgeRecord[]): EdgeRecord[] {
  return buildRecordMeta(flow.edges, currentRecords, (edge, index, meta) => ({ ...edge, flowId: flow.id, order: index, ...meta }));
}

function toWitnessRecords(flow: Flujo, currentRecords: WitnessRecord[]): WitnessRecord[] {
  return buildRecordMeta(flow.testigos, currentRecords, (testigo, index, meta) => ({ ...testigo, flowId: flow.id, order: index, ...meta }));
}

function toFactRecords(flow: Flujo, currentRecords: FactRecord[]): FactRecord[] {
  return buildRecordMeta(flow.hechos, currentRecords, (hecho, index, meta) => ({ ...hecho, flowId: flow.id, order: index, ...meta }));
}

function toDocumentRecords(flow: Flujo, currentRecords: DocumentRecord[]): DocumentRecord[] {
  return buildRecordMeta(flow.documentos ?? [], currentRecords, (documento, index, meta) => ({ ...documento, flowId: flow.id, order: index, ...meta }));
}

function toQuestionRecords(flow: Flujo, currentRecords: QuestionRecord[]): QuestionRecord[] {
  return buildRecordMeta(flow.preguntas ?? [], currentRecords, (pregunta, index, meta) => ({ ...pregunta, flowId: flow.id, order: index, ...meta }));
}

function buildFlow(
  flow: FlowRecord,
  nodes: NodeRecord[],
  edges: EdgeRecord[],
  witnesses: WitnessRecord[],
  facts: FactRecord[],
  documents: DocumentRecord[],
  questions: QuestionRecord[],
): Flujo {
  return {
    id: flow.id,
    titulo: flow.titulo,
    mode: flow.mode,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
    nodes: nodes
      .sort((a, b) => a.order - b.order)
      .map(({ flowId: _flowId, order: _order, ...node }) => node),
    edges: edges
      .sort((a, b) => a.order - b.order)
      .map(({ flowId: _flowId, order: _order, ...edge }) => edge),
    testigos: witnesses
      .sort((a, b) => a.order - b.order)
      .map(({ flowId: _flowId, order: _order, ...witness }) => witness),
    hechos: facts
      .sort((a, b) => a.order - b.order)
      .map(({ flowId: _flowId, order: _order, ...fact }) => fact),
    documentos: documents
      .sort((a, b) => a.order - b.order)
      .map(({ flowId: _flowId, order: _order, ...document }) => document),
    preguntas: questions
      .sort((a, b) => a.order - b.order)
      .map(({ flowId: _flowId, order: _order, ...pregunta }) => pregunta),
  };
}

export async function listFlowSummariesByUpdatedAt(): Promise<FlowSummary[]> {
  const flows = await db.flows.orderBy('updatedAt').reverse().toArray();
  return flows.map(toFlowSummary);
}

export async function listFlowsByUpdatedAt(): Promise<Flujo[]> {
  const summaries = await listFlowSummariesByUpdatedAt();
  const flows = await Promise.all(summaries.map((flow) => getFlowById(flow.id)));
  return flows.filter((flow): flow is Flujo => Boolean(flow));
}

export async function getFlowById(flowId: string): Promise<Flujo | undefined> {
  const [flow, nodes, edges, witnesses, facts, documents, questions] = await Promise.all([
    db.flows.get(flowId),
    db.nodes.where('flowId').equals(flowId).toArray(),
    db.edges.where('flowId').equals(flowId).toArray(),
    db.witnesses.where('flowId').equals(flowId).toArray(),
    db.facts.where('flowId').equals(flowId).toArray(),
    db.documents.where('flowId').equals(flowId).toArray(),
    db.questions.where('flowId').equals(flowId).toArray(),
  ]);

  if (!flow) return undefined;

  return buildFlow(flow, nodes, edges, witnesses, facts, documents, questions);
}

export async function listFlowSnapshotsByFlowId(flowId: string): Promise<FlowSnapshotSummary[]> {
  const snapshots = await db.flowSnapshots.where('flowId').equals(flowId).toArray();
  return snapshots
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((snapshot) => ({
      id: snapshot.id,
      flowId: snapshot.flowId,
      createdAt: snapshot.createdAt,
      snapshotVersion: snapshot.snapshotVersion,
    }));
}

export async function getFlowSnapshot(snapshotId: string): Promise<Flujo | undefined> {
  const snapshot = await db.flowSnapshots.get(snapshotId);
  return snapshot?.data;
}

async function syncChildRecords<T extends { id: string; flowId: string }>(
  table: {
    where: (index: 'flowId') => { equals: (value: string) => { toArray: () => Promise<Array<{ id: string }>> } };
    delete: (key: string) => Promise<unknown>;
    bulkPut: (records: T[]) => Promise<unknown>;
  },
  flowId: string,
  nextRecords: T[],
) {
  const currentRecords = await table.where('flowId').equals(flowId).toArray();
  const nextIds = new Set(nextRecords.map((record) => record.id));
  const idsToDelete = currentRecords.map((record) => record.id).filter((id) => !nextIds.has(id));

  for (const id of idsToDelete) {
    await table.delete(id);
  }

  if (nextRecords.length > 0) {
    await table.bulkPut(nextRecords);
  }
}

async function writeFlowSnapshot(flow: Flujo, snapshotVersion: number) {
  const createdAt = new Date().toISOString();
  await db.flowSnapshots.add({
    id: crypto.randomUUID(),
    flowId: flow.id,
    createdAt,
    snapshotVersion,
    data: flow,
  });

  const snapshots = (await db.flowSnapshots.where('flowId').equals(flow.id).toArray())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const obsolete = snapshots.slice(FLOW_SNAPSHOT_LIMIT);
  if (obsolete.length > 0) {
    await db.flowSnapshots.bulkDelete(obsolete.map((snapshot) => snapshot.id));
  }
}

async function replaceFlowRecords(flow: Flujo) {
  const now = new Date().toISOString();
  const [currentFlow, currentNodes, currentEdges, currentWitnesses, currentFacts, currentDocuments, currentQuestions] = await Promise.all([
    db.flows.get(flow.id),
    db.nodes.where('flowId').equals(flow.id).toArray(),
    db.edges.where('flowId').equals(flow.id).toArray(),
    db.witnesses.where('flowId').equals(flow.id).toArray(),
    db.facts.where('flowId').equals(flow.id).toArray(),
    db.documents.where('flowId').equals(flow.id).toArray(),
    db.questions.where('flowId').equals(flow.id).toArray(),
  ]);

  const version = (currentFlow?.version ?? 0) + 1;
  const persistedFlow: Flujo = {
    ...flow,
    updatedAt: flow.updatedAt || now,
    createdAt: currentFlow?.createdAt ?? flow.createdAt ?? now,
  };

  await db.flows.put({
    ...toFlowRecord(persistedFlow),
    createdAt: currentFlow?.createdAt ?? persistedFlow.createdAt,
    updatedAt: persistedFlow.updatedAt,
    version,
    lastSnapshotAt: now,
  });

  const nodeRecords = toNodeRecords(persistedFlow, currentNodes);
  const edgeRecords = toEdgeRecords(persistedFlow, currentEdges);
  const witnessRecords = toWitnessRecords(persistedFlow, currentWitnesses);
  const factRecords = toFactRecords(persistedFlow, currentFacts);
  const documentRecords = toDocumentRecords(persistedFlow, currentDocuments);
  const questionRecords = toQuestionRecords(persistedFlow, currentQuestions);

  await syncChildRecords(db.nodes, flow.id, nodeRecords);
  await syncChildRecords(db.edges, flow.id, edgeRecords);
  await syncChildRecords(db.witnesses, flow.id, witnessRecords);
  await syncChildRecords(db.facts, flow.id, factRecords);
  await syncChildRecords(db.documents, flow.id, documentRecords);
  await syncChildRecords(db.questions, flow.id, questionRecords);
  await writeFlowSnapshot(persistedFlow, version);
}

export async function saveFlow(flow: Flujo): Promise<void> {
  await db.transaction('rw', [db.flows, db.nodes, db.edges, db.witnesses, db.facts, db.documents, db.questions, db.flowSnapshots], async () => {
    await replaceFlowRecords(flow);
  });
}

export async function saveFlows(flows: Flujo[]): Promise<void> {
  await db.transaction('rw', [db.flows, db.nodes, db.edges, db.witnesses, db.facts, db.documents, db.questions, db.flowSnapshots], async () => {
    for (const flow of flows) {
      await replaceFlowRecords(flow);
    }
  });
}

export async function deleteFlowById(flowId: string): Promise<void> {
  await db.transaction('rw', [db.flows, db.nodes, db.edges, db.witnesses, db.facts, db.documents, db.questions, db.flowSnapshots], async () => {
    await db.flows.delete(flowId);
    await db.nodes.where('flowId').equals(flowId).delete();
    await db.edges.where('flowId').equals(flowId).delete();
    await db.witnesses.where('flowId').equals(flowId).delete();
    await db.facts.where('flowId').equals(flowId).delete();
    await db.documents.where('flowId').equals(flowId).delete();
    await db.questions.where('flowId').equals(flowId).delete();
    await db.flowSnapshots.where('flowId').equals(flowId).delete();
  });
}
