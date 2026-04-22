import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { CustomEdge } from '../types';

export default function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  data,
}: EdgeProps<CustomEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const labelText = typeof label === 'string' ? label : '';
  const isAnswerEdge = typeof data?.sourceAnswerText === 'string' && data.sourceAnswerText.trim().length > 0;
  const [connectionTypeText, ...labelRestLines] = labelText.split('\n');
  const answerBodyText = labelRestLines.join('\n');

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {labelText ? (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute flex max-h-[20ch] w-[20ch] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-black/95 px-2 py-2 text-center text-xs font-semibold leading-4 whitespace-pre-wrap break-words shadow-xl"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: '#d4d4d8',
            }}
          >
            {isAnswerEdge ? (
              <div>
                <div style={{ color: '#ef4444' }}>{connectionTypeText}</div>
                {answerBodyText ? <div style={{ color: '#facc15' }}>{answerBodyText}</div> : null}
              </div>
            ) : (
              labelText
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
