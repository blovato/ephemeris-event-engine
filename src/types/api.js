// Removed: const { Constraint, FindEventDirection, AspectConstraint } = require("./constraints");
// Removed: const { PlanetEnum, ZodiacSignEnum } = require("./planets");

/**
 * @typedef {object} FindEventRequest
 * @property {import("./constraints").Constraint[]} constraints
 * @property {import("./constraints").FindEventDirection} direction
 * @property {string} startTime // ISO 8601 string
 */

/**
 * @typedef {object} FindEventResponse
 * @property {string} timestamp // ISO 8601 string
 */

/**
 * @typedef {object} SkyAtRequest
 * @property {string} timestamp // ISO 8601 string
 */

/**
 * @typedef {object} PlanetPosition
 * @property {import("./planets").PlanetEnum} planet
 * @property {number} longitude // 0-359.99...
 * @property {import("./planets").ZodiacSignEnum} sign
 * @property {number} degree // 0-29.99... within sign
 */

/**
 * @typedef {object} SkyAtResponse
 * @property {PlanetPosition[]} planets
 */

/**
 * @typedef {object} PlanetLongitudeRequest
 * @property {import("./planets").PlanetEnum} planet
 * @property {string} timestamp // ISO 8601 string
 */

/**
 * @typedef {object} PlanetLongitudeResponse
 * @property {number} longitude // 0-359.99...
 */

/**
 * @typedef {object} ParseQueryRequest
 * @property {string} text
 */

/**
 * @typedef {object} ParseQueryResponse
 * @property {import("./constraints").Constraint[]} constraints
 * @property {import("./constraints").FindEventDirection} [direction]
 */