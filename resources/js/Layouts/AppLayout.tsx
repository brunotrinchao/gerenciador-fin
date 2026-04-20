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
            </div>

            {/* Flash notification toast */}
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium max-w-sm animate-fade-in cursor-pointer  ${
                        notification.type === 'success'
                            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                            : 'bg-red-950/90 border-red-500/50 text-red-100'
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
        </TutorialProvider>
    );
}
