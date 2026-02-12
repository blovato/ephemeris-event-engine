import Groq from "groq-sdk";
import { AspectEnum, FindEventDirectionEnum } from "../types/constraints.js";
import { PlanetEnum, ZodiacSignEnum } from "../types/planets.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set. The LLM parsing will not work.");
}

const GROQ_MODEL_NAME = process.env.GROQ_MODEL_NAME || "llama-3.3-70b-versatile"; // Default to a suitable Groq model

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// Helper to format enum values for the prompt
const formatEnumValues = (enumObj) =>
  Object.values(enumObj)
    .map((val) => `"${val}"`)
    .join(", ");

const planetEnumValues = formatEnumValues(PlanetEnum);
const aspectEnumValues = formatEnumValues(AspectEnum);
const zodiacSignEnumValues = formatEnumValues(ZodiacSignEnum);
const findEventDirectionEnumValues = formatEnumValues(FindEventDirectionEnum);

/**
 * Parses a natural language query into a structured constraint object using Groq.
 * @param {string} text The natural language query.
 * @returns {Promise<{constraints: object[], direction: string, startTime: string}>} A ParseQueryResponse object containing constraints, direction, and startTime.
 */
export async function parseQuery(text) {
  const currentISOString = new Date().toISOString();

  const PROMPT_TEMPLATE = `
You are an expert astrological event parser. Your task is to convert natural language queries about astrological events into a structured JSON object. This JSON object will be used to make API calls to an astrological event finder.

The JSON object MUST strictly adhere to the following schema for a FindEventRequest. Only output the JSON object, nothing else.

Schema Definition:
type FindEventRequest = {
  constraints: Constraint[];
  direction: FindEventDirection;
  startTime: string; // ISO 8601 string
}

type Constraint = AspectConstraint | InSignConstraint | AtDegreeConstraint;

type AspectConstraint = {
  kind: "aspect";
  planetA: PlanetEnum;
  planetB: PlanetEnum;
  aspect: AspectEnum;
  orb: number; // e.g., 1.5
}

type InSignConstraint = {
  kind: "in_sign";
  planet: PlanetEnum;
  sign: ZodiacSignEnum;
}

type AtDegreeConstraint = {
  kind: "at_degree";
  planet: PlanetEnum;
  degree: number; // Absolute zodiacal degree 0-359.99...
  orb: number; // e.g., 0.5
}

Enum Values:
PlanetEnum: ${planetEnumValues}
AspectEnum: ${aspectEnumValues}
ZodiacSignEnum: ${zodiacSignEnumValues}
FindEventDirectionEnum: ${findEventDirectionEnumValues}

Instructions:
- The \`kind\` property for each constraint is mandatory and must be one of "aspect", "in_sign", or "at_degree".
- For \`AspectConstraint\`, \`planetA\`, \`planetB\`, \`aspect\`, and \`orb\` are required. Use numerical values for \`orb\`.
- For \`InSignConstraint\`, \`planet\` and \`sign\` are required.
- For \`AtDegreeConstraint\`, \`planet\`, \`degree\` (absolute zodiacal 0-359.99), and \`orb\` are required.
- If a specific \`startTime\` is not mentioned in the query, default it to the current UTC timestamp (e.g., "${currentISOString}").
- If \`direction\` is not specified, default to "future". If phrases like "last time", "previous" are used, infer "past".
- Ensure all enum string values exactly match those provided (case-sensitive where applicable).
- Only output the JSON object. Do NOT include markdown formatting (like \`\`\`json) or any other text.

---
Query: "Find when the Sun is in Pisces next year"
Output:
{"constraints": [{"kind": "in_sign", "planet": "Sun", "sign": "Pisces"}], "direction": "future", "startTime": "2025-01-01T00:00:00Z"}
---
Query: "When was the last time Pluto was opposite Uranus, starting from today?"
Output:
{"constraints": [{"kind": "aspect", "planetA": "Pluto", "planetB": "Uranus", "aspect": "opposition", "orb": 1.0}], "direction": "past", "startTime": "${currentISOString}"}
---
Query: "When is the next time Sun conjuncts Moon in Pisces with an orb of 1.5 degrees, starting from today?"
Output:
{"constraints": [{"kind": "aspect", "planetA": "Sun", "planetB": "Moon", "aspect": "conjunction", "orb": 1.5}, {"kind": "in_sign", "planet": "Sun", "sign": "Pisces"}], "direction": "future", "startTime": "${currentISOString}"}
---
Query: "Mars at 15 degrees Libra with an orb of 0.5 degrees"
Output:
{"constraints": [{"kind": "at_degree", "planet": "Mars", "degree": 195, "orb": 0.5}], "direction": "future", "startTime": "${currentISOString}"}
---
Query: "${text}"
Output:
`;

  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured. Cannot parse query with LLM.",
    );
  }

  try {
    const fullPrompt = PROMPT_TEMPLATE.replace(/\$\{text\}/g, text).replace(
      /\$\{currentISOString\}/g,
      currentISOString,
    );

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      model: GROQ_MODEL_NAME,
      temperature: 0, // Ensure deterministic output
      // You can add other Groq specific parameters here if needed
    });

    const textOutput = chatCompletion.choices[0]?.message?.content || "";

    console.log(textOutput);

    // The model might sometimes wrap the JSON in markdown code block, remove it.
    let jsonString = textOutput.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    jsonString = jsonString.trim();

    const parsed = JSON.parse(jsonString);

    // Basic validation to ensure it matches expected top-level keys
    if (
      !parsed.constraints ||
      !Array.isArray(parsed.constraints) ||
      typeof parsed.direction !== "string" ||
      typeof parsed.startTime !== "string"
    ) {
      throw new Error(
        "LLM response did not contain expected FindEventRequest structure.",
      );
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing query with Groq LLM:", error);
    // Depending on desired behavior, you might want to re-throw,
    // return a default, or return a specific error format.
    throw new Error(`Failed to parse query with LLM: ${error.message}`);
  }
}
