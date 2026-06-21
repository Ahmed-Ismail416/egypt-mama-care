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
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setSrc(null);
    getSignedImage(path).then((u) => {
      if (!cancelled) {
        setSrc(u);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      {!src || !loaded ? (
        <div className="grid place-items-center w-full h-full bg-gradient-to-br from-brand-pink to-brand-purple/30 text-primary">
          <span>👩‍⚕️</span>
        </div>
      ) : null}
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full rounded-full object-cover ${loaded ? "block" : "hidden"}`}
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}

