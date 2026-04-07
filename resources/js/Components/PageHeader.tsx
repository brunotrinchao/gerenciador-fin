import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    filters?: ReactNode;
    states?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, filters, states }: PageHeaderProps) {
    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--md-color-on-surface)]">{title}</h1>
                    {subtitle && <p className="text-[var(--md-color-on-surface-variant)] text-sm mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
            </div>

            {states && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {states}
                </div>
            )}

            {filters && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 flex-wrap">
                    {filters}
                </div>
            )}
        </div>
    );
}

interface PageHeaderStateProps {
    title: string;
    value: ReactNode;
    colorClass?: string;
    subtitle?: string;
}

export function PageHeaderState({ title, value, colorClass = "text-[var(--md-color-on-surface)]", subtitle }: PageHeaderStateProps) {
    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-1">
            <p className="text-xs text-[var(--md-color-on-surface-variant)] uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
            {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
        </div>
    );
}
