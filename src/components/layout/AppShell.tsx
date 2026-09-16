import { Link, useRouterState } from "@tanstack/react-router";
import {
  Box,
  Camera,
  Clapperboard,
  LayoutGrid,
  Shirt,
  UserRound,
} from "lucide-react";
import { StudioSync } from "@/components/studio/StudioSync";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/results", label: "Results", short: "Library", icon: LayoutGrid },
  { to: "/create", label: "Human", short: "Human", icon: UserRound },
  { to: "/photo", label: "Photo", short: "Photo", icon: Camera },
  { to: "/avatar", label: "3D", short: "3D", icon: Box },
  { to: "/looks", label: "Looks", short: "Looks", icon: Shirt },
  { to: "/motion", label: "Video", short: "Video", icon: Clapperboard },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/results") return pathname === "/" || pathname === "/results";
  return pathname === to;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const quota = useStudio((s) => s.quota);
  const pending = useStudio((s) => s.results.some((r) => r.status === "pending"));

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <StudioSync />
      <header className="relative z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-3 md:h-16 md:px-5">
          <Link to="/" className="shrink-0 font-display text-lg font-semibold tracking-tight md:text-xl">
            VELA
          </Link>
          <nav className="hidden min-w-0 flex-1 md:block">
            <div className="mx-auto flex max-w-2xl items-center justify-center gap-1 rounded-full bg-muted p-1">
              {NAV.map((item) => {
                const active = isActive(pathname, item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span
              className={cn(
                "hidden items-center gap-2 rounded-full border border-border px-3 py-1 text-[11px] font-medium sm:inline-flex",
                quota?.engine === false ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  pending ? "bg-foreground animate-pulse" : quota?.engine === false ? "bg-muted-foreground" : "bg-foreground",
                )}
              />
              {pending ? "Rendering" : quota?.engine === false ? "Engine offline" : "Always free"}
            </span>
          </div>
        </div>
      </header>

      <main
        key={pathname}
        className="page-enter min-h-0 min-w-0 flex-1 overflow-hidden pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <div className="grid h-[4.25rem] grid-cols-6">
          {NAV.map((item) => {
            const active = isActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-150",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-[background-color,transform] duration-150",
                    active ? "bg-muted" : "",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
