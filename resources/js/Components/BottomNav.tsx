import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, ArrowLeftRight, Receipt, TrendingUp, CreditCard } from 'lucide-react';

const items = [
    { label: 'Dashboard',    href: '/',             icon: LayoutDashboard },
    { label: 'Transações',   href: '/transactions', icon: ArrowLeftRight },
    { label: 'Faturas',      href: '/invoices',     icon: Receipt },
    { label: 'Cartões',      href: '/credit-cards', icon: CreditCard },
    { label: 'Investimentos', href: '/investments',  icon: TrendingUp },
];

export default function BottomNav() {
    const { url } = usePage();

    const isActive = (href: string) => {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 lg:hidden z-40 flex items-center justify-around px-1"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                height: '64px',
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[44px] px-2 py-1 rounded-xl transition-colors relative"
                        style={{
                            color: active ? 'var(--md-color-on-secondary-container)' : 'var(--color-muted)',
                        }}
                    >
                        {active && (
                            <span
                                className="absolute inset-x-1 top-1 bottom-1 rounded-2xl"
                                style={{ backgroundColor: 'var(--md-color-secondary-container)' }}
                            />
                        )}
                        <Icon size={20} className="relative z-10" />
                        <span className="text-[10px] font-medium relative z-10 leading-none">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
