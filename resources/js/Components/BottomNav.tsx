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
        <nav className="fixed bottom-4 left-4 right-4 lg:hidden z-50 flex items-center justify-around px-2 py-3 rounded-[24px] glass-morphism border-white/10 shadow-premium animate-fade-in mb-[env(safe-area-inset-bottom)]">
            {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center gap-1.5 min-w-[56px] px-1 py-1 rounded-2xl transition-all relative ${
                            active ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {active && (
                            <span className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse-subtle" />
                        )}
                        <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' : ''}`} />
                        <span className={`text-[9px] font-bold tracking-tight uppercase transition-all duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
