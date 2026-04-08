import { useState } from 'react';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BankAccount, CreditCard, CreditCardStatement, PaginatedData } from '@/types/models';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/Components/PageHeader';
import { DateInput } from '@/Components/DateInput';
import { CalendarPlus, Plus, X, Trash2, Upload, CheckCircle, AlertCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { CurrencyInput } from '@/Components/CurrencyInput';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
    statements: PaginatedData<CreditCardStatement>;
    creditCards: CreditCard[];
    bankAccounts: BankAccount[];
    filters: { month?: string };
    googleCalendarEnabled: boolean;
}

interface StatementFormData {
    credit_card_id: string;
    reference_month: string;
    closing_date: string;
    due_date: string;
    total_amount: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatMonth = (ym: string) => {
    const [year, month] = ym.split('-');
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
};


const isOverdue = (dueDateStr: string | null): boolean => {
    if (!dueDateStr) return false;
    return new Date(dueDateStr) < new Date();
};

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: CreditCardStatement['status'] }) {
    if (status === 'paid') {
        return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                Paga
            </span>
        );
    }
    if (status === 'closed') {
        return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                Fechada
            </span>
        );
    }
    return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
            Aberta
        </span>
    );
}

// ─────────────────────────────────────────────
// StatementCard
// ─────────────────────────────────────────────

interface StatementCardProps {
    statement: CreditCardStatement;
    onDelete: (statement: CreditCardStatement) => void;
    onPay: (statement: CreditCardStatement) => void;
    onDetail: (statement: CreditCardStatement) => void;
    googleCalendarEnabled: boolean;
}

