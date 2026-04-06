/**
 * BrandSelector — seletor visual de bandeira de cartão
 * Exibe botões coloridos com o nome/logo de cada bandeira.
 */

interface BrandOption {
    value: string;
    label: string;
    color: string;
    textColor?: string;
}

export const CARD_BRANDS: BrandOption[] = [
    { value: 'visa',       label: 'Visa',             color: '#1a1f71', textColor: '#ffffff' },
    { value: 'mastercard', label: 'Mastercard',        color: '#eb001b', textColor: '#ffffff' },
    { value: 'elo',        label: 'Elo',               color: '#00a4e0', textColor: '#ffffff' },
    { value: 'amex',       label: 'Amex',              color: '#007bc1', textColor: '#ffffff' },
    { value: 'hipercard',  label: 'Hipercard',         color: '#b3131b', textColor: '#ffffff' },
    { value: 'diners',     label: 'Diners',            color: '#4a4f55', textColor: '#ffffff' },
    { value: 'aura',       label: 'Aura',              color: '#d4870a', textColor: '#ffffff' },
    { value: 'outro',      label: 'Outro',             color: '#374151', textColor: '#9ca3af' },
];

/** Detecta bandeira pelo nome do banco emissor */
export function guessBrandFromBank(bank: string | null): string {
    if (!bank) return '';
    const b = bank.toLowerCase();
    if (b.includes('nubank') || b.includes('inter') || b.includes('c6') || b.includes('btg') ||
        b.includes('next') || b.includes('picpay') || b.includes('will') || b.includes('neon') ||
        b.includes('bradesco') || b.includes('santander')) return 'mastercard';
    if (b.includes('xp') || b.includes('itau') || b.includes('caixa') || b.includes('bb') ||
        b.includes('banco do brasil') || b.includes('bs2')) return 'visa';
    if (b.includes('elo')) return 'elo';
    if (b.includes('amex') || b.includes('american')) return 'amex';
    if (b.includes('hipercard')) return 'hipercard';
    return '';
}

interface BrandSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function BrandSelector({ value, onChange, className = '' }: BrandSelectorProps) {
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {CARD_BRANDS.map((brand) => {
                const selected = value === brand.value;
                return (
                    <button
                        key={brand.value}
                        type="button"
                        onClick={() => onChange(brand.value)}
                        className="relative flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2"
                        style={{
                            backgroundColor: selected ? brand.color : 'transparent',
                            borderColor: selected ? brand.color : 'var(--color-border)',
                            color: selected ? (brand.textColor ?? '#fff') : '#6b7280',
                        }}
                        title={brand.label}
                    >
                        {brand.label}
                        {selected && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#22c55e] rounded-full border border-[var(--color-surface)]" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
