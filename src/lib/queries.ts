import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Doctor = Tables<"doctors">;
export type Governorate = Tables<"governorates">;
export type City = Tables<"cities">;
export type Application = Tables<"applications">;
export type ContactMessage = Tables<"contact_messages">;

export const governoratesQuery = queryOptions({
  queryKey: ["governorates"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("governorates")
      .select("*")
      .order("name_ar");
    if (error) throw error;
    return data ?? [];
  },
});

export const citiesQuery = (governorateId?: string | null) =>
  queryOptions({
    queryKey: ["cities", governorateId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("cities").select("*").order("name_ar");
      if (governorateId) q = q.eq("governorate_id", governorateId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const featuredDoctorsQuery = queryOptions({
  queryKey: ["doctors", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("verified", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return data ?? [];
  },
});

export type DoctorFilters = {
  q?: string;
  governorateId?: string | null;
  cityId?: string | null;
  specialty?: string | null;
  page?: number;
  limit?: number;
};

export const doctorsQuery = (filters: DoctorFilters = {}) =>
  queryOptions({
    queryKey: ["doctors", "list", filters],
    queryFn: async () => {
      let q = supabase
        .from("doctors")
        .select("*", { count: "exact" })
        .eq("verified", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (filters.governorateId) q = q.eq("governorate_id", filters.governorateId);
      if (filters.cityId) q = q.eq("city_id", filters.cityId);
      if (filters.specialty) q = q.eq("specialty", filters.specialty);
      if (filters.q && filters.q.trim()) q = q.ilike("name", `%${filters.q.trim()}%`);

      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        q = q.range(from, to);
      }

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0 };
    },
  });

export const specialtiesQuery = queryOptions({
  queryKey: ["specialties"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("doctors")
      .select("specialty")
      .eq("verified", true);
    if (error) throw error;
    const set = new Set<string>();
    for (const row of data ?? []) if (row.specialty) set.add(row.specialty);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  },
});

export const doctorQuery = (id: string) =>
  queryOptions({
    queryKey: ["doctor", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", id)
        .eq("verified", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const statsQuery = queryOptions({
  queryKey: ["public-stats"],
  queryFn: async () => {
    const [doctors, govs] = await Promise.all([
      supabase.from("doctors").select("id", { count: "exact", head: true }).eq("verified", true),
      supabase.from("governorates").select("id", { count: "exact", head: true }),
    ]);
    return {
      doctors: doctors.count ?? 0,
      governorates: govs.count ?? 0,
    };
  },
});

// Admin
export const adminAllDoctorsQuery = queryOptions({
  queryKey: ["admin", "doctors"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const adminApplicationsQuery = queryOptions({
  queryKey: ["admin", "applications"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});