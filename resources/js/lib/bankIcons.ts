export interface BankInfo {
    abbr: string;
    color: string;
    bg: string;
}

// Mapeado por bank_name (case-insensitive) e bank_code
const BANK_MAP: Record<string, BankInfo> = {
    'nubank':        { abbr: 'NU',  color: '#ffffff', bg: '#820ad1' },
    'itaú':         { abbr: 'ITÁ', color: '#ffffff', bg: '#ec7000' },
    'itau':         { abbr: 'ITÁ', color: '#ffffff', bg: '#ec7000' },
    'bradesco':     { abbr: 'BD',  color: '#ffffff', bg: '#cc092f' },
    'santander':    { abbr: 'SAN', color: '#ffffff', bg: '#ec0000' },
    'caixa':        { abbr: 'CEF', color: '#ffffff', bg: '#005ca9' },
    'caixa econômica': { abbr: 'CEF', color: '#ffffff', bg: '#005ca9' },
    'banco do brasil': { abbr: 'BB', color: '#ffffff', bg: '#f8d000' },
    'bb':           { abbr: 'BB',  color: '#ffffff', bg: '#f8d000' },
    'inter':        { abbr: 'INT', color: '#ffffff', bg: '#ff7a00' },
    'banco inter':  { abbr: 'INT', color: '#ffffff', bg: '#ff7a00' },
    'c6':           { abbr: 'C6',  color: '#ffffff', bg: '#242424' },
    'c6 bank':      { abbr: 'C6',  color: '#ffffff', bg: '#242424' },
    'sicoob':       { abbr: 'SCB', color: '#ffffff', bg: '#005c3c' },
    'sicredi':      { abbr: 'SCR', color: '#ffffff', bg: '#009b3a' },
    'original':     { abbr: 'ORI', color: '#ffffff', bg: '#00b057' },
    'picpay':       { abbr: 'PIC', color: '#ffffff', bg: '#21c25e' },
    'mercado pago': { abbr: 'MP',  color: '#ffffff', bg: '#00a9e0' },
    'neon':         { abbr: 'NEO', color: '#ffffff', bg: '#00d4e0' },
    'sofisa':       { abbr: 'SOF', color: '#ffffff', bg: '#ff6200' },
    'xp':           { abbr: 'XP',  color: '#000000', bg: '#ffe500' },
    'avenue':       { abbr: 'AVE', color: '#ffffff', bg: '#1a3c5e' },
    'wise':         { abbr: 'WSE', color: '#ffffff', bg: '#9fe870' },
    'pagbank':      { abbr: 'PAG', color: '#ffffff', bg: '#00a859' },
    'pagseguro':    { abbr: 'PAG', color: '#ffffff', bg: '#00a859' },
    'banco bmg':    { abbr: 'BMG', color: '#ffffff', bg: '#e30613' },
    'dinheiro':     { abbr: '💵',  color: '#ffffff', bg: '#16a34a' },
    'cash':         { abbr: '💵',  color: '#ffffff', bg: '#16a34a' },
};

export function getBankInfo(bankName: string | null): BankInfo | null {
    if (!bankName) return null;
    const key = bankName.toLowerCase().trim();
    // Busca exata
    if (BANK_MAP[key]) return BANK_MAP[key];
    // Busca parcial
    for (const [k, v] of Object.entries(BANK_MAP)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    return null;
}
