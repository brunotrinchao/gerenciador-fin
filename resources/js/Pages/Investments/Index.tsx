import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Investment, BankAccount, InvestmentType } from '@/types/models';
import { CurrencyInput } from '@/Components/CurrencyInput';
import { DateInput } from '@/Components/DateInput';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Camera,
    LogOut,
    Pencil,
    Trash2,
    X,
    Wallet,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
    investments: Investment[];
    accounts: BankAccount[];
    summary: {
        total_invested: number;
        total_current: number;
    };
}

interface InvestmentFormData {
    name: string;
    type: InvestmentType | '';
    institution: string;
    bank_account_id: string;
    invested_amount: string;
    current_amount: string;
    yield_rate: string;
    yield_type: 'prefixado' | 'posfixado' | 'hibrido' | '';
    start_date: string;
    maturity_date: string;
}

interface SnapshotFormData {
    reference_date: string;
    amount: string;
}

interface RedeemFormData {
    amount: string;
    bank_account_id: string;
    date: string;
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

const investmentTypeLabels: Record<InvestmentType, string> = {
    renda_fixa: 'Renda Fixa',
    renda_variavel: 'Renda Variável',
    crypto: 'Crypto',
    fundos: 'Fundos',
    poupanca: 'Poupança',
    outros: 'Outros',
};

const statusConfig: Record<
    Investment['status'],
    { label: string; className: string }
> = {
    active: { label: 'Ativo', className: 'bg-green-500/10 text-green-400' },
    redeemed: { label: 'Resgatado', className: 'bg-gray-500/10 text-gray-400' },
    matured: { label: 'Vencido', className: 'bg-blue-500/10 text-blue-400' },
};

const EMPTY_INVESTMENT_FORM: InvestmentFormData = {
    name: '',
    type: '',
    institution: '',
    bank_account_id: '',
    invested_amount: '',
    current_amount: '',
    yield_rate: '',
    yield_type: '',
    start_date: '',
    maturity_date: '',
};

// ─────────────────────────────────────────────
// InvestmentModal (create / edit)
// ─────────────────────────────────────────────

interface InvestmentModalProps {
    editing: Investment | null;
    accounts: BankAccount[];
    onClose: () => void;
}

function InvestmentModal({ editing, accounts, onClose }: InvestmentModalProps) {
    const isEditing = editing !== null;

    const [form, setForm] = useState<InvestmentFormData>(
        editing
            ? {
                  name: editing.name,
                  type: editing.type,
                  institution: editing.institution ?? '',
                  bank_account_id: editing.bank_account_id
                      ? String(editing.bank_account_id)
                      : '',
                  invested_amount: String(editing.invested_amount),
                  current_amount: String(editing.current_amount),
                  yield_rate: editing.yield_rate !== null ? String(editing.yield_rate) : '',
                  yield_type: editing.yield_type ?? '',
                  start_date: editing.start_date,
                  maturity_date: editing.maturity_date ?? '',
              }
            : EMPTY_INVESTMENT_FORM
    );

    const [processing, setProcessing] = useState(false);

    const set = <K extends keyof InvestmentFormData>(key: K, val: InvestmentFormData[K]) =>
        setForm((prev) => ({ ...prev, [key]: val }));

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            name: form.name,
            type: form.type,
            institution: form.institution || null,
            bank_account_id: form.bank_account_id || null,
            invested_amount: parseFloat(form.invested_amount),
            current_amount: form.current_amount ? parseFloat(form.current_amount) : null,
            yield_rate: form.yield_rate ? parseFloat(form.yield_rate) : null,
            yield_type: form.yield_type || null,
            start_date: form.start_date,
            maturity_date: form.maturity_date || null,
        };

