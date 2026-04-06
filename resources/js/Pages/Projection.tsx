import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface MonthProjection {
    month_key: string;
    income: number;
    expense: number;
    installments: number;
    credit_card: number;
    net: number;
    balance: number;
}

interface Props {
    projection: MonthProjection[];
    currentBalance: number;
    totalProjectedIncome: number;
    totalProjectedExpense: number;
    finalBalance: number;
    months: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function monthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    return `${MONTHS_PT[parseInt(month) - 1]}/${year.slice(2)}`;
}

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtFull = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function exportCSV(projection: MonthProjection[]) {
    const headers = ['Mês', 'Entradas', 'Despesas', 'Parcelas', 'Cartão', 'Resultado', 'Saldo'];
    const rows = projection.map((m) => [
        m.month_key,
        m.income.toFixed(2),
        m.expense.toFixed(2),
        m.installments.toFixed(2),
        m.credit_card.toFixed(2),
        m.net.toFixed(2),
        m.balance.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projecao-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// Summary card
// ─────────────────────────────────────────────

function SummaryCard({
    label,
    value,
    color = 'white',
    sub,
}: {
    label: string;
    value: number;
    color?: string;
    sub?: string;
}) {
    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{fmtFull(value)}</p>
            {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────
// Custom tooltip
// ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    const data: Record<string, number> = {};
    payload.forEach((p: any) => { data[p.dataKey] = p.value; });

    return (
        <div className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-xl p-3 text-xs min-w-[180px]">
            <p className="text-gray-300 font-semibold mb-2">{label}</p>
            {data.income !== undefined && (
                <div className="flex justify-between gap-4 text-[#22c55e]">
                    <span>Entradas</span><span>{fmt(data.income)}</span>
                </div>
            )}
            {data.expense !== undefined && (
                <div className="flex justify-between gap-4 text-red-400">
                    <span>Despesas</span><span>{fmt(data.expense)}</span>
                </div>
            )}
            {data.installments !== undefined && data.installments > 0 && (
                <div className="flex justify-between gap-4 text-orange-400">
                    <span>Parcelas</span><span>{fmt(data.installments)}</span>
                </div>
            )}
            {data.credit_card !== undefined && data.credit_card > 0 && (
                <div className="flex justify-between gap-4 text-yellow-400">
                    <span>Cartão</span><span>{fmt(data.credit_card)}</span>
                </div>
            )}
            <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                <div className="flex justify-between gap-4 text-blue-400 font-semibold">
                    <span>Saldo</span><span>{fmt(data.balance)}</span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function Projection({
    projection,
    currentBalance,
    totalProjectedIncome,
    totalProjectedExpense,
    finalBalance,
    months,
}: Props) {
    const chartData = projection.map((m) => ({
        ...m,
        month: monthLabel(m.month_key),
    }));

    const balanceDiff = finalBalance - currentBalance;
    const balanceTrend = balanceDiff >= 0 ? 'text-[#22c55e]' : 'text-red-400';

    return (
        <AppLayout title="Projeção Financeira">
            <Head title="Projeção Financeira" />

            <div className="w-full flex flex-col gap-6">
                {/* Header com controles */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Projeção Financeira</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Fluxo de caixa projetado para os próximos {months} meses
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Seletor de meses */}
                        <div className="flex items-center gap-2">
                            <label className="text-gray-400 text-sm">Período:</label>
                            <select
                                value={months}
                                onChange={(e) => router.get(route('projection.index'), { months: e.target.value }, { preserveState: false })}
                                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                            >
                                <option value="3">3 meses</option>
                                <option value="6">6 meses</option>
                                <option value="12">12 meses</option>
                                <option value="18">18 meses</option>
                                <option value="24">24 meses</option>
                            </select>
                        </div>
                        {/* Export CSV */}
                        <button
                            onClick={() => exportCSV(projection)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                        >
                            <Download size={15} />
                            CSV
                        </button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Saldo Atual"
                        value={currentBalance}
                        color="text-white"
                        sub="contas ativas"
                    />
                    <SummaryCard
                        label="Entradas Projetadas"
                        value={totalProjectedIncome}
                        color="text-[#22c55e]"
                        sub="próximos 12 meses"
                    />
                    <SummaryCard
                        label="Saídas Projetadas"
                        value={totalProjectedExpense}
                        color="text-red-400"
                        sub="próximos 12 meses"
                    />
                    <SummaryCard
                        label="Saldo em 12 meses"
                        value={finalBalance}
                        color={balanceTrend}
                        sub={`${balanceDiff >= 0 ? '+' : ''}${fmtFull(balanceDiff)} vs hoje`}
                    />
                </div>

                {/* Chart */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-gray-300 mb-4">Fluxo de Caixa Mensal</h2>
                    <ResponsiveContainer width="100%" height={320}>
                        <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis
                                dataKey="month"
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => fmt(v)}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={80}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend
                                formatter={(value) => {
                                    const map: Record<string, string> = {
                                        income: 'Entradas',
                                        expense: 'Despesas',
                                        installments: 'Parcelas',
                                        credit_card: 'Cartão',
                                        balance: 'Saldo',
                                    };
                                    return <span style={{ color: '#9ca3af', fontSize: 12 }}>{map[value] ?? value}</span>;
                                }}
                            />

                            {/* Barras de saída (empilhadas) */}
                            <Bar dataKey="expense"      stackId="out" fill="#ef4444" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="installments" stackId="out" fill="#f97316" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="credit_card"  stackId="out" fill="#eab308" radius={[4, 4, 0, 0]} />

                            {/* Barra de entrada */}
                            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />

                            {/* Linha de saldo acumulado */}
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="#60a5fa"
                                strokeWidth={2}
                                dot={{ fill: '#60a5fa', r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly breakdown table */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[var(--color-border)]">
                        <h2 className="text-sm font-semibold text-gray-300">Detalhamento Mensal</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    {['Mês', 'Entradas', 'Despesas', 'Parcelas', 'Cartão', 'Resultado', 'Saldo'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {projection.map((row) => (
                                    <tr key={row.month_key} className="hover:bg-[var(--color-input-bg)] transition-colors">
                                        <td className="px-5 py-3 text-sm font-medium text-white whitespace-nowrap">
                                            {monthLabel(row.month_key)}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-[#22c55e] font-mono whitespace-nowrap">
                                            {fmtFull(row.income)}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-red-400 font-mono whitespace-nowrap">
                                            {row.expense > 0 ? fmtFull(row.expense) : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-orange-400 font-mono whitespace-nowrap">
                                            {row.installments > 0 ? fmtFull(row.installments) : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-yellow-400 font-mono whitespace-nowrap">
                                            {row.credit_card > 0 ? fmtFull(row.credit_card) : '—'}
                                        </td>
                                        <td className={`px-5 py-3 text-sm font-mono font-semibold whitespace-nowrap ${row.net >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
                                            {row.net >= 0 ? '+' : ''}{fmtFull(row.net)}
                                        </td>
                                        <td className={`px-5 py-3 text-sm font-mono font-bold whitespace-nowrap ${row.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                            {fmtFull(row.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
