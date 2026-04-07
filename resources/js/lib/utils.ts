
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(v: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(v);
}

/**
 * Formata uma data ISO (YYYY-MM-DD) para o padrão brasileiro DD/MM/YYYY.
 * Usa `T12:00:00` para evitar deslocamento de timezone em datas sem horário.
 *
 * @param d - string ISO (ex: "2025-04-07") ou falsy
 * @returns string formatada (ex: "07/04/2025") ou vazio se inválida
 */
export function formatDate(d: string | null | undefined): string {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
}
