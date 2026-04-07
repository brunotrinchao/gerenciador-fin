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
      <div className="flex justify-between text-xs text-gray-400">
        <span>Uso do Limite</span>
        <span>{formatCurrency(totalLimit)}</span>
      </div>
      <div className="h-3 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-red-500 transition-all" 
          style={{ width: `${spentPct}%` }} 
          title={`Gasto Atual: ${formatCurrency(Number(card.current_spending))}`}
        />
        <div 
          className="h-full bg-orange-400/50 transition-all" 
          style={{ width: `${futurePct}%` }}
          title={`Parcelas Futuras: ${formatCurrency(Number(card.future_installments_total))}`}
        />
        <div 
          className="h-full bg-blue-500/20 transition-all" 
          style={{ width: `${availablePct}%` }}
          title={`Disponível: ${formatCurrency(Number(card.available_limit))}`}
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
