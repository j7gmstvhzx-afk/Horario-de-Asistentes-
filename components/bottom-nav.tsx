"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Coins,
  FileText,
  Home,
  MoreHorizontal,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TabIconName =
  | "home"
  | "calendar"
  | "file"
  | "user"
  | "users"
  | "coins"
  | "more";

export type TabItem = {
  href: string;
  label: string;
  icon: TabIconName;
};

const ICONS: Record<TabIconName, LucideIcon> = {
  home: Home,
  calendar: Calendar,
  file: FileText,
  user: User,
  users: Users,
  coins: Coins,
  more: MoreHorizontal,
};

export function BottomNav({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/40 bg-white/85 backdrop-blur-xl safe-bottom"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pt-1.5">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));
          const Icon = ICONS[tab.icon];
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 transition-colors active:scale-[0.96]",
                  active ? "text-brand-700" : "text-ink-muted hover:text-brand-600",
                )}
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 rounded-full bg-brand-100 shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon
                    className="relative h-5 w-5"
                    strokeWidth={active ? 2.4 : 2}
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "text-brand-700" : "text-ink-muted",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
