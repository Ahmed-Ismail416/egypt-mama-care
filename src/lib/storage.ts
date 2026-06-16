import { supabase } from "@/integrations/supabase/client";

/** Resolve a stored path (e.g. "abc.jpg") in a bucket to a temporary signed URL. */
export async function getSignedImage(path: string | null | undefined, bucket = "doctor-images", expires = 3600) {
  if (!path) return null;
  // If it's already a full URL, return as-is
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  if (error) return null;
  return data.signedUrl;
}

export async function uploadPublicDoctorImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("doctor-images").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function uploadLicense(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("doctor-licenses").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}