function StatementCard({ statement, onDelete, onPay, onDetail, googleCalendarEnabled }: StatementCardProps) {
    const paidPercent =
        statement.total_amount > 0
            ? Math.min((statement.paid_amount / statement.total_amount) * 100, 100)
            : 0;

    const pending = statement.total_amount - statement.paid_amount;
    const overdue = isOverdue(statement.due_date) && statement.status !== 'paid';
    const cardColor = statement.credit_card?.color ?? '#6366f1';

    return (
        <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col cursor-pointer"
            onClick={() => onDetail(statement)}
        >
            {/* Card top accent */}
            <div className="h-1 w-full" style={{ backgroundColor: cardColor }} />

            <div className="p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cardColor }}
                            />
                            <p className="text-white font-semibold">
                                {formatMonth(statement.reference_month)}
                            </p>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">
                            {statement.credit_card?.name ?? 'Cartão'}
                        </p>
                    </div>
                    <StatusBadge status={statement.status} />
                </div>

                {/* Total */}
                <div>
                    <p className="text-gray-500 text-xs mb-0.5">Valor total</p>
                    <p className="text-white font-bold text-xl">
                        {formatCurrency(statement.total_amount)}
                    </p>
                </div>

                {/* Progress */}
                <div>
                    <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#22c55e] rounded-full transition-all"
                            style={{ width: `${paidPercent}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-green-400">
                            Pago: {formatCurrency(statement.paid_amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                            Pendente: {formatCurrency(pending)}
                        </p>
                    </div>
                </div>

                {/* Due date */}
                {statement.due_date && (
                    <p className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
                        {overdue && <AlertCircle size={11} className="inline mr-1" />}
                        Vencimento: {formatDate(statement.due_date)}
                        {overdue && ' — Vencida'}
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]">
                    <Link
                        href={route('imports.index')}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors text-xs font-medium"
                    >
                        <Upload size={12} />
                        Importar
                    </Link>

                    {statement.status !== 'paid' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPay(statement); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[#22c55e] hover:bg-green-500/10 transition-colors text-xs font-medium"
                        >
                            <CheckCircle size={12} />
                            Pagar
                        </button>
                    )}

                    {googleCalendarEnabled && !statement.google_event_id && statement.due_date && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.post(route('invoices.calendar-sync', statement.id));
                            }}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-medium"
                            title="Sincronizar com Google Calendar"
                        >
                            <CalendarPlus size={12} />
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(statement); }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// StatementDetailModal
// ─────────────────────────────────────────────

interface StatementDetailModalProps {
    statement: CreditCardStatement;
    onClose: () => void;
    onPay: (statement: CreditCardStatement) => void;
    onDelete: (statement: CreditCardStatement) => void;
    onEdit: (statement: CreditCardStatement) => void;
}

function StatementDetailModal({ statement, onClose, onPay, onDelete, onEdit }: StatementDetailModalProps) {
    const pending = statement.total_amount - statement.paid_amount;
    const cardName = statement.credit_card?.name ?? 'Cartão';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-white font-semibold text-lg">Detalhes da Fatura</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Month + card + status */}
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-white font-bold text-xl">
                                {formatMonth(statement.reference_month)}
                            </p>
                            <p className="text-gray-400 text-sm mt-0.5">{cardName}</p>
                        </div>
                        <StatusBadge status={statement.status} />
                    </div>

                    {/* Amounts */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Valor total</span>
                            <span className="text-white font-semibold">
                                {formatCurrency(statement.total_amount)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Valor pago</span>
                            <span className="text-green-400 font-semibold">
                                {formatCurrency(statement.paid_amount)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Pendente</span>
                            <span className="text-white font-semibold">
                                {formatCurrency(pending)}
                            </span>
                        </div>
                        {statement.due_date && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Vencimento</span>
                                <span className={`font-semibold text-sm ${isOverdue(statement.due_date) && statement.status !== 'paid' ? 'text-red-400' : 'text-white'}`}>
                                    {formatDate(statement.due_date)}
                                </span>
                            </div>
                        )}
                    </div>

                    <hr className="border-[var(--color-border)]" />

                    {/* Actions */}
                    <div className="flex gap-3">
                        {statement.status !== 'paid' && (
                            <button
                                type="button"
                                onClick={() => onPay(statement)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors"
                            >
                                Pagar
                            </button>
                        )}
                        {statement.status === 'paid' && (
                            <button
                                type="button"
                                onClick={() => {
                                    router.patch(route('invoices.undo-payment', statement.id), {}, {
                                        onSuccess: () => onClose(),
                                    });
                                }}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium transition-colors"
                            >
                                Desfazer Pagamento
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onEdit(statement)}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-semibold transition-colors"
                        >
                            Editar
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(statement)}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// NewStatementModal
// ─────────────────────────────────────────────

interface NewStatementModalProps {
    creditCards: CreditCard[];
    onClose: () => void;
}

function NewStatementModal({ creditCards, onClose }: NewStatementModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<StatementFormData>({
        credit_card_id: '',
        reference_month: new Date().toISOString().slice(0, 7),
        closing_date: '',
        due_date: '',
        total_amount: '',
    });

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('invoices.store'), {
            onSuccess: () => {
                reset();
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

            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl modal-content">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-white font-semibold text-lg">Nova Fatura</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Cartão */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Cartão <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={data.credit_card_id}
                            onChange={(e) => setData('credit_card_id', e.target.value)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            <option value="">Selecionar cartão</option>
                            {creditCards.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.credit_card_id && (
                            <p className="text-red-400 text-xs">{errors.credit_card_id}</p>
                        )}
                    </div>

                    {/* Mês de referência */}
                    <DateInput
                        type="month"
                        label="Mês de Referência"
                        value={data.reference_month}
                        onChange={(v) => setData('reference_month', v)}
                        error={errors.reference_month}
                        required
                    />

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-3">
                        <DateInput
                            label="Data de Fechamento"
                            value={data.closing_date}
                            onChange={(v) => setData('closing_date', v)}
                            error={errors.closing_date}
                        />
                        <DateInput
                            label="Data de Vencimento"
                            value={data.due_date}
                            onChange={(v) => setData('due_date', v)}
                            error={errors.due_date}
                        />
                    </div>

                    {/* Valor total */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Valor Total <span className="text-red-400">*</span>
                        </label>
                        <CurrencyInput
                            value={data.total_amount}
                            onChange={(v) => setData('total_amount', v)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.total_amount && (
                            <p className="text-red-400 text-xs">{errors.total_amount}</p>
                        )}
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
// EditStatementModal
// ─────────────────────────────────────────────

interface EditStatementModalProps {
    statement: CreditCardStatement;
    onClose: () => void;
}

function EditStatementModal({ statement, onClose }: EditStatementModalProps) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        closing_date: statement.closing_date || '',
        due_date: statement.due_date || '',
        total_amount: String(statement.total_amount),
    });

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(route('invoices.update', statement.id), {
            onSuccess: () => {
                reset();
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

            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl modal-content">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-white font-semibold text-lg">Editar Fatura</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-3">
                        <DateInput
                            label="Data de Fechamento"
                            value={data.closing_date}
                            onChange={(v) => setData('closing_date', v)}
                            error={errors.closing_date}
                        />
                        <DateInput
                            label="Data de Vencimento"
                            value={data.due_date}
                            onChange={(v) => setData('due_date', v)}
                            error={errors.due_date}
                        />
                    </div>

                    {/* Valor total */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Valor Total <span className="text-red-400">*</span>
                        </label>
                        <CurrencyInput
                            value={data.total_amount}
                            onChange={(v) => setData('total_amount', v)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.total_amount && (
                            <p className="text-red-400 text-xs">{errors.total_amount}</p>
                        )}
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
// PayConfirmModal
// ─────────────────────────────────────────────

interface PayConfirmModalProps {
    statement: CreditCardStatement;
    bankAccounts: BankAccount[];
    onClose: () => void;
}

function PayConfirmModal({ statement, bankAccounts, onClose }: PayConfirmModalProps) {
    const [paying, setPaying] = useState(false);
    const [bankAccountId, setBankAccountId] = useState<string>(
        statement.credit_card?.bank_account_id ? String(statement.credit_card.bank_account_id) : ''
    );

    const handlePay = () => {
        setPaying(true);
        router.patch(route('invoices.pay', statement.id), { bank_account_id: bankAccountId || null }, {
            onFinish: () => {
                setPaying(false);
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
                    <h2 className="text-white font-semibold text-lg">Confirmar pagamento</h2>
                    <p className="text-gray-400 text-sm">
                        Confirmar pagamento da fatura de{' '}
                        <span className="text-white font-medium">
                            {formatMonth(statement.reference_month)}
                        </span>
                        ? Isso marcará todas as transações do período como pagas.
                    </p>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400">Conta bancária de débito</label>
                    <select
                        value={bankAccountId}
                        onChange={(e) => setBankAccountId(e.target.value)}
                        className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors w-full"
                    >
                        <option value="">Sem débito em conta</option>
                        {bankAccounts.map((a) => (
                            <option key={a.id} value={String(a.id)}>{a.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={paying}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handlePay}
                        disabled={paying}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {paying ? 'Confirmando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DeleteConfirmModal
// ─────────────────────────────────────────────

interface DeleteConfirmModalProps {
    statement: CreditCardStatement;
    onClose: () => void;
}

function DeleteConfirmModal({ statement, onClose }: DeleteConfirmModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('invoices.destroy', statement.id), {
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
                    <h2 className="text-white font-semibold text-lg">Excluir fatura</h2>
                    <p className="text-gray-400 text-sm">
                        Tem certeza que deseja excluir a fatura de{' '}
                        <span className="text-white font-medium">
                            {formatMonth(statement.reference_month)}
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
// Page
// ─────────────────────────────────────────────

export default function InvoicesIndex({ statements, creditCards, bankAccounts, filters, googleCalendarEnabled }: Props) {
    const { flash } = usePage().props;

    const [showFormModal, setShowFormModal] = useState(false);
    const [payingStatement, setPayingStatement] = useState<CreditCardStatement | null>(null);
    const [deletingStatement, setDeletingStatement] = useState<CreditCardStatement | null>(null);
    const [detailStatement, setDetailStatement] = useState<CreditCardStatement | null>(null);
    const [editingStatement, setEditingStatement] = useState<CreditCardStatement | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

    const filteredStatements = selectedCardId
        ? statements.data.filter((s) => s.credit_card_id === selectedCardId)
        : statements.data;

    const navigateMonth = (direction: -1 | 1) => {
        const [year, month] = (filters.month || new Date().toISOString().slice(0, 7))
            .split('-').map(Number);
        const date = new Date(year, month - 1 + direction, 1);
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get(route('invoices.index'), { month: newMonth }, { preserveState: true });
    };

    return (
        <AppLayout title="Faturas">
            <Head title="Faturas" />

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

                {/* Header Components via PageHeader */}
                <PageHeader
                    title="Faturas"
                    subtitle={
                        statements.total === 0
                            ? 'Nenhuma fatura cadastrada'
                            : `${statements.total} fatura${statements.total !== 1 ? 's' : ''} no total`
                    }
                    actions={
                        <button
                            onClick={() => setShowFormModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                        >
                            <Plus size={16} />
                            Nova Fatura
                        </button>
                    }
                    filters={
                        <>
                            {creditCards.length > 0 && (
                                <select
                                    value={selectedCardId || ''}
                                    onChange={(e) => setSelectedCardId(e.target.value ? Number(e.target.value) : null)}
                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                >
                                    <option value="">Todos os Cartões</option>
                                    {creditCards.map((card) => (
                                        <option key={card.id} value={card.id}>
                                            {card.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => navigateMonth(-1)}
                                    className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
                                    aria-label="Mês anterior"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="min-w-[130px] text-center text-sm font-medium text-[var(--color-foreground)]">
                                    {formatMonth(filters.month || new Date().toISOString().slice(0, 7))}
                                </span>
                                <button
                                    onClick={() => navigateMonth(1)}
                                    className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
                                    aria-label="Próximo mês"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </>
                    }
                />

                {/* Grid */}
                {filteredStatements.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                            <FileText size={24} className="text-gray-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">Nenhuma fatura encontrada</p>
                            <p className="text-gray-500 text-sm mt-1">
                                {selectedCardId
                                    ? 'Nenhuma fatura para este cartão.'
                                    : 'Adicione sua primeira fatura para começar.'}
                            </p>
                        </div>
                        {!selectedCardId && (
                            <button
                                onClick={() => setShowFormModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                            >
                                <Plus size={16} />
                                Nova Fatura
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStatements.map((statement) => (
                            <StatementCard
                                key={statement.id}
                                statement={statement}
                                onDelete={setDeletingStatement}
                                onPay={setPayingStatement}
                                onDetail={setDetailStatement}
                                googleCalendarEnabled={googleCalendarEnabled}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showFormModal && (
                <NewStatementModal
                    creditCards={creditCards}
                    onClose={() => setShowFormModal(false)}
                />
            )}

            {detailStatement && (
                <StatementDetailModal
                    statement={detailStatement}
                    onClose={() => setDetailStatement(null)}
                    onPay={(s) => { setDetailStatement(null); setPayingStatement(s); }}
                    onDelete={(s) => { setDetailStatement(null); setDeletingStatement(s); }}
                    onEdit={(s) => { setDetailStatement(null); setEditingStatement(s); }}
                />
            )}

            {editingStatement && (
                <EditStatementModal
                    statement={editingStatement}
                    onClose={() => setEditingStatement(null)}
                />
            )}

            {payingStatement && (
                <PayConfirmModal
                    statement={payingStatement}
                    bankAccounts={bankAccounts}
                    onClose={() => setPayingStatement(null)}
                />
            )}

            {deletingStatement && (
                <DeleteConfirmModal
                    statement={deletingStatement}
                    onClose={() => setDeletingStatement(null)}
                />
            )}
        </AppLayout>
    );
}
