import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, MessageCircle, ArrowRight } from "lucide-react";
import { doctorQuery } from "@/lib/queries";
import { DoctorImage } from "@/components/site/doctor-image";

export const Route = createFileRoute("/doctors/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(doctorQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: loaderData ? `د. ${loaderData.name} — ${loaderData.specialty}` : "ملف الطبيبة" },
      { name: "description", content: loaderData?.bio?.slice(0, 160) ?? "ملف تفصيلي للطبيبة." },
      { property: "og:title", content: loaderData ? `د. ${loaderData.name}` : "ملف الطبيبة" },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: `/doctors/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/doctors/${params.id}` }],
    scripts: loaderData
      ? [{
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Physician",
            name: `د. ${loaderData.name}`,
            medicalSpecialty: "Gynecology",
            telephone: loaderData.phone ?? undefined,
            address: [loaderData.governorate, loaderData.city, loaderData.address].filter(Boolean).join(", "),
          }),
        }]
      : [],
  }),
  errorComponent: ({ error }) => (
    <div className="container mx-auto p-10 text-center">
      <p className="text-destructive">حدث خطأ: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="container mx-auto p-10 text-center">
      <p className="text-muted-foreground">لم نعثر على هذه الطبيبة.</p>
      <Link to="/doctors" className="text-primary mt-2 inline-block">عودة للدليل</Link>
    </div>
  ),
  component: DoctorProfile,
});

function DoctorProfile() {
  const params = Route.useParams();
  const { data: doctor } = useSuspenseQuery(doctorQuery(params.id));
  if (!doctor) return null;
  const whatsapp = doctor.whatsapp?.replace(/\D/g, "");

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link to="/doctors" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowRight className="h-4 w-4" /> العودة للدليل
      </Link>

      <div className="card-surface mt-4 rounded-3xl border border-border/60 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <DoctorImage path={doctor.image_url} alt={doctor.name} size={140} className="shrink-0" />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold">د. {doctor.name}</h1>
            <p className="mt-1 text-primary font-semibold">{doctor.specialty}</p>
            <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[doctor.governorate, doctor.city, doctor.address].filter(Boolean).join(" — ") || "العنوان غير محدد"}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold">
                  <Phone className="h-4 w-4" /> {doctor.phone}
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
                  <MessageCircle className="h-4 w-4" /> واتساب
                </a>
              )}
              {doctor.email && (
                <a href={`mailto:${doctor.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
                  <Mail className="h-4 w-4" /> راسلي
                </a>
              )}
              {doctor.map_url && (
                <a href={doctor.map_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <MapPin className="h-4 w-4" /> فتح على الخريطة
                </a>
              )}
            </div>
          </div>
        </div>

        {doctor.bio && (
          <section className="mt-8 border-t border-border pt-6">
            <h2 className="text-lg font-bold mb-2">نبذة عن الطبيبة</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{doctor.bio}</p>
          </section>
        )}

        <section className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
          {doctor.governorate && (
            <div className="rounded-xl bg-secondary/60 p-3"><span className="text-muted-foreground">المحافظة: </span><b>{doctor.governorate}</b></div>
          )}
          {doctor.city && (
            <div className="rounded-xl bg-secondary/60 p-3"><span className="text-muted-foreground">المنطقة: </span><b>{doctor.city}</b></div>
          )}
        </section>
      </div>
    </div>
  );
}