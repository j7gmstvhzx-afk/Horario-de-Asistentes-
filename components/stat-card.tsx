"use client";

import Link from "next/link";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
  className?: string;
};

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-brand-100 text-brand-700",
  success: "bg-success text-success-fg",
  warning: "bg-warning text-warning-fg",
  danger: "bg-danger text-danger-fg",
  accent: "bg-accent text-brand-700",
};

export function StatCard({
  label,
  value,
  format,
  hint,
  icon,
  href,
  tone = "default",
  className,
}: StatCardProps) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    format ? format(v) : Math.round(v).toString(),
  );

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value]);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            {label}
          </p>
          <motion.p className="mt-1 font-display text-2xl font-bold text-ink leading-tight">
            {rounded}
          </motion.p>
          {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              toneClasses[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </>
  );

  const cardClass = cn(
    "block rounded-3xl border border-white/40 bg-white/85 backdrop-blur-md p-5 shadow-card",
    href &&
      "transition-all hover:shadow-soft hover:bg-white/95 active:scale-[0.98]",
    className,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {href ? (
        <Link href={href} className={cardClass}>
          {inner}
        </Link>
      ) : (
        <div className={cardClass}>{inner}</div>
      )}
    </motion.div>
  );
}
