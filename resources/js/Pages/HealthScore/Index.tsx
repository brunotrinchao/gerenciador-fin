import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { healthScoreSteps } from '@/tutorials/steps/health-score';
import { Progress } from '@/Components/ui/progress';
import { Sparkles, Loader2, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';

// ─── Local Types ────────────────────────────────────────────────────────────

interface HealthScoreComponent {
    score: number;
    max: number;
    label: string;
    description: string;
    value: number | string;
    unit: string;
}

interface HealthScore {
    total: number;
    grade: string;
    components: Record<string, HealthScoreComponent>;
    calculated_at: string;
}

interface Props {
    score: HealthScore;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HealthScoreIndex({ score }: Props) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getScoreStyle = (total: number): React.CSSProperties => {
        if (total >= 80) return { color: 'var(--md-color-primary)' };
        if (total >= 60) return { color: 'var(--md-color-tertiary)' };
        return { color: 'var(--md-color-error)' };
    };

    const getGradeClass = (grade: string) => {
        if (['A+', 'A'].includes(grade)) return 'badge-success';
        if (grade === 'B') return 'badge-info';
        if (grade === 'C') return 'badge-warning';
        return 'badge-error';
    };

    const getBarClass = (comp: HealthScoreComponent) => {
        const ratio = comp.score / comp.max;
        if (ratio >= 0.7) return 'progress-success';
        if (ratio >= 0.4) return 'progress-warning';
        return 'progress-error';
    };

    const handleGenerateIA = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(route('ai-analysis.health'));
            setAnalysis(response.data.analysis);
        } catch {
            setError('Falha ao gerar análise de saúde financeira.');
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

    const lowestComponent = Object.values(score.components).sort((a, b) => a.score - b.score)[0];
    const { start } = useTutorial({ key: 'health-score', steps: healthScoreSteps });

    return (
        <AppLayout title="Saúde Financeira">
            <Head title="Saúde Financeira" />

            <div className="w-full flex flex-col gap-6">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--md-color-on-surface)]">
                                Score de Saúde Financeira
                            </h1>
                            <TutorialHelpButton onStart={start} />
                        </div>
                        <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                            Avaliação geral da sua situação financeira
                        </p>
                    </div>

                    <button
                        onClick={handleGenerateIA}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Analisar com IA
                    </button>
                </div>

                {/* Score principal */}
                <div data-tutorial="hs-score" className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-8 flex items-center justify-center gap-8">
                    <div className="text-center">
                        <div className="text-8xl font-black font-display" style={getScoreStyle(score.total)}>
                            {score.total}
                        </div>
                        <div className="mt-1 text-sm text-[var(--md-color-on-surface-variant)]">de 100 pontos</div>
                    </div>
                    <div data-tutorial="hs-grade" className="text-center">
                        <div className={`text-6xl font-black font-display px-6 py-2 rounded-2xl ${getGradeClass(score.grade)}`}>
                            {score.grade}
                        </div>
                        <div className="mt-1 text-sm text-[var(--md-color-on-surface-variant)]">Nota geral</div>
                    </div>
                </div>

                {/* Erro IA */}
                {error && (
                    <div className="alert-error p-4 rounded-2xl border flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Análise IA */}
                {analysis && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        {parseAnalysis(analysis).map((section, i) => (
                            <div key={i} className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 border-l-4 border-l-[#22c55e]">
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-[var(--md-color-on-surface)]">
                                    <Sparkles className="h-4 w-4 text-[#22c55e]" />
                                    {section.title}
                                </h3>
                                <p className="text-[var(--md-color-on-surface-variant)] whitespace-pre-line text-sm leading-relaxed">{section.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Componentes */}
                <div data-tutorial="hs-components" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(score.components).map(([key, comp]) => (
                        <div key={key} className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-bold text-[var(--md-color-on-surface)]">{comp.label}</span>
                                <span className="text-xs font-black text-[var(--md-color-on-surface-variant)]">{comp.score}/{comp.max}</span>
                            </div>
                            
                            <div className="space-y-1.5">
                                <Progress
                                    value={(comp.score / comp.max) * 100}
                                    className={`h-2 ${getBarClass(comp)}`}
                                />
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[var(--md-color-on-surface)] font-semibold">
                                        {comp.unit ? `${comp.value}${comp.unit}` : (comp.value ? 'Sim' : 'Não')}
                                    </span>
                                    <span className="text-[10px] text-[var(--md-color-on-surface-variant)] uppercase font-bold tracking-tighter">Atual</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[border-[var(--color-border)]]/50">
                                <p className="text-[10px] text-[var(--md-color-on-surface-variant)] leading-relaxed italic">
                                    {comp.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dica */}
                {lowestComponent && !analysis && (
                    <div data-tutorial="hs-tip" className="alert-warning p-4 rounded-2xl border">
                        <p className="text-sm font-medium">
                            Área para melhorar: <strong>{lowestComponent.label}</strong>
                        </p>
                        <p className="text-xs mt-1 opacity-80">
                            Score atual: {lowestComponent.score}/{lowestComponent.max} pontos
                        </p>
                    </div>
                )}

                <p className="text-xs text-[var(--md-color-on-surface-variant)] text-right">
                    Calculado em {new Date(score.calculated_at).toLocaleString('pt-BR')}
                </p>
            </div>

        </AppLayout>
    );
}
