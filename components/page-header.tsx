import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Animated mesh gradient hero header. Children render over the mesh.
 * Defaults to white text on the dark gradient.
 */
export function PageHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "mesh-bg relative overflow-hidden rounded-b-[2.5rem] px-5 pt-10 pb-24 text-white safe-top",
        className,
      )}
    >
      <div className="relative z-10 mx-auto max-w-2xl">{children}</div>
    </header>
  );
}

export function PageContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative z-10 mx-auto -mt-16 max-w-2xl px-4 sm:px-5", className)}>
      {children}
    </div>
  );
}

export function SimpleHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 safe-top border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-ink-muted">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
    </div>
  );
}
