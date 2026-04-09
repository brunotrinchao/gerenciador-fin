import { HelpCircle } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export function TutorialHelpButton({ onStart }: Props) {
  return (
    <button
      onClick={onStart}
      className="inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors hover:opacity-80 active:scale-95 flex-shrink-0"
      style={{
        backgroundColor: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-muted)',
      }}
      aria-label="Iniciar tutorial da página"
      title="Ajuda — Tutorial interativo"
    >
      <HelpCircle size={13} />
    </button>
  );
}
