import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Trash2, X, Pencil } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { taxPlanningSteps } from '@/tutorials/steps/tax-planning';
import { ConfirmDeleteDialog } from '@/Components/ConfirmDeleteDialog';
import { BankAccount, TaxEvent } from '@/types/models';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
    taxEventsByYear: Record<string, TaxEvent[]>;
    bankAccounts: BankAccount[];
    currentYear: number;
}

interface FormData {
    type: 'ipva' | 'iptu' | 'irpf' | 'other';
    description: string;
    year: number;
    total_amount: string;
    installments_count: number;
    first_due_date: string;
    bank_account_id: string;
    notes: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    ipva: 'IPVA',
    iptu: 'IPTU',
    irpf: 'IRPF',
    other: 'Outro',
};

const TYPE_COLORS: Record<string, string> = {
    ipva: 'var(--md-color-primary)',
    iptu: '#16a34a',
    irpf: '#7c3aed',
    other: 'var(--color-muted)',
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#ca8a04',
    paid: '#16a34a',
    partial: '#ea580c',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    partial: 'Parcial',
};

function formatCurrency(value: string | number): string {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

const inputClass = 'w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition';
const inputStyle = {
    backgroundColor: 'var(--color-input-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function TaxPlanningIndex({ taxEventsByYear, bankAccounts, currentYear }: Props) {
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<TaxEvent | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<TaxEvent | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const [form, setForm] = useState<FormData>({
        type: 'ipva',
        description: '',
        year: currentYear,
        total_amount: '',
        installments_count: 1,
        first_due_date: '',
        bank_account_id: '',
        notes: '',
    });

    const years = Object.keys(taxEventsByYear).sort((a, b) => Number(b) - Number(a));

    const openCreate = () => { setEditingEvent(null); setShowFormModal(true); };
    const openEdit = (event: TaxEvent) => { setEditingEvent(event); setShowFormModal(true); };
    const closeModal = () => { setShowFormModal(false); setEditingEvent(null); };

    const handleDeleteConfirm = () => {
        if (!deletingEvent) return;
        setProcessingDelete(true);
        router.delete(route('tax-planning.destroy', deletingEvent.id), {
            onSuccess: () => { setDeletingEvent(null); setProcessingDelete(false); },
            onError: () => setProcessingDelete(false),
        });
    };

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.post(route('tax-planning.store'), {
            ...form,
            bank_account_id: form.bank_account_id || null,
        }, {
            onSuccess: () => {
                closeModal();
                setForm({
                    type: 'ipva',
                    description: '',
                    year: currentYear,
                    total_amount: '',
                    installments_count: 1,
                    first_due_date: '',
                    bank_account_id: '',
                    notes: '',
                });
            },
        });
    }

    const { start } = useTutorial({ key: 'tax-planning', steps: taxPlanningSteps });

    return (
        <AppLayout title="Impostos">
            <Head title="Impostos" />

            <div className="w-full flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--md-color-on-surface)]">
                                Planejamento de Impostos
                            </h1>
                            <TutorialHelpButton onStart={start} />
                        </div>
                        <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                            Organize e acompanhe seus impostos anuais
                        </p>
                    </div>
                    <button
                        data-tutorial="tax-add-btn"
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <Plus size={16} />
                        Adicionar Imposto
                    </button>
                </div>

                {/* Empty state */}
                {years.length === 0 && (
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[bg-[var(--color-surface-2)]] flex items-center justify-center">
                            <Plus size={24} className="text-[var(--md-color-on-surface-variant)]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[var(--md-color-on-surface)] font-medium">Nenhum imposto cadastrado</p>
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                                Clique em "Adicionar Imposto" para começar.
                            </p>
                        </div>
                    </div>
                )}

                {/* List grouped by year */}
                <div data-tutorial="tax-list">
                {years.map((year) => (
                    <div key={year} className="flex flex-col gap-2">
                        <h2 className="text-xs font-semibold uppercase tracking-widest px-1 text-[var(--md-color-on-surface-variant)]">
                            {year}
                        </h2>
                        <div className="flex flex-col gap-2">
                            {taxEventsByYear[year].map((event) => (
                                <TaxEventRow
                                    key={event.id}
                                    event={event}
                                    onEdit={openEdit}
                                    onDelete={setDeletingEvent}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-[var(--md-color-on-surface)]">
                                {editingEvent ? 'Editar Imposto' : 'Novo Imposto'}
                            </h2>
                            <button onClick={closeModal} className="p-1 rounded text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)]">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Tipo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Tipo</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                    style={inputStyle}
                                >
                                    <option value="ipva">IPVA</option>
                                    <option value="iptu">IPTU</option>
                                    <option value="irpf">IRPF</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>

                            {/* Descrição */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Descrição</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                    maxLength={255}
                                    placeholder="Ex: IPVA Honda Civic 2025"
                                    className={inputClass}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Ano */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Ano</label>
                                <input
                                    type="number"
                                    name="year"
                                    value={form.year}
                                    onChange={handleChange}
                                    required
                                    min={2020}
                                    max={2030}
                                    className={inputClass}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Valor total */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Valor Total (R$)</label>
                                <input
                                    type="number"
                                    name="total_amount"
                                    value={form.total_amount}
                                    onChange={handleChange}
                                    required
                                    min={0.01}
                                    step={0.01}
                                    placeholder="0,00"
                                    className={inputClass}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Parcelas */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Nº de Parcelas</label>
                                <input
                                    type="number"
                                    name="installments_count"
                                    value={form.installments_count}
                                    onChange={handleChange}
                                    required
                                    min={1}
                                    max={12}
                                    className={inputClass}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Primeiro vencimento */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Primeiro Vencimento</label>
                                <input
                                    type="date"
                                    name="first_due_date"
                                    value={form.first_due_date}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Conta bancária */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Conta Bancária (opcional)</label>
                                <select
                                    name="bank_account_id"
                                    value={form.bank_account_id}
                                    onChange={handleChange}
                                    className={inputClass}
                                    style={inputStyle}
                                >
                                    <option value="">Nenhuma</option>
                                    {bankAccounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Observações */}
                            <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className="text-sm text-[var(--md-color-on-surface-variant)]">Observações (opcional)</label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                    style={inputStyle}
                                />
                            </div>

                            <div className="sm:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors"
                                >
                                    Salvar e Agendar Parcelas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteDialog
                open={!!deletingEvent}
                title="Remover imposto?"
                description={deletingEvent ? `Remover "${deletingEvent.description}"? Esta ação não pode ser desfeita.` : undefined}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeletingEvent(null)}
                loading={processingDelete}
            />

        </AppLayout>
    );
}

// ─────────────────────────────────────────────
// TaxEventRow
// ─────────────────────────────────────────────

function TaxEventRow({
    event,
    onEdit,
    onDelete,
}: {
    event: TaxEvent;
    onEdit: (event: TaxEvent) => void;
    onDelete: (event: TaxEvent) => void;
}) {
    return (
        <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
                {/* Type badge */}
                <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[event.type] + '22', color: TYPE_COLORS[event.type] }}
                >
                    {TYPE_LABELS[event.type]}
                </span>

                {/* Description */}
                <span className="text-sm truncate text-[var(--md-color-on-surface)]">
                    {event.description}
                </span>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
                {/* Amount */}
                <span className="text-sm font-semibold text-[var(--md-color-on-surface)]">
                    {formatCurrency(event.total_amount)}
                </span>

                {/* Installments */}
                <span className="text-xs hidden sm:block text-[var(--md-color-on-surface-variant)]">
                    {event.installments_count}x
                </span>

                {/* First due date */}
                <span className="text-xs hidden sm:block text-[var(--md-color-on-surface-variant)]">
                    {formatDate(event.first_due_date)}
                </span>

                {/* Status badge */}
                <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[event.status] + '22', color: STATUS_COLORS[event.status] }}
                >
                    {STATUS_LABELS[event.status]}
                </span>

                {/* Edit */}
                <button
                    onClick={() => onEdit(event)}
                    className="p-1 rounded transition-colors text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)]"
                    title="Editar"
                >
                    <Pencil size={15} />
                </button>

                {/* Delete */}
                <button
                    onClick={() => onDelete(event)}
                    className="p-1 rounded transition-colors text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-error)]"
                    title="Remover"
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
}
