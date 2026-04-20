/**
 * DateInput — campo de data/mês unificado.
 *
 * Encapsula o padrão label + input[type=date|month] + mensagem de erro
 * usado em todos os formulários do app, com tokens M3 adaptativos.
 *
 * @example
 * // Campo de data simples
 * <DateInput
 *     label="Data"
 *     value={data.date}
 *     onChange={(v) => setData('date', v)}
 *     error={errors.date}
 *     required
 * />
 *
 * @example
 * // Campo de mês de referência
 * <DateInput
 *     type="month"
 *     label="Mês de Referência"
 *     value={data.reference_month}
 *     onChange={(v) => setData('reference_month', v)}
 *     error={errors.reference_month}
 *     required
 * />
 */

interface DateInputProps {
    /** Texto do label exibido acima do input */
    label: string;
    /** Valor no formato ISO: YYYY-MM-DD (date) ou YYYY-MM (month) */
    value: string;
    /** Callback chamado com o novo valor ISO quando o usuário altera */
    onChange: (value: string) => void;
    /** Mensagem de erro — renderiza abaixo do input quando definida */
    error?: string;
    /** Exibe asterisco vermelho no label */
    required?: boolean;
    /** "date" (padrão) ou "month" para seletores de mês */
    type?: 'date' | 'month';
    /** id do input (útil para htmlFor em labels externos) */
    id?: string;
    /** Valor mínimo aceito (ISO) */
    min?: string;
    /** Valor máximo aceito (ISO) */
    max?: string;
    /** Desabilita o input */
    disabled?: boolean;
    /** Classe extra aplicada ao elemento <input> */
    inputClassName?: string;
    /** Classe extra aplicada ao wrapper externo */
    className?: string;
}

export function DateInput({
    label,
    value,
    onChange,
    error,
    required = false,
    type = 'date',
    id,
    min,
    max,
    disabled = false,
    inputClassName = '',
    className = '',
}: DateInputProps) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label
                htmlFor={id}
                className="text-sm text-[var(--md-color-on-surface-variant)]"
            >
                {label}
                {required && (
                    <span className="text-[var(--md-color-error)] ml-0.5">*</span>
                )}
            </label>

            <input
                id={id}
                type={type}
                value={value}
                min={min}
                max={max}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className={[
                    'bg-[var(--color-input-bg)]',
                    'border-[var(--color-border)]',
                    'rounded-lg px-3 py-2.5',
                    'text-[var(--md-color-on-surface)] text-sm',
                    'focus:outline-none focus:border-[var(--md-color-primary)]',
                    'disabled:opacity-38 disabled:cursor-not-allowed',
                    'transition-colors',
                    // Adapta o ícone do calendar nativo em dark/light
                    '[color-scheme:dark] dark:[color-scheme:dark]',
                    inputClassName,
                ].join(' ')}
            />

            {error && (
                <p className="text-[var(--md-color-error)] text-xs">{error}</p>
            )}
        </div>
    );
}
