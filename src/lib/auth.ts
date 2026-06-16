import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { userId, loading };
}

export function useIsAdmin() {
  const { userId, loading: sLoading } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (sLoading) return;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // Try to bootstrap admin if there are none yet (first signup)
      await supabase.rpc("claim_admin_if_first", { _user_id: userId });
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, sLoading]);
  return { userId, isAdmin, loading: sLoading || isAdmin === null };
}