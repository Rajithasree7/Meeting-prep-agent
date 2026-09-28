import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function analyzeAndRetainPreference(
  userId: string,
  rating: string,
  improvementSuggestion: string | null
): Promise<{ preference: string | null }> {
  const xaiKey = Deno.env.get("XAI_API_KEY");
  const hindsightKey = Deno.env.get("HINDSIGHT_API_KEY");
  const hindsightUrl = Deno.env.get("HINDSIGHT_BASE_URL");

  let preference: string | null = null;

  // Use Grok to analyze feedback into a preference
  if (xaiKey) {
    try {
      const prompt = `A user rated a meeting preparation briefing as "${rating}".
${improvementSuggestion ? `They suggested: "${improvementSuggestion}"` : "No specific suggestion was provided."}

Based on this feedback, infer a concise user preference for future briefings. Return ONLY a single sentence preference statement, or "null" if no useful preference can be inferred.

Examples of good preferences:
- "Prefers concise meeting briefs with action items shown first"
- "Wants overdue commitments highlighted prominently"
- "Prefers suggested questions over suggested agenda"
- "Wants relationship context kept brief"`;

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xaiKey}`,
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: "You are a preference analysis assistant. Return only a single sentence or 'null'." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = (data.choices?.[0]?.message?.content ?? "").trim();
        if (content && content.toLowerCase() !== "null") {
          preference = content;
        }
      }
    } catch {
      // Grok analysis failed — continue without preference
    }
  }

  // Infer from rating if no specific preference
  if (!preference) {
    if (rating === "very_useful") {
      preference = "Prefers the current briefing format with detailed context and action items";
    } else if (rating === "not_useful" && improvementSuggestion) {
      preference = improvementSuggestion;
    }
  }

  // Retain in Hindsight
  if (preference && hindsightKey && hindsightUrl) {
    const bankId = `user-${userId}-prefs`;
    try {
      // Ensure bank exists
      await fetch(`${hindsightUrl}/v1/default/banks/${bankId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${hindsightKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
    } catch {
      // may already exist
    }

    try {
      await fetch(`${hindsightUrl}/v1/default/banks/${bankId}/retain`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hindsightKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ content: `User preference learned from feedback (rating: ${rating}): ${preference}` }],
        }),
      });
    } catch {
      // Hindsight retain failed — preference still saved to DB
    }
  }

  return { preference };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { contactId, briefing, rating, improvementSuggestion } = await req.json();

    if (!rating) {
      return new Response(
        JSON.stringify({ error: "rating is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user ID from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save feedback to database
    await supabase.from("memory_feedback").insert({
      user_id: user.id,
      contact_id: contactId || null,
      briefing: briefing || null,
      rating,
      improvement_suggestion: improvementSuggestion || null,
    });

    // Analyze and retain preference
    const { preference } = await analyzeAndRetainPreference(
      user.id,
      rating,
      improvementSuggestion || null
    );

    // Save preference to database
    if (preference) {
      // Upsert: try update first, then insert
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .eq("preference_key", "briefing_style")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_preferences")
          .update({ preference_value: preference, source: "inferred" })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_preferences").insert({
          user_id: user.id,
          preference_key: "briefing_style",
          preference_value: preference,
          source: "inferred",
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, preference }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
