import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { ScheduledTransactionLog, Transaction } from '@/types/models';

interface PaginatedLogs {
    data: ScheduledTransactionLog[];
    links: { url: string | null; label: string; active: boolean }[];
    meta?: Record<string, unknown>;
}

interface Props {
    logs: PaginatedLogs;
    transactions: Transaction[];
}

export default function ScheduledLogsIndex({ logs, transactions }: Props) {
    const txMap: Record<number, Transaction> = {};
    transactions.forEach(t => { txMap[t.id] = t; });

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <AppLayout title="Processamentos Automáticos">
            <Head title="Processamentos Automáticos" />
            <div className="space-y-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold font-display">Processamentos Automáticos</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Histórico de execuções do job de transações agendadas
                    </p>
                </div>

                {logs.data.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma execução registrada ainda.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {logs.data.map((log) => (
                        <Card key={log.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarCheck className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-sm">
                                            {format(new Date(log.processed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 text-sm">
                                        <span className="text-green-600 font-medium">
                                            ✓ {log.transactions_count} processada(s)
                                        </span>
                                        {log.failed_count > 0 && (
                                            <span className="text-red-500 font-medium">
                                                ✗ {log.failed_count} falha(s)
                                            </span>
                                        )}
                                        {log.execution_ms != null && (
                                            <span className="text-muted-foreground">{log.execution_ms}ms</span>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {(log.processed_transaction_ids?.length ?? 0) > 0 && (
                                <CardContent>
                                    <div className="divide-y">
                                        {(log.processed_transaction_ids ?? []).map((id) => {
                                            const tx = txMap[id];
                                            if (!tx) return null;
                                            return (
                                                <div key={id} className="py-2 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span>{tx.description}</span>
                                                        {tx.category && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {(tx.category as any).name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-muted-foreground">
                                                        {tx.bank_account && (
                                                            <span className="text-xs">{(tx.bank_account as any).name}</span>
                                                        )}
                                                        <span className="font-medium font-finance text-foreground">
                                                            {formatCurrency(Number(tx.amount))}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(log.failed_transaction_ids ?? []).map((id) => {
                                            const tx = txMap[id];
                                            if (!tx) return null;
                                            return (
                                                <div key={id} className="py-2 flex items-center justify-between text-sm bg-red-50/50 -mx-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-red-600 font-medium">⚠️ {tx.description}</span>
                                                        <Badge variant="destructive" className="text-[10px] h-4">Falha</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-red-400">
                                                        <span className="font-medium font-finance">
                                                            {formatCurrency(Number(tx.amount))}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
