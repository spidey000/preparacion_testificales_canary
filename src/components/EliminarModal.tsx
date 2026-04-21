import { AlertTriangle, X } from 'lucide-react';
import { useStore } from '../store';

export default function EliminarModal() {
  const { deleteConfirm, setDeleteConfirm, eliminarTestigo, eliminarHecho, eliminarDocumento } = useStore();

  if (!deleteConfirm) return null;

  const handleConfirmar = () => {
    if (deleteConfirm.type === 'testigo') {
      eliminarTestigo(deleteConfirm.id);
    } else if (deleteConfirm.type === 'hecho') {
      eliminarHecho(deleteConfirm.id);
    } else if (deleteConfirm.type === 'documento') {
      eliminarDocumento(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const handleCancelar = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-red-900/50 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-red-900/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-950/50 p-2">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Confirmar eliminacion</div>
              <h2 className="text-lg font-semibold text-zinc-100">Eliminar {deleteConfirm.type}</h2>
            </div>
          </div>
          <button onClick={handleCancelar} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-zinc-300">
            Eliminar <span className="font-semibold text-white">&ldquo;{deleteConfirm.label}&rdquo;</span>?
          </p>
          {deleteConfirm.type === 'testigo' && (
            <p className="mt-3 text-sm text-zinc-500">
              Las preguntas vinculadas a este testigo quedaran desvinculadas. Esta accion no se puede deshacer.
            </p>
          )}
          {deleteConfirm.type === 'hecho' && (
            <p className="mt-3 text-sm text-zinc-500">
              Los nodos vinculados a este hecho quedaran desvinculados. Esta accion no se puede deshacer.
            </p>
          )}
          {deleteConfirm.type === 'documento' && (
            <p className="mt-3 text-sm text-zinc-500">
              Los nodos documento vinculados conservaran una copia de los datos pero quedaran desvinculados del documento original. Esta accion no se puede deshacer.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-red-900/30 bg-zinc-900 px-6 py-5">
          <button onClick={handleCancelar} className="rounded-2xl px-5 py-3 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            Cancelar
          </button>
          <button onClick={handleConfirmar} className="rounded-2xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-500">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}