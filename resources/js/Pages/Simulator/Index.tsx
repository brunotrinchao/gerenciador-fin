import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { simulatorSteps } from '@/tutorials/steps/simulator';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type {
    SimulatorPreset,
    SimulatorComparison,
} from '@/types/models';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ScenarioForm {
    name: string;
    description: string;
    initial_amount: number;
    monthly_contribution: number;
    annual_rate: number;
    monthly_cost: number;
}

interface Props {
    presets: SimulatorPreset[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const defaultScenario = (name: string): ScenarioForm => ({
    name,
    description: '',
    initial_amount: 0,
    monthly_contribution: 500,
    annual_rate: 10,
    monthly_cost: 0,
});

const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const inputClass = 'w-full px-3 py-2 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition';
const inputStyle = {
    backgroundColor: 'var(--color-input-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
};

// ─────────────────────────────────────────────
// ScenarioFormPanel
// ─────────────────────────────────────────────

function ScenarioFormPanel({
    scenario,
    onChange,
    label,
    accentColor,
}: {
    scenario: ScenarioForm;
    onChange: (s: ScenarioForm) => void;
    label: string;
    accentColor: string;
}) {
    return (
        <div
            className="bg-[var(--color-surface)] rounded-2xl p-5 border-2"
            style={{ borderColor: accentColor }}
        >
            <h3 className="font-semibold mb-3 text-[var(--md-color-on-surface)]">{label}</h3>
            <div className="flex flex-col gap-3">
                {[
                    { key: 'name', label: 'Nome', type: 'text' },
                    { key: 'initial_amount', label: 'Valor Inicial (R$)', type: 'number' },
                    { key: 'monthly_contribution', label: 'Aporte Mensal (R$)', type: 'number' },
                    { key: 'annual_rate', label: 'Taxa Anual (%)', type: 'number' },
                    { key: 'monthly_cost', label: 'Custo Mensal (R$)', type: 'number' },
                ].map(({ key, label: lbl, type }) => (
                    <div key={key} className="flex flex-col gap-1">
                        <label className="text-sm text-[var(--md-color-on-surface-variant)]">{lbl}</label>
                        <input
                            type={type}
                            value={(scenario as unknown as Record<string, unknown>)[key] as string | number}
                            onChange={(e) =>
                                onChange({
                                    ...scenario,
                                    [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                                })
                            }
                            className={inputClass}
                            style={inputStyle}
                            min={type === 'number' ? '0' : undefined}
                            step={type === 'number' ? '0.01' : undefined}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// SimulatorIndex
// ─────────────────────────────────────────────

export default function SimulatorIndex({ presets }: Props) {
    const [scenarioA, setScenarioA] = useState<ScenarioForm>(defaultScenario('Cenário A'));
    const [scenarioB, setScenarioB] = useState<ScenarioForm>(defaultScenario('Cenário B'));
    const [months, setMonths]       = useState(24);
    const [result, setResult]       = useState<SimulatorComparison | null>(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);

    const applyPreset = (preset: SimulatorPreset) => {
        setScenarioA({
            ...defaultScenario(''),
            ...preset.scenario_a,
            monthly_cost: preset.scenario_a.monthly_cost ?? 0,
            description: preset.scenario_a.description ?? '',
        });
        setScenarioB({
            ...defaultScenario(''),
            ...preset.scenario_b,
            monthly_cost: preset.scenario_b.monthly_cost ?? 0,
            description: preset.scenario_b.description ?? '',
        });
        setResult(null);
    };

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(route('simulator.calculate'), {
                scenario_a: scenarioA,
                scenario_b: scenarioB,
                months,
            });
            setResult(res.data);
        } catch {
            setError('Falha ao calcular. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const chartData = result
        ? result.scenario_a.points.map((p, i) => ({
              month: `M${p.month}`,
              [result.scenario_a.name]: p.balance,
              [result.scenario_b.name]: result.scenario_b.points[i]?.balance ?? 0,
          }))
        : [];

    const winner = result
        ? result.scenario_a.final_value >= result.scenario_b.final_value
            ? result.scenario_a
            : result.scenario_b
        : null;

    const { start } = useTutorial({ key: 'simulator', steps: simulatorSteps });

    return (
        <AppLayout title="Simulador">
            <Head title="Simulador" />

            <div className="w-full flex flex-col gap-6">

                {/* Header */}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--md-color-on-surface)]">
                            Simulador de Decisões Financeiras
                        </h1>
                        <TutorialHelpButton onStart={start} />
                    </div>
                    <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                        Compare cenários e tome decisões financeiras mais inteligentes
                    </p>
                </div>

                {/* Presets */}
                {presets.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {presets.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => applyPreset(p)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[border-[var(--color-border)]] text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)] text-sm transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Formulários */}
                    <div className="flex flex-col gap-4">
                        <div data-tutorial="sim-scenario-a">
                        <ScenarioFormPanel
                            scenario={scenarioA}
                            onChange={setScenarioA}
                            label="Cenário A"
                            accentColor="#3b82f6"
                        />
                        </div>
                        <div data-tutorial="sim-scenario-b">
                        <ScenarioFormPanel
                            scenario={scenarioB}
                            onChange={setScenarioB}
                            label="Cenário B"
                            accentColor="#22c55e"
                        />
                        </div>

                        {/* Período */}
                        <div data-tutorial="sim-period" className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 flex flex-col gap-3">
                            <label className="text-sm text-[var(--md-color-on-surface-variant)]">
                                Período (meses): <span className="font-semibold text-[var(--md-color-on-surface)]">{months}</span>
                            </label>
                            <input
                                type="range"
                                min="6"
                                max="120"
                                step="6"
                                value={months}
                                onChange={(e) => setMonths(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-[var(--md-color-on-surface-variant)]">
                                <span>6 meses</span>
                                <span>10 anos</span>
                            </div>
                        </div>

                        <button
                            data-tutorial="sim-calculate-btn"
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <TrendingUp className="h-4 w-4" />
                            )}
                            {loading ? 'Calculando...' : 'Calcular Simulação'}
                        </button>

                        {error && (
                            <p className="text-sm text-[var(--md-color-error)]">{error}</p>
                        )}
                    </div>

                    {/* Resultados */}
                    <div>
                        {result ? (
                            <div className="flex flex-col gap-4">
                                {/* Gráfico */}
                                <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5">
                                    <h3 className="font-medium mb-3 text-[var(--md-color-on-surface)]">Evolução Patrimonial</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="month"
                                                tick={{ fontSize: 11 }}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis
                                                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey={result.scenario_a.name}
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={result.scenario_b.name}
                                                stroke="#22c55e"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Comparativo */}
                                <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-[border-[var(--color-border)]]">
                                        <h3 className="font-medium text-[var(--md-color-on-surface)]">Comparativo Final</h3>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="border-b border-[border-[var(--color-border)]]">
                                            <tr className="text-[var(--md-color-on-surface-variant)] text-xs uppercase tracking-wide">
                                                <th className="text-left px-5 py-3">Métrica</th>
                                                <th className="text-right px-5 py-3" style={{ color: '#3b82f6' }}>
                                                    {result.scenario_a.name}
                                                </th>
                                                <th className="text-right px-5 py-3" style={{ color: '#22c55e' }}>
                                                    {result.scenario_b.name}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                {
                                                    label: 'Valor Final',
                                                    a: result.scenario_a.final_value,
                                                    b: result.scenario_b.final_value,
                                                },
                                                {
                                                    label: 'Total Investido',
                                                    a: result.scenario_a.total_invested,
                                                    b: result.scenario_b.total_invested,
                                                },
                                                {
                                                    label: 'Retorno Total',
                                                    a: result.scenario_a.total_return,
                                                    b: result.scenario_b.total_return,
                                                },
                                            ].map(({ label, a, b }) => (
                                                <tr key={label} className="border-b border-[border-[var(--color-border)]]/50 hover:bg-[bg-[var(--color-surface-2)]]/40">
                                                    <td className="px-5 py-3 text-[var(--md-color-on-surface-variant)]">{label}</td>
                                                    <td
                                                        className={`text-right px-5 py-3 font-medium font-finance ${a >= b ? '' : 'text-[var(--md-color-on-surface-variant)]'}`}
                                                        style={a >= b ? { color: '#3b82f6' } : undefined}
                                                    >
                                                        {formatCurrency(a)}
                                                    </td>
                                                    <td
                                                        className={`text-right px-5 py-3 font-medium font-finance ${b >= a ? '' : 'text-[var(--md-color-on-surface-variant)]'}`}
                                                        style={b >= a ? { color: '#22c55e' } : undefined}
                                                    >
                                                        {formatCurrency(b)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {winner && (
                                    <div className="bg-[var(--color-surface)] border border-[#22c55e]/40 rounded-2xl p-4 text-sm font-medium" style={{ color: '#22c55e' }}>
                                        <strong>{winner.name}</strong> tem o melhor resultado final
                                        com {formatCurrency(winner.final_value)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-12 flex flex-col items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[bg-[var(--color-surface-2)]] flex items-center justify-center">
                                    <TrendingUp size={24} className="text-[var(--md-color-on-surface-variant)]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[var(--md-color-on-surface)] font-medium">Aguardando simulação</p>
                                    <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                                        Configure os cenários e clique em Calcular
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </AppLayout>
    );
}
