import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative flex size-8 items-center justify-center rounded-sm bg-saffron">
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-field" />
        <span className="font-display text-[15px] font-bold text-primary-foreground">ल</span>
      </span>
      <span className="leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          LokSrijan
        </span>
        {!compact && (
          <span className="label-caps mt-0.5 block text-muted-foreground">
            People-led problem solving
          </span>
        )}
      </span>
    </Link>
  );
}

export function CivicRule({ className }: { className?: string }) {
  return <div className={cn("civic-rule h-1 w-full", className)} />;
}
