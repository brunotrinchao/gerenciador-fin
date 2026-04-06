import { useRef, useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    FileText,
    Loader2,
    X,
    Check,
    Eye,
    Receipt,
    Layers,
    Tag,
    CreditCard,
    Landmark,
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
// EventContent — pill no calendário
// ─────────────────────────────────────────────

function EventContent({ info }: { info: EventContentArg }) {
    const ev = info.event.extendedProps as CalendarEvent;
    const color = colorByEvent(ev);
    const bg = bgByEvent(ev);
    const paid = isPaidStatus(ev);

    return (
        <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] w-full cursor-pointer"
            style={{
                backgroundColor: bg,
                color,
                opacity: paid ? 0.5 : 1,
                textDecoration: paid ? 'line-through' : 'none',
            }}
            title={`${ev.description} — ${formatCurrency(ev.amount)}`}
        >
            <span className="font-semibold truncate">{formatCurrency(ev.amount)}</span>
        </div>
    );
}

// ─────────────────────────────────────────────
// EventActionModal
// ─────────────────────────────────────────────

function EventActionModal({
    event: ev,
    onClose,
    onMarkPaid,
    onView,
}: {
    event: CalendarEvent;
    onClose: () => void;
    onMarkPaid: (ev: CalendarEvent) => void;
    onView: (ev: CalendarEvent) => void;
}) {
    const color = colorByEvent(ev);
    const bg = bgByEvent(ev);
    const paid = isPaidStatus(ev);

    const TypeIcon = () => {
        if (ev.type === 'invoice')     return <Receipt size={16} style={{ color }} />;
        if (ev.type === 'installment') return <Layers size={16} style={{ color }} />;
        if (ev.subtype === 'income')   return <ArrowUpCircle size={16} style={{ color }} />;
        return <ArrowDownCircle size={16} style={{ color }} />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-overlay" />
            <div
                className="relative z-10 w-full max-w-sm rounded-2xl shadow-xl modal-content"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: bg }}
                        >
                            <TypeIcon />
                        </div>
                        <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            {typeLabel(ev)}
                        </span>
                    </div>
                    <button onClick={onClose} style={{ color: 'var(--color-muted)' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4 space-y-3">
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                            {ev.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {ev.category && (
                                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                    {ev.category}
                                </span>
                            )}
                            {ev.account && (
                                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                    · {ev.account}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-xl font-bold" style={{ color }}>
                            {formatCurrency(ev.amount)}
                        </p>
                        <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                                backgroundColor: paid
                                    ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                color: paid ? '#22c55e' : '#f59e0b',
                            }}
                        >
                            {paid ? 'Pago / Paga' : 'Pendente'}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div
                    className="px-5 py-4 flex gap-3"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                >
                    {!paid && (
                        <button
                            onClick={() => { onMarkPaid(ev); onClose(); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            style={{ backgroundColor: 'var(--color-accent)', color: '#000' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                        >
                            <Check size={15} />
                            Marcar como Pago
                        </button>
                    )}
                    <button
                        onClick={() => { onView(ev); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-foreground)',
                            backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <Eye size={15} />
                        Ver Detalhes
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DetailModal
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
    const bg = bgByEvent(ev);
    const paid = isPaidStatus(ev);

    const TypeIcon = () => {
        if (ev.type === 'invoice')     return <Receipt size={18} style={{ color }} />;
        if (ev.type === 'installment') return <Layers size={18} style={{ color }} />;
        if (ev.subtype === 'income')   return <ArrowUpCircle size={18} style={{ color }} />;
        return <ArrowDownCircle size={18} style={{ color }} />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-overlay" />
            <div
                className="relative z-10 w-full max-w-sm rounded-2xl shadow-xl modal-content"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: bg }}
                        >
                            <TypeIcon />
                        </div>
                        <div>
                            <span
                                className="text-[10px] font-semibold uppercase tracking-wide block"
                                style={{ color: 'var(--color-muted)' }}
                            >
                                {typeLabel(ev)}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ color: 'var(--color-muted)' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 py-5 space-y-4">
                    {/* Description + amount */}
                    <div>
                        <p className="font-bold text-base" style={{ color: 'var(--color-foreground)' }}>
                            {ev.description}
                        </p>
                        <p className="text-2xl font-bold mt-1" style={{ color }}>
                            {formatCurrency(ev.amount)}
                        </p>
                    </div>

                    {/* Status badge */}
                    <div>
                        <span
                            className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                            style={{
                                backgroundColor: paid
                                    ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                color: paid ? '#22c55e' : '#f59e0b',
                            }}
                        >
                            {paid ? 'Pago / Paga' : 'Pendente'}
                        </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-2">
                        {ev.category && (
                            <div className="flex items-center gap-2">
                                <Tag size={13} style={{ color: 'var(--color-muted)' }} />
                                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                    {ev.category}
                                </span>
                            </div>
                        )}
                        {ev.account && ev.type !== 'invoice' && ev.subtype !== 'credit_card' && (
                            <div className="flex items-center gap-2">
                                <Landmark size={13} style={{ color: 'var(--color-muted)' }} />
                                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                    {ev.account}
                                </span>
                            </div>
                        )}
                        {ev.account && (ev.type === 'invoice' || ev.subtype === 'credit_card') && (
                            <div className="flex items-center gap-2">
                                <CreditCard size={13} style={{ color: 'var(--color-muted)' }} />
                                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                    {ev.account}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div
                    className="px-5 py-4 flex gap-3"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                >
                    {!paid && (
                        <button
                            onClick={() => { onMarkPaid(ev); onClose(); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            style={{ backgroundColor: 'var(--color-accent)', color: '#000' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                        >
                            <Check size={15} />
                            Marcar como Pago
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-foreground)',
                            backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────

function Legend() {
    const items = [
        { label: 'Receita',       color: '#22c55e' },
        { label: 'Despesa/Boleto',color: '#ef4444' },
        { label: 'Parcela',       color: '#f97316' },
        { label: 'Fatura',        color: '#a855f7' },
    ];
    return (
        <div className="flex items-center gap-4 flex-wrap">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// BoletoImporter
// ─────────────────────────────────────────────

function BoletoImporter() {
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);
        const xsrfToken = decodeURIComponent(
            document.cookie.split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] ?? ''
        );
        try {
            const res  = await fetch(route('transactions.boleto-parse'), {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': xsrfToken },
                body: formData,
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error ?? 'Erro ao processar boleto.');
            } else {
                router.get(route('transactions.index'), {
                    boleto_description: json.description ?? '',
                    boleto_amount:      json.amount ?? '',
                    boleto_date:        json.date ?? '',
                    boleto_notes:       json.notes ?? '',
                });
            }
        } catch {
            setError('Falha na comunicação. Tente novamente.');
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            <button
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-foreground)',
                    backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                {loading ? 'Extraindo...' : 'Importar Boleto'}
            </button>
            {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CalendarPage({ events, year, month, summary }: Props) {
    const calendarRef = useRef<FullCalendar>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
    const [markingPaid, setMarkingPaid] = useState(false);
    const [typeFilter, setTypeFilter] = useState<'all' | 'invoice' | 'installment' | 'income' | 'expense'>('all');
    const [newTxDate, setNewTxDate] = useState<string | null>(null);

    const fcEvents = Object.entries(events).flatMap(([date, evs]) =>
        evs.map((ev) => ({
            id:              `${ev.type}-${ev.id}`,
            title:           ev.description,
            date,
            backgroundColor: bgByEvent(ev),
            borderColor:     colorByEvent(ev),
            textColor:       colorByEvent(ev),
            extendedProps:   ev,
        }))
    );

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

    const handleView = (ev: CalendarEvent) => {
        setSelectedEvent(null);
        setDetailEvent(ev);
    };

    const handleDatesSet = (arg: { view: { currentStart: Date } }) => {
        const d = arg.view.currentStart;
        const newYear  = d.getFullYear();
        const newMonth = d.getMonth() + 1;
        if (newYear !== year || newMonth !== month) {
            router.get(route('calendar.index'), { year: newYear, month: newMonth }, {
                preserveScroll: true,
                replace: true,
            });
        }
    };

    return (
        <AppLayout title="Calendário">
            <Head title="Calendário" />

            <div className="w-full flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                            Calendário de Pagamentos
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                            Clique em um evento para marcar como pago ou ver detalhes
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Legend />
                        <BoletoImporter />
                    </div>
                </div>

                {/* Type filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { key: 'all',         label: 'Todos',    color: '#6b7280' },
                        { key: 'invoice',     label: 'Faturas',  color: '#a855f7' },
                        { key: 'installment', label: 'Parcelas', color: '#f97316' },
                        { key: 'income',      label: 'Receitas', color: '#22c55e' },
                        { key: 'expense',     label: 'Despesas', color: '#ef4444' },
                    ].map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => setTypeFilter(key as typeof typeFilter)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                typeFilter === key
                                    ? 'border-opacity-50 bg-opacity-10'
                                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-gray-400 hover:text-white'
                            }`}
                            style={typeFilter === key ? {
                                borderColor: color,
                                backgroundColor: color + '20',
                                color,
                            } : {}}
                        >
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                        className="rounded-2xl p-5 flex items-center gap-4"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                             style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                            <ArrowDownCircle size={20} style={{ color: '#ef4444' }} />
                        </div>
                        <div>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>A pagar no mês</p>
                            <p className="text-xl font-bold" style={{ color: '#ef4444' }}>
                                {formatCurrency(summary.totalPending)}
                            </p>
                        </div>
                    </div>

                    <div
                        className="rounded-2xl p-5 flex items-center gap-4"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                             style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                            <ArrowUpCircle size={20} style={{ color: '#22c55e' }} />
                        </div>
                        <div>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>A receber no mês</p>
                            <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                                {formatCurrency(summary.totalIncome)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FullCalendar */}
                <div
                    className="rounded-2xl p-4 fc-theme-custom"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        opacity: markingPaid ? 0.7 : 1,
                        transition: 'opacity 200ms',
                    }}
                >
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        initialDate={`${year}-${String(month).padStart(2, '0')}-01`}
                        locale={ptBrLocale}
                        events={filteredFcEvents}
                        eventContent={(info) => <EventContent info={info} />}
                        eventClick={handleEventClick}
                        datesSet={handleDatesSet}
                        dateClick={(info) => setNewTxDate(info.dateStr)}
                        headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                        height="auto"
                        dayMaxEvents={3}
                        moreLinkText={(n) => `+${n} mais`}
                        fixedWeekCount={false}
                    />
                </div>
            </div>

            {selectedEvent && (
                <EventActionModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onMarkPaid={handleMarkPaid}
                    onView={handleView}
                />
            )}

            {detailEvent && (
                <DetailModal
                    event={detailEvent}
                    onClose={() => setDetailEvent(null)}
                    onMarkPaid={(ev) => {
                        setDetailEvent(null);
                        handleMarkPaid(ev);
                    }}
                />
            )}

            {newTxDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNewTxDate(null)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative z-10 w-full max-w-sm rounded-2xl shadow-xl p-6 flex flex-col gap-4"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold">Nova Transação</h3>
                            <button onClick={() => setNewTxDate(null)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Data selecionada:{' '}
                            <span className="text-white font-medium">
                                {new Date(newTxDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                })}
                            </span>
                        </p>
                        <p className="text-gray-500 text-xs">
                            Acesse a tela de Transações para registrar uma nova transação nesta data.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setNewTxDate(null)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-gray-400 text-sm"
                            >
                                Cancelar
                            </button>
                            <a
                                href={route('transactions.index', { month: newTxDate.slice(0, 7) })}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-semibold text-center transition-colors"
                            >
                                Ir para Transações
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
