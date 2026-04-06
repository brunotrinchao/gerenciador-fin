import { CATEGORY_ICONS } from '@/lib/categoryIcons';

interface CategoryIconProps {
    icon: string | null;
    size?: number;
    className?: string;
}

export function CategoryIcon({ icon, size = 16, className }: CategoryIconProps) {
    if (!icon) return null;
    const Icon = CATEGORY_ICONS[icon];
    if (!Icon) {
        return <span className={className} style={{ fontSize: size }}>{icon}</span>;
    }
    return <Icon size={size} className={className} />;
}
