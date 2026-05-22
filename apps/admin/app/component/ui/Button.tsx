import { cn } from "@/app/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
}

export function Button({ children, variant = 'primary', className, ...props }: ButtonProps) {
  const base = "px-5 py-2.5 rounded-xl font-medium transition-all active:scale-[0.97] disabled:opacity-70";
  
  const styles = variant === 'primary'
    ? "bg-[var(--primary)] text-black hover:brightness-110"
    : "border border-[var(--border)] hover:bg-white/5 text-[var(--text)]";

  return (
    <button className={cn(base, styles, className)} {...props}>
      {children}
    </button>
  );
}