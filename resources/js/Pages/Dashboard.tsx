import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { TrendingUp, TrendingDown, Wallet, Calendar, Receipt, Layers, ArrowDownCircle } from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface DashboardStats {
    total_balance: number;
    total_debt: number;
    total_invested: number;
    upcoming_count: number;
}

interface CategoryExpense {
    name: string;
    value: number;
    color: string;
}

interface CashFlowData {
    month: string;
    income: number;
    expense: number;
}

interface UpcomingPayment {
    id: number;
    type: 'invoice' | 'installment' | 'transaction';
    description: string;
    amount: number;
    date: string;
    category: string | null;
    status: string;
}

interface Props {
    stats: DashboardStats;
    upcomingPayments: UpcomingPayment[];
    expensesByCategory: CategoryExpense[];
    cashFlow: CashFlowData[];
}

export default function Dashboard({ stats, upcomingPayments, expensesByCategory, cashFlow }: Props) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="page-transition space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        label="Saldo Total"
                        value={stats.total_balance}
                        icon={Wallet}
                        trend="Corrente em Bancos"
                        positive={stats.total_balance >= 0}
                    />
                    <StatCard
                        label="Dívida Atual de Cartões"
                        value={stats.total_debt}
                        icon={TrendingDown}
                        trend="Faturas Abertas"
                        positive={false}
                    />
                    <StatCard
                        label="Total Investido"
                        value={stats.total_invested}
                        icon={TrendingUp}
                        trend="Renda Fixa/Variável"
                        positive
                    />
                    <StatCard
                        label="Vencimentos (Próx. 7 dias)"
                        value={stats.upcoming_count}
                        icon={Calendar}
                        trend="Contas a Pagar"
                        positive={null}
                        isCount
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Pie: Gastos por Categoria */}
                    <div
                        className="rounded-xl p-5 flex flex-col"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
                            Despesas por Categoria (Mês Atual)
                        </h3>
                        {expensesByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={expensesByCategory}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, percent }) =>
                                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                        }
                                    >
                                        {expensesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Sem dados no período" />
                        )}
                    </div>

                    {/* Bar: Fluxo de Caixa */}
                    <div
                        className="rounded-xl p-5"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
                            Fluxo de Caixa (Últimos 6 Meses)
                        </h3>
                        {cashFlow.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis dataKey="month" stroke="var(--color-muted)" fontSize={11} />
                                    <YAxis stroke="var(--color-muted)" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value))}
                                        contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" name="Receita" fill="#10b981" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Sem dados no período" />
                        )}
                    </div>
                </div>

                {/* Upcoming payments list */}
                <div
                    className="rounded-xl p-5"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
                        Próximos Pagamentos (7 dias)
                    </h3>
                    {upcomingPayments.length > 0 ? (
                        <ul className="space-y-2">
                            {upcomingPayments.map((payment) => (
                                <li
                                    key={payment.id}
                                    className="flex items-center justify-between rounded-lg px-4 py-3"
                                    style={{ backgroundColor: 'var(--color-surface-2)' }}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            {payment.type === 'invoice' && <Receipt size={14} className="text-purple-400" />}
                                            {payment.type === 'installment' && <Layers size={14} className="text-orange-400" />}
                                            {payment.type === 'transaction' && <ArrowDownCircle size={14} className="text-red-400" />}
                                            <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                                                {payment.description}
                                            </span>
                                        </div>
                                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {payment.category ?? 'Sem categoria'} · {formatDate(payment.date)}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
                                        {formatCurrency(payment.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState message="Sem dados no período" />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="h-40 w-full rounded-lg flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-700">
            {message}
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    positive,
    isCount = false,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    trend: string;
    positive: boolean | null;
    isCount?: boolean;
}) {
    return (
        <div
            className="rounded-xl p-5"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                    {label}
                </span>
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}
                >
                    <Icon size={15} style={{ color: 'var(--color-accent)' }} />
                </div>
            </div>
            <p className="text-xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>
                {isCount ? value : formatCurrency(value)}
            </p>
            <p
                className="text-xs"
                style={{
                    color:
                        positive === true
                            ? 'var(--color-accent)'
                            : positive === false
                            ? 'var(--color-danger)'
                            : 'var(--color-muted)',
                }}
            >
                {trend}
            </p>
        </div>
    );
}
