import {
  AspectEnum, // We only use AspectEnum values like "conjunction", "opposition"
  FindEventDirectionEnum,
} from "../types/constraints.js"; // Added .js
import { PlanetEnum } from "../types/planets.js"; // Added .js

/**
 * Mocks an LLM to parse a natural language query into a structured constraint object.
 * This is a placeholder and does not use an actual LLM.
 * @param {string} text The natural language query.
 * @returns {{constraints: object[], direction?: string}} A ParseQueryResponse object containing constraints and optionally a direction.
 */
export function parseQuery(text) {
  // This is a mock implementation. In a real scenario, an LLM would parse the text.
  // We'll hardcode a few examples based on the API contract example.

  const lowerText = text.toLowerCase();
  let constraints = [];
  let direction;

  if (lowerText.includes("last time pluto was opposite uranus")) {
    constraints.push({
      kind: "aspect",
      planetA: PlanetEnum.Pluto,
      planetB: PlanetEnum.Uranus,
      aspect: AspectEnum.Opposition,
      orb: 0, // Assuming 0 orb for exact aspect
    });
    direction = FindEventDirectionEnum.Past;
  } else if (
    lowerText.includes("next time sun is conjunct moon in pisces")
  ) {
    // Example for multiple constraints
    constraints.push(
      {
        kind: "aspect",
        planetA: PlanetEnum.Sun,
        planetB: PlanetEnum.Moon,
        aspect: AspectEnum.Conjunction,
        orb: 0,
      },
      {
        kind: "in_sign",
        planet: PlanetEnum.Sun,
        sign: "Pisces",
      }
    );
    direction = FindEventDirectionEnum.Future;
  } else {
    // Default or example for demonstration if no match
    constraints.push({
      kind: "aspect",
      planetA: PlanetEnum.Sun,
      planetB: PlanetEnum.Moon,
      aspect: AspectEnum.Conjunction,
      orb: 0,
    });
    direction = FindEventDirectionEnum.Future;
  }

  return { constraints, direction };
}