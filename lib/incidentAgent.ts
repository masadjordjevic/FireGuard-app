// Advisory-only wildfire incident triage assistant. It NEVER writes to the
// database itself — it returns a structured recommendation that a human
// operator (EMERGENCY_SERVICE / VALIDATOR / ADMIN) reviews and, if they
// agree, applies through the existing PATCH /api/incidents/[id] route.
// See app/api/incidents/[id]/analyze/route.ts for the caller.
//
// Uses Groq's free-tier API (OpenAI-compatible chat completions format) so
// this doesn't require a paid LLM provider — see https://console.groq.com

export type IncidentRecommendation = {
  recommendedStatus: "REPORTED" | "VERIFIED" | "ACTIVE" | "RESOLVED";
  recommendedDangerLevel: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
  suggestedActions: string[];
};

export type IncidentAgentContext = {
  title: string;
  description: string;
  status: string;
  dangerLevel: string;
  latitude: number;
  longitude: number;
  reportedByVerified: boolean;
  confirmations: { role: string; trustLevel: number }[];
  weather: { temperatureC: number; humidityPercent: number; windSpeedKmh: number } | null;
  riskLevel: string | null;
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// Free-tier Groq model, good balance of quality/speed for a lightweight
// triage call. Override with GROQ_MODEL if you want a different one — check
// https://console.groq.com/docs/models for what's currently hosted, since
// Groq's free model lineup changes over time.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const RECOMMENDATION_TOOL = {
  type: "function",
  function: {
    name: "submit_incident_recommendation",
    description: "Submit a triage recommendation for a wildfire incident report.",
    parameters: {
      type: "object",
      properties: {
        recommendedStatus: {
          type: "string",
          enum: ["REPORTED", "VERIFIED", "ACTIVE", "RESOLVED"],
          description: "The status you recommend for this incident.",
        },
        recommendedDangerLevel: {
          type: "string",
          enum: ["LOW", "MODERATE", "HIGH", "EXTREME"],
          description: "The danger level you recommend for this incident.",
        },
        confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        rationale: {
          type: "string",
          description: "2-3 sentence explanation a human reviewer can quickly read.",
        },
        suggestedActions: {
          type: "array",
          items: { type: "string" },
          maxItems: 4,
          description:
            "Short, concrete next steps for a human operator, e.g. 'Dispatch a validator to confirm on-site'.",
        },
      },
      required: ["recommendedStatus", "recommendedDangerLevel", "confidence", "rationale", "suggestedActions"],
    },
  },
};

const SYSTEM_PROMPT = `You are a wildfire incident triage assistant inside FireGuard, a community wildfire reporting platform.

You review a single incident report plus live weather-derived fire risk data and produce a recommendation for a human operator (an emergency service worker, validator, or admin) to review. You NEVER take action yourself — your output is strictly advisory, and a human must explicitly apply any change.

Be conservative: don't recommend downgrading status or danger level unless the evidence clearly supports it, and don't recommend RESOLVED unless there is a clear indication the fire is out. When in doubt, keep the current status/danger level and explain why in your rationale.

Always respond by calling the submit_incident_recommendation tool — never respond in plain text.`;

export async function analyzeIncident(context: IncidentAgentContext): Promise<IncidentRecommendation> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Incident data:\n${JSON.stringify(context, null, 2)}` },
      ],
      tools: [RECOMMENDATION_TOOL],
      tool_choice: { type: "function", function: { name: "submit_incident_recommendation" } },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq API request failed with status ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("Groq did not return a structured recommendation");
  }

  try {
    return JSON.parse(toolCall.function.arguments) as IncidentRecommendation;
  } catch {
    throw new Error("Failed to parse Groq's recommendation as JSON");
  }
}
