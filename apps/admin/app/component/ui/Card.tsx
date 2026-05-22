import { cn } from "@/app/utils";


interface CardProps {
  title: string;
  value: string | number;
  change?: string;
  className?: string;
}

export function Card({ title, value, change, className }: CardProps) {
  return (
    <div className={cn(
      "bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 glow",
      className
    )}>
      <p className="text-sm text-[var(--muted)]">{title}</p>
      <div className="mt-4 flex items-baseline gap-3">
        <h2 className="text-4xl font-semibold tracking-tighter text-[var(--primary)]">
          {value}
        </h2>
        {change && <span className="text-emerald-400 text-sm font-medium">↑ {change}</span>}
      </div>
    </div>
  );

}