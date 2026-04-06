import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import { AlertTriangle, CheckCircle, Loader2, Trash2, X } from 'lucide-react';

// ─── ClearDataModal ───────────────────────────────────────────────────────────

function ClearDataModal({ onClose }: { onClose: () => void }) {
    const [step, setStep]           = useState<'confirm' | 'running' | 'done'>('confirm');
    const [confirm, setConfirm]     = useState('');
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [animatingSteps, setAnimatingSteps] = useState<string[]>([]);

    const CONFIRM_WORD = 'CONFIRMAR';

    const handleClear = async () => {
        setStep('running');

        // Simula progresso enquanto aguarda a resposta do servidor
        const placeholders = [
            'Removendo transações...',
            'Removendo faturas...',
            'Removendo investimentos...',
            'Removendo cartões e contas...',
            'Finalizando...',
        ];

        for (let i = 0; i < placeholders.length; i++) {
            await new Promise<void>((resolve) => setTimeout(resolve, 600 * (i + 1)));
            setAnimatingSteps((prev) => [...prev, placeholders[i]]);
        }

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const response = await axios.delete(route('settings.clear-data'), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            const { steps } = response.data as { steps: string[]; completed: boolean };

            setAnimatingSteps([]);
            setCompletedSteps(steps);
            setStep('done');
        } catch {
            setAnimatingSteps([]);
            setCompletedSteps(['Erro ao limpar os dados. Tente novamente.']);
            setStep('done');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={step === 'running' ? undefined : onClose} />
            <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Trash2 size={16} className="text-red-400" />
                        </div>
                        <h2 className="text-white font-semibold text-lg">Limpar Dados</h2>
                    </div>
                    {step !== 'running' && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">
                    {/* Etapa: confirmação */}
                    {step === 'confirm' && (
                        <>
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm font-semibold">Ação irreversível</p>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Isso irá remover <strong className="text-white">permanentemente</strong> todas as suas transações,
                                    parcelamentos, faturas, investimentos, cartões e contas bancárias.
                                    Perfis e membros não serão afetados.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-400">
                                    Digite <span className="text-white font-mono font-semibold">{CONFIRM_WORD}</span> para confirmar
                                </label>
                                <input
                                    type="text"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value.toUpperCase())}
                                    placeholder={CONFIRM_WORD}
                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleClear}
                                    disabled={confirm !== CONFIRM_WORD}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                                >
                                    Limpar tudo
                                </button>
                            </div>
                        </>
                    )}

                    {/* Etapa: executando */}
                    {step === 'running' && (
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex items-center gap-3">
                                <Loader2 size={20} className="text-[#22c55e] animate-spin flex-shrink-0" />
                                <p className="text-white font-medium">Limpando dados...</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {animatingSteps.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 animate-fade-in">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                                        <span className="text-gray-300 text-sm">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Etapa: concluído */}
                    {step === 'done' && (
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-[#22c55e] flex-shrink-0" />
                                <p className="text-white font-medium">Limpeza concluída!</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {completedSteps.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                                        <span className="text-gray-300 text-sm">{s}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => router.visit(route('dashboard'))}
                                className="w-full px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors mt-2"
                            >
                                Ir para o Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsIndex() {
    const [showClearModal, setShowClearModal] = useState(false);

    return (
        <AppLayout title="Configurações">
            <Head title="Configurações Gerais" />
            <div className="w-full flex flex-col gap-6 max-w-2xl">
                <div>
                    <h1 className="text-2xl font-bold text-white">Configurações Gerais</h1>
                    <p className="text-gray-400 text-sm mt-1">Gerencie as opções gerais do sistema</p>
                </div>

                {/* Zona de Perigo */}
                <div className="bg-[var(--color-surface)] border border-red-500/20 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-red-500/20 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-400" />
                        <h2 className="text-red-400 font-semibold text-sm">Zona de Perigo</h2>
                    </div>
                    <div className="px-5 py-5 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-white font-medium text-sm">Limpar todos os dados</p>
                            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                                Remove permanentemente todas as transações, parcelamentos, faturas, investimentos,
                                cartões e contas bancárias. Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-colors flex-shrink-0"
                        >
                            <Trash2 size={14} /> Limpar Dados
                        </button>
                    </div>
                </div>
            </div>

            {showClearModal && <ClearDataModal onClose={() => setShowClearModal(false)} />}
        </AppLayout>
    );
}
