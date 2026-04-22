import { Head, router } from '@inertiajs/react';
import { Download, TrendingUp, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { projectionSteps } from '@/tutorials/steps/projection';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectionMonth {
    month_key: string;
    income: number;
    expense: number;
    installments: number;
    credit_card: number;
    net: number;
    balance: number;
}

interface Props {
    projection: ProjectionMonth[];
    totalProjectedIncome: number;
    totalProjectedExpense: number;
    finalBalance: number;
    months: number;
}

import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatMonth = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectionIndex({
    projection, totalProjectedIncome, totalProjectedExpense, finalBalance, months
}: Props) {
    const { start } = useTutorial({ key: 'projection', steps: projectionSteps });

    // Prepara dados p/ o gráfico simplificado (Entradas vs Despesas)
    const chartData = projection.map(m => ({
        ...m,
        name: formatMonth(m.month_key),
        total_out: m.expense + m.installments + m.credit_card, // Soma todas as saídas
    }));

    return (
        <AppLayout title="Projeção Financeira">
            <Head title="Projeção Financeira" />

            <div className="w-full flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Fluxo de Caixa Projetado</h1>
                            <TutorialHelpButton onStart={start} />
                        </div>
                        <p className="text-gray-400 text-sm mt-1">Previsão de saldo para os próximos {months} meses</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={months}
                            onChange={(e) => router.get(route('projection.index'), { months: e.target.value }, { preserveState: true })}
                            className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-[#22c55e]"
                        >
                            <option value="3">Próximos 3 meses</option>
                            <option value="6">Próximos 6 meses</option>
                            <option value="12">Próximos 12 meses</option>
                            <option value="24">Próximos 24 meses</option>
                        </select>
                    </div>
                </div>

                {/* Summary States */}
                <div data-tutorial="proj-summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <ArrowUpCircle className="text-[#22c55e]" size={18} />
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">Entradas Planejadas</p>
                        </div>
                        <p className="text-white font-black text-2xl font-finance">{fmt(totalProjectedIncome)}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <ArrowDownCircle className="text-red-400" size={18} />
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">Saídas Planejadas</p>
                        </div>
                        <p className="text-white font-black text-2xl font-finance">{fmt(totalProjectedExpense)}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm border-l-4 border-l-[#3b82f6]">
                        <div className="flex items-center gap-3 mb-2">
                            <Wallet className="text-[#3b82f6]" size={18} />
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">Saldo em {months} meses</p>
                        </div>
                        <p className={`font-black text-2xl font-finance ${finalBalance >= 0 ? 'text-[#3b82f6]' : 'text-red-400'}`}>
                            {fmt(finalBalance)}
                        </p>
                    </div>
                </div>

                {/* Gráfico principal */}
                <div data-tutorial="proj-chart" className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5">
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(v) => fmt(v as number)}
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="total_out" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                                <Line type="monotone" dataKey="balance" name="Saldo Acumulado" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabela de Detalhamento */}
                <div data-tutorial="proj-table" className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[border-[var(--color-border)]] flex items-center justify-between">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Detalhamento Mensal</h3>
                        <p className="text-[10px] text-gray-500 italic">Considere que o saldo inicial é o seu saldo bancário atual</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5">
                                <tr className="text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                    <th className="text-left px-6 py-4">Mês</th>
                                    <th className="text-right px-6 py-4">Entradas</th>
                                    <th className="text-right px-6 py-4">Despesas (Fixas/Var)</th>
                                    <th className="text-right px-6 py-4">Parcelas (Boleto)</th>
                                    <th className="text-right px-6 py-4">Faturas (Cartão)</th>
                                    <th className="text-right px-6 py-4">Resultado</th>
                                    <th className="text-right px-6 py-4">Saldo Projetado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {projection.map((m) => (
                                    <tr key={m.month_key} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-white font-bold">{formatMonth(m.month_key)}</td>
                                        <td className="px-6 py-4 text-right text-[#22c55e] font-finance">{m.income > 0 ? fmt(m.income) : '-'}</td>
                                        <td className="px-6 py-4 text-right text-gray-300 font-finance">{m.expense > 0 ? fmt(m.expense) : '-'}</td>
                                        <td className="px-6 py-4 text-right text-gray-400 font-finance">{m.installments > 0 ? fmt(m.installments) : '-'}</td>
                                        <td className="px-6 py-4 text-right text-orange-400 font-finance">{m.credit_card > 0 ? fmt(m.credit_card) : '-'}</td>
                                        <td className={`px-6 py-4 text-right font-bold font-finance ${m.net >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
                                            {m.net > 0 ? '+' : ''}{fmt(m.net)}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-black font-finance ${m.balance >= 0 ? 'text-[#3b82f6]' : 'text-red-400'}`}>
                                            {fmt(m.balance)}
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
