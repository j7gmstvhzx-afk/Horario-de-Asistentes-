"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

type FabProps = {
  href?: string;
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Floating Action Button pinned bottom-right above the tab bar.
 * Either navigates via `href` or runs `onClick`.
 */
export function Fab({ href, onClick, label, children, className }: FabProps) {
  const classes = cn(
    "fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full",
    "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-floating",
    "transition-transform hover:scale-105 active:scale-95",
    "bottom-[calc(5.25rem+env(safe-area-inset-bottom))]",
    className,
  );
  const content = (
    <>
      {children}
      <span className="sr-only">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={label}
    >
      {content}
    </button>
  );
}
