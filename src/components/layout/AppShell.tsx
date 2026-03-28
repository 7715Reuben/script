"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto px-6">
      {/* Header */}
      <header className="flex items-center justify-between pt-12 pb-4">
        <Link href="/home" className="flex items-center gap-1">
          <span className="font-serif text-lg tracking-tight text-ink dark:text-dark-text">
            Script
          </span>
          <span className="accent-script text-ink-faint dark:text-dark-text-secondary text-sm mt-0.5">
            ™
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex-1 py-4">{children}</main>

      {/* Bottom nav */}
      {showNav && (
        <nav className="py-8 flex items-center justify-center gap-10">
          <NavLink href="/home" active={pathname === "/home"} label="home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </NavLink>
          <NavLink href="/checkin" active={pathname?.startsWith("/checkin")} label="check in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

function NavLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "tap-target flex flex-col items-center gap-1 transition-colors",
        active
          ? "text-ink dark:text-dark-text"
          : "text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text"
      )}
    >
      {children}
      <span className="text-2xs tracking-widest uppercase">{label}</span>
    </Link>
  );
}
