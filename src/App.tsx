import { AlertTriangle, FileText, MessageSquare, Plus, Save, Target, Users } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import FlowCanvas from './components/FlowCanvas';
import EdgeModal from './components/EdgeModal';
import NodeModal from './components/NodeModal';
import SidebarPanel from './components/SidebarPanel';
import { useStore } from './store';
import type { NodeKind } from './types';

function formatSaveState(state: 'idle' | 'saving' | 'saved') {
  if (state === 'saving') return 'Guardando...';
  if (state === 'saved') return 'Guardado';
  return 'Cambios sin guardar';
}

function ToolbarButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: typeof MessageSquare }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-800">
      <Icon size={18} />
      {label}
    </button>
  );
}

export default function App() {
  const {
    flujos,
    flujoActualId,
    saveState,
    nodes,
    edges,
    testigos,
    hechos,
    loadFlujos,
    crearFlujo,
    eliminarFlujo,
    seleccionarFlujo,
    guardarFlujo,
    renombrarFlujo,
    crearNodo,
    setMode,
  } = useStore();

  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void loadFlujos();
  }, [loadFlujos]);

  useEffect(() => {
    if (!flujoActualId) return;
    const timeout = window.setTimeout(() => {
      void guardarFlujo();
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [flujoActualId, nodes, edges, testigos, hechos, guardarFlujo]);

  const flujoActual = useMemo(() => flujos.find((item) => item.id === flujoActualId) ?? null, [flujos, flujoActualId]);

  const quickActions: Array<{ type: NodeKind; label: string; icon: typeof MessageSquare }> = [
    { type: 'pregunta', label: 'Pregunta', icon: MessageSquare },
    { type: 'riesgo', label: 'Riesgo', icon: AlertTriangle },
    { type: 'documento', label: 'Documento', icon: FileText },
    { type: 'hecho', label: 'Hecho', icon: Target },
    { type: 'tema', label: 'Tema', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <SidebarPanel />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-950/85 px-6 py-4 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Testificales</div>
            <h1 className="text-2xl font-semibold tracking-tight">Mapa de estrategia probatoria</h1>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const titulo = window.prompt('Titulo del nuevo flujo', `Flujo ${flujos.length + 1}`);
                if (titulo === null) return;
                void crearFlujo(titulo || `Flujo ${flujos.length + 1}`);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200"
            >
              <Plus size={18} /> Nuevo flujo
            </button>

            <select
              value={flujoActualId ?? ''}
              onChange={(e) => void seleccionarFlujo(e.target.value)}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none"
            >
              {flujos.length === 0 ? <option value="">Sin flujos</option> : null}
              {flujos.map((flujo) => (
                <option key={flujo.id} value={flujo.id}>{flujo.titulo}</option>
              ))}
            </select>

            <button onClick={() => void guardarFlujo()} className="inline-flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3 text-sm transition hover:bg-zinc-700">
              <Save size={18} /> Guardar
            </button>
          </div>

          <div className="w-full flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="rounded-full bg-zinc-900 px-3 py-1">{formatSaveState(saveState)}</span>
            {flujoActual ? (
              <>
                <button onClick={() => {
                  const next = window.prompt('Renombrar flujo', flujoActual.titulo);
                  if (!next?.trim()) return;
                  void renombrarFlujo(next.trim());
                }} className="rounded-full bg-zinc-900 px-3 py-1 transition hover:bg-zinc-800">
                  {flujoActual.titulo}
                </button>
                <button onClick={() => void setMode(flujoActual.mode === 'preparacion' ? 'audiencia' : 'preparacion')} className="rounded-full bg-zinc-900 px-3 py-1 transition hover:bg-zinc-800">
                  Modo {flujoActual.mode}
                </button>
                <button onClick={() => {
                  if (!window.confirm(`Eliminar "${flujoActual.titulo}"?`)) return;
                  void eliminarFlujo(flujoActual.id);
                }} className="rounded-full bg-red-950 px-3 py-1 text-red-300 transition hover:bg-red-900/70">
                  Eliminar flujo
                </button>
              </>
            ) : null}
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          {flujoActual ? <FlowCanvas /> : <div className="flex h-full items-center justify-center text-zinc-500">Crea un flujo para empezar.</div>}
        </div>

        {flujoActual ? (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-[2rem] border border-zinc-800 bg-zinc-900/90 p-2 shadow-2xl backdrop-blur">
              {quickActions.map((action) => (
                <ToolbarButton key={action.type} label={action.label} icon={action.icon} onClick={() => crearNodo(action.type)} />
              ))}
            </div>
          </div>
        ) : null}
      </main>

      <NodeModal />
      <EdgeModal />
    </div>
  );
}
