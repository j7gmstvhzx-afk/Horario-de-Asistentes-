import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
};

const sizeMap = {
  sm: { px: 36, textClass: "text-sm" },
  md: { px: 48, textClass: "text-base" },
  lg: { px: 72, textClass: "text-lg" },
};

export function Logo({ className, size = "md", showName = true }: LogoProps) {
  const { px, textClass } = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={px} />
      {showName && (
        <div className="hidden sm:block leading-tight">
          <p className={cn("font-display font-bold", textClass)}>
            Casino Atlántico
          </p>
          <p className="text-xs text-ink-muted tracking-[0.25em]">MANATÍ</p>
        </div>
      )}
    </div>
  );
}
