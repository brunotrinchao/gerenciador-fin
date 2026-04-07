import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BankAccount, AccountType } from '@/types/models';
import { Plus, Pencil, Trash2, X, Wallet, Filter } from 'lucide-react';
import { CurrencyInput } from '@/Components/CurrencyInput';
import { BankSelector } from '@/Components/BankSelector';
import { BankIcon } from '@/Components/BankIcon';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
    accounts: BankAccount[];
}

interface FormData {
    name: string;
    bank_name: string;
    account_type: AccountType;
    initial_balance: string;
    current_balance: string;
    overdraft_limit: string;
    color: string;
    is_active: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const accountTypeLabels: Record<AccountType, string> = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    investment: 'Conta Investimento',
    cash: 'Dinheiro',
    other: 'Outro',
};

const PRESET_COLORS = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

// ─────────────────────────────────────────────
// AccountCard
// ─────────────────────────────────────────────

interface AccountCardProps {
    account: BankAccount;
    onEdit: (account: BankAccount) => void;
    onDelete: (account: BankAccount) => void;
}

function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <BankIcon bankName={account.bank_name} size={36} />
                    <div>
                        <p className="text-[var(--md-color-on-surface)] font-semibold leading-tight">{account.name}</p>
                        {account.bank_name && (
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm">{account.bank_name}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(account)}
                        className="p-1.5 rounded-lg text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)] hover:bg-[var(--color-surface-2)] transition-colors"
                        title="Editar"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        onClick={() => onDelete(account)}
                        className="p-1.5 rounded-lg text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-error)] hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[var(--md-color-on-surface-variant)] text-xs mb-0.5">Saldo atual</p>
                    <p
                        className={`text-xl font-bold ${
                            account.current_balance >= 0 ? 'text-[var(--md-color-on-surface)]' : 'text-[var(--md-color-error)]'
                        }`}
                    >
                        {formatCurrency(account.current_balance)}
                    </p>
                    {account.current_balance < 0 && account.overdraft_limit > 0 && (
                        <div className="text-xs text-orange-400 flex items-center gap-1 mt-1">
                            <span>Cheque especial:</span>
                            <span className="font-medium">
                                {formatCurrency(account.current_balance)} disponível
                            </span>
                        </div>
                    )}
                    {account.current_balance < 0 && account.overdraft_limit === 0 && (
                        <p className="text-xs text-red-400 mt-1">Saldo negativo</p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--md-color-on-surface-variant)]">
                        {accountTypeLabels[account.account_type]}
                    </span>
                    <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            account.is_active
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-gray-500/10 text-gray-500'
                        }`}
                    >
                        {account.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// AccountFormModal
// ─────────────────────────────────────────────

interface AccountFormModalProps {
    editingAccount: BankAccount | null;
    onClose: () => void;
}

function AccountFormModal({ editingAccount, onClose }: AccountFormModalProps) {
    const isEditing = editingAccount !== null;

    const { data, setData, post, patch, processing, errors, reset } = useForm<FormData>({
        name: editingAccount?.name ?? '',
        bank_name: editingAccount?.bank_name ?? '',
        account_type: editingAccount?.account_type ?? 'checking',
        initial_balance: editingAccount ? String(editingAccount.initial_balance) : '',
        current_balance: editingAccount ? String(editingAccount.current_balance) : '',
        overdraft_limit: editingAccount ? String(editingAccount.overdraft_limit ?? 0) : '0',
        color: editingAccount?.color ?? '#22c55e',
        is_active: editingAccount?.is_active ?? true,
    });

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isEditing) {
            patch(route('bank-accounts.update', editingAccount.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('bank-accounts.store'), {
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

            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl modal-content">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-[var(--md-color-on-surface)] font-semibold text-lg">
                        {isEditing ? 'Editar Conta' : 'Nova Conta'}
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
                            placeholder="Ex: Conta Principal"
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.name && (
                            <p className="text-[var(--md-color-error)] text-xs">{errors.name}</p>
                        )}
                    </div>

                    {/* Tipo */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">
                            Tipo de Conta <span className="text-[var(--md-color-error)]">*</span>
                        </label>
                        <select
                            value={data.account_type}
                            onChange={(e) => setData('account_type', e.target.value as AccountType)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        >
                            {(Object.entries(accountTypeLabels) as [AccountType, string][]).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                        {errors.account_type && (
                            <p className="text-[var(--md-color-error)] text-xs">{errors.account_type}</p>
                        )}
                    </div>

                    {/* Banco */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">Banco</label>
                        <BankSelector
                            value={data.bank_name}
                            onChange={(value, bank) => {
                                setData('bank_name', value);
                            }}
                        />
                        {errors.bank_name && (
                            <p className="text-[var(--md-color-error)] text-xs">{errors.bank_name}</p>
                        )}
                    </div>

                    {/* Saldo Inicial */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">
                            Saldo Inicial <span className="text-[var(--md-color-error)]">*</span>
                        </label>
                        <CurrencyInput
                            value={data.initial_balance}
                            onChange={(v) => setData('initial_balance', v)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        {errors.initial_balance && (
                            <p className="text-[var(--md-color-error)] text-xs">{errors.initial_balance}</p>
                        )}
                    </div>

                    {/* Saldo atual (apenas na edição) */}
                    {isEditing && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-[var(--md-color-on-surface-variant)]">Saldo Atual</label>
                            <CurrencyInput
                                value={data.current_balance}
                                onChange={(v) => setData('current_balance', v)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            />
                            {errors.current_balance && (
                                <p className="text-[var(--md-color-error)] text-xs">{errors.current_balance}</p>
                            )}
                        </div>
                    )}

                    {/* Limite Cheque Especial */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">Limite Cheque Especial</label>
                        <CurrencyInput
                            value={data.overdraft_limit}
                            onChange={(v) => setData('overdraft_limit', v)}
                            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--md-color-on-surface)] placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                        />
                        <p className="text-[var(--md-color-on-surface-variant)] text-xs">Se o saldo ficar negativo, usa este limite.</p>
                        {errors.overdraft_limit && <p className="text-[var(--md-color-error)] text-xs">{errors.overdraft_limit}</p>}
                    </div>

                    {/* Cor */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">Cor</label>
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
                    </div>

                    {/* Status (apenas na edição) */}
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
                            <span className="text-sm text-[var(--md-color-on-surface-variant)]">Conta ativa</span>
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
    account: BankAccount;
    onClose: () => void;
}

function DeleteConfirmModal({ account, onClose }: DeleteConfirmModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('bank-accounts.destroy', account.id), {
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
                    <h2 className="text-[var(--md-color-on-surface)] font-semibold text-lg">Excluir conta</h2>
                    <p className="text-[var(--md-color-on-surface-variant)] text-sm">
                        Tem certeza que deseja excluir a conta{' '}
                        <span className="text-[var(--md-color-on-surface)] font-medium">"{account.name}"</span>?
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

export default function BankAccountsIndex({ accounts }: Props) {
    const { flash } = usePage().props;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);
    const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');

    const activeAccounts = accounts.filter((a) => a.is_active);
    const totalBalance = activeAccounts.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
    const totalOverdraftAvailable = activeAccounts
        .filter(a => a.current_balance < 0 && a.overdraft_limit > 0)
        .reduce((sum, a) => sum + Math.max(0, a.overdraft_limit + a.current_balance), 0);

    const filteredAccounts = typeFilter === 'all'
        ? accounts
        : accounts.filter(a => a.account_type === typeFilter);

    const openCreate = () => {
        setEditingAccount(null);
        setShowFormModal(true);
    };

    const openEdit = (account: BankAccount) => {
        setEditingAccount(account);
        setShowFormModal(true);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setEditingAccount(null);
    };

    return (
        <AppLayout title="Contas Bancárias">
            <Head title="Contas Bancárias" />

            <div className="w-full flex flex-col gap-6">
                {/* Flash message */}
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
                        <h1 className="text-2xl font-bold text-[var(--md-color-on-surface)]">Contas Bancárias</h1>
                        <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                            {accounts.length === 0
                                ? 'Nenhuma conta cadastrada'
                                : `${accounts.length} conta${accounts.length !== 1 ? 's' : ''} cadastrada${accounts.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <Plus size={16} />
                        Nova Conta
                    </button>
                </div>

                {/* Filtros por tipo */}
                {accounts.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--md-color-on-surface-variant)] text-xs flex items-center gap-1">
                            <Filter size={12} /> Filtrar:
                        </span>
                        {([['all', 'Todas'], ['checking', 'Corrente'], ['savings', 'Poupança'], ['investment', 'Investimento'], ['cash', 'Dinheiro'], ['other', 'Outro']] as [AccountType | 'all', string][]).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setTypeFilter(val)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                                    typeFilter === val
                                        ? 'border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Saldo consolidado */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Wallet size={18} className="text-[#22c55e]" />
                        </div>
                        <p className="text-[var(--md-color-on-surface-variant)] text-sm">Saldo Total Consolidado</p>
                    </div>
                    <p
                        className={`text-3xl font-bold ${
                            totalBalance >= 0 ? 'text-[var(--md-color-on-surface)]' : 'text-[var(--md-color-error)]'
                        }`}
                    >
                        {formatCurrency(totalBalance)}
                    </p>
                    {totalOverdraftAvailable > 0 && (
                        <p className="text-orange-400 text-xs mt-1">
                            Cheque especial em uso — {formatCurrency(totalOverdraftAvailable)} disponível no limite
                        </p>
                    )}
                    {activeAccounts.length !== accounts.length && (
                        <p className="text-[var(--md-color-on-surface-variant)] text-xs mt-2">
                            Considera apenas {activeAccounts.length} conta{activeAccounts.length !== 1 ? 's' : ''} ativa{activeAccounts.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {/* Lista de contas */}
                {accounts.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                            <Wallet size={24} className="text-[var(--md-color-on-surface-variant)]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[var(--md-color-on-surface)] font-medium">Nenhuma conta cadastrada</p>
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                                Adicione sua primeira conta bancária para começar.
                            </p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                        >
                            <Plus size={16} />
                            Nova Conta
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAccounts.map((account) => (
                            <AccountCard
                                key={account.id}
                                account={account}
                                onEdit={openEdit}
                                onDelete={setDeletingAccount}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showFormModal && (
                <AccountFormModal
                    editingAccount={editingAccount}
                    onClose={closeFormModal}
                />
            )}

            {deletingAccount && (
                <DeleteConfirmModal
                    account={deletingAccount}
                    onClose={() => setDeletingAccount(null)}
                />
            )}
        </AppLayout>
    );
}
