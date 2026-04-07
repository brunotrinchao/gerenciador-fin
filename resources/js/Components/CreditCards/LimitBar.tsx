import { CreditCard } from "@/types/models";
import { formatCurrency } from "@/lib/utils";

export function LimitBar({ card }: { card: CreditCard }) {
  const baseLimit = Number(card.credit_limit);
  const adjustment = Number(card.limit_adjustment);
  const totalLimit = baseLimit + adjustment;
  
  const spentPct = (Number(card.current_spending) / totalLimit) * 100;
  const futurePct = (Number(card.future_installments_total) / totalLimit) * 100;
  const availablePct = 100 - spentPct - futurePct;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[var(--md-color-on-surface-variant)]">
        <span>Uso do Limite</span>
        <span>{formatCurrency(totalLimit)}</span>
      </div>
      <div className="h-3 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-[var(--md-color-error)] transition-all"
          style={{ width: `${spentPct}%` }} 
          title={`Gasto Atual: ${formatCurrency(Number(card.current_spending))}`}
        />
        <div 
          className="h-full bg-[var(--md-color-tertiary)]/50 transition-all"
          style={{ width: `${futurePct}%` }}
          title={`Parcelas Futuras: ${formatCurrency(Number(card.future_installments_total))}`}
        />
        <div 
          className="h-full bg-[var(--md-color-secondary)]/20 transition-all"
          style={{ width: `${availablePct}%` }}
          title={`Disponível: ${formatCurrency(Number(card.available_limit))}`}
        />
      </div>
      {adjustment > 0 && (
        <p className="text-[10px] text-[var(--md-color-secondary)]">
          + {formatCurrency(adjustment)} de limite extra aplicado
        </p>
      )}
    </div>
  )
}
