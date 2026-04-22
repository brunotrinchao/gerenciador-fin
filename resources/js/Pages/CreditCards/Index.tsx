import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { creditCardsSteps } from '@/tutorials/steps/credit-cards';
import { CreditCard } from '@/types/models';
import { LimitBar } from '@/Components/CreditCards/LimitBar';
import { Plus, CreditCard as CreditCardIcon, Pencil, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { CurrencyInput } from '@/Components/CurrencyInput';
import { BrandSelector } from '@/Components/BrandSelector';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
    cards: CreditCard[];
    stats: {
        total_limit: number;
        total_available: number;
        total_used: number;
        usage_percent: number;
        active_count: number;
    };
}

interface FormData {
    name: string;
    brand: string;
    credit_limit: string;
    closing_day: string;
    due_day: string;
    color: string;
    is_active: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);


const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#22c55e', '#3b82f6', '#0ea5e9',
];

// ─────────────────────────────────────────────
// BrandLogo
// ─────────────────────────────────────────────

function BrandLogo({ brand }: { brand: string | null }) {
    if (brand === 'visa') {
        return (
            <svg viewBox="0 0 50 16" className="h-5 w-auto" fill="none">
                <text x="0" y="13" fontSize="16" fontWeight="900" fontFamily="Arial" fill="white" letterSpacing="-1">VISA</text>
            </svg>
        );
    }
    if (brand === 'mastercard') {
        return (
            <svg viewBox="0 0 38 24" className="h-6 w-auto">
                <circle cx="14" cy="12" r="12" fill="#eb001b" opacity="0.9" />
                <circle cx="24" cy="12" r="12" fill="#f79e1b" opacity="0.9" />
                <path d="M19 5.4a12 12 0 0 1 0 13.2A12 12 0 0 1 19 5.4z" fill="#ff5f00" opacity="0.9" />
            </svg>
        );
    }
    if (brand === 'elo') {
        return (
            <span className="text-white font-black text-sm tracking-tight" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                elo
            </span>
        );
    }
    if (brand === 'amex') {
        return (
            <span className="text-white font-bold text-[10px] tracking-widest border border-white/20 px-1.5 py-0.5 rounded">
                AMEX
            </span>
        );
    }
    if (brand === 'hipercard') {
        return (
            <span className="text-white font-bold text-[10px] tracking-wide">
                Hiper
            </span>
        );
    }
    return null;
}

// ─────────────────────────────────────────────
// CreditCardCard
// ─────────────────────────────────────────────

interface CreditCardCardProps {
    card: CreditCard;
    onEdit: (card: CreditCard) => void;
    onDelete: (card: CreditCard) => void;
}

