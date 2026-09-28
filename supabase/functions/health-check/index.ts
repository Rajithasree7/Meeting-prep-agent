import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Check database
    let database: "connected" | "disconnected" = "disconnected";
    if (supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { error } = await supabase.from("contacts").select("id").limit(1);
        database = error ? "disconnected" : "connected";
      } catch {
        database = "disconnected";
      }
    }

    // Check Hindsight
    const hindsightKey = Deno.env.get("HINDSIGHT_API_KEY");
    const hindsightUrl = Deno.env.get("HINDSIGHT_BASE_URL");
    let hindsight: "connected" | "not_configured" | "disconnected" = "not_configured";
    if (hindsightKey && hindsightUrl) {
      try {
        const resp = await fetch(`${hindsightUrl}/health`, {
          headers: { Authorization: `Bearer ${hindsightKey}` },
        });
        hindsight = resp.ok ? "connected" : "disconnected";
      } catch {
        hindsight = "disconnected";
      }
    }

    // Check AI (Grok/xAI)
    const xaiKey = Deno.env.get("XAI_API_KEY");
    const ai = xaiKey ? "configured" : "not_configured";

    return new Response(
      JSON.stringify({ database, hindsight, ai }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        database: "disconnected",
        hindsight: "not_configured",
        ai: "not_configured",
        error: err.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
