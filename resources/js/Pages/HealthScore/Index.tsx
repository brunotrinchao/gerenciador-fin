import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { healthScoreSteps } from '@/tutorials/steps/health-score';
import { Progress } from '@/Components/ui/progress';
import type { HealthScore, HealthScoreComponent } from '@/types/models';

interface Props {
    score: HealthScore;
}

export default function HealthScoreIndex({ score }: Props) {
    // Cores via CSS variables M3 — funciona em dark e light mode
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

    const lowestComponent = Object.values(score.components).sort((a, b) => a.score - b.score)[0];

    const { start } = useTutorial({ key: 'health-score', steps: healthScoreSteps });

    return (
        <AppLayout title="Saúde Financeira">
            <Head title="Saúde Financeira" />

            <div className="w-full flex flex-col gap-6">

                {/* Header */}
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

                {/* Score principal */}
                <div data-tutorial="hs-score" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 flex items-center justify-center gap-8">
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

                {/* Componentes */}
                <div data-tutorial="hs-components" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(score.components).map(([key, comp]) => (
                        <div key={key} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-[var(--md-color-on-surface)]">{comp.label}</span>
                                <span className="text-sm font-bold text-[var(--md-color-on-surface)]">{comp.score}/{comp.max}</span>
                            </div>
                            <Progress
                                value={(comp.score / comp.max) * 100}
                                className={`h-2 mb-2 ${getBarClass(comp)}`}
                            />
                            <div className="text-xs text-[var(--md-color-on-surface-variant)]">
                                {comp.unit
                                    ? `${comp.value} ${comp.unit}`
                                    : (comp.value ? 'Sim' : 'Não')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dica */}
                {lowestComponent && (
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
