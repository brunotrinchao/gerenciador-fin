import { Head, router } from '@inertiajs/react';
import { Download, TrendingUp, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { projectionSteps } from '@/tutorials/steps/projection';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectionMonth {
    month_key: string;
    income: number;
    expense: number;
    installments: number;
    credit_card: number;
    resultado: number;
    entrada_total: number;
    balance: number;
}

interface Props {
    projection: ProjectionMonth[];
    totalProjectedIncome: number;
    totalProjectedExpense: number;
    finalBalance: number;
    months: number;
}

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

    // Prepara dados p/ o gráfico
    const chartData = projection.map(m => ({
        ...m,
        name: formatMonth(m.month_key),
    }));

    return (
        <AppLayout title="Projeção Financeira">
            <Head title="Projeção Financeira" />

            <div className="w-full flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black font-display text-white">Projeção Detalhada</h1>
                            <TutorialHelpButton onStart={start} />
                        </div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">
                            Fluxo Acumulado: Saldo Anterior + Entrada - Resultado
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={months}
                            onChange={(e) => router.get(route('projection.index'), { months: e.target.value }, { preserveState: true })}
                            className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] text-white text-[10px] font-black rounded-xl px-3 py-2 outline-none focus:border-[#22c55e] uppercase tracking-widest"
                        >
                            <option value="3">3 Meses</option>
                            <option value="6">6 Meses</option>
                            <option value="12">12 Meses</option>
                            <option value="24">24 Meses</option>
                        </select>
                    </div>
                </div>

                {/* Summary States */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Entradas</p>
                        <p className="text-[#22c55e] font-black text-2xl font-finance">{fmt(totalProjectedIncome)}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Saídas</p>
                        <p className="text-red-400 font-black text-2xl font-finance">{fmt(totalProjectedExpense)}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm border-l-4 border-l-[#3b82f6]">
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Saldo Final</p>
                        <p className={`font-black text-2xl font-finance ${finalBalance >= 0 ? 'text-[#3b82f6]' : 'text-red-400'}`}>
                            {fmt(finalBalance)}
                        </p>
                    </div>
                </div>

                {/* Gráfico */}
                <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 shadow-sm">
                    <div className="h-[320px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(v) => fmt(v as number)}
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'black', textTransform: 'uppercase' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Bar dataKey="entrada_total" name="Entrada (Acum)" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={25} />
                                <Bar dataKey="resultado" name="Resultado (Saída)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                                <Line type="monotone" dataKey="balance" name="Saldo Projetado" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabela de Detalhamento */}
                <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[border-[var(--color-border)]] bg-white/5">
                        <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Detalhamento de Fluxo Mensal</h3>
                    </div>
                    <div className="overflow-x-auto text-[11px]">
                        <table className="w-full">
                            <thead>
                                <tr className="text-gray-500 font-black uppercase tracking-widest border-b border-[border-[var(--color-border)]]/50">
                                    <th className="text-left px-6 py-4">Mês</th>
                                    <th className="text-right px-6 py-4">Entrada (Acum)</th>
                                    <th className="text-right px-6 py-4">Despesas</th>
                                    <th className="text-right px-6 py-4">Parcelas</th>
                                    <th className="text-right px-6 py-4">Faturas</th>
                                    <th className="text-right px-6 py-4 text-red-400">Resultado</th>
                                    <th className="text-right px-6 py-4 bg-white/5">Saldo Projetado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-finance">
                                {projection.map((m) => (
                                    <tr key={m.month_key} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-white font-black uppercase">{formatMonth(m.month_key)}</td>
                                        <td className="px-6 py-4 text-right text-[#22c55e] font-bold">{fmt(m.entrada_total)}</td>
                                        <td className="px-6 py-4 text-right text-gray-300">{fmt(m.expense)}</td>
                                        <td className="px-6 py-4 text-right text-gray-400">{fmt(m.installments)}</td>
                                        <td className="px-6 py-4 text-right text-orange-400">{fmt(m.credit_card)}</td>
                                        <td className="px-6 py-4 text-right text-red-400 font-bold">{fmt(m.resultado)}</td>
                                        <td className={`px-6 py-4 text-right font-black bg-white/5 ${m.balance >= 0 ? 'text-[#3b82f6]' : 'text-red-400'}`}>
                                            {fmt(m.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 bg-white/5 border-t border-[border-[var(--color-border)]]/50">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider text-center">
                            Entrada (Acumulada) = Saldo Anterior + Receitas do Mês | Resultado = Despesas + Parcelas + Faturas | Saldo = Entrada - Resultado
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
