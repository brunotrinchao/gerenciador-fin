import { useRef, useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { EventClickArg } from '@fullcalendar/core';
import { 
    TrendingDown, 
    TrendingUp, 
    CreditCard, 
    Layers, 
    FileText, 
    CheckCircle2, 
    Eye, 
    X, 
    Loader2, 
    Tag, 
    Landmark,
    PlusCircle,
    Info,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CalendarEvent {
    id: number;
    type: 'transaction' | 'installment' | 'invoice';
    subtype: string;
    description: string;
    amount: number;
    status: string;
    category?: string | null;
    account?: string | null;
    payment_code?: string | null;
}

interface Props {
    events: Record<string, CalendarEvent[]>;
    year: number;
    month: number;
    summary: {
        totalPending: number;
        totalIncome: number;
    };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function colorByEvent(ev: CalendarEvent): string {
    if (ev.subtype === 'income')   return '#22c55e';
    if (ev.type === 'invoice')     return '#a855f7';
    if (ev.type === 'installment') return '#f97316';
    return '#ef4444';
}

function bgByEvent(ev: CalendarEvent): string {
    if (ev.subtype === 'income')   return 'rgba(34,197,94,0.15)';
    if (ev.type === 'invoice')     return 'rgba(168,85,247,0.15)';
    if (ev.type === 'installment') return 'rgba(249,115,22,0.15)';
    return 'rgba(239,68,68,0.15)';
}

function typeLabel(ev: CalendarEvent): string {
    if (ev.type === 'invoice')     return 'Fatura';
    if (ev.type === 'installment') return 'Parcela';
    if (ev.subtype === 'income')   return 'Receita';
    return 'Despesa / Boleto';
}

function isPaidStatus(ev: CalendarEvent): boolean {
    return ev.status === 'paid' || ev.status === 'completed';
}

function markAsPaidUrl(ev: CalendarEvent): string {
    if (ev.type === 'invoice')     return route('invoices.pay',      { statement:   ev.id });
    if (ev.type === 'installment') return route('installments.pay',  { installment: ev.id });
    return route('transactions.pay', { transaction: ev.id });
}

// ─────────────────────────────────────────────
// EventContent — customização do item no calendário
// ─────────────────────────────────────────────

function EventContent({ info }: { info: any }) {
    const ev = info.event.extendedProps as CalendarEvent;
    const paid = isPaidStatus(ev);
    const color = colorByEvent(ev);

    const Icon = useMemo(() => {
        if (ev.subtype === 'income')   return TrendingUp;
        if (ev.type === 'invoice')     return CreditCard;
        if (ev.type === 'installment') return Layers;
        return TrendingDown;
    }, [ev.type, ev.subtype]);

    return (
        <div className={`flex items-center gap-1 px-1 py-0.5 w-full overflow-hidden text-[10px] leading-tight transition-opacity ${paid ? 'opacity-60' : ''}`}>
            <Icon size={10} style={{ color, flexShrink: 0 }} />
            <div className={`flex gap-1 truncate ${paid ? 'line-through decoration-1' : ''}`}>
                <span className="font-bold whitespace-nowrap">{formatCurrency(ev.amount)}</span>
                <span className="opacity-80 truncate">{ev.description}</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────

function DetailModal({
    event: ev,
    onClose,
    onMarkPaid,
}: {
    event: CalendarEvent;
    onClose: () => void;
    onMarkPaid: (ev: CalendarEvent) => void;
}) {
    const color = colorByEvent(ev);
    const paid = isPaidStatus(ev);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 " onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-3xl shadow-2xl p-6 overflow-hidden" 
                 style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />

                <div className="flex justify-between items-start mb-6 pt-2">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: 'var(--color-foreground)' }}>{typeLabel(ev)}</span>
                        <h3 className="text-xl font-bold font-display" style={{ color: 'var(--color-foreground)' }}>{ev.description}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--color-surface-2)] rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-8">
                    <p className="text-3xl font-bold font-display" style={{ color }}>{formatCurrency(ev.amount)}</p>
                    <div className="flex items-center gap-2 mt-3">
                         <span className={`text-[10px] px-2.5 py-1 rounded-full font-black tracking-tight ${paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {paid ? 'LIQUIDADO' : 'AGUARDANDO PAGAMENTO'}
                        </span>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    {ev.category && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-2)]">
                                <Tag size={14} />
                            </div>
                            <span>{ev.category}</span>
                        </div>
                    )}
                    {ev.account && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-2)]">
                                <Landmark size={14} />
                            </div>
                            <span>{ev.account}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    {!paid && (
                        <button 
                            onClick={() => { onMarkPaid(ev); onClose(); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-[var(--color-accent)] text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <CheckCircle2 size={16} /> Marcar como Pago
                        </button>
                    )}
                    <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-bold border border-[border-[var(--color-border)]] text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

function Legend() {
    const items = [
        { label: 'Receita', color: '#22c55e' },
        { label: 'Despesa', color: '#ef4444' },
        { label: 'Parcela', color: '#f97316' },
        { label: 'Fatura',  color: '#a855f7' },
    ];
    return (
        <div className="flex items-center gap-4 flex-wrap px-4 py-2 rounded-2xl border"
             style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
            {items.map((it) => (
                <div key={it.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: it.color }} />
                    <span className="text-[10px] font-medium opacity-70" style={{ color: 'var(--color-foreground)' }}>{it.label}</span>
                </div>
            ))}
        </div>
    );
}

function BoletoImporter() {
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        const xsrfToken = decodeURIComponent(document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
        try {
            const res = await fetch(route('transactions.boleto-parse'), {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': xsrfToken },
                body: formData,
            });
            const json = await res.json();
            if (res.ok && !json.error) {
                router.get(route('transactions.index'), {
                    boleto_description: json.description,
                    boleto_amount: json.amount,
                    boleto_date: json.date,
                    boleto_notes: json.notes,
                });
            }
        } catch { /* noop */ } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            <button 
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-all active:scale-95"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                {loading ? 'Processando...' : 'Importar Boleto'}
            </button>
        </>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CalendarPage({ events, year, month, summary }: Props) {
    const calendarRef = useRef<FullCalendar>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [typeFilter, setTypeFilter] = useState<'all' | 'invoice' | 'installment' | 'income' | 'expense'>('all');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [markingPaid, setMarkingPaid] = useState(false);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    const fcEvents = useMemo(() => {
        return Object.entries(events).flatMap(([date, evs]) =>
            evs.map((ev) => ({
                id: `${ev.type}-${ev.id}`,
                title: ev.description,
                date,
                backgroundColor: bgByEvent(ev),
                borderColor: colorByEvent(ev),
                textColor: colorByEvent(ev),
                extendedProps: ev,
            }))
        );
    }, [events]);

    const filteredFcEvents = useMemo(() => {
        return fcEvents.filter((ev) => {
            if (typeFilter === 'all') return true;
            const data = ev.extendedProps as CalendarEvent;
            if (typeFilter === 'invoice')     return data.type === 'invoice';
            if (typeFilter === 'installment') return data.type === 'installment';
            if (typeFilter === 'income')      return data.subtype === 'income';
            if (typeFilter === 'expense')     return data.type === 'transaction' && data.subtype !== 'income';
            return true;
        });
    }, [fcEvents, typeFilter]);

    const handleEventClick = (info: EventClickArg) => {
        setSelectedEvent(info.event.extendedProps as CalendarEvent);
    };

    const handleMarkPaid = (ev: CalendarEvent) => {
        setMarkingPaid(true);
        router.patch(markAsPaidUrl(ev), {}, {
            preserveScroll: true,
            onFinish: () => setMarkingPaid(false),
        });
    };

    const navigateMonth = (direction: number) => {
        let newMonth = Number(month) + direction;
        let newYear = Number(year);
        if (newMonth < 1) { newMonth = 12; newYear -= 1; }
        if (newMonth > 12) { newMonth = 1; newYear += 1; }
        router.get(route('calendar.index'), { year: newYear, month: newMonth }, {
            preserveScroll: true, replace: true
        });
    };

    const handleDatesSet = (arg: { view: { currentStart: Date } }) => {
        const d = arg.view.currentStart;
        const newYear = d.getFullYear();
        const newMonth = d.getMonth() + 1;
        if (newYear !== Number(year) || newMonth !== Number(month)) {
            router.get(route('calendar.index'), { year: newYear, month: newMonth }, {
                preserveScroll: true, replace: true
            });
        }
    };

    return (
        <AppLayout title="Calendário">
            <Head title="Calendário" />

            <div className="page-transition space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight" style={{ color: 'var(--color-foreground)' }}>
                            Planejamento Financeiro
                        </h1>
                        <p className="text-sm opacity-50 mt-1 font-medium" style={{ color: 'var(--color-foreground)' }}>Previsão de fluxo de caixa e vencimentos</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Legend />
                        <BoletoImporter />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    {[
                        { key: 'all', label: 'Tudo', color: '#6b7280' },
                        { key: 'invoice', label: 'Faturas', color: '#a855f7' },
                        { key: 'installment', label: 'Parcelas', color: '#f97316' },
                        { key: 'income', label: 'Receitas', color: '#22c55e' },
                        { key: 'expense', label: 'Despesas', color: '#ef4444' },
                    ].map(f => (
                        <button 
                            key={f.key}
                            onClick={() => setTypeFilter(f.key as any)}
                            className={`px-5 py-2 rounded-2xl text-xs font-black tracking-wide uppercase transition-all flex-shrink-0 ${
                                typeFilter === f.key 
                                    ? 'bg-[var(--color-accent)] text-black border-transparent shadow-lg shadow-[var(--color-accent)]/10' 
                                    : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-gray-500 hover:text-white'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative overflow-hidden group rounded-3xl p-6 transition-all border-[var(--color-border)] hover:border-red-500/20" 
                         style={{ backgroundColor: 'var(--color-surface)' }}>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingDown size={140} color="#ef4444" />
                        </div>
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10 shadow-inner">
                                <TrendingDown size={28} color="#ef4444" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--color-foreground)' }}>Pendente no Mês</p>
                                <p className="text-3xl font-black font-display tracking-tight text-red-500">{formatCurrency(summary.totalPending)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative overflow-hidden group rounded-3xl p-6 transition-all border-[var(--color-border)] hover:border-emerald-500/20" 
                         style={{ backgroundColor: 'var(--color-surface)' }}>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp size={140} color="#22c55e" />
                        </div>
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 shadow-inner">
                                <TrendingUp size={28} color="#22c55e" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--color-foreground)' }}>Previsão de Receita</p>
                                <p className="text-3xl font-black font-display tracking-tight text-emerald-500">{formatCurrency(summary.totalIncome)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Calendar Container */}
                <div className="hidden sm:block p-6 rounded-3xl shadow-xl transition-all border-[var(--color-border)]" 
                     style={{ backgroundColor: 'var(--color-surface)' }}>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        initialDate={`${year}-${String(month).padStart(2, '0')}-01`}
                        locale="pt-br"
                        locales={[ptBrLocale]}
                        events={filteredFcEvents}
                        eventContent={(info) => <EventContent info={info} />}
                        eventClick={handleEventClick}
                        datesSet={handleDatesSet}
                        headerToolbar={{ 
                            left: 'prev', 
                            center: 'title', 
                            right: 'next' 
                        }}
                        height="auto"
                        dayMaxEvents={3}
                        fixedWeekCount={false}
                    />
                </div>

                {/* Mobile View - List grouped by day */}
                <div className="sm:hidden flex flex-col gap-4">
                    {/* Month Navigator */}
                    <div className="flex items-center justify-between p-4 rounded-3xl border border-[var(--color-border)] shadow-md" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-full transition-colors">
                            <ChevronLeft size={20} style={{ color: 'var(--color-foreground)' }} />
                        </button>
                        <span className="font-black text-sm uppercase tracking-widest text-center" style={{ color: 'var(--color-foreground)' }}>
                            {new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-[var(--color-surface-2)] rounded-full transition-colors">
                            <ChevronRight size={20} style={{ color: 'var(--color-foreground)' }} />
                        </button>
                    </div>

                    {/* Day list */}
                    {Object.keys(events).length > 0 ? (
                        Object.keys(events).sort().filter(date => {
                            const dayEvents = events[date].filter((ev) => {
                                if (typeFilter === 'all') return true;
                                if (typeFilter === 'invoice') return ev.type === 'invoice';
                                if (typeFilter === 'installment') return ev.type === 'installment';
                                if (typeFilter === 'income') return ev.subtype === 'income';
                                if (typeFilter === 'expense') return ev.type === 'transaction' && ev.subtype !== 'income';
                                return true;
                            });
                            return dayEvents.length > 0;
                        }).map(date => {
                            const dayEvents = events[date].filter((ev) => {
                                if (typeFilter === 'all') return true;
                                if (typeFilter === 'invoice') return ev.type === 'invoice';
                                if (typeFilter === 'installment') return ev.type === 'installment';
                                if (typeFilter === 'income') return ev.subtype === 'income';
                                if (typeFilter === 'expense') return ev.type === 'transaction' && ev.subtype !== 'income';
                                return true;
                            });

                            return (
                                <div key={date} className="rounded-3xl p-5 space-y-4 border border-[var(--color-border)] shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
                                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                                        <h3 className="font-black text-xs uppercase tracking-tighter" style={{ color: 'var(--color-foreground)' }}>
                                            {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'short' })}
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {dayEvents.map(ev => {
                                            const paid = isPaidStatus(ev);
                                            return (
                                                <div key={ev.id} onClick={() => setSelectedEvent(ev)} 
                                                     className={`flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] active:scale-95 transition-all ${paid ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" 
                                                             style={{ backgroundColor: bgByEvent(ev) }}>
                                                            {ev.subtype === 'income' ? <TrendingUp size={18} color={colorByEvent(ev)} /> : <TrendingDown size={18} color={colorByEvent(ev)} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-bold truncate pr-2 ${paid ? 'line-through decoration-1' : ''}`} style={{ color: 'var(--color-foreground)' }}>{ev.description}</p>
                                                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider">{typeLabel(ev)}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm font-black text-right shrink-0 ${paid ? 'line-through decoration-1' : ''}`} style={{ color: colorByEvent(ev) }}>{formatCurrency(ev.amount)}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 rounded-3xl border border-[var(--color-border)] opacity-40" style={{ backgroundColor: 'var(--color-surface)' }}>
                            <p className="text-xs font-black uppercase tracking-widest">Sem atividades planejadas</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <DetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onMarkPaid={handleMarkPaid} />
            )}
        </AppLayout>
    );
}
