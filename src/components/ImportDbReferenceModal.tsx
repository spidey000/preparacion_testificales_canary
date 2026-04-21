import { Copy, Download, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  buildDbFileName,
  buildExampleDbExport,
  buildReferencePrompt,
  buildTemplateDbExport,
} from '../importExport';

function downloadJsonFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ImportDbReferenceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const prompt = useMemo(() => buildReferencePrompt(), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Referencia de importacion</div>
            <h2 className="text-xl font-semibold text-zinc-100">Formato .db para generar desde una IA</h2>
            <p className="mt-2 max-w-4xl text-sm text-zinc-400">
              Este texto esta preparado para pegarse directamente en una IA junto con unas notas o texto plano sobre testigos, hechos y preguntas. La IA debe devolver un archivo JSON importable por Testificales.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(prompt);
                  setCopyState('copied');
                  window.setTimeout(() => setCopyState('idle'), 1500);
                } catch {
                  setCopyState('error');
                  window.setTimeout(() => setCopyState('idle'), 2000);
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              <Copy size={16} /> {copyState === 'copied' ? 'Prompt copiado' : copyState === 'error' ? 'Error al copiar' : 'Copiar este prompt'}
            </button>

            <button
              onClick={() => downloadJsonFile(JSON.stringify(buildTemplateDbExport(), null, 2), `template-${buildDbFileName()}`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3 text-sm transition hover:bg-zinc-700"
            >
              <Download size={16} /> Descargar template
            </button>

            <button
              onClick={() => downloadJsonFile(JSON.stringify(buildExampleDbExport(), null, 2), `ejemplo-${buildDbFileName()}`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3 text-sm transition hover:bg-zinc-700"
            >
              <Download size={16} /> Descargar ejemplo
            </button>
          </div>

          <textarea
            readOnly
            value={prompt}
            className="h-full w-full resize-none rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 font-mono text-xs leading-6 text-zinc-200 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
