"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

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

      {/* Main — extra bottom padding when nav is visible */}
      <main className={cn("flex-1 py-4", showNav && "pb-24")}>{children}</main>

      {/* Persistent bottom nav */}
      {showNav && (
        <>
          <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-3 border-t border-border dark:border-dark-border bg-bone/90 dark:bg-dark-bg/90 backdrop-blur-md">
            <NavItem href="/home" active={pathname === "/home"} label="Home">
              <IconHome />
            </NavItem>
            <NavItem href="/scripting-session" active={pathname === "/scripting-session"} label="Script">
              <IconPen />
            </NavItem>
            <NavItem href="/conversation" active={pathname === "/conversation"} label="Talk">
              <IconChat />
            </NavItem>
            <NavItem href="/journal" active={pathname === "/journal"} label="Journal">
              <IconBook />
            </NavItem>
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                "tap-target flex flex-col items-center gap-1 transition-colors",
                moreOpen
                  ? "text-ink dark:text-dark-text"
                  : "text-ink-faint dark:text-dark-text-secondary"
              )}
            >
              <IconGrid />
              <span className="text-2xs tracking-widest uppercase">More</span>
            </button>
          </nav>

          {/* More sheet */}
          {moreOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={() => setMoreOpen(false)}
              />
              <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
                <div className="bg-bone dark:bg-dark-bg border-t border-border dark:border-dark-border px-6 pt-6 pb-10 rounded-t-2xl space-y-1">
                  <div className="w-8 h-0.5 bg-border dark:bg-dark-border mx-auto mb-6 rounded-full" />
                  {MORE_LINKS.map((item) => (
                    <MoreLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      description={item.description}
                      onClose={() => setMoreOpen(false)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const MORE_LINKS = [
  { href: "/challenges",      label: "Challenges",      description: "7 or 21-day portrait challenges" },
  { href: "/retrospective",   label: "Your month",      description: "Monthly reflection" },
  { href: "/portrait-session",label: "Portrait session", description: "Deepen your portrait" },
  { href: "/feed",            label: "Portrait feed",   description: "Anonymous portraits" },
  { href: "/commitments",     label: "Commitments",     description: "Ways of being" },
];

function MoreLink({
  href,
  label,
  description,
  onClose,
}: {
  href: string;
  label: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-baseline justify-between py-4 border-b border-border dark:border-dark-border last:border-b-0 group"
    >
      <span className="text-[0.9375rem] text-ink dark:text-dark-text group-hover:text-ink-secondary dark:group-hover:text-dark-text-secondary transition-colors">
        {label}
      </span>
      <span className="text-xs text-ink-faint dark:text-dark-text-secondary">
        {description}
      </span>
    </Link>
  );
}

function NavItem({
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

// Icons — minimal, 1.5px stroke weight
function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconPen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="8" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
    </svg>
  );
}
