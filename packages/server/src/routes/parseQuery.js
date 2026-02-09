import { Router } from "express";
import {
  // ParseQueryRequest, ParseQueryResponse are for JSDoc only
} from "../types/api.js"; // Added .js
import { parseQuery as llmParseQuery } from "../llm/parseQuery.js";

const router = Router();

router.post("/", (req, res) => {
  /** @type {ParseQueryRequest} */
  const { text } = req.body;

  // Input validation
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text query is required and must be a string" });
  }

  try {
    const { constraints, direction } = llmParseQuery(text);
    /** @type {ParseQueryResponse} */
    const response = { constraints, direction };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;