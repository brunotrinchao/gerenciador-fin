import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CreditCard, BankAccount, Category } from '@/types/models';
import { CurrencyInput } from '@/Components/CurrencyInput';
import { DateInput } from '@/Components/DateInput';
import { BrandSelector, guessBrandFromBank } from '@/Components/BrandSelector';
import {
    UploadCloud,
    CreditCard as CreditCardIcon,
    CheckCircle,
    AlertCircle,
    X,
    Plus,
    ChevronRight,
    Receipt,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface InvoiceDetails {
    bank: string | null;
    lastFour: string | null;
    totalAmount: number;
    itemCount: number;
    isValidSum: boolean;
    // Dados do cartão extraídos pelo driver
    cardName: string | null;
    brand: string | null;
    closingDay: number | null;
    dueDay: number | null;
    creditLimit: number | null;
}

interface BoletoDetails {
    beneficiary: string;
    amount: number;
    dueDate: string | null;
    cnpj: string | null;
    filePath: string;
    fileName: string;
}

interface Props {
    creditCards: CreditCard[];
    bankAccounts: BankAccount[];
    invoiceDetails?: InvoiceDetails | null;
    matchedCard?: CreditCard | null;
    boletoDetails?: BoletoDetails | null;
    documentType?: 'boleto' | 'invoice' | null;
    categories?: Category[];
}

interface NewCardForm {
    [key: string]: any;
    name: string;
    brand: string;
    last_four_digits: string;
    credit_limit: string;
    available_limit: string;
    closing_day: string;
    due_day: string;
    bank_account_id: string;
    color: string;
}

const CARD_COLORS = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];


