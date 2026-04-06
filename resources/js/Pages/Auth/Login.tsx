import { Head } from '@inertiajs/react';
import { TrendingUp, Shield, Zap } from 'lucide-react';

export default function Login() {
    return (
        <>
            <Head title="Entrar" />

            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ backgroundColor: 'var(--color-background)' }}
            >
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4"
                            style={{ backgroundColor: 'var(--color-accent)', color: '#000' }}
                        >
                            F
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                            FinanceApp
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                            Controle financeiro com previsibilidade
                        </p>
                    </div>

                    {/* Card */}
                    <div
                        className="rounded-2xl p-8"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--color-foreground)' }}>
                            Bem-vindo de volta
                        </h2>

                        {/* Google OAuth Button — usa <a> nativo para full redirect */}
                        <a
                            href="/auth/google"
                            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl font-medium text-sm transition-all"
                            style={{
                                backgroundColor: 'var(--color-surface-2)',
                                color: 'var(--color-foreground)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <GoogleIcon />
                            Continuar com Google
                        </a>

                        {/* Features */}
                        <div className="mt-8 space-y-3">
                            {[
                                { icon: TrendingUp, text: 'Projeção financeira para 12 meses' },
                                { icon: Shield, text: 'Detecção automática de duplicatas' },
                                { icon: Zap, text: 'Categorização inteligente com IA' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-3">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                                    >
                                        <Icon size={14} style={{ color: 'var(--color-accent)' }} />
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-center text-xs mt-6" style={{ color: 'var(--color-muted)' }}>
                        Uso pessoal — seus dados ficam seguros
                    </p>
                </div>
            </div>
        </>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
        </svg>
    );
}
