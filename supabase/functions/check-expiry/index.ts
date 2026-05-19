import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Check for expired profiles
    const { data: expiredProfiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .lt("access_end", new Date().toISOString())
      .eq("access_status", "active");

    if (fetchError) throw fetchError;

    const results = [];

    for (const profile of (expiredProfiles || [])) {
      // 2. Update status to expired
      await supabase
        .from("profiles")
        .update({ access_status: "expired" })
        .eq("id", profile.id);

      // 3. Create access request
      const { data: request } = await supabase
        .from("access_requests")
        .insert({
          user_id: profile.id,
          user_email: profile.email,
          type: "renewal",
          message: "Acesso expirado automaticamente.",
        })
        .select()
        .single();

      // 4. Notify admin (calling the other edge function)
      // Using internal URL if possible, but simplest is to just call it via fetch
      await fetch(`${SUPABASE_URL}/functions/v1/notify-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          user_email: profile.email,
          user_name: profile.full_name,
          type: "renewal",
          message: "Acesso expirado automaticamente.",
        }),
      });

      results.push({ email: profile.email, status: "expired" });
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});