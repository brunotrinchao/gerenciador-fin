interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
            {children}
        </div>
    );
}
