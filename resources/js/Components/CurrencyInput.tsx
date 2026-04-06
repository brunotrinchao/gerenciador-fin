import { useRef } from 'react';

interface CurrencyInputProps {
    value: string | number;
    onChange: (raw: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
}

/**
 * Input de moeda BRL.
 * - `value`: valor numérico como string (ex: "1234.56") ou number
 * - `onChange`: chamado com o valor numérico como string (ex: "1234.56")
 * - Exibe formatado em BRL enquanto edita (ex: "R$ 1.234,56")
 */
export function CurrencyInput({ value, onChange, placeholder = 'R$ 0,00', className = '', disabled, id }: CurrencyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Formata número para exibição BRL
    const formatDisplay = (raw: string | number): string => {
        if (raw === null || raw === undefined || raw === '') return '';
        const num = typeof raw === 'number' ? raw : parseFloat(raw);
        if (isNaN(num)) return '';

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(num);
    };

    // Remove formatação e retorna dígitos
    const stripFormat = (formatted: string): string => {
        // Verifica se o valor contém um sinal de menos
        const isNegative = formatted.includes('-');
        
        // Remove tudo que não é dígito
        const digits = formatted.replace(/\D/g, '');
        
        if (!digits) return '';

        // Converte para decimal (centavos)
        const cents = parseInt(digits, 10);
        const result = (cents / 100).toFixed(2);

        // Retorna com o sinal se for negativo
        return isNegative ? `-${result}` : result;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        
        // Se o usuário apagar tudo, enviamos vazio
        if (raw === '') {
            onChange('');
            return;
        }

        const numeric = stripFormat(raw);
        onChange(numeric);
    };

    const handleFocus = () => {
        // Seleciona tudo ao focar
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const displayValue = formatDisplay(value);

    return (
        <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
}
