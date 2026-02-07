import { Router } from "express";
import {
  // FindEventRequest, FindEventResponse are for JSDoc only
} from "../types/api.js"; // Added .js
import { findEvent } from "../solver/findEvent.js";
import {
  // AspectConstraint, AtDegreeConstraint, InSignConstraint are for JSDoc only
  FindEventDirectionEnum,
} from "../types/constraints.js";
import { PlanetEnum, ZodiacSignEnum } from "../types/planets.js";

const router = Router();

router.post("/", async (req, res) => {
  /** @type {FindEventRequest} */
  const { constraints, direction, startTime } = req.body;

  // Input validation
  if (!constraints || !Array.isArray(constraints) || constraints.length === 0) {
    return res.status(400).json({ error: "Constraints are required" });
  }
  if (
    !direction ||
    !(Object.values(FindEventDirectionEnum)).includes(direction)
  ) {
    return res.status(400).json({ error: "Invalid or missing direction" });
  }
  if (!startTime || isNaN(new Date(startTime).getTime())) {
    return res.status(400).json({ error: "Invalid or missing startTime" });
  }

  // Validate each constraint
  for (const constraint of constraints) {
    switch (constraint.kind) {
      case "aspect":
        /** @type {AspectConstraint} */
        const aspectConstraint = constraint;
        if (
          !aspectConstraint.planetA ||
          !(Object.values(PlanetEnum)).includes(
            aspectConstraint.planetA
          ) ||
          !aspectConstraint.planetB ||
          !(Object.values(PlanetEnum)).includes(
            aspectConstraint.planetB
          ) ||
          !aspectConstraint.aspect ||
          ![
            "conjunction",
            "opposition",
            "trine",
            "square",
            "sextile",
          ].includes(aspectConstraint.aspect) ||
          aspectConstraint.orb === undefined ||
          aspectConstraint.orb < 0
        ) {
          return res.status(400).json({ error: "Invalid aspect constraint" });
        }
        break;
      case "in_sign":
        /** @type {InSignConstraint} */
        const inSignConstraint = constraint;
        if (
          !inSignConstraint.planet ||
          !(Object.values(PlanetEnum)).includes(
            inSignConstraint.planet
          ) ||
          !inSignConstraint.sign ||
          !(Object.values(ZodiacSignEnum)).includes(
            inSignConstraint.sign
          )
        ) {
          return res.status(400).json({ error: "Invalid in_sign constraint" });
        }
        break;
      case "at_degree":
        /** @type {AtDegreeConstraint} */
        const atDegreeConstraint = constraint;
        if (
          !atDegreeConstraint.planet ||
          !(Object.values(PlanetEnum)).includes(
            atDegreeConstraint.planet
          ) ||
          atDegreeConstraint.degree === undefined ||
          atDegreeConstraint.degree < 0 ||
          atDegreeConstraint.degree >= 360 ||
          atDegreeConstraint.orb === undefined ||
          atDegreeConstraint.orb < 0
        ) {
          return res.status(400).json({ error: "Invalid at_degree constraint" });
        }
        break;
      default:
        return res.status(400).json({ error: `Unknown constraint kind: ${constraint.kind}` });
    }
  }

  try {
    const timestamp = await findEvent(constraints, direction, startTime);
    if (timestamp) {
      /** @type {FindEventResponse} */
      const response = { timestamp };
      res.json(response);
    } else {
      res.status(404).json({ error: "Event not found within search bounds" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;