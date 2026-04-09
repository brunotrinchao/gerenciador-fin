import { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { transactionsSteps } from '@/tutorials/steps/transactions';
import { formatDate } from '@/lib/utils';
import { CurrencyInput } from '@/Components/CurrencyInput';
import { DateInput } from '@/Components/DateInput';
import { PageHeader, PageHeaderState } from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import {
    Transaction,
    BankAccount,
    CreditCard,
    Category,
    CreditCardStatement,
    Installment,
    TransactionType,
    TransactionStatus,
    PaginatedData,
} from '@/types/models';
import {
    Plus,
    ArrowUpCircle,
    ArrowDownCircle,
    ArrowLeftRight,
    Wallet,
    Check,
    Pencil,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
    Loader2,
    Receipt,
    ExternalLink,
    CalendarPlus,
    CreditCard as CreditCardIcon,
    Layers,
    RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PendingSyncItem {
    type: 'transaction' | 'installment' | 'statement';
    id: number;
    description: string;
    amount: number;
    date: string;
}

interface Props {
    transactions: PaginatedData<Transaction>;
    statements: CreditCardStatement[];
    installments: Installment[];
    accounts: BankAccount[];
    creditCards: CreditCard[];
    categories: Category[];
    filters: {
        month?: string;
        type?: string;
        status?: string;
        search?: string;
    };
    summary: {
        income: number;
        expense: number;
        credit_card: number;
    };
    currentMonth: string;
    googleCalendarEnabled: boolean;
    pendingSyncItems: PendingSyncItem[];
}

interface TransactionFormData {
    type: TransactionType;
    description: string;
    amount: string;
    date: string;
    status: TransactionStatus;
    bank_account_id: string;
    credit_card_id: string;
    category_id: string;
    transfer_to_account_id: string;
    total_installments: string;
    notes: string;
    is_recurring: boolean;
    recurrence_rule: string;
    recurrence_end_date: string;
    recurrence_occurrences: string;
    recurrence_scope: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const isDebit = (type: TransactionType) =>
    ['expense', 'credit_card', 'transfer', 'investment_in'].includes(type);

const recurrenceLabel: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    bimonthly: 'Bimestral',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual',
};

// ─────────────────────────────────────────────
// TransactionRow
// ─────────────────────────────────────────────

interface TransactionRowProps {
    transaction: Transaction;
    onEdit: (t: Transaction) => void;
    onDelete: (t: Transaction) => void;
}

function TransactionRow({ transaction, onEdit, onDelete }: TransactionRowProps) {
    const debit = isDebit(transaction.type);

    const TypeIcon = () => {
        if (transaction.type === 'income') {
            return <ArrowUpCircle size={20} className="text-green-400" />;
        }
        if (transaction.type === 'transfer') {
            return <ArrowLeftRight size={20} className="text-blue-400" />;
        }
        return <ArrowDownCircle size={20} className="text-red-400" />;
    };

    const statusBadge = () => {
        if (transaction.status === 'paid') {
            return (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                    Pago
                </span>
            );
        }
        if (transaction.status === 'cancelled') {
            return (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">
                    Cancelado
                </span>
            );
        }
        if (transaction.status === 'scheduled') {
            return (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    Agendado
                </span>
            );
        }
        return (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                Pendente
            </span>
        );
    };

    const accountLabel = () => {
        if (transaction.credit_card) return transaction.credit_card.name;
        if (transaction.bank_account) return transaction.bank_account.name;
        return '—';
    };

    const handlePay = () => {
        router.patch(route('transactions.pay', transaction.id));
    };

    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)] last:border-0">
            {/* Icon */}
            <div className="flex-shrink-0">
                <TypeIcon />
            </div>

            {/* Description + category */}
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-gray-500 text-xs">{formatDate(transaction.date)}</span>
                    {transaction.installment_group && (
                        <span className="text-blue-400 text-[10px] font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                            {transaction.description.match(/\((\d+\/\d+)\)$/)?.[1] || 'Parcelado'}
                        </span>
                    )}
                    {(transaction.is_recurring || transaction.parent_transaction_id) && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                            <RefreshCw size={10} />
                            {transaction.recurrence_rule
                                ? recurrenceLabel[transaction.recurrence_rule] ?? transaction.recurrence_rule
                                : 'Recorrente'}
                        </span>
                    )}
                    {transaction.category && (
                        <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                                backgroundColor: transaction.category.color + '22',
                                color: transaction.category.color,
                            }}
                        >
                            {transaction.category.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Account */}
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 min-w-[100px]">
                <span className="text-gray-400 text-xs truncate max-w-[120px]">{accountLabel()}</span>
                {statusBadge()}
            </div>

            {/* Amount */}
            <div className="flex-shrink-0 text-right min-w-[90px]">
                <p
                    className={`text-sm font-semibold font-finance ${
                        debit ? 'text-red-400' : 'text-green-400'
                    }`}
                >
                    {debit ? '- ' : '+ '}
                    {formatCurrency(transaction.amount)}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {transaction.status === 'pending' && (
                    <button
                        onClick={handlePay}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                        title="Marcar como pago"
                    >
                        <Check size={15} />
                    </button>
                )}
                <button
                    onClick={() => onEdit(transaction)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    title="Editar"
                >
                    <Pencil size={15} />
                </button>
                <button
                    onClick={() => onDelete(transaction)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir"
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// StatementRow
// ─────────────────────────────────────────────

interface StatementRowProps {
    statement: CreditCardStatement;
    onClick: (s: CreditCardStatement) => void;
}

function StatementRow({ statement, onClick }: StatementRowProps) {
    const statusBadge = () => {
        if (statement.status === 'paid') {
            return (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                    Paga
                </span>
            );
        }
        if (statement.status === 'closed') {
            return (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                    Fechada
                </span>
            );
        }
        return (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                Em aberto
            </span>
        );
    };

    const displayDate = statement.due_date
        ? statement.due_date
        : statement.reference_month + '-01';

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)] last:border-0 cursor-pointer"
            onClick={() => onClick(statement)}
        >
            {/* Icon */}
            <div className="flex-shrink-0">
                <Receipt size={20} className="text-purple-400" />
            </div>

            {/* Description + info */}
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                    Fatura {statement.credit_card?.name ?? 'Cartão'}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-gray-500 text-xs">
                        Venc. {formatDate(displayDate)}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                        Fatura
                    </span>
                </div>
            </div>

            {/* Card + status */}
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 min-w-[100px]">
                <span className="text-gray-400 text-xs truncate max-w-[120px]">
                    {statement.credit_card?.name ?? '—'}
                </span>
                {statusBadge()}
            </div>

            {/* Amount */}
            <div className="flex-shrink-0 text-right min-w-[90px]">
                <p className="text-sm font-semibold text-purple-400">
                    - {formatCurrency(statement.total_amount)}
                </p>
            </div>

            {/* Spacer to align with TransactionRow actions */}
            <div className="flex-shrink-0 w-[72px]" />
        </div>
    );
}

