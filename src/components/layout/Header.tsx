"use client";

import { History, LayoutDashboard, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserProfile } from "@/components/layout/UserProfile";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative transition-transform duration-300 group-hover:scale-110">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon graphics.webp" alt="Salary Calculator" className="h-9 w-auto dark:brightness-0 dark:invert" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight sm:text-base">
              Salary Calculator
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase hidden sm:block">
              Part-Time Dashboard
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <UserProfile />
          <ThemeToggle />

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl md:hidden" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon graphics.webp" alt="Salary Calculator" className="h-10 w-auto dark:brightness-0 dark:invert" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Salary Calculator</p>
                    <p className="text-xs text-muted-foreground">Part-Time Dashboard</p>
                  </div>
                </div>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 rounded-xl h-11",
                          isActive && "bg-primary/10 text-primary font-semibold"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
