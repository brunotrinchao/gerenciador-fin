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
