import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  steps: string[];
  current: number; // 0-based
};

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                isDone && "bg-success-fg text-white",
                isActive && "bg-brand-500 text-white shadow-glow",
                !isDone && !isActive && "bg-brand-100 text-brand-700",
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                isActive ? "text-ink" : "text-ink-muted",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 sm:w-10",
                  i < current ? "bg-success-fg" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
