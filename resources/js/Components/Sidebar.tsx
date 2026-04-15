import { Link, usePage } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import {
    LayoutDashboard,
    CalendarDays,
    ArrowLeftRight,
    Receipt,
    CreditCard,
    Building2,
    TrendingUp,
    BarChart3,
    CalendarRange,
    Tags,
    Users,
    ShieldCheck,
    Settings,
    ChevronLeft,
    ChevronRight,
    UploadCloud,
    CalendarClock,
    RefreshCw,
    Bell,
    Sparkles,
    Landmark,
    Calculator,
    HeartPulse,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

// ─────────────────────────────────────────────
// Estrutura de navegação por seções
// ─────────────────────────────────────────────

const navSections: NavSection[] = [
    {
        title: 'Início',
        items: [
            { label: 'Dashboard',  href: '/',         icon: LayoutDashboard },
            { label: 'Calendário', href: '/calendar', icon: CalendarDays },
        ],
    },
    {
        title: 'Movimentações',
        items: [
            { label: 'Transações',      href: '/transactions',    icon: ArrowLeftRight },
            { label: 'Recorrências',    href: '/recurrences',     icon: RefreshCw },
            { label: 'Faturas',         href: '/invoices',        icon: Receipt },
            { label: 'Importação',      href: '/imports',         icon: UploadCloud },
            { label: 'Processamentos',  href: '/scheduled-logs',  icon: CalendarClock },
        ],
    },
    {
        title: 'Patrimônio',
        items: [
            { label: 'Cartões',          href: '/credit-cards',  icon: CreditCard },
            { label: 'Contas Bancárias', href: '/bank-accounts', icon: Building2 },
            { label: 'Investimentos',    href: '/investments',   icon: TrendingUp },
        ],
    },
    {
        title: 'Análise',
        items: [
            { label: 'Projeção',    href: '/projection',   icon: CalendarRange },
            { label: 'Relatórios',  href: '/relatorios',   icon: BarChart3 },
            { label: 'Análise IA',  href: '/ai-analysis',  icon: Sparkles },
            { label: 'Impostos',        href: '/tax-planning',  icon: Landmark },
            { label: 'Simulador',       href: '/simulator',     icon: Calculator },
            { label: 'Saúde Financeira', href: '/health-score', icon: HeartPulse },
        ],
    },
    {
        title: 'Configurações',
        items: [
            { label: 'Notificações', href: '/notifications',     icon: Bell },
            { label: 'Categorias',   href: '/categories',        icon: Tags },
            { label: 'Perfis',       href: '/settings/roles',    icon: ShieldCheck },
            { label: 'Membros',      href: '/settings/members',  icon: Users },
            { label: 'Geral',        href: '/settings',          icon: Settings },
        ],
    },
];

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const { url } = usePage();

    const isActive = (href: string) => {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    };

    const sidebarContent = (
        <>
            {/* Logo */}
            <div
                className="flex items-center h-14 px-4 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--color-border)' }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#000' }}
                    >
                        F
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-sm truncate lg:block" style={{ color: 'var(--color-foreground)' }}>
                            FinanceApp
                        </span>
                    )}
                </div>
            </div>

            {/* Nav com seções */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                {navSections.map((section) => (
                    <div key={section.title}>
                        {!collapsed && (
                            <p
                                className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1"
                                style={{ color: 'var(--color-muted)' }}
                            >
                                {section.title}
                            </p>
                        )}
                        {collapsed && (
                            <div
                                className="mx-2 mb-1"
                                style={{ borderTop: '1px solid var(--color-border)' }}
                            />
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.href}
                                    item={item}
                                    collapsed={collapsed}
                                    active={isActive(item.href)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer — apenas botão de colapso (desktop only) */}
            <div
                className="flex-shrink-0 p-2 hidden lg:block"
                style={{ borderTop: '1px solid var(--color-border)' }}
            >
                <button
                    onClick={onToggle}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                    style={{ color: 'var(--color-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    {!collapsed && <span>Recolher</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Mobile sidebar — fixed overlay */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out lg:hidden glass border-y-0 border-l-0 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Desktop sidebar — static, collapsed/expanded */}
            <aside
                className="hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out glass border-y-0 border-l-0 shadow-premium"
                style={{
                    width: collapsed ? '80px' : '280px',
                }}
            >
                {sidebarContent}
            </aside>
        </>
    );
}

// ─────────────────────────────────────────────
// NavLink
// ─────────────────────────────────────────────

function NavLink({
    item,
    collapsed,
    active,
}: {
    item: NavItem;
    collapsed: boolean;
    active: boolean;
}) {
    const Icon = item.icon;

    const link = (
        <Link
            href={item.href}
            className="flex items-center gap-3 px-2 py-2 text-sm transition-colors"
            style={{
                backgroundColor: active ? 'var(--md-color-secondary-container)' : 'transparent',
                color: active ? 'var(--md-color-on-secondary-container)' : 'var(--color-muted)',
                borderRadius: 'var(--md-shape-full)',
            }}
            onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-color-on-surface) 8%, transparent)';
            }}
            onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
    );

    if (collapsed) {
        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{item.label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return link;
}
