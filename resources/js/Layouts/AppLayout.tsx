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
import { TutorialProvider } from '@/Components/TutorialProvider';

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
    const { auth, flash, unread_notifications_count } = props;

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
        <TutorialProvider>
        <div className="flex h-screen overflow-hidden bg-mesh">
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
                    unreadNotificationsCount={unread_notifications_count ?? 0}
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
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full shadow" style={{ backgroundColor: 'var(--color-surface)', borderWidth: '1px', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
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
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full shadow" style={{ backgroundColor: 'var(--color-surface)', borderWidth: '1px', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
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
                    className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-premium border text-sm font-medium max-w-sm animate-scale-in cursor-pointer glass-morphism ${
                        notification.type === 'success'
                            ? 'border-emerald-500/30 text-emerald-400'
                            : 'border-red-500/30 text-red-400'
                    }`}
                    onClick={() => setNotification(null)}
                >
                    <div className={`p-2 rounded-full ${
                        notification.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                        {notification.type === 'success'
                            ? <CheckCircle size={18} className="flex-shrink-0" />
                            : <AlertCircle size={18} className="flex-shrink-0" />
                        }
                    </div>
                    <span className="flex-1">{notification.message}</span>
                </div>
            )}
        </div>
        </TutorialProvider>
    );
}
