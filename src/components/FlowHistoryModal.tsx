import { History, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listFlowSnapshotsByFlowId } from '../flowRepository';
import { useStore } from '../store';
import type { FlowSnapshotSummary } from '../types';

function formatSnapshotDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function FlowHistoryModal({ isOpen, onClose, flowId, flowTitle }: { isOpen: boolean; onClose: () => void; flowId: string | null; flowTitle?: string }) {
  const { restaurarSnapshot } = useStore();
  const [snapshots, setSnapshots] = useState<FlowSnapshotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !flowId) return;

    let cancelled = false;
    setIsLoading(true);

    void listFlowSnapshotsByFlowId(flowId)
      .then((nextSnapshots) => {
        if (cancelled) return;
        setSnapshots(nextSnapshots);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, flowId]);

  if (!isOpen || !flowId) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-zinc-800 p-2 text-zinc-200">
              <History size={18} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Historial local</div>
              <h2 className="text-xl font-semibold text-zinc-100">{flowTitle ?? 'Flujo actual'}</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <p className="mb-5 text-sm text-zinc-400">
            Usa una version anterior cuando necesites recuperar una linea de trabajo. La restauracion crea un nuevo snapshot del estado recuperado.
          </p>

          {isLoading ? <div className="text-sm text-zinc-500">Cargando historial...</div> : null}

          {!isLoading && snapshots.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-zinc-800 bg-zinc-950/70 px-5 py-6 text-sm text-zinc-500">
              Este flujo todavia no tiene snapshots locales.
            </div>
          ) : null}

          <div className="space-y-3">
            {snapshots.map((snapshot, index) => {
              const isLatest = index === 0;
              const isRestoring = restoringId === snapshot.id;

              return (
                <div key={snapshot.id} className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 px-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-zinc-100">Version {snapshot.snapshotVersion}</span>
                      {isLatest ? <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[11px] uppercase tracking-wide text-emerald-300">Actual</span> : null}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">{formatSnapshotDate(snapshot.createdAt)}</div>
                  </div>

                  <button
                    onClick={async () => {
                      if (isLatest || isRestoring) return;
                      const confirmed = window.confirm('Restaurar esta version del flujo actual?');
                      if (!confirmed) return;
                      setRestoringId(snapshot.id);
                      const restored = await restaurarSnapshot(snapshot.id);
                      setRestoringId(null);
                      if (restored) onClose();
                    }}
                    disabled={isLatest || isRestoring}
                    className="inline-flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3 text-sm text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw size={16} /> {isRestoring ? 'Restaurando...' : 'Restaurar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
