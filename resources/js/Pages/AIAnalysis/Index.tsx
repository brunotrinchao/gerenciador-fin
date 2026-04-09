import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { aiAnalysisSteps } from '@/tutorials/steps/ai-analysis';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

interface Props {
    month: number;
    year: number;
    hasGemini: boolean;
}

export default function AIAnalysisIndex({ month: initialMonth, year: initialYear, hasGemini }: Props) {
    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(route('ai-analysis.generate'), { month, year });
            setAnalysis(response.data.analysis);
        } catch {
            setError('Falha ao gerar análise. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const parseAnalysis = (text: string) => {
        const sections = text.split('##').filter(Boolean);
        return sections.map((s) => {
            const [title, ...content] = s.trim().split('\n');
            return { title: title.trim(), content: content.join('\n').trim() };
        });
    };

    const { start } = useTutorial({ key: 'ai-analysis', steps: aiAnalysisSteps, autoStart: false });

    return (
        <AppLayout title="Análise por IA">
            <Head title="Análise por IA" />

            <div className="w-full flex flex-col gap-6">

                {/* Header */}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--md-color-on-surface)]">
                            Análise de Gastos por IA
                        </h1>
                        <TutorialHelpButton onStart={start} />
                    </div>
                    <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                        Análise inteligente dos seus dados financeiros com Google Gemini
                    </p>
                </div>

                {!hasGemini && (
                    <div className="alert-warning p-4 rounded-2xl border flex gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p>Gemini API não configurado. Adicione GEMINI_API_KEY no .env.</p>
                    </div>
                )}

                {/* Controls */}
                <div data-tutorial="ai-controls" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-[var(--md-color-on-surface-variant)]">Mês</label>
                            <select
                                data-tutorial="ai-month-select"
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                                style={{
                                    backgroundColor: 'var(--color-input-bg)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-foreground)',
                                }}
                            >
                                {months.map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-[var(--md-color-on-surface-variant)]">Ano</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                min="2020"
                                max="2030"
                                className="w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition font-finance w-24"
                                style={{
                                    backgroundColor: 'var(--color-input-bg)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-foreground)',
                                }}
                            />
                        </div>
                        <button
                            data-tutorial="ai-generate-btn"
                            onClick={handleGenerate}
                            disabled={loading || !hasGemini}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {loading ? 'Analisando...' : 'Gerar Análise'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert-error p-4 rounded-2xl border flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Analysis results */}
                {analysis && (
                    <div className="flex flex-col gap-4">
                        {parseAnalysis(analysis).map((section, i) => (
                            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-[var(--md-color-on-surface)]">
                                    <Sparkles className="h-4 w-4" style={{ color: 'var(--md-color-primary)' }} />
                                    {section.title}
                                </h3>
                                <p className="text-[var(--md-color-on-surface-variant)] whitespace-pre-line">{section.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!analysis && !loading && (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                            <Sparkles size={24} className="text-[var(--md-color-on-surface-variant)]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[var(--md-color-on-surface)] font-medium">Nenhuma análise gerada</p>
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                                Selecione um mês e clique em "Gerar Análise"
                            </p>
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-0.5">
                                O Gemini irá analisar seus dados financeiros do período
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </AppLayout>
    );
}
