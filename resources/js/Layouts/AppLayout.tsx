import { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Plus, Upload, ArrowLeftRight } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/Header';
import BottomNav from '@/Components/BottomNav';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/Components/PageTransition';
import type { AppPageProps } from '@/types/global';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const { props, url } = usePage<AppPageProps>();
    const { auth, flash } = props;

    useEffect(() => {
        const off = router.on('navigate', () => setMobileOpen(false));
        return () => off();
    }, []);

    // Exibe flash messages vindas do backend
    useEffect(() => {
        if (flash?.success) {
            setNotification({ type: 'success', message: flash.success });
            const t = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(t);
        }
        if (flash?.error) {
            setNotification({ type: 'error', message: flash.error });
            const t = setTimeout(() => setNotification(null), 6000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <div className="flex flex-col flex-1 overflow-hidden">
                <Header
                    title={title}
                    onMenuToggle={() => setMobileOpen(true)}
                    user={auth.user}
                />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
                    <AnimatePresence mode="wait">
                        <PageTransition key={url}>
                            {children}
                        </PageTransition>
                    </AnimatePresence>
                </main>

                <BottomNav />

                {/* FAB mobile */}
                <div className="fixed bottom-[72px] right-4 z-50 lg:hidden flex flex-col items-end gap-3">
                    {/* Opção 2: Importar */}
                    <div
                        className={`flex items-center gap-2 transition-all duration-200 ${
                            fabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                        }`}
                    >
                        <span className="bg-[var(--color-surface)] border border-[var(--color-border)] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow">
                            Importar
                        </span>
                        <Link
                            href={route('imports.index')}
                            onClick={() => setFabOpen(false)}
                            className="w-11 h-11 rounded-[var(--md-shape-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                        >
                            <Upload size={18} />
                        </Link>
                    </div>

                    {/* Opção 1: Nova Transação */}
                    <div
                        className={`flex items-center gap-2 transition-all duration-200 delay-75 ${
                            fabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                        }`}
                    >
                        <span className="bg-[var(--color-surface)] border border-[var(--color-border)] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow">
                            Nova Transação
                        </span>
                        <Link
                            href={route('transactions.index')}
                            onClick={() => setFabOpen(false)}
                            className="w-11 h-11 rounded-[var(--md-shape-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                        >
                            <ArrowLeftRight size={18} />
                        </Link>
                    </div>

                    {/* Botão principal FAB */}
                    <button
                        onClick={() => setFabOpen((o) => !o)}
                        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
                        style={{
                            backgroundColor: 'var(--md-color-primary-container)',
                            color: 'var(--md-color-on-primary-container)',
                            transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        }}
                        aria-label="Ações rápidas"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Overlay para fechar FAB */}
                {fabOpen && (
                    <div
                        className="fixed inset-0 z-40 lg:hidden"
                        onClick={() => setFabOpen(false)}
                    />
                )}
            </div>

            {/* Flash notification toast */}
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-sm animate-fade-in cursor-pointer ${
                        notification.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                    onClick={() => setNotification(null)}
                >
                    {notification.type === 'success'
                        ? <CheckCircle size={16} className="flex-shrink-0" />
                        : <AlertCircle size={16} className="flex-shrink-0" />
                    }
                    <span>{notification.message}</span>
                </div>
            )}
        </div>
    );
}
