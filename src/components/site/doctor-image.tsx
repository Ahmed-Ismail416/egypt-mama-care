import { useEffect, useState } from "react";
import { getSignedImage } from "@/lib/storage";
import { UserRound } from "lucide-react";

export function DoctorImage({
  path,
  alt,
  className = "",
  size = 96,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  size?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedImage(path).then((u) => !cancelled && setSrc(u));
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!src) {
    return (
      <div
        className={`grid place-items-center rounded-full bg-gradient-to-br from-brand-pink to-brand-purple/30 text-primary ${className}`}
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        <UserRound className="h-1/2 w-1/2" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}