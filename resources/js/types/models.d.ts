// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type AccountType = 'checking' | 'savings' | 'investment' | 'cash' | 'other';

export type TransactionType =
    | 'income'
    | 'expense'
    | 'credit_card'
    | 'transfer'
    | 'investment_in'
    | 'investment_out';

export type TransactionStatus = 'pending' | 'paid' | 'cancelled';

export type InstallmentStatus = 'active' | 'completed' | 'cancelled';

export type InvestmentType =
    | 'renda_fixa'
    | 'renda_variavel'
    | 'crypto'
    | 'fundos'
    | 'poupanca'
    | 'outros';

export type CategoryType = 'income' | 'expense';

export type StatementImportStatus =
    | 'processing'
    | 'review_pending'
    | 'completed'
    | 'failed';

export type BudgetPeriod = 'monthly' | 'yearly';

// ─────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────

export interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface BankAccount {
    id: number;
    user_id: number;
    name: string;
    bank_name: string | null;
    bank_code: string | null;
    account_type: AccountType;
    initial_balance: number;
    current_balance: number;
    overdraft_limit: number;
    color: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    user_id: number;
    name: string;
    icon: string | null;
    color: string;
    type: CategoryType;
    parent_id: number | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    // relations
    parent?: Category;
    children?: Category[];
}

export interface CreditCard {
    id: number;
    user_id: number;
    bank_account_id: number | null;
    name: string;
    brand: string | null;
    last_four_digits: string | null;
    credit_limit: number;
    available_limit: number;
    limit_adjustment: number;
    current_spending: number;
    future_installments_total: number;
    closing_day: number;
    due_day: number;
    color: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // relations
    bank_account?: BankAccount;
}

export interface Transaction {
    id: number;
    user_id: number;
    bank_account_id: number | null;
    credit_card_id: number | null;
    category_id: number | null;
    installment_group_id: number | null;
    description: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    date: string;
    competence_date: string | null;
    notes: string | null;
    is_recurring: boolean;
    recurrence_rule: string | null;
    parent_transaction_id?: number | null;
    recurrence_end_date?: string | null;
    recurrence_occurrences?: number | null;
    is_imported: boolean;
    import_hash: string | null;
    google_event_id: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    // relations
    category?: Category;
    bank_account?: BankAccount;
    credit_card?: CreditCard;
    installment_group?: InstallmentGroup;
    parent_transaction?: Transaction;
}

export interface InstallmentGroup {
    id: number;
    user_id: number;
    credit_card_id: number | null;
    bank_account_id: number | null;
    category_id: number | null;
    description: string;
    total_amount: number;
    installment_amount: number;
    total_installments: number;
    paid_installments: number;
    start_date: string;
    status: InstallmentStatus;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    // accessors
    progress?: number;
    total_remaining?: number;
    // relations
    installments?: Installment[];
    category?: Category;
    creditCard?: CreditCard;
    bankAccount?: BankAccount;
}

export interface Installment {
    id: number;
    installment_group_id: number;
    transaction_id: number | null;
    number: number;
    amount: number;
    due_date: string;
    status: TransactionStatus;
    paid_at: string | null;
    google_event_id: string | null;
    created_at: string;
    updated_at: string;
    // accessors
    is_overdue?: boolean;
    // relations
    group?: InstallmentGroup;
    transaction?: Transaction;
}

export interface CreditCardStatement {
    id: number;
    user_id: number;
    credit_card_id: number;
    reference_month: string;
    closing_date: string | null;
    due_date: string | null;
    total_amount: number;
    paid_amount: number;
    status: 'open' | 'closed' | 'paid';
    file_path: string | null;
    file_name: string | null;
    import_status: StatementImportStatus | null;
    imported_at: string | null;
    raw_items: Record<string, unknown>[] | null;
    parsed_items: Record<string, unknown>[] | null;
    google_event_id: string | null;
    created_at: string;
    updated_at: string;
    // relations
    credit_card?: CreditCard;
}

export interface Investment {
    id: number;
    user_id: number;
    bank_account_id: number | null;
    name: string;
    type: InvestmentType;
    institution: string | null;
    invested_amount: number;
    current_amount: number;
    yield_rate: number | null;
    yield_type: 'prefixado' | 'posfixado' | 'hibrido' | null;
    start_date: string;
    maturity_date: string | null;
    status: 'active' | 'redeemed' | 'matured';
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    // accessors
    total_yield?: number;
    yield_percentage?: number;
    days_to_maturity?: number | null;
    // relations
    snapshots?: InvestmentSnapshot[];
    bank_account?: BankAccount;
}

export interface InvestmentSnapshot {
    id: number;
    investment_id: number;
    reference_date: string;
    amount: number;
    yield_amount: number;
    yield_percentage: number;
    created_at: string;
    updated_at: string;
}

export interface Budget {
    id: number;
    user_id: number;
    category_id: number;
    amount: number;
    period: BudgetPeriod;
    reference_month: string | null;
    created_at: string;
    updated_at: string;
    // relations
    category?: Category;
}

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}
