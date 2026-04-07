import { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/hooks/useTheme';
import type { AuthUser } from '@/types/global';

interface HeaderProps {
    title?: string;
    onMenuToggle: () => void;
    user: AuthUser | null;
}

export default function Header({ title, onMenuToggle, user }: HeaderProps) {
    const { theme, toggle } = useTheme();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [open]);

    return (
        <header
            className="flex items-center gap-4 px-4 flex-shrink-0"
            style={{
                height: 'var(--header-height)',
                backgroundColor: 'var(--color-surface)',
            }}
        >
            {/* Menu toggle (mobile) */}
            <button
                onClick={onMenuToggle}
                className="lg:hidden p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-muted)' }}
            >
                <Menu size={20} />
            </button>

            {/* Título */}
            <div className="flex-1 min-w-0">
                {title && (
                    <h1 className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                        {title}
                    </h1>
                )}
            </div>

            {/* Avatar dropdown */}
            {user && (
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-foreground)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                        ) : (
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
                            >
                                {user.name[0].toUpperCase()}
                            </div>
                        )}
                        <span className="hidden md:block text-sm font-medium">
                            {user.name.split(' ')[0]}
                        </span>
                        <ChevronDown size={14} style={{ color: 'var(--color-muted)' }} />
                    </button>

                    {/* Dropdown */}
                    {open && (
                        <div
                            className="absolute right-0 top-full mt-1 w-56 rounded-xl shadow-xl z-50 py-1"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            {/* User info */}
                            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>
                                    {user.name}
                                </p>
                                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                    {user.email}
                                </p>
                            </div>

                            {/* Theme toggle */}
                            <button
                                onClick={() => { toggle(); setOpen(false); }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left"
                                style={{ color: 'var(--color-foreground)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                {theme === 'dark' ? 'Mudar para Claro' : 'Mudar para Escuro'}
                            </button>

                            <div style={{ borderTop: '1px solid var(--color-border)' }} />

                            {/* Logout */}
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left"
                                style={{ color: 'var(--color-danger)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                onClick={() => setOpen(false)}
                            >
                                <LogOut size={16} />
                                Sair
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
