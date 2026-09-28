import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractResult {
  summary: string;
  topics: string[];
  decisions: string[];
  userCommitments: string[];
  contactCommitments: string[];
  deadlines: { description: string; date: string; owner: string }[];
  followUps: string[];
  openQuestions: string[];
  importantFacts: string[];
}

async function extractWithGrok(notes: string, contactName: string): Promise<ExtractResult> {
  const xaiKey = Deno.env.get("XAI_API_KEY");
  if (!xaiKey) {
    throw new Error("XAI_API_KEY not configured");
  }

  const prompt = `You are a meeting analysis assistant. Analyze the following meeting notes and extract structured information.

Meeting notes:
"""
${notes}
"""

The meeting was with ${contactName}.

Extract the following and return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "A 1-2 sentence summary of what was discussed",
  "topics": ["topic1", "topic2"],
  "decisions": ["decision1"],
  "userCommitments": ["things the user promised to do"],
  "contactCommitments": ["things the contact promised to do"],
  "deadlines": [{"description": "what is due", "date": "YYYY-MM-DD", "owner": "user|contact"}],
  "followUps": ["follow-up items"],
  "openQuestions": ["unresolved questions"],
  "importantFacts": ["important context facts about the relationship or project"]
}

Rules:
- Only include fields that have content. Use empty arrays if nothing found.
- For deadlines, extract explicit dates mentioned. If a relative date like "by Friday" is mentioned, estimate the date.
- Distinguish between what the USER promised (userCommitments) and what the CONTACT promised (contactCommitments).
- Do not invent information. If something is unclear, leave it out.
- Be concise and specific.`;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${xaiKey}`,
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: "You are a precise meeting analysis assistant that returns only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  // Parse JSON from response (handle potential markdown fences)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  // Validate and normalize
  return {
    summary: parsed.summary ?? "",
    topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    userCommitments: Array.isArray(parsed.userCommitments) ? parsed.userCommitments : [],
    contactCommitments: Array.isArray(parsed.contactCommitments) ? parsed.contactCommitments : [],
    deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
    followUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
    openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
    importantFacts: Array.isArray(parsed.importantFacts) ? parsed.importantFacts : [],
  };
}

async function retainInHindsight(
  userId: string,
  contactName: string,
  meetingTitle: string,
  meetingDate: string,
  extraction: ExtractResult,
  rawNotes: string
): Promise<void> {
  const hindsightKey = Deno.env.get("HINDSIGHT_API_KEY");
  const hindsightUrl = Deno.env.get("HINDSIGHT_BASE_URL");

  if (!hindsightKey || !hindsightUrl) {
    throw new Error("Hindsight not configured");
  }

  const bankId = `user-${userId}`;
  const memoryContent = `Meeting: "${meetingTitle}" with ${contactName} on ${meetingDate}.
Summary: ${extraction.summary}
Topics: ${extraction.topics.join(", ")}
Decisions: ${extraction.decisions.join("; ")}
User commitments: ${extraction.userCommitments.join("; ")}
Contact commitments: ${extraction.contactCommitments.join("; ")}
Deadlines: ${extraction.deadlines.map(d => `${d.description} by ${d.date} (${d.owner})`).join("; ")}
Open questions: ${extraction.openQuestions.join("; ")}
Important facts: ${extraction.importantFacts.join("; ")}
Raw notes: ${rawNotes}`;

  // Create bank if it doesn't exist, then retain
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
    // Bank may already exist
  }

  const response = await fetch(`${hindsightUrl}/v1/default/banks/${bankId}/retain`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hindsightKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ content: memoryContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Hindsight retain error: ${response.status} ${errText}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { meetingId, notes, contactName } = await req.json();

    if (!meetingId || !notes) {
      return new Response(
        JSON.stringify({ error: "meetingId and notes are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get meeting to retrieve user_id and date
    const { data: meeting, error: meetingErr } = await supabase
      .from("meetings")
      .select("*, contact:contacts(name)")
      .eq("id", meetingId)
      .single();

    if (meetingErr || !meeting) {
      return new Response(
        JSON.stringify({ error: "Meeting not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cName = contactName || meeting.contact?.name || "the contact";

    // Step 1: Extract with Grok
    let extraction: ExtractResult;
    let extractionError: string | null = null;

    try {
      extraction = await extractWithGrok(notes, cName);
    } catch (err) {
      extractionError = err.message;
      // Return early with error — meeting is saved but extraction failed
      await supabase
        .from("meetings")
        .update({ extraction_status: "failed" })
        .eq("id", meetingId);

      return new Response(
        JSON.stringify({
          error: `AI extraction failed: ${extractionError}`,
          extraction: null,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Save extracted data to meeting
    await supabase
      .from("meetings")
      .update({
        summary: extraction.summary,
        topics: extraction.topics,
        decisions: extraction.decisions,
        user_commitments: extraction.userCommitments,
        contact_commitments: extraction.contactCommitments,
        deadlines: extraction.deadlines,
        follow_ups: extraction.followUps,
        open_questions: extraction.openQuestions,
        important_facts: extraction.importantFacts,
        extraction_status: "completed",
      })
      .eq("id", meetingId);

    // Step 3: Create commitments from extracted data
    const commitmentsToCreate: Array<{
      contact_id: string;
      meeting_id: string;
      description: string;
      owner: "user" | "contact";
      due_date: string | null;
      source: string;
    }> = [];

    for (const c of extraction.userCommitments) {
      const matchingDeadline = extraction.deadlines.find(
        (d) => d.owner === "user" && c.toLowerCase().includes(d.description.toLowerCase().split(" ").slice(0, 3).join(" "))
      );
      commitmentsToCreate.push({
        contact_id: meeting.contact_id,
        meeting_id: meetingId,
        description: c,
        owner: "user",
        due_date: matchingDeadline?.date ?? null,
        source: "ai_extracted",
      });
    }

    for (const c of extraction.contactCommitments) {
      const matchingDeadline = extraction.deadlines.find(
        (d) => d.owner === "contact" && c.toLowerCase().includes(d.description.toLowerCase().split(" ").slice(0, 3).join(" "))
      );
      commitmentsToCreate.push({
        contact_id: meeting.contact_id,
        meeting_id: meetingId,
        description: c,
        owner: "contact",
        due_date: matchingDeadline?.date ?? null,
        source: "ai_extracted",
      });
    }

    // Also create commitments from deadlines that don't match existing ones
    for (const d of extraction.deadlines) {
      const exists = commitmentsToCreate.some(
        (c) => c.due_date === d.date && c.description.toLowerCase().includes(d.description.toLowerCase().split(" ").slice(0, 3).join(" "))
      );
      if (!exists) {
        commitmentsToCreate.push({
          contact_id: meeting.contact_id,
          meeting_id: meetingId,
          description: d.description,
          owner: (d.owner as "user" | "contact") ?? "user",
          due_date: d.date,
          source: "ai_extracted",
        });
      }
    }

    if (commitmentsToCreate.length > 0) {
      await supabase.from("commitments").insert(commitmentsToCreate);
    }

    // Step 4: Retain in Hindsight (best-effort, don't fail if it errors)
    let hindsightError: string | null = null;
    try {
      await retainInHindsight(
        meeting.user_id,
        cName,
        meeting.title,
        meeting.meeting_date,
        extraction,
        notes
      );
    } catch (err) {
      hindsightError = err.message;
    }

    return new Response(
      JSON.stringify({
        extraction,
        hindsightRetained: hindsightError === null,
        hindsightError,
        commitmentsCreated: commitmentsToCreate.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
