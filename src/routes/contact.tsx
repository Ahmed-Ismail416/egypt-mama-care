import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصلي معنا — دليل دكتورات النساء" },
      { name: "description", content: "تواصلي مع فريق دليل دكتورات النساء والتوليد في مصر." },
      { property: "og:title", content: "تواصلي معنا" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(5000),
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setSending(false);
    if (error) toast.error(error.message);
    else {
      toast.success("تم إرسال الرسالة بنجاح");
      form.reset();
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 grid md:grid-cols-[1fr_320px] gap-6">
      <form onSubmit={onSubmit} className="card-surface rounded-2xl border border-border/60 p-6 grid gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold">تواصلي معنا</h1>
        <p className="text-muted-foreground text-sm -mt-2">سنرد عليكِ في أقرب وقت ممكن.</p>
        <input name="name" placeholder="الاسم" required className={inputCls} />
        <input name="email" type="email" placeholder="البريد الإلكتروني" required className={inputCls} />
        <input name="subject" placeholder="الموضوع (اختياري)" className={inputCls} />
        <textarea name="message" rows={6} placeholder="رسالتك..." required className={inputCls} />
        <button disabled={sending} className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {sending ? "جاري الإرسال..." : "إرسال"}
        </button>
      </form>
      <aside className="card-surface rounded-2xl border border-border/60 p-6 space-y-4 h-fit">
        <h2 className="font-bold text-lg">معلومات التواصل</h2>
        <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-primary" /> info@example.com</div>
        <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-primary" /> +20 100 000 0000</div>
        <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-primary" /> القاهرة، مصر</div>
      </aside>
    </div>
  );
}

const inputCls = "w-full rounded-xl bg-background px-3 py-2.5 text-sm border border-input focus:border-primary outline-none";