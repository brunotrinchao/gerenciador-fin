# Polimento Visual & UX Interativa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Dashboard into an interactive center with progressive loading, stacked credit limit bars, and contextual drawers.

**Architecture:** Use Skeleton screens for loading states, multi-layered progress bars for credit limits, and Radix UI Sheets for side drawers. Page transitions will be handled by Framer Motion.

**Tech Stack:** Laravel 11, Inertia.js, React 19, Tailwind CSS, Framer Motion, Radix UI (Sheet/Dialog), Lucide React.

---

### Task 1: Dependencies & Base Components

**Files:**
- Modify: `package.json`
- Create: `resources/js/Components/ui/skeleton.tsx`
- Create: `resources/js/Components/ui/sheet.tsx`

- [ ] **Step 1: Install dependencies**

Run: `npm install framer-motion @radix-ui/react-dialog tailwindcss-animate`

- [ ] **Step 2: Create Skeleton UI component**

```tsx
// resources/js/Components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[var(--color-surface-2)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

- [ ] **Step 3: Create Sheet (Drawer) UI component**

```tsx
// resources/js/Components/ui/sheet.tsx
// Using Radix UI Dialog as base for Sheet
import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 bg-[var(--color-surface)] p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-y-0 right-0 h-full w-3/4 border-l border-[var(--color-border)] sm:max-w-sm data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4 text-white" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetPortal, SheetOverlay }
```

- [ ] **Step 4: Commit**

```bash
git add package.json resources/js/Components/ui/skeleton.tsx resources/js/Components/ui/sheet.tsx
git commit -m "feat: add skeleton and sheet components with dependencies"
```

---

### Task 2: Backend Data for Stacked Termômetro & Drawers

**Files:**
- Create: `database/migrations/2026_04_07_000000_add_limit_adjustment_to_credit_cards.php`
- Modify: `app/Models/CreditCard.php`
- Modify: `app/Http/Controllers/DashboardController.php`
- Modify: `resources/js/types/models.d.ts`

- [ ] **Step 1: Create migration for limit_adjustment**

```php
// database/migrations/2026_04_07_000000_add_limit_adjustment_to_credit_cards.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('credit_cards', function (Blueprint $table) {
            $table->decimal('limit_adjustment', 15, 2)->default(0)->after('credit_limit');
        });
    }

    public function down()
    {
        Schema::table('credit_cards', function (Blueprint $table) {
            $table->dropColumn('limit_adjustment');
        });
    }
};
```

Run: `php artisan migrate`

- [ ] **Step 2: Update CreditCard Model with Accessors**

```php
// app/Models/CreditCard.php
// Add attributes to $appends
protected $appends = ['current_spending', 'future_installments_total'];

public function getCurrentSpendingAttribute(): float
{
    // Spending in the current billing cycle (simplified as current month transactions)
    return (float) $this->transactions()
        ->whereYear('date', now()->year)
        ->whereMonth('date', now()->month)
        ->whereIn('status', [\App\Enums\TransactionStatus::Pending, \App\Enums\TransactionStatus::Paid])
        ->sum('amount');
}

public function getFutureInstallmentsTotalAttribute(): float
{
    // Installments due after current month
    return (float) \App\Models\Installment::whereHas('group', fn($q) => $q->where('credit_card_id', $this->id))
        ->where('due_date', '>', now()->endOfMonth())
        ->where('status', \App\Enums\TransactionStatus::Pending->value)
        ->sum('amount');
}

// Update recalculateLimit to include adjustment
public function recalculateLimit(): void
{
    $totalSpent = $this->transactions()
        ->whereIn('status', [\App\Enums\TransactionStatus::Pending, \App\Enums\TransactionStatus::Paid])
        ->sum('amount');

    $this->update(['available_limit' => $this->credit_limit - $totalSpent + $this->limit_adjustment]);
}
```

- [ ] **Step 3: Update DashboardController with Detail Data**

```php
// app/Http/Controllers/DashboardController.php
// Update index method to include bank accounts and detailed debt
public function index(): Response
{
    // ... existing logic ...
    
    // Add bank accounts detail
    $bankAccounts = BankAccount::byUser($userId)->active()->get();
    
    // Add detailed debt (pending credit card transactions)
    $detailedDebt = Transaction::byUser($userId)
        ->where('type', TransactionType::CreditCard->value)
        ->where('status', TransactionStatus::Pending->value)
        ->with(['creditCard', 'category'])
        ->get()
        ->groupBy('credit_card_id');

    // Add more upcoming items
    $longUpcomingPayments = $upcoming->sortBy('date')->take(15)->values();

    return Inertia::render('Dashboard', [
        'stats' => [ ... ],
        'upcomingPayments' => $upcomingPayments,
        'longUpcomingPayments' => $longUpcomingPayments, // For the drawer
        'expensesByCategory' => $expensesByCategory,
        'cashFlow' => $cashFlow,
        'bankAccounts' => $bankAccounts, // For the drawer
        'detailedDebt' => $detailedDebt, // For the drawer
    ]);
}
```

- [ ] **Step 4: Update TypeScript Types**

```typescript
// resources/js/types/models.d.ts
export interface CreditCard {
    // ... existing ...
    limit_adjustment: number;
    current_spending: number;
    future_installments_total: number;
}
```

- [ ] **Step 5: Commit**

```bash
git add database/migrations/ app/Models/CreditCard.php app/Http/Controllers/DashboardController.php resources/js/types/models.d.ts
git commit -m "feat: add limit_adjustment and dashboard detail data"
```

---

### Task 3: Skeleton Screens implementation

**Files:**
- Create: `resources/js/Components/Dashboard/SummaryCardSkeleton.tsx`
- Create: `resources/js/Components/Dashboard/ChartSkeleton.tsx`
- Modify: `resources/js/Pages/Dashboard.tsx`

- [ ] **Step 1: Create SummaryCardSkeleton**

```tsx
// resources/js/Components/Dashboard/SummaryCardSkeleton.tsx
import { Skeleton } from "@/Components/ui/skeleton"

