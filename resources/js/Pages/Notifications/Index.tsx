import { Head, router } from '@inertiajs/react';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialHelpButton } from '@/Components/TutorialHelpButton';
import { notificationsSteps } from '@/tutorials/steps/notifications';
import { Bell, AlertTriangle, CreditCard, Calendar, TrendingDown, CheckCheck, Check } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import type { Notification } from '@/types/models';

interface Props {
    notifications: Notification[];
}

function getIcon(type: Notification['type']) {
    switch (type) {
        case 'card_near_limit':
            return <CreditCard size={18} />;
        case 'upcoming_due':
            return <Calendar size={18} />;
        case 'budget_exceeded':
            return <TrendingDown size={18} />;
        case 'low_balance':
            return <AlertTriangle size={18} />;
        default:
            return <Bell size={18} />;
    }
}

function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
}

export default function NotificationsIndex({ notifications }: Props) {
    const { start } = useTutorial({ key: 'notifications', steps: notificationsSteps });

    function handleMarkRead(id: number) {
        router.patch(route('notifications.read', { notification: id }));
    }

    function handleMarkAllRead() {
        router.patch(route('notifications.read-all'));
    }

    const hasUnread = notifications.some((n) => n.read_at === null);

    return (
        <AppLayout title="Notificações">
            <Head title="Notificações" />

            <div className="w-full flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--md-color-on-surface)]">
                                Notificações
                            </h1>
                            <TutorialHelpButton onStart={start} />
                        </div>
                        <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                            Alertas e avisos sobre suas finanças
                        </p>
                    </div>
                    {hasUnread && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[border-[var(--color-border)]] text-[var(--md-color-on-surface-variant)] hover:text-[var(--md-color-on-surface)] text-sm transition-colors flex-shrink-0"
                        >
                            <CheckCheck size={14} />
                            Marcar todas como lidas
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div data-tutorial="notif-list" className="bg-[var(--color-surface)] border border-[border-[var(--color-border)]] rounded-2xl p-12 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[bg-[var(--color-surface-2)]] flex items-center justify-center">
                            <Bell size={24} className="text-[var(--md-color-on-surface-variant)]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[var(--md-color-on-surface)] font-medium">Nenhuma notificação</p>
                            <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">
                                Você está em dia com tudo.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div data-tutorial="notif-list" className="flex flex-col gap-2">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="flex items-start gap-4 p-4 rounded-2xl border border-[border-[var(--color-border)]] transition-colors"
                                style={{
                                    backgroundColor: notification.read_at === null
                                        ? 'color-mix(in srgb, var(--md-color-primary) 6%, var(--color-surface))'
                                        : 'var(--color-surface)',
                                }}
                            >
                                <div
                                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--md-color-primary) 15%, transparent)',
                                        color: 'var(--md-color-primary)',
                                    }}
                                >
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold leading-snug text-[var(--md-color-on-surface)]">
                                            {notification.title}
                                        </p>
                                        <span className="text-xs flex-shrink-0 text-[var(--md-color-on-surface-variant)]">
                                            {formatRelativeDate(notification.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-0.5 text-[var(--md-color-on-surface-variant)]">
                                        {notification.message}
                                    </p>
                                </div>

                                {notification.read_at === null && (
                                    <button
                                        data-tutorial="notif-mark-read"
                                        onClick={() => handleMarkRead(notification.id)}
                                        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors text-[var(--md-color-on-surface-variant)] hover:bg-[bg-[var(--color-surface-2)]] hover:text-[var(--md-color-on-surface)]"
                                        title="Marcar como lida"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </AppLayout>
    );
}
