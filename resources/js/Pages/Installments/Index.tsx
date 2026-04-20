import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { installmentsSteps } from '@/tutorials/steps/installments';
import { InstallmentGroup, Installment, BankAccount, CreditCard, Category, TransactionStatus } from '@/types/models';
import { formatDate } from '@/lib/utils';
import { CurrencyInput } from '@/Components/CurrencyInput';
import { DateInput } from '@/Components/DateInput';
import { Plus, Layers, X, ChevronDown, ChevronUp, Check, AlertCircle, Trash2, UploadCloud } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ImportedInstallment {
    id: number;
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
    credit_card_name: string | null;
    installment_number: number | null;
    total_installments: number | null;
}

interface Props {
    groups: InstallmentGroup[];
    accounts: BankAccount[];
    creditCards: CreditCard[];
    categories: Category[];
    importedInstallments?: ImportedInstallment[];
    filters?: {
        type?: string;
        credit_card_id?: string;
        sort?: string;
    };
}

interface FormData {
    description: string;
    total_amount: string;
    total_installments: string;
    start_date: string;
    payment_type: 'credit_card' | 'bank_account';
    credit_card_id: string;
    bank_account_id: string;
    category_id: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: InstallmentGroup['status'] }) {
    if (status === 'active') {
        return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                Em andamento
            </span>
        );
    }
    if (status === 'completed') {
        return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                Concluído
            </span>
        );
    }
    return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">
            Cancelado
        </span>
    );
}

// ─────────────────────────────────────────────
// InstallmentRow
// ─────────────────────────────────────────────