function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ImportCreate({
    creditCards,
    bankAccounts,
    invoiceDetails,
    matchedCard,
    boletoDetails,
    documentType: _documentType,
    categories: _categories = [],
}: Props) {
    const { props } = usePage();
    const flash = props.flash as { error?: string; success?: string } | undefined;

    const [importType, setImportType] = useState<'fatura' | 'boleto' | null>(null);
    const [file, setFile]             = useState<File | null>(null);
    const [uploading, setUploading]   = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Modal state
    const [showModal, setShowModal]   = useState(false);
    const [processing, setProcessing] = useState(false);
    const [useNewCard, setUseNewCard] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<string>(
        matchedCard ? String(matchedCard.id) : ''
    );
    const [newCard, setNewCard] = useState<NewCardForm>({
        name:             '',
        brand:            '',
        last_four_digits: invoiceDetails?.lastFour ?? '',
        credit_limit:     '',
        available_limit:  '',
        closing_day:      '',
        due_day:          '',
        bank_account_id:  '',
        color:            '#6366f1',
    });

    // Boleto modal state
    const [showBoletoModal, setShowBoletoModal] = useState(false);
    const [boletoForm, setBoletoForm] = useState({
        description: '',
        amount: '',
        due_date: '',
        bank_account_id: '',
        category_id: '',
        total_installments: '1',
        first_payment_date: '',
    });
    const [boletoProcessing, setBoletoProcessing] = useState(false);

    // Abrir modal e pré-preencher TODOS os campos com dados extraídos da fatura
    useEffect(() => {
        if (invoiceDetails) {
            setUseNewCard(!matchedCard);
            setSelectedCardId(matchedCard ? String(matchedCard.id) : '');
            setNewCard(prev => ({
                ...prev,
                name:             invoiceDetails.cardName ?? invoiceDetails.bank ?? prev.name,
                brand:            invoiceDetails.brand ?? guessBrandFromBank(invoiceDetails.bank),
                last_four_digits: invoiceDetails.lastFour ?? prev.last_four_digits,
                closing_day:      invoiceDetails.closingDay ? String(invoiceDetails.closingDay) : prev.closing_day,
                due_day:          invoiceDetails.dueDay ? String(invoiceDetails.dueDay) : prev.due_day,
                credit_limit:     invoiceDetails.creditLimit ? String(invoiceDetails.creditLimit) : prev.credit_limit,
                available_limit:  invoiceDetails.creditLimit ? String(invoiceDetails.creditLimit) : prev.available_limit,
            }));
            setShowModal(true);
        }
    }, [invoiceDetails]);

    useEffect(() => {
        if (boletoDetails) {
            setBoletoForm({
                description: boletoDetails.beneficiary,
                amount: String(boletoDetails.amount),
                due_date: boletoDetails.dueDate ?? '',
                bank_account_id: '',
                category_id: '',
                total_installments: '1',
                first_payment_date: boletoDetails.dueDate ?? '',
            });
            setShowBoletoModal(true);
        }
    }, [boletoDetails]);

    // ── Handlers ──────────────────────────────

    const handleUpload = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || !importType) return;

        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('import_type', importType);

        router.post(route('imports.upload'), fd, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    };

    const handleConfirm = () => {
        if (useNewCard) {
            if (!newCard.name || !newCard.credit_limit || !newCard.closing_day || !newCard.due_day) return;
            setProcessing(true);
            router.post(route('imports.process'), { new_card: newCard }, {
                onFinish: () => setProcessing(false),
            });
        } else {
            if (!selectedCardId) return;
            setProcessing(true);
            router.post(route('imports.process'), { credit_card_id: selectedCardId }, {
                onFinish: () => setProcessing(false),
            });
        }
    };

    const handleCancel = () => {
        setShowModal(false);
        router.get(route('imports.index'));
    };

    const handleBoletoConfirm = () => {
        if (!boletoForm.bank_account_id || !boletoForm.description || !boletoForm.amount || !boletoForm.due_date) return;
        setBoletoProcessing(true);
        router.post(route('imports.process-boleto'), {
            bank_account_id: boletoForm.bank_account_id,
            category_id: boletoForm.category_id || null,
            description: boletoForm.description,
            amount: boletoForm.amount,
            due_date: boletoForm.due_date,
            total_installments: boletoForm.total_installments,
            first_payment_date: parseInt(boletoForm.total_installments) > 1 ? boletoForm.first_payment_date : boletoForm.due_date,
        }, {
            onFinish: () => setBoletoProcessing(false),
        });
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    };

    const isConfirmDisabled =
        processing ||
        (useNewCard
            ? !newCard.name || !newCard.credit_limit || !newCard.closing_day || !newCard.due_day
            : !selectedCardId);

    // ── Render ────────────────────────────────

    return (
        <AppLayout title="Importação">
            <Head title="Importação" />

            <div className="max-w-2xl mx-auto flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <p className="text-gray-500 text-sm">
                        Cartões <span className="text-gray-400">→</span>{' '}
                        <span className="text-gray-300">Importar</span>
                    </p>
                    <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Importação</h1>
                    <p className="text-gray-500 text-sm">
                        Importe faturas de cartão ou boletos bancários. Apenas PDF.
                    </p>
                </div>

                {/* Flash / upload error */}
                {flash?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                        {flash.error}
                    </div>
                )}
                {flash?.success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
                        {flash.success}
                    </div>
                )}

                {/* Upload card */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
                    <form onSubmit={handleUpload} className="flex flex-col gap-6">

                        {/* Step 1 — tipo de importação */}
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium text-gray-400">
                                <span className="text-[#22c55e] font-semibold">1.</span> Qual tipo de documento você vai importar?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setImportType('fatura')}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                                        importType === 'fatura'
                                            ? 'border-[#22c55e] bg-[#22c55e]/5'
                                            : 'border-[var(--color-border)] hover:border-gray-600 hover:bg-white/[0.02]'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        importType === 'fatura' ? 'bg-[#22c55e]/15' : 'bg-[var(--color-surface-2)]'
                                    }`}>
                                        <CreditCardIcon size={20} className={importType === 'fatura' ? 'text-[#22c55e]' : 'text-gray-400'} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-semibold text-sm ${importType === 'fatura' ? 'text-[#22c55e]' : 'text-white'}`}>
                                            Fatura de Cartão
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">PDF da fatura do cartão</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setImportType('boleto')}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                                        importType === 'boleto'
                                            ? 'border-blue-400 bg-blue-400/5'
                                            : 'border-[var(--color-border)] hover:border-gray-600 hover:bg-white/[0.02]'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        importType === 'boleto' ? 'bg-blue-400/15' : 'bg-[var(--color-surface-2)]'
                                    }`}>
                                        <Receipt size={20} className={importType === 'boleto' ? 'text-blue-400' : 'text-gray-400'} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-semibold text-sm ${importType === 'boleto' ? 'text-blue-400' : 'text-white'}`}>
                                            Boleto
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">PDF de boleto bancário</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Step 2 — arquivo (só mostra após selecionar tipo) */}
                        {importType && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium text-gray-400">
                                <span className="text-[#22c55e] font-semibold">2.</span> Selecione o arquivo PDF
                            </p>

                        {/* Drop zone */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">
                                Arquivo <span className="text-red-400">*</span>
                            </label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                                    dragActive
                                        ? 'border-[#22c55e] bg-[#22c55e]/5'
                                        : 'border-[var(--color-border)] hover:border-gray-600 hover:bg-white/[0.02]'
                                }`}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <UploadCloud
                                    size={28}
                                    className={file ? 'text-[#22c55e]' : 'text-gray-500'}
                                />
                                {file ? (
                                    <p className="text-white font-medium text-sm text-center">{file.name}</p>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-300 text-sm font-medium">
                                            Clique ou arraste o arquivo aqui
                                        </p>
                                        <p className="text-gray-600 text-xs mt-0.5">Apenas PDF</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                        )}

                        <button
                            type="submit"
                            disabled={uploading || !file || !importType}
                            className="w-full py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Analisando arquivo...
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={16} />
                                    Processar Arquivo
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                CONFIRM MODAL
            ══════════════════════════════════════════ */}
            {showModal && invoiceDetails && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-2xl bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

                        {/* ── Modal Header ── */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Confirmar Importação</h2>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Verifique os dados antes de continuar
                                </p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* ── Modal Body ── */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">

                            {/* Invoice Summary */}
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                                    Resumo da Fatura
                                </p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    {invoiceDetails.bank && (
                                        <div>
                                            <p className="text-xs text-gray-500">Banco / Emissor</p>
                                            <p className="text-white font-medium text-sm mt-0.5">
                                                {invoiceDetails.bank}
                                            </p>
                                        </div>
                                    )}
                                    {invoiceDetails.lastFour && (
                                        <div>
                                            <p className="text-xs text-gray-500">Final do Cartão</p>
                                            <p className="text-white font-medium text-sm mt-0.5 font-mono">
                                                •••• {invoiceDetails.lastFour}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500">Total da Fatura</p>
                                        <p className="text-[#22c55e] font-bold text-lg mt-0.5">
                                            {fmt(invoiceDetails.totalAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Lançamentos</p>
                                        <p className="text-white font-semibold text-lg mt-0.5">
                                            {invoiceDetails.itemCount}
                                            <span className="text-gray-500 text-sm font-normal ml-1">itens</span>
                                        </p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)] text-xs ${invoiceDetails.isValidSum ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {invoiceDetails.isValidSum ? (
                                        <><CheckCircle size={12} /> Soma dos lançamentos confere com o total</>
                                    ) : (
                                        <><AlertCircle size={12} /> Soma dos lançamentos pode divergir do total da fatura</>
                                    )}
                                </div>
                            </div>

                            {/* Card Section */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                                    Cartão de Crédito
                                </p>

                                {/* Auto-detect status */}
                                {matchedCard && !useNewCard ? (
                                    <div className="flex items-center gap-2 mb-3 text-xs text-green-400">
                                        <CheckCircle size={13} />
                                        Cartão detectado automaticamente pelos últimos 4 dígitos
                                    </div>
                                ) : !matchedCard && !useNewCard ? (
                                    <div className="flex items-center gap-2 mb-3 text-xs text-yellow-400">
                                        <AlertCircle size={13} />
                                        Nenhum cartão com final {invoiceDetails.lastFour ?? '????'} encontrado
                                    </div>
                                ) : null}

                                {/* Mode tabs */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => { setUseNewCard(false); setSelectedCardId(matchedCard ? String(matchedCard.id) : ''); }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                                            !useNewCard
                                                ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]'
                                                : 'border-[var(--color-border)] text-gray-500 hover:text-gray-300 hover:border-gray-600'
                                        }`}
                                    >
                                        {matchedCard ? 'Cartão Detectado' : 'Selecionar Existente'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUseNewCard(true)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border flex items-center justify-center gap-1.5 ${
                                            useNewCard
                                                ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]'
                                                : 'border-[var(--color-border)] text-gray-500 hover:text-gray-300 hover:border-gray-600'
                                        }`}
                                    >
                                        <Plus size={14} />
                                        Criar Novo Cartão
                                    </button>
                                </div>

                                {/* ── Modo: Cartão existente ── */}
                                {!useNewCard && (
                                    <div className="flex flex-col gap-3">
                                        {/* Detected card pill */}
                                        {matchedCard && (
                                            <div
                                                className="rounded-xl p-4 flex items-center gap-4 border"
                                                style={{
                                                    backgroundColor: matchedCard.color + '18',
                                                    borderColor: matchedCard.color + '40',
                                                }}
                                            >
                                                <div
                                                    className="w-12 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: matchedCard.color }}
                                                >
                                                    <CreditCardIcon size={18} className="text-white" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white font-semibold text-sm truncate">
                                                        {matchedCard.name}
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-0.5">
                                                        {matchedCard.brand && (
                                                            <span className="mr-2">{matchedCard.brand}</span>
                                                        )}
                                                        <span className="font-mono">
                                                            •••• {matchedCard.last_four_digits ?? '????'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <CheckCircle size={20} className="text-[#22c55e] flex-shrink-0" />
                                            </div>
                                        )}

                                        {/* Select dropdown (se não tem matchedCard OU para trocar) */}
                                        {(!matchedCard || creditCards.length > 1) && (
                                            <div className="flex flex-col gap-1">
                                                {matchedCard && (
                                                    <label className="text-xs text-gray-500">
                                                        Ou selecione outro cartão:
                                                    </label>
                                                )}
                                                <select
                                                    value={selectedCardId}
                                                    onChange={(e) => setSelectedCardId(e.target.value)}
                                                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                                >
                                                    <option value="">
                                                        {matchedCard ? 'Manter cartão detectado...' : 'Selecione um cartão...'}
                                                    </option>
                                                    {creditCards.map((c) => (
                                                        <option key={c.id} value={String(c.id)}>
                                                            {c.name}{c.last_four_digits ? ` (•••• ${c.last_four_digits})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Modo: Criar novo cartão ── */}
                                {useNewCard && (
                                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                                        <div className="grid grid-cols-2 gap-3">

                                            <div className="col-span-2 flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">
                                                    Nome do cartão <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    value={newCard.name}
                                                    onChange={(e) => setNewCard(p => ({ ...p, name: e.target.value }))}
                                                    placeholder="Ex: Nubank, Itaú Platinum..."
                                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">Bandeira</label>
                                                <BrandSelector
                                                    value={newCard.brand}
                                                    onChange={(v) => setNewCard(p => ({ ...p, brand: v }))}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">Últimos 4 dígitos</label>
                                                <input
                                                    value={newCard.last_four_digits}
                                                    onChange={(e) => setNewCard(p => ({ ...p, last_four_digits: e.target.value.slice(0, 4) }))}
                                                    placeholder="0000"
                                                    maxLength={4}
                                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">
                                                    Limite de crédito (R$) <span className="text-red-400">*</span>
                                                </label>
                                                <CurrencyInput
                                                    value={newCard.credit_limit}
                                                    onChange={(v) => setNewCard(p => ({ ...p, credit_limit: v }))}
                                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">
                                                    Limite disponível (R$)
                                                </label>
                                                <CurrencyInput
                                                    value={newCard.available_limit}
                                                    onChange={(v) => setNewCard(p => ({ ...p, available_limit: v }))}
                                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">
                                                    Dia de fechamento <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={newCard.closing_day}
                                                    onChange={(e) => setNewCard(p => ({ ...p, closing_day: e.target.value }))}
                                                    placeholder="1–31"
                                                    min={1}
                                                    max={31}
                                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">
                                                    Dia de vencimento <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={newCard.due_day}
                                                    onChange={(e) => setNewCard(p => ({ ...p, due_day: e.target.value }))}
                                                    placeholder="1–31"
                                                    min={1}
                                                    max={31}
                                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                                />
                                            </div>

                                            <div className="col-span-2 flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">Conta bancária vinculada</label>
                                                <select
                                                    value={newCard.bank_account_id}
                                                    onChange={(e) => setNewCard(p => ({ ...p, bank_account_id: e.target.value }))}
                                                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                                >
                                                    <option value="">Nenhuma</option>
                                                    {bankAccounts.map((a) => (
                                                        <option key={a.id} value={String(a.id)}>{a.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-span-2 flex flex-col gap-2">
                                                <label className="text-xs text-gray-400">Cor do cartão</label>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {CARD_COLORS.map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => setNewCard(p => ({ ...p, color: c }))}
                                                            className={`w-7 h-7 rounded-full transition-all ${
                                                                newCard.color === c
                                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface)] scale-110'
                                                                    : 'hover:scale-105'
                                                            }`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Modal Footer ── */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isConfirmDisabled}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        Confirmar e Revisar
                                        <ChevronRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ══════════════════════════════════════════
                BOLETO MODAL
            ══════════════════════════════════════════ */}
            {showBoletoModal && boletoDetails && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-lg bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Boleto Detectado</h2>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Confirme os dados e selecione a conta
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowBoletoModal(false); router.get(route('imports.index')); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

                            {/* Boleto info */}
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Dados do Boleto</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-xs">Arquivo</span>
                                    <span className="text-white text-xs font-medium">{boletoDetails.fileName}</span>
                                </div>
                                {boletoDetails.cnpj && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-xs">CNPJ</span>
                                        <span className="text-gray-300 text-xs font-mono">{boletoDetails.cnpj}</span>
                                    </div>
                                )}
                            </div>

                            {/* Descrição */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm text-gray-400">Descrição / Beneficiário <span className="text-red-400">*</span></label>
                                <input
                                    value={boletoForm.description}
                                    onChange={(e) => setBoletoForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Nome do beneficiário ou descrição"
                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                />
                            </div>

                            {/* Valor + Vencimento */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm text-gray-400">Valor (R$) <span className="text-red-400">*</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={boletoForm.amount}
                                        onChange={(e) => setBoletoForm(p => ({ ...p, amount: e.target.value }))}
                                        placeholder="0,00"
                                        className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                                    />
                                </div>
                                <DateInput
                                    label="Data de Vencimento"
                                    value={boletoForm.due_date}
                                    onChange={(v) => setBoletoForm(p => ({ ...p, due_date: v }))}
                                    required
                                />
                            </div>

                            {/* Conta bancária */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm text-gray-400">Conta bancária <span className="text-red-400">*</span></label>
                                <select
                                    value={boletoForm.bank_account_id}
                                    onChange={(e) => setBoletoForm(p => ({ ...p, bank_account_id: e.target.value }))}
                                    className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                >
                                    <option value="">Selecione a conta...</option>
                                    {bankAccounts.map((a) => (
                                        <option key={a.id} value={String(a.id)}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Parcelas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm text-gray-400">Número de parcelas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={boletoForm.total_installments}
                                        onChange={(e) => setBoletoForm(p => ({ ...p, total_installments: e.target.value }))}
                                        className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22c55e] transition-colors"
                                    />
                                </div>
                                {parseInt(boletoForm.total_installments) > 1 && (
                                    <DateInput
                                        label="Data da 1ª Parcela"
                                        value={boletoForm.first_payment_date}
                                        onChange={(v) => setBoletoForm(p => ({ ...p, first_payment_date: v }))}
                                        required
                                    />
                                )}
                            </div>

                            {parseInt(boletoForm.total_installments) > 1 && boletoForm.amount && (
                                <p className="text-xs text-gray-500">
                                    {boletoForm.total_installments}x de {fmt(parseFloat(boletoForm.amount) / parseInt(boletoForm.total_installments))} cada
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => { setShowBoletoModal(false); router.get(route('imports.index')); }}
                                className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleBoletoConfirm}
                                disabled={boletoProcessing || !boletoForm.bank_account_id || !boletoForm.description || !boletoForm.amount || !boletoForm.due_date}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {boletoProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Confirmar Boleto
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
