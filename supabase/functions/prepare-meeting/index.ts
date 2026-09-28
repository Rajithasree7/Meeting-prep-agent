import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Briefing {
  relationshipContext: string;
  recentDiscussions: string[];
  importantDecisions: string[];
  yourCommitments: string[];
  theirCommitments: string[];
  missedFollowUps: string[];
  openQuestions: string[];
  suggestedTalkingPoints: string[];
  suggestedAgenda: string[];
  memoryInsights: string[];
  metadata: {
    memoriesRecalled: number;
    preferencesApplied: number;
    source: "hindsight" | "fallback";
  };
}

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  summary: string | null;
  topics: string[];
  decisions: string[];
  user_commitments: string[];
  contact_commitments: string[];
  deadlines: Array<{ description: string; date: string; owner?: string }>;
  follow_ups: string[];
  open_questions: string[];
  important_facts: string[];
  raw_notes: string | null;
}

interface Commitment {
  id: string;
  description: string;
  owner: string;
  status: string;
  due_date: string | null;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  relationship_type: string;
  notes: string | null;
}

interface Preference {
  preference_key: string;
  preference_value: string;
}

async function recallFromHindsight(
  userId: string,
  contactName: string
): Promise<{ memories: string[]; error: string | null }> {
  const hindsightKey = Deno.env.get("HINDSIGHT_API_KEY");
  const hindsightUrl = Deno.env.get("HINDSIGHT_BASE_URL");

  if (!hindsightKey || !hindsightUrl) {
    return { memories: [], error: "Hindsight not configured" };
  }

  const bankId = `user-${userId}`;

  try {
    const response = await fetch(`${hindsightUrl}/v1/default/banks/${bankId}/recall`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hindsightKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `Tell me everything about ${contactName} — discussions, commitments, decisions, deadlines, open questions, relationship context`,
        top_k: 10,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { memories: [], error: `Hindsight recall error: ${response.status} ${errText}` };
    }

    const data = await response.json();

    // Hindsight returns memories in various formats — handle both
    let memories: string[] = [];
    if (Array.isArray(data.memories)) {
      memories = data.memories.map((m: Record<string, unknown>) =>
        typeof m === "string" ? m : (m.content as string) || (m.text as string) || JSON.stringify(m)
      );
    } else if (Array.isArray(data.results)) {
      memories = data.results.map((m: Record<string, unknown>) =>
        typeof m === "string" ? m : (m.content as string) || (m.text as string) || JSON.stringify(m)
      );
    } else if (typeof data.memory === "string") {
      memories = [data.memory];
    }

    return { memories, error: null };
  } catch (err) {
    return { memories: [], error: err.message };
  }
}

async function recallPreferencesFromHindsight(
  userId: string
): Promise<{ memories: string[]; error: string | null }> {
  const hindsightKey = Deno.env.get("HINDSIGHT_API_KEY");
  const hindsightUrl = Deno.env.get("HINDSIGHT_BASE_URL");

  if (!hindsightKey || !hindsightUrl) {
    return { memories: [], error: "Hindsight not configured" };
  }

  const bankId = `user-${userId}-prefs`;

  try {
    // Ensure bank exists
    try {
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

    const response = await fetch(`${hindsightUrl}/v1/default/banks/${bankId}/recall`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hindsightKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "What are this user's preferences for meeting preparation and briefings?",
        top_k: 5,
      }),
    });

    if (!response.ok) {
      return { memories: [], error: "recall error" };
    }

    const data = await response.json();
    let memories: string[] = [];
    if (Array.isArray(data.memories)) {
      memories = data.memories.map((m: Record<string, unknown>) =>
        typeof m === "string" ? m : (m.content as string) || (m.text as string) || JSON.stringify(m)
      );
    } else if (Array.isArray(data.results)) {
      memories = data.results.map((m: Record<string, unknown>) =>
        typeof m === "string" ? m : (m.content as string) || (m.text as string) || JSON.stringify(m)
      );
    }

    return { memories, error: null };
  } catch (err) {
    return { memories: [], error: err.message };
  }
}

