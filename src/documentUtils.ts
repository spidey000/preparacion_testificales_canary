import type { Documento } from './types';

export function getDocumentLabel(documento?: Documento | null) {
  const nombre = documento?.nombre?.trim();
  return nombre && nombre.length > 0 ? nombre : 'Documento sin nombre';
}

function extractNumber(name: string | undefined): number {
  if (!name) return 0;
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function sortDocumentsByName(documentos: Documento[]) {
  return [...documentos].sort((a, b) => {
    const labelA = getDocumentLabel(a);
    const labelB = getDocumentLabel(b);
    const numA = extractNumber(labelA);
    const numB = extractNumber(labelB);
    if (numA !== 0 && numB !== 0) {
      return numA - numB;
    }
    return labelA.localeCompare(labelB, 'es', { sensitivity: 'base' });
  });
}
