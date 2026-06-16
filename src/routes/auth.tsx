import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function emailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const res = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
    setLoading(false);
    if (res.error) return toast.error(res.error.message);
    if (mode === "signup" && !res.data.session) {
      toast.success("تحقّقي من بريدك لتأكيد الحساب");
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/admin" });
    if (r.error) toast.error(r.error.message ?? "تعذّر تسجيل الدخول");
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <div className="card-surface rounded-3xl border border-border/60 p-8">
        <div className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-gradient-to-br from-brand-pink to-brand-purple text-white shadow-soft">
          <LogIn className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">
          أول حساب يُسجَّل في النظام يحصل تلقائياً على صلاحيات الإدارة.
        </p>

        <button onClick={google} className="mt-6 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary/60">
          المتابعة بحساب Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> أو <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={emailSubmit} className="grid gap-3">
          <input name="email" type="email" required placeholder="البريد الإلكتروني" className={inputCls} />
          <input name="password" type="password" required minLength={6} placeholder="كلمة المرور" className={inputCls} />
          <button disabled={loading} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {loading ? "..." : mode === "login" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "ليس لديكِ حساب؟ إنشاء حساب جديد" : "لديكِ حساب؟ سجّلي الدخول"}
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl bg-background px-3 py-2.5 text-sm border border-input focus:border-primary outline-none";