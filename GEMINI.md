# GEMINI.md - Gerenciador Financeiro Pessoal

## Project Overview
Personal financial management web application built with Laravel 11, React 19, and Inertia.js. Focuses on predictability of future balance, credit card installments, and investment tracking.

### Core Stack
- **Backend:** Laravel 11 (PHP 8.3)
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Bridge:** Inertia.js (No separate REST API, state managed via props)
- **Database:** PostgreSQL (Supabase)
- **AI:** Google Gemini 1.5 Flash (Categorization & Analysis)
- **Testing:** Pest PHP

---

## Architecture & Logic
- **Service Layer:** Business logic resides in `app/Services/`.
- **Observers:** `TransactionObserver` handles automatic balance recalculation via `recalculateBalance()`.
- **Enums:** Strong typing using PHP Enums in `app/Enums/`.
- **Transactions:** Supports income, expense, transfers, and credit card cycles.
- **Installments:** Managed by `InstallmentService`, automated creation of N installments.
- **Importing:** Async processing via `ProcessStatementImport` Job with AI-assisted categorization and duplicate detection.

---

## Development Workflow

### Commands
```bash
# Setup
composer install
npm install
php artisan migrate
php artisan db:seed --class=CategorySeeder

# Development
php artisan serve
npm run dev
php artisan queue:work # Required for statement imports

# Testing
php artisan test
./vendor/bin/pest

# UI
npx shadcn@latest add [component]
```

### Conventions
- **Controllers:** Keep thin, delegate to Services, return `Inertia::render()`.
- **Models:** Use Scopes (`scopeByUser`, `scopeCurrentMonth`) and Accessors for derived data.
- **Frontend:**
    - Pages in `resources/js/Pages/`
    - Components in `resources/js/Components/`
    - Types in `resources/js/types/models.d.ts`
    - Ziggy `route()` helper for URLs.
- **Security:** Always filter queries by `auth()->id()`.

---

## Key Files
- `CLAUDE.md`: Comprehensive project context and technical details.
- `PLANO_DESENVOLVIMENTO.md`: Roadmap, ERD, and detailed business rules.
- `routes/web.php`: Primary entry point for all application routes.
- `app/Observers/TransactionObserver.php`: Critical for financial integrity.
- `app/Services/Import/`: Logic for PDF/CSV parsing and data normalization.