async function generateBriefingWithGrok(
  contact: Contact,
  meetings: Meeting[],
  commitments: Commitment[],
  hindsightMemories: string[],
  preferences: Preference[],
  hindsightPrefMemories: string[]
): Promise<Briefing> {
  const xaiKey = Deno.env.get("XAI_API_KEY");
  if (!xaiKey) {
    throw new Error("XAI_API_KEY not configured");
  }

  const now = new Date().toISOString().split("T")[0];

  // Build context from recalled Hindsight memories
  const memoryContext = hindsightMemories.length > 0
    ? hindsightMemories.map((m, i) => `Memory ${i + 1}: ${m}`).join("\n")
    : "No memories recalled from Hindsight.";

  // Build context from meetings
  const meetingContext = meetings.map((m, i) => `
Meeting ${i + 1}: "${m.title}" on ${m.meeting_date}
${m.summary ? `Summary: ${m.summary}` : ""}
${m.topics.length > 0 ? `Topics: ${m.topics.join(", ")}` : ""}
${m.decisions.length > 0 ? `Decisions: ${m.decisions.join("; ")}` : ""}
${m.user_commitments.length > 0 ? `User commitments: ${m.user_commitments.join("; ")}` : ""}
${m.contact_commitments.length > 0 ? `Contact commitments: ${m.contact_commitments.join("; ")}` : ""}
${m.deadlines.length > 0 ? `Deadlines: ${m.deadlines.map(d => `${d.description} by ${d.date}`).join("; ")}` : ""}
${m.open_questions.length > 0 ? `Open questions: ${m.open_questions.join("; ")}` : ""}
${m.important_facts.length > 0 ? `Important facts: ${m.important_facts.join("; ")}` : ""}
`).join("\n---\n");

  // Build commitment context with overdue detection
  const openCommitments = commitments.filter((c) => c.status === "open");
  const overdueCommitments = openCommitments.filter(
    (c) => c.due_date && new Date(c.due_date) < new Date(now)
  );
  const completedCommitments = commitments.filter((c) => c.status === "completed");

  const commitmentContext = `
Open commitments:
${openCommitments.map((c) => `- [${c.owner === "user" ? "YOU" : "THEY"}] ${c.description}${c.due_date ? ` (due: ${c.due_date})` : ""}`).join("\n") || "None"}

Potentially overdue (due date passed, no completion recorded):
${overdueCommitments.map((c) => `- [${c.owner === "user" ? "YOU" : "THEY"}] ${c.description} (was due: ${c.due_date})`).join("\n") || "None"}

Completed commitments:
${completedCommitments.map((c) => `- [${c.owner === "user" ? "YOU" : "THEY"}] ${c.description}`).join("\n") || "None"}
`;

  // Build preferences context
  const prefContext = preferences.length > 0
    ? preferences.map((p) => `- ${p.preference_value}`).join("\n")
    : hindsightPrefMemories.length > 0
    ? hindsightPrefMemories.map((m) => `- ${m}`).join("\n")
    : "No specific preferences learned yet.";

  const prompt = `You are an AI meeting preparation assistant with persistent memory. Create a personalized meeting preparation brief.

CURRENT DATE: ${now}

CONTACT:
Name: ${contact.name}
Role: ${contact.role || "Unknown"}
Company: ${contact.company || "Unknown"}
Relationship: ${contact.relationship_type}
${contact.notes ? `Notes: ${contact.notes}` : ""}

MEMORIES RECALLED FROM HINDSIGHT (persistent agent memory):
${memoryContext}

PAST MEETINGS FROM DATABASE:
${meetingContext || "No meetings recorded."}

COMMITMENTS STATUS:
${commitmentContext}

USER PREFERENCES (learned over time):
${prefContext}

Generate a meeting preparation brief. Return ONLY valid JSON (no markdown, no code fences):
{
  "relationshipContext": "A short summary of the relationship and history with this person",
  "recentDiscussions": ["important recent topics discussed"],
  "importantDecisions": ["decisions that should be remembered"],
  "yourCommitments": ["things the user promised to do, with due dates if known"],
  "theirCommitments": ["things the contact promised to do, with due dates if known"],
  "missedFollowUps": ["potentially overdue items — use careful wording like 'Potentially overdue' or 'Appears unresolved — no completion recorded'"],
  "openQuestions": ["things that still need clarification"],
  "suggestedTalkingPoints": ["specific questions or subjects worth discussing, based on memory"],
  "suggestedAgenda": ["concise agenda items for the upcoming meeting"],
  "memoryInsights": ["important information recalled from older interactions that may otherwise be forgotten"]
}

CRITICAL RULES:
- NEVER invent meetings, commitments, dates, promises, completed work, or facts about contacts.
- When information is unavailable, say "No evidence found."
- For overdue items, use careful wording: "Potentially overdue" or "Appears unresolved — no completion recorded."
- Do NOT claim something was missed if there is evidence it was completed.
- Distinguish between known information, potential inference, and suggested questions.
- Use the recalled Hindsight memories as the PRIMARY source of context — do not just repeat the meeting list.
- Apply the user's preferences to the briefing format (e.g., if they prefer concise briefs with action items first).
- The "memoryInsights" section should highlight things recalled from Hindsight that would be easy to forget.
- Be specific and reference actual details from the memories and meetings.`;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${xaiKey}`,
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: "You are a precise meeting preparation assistant that returns only valid JSON. You use persistent memory to create contextual briefings." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  return {
    relationshipContext: parsed.relationshipContext ?? "",
    recentDiscussions: Array.isArray(parsed.recentDiscussions) ? parsed.recentDiscussions : [],
    importantDecisions: Array.isArray(parsed.importantDecisions) ? parsed.importantDecisions : [],
    yourCommitments: Array.isArray(parsed.yourCommitments) ? parsed.yourCommitments : [],
    theirCommitments: Array.isArray(parsed.theirCommitments) ? parsed.theirCommitments : [],
    missedFollowUps: Array.isArray(parsed.missedFollowUps) ? parsed.missedFollowUps : [],
    openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
    suggestedTalkingPoints: Array.isArray(parsed.suggestedTalkingPoints) ? parsed.suggestedTalkingPoints : [],
    suggestedAgenda: Array.isArray(parsed.suggestedAgenda) ? parsed.suggestedAgenda : [],
    memoryInsights: Array.isArray(parsed.memoryInsights) ? parsed.memoryInsights : [],
    metadata: {
      memoriesRecalled: hindsightMemories.length,
      preferencesApplied: preferences.length + hindsightPrefMemories.length,
      source: hindsightMemories.length > 0 ? "hindsight" : "fallback",
    },
  };
}

// Fallback briefing when Hindsight is not available — uses DB data only
function generateFallbackBriefing(
  contact: Contact,
  meetings: Meeting[],
  commitments: Commitment[],
  preferences: Preference[]
): Briefing {
  const now = new Date();
  const openCommitments = commitments.filter((c) => c.status === "open");
  const overdueCommitments = openCommitments.filter(
    (c) => c.due_date && new Date(c.due_date) < now
  );
  const userOpen = openCommitments.filter((c) => c.owner === "user");
  const contactOpen = openCommitments.filter((c) => c.owner === "contact");

  const recentTopics = meetings
    .flatMap((m) => m.topics)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5);

  const decisions = meetings.flatMap((m) => m.decisions);
  const openQuestions = meetings.flatMap((m) => m.open_questions);
  const importantFacts = meetings.flatMap((m) => m.important_facts);

  return {
    relationshipContext: `You have had ${meetings.length} interaction${meetings.length !== 1 ? "s" : ""} with ${contact.name}${contact.role ? `, ${contact.role} at ${contact.company || "their company"}` : ""}. Your relationship is categorized as "${contact.relationship_type}."${contact.notes ? ` ${contact.notes}` : ""}`,
    recentDiscussions: recentTopics,
    importantDecisions: decisions,
    yourCommitments: userOpen.map((c) => `${c.description}${c.due_date ? ` (due: ${c.due_date})` : ""}`),
    theirCommitments: contactOpen.map((c) => `${c.description}${c.due_date ? ` (due: ${c.due_date})` : ""}`),
    missedFollowUps: overdueCommitments.map((c) =>
      `Potentially overdue — no completion recorded: ${c.description} (was due ${c.due_date}). [${c.owner === "user" ? "You" : "They"} promised]`
    ),
    openQuestions: openQuestions.length > 0 ? openQuestions : ["No open questions recorded."],
    suggestedTalkingPoints: [
      ...overdueCommitments.map((c) => `What is the status of: ${c.description}?`),
      ...openQuestions.slice(0, 3),
    ].slice(0, 5),
    suggestedAgenda: [
      ...recentTopics.slice(0, 2),
      ...overdueCommitments.map((c) => `Follow up: ${c.description}`).slice(0, 2),
      "Review open action items",
    ].slice(0, 5),
    memoryInsights: importantFacts.length > 0
      ? importantFacts
      : ["No specific memory insights available in fallback mode. Connect Hindsight for full memory recall."],
    metadata: {
      memoriesRecalled: 0,
      preferencesApplied: preferences.length,
      source: "fallback",
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { contactId } = await req.json();

    if (!contactId) {
      return new Response(
        JSON.stringify({ error: "contactId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user ID from the request JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load contact, meetings, commitments, preferences
    const { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return new Response(
        JSON.stringify({ error: "Contact not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: meetings } = await supabase
      .from("meetings")
      .select("*")
      .eq("contact_id", contactId)
      .order("meeting_date", { ascending: false });

    const { data: commitments } = await supabase
      .from("commitments")
      .select("*")
      .eq("contact_id", contactId)
      .order("due_date", { ascending: true, nullsFirst: false });

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id);

    // Step 1: Recall from Hindsight
    const { memories: hindsightMemories, error: hindsightErr } = await recallFromHindsight(
      user.id,
      contact.name
    );

    const { memories: hindsightPrefMemories } = await recallPreferencesFromHindsight(user.id);

    // Step 2: Generate briefing with Grok
    let briefing: Briefing;

    try {
      briefing = await generateBriefingWithGrok(
        contact as Contact,
        (meetings ?? []) as Meeting[],
        (commitments ?? []) as Commitment[],
        hindsightMemories,
        (preferences ?? []) as Preference[],
        hindsightPrefMemories
      );

      // If Hindsight recalled memories but Grok didn't use them, add metadata
      if (hindsightMemories.length > 0 && briefing.memoryInsights.length === 0) {
        briefing.memoryInsights = hindsightMemories.slice(0, 3);
      }
    } catch (err) {
      // If Grok fails, use fallback briefing
      briefing = generateFallbackBriefing(
        contact as Contact,
        (meetings ?? []) as Meeting[],
        (commitments ?? []) as Commitment[],
        (preferences ?? []) as Preference[]
      );
      briefing.metadata.source = "fallback";
    }

    return new Response(
      JSON.stringify({ briefing }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
