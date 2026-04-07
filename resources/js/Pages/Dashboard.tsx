import React from 'react';
import { Head, Deferred } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { TrendingUp, TrendingDown, Wallet, Calendar, Receipt, Layers, ArrowDownCircle } from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { SummaryCardSkeleton } from '@/Components/Dashboard/SummaryCardSkeleton';
import { ChartSkeleton } from '@/Components/Dashboard/ChartSkeleton';
import { Skeleton } from '@/Components/ui/skeleton';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from "@/Components/ui/sheet";

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

interface BankAccount {
    id: number;
    name: string;
    bank_name: string;
    current_balance: number;
}

interface CreditCard {
    id: number;
    name: string;
}

interface TransactionWithRelations extends UpcomingPayment {
    credit_card?: CreditCard;
}

interface Props {
    stats: DashboardStats;
    upcomingPayments: UpcomingPayment[];
    longUpcomingPayments: UpcomingPayment[];
    expensesByCategory: CategoryExpense[];
    cashFlow: CashFlowData[];
    bankAccounts: BankAccount[];
    detailedDebt: Record<string, TransactionWithRelations[]>;
}

export default function Dashboard({
    stats,
    upcomingPayments,
    longUpcomingPayments,
    expensesByCategory,
    cashFlow,
    bankAccounts,
    detailedDebt
}: Props) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="page-transition space-y-6">
                {/* Stat cards */}
                <Deferred data="stats" fallback={
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <SummaryCardSkeleton />
                        <SummaryCardSkeleton />
                        <SummaryCardSkeleton />
                        <SummaryCardSkeleton />
                    </div>
                }>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* Saldo Total */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <StatCard
                                    label="Saldo Total"
                                    value={stats?.total_balance}
                                    icon={Wallet}
                                    trend="Corrente em Bancos"
                                    positive={stats?.total_balance >= 0}
                                    clickable
                                />
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader className="mb-6">
                                    <SheetTitle>Saldos por Conta</SheetTitle>
                                    <SheetDescription>
                                        Detalhamento do saldo disponível em cada conta bancária ativa.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-3">
                                    {bankAccounts?.map((account) => (
                                        <div
                                            key={account.id}
                                            className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                                                    {account.name}
                                                </span>
                                                <span className="text-xs text-[var(--color-muted)]">
                                                    {account.bank_name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-[var(--color-foreground)]">
                                                {formatCurrency(account.current_balance)}
                                            </span>
                                        </div>
                                    ))}
                                    {(!bankAccounts || bankAccounts.length === 0) && (
                                        <p className="text-center text-xs text-[var(--color-muted)] py-8">
                                            Nenhuma conta encontrada.
                                        </p>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Dívida Atual */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <StatCard
                                    label="Dívida Atual de Cartões"
                                    value={stats?.total_debt}
                                    icon={TrendingDown}
                                    trend="Faturas Abertas"
                                    positive={false}
                                    clickable
                                />
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-md">
                                <SheetHeader className="mb-6">
                                    <SheetTitle>Dívida por Cartão</SheetTitle>
                                    <SheetDescription>
                                        Transações de crédito pendentes agrupadas por cartão.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                                    {Object.entries(detailedDebt || {}).map(([cardId, transactions]) => {
                                        const cardName = transactions[0]?.credit_card?.name || 'Cartão';
                                        const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

                                        return (
                                            <div key={cardId} className="space-y-3">
                                                <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
                                                    <h4 className="text-sm font-bold text-[var(--color-foreground)]">{cardName}</h4>
                                                    <span className="text-sm font-bold text-[var(--color-danger)]">{formatCurrency(total)}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {transactions.map((t) => (
                                                        <div key={t.id} className="flex justify-between items-center text-xs">
                                                            <div className="flex flex-col">
                                                                <span className="text-[var(--color-foreground)]">{t.description}</span>
                                                                <span className="text-[var(--color-muted)]">{formatDate(t.date)}</span>
                                                            </div>
                                                            <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(Number(t.amount))}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!detailedDebt || Object.keys(detailedDebt).length === 0) && (
                                        <p className="text-center text-xs text-[var(--color-muted)] py-8">
                                            Nenhuma dívida pendente encontrada.
                                        </p>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>

                        <StatCard
                            label="Total Investido"
                            value={stats?.total_invested}
                            icon={TrendingUp}
                            trend="Renda Fixa/Variável"
                            positive
                        />

                        {/* Vencimentos */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <StatCard
                                    label="Vencimentos (Próx. 7 dias)"
                                    value={stats?.upcoming_count}
                                    icon={Calendar}
                                    trend="Contas a Pagar"
                                    positive={null}
                                    isCount
                                    clickable
                                />
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-md">
                                <SheetHeader className="mb-6">
                                    <SheetTitle>Próximos Vencimentos</SheetTitle>
                                    <SheetDescription>
                                        Lista estendida de pagamentos previstos para os próximos dias.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                                    <Deferred data="longUpcomingPayments" fallback={
                                        <div className="space-y-2">
                                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                                        </div>
                                    }>
                                        {longUpcomingPayments?.length > 0 ? (
                                            <ul className="space-y-2">
                                                {longUpcomingPayments.map((payment) => (
                                                    <li
                                                        key={payment.id}
                                                        className="flex items-center justify-between rounded-lg px-4 py-3 bg-[var(--color-surface-2)]"
                                                    >
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                {payment.type === 'invoice' && <Receipt size={14} className="text-purple-400" />}
                                                                {payment.type === 'installment' && <Layers size={14} className="text-orange-400" />}
                                                                {payment.type === 'transaction' && <ArrowDownCircle size={14} className="text-red-400" />}
                                                                <span className="text-sm font-medium text-[var(--color-foreground)]">
                                                                    {payment.description}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-[var(--color-muted)]">
                                                                {payment.category ?? 'Sem categoria'} · {formatDate(payment.date)}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-semibold text-[var(--color-danger)]">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-center text-xs text-[var(--color-muted)] py-8">
                                                Nenhum vencimento próximo.
                                            </p>
                                        )}
                                    </Deferred>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </Deferred>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Pie: Gastos por Categoria */}
                    <Deferred data="expensesByCategory" fallback={<ChartSkeleton />}>
                        <div
                            className="rounded-xl p-5 flex flex-col h-full"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
                                Despesas por Categoria (Mês Atual)
                            </h3>
                            {expensesByCategory?.length > 0 ? (
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
                    </Deferred>

                    {/* Bar: Fluxo de Caixa */}
                    <Deferred data="cashFlow" fallback={<ChartSkeleton />}>
                        <div
                            className="rounded-xl p-5 h-full"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
                                Fluxo de Caixa (Últimos 6 Meses)
                            </h3>
                            {cashFlow?.length > 0 ? (
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
                    </Deferred>
                </div>

                {/* Upcoming payments list */}
                <Deferred data="upcomingPayments" fallback={
                    <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <Skeleton className="h-5 w-48" />
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-14 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                }>
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
                        {upcomingPayments?.length > 0 ? (
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
                </Deferred>
            </div>
        </AppLayout>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    if (!dateStr) return '';
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

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    trend: string;
    positive: boolean | null;
    isCount?: boolean;
    clickable?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(({
    label,
    value,
    icon: Icon,
    trend,
    positive,
    isCount = false,
    clickable = false,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={`rounded-xl p-5 transition-all duration-200 ${clickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:border-[var(--color-accent)]' : ''}`}
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
            }}
            {...props}
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
});
StatCard.displayName = "StatCard";
