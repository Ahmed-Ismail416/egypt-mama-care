import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "الرئيسية" },
  { to: "/doctors", label: "دليل الطبيبات" },
  { to: "/register", label: "انضمي كطبيبة" },
  { to: "/contact", label: "تواصلي معنا" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-pink to-brand-purple text-white shadow-soft">
            <Heart className="h-5 w-5" fill="currentColor" />
          </span>
          <span className="hidden sm:inline text-foreground">دليل دكتورات النساء</span>
          <span className="sm:hidden text-foreground">الدليل</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={signedIn ? "/admin" : "/auth"}
            className="hidden sm:inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
          >
            {signedIn ? "لوحة التحكم" : "دخول الإدارة"}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
            aria-label="القائمة"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container mx-auto flex flex-col gap-1 p-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary/70"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={signedIn ? "/admin" : "/auth"}
              className="rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground text-center"
            >
              {signedIn ? "لوحة التحكم" : "دخول الإدارة"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}