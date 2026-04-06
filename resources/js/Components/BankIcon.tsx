import { getBankInfo } from '@/lib/bankIcons';

interface BankIconProps {
    bankName: string | null;
    size?: number;
    className?: string;
}

export function BankIcon({ bankName, size = 36, className = '' }: BankIconProps) {
    const info = getBankInfo(bankName);

    if (!info) {
        // Fallback: iniciais do nome do banco
        const initials = bankName
            ? bankName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            : '??';
        return (
            <div
                className={`rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${className}`}
                style={{ width: size, height: size, backgroundColor: '#374151', color: '#9ca3af' }}
            >
                {initials}
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: info.bg,
                color: info.color,
                fontSize: size * 0.28,
            }}
        >
            {info.abbr}
        </div>
    );
}
