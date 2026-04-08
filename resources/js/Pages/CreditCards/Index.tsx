import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CreditCard } from '@/types/models';
import { LimitBar } from '@/Components/CreditCards/LimitBar';
import { Plus, CreditCard as CreditCardIcon, Pencil, Trash2, X } from 'lucide-react';
import { CurrencyInput } from '@/Components/CurrencyInput';
import { BrandSelector } from '@/Components/BrandSelector';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
    cards: CreditCard[];
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
            <span className="text-white font-bold text-[10px] tracking-widest border border-white/50 px-1.5 py-0.5 rounded">
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
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col">
            {/* Cartão visual — proporção 1.586:1 */}
            <div
                className="relative p-5 flex flex-col justify-between"
                style={{
                    background: `linear-gradient(135deg, ${card.color}ee 0%, ${card.color}99 100%)`,
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
                    <p className="text-white/60 text-[10px] uppercase tracking-widest mb-0.5">
                        Cartão de Crédito
                    </p>
                    <p className="text-white font-bold text-base leading-tight drop-shadow-sm">
                        {card.name}
                    </p>
                </div>

                {/* Círculos decorativos */}
                <div
                    className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
                    style={{ backgroundColor: 'white' }}
                />
                <div
                    className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full opacity-10"
                    style={{ backgroundColor: 'white' }}
                />
            </div>

            {/* Informações */}
            <div className="px-5 py-4 flex flex-col gap-3">
                {/* Limite disponível + uso */}
                <div>
                    <LimitBar card={card} />
                </div>

                {/* Datas */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                        <div>
                            <p className="text-[var(--md-color-on-surface-variant)] text-xs">Fechamento</p>
                            <p className="text-[var(--md-color-on-surface)] font-medium">Dia {card.closing_day}</p>
                        </div>
                        <div>
                            <p className="text-[var(--md-color-on-surface-variant)] text-xs">Vencimento</p>
                            <p className="text-[var(--md-color-on-surface)] font-medium">Dia {card.due_day}</p>
                        </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        card.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                        {card.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                </div>

                {card.bank_account && (
                    <p className="text-[var(--md-color-on-surface-variant)] text-xs">
                        Vinculado a: <span className="text-[var(--md-color-on-surface-variant)]">{card.bank_account.name}</span>
                    </p>
                )}

                {/* Ações */}
                <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]">
                    <button
                        onClick={() => onEdit(card)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)] hover:bg-[var(--color-surface-2)] transition-colors text-xs font-medium"
                    >
                        <Pencil size={13} />
                        Editar
                    </button>
                    <button
                        onClick={() => onDelete(card)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-error)] hover:bg-red-500/10 transition-colors text-xs font-medium"
                    >
                        <Trash2 size={13} />
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// CardFormModal
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
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto modal-content">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
                    <h2 className="text-[var(--md-color-on-surface)] font-semibold text-lg">
                        {isEditing ? 'Editar Cartão' : 'Novo Cartão'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)] hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Nome */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">
                            Nome <span className="text-[var(--md-color-error)]">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ex: Nubank Roxinho"
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.name && (
                            <p className="text-[var(--md-color-error)] text-xs">{errors.name}</p>
                        )}
                    </div>

                    {/* Bandeira */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">Bandeira</label>
                        <BrandSelector
                            value={data.brand}
                            onChange={(v) => setData('brand', v)}
                        />
                        {errors.brand && (
                            <p className="text-[var(--md-color-error)] text-xs">{errors.brand}</p>
                        )}
                    </div>

                    {/* Limite */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">
                            Limite de Crédito <span className="text-[var(--md-color-error)]">*</span>
                        </label>
                        <CurrencyInput
                            value={data.credit_limit}
                            onChange={(v) => setData('credit_limit', v)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.credit_limit && (
                            <p className="text-[var(--md-color-error)] text-xs">{errors.credit_limit}</p>
                        )}
                    </div>

                    {/* Dias */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-[var(--md-color-on-surface-variant)]">
                                Dia de Fechamento <span className="text-[var(--md-color-error)]">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={data.closing_day}
                                onChange={(e) => setData('closing_day', e.target.value)}
                                placeholder="Ex: 20"
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                            {errors.closing_day && (
                                <p className="text-[var(--md-color-error)] text-xs">{errors.closing_day}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-[var(--md-color-on-surface-variant)]">
                                Dia de Vencimento <span className="text-[var(--md-color-error)]">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={data.due_day}
                                onChange={(e) => setData('due_day', e.target.value)}
                                placeholder="Ex: 27"
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                            {errors.due_day && (
                                <p className="text-[var(--md-color-error)] text-xs">{errors.due_day}</p>
                            )}
                        </div>
                    </div>

                    {/* Cor */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">Cor do Cartão</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setData('color', color)}
                                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                                        data.color === color
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface)] scale-110'
                                            : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <input
                                type="color"
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0"
                                title="Cor personalizada"
                            />
                        </div>
                        {/* Preview */}
                        <div
                            className="mt-1 h-8 rounded-lg flex items-center px-3"
                            style={{ background: data.color }}
                        >
                            <p className="text-white text-xs font-semibold drop-shadow">
                                {data.name || 'Pré-visualização'}
                            </p>
                        </div>
                    </div>

                    {/* Status — apenas edição */}
                    {isEditing && (
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <div
                                    className={`w-10 h-5 rounded-full transition-colors ${
                                        data.is_active ? 'bg-[#22c55e]' : 'bg-[var(--color-surface-2)]'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                            data.is_active ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </div>
                            </div>
                            <span className="text-sm text-[var(--md-color-on-surface-variant)]">Cartão ativo</span>
                        </label>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)] hover:border-gray-500 text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DeleteConfirmModal
// ─────────────────────────────────────────────

interface DeleteConfirmModalProps {
    card: CreditCard;
    onClose: () => void;
}

function DeleteConfirmModal({ card, onClose }: DeleteConfirmModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('credit-cards.destroy', card.id), {
            onFinish: () => {
                setDeleting(false);
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 flex flex-col gap-5 modal-content">
                <div className="flex flex-col gap-2">
                    <h2 className="text-[var(--md-color-on-surface)] font-semibold text-lg">Excluir cartão</h2>
                    <p className="text-[var(--md-color-on-surface-variant)] text-sm">
                        Tem certeza que deseja excluir o cartão{' '}
                        <span className="text-[var(--md-color-on-surface)] font-medium">"{card.name}"</span>?
                    </p>
                    <p className="text-[var(--md-color-error)] text-xs">Esta ação não pode ser desfeita.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)] hover:border-gray-500 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleting ? 'Excluindo...' : 'Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CreditCardsIndex({ cards }: Props) {
    const { flash } = usePage().props;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [deletingCard, setDeletingCard] = useState<CreditCard | null>(null);

    const activeCards = cards.filter((c) => c.is_active);
    const totalLimit = activeCards.reduce((sum, c) => sum + c.credit_limit, 0);
    const totalAvailable = activeCards.reduce((sum, c) => sum + c.available_limit, 0);

    const openCreate = () => {
        setEditingCard(null);
        setShowFormModal(true);
    };

    const openEdit = (card: CreditCard) => {
        setEditingCard(card);
        setShowFormModal(true);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setEditingCard(null);
    };

    return (
        <AppLayout title="Cartões de Crédito">
            <Head title="Cartões de Crédito" />

            <div className="w-full flex flex-col gap-6">
                {/* Flash messages */}
                {(flash as { success?: string })?.success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
                        {(flash as { success?: string }).success}
                    </div>
                )}
                {(flash as { error?: string })?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                        {(flash as { error?: string }).error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--md-color-on-surface)]">Cartões de Crédito</h1>
                        <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                            {cards.length === 0
                                ? 'Nenhum cartão cadastrado'
                                : `${cards.length} cartão${cards.length !== 1 ? 'ões' : ''} cadastrado${cards.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <Plus size={16} />
                        Novo Cartão
                    </button>
                </div>

                {/* Summary cards */}
                {activeCards.length > 0 && (() => {
                    const totalUsed = totalLimit - totalAvailable;
                    const usagePercent = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;
                    return (
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Limite Total */}
                                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center">
                                            <CreditCardIcon size={16} className="text-[var(--md-color-on-surface-variant)]" />
                                        </div>
                                        <p className="text-[var(--md-color-on-surface-variant)] text-sm">Limite Total</p>
                                    </div>
                                    <p className="text-[var(--md-color-on-surface)] font-bold text-2xl">{formatCurrency(totalLimit)}</p>
                                    <p className="text-[var(--md-color-on-surface-variant)] text-xs mt-1">
                                        {activeCards.length} cartão{activeCards.length !== 1 ? 'ões' : ''} ativo{activeCards.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Disponível */}
                                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                                            <CreditCardIcon size={16} className="text-[#22c55e]" />
                                        </div>
                                        <p className="text-[var(--md-color-on-surface-variant)] text-sm">Disponível</p>
                                    </div>
                                    <p className="text-[#22c55e] font-bold text-2xl">{formatCurrency(totalAvailable)}</p>
                                    <p className="text-[var(--md-color-on-surface-variant)] text-xs mt-1">
                                        {totalLimit > 0 ? `${(100 - usagePercent).toFixed(0)}% livre` : 'Sem limite'}
                                    </p>
                                </div>

                                {/* Utilizado */}
                                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                                            <CreditCardIcon size={16} className="text-[var(--md-color-error)]" />
                                        </div>
                                        <p className="text-[var(--md-color-on-surface-variant)] text-sm">Utilizado</p>
                                    </div>
                                    <p className="text-[var(--md-color-error)] font-bold text-2xl">{formatCurrency(totalUsed)}</p>
                                    <p className="text-[var(--md-color-on-surface-variant)] text-xs mt-1">
                                        {usagePercent.toFixed(0)}% do limite total
                                    </p>
                                </div>
                            </div>

                            {/* Barra de uso geral */}
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[var(--md-color-on-surface-variant)] text-xs">Uso geral dos cartões</p>
                                    <p className="text-[var(--md-color-on-surface-variant)] text-xs">{usagePercent.toFixed(1)}% utilizado</p>
                                </div>
                                <div className="w-full h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${usagePercent}%`,
                                            backgroundColor: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#22c55e',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Cards grid */}
                {cards.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                            <CreditCardIcon size={24} className="text-[var(--md-color-on-surface-variant)]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[var(--md-color-on-surface)] font-medium">Nenhum cartão cadastrado</p>
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                                Adicione seu primeiro cartão de crédito para começar.
                            </p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                        >
                            <Plus size={16} />
                            Novo Cartão
                        </button>
                    </div>
                ) : (
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
                )}
            </div>

            {/* Modals */}
            {showFormModal && (
                <CardFormModal
                    editingCard={editingCard}
                    onClose={closeFormModal}
                />
            )}

            {deletingCard && (
                <DeleteConfirmModal
                    card={deletingCard}
                    onClose={() => setDeletingCard(null)}
                />
            )}
        </AppLayout>
    );
}
