import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { GroupedImportAdjustment, ImportAdjustment } from '../importExport';

interface ImportAdjustmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  importedCount: number;
  adjustments: ImportAdjustment[];
  groupedAdjustments: GroupedImportAdjustment[];
}

export default function ImportAdjustmentsModal({
  isOpen,
  onClose,
  importedCount,
  adjustments,
  groupedAdjustments,
}: ImportAdjustmentsModalProps) {
  const [view, setView] = useState<'grouped' | 'detail'>('grouped');

  useEffect(() => {
    if (!isOpen) return;
    setView(groupedAdjustments.length > 0 ? 'grouped' : 'detail');
  }, [isOpen, groupedAdjustments.length]);

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay z-[130]">
      <div className="app-modal-panel max-w-4xl border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-950/60 p-2 text-amber-300">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Importacion completada</div>
              <h2 className="text-xl font-semibold text-zinc-100">Se aplicaron correcciones automaticas</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-200">Flujos importados: {importedCount}</span>
            <span className="rounded-full bg-amber-950/60 px-3 py-1 text-amber-300">Correcciones: {adjustments.length}</span>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">Grupos: {groupedAdjustments.length}</span>
          </div>

          <p className="mb-5 text-sm text-zinc-400">
            Los valores invalidos se reemplazaron por defaults seguros para completar la importacion sin bloquear el proceso.
          </p>

          <div className="mb-5 flex gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1 text-sm">
            <button
              onClick={() => setView('grouped')}
              className={`rounded-xl px-4 py-2 transition ${view === 'grouped' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Agrupadas
            </button>
            <button
              onClick={() => setView('detail')}
              className={`rounded-xl px-4 py-2 transition ${view === 'detail' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Detalle
            </button>
          </div>

          {view === 'grouped' ? (
            <div className="space-y-3">
              {groupedAdjustments.map((group, index) => (
                <article key={`${group.field}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-300">{group.field}</span>
                    <span className="rounded-full bg-amber-950/60 px-2 py-0.5 text-xs text-amber-300">{group.occurrences}x</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{group.reason}</p>
                  <p className="mt-1 text-xs text-zinc-400">Aplicado: <span className="text-zinc-300">{group.appliedValue}</span></p>
                  {group.samplePreviousValues.length > 0 ? (
                    <p className="mt-1 text-xs text-zinc-500">Ejemplos originales: {group.samplePreviousValues.join(' | ')}</p>
                  ) : null}
                  {group.samplePaths.length > 0 ? (
                    <p className="mt-2 text-xs text-zinc-500">Rutas: {group.samplePaths.join(' | ')}</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {adjustments.map((adjustment, index) => (
                <article key={`${adjustment.path}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                  <p className="text-xs text-zinc-500">{adjustment.path}</p>
                  <p className="mt-1 text-sm text-zinc-200">{adjustment.reason}</p>
                  <p className="mt-1 text-xs text-zinc-400">Original: <span className="text-zinc-300">{adjustment.previousValue}</span></p>
                  <p className="text-xs text-zinc-400">Aplicado: <span className="text-zinc-300">{adjustment.appliedValue}</span></p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-zinc-800 bg-zinc-900 px-6 py-5">
          <button onClick={onClose} className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
