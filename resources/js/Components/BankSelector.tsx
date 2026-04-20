/**
 * BankSelector — dropdown pesquisável de bancos brasileiros
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface BankOption {
    value: string;
    label: string;
    code: string;
}

export const BRAZILIAN_BANKS: BankOption[] = [
    { value: 'banco_do_brasil',  label: 'Banco do Brasil',          code: '001' },
    { value: 'santander',        label: 'Santander',                code: '033' },
    { value: 'caixa',            label: 'Caixa Econômica Federal',  code: '104' },
    { value: 'bradesco',         label: 'Bradesco',                 code: '237' },
    { value: 'itau',             label: 'Itaú Unibanco',            code: '341' },
    { value: 'btg_pactual',      label: 'BTG Pactual',              code: '208' },
    { value: 'sicoob',           label: 'Sicoob',                   code: '756' },
    { value: 'inter',            label: 'Banco Inter',              code: '077' },
    { value: 'pan',              label: 'Banco Pan',                code: '623' },
    { value: 'c6_bank',          label: 'C6 Bank',                  code: '336' },
    { value: 'nubank',           label: 'Nubank',                   code: '260' },
    { value: 'neon',             label: 'Neon',                     code: '735' },
    { value: 'original',         label: 'Banco Original',           code: '212' },
    { value: 'safra',            label: 'Banco Safra',              code: '422' },
    { value: 'sicredi',          label: 'Sicredi',                  code: '748' },
    { value: 'xp',               label: 'XP Investimentos',         code: '102' },
    { value: 'picpay',           label: 'PicPay',                   code: '380' },
    { value: 'mercado_pago',     label: 'Mercado Pago',             code: '323' },
    { value: 'will_bank',        label: 'Will Bank',                code: '280' },
    { value: 'bs2',              label: 'Banco BS2',                code: '218' },
    { value: 'modal',            label: 'Banco Modal',              code: '746' },
    { value: 'bmg',              label: 'BMG',                      code: '318' },
    { value: 'banrisul',         label: 'Banrisul',                 code: '041' },
    { value: 'bv',               label: 'Banco BV',                 code: '413' },
    { value: 'parana',           label: 'Paraná Banco',             code: '254' },
    { value: 'outro',            label: 'Outro',                    code: '000' },
];

/** Tenta detectar banco pelo nome (texto livre) */
export function guessBankFromName(name: string): BankOption | null {
    if (!name) return null;
    const n = name.toLowerCase();
    return BRAZILIAN_BANKS.find(b =>
        n.includes(b.label.toLowerCase()) || n.includes(b.value.replace('_', ' '))
    ) ?? null;
}

interface BankSelectorProps {
    value: string;           // valor atual (BankOption.value ou '' )
    onChange: (value: string, bank: BankOption | null) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export function BankSelector({
    value,
    onChange,
    placeholder = 'Selecione o banco...',
    className = '',
    required: _required,
}: BankSelectorProps) {
    const [open, setOpen]       = useState(false);
    const [search, setSearch]   = useState('');
    const containerRef          = useRef<HTMLDivElement>(null);

    const selected = BRAZILIAN_BANKS.find(b => b.value === value) ?? null;

    const filtered = BRAZILIAN_BANKS.filter(b =>
        b.label.toLowerCase().includes(search.toLowerCase()) ||
        b.code.includes(search)
    );

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
            >
                {selected ? (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono bg-[bg-[var(--color-surface-2)]] px-1.5 py-0.5 rounded">
                            {selected.code}
                        </span>
                        <span className="text-white">{selected.label}</span>
                    </div>
                ) : (
                    <span className="text-gray-500">{placeholder}</span>
                )}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {value && (
                        <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); onChange('', null); }}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={13} />
                        </span>
                    )}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-xl shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="px-3 py-2 border-b border-[border-[var(--color-border)]] flex items-center gap-2">
                        <Search size={13} className="text-gray-500 flex-shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar banco ou código..."
                            className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                        />
                    </div>

                    {/* Options */}
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">Nenhum banco encontrado</p>
                        ) : (
                            filtered.map(bank => (
                                <button
                                    key={bank.value}
                                    type="button"
                                    onClick={() => { onChange(bank.value, bank); setOpen(false); setSearch(''); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-2)] ${
                                        bank.value === value ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'text-white'
                                    }`}
                                >
                                    <span className="text-[10px] text-gray-500 font-mono bg-[bg-[var(--color-surface-2)]] px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0">
                                        {bank.code}
                                    </span>
                                    {bank.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
