import type { Cobertura } from './types';

export function getFactCoverageByQuestionNodes(questionNodeCount: number): Cobertura {
  if (questionNodeCount <= 0) return 'no-cubierto';
  if (questionNodeCount <= 3) return 'debil';
  if (questionNodeCount <= 6) return 'cubierto';
  return 'muy-cubierto';
}
