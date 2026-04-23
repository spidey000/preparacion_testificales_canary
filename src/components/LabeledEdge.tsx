import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import type { CustomEdge, CustomNode } from '../types';
import { useStore } from '../store';

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
  const updateEdge = useStore((state) => state.updateEdge);
  const { getZoom } = useReactFlow<CustomNode, CustomEdge>();
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
  const savedOffset = data?.labelOffset && typeof data.labelOffset.x === 'number' && typeof data.labelOffset.y === 'number'
    ? data.labelOffset
    : { x: 0, y: 0 };
  const [draftOffset, setDraftOffset] = useState(savedOffset);
  const dragStateRef = useRef<{ pointerId: number; startClientX: number; startClientY: number; startOffsetX: number; startOffsetY: number } | null>(null);

  useEffect(() => {
    setDraftOffset(savedOffset);
  }, [savedOffset.x, savedOffset.y]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const zoom = getZoom() || 1;
      const deltaX = (event.clientX - dragState.startClientX) / zoom;
      const deltaY = (event.clientY - dragState.startClientY) / zoom;
      setDraftOffset({
        x: dragState.startOffsetX + deltaX,
        y: dragState.startOffsetY + deltaY,
      });
      event.preventDefault();
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const zoom = getZoom() || 1;
      const nextOffset = {
        x: dragState.startOffsetX + ((event.clientX - dragState.startClientX) / zoom),
        y: dragState.startOffsetY + ((event.clientY - dragState.startClientY) / zoom),
      };

      dragStateRef.current = null;
      updateEdge(id, { labelOffset: nextOffset });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [getZoom, id, updateEdge]);

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {labelText ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute flex max-h-[20ch] w-[20ch] -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-black/95 px-2 py-2 text-center text-xs font-semibold leading-4 whitespace-pre-wrap break-words shadow-xl active:cursor-grabbing"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX + draftOffset.x}px, ${labelY + draftOffset.y}px)`,
              color: '#d4d4d8',
              pointerEvents: 'all',
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dragStateRef.current = {
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startClientY: event.clientY,
                startOffsetX: draftOffset.x,
                startOffsetY: draftOffset.y,
              };
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
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