// ─────────────────────────────────────────────
// InstallmentRow
// ─────────────────────────────────────────────

interface InstallmentRowProps {
    installment: Installment;
    onClick: (i: Installment) => void;
    onEdit: (t: Transaction) => void;
    onDelete: (t: Transaction) => void;
}

function InstallmentRow({ installment, onClick, onEdit, onDelete }: InstallmentRowProps) {
    const handleMarkPaid = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.patch(route('installments.pay', { installment: installment.id }), {}, {
            preserveScroll: true,
        });
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (installment.transaction) {
            onEdit(installment.transaction);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (installment.transaction) {
            onDelete(installment.transaction);
        }
    };

    const isPaid = installment.status === 'paid';
    const label = installment.group
        ? `${installment.group.description} (${installment.number}/${installment.group.total_installments})`
        : `Parcela ${installment.number}`;

    const isCreditCard = !!installment.group?.credit_card_id;

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)] last:border-0 cursor-pointer"
            onClick={() => onClick(installment)}
        >
            <div className="flex-shrink-0">
                {isCreditCard ? (
                    <CreditCardIcon size={20} className="text-purple-400" />
                ) : (
                    <Layers size={20} className="text-orange-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                    {label}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Vence {formatDate(installment.due_date)}
                    </span>
                    {installment.group?.category && (
                        <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                                backgroundColor: (installment.group.category.color ?? '#f97316') + '22',
                                color: installment.group.category.color ?? '#f97316',
                            }}
                        >
                            {installment.group.category.name}
                        </span>
                    )}
                    {isCreditCard && installment.group?.creditCard && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                            {installment.group.creditCard.name}
                        </span>
                    )}
                </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 min-w-[100px]">
                <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--color-muted)' }}>
                    {installment.group?.creditCard?.name ?? installment.group?.bankAccount?.name ?? '—'}
                </span>
                <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                        backgroundColor: isPaid ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isPaid ? '#22c55e' : '#f59e0b',
                    }}
                >
                    {isPaid ? 'Pago' : 'Pendente'}
                </span>
            </div>
            <div className="flex-shrink-0 text-right min-w-[90px]">
                <p className={`text-sm font-semibold ${isCreditCard ? 'text-purple-400' : 'text-orange-400'}`}>
                    - {formatCurrency(installment.amount)}
                </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                {!isPaid && (
                    <button
                        onClick={handleMarkPaid}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                        title="Marcar como pago"
                    >
                        <Check size={15} />
                    </button>
                )}
                <button
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    title="Editar"
                >
                    <Pencil size={15} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir"
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DetailModal
// ─────────────────────────────────────────────

type DetailItem =
    | { kind: 'transaction'; data: Transaction }
    | { kind: 'statement'; data: CreditCardStatement }
    | { kind: 'installment'; data: Installment };

interface DetailModalProps {
    item: DetailItem;
    onClose: () => void;
    onEdit: (t: Transaction) => void;
    onDelete: (t: Transaction) => void;
}

