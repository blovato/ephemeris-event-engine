import { Router } from "express";
import {
  // SkyAtRequest, SkyAtResponse, PlanetPosition are for JSDoc only
} from "../types/api.js"; // Added .js
import { PlanetEnum } from "../types/planets.js";
import { getPlanetLongitudeAt } from "../ephemeris/planetLongitudeAt.js";

const router = Router();

router.post("/", async (req, res) => {
  /** @type {SkyAtRequest} */
  const { timestamp } = req.body;

  // Input validation
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return res.status(400).json({ error: "Invalid or missing timestamp" });
  }

  try {
    /** @type {PlanetPosition[]} */
    const planets = [];
    for (const planet of Object.values(PlanetEnum)) {
      const position = await getPlanetLongitudeAt(planet, timestamp);
      planets.push({
        planet: planet,
        longitude: position.longitude,
        sign: position.sign,
        degree: position.degree,
      });
    }

    /** @type {SkyAtResponse} */
    const response = { planets };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;