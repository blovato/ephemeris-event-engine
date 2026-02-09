import { PlanetEnum, ZodiacSignEnum } from "../types/planets.js"; // Added .js
import { getPlanetPosition } from "./swiss.js"; // Added .js

/**
 * @typedef {object} PlanetCoordinates
 * @property {number} longitude
 * @property {ZodiacSignEnum} sign
 * @property {number} degree // 0-29.99... within sign
 */

const ZODIAC_SIGNS = [
  ZodiacSignEnum.Aries,
  ZodiacSignEnum.Taurus,
  ZodiacSignEnum.Gemini,
  ZodiacSignEnum.Cancer,
  ZodiacSignEnum.Leo,
  ZodiacSignEnum.Virgo,
  ZodiacSignEnum.Libra,
  ZodiacSignEnum.Scorpio,
  ZodiacSignEnum.Sagittarius,
  ZodiacSignEnum.Capricorn,
  ZodiacSignEnum.Aquarius,
  ZodiacSignEnum.Pisces,
];

/**
 * Calculates the geocentric ecliptic longitude of a planet at a given UTC timestamp,
 * and converts it into zodiac sign and degree within that sign.
 * @param {PlanetEnum} planet The planet for which to calculate the position.
 * @param {string} timestamp The UTC timestamp (ISO 8601 string).
 * @returns {Promise<PlanetCoordinates>} An object containing longitude, zodiac sign, and degree within the sign.
 */
export async function getPlanetLongitudeAt(planet, timestamp) {
  const { longitude } = await getPlanetPosition(planet, timestamp);

  // Determine zodiac sign and degree within the sign
  const signIndex = Math.floor(longitude / 30);
  const sign = ZODIAC_SIGNS[signIndex];
  const degree = longitude % 30;

  return { longitude, sign, degree };
}