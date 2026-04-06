import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, ArrowLeftRight, CalendarDays, Receipt } from 'lucide-react';

const items = [
    { label: 'Dashboard',  href: '/',             icon: LayoutDashboard },
    { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Calendário', href: '/calendar',     icon: CalendarDays },
    { label: 'Faturas',    href: '/invoices',     icon: Receipt },
];

export default function BottomNav() {
    const { url } = usePage();

    const isActive = (href: string) => {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 lg:hidden z-40 flex items-center justify-around px-2"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                height: '60px',
            }}
        >
            {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[52px]"
                        style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}
                    >
                        <Icon size={20} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