function CreditCardCard({ card, onEdit, onDelete }: CreditCardCardProps) {
    return (
        <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-[var(--md-color-outline)] shadow-sm">
            {/* Cartão visual — proporção 1.586:1 */}
            <div
                className="relative p-5 flex flex-col justify-between"
                style={{
                    background: `linear-gradient(135deg, ${card.color} 0%, color-mix(in srgb, ${card.color}, black 20%) 100%)`,
                    minHeight: '160px',
                }}
            >
                {/* Chip + Bandeira */}
                <div className="flex items-start justify-between">
                    {/* Chip simulado */}
                    <div className="w-9 h-7 rounded bg-yellow-300/80 flex items-center justify-center">
                        <div className="w-7 h-5 rounded-sm border border-yellow-400/60 grid grid-cols-3 gap-px p-0.5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-yellow-500/40 rounded-sm" />
                            ))}
                        </div>
                    </div>
                    <BrandLogo brand={card.brand} />
                </div>

                {/* Nome do cartão */}
                <div>
                    <p className="text-white/60 text-[10px] uppercase tracking-widest mb-0.5 font-bold">
                        Cartão de Crédito
                    </p>
                    <p className="text-white font-black text-lg leading-tight drop-shadow-md">
                        {card.name}
                    </p>
                </div>

                {/* Círculos decorativos */}
                <div
                    className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-white"
                />
                <div
                    className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full opacity-10 bg-white"
                />
            </div>

            {/* Informações */}
            <div className="px-5 py-4 flex flex-col gap-4">
                {/* Barra de limite unificada */}
                <LimitBar card={card} />

                {/* Datas e Status */}
                <div className="flex items-center justify-between pt-1 border-t border-[border-[var(--color-border)]]/50">
                    <div className="flex gap-4">
                        <div>
                            <p className="text-[var(--md-color-on-surface-variant)] text-[9px] uppercase font-bold tracking-tighter mb-0.5">Fecha</p>
                            <p className="text-[var(--md-color-on-surface)] text-xs font-black">Dia {card.closing_day}</p>
                        </div>
                        <div>
                            <p className="text-[var(--md-color-on-surface-variant)] text-[9px] uppercase font-bold tracking-tighter mb-0.5">Vence</p>
                            <p className="text-[var(--md-color-on-surface)] text-xs font-black">Dia {card.due_day}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                        card.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                        {card.is_active ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                        <span className="text-[10px] font-black uppercase tracking-tighter">{card.is_active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(card)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[bg-[var(--color-surface-2)]] text-[var(--md-color-on-surface)] hover:bg-[var(--md-color-outline-variant)] transition-all text-[11px] font-black uppercase tracking-tighter"
                    >
                        <Pencil size={12} />
                        Editar
                    </button>
                    <button
                        onClick={() => onDelete(card)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all text-[11px] font-black uppercase tracking-tighter"
                    >
                        <Trash2 size={12} />
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// CardFormModal (Omitido p/ brevidade, mantém igual)
// ─────────────────────────────────────────────

interface CardFormModalProps {
    editingCard: CreditCard | null;
    onClose: () => void;
}

function CardFormModal({ editingCard, onClose }: CardFormModalProps) {
    const isEditing = editingCard !== null;

    const { data, setData, post, patch, processing, errors, reset } = useForm<FormData>({
        name: editingCard?.name ?? '',
        brand: editingCard?.brand ?? '',
        credit_limit: editingCard ? String(editingCard.credit_limit) : '',
        closing_day: editingCard ? String(editingCard.closing_day) : '',
        due_day: editingCard ? String(editingCard.due_day) : '',
        color: editingCard?.color ?? '#6366f1',
        is_active: editingCard?.is_active ?? true,
    });

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isEditing) {
            patch(route('credit-cards.update', editingCard.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('credit-cards.store'), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 modal-overlay" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto modal-content">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[border-[var(--color-border)]] sticky top-0 bg-[var(--color-surface)] z-10">
                    <h2 className="text-[var(--md-color-on-surface)] font-bold text-lg">
                        {isEditing ? 'Editar Cartão' : 'Novo Cartão'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[bg-[var(--color-surface-2)]] transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-tighter text-[var(--md-color-on-surface-variant)]">Nome</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-tighter text-[var(--md-color-on-surface-variant)]">Bandeira</label>
                        <BrandSelector value={data.brand} onChange={(v) => setData('brand', v)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-tighter text-[var(--md-color-on-surface-variant)]">Limite</label>
                        <CurrencyInput value={data.credit_limit} onChange={(v) => setData('credit_limit', v)} className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-tighter text-[var(--md-color-on-surface-variant)]">Dia Fechamento</label>
                            <input type="number" value={data.closing_day} onChange={(e) => setData('closing_day', e.target.value)} className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-tighter text-[var(--md-color-on-surface-variant)]">Dia Vencimento</label>
                            <input type="number" value={data.due_day} onChange={(e) => setData('due_day', e.target.value)} className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-2">
                        <button type="submit" disabled={processing} className="w-full py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-black uppercase tracking-widest transition-all">
                            {processing ? 'Salvando...' : 'Salvar Cartão'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CreditCardsIndex({ cards, stats }: Props) {
    const { flash } = usePage().props;
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [deletingCard, setDeletingCard] = useState<CreditCard | null>(null);

    const { start: startTutorial } = useTutorial({ key: 'credit-cards', title: 'Tour dos Cartões', steps: creditCardsSteps });

    const openCreate = () => { setEditingCard(null); setShowFormModal(true); };
    const openEdit = (card: CreditCard) => { setEditingCard(card); setShowFormModal(true); };
    const closeFormModal = () => { setShowFormModal(false); setEditingCard(null); };

    return (
        <AppLayout title="Cartões de Crédito">
            <Head title="Cartões de Crédito" />

            <div className="w-full flex flex-col gap-6">
                {/* Flash messages */}
                {(flash as { success?: string })?.success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={16} /> {(flash as { success?: string }).success}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black font-display text-[var(--md-color-on-surface)]">Cartões de Crédito</h1>
                            <TutorialHelpButton onStart={startTutorial} />
                        </div>
                        <p className="text-[var(--md-color-on-surface-variant)] text-xs font-bold uppercase tracking-tighter mt-1 opacity-70">
                            Resumo de limite e cartões ativos
                        </p>
                    </div>

                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-black uppercase tracking-tighter transition-all"
                    >
                        <Plus size={16} /> Novo Cartão
                    </button>
                </div>

                {/* Summary cards (States) */}
                {stats && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Limite Total */}
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-[var(--md-color-on-surface-variant)] uppercase font-black tracking-widest mb-1">Limite Total</p>
                                <p className="text-[var(--md-color-on-surface)] font-black text-2xl font-finance">{formatCurrency(stats.total_limit)}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="text-[10px] text-[var(--md-color-on-surface-variant)] font-bold uppercase">{stats.active_count} ATIVOS</span>
                                </div>
                            </div>

                            {/* Limite Disponível */}
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-[var(--md-color-on-surface-variant)] uppercase font-black tracking-widest mb-1 text-[#22c55e]">Limite Disponível</p>
                                <p className="text-[#22c55e] font-black text-2xl font-finance">{formatCurrency(stats.total_available)}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                                    <span className="text-[10px] text-[var(--md-color-on-surface-variant)] font-bold uppercase">Livre p/ uso</span>
                                </div>
                            </div>

                            {/* Limite Usado */}
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-[var(--md-color-on-surface-variant)] uppercase font-black tracking-widest mb-1 text-[#ef4444]">Limite Usado</p>
                                <p className="text-[#ef4444] font-black text-2xl font-finance">{formatCurrency(stats.total_used)}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                                    <span className="text-[10px] text-[var(--md-color-on-surface-variant)] font-bold uppercase">{stats.usage_percent}% do total</span>
                                </div>
                            </div>
                        </div>

                        {/* Barra de uso geral: Limite Total - Limite Usado */}
                        <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl px-5 py-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] text-[var(--md-color-on-surface-variant)] font-black uppercase tracking-widest">Uso geral dos cartões</p>
                                <p className="text-[var(--md-color-on-surface)] text-xs font-black uppercase">{stats.usage_percent.toFixed(1)}% utilizado</p>
                            </div>
                            <div className="w-full h-1.5 bg-[bg-[var(--color-surface-2)]] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${stats.usage_percent}%`,
                                        backgroundColor: stats.usage_percent > 90 ? '#ef4444' : stats.usage_percent > 60 ? '#f59e0b' : '#3b82f6',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card) => (
                        <CreditCardCard
                            key={card.id}
                            card={card}
                            onEdit={openEdit}
                            onDelete={setDeletingCard}
                        />
                    ))}
                </div>
            </div>

            {/* Modals ... */}
            {showFormModal && <CardFormModal editingCard={editingCard} onClose={closeFormModal} />}
            {deletingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 modal-overlay" onClick={() => setDeletingCard(null)} />
                    <div className="relative z-10 w-full max-w-sm bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl shadow-xl p-6 modal-content">
                        <h2 className="text-[var(--md-color-on-surface)] font-bold text-lg mb-2">Excluir cartão</h2>
                        <p className="text-[var(--md-color-on-surface-variant)] text-sm mb-6">Tem certeza que deseja excluir o cartão "{deletingCard.name}"?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingCard(null)} className="flex-1 py-2.5 rounded-xl border border-[border-[var(--color-border)]] text-xs font-black uppercase tracking-tighter">Cancelar</button>
                            <button onClick={() => {
                                router.delete(route('credit-cards.destroy', deletingCard.id), { onSuccess: () => setDeletingCard(null) });
                            }} className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-tighter">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
