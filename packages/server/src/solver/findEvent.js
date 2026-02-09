import {
  // Constraint, FindEventDirection are for JSDoc only
} from "../types/constraints.js"; // Added .js
import { checkConstraints } from "./constraints.js";

// Precision for binary search: 1 second in milliseconds
const PRECISION_MS = 1000;
// Coarse scan step: 1 day in milliseconds
const COARSE_STEP_MS = 24 * 60 * 60 * 1000;
// Fine scan step: 1 hour in milliseconds for initial binary search range
const FINE_STEP_MS = 60 * 60 * 1000;

/**
 * Finds the next or previous UTC timestamp that satisfies all given constraints.
 * Implements a coarse scan followed by a binary search refinement.
 * @param {Array<object>} constraints An array of constraints to satisfy.
 * @param {("future"|"past")} direction The direction to search ("future" or "past").
 * @param {string} startTime The UTC timestamp (ISO 8601 string).
 * @returns {Promise<string | null>} The UTC timestamp (ISO 8601 string) of the found event, or null if not found within reasonable bounds.
 */
export async function findEvent(constraints, direction, startTime) {
  let currentTime = new Date(startTime);
  if (isNaN(currentTime.getTime())) {
    throw new Error(`Invalid startTime: ${startTime}`);
  }

  // Set a reasonable search limit to prevent infinite loops
  const MAX_ITERATIONS = 365 * 10; // Search up to 10 years in the specified direction

  let coarseFoundTime = null;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (await checkConstraints(currentTime.toISOString(), constraints)) {
      coarseFoundTime = currentTime;
      break;
    }

    if (direction === "future") {
      currentTime = new Date(currentTime.getTime() + COARSE_STEP_MS);
    } else {
      currentTime = new Date(currentTime.getTime() - COARSE_STEP_MS);
    }
  }

  if (!coarseFoundTime) {
    return null; // No coarse event found
  }

  // Refine using binary search
  return await binarySearchEvent(coarseFoundTime, constraints, direction);
}

/**
 * Refines the event timestamp using binary search.
 * Searches within a small window around the coarsely found time.
 * @param {Date} coarseTime The approximate timestamp where the event was found.
 * @param {Array<object>} constraints An array of constraints.
 * @param {("future"|"past")} direction The direction of the search.
 * @returns {Promise<string | null>} The refined UTC timestamp (ISO 8601 string) or null.
 */
async function binarySearchEvent(coarseTime, constraints, direction) {
  let low;
  let high;

  if (direction === "future") {
    low = new Date(coarseTime.getTime() - FINE_STEP_MS);
    high = new Date(coarseTime.getTime() + FINE_STEP_MS);
  } else {
    low = new Date(coarseTime.getTime() - FINE_STEP_MS);
    high = new Date(coarseTime.getTime() + FINE_STEP_MS);
  }

  let foundTime = null;
  let iterations = 0;
  const MAX_BINARY_SEARCH_ITERATIONS = 100; // Limit to prevent infinite loops

  while (
    high.getTime() - low.getTime() > PRECISION_MS &&
    iterations < MAX_BINARY_SEARCH_ITERATIONS
  ) {
    const mid = new Date(Math.floor((low.getTime() + high.getTime()) / 2));

    if (await checkConstraints(mid.toISOString(), constraints)) {
      foundTime = mid;
      if (direction === "future") {
        high = mid; // Try to find an earlier time in the future
      } else {
        low = mid; // Try to find a later time in the past
      }
    } else {
      if (direction === "future") {
        low = mid; // Event is later
      } else {
        high = mid; // Event is earlier
      }
    }
    iterations++;
  }

  // After binary search, check the 'foundTime' and its immediate vicinity for the closest match
  // The binary search aims to converge on the *start* of the period satisfying the constraints
  // For 'future', we want the earliest valid timestamp. For 'past', the latest date satisfying.

  // We perform a final linear scan in the precision range around foundTime
  // This is because checkConstraints might evaluate to true for a duration, not a single point.
  if (foundTime) {
    const scanStart = new Date(foundTime.getTime() - 2 * PRECISION_MS);
    const scanEnd = new Date(foundTime.getTime() + 2 * PRECISION_MS);
    let bestMatch = null;

    for (
      let t = scanStart.getTime();
      t <= scanEnd.getTime();
      t += PRECISION_MS
    ) {
      const candidateTime = new Date(t);
      if (await checkConstraints(candidateTime.toISOString(), constraints)) {
        if (direction === "future") {
          // For future, we want the earliest valid timestamp
          if (!bestMatch || candidateTime.getTime() < bestMatch.getTime()) {
            bestMatch = candidateTime;
          }
        } else {
          // For past, we want the latest valid timestamp
          if (!bestMatch || candidateTime.getTime() > bestMatch.getTime()) {
            bestMatch = candidateTime;
          }
        }
      }
    }
    return bestMatch ? bestMatch.toISOString() : null;
  }

  return null;
}