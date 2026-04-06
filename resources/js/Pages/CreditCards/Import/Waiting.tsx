import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface Props {
    statementId: number;
}

const STAGES = [
    'Extraindo transações do arquivo...',
    'Detectando duplicatas...',
    'Categorizando com IA...',
    'Finalizando...',
];

const STAGE_DURATION_MS = 4000;

export default function ImportWaiting({ statementId }: Props) {
    const [stageIndex, setStageIndex] = useState(0);
    const [failed, setFailed] = useState(false);

    // Avança o estágio visual a cada STAGE_DURATION_MS para dar feedback progressivo
    useEffect(() => {
        const interval = setInterval(() => {
            setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
        }, STAGE_DURATION_MS);

        return () => clearInterval(interval);
    }, []);

    // Polling: verifica o status a cada 2 segundos
    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch(route('imports.status', statementId), {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });

                if (!res.ok) return;

                const data = await res.json();

                if (data.import_status === 'review_pending') {
                    clearInterval(poll);
                    router.visit(route('imports.review', statementId));
                } else if (data.import_status === 'failed') {
                    clearInterval(poll);
                    setFailed(true);
                }
            } catch {
                // Ignora erros de rede — continua tentando
            }
        }, 2000);

        return () => clearInterval(poll);
    }, [statementId]);

    return (
        <AppLayout title="Processando Fatura">
            <Head title="Processando Fatura" />

            <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-8">
                {failed ? (
                    /* Estado de erro */
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Falha no processamento</h2>
                            <p className="text-gray-400 text-sm">
                                Não foi possível processar a fatura. Tente novamente.
                            </p>
                        </div>
                        <button
                            onClick={() => router.visit(route('imports.index'))}
                            className="px-6 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : (
                    /* Estado de processamento */
                    <div className="flex flex-col items-center gap-8 text-center w-full">
                        {/* Spinner */}
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border)]" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#22c55e] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-8 h-8 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Analisando sua fatura</h2>
                            <p className="text-gray-400 text-sm">Isso pode levar alguns segundos...</p>
                        </div>

                        {/* Estágios de progresso */}
                        <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-3">
                            {STAGES.map((stage, i) => {
                                const isDone    = i < stageIndex;
                                const isActive  = i === stageIndex;
                                const isPending = i > stageIndex;

                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        {isDone ? (
                                            <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : isActive ? (
                                            <div className="w-5 h-5 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin flex-shrink-0" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] flex-shrink-0" />
                                        )}
                                        <span className={`text-sm ${isDone ? 'text-gray-500 line-through' : isActive ? 'text-white font-medium' : 'text-gray-600'}`}>
                                            {stage}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