        if (isEditing) {
            router.patch(route('investments.update', editing.id), payload, {
                onFinish: () => setProcessing(false),
                onSuccess: () => onClose(),
            });
        } else {
            router.post(route('investments.store'), payload, {
                onFinish: () => setProcessing(false),
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto modal-content">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
                    <h2 className="text-white font-semibold text-lg">
                        {isEditing ? 'Editar Investimento' : 'Novo Investimento'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Nome */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Nome <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            required
                            placeholder="Ex: Tesouro Selic 2026"
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                    </div>

                    {/* Tipo */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Tipo <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={form.type}
                            onChange={(e) => set('type', e.target.value as InvestmentType)}
                            required
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            <option value="">Selecione o tipo...</option>
                            {Object.entries(investmentTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Instituição */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Instituição</label>
                        <input
                            type="text"
                            value={form.institution}
                            onChange={(e) => set('institution', e.target.value)}
                            placeholder="Ex: Nubank, XP, BTG..."
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                    </div>

                    {/* Conta vinculada */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Conta vinculada</label>
                        <select
                            value={form.bank_account_id}
                            onChange={(e) => set('bank_account_id', e.target.value)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            <option value="">Nenhuma</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">
                                Valor investido <span className="text-red-400">*</span>
                            </label>
                            <CurrencyInput
                                value={form.invested_amount}
                                onChange={(v) => set('invested_amount', v)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Valor atual</label>
                            <CurrencyInput
                                value={form.current_amount}
                                onChange={(v) => set('current_amount', v)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Taxa + tipo */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Taxa (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.yield_rate}
                                onChange={(e) => set('yield_rate', e.target.value)}
                                placeholder="Ex: 12.5"
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Tipo de taxa</label>
                            <select
                                value={form.yield_type}
                                onChange={(e) =>
                                    set(
                                        'yield_type',
                                        e.target.value as InvestmentFormData['yield_type']
                                    )
                                }
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="">Selecionar...</option>
                                <option value="prefixado">Prefixado</option>
                                <option value="posfixado">Pós-fixado</option>
                                <option value="hibrido">Híbrido</option>
                            </select>
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-3">
                        <DateInput
                            label="Data de Início"
                            value={form.start_date}
                            onChange={(v) => set('start_date', v)}
                            required
                        />
                        <DateInput
                            label="Data de Vencimento"
                            value={form.maturity_date}
                            onChange={(v) => set('maturity_date', v)}
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
// SnapshotModal
// ─────────────────────────────────────────────

interface SnapshotModalProps {
    investment: Investment;
    onClose: () => void;
}

function SnapshotModal({ investment, onClose }: SnapshotModalProps) {
    const [form, setForm] = useState<SnapshotFormData>({
        reference_date: new Date().toISOString().split('T')[0],
        amount: '',
    });
    const [processing, setProcessing] = useState(false);

    const set = <K extends keyof SnapshotFormData>(key: K, val: SnapshotFormData[K]) =>
        setForm((prev) => ({ ...prev, [key]: val }));

    const currentAmount = form.amount ? parseFloat(form.amount) : null;
    const yieldAmount =
        currentAmount !== null ? currentAmount - investment.invested_amount : null;
    const yieldPct =
        yieldAmount !== null && investment.invested_amount > 0
            ? (yieldAmount / investment.invested_amount) * 100
            : null;

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('investments.snapshot', investment.id),
            {
                reference_date: form.reference_date,
                amount: parseFloat(form.amount),
            },
            {
                onFinish: () => setProcessing(false),
                onSuccess: () => onClose(),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl modal-content">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-white font-semibold text-lg">Atualizar Valor</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    <p className="text-gray-400 text-sm">
                        Investimento:{' '}
                        <span className="text-white font-medium">{investment.name}</span>
                    </p>

                    <DateInput
                        label="Data de Referência"
                        value={form.reference_date}
                        onChange={(v) => set('reference_date', v)}
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Valor atual <span className="text-red-400">*</span>
                        </label>
                        <CurrencyInput
                            value={form.amount}
                            onChange={(v) => set('amount', v)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                    </div>

                    {/* Preview */}
                    {yieldAmount !== null && yieldPct !== null && (
                        <div className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 flex items-center justify-between">
                            <p className="text-gray-400 text-sm">Rendimento</p>
                            <div className="text-right">
                                <p
                                    className={`font-semibold text-sm ${
                                        yieldAmount >= 0 ? 'text-[#22c55e]' : 'text-red-400'
                                    }`}
                                >
                                    {formatCurrency(yieldAmount)}
                                </p>
                                <p
                                    className={`text-xs ${
                                        yieldPct >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}
                                >
                                    {yieldPct >= 0 ? '+' : ''}
                                    {yieldPct.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    )}

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
// RedeemModal
// ─────────────────────────────────────────────

interface RedeemModalProps {
    investment: Investment;
    accounts: BankAccount[];
    onClose: () => void;
}

function RedeemModal({ investment, accounts, onClose }: RedeemModalProps) {
    const [form, setForm] = useState<RedeemFormData>({
        amount: String(investment.current_amount),
        bank_account_id: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [processing, setProcessing] = useState(false);

    const set = <K extends keyof RedeemFormData>(key: K, val: RedeemFormData[K]) =>
        setForm((prev) => ({ ...prev, [key]: val }));

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('investments.redeem', investment.id),
            {
                amount: parseFloat(form.amount),
                bank_account_id: form.bank_account_id,
                date: form.date,
            },
            {
                onFinish: () => setProcessing(false),
                onSuccess: () => onClose(),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl modal-content">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-white font-semibold text-lg">Resgatar Investimento</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    <p className="text-gray-400 text-sm">
                        Investimento:{' '}
                        <span className="text-white font-medium">{investment.name}</span>
                    </p>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Valor a resgatar <span className="text-red-400">*</span>
                        </label>
                        <CurrencyInput
                            value={form.amount}
                            onChange={(v) => set('amount', v)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">
                            Conta destino <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={form.bank_account_id}
                            onChange={(e) => set('bank_account_id', e.target.value)}
                            required
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            <option value="">Selecione a conta...</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <DateInput
                        label="Data do Resgate"
                        value={form.date}
                        onChange={(v) => set('date', v)}
                        required
                    />

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
                            {processing ? 'Resgatando...' : 'Resgatar'}
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
    investment: Investment;
    onClose: () => void;
}

function DeleteConfirmModal({ investment, onClose }: DeleteConfirmModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('investments.destroy', investment.id), {
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
                    <h2 className="text-white font-semibold text-lg">Excluir investimento</h2>
                    <p className="text-gray-400 text-sm">
                        Tem certeza que deseja excluir{' '}
                        <span className="text-white font-medium">"{investment.name}"</span>?
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
// InvestmentCard
// ─────────────────────────────────────────────

interface InvestmentCardProps {
    investment: Investment;
    onSnapshot: (inv: Investment) => void;
    onRedeem: (inv: Investment) => void;
    onEdit: (inv: Investment) => void;
    onDelete: (inv: Investment) => void;
}

function InvestmentCard({
    investment,
    onSnapshot,
    onRedeem,
    onEdit,
    onDelete,
}: InvestmentCardProps) {
    const yieldAmount = investment.current_amount - investment.invested_amount;
    const yieldPct = investment.yield_percentage ?? 0;
    const isPositive = yieldAmount >= 0;
    const status = statusConfig[investment.status];

    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-4">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-white font-semibold text-base leading-tight">
                        {investment.name}
                    </p>
                    {investment.institution && (
                        <p className="text-gray-500 text-xs mt-0.5">{investment.institution}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-gray-300">
                        {investmentTypeLabels[investment.type]}
                    </span>
                    <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}
                    >
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className="text-gray-500 text-xs mb-0.5">Investido</p>
                    <p className="text-white font-semibold text-sm">
                        {formatCurrency(investment.invested_amount)}
                    </p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs mb-0.5">Valor atual</p>
                    <p className="text-white font-semibold text-sm">
                        {formatCurrency(investment.current_amount)}
                    </p>
                </div>
            </div>

            {/* Yield */}
            <div className="flex items-center justify-between bg-[var(--color-input-bg)] rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                    {isPositive ? (
                        <TrendingUp size={14} className="text-[#22c55e]" />
                    ) : (
                        <TrendingDown size={14} className="text-red-400" />
                    )}
                    <p className="text-gray-400 text-xs">Rendimento</p>
                </div>
                <div className="flex items-center gap-2">
                    <p
                        className={`text-sm font-semibold ${
                            isPositive ? 'text-[#22c55e]' : 'text-red-400'
                        }`}
                    >
                        {formatCurrency(yieldAmount)}
                    </p>
                    <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            isPositive
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                        }`}
                    >
                        {isPositive ? '+' : ''}
                        {yieldPct.toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Maturity */}
            {investment.maturity_date && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Vencimento: {formatDate(investment.maturity_date)}</span>
                    {investment.days_to_maturity !== null &&
                        investment.days_to_maturity !== undefined && (
                            <span
                                className={
                                    investment.days_to_maturity <= 30
                                        ? 'text-yellow-400'
                                        : 'text-gray-500'
                                }
                            >
                                {investment.days_to_maturity}d restantes
                            </span>
                        )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--color-border)]">
                <button
                    onClick={() => onSnapshot(investment)}
                    title="Snapshot"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors text-xs font-medium"
                >
                    <Camera size={13} />
                    Snapshot
                </button>
                <button
                    onClick={() => onRedeem(investment)}
                    title="Resgatar"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors text-xs font-medium"
                >
                    <LogOut size={13} />
                    Resgatar
                </button>
                <button
                    onClick={() => onEdit(investment)}
                    title="Editar"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors text-xs font-medium"
                >
                    <Pencil size={13} />
                    Editar
                </button>
                <button
                    onClick={() => onDelete(investment)}
                    title="Excluir"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium"
                >
                    <Trash2 size={13} />
                    Excluir
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function InvestmentsIndex({ investments, accounts, summary }: Props) {
    const { props } = usePage();
    const flash = props.flash as { success?: string; error?: string } | undefined;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [snapshotInvestment, setSnapshotInvestment] = useState<Investment | null>(null);
    const [redeemInvestment, setRedeemInvestment] = useState<Investment | null>(null);
    const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);

    const totalYield = summary.total_current - summary.total_invested;
    const yieldPct =
        summary.total_invested > 0
            ? (totalYield / summary.total_invested) * 100
            : 0;
    const isPositive = totalYield >= 0;

    const openCreate = () => {
        setEditingInvestment(null);
        setShowFormModal(true);
    };

    const openEdit = (inv: Investment) => {
        setEditingInvestment(inv);
        setShowFormModal(true);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setEditingInvestment(null);
    };

    return (
        <AppLayout title="Investimentos">
            <Head title="Investimentos" />

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

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Investimentos</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {investments.length === 0
                                ? 'Nenhum investimento cadastrado'
                                : `${investments.length} investimento${investments.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <Plus size={16} />
                        Novo Investimento
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center">
                                <Wallet size={16} className="text-gray-400" />
                            </div>
                            <p className="text-gray-400 text-sm">Total Investido</p>
                        </div>
                        <p className="text-white font-bold text-2xl">
                            {formatCurrency(summary.total_invested)}
                        </p>
                    </div>

                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center">
                                <TrendingUp size={16} className="text-gray-400" />
                            </div>
                            <p className="text-gray-400 text-sm">Valor Atual</p>
                        </div>
                        <p className="text-white font-bold text-2xl">
                            {formatCurrency(summary.total_current)}
                        </p>
                    </div>

                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                    isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                                }`}
                            >
                                {isPositive ? (
                                    <TrendingUp size={16} className="text-[#22c55e]" />
                                ) : (
                                    <TrendingDown size={16} className="text-red-400" />
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">Rendimento Total</p>
                        </div>
                        <p
                            className={`font-bold text-2xl ${
                                isPositive ? 'text-[#22c55e]' : 'text-red-400'
                            }`}
                        >
                            {formatCurrency(totalYield)}
                        </p>
                        <p
                            className={`text-xs mt-1 font-medium ${
                                isPositive ? 'text-green-400' : 'text-red-400'
                            }`}
                        >
                            {isPositive ? '+' : ''}
                            {yieldPct.toFixed(2)}%
                        </p>
                    </div>
                </div>

                {/* Grid */}
                {investments.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                            <TrendingUp size={24} className="text-gray-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">Nenhum investimento cadastrado</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Adicione seu primeiro investimento para começar a acompanhar.
                            </p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                        >
                            <Plus size={16} />
                            Novo Investimento
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {investments.map((inv) => (
                            <InvestmentCard
                                key={inv.id}
                                investment={inv}
                                onSnapshot={setSnapshotInvestment}
                                onRedeem={setRedeemInvestment}
                                onEdit={openEdit}
                                onDelete={setDeletingInvestment}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showFormModal && (
                <InvestmentModal
                    editing={editingInvestment}
                    accounts={accounts}
                    onClose={closeFormModal}
                />
            )}

            {snapshotInvestment && (
                <SnapshotModal
                    investment={snapshotInvestment}
                    onClose={() => setSnapshotInvestment(null)}
                />
            )}

            {redeemInvestment && (
                <RedeemModal
                    investment={redeemInvestment}
                    accounts={accounts}
                    onClose={() => setRedeemInvestment(null)}
                />
            )}

            {deletingInvestment && (
                <DeleteConfirmModal
                    investment={deletingInvestment}
                    onClose={() => setDeletingInvestment(null)}
                />
            )}
        </AppLayout>
    );
}
