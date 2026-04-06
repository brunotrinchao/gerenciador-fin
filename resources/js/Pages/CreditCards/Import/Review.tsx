import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Category } from '@/types/models';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ImportItem {
    date: string;
    description: string;
    amount: number;
    status_import: 'new' | 'duplicate_exact' | 'duplicate_fuzzy';
    category_id: number | null;
    category_name: string | null;
    import_hash: string | null;
    is_parcelado?: boolean;
    parcela_atual?: number | null;
    parcela_total?: number | null;
}

interface Props {
    items: ImportItem[];
    creditCardId: number;
    fileName: string;
    categories: Category[];
    statementId: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
};

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: ImportItem['status_import'] }) {
    if (status === 'duplicate_exact') {
        return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400">
                Duplicata
            </span>
        );
    }
    if (status === 'duplicate_fuzzy') {
        return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                Verificar
            </span>
        );
    }
    return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-[#22c55e]">
            Novo
        </span>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ImportReview({ items, creditCardId, fileName, categories, statementId }: Props) {
    // Apenas 'new' ficam pré-selecionados; fuzzy e exact ficam desmarcados
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        new Set(
            items.reduce<number[]>((acc, item, i) => {
                if (item.status_import === 'new') acc.push(i);
                return acc;
            }, [])
        )
    );

    const [itemCategories, setItemCategories] = useState<Record<number, string>>(
        Object.fromEntries(items.map((item, i) => [i, String(item.category_id ?? '')]))
    );

    const toggleId = (i: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(i)) {
                next.delete(i);
            } else {
                next.add(i);
            }
            return next;
        });
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(
                new Set(
                    items
                        .map((item, i) => (item.status_import !== 'duplicate_exact' ? i : -1))
                        .filter((i) => i !== -1)
                )
            );
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleConfirm = () => {
        const selectedItems = items
            .filter((_, i) => selectedIds.has(i))
            .map((item) => ({
                ...item,
                category_id: itemCategories[items.indexOf(item)] || null,
            }));

        router.post(route('imports.store'), {
            statement_id: statementId,
            credit_card_id: creditCardId,
            transactions: selectedItems,
        });
    };

    const totalNew          = items.filter((i) => i.status_import === 'new').length;
    const totalExact        = items.filter((i) => i.status_import === 'duplicate_exact').length;
    const totalFuzzy        = items.filter((i) => i.status_import === 'duplicate_fuzzy').length;
    const totalInstallments = items.filter((i) => i.is_parcelado && (i.parcela_total ?? 1) > 1).length;

    return (
        <AppLayout title="Revisar Importação">
            <Head title="Revisar Importação" />

            <div className="w-full flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Revisar Importação</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            <span className="text-gray-300 font-medium">{fileName}</span>
                            {' · '}
                            {items.length} {items.length === 1 ? 'item' : 'itens'}
                        </p>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        Confirmar Importação
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
                        <p className="text-gray-400 text-xs mb-1">Total</p>
                        <p className="text-white font-bold text-xl">{items.length}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
                        <p className="text-gray-400 text-xs mb-1">Novos</p>
                        <p className="text-[#22c55e] font-bold text-xl">{totalNew}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
                        <p className="text-gray-400 text-xs mb-1">Duplicatas exatas</p>
                        <p className="text-gray-400 font-bold text-xl">{totalExact}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
                        <p className="text-gray-400 text-xs mb-1">Verificar</p>
                        <p className="text-yellow-400 font-bold text-xl">{totalFuzzy}</p>
                    </div>
                    {totalInstallments > 0 && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                            <p className="text-blue-400 text-xs mb-1">Parcelados</p>
                            <p className="text-blue-400 font-bold text-xl">{totalInstallments}</p>
                            <p className="text-blue-400/60 text-[10px] mt-0.5">criarão grupo completo</p>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12 text-center">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedIds.size > 0 && 
                                                    selectedIds.size === items.filter(i => i.status_import !== 'duplicate_exact').length
                                                }
                                                onChange={(e) => toggleAll(e.target.checked)}
                                                className="rounded border-gray-700 bg-[var(--color-input-bg)] text-[#22c55e] focus:ring-[#22c55e] transition-colors"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Data
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Descrição
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Categoria
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                                        Valor
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {items.map((item, i) => {
                                    const isExact = item.status_import === 'duplicate_exact';
                                    const isSelected = selectedIds.has(i);

                                    return (
                                        <tr
                                            key={i}
                                            className={`transition-colors ${
                                                isExact
                                                    ? 'opacity-40'
                                                    : isSelected
                                                    ? 'bg-[#22c55e]/5'
                                                    : ''
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-5 py-3">
                                                <input
                                                    type="checkbox"
                                                    disabled={isExact}
                                                    checked={isSelected}
                                                    onChange={() => toggleId(i)}
                                                    className="rounded border-gray-700 bg-[var(--color-input-bg)] text-[#22c55e] focus:ring-[#22c55e] disabled:cursor-not-allowed"
                                                />
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-3 text-sm text-gray-300 whitespace-nowrap">
                                                {formatDate(item.date)}
                                            </td>

                                            {/* Description */}
                                            <td className="px-5 py-3 text-sm text-white max-w-xs">
                                                <span className="truncate block">{item.description}</span>
                                                {item.is_parcelado && (item.parcela_total ?? 1) > 1 && (
                                                    <span className="text-[11px] text-blue-400 bg-blue-400/10 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                                                        📦 {item.parcela_atual}/{item.parcela_total} · criará {item.parcela_total}x parcelas
                                                    </span>
                                                )}
                                            </td>

                                            {/* Category */}
                                            <td className="px-5 py-3">
                                                <select
                                                    value={itemCategories[i] ?? ''}
                                                    onChange={(e) =>
                                                        setItemCategories((prev) => ({
                                                            ...prev,
                                                            [i]: e.target.value,
                                                        }))
                                                    }
                                                    disabled={isExact || !isSelected}
                                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-40"
                                                >
                                                    <option value="">Sem categoria</option>
                                                    {categories.map((c) => (
                                                        <option key={c.id} value={String(c.id)}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-3 text-sm text-white font-mono font-medium text-right whitespace-nowrap">
                                                {formatCurrency(item.amount)}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3">
                                                <StatusBadge status={item.status_import} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
