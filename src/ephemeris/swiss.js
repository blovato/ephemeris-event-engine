import SwissEph from 'swisseph-wasm'; // Default import of the class
import { PlanetEnum } from "../types/planets.js";

let swissephInstance = null; // To hold the initialized swisseph-wasm instance

// Declare variables for planet constants and flags
let SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SE_CHIRON, SE_CERES,
    SE_JUNO, SE_VESTA, SE_PALLAS;

let SEFLG_SPEED, SEFLG_SWIEPH, SEFLG_ICRS, SEFLG_TRUEPOS;
let FLAGS;

const PLANET_MAP = {}; // Initialize as empty, will be populated inside initializeSwissEphemeris

/**
 * @typedef {object} PlanetPositionData
 * @property {number} longitude
 * @property {number} latitude
 * @property {number} distance // in AU
 * @property {number} speedLongitude // in degrees per day
 * @property {number} speedLatitude
 * @property {number} speedDistance
 */

/**
 * Calculates the geocentric ecliptic longitude of a celestial body at a given UTC timestamp.
 * This function must only be called AFTER initializeSwissEphemeris has resolved.
 * @param {PlanetEnum} planet The planet for which to calculate the position.
 * @param {string} timestamp The UTC timestamp (ISO 8601 string).
 * @returns {Promise<PlanetPositionData>} The longitude in degrees (0-360) and other position data.
 * @throws Error if the planet is not supported or calculation fails.
 */
export async function getPlanetPosition(planet, timestamp) {
  if (!swissephInstance) {
    throw new Error("Swiss Ephemeris module not initialized. Call initializeSwissEphemeris() first.");
  }

  const planetId = PLANET_MAP[planet];
  if (planetId === undefined) {
    throw new Error(`Unsupported planet: ${planet}`);
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  // Convert UTC date to Julian day
  // Use swissephInstance.julday as per example
  const jd_utc = swissephInstance.julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1, // Month is 1-indexed for swisseph
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600, // Hour is decimal
    swissephInstance.SE_GREG_CAL // Use Gregorian Calendar flag
  );


  // Use swissephInstance.calc_ut as per example
  const result = swissephInstance.calc_ut(jd_utc, planetId, FLAGS);

  if (result.return < 0) { // Check result.return if available, or error handling based on example
    throw new Error(
      `Swiss Ephemeris calculation failed for ${planet} at ${timestamp}: ${result.err}`
    );
  }

  // The result object structure from swisseph-wasm might be slightly different.
  // The example shows sunPos is an array. Let's adapt to that.
  let longitude = result[0]; // Assuming longitude is the first element
  let latitude = result[1];
  let distance = result[2];
  // Speed values might not be directly available in calc_ut result, or need specific flags
  let speedLongitude = 0; // Placeholder
  let speedLatitude = 0; // Placeholder
  let speedDistance = 0; // Placeholder


  // Handle South Node: It's always 180 degrees opposite the True North Node
  if (planet === PlanetEnum.SouthNode) {
    longitude = (longitude + 180) % 360;
  }

  return {
    longitude: longitude,
    latitude: latitude,
    distance: distance,
    speedLongitude: speedLongitude,
    speedLatitude: speedLatitude,
    speedDistance: speedDistance,
  };
}

/**
 * Ensures that the swisseph-wasm module is loaded and initialized.
 * This function should ideally be called once at application startup.
 */
export async function initializeSwissEphemeris() {
  try {
    // Instantiate the SwissEph class from swisseph-wasm
    swissephInstance = new SwissEph();
    await swissephInstance.initSwissEph(); // Call the async instance method

    // Assign constants from the initialized swissephInstance
    SE_SUN = swissephInstance.SE_SUN;
    SE_MOON = swissephInstance.SE_MOON;
    SE_MERCURY = swissephInstance.SE_MERCURY;
    SE_VENUS = swissephInstance.SE_VENUS;
    SE_MARS = swissephInstance.SE_MARS;
    SE_JUPITER = swissephInstance.SE_JUPITER;
    SE_SATURN = swissephInstance.SE_SATURN;
    SE_URANUS = swissephInstance.SE_URANUS;
    SE_NEPTUNE = swissephInstance.SE_NEPTUNE;
    SE_PLUTO = swissephInstance.SE_PLUTO;
    SE_TRUE_NODE = swissephInstance.SE_TRUE_NODE;
    SE_CHIRON = swissephInstance.SE_CHIRON; // Assuming these are directly on the instance as well
    SE_CERES = swissephInstance.SE_CERES;
    SE_JUNO = swissephInstance.SE_JUNO;
    SE_VESTA = swissephInstance.SE_VESTA;
    SE_PALLAS = swissephInstance.SE_PALLAS;

    SEFLG_SPEED = swissephInstance.SEFLG_SPEED;
    SEFLG_SWIEPH = swissephInstance.SEFLG_SWIEPH;
    SEFLG_ICRS = swissephInstance.SEFLG_ICRS;
    SEFLG_TRUEPOS = swissephInstance.SEFLG_TRUEPOS;

    FLAGS = SEFLG_SWIEPH | SEFLG_ICRS | SEFLG_TRUEPOS;

    // Populate PLANET_MAP
    PLANET_MAP[PlanetEnum.Sun] = SE_SUN;
    PLANET_MAP[PlanetEnum.Moon] = SE_MOON;
    PLANET_MAP[PlanetEnum.Mercury] = SE_MERCURY;
    PLANET_MAP[PlanetEnum.Venus] = SE_VENUS;
    PLANET_MAP[PlanetEnum.Mars] = SE_MARS;
    PLANET_MAP[PlanetEnum.Jupiter] = SE_JUPITER;
    PLANET_MAP[PlanetEnum.Saturn] = SE_SATURN;
    PLANET_MAP[PlanetEnum.Uranus] = SE_URANUS;
    PLANET_MAP[PlanetEnum.Neptune] = SE_NEPTUNE;
    PLANET_MAP[PlanetEnum.Pluto] = SE_PLUTO;
    PLANET_MAP[PlanetEnum.NorthNode] = SE_TRUE_NODE;
    PLANET_MAP[PlanetEnum.SouthNode] = SE_TRUE_NODE; // Value will be adjusted in getPlanetPosition
    // Assuming EXT_PLANETS is not needed, constants are direct
    PLANET_MAP[PlanetEnum.Chiron] = SE_CHIRON;
    PLANET_MAP[PlanetEnum.Ceres] = SE_CERES;
    PLANET_MAP[PlanetEnum.Juno] = SE_JUNO;
    PLANET_MAP[PlanetEnum.Vesta] = SE_VESTA;
    PLANET_MAP[PlanetEnum.Pallas] = SE_PALLAS;

    console.log("Swiss Ephemeris (swisseph-wasm) module loaded and initialized.");

    // You might want to add a test calculation here to ensure library is working correctly
    // For example, get Sun's position for a fixed date.
    const testDate = "2000-01-01T12:00:00Z";
    const sunPos = await getPlanetPosition(PlanetEnum.Sun, testDate);
    console.log(
      `Test Swiss Ephemeris calculation for Sun on ${testDate}: ${sunPos.longitude.toFixed(
        2
      )}°`
    );
  } catch (error) {
    console.error("Failed to initialize Swiss Ephemeris:", error);
    throw new Error(
      "Swiss Ephemeris initialization failed. Ensure swisseph-wasm is correctly set up."
    );
  }
}