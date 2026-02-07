import {
  AspectDegrees,
  getAngularDifference,
} from "./aspects.js";
import { getPlanetLongitudeAt } from "../ephemeris/planetLongitudeAt.js";
import { getPlanetPosition } from "../ephemeris/swiss.js";
import { PlanetEnum, ZodiacSignEnum } from "../types/planets.js";


/**
 * Checks if a given timestamp satisfies all provided constraints.
 * @param {string} timestamp The UTC timestamp to check.
 * @param {Array<object>} constraints An array of constraints to satisfy.
 * @returns {Promise<boolean>} True if all constraints are met, false otherwise.
 */
export async function checkConstraints(timestamp, constraints) {
  for (const constraint of constraints) {
    if (!(await checkConstraint(timestamp, constraint))) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a single constraint is satisfied at a given timestamp.
 * @param {string} timestamp The UTC timestamp to check.
 * @param {object} constraint The constraint to check.
 * @returns {Promise<boolean>} True if the constraint is met, false otherwise.
 */
export async function checkConstraint(timestamp, constraint) {
  switch (constraint.kind) {
    case "aspect":
      return await checkAspectConstraint(timestamp, constraint);
    case "in_sign":
      return await checkInSignConstraint(timestamp, constraint);
    case "at_degree":
      return await checkAtDegreeConstraint(timestamp, constraint);
    default:
      // Should not happen with type checking, but good for robustness
      console.warn(`Unknown constraint kind: ${constraint.kind}`);
      return false;
  }
}

/**
 * Checks if an aspect constraint is satisfied at a given timestamp.
 * @param {string} timestamp The UTC timestamp.
 * @param {object} constraint The aspect constraint.
 * @returns {Promise<boolean>} True if the aspect is within the orb, false otherwise.
 */
async function checkAspectConstraint(timestamp, constraint) {
  const posA = await getPlanetPosition(constraint.planetA, timestamp);
  const posB = await getPlanetPosition(constraint.planetB, timestamp);

  const aspectDegree = AspectDegrees[constraint.aspect];
  if (aspectDegree === undefined) {
    console.warn(`Unsupported aspect: ${constraint.aspect}`);
    return false;
  }

  const angularDifference = Math.abs(getAngularDifference(posA.longitude, posB.longitude));
  // Check both direct and inverse aspect (e.g., 0 and 360 for conjunction, 180 and -180 for opposition)
  const diffFromAspect = Math.min(
    Math.abs(angularDifference - aspectDegree),
    Math.abs(angularDifference - (360 - aspectDegree))
  );


  return diffFromAspect <= constraint.orb;
}

/**
 * Checks if an "in sign" constraint is satisfied at a given timestamp.
 * @param {string} timestamp The UTC timestamp.
 * @param {object} constraint The "in sign" constraint.
 * @returns {Promise<boolean>} True if the planet is in the specified sign, false otherwise.
 */
async function checkInSignConstraint(timestamp, constraint) {
  const { sign } = await getPlanetLongitudeAt(constraint.planet, timestamp);
  return sign === constraint.sign;
}

/**
 * Checks if an "at degree" constraint is satisfied at a given timestamp.
 * @param {string} timestamp The UTC timestamp.
 * @param {object} constraint The "at degree" constraint.
 * @returns {Promise<boolean>} True if the planet is at the specified degree within the orb, false otherwise.
 */
async function checkAtDegreeConstraint(timestamp, constraint) {
  const { longitude } = await getPlanetLongitudeAt(constraint.planet, timestamp);
  const diff = Math.abs(longitude - constraint.degree);
  // Account for circular nature, e.g., 359 degrees and 0 degrees are close
  const actualDiff = Math.min(diff, Math.abs(diff - 360));
  return actualDiff <= constraint.orb;
}