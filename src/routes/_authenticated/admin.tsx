import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LayoutDashboard, Stethoscope, Inbox, MapPin as MapIcon, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminAllDoctorsQuery,
  adminApplicationsQuery,
  governoratesQuery,
  type Application,
  type Doctor,
  type Governorate,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type Tab = "overview" | "doctors" | "applications" | "places";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "doctors", label: "الطبيبات", icon: Stethoscope },
    { id: "applications", label: "الطلبات", icon: Inbox },
    { id: "places", label: "المحافظات والمناطق", icon: MapIcon },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">إدارة الطبيبات والطلبات والمناطق</p>
        </div>
        <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary/80">
          <LogOut className="h-4 w-4" /> خروج
        </button>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && <Overview />}
      {tab === "doctors" && <DoctorsAdmin />}
      {tab === "applications" && <ApplicationsAdmin />}
      {tab === "places" && <PlacesAdmin />}
    </div>
  );
}

function Overview() {
  const { data: doctors = [] } = useQuery(adminAllDoctorsQuery);
  const { data: apps = [] } = useQuery(adminApplicationsQuery);
  const pending = apps.filter((a) => a.status === "pending").length;
  const verified = doctors.filter((d) => d.verified).length;
  const featured = doctors.filter((d) => d.featured).length;

  const cards = [
    { label: "إجمالي الطبيبات", value: doctors.length, tone: "bg-secondary" },
    { label: "موثّقات", value: verified, tone: "bg-emerald-100 dark:bg-emerald-900/40" },
    { label: "مميزات", value: featured, tone: "bg-amber-100 dark:bg-amber-900/40" },
    { label: "طلبات معلّقة", value: pending, tone: "bg-rose-100 dark:bg-rose-900/40" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-2xl p-5 ${c.tone}`}>
          <div className="text-3xl font-extrabold">{c.value}</div>
          <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function DoctorsAdmin() {
  const qc = useQueryClient();
  const { data: doctors = [], isLoading } = useQuery(adminAllDoctorsQuery);
  const { data: govs = [] } = useQuery(governoratesQuery);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [creating, setCreating] = useState(false);

  async function remove(id: string) {
    if (!confirm("حذف هذه الطبيبة؟")) return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["doctors"] });
    qc.invalidateQueries({ queryKey: ["admin", "doctors"] });
  }

  async function toggle(id: string, field: "verified" | "featured", value: boolean) {
    const { error } = await supabase.from("doctors").update({ [field]: value }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["doctors"] });
    qc.invalidateQueries({ queryKey: ["admin", "doctors"] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{doctors.length} طبيبة</p>
        <button onClick={() => setCreating(true)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">+ إضافة طبيبة</button>
      </div>
      {isLoading ? <p>...</p> : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-right">
              <tr><th className="p-3">الاسم</th><th className="p-3">المحافظة</th><th className="p-3">الهاتف</th><th className="p-3">موثّقة</th><th className="p-3">مميزة</th><th className="p-3">إجراءات</th></tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="p-3 font-semibold">د. {d.name}</td>
                  <td className="p-3 text-muted-foreground">{d.governorate ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{d.phone ?? "—"}</td>
                  <td className="p-3"><input type="checkbox" checked={d.verified} onChange={(e) => toggle(d.id, "verified", e.target.checked)} className="h-4 w-4 accent-primary" /></td>
                  <td className="p-3"><input type="checkbox" checked={d.featured} onChange={(e) => toggle(d.id, "featured", e.target.checked)} className="h-4 w-4 accent-primary" /></td>
                  <td className="p-3 space-x-1 space-x-reverse">
                    <button onClick={() => setEditing(d)} className="text-primary text-xs font-semibold">تعديل</button>
                    <button onClick={() => remove(d.id)} className="text-destructive text-xs font-semibold">حذف</button>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا توجد طبيبات بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <DoctorForm
          doctor={editing}
          govs={govs}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => {
            setEditing(null); setCreating(false);
            qc.invalidateQueries({ queryKey: ["doctors"] });
            qc.invalidateQueries({ queryKey: ["admin", "doctors"] });
          }}
        />
      )}
    </div>
  );
}

function DoctorForm({ doctor, govs, onClose, onSaved }: { doctor: Doctor | null; govs: Governorate[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const gov = govs.find((g) => g.id === fd.governorate_id);
    const payload = {
      name: fd.name,
      phone: fd.phone || null,
      whatsapp: fd.whatsapp || null,
      email: fd.email || null,
      governorate_id: fd.governorate_id || null,
      governorate: gov?.name_ar ?? null,
      city: fd.city || null,
      address: fd.address || null,
      specialty: fd.specialty || "نساء وتوليد",
      bio: fd.bio || null,
      map_url: fd.map_url || null,
      image_url: fd.image_url || null,
      verified: fd.verified === "on",
      featured: fd.featured === "on",
    };
    const res = doctor
      ? await supabase.from("doctors").update(payload).eq("id", doctor.id)
      : await supabase.from("doctors").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("تم الحفظ");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur grid place-items-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-background rounded-2xl border border-border p-6 max-h-[90vh] overflow-y-auto grid gap-3"
      >
        <h2 className="text-xl font-bold">{doctor ? "تعديل طبيبة" : "إضافة طبيبة"}</h2>
        <input name="name" defaultValue={doctor?.name} required placeholder="الاسم" className={inputCls} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="phone" defaultValue={doctor?.phone ?? ""} placeholder="الهاتف" className={inputCls} />
          <input name="whatsapp" defaultValue={doctor?.whatsapp ?? ""} placeholder="واتساب" className={inputCls} />
        </div>
        <input name="email" defaultValue={doctor?.email ?? ""} type="email" placeholder="البريد" className={inputCls} />
        <div className="grid sm:grid-cols-2 gap-3">
          <select name="governorate_id" defaultValue={doctor?.governorate_id ?? ""} className={inputCls}>
            <option value="">المحافظة</option>
            {govs.map((g) => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
          </select>
          <input name="city" defaultValue={doctor?.city ?? ""} placeholder="المدينة / المنطقة" className={inputCls} />
        </div>
        <input name="address" defaultValue={doctor?.address ?? ""} placeholder="عنوان العيادة" className={inputCls} />
        <input name="specialty" defaultValue={doctor?.specialty ?? "نساء وتوليد"} placeholder="التخصص" className={inputCls} />
        <textarea name="bio" defaultValue={doctor?.bio ?? ""} rows={3} placeholder="نبذة" className={inputCls} />
        <input name="map_url" defaultValue={doctor?.map_url ?? ""} placeholder="رابط Google Maps" className={inputCls} />
        <input name="image_url" defaultValue={doctor?.image_url ?? ""} placeholder="مسار الصورة في التخزين أو رابط كامل" className={inputCls} />
        <div className="flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" name="verified" defaultChecked={doctor?.verified ?? true} className="h-4 w-4 accent-primary" /> موثّقة (تظهر علناً)</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={doctor?.featured ?? false} className="h-4 w-4 accent-primary" /> مميزة</label>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="rounded-full bg-secondary px-4 py-2 text-sm">إلغاء</button>
          <button disabled={saving} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "..." : "حفظ"}</button>
        </div>
      </form>
    </div>
  );
}

function ApplicationsAdmin() {
  const qc = useQueryClient();
  const { data: apps = [], isLoading } = useQuery(adminApplicationsQuery);
  const { data: govs = [] } = useQuery(governoratesQuery);

  async function approve(app: Application) {
    const gov = govs.find((g) => g.id === app.governorate_id);
    const { error: insErr } = await supabase.from("doctors").insert({
      name: app.doctor_name,
      phone: app.phone,
      whatsapp: app.whatsapp,
      email: app.email,
      governorate_id: app.governorate_id,
      city_id: app.city_id,
      governorate: gov?.name_ar ?? null,
      address: app.address,
      specialty: app.specialty,
      bio: app.bio,
      map_url: app.map_url,
      image_url: app.image_url,
      verified: true,
    });
    if (insErr) return toast.error(insErr.message);
    await supabase.from("applications").update({ status: "approved" }).eq("id", app.id);
    toast.success("تمت الموافقة وتم النشر");
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["doctors"] });
  }

  async function reject(id: string) {
    const note = prompt("سبب الرفض (اختياري):") ?? "";
    const { error } = await supabase.from("applications").update({ status: "rejected", admin_note: note }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الرفض");
    qc.invalidateQueries({ queryKey: ["admin", "applications"] });
  }

  if (isLoading) return <p>...</p>;

  return (
    <div className="grid gap-3">
      {apps.length === 0 && <p className="text-muted-foreground text-center py-10">لا توجد طلبات.</p>}
      {apps.map((a) => (
        <article key={a.id} className="card-surface rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold">د. {a.doctor_name}</h3>
              <p className="text-sm text-muted-foreground">{a.specialty} — {a.email} — {a.phone}</p>
              {a.address && <p className="text-sm text-muted-foreground mt-1">{a.address}</p>}
              {a.bio && <p className="text-sm mt-2 max-w-2xl">{a.bio}</p>}
              <div className="flex gap-3 text-xs mt-2">
                {a.map_url && <a href={a.map_url} target="_blank" rel="noreferrer" className="text-primary">خريطة</a>}
                {a.image_url && <span className="text-muted-foreground">صورة: {a.image_url.slice(0, 12)}...</span>}
                {a.license_url && <span className="text-muted-foreground">ترخيص مرفق</span>}
              </div>
            </div>
            <StatusBadge status={a.status} />
          </div>
          {a.status === "pending" && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => approve(a)} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">موافقة ونشر</button>
              <button onClick={() => reject(a.id)} className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">رفض</button>
            </div>
          )}
          {a.status === "rejected" && a.admin_note && <p className="text-xs text-destructive mt-2">سبب الرفض: {a.admin_note}</p>}
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Application["status"] }) {
  const map = {
    pending: { text: "قيد المراجعة", cls: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
    approved: { text: "تمت الموافقة", cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100" },
    rejected: { text: "مرفوض", cls: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100" },
  } as const;
  const x = map[status];
  return <span className={`text-xs rounded-full px-3 py-1 font-semibold ${x.cls}`}>{x.text}</span>;
}

function PlacesAdmin() {
  const qc = useQueryClient();
  const { data: govs = [] } = useQuery(governoratesQuery);
  async function addGov(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const { error } = await supabase.from("governorates").insert({ name_ar: fd.name_ar, slug: fd.slug });
    if (error) return toast.error(error.message);
    toast.success("تمت الإضافة");
    e.currentTarget.reset();
    qc.invalidateQueries({ queryKey: ["governorates"] });
  }
  async function delGov(id: string) {
    if (!confirm("حذف؟")) return;
    const { error } = await supabase.from("governorates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["governorates"] });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <form onSubmit={addGov} className="card-surface rounded-2xl border border-border p-5 grid gap-3 h-fit">
        <h3 className="font-bold">إضافة محافظة</h3>
        <input name="name_ar" required placeholder="الاسم بالعربية" className={inputCls} />
        <input name="slug" required placeholder="slug (مثل cairo)" className={inputCls} />
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">إضافة</button>
      </form>
      <div className="card-surface rounded-2xl border border-border p-5">
        <h3 className="font-bold mb-3">المحافظات ({govs.length})</h3>
        <ul className="grid sm:grid-cols-2 gap-2">
          {govs.map((g) => (
            <li key={g.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span>{g.name_ar} <span className="text-muted-foreground text-xs">({g.slug})</span></span>
              <button onClick={() => delGov(g.id)} className="text-destructive text-xs">حذف</button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-3">إدارة المدن متاحة من خلال صفحة الطبيبات (الحقل النصي للمدينة).</p>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl bg-background px-3 py-2.5 text-sm border border-input focus:border-primary outline-none";