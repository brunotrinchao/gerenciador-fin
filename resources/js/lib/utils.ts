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
 * Formata uma data para o padrão brasileiro DD/MM/YYYY.
 * Extrai sempre apenas os 10 primeiros caracteres (YYYY-MM-DD) para evitar
 * erros com ISO completo (ex: "2025-04-07T00:00:00.000000Z") ou outros formatos.
 * Usa `T12:00:00` para evitar deslocamento de timezone (UTC-3 / Brasília).
 *
 * @param d - string de data ou falsy
 * @returns string formatada (ex: "07/04/2025") ou vazio se ausente/inválida
 */
export function formatDate(d: string | null | undefined): string {
    if (!d) return '';
    const dateOnly = d.substring(0, 10); // YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return '';
    const date = new Date(dateOnly + 'T12:00:00');
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR');
}
