import { Router } from "express";
import {
  // PlanetLongitudeRequest, PlanetLongitudeResponse are for JSDoc only
} from "../types/api.js"; // Added .js
import { PlanetEnum } from "../types/planets.js";
import { getPlanetPosition } from "../ephemeris/swiss.js";

const router = Router();

router.post("/", async (req, res) => {
  /** @type {PlanetLongitudeRequest} */
  const { planet, timestamp } = req.body;

  // Input validation
  if (!planet || !(Object.values(PlanetEnum)).includes(planet)) {
    return res.status(400).json({ error: "Invalid or missing planet" });
  }
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return res.status(400).json({ error: "Invalid or missing timestamp" });
  }

  try {
    const { longitude } = await getPlanetPosition(planet, timestamp);
    /** @type {PlanetLongitudeResponse} */
    const response = { longitude };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;