import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { citiesQuery, doctorsQuery, governoratesQuery, specialtiesQuery } from "@/lib/queries";
import { DoctorCard } from "@/components/site/doctor-card";

type DoctorsSearch = {
  q?: string;
  gov?: string;
  city?: string;
  specialty?: string;
};

export const Route = createFileRoute("/doctors/")({
  validateSearch: (s: Record<string, unknown>): DoctorsSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
    gov: typeof s.gov === "string" ? s.gov : undefined,
    city: typeof s.city === "string" ? s.city : undefined,
    specialty: typeof s.specialty === "string" ? s.specialty : undefined,
  }),
  head: () => ({
    meta: [
      { title: "دليل الطبيبات في مصر" },
      { name: "description", content: "تصفّحي القائمة الكاملة للطبيبات بمختلف التخصصات في جميع محافظات مصر." },
      { property: "og:title", content: "دليل الطبيبات في مصر" },
      { property: "og:url", content: "/doctors" },
    ],
    links: [{ rel: "canonical", href: "/doctors" }],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    context.queryClient.prefetchQuery(governoratesQuery);
    context.queryClient.prefetchQuery(specialtiesQuery);
    context.queryClient.prefetchQuery(
      doctorsQuery({ q: deps.q, governorateId: deps.gov ?? null, cityId: deps.city ?? null, specialty: deps.specialty ?? null }),
    );
  },
  component: DoctorsPage,
});

function DoctorsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: govs } = useSuspenseQuery(governoratesQuery);
  const { data: specialties } = useSuspenseQuery(specialtiesQuery);
  // Default to Fayoum when no governorate is selected
  const fayoumId = govs.find((g) => g.slug === "fayoum")?.id ?? null;
  const effectiveGov = search.gov ?? fayoumId ?? null;
  const { data: cities } = useSuspenseQuery(citiesQuery(effectiveGov));
  const { data: doctors } = useSuspenseQuery(
    doctorsQuery({
      q: search.q,
      governorateId: effectiveGov,
      cityId: search.city ?? null,
      specialty: search.specialty ?? null,
    }),
  );

  const update = (patch: Partial<DoctorsSearch>) =>
    navigate({ search: (prev: DoctorsSearch) => ({ ...prev, ...patch }), replace: true });

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link> / دليل الطبيبات
        </p>
        <h1 className="mt-1 text-3xl md:text-4xl font-extrabold">دليل الطبيبات</h1>
        <p className="text-muted-foreground mt-1">{doctors.length} طبيبة مطابقة لبحثك</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_180px_180px_200px] mb-6 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <label className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search.q ?? ""}
            onChange={(e) => update({ q: e.target.value || undefined })}
            placeholder="ابحثي باسم الطبيبة..."
            className="w-full rounded-xl bg-background px-9 py-2.5 text-sm border border-input focus:border-primary outline-none"
          />
        </label>
        <select
          value={effectiveGov ?? ""}
          onChange={(e) => update({ gov: e.target.value || undefined, city: undefined })}
          className="rounded-xl bg-background px-3 py-2.5 text-sm border border-input focus:border-primary"
        >
          <option value="">كل المحافظات</option>
          {govs.map((g) => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
        </select>
        <select
          value={search.city ?? ""}
          onChange={(e) => update({ city: e.target.value || undefined })}
          disabled={!effectiveGov}
          className="rounded-xl bg-background px-3 py-2.5 text-sm border border-input focus:border-primary disabled:opacity-60"
        >
          <option value="">كل المناطق</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
        <select
          value={search.specialty ?? ""}
          onChange={(e) => update({ specialty: e.target.value || undefined })}
          className="rounded-xl bg-background px-3 py-2.5 text-sm border border-input focus:border-primary"
        >
          <option value="">كل التخصصات</option>
          {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {doctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          لا توجد طبيبات مطابقة. جرّبي تغيير عوامل التصفية.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      )}
    </div>
  );
}