import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
};

const sizeMap = {
  sm: { width: 40, height: 40, textClass: "text-sm" },
  md: { width: 56, height: 56, textClass: "text-base" },
  lg: { width: 80, height: 80, textClass: "text-lg" },
};

export function Logo({ className, size = "md", showName = true }: LogoProps) {
  const { width, height, textClass } = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/logo-casino-atlantico.png"
        alt="Casino Atlántico Manatí"
        width={width}
        height={height}
        priority
        className="h-auto w-auto object-contain"
      />
      {showName && (
        <div className="hidden sm:block">
          <p className={cn("font-display font-bold leading-tight", textClass)}>
            Casino Atlántico
          </p>
          <p className="text-xs text-ink-muted tracking-widest">MANATÍ</p>
        </div>
      )}
    </div>
  );
}
