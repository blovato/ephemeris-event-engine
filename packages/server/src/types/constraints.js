// Removed: const { PlanetEnum, ZodiacSignEnum } = require("./planets"); // Not needed for runtime, only JSDoc

/**
 * @typedef {"conjunction" | "opposition" | "trine" | "square" | "sextile"} Aspect
 */

export const AspectEnum = { // Changed to export const
  Conjunction: "conjunction",
  Opposition: "opposition",
  Trine: "trine",
  Square: "square",
  Sextile: "sextile",
};

/**
 * @typedef {object} AspectConstraint
 * @property {"aspect"} kind
 * @property {import("./planets").PlanetEnum} planetA // JSDoc reference
 * @property {import("./planets").PlanetEnum} planetB // JSDoc reference
 * @property {Aspect} aspect
 * @property {number} orb
 */

/**
 * @typedef {object} InSignConstraint
 * @property {"in_sign"} kind
 * @property {import("./planets").PlanetEnum} planet // JSDoc reference
 * @property {import("./planets").ZodiacSignEnum} sign // JSDoc reference
 */

/**
 * @typedef {object} AtDegreeConstraint
 * @property {"at_degree"} kind
 * @property {import("./planets").PlanetEnum} planet // JSDoc reference
 * @property {number} degree
 * @property {number} orb
 */

/**
 * @typedef {AspectConstraint | InSignConstraint | AtDegreeConstraint} Constraint
 */

/**
 * @typedef {"future" | "past"} FindEventDirection
 */

export const FindEventDirectionEnum = { // Changed to export const
  Future: "future",
  Past: "past",
};