export function SummaryCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ChartSkeleton**

```tsx
// resources/js/Components/Dashboard/ChartSkeleton.tsx
import { Skeleton } from "@/Components/ui/skeleton"

export function ChartSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="h-[250px] w-full flex items-center justify-center">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Integrate Skeletons in Dashboard**

```tsx
// resources/js/Pages/Dashboard.tsx
// Use Inertia.defer if possible or just show skeletons if data is missing
// For now, let's wrap components in a loading check if we decide to use deferred props
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/Dashboard/
git commit -m "feat: implement dashboard skeletons"
```

---

### Task 4: Credit Card "Stacked Termômetro"

**Files:**
- Create: `resources/js/Components/CreditCards/LimitBar.tsx`
- Modify: `resources/js/Pages/CreditCards/Index.tsx`

- [ ] **Step 1: Create LimitBar Component**

```tsx
// resources/js/Components/CreditCards/LimitBar.tsx
import { CreditCard } from "@/types/models";
import { formatCurrency } from "@/lib/utils";

export function LimitBar({ card }: { card: CreditCard }) {
  const baseLimit = card.credit_limit;
  const adjustment = card.limit_adjustment;
  const totalLimit = baseLimit + adjustment;
  
  const spentPct = (card.current_spending / totalLimit) * 100;
  const futurePct = (card.future_installments_total / totalLimit) * 100;
  const availablePct = 100 - spentPct - futurePct;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Uso do Limite</span>
        <span>{formatCurrency(totalLimit)}</span>
      </div>
      <div className="h-3 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-red-500 transition-all" 
          style={{ width: `${spentPct}%` }} 
          title={`Gasto Atual: ${formatCurrency(card.current_spending)}`}
        />
        <div 
          className="h-full bg-orange-400/50 transition-all" 
          style={{ width: `${futurePct}%` }}
          title={`Parcelas Futuras: ${formatCurrency(card.future_installments_total)}`}
        />
        <div 
          className="h-full bg-blue-500/20 transition-all" 
          style={{ width: `${availablePct}%` }}
          title={`Disponível: ${formatCurrency(card.available_limit)}`}
        />
      </div>
      {adjustment > 0 && (
        <p className="text-[10px] text-blue-400">
          + {formatCurrency(adjustment)} de limite extra aplicado
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update CreditCards Index to use LimitBar**

```tsx
// resources/js/Pages/CreditCards/Index.tsx
// Replace simple progress bar with <LimitBar card={card} />
```

- [ ] **Step 3: Commit**

```bash
git add resources/js/Components/CreditCards/LimitBar.tsx resources/js/Pages/CreditCards/Index.tsx
git commit -m "feat: implement stacked credit limit bar"
```

---

### Task 5: Contextual Drawers in Dashboard

**Files:**
- Modify: `resources/js/Pages/Dashboard.tsx`

- [ ] **Step 1: Implement Debt Drawer**

```tsx
// In Dashboard.tsx, add state and Sheet for detailed debt
const [debtOpen, setDebtOpen] = useState(false);
// ... render detailedDebt grouped by card ...
```

- [ ] **Step 2: Implement Balance Drawer**

```tsx
// In Dashboard.tsx, add state and Sheet for bank accounts
const [balanceOpen, setBalanceOpen] = useState(false);
// ... render bankAccounts list ...
```

- [ ] **Step 3: Implement Upcoming Payments Drawer**

```tsx
// In Dashboard.tsx, add state and Sheet for expanded upcoming payments
const [upcomingOpen, setUpcomingOpen] = useState(false);
// ... render longUpcomingPayments list ...
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Dashboard.tsx
git commit -m "feat: add contextual drawers to dashboard"
```

---

### Task 6: Page Transitions with Framer Motion

**Files:**
- Create: `resources/js/Components/PageTransition.tsx`
- Modify: `resources/js/Layouts/AppLayout.tsx`

- [ ] **Step 1: Create PageTransition Component**

```tsx
// resources/js/Components/PageTransition.tsx
import { motion } from "framer-motion"

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Update AppLayout to use AnimatePresence**

```tsx
// resources/js/Layouts/AppLayout.tsx
import { AnimatePresence } from "framer-motion"
import { PageTransition } from "@/Components/PageTransition"

// Wrap {children} with AnimatePresence and PageTransition
<AnimatePresence mode="wait">
  <PageTransition key={usePage().url}>
    {children}
  </PageTransition>
</AnimatePresence>
```

- [ ] **Step 3: Commit**

```bash
git add resources/js/Components/PageTransition.tsx resources/js/Layouts/AppLayout.tsx
git commit -m "feat: add page transitions with framer motion"
```
