import { AlertTriangle, FileQuestion, Plus, Target } from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '../store';

function countByWitness(nodeWitnessId: string | undefined, witnessId: string) {
  return nodeWitnessId === witnessId;
}

export default function SidebarPanel() {
  const { testigos, hechos, nodes, agregarTestigo, agregarHecho } = useStore();

  const stats = useMemo(() => {
    return {
      preguntas: nodes.filter((node) => node.type === 'pregunta').length,
      riesgos: nodes.filter((node) => node.type === 'riesgo').length,
      documentos: nodes.filter((node) => node.type === 'documento').length,
    };
  }, [nodes]);

  return (
    <aside className="flex h-full w-[320px] flex-col border-r border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Resumen</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-zinc-950 px-3 py-3"><div className="font-semibold">{stats.preguntas}</div><div className="text-zinc-500">Preguntas</div></div>
          <div className="rounded-2xl bg-zinc-950 px-3 py-3"><div className="font-semibold">{stats.riesgos}</div><div className="text-zinc-500">Riesgos</div></div>
          <div className="rounded-2xl bg-zinc-950 px-3 py-3"><div className="font-semibold">{stats.documentos}</div><div className="text-zinc-500">Docs</div></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Testigos</h2>
            <button
              onClick={() => {
                const nombre = window.prompt('Nombre del testigo');
                if (!nombre) return;
                agregarTestigo({ nombre, rolProcesal: 'proponente', credibilidad: 5, cargo: '' });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              <Plus size={14} /> Nuevo
            </button>
          </div>

          <div className="space-y-3">
            {testigos.length === 0 ? <p className="rounded-2xl border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">Aun no hay testigos en este flujo.</p> : null}
            {testigos.map((testigo) => {
              const preguntasAsociadas = nodes.filter((node) => countByWitness(node.data.witnessId, testigo.id)).length;
              return (
                <article key={testigo.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: testigo.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-zinc-100">{testigo.nombre}</div>
                      <div className="text-xs text-zinc-500">{testigo.rolProcesal} · credibilidad {testigo.credibilidad}/10</div>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                        <FileQuestion size={12} /> {preguntasAsociadas} preguntas asociadas
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Hechos</h2>
            <button
              onClick={() => {
                const titulo = window.prompt('Hecho a probar');
                if (!titulo) return;
                agregarHecho({ titulo, descripcion: '', cobertura: 'debil', priority: 'media' });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              <Plus size={14} /> Nuevo
            </button>
          </div>

          <div className="space-y-3">
            {hechos.length === 0 ? <p className="rounded-2xl border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">Aun no hay hechos definidos.</p> : null}
            {hechos.map((hecho) => {
              const cobertura = nodes.filter((node) => node.data.factId === hecho.id).length;
              return (
                <article key={hecho.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-blue-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-zinc-100">{hecho.titulo}</div>
                      <div className="text-xs text-zinc-500">{hecho.cobertura} · prioridad {hecho.priority}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1"><AlertTriangle size={12} /> {cobertura} nodos</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
