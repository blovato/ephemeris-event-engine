export const AspectDegrees = {
  conjunction: 0, // Changed to lowercase
  opposition: 180, // Changed to lowercase
  trine: 120,    // Changed to lowercase
  square: 90,    // Changed to lowercase
  sextile: 60,   // Changed to lowercase
};

/**
 * Normalizes a degree value to be within the 0-360 range.
 * @param {number} degree The degree value.
 * @returns {number} The normalized degree.
 */
export function normalizeDegree(degree) {
  let normalized = degree % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculates the difference between two longitudes, considering the circular nature of the zodiac.
 * The result will be between -180 and 180 degrees.
 * @param {number} lon1 Longitude of the first celestial body.
 * @param {number} lon2 Longitude of the second celestial body.
 * @returns {number} The angular difference.
 */
export function getAngularDifference(lon1, lon2) {
  let diff = lon1 - lon2;
  if (diff > 180) {
    diff -= 360;
  }
  if (diff < -180) {
    diff += 360;
  }
  return diff;
}