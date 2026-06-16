import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { citiesQuery, governoratesQuery } from "@/lib/queries";
import { uploadLicense, uploadPublicDoctorImage } from "@/lib/storage";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "انضمي كطبيبة — دليل دكتورات النساء" },
      { name: "description", content: "نموذج تسجيل الطبيبات في الدليل. متاح للإناث فقط، وكل الطلبات تخضع للمراجعة." },
      { property: "og:title", content: "انضمي كطبيبة" },
      { property: "og:url", content: "/register" },
    ],
    links: [{ rel: "canonical", href: "/register" }],
  }),
  loader: ({ context }) => context.queryClient.prefetchQuery(governoratesQuery),
  component: RegisterPage,
});

const schema = z.object({
  doctor_name: z.string().trim().min(2, "الاسم قصير").max(200),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("بريد غير صحيح").max(200),
  governorate_id: z.string().uuid("اختاري المحافظة"),
  city_id: z.string().uuid().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  specialty: z.string().trim().min(2).max(200),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  map_url: z.string().trim().url("رابط غير صحيح").optional().or(z.literal("")),
  confirmed_female: z.literal(true, { errorMap: () => ({ message: "يجب تأكيد الإقرار" }) }),
});

function RegisterPage() {
  const { data: govs } = useSuspenseQuery(governoratesQuery);
  const [govId, setGovId] = useState("");
  const { data: cities } = useSuspenseQuery(citiesQuery(govId || null));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const parsed = schema.safeParse({
      ...raw,
      confirmed_female: raw.confirmed_female === "on",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const imageFile = (fd.get("image") as File) || null;
      const licenseFile = (fd.get("license") as File) || null;
      let image_url: string | null = null;
      let license_url: string | null = null;
      if (imageFile && imageFile.size > 0) image_url = await uploadPublicDoctorImage(imageFile);
      if (licenseFile && licenseFile.size > 0) license_url = await uploadLicense(licenseFile);

      const gov = govs.find((g) => g.id === parsed.data.governorate_id);
      const city = cities.find((c) => c.id === parsed.data.city_id);

      const { error } = await supabase.from("applications").insert({
        doctor_name: parsed.data.doctor_name,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp || null,
        email: parsed.data.email,
        governorate_id: parsed.data.governorate_id,
        city_id: parsed.data.city_id || null,
        address: parsed.data.address || null,
        specialty: parsed.data.specialty,
        bio: parsed.data.bio || null,
        map_url: parsed.data.map_url || null,
        image_url,
        license_url,
        confirmed_female: true,
      });
      if (error) throw error;
      void gov; void city;
      setDone(true);
      toast.success("تم استلام طلبك بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold">تم استلام طلبك بنجاح</h1>
        <p className="mt-2 text-muted-foreground">سيتم مراجعة بياناتك من قِبَل الإدارة، وستظهرين في الدليل بعد الموافقة.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold">انضمي للدليل</h1>
      <p className="text-muted-foreground mt-1">سجّلي بياناتك ليتم نشرها بعد المراجعة.</p>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-900/20 p-4 text-amber-900 dark:text-amber-100">
        <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
        <p className="text-sm font-medium">
          متاح التسجيل للطبيبات الإناث فقط، وسيتم مراجعة جميع الطلبات قبل النشر.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 card-surface rounded-2xl border border-border/60 p-6">
        <Row label="الاسم الكامل *" name="doctor_name" required />
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="رقم الهاتف *" name="phone" required />
          <Row label="رقم واتساب" name="whatsapp" />
        </div>
        <Row label="البريد الإلكتروني *" name="email" type="email" required />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="المحافظة *">
            <select name="governorate_id" required value={govId} onChange={(e) => setGovId(e.target.value)} className={inputCls}>
              <option value="">اختاري المحافظة</option>
              {govs.map((g) => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
            </select>
          </Field>
          <Field label="المدينة / المنطقة">
            <select name="city_id" disabled={!govId} className={inputCls + " disabled:opacity-60"}>
              <option value="">اختاري المنطقة</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </Field>
        </div>
        <Row label="عنوان العيادة" name="address" />
        <Row label="التخصص *" name="specialty" defaultValue="نساء وتوليد" required />
        <Field label="نبذة عنك">
          <textarea name="bio" rows={4} className={inputCls} />
        </Field>
        <Row label="رابط الموقع على Google Maps" name="map_url" type="url" placeholder="https://maps.google.com/..." />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="صورة شخصية"><input name="image" type="file" accept="image/*" className={inputCls} /></Field>
          <Field label="إثبات الترخيص"><input name="license" type="file" accept="image/*,.pdf" className={inputCls} /></Field>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirmed_female" required className="mt-1 h-4 w-4 accent-primary" />
          <span>أؤكد أنني طبيبة أنثى وأتحمل مسؤولية صحة البيانات.</span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
        </button>
        <p className="text-xs text-muted-foreground text-center">حالة الطلب: قيد المراجعة (Pending Review)</p>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-xl bg-background px-3 py-2.5 text-sm border border-input focus:border-primary outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
function Row(props: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string; placeholder?: string }) {
  return (
    <Field label={props.label}>
      <input
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        className={inputCls}
      />
    </Field>
  );
}