import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { reportsSteps } from '@/tutorials/steps/reports';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, PieChart as PieIcon, Layers, Wallet, CreditCard } from 'lucide-react';
import { Progress } from '@/Components/ui/progress';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CashFlowMonth {
    month: string;
    month_key: string;
    income: number;
    expense: number;
    net: number;
}

interface CategoryExpense {
    name: string;
    value: number;
    color: string;
}

interface NetWorth {
    bank_balance: number;
    invested: number;
    debt: number;
    total: number;
}

interface InvoiceByCard {
    card_name: string;
    bank_name: string;
    color: string;
    limit: number;
    available: number;
    used: number;
    pending: number;
}

interface Props {
    cashFlow: CashFlowMonth[];
    expensesByCategory: CategoryExpense[];
    fixedExpenses: number;
    variableExpenses: number;
    invoicesByCard: InvoiceByCard[];
    netWorth: NetWorth;
    currentMonth: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function exportCSV(data: Record<string, unknown>[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(r => headers.map(h => String(r[h] ?? '')).join(';'));
    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
    { id: 'cashflow',   label: 'Fluxo de Caixa',        icon: TrendingUp },
    { id: 'categories', label: 'Despesas por Categoria', icon: PieIcon },
    { id: 'fixed',      label: 'Fixas vs Variáveis',     icon: Layers },
    { id: 'cards',      label: 'Faturas por Cartão',    icon: CreditCard },
    { id: 'networth',   label: 'Patrimônio Líquido',     icon: Wallet },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsIndex({
    cashFlow, expensesByCategory, fixedExpenses, variableExpenses, invoicesByCard, netWorth,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('cashflow');
    const { start } = useTutorial({ key: 'reports', steps: reportsSteps });

    return (
        <AppLayout title="Relatórios">
            <Head title="Relatórios" />

            <div className="w-full flex flex-col gap-6">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Relatórios</h1>
                        <TutorialHelpButton onStart={start} />
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Análises e exportações do seu financeiro</p>
                </div>

                {/* Tabs */}
                <div data-tutorial="rep-tabs" className="flex items-center gap-2 flex-wrap border-b border-[border-[var(--color-border)]] pb-0">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                activeTab === id
                                    ? 'border-[#22c55e] text-[#22c55e]'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Fluxo de Caixa ── */}
                {activeTab === 'cashflow' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-end">
                            <button
                                data-tutorial="rep-export"
                                onClick={() => exportCSV(cashFlow as unknown as Record<string, unknown>[], 'fluxo-de-caixa.csv')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[border-[var(--color-border)]] text-gray-300 hover:text-white text-sm transition-colors"
                            >
                                <Download size={14} /> Exportar CSV
                            </button>
                        </div>
                        <div data-tutorial="rep-charts" className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5">
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={cashFlow}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v) => fmt(v as number)} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }} />
                                    <Legend />
                                    <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Tabela */}
                        <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="border-b border-[border-[var(--color-border)]]">
                                    <tr className="text-gray-400 text-xs uppercase tracking-wide">
                                        <th className="text-left px-5 py-3">Mês</th>
                                        <th className="text-right px-5 py-3">Entradas</th>
                                        <th className="text-right px-5 py-3">Despesas</th>
                                        <th className="text-right px-5 py-3">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashFlow.map((m) => (
                                        <tr key={m.month_key} className="border-b border-[border-[var(--color-border)]]/50 hover:bg-[bg-[var(--color-surface-2)]]/40">
                                            <td className="px-5 py-3 text-white font-medium">{m.month}</td>
                                            <td className="px-5 py-3 text-right text-[#22c55e]">{fmt(m.income)}</td>
                                            <td className="px-5 py-3 text-right text-red-400">{fmt(m.expense)}</td>
                                            <td className={`px-5 py-3 text-right font-semibold ${m.net >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>{fmt(m.net)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Despesas por Categoria ── */}
                {activeTab === 'categories' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-end">
                            <button
                                onClick={() => exportCSV(expensesByCategory as unknown as Record<string, unknown>[], 'despesas-por-categoria.csv')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[border-[var(--color-border)]] text-gray-300 hover:text-white text-sm transition-colors"
                            >
                                <Download size={14} /> Exportar CSV
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5">
                                <p className="text-gray-400 text-sm mb-4">Distribuição do mês atual</p>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={expensesByCategory}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {expensesByCategory.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => fmt(v as number)} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-[border-[var(--color-border)]]">
                                        <tr className="text-gray-400 text-xs uppercase tracking-wide">
                                            <th className="text-left px-5 py-3">Categoria</th>
                                            <th className="text-right px-5 py-3">Valor</th>
                                            <th className="text-right px-5 py-3">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expensesByCategory.map((c, i) => {
                                            const total = expensesByCategory.reduce((s, x) => s + x.value, 0);
                                            return (
                                                <tr key={i} className="border-b border-[border-[var(--color-border)]]/50 hover:bg-[bg-[var(--color-surface-2)]]/40">
                                                    <td className="px-5 py-3 flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                                                        <span className="text-white">{c.name}</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-red-400">{fmt(c.value)}</td>
                                                    <td className="px-5 py-3 text-right text-gray-400">{total > 0 ? ((c.value / total) * 100).toFixed(1) : 0}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Fixas vs Variáveis ── */}
                {activeTab === 'fixed' && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-6">
                                <p className="text-gray-400 text-sm mb-1">Despesas Fixas</p>
                                <p className="text-white font-bold text-2xl">{fmt(fixedExpenses)}</p>
                                <p className="text-gray-500 text-xs mt-1">Transações recorrentes pagas no mês</p>
                            </div>
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-6">
                                <p className="text-gray-400 text-sm mb-1">Despesas Variáveis</p>
                                <p className="text-orange-400 font-bold text-2xl">{fmt(variableExpenses)}</p>
                                <p className="text-gray-500 text-xs mt-1">Transações não recorrentes do mês</p>
                            </div>
                        </div>
                        {(fixedExpenses + variableExpenses) > 0 && (
                            <div className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5">
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Fixas', value: fixedExpenses, color: '#3b82f6' },
                                                { name: 'Variáveis', value: variableExpenses, color: '#f97316' },
                                            ]}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        >
                                            <Cell fill="#3b82f6" />
                                            <Cell fill="#f97316" />
                                        </Pie>
                                        <Tooltip formatter={(v) => fmt(v as number)} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Faturas por Cartão ── */}
                {activeTab === 'cards' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-end">
                            <button
                                onClick={() => exportCSV(invoicesByCard as unknown as Record<string, unknown>[], 'faturas-por-cartao.csv')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[border-[var(--color-border)]] text-gray-300 hover:text-white text-sm transition-colors"
                            >
                                <Download size={14} /> Exportar CSV
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {invoicesByCard.map((card, i) => (
                                <div key={i} className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-5 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: card.color }}>
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold leading-tight">{card.card_name}</p>
                                                <p className="text-gray-500 text-xs">{card.bank_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-yellow-400 font-bold text-lg">{fmt(card.pending)}</p>
                                            <p className="text-gray-500 text-[10px] uppercase font-medium">Fatura Pendente</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Limite Utilizado</span>
                                            <span className="text-white font-medium">{((card.used / card.limit) * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={(card.used / card.limit) * 100} className="h-1.5 bg-gray-800" indicatorClassName="bg-yellow-500" />
                                        <div className="flex justify-between text-[10px] text-gray-500 font-mono pt-1">
                                            <span>USADO: {fmt(card.used)}</span>
                                            <span>LIMITE: {fmt(card.limit)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-[border-[var(--color-border)]]/50 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Disponível</span>
                                        <span className="text-[#22c55e] font-semibold text-sm">{fmt(card.available)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Patrimônio Líquido ── */}
                {activeTab === 'networth' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Saldo em Contas',    value: netWorth.bank_balance, color: 'text-white' },
                            { label: 'Investimentos',      value: netWorth.invested,     color: 'text-blue-400' },
                            { label: 'Dívidas (Cartão)',   value: netWorth.debt,         color: 'text-red-400' },
                            { label: 'Patrimônio Líquido', value: netWorth.total,        color: netWorth.total >= 0 ? 'text-[#22c55e]' : 'text-red-400' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-6">
                                <p className="text-gray-400 text-sm mb-1">{label}</p>
                                <p className={`font-bold text-2xl ${color}`}>{fmt(value)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </AppLayout>
    );
}
