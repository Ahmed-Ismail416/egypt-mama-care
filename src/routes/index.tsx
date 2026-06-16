import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, Stethoscope, ShieldCheck, Heart, Sparkles } from "lucide-react";
import { featuredDoctorsQuery, governoratesQuery, statsQuery, citiesQuery } from "@/lib/queries";
import { DoctorCard } from "@/components/site/doctor-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "دليل دكتورات النساء والتوليد في مصر" },
      { name: "description", content: "ابحثي بسهولة عن أفضل الطبيبات المتخصصات في النساء والتوليد بجميع محافظات مصر، مع أرقام التواصل، العناوين، وروابط الخرائط." },
      { property: "og:title", content: "دليل دكتورات النساء والتوليد في مصر" },
      { property: "og:description", content: "أكبر دليل عربي للطبيبات في جميع محافظات مصر." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(featuredDoctorsQuery);
    context.queryClient.prefetchQuery(governoratesQuery);
    context.queryClient.prefetchQuery(statsQuery);
  },
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Featured />
      <JoinCTA />
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const { data: governorates } = useSuspenseQuery(governoratesQuery);
  const [q, setQ] = useState("");
  const [governorateId, setGovernorateId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const { data: cities } = useSuspenseQuery(citiesQuery(governorateId || null));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/doctors",
      search: {
        q: q || undefined,
        gov: governorateId || undefined,
        city: cityId || undefined,
      },
    });
  }

  return (
    <section className="hero-surface relative overflow-hidden">
      <div className="container mx-auto px-4 pt-14 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-xs font-semibold text-primary border border-border/70">
            <ShieldCheck className="h-3.5 w-3.5" /> طبيبات موثقات فقط
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            ابحثي عن دكتورة <span className="text-primary">نساء وتوليد</span> قريبة منك
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            دليل شامل لجميع محافظات مصر — مع أرقام تواصل، عناوين العيادات، وروابط الخرائط.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-3 shadow-glow grid gap-2 md:grid-cols-[1fr_180px_180px_auto]"
          >
            <label className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحثي باسم الطبيبة..."
                className="w-full rounded-xl bg-background px-9 py-3 text-sm outline-none border border-input focus:border-primary"
              />
            </label>
            <select
              value={governorateId}
              onChange={(e) => {
                setGovernorateId(e.target.value);
                setCityId("");
              }}
              className="rounded-xl bg-background px-3 py-3 text-sm border border-input focus:border-primary"
            >
              <option value="">كل المحافظات</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{g.name_ar}</option>
              ))}
            </select>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!governorateId}
              className="rounded-xl bg-background px-3 py-3 text-sm border border-input focus:border-primary disabled:opacity-60"
            >
              <option value="">كل المناطق</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ar}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              بحث
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { data: stats } = useSuspenseQuery(statsQuery);
  const items = [
    { icon: Stethoscope, label: "طبيبة مسجّلة", value: stats.doctors },
    { icon: MapPin, label: "محافظة", value: stats.governorates },
    { icon: Heart, label: "خدمة مجانية", value: "100%" },
  ];
  return (
    <section className="container mx-auto px-4 -mt-10">
      <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card-surface rounded-2xl border border-border/60 p-5 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <div className="text-2xl font-extrabold">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  const { data: featured } = useSuspenseQuery(featuredDoctorsQuery);
  return (
    <section className="container mx-auto px-4 mt-16">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> طبيبات مميزات
          </h2>
          <p className="text-muted-foreground text-sm mt-1">نخبة من الطبيبات الأكثر تقييماً وثقة</p>
        </div>
        <Link to="/doctors" className="text-sm text-primary font-semibold hover:underline">
          عرض الكل ←
        </Link>
      </div>
      {featured.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          لم تتم إضافة طبيبات مميزات بعد. كوني أول من ينضم!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      )}
    </section>
  );
}

function JoinCTA() {
  return (
    <section className="container mx-auto px-4 mt-20">
      <div className="hero-surface rounded-3xl border border-border/60 p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold">هل أنتِ طبيبة نساء وتوليد؟</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          انضمي لأكبر دليل عربي للطبيبات في مصر. التسجيل مجاني ويصلك المرضى مباشرة.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90"
        >
          سجّلي الآن مجاناً
        </Link>
      </div>
    </section>
  );
}
