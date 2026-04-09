import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { recurrencesSteps } from '@/tutorials/steps/recurrences';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Transaction } from '@/types/models';
import { ConfirmDeleteDialog } from '@/Components/ConfirmDeleteDialog';

interface Props {
    recurrences: Transaction[];
}

const RULE_LABELS: Record<string, string> = {
    monthly: 'Mensal',
    weekly: 'Semanal',
    yearly: 'Anual',
    biweekly: 'Quinzenal',
};

// Usa classes badge-* definidas no app.css — funciona em dark e light mode
const STATUS_STYLES: Record<string, string> = {
    pending:   'badge-warning',
    paid:      'badge-success',
    cancelled: 'badge-error',
    scheduled: 'badge-info',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Ativo',
    paid: 'Pago',
    cancelled: 'Cancelado',
    scheduled: 'Agendado',
};

export default function RecurrencesIndex({ recurrences }: Props) {
    const { start } = useTutorial({ key: 'recurrences', steps: recurrencesSteps });
    const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
    const [processingCancel, setProcessingCancel] = useState(false);

    const handleCancel = (id: number) => {
        setProcessingCancel(true);
        router.patch(route('recurrences.cancel', id), {}, {
            onSuccess: () => { setConfirmCancelId(null); setProcessingCancel(false); },
            onError: () => setProcessingCancel(false),
        });
    };

    return (
        <AppLayout title="Recorrências">
            <Head title="Recorrências" />

            <div className="w-full flex flex-col gap-6">

                {/* Header */}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--md-color-on-surface)]">
                            Compromissos Recorrentes
                        </h1>
                        <TutorialHelpButton onStart={start} />
                    </div>
                    <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                        Transações configuradas para repetição automática
                    </p>
                </div>

                {recurrences.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                            <RefreshCw size={24} className="text-[var(--md-color-on-surface-variant)]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[var(--md-color-on-surface)] font-medium">Nenhuma recorrência cadastrada</p>
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                                Nenhuma transação recorrente encontrada.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div data-tutorial="rec-list" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-[var(--color-border)]">
                                <tr className="text-[var(--md-color-on-surface-variant)] text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3">Descrição</th>
                                    <th className="text-left px-5 py-3">Valor</th>
                                    <th className="text-left px-5 py-3">Frequência</th>
                                    <th className="text-left px-5 py-3">Próxima Data</th>
                                    <th className="text-left px-5 py-3">Categoria</th>
                                    <th className="text-left px-5 py-3">Conta</th>
                                    <th className="text-left px-5 py-3">Status</th>
                                    <th className="text-left px-5 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recurrences.map((rec) => (
                                    <tr key={rec.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)]/40">
                                        <td className="px-5 py-3 font-medium text-[var(--md-color-on-surface)]">{rec.description}</td>
                                        <td className="px-5 py-3 font-finance text-[var(--md-color-on-surface)]">
                                            R$ {Number(rec.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span data-tutorial="rec-frequency" className="badge-info inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs">
                                                <RefreshCw className="h-3 w-3" />
                                                {rec.recurrence_rule ? (RULE_LABELS[rec.recurrence_rule] ?? rec.recurrence_rule) : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-[var(--md-color-on-surface)]">
                                            {rec.date ? new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-[var(--md-color-on-surface-variant)]">
                                            {rec.category?.name ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 text-[var(--md-color-on-surface-variant)]">
                                            {rec.bank_account?.name ?? rec.credit_card?.name ?? '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status] ?? ''}`}>
                                                {STATUS_LABELS[rec.status] ?? rec.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {rec.status === 'pending' && (
                                                <button
                                                    onClick={() => setConfirmCancelId(rec.id)}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-error)] text-xs transition-colors min-h-[44px]"
                                                >
                                                    <AlertCircle className="h-3 w-3" />
                                                    Cancelar série
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                open={confirmCancelId !== null}
                title="Cancelar recorrência?"
                description="Todas as transações futuras desta série serão canceladas. Transações já pagas não são afetadas."
                confirmLabel="Cancelar série"
                onConfirm={() => confirmCancelId !== null && handleCancel(confirmCancelId)}
                onCancel={() => setConfirmCancelId(null)}
                loading={processingCancel}
            />
        </AppLayout>
    );
}