function DetailModal({ item, onClose, onEdit, onDelete }: DetailModalProps) {
    const handlePayStatement = () => {
        if (item.kind !== 'statement') return;
        router.patch(route('invoices.pay', { statement: item.data.id }), {}, {
            onSuccess: () => onClose(),
        });
    };

    const handleViewInvoice = () => {
        router.get(route('invoices.index'));
    };

    if (item.kind === 'transaction') {
        const t = item.data;
        const debit = isDebit(t.type);

        const typeLabel: Record<string, string> = {
            income: 'Receita',
            expense: 'Despesa',
            credit_card: 'Cartão de Crédito',
            transfer: 'Transferência',
            investment_in: 'Investimento (entrada)',
            investment_out: 'Investimento (saída)',
        };

        const TypeIcon = () => {
            if (t.type === 'income') return <ArrowUpCircle size={22} className="text-green-400" />;
            if (t.type === 'transfer') return <ArrowLeftRight size={22} className="text-blue-400" />;
            return <ArrowDownCircle size={22} className="text-red-400" />;
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TypeIcon />
                            <span className="text-gray-400 text-sm">{typeLabel[t.type] ?? t.type}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-white font-semibold text-lg leading-snug">{t.description}</p>
                        {t.notes && <p className="text-gray-500 text-sm mt-1">{t.notes}</p>}
                    </div>

                    {/* Details grid */}
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Valor</span>
                            <span className={`font-semibold ${debit ? 'text-red-400' : 'text-green-400'}`}>
                                {debit ? '- ' : '+ '}{formatCurrency(t.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Data</span>
                            <span className="text-white">{formatDate(t.date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className={`font-medium ${
                                t.status === 'paid' ? 'text-green-400' :
                                t.status === 'cancelled' ? 'text-gray-500' : 'text-yellow-400'
                            }`}>
                                {t.status === 'paid' ? 'Pago' : t.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>
                        </div>
                        {t.category && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Categoria</span>
                                <span
                                    className="text-[12px] font-medium px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: t.category.color + '22',
                                        color: t.category.color,
                                    }}
                                >
                                    {t.category.name}
                                </span>
                            </div>
                        )}
                        {(t.bank_account || t.credit_card) && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    {t.credit_card ? 'Cartão' : 'Conta'}
                                </span>
                                <span className="text-white">
                                    {t.credit_card?.name ?? t.bank_account?.name ?? '—'}
                                </span>
                            </div>
                        )}
                        {t.installment_group && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Parcela</span>
                                <span className="text-blue-400 text-[12px] font-bold">
                                    {t.description.match(/\((\d+\/\d+)\)$/)?.[1] ?? 'Parcelado'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                        >
                            Fechar
                        </button>
                        {t.status === 'pending' && (
                            <button
                                type="button"
                                onClick={() => {
                                    router.patch(route('transactions.pay', t.id), {}, {
                                        onSuccess: () => onClose(),
                                    });
                                }}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-semibold transition-colors"
                            >
                                Marcar como Pago
                            </button>
                        )}
                        {t.status === 'paid' && (
                            <button
                                type="button"
                                onClick={() => {
                                    router.patch(route('transactions.undo-payment', t.id), {}, {
                                        onSuccess: () => onClose(),
                                    });
                                }}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium transition-colors"
                            >
                                Desfazer Pagamento
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                onEdit(t);
                                onClose();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                        >
                            <Pencil size={14} />
                            Editar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onDelete(t);
                                onClose();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-red-400 hover:text-red-300 hover:border-red-500/50 hover:bg-red-500/5 text-sm font-medium transition-colors"
                        >
                            <Trash2 size={14} />
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Installment detail
    if (item.kind === 'installment') {
        const inst = item.data;
        const isPaid = inst.status === 'paid';
        const label = inst.group
            ? `${inst.group.description} (${inst.number}/${inst.group.total_installments})`
            : `Parcela ${inst.number}`;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Layers size={22} className="text-orange-400" />
                            <span className="text-gray-400 text-sm">Parcela</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Label */}
                    <div>
                        <p className="text-white font-semibold text-lg leading-snug">{label}</p>
                    </div>

                    {/* Details grid */}
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Valor</span>
                            <span className="font-semibold text-orange-400">
                                - {formatCurrency(inst.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Vencimento</span>
                            <span className="text-white">{formatDate(inst.due_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className={`font-medium ${isPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                                {isPaid ? 'Pago' : 'Pendente'}
                            </span>
                        </div>
                        {inst.group?.category && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Categoria</span>
                                <span
                                    className="text-[12px] font-medium px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: (inst.group.category.color ?? '#f97316') + '22',
                                        color: inst.group.category.color ?? '#f97316',
                                    }}
                                >
                                    {inst.group.category.name}
                                </span>
                            </div>
                        )}
                        {inst.group?.bankAccount && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Conta</span>
                                <span className="text-white">{inst.group.bankAccount.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                        >
                            Fechar
                        </button>
                        {!isPaid && (
                            <button
                                type="button"
                                onClick={() => {
                                    router.patch(route('installments.pay', { installment: inst.id }), {}, {
                                        onSuccess: () => onClose(),
                                    });
                                }}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-semibold transition-colors"
                            >
                                Marcar como Pago
                            </button>
                        )}
                        {isPaid && (
                            <button
                                type="button"
                                onClick={() => {
                                    router.patch(route('installments.undo-payment', { installment: inst.id }), {}, {
                                        onSuccess: () => onClose(),
                                    });
                                }}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium transition-colors"
                            >
                                Desfazer Pagamento
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                console.log('Edit button clicked in DetailModal', { hasTransaction: !!inst.transaction });
                                if (inst.transaction) {
                                    onEdit(inst.transaction);
                                    onClose();
                                } else {
                                    console.warn('No transaction linked to installment', inst);
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                        >
                            <Pencil size={14} />
                            Editar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                console.log('Delete button clicked in DetailModal', { hasTransaction: !!inst.transaction });
                                if (inst.transaction) {
                                    onDelete(inst.transaction);
                                    onClose();
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-red-400 hover:text-red-300 hover:border-red-500/50 hover:bg-red-500/5 text-sm font-medium transition-colors"
                        >
                            <Trash2 size={14} />
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Statement detail
    const s = item.data;
    const displayDate = s.due_date ?? s.reference_month + '-01';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCardIcon size={22} className="text-purple-400" />
                        <span className="text-gray-400 text-sm">Fatura de Cartão</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Name */}
                <div>
                    <p className="text-white font-semibold text-lg leading-snug">
                        Fatura {s.credit_card?.name ?? 'Cartão'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        Referência: {s.reference_month}
                    </p>
                </div>

                {/* Details grid */}
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Total da fatura</span>
                        <span className="font-semibold text-purple-400">
                            - {formatCurrency(s.total_amount)}
                        </span>
                    </div>
                    {s.paid_amount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Valor pago</span>
                            <span className="text-green-400">{formatCurrency(s.paid_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-500">Vencimento</span>
                        <span className="text-white">{formatDate(displayDate)}</span>
                    </div>
                    {s.closing_date && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Fechamento</span>
                            <span className="text-white">{formatDate(s.closing_date)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={`font-medium ${
                            s.status === 'paid' ? 'text-green-400' :
                            s.status === 'closed' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>
                            {s.status === 'paid' ? 'Paga' : s.status === 'closed' ? 'Fechada' : 'Em aberto'}
                        </span>
                    </div>
                    {s.credit_card && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Cartão</span>
                            <span className="text-white">{s.credit_card.name}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                    >
                        Fechar
                    </button>
                    <button
                        type="button"
                        onClick={handleViewInvoice}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                    >
                        <ExternalLink size={14} />
                        Ver Fatura
                    </button>
                    {s.status !== 'paid' && (
                        <button
                            type="button"
                            onClick={handlePayStatement}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-semibold transition-colors"
                        >
                            Marcar como Paga
                        </button>
                    )}
                    {s.status === 'paid' && (
                        <button
                            type="button"
                            onClick={() => {
                                router.patch(route('invoices.undo-payment', { statement: s.id }), {}, {
                                    onSuccess: () => onClose(),
                                });
                            }}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium transition-colors"
                        >
                            Desfazer Pagamento
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// TransactionFormModal
// ─────────────────────────────────────────────

interface BolетoPrefill {
    description?: string;
    amount?: string;
    date?: string;
    notes?: string;
}

interface TransactionFormModalProps {
    editingTransaction: Transaction | null;
    accounts: BankAccount[];
    creditCards: CreditCard[];
    categories: Category[];
    onClose: () => void;
    prefillData?: BolетoPrefill;
    recurrenceScope?: string;
}

function TransactionFormModal({
    editingTransaction,
    accounts,
    creditCards,
    categories,
    onClose,
    prefillData,
    recurrenceScope,
}: TransactionFormModalProps) {
    const isEditing = editingTransaction !== null;

    const { data, setData, post, patch, processing, errors, reset } =
        useForm<TransactionFormData>({
            type: editingTransaction?.type ?? 'expense',
            description: editingTransaction?.description ?? prefillData?.description ?? '',
            amount: editingTransaction ? String(editingTransaction.amount) : (prefillData?.amount ?? ''),
            date:
                editingTransaction?.date ??
                prefillData?.date ??
                new Date().toISOString().split('T')[0],
            status: editingTransaction?.status ?? 'pending',
            bank_account_id: editingTransaction?.bank_account_id
                ? String(editingTransaction.bank_account_id)
                : '',
            credit_card_id: editingTransaction?.credit_card_id
                ? String(editingTransaction.credit_card_id)
                : '',
            category_id: editingTransaction?.category_id
                ? String(editingTransaction.category_id)
                : '',
            transfer_to_account_id: '',
            total_installments: editingTransaction?.installment_group_id ? '1' : '',
            notes: editingTransaction?.notes ?? prefillData?.notes ?? '',
            is_recurring: editingTransaction?.is_recurring ?? false,
            recurrence_rule: editingTransaction?.recurrence_rule ?? 'monthly',
            recurrence_end_date: editingTransaction?.recurrence_end_date ?? '',
            recurrence_occurrences: editingTransaction?.recurrence_occurrences
                ? String(editingTransaction.recurrence_occurrences)
                : '',
            recurrence_scope: recurrenceScope ?? '',
        });

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isEditing) {
            patch(route('transactions.update', editingTransaction.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('transactions.store'), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    const showAccount =
        data.type === 'income' ||
        data.type === 'expense' ||
        data.type === 'transfer';
    const showCard = data.type === 'credit_card';
    const showTransferDest = data.type === 'transfer';
    const showCategory =
        data.type === 'income' ||
        data.type === 'expense' ||
        data.type === 'credit_card';
    const showStatus = data.type !== 'credit_card';

    const filteredCategories = categories.filter((c) => {
        if (data.type === 'income') return c.type === 'income';
        return c.type === 'expense';
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-lg mx-4 sm:mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl max-h-[90vh] flex flex-col modal-content">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] flex-shrink-0">
                    <h2 className="text-white font-semibold text-lg">
                        {isEditing ? 'Editar Transação' : 'Nova Transação'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="px-6 py-5 flex flex-col gap-4 overflow-y-auto"
                >
                    {/* Tipo */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Tipo <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={data.type}
                            onChange={(e) =>
                                setData('type', e.target.value as TransactionType)
                            }
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            <option value="income">Receita</option>
                            <option value="expense">Despesa</option>
                            <option value="credit_card">Cartão de Crédito</option>
                            <option value="transfer">Transferência</option>
                        </select>
                        {errors.type && (
                            <p className="text-red-400 text-xs">{errors.type}</p>
                        )}
                    </div>

                    {/* Descrição */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Descrição <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Ex: Supermercado, Salário..."
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.description && (
                            <p className="text-red-400 text-xs">{errors.description}</p>
                        )}
                    </div>

                    {/* Valor + Data (row) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">
                                Valor <span className="text-red-400">*</span>
                            </label>
                            <CurrencyInput
                                value={data.amount}
                                onChange={(v) => setData('amount', v)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                            {errors.amount && (
                                <p className="text-red-400 text-xs">{errors.amount}</p>
                            )}
                        </div>

                        <DateInput
                            label="Data"
                            value={data.date}
                            onChange={(v) => {
                                setData('date', v);
                                if (v > new Date().toISOString().split('T')[0] && data.status === 'pending') {
                                    setData('status', 'scheduled');
                                } else if (v <= new Date().toISOString().split('T')[0] && data.status === 'scheduled') {
                                    setData('status', 'pending');
                                }
                            }}
                            error={errors.date}
                            required
                        />
                    </div>

                    {/* Parcelamento (apenas na criação, apenas para despesa em conta bancária) */}
                    {!isEditing && data.type === 'expense' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Parcelas (Opcional)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={data.total_installments}
                                    onChange={(e) => setData('total_installments', e.target.value)}
                                    placeholder="Número de parcelas (ex: 10)"
                                    className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                />
                                {data.total_installments && parseInt(data.total_installments) > 1 && (
                                    <div className="text-xs text-gray-500">
                                        Total: {formatCurrency(parseFloat(data.amount || '0'))} em {data.total_installments}x de {formatCurrency(parseFloat(data.amount || '0') / parseInt(data.total_installments))}
                                    </div>
                                )}
                            </div>
                            {errors.total_installments && (
                                <p className="text-red-400 text-xs">{errors.total_installments}</p>
                            )}
                        </div>
                    )}

                    {/* Recorrência (apenas income/expense, não credit_card) */}
                    {(data.type === 'income' || data.type === 'expense') && (
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_recurring}
                                    onChange={(e) => setData('is_recurring', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-input-bg)] text-[#22c55e] focus:ring-[#22c55e]"
                                />
                                <span className="text-sm text-gray-400">Transação recorrente</span>
                            </label>

                            {data.is_recurring && (
                                <div className="flex flex-col gap-3 pl-6 border-l-2 border-[var(--color-border)]">
                                    {/* Frequência */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm text-gray-400">Frequência</label>
                                        <select
                                            value={data.recurrence_rule}
                                            onChange={(e) => setData('recurrence_rule', e.target.value)}
                                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                        >
                                            <option value="weekly">Semanal</option>
                                            <option value="biweekly">Quinzenal</option>
                                            <option value="monthly">Mensal</option>
                                            <option value="bimonthly">Bimestral</option>
                                            <option value="quarterly">Trimestral</option>
                                            <option value="semiannual">Semestral</option>
                                            <option value="annual">Anual</option>
                                        </select>
                                    </div>

                                    {/* Término */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm text-gray-400">Término</label>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="recurrence_end"
                                                    checked={!data.recurrence_end_date && !data.recurrence_occurrences}
                                                    onChange={() => {
                                                        setData('recurrence_end_date', '');
                                                        setData('recurrence_occurrences', '');
                                                    }}
                                                    className="w-4 h-4 border-[var(--color-border)] bg-[var(--color-input-bg)] text-[#22c55e] focus:ring-[#22c55e]"
                                                />
                                                <span className="text-sm text-gray-300">Sem fim</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="recurrence_end"
                                                    checked={!!data.recurrence_end_date}
                                                    onChange={() => {
                                                        setData('recurrence_end_date', data.date || new Date().toISOString().split('T')[0]);
                                                        setData('recurrence_occurrences', '');
                                                    }}
                                                    className="w-4 h-4 border-[var(--color-border)] bg-[var(--color-input-bg)] text-[#22c55e] focus:ring-[#22c55e]"
                                                />
                                                <span className="text-sm text-gray-300">Até a data</span>
                                            </label>
                                            {data.recurrence_end_date && (
                                                <DateInput
                                                    label="Data de Término"
                                                    value={data.recurrence_end_date}
                                                    onChange={(v) => setData('recurrence_end_date', v)}
                                                    error={errors.recurrence_end_date}
                                                    className="ml-6"
                                                />
                                            )}
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="recurrence_end"
                                                    checked={!!data.recurrence_occurrences && !data.recurrence_end_date}
                                                    onChange={() => {
                                                        setData('recurrence_end_date', '');
                                                        setData('recurrence_occurrences', '12');
                                                    }}
                                                    className="w-4 h-4 border-[var(--color-border)] bg-[var(--color-input-bg)] text-[#22c55e] focus:ring-[#22c55e]"
                                                />
                                                <span className="text-sm text-gray-300">Nº de ocorrências</span>
                                            </label>
                                            {data.recurrence_occurrences && !data.recurrence_end_date && (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="120"
                                                    value={data.recurrence_occurrences}
                                                    onChange={(e) => setData('recurrence_occurrences', e.target.value)}
                                                    placeholder="Ex: 12"
                                                    className="ml-6 w-32 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status */}
                    {showStatus && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData('status', e.target.value as TransactionStatus)
                                }
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="cancelled">Cancelado</option>
                                <option value="scheduled">Agendado</option>
                            </select>
                            {errors.status && (
                                <p className="text-red-400 text-xs">{errors.status}</p>
                            )}
                        </div>
                    )}

                    {/* Conta */}
                    {showAccount && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">
                                Conta <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={data.bank_account_id}
                                onChange={(e) =>
                                    setData('bank_account_id', e.target.value)
                                }
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Selecione a conta</option>
                                {accounts.map((a) => (
                                    <option key={a.id} value={String(a.id)}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            {errors.bank_account_id && (
                                <p className="text-red-400 text-xs">
                                    {errors.bank_account_id}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Cartão */}
                    {showCard && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">
                                Cartão <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={data.credit_card_id}
                                onChange={(e) =>
                                    setData('credit_card_id', e.target.value)
                                }
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Selecione o cartão</option>
                                {creditCards.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.credit_card_id && (
                                <p className="text-red-400 text-xs">
                                    {errors.credit_card_id}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Conta destino (transferência) */}
                    {showTransferDest && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">
                                Conta Destino <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={data.transfer_to_account_id}
                                onChange={(e) =>
                                    setData('transfer_to_account_id', e.target.value)
                                }
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Selecione a conta destino</option>
                                {accounts
                                    .filter((a) => String(a.id) !== data.bank_account_id)
                                    .map((a) => (
                                        <option key={a.id} value={String(a.id)}>
                                            {a.name}
                                        </option>
                                    ))}
                            </select>
                            {errors.transfer_to_account_id && (
                                <p className="text-red-400 text-xs">
                                    {errors.transfer_to_account_id}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Categoria */}
                    {showCategory && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Categoria</label>
                            <select
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Sem categoria</option>
                                {filteredCategories.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <p className="text-red-400 text-xs">{errors.category_id}</p>
                            )}
                        </div>
                    )}

                    {/* Observações */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Observações</label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Observações opcionais..."
                            rows={2}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
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
// RecurrenceScopeModal
// ─────────────────────────────────────────────

interface RecurrenceScopeModalProps {
    transaction: Transaction;
    action: 'edit' | 'delete';
    onSelect: (scope: string) => void;
    onClose: () => void;
}

function RecurrenceScopeModal({ transaction, action, onSelect, onClose }: RecurrenceScopeModalProps) {
    const isInstallment = !!transaction.installment_group_id;

    const title = action === 'edit'
        ? (isInstallment ? 'Editar parcelas' : 'Editar transação recorrente')
        : (isInstallment ? 'Excluir parcelas' : 'Excluir transação recorrente');

    const description = action === 'edit'
        ? 'Escolha o escopo da edição:'
        : 'Escolha o escopo da exclusão:';

    const options = isInstallment ? [
        { value: 'only_this', label: 'Só esta parcela' },
        { value: 'this_and_future', label: 'Esta e as futuras parcelas' },
        { value: 'all', label: 'Todas as parcelas do grupo' },
    ] : [
        { value: 'only_this', label: 'Só esta ocorrência' },
        { value: 'this_and_future', label: 'Esta e as futuras' },
        { value: 'all', label: 'Todas as ocorrências' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 flex flex-col gap-5 modal-content">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white font-semibold text-lg">{title}</h2>
                    <p className="text-gray-400 text-sm">
                        <span className="text-white font-medium">"{transaction.description}"</span>
                        {' '}— {description}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onSelect(opt.value)}
                            className="w-full text-left px-4 py-3 rounded-lg border border-[var(--color-border)] text-gray-300 hover:text-white hover:border-gray-500 hover:bg-[var(--color-surface-2)] text-sm font-medium transition-colors"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DeleteConfirmModal
// ─────────────────────────────────────────────

interface DeleteConfirmModalProps {
    transaction: Transaction;
    onClose: () => void;
}

function DeleteConfirmModal({ transaction, onClose }: DeleteConfirmModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('transactions.destroy', transaction.id), {
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

            <div className="relative z-10 w-full max-w-sm mx-4 sm:mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-6 flex flex-col gap-5 modal-content">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white font-semibold text-lg">Excluir transação</h2>
                    <p className="text-gray-400 text-sm">
                        Tem certeza que deseja excluir a transação{' '}
                        <span className="text-white font-medium">
                            "{transaction.description}"
                        </span>
                        ?
                    </p>
                    <p className="text-red-400 text-xs">Esta ação não pode ser desfeita.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors disabled:opacity-50"
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
// Pagination
// ─────────────────────────────────────────────

interface PaginationProps {
    pagination: PaginatedData<Transaction>;
    filters: Props['filters'];
}

function Pagination({ pagination, filters }: PaginationProps) {
    if (pagination.last_page <= 1) return null;

    const goToPage = (page: number) => {
        router.get(
            route('transactions.index'),
            { ...filters, page },
            { preserveState: true, replace: true }
        );
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <p className="text-gray-500 text-xs">
                Página {pagination.current_page} de {pagination.last_page}
                {pagination.total > 0 && (
                    <span className="ml-1">({pagination.total} transações)</span>
                )}
            </p>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => goToPage(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={15} />
                    Anterior
                </button>
                <button
                    onClick={() => goToPage(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Próximo
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// CalendarSyncModal
// ─────────────────────────────────────────────

interface CalendarSyncModalProps {
    items: PendingSyncItem[];
    onClose: () => void;
}

function CalendarSyncModal({ items, onClose }: CalendarSyncModalProps) {
    const fmtCurrency = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    // Agrupa por YYYY-MM
    const grouped = items.reduce<Record<string, PendingSyncItem[]>>((acc, item) => {
        const key = item.date.substring(0, 7);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const monthLabel = (ym: string) => {
        const [year, month] = ym.split('-');
        return new Date(Number(year), Number(month) - 1, 1)
            .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const typeIcon = (type: PendingSyncItem['type']) => {
        if (type === 'installment') return <Layers size={14} className="text-blue-400" />;
        if (type === 'statement')   return <CreditCardIcon size={14} className="text-purple-400" />;
        return <Receipt size={14} className="text-gray-400" />;
    };

    const typeLabel = (type: PendingSyncItem['type']) => {
        if (type === 'installment') return 'Parcela';
        if (type === 'statement')   return 'Fatura';
        return 'Transação';
    };

    const handleSync = () => {
        router.post(route('calendar.sync-all'), {}, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <CalendarPlus size={20} className="text-blue-400" />
                        <div>
                            <p className="text-white font-semibold">Sincronizar com Google Calendar</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                                {items.length} {items.length === 1 ? 'item pendente' : 'itens pendentes'} sem evento na agenda
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Lista agrupada por mês */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                    {Object.entries(grouped)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([ym, groupItems]) => (
                            <div key={ym}>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 capitalize">
                                    {monthLabel(ym)}
                                </p>
                                <div className="flex flex-col gap-1">
                                    {groupItems.map((item) => (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-surface-2)]"
                                        >
                                            <div className="flex-shrink-0">{typeIcon(item.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm truncate">{item.description}</p>
                                                <p className="text-gray-500 text-xs">{typeLabel(item.type)}</p>
                                            </div>
                                            <span className="text-gray-300 text-sm font-medium flex-shrink-0">
                                                {fmtCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-[var(--color-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                    >
                        Fechar
                    </button>
                    <button
                        type="button"
                        onClick={handleSync}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    >
                        <CalendarPlus size={15} />
                        Sincronizar Tudo ({items.length})
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function TransactionsIndex({
    transactions,
    installments,
    statements,
    accounts,
    creditCards,
    categories,
    filters,
    summary,
    currentMonth,
    googleCalendarEnabled,
    pendingSyncItems,
}: Props) {
    const { props } = usePage();
    const flash = (props as Record<string, unknown>).flash as
        | { success?: string; error?: string }
        | undefined;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
    const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
    const [boletoLoading, setBoletoLoading] = useState(false);
    const [boletoError, setBoletoError] = useState<string | null>(null);
    const [prefillData, setPrefillData] = useState<BolетoPrefill | undefined>(undefined);
    const boletoInputRef = useRef<HTMLInputElement>(null);
    const [scopeModal, setScopeModal] = useState<{ transaction: Transaction; action: 'edit' | 'delete' } | null>(null);
    const [pendingEditScope, setPendingEditScope] = useState<string>('');
    const [showCalendarSyncModal, setShowCalendarSyncModal] = useState(false);

    const balance = summary.income - summary.expense - summary.credit_card;

    const { start: startTutorial } = useTutorial({ key: 'transactions', title: 'Tour das Transações', steps: transactionsSteps });

    const applyFilter = (newFilters: Record<string, string>) => {
        router.get(
            route('transactions.index'),
            { ...filters, ...newFilters },
            { preserveState: true, replace: true }
        );
    };

    const openCreate = () => {
        setPrefillData(undefined);
        setEditingTransaction(null);
        setShowFormModal(true);
    };

    const openEdit = (transaction: Transaction) => {
        if (transaction.is_recurring || transaction.parent_transaction_id || transaction.installment_group_id) {
            setScopeModal({ transaction, action: 'edit' });
            return;
        }
        setPrefillData(undefined);
        setPendingEditScope('');
        setEditingTransaction(transaction);
        setShowFormModal(true);
    };

    const handleScopeSelect = (scope: string) => {
        if (!scopeModal) return;
        const { transaction, action } = scopeModal;
        setScopeModal(null);

        if (action === 'edit') {
            setPrefillData(undefined);
            setPendingEditScope(scope);
            setEditingTransaction(transaction);
            setShowFormModal(true);
        } else {
            // delete with scope
            router.delete(route('transactions.destroy', transaction.id), {
                data: { recurrence_scope: scope },
                onFinish: () => {},
            });
        }
    };

    const handleDeleteClick = (transaction: Transaction) => {
        if (transaction.is_recurring || transaction.parent_transaction_id || transaction.installment_group_id) {
            setScopeModal({ transaction, action: 'delete' });
            return;
        }
        setDeletingTransaction(transaction);
    };

    const handleBoletoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBoletoLoading(true);
        setBoletoError(null);

        const formData = new FormData();
        formData.append('file', file);

        // Pega o cookie XSRF-TOKEN para autenticação CSRF
        const xsrfToken = decodeURIComponent(
            document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] ?? ''
        );

        try {
            const res = await fetch(route('transactions.boleto-parse'), {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': xsrfToken },
                body: formData,
            });

            const json = await res.json();

            if (!res.ok || json.error) {
                setBoletoError(json.error ?? 'Erro ao processar boleto.');
            } else {
                setPrefillData({
                    description: json.description ?? '',
                    amount: json.amount ? String(json.amount) : '',
                    date: json.date ?? '',
                    notes: json.notes ?? '',
                });
                setEditingTransaction(null);
                setShowFormModal(true);
            }
        } catch {
            setBoletoError('Falha na comunicação. Tente novamente.');
        } finally {
            setBoletoLoading(false);
            // Limpa o input para permitir selecionar o mesmo arquivo novamente
            if (boletoInputRef.current) boletoInputRef.current.value = '';
        }
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setEditingTransaction(null);
    };

    return (
        <AppLayout title="Transações">
            <Head title="Transações" />

            <div className="w-full flex flex-col gap-6">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                        {flash.error}
                    </div>
                )}

                {/* Header Components via PageHeader */}
                <div data-tutorial="tx-summary">
                <PageHeader
                    title="Transações"
                    onStartTutorial={startTutorial}
                    subtitle={
                        transactions.total === 0
                            ? 'Nenhuma transação encontrada'
                            : `${transactions.total} transação${transactions.total !== 1 ? 'ões' : ''} no mês`
                    }
                    actions={
                        <>
                            <input
                                ref={boletoInputRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleBoletoFile}
                            />

                            {googleCalendarEnabled && pendingSyncItems.length > 0 && (
                                <button
                                    onClick={() => setShowCalendarSyncModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:border-blue-400/50 hover:bg-blue-500/10 text-sm font-medium transition-colors"
                                    title={`${pendingSyncItems.length} itens sem evento na agenda`}
                                >
                                    <CalendarPlus size={16} />
                                    Sincronizar Agenda
                                    <span className="ml-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full px-1.5 py-0.5 font-semibold">
                                        {pendingSyncItems.length}
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={() => boletoInputRef.current?.click()}
                                disabled={boletoLoading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {boletoLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <FileText size={16} />
                                )}
                                {boletoLoading ? 'Extraindo...' : 'Importar Boleto'}
                            </button>

                            <button
                                data-tutorial="tx-add-btn"
                                onClick={openCreate}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors"
                            >
                                <Plus size={16} />
                                Nova Transação
                            </button>
                        </>
                    }
                    states={
                        <>
                            <PageHeaderState
                                title="Receitas"
                                value={formatCurrency(summary.income)}
                                colorClass="text-green-400"
                            />
                            <PageHeaderState
                                title="Despesas"
                                value={formatCurrency(summary.expense)}
                                colorClass="text-red-400"
                            />
                            <PageHeaderState
                                title="Faturas"
                                value={formatCurrency(summary.credit_card)}
                                colorClass="text-purple-400"
                            />
                            <PageHeaderState
                                title="Saldo"
                                value={formatCurrency(balance)}
                                colorClass={balance >= 0 ? 'text-blue-400' : 'text-red-400'}
                            />
                        </>
                    }
                    filters={
                        <div data-tutorial="tx-filters" className="contents">
                            <DateInput
                                type="month"
                                label=""
                                value={filters.month ?? currentMonth}
                                onChange={(v) => applyFilter({ month: v })}
                            />

                            <select
                                defaultValue={filters.type ?? ''}
                                onChange={(e) => applyFilter({ type: e.target.value })}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Todos os tipos</option>
                                <option value="income">Receita</option>
                                <option value="expense">Despesa</option>
                                <option value="credit_card">Cartão</option>
                                <option value="transfer">Transferência</option>
                            </select>

                            <select
                                defaultValue={filters.status ?? ''}
                                onChange={(e) => applyFilter({ status: e.target.value })}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Todos os status</option>
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="cancelled">Cancelado</option>
                                <option value="scheduled">Agendado</option>
                            </select>

                            <input
                                type="text"
                                defaultValue={filters.search ?? ''}
                                placeholder="Buscar descrição..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilter({
                                            search: (e.target as HTMLInputElement).value,
                                        });
                                    }
                                }}
                                onBlur={(e) => applyFilter({ search: e.target.value })}
                                className="flex-1 min-w-[160px] bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                        </div>
                    }
                />
                </div>

                {/* Boleto error */}
                {boletoError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
                        <span>{boletoError}</span>
                        <button onClick={() => setBoletoError(null)} className="ml-3 text-red-400 hover:text-red-300">
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* Transaction list */}
                <div data-tutorial="tx-list" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                    {transactions.data.length === 0 && statements.length === 0 && installments.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-16 px-6">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                                <Wallet size={24} className="text-gray-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-medium">
                                    Nenhuma transação encontrada
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Ajuste os filtros ou crie sua primeira transação.
                                </p>
                            </div>
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                            >
                                <Plus size={16} />
                                Nova Transação
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table header (desktop) */}
                            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-input-bg)]">
                                <div className="w-5" />
                                <p className="text-gray-500 text-xs font-medium">Descrição</p>
                                <p className="text-gray-500 text-xs font-medium text-right min-w-[100px]">
                                    Conta / Status
                                </p>
                                <p className="text-gray-500 text-xs font-medium text-right min-w-[90px]">
                                    Valor
                                </p>
                                <div className="min-w-[80px]" />
                            </div>

                            {/* Statement rows */}
                            {statements.map((s) => (
                                <StatementRow
                                    key={`statement-${s.id}`}
                                    statement={s}
                                    onClick={(st) => setDetailItem({ kind: 'statement', data: st })}
                                />
                            ))}

                            {/* Installment rows */}
                            {installments.map((inst) => (
                                <InstallmentRow
                                    key={`installment-${inst.id}`}
                                    installment={inst}
                                    onClick={(i) => setDetailItem({ kind: 'installment', data: i })}
                                />
                            ))}

                            {/* Transaction rows */}
                            {transactions.data.map((t) => (
                                <TransactionRow
                                    key={t.id}
                                    transaction={t}
                                    onEdit={openEdit}
                                    onDelete={handleDeleteClick}
                                />
                            ))}

                            {/* Pagination */}
                            <Pagination pagination={transactions} filters={filters} />
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showFormModal && (
                <TransactionFormModal
                    editingTransaction={editingTransaction}
                    accounts={accounts}
                    creditCards={creditCards}
                    categories={categories}
                    onClose={closeFormModal}
                    prefillData={prefillData}
                    recurrenceScope={pendingEditScope}
                />
            )}

            {scopeModal && (
                <RecurrenceScopeModal
                    transaction={scopeModal.transaction}
                    action={scopeModal.action}
                    onSelect={handleScopeSelect}
                    onClose={() => setScopeModal(null)}
                />
            )}

            {deletingTransaction && (
                <DeleteConfirmModal
                    transaction={deletingTransaction}
                    onClose={() => setDeletingTransaction(null)}
                />
            )}

            {detailItem && (
                <DetailModal
                    item={detailItem}
                    onClose={() => setDetailItem(null)}
                    onEdit={openEdit}
                    onDelete={handleDeleteClick}
                />
            )}

            {showCalendarSyncModal && (
                <CalendarSyncModal
                    items={pendingSyncItems}
                    onClose={() => setShowCalendarSyncModal(false)}
                />
            )}
        </AppLayout>
    );
}
