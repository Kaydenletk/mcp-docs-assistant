export type ChatMode = 'agent' | 'graph';

interface ModeToggleProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

const MODES: { value: ChatMode; label: string; title: string }[] = [
  { value: 'agent', label: 'Agent', title: 'Vercel AI SDK tool-loop (streaming)' },
  { value: 'graph', label: 'Corrective-RAG', title: 'LangGraph: grades retrieval and re-queries' },
];

/** Segmented control choosing which agent backend answers. */
export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="radiogroup" aria-label="Answering engine">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={mode === m.value}
          title={m.title}
          disabled={disabled}
          className="mode-toggle__opt"
          data-active={mode === m.value}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
