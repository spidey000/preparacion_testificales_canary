import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalShell({
  isOpen,
  onClose,
  zIndexClassName,
  panelClassName,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  zIndexClassName?: string;
  panelClassName?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={`app-modal-overlay ${zIndexClassName ?? ''}`.trim()} onClick={onClose}>
      <div className={`app-modal-panel ${panelClassName ?? ''}`.trim()} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
