import { CreditCard } from "@/types/models";
import { formatCurrency } from "@/lib/utils";

export function LimitBar({ card }: { card: CreditCard }) {
  const totalLimit = Number(card.credit_limit) + Number(card.limit_adjustment || 0);
  const available  = Number(card.available_limit);
  const totalUsed  = Math.max(0, totalLimit - available);
  
  const usagePct   = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-[var(--md-color-on-surface-variant)] uppercase font-bold tracking-tighter">Limite Total</p>
          <p className="text-sm font-black text-[var(--md-color-on-surface)]">{formatCurrency(totalLimit)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--md-color-on-surface-variant)] uppercase font-bold tracking-tighter">Disponível</p>
          <p className="text-sm font-black text-[#22c55e]">{formatCurrency(available)}</p>
        </div>
      </div>

      <div className="h-2 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--md-color-error)] transition-all"
          style={{ width: `${usagePct}%`, backgroundColor: usagePct > 90 ? '#ef4444' : usagePct > 60 ? '#f59e0b' : '#3b82f6' }} 
        />
      </div>

      <div className="flex justify-between text-[10px] text-[var(--md-color-on-surface-variant)] font-medium">
        <span>Uso: {usagePct.toFixed(1)}%</span>
        <span>Gasto: {formatCurrency(totalUsed)}</span>
      </div>
    </div>
  )
}
