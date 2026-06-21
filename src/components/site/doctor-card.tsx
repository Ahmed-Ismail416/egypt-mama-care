import { Link } from "@tanstack/react-router";
import { MapPin, Phone, MessageCircle, ArrowLeft, Sparkles } from "lucide-react";
import { DoctorImage } from "./doctor-image";
import type { Doctor } from "@/lib/queries";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const whatsapp = doctor.whatsapp?.replace(/\D/g, "");
  return (
    <article className="card-surface rounded-2xl border border-border/60 p-5 transition hover:shadow-glow">
      <div className="flex items-start gap-4">
        <DoctorImage path={doctor.image_url} alt={doctor.name} size={72} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg leading-tight truncate max-w-full">
              د. {doctor.name}
            </h3>
            {doctor.featured && (
              <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                <Sparkles className="h-3 w-3" /> مميزة
              </span>
            )}
          </div>
          <p className="text-sm text-primary font-medium mt-0.5">{doctor.specialty}</p>
          {(doctor.governorate || doctor.city || doctor.address) && (
            <p className="mt-2 text-sm text-muted-foreground flex items-start gap-1">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {[doctor.governorate, doctor.city, doctor.address].filter(Boolean).join(" — ")}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {doctor.phone && (
          <a
            href={`tel:${doctor.phone}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <Phone className="w-5 h-5 flex-shrink-0" />
          </a>
        )}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <MessageCircle className="h-3.5 w-3.5" /> واتساب
          </a>
        )}
        {doctor.map_url && (
          <a
            href={doctor.map_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary/60"
          >
            <MapPin className="h-3.5 w-3.5" /> على الخريطة
          </a>
        )}
        <Link
          to="/doctors/$id"
          params={{ id: doctor.id }}
          className="ms-auto inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          عرض التفاصيل <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