function InstallmentRow({ installment, accounts }: { installment: Installment; accounts: BankAccount[] }) {
    const [paying, setPaying] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState<string>(
        installment.group?.bankAccount?.id ? String(installment.group.bankAccount.id) : ''
    );

    const handlePay = () => {
        const isCreditCard = !!installment.group?.credit_card_id;

        if (!isCreditCard && !installment.group?.bank_account_id) {
            setShowBankModal(true);
            return;
        }

        setPaying(true);
        router.patch(
            route('installments.pay', installment.id),
            installment.group?.bank_account_id ? { bank_account_id: installment.group.bank_account_id } : {},
            { onFinish: () => setPaying(false) }
        );
    };

    const handlePayWithBank = () => {
        setPaying(true);
        setShowBankModal(false);
        router.patch(
            route('installments.pay', installment.id),
            { bank_account_id: selectedBankId || null },
            { onFinish: () => setPaying(false) }
        );
    };

    const isPending = installment.status === 'pending';
    const isPaid = installment.status === 'paid';
    const isCancelled = installment.status === 'cancelled';

    return (
        <>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[bg-[var(--color-surface-2)]]/40 transition-colors">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isPaid
                                ? 'bg-green-500/20 text-green-400'
                                : isCancelled
                                ? 'bg-gray-500/10 text-gray-600'
                                : installment.is_overdue
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-[var(--color-surface-2)] text-gray-500'
                        }`}
                    >
                        {isPaid ? (
                            <Check size={12} />
                        ) : installment.is_overdue ? (
                            <AlertCircle size={12} />
                        ) : (
                            <span className="text-[10px] font-bold">{installment.number}</span>
                        )}
                    </div>

                    <div>
                        <p className="text-sm text-white font-medium">
                            Parcela {installment.number}
                        </p>
                        <p className="text-xs text-gray-500">
                            Vencimento: {formatDate(installment.due_date)}
                            {installment.is_overdue && (
                                <span className="text-red-400 ml-1">• Vencida</span>
                            )}
                            {isPaid && installment.paid_at && (
                                <span className="text-green-400 ml-1">
                                    • Paga em {formatDate(installment.paid_at.split('T')[0])}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold font-finance ${isPaid ? 'text-green-400' : isCancelled ? 'text-gray-600' : 'text-white'}`}>
                        {formatCurrency(installment.amount)}
                    </p>

                    {isPending && (
                        <button
                            onClick={handlePay}
                            disabled={paying}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {paying ? '...' : 'Pagar'}
                        </button>
                    )}
                </div>
            </div>

            {showBankModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 " onClick={() => setShowBankModal(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl shadow-xl p-6 flex flex-col gap-4">
                        <h3 className="text-white font-semibold">Pagar parcela</h3>
                        <p className="text-gray-400 text-sm">Selecione a conta bancária para débito:</p>
                        <select
                            value={selectedBankId}
                            onChange={(e) => setSelectedBankId(e.target.value)}
                            className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] w-full"
                        >
                            <option value="">Sem débito em conta</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={String(a.id)}>{a.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBankModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-[border-[var(--color-border)]] text-gray-400 text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePayWithBank}
                                disabled={paying}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] text-black text-sm font-semibold disabled:opacity-50"
                            >
                                {paying ? 'Pagando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────

function FilterBar({ creditCards, filters }: {
    accounts: BankAccount[];
    creditCards: CreditCard[];
    filters: { type?: string; credit_card_id?: string; sort?: string };
}) {
    const [type, setType] = useState(filters.type ?? '');
    const [creditCardId, setCreditCardId] = useState(filters.credit_card_id ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'created_desc');

    const apply = (newType: string, newCardId: string, newSort: string) => {
        router.get(route('installments.index'), {
            type: newType || undefined,
            credit_card_id: newCardId || undefined,
            sort: newSort !== 'created_desc' ? newSort : undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <select
                value={type}
                onChange={(e) => {
                    const v = e.target.value;
                    setType(v);
                    if (v !== 'credit_card') setCreditCardId('');
                    apply(v, v !== 'credit_card' ? '' : creditCardId, sort);
                }}
                className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#22c55e] transition-colors"
            >
                <option value="">Todos os tipos</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="bank_account">Conta Bancária</option>
            </select>

            {type === 'credit_card' && (
                <select
                    value={creditCardId}
                    onChange={(e) => {
                        const v = e.target.value;
                        setCreditCardId(v);
                        apply(type, v, sort);
                    }}
                    className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#22c55e] transition-colors"
                >
                    <option value="">Todos os cartões</option>
                    {creditCards.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                </select>
            )}

            <select
                value={sort}
                onChange={(e) => {
                    const v = e.target.value;
                    setSort(v);
                    apply(type, creditCardId, v);
                }}
                className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#22c55e] transition-colors"
            >
                <option value="created_desc">Mais recente</option>
                <option value="progress_asc">Próximo de finalizar</option>
                <option value="progress_desc">Mais distante</option>
            </select>
        </div>
    );
}

// ─────────────────────────────────────────────
// GroupCard
// ─────────────────────────────────────────────

interface GroupCardProps {
    group: InstallmentGroup;
    accounts: BankAccount[];
    onCancel: (group: InstallmentGroup) => void;
}

function GroupCard({ group, accounts, onCancel }: GroupCardProps) {
    const [expanded, setExpanded] = useState(false);

    const progress = group.progress ?? 0;
    const totalRemaining = group.total_remaining ?? 0;
    const installments = group.installments ?? [];

    const nextPending = installments
        .filter((i) => i.status === 'pending')
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 2);

    return (
        <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden">
            <div className="p-5 flex flex-col gap-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-semibold leading-tight truncate">
                                {group.description}
                            </p>
                            <StatusBadge status={group.status} />
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {group.category && (
                                <span
                                    className="text-[11px] px-1.5 py-0.5 rounded-md font-medium"
                                    style={{
                                        backgroundColor: group.category.color + '20',
                                        color: group.category.color,
                                    }}
                                >
                                    {group.category.name}
                                </span>
                            )}
                            {group.creditCard && (
                                <span className="text-[11px] text-gray-500">
                                    {group.creditCard.name}
                                </span>
                            )}
                            {group.bankAccount && (
                                <span className="text-[11px] text-gray-500">
                                    {group.bankAccount.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {group.status === 'active' && (
                        <button
                            onClick={() => onCancel(group)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                            title="Cancelar parcelamento"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {/* Progress */}
                <div data-tutorial="inst-progress">
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs text-gray-400">
                            {group.paid_installments}/{group.total_installments} parcelas pagas
                        </p>
                        <p className="text-xs text-gray-500">{progress.toFixed(0)}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-[bg-[var(--color-surface-2)]] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                group.status === 'completed'
                                    ? 'bg-blue-400'
                                    : group.status === 'cancelled'
                                    ? 'bg-gray-500'
                                    : 'bg-[#22c55e]'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Amounts */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs mb-0.5">Valor total</p>
                        <p className="text-white font-semibold font-finance">{formatCurrency(group.total_amount)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-xs mb-0.5">Restante</p>
                        <p
                            className={`font-semibold ${
                                group.status === 'completed' ? 'text-blue-400' : 'text-white'
                            }`}
                        >
                            {formatCurrency(totalRemaining)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-xs mb-0.5">Por parcela</p>
                        <p className="text-white font-semibold">
                            {formatCurrency(group.installment_amount)}
                        </p>
                    </div>
                </div>

                {/* Next installments */}
                {nextPending.length > 0 && group.status === 'active' && (
                    <div className="bg-[var(--color-input-bg)] rounded-xl p-3 flex flex-col gap-2">
                        <p className="text-xs text-gray-500 font-medium">Próximas parcelas</p>
                        {nextPending.map((installment) => (
                            <div key={installment.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {installment.is_overdue && (
                                        <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
                                    )}
                                    <p className="text-xs text-gray-300">
                                        Parcela {installment.number} — {formatDate(installment.due_date)}
                                        {installment.is_overdue && (
                                            <span className="text-red-400 ml-1">vencida</span>
                                        )}
                                    </p>
                                </div>
                                <p className="text-xs text-white font-medium">
                                    {formatCurrency(installment.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Expand toggle */}
                {installments.length > 0 && (
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-1 border-t border-[border-[var(--color-border)]]"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp size={14} />
                                Ocultar parcelas
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} />
                                Ver todas as parcelas ({installments.length})
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Expanded installments list */}
            {expanded && installments.length > 0 && (
                <div className="border-t border-[border-[var(--color-border)]] px-3 py-2 flex flex-col">
                    {installments
                        .sort((a, b) => a.number - b.number)
                        .map((installment) => (
                            <InstallmentRow key={installment.id} installment={installment} accounts={accounts} />
                        ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// CancelConfirmModal
// ─────────────────────────────────────────────

interface CancelConfirmModalProps {
    group: InstallmentGroup;
    onClose: () => void;
}

function CancelConfirmModal({ group, onClose }: CancelConfirmModalProps) {
    const [cancelling, setCancelling] = useState(false);

    const handleCancel = () => {
        setCancelling(true);
        router.delete(route('installments.destroy', group.id), {
            onFinish: () => {
                setCancelling(false);
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60  modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-sm bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl shadow-xl p-6 flex flex-col gap-5 modal-content">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white font-semibold text-lg">Cancelar parcelamento</h2>
                    <p className="text-gray-400 text-sm">
                        Tem certeza que deseja cancelar o parcelamento{' '}
                        <span className="text-white font-medium">"{group.description}"</span>?
                    </p>
                    <p className="text-yellow-400 text-xs">
                        Apenas as parcelas pendentes serão canceladas. Parcelas já pagas serão preservadas.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={cancelling}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-[border-[var(--color-border)]] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        Voltar
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelling ? 'Cancelando...' : 'Cancelar parcelamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// NewInstallmentModal
// ─────────────────────────────────────────────

interface NewInstallmentModalProps {
    accounts: BankAccount[];
    creditCards: CreditCard[];
    categories: Category[];
    onClose: () => void;
}

function NewInstallmentModal({ accounts, creditCards, categories, onClose }: NewInstallmentModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        description: '',
        total_amount: '',
        total_installments: '',
        start_date: '',
        payment_type: 'credit_card',
        credit_card_id: '',
        bank_account_id: '',
        category_id: '',
    });

    const installmentPreview =
        data.total_amount && data.total_installments && Number(data.total_installments) > 0
            ? (Number(data.total_amount) / Number(data.total_installments)).toFixed(2)
            : null;

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('installments.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60  modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto modal-content">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[border-[var(--color-border)]] sticky top-0 bg-[var(--color-surface)] z-10">
                    <h2 className="text-white font-semibold text-lg">Novo Parcelamento</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[bg-[var(--color-surface-2)]] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Descrição */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Descrição <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Ex: iPhone 15 Pro"
                            className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.description && (
                            <p className="text-red-400 text-xs">{errors.description}</p>
                        )}
                    </div>

                    {/* Valor total */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Valor Total <span className="text-red-400">*</span>
                        </label>
                        <CurrencyInput
                            value={data.total_amount}
                            onChange={(v) => setData('total_amount', v)}
                            className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.total_amount && (
                            <p className="text-red-400 text-xs">{errors.total_amount}</p>
                        )}
                    </div>

                    {/* Número de parcelas */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Número de Parcelas <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="2"
                            max="120"
                            value={data.total_installments}
                            onChange={(e) => setData('total_installments', e.target.value)}
                            placeholder="Ex: 12"
                            className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.total_installments && (
                            <p className="text-red-400 text-xs">{errors.total_installments}</p>
                        )}
                    </div>

                    {/* Preview */}
                    {installmentPreview && (
                        <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl px-4 py-3">
                            <p className="text-[#22c55e] text-sm font-medium">
                                {data.total_installments}x de{' '}
                                <span className="font-bold">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    }).format(Number(installmentPreview))}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Data de início */}
                    <DateInput
                        label="Data de Início"
                        value={data.start_date}
                        onChange={(v) => setData('start_date', v)}
                        error={errors.start_date}
                        required
                    />

                    {/* Vincular a */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Vincular a</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setData('payment_type', 'credit_card')}
                                className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    data.payment_type === 'credit_card'
                                        ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                                        : 'border-[var(--color-border)] text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                Cartão
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('payment_type', 'bank_account')}
                                className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    data.payment_type === 'bank_account'
                                        ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                                        : 'border-[var(--color-border)] text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                Conta
                            </button>
                        </div>
                    </div>

                    {/* Cartão select */}
                    {data.payment_type === 'credit_card' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Cartão de Crédito</label>
                            <select
                                value={data.credit_card_id}
                                onChange={(e) => setData('credit_card_id', e.target.value)}
                                className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
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
                    )}

                    {/* Conta select */}
                    {data.payment_type === 'bank_account' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Conta Bancária</label>
                            <select
                                value={data.bank_account_id}
                                onChange={(e) => setData('bank_account_id', e.target.value)}
                                className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Selecionar conta</option>
                                {accounts.map((a) => (
                                    <option key={a.id} value={String(a.id)}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            {errors.bank_account_id && (
                                <p className="text-red-400 text-xs">{errors.bank_account_id}</p>
                            )}
                        </div>
                    )}

                    {/* Categoria */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Categoria</label>
                        <select
                            value={data.category_id}
                            onChange={(e) => setData('category_id', e.target.value)}
                            className="bg-[var(--color-input-bg)] border border-[border-[var(--color-border)]] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            <option value="">Sem categoria</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p className="text-red-400 text-xs">{errors.category_id}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[border-[var(--color-border)]] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Criando...' : 'Criar parcelamento'}
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

const parseInstallmentPattern = (desc: string) => {
    const match = desc.match(/\s(\d+)\/(\d+)\s*$/);
    if (match) return { current: parseInt(match[1]), total: parseInt(match[2]) };
    return null;
};

const statusLabel: Record<TransactionStatus, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    cancelled: 'Cancelado',
};

const statusClass: Record<TransactionStatus, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    paid: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-gray-500/10 text-gray-500',
};

export default function InstallmentsIndex({ groups, accounts, creditCards, categories, importedInstallments, filters = {} }: Props) {
    const { flash } = usePage().props;
    const { start } = useTutorial({ key: 'installments', steps: installmentsSteps });

    const [showFormModal, setShowFormModal] = useState(false);
    const [cancellingGroup, setCancellingGroup] = useState<InstallmentGroup | null>(null);

    const activeGroups = groups.filter((g) => g.status === 'active');
    const totalPending = activeGroups.reduce((sum, g) => sum + (g.total_remaining ?? 0), 0);

    return (
        <AppLayout title="Parcelamentos">
            <Head title="Parcelamentos" />

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
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Parcelamentos</h1>
                            <TutorialHelpButton onStart={start} />
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                            {groups.length === 0
                                ? 'Nenhum parcelamento cadastrado'
                                : `${groups.length} parcelamento${groups.length !== 1 ? 's' : ''} no total`}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowFormModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <Plus size={16} />
                        Novo Parcelamento
                    </button>
                </div>

                {/* Summary */}
                <div data-tutorial="inst-remaining" className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Layers size={16} className="text-red-400" />
                            </div>
                            <p className="text-gray-400 text-sm">Total em Aberto</p>
                        </div>
                        <p className="text-white font-bold text-2xl">{formatCurrency(totalPending)}</p>
                        <p className="text-gray-500 text-xs mt-1">Soma dos valores restantes</p>
                    </div>

                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Layers size={16} className="text-[#22c55e]" />
                            </div>
                            <p className="text-gray-400 text-sm">Parcelamentos Ativos</p>
                        </div>
                        <p className="text-white font-bold text-2xl">{activeGroups.length}</p>
                        <p className="text-gray-500 text-xs mt-1">
                            {groups.length - activeGroups.length} concluído{groups.length - activeGroups.length !== 1 ? 's' : ''} ou cancelado{groups.length - activeGroups.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Groups list */}
                {groups.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[bg-[var(--color-surface-2)]] flex items-center justify-center">
                            <Layers size={24} className="text-gray-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">Nenhum parcelamento cadastrado</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Crie seu primeiro parcelamento para acompanhar suas compras a prazo.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowFormModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                        >
                            <Plus size={16} />
                            Novo Parcelamento
                        </button>
                    </div>
                ) : (
                    <div data-tutorial="inst-list" className="flex flex-col gap-4">
                        {/* Filter bar */}
                        <FilterBar accounts={accounts} creditCards={creditCards} filters={filters} />

                        {groups.length === 0 ? (
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-8 text-center">
                                <p className="text-gray-400 text-sm">Nenhum parcelamento encontrado para este filtro.</p>
                            </div>
                        ) : (
                            groups.map((group) => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    accounts={accounts}
                                    onCancel={setCancellingGroup}
                                />
                            ))
                        )}
                    </div>
                )}
                {/* Parcelas de Faturas Importadas */}
                {importedInstallments && importedInstallments.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <UploadCloud size={18} className="text-gray-400" />
                            <h2 className="text-white font-semibold text-lg">Parcelas de Faturas Importadas</h2>
                        </div>

                        <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden">
                            <div className="divide-y divide-[border-[var(--color-border)]]">
                                {importedInstallments.map((item) => {
                                    const pattern = parseInstallmentPattern(item.description);
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between px-5 py-3 hover:bg-[bg-[var(--color-surface-2)]]/30 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">
                                                    {item.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {item.credit_card_name && (
                                                        <span className="text-xs text-gray-500">
                                                            {item.credit_card_name}
                                                        </span>
                                                    )}
                                                    {pattern && (
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            Parcela {pattern.current}/{pattern.total}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(item.date)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                                <p className="text-sm font-semibold text-white">
                                                    {formatCurrency(item.amount)}
                                                </p>
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusClass[item.status]}`}>
                                                    {statusLabel[item.status]}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showFormModal && (
                <NewInstallmentModal
                    accounts={accounts}
                    creditCards={creditCards}
                    categories={categories}
                    onClose={() => setShowFormModal(false)}
                />
            )}

            {cancellingGroup && (
                <CancelConfirmModal
                    group={cancellingGroup}
                    onClose={() => setCancellingGroup(null)}
                />
            )}

        </AppLayout>
    );
